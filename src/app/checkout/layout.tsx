import { CheckoutProvider } from "@/context/adyen/CheckoutContext";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CheckoutProvider>{children}</CheckoutProvider>;
}
