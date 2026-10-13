"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { localeForCountry } from "@/lib/adyen/constants";
import { apiGet } from "@/lib/adyen/api";
import type { PaymentMethodsResponse } from "@/lib/adyen/types";
import { useCallLogger } from "../../../shell/useCallLogger";

const COUNTRIES = [
  { code: "MX", flag: "\u{1F1F2}\u{1F1FD}", label: "Mexico", currency: "MXN", symbol: "$" },
  { code: "US", flag: "\u{1F1FA}\u{1F1F8}", label: "United States", currency: "USD", symbol: "$" },
  { code: "BR", flag: "\u{1F1E7}\u{1F1F7}", label: "Brazil", currency: "BRL", symbol: "R$" },
];

type FetchState = { count: number } | { error: string } | null;

export default function SetupStep({ onNext }: { onNext: () => void }) {
  const { state, setFlow, setOrder } = useCheckout();
  const log = useCallLogger();
  const [country, setCountry] = useState(state.countryCode || "MX");
  const [amount, setAmount] = useState("10.00");
  const [username, setUsername] = useState(state.shopperReference || "");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<FetchState>(null);

  const selected = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  function parseAmount(): number | null {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { setError("Please enter a valid amount."); return null; }
    setError("");
    return parsed;
  }

  async function handleFetch() {
    const parsed = parseAmount();
    if (parsed === null) return;

    setFetching(true);
    setFetchResult(null);

    const amountValue = Math.round(parsed * 100);
    const name = username.trim();
    const shopperLocale = localeForCountry(country);
    const params = new URLSearchParams({
      countryCode: country,
      currency: selected.currency,
      amountValue: String(amountValue),
      shopperLocale,
    });
    if (name) params.set("shopperReference", name);

    const id = log.begin({
      label: "List payment methods",
      method: "POST",
      endpoint: "/v71/paymentMethods",
      request: {
        countryCode: country,
        amount: { value: amountValue, currency: selected.currency },
        shopperLocale,
        ...(name ? { shopperReference: name } : {}),
      },
    });

    try {
      const data = await apiGet<PaymentMethodsResponse>(`/api/checkout/payment-methods?${params.toString()}`);
      log.ok(id, data.response);
      setFetchResult({ count: data.response?.paymentMethods?.length ?? 0 });
    } catch (err) {
      log.err(id, { error: (err as Error).message });
      setFetchResult({ error: (err as Error).message });
    } finally {
      setFetching(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseAmount();
    if (parsed === null) return;

    const name = username.trim();
    const isGuest = name === "";
    setFlow(isGuest, isGuest ? "" : name);
    setOrder(Math.round(parsed * 100), country);
    onNext();
  }

  return (
    <div>
      <h2 className="cb-ck__q">Initial setup</h2>
      <p className="cb-ck__qsub">Set the order amount and country. Add a username to run the account (stored-card) flow, or leave it blank to check out as a guest.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="cb-panel">
          <div className="cb-panel__bd cb-panel__bd--form">
            <div className="cb-field">
              <label htmlFor="ck-username">Username <span className="cb-field__hint">optional — enables the account flow</span></label>
              <input
                id="ck-username"
                className="cb-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. john_doe — leave blank for guest"
                autoComplete="username"
              />
            </div>

            <div className="cb-field">
              <label>Country</label>
              <div className="cb-pills">
                {COUNTRIES.map((c) => (
                  <button
                    type="button"
                    key={c.code}
                    className={`cb-pillbtn ${country === c.code ? "is-on" : ""}`}
                    onClick={() => { setCountry(c.code); setFetchResult(null); }}
                  >
                    {c.flag} {c.label} <small>{c.currency}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="cb-field">
              <label htmlFor="ck-amount">Order total</label>
              <div className="cb-amount">
                <span className="cb-amount__sym">{selected.symbol}</span>
                <input
                  id="ck-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setFetchResult(null); }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {error && <span className="cb-fielderr">{error}</span>}
          </div>
        </div>

        <div className="cb-ck__fetch">
          <p className="cb-ck__fetchcap">
            Preview which payment methods Adyen returns for this country and amount. The available methods — including local payment methods — depend on the country, currency, and transaction amount. Each call posts to the inspector on the right.
          </p>
          <button type="button" className="cb-btn" onClick={handleFetch} disabled={fetching}>
            {fetching && <Loader2 size={14} className="cb-spin" />}
            {fetching ? "Fetching…" : "Fetch payment methods"}
          </button>
          {fetchResult && "count" in fetchResult && (
            <span className="cb-ck__fetchnote">{fetchResult.count} payment method{fetchResult.count === 1 ? "" : "s"} available — see inspector →</span>
          )}
          {fetchResult && "error" in fetchResult && <span className="cb-fielderr">{fetchResult.error}</span>}
        </div>

        <div className="cb-ck__actions">
          <button type="submit" className="cb-btn cb-btn--accent">Continue</button>
        </div>
      </form>
    </div>
  );
}
