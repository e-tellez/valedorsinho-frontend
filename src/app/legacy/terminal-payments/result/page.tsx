"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/adyen/shared/PageHeader";
import ApiCallPanel from "@/components/adyen/shared/ApiCallPanel";
import type { ApiCallEntry } from "@/components/adyen/shared/ApiCallCard";
import type { TerminalPaymentResult } from "@/lib/adyen/types";

function TerminalPaymentResultPageInner() {
  const searchParams = useSearchParams();
  const terminalId = searchParams.get("terminalId") || "";
  const merchantAccount = searchParams.get("merchantAccount") || "";

  const [data, setData] = useState<TerminalPaymentResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("terminal_payment_result");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setData(parsed);
    } catch {}
    sessionStorage.removeItem("terminal_payment_result");
  }, []);

  if (!data) {
    return (
      <div className="w-full max-w-[900px] text-center py-20">
        <p className="text-gray-500">No payment result data found.</p>
        <Link href="/legacy/terminal-payments" className="text-primary underline text-sm mt-2 inline-block">
          Back to Terminal Payments
        </Link>
      </div>
    );
  }

  const makePaymentHref = `/legacy/terminal-payments/make-payment?terminalId=${encodeURIComponent(terminalId)}&merchantAccount=${encodeURIComponent(merchantAccount)}`;
  const hasDecoded = data.decodedAdditionalResponse != null;

  const apiCalls: ApiCallEntry[] = data.responseJson
    ? [
        {
          method: "POST",
          endpoint: "/sync (Terminal API)",
          direction: "merchant→adyen",
          statusCode: data.apiCall?.statusCode,
          latencyMs: data.apiCall?.latencyMs,
          timestamp: data.apiCall?.timestamp,
          request: data.apiCall?.request,
          response: data.responseJson,
          ...(hasDecoded
            ? {
                extra: {
                  label: "Decoded Additional Response",
                  note: "Base64-decoded per nexo EPAS standard",
                  data: data.decodedAdditionalResponse,
                },
              }
            : {}),
        },
      ]
    : [];

  return (
    <div className="w-full max-w-[900px]">
      <PageHeader
        title="Payment Result"
        subtitle="Terminal API response for your payment request."
        left={
          <div className="flex flex-col gap-1.5">
            <Link href={makePaymentHref} className="btn-primary inline-flex! items-center! justify-center! w-auto! px-3 py-1.5! text-xs">
              &larr; Make Another Payment
            </Link>
            <Link href="/legacy/terminal-payments" className="btn-secondary inline-flex! items-center! justify-center! w-auto! px-3 py-1.5! text-xs">
              &larr; Back to Terminal Payments
            </Link>
          </div>
        }
      />

      {/* Banner centered */}
      <div className={`max-w-[500px] mx-auto rounded-xl border overflow-hidden mb-5 ${data.success ? "border-green-200" : "border-red-200"}`}>
        <div className={`flex items-center justify-center gap-3 px-6 py-4 text-white ${data.success ? "bg-green-600" : "bg-red-600"}`}>
          <span className="text-2xl">{data.success ? "\u2713" : "\u2717"}</span>
          <span className="text-lg font-bold">{data.resultTitle}</span>
        </div>

        {data.resultMessage && (
          <div className="text-center text-sm text-gray-500 px-5 pt-2 pb-3">{data.resultMessage}</div>
        )}

        {data.paymentSummary && data.paymentSummary.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 px-5 py-4">
            {data.paymentSummary.map((item, i) => (
              <div key={i}>
                <div className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</div>
                <div className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API call inspector */}
      <ApiCallPanel side="right" calls={apiCalls} />
    </div>
  );
}

export default function TerminalPaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <TerminalPaymentResultPageInner />
    </Suspense>
  );
}
