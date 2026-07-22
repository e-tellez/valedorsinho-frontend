"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Nfc } from "lucide-react";
import PageHeader from "@/components/adyen/shared/PageHeader";

function CardAcquisitionPageInner() {
  const searchParams = useSearchParams();
  const terminalId = searchParams.get("terminalId") || "";
  const merchantAccount = searchParams.get("merchantAccount") || "";

  const params = new URLSearchParams();
  if (terminalId) params.set("terminalId", terminalId);
  if (merchantAccount) params.set("merchantAccount", merchantAccount);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return (
    <div className="w-full max-w-[700px]">
      <PageHeader
        title="Card Acquisition"
        subtitle="Acquire card details without charging"
        backHref="/terminal-payments"
        backLabel="Terminal Payments"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mb-4">
          <span className="font-semibold">Terminal:</span>
          <span className="text-gray-800 dark:text-slate-200 font-medium">{terminalId || "\u2014"}</span>
          <span className="font-semibold ml-auto">Merchant:</span>
          <span className="text-gray-800 dark:text-slate-200 font-medium">{merchantAccount || "\u2014"}</span>
        </div>
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">
          <p className="text-lg font-semibold mb-1">Coming Soon</p>
          <p className="text-sm">Card acquisition flow will be available in a future update.</p>
        </div>
      </div>

      <h2 className="text-base font-bold text-gray-700 dark:text-slate-200 mb-3">Related Flows</h2>
      <Link
        href={`/terminal-payments/nfc${queryString}`}
        className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 no-underline text-inherit transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-green-600">
          <Nfc className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-[0.95rem] font-semibold text-gray-900 dark:text-white">NFC Flow</span>
          <span className="block text-sm text-gray-500 dark:text-slate-400 leading-snug mt-0.5">Identify, read, and write NFC tags on terminal.</span>
        </div>
        <span className="text-gray-300 dark:text-slate-600 text-xl font-light">&rsaquo;</span>
      </Link>
    </div>
  );
}

export default function CardAcquisitionPage() {
  return (
    <Suspense fallback={null}>
      <CardAcquisitionPageInner />
    </Suspense>
  );
}
