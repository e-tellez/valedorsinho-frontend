"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/adyen/api";
import { useInspector } from "../shell/inspector-context";

interface ValidationError { field: string; error: string; rule: string }
interface ValidateResponse { valid: boolean; errors?: ValidationError[] }

const PLACEHOLDER = `{
  "merchantAccount": "YOUR_MERCHANT_ACCOUNT",
  "reference": "order-123",
  "amount": { "value": 1000, "currency": "EUR" },
  "paymentMethod": { "type": "scheme" },
  "returnUrl": "https://your-domain.com/redirect"
}`;

type Banner = { type: "ok" | "err" | "loading"; message: string };

export default function PayloadValidatorFeature() {
  const { push, update, reset } = useInspector();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => { reset(); }, [reset]);

  async function handleValidate() {
    const raw = input.trim();
    if (!raw) { setBanner({ type: "err", message: "Paste a JSON payload first." }); return; }

    let payload: unknown;
    try { payload = JSON.parse(raw); }
    catch (e) { setBanner({ type: "err", message: "Invalid JSON: " + (e as Error).message }); return; }

    setBusy(true);
    setBanner({ type: "loading", message: "Validating against the Adyen OpenAPI spec…" });

    const id = push({
      from: "merchant", to: "adyen", kind: "request", method: "POST",
      label: "Validate payload", endpoint: "/api/tools/validate-payload",
      status: "pend", request: { payload },
    });

    try {
      const res = await apiPost<ValidateResponse>("/api/tools/validate-payload", { payload });
      update(id, { status: "ok", statusCode: 200, response: res });
      if (res.valid) {
        setBanner({ type: "ok", message: "Payload is valid — no errors found." });
        setErrors([]);
      } else {
        const errs = res.errors ?? [];
        setBanner({ type: "err", message: `${errs.length} validation error(s) found.` });
        setErrors(errs);
      }
    } catch (err) {
      const message = (err as Error).message;
      update(id, { status: "err", statusCode: 400, response: { error: message } });
      setBanner({ type: "err", message });
      setErrors([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-main cb-main--wide">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">Payload Validator</h1>
          <p className="cb-head__sub">
            Validate a <code>/payments</code> JSON payload against the Adyen OpenAPI spec.
            The request and response post to the inspector on the right.
          </p>
        </div>
      </header>

      <div className="cb-work">
        <div className="cb-panel">
          <div className="cb-panel__hd"><h3>/payments payload</h3></div>
          <div className="cb-panel__bd">
            <textarea
              className="cb-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDER}
              spellCheck={false}
              rows={18}
            />
            <div className="cb-actions">
              <button className="cb-btn cb-btn--accent" onClick={handleValidate} disabled={busy}>
                {busy ? <Loader2 size={14} className="cb-spin" /> : <CheckCircle2 size={14} />}
                Validate
              </button>
              <button className="cb-btn" onClick={() => { setInput(""); setBanner(null); setErrors([]); }} disabled={busy}>
                Clear
              </button>
            </div>

            {banner && (
              <div className={`cb-banner cb-banner--${banner.type === "loading" ? "info" : banner.type}`}>
                {banner.type === "ok" ? <CheckCircle2 size={15} /> : banner.type === "loading" ? <Loader2 size={15} className="cb-spin" /> : <AlertTriangle size={15} />}
                <span>{banner.message}</span>
              </div>
            )}

            {errors.length > 0 && (
              <div className="cb-errlist">
                {errors.map((e, i) => (
                  <div key={i} className="cb-errrow">
                    <code className="cb-errfield">{e.field}</code>
                    <span className="cb-errmsg">{e.error}</span>
                    <span className="cb-errrule">{e.rule}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
