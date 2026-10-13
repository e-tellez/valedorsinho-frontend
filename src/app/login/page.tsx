"use client";

import { useState, useEffect } from "react";
import { Mail } from "lucide-react";

type Step = "email" | "sent";

export default function ValedorsinhoLoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth_failed") {
      setError("The login link was invalid or expired. Please try again.");
    } else if (params.get("reason") === "session_expired") {
      setError("Your session has expired. Please log in again.");
    }
  }, []);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? "Failed to send link.");
        return;
      }

      setStep("sent");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tech-grid w-full max-w-md bg-white dark:bg-[#0a0f1e] border-2 border-gray-300 dark:border-[#1a2332] shadow-[8px_8px_0_0_rgba(0,0,0,0.06)] dark:shadow-[0_0_40px_rgba(0,212,255,0.08)] p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-10">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="shrink-0">
            <rect x="1" y="1" width="38" height="38" fill="none" stroke="#00d4ff" strokeWidth="2" />
            <path d="M12 20.5L18 26.5L28 14" stroke="#00d4ff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
          </svg>
          <div>
            <div className="text-xl font-extrabold tracking-[-0.01em] text-gray-900 dark:text-[#e6edf3] leading-none">
              Valedorsinho
            </div>
            <div className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-gray-400 dark:text-[#484f58]">
              Adyen Unified Commerce
            </div>
          </div>
        </div>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} noValidate>
            <div className="mb-5">
              <label htmlFor="email" className="block font-mono text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#8b949e] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@adyen.com"
                required
                autoComplete="email"
                className="field-input"
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-[#ff3366] mb-5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full"
            >
              {loading ? "Sending…" : "Send login link"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <Mail width={40} height={40} stroke="#00d4ff" strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-[#e6edf3] mb-2">
              Check your inbox
            </p>
            <p className="text-sm text-gray-500 dark:text-[#8b949e] mb-7">
              We sent a login link to <span className="font-medium text-gray-700 dark:text-[#e6edf3]">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="btn-secondary"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
  );
}
