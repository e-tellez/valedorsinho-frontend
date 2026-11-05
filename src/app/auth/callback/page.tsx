"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"working" | "error">("working");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    // Implicit-flow magic links deliver the session in the URL fragment:
    // #access_token=...&refresh_token=...  (or #error=...&error_code=otp_expired)
    // The fragment is never sent to the server, so this must run client-side.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);

    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const errorCode = hash.get("error_code") ?? query.get("error_code");
    const errorDescription =
      hash.get("error_description") ??
      query.get("error_description") ??
      hash.get("error") ??
      query.get("error");
    const code = query.get("code");

    // Figure out the reason BEFORE we strip the URL, so we can surface it.
    const reason = errorCode || errorDescription
      ? `${errorCode ?? "error"}: ${errorDescription ?? ""}`
      : code
      ? "stale_link: received ?code (an old PKCE link). Request a brand-new link."
      : !accessToken || !refreshToken
      ? "incomplete_link: no access/refresh token in the URL fragment."
      : "";

    // Strip tokens/params from the URL (and history) before anything else reads them.
    window.history.replaceState(null, "", window.location.pathname);

    void (async () => {
      if (!accessToken || !refreshToken) {
        setDetail(reason);
        setStatus("error");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setDetail(`setSession_failed: ${error.message}`);
        setStatus("error");
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

  if (status === "working") {
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

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 text-center">
      <div className="flex justify-center mb-4">
        <ShieldAlert width={40} height={40} stroke="#ff3366" strokeWidth={2} aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Could not sign you in</h1>
      <p className="text-sm text-gray-500 mb-4">The login link could not be completed.</p>
      <p className="font-mono text-xs break-words bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700 mb-6">
        {detail || "unknown"}
      </p>
      <a href="/login" className="text-sm text-[#0ABF53] hover:underline">
        Back to login
      </a>
    </div>
  );
}
