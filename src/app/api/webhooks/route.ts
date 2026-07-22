import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/webhooks?limit=25&offset=0
 *
 * Returns a paginated list of Adyen webhook notifications stored for the
 * currently authenticated user in the `webhooks` Supabase table.
 *
 * Response: { items: WebhookItem[] }
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "25", 10), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const { data, error } = await supabase
      .from("webhooks")
      .select(
        "id, user_id, merchant_account, event_code, psp_reference, merchant_reference, amount_value, amount_currency, success, live, received_at, expires_at",
      )
      .eq("user_id", user.id)
      .order("received_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[webhooks] list error", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to fetch webhooks." } },
        { status: 500 },
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 },
    );
  }
}
