"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { localeForCountry } from "@/lib/adyen/constants";
import { useAdyen } from "@/hooks/adyen/useAdyen";
import { apiGet, apiPost } from "@/lib/adyen/api";
import type {
  CreatePaymentBody,
  CreateSessionBody,
  PaymentDetailsBody,
  PaymentMethodsResponse,
  SessionsResponse,
} from "@/lib/adyen/types";
import { useCallLogger } from "../../../shell/useCallLogger";
import type { Selection } from "./IntegrationStep";
import type { CheckoutResult } from "./ResultStep";
import type { Personalization } from "./PersonalizeStep";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function PayStep({
  selection,
  personalization,
  onBack,
  onResult,
}: {
  selection: Selection;
  personalization: Personalization;
  onBack: () => void;
  onResult: (r: CheckoutResult) => void;
}) {
  const { state } = useCheckout();
  const { config, ready: adyenLoaded, error: sdkError } = useAdyen();
  const log = useCallLogger();

  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const componentRef = useRef<Any>(null);

  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const displayAmount = (state.amountMinorUnits / 100).toFixed(2);
  const isDropin = selection.product === "dropin";
  const isAdvanced = selection.flow === "Advanced";
  const shopperLocale = personalization.shopperLocale || localeForCountry(state.countryCode);
  const shopperEmail = personalization.shopperEmail.trim() || undefined;

  function finish(resultCode: string, response: Record<string, unknown>) {
    const status = ["Authorised", "Pending", "Received"].includes(resultCode) ? "success" : "failure";
    onResult({
      status,
      resultCode,
      pspReference: (response?.pspReference as string) || "",
      integrationType: state.integrationType,
    });
  }

  function handleServerResponse(response: Record<string, unknown>, component: Any) {
    if (response.action) {
      log.event({ label: "3DS authentication", from: "shopper", to: "adyen" });
      component.handleAction(response.action);
    } else {
      finish(response.resultCode as string, response);
    }
  }

  useEffect(() => {
    if (sdkError) setError(sdkError);
  }, [sdkError]);

  useEffect(() => {
    if (!adyenLoaded || !config || mountedRef.current || !containerRef.current) return;
    mountedRef.current = true;

    const initCheckout = async () => {
      try {
        const AdyenCheckout = (window as Any).AdyenCheckout;
        if (!AdyenCheckout) { setError("Adyen SDK not loaded."); return; }

        const isDark = document.documentElement.classList.contains("dark");
        const adyenCardStyles = isDark
          ? { base: { color: "#f1f5f9", caretColor: "#f1f5f9" }, placeholder: { color: "#64748b" }, error: { color: "#fca5a5" } }
          : {};

        let flowConfig: Record<string, unknown>;

        if (isAdvanced) {
          const params = new URLSearchParams({ countryCode: state.countryCode, currency: state.currency, shopperLocale });
          if (state.shopperReference) params.set("shopperReference", state.shopperReference);

          const pmId = log.begin({ label: "List payment methods", method: "POST", endpoint: "/v71/paymentMethods" });
          const pmData = await apiGet<PaymentMethodsResponse>(`/api/checkout/payment-methods?${params.toString()}`);
          log.ok(pmId, pmData.response);

          flowConfig = {
            paymentMethodsResponse: pmData.response,
            onSubmit: async (sdkState: Any, component: Any) => {
              if (isDropin) component.setStatus("loading");
              log.event({ label: "Shopper submits payment", from: "shopper", to: "merchant" });
              const body: CreatePaymentBody = {
                ...sdkState.data,
                amountValue: state.amountMinorUnits,
                currency: state.currency,
                countryCode: state.countryCode,
                shopperReference: state.shopperReference || undefined,
                isGuest: state.isGuest,
                shopperEmail,
                returnUrl: `${window.location.origin}/psp/checkout`,
                origin: window.location.origin,
              };
              const id = log.begin({ label: "Create payment", method: "POST", endpoint: "/v71/payments", request: body });
              try {
                const result = await apiPost<Record<string, unknown>>("/api/checkout/payments", body);
                log.ok(id, result);
                handleServerResponse(result, component);
              } catch (err: Any) {
                log.err(id, { error: err.message });
                if (isDropin) component.setStatus("error", { message: err.message || "Payment failed." });
              }
            },
            onAdditionalDetails: async (sdkState: Any, component: Any) => {
              setWaiting(true);
              if (isDropin) component.setStatus("loading");
              const body: PaymentDetailsBody = sdkState.data;
              const id = log.begin({ label: "Submit 3DS details", method: "POST", endpoint: "/v71/payments/details", request: body });
              try {
                const result = await apiPost<Record<string, unknown>>("/api/checkout/payments/details", body);
                log.ok(id, result);
                handleServerResponse(result, component);
              } catch (err: Any) {
                setWaiting(false);
                log.err(id, { error: err.message });
                if (isDropin) component.setStatus("error", { message: "Authentication failed." });
              }
            },
          };
        } else {
          const sessionBody: CreateSessionBody = {
            amountValue: state.amountMinorUnits,
            currency: state.currency,
            countryCode: state.countryCode,
            shopperReference: state.shopperReference || undefined,
            isGuest: state.isGuest,
            shopperEmail,
            shopperLocale,
            returnUrl: `${window.location.origin}/psp/checkout`,
          };
          const id = log.begin({ label: "Create session", method: "POST", endpoint: "/v71/sessions", request: sessionBody });
          const sessionData = await apiPost<SessionsResponse>("/api/checkout/sessions", sessionBody);
          log.ok(id, sessionData.response);

          flowConfig = {
            session: { id: sessionData.response.id, sessionData: sessionData.response.sessionData },
          };
        }

        const checkout = await AdyenCheckout({
          clientKey: config.clientKey,
          environment: config.environment,
          locale: shopperLocale,
          analytics: { enabled: false },
          threeDS2Configuration: { challengeWindowSize: "03" },
          ...(isDropin && {
            paymentMethodsConfiguration: {
              card: {
                hasHolderName: true,
                holderNameRequired: true,
                billingAddressRequired: false,
                enableStoreDetails: !state.isGuest,
                styles: adyenCardStyles,
              },
              storedCard: { styles: adyenCardStyles },
            },
          }),
          onPaymentCompleted: (result: Any) => finish(result.resultCode, result),
          onError: (err: Any) => console.error("Adyen error:", err),
          ...flowConfig,
        });

        if (isDropin) {
          componentRef.current = checkout
            .create("dropin", { showStoredPaymentMethods: !state.isGuest, openFirstPaymentMethod: true })
            .mount(containerRef.current);
        } else {
          const cardComponent = checkout
            .create("card", {
              hasHolderName: true,
              holderNameRequired: true,
              billingAddressRequired: false,
              enableStoreDetails: !state.isGuest,
              styles: adyenCardStyles,
            })
            .mount(containerRef.current);
          componentRef.current = cardComponent;

          const payButton = document.getElementById("cb-pay-button");
          if (payButton) payButton.addEventListener("click", () => cardComponent.submit());
        }
      } catch (err: Any) {
        console.error("Checkout initialisation failed:", err);
        setError("Could not load payment form. Please refresh the page.");
      }
    };

    initCheckout();

    return () => {
      if (componentRef.current) {
        try { componentRef.current.unmount(); } catch { /* noop */ }
        componentRef.current = null;
      }
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adyenLoaded, config]);

  return (
    <div>
      <h2 className="cb-ck__q">Complete your order</h2>
      <p className="cb-ck__qsub">{isDropin ? "Drop-in" : "Components"} · {selection.flow} flow</p>

      <div className="cb-ordsum">
        <span><b>Order total:</b> {state.currency} {displayAmount}</span>
        <span><b>Shopper:</b> {state.shopperReference || "Guest"}</span>
      </div>

      <div className="cb-panel">
        <div className="cb-panel__bd">
          {error ? (
            <div className="cb-banner cb-banner--err"><span>{error}</span></div>
          ) : (
            <>
              {waiting && (
                <div className="cb-adyen-wait">
                  <Loader2 size={26} className="cb-spin" />
                  <p>Processing your payment…</p>
                  <small>Please wait, do not close this page</small>
                </div>
              )}
              <div ref={containerRef} className={waiting ? "" : "cb-adyen-mount"} style={waiting ? { display: "none" } : undefined} />
            </>
          )}

          {!isDropin && !error && !waiting && (
            <button id="cb-pay-button" className="cb-btn cb-btn--accent cb-btn--block" style={{ marginTop: 16 }}>
              Pay {state.currency} {displayAmount}
            </button>
          )}
        </div>
      </div>

      <div className="cb-ck__actions">
        <button className="cb-btn cb-btn--pull-left" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
