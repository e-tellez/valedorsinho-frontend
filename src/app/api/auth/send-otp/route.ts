import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_DOMAIN = "@adyen.com";
const BACKEND_WARMUP_URL = process.env.ADYEN_BACKEND_URL
  ? `${process.env.ADYEN_BACKEND_URL}/goodmorning`
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

    const supabase = createSupabaseServerClient();
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
