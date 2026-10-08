"use client";

import { Check, X } from "lucide-react";
import type { TerminalPaymentResult } from "@/lib/adyen/types";

export default function ResultStep({
  result,
  onNewPayment,
  onBackToTerminals,
}: {
  result: TerminalPaymentResult | null;
  onNewPayment: () => void;
  onBackToTerminals: () => void;
}) {
  if (!result) {
    return (
      <div>
        <div className="cb-empty"><p>No payment result found</p></div>
        <div className="cb-ck__actions">
          <button className="cb-btn cb-btn--accent" onClick={onBackToTerminals}>Back to terminals</button>
        </div>
      </div>
    );
  }

  const ok = result.success;

  return (
    <div>
      <div className="cb-result">
        <div className={`cb-result__banner cb-result__banner--${ok ? "ok" : "err"}`}>
          {ok ? <Check size={22} strokeWidth={2.5} /> : <X size={22} strokeWidth={2.5} />}
          <span>{result.resultTitle}</span>
        </div>
        {(result.resultMessage || (result.paymentSummary && result.paymentSummary.length > 0)) && (
          <div className="cb-result__grid">
            {result.resultMessage && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="cb-result__k">Message</div>
                <div className="cb-result__v">{result.resultMessage}</div>
              </div>
            )}
            {(result.paymentSummary ?? []).map((item, i) => (
              <div key={i}>
                <div className="cb-result__k">{item.label}</div>
                <div className="cb-result__v">{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="cb-ck__qsub">The full Terminal API request/response and decoded payload are in the inspector on the right.</p>

      <div className="cb-ck__actions">
        <button className="cb-btn cb-btn--pull-left" onClick={onBackToTerminals}>Terminals</button>
        <button className="cb-btn cb-btn--accent" onClick={onNewPayment}>New payment</button>
      </div>
    </div>
  );
}
