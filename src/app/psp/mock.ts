// Static configuration for the PSP console shell: profiles, feature nav, and
// the dashboard service list. Also the shared inspector entry types.

export type Party = "merchant" | "shopper" | "adyen";
export type LogStatus = "ok" | "pend" | "err" | "info";
export type LogKind = "config" | "request" | "response" | "event" | "webhook";

export interface LogEntry {
  id: string;
  time: string; // HH:MM:SS
  from: Party;
  to: Party;
  kind: LogKind;
  method?: string;
  label: string;
  endpoint?: string;
  status: LogStatus;
  statusCode?: number;
  request?: unknown;
  response?: unknown;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string; // lucide key, resolved in the shell
}
export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface ProfileDef {
  id: "psp" | "marketplace" | "platform";
  name: string;
  icon: string;
  enabled: boolean;
}

export const PROFILES: ProfileDef[] = [
  { id: "psp", name: "PSP", icon: "Wallet", enabled: true },
  { id: "platform", name: "Platform", icon: "Layers", enabled: false },
  { id: "marketplace", name: "Marketplace", icon: "ShoppingBag", enabled: false },
];

// Features already migrated into the console get a live route; the rest render
// a "coming soon" placeholder that links to their legacy page.
export const MIGRATED = new Set<string>(["webhooks", "payload-validator", "payload-suggested", "nfc-formatter", "setup", "checkout", "terminal-payments", "terminal-fleet", "apple-pay-msi", "management-api"]);

// Features that don't warrant the message inspector (no meaningful external
// Adyen traffic to trace, or they are the viewer themselves). The panel is
// hidden for these and the center column widens.
export const NO_INSPECTOR = new Set<string>([
  "dashboard",
  "payload-validator",
  "payload-suggested",
  "nfc-formatter",
  "webhooks",
  "setup",
]);

export const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: "LayoutGrid" }],
  },
  {
    label: "Online",
    items: [
      { id: "checkout", label: "Checkout", icon: "CreditCard" },
      { id: "apple-pay-msi", label: "Apple Pay + MSI", icon: "Smartphone" },
      { id: "payload-suggested", label: "Payload Suggested", icon: "FileText" },
      { id: "payload-validator", label: "Payload Validator", icon: "CheckSquare" },
    ],
  },
  {
    label: "In-person",
    items: [
      { id: "terminal-payments", label: "Terminal Payments", icon: "Monitor" },
      { id: "terminal-fleet", label: "Terminal Fleet", icon: "Package" },
      { id: "nfc-formatter", label: "NFC Formatter", icon: "Nfc" },
    ],
  },
  {
    label: "Operate",
    items: [
      { id: "webhooks", label: "Webhook Logs", icon: "MessageSquare" },
      { id: "management-api", label: "Management API", icon: "Pencil" },
      { id: "account-structure", label: "Account Structure", icon: "Network" },
      { id: "setup", label: "Set Up", icon: "Settings" },
    ],
  },
];

export type FeatureState = "LIVE" | "DEMO" | "WIP" | "SOON";

export interface FeatureRow {
  id: string;
  name: string;
  gloss: string;
  state: FeatureState;
  status: LogStatus;
}

export const DASHBOARD_ROWS: FeatureRow[] = [
  { id: "webhooks", name: "Webhook Logs", gloss: "Inbound Adyen notifications in real time.", state: "LIVE", status: "ok" },
  { id: "payload-validator", name: "Payload Validator", gloss: "Validate /payments against the OpenAPI spec.", state: "LIVE", status: "ok" },
  { id: "payload-suggested", name: "Payload Suggested", gloss: "Generate a recommended /payments payload by vertical.", state: "LIVE", status: "ok" },
  { id: "checkout", name: "Checkout", gloss: "Drop-in, Sessions & Components payment flows.", state: "LIVE", status: "ok" },
  { id: "apple-pay-msi", name: "Apple Pay + MSI", gloss: "Apple Pay with Meses Sin Intereses for Mexico.", state: "LIVE", status: "ok" },
  { id: "terminal-payments", name: "Terminal Payments", gloss: "Send Nexo requests to in-person terminals.", state: "LIVE", status: "ok" },
  { id: "terminal-fleet", name: "Terminal Fleet", gloss: "Board, inventory and reassign terminals.", state: "LIVE", status: "ok" },
  { id: "nfc-formatter", name: "NFC Formatter", gloss: "Build a Mifare Classic 1K card-acquisition payload.", state: "LIVE", status: "ok" },
  { id: "management-api", name: "Management API", gloss: "Explore and call the Adyen Management API.", state: "LIVE", status: "ok" },
  { id: "account-structure", name: "Account Structure", gloss: "How merchants, stores and settlement nest.", state: "SOON", status: "info" },
];
