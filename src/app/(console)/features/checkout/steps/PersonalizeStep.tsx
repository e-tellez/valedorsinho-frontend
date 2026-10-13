"use client";

import { useEffect } from "react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { localeForCountry } from "@/lib/adyen/constants";

export interface Personalization {
  shopperEmail: string;
  shopperLocale: string;
  // Pay button & amount (global AdyenCheckout config)
  showPayButton: boolean;
  showAmountOnButton: boolean;
  secondaryAmountEnabled: boolean;
  secondaryAmountCurrency: string;
  secondaryAmountValue: string;
  // Payment-method list behavior (Drop-in instance config)
  openFirstPaymentMethod: boolean;
  openFirstStoredPaymentMethod: boolean;
  showStoredPaymentMethods: boolean;
  showPaymentMethods: boolean;
  showRadioButton: boolean;
  // Card component options (paymentMethodsConfiguration.card)
  hasHolderName: boolean;
  holderNameRequired: boolean;
  billingAddressRequired: boolean;
  enableStoreDetails: boolean;
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

  // First time in: default the locale from the chosen country, and derive the
  // stored-card options from whether this is an account (non-guest) flow.
  useEffect(() => {
    if (!value.shopperLocale) {
      onChange({
        ...value,
        shopperLocale: localeForCountry(state.countryCode),
        enableStoreDetails: !state.isGuest,
        showStoredPaymentMethods: !state.isGuest,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof Personalization>(key: K, v: Personalization[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div>
      <h2 className="cb-ck__q">Personalize</h2>
      <p className="cb-ck__qsub">Tune the Drop-in configuration object before choosing an integration. It updates live in the inspector on the right, then feeds the AdyenCheckout instance when the component mounts.</p>

      <div className="cb-ordsum">
        <span><b>Amount:</b> {state.currency} {displayAmount}</span>
        <span><b>Country:</b> {state.countryCode}</span>
        <span><b>Shopper:</b> {state.shopperReference || "Guest"}</span>
        <span><b>Reference:</b> server-assigned</span>
      </div>

      <div className="cb-panel">
        <div className="cb-panel__bd cb-panel__bd--form">
          <p className="cb-ck__group">Shopper</p>
          <div className="cb-field">
            <label htmlFor="ck-email">Shopper email</label>
            <input
              id="ck-email"
              className="cb-input"
              type="email"
              value={value.shopperEmail}
              onChange={(e) => set("shopperEmail", e.target.value)}
              placeholder="shopper@example.com"
              autoComplete="off"
            />
          </div>

          <div className="cb-field">
            <label htmlFor="ck-locale">Shopper locale <span className="cb-field__hint">AdyenCheckout <code>locale</code></span></label>
            <select
              id="ck-locale"
              className="cb-input"
              value={value.shopperLocale || localeForCountry(state.countryCode)}
              onChange={(e) => set("shopperLocale", e.target.value)}
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="cb-panel">
        <div className="cb-panel__bd cb-panel__bd--form">
          <p className="cb-ck__group">Pay button &amp; amount</p>
          <Toggle label="Show pay button" hint="Drop-in renders a built-in Pay button (showPayButton)." checked={value.showPayButton} onChange={(v) => set("showPayButton", v)} />
          <Toggle label="Show amount on pay button" hint="Pass the order amount so the total shows on the button." checked={value.showAmountOnButton} onChange={(v) => set("showAmountOnButton", v)} />
          <Toggle label="Secondary amount" hint="Show a second currency on the Pay button (secondaryAmount)." checked={value.secondaryAmountEnabled} onChange={(v) => set("secondaryAmountEnabled", v)} />

          {value.secondaryAmountEnabled && (
            <div className="cb-metarow cb-ck__secondary">
              <input
                className="cb-input"
                value={value.secondaryAmountCurrency}
                onChange={(e) => set("secondaryAmountCurrency", e.target.value.toUpperCase().slice(0, 3))}
                placeholder="USD"
                aria-label="Secondary currency"
              />
              <input
                className="cb-input"
                type="number"
                min={0}
                step={0.01}
                value={value.secondaryAmountValue}
                onChange={(e) => set("secondaryAmountValue", e.target.value)}
                placeholder="0.00"
                aria-label="Secondary amount value"
              />
            </div>
          )}
        </div>
      </div>

      <div className="cb-panel">
        <div className="cb-panel__bd cb-panel__bd--form">
          <p className="cb-ck__group">Payment-method list <span className="cb-field__hint">Drop-in only</span></p>
          <Toggle label="Open first payment method" hint="Expand the first method on load (openFirstPaymentMethod)." checked={value.openFirstPaymentMethod} onChange={(v) => set("openFirstPaymentMethod", v)} />
          <Toggle label="Open first stored method" hint="Expand a stored card first; takes precedence over the above." checked={value.openFirstStoredPaymentMethod} onChange={(v) => set("openFirstStoredPaymentMethod", v)} />
          <Toggle label="Show stored methods" hint="Show saved cards for the shopper (showStoredPaymentMethods)." checked={value.showStoredPaymentMethods} onChange={(v) => set("showStoredPaymentMethods", v)} />
          <Toggle label="Show payment methods" hint="Show regular (non-stored) methods (showPaymentMethods)." checked={value.showPaymentMethods} onChange={(v) => set("showPaymentMethods", v)} />
          <Toggle label="Radio buttons" hint="Render a radio button next to each method (showRadioButton)." checked={value.showRadioButton} onChange={(v) => set("showRadioButton", v)} />
        </div>
      </div>

      <div className="cb-panel">
        <div className="cb-panel__bd cb-panel__bd--form">
          <p className="cb-ck__group">Card component</p>
          <Toggle label="Holder name field" hint="Show the cardholder name field (hasHolderName)." checked={value.hasHolderName} onChange={(v) => set("hasHolderName", v)} />
          <Toggle label="Holder name required" hint="Require the cardholder name to submit (holderNameRequired)." checked={value.holderNameRequired} onChange={(v) => set("holderNameRequired", v)} />
          <Toggle label="Billing address" hint="Collect the billing address in the card form (billingAddressRequired)." checked={value.billingAddressRequired} onChange={(v) => set("billingAddressRequired", v)} />
          <Toggle label="Store card details" hint="Offer to save the card for next time (enableStoreDetails)." checked={value.enableStoreDetails} onChange={(v) => set("enableStoreDetails", v)} />
        </div>
      </div>

      <div className="cb-ck__actions">
        <button className="cb-btn cb-btn--pull-left" onClick={onBack}>Back</button>
        <button className="cb-btn cb-btn--accent" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="cb-togglerow">
      <span className="cb-togglerow__txt">
        <b>{label}</b>
        <span>{hint}</span>
      </span>
      <button type="button" role="switch" aria-checked={checked} className={`cb-switch ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
        <span className="cb-switch__knob" />
      </button>
    </div>
  );
}
