"use client";

import { useState, useEffect, useCallback } from "react";
import { Smartphone, CheckCircle, XCircle, AlertTriangle, Loader2, Eye } from "lucide-react";
import PageHeader from "@/components/adyen/shared/PageHeader";
import ApiCallPanel from "@/components/adyen/shared/ApiCallPanel";
import type { ApiCallEntry } from "@/components/adyen/shared/ApiCallCard";
import { apiPost } from "@/lib/adyen/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApplePayConfig {
  merchantId: string;
  merchantName: string;
  brands: string[];
  /** true when config came from preview fallback (Apple Pay not in /paymentMethods) */
  isPreview?: boolean;
}

interface PaymentResult {
  status: "success" | "error";
  resultCode?: string;
  pspReference?: string;
  message?: string;
}

// Declare the Apple Pay types available in Safari
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

// ---------------------------------------------------------------------------
// MSI options
// ---------------------------------------------------------------------------

const MSI_OPTIONS = [
  { value: 3,  label: "3 meses" },
  { value: 6,  label: "6 meses" },
  { value: 9,  label: "9 meses" },
  { value: 12, label: "12 meses" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApplePayMsiPage() {
  const [applePaySupported, setApplePaySupported] = useState<boolean | null>(null);
  const [applePayConfig, setApplePayConfig] = useState<ApplePayConfig | null>(null);
  // configWarning = soft notice (Apple Pay not yet enabled in CA, page still functional)
  const [configWarning, setConfigWarning] = useState<string | null>(null);
  // configError = hard failure (API call failed entirely)
  const [configError, setConfigError] = useState<string | null>(null);

  const [amountMXN, setAmountMXN] = useState("1000.00");
  const [installments, setInstallments] = useState(3);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const [apiCalls, setApiCalls] = useState<ApiCallEntry[]>([]);

  function addApiCall(entry: ApiCallEntry) {
    setApiCalls((prev) => [...prev, entry]);
  }

  // -------------------------------------------------------------------------
  // Step 1: Fetch Apple Pay configuration via /paymentMethods
  // -------------------------------------------------------------------------
  const fetchApplePayConfig = useCallback(async () => {
    const t0 = Date.now();
    const requestBody = { countryCode: "MX", currency: "MXN" };
    try {
      const data = await apiPost<{
        requestBody: unknown;
        response: {
          paymentMethods?: Array<{
            type: string;
            name?: string;
            configuration?: { merchantId?: string; merchantName?: string };
            brands?: string[];
          }>;
        };
      }>("/api/checkout/apple-pay/payment-methods", requestBody);

      addApiCall({
        method: "POST",
        endpoint: "/v71/paymentMethods",
        direction: "merchant→adyen",
        statusCode: 200,
        latencyMs: Date.now() - t0,
        timestamp: now(),
        request: data.requestBody,
        response: data.response,
      });

      const applePayMethod = data.response.paymentMethods?.find((m) => m.type === "applepay");

      if (applePayMethod?.configuration) {
        // Real Apple Pay config returned — use live values
        setApplePayConfig({
          merchantId: applePayMethod.configuration.merchantId ?? "",
          merchantName: applePayMethod.configuration.merchantName ?? "",
          brands: applePayMethod.brands ?? ["visa", "masterCard", "amex"],
          isPreview: false,
        });
      } else {
        // Apple Pay not (yet) enabled in the Adyen Customer Area.
        // Fall into preview mode so the page is still fully navigable in any browser.
        setApplePayConfig({
          merchantId: "merchant.adyen.yourdomain",
          merchantName: "Your Store",
          brands: ["visa", "masterCard", "amex"],
          isPreview: true,
        });
        setConfigWarning(
          "applepay was not returned by /paymentMethods. " +
          "Make sure Apple Pay is enabled in the Adyen Customer Area and this domain is registered. " +
          "The page is in Preview Mode — all payloads are shown with placeholder values.",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load payment methods.";
      setConfigError(msg);
      addApiCall({
        method: "POST",
        endpoint: "/v71/paymentMethods",
        direction: "merchant→adyen",
        statusCode: 500,
        latencyMs: Date.now() - t0,
        timestamp: now(),
        request: requestBody,
        response: { error: msg },
      });
    }
  }, []);

  useEffect(() => {
    setApplePaySupported(
      typeof window !== "undefined" &&
        typeof window.ApplePaySession !== "undefined" &&
        window.ApplePaySession!.canMakePayments(),
    );
    fetchApplePayConfig();
  }, [fetchApplePayConfig]);

  // -------------------------------------------------------------------------
  // Preview Payloads — generates example API call entries for demo purposes.
  // Available in any browser / when Apple Pay is not configured.
  // -------------------------------------------------------------------------
  function handlePreviewPayloads() {
    const amountInMinorUnits = Math.round(parseFloat(amountMXN) * 100);
    const config = applePayConfig!;
    const domainName = typeof window !== "undefined" ? window.location.hostname : "yourdomain.com";

    addApiCall({
      method: "POST",
      endpoint: "/v71/applePay/sessions  [PREVIEW]",
      direction: "merchant→adyen",
      timestamp: now(),
      request: {
        merchantAccount: "<your merchant account>",
        displayName: config.merchantName,
        domainName,
        merchantIdentifier: config.merchantId,
      },
      response: {
        "epochTimestamp": 1234567890000,
        "expiresAt": 1234571490000,
        "merchantSessionIdentifier": "SSH1234ABCD…",
        "nonce": "a1b2c3d4",
        "merchantIdentifier": config.merchantId,
        "domainName": domainName,
        "displayName": config.merchantName,
        "signature": "<Apple-signed opaque blob — passed as-is to completeMerchantValidation()>",
      },
    });

    addApiCall({
      method: "POST",
      endpoint: "/v71/payments  [PREVIEW]",
      direction: "merchant→adyen",
      timestamp: now(),
      request: {
        merchantAccount: "<your merchant account>",
        paymentMethod: {
          type: "applepay",
          applePayToken: "<btoa(JSON.stringify(paymentData)) — base64-encoded Apple Pay token>",
        },
        amount: { value: amountInMinorUnits, currency: "MXN" },
        reference: `apple-pay-msi-<uuid>`,
        countryCode: "MX",
        channel: "Web",
        installments: { value: installments },
        returnUrl: `https://${domainName}/apple-pay-msi`,
      },
      response: {
        resultCode: "Authorised",
        pspReference: "ABCD1234567890EF",
        amount: { value: amountInMinorUnits, currency: "MXN" },
        merchantReference: "apple-pay-msi-<uuid>",
      },
    });
  }

  // -------------------------------------------------------------------------
  // Step 2 + 3: Trigger real Apple Pay session (Safari only)
  // -------------------------------------------------------------------------
  function handleApplePay() {
    if (!applePayConfig || !window.ApplePaySession) return;
    setLoading(true);
    setResult(null);

    const amountInMinorUnits = Math.round(parseFloat(amountMXN) * 100);

    const paymentRequest: ApplePayPaymentRequest = {
      countryCode: "MX",
      currencyCode: "MXN",
      // supportsCredit restricts the wallet to credit cards only —
      // required for MSI (Meses Sin Intereses) since debit cards are ineligible.
      // supports3DS is always required by Apple Pay.
      merchantCapabilities: ["supports3DS", "supportsCredit"],
      supportedNetworks: ["visa", "masterCard", "amex"],
      total: {
        label: applePayConfig.merchantName || "Valedorsinho",
        amount: (amountInMinorUnits / 100).toFixed(2),
      },
    };

    const session = new window.ApplePaySession!(3, paymentRequest);

    // -----------------------------------------------------------------------
    // onvalidatemerchant — proxy to backend → Adyen /applePay/sessions
    // -----------------------------------------------------------------------
    session.onvalidatemerchant = async (event) => {
      const t0 = Date.now();
      const reqBody = {
        validationURL: event.validationURL,
        merchantIdentifier: applePayConfig.merchantId,
        displayName: applePayConfig.merchantName,
        domainName: window.location.hostname,
      };

      try {
        const data = await apiPost<{ merchantSession: unknown; requestBody: unknown; response: unknown }>(
          "/api/checkout/apple-pay/validate-merchant",
          reqBody,
        );

        addApiCall({
          method: "POST",
          endpoint: "/v71/applePay/sessions",
          direction: "merchant→adyen",
          statusCode: 200,
          latencyMs: Date.now() - t0,
          timestamp: now(),
          request: data.requestBody,
          response: data.response,
          extra: {
            label: "Merchant Session (opaque)",
            note: "This object is passed directly to completeMerchantValidation() — never inspect or modify it.",
            data: data.merchantSession,
          },
        });

        session.completeMerchantValidation(data.merchantSession);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Merchant validation failed.";
        addApiCall({
          method: "POST",
          endpoint: "/v71/applePay/sessions",
          direction: "merchant→adyen",
          statusCode: 500,
          latencyMs: Date.now() - t0,
          timestamp: now(),
          request: reqBody,
          response: { error: msg },
        });
        setLoading(false);
        setResult({ status: "error", message: msg });
      }
    };

    // -----------------------------------------------------------------------
    // onpaymentauthorized — tokenise & POST to backend → Adyen /payments
    // -----------------------------------------------------------------------
    session.onpaymentauthorized = async (event) => {
      const t0 = Date.now();
      const paymentData = event.payment.token.paymentData;

      // Apple Pay token encoding:
      // 1. JSON.stringify the entire paymentData object.
      // 2. btoa() (base64-encode) the resulting string.
      const applePayToken = btoa(JSON.stringify(paymentData));

      const reqBody = {
        applePayToken,
        amountValue: Math.round(parseFloat(amountMXN) * 100),
        currency: "MXN",
        countryCode: "MX",
        installmentCount: installments,
      };

      try {
        const data = await apiPost<{
          requestBody: unknown;
          response: { resultCode?: string; pspReference?: string };
        }>("/api/checkout/apple-pay/payments", reqBody);

        addApiCall({
          method: "POST",
          endpoint: "/v71/payments",
          direction: "merchant→adyen",
          statusCode: 200,
          latencyMs: Date.now() - t0,
          timestamp: now(),
          request: {
            ...(data.requestBody as Record<string, unknown>),
            // Redact the full token for readability.
            paymentMethod: {
              type: "applepay",
              applePayToken: "<base64-encoded paymentData — redacted for display>",
            },
          },
          response: data.response,
        });

        const resultCode = data.response.resultCode ?? "";
        const isSuccess = ["Authorised", "Pending", "Received"].includes(resultCode);

        session.completePayment(
          isSuccess
            ? window.ApplePaySession!.STATUS_SUCCESS
            : window.ApplePaySession!.STATUS_FAILURE,
        );

        setResult({
          status: isSuccess ? "success" : "error",
          resultCode,
          pspReference: data.response.pspReference,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Payment submission failed.";
        addApiCall({
          method: "POST",
          endpoint: "/v71/payments",
          direction: "merchant→adyen",
          statusCode: 500,
          latencyMs: Date.now() - t0,
          timestamp: now(),
          request: {
            ...reqBody,
            applePayToken: "<base64-encoded paymentData — redacted for display>",
          },
          response: { error: msg },
        });
        session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
        setResult({ status: "error", message: msg });
      } finally {
        setLoading(false);
      }
    };

    session.oncancel = () => {
      setLoading(false);
    };

    session.begin();
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isPreviewMode = applePayConfig?.isPreview === true;
  const canTriggerRealPayment = applePaySupported === true && !isPreviewMode;

  return (
    <div className="w-full max-w-[720px]">
      <PageHeader
        title="Apple Pay + MSI"
        subtitle="Meses Sin Intereses — Mexico market PoC"
        backHref="/"
        backLabel="Dashboard"
      />

      {/* Non-Safari browser notice */}
      {applePaySupported === false && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Non-Safari browser — Preview Mode active</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              The Apple Pay payment sheet requires Safari on macOS or iOS. Use the <span className="font-semibold">Preview Payloads</span> button below to generate example API call entries and inspect the full flow in any browser.
            </p>
          </div>
        </div>
      )}

      {/* Soft warning: Apple Pay not in /paymentMethods (CA config needed) */}
      {configWarning && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Apple Pay not yet configured — Preview Mode</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{configWarning}</p>
          </div>
        </div>
      )}

      {/* Hard error: API call itself failed */}
      {configError && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 px-4 py-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">API error</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{configError}</p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">

        {/* Flow overview */}
        <div className="border-b border-gray-100 dark:border-slate-700 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-3">API-Only Flow</h2>
          <ol className="flex flex-col gap-1.5">
            {[
              { step: 1, label: "POST /paymentMethods", desc: "Fetch Apple Pay merchantId + merchantName for MX/MXN" },
              { step: 2, label: "ApplePaySession.begin()", desc: "Initialise session with supportsCredit + credit networks only" },
              { step: 3, label: "POST /applePay/sessions", desc: "Backend proxies merchant validation to Adyen (onvalidatemerchant)" },
              { step: 4, label: "POST /payments", desc: "Submit token with installments.value for MSI (onpaymentauthorized)" },
            ].map(({ step, label, desc }) => (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00d4ff]/20 dark:bg-[#00d4ff]/10 text-[#00d4ff] text-[0.7rem] font-bold flex items-center justify-center border border-[#00d4ff]/30">
                  {step}
                </span>
                <span>
                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-slate-200">{label}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">{desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Apple Pay config info */}
        {applePayConfig ? (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[0.68rem] font-semibold uppercase tracking-widest text-gray-400">Merchant ID</dt>
              <dd className={`font-mono text-xs break-all mt-0.5 ${isPreviewMode ? "text-amber-600 dark:text-amber-400 italic" : "text-gray-800 dark:text-slate-200"}`}>
                {applePayConfig.merchantId}
                {isPreviewMode && <span className="ml-1 not-italic">(placeholder)</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[0.68rem] font-semibold uppercase tracking-widest text-gray-400">Display Name</dt>
              <dd className={`font-mono text-xs mt-0.5 ${isPreviewMode ? "text-amber-600 dark:text-amber-400 italic" : "text-gray-800 dark:text-slate-200"}`}>
                {applePayConfig.merchantName}
                {isPreviewMode && <span className="ml-1 not-italic">(placeholder)</span>}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[0.68rem] font-semibold uppercase tracking-widest text-gray-400">Accepted networks (credit only)</dt>
              <dd className="flex gap-1.5 mt-1 flex-wrap">
                {applePayConfig.brands.map((b) => (
                  <span key={b} className="inline-flex items-center px-2 py-0.5 rounded text-[0.67rem] font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                    {b}
                  </span>
                ))}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.67rem] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                  supportsCredit only
                </span>
              </dd>
            </div>
          </div>
        ) : !configError ? (
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading payment methods…</span>
          </div>
        ) : null}

        {/* Payment form */}
        <div className="px-6 py-6 flex flex-col gap-5">
          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-400">
              Amount (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amountMXN}
                onChange={(e) => setAmountMXN(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/40"
              />
            </div>
            <p className="text-[0.7rem] text-gray-400">
              Sent to Adyen as <span className="font-mono">{Math.round(parseFloat(amountMXN || "0") * 100)}</span> minor units (centavos)
            </p>
          </div>

          {/* Installments */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-400">
              Meses Sin Intereses (installments.value)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MSI_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setInstallments(opt.value)}
                  className={`py-2.5 rounded-lg border-2 text-sm font-bold transition-all duration-150 ${
                    installments === opt.value
                      ? "border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]"
                      : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-[#00d4ff]/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[0.7rem] text-gray-400">
              Will be sent as <span className="font-mono">{`"installments": { "value": ${installments} }`}</span> in the /payments request
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {/* Real Apple Pay button — Safari + real config only */}
            {canTriggerRealPayment && (
              <button
                type="button"
                onClick={handleApplePay}
                disabled={loading || !applePayConfig}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-black hover:bg-gray-900 active:bg-gray-800 text-white font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Smartphone className="w-5 h-5" />
                )}
                {loading ? "Processing…" : "Pay with Apple Pay"}
              </button>
            )}

            {/* Preview Payloads button — always available */}
            {applePayConfig && (
              <button
                type="button"
                onClick={handlePreviewPayloads}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#00d4ff]/40 hover:border-[#00d4ff] bg-[#00d4ff]/5 hover:bg-[#00d4ff]/10 text-[#00d4ff] font-semibold text-sm transition-all duration-150"
              >
                <Eye className="w-4 h-4" />
                Preview Payloads (steps 3 &amp; 4)
              </button>
            )}

            {/* Placeholder when neither is available yet */}
            {!applePayConfig && !configError && (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-600 p-5 text-center">
                <Loader2 className="w-6 h-6 text-gray-300 dark:text-slate-600 mx-auto mb-2 animate-spin" />
                <p className="text-xs text-gray-400 dark:text-slate-500">Loading…</p>
              </div>
            )}
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div className={`px-6 py-4 border-t ${result.status === "success" ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"}`}>
            <div className="flex items-start gap-3">
              {result.status === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${result.status === "success" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {result.status === "success" ? "Payment authorised" : "Payment failed"}
                </p>
                {result.resultCode && (
                  <p className="text-xs mt-0.5 text-gray-600 dark:text-slate-300">
                    <span className="font-semibold">resultCode:</span> {result.resultCode}
                    {result.pspReference && (
                      <> &nbsp;·&nbsp; <span className="font-semibold">pspReference:</span> {result.pspReference}</>
                    )}
                  </p>
                )}
                {result.message && (
                  <p className="text-xs mt-0.5 text-red-600 dark:text-red-400">{result.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payload explanation */}
      <div className="mt-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-3">Key PoC Decisions</h3>
        <ul className="flex flex-col gap-2 text-xs text-gray-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#00d4ff] shrink-0">·</span>
            <span><span className="font-semibold text-gray-700 dark:text-slate-300">Credit-only enforcement:</span> <code className="font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded">merchantCapabilities: [&#34;supports3DS&#34;, &#34;supportsCredit&#34;]</code> — debit cards are excluded at the wallet level, not via BIN filtering (BINs are encrypted by Apple before tokenisation).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#00d4ff] shrink-0">·</span>
            <span><span className="font-semibold text-gray-700 dark:text-slate-300">No /sessions endpoint:</span> This is an Advanced / API-only integration. The Apple Pay token flows directly to <code className="font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded">/payments</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#00d4ff] shrink-0">·</span>
            <span><span className="font-semibold text-gray-700 dark:text-slate-300">MSI installments:</span> Adyen settles the full amount immediately; the issuing bank handles the installment split at 0% interest for the shopper.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#00d4ff] shrink-0">·</span>
            <span><span className="font-semibold text-gray-700 dark:text-slate-300">Token encoding:</span> <code className="font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded">btoa(JSON.stringify(paymentData))</code> — the entire Apple Pay paymentData JSON is stringified and base64-encoded before sending to Adyen as <code className="font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded">applePayToken</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-[#00d4ff] shrink-0">·</span>
            <span><span className="font-semibold text-gray-700 dark:text-slate-300">Adyen certificate:</span> Merchant validation is proxied through your backend to Adyen&#39;s <code className="font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded">/applePay/sessions</code>. No Apple certificate management required.</span>
          </li>
        </ul>
      </div>

      {/* API call side panel */}
      <ApiCallPanel side="right" calls={apiCalls} />
    </div>
  );
}
