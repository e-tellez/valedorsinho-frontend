"use client";

import { useCallback, useEffect, useState } from "react";
import { Smartphone, CheckCircle2, XCircle, AlertTriangle, Loader2, Eye } from "lucide-react";
import { apiPost } from "@/lib/adyen/api";
import { useCallLogger } from "../shell/useCallLogger";

interface ApplePayConfig {
  merchantId: string;
  merchantName: string;
  brands: string[];
  isPreview?: boolean;
}
interface PaymentResult {
  status: "success" | "error";
  resultCode?: string;
  pspReference?: string;
  message?: string;
}

declare global {
  interface Window {
    ApplePaySession?: {
      new (version: number, request: ApplePayPaymentRequest): ApplePaySessionInstance;
      canMakePayments(): boolean;
      readonly STATUS_SUCCESS: number;
      readonly STATUS_FAILURE: number;
    };
  }
}
interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  merchantCapabilities: string[];
  supportedNetworks: string[];
  total: { label: string; amount: string };
}
interface ApplePaySessionInstance {
  begin(): void;
  completeMerchantValidation(merchantSession: unknown): void;
  completePayment(status: number): void;
  onvalidatemerchant: ((event: { validationURL: string }) => void) | null;
  onpaymentauthorized: ((event: { payment: { token: { paymentData: unknown } } }) => void) | null;
  oncancel: (() => void) | null;
}

const MSI_OPTIONS = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 9, label: "9 meses" },
  { value: 12, label: "12 meses" },
];

const FLOW_STEPS = [
  { label: "POST /paymentMethods", desc: "Fetch Apple Pay merchantId + merchantName for MX/MXN." },
  { label: "ApplePaySession.begin()", desc: "Open the sheet with supportsCredit + credit networks only." },
  { label: "POST /applePay/sessions", desc: "Backend proxies merchant validation to Adyen (onvalidatemerchant)." },
  { label: "POST /payments", desc: "Submit the token with installments.value for MSI (onpaymentauthorized)." },
];

export default function ApplePayMsiFeature() {
  const log = useCallLogger();

  const [applePaySupported, setApplePaySupported] = useState<boolean | null>(null);
  const [applePayConfig, setApplePayConfig] = useState<ApplePayConfig | null>(null);
  const [configWarning, setConfigWarning] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [amountMXN, setAmountMXN] = useState("1000.00");
  const [installments, setInstallments] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const fetchApplePayConfig = useCallback(async () => {
    const requestBody = { countryCode: "MX", currency: "MXN" };
    const id = log.begin({ label: "List payment methods", method: "POST", endpoint: "/v71/paymentMethods", request: requestBody });
    try {
      const data = await apiPost<{
        requestBody: unknown;
        response: { paymentMethods?: Array<{ type: string; name?: string; configuration?: { merchantId?: string; merchantName?: string }; brands?: string[] }> };
      }>("/api/checkout/apple-pay/payment-methods", requestBody);
      log.ok(id, data.response);

      const applePayMethod = data.response.paymentMethods?.find((m) => m.type === "applepay");
      if (applePayMethod?.configuration) {
        setApplePayConfig({
          merchantId: applePayMethod.configuration.merchantId ?? "",
          merchantName: applePayMethod.configuration.merchantName ?? "",
          brands: applePayMethod.brands ?? ["visa", "masterCard", "amex"],
          isPreview: false,
        });
      } else {
        setApplePayConfig({ merchantId: "merchant.adyen.yourdomain", merchantName: "Your Store", brands: ["visa", "masterCard", "amex"], isPreview: true });
        setConfigWarning("applepay was not returned by /paymentMethods. Enable Apple Pay in the Adyen Customer Area and register this domain. The page is in Preview Mode — payloads use placeholder values.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load payment methods.";
      setConfigError(msg);
      log.err(id, { error: msg });
    }
  }, [log]);

  useEffect(() => {
    log.reset();
    setApplePaySupported(
      typeof window !== "undefined" && typeof window.ApplePaySession !== "undefined" && window.ApplePaySession!.canMakePayments(),
    );
    fetchApplePayConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePreviewPayloads() {
    if (!applePayConfig) return;
    const amountMinor = Math.round(parseFloat(amountMXN) * 100);
    const domainName = typeof window !== "undefined" ? window.location.hostname : "yourdomain.com";
    log.reset();

    const s1 = log.begin({
      label: "Validate merchant · preview", method: "POST", endpoint: "/v71/applePay/sessions",
      request: { merchantAccount: "<your merchant account>", displayName: applePayConfig.merchantName, domainName, merchantIdentifier: applePayConfig.merchantId },
    });
    log.ok(s1, { epochTimestamp: 1234567890000, expiresAt: 1234571490000, merchantSessionIdentifier: "SSH1234ABCD…", nonce: "a1b2c3d4", merchantIdentifier: applePayConfig.merchantId, domainName, displayName: applePayConfig.merchantName, signature: "<Apple-signed opaque blob — passed as-is to completeMerchantValidation()>" });

    const s2 = log.begin({
      label: "Create payment · preview", method: "POST", endpoint: "/v71/payments",
      request: { merchantAccount: "<your merchant account>", paymentMethod: { type: "applepay", applePayToken: "<btoa(JSON.stringify(paymentData))>" }, amount: { value: amountMinor, currency: "MXN" }, reference: "apple-pay-msi-<uuid>", countryCode: "MX", channel: "Web", installments: { value: installments }, returnUrl: `https://${domainName}/psp/apple-pay-msi` },
    });
    log.ok(s2, { resultCode: "Authorised", pspReference: "ABCD1234567890EF", amount: { value: amountMinor, currency: "MXN" }, merchantReference: "apple-pay-msi-<uuid>" });
  }

  function handleApplePay() {
    if (!applePayConfig || !window.ApplePaySession) return;
    setLoading(true);
    setResult(null);
    const amountMinor = Math.round(parseFloat(amountMXN) * 100);

    const paymentRequest: ApplePayPaymentRequest = {
      countryCode: "MX",
      currencyCode: "MXN",
      merchantCapabilities: ["supports3DS", "supportsCredit"],
      supportedNetworks: ["visa", "masterCard", "amex"],
      total: { label: applePayConfig.merchantName || "Valedorsinho", amount: (amountMinor / 100).toFixed(2) },
    };
    const session = new window.ApplePaySession!(3, paymentRequest);
    log.event({ label: "Shopper opens Apple Pay sheet", from: "shopper", to: "merchant" });

    session.onvalidatemerchant = async (event) => {
      const reqBody = { validationURL: event.validationURL, merchantIdentifier: applePayConfig.merchantId, displayName: applePayConfig.merchantName, domainName: window.location.hostname };
      const id = log.begin({ label: "Validate merchant", method: "POST", endpoint: "/v71/applePay/sessions", request: reqBody });
      try {
        const data = await apiPost<{ merchantSession: unknown; requestBody: unknown; response: unknown }>("/api/checkout/apple-pay/validate-merchant", reqBody);
        log.ok(id, data.response);
        session.completeMerchantValidation(data.merchantSession);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Merchant validation failed.";
        log.err(id, { error: msg });
        setLoading(false);
        setResult({ status: "error", message: msg });
      }
    };

    session.onpaymentauthorized = async (event) => {
      log.event({ label: "Shopper authorises payment", from: "shopper", to: "merchant" });
      const applePayToken = btoa(JSON.stringify(event.payment.token.paymentData));
      const reqBody = { applePayToken, amountValue: amountMinor, currency: "MXN", countryCode: "MX", installmentCount: installments };
      const id = log.begin({
        label: "Create payment", method: "POST", endpoint: "/v71/payments",
        request: { ...reqBody, applePayToken: "<base64-encoded paymentData — redacted>" },
      });
      try {
        const data = await apiPost<{ requestBody: unknown; response: { resultCode?: string; pspReference?: string } }>("/api/checkout/apple-pay/payments", reqBody);
        log.ok(id, data.response);
        const resultCode = data.response.resultCode ?? "";
        const isSuccess = ["Authorised", "Pending", "Received"].includes(resultCode);
        session.completePayment(isSuccess ? window.ApplePaySession!.STATUS_SUCCESS : window.ApplePaySession!.STATUS_FAILURE);
        setResult({ status: isSuccess ? "success" : "error", resultCode, pspReference: data.response.pspReference });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Payment submission failed.";
        log.err(id, { error: msg });
        session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
        setResult({ status: "error", message: msg });
      } finally {
        setLoading(false);
      }
    };

    session.oncancel = () => setLoading(false);
    session.begin();
  }

  const isPreviewMode = applePayConfig?.isPreview === true;
  const canTriggerRealPayment = applePaySupported === true && !isPreviewMode;

  return (
    <div className="cb-main">
      <div className="cb-ap">
        <header className="cb-head">
          <div>
            <h1 className="cb-head__title">Apple Pay + MSI</h1>
            <p className="cb-head__sub">Meses Sin Intereses — a Mexico-market, API-only Apple Pay proof of concept. Calls post to the inspector on the right.</p>
          </div>
        </header>

        {applePaySupported === false && (
          <div className="cb-banner cb-banner--info" style={{ marginBottom: 16 }}>
            <AlertTriangle size={15} />
            <span>Non-Safari browser — the Apple Pay sheet needs Safari on macOS/iOS. Use <b>Preview Payloads</b> to inspect the full flow here.</span>
          </div>
        )}
        {configWarning && (
          <div className="cb-banner cb-banner--info" style={{ marginBottom: 16 }}>
            <AlertTriangle size={15} /><span>{configWarning}</span>
          </div>
        )}
        {configError && (
          <div className="cb-banner cb-banner--err" style={{ marginBottom: 16 }}>
            <XCircle size={15} /><span>{configError}</span>
          </div>
        )}

        <div className="cb-panel">
          <div className="cb-panel__hd"><h3>API-only flow</h3></div>
          <div className="cb-panel__bd">
            <ol className="cb-steplist">
              {FLOW_STEPS.map((s, i) => (
                <li key={i}>
                  <span className="cb-stepnum">{i + 1}</span>
                  <span>
                    <code>{s.label}</code>
                    <span className="cb-stepdesc">{s.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="cb-panel">
          <div className="cb-panel__hd"><h3>Configuration & payment</h3></div>
          <div className="cb-panel__bd cb-panel__bd--form">
            {applePayConfig && (
              <div className="cb-kv" style={{ marginBottom: 18 }}>
                <div>
                  <div className="cb-kv__k">Merchant ID</div>
                  <div className={`cb-kv__v ${isPreviewMode ? "cb-kv__v--ph" : ""}`}>{applePayConfig.merchantId}{isPreviewMode && " (placeholder)"}</div>
                </div>
                <div>
                  <div className="cb-kv__k">Display name</div>
                  <div className={`cb-kv__v ${isPreviewMode ? "cb-kv__v--ph" : ""}`}>{applePayConfig.merchantName}{isPreviewMode && " (placeholder)"}</div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="cb-kv__k">Accepted networks (credit only)</div>
                  <div className="cb-tags">
                    {applePayConfig.brands.map((b) => <span key={b} className="cb-pill">{b}</span>)}
                  </div>
                </div>
              </div>
            )}

            <div className="cb-field">
              <label htmlFor="ap-amount">Amount <span className="cb-field__hint">MXN</span></label>
              <div className="cb-amount">
                <span className="cb-amount__sym">$</span>
                <input id="ap-amount" type="number" min={0} step={0.01} value={amountMXN} onChange={(e) => setAmountMXN(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="cb-field">
              <label>Installments (MSI)</label>
              <div className="cb-msi">
                {MSI_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" className={installments === opt.value ? "is-on" : ""} onClick={() => setInstallments(opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <span className="cb-field__hint" style={{ display: "block", marginTop: 7 }}>
                Sent as <code>{`"installments": { "value": ${installments} }`}</code> in /payments.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {canTriggerRealPayment && (
                <button type="button" className="cb-applebtn" onClick={handleApplePay} disabled={loading || !applePayConfig}>
                  {loading ? <Loader2 size={18} className="cb-spin" /> : <Smartphone size={18} />}
                  {loading ? "Processing…" : "Pay with Apple Pay"}
                </button>
              )}
              <button type="button" className="cb-btn cb-btn--accent cb-btn--block" onClick={handlePreviewPayloads} disabled={!applePayConfig}>
                <Eye size={15} /> Preview payloads (steps 3 & 4)
              </button>
            </div>

            {result && (
              <div className={`cb-banner cb-banner--${result.status === "success" ? "ok" : "err"}`} style={{ marginTop: 16 }}>
                {result.status === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                <span>
                  {result.status === "success" ? "Payment authorised" : "Payment failed"}
                  {result.resultCode ? ` · ${result.resultCode}` : ""}
                  {result.pspReference ? ` · ${result.pspReference}` : ""}
                  {result.message ? ` · ${result.message}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="cb-panel">
          <div className="cb-panel__hd"><h3>Key PoC decisions</h3></div>
          <div className="cb-panel__bd">
            <ul className="cb-poc">
              <li><span className="cb-poc__b">·</span><span><b>Credit-only enforcement:</b> <code>merchantCapabilities: [&quot;supports3DS&quot;, &quot;supportsCredit&quot;]</code> — debit cards are excluded at the wallet level, not via BIN filtering (BINs are encrypted by Apple).</span></li>
              <li><span className="cb-poc__b">·</span><span><b>No /sessions endpoint:</b> this is an Advanced / API-only integration. The Apple Pay token flows directly to <code>/payments</code>.</span></li>
              <li><span className="cb-poc__b">·</span><span><b>MSI installments:</b> Adyen settles the full amount immediately; the issuing bank splits it at 0% interest for the shopper.</span></li>
              <li><span className="cb-poc__b">·</span><span><b>Token encoding:</b> <code>btoa(JSON.stringify(paymentData))</code> — the Apple Pay paymentData is base64-encoded and sent as <code>applePayToken</code>.</span></li>
              <li><span className="cb-poc__b">·</span><span><b>Merchant validation:</b> proxied through the backend to Adyen&apos;s <code>/applePay/sessions</code> — no Apple certificate management required.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
