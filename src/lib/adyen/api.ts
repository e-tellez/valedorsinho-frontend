/**
 * Fetch wrapper for FastAPI backend calls.
 *
 * In development, Next.js rewrites `/api/*` to `http://localhost:8000/api/*`
 * (configured in next.config.js), so all calls are same-origin.
 *
 * Every call automatically attaches the Supabase session JWT as
 * `Authorization: Bearer <token>` when running in the browser.
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const API_BASE = "";

async function getBearerHeader(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {}
  return {};
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const method = options?.method ?? "GET";
  const url = `${API_BASE}${path}`;
  const authHeader = await getBearerHeader();
  console.log(`[api] ${method} ${url}`);

  const { headers: customHeaders, ...restOptions } = options ?? {};
  const response = await fetch(url, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(customHeaders as Record<string, string>),
    },
  });

  console.log(`[api] ${method} ${url} → ${response.status}`);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    // errorBody?.error may be a nested object { code, message } from our route
    // handlers — unwrap it so we always end up with a string.
    const nestedError = errorBody?.error;
    const message =
      errorBody?.detail ??
      (typeof nestedError === "string" ? nestedError : nestedError?.message) ??
      `API error: ${response.status}`;
    console.error(`[api] ${method} ${url} failed:`, errorBody ?? message);
    throw new Error(message);
  }

  return response.json();
}

export function apiGet<T = unknown>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const searchParams = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    }
  }
  const query = searchParams.toString();
  return apiFetch<T>(query ? `${path}?${query}` : path);
}

export function apiPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut<T = unknown>(
  path: string,
  body: unknown,
): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
