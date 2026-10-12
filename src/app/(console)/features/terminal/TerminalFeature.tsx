"use client";

import { useEffect, useState } from "react";
import { useTerminalSelector } from "@/hooks/useTerminalSelector";
import type { TerminalPaymentResult } from "@/lib/adyen/types";
import { useInspector } from "../../shell/inspector-context";
import TerminalSteps from "./TerminalSteps";
import SelectStep from "./steps/SelectStep";
import ConfigureStep from "./steps/ConfigureStep";
import ResultStep from "./steps/ResultStep";

type Step = "select" | "configure" | "result";
const STEP_INDEX: Record<Step, number> = { select: 1, configure: 2, result: 3 };

export default function TerminalFeature() {
  const selector = useTerminalSelector();
  const { reset } = useInspector();

  const [step, setStep] = useState<Step>("select");
  const [result, setResult] = useState<TerminalPaymentResult | null>(null);

  useEffect(() => { reset(); }, [reset]);

  return (
    <div className="cb-main">
      <div className="cb-tk">
        <header className="cb-head">
          <div>
            <h1 className="cb-head__title">Terminal Payments</h1>
            <p className="cb-head__sub">
              Send an in-person (Nexo) payment to a terminal. Each call posts to the inspector on the right.
            </p>
          </div>
        </header>

        <TerminalSteps current={STEP_INDEX[step]} />

        {step === "select" && (
          <SelectStep selector={selector} onMakePayment={() => setStep("configure")} />
        )}
        {step === "configure" && (
          <ConfigureStep
            terminalId={selector.selectedTerminal}
            merchantAccount={selector.selectedMerchant}
            onBack={() => setStep("select")}
            onResult={(r) => { setResult(r); setStep("result"); }}
          />
        )}
        {step === "result" && (
          <ResultStep
            result={result}
            onNewPayment={() => { setResult(null); setStep("configure"); }}
            onBackToTerminals={() => { setResult(null); setStep("select"); }}
          />
        )}
      </div>
    </div>
  );
}
