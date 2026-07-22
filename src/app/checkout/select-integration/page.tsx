"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { getIntegrationsByCategory } from "@/lib/adyen/constants";
import StepIndicator from "@/components/adyen/checkout/StepIndicator";
import PageHeader from "@/components/adyen/shared/PageHeader";

export default function SelectIntegrationPage() {
  const { state, setIntegration } = useCheckout();
  const categories = getIntegrationsByCategory();
  const displayAmount = (state.amountMinorUnits / 100).toFixed(2);

  return (
    <div className="w-full max-w-[720px]">
      <PageHeader
        title="Integration Type"
        subtitle="Choose your payment integration method"
        backHref="/checkout/order"
        backLabel="Back"
      />

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <StepIndicator currentStep={3} />

      {/* Order summary + manage cards */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
          <strong className="text-gray-900 dark:text-white">Order total:</strong> {state.currency} {displayAmount}
          <br />
          <strong className="text-gray-900 dark:text-white">Shopper:</strong> {state.shopperReference || "Guest"}
          <br />
          <strong className="text-gray-900 dark:text-white">Country:</strong> {state.countryCode}
        </div>
        {state.shopperReference && (
          <Link
            href="/checkout/manage-payments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg no-underline whitespace-nowrap transition-colors hover:border-primary hover:bg-blue-50 dark:hover:bg-slate-700"
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            Manage cards
          </Link>
        )}
      </div>

      {/* Integration categories – two columns */}
      <div className="grid grid-cols-2 gap-6">
        {categories.map((category) => (
          <div key={category.name}>
            <h2 className="text-base font-bold text-gray-600 dark:text-slate-300 mb-3 pb-1.5 border-b-2 border-gray-200 dark:border-slate-600 text-center">
              {category.name}
            </h2>
            <ul className="list-none flex flex-col gap-3">
              {category.integrations.map((integration) => (
                <li key={integration.href} className="border border-gray-200 dark:border-slate-600 rounded-lg transition-all duration-150 hover:border-primary hover:shadow-md">
                  <Link
                    href={integration.href}
                    onClick={() => setIntegration(`${integration.name} (${category.name})`)}
                    className="flex items-center justify-between p-4 no-underline text-inherit gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-bold text-gray-900 dark:text-white">{integration.name}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 leading-snug">
                        {integration.note && <p className="mb-0.5">{integration.note}</p>}
                        {integration.description}
                      </span>
                    </div>
                    <span className="text-xl text-gray-400 dark:text-slate-500 shrink-0">&rsaquo;</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
