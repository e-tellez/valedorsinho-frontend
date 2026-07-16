import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Required Supabase table (run once in Supabase SQL editor):
 *
 * CREATE TABLE adyen_configs (
 *   id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   api_key          text NOT NULL DEFAULT '',
 *   client_key       text NOT NULL DEFAULT '',
 *   merchant_account text NOT NULL DEFAULT '',
 *   locked           boolean NOT NULL DEFAULT false,
 *   created_at       timestamptz DEFAULT now(),
 *   updated_at       timestamptz DEFAULT now(),
 *   UNIQUE(user_id)
 * );
 *
 * ALTER TABLE adyen_configs ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can manage their own config"
 *   ON adyen_configs FOR ALL
 *   USING (auth.uid() = user_id)
 *   WITH CHECK (auth.uid() = user_id);
 */

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("adyen_configs")
      .select("api_key, client_key, merchant_account, locked")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      apiKey: data?.api_key ?? "",
      clientKey: data?.client_key ?? "",
      merchantAccount: data?.merchant_account ?? "",
      locked: data?.locked ?? false,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
        { status: 401 }
      );
    }

    const { apiKey, clientKey, merchantAccount } = await request.json();

    const { data: existing } = await supabase
      .from("adyen_configs")
      .select("locked")
      .eq("user_id", user.id)
      .single();

    if (existing?.locked) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Configuration is managed by an admin." } },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("adyen_configs")
      .upsert(
        {
          user_id: user.id,
          api_key: apiKey ?? "",
          client_key: clientKey ?? "",
          merchant_account: merchantAccount ?? "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 }
    );
  }
}
