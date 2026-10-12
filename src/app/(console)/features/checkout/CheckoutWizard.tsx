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

const EMPTY_PERSONALIZATION: Personalization = { shopperEmail: "", shopperLocale: "" };

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

  // The live "configuration object" the shopper tunes on the Personalize step.
  // Reflects the effective values that will be sent (reference is server-assigned).
  const configObject = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return {
      amount: { value: state.amountMinorUnits, currency: state.currency },
      countryCode: state.countryCode,
      reference: "‹assigned by server›",
      ...(state.shopperReference ? { shopperReference: state.shopperReference } : {}),
      isGuest: state.isGuest,
      shopperEmail: personalization.shopperEmail.trim() || "shopper@example.com",
      shopperLocale: personalization.shopperLocale || localeForCountry(state.countryCode),
      channel: "Web",
      returnUrl: `${origin}/psp/checkout`,
    };
  }, [state, personalization]);

  // On entry: start a fresh inspector session, and either resolve a 3DS
  // redirect fallback (shopper returned to /psp/checkout?redirectResult=…)
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
    else configIdRef.current = log.config(configObject, "Checkout configuration");
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
      window.history.replaceState({}, "", "/psp/checkout");
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
