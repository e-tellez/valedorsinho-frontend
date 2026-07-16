import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;

      const { data: { user } } = await supabase.auth.getUser();

      // A user is new if they have no adyen_configs row yet.
      // Timestamp heuristics are unreliable: users can take up to 1 hour to
      // click their OTP link, so created_at vs last_sign_in_at proximity is
      // not a safe signal.
      const { data: existingConfig } = user
        ? await supabase
            .from("adyen_configs")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()
        : { data: null };

      const destination = !existingConfig
        ? `${origin}/setup?welcome=true`
        : `${origin}/`;

      const response = NextResponse.redirect(destination);
      response.cookies.set("vld_session_expires_at", String(expiresAt), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_DURATION_SECONDS,
      });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
