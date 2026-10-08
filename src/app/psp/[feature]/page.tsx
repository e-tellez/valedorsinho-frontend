"use client";

import { useParams } from "next/navigation";
import { NAV } from "../mock";
import WebhooksFeature from "../features/WebhooksFeature";
import PayloadValidatorFeature from "../features/PayloadValidatorFeature";
import PayloadSuggestedFeature from "../features/PayloadSuggestedFeature";
import NfcFormatterFeature from "../features/NfcFormatterFeature";
import SetupFeature from "../features/SetupFeature";
import CheckoutFeature from "../features/checkout/CheckoutFeature";
import TerminalFeature from "../features/terminal/TerminalFeature";
import TerminalFleetFeature from "../features/TerminalFleetFeature";
import ApplePayMsiFeature from "../features/ApplePayMsiFeature";
import ManagementApiFeature from "../features/ManagementApiFeature";
import ComingSoon from "../features/ComingSoon";

function labelFor(slug: string): string {
  const item = NAV.flatMap((s) => s.items).find((i) => i.id === slug);
  return item?.label ?? slug;
}

export default function FeaturePage() {
  const params = useParams<{ feature: string }>();
  const slug = params.feature;

  switch (slug) {
    case "webhooks":
      return <WebhooksFeature />;
    case "payload-validator":
      return <PayloadValidatorFeature />;
    case "payload-suggested":
      return <PayloadSuggestedFeature />;
    case "nfc-formatter":
      return <NfcFormatterFeature />;
    case "setup":
      return <SetupFeature />;
    case "checkout":
      return <CheckoutFeature />;
    case "terminal-payments":
      return <TerminalFeature />;
    case "terminal-fleet":
      return <TerminalFleetFeature />;
    case "apple-pay-msi":
      return <ApplePayMsiFeature />;
    case "management-api":
      return <ManagementApiFeature />;
    default:
      return <ComingSoon title={labelFor(slug)} slug={slug} />;
  }
}
