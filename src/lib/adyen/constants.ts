/**
 * Static configuration that lives in the frontend.
 * Replaces checkout/integrations.py and checkout/checkout_helpers.py constants.
 */

// ---------------------------------------------------------------------------
// Country → Currency mapping
// ---------------------------------------------------------------------------

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  MX: "MXN",
  US: "USD",
  BR: "BRL",
};

// ---------------------------------------------------------------------------
// Country → Shopper locale mapping
// ---------------------------------------------------------------------------
// BCP 47 locale used for the Adyen SDK UI language and the `shopperLocale`
// sent to Adyen (payment method display names). Falls back to the default
// below for unmapped countries.

export const DEFAULT_SHOPPER_LOCALE = "en-US";

export const COUNTRY_LOCALE_MAP: Record<string, string> = {
  MX: "es-ES",
  US: "en-US",
  BR: "pt-BR",
};

export function localeForCountry(countryCode: string): string {
  return COUNTRY_LOCALE_MAP[countryCode] ?? DEFAULT_SHOPPER_LOCALE;
}

// ---------------------------------------------------------------------------
// Integration registry (replaces @register_integration decorator)
// ---------------------------------------------------------------------------

export interface Integration {
  name: string;
  description: string;
  note?: string;
  href: string;
  category: "Advanced" | "Sessions";
  order: number;
}

export const INTEGRATIONS: Integration[] = [
  {
    name: "Drop-in",
    description:
      "Pre-built UI with all available payment methods in your MA.",
    href: "/checkout/dropin",
    category: "Advanced",
    order: 1,
  },
  {
    name: "Components",
    description:
      "Card fields only \u2014 you control the surrounding UI and pay button.",
    note: "(Only Card Component implemented for now)",
    href: "/checkout/components",
    category: "Advanced",
    order: 2,
  },
  {
    name: "Drop-in",
    description:
      "Pre-built UI powered by /sessions \u2014 Adyen handles the full payment flow.",
    href: "/checkout/sessions/dropin",
    category: "Sessions",
    order: 3,
  },
  {
    name: "Components",
    description:
      "Card fields only, powered by /sessions \u2014 you control the UI, Adyen handles the flow.",
    note: "(Only Card Component implemented for now)",
    href: "/checkout/sessions/components",
    category: "Sessions",
    order: 4,
  },
];

export function getIntegrationsByCategory(): Array<{
  name: string;
  integrations: Integration[];
}> {
  const groups = new Map<string, Integration[]>();
  for (const integration of INTEGRATIONS) {
    const list = groups.get(integration.category) ?? [];
    list.push(integration);
    groups.set(integration.category, list);
  }
  return Array.from(groups.entries()).map(([name, integrations]) => ({
    name,
    integrations,
  }));
}

// ---------------------------------------------------------------------------
// Adyen Web SDK version
// ---------------------------------------------------------------------------

export const ADYEN_SDK_VERSION = "5.67.0";
