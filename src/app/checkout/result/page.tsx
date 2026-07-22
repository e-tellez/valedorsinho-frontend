"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import PreviewCard, { syntaxHighlight } from "@/components/adyen/shared/PreviewCard";
import PageHeader from "@/components/adyen/shared/PageHeader";

function ResultPageInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const resultCode = searchParams.get("resultCode") || "";
  const pspReference = searchParams.get("pspReference") || "";
  const integrationType = searchParams.get("integrationType") || "";

  const [rawResponse, setRawResponse] = useState<object | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("adyen_result");
    if (raw) {
      try { setRawResponse(JSON.parse(raw) as object); } catch {}
      sessionStorage.removeItem("adyen_result");
    }
  }, []);

  const isSuccess = status === "success";

  return (
    <div className="w-full max-w-[720px]">
      <PageHeader
        title={isSuccess ? "Payment Successful" : "Payment Failed"}
        subtitle="Transaction result"
        backHref="/checkout"
        backLabel="New Payment"
      />
      {/* Result banner */}
      <div className={`rounded-xl overflow-hidden shadow-md mb-6 ${isSuccess ? "border border-green-200 dark:border-green-800" : "border border-red-200 dark:border-red-800"}`}>
        <div className={`flex items-center justify-center gap-3 py-5 px-6 text-white font-bold text-lg ${isSuccess ? "bg-green-600" : "bg-red-600"}`}>
          {isSuccess ? (
            <Check className="w-7 h-7" strokeWidth={2.5} />
          ) : (
            <X className="w-7 h-7" strokeWidth={2.5} />
          )}
          <span>{isSuccess ? "Payment Successful" : "Payment Failed"}</span>
        </div>

        <div className="bg-white dark:bg-slate-800 px-6 py-4 grid grid-cols-2 gap-y-3">
          {[
            { label: "Result Code", value: resultCode },
            { label: "PSP Reference", value: pspReference || "—" },
            { label: "Integration Type", value: integrationType || "—" },
          ].map((row) => (
            <div key={row.label} className="col-span-1">
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{row.label}</dt>
              <dd className="text-sm text-gray-900 dark:text-white font-medium mt-0.5 break-all">{row.value}</dd>
            </div>
          ))}
        </div>
      </div>

      {rawResponse && (
        <div className="mb-6">
          <PreviewCard title="Raw Response">
            <pre dangerouslySetInnerHTML={{ __html: syntaxHighlight(rawResponse) }} />
          </PreviewCard>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/checkout" className="btn-primary inline-flex items-center gap-2 leading-10">
          ← New Payment
        </Link>
        <Link href="/" className="btn-secondary inline-flex items-center gap-2 leading-10">
          Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultPageInner />
    </Suspense>
  );
}
