"use client";

import Link from "next/link";
import { CreditCard, ShieldCheck, ScanLine } from "lucide-react";
import { useTerminalSelector } from "@/hooks/useTerminalSelector";
import PageHeader from "@/components/adyen/shared/PageHeader";
import StatusBanner from "@/components/adyen/shared/StatusBanner";

const FLOWS = [
  {
    href: "/terminal-payments/make-payment",
    title: "Make a Payment",
    desc: "Send a payment request to the terminal.",
    icon: <CreditCard className="w-full h-full" />,
  },
  {
    href: "/terminal-payments/auth-capt",
    title: "Auth + Capture",
    desc: "Pre-authorize then capture in separate steps.",
    icon: <ShieldCheck className="w-full h-full" />,
  },
  {
    href: "/terminal-payments/card-acquisition",
    title: "Card Acquisition",
    desc: "Acquire card details without charging.",
    icon: <ScanLine className="w-full h-full" />,
  },
];

export default function TerminalPaymentsPage() {
  const {
    companyAccount,
    merchants,
    stores,
    terminals,
    selectedMerchant,
    selectedStore,
    selectedTerminal,
    status,
    loadingMerchants,
    loadingStores,
    loadingTerminals,
    setSelectedMerchant,
    setSelectedStore,
    setSelectedTerminal,
    setStatus,
  } = useTerminalSelector();

  const flowsEnabled = !!selectedTerminal;

  function buildFlowHref(baseHref: string) {
    if (!selectedTerminal) return "#";
    return `${baseHref}?terminalId=${encodeURIComponent(selectedTerminal)}&merchantAccount=${encodeURIComponent(selectedMerchant)}`;
  }

  return (
    <div className="w-full max-w-[900px]">
      <PageHeader
        title="Terminal Payments"
        subtitle="Select a terminal to perform in-person payment flows."
        backHref="/"
      />

      {/* Status */}
      {status && <StatusBanner msg={status.msg} type={status.type} />}

      {/* Step 1 — Terminal selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-700 dark:text-slate-200 mb-4">1. Select Terminal</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Company account */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Company Account</label>
            <span className="block text-sm text-gray-800 dark:text-slate-200 font-medium">{companyAccount}</span>
          </div>

          {/* Merchant */}
          <div>
            <label htmlFor="merchant-select" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Merchant Account</label>
            <select
              id="merchant-select"
              className="field-input"
              value={selectedMerchant}
              onChange={(e) => setSelectedMerchant(e.target.value)}
              disabled={loadingMerchants || merchants.length === 0}
            >
              <option value="">{loadingMerchants ? "Loading\u2026" : merchants.length === 0 ? "No merchants found" : "Select merchant account\u2026"}</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>{m.name ? `${m.id} (${m.name})` : m.id}</option>
              ))}
            </select>
          </div>

          {/* Store */}
          <div>
            <label htmlFor="store-select" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Store</label>
            <select
              id="store-select"
              className="field-input"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={!selectedMerchant || loadingStores}
            >
              <option value="">{!selectedMerchant ? "Select a merchant first" : loadingStores ? "Loading\u2026" : "All stores"}</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id} title={s.id}>{s.description || s.shopperStatement || s.reference || s.id}</option>
              ))}
            </select>
          </div>

          {/* Terminal */}
          <div>
            <label htmlFor="terminal-select" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Terminal</label>
            <select
              id="terminal-select"
              className="field-input"
              value={selectedTerminal}
              onChange={(e) => { setSelectedTerminal(e.target.value); setStatus(null); }}
              disabled={!selectedMerchant || loadingTerminals}
            >
              <option value="">{!selectedMerchant ? "Select a merchant first" : loadingTerminals ? "Loading\u2026" : terminals.length === 0 ? "No terminals found" : "Select terminal\u2026"}</option>
              {terminals.map((t) => (
                <option key={t.id} value={t.id}>{t.model ? `${t.id} \u2013 ${t.model}` : t.id}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedTerminal && (
          <div className="mt-3 text-sm text-green-700 font-medium">✓ Selected: {selectedTerminal}</div>
        )}
      </div>

      {/* Step 2 — Flow cards */}
      <div className={`${flowsEnabled ? "" : "opacity-50 pointer-events-none"}`}>
        <h2 className="text-base font-bold text-gray-700 dark:text-slate-200 mb-2">2. Choose Flow</h2>
        {!flowsEnabled && (
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">Select a terminal above to unlock payment flows</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          {FLOWS.map((flow) => (
            <Link
              key={flow.title}
              href={buildFlowHref(flow.href)}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 no-underline text-inherit transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <div className="w-5 h-5">{flow.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[0.95rem] font-semibold text-gray-900 dark:text-white">{flow.title}</span>
                <span className="block text-sm text-gray-500 dark:text-slate-400 leading-snug mt-0.5">{flow.desc}</span>
              </div>
              <span className="text-gray-300 dark:text-slate-600 text-xl font-light">&rsaquo;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
