import { Check } from "lucide-react";

const LABELS = ["Terminal", "Payment", "Result"];

export default function TerminalSteps({ current }: { current: number }) {
  return (
    <div className="cb-steps">
      {LABELS.map((label, i) => {
        const step = i + 1;
        const state = step === current ? "active" : step < current ? "done" : "todo";
        return (
          <div key={label} className={`cb-step cb-step--${state}`} style={i < LABELS.length - 1 ? { flex: 1 } : undefined}>
            <span className="cb-step__dot">{state === "done" ? <Check size={13} /> : step}</span>
            <span className="cb-step__label">{label}</span>
            {i < LABELS.length - 1 && <span className={`cb-step__bar ${step < current ? "cb-step__bar--done" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}
