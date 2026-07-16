import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth check
  if (
    pathname === "/login" ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  // Hard 24-hour session expiry (enforced by vld_session_expires_at cookie)
  const sessionExpiry = request.cookies.get("vld_session_expires_at")?.value;
  const now = Math.floor(Date.now() / 1000);

  if (!sessionExpiry) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (now >= Number(sessionExpiry)) {
    const response = NextResponse.redirect(
      new URL("/login?reason=session_expired", request.url)
    );
    response.cookies.delete("vld_session_expires_at");
    return response;
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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
