"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { apiPost } from "@/lib/adyen/api";
import { localeForCountry } from "@/lib/adyen/constants";
import { useCallLogger } from "../../shell/useCallLogger";
import CheckoutSteps from "./CheckoutSteps";
import SetupStep from "./steps/SetupStep";
import PersonalizeStep, { type Personalization } from "./steps/PersonalizeStep";
import IntegrationStep, { type Selection } from "./steps/IntegrationStep";
import PayStep from "./steps/PayStep";
import ManageCardsStep from "./steps/ManageCardsStep";
import ResultStep, { type CheckoutResult } from "./steps/ResultStep";

type Step = "setup" | "personalize" | "integration" | "pay" | "manage" | "result";

const STEP_INDEX: Partial<Record<Step, number>> = { setup: 1, personalize: 2, integration: 3, pay: 4 };

const EMPTY_PERSONALIZATION: Personalization = {
  shopperEmail: "",
  shopperLocale: "",
  showPayButton: true,
  showAmountOnButton: true,
  secondaryAmountEnabled: false,
  secondaryAmountCurrency: "",
  secondaryAmountValue: "",
  openFirstPaymentMethod: true,
  openFirstStoredPaymentMethod: true,
  showStoredPaymentMethods: true,
  showPaymentMethods: true,
  showRadioButton: false,
  hasHolderName: true,
  holderNameRequired: true,
  billingAddressRequired: false,
  enableStoreDetails: false,
};

export default function CheckoutWizard() {
  const { state, reset: resetCheckout } = useCheckout();
  const log = useCallLogger();

  const [step, setStep] = useState<Step>("setup");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [personalization, setPersonalization] = useState<Personalization>(EMPTY_PERSONALIZATION);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [redirectErr, setRedirectErr] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const configIdRef = useRef<string | null>(null);

  // The live AdyenCheckout / Drop-in configuration object the shopper tunes on
  // the Personalize step. Mirrors the config that PayStep passes to the SDK when
  // the component mounts (clientKey/environment are resolved from the backend).
  const configObject = useMemo(() => {
    const p = personalization;
    const locale = p.shopperLocale || localeForCountry(state.countryCode);
    const secondaryValue = Math.round((parseFloat(p.secondaryAmountValue) || 0) * 100);

    return {
      clientKey: "‹from /api/config/client›",
      environment: "test",
      locale,
      countryCode: state.countryCode,
      ...(p.showAmountOnButton
        ? { amount: { value: state.amountMinorUnits, currency: state.currency } }
        : {}),
      ...(p.secondaryAmountEnabled && p.secondaryAmountCurrency && secondaryValue > 0
        ? { secondaryAmount: { value: secondaryValue, currency: p.secondaryAmountCurrency, currencyDisplay: "symbol" } }
        : {}),
      showPayButton: p.showPayButton,
      analytics: { enabled: false },
      threeDS2Configuration: { challengeWindowSize: "03" },
      paymentMethodsConfiguration: {
        card: {
          hasHolderName: p.hasHolderName,
          holderNameRequired: p.holderNameRequired,
          billingAddressRequired: p.billingAddressRequired,
          enableStoreDetails: p.enableStoreDetails,
        },
      },
      dropin: {
        openFirstPaymentMethod: p.openFirstPaymentMethod,
        openFirstStoredPaymentMethod: p.openFirstStoredPaymentMethod,
        showStoredPaymentMethods: p.showStoredPaymentMethods,
        showPaymentMethods: p.showPaymentMethods,
        showRadioButton: p.showRadioButton,
      },
      shopperEmail: p.shopperEmail.trim() || "shopper@example.com",
      ...(state.shopperReference ? { shopperReference: state.shopperReference } : {}),
    };
  }, [state, personalization]);

  // On entry: start a fresh inspector session, and either resolve a 3DS
  // redirect fallback (shopper returned to /checkout?redirectResult=…)
  // or reset the checkout context for a new flow.
  useEffect(() => {
    log.reset();
    const sp = new URLSearchParams(window.location.search);
    const redirectResult = sp.get("redirectResult") || sp.get("payload");
    if (redirectResult) {
      resolveRedirect(redirectResult);
    } else {
      resetCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Post / keep the live config entry updated while on the Personalize step.
  useEffect(() => {
    if (step !== "personalize") return;
    if (configIdRef.current) log.setConfig(configIdRef.current, configObject);
    else configIdRef.current = log.config(configObject, "Drop-in configuration");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, configObject]);

  async function resolveRedirect(redirectResult: string) {
    setResolving(true);
    log.event({ label: "Return from 3DS redirect", from: "shopper", to: "merchant" });

    let integrationType = "";
    try {
      const raw = sessionStorage.getItem("valedorsinho_checkout");
      if (raw) integrationType = JSON.parse(raw).integrationType || "";
    } catch { /* noop */ }

    const id = log.begin({ label: "Resolve redirect result", method: "POST", endpoint: "/v71/payments/details", request: { redirectResult } });
    try {
      const res = await apiPost<Record<string, unknown>>("/api/checkout/redirect", { redirectResult });
      log.ok(id, res);
      const rc = (res.resultCode as string) || "";
      setResult({
        status: ["Authorised", "Pending", "Received"].includes(rc) ? "success" : "failure",
        resultCode: rc,
        pspReference: (res.pspReference as string) || "",
        integrationType,
      });
    } catch (err) {
      log.err(id, { error: (err as Error).message });
      setRedirectErr((err as Error).message);
    } finally {
      // Strip the query so a refresh doesn't re-trigger resolution.
      window.history.replaceState({}, "", "/checkout");
      setResolving(false);
      setStep("result");
    }
  }

  function handleNewPayment() {
    log.reset();
    resetCheckout();
    configIdRef.current = null;
    setSelection(null);
    setPersonalization(EMPTY_PERSONALIZATION);
    setResult(null);
    setRedirectErr(null);
    setStep("setup");
  }

  const stepNo = STEP_INDEX[step];

  return (
    <div className="cb-main">
      <div className="cb-ck">
        <header className="cb-head">
          <div>
            <h1 className="cb-head__title">Checkout</h1>
            <p className="cb-head__sub">
              Run an Adyen payment end-to-end. Each call posts to the inspector on the right.
            </p>
          </div>
        </header>

        {resolving ? (
          <div className="cb-panel">
            <div className="cb-panel__bd">
              <div className="cb-adyen-wait">
                <Loader2 size={26} className="cb-spin" />
                <p>Resolving redirect result…</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {stepNo && <CheckoutSteps current={stepNo} />}

            {step === "setup" && <SetupStep onNext={() => setStep("personalize")} />}
            {step === "personalize" && (
              <PersonalizeStep
                value={personalization}
                onChange={setPersonalization}
                onBack={() => setStep("setup")}
                onNext={() => setStep("integration")}
              />
            )}
            {step === "integration" && (
              <IntegrationStep
                onBack={() => setStep("personalize")}
                onSelect={(sel) => { setSelection(sel); setStep("pay"); }}
                onManage={() => setStep("manage")}
              />
            )}
            {step === "pay" && selection && (
              <PayStep
                selection={selection}
                personalization={personalization}
                onBack={() => setStep("integration")}
                onResult={(r) => { setResult(r); setRedirectErr(null); setStep("result"); }}
              />
            )}
            {step === "manage" && <ManageCardsStep onBack={() => setStep("integration")} />}
            {step === "result" && <ResultStep result={result} error={redirectErr} onNewPayment={handleNewPayment} />}
          </>
        )}
      </div>
    </div>
  );
}
