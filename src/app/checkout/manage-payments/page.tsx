"use client";

import { useEffect, useRef, useState } from "react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { useAdyen } from "@/hooks/adyen/useAdyen";
import { apiGet, apiPost } from "@/lib/adyen/api";
import PageHeader from "@/components/adyen/shared/PageHeader";
import StatusBanner from "@/components/adyen/shared/StatusBanner";
import { managePaymentsTranslations } from "@/lib/adyen/translations";

export default function ManagePaymentsPage() {
  const { state } = useCheckout();
  const { config, ready: adyenLoaded } = useAdyen();

  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const dropinRef = useRef<any>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shopperReference = state.shopperReference;

  useEffect(() => {
    if (!adyenLoaded || !config || !shopperReference || mountedRef.current) return;
    if (!containerRef.current) return;
    mountedRef.current = true;

    let cancelled = false;

    const init = async () => {
      try {
        const AdyenCheckout = (window as any).AdyenCheckout;
        if (!AdyenCheckout) { setError("Adyen SDK not loaded."); return; }

        const isDark = document.documentElement.classList.contains("dark");
        const adyenCardStyles = isDark ? {
          base: { color: "#f1f5f9", caretColor: "#f1f5f9" },
          placeholder: { color: "#64748b" },
          error: { color: "#fca5a5" },
        } : {};

        const pmData = await apiGet<any>("/api/checkout/payment-methods", {
          countryCode: state.countryCode,
          currency: state.currency,
          shopperReference,
        });

        if (cancelled) return;

        const checkout = await AdyenCheckout({
          clientKey: config.clientKey,
          environment: config.environment,
          paymentMethodsResponse: pmData.response,
          locale: "en-US",
          translations: managePaymentsTranslations,
          analytics: { enabled: true },
          threeDS2Configuration: { challengeWindowSize: "03" },
          paymentMethodsConfiguration: {
            card: {
              hasHolderName: true,
              holderNameRequired: true,
              billingAddressRequired: false,
              enableStoreDetails: true,
              styles: adyenCardStyles,
            },
            storedCard: {
              showPayButton: false,
              hideCVC: true,
            },
          },
          onSubmit: async (sdkState: any, component: any) => {
            component.setStatus("loading");
            try {
              const result = await apiPost<any>("/api/checkout/payments", {
                ...sdkState.data,
                amountValue: 0,
                currency: state.currency,
                countryCode: state.countryCode,
                shopperReference,
                isGuest: false,
                storePaymentMethod: true,
                returnUrl: `${window.location.origin}/checkout/manage-payments`,
                origin: window.location.origin,
              });
              if (result.action) {
                component.handleAction(result.action);
              } else if (["Authorised", "Received"].includes(result.resultCode)) {
                setStatus({ msg: "Card saved successfully.", type: "success" });
                setRefreshKey((k) => k + 1);
              } else {
                component.setStatus("error", { message: "Could not save card." });
              }
            } catch (err: any) {
              component.setStatus("error", { message: err.message || "Request failed." });
            }
          },
          onAdditionalDetails: async (sdkState: any, component: any) => {
            component.setStatus("loading");
            try {
              const result = await apiPost<any>("/api/checkout/payments/details", sdkState.data);
              if (["Authorised", "Received"].includes(result.resultCode)) {
                setStatus({ msg: "Card saved.", type: "success" });
                setRefreshKey((k) => k + 1);
              } else {
                component.setStatus("error", { message: "Could not save card." });
              }
            } catch (err: any) {
              component.setStatus("error", { message: err.message });
            }
          },
          onError: (err: any) => console.error(err),
        });

        dropinRef.current = checkout.create("dropin", {
          showStoredPaymentMethods: true,
          showRemovePaymentMethodButton: true,
          openFirstPaymentMethod: true,
          onDisableStoredPaymentMethod: async (storedPaymentMethodId: string, resolve: () => void, reject: () => void) => {
            const requestBody = { shopperReference, storedPaymentMethodId };
            console.log("[disable] callback fired");
            console.log("[disable] storedPaymentMethodId from SDK:", storedPaymentMethodId);
            console.log("[disable] shopperReference (context):", shopperReference);
            console.log("[disable] body being sent to backend:", requestBody);
            try {
              const result = await apiPost<any>("/api/checkout/disable", requestBody);
              console.log("[disable] backend response:", result);
              resolve();
              setStatus({ msg: "Card removed.", type: "success" });
              setRefreshKey((k) => k + 1);
            } catch (err: any) {
              console.error("[disable] backend error:", err);
              setStatus({ msg: "Could not remove card: " + err.message, type: "error" });
              reject();
            }
          },
        }).mount(containerRef.current!);
      } catch (err: any) {
        setError("Could not load payment form.");
      }
    };

    init();

    return () => {
      cancelled = true;
      if (dropinRef.current) {
        try { dropinRef.current.unmount(); } catch {}
        dropinRef.current = null;
      }
      mountedRef.current = false;
    };
  }, [adyenLoaded, config, shopperReference, refreshKey]);

  if (!shopperReference) {
    return (
      <div className="w-full max-w-[720px]">
        <PageHeader
          title="Manage Payment Methods"
          subtitle="No shopper reference found"
          backHref="/checkout/select-integration"
          backLabel="Back"
        />
        <div className="text-center py-20">
          <p className="text-gray-500">Please start from the checkout flow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[720px]">
      <PageHeader
        title="Manage Payment Methods"
        subtitle={`Shopper: ${shopperReference}`}
        backHref="/checkout/select-integration"
        backLabel="Back"
      />

      {status && <StatusBanner msg={status.msg} type={status.type} />}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
        {error ? (
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        ) : (
          <div ref={containerRef} className="min-h-[100px]" />
        )}
      </div>
    </div>
  );
}
