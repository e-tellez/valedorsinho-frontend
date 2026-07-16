"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, X } from "lucide-react";
import { apiFetch } from "@/lib/adyen/api";
import type { AdyenSetupConfig } from "@/lib/adyen/types";

export default function OnboardingBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("onboarding_banner_dismissed") === "true") return;

    apiFetch<AdyenSetupConfig>("/api/config/setup")
      .then((config) => {
        const hasCredentials = config.apiKey && config.clientKey && config.merchantAccount;
        if (!hasCredentials) setShow(true);
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    sessionStorage.setItem("onboarding_banner_dismissed", "true");
    setDismissed(true);
  }

  if (!show || dismissed) return null;

  return (
    <div className="relative flex items-start gap-3 bg-white dark:bg-[#0a0f1e] border-2 border-primary rounded-none px-4 py-3 mb-6 shadow-[0_0_20px_rgba(0,212,255,0.12)]">
      <div className="absolute top-0 left-0 w-0 h-0 border-l-8 border-l-primary border-b-8 border-b-transparent" />

      <div className="shrink-0 w-8 h-8 flex items-center justify-center text-primary mt-0.5">
        <Settings className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-gray-900 dark:text-[#e6edf3] text-sm tracking-tight mb-0.5">
          Configure your Adyen credentials to get started
        </p>
        <p className="font-mono text-[0.75rem] text-gray-500 dark:text-[#8b949e] leading-normal">
          Add your API key, client key, and merchant account so every demo runs against your own Adyen test environment.
        </p>
        <Link
          href="/setup?welcome=true"
          className="inline-block mt-2 font-mono text-[0.75rem] font-bold uppercase tracking-widest text-primary hover:underline transition-colors"
        >
          Open Setup →
        </Link>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-gray-400 dark:text-[#8b949e] hover:text-gray-600 dark:hover:text-[#e6edf3] transition-colors mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
