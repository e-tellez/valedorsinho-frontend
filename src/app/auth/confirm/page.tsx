"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

export default function ConfirmLoginPage() {
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    setTokenHash((current) => current ?? params.get("token_hash"));
    window.history.replaceState(null, "", window.location.pathname);
    setReady(true);
  }, []);

  async function confirmLogin() {
    if (!tokenHash) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenHash }),
      });

      if (!response.ok) {
        setError("The login link was invalid or expired. Please request a new one.");
        return;
      }

      window.location.replace("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 text-center">
      <div className="flex justify-center mb-4">
        <ShieldCheck width={40} height={40} stroke="#0ABF53" strokeWidth={2} aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Confirm sign in</h1>
      <p className="text-sm text-gray-500 mb-6">
        Complete this step to securely sign in to Valedorsinho.
      </p>

      {ready && !tokenHash ? (
        <>
          <p className="text-sm text-red-600 mb-4" role="alert">
            This login link is incomplete. Please request a new one.
          </p>
          <a href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Return to login
          </a>
        </>
      ) : (
        <>
          {error && (
            <p className="text-sm text-red-600 mb-4" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={confirmLogin}
            disabled={!ready || loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0ABF53] hover:bg-[#09a849] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 transition-colors"
          >
            {loading && <Loader2 width={16} height={16} className="animate-spin" aria-hidden="true" />}
            {loading ? "Signing in…" : "Confirm sign in"}
          </button>
        </>
      )}
    </div>
  );
}
