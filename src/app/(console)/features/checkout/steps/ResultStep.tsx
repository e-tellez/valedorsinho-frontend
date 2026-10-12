"use client";

import Link from "next/link";
import { Check, X, AlertTriangle } from "lucide-react";

export interface CheckoutResult {
  status: "success" | "failure";
  resultCode: string;
  pspReference: string;
  integrationType: string;
}

export default function ResultStep({
  result,
  error,
  onNewPayment,
}: {
  result: CheckoutResult | null;
  error: string | null;
  onNewPayment: () => void;
}) {
  if (error) {
    return (
      <div>
        <div className="cb-banner cb-banner--err" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
        <div className="cb-ck__actions">
          <button className="cb-btn cb-btn--accent" onClick={onNewPayment}>New payment</button>
          <Link href="/psp" className="cb-btn">Dashboard</Link>
        </div>
      </div>
    );
  }

  const ok = result?.status === "success";
  const rows = [
    { k: "Result code", v: result?.resultCode || "—" },
    { k: "PSP reference", v: result?.pspReference || "—" },
    { k: "Integration", v: result?.integrationType || "—" },
  ];

  return (
    <div>
      <div className="cb-result">
        <div className={`cb-result__banner cb-result__banner--${ok ? "ok" : "err"}`}>
          {ok ? <Check size={22} strokeWidth={2.5} /> : <X size={22} strokeWidth={2.5} />}
          <span>{ok ? "Payment successful" : "Payment failed"}</span>
        </div>
        <div className="cb-result__grid">
          {rows.map((r) => (
            <div key={r.k}>
              <div className="cb-result__k">{r.k}</div>
              <div className="cb-result__v">{r.v}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="cb-ck__qsub">The full request/response trace is in the inspector on the right.</p>

      <div className="cb-ck__actions">
        <button className="cb-btn cb-btn--accent" onClick={onNewPayment}>New payment</button>
        <Link href="/psp" className="cb-btn">Dashboard</Link>
      </div>
    </div>
  );
}
