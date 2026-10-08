"use client";

import { useEffect } from "react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { localeForCountry } from "@/lib/adyen/constants";

export interface Personalization {
  shopperEmail: string;
  shopperLocale: string;
}

const LOCALES = [
  { value: "es-ES", label: "Spanish (es-ES)" },
  { value: "en-US", label: "English (en-US)" },
  { value: "pt-BR", label: "Portuguese (pt-BR)" },
];

export default function PersonalizeStep({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: Personalization;
  onChange: (next: Personalization) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { state } = useCheckout();
  const displayAmount = (state.amountMinorUnits / 100).toFixed(2);

  // Default the locale from the chosen country the first time in.
  useEffect(() => {
    if (!value.shopperLocale) onChange({ ...value, shopperLocale: localeForCountry(state.countryCode) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="cb-ck__q">Personalize</h2>
      <p className="cb-ck__qsub">Tune the configuration object before choosing an integration. It updates live in the inspector on the right.</p>

      <div className="cb-ordsum">
        <span><b>Amount:</b> {state.currency} {displayAmount}</span>
        <span><b>Country:</b> {state.countryCode}</span>
        <span><b>Shopper:</b> {state.shopperReference || "Guest"}</span>
        <span><b>Reference:</b> server-assigned</span>
      </div>

      <div className="cb-panel">
        <div className="cb-panel__bd cb-panel__bd--form">
          <div className="cb-field">
            <label htmlFor="ck-email">Shopper email</label>
            <input
              id="ck-email"
              className="cb-input"
              type="email"
              value={value.shopperEmail}
              onChange={(e) => onChange({ ...value, shopperEmail: e.target.value })}
              placeholder="shopper@example.com"
              autoComplete="off"
            />
          </div>

          <div className="cb-field">
            <label htmlFor="ck-locale">Shopper locale</label>
            <select
              id="ck-locale"
              className="cb-input"
              value={value.shopperLocale || localeForCountry(state.countryCode)}
              onChange={(e) => onChange({ ...value, shopperLocale: e.target.value })}
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="cb-ck__actions">
        <button className="cb-btn cb-btn--pull-left" onClick={onBack}>Back</button>
        <button className="cb-btn cb-btn--accent" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}
