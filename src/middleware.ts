import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isSupabaseSessionCookie(name: string) {
  return name.startsWith("sb-") && !name.includes("code-verifier");
}

function redirectToLogin(request: NextRequest, reason?: "session_expired") {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = reason ? `?reason=${reason}` : "";

  const response = NextResponse.redirect(url);
  response.cookies.delete("vld_session_expires_at");
  request.cookies.getAll().forEach(({ name }) => {
    if (isSupabaseSessionCookie(name)) response.cookies.delete(name);
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth check
  if (
    pathname === "/login" ||
    pathname === "/auth/callback" ||
    pathname === "/auth/confirm" ||
    pathname.startsWith("/api/") ||
    // Apple Pay domain verification file must be publicly accessible.
    // Apple contacts this path during merchant validation; it cannot be behind auth.
    pathname.startsWith("/.well-known/")
  ) {
    return NextResponse.next();
  }

  // Hard 24-hour session expiry (enforced by vld_session_expires_at cookie)
  const sessionExpiry = request.cookies.get("vld_session_expires_at")?.value;
  const now = Math.floor(Date.now() / 1000);

  if (!sessionExpiry) {
    const hadSupabaseSession = request.cookies.getAll().some(({ name }) =>
      isSupabaseSessionCookie(name)
    );
    return redirectToLogin(request, hadSupabaseSession ? "session_expired" : undefined);
  }

  if (now >= Number(sessionExpiry)) {
    return redirectToLogin(request, "session_expired");
  }

  // Supabase JWT validation
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
