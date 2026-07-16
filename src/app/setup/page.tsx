import type { Metadata } from "next";
import PageHeader from "@/components/adyen/shared/PageHeader";
import SetupForm from "./SetupForm";

export const metadata: Metadata = {
  title: "Set Up – Valedorsinho",
};

export default function SetupPage({
  searchParams,
}: {
  searchParams: { welcome?: string };
}) {
  const isWelcome = searchParams.welcome === "true";
  return (
    <div className="w-full max-w-[540px]">
      <PageHeader
        title={isWelcome ? "Welcome to Valedorsinho" : "Set Up"}
        subtitle={
          isWelcome
            ? "Add your Adyen credentials below so every demo runs against your own test environment."
            : "Configure your Adyen API key, client key and merchant account."
        }
        backHref="/"
      />
      <SetupForm isWelcome={isWelcome} />
    </div>
  );
}
