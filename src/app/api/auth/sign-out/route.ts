import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) console.warn("[auth/sign-out] Session revocation failed:", error.message);
  } catch (error) {
    console.warn("[auth/sign-out] Session revocation failed:", error);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/login", appUrl), 303);

  request.cookies.getAll().forEach(({ name }) => {
    if (name === "vld_session_expires_at" || name.startsWith("sb-")) {
      response.cookies.delete(name);
    }
  });

  return response;
}
