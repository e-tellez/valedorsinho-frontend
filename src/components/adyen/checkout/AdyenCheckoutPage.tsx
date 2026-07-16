"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { useAdyen } from "@/hooks/adyen/useAdyen";
import { apiGet, apiPost } from "@/lib/adyen/api";
import StepIndicator from "@/components/adyen/checkout/StepIndicator";
import PreviewCard, { syntaxHighlight } from "@/components/adyen/shared/PreviewCard";
import PageHeader from "@/components/adyen/shared/PageHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdyenCheckoutPageProps {
  product: "dropin" | "components";
  flow: "Advanced" | "Sessions";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdyenCheckoutPage({ product, flow }: AdyenCheckoutPageProps) {
  const router = useRouter();
  const { state } = useCheckout();
  const { config, ready: adyenLoaded, error: sdkError } = useAdyen();

  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const [previewLeft, setPreviewLeft] = useState<{ title: string; html: string } | null>(null);
  const [previewRight, setPreviewRight] = useState<{ title: string; html: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const displayAmount = (state.amountMinorUnits / 100).toFixed(2);
  const isDropin = product === "dropin";
  const isAdvanced = flow === "Advanced";

  // -----------------------------------------------------------------------
  // handleFinalResult — redirect to result page
  // -----------------------------------------------------------------------
  function handleFinalResult(resultCode: string, response: Record<string, unknown>) {
    const status = ["Authorised", "Pending", "Received"].includes(resultCode)
      ? "success"
      : "failure";

    try {
      sessionStorage.setItem("adyen_result", JSON.stringify(response));
    } catch {}

    const params = new URLSearchParams({
      status,
      resultCode,
      pspReference: (response?.pspReference as string) || "",
      integrationType: state.integrationType,
    });
    router.push(`/checkout/result?${params.toString()}`);
  }

  // -----------------------------------------------------------------------
  // handleServerResponse
  // -----------------------------------------------------------------------
  function handleServerResponse(response: Record<string, unknown>, component: any) {
    if (response.action) {
      component.handleAction(response.action);
    } else {
      handleFinalResult(response.resultCode as string, response);
    }
  }

  // -----------------------------------------------------------------------
  // Mount Adyen SDK
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (sdkError) setError(sdkError);
  }, [sdkError]);

  useEffect(() => {
    if (!adyenLoaded || !config || mountedRef.current) return;
    if (!containerRef.current) return;

    mountedRef.current = true;

    const initCheckout = async () => {
      try {
        const AdyenCheckout = (window as any).AdyenCheckout;
        if (!AdyenCheckout) { setError("Adyen SDK not loaded."); return; }

        const isDark = document.documentElement.classList.contains("dark");
        const adyenCardStyles = isDark
          ? { base: { color: "#f1f5f9", caretColor: "#f1f5f9" }, placeholder: { color: "#64748b" }, error: { color: "#fca5a5" } }
          : {};

        // --- Fetch flow-specific data and build flowConfig ---
        let flowConfig: Record<string, unknown>;

        if (isAdvanced) {
          const params = new URLSearchParams({ countryCode: state.countryCode, currency: state.currency });
          if (state.shopperReference) params.set("shopperReference", state.shopperReference);

          const pmData = await apiGet<{ response: any; requestBody: any }>(`/api/checkout/payment-methods?${params.toString()}`);
          setPreviewLeft({ title: "/paymentMethods request body", html: syntaxHighlight(pmData.requestBody) });
          setPreviewRight({ title: "/paymentMethods response", html: syntaxHighlight(pmData.response) });

          flowConfig = {
            paymentMethodsResponse: pmData.response,
            onSubmit: async (sdkState: any, component: any) => {
              if (isDropin) component.setStatus("loading");
              try {
                const result = await apiPost<any>("/api/checkout/payments", {
                  ...sdkState.data,
                  amountValue: state.amountMinorUnits,
                  currency: state.currency,
                  countryCode: state.countryCode,
                  shopperReference: state.shopperReference || undefined,
                  isGuest: state.isGuest,
                  returnUrl: `${window.location.origin}/checkout/redirect`,
                  origin: window.location.origin,
                });
                handleServerResponse(result, component);
              } catch (err: any) {
                console.error("onSubmit error:", err);
                if (isDropin) component.setStatus("error", { message: err.message || "Payment failed." });
              }
            },
            onAdditionalDetails: async (sdkState: any, component: any) => {
              setWaiting(true);
              if (isDropin) component.setStatus("loading");
              try {
                const result = await apiPost<any>("/api/checkout/payments/details", sdkState.data);
                handleServerResponse(result, component);
              } catch (err: any) {
                console.error("onAdditionalDetails error:", err);
                setWaiting(false);
                if (isDropin) {
                  component.setStatus("error", { message: "Authentication failed." });
                }
              }
            },
          };
        } else {
          const sessionData = await apiPost<{ response: any; requestBody: any }>("/api/checkout/sessions", {
            amountValue: state.amountMinorUnits,
            currency: state.currency,
            countryCode: state.countryCode,
            shopperReference: state.shopperReference || undefined,
            isGuest: state.isGuest,
            returnUrl: `${window.location.origin}/checkout/sessions/redirect`,
          });
          setPreviewLeft({ title: "/sessions request body", html: syntaxHighlight(sessionData.requestBody) });
          setPreviewRight({ title: "/sessions response", html: syntaxHighlight(sessionData.response) });

          flowConfig = {
            session: { id: sessionData.response.id, sessionData: sessionData.response.sessionData },
          };
        }

        // --- Build and instantiate checkout ---
        const checkout = await AdyenCheckout({
          clientKey: config.clientKey,
          environment: config.environment,
          locale: "en-US",
          analytics: { enabled: true },
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
          onPaymentCompleted: (result: any) => handleFinalResult(result.resultCode, result),
          onError: (err: any) => console.error("Adyen error:", err),
          ...flowConfig,
        });

        // --- Mount component ---
        if (isDropin) {
          checkout.create("dropin", {
            showStoredPaymentMethods: !state.isGuest,
            openFirstPaymentMethod: true,
          }).mount(containerRef.current);
        } else {
          const cardComponent = checkout.create("card", {
            hasHolderName: true,
            holderNameRequired: true,
            billingAddressRequired: false,
            enableStoreDetails: !state.isGuest,
            styles: adyenCardStyles,
          }).mount(containerRef.current);

          const payButton = document.getElementById("pay-button");
          if (payButton) payButton.addEventListener("click", () => cardComponent.submit());
        }
      } catch (err: any) {
        console.error("Checkout initialisation failed:", err);
        setError("Could not load payment form. Please refresh the page.");
      }
    };

    initCheckout();
  }, [adyenLoaded, config]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="w-full max-w-[1200px]">
      <PageHeader
        title="Complete Your Order"
        subtitle={`${isDropin ? "Drop-in" : "Components"} • ${flow} Flow`}
        backHref="/checkout/select-integration"
        backLabel="Back"
      />

      <div className="flex gap-6 items-start">
        {/* Main checkout panel */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 w-full max-w-[720px] shrink-0">
          <StepIndicator currentStep={4} />

        {/* Order summary */}
        <div className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-4 py-3 mb-6 text-sm text-gray-600 dark:text-slate-300">
          <strong className="text-gray-900 dark:text-white">Order total:</strong> {state.currency} {displayAmount}
          <br />
          <strong className="text-gray-900 dark:text-white">Shopper:</strong> {state.shopperReference || "Guest"}
        </div>

        {/* Adyen container */}
        {error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : (
          <>
            {waiting && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-slate-600 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Processing your payment…</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">Please wait, do not close this page</p>
              </div>
            )}
            <div ref={containerRef} className={waiting ? "hidden" : "min-h-[100px]"} />
          </>
        )}

        {/* External pay button for Components */}
        {!isDropin && !error && !waiting && (
          <button id="pay-button" className="btn-primary w-full max-w-[320px] mx-auto block h-11! mt-4">
            Pay {state.currency} {displayAmount}
          </button>
        )}
      </div>

      {/* API sidebar */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 sticky top-10 max-h-[calc(100vh-80px)] overflow-y-auto">
        {previewLeft && (
          <PreviewCard title={previewLeft.title} contentId="preview-left" initialHtml={previewLeft.html} />
        )}
        {previewRight && (
          <PreviewCard title={previewRight.title} contentId="preview-right" initialHtml={previewRight.html} />
        )}
      </div>
      </div>
    </div>
  );
}
