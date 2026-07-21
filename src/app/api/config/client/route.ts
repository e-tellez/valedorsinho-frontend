import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/config/client
 *
 * Returns the Adyen client-side configuration required by useCheckoutConfig().
 * Only exposes the three fields safe for the browser — the raw API key is
 * never returned.
 *
 * Resolution order (first non-empty wins):
 *   1. User's own row in the `adyen_configs` Supabase table.
 *   2. Server-side env vars ADYEN_DEFAULT_CLIENT_KEY / ADYEN_DEFAULT_MERCHANT_ACCOUNT
 *      (useful for demo / shared-account deployments where every user shares one key).
 *
 * `environment` is derived from the client key prefix:
 *   - starts with "live_" → "live"
 *   - anything else       → "test"
 */
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("adyen_configs")
      .select("client_key, merchant_account")
      .eq("user_id", user.id)
      .single();

    // PGRST116 = "no rows returned" — not an error, just no config saved yet
    if (error && error.code !== "PGRST116") {
      throw error;
    }

    const clientKey =
      (data?.client_key && data.client_key.trim())
        ? data.client_key.trim()
        : (process.env.ADYEN_DEFAULT_CLIENT_KEY ?? "").trim();

    const merchantAccount =
      (data?.merchant_account && data.merchant_account.trim())
        ? data.merchant_account.trim()
        : (process.env.ADYEN_DEFAULT_MERCHANT_ACCOUNT ?? "").trim();

    if (!clientKey || !merchantAccount) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_MISSING",
            message:
              "No Adyen configuration found. Please complete the setup step first.",
          },
        },
        { status: 404 },
      );
    }

    const environment = clientKey.startsWith("live_") ? "live" : "test";

    return NextResponse.json({ clientKey, environment, merchantAccount });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 },
    );
  }
}
