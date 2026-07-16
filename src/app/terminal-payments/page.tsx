"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/adyen/api";
import type { MerchantAccount, Store, Terminal } from "@/lib/adyen/types";
import PageHeader from "@/components/adyen/shared/PageHeader";
import StatusBanner from "@/components/adyen/shared/StatusBanner";

const FLOWS = [
  {
    href: "/terminal-payments/make-payment",
    title: "Make a Payment",
    desc: "Send a payment request to the terminal.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x={1} y={4} width={22} height={16} rx={2} ry={2} />
        <line x1={1} y1={10} x2={23} y2={10} />
      </svg>
    ),
  },
  {
    href: "/terminal-payments/auth-capt",
    title: "Auth + Capture",
    desc: "Pre-authorize then capture in separate steps.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/terminal-payments/card-acquisition",
    title: "Card Acquisition",
    desc: "Acquire card details without charging.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x={2} y={5} width={20} height={14} rx={2} />
        <path d="M12 9v6" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
];

export default function TerminalPaymentsPage() {
  const [companyAccount, setCompanyAccount] = useState("Loading\u2026");
  const [merchants, setMerchants] = useState<MerchantAccount[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);

  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedTerminal, setSelectedTerminal] = useState("");

  const [status, setStatus] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [loadingStores, setLoadingStores] = useState(false);
  const [loadingTerminals, setLoadingTerminals] = useState(false);

  const flowsEnabled = !!selectedTerminal;

  // Fetch merchants on mount
  useEffect(() => {
    setLoadingMerchants(true);
    apiGet<{ data: MerchantAccount[] }>("/api/terminal/merchants")
      .then((res) => {
        const list = res.data || [];
        setMerchants(list);
        if (list.length > 0 && list[0].companyId) {
          setCompanyAccount(list[0].companyId);
        } else {
          setCompanyAccount("\u2014");
        }
        if (list.length === 1) {
          setSelectedMerchant(list[0].id);
        }
      })
      .catch((err) => {
        setStatus({ msg: "Failed to load merchants: " + err.message, type: "error" });
        setCompanyAccount("\u2014");
      })
      .finally(() => setLoadingMerchants(false));
  }, []);

  // Fetch stores + terminals when merchant changes
  useEffect(() => {
    if (!selectedMerchant) {
      setStores([]);
      setTerminals([]);
      setSelectedStore("");
      setSelectedTerminal("");
      return;
    }

    setLoadingStores(true);
    apiGet<{ data: Store[] }>(`/api/terminal/stores?merchantId=${encodeURIComponent(selectedMerchant)}`)
      .then((res) => setStores(res.data || []))
      .catch((err) => setStatus({ msg: "Failed to load stores: " + err.message, type: "error" }))
      .finally(() => setLoadingStores(false));

    fetchTerminals(selectedMerchant, "");
  }, [selectedMerchant]);

  // Re-fetch terminals when store changes
  useEffect(() => {
    if (!selectedMerchant) return;
    fetchTerminals(selectedMerchant, selectedStore);
  }, [selectedStore]);

  const fetchTerminals = useCallback((merchantId: string, storeId: string) => {
    setLoadingTerminals(true);
    setSelectedTerminal("");

    const params = new URLSearchParams({ merchantIds: merchantId, pageSize: "100" });
    if (storeId) params.set("storeIds", storeId);

    apiGet<{ data: Terminal[] }>(`/api/terminal/terminals?${params.toString()}`)
      .then((res) => setTerminals(res.data || []))
      .catch((err) => setStatus({ msg: "Failed to load terminals: " + err.message, type: "error" }))
      .finally(() => setLoadingTerminals(false));
  }, []);

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
              onChange={(e) => { setSelectedMerchant(e.target.value); setSelectedStore(""); setSelectedTerminal(""); setStatus(null); }}
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
              onChange={(e) => { setSelectedStore(e.target.value); setSelectedTerminal(""); }}
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
