import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SESSION_DURATION_SECONDS = 60 * 60 * 24;

export async function POST(request: NextRequest) {
  try {
    const { email, token, tokenHash } = await request.json();
    const hasTokenHash =
      typeof tokenHash === "string" && tokenHash.length > 0 && tokenHash.length <= 1024;
    const hasEmailToken =
      typeof email === "string" && email.length > 0 &&
      typeof token === "string" && token.length > 0;

    if (!hasTokenHash && !hasEmailToken) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "A valid login token is required." } },
        { status: 422 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { error } = hasTokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
      : await supabase.auth.verifyOtp({ email, token, type: "email" });

    if (error) {
      console.warn("[auth/verify] Token verification failed:", {
        code: error.code,
        status: error.status,
        message: error.message,
      });
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Invalid or expired login link." } },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      "vld_session_expires_at",
      String(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_DURATION_SECONDS,
      }
    );
    return response;
  } catch (error) {
    console.error("[auth/verify] Unhandled error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 }
    );
  }
}
