"use client";

import { CheckoutProvider } from "@/context/adyen/CheckoutContext";
import CheckoutWizard from "./CheckoutWizard";

export default function CheckoutFeature() {
  return (
    <CheckoutProvider>
      <CheckoutWizard />
    </CheckoutProvider>
  );
}
