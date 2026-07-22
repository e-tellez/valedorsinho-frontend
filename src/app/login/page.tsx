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
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="8" fill="#0ABF53" />
            <path d="M12 20.5L18 26.5L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 text-center mb-8">
          Valedorsinho
        </h1>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ABF53] focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg bg-[#0ABF53] hover:bg-[#09a849] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 transition-colors"
            >
              {loading ? "Sending…" : "Send login link"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Mail width={40} height={40} stroke="#0ABF53" strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-gray-800 mb-1">Check your inbox</p>
            <p className="text-sm text-gray-500 mb-6">
              We sent a login link to <span className="font-medium text-gray-700">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
  );
}
