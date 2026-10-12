"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { useAdyen } from "@/hooks/adyen/useAdyen";
import { apiGet, apiPost } from "@/lib/adyen/api";
import type { DisableStoredMethodBody } from "@/lib/adyen/types";
import { managePaymentsTranslations } from "@/lib/adyen/translations";
import { useCallLogger } from "../../../shell/useCallLogger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function ManageCardsStep({ onBack }: { onBack: () => void }) {
  const { state } = useCheckout();
  const { config, ready: adyenLoaded } = useAdyen();
  const log = useCallLogger();

  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const dropinRef = useRef<Any>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shopperReference = state.shopperReference;

  useEffect(() => {
    if (!adyenLoaded || !config || !shopperReference || mountedRef.current || !containerRef.current) return;
    mountedRef.current = true;
    let cancelled = false;

    const init = async () => {
      try {
        const AdyenCheckout = (window as Any).AdyenCheckout;
        if (!AdyenCheckout) { setError("Adyen SDK not loaded."); return; }

        const isDark = document.documentElement.classList.contains("dark");
        const adyenCardStyles = isDark
          ? { base: { color: "#f1f5f9", caretColor: "#f1f5f9" }, placeholder: { color: "#64748b" }, error: { color: "#fca5a5" } }
          : {};

        const pmRequest = { countryCode: state.countryCode, currency: state.currency, shopperReference };
        const pmId = log.begin({ label: "List stored cards", method: "POST", endpoint: "/v71/paymentMethods", request: pmRequest });
        let pmData: Any;
        try {
          pmData = await apiGet<Any>("/api/checkout/payment-methods", pmRequest);
          log.ok(pmId, pmData.response);
        } catch (pmErr: Any) {
          log.err(pmId, { error: pmErr.message });
          throw pmErr;
        }
        if (cancelled) return;

        // Only card-based methods can be stored — Google Pay, wallets, etc. don't belong here.
        const cardOnlyResponse = {
          ...pmData.response,
          paymentMethods: (pmData.response.paymentMethods ?? []).filter((pm: Any) => pm.type === "scheme"),
        };

        const checkout = await AdyenCheckout({
          clientKey: config.clientKey,
          environment: config.environment,
          paymentMethodsResponse: cardOnlyResponse,
          locale: "en-US",
          translations: managePaymentsTranslations,
          analytics: { enabled: false },
          threeDS2Configuration: { challengeWindowSize: "03" },
          paymentMethodsConfiguration: {
            card: {
              hasHolderName: true,
              holderNameRequired: true,
              billingAddressRequired: false,
              enableStoreDetails: false,
              styles: adyenCardStyles,
            },
            storedCard: { showPayButton: false, hideCVC: true },
          },
          onSubmit: async (sdkState: Any, component: Any) => {
            component.setStatus("loading");
            const body = {
              ...sdkState.data,
              amountValue: 0,
              currency: state.currency,
              countryCode: state.countryCode,
              shopperReference,
              isGuest: false,
              storePaymentMethod: true,
              returnUrl: `${window.location.origin}/psp/checkout`,
              origin: window.location.origin,
            };
            log.event({ label: "Shopper adds a card", from: "shopper", to: "merchant" });
            const id = log.begin({ label: "Store card", method: "POST", endpoint: "/v71/payments", request: body });
            try {
              const result = await apiPost<Any>("/api/checkout/payments", body);
              log.ok(id, result);
              if (result.action) {
                component.handleAction(result.action);
              } else if (["Authorised", "Received"].includes(result.resultCode)) {
                setStatus({ msg: "Card saved successfully.", type: "ok" });
                setRefreshKey((k) => k + 1);
              } else {
                component.setStatus("error", { message: "Could not save card." });
              }
            } catch (err: Any) {
              log.err(id, { error: err.message });
              component.setStatus("error", { message: err.message || "Request failed." });
            }
          },
          onAdditionalDetails: async (sdkState: Any, component: Any) => {
            component.setStatus("loading");
            const id = log.begin({ label: "Submit 3DS details", method: "POST", endpoint: "/v71/payments/details", request: sdkState.data });
            try {
              const result = await apiPost<Any>("/api/checkout/payments/details", sdkState.data);
              log.ok(id, result);
              if (["Authorised", "Received"].includes(result.resultCode)) {
                setStatus({ msg: "Card saved.", type: "ok" });
                setRefreshKey((k) => k + 1);
              } else {
                component.setStatus("error", { message: "Could not save card." });
              }
            } catch (err: Any) {
              log.err(id, { error: err.message });
              component.setStatus("error", { message: err.message });
            }
          },
          onError: (err: Any) => console.error(err),
        });

        dropinRef.current = checkout
          .create("dropin", {
            showStoredPaymentMethods: true,
            showRemovePaymentMethodButton: true,
            openFirstPaymentMethod: true,
            onDisableStoredPaymentMethod: async (storedPaymentMethodId: string, resolve: () => void, reject: () => void) => {
              const body: DisableStoredMethodBody = { shopperReference, storedPaymentMethodId };
              const id = log.begin({ label: "Remove stored card", method: "DELETE", endpoint: "/v71/storedPaymentMethods", request: body });
              try {
                const result = await apiPost<Any>("/api/checkout/disable", body);
                log.ok(id, result);
                resolve();
                setStatus({ msg: "Card removed.", type: "ok" });
                setRefreshKey((k) => k + 1);
              } catch (err: Any) {
                log.err(id, { error: err.message });
                setStatus({ msg: "Could not remove card: " + err.message, type: "err" });
                reject();
              }
            },
          })
          .mount(containerRef.current!);
      } catch {
        setError("Could not load payment form.");
      }
    };

    init();

    return () => {
      cancelled = true;
      if (dropinRef.current) {
        try { dropinRef.current.unmount(); } catch { /* noop */ }
        dropinRef.current = null;
      }
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adyenLoaded, config, shopperReference, refreshKey]);

  return (
    <div>
      <h2 className="cb-ck__q">Manage cards</h2>
      <p className="cb-ck__qsub">Shopper: {shopperReference || "—"}</p>

      {status && (
        <div className={`cb-banner cb-banner--${status.type}`} style={{ marginBottom: 16 }}>
          {status.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{status.msg}</span>
        </div>
      )}

      <div className="cb-panel">
        <div className="cb-panel__bd">
          {error ? (
            <div className="cb-banner cb-banner--err"><span>{error}</span></div>
          ) : (
            <div ref={containerRef} className="cb-adyen-mount" />
          )}
        </div>
      </div>

      <div className="cb-ck__actions">
        <button className="cb-btn cb-btn--pull-left" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
