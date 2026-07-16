"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import StepIndicator from "@/components/adyen/checkout/StepIndicator";
import PageHeader from "@/components/adyen/shared/PageHeader";

export default function ChooseFlowPage() {
  const router = useRouter();
  const { setFlow, reset } = useCheckout();

  function handleGuest() {
    setFlow(true);
    router.push("/checkout/order");
  }

  function handleAccount() {
    setFlow(false);
    router.push("/checkout/order");
  }

  return (
    <div className="w-full max-w-[720px]">
      <PageHeader
        title="Checkout"
        subtitle="Choose your payment experience"
        backHref="/"
        backLabel="Dashboard"
      />

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <StepIndicator currentStep={1} />

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">How would you like to pay?</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">Choose a checkout experience to get started.</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button onClick={handleGuest} className="flex flex-col items-center justify-center text-center p-6 border-2 border-gray-200 dark:border-slate-600 rounded-xl no-underline text-inherit transition-all duration-150 cursor-pointer hover:border-primary hover:shadow-md hover:bg-blue-50/30 bg-white dark:bg-slate-700 dark:hover:bg-slate-600">
          <svg className="w-12 h-12 text-primary mb-3" viewBox="0 0 48 48" fill="none">
            <circle cx={24} cy={16} r={8} stroke="currentColor" strokeWidth={2.5} />
            <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          <span className="text-base font-bold text-gray-900 dark:text-white mb-1">Guest</span>
          <span className="text-xs text-gray-500 dark:text-slate-400 leading-snug">Pay without creating an account. Quick and simple.</span>
        </button>

        <button onClick={handleAccount} className="flex flex-col items-center justify-center text-center p-6 border-2 border-gray-200 dark:border-slate-600 rounded-xl no-underline text-inherit transition-all duration-150 cursor-pointer hover:border-primary hover:shadow-md hover:bg-blue-50/30 bg-white dark:bg-slate-700 dark:hover:bg-slate-600">
          <svg className="w-12 h-12 text-primary mb-3" viewBox="0 0 48 48" fill="none">
            <circle cx={20} cy={16} r={8} stroke="currentColor" strokeWidth={2.5} />
            <path d="M4 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={38} cy={32} r={8} fill="#e8f0fe" stroke="currentColor" strokeWidth={2} />
            <path d="M35 32l2 2 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-base font-bold text-gray-900 dark:text-white mb-1">Account</span>
          <span className="text-xs text-gray-500 dark:text-slate-400 leading-snug">Sign in to save cards and speed up future payments.</span>
        </button>
      </div>

      </div>
    </div>
  );
}
