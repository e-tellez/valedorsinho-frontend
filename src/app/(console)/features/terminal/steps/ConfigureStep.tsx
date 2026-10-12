"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { apiGet, apiPost } from "@/lib/adyen/api";
import type { Store, TerminalPaymentResult } from "@/lib/adyen/types";
import { useCallLogger } from "../../../shell/useCallLogger";

const CURRENCIES = ["EUR", "USD", "GBP", "MXN", "BRL", "AUD", "CAD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "SGD", "HKD", "NZD", "JPY", "ZAR", "AED", "SAR"];
const FORCE_ENTRY_MODES = ["", "Contactless", "ICC", "MagStripe", "Manual", "RFID"];

type StoreOption = Pick<Store, "reference" | "description">;

function generateServiceId() {
  return String(Math.floor(Math.random() * 10000000000));
}
function generateTransactionId() {
  return "ipp-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

export default function ConfigureStep({
  terminalId,
  merchantAccount,
  onBack,
  onResult,
}: {
  terminalId: string;
  merchantAccount: string;
  onBack: () => void;
  onResult: (r: TerminalPaymentResult) => void;
}) {
  const log = useCallLogger();

  const [amount, setAmount] = useState("10.00");
  const [currency, setCurrency] = useState("MXN");
  const [askGratuity, setAskGratuity] = useState(false);
  const [receiptHandler, setReceiptHandler] = useState(false);
  const [forceEntry, setForceEntry] = useState("");
  const [shopperRef, setShopperRef] = useState("");
  const [recurringContract, setRecurringContract] = useState("");
  const [authType, setAuthType] = useState("");
  const [shopperEmail, setShopperEmail] = useState("");
  const [store, setStore] = useState("");
  const [metadata, setMetadata] = useState<{ key: string; value: string }[]>([]);
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [serviceId] = useState(generateServiceId);
  const [transactionId] = useState(generateTransactionId);

  const configIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!merchantAccount) return;
    apiGet<{ data: StoreOption[] }>(`/api/terminal/stores?merchantId=${encodeURIComponent(merchantAccount)}`)
      .then((res) => setStoreOptions(res.data || []))
      .catch(() => {});
  }, [merchantAccount]);

  const { payload, acquirerData } = useMemo(() => {
    const parsedAmount = parseFloat(amount) || 0;
    const acq: Record<string, unknown> = {};
    const tenderOpts: string[] = [];
    if (askGratuity) tenderOpts.push("AskGratuity");
    if (receiptHandler) tenderOpts.push("ReceiptHandler");
    if (tenderOpts.length) acq.tenderOption = tenderOpts.join(",");
    if (shopperRef.trim()) acq.shopperReference = shopperRef.trim();
    if (recurringContract) acq.recurringContract = recurringContract;
    if (authType) acq.authorisationType = authType;
    if (shopperEmail.trim() && shopperEmail.includes("@")) acq.shopperEmail = shopperEmail.trim();
    if (store) acq.store = store;
    const metaObj: Record<string, string> = {};
    metadata.forEach((m) => { if (m.key.trim()) metaObj[m.key.trim()] = m.value.trim(); });
    if (Object.keys(metaObj).length) acq.metadata = metaObj;

    const hasAcq = Object.keys(acq).length > 0;
    const acqB64 = hasAcq ? btoa(JSON.stringify(acq)) : null;

    const p: Record<string, unknown> = {
      SaleToPOIRequest: {
        MessageHeader: {
          ProtocolVersion: "3.0",
          MessageClass: "Service",
          MessageCategory: "Payment",
          MessageType: "Request",
          ServiceID: serviceId,
          SaleID: "Valedorsinho",
          POIID: terminalId || "<terminalId>",
        },
        PaymentRequest: {
          SaleData: {
            SaleTransactionID: { TransactionID: transactionId, TimeStamp: new Date().toISOString() },
            ...(acqB64 ? { SaleToAcquirerData: acqB64 } : {}),
          },
          PaymentTransaction: {
            AmountsReq: { Currency: currency, RequestedAmount: parsedAmount },
            ...(forceEntry ? { TransactionConditions: { ForceEntryMode: [forceEntry] } } : {}),
          },
          PaymentData: { PaymentType: "Normal" },
        },
      },
    };
    return { payload: p, acquirerData: hasAcq ? acq : null };
  }, [amount, currency, askGratuity, receiptHandler, forceEntry, shopperRef, recurringContract, authType, shopperEmail, store, metadata, serviceId, transactionId, terminalId]);

  // Post / keep the live Nexo request updated in the inspector.
  useEffect(() => {
    if (!configIdRef.current) {
      log.reset();
      configIdRef.current = log.config({ SaleToPOIRequest: (payload as Record<string, unknown>).SaleToPOIRequest, SaleToAcquirerData: acquirerData }, "Terminal request (Nexo)");
    } else {
      log.setConfig(configIdRef.current, { SaleToPOIRequest: (payload as Record<string, unknown>).SaleToPOIRequest, SaleToAcquirerData: acquirerData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, acquirerData]);

  const emailValid = !shopperEmail.trim() || shopperEmail.includes("@");
  const formValid = !!terminalId && parseFloat(amount) > 0 && emailValid;

  async function handleSend() {
    setSending(true);
    setError(null);
    const t0 = Date.now();
    const id = log.begin({ label: "Make payment", method: "POST", endpoint: "/sync (Terminal API)", request: payload });
    try {
      const raw = await apiPost<Record<string, unknown>>("/api/terminal/make-payment", payload);
      const latencyMs = Date.now() - t0;
      log.ok(id, raw);
      const decoded = await apiPost<TerminalPaymentResult>("/api/terminal/decode-response", raw);
      if (decoded.decodedAdditionalResponse != null) {
        log.note({ label: "Decoded additional response (nexo)", response: decoded.decodedAdditionalResponse });
      }
      onResult({ ...decoded, responseJson: raw, apiCall: { request: payload, statusCode: 200, latencyMs, timestamp: new Date().toISOString() } });
    } catch (err) {
      const msg = (err as Error).message || "Request failed.";
      log.err(id, { error: msg });
      setError(msg);
      setSending(false);
    }
  }

  return (
    <div>
      <h2 className="cb-ck__q">Make a payment</h2>
      <p className="cb-ck__qsub">Configure the Nexo request; it updates live in the inspector on the right.</p>

      <div className="cb-ordsum">
        <span><b>Terminal:</b> {terminalId || "—"}</span>
        <span><b>Merchant:</b> {merchantAccount || "—"}</span>
      </div>

      <div className="cb-panel">
        <div className="cb-panel__bd cb-panel__bd--form">
          <div className="cb-fgroup">
            <div className="cb-fgroup__hd">Payment details</div>
            <div className="cb-tgrid">
              <div className="cb-field">
                <label htmlFor="tk-amount">Amount <span className="cb-field__hint">major units</span></label>
                <input id="tk-amount" className="cb-input" type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="cb-field">
                <label htmlFor="tk-currency">Currency</label>
                <select id="tk-currency" className="cb-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="cb-fgroup">
            <div className="cb-fgroup__hd">Tender options</div>
            <Toggle label="Ask gratuity" hint="Prompt the shopper to add a tip." checked={askGratuity} onChange={setAskGratuity} />
            <Toggle label="Receipt handler" hint="Terminal handles receipt printing." checked={receiptHandler} onChange={setReceiptHandler} />
          </div>

          <div className="cb-fgroup">
            <div className="cb-fgroup__hd">Force entry mode</div>
            <div className="cb-pills">
              {FORCE_ENTRY_MODES.map((mode) => (
                <button key={mode || "none"} type="button" className={`cb-pillbtn ${forceEntry === mode ? "is-on" : ""}`} onClick={() => setForceEntry(mode)}>
                  {mode || "None"}
                </button>
              ))}
            </div>
          </div>

          <div className="cb-fgroup">
            <div className="cb-fgroup__hd">SaleToAcquirerData</div>
            <div className="cb-field">
              <label htmlFor="tk-shopperref">Shopper reference</label>
              <input id="tk-shopperref" className="cb-input" value={shopperRef} onChange={(e) => setShopperRef(e.target.value)} placeholder="e.g. shopper_123" />
            </div>
            <div className="cb-tgrid">
              <div className="cb-field">
                <label htmlFor="tk-recurring">Recurring contract</label>
                <select id="tk-recurring" className="cb-input" value={recurringContract} onChange={(e) => setRecurringContract(e.target.value)}>
                  <option value="">— None —</option>
                  <option value="ONECLICK">ONECLICK</option>
                  <option value="RECURRING">RECURRING</option>
                  <option value="PAYOUT">PAYOUT</option>
                </select>
              </div>
              <div className="cb-field">
                <label htmlFor="tk-authtype">Authorisation type</label>
                <select id="tk-authtype" className="cb-input" value={authType} onChange={(e) => setAuthType(e.target.value)}>
                  <option value="">— None —</option>
                  <option value="PreAuth">PreAuth</option>
                  <option value="FinalAuth">FinalAuth</option>
                </select>
              </div>
            </div>
            <div className="cb-field">
              <label htmlFor="tk-email">Shopper email</label>
              <input id="tk-email" className={`cb-input ${!emailValid ? "cb-input--bad" : ""}`} type="email" value={shopperEmail} onChange={(e) => setShopperEmail(e.target.value)} placeholder="e.g. shopper@example.com" />
              {!emailValid && <span className="cb-fielderr">Enter a valid email address.</span>}
            </div>
            <div className="cb-field">
              <label htmlFor="tk-store">Store</label>
              <select id="tk-store" className="cb-input" value={store} onChange={(e) => setStore(e.target.value)}>
                <option value="">— None —</option>
                {storeOptions.map((s) => (
                  <option key={s.reference} value={s.reference || ""}>{(s.reference || "") + (s.description ? ` – ${s.description}` : "")}</option>
                ))}
              </select>
            </div>
            <div className="cb-field">
              <label>Metadata</label>
              {metadata.map((m, i) => (
                <div key={i} className="cb-metarow">
                  <input className="cb-input" placeholder="key" value={m.key} onChange={(e) => { const n = [...metadata]; n[i] = { ...n[i], key: e.target.value }; setMetadata(n); }} />
                  <input className="cb-input" placeholder="value" value={m.value} onChange={(e) => { const n = [...metadata]; n[i] = { ...n[i], value: e.target.value }; setMetadata(n); }} />
                  <button type="button" className="cb-metarow__rm" onClick={() => setMetadata(metadata.filter((_, j) => j !== i))} aria-label="Remove entry">×</button>
                </div>
              ))}
              <button type="button" className="cb-addbtn" onClick={() => setMetadata([...metadata, { key: "", value: "" }])}>+ Add entry</button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="cb-banner cb-banner--err" style={{ marginTop: 16 }}>
          <AlertTriangle size={15} /><span>{error}</span>
        </div>
      )}

      <div className="cb-ck__actions">
        <button className="cb-btn cb-btn--pull-left" onClick={onBack} disabled={sending}>Back</button>
        <button className="cb-btn cb-btn--accent" onClick={handleSend} disabled={!formValid || sending}>
          {sending && <Loader2 size={14} className="cb-spin" />}
          {sending ? "Sending…" : "Send payment request"}
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="cb-togglerow">
      <span className="cb-togglerow__txt">
        <b>{label}</b>
        <span>{hint}</span>
      </span>
      <button type="button" role="switch" aria-checked={checked} className={`cb-switch ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
        <span className="cb-switch__knob" />
      </button>
    </div>
  );
}
