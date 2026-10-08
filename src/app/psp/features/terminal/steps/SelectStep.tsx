"use client";

import { CreditCard, ShieldCheck, ScanLine, ChevronRight } from "lucide-react";
import type { UseTerminalSelectorResult } from "@/hooks/useTerminalSelector";

export default function SelectStep({
  selector,
  onMakePayment,
}: {
  selector: UseTerminalSelectorResult;
  onMakePayment: () => void;
}) {
  const {
    companyAccount, merchants, stores, terminals,
    selectedMerchant, selectedStore, selectedTerminal, status,
    loadingMerchants, loadingStores, loadingTerminals,
    setSelectedMerchant, setSelectedStore, setSelectedTerminal, setStatus,
  } = selector;

  const ready = !!selectedTerminal;
  const bannerType = status?.type === "error" ? "err" : status?.type === "success" ? "ok" : "info";

  return (
    <div>
      <h2 className="cb-ck__q">Select a terminal</h2>
      <p className="cb-ck__qsub">Pick the merchant, store and terminal to run an in-person payment against.</p>

      {status && (
        <div className={`cb-banner cb-banner--${bannerType}`} style={{ marginBottom: 16 }}>
          <span>{status.msg}</span>
        </div>
      )}

      <div className="cb-panel">
        <div className="cb-panel__bd cb-panel__bd--form">
          <div className="cb-tgrid">
            <div className="cb-field">
              <label>Company account</label>
              <span className="cb-tk__ro">{companyAccount}</span>
            </div>

            <div className="cb-field">
              <label htmlFor="tk-merchant">Merchant account</label>
              <select
                id="tk-merchant"
                className="cb-input"
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                disabled={loadingMerchants || merchants.length === 0}
              >
                <option value="">{loadingMerchants ? "Loading…" : merchants.length === 0 ? "No merchants found" : "Select merchant account…"}</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>{m.name ? `${m.id} (${m.name})` : m.id}</option>
                ))}
              </select>
            </div>

            <div className="cb-field">
              <label htmlFor="tk-store">Store</label>
              <select
                id="tk-store"
                className="cb-input"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                disabled={!selectedMerchant || loadingStores}
              >
                <option value="">{!selectedMerchant ? "Select a merchant first" : loadingStores ? "Loading…" : "All stores"}</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id} title={s.id}>{s.description || s.shopperStatement || s.reference || s.id}</option>
                ))}
              </select>
            </div>

            <div className="cb-field">
              <label htmlFor="tk-terminal">Terminal</label>
              <select
                id="tk-terminal"
                className="cb-input"
                value={selectedTerminal}
                onChange={(e) => { setSelectedTerminal(e.target.value); setStatus(null); }}
                disabled={!selectedMerchant || loadingTerminals}
              >
                <option value="">{!selectedMerchant ? "Select a merchant first" : loadingTerminals ? "Loading…" : terminals.length === 0 ? "No terminals found" : "Select terminal…"}</option>
                {terminals.map((t) => (
                  <option key={t.id} value={t.id}>{t.model ? `${t.id} – ${t.model}` : t.id}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="cb-fgroup__hd">Choose a flow</div>
        {!ready && <p className="cb-ck__qsub" style={{ marginBottom: 12 }}>Select a terminal above to unlock payment flows.</p>}

        <div className="cb-flowgrid">
          <button className="cb-flowcard" onClick={onMakePayment} disabled={!ready}>
            <span className="cb-flowcard__badge"><CreditCard size={18} /></span>
            <span className="cb-flowcard__txt">
              <b>Make a payment</b>
              <span>Send a payment request to the terminal.</span>
            </span>
            <ChevronRight size={18} style={{ color: "var(--cb-ink-3)", flex: "none" }} />
          </button>

          <button className="cb-flowcard" disabled>
            <span className="cb-flowcard__badge"><ShieldCheck size={18} /></span>
            <span className="cb-flowcard__txt">
              <b>Auth + capture</b>
              <span>Pre-authorize then capture separately. Coming soon.</span>
            </span>
            <span className="cb-pill">SOON</span>
          </button>

          <button className="cb-flowcard" disabled>
            <span className="cb-flowcard__badge"><ScanLine size={18} /></span>
            <span className="cb-flowcard__txt">
              <b>Card acquisition</b>
              <span>Acquire card details without charging. Coming soon.</span>
            </span>
            <span className="cb-pill">SOON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
