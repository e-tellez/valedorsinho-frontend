"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { COUNTRY_CURRENCY_MAP } from "@/lib/adyen/constants";
import StepIndicator from "@/components/adyen/checkout/StepIndicator";
import PageHeader from "@/components/adyen/shared/PageHeader";

const COUNTRIES = [
  { code: "MX", flag: "\u{1F1F2}\u{1F1FD}", label: "Mexico", currency: "MXN", symbol: "$" },
  { code: "US", flag: "\u{1F1FA}\u{1F1F8}", label: "United States", currency: "USD", symbol: "$" },
  { code: "BR", flag: "\u{1F1E7}\u{1F1F7}", label: "Brazil", currency: "BRL", symbol: "R$" },
];

export default function OrderPage() {
  const router = useRouter();
  const { state, setFlow, setOrder } = useCheckout();

  const [country, setCountry] = useState(state.countryCode || "MX");
  const [amount, setAmount] = useState("10.00");
  const [username, setUsername] = useState(state.shopperReference || "");
  const [error, setError] = useState("");

  const selectedCountry = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!state.isGuest && !username.trim()) {
      setError("Please enter a username.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    const amountMinorUnits = Math.round(parsedAmount * 100);

    if (!state.isGuest) {
      setFlow(false, username.trim());
    }
    setOrder(amountMinorUnits, country);
    router.push("/checkout/select-integration");
  }

  return (
    <div className="w-full max-w-[720px]">
      <PageHeader
        title="Your Order"
        subtitle={state.isGuest ? "Confirm your order details" : "Enter your details to continue"}
        backHref="/checkout"
        backLabel="Back"
      />

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <StepIndicator currentStep={2} />

      <form onSubmit={handleSubmit} noValidate>
        {!state.isGuest && (
          <div className="mb-5">
            <label htmlFor="username" className="block text-[0.85rem] font-semibold text-gray-600 dark:text-slate-300 mb-1.5 text-center">
              Username
            </label>
            <div className="max-w-[320px] mx-auto">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => { setUsername(event.target.value); setError(""); }}
                placeholder="e.g. john_doe"
                autoComplete="username"
                className="field-input"
              />
            </div>
            {error && <span className="block mt-1 text-xs text-red-600 text-center">{error}</span>}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-[0.85rem] font-semibold text-gray-600 dark:text-slate-300 mb-1.5 text-center">Country</label>
          <div className="flex gap-2 flex-wrap justify-center">
            {COUNTRIES.map((c) => (
              <label key={c.code} className="cursor-pointer">
                <input
                  type="radio"
                  name="country"
                  value={c.code}
                  checked={country === c.code}
                  onChange={() => setCountry(c.code)}
                  className="hidden"
                />
                <span
                  className={`inline-flex items-center gap-1 px-3.5 py-1.5 border rounded-full text-sm select-none transition-colors duration-150 ${
                    country === c.code
                      ? "border-primary bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                  }`}
                >
                  {c.flag} {c.label} <small className="text-xs opacity-70">{c.currency}</small>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="amount" className="block text-[0.85rem] font-semibold text-gray-600 dark:text-slate-300 mb-1.5 text-center">
            Order total
          </label>
          <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-md overflow-hidden max-w-[320px] mx-auto focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <span className="px-2.5 text-base text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-600 border-r border-gray-300 dark:border-slate-600 leading-10 select-none">
              {selectedCountry.symbol}
            </span>
            <input
              id="amount"
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="border-none outline-none px-3 h-10 text-base w-full bg-transparent text-gray-900 dark:text-[#00d4ff] font-mono font-bold placeholder:text-gray-400 dark:placeholder:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary block w-full max-w-[320px] mx-auto h-11!">
          Continue
        </button>
      </form>
      </div>
    </div>
  );
}
