"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/adyen/shared/PageHeader";

function AuthCaptPageInner() {
  const searchParams = useSearchParams();
  const terminalId = searchParams.get("terminalId") || "";
  const merchantAccount = searchParams.get("merchantAccount") || "";

  return (
    <div className="w-full max-w-[700px]">
      <PageHeader
        title="Auth + Capture"
        subtitle="Pre-authorize then capture in separate steps"
        backHref="/terminal-payments"
        backLabel="Terminal Payments"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mb-4">
          <span className="font-semibold">Terminal:</span>
          <span className="text-gray-800 dark:text-slate-200 font-medium">{terminalId || "\u2014"}</span>
          <span className="font-semibold ml-auto">Merchant:</span>
          <span className="text-gray-800 dark:text-slate-200 font-medium">{merchantAccount || "\u2014"}</span>
        </div>
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">
          <p className="text-lg font-semibold mb-1">Coming Soon</p>
          <p className="text-sm">Auth + Capture flow will be available in a future update.</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCaptPage() {
  return (
    <Suspense fallback={null}>
      <AuthCaptPageInner />
    </Suspense>
  );
}
