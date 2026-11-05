"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

export default function AuthCallbackPage() {
  useEffect(() => {
    // Implicit-flow magic links deliver the session in the URL fragment:
    // #access_token=...&refresh_token=...  (or #error=...&error_code=otp_expired)
    // The fragment is never sent to the server, so this must run client-side.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const hasError = params.get("error") ?? params.get("error_code");

    // Strip the tokens from the URL (and history) before anything else reads them.
    window.history.replaceState(null, "", window.location.pathname);

    void (async () => {
      if (hasError || !accessToken || !refreshToken) {
        window.location.replace("/login?error=auth_failed");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        window.location.replace("/login?error=auth_failed");
        return;
      }

      // Mirror the 24-hour hard-expiry cookie the middleware enforces.
      const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie =
        `vld_session_expires_at=${expiresAt}; Path=/; Max-Age=${SESSION_DURATION_SECONDS}; SameSite=Lax${secure}`;

      window.location.replace("/");
    })();
  }, []);

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 text-center">
      <div className="flex justify-center mb-4">
        <Loader2 width={40} height={40} className="animate-spin" stroke="#0ABF53" strokeWidth={2} aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Signing you in…</h1>
      <p className="text-sm text-gray-500">Please wait while we complete your sign in.</p>
    </div>
  );
}
