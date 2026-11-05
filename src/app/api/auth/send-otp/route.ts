import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_DOMAIN = "@adyen.com";
const BACKEND_WARMUP_URL = process.env.VALEDORSINHO_API_URL
  ? `${process.env.VALEDORSINHO_API_URL}/goodmorning`
  : null;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Email is required." } },
        { status: 422 }
      );
    }

    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED_DOMAIN", message: "Email not allowed." } },
        { status: 403 }
      );
    }

    // Use a plain supabase-js client pinned to the implicit flow. @supabase/ssr
    // hardcodes flowType: "pkce", which makes the magic link come back as
    // ?code=... and requires a code-verifier cookie that is absent whenever the
    // link is opened in a different browser context (e.g. Gmail's in-app browser
    // or after copy-pasting across devices) — the cause of the
    // "pkce_code_verifier_not_found" errors. The implicit flow instead returns
    // the session in the URL fragment, which /auth/callback consumes client-side.
    // This client only sends the email, so it never persists a session.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } }
    );
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: { code: "OTP_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    if (BACKEND_WARMUP_URL) {
      fetch(BACKEND_WARMUP_URL).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-otp] Unhandled error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 }
    );
  }
}
