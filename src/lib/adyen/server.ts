/**
 * Server-only utilities for Adyen API calls from Next.js Route Handlers.
 * Do NOT import this file in client components — it uses server-side modules.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class AdyenRouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdyenRouteError";
  }
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export interface AdyenCreds {
  apiKey: string;
  merchantAccount: string;
  environment: "test" | "live";
}

/**
 * Authenticate the current Supabase session and load the caller's Adyen
 * credentials from `adyen_configs`.
 *
 * Falls back to ADYEN_DEFAULT_API_KEY / ADYEN_DEFAULT_CLIENT_KEY /
 * ADYEN_DEFAULT_MERCHANT_ACCOUNT env vars when no user row exists (useful
 * for shared demo deployments).
 *
 * Throws AdyenRouteError on auth failure or missing config.
 */
export async function requireAdyenCreds(): Promise<AdyenCreds> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AdyenRouteError(401, "UNAUTHORIZED", "Not authenticated.");
  }

  const { data, error } = await supabase
    .from("adyen_configs")
    .select("api_key, client_key, merchant_account")
    .eq("user_id", user.id)
    .single();

  // PGRST116 = no rows returned — not an error, just no config saved yet
  if (error && error.code !== "PGRST116") {
    throw new AdyenRouteError(500, "INTERNAL_ERROR", "Something went wrong.");
  }

  const apiKey = (data?.api_key?.trim() || process.env.ADYEN_DEFAULT_API_KEY || "").trim();
  const clientKey = (data?.client_key?.trim() || process.env.ADYEN_DEFAULT_CLIENT_KEY || "").trim();
  const merchantAccount = (
    data?.merchant_account?.trim() ||
    process.env.ADYEN_DEFAULT_MERCHANT_ACCOUNT ||
    ""
  ).trim();

  if (!apiKey || !merchantAccount) {
    throw new AdyenRouteError(
      404,
      "CONFIG_MISSING",
      "No Adyen configuration found. Please complete the setup step first.",
    );
  }

  const environment = clientKey.startsWith("live_") ? "live" : "test";
  return { apiKey, merchantAccount, environment };
}

// ---------------------------------------------------------------------------
// Checkout API (v71)
// ---------------------------------------------------------------------------

function checkoutBase(environment: string): string {
  return environment === "live"
    ? "https://checkout-live.adyen.com/v71"
    : "https://checkout-test.adyen.com/v71";
}

/**
 * POST to the Adyen Checkout API (/v71/...).
 * Throws AdyenRouteError on non-2xx responses.
 */
export async function adyenCheckout<T>(
  creds: AdyenCreds,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${checkoutBase(creds.environment)}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-API-key": creds.apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Log the full Adyen error so it appears in Railway / server logs
    console.error(`[adyen] ${path} → ${res.status}`, JSON.stringify(json));
    const message =
      (json as any)?.message ??
      (json as any)?.errorCode ??
      `Adyen error ${res.status}`;
    throw new AdyenRouteError(res.status, "ADYEN_ERROR", message);
  }

  return json as T;
}

// ---------------------------------------------------------------------------
// PAL / Recurring API (v49) — used for disabling stored payment methods
// ---------------------------------------------------------------------------

function palBase(environment: string): string {
  return environment === "live"
    ? "https://pal-live.adyen.com"
    : "https://pal-test.adyen.com";
}

/**
 * POST to the Adyen PAL/Recurring API.
 * Throws AdyenRouteError on non-2xx responses.
 */
export async function adyenPal<T>(
  creds: AdyenCreds,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${palBase(creds.environment)}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-API-key": creds.apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`[adyen-pal] ${path} → ${res.status}`, JSON.stringify(json));
    const message =
      (json as any)?.message ??
      (json as any)?.errorCode ??
      `Adyen PAL error ${res.status}`;
    throw new AdyenRouteError(res.status, "ADYEN_ERROR", message);
  }

  return json as T;
}

// ---------------------------------------------------------------------------
// Standard error response helper
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

export function routeError(err: unknown): NextResponse {
  if (err instanceof AdyenRouteError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }
  console.error("[adyen/server] Unexpected error:", err);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
    { status: 500 },
  );
}
