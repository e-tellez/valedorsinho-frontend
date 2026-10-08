"use client";

import { useState } from "react";
import { useCheckout } from "@/context/adyen/CheckoutContext";

const COUNTRIES = [
  { code: "MX", flag: "\u{1F1F2}\u{1F1FD}", label: "Mexico", currency: "MXN", symbol: "$" },
  { code: "US", flag: "\u{1F1FA}\u{1F1F8}", label: "United States", currency: "USD", symbol: "$" },
  { code: "BR", flag: "\u{1F1E7}\u{1F1F7}", label: "Brazil", currency: "BRL", symbol: "R$" },
];

export default function SetupStep({ onNext }: { onNext: () => void }) {
  const { state, setFlow, setOrder } = useCheckout();
  const [country, setCountry] = useState(state.countryCode || "MX");
  const [amount, setAmount] = useState("10.00");
  const [username, setUsername] = useState(state.shopperReference || "");
  const [error, setError] = useState("");

  const selected = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { setError("Please enter a valid amount."); return; }

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
                    onClick={() => setCountry(c.code)}
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
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {error && <span className="cb-fielderr">{error}</span>}
          </div>
        </div>

        <div className="cb-ck__actions">
          <button type="submit" className="cb-btn cb-btn--accent">Continue</button>
        </div>
      </form>
    </div>
  );
}
