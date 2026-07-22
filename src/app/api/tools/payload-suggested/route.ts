import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VERTICALS } from "@/lib/adyen/verticals";

/**
 * POST /api/tools/payload-suggested
 *
 * Body: { verticals: string[] }
 *
 * Merges the payload fields from the selected merchant verticals into a
 * recommended base /payments payload. Vertical data is derived from the
 * canonical VERTICALS constant in src/lib/adyen/verticals.ts — do not
 * duplicate it here.
 *
 * Response: { payload: Record<string, unknown> }
 */

export async function POST(req: NextRequest) {
  try {
    // Auth check — ensure the caller is authenticated.
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
        { status: 401 },
      );
    }

    const body = await req.json();
    const selectedKeys: string[] = body?.verticals ?? [];

    // Build a lookup map from the canonical VERTICALS list.
    const payloadByKey = Object.fromEntries(
      VERTICALS.map((v) => [v.key, v.payload]),
    );

    // Base payload always included.
    const base: Record<string, unknown> = {
      merchantAccount: "YOUR_MERCHANT_ACCOUNT",
      reference: "ORDER-REFERENCE",
      amount: { value: 1000, currency: "EUR" },
      paymentMethod: { type: "scheme" },
      returnUrl: "https://your-website.com/checkout/result",
    };

    // Merge vertical-specific fields; additionalData objects are deep-merged.
    let mergedAdditionalData: Record<string, unknown> = {};

    for (const key of selectedKeys) {
      const fields = payloadByKey[key];
      if (!fields) continue;

      for (const [field, value] of Object.entries(fields)) {
        if (field === "additionalData" && typeof value === "object" && value !== null) {
          mergedAdditionalData = { ...mergedAdditionalData, ...(value as Record<string, unknown>) };
        } else {
          base[field] = value;
        }
      }
    }

    if (Object.keys(mergedAdditionalData).length > 0) {
      base.additionalData = mergedAdditionalData;
    }

    return NextResponse.json({ payload: base });
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
      { status: 400 },
    );
  }
}
