export interface AccountNode {
  id: string;
  type: 'company' | 'merchant' | 'store';
  label: string;
  description: string;
  details: {
    settlement?: string;
    reconciliation?: string;
    operations?: string;
    uplift?: string;
  };
}

export const NODES: AccountNode[] = [
  {
    id: 'company',
    type: 'company',
    label: 'Company Account',
    description: 'Top-level organizational entity',
    details: {
      reconciliation: 'Company-level reporting aggregates all merchant accounts. View consolidated transaction data, fees, and chargebacks across the entire organization.',
      operations: 'Global settings: reporting currency, user roles (admin/im/user), contract terms, and company-wide risk thresholds.',
      uplift: 'Uplift features enabled at company contract level automatically apply to all child merchant accounts. No per-merchant configuration needed.',
    },
  },
  {
    id: 'merchant1',
    type: 'merchant',
    label: 'Merchant Account 1',
    description: 'Mid-level business entity',
    details: {
      settlement: 'Settlement happens here. Configure payout schedule (daily, T+2, weekly) and bank account. All transactions from child stores batch into this merchant account before settlement.',
      reconciliation: 'Merchant-level Settlement Detail Report (SDR). Statement descriptor shown on cardholder\'s bank statement. Per-merchant transaction logs.',
      operations: 'Payment methods (cards, wallets, local methods), 3D Secure config, risk rules, fraud thresholds. Merchant-specific API credentials and webhooks.',
      uplift: 'Network Tokenization (~5-10% auth uplift), 3DS Optimization (frictionless vs challenge), Smart Routing (BIN-based), Retry Logic (soft decline recovery).',
    },
  },
  {
    id: 'merchant2',
    type: 'merchant',
    label: 'Merchant Account 2',
    description: 'Mid-level business entity',
    details: {
      settlement: 'Settlement happens here. Configure payout schedule (daily, T+2, weekly) and bank account. All transactions from child stores batch into this merchant account before settlement.',
      reconciliation: 'Merchant-level Settlement Detail Report (SDR). Statement descriptor shown on cardholder\'s bank statement. Per-merchant transaction logs.',
      operations: 'Payment methods (cards, wallets, local methods), 3D Secure config, risk rules, fraud thresholds. Merchant-specific API credentials and webhooks.',
      uplift: 'Network Tokenization (~5-10% auth uplift), 3DS Optimization (frictionless vs challenge), Smart Routing (BIN-based), Retry Logic (soft decline recovery).',
    },
  },
  {
    id: 'store1a',
    type: 'store',
    label: 'Store 1A',
    description: 'Physical or logical store (Unified Commerce)',
    details: {
      settlement: 'No settlement at store level. Transactions roll up to parent merchant account for settlement.',
      reconciliation: 'Store-level transaction logs for both online and in-person transactions. Store identifier visible in transaction metadata for unified reporting.',
      operations: 'Unified Commerce: Online checkout sessions + Terminal fleet assignment. Store reference used for both digital and physical channels. Store-level analytics across all touchpoints.',
      uplift: 'Network tokenization works across channels. Tokenized contactless (Apple Pay/Google Pay) for in-person. Stored payment methods for online. Unified shopper journey increases conversion.',
    },
  },
  {
    id: 'store1b',
    type: 'store',
    label: 'Store 1B',
    description: 'Physical or logical store (Unified Commerce)',
    details: {
      settlement: 'No settlement at store level. Transactions roll up to parent merchant account for settlement.',
      reconciliation: 'Store-level transaction logs for both online and in-person transactions. Store identifier visible in transaction metadata for unified reporting.',
      operations: 'Unified Commerce: Online checkout sessions + Terminal fleet assignment. Store reference used for both digital and physical channels. Store-level analytics across all touchpoints.',
      uplift: 'Network tokenization works across channels. Tokenized contactless (Apple Pay/Google Pay) for in-person. Stored payment methods for online. Unified shopper journey increases conversion.',
    },
  },
  {
    id: 'store2a',
    type: 'store',
    label: 'Store 2A',
    description: 'Physical or logical store (Unified Commerce)',
    details: {
      settlement: 'No settlement at store level. Transactions roll up to parent merchant account for settlement.',
      reconciliation: 'Store-level transaction logs for both online and in-person transactions. Store identifier visible in transaction metadata for unified reporting.',
      operations: 'Unified Commerce: Online checkout sessions + Terminal fleet assignment. Store reference used for both digital and physical channels. Store-level analytics across all touchpoints.',
      uplift: 'Network tokenization works across channels. Tokenized contactless (Apple Pay/Google Pay) for in-person. Stored payment methods for online. Unified shopper journey increases conversion.',
    },
  },
  {
    id: 'store2b',
    type: 'store',
    label: 'Store 2B',
    description: 'Physical or logical store (Unified Commerce)',
    details: {
      settlement: 'No settlement at store level. Transactions roll up to parent merchant account for settlement.',
      reconciliation: 'Store-level transaction logs for both online and in-person transactions. Store identifier visible in transaction metadata for unified reporting.',
      operations: 'Unified Commerce: Online checkout sessions + Terminal fleet assignment. Store reference used for both digital and physical channels. Store-level analytics across all touchpoints.',
      uplift: 'Network tokenization works across channels. Tokenized contactless (Apple Pay/Google Pay) for in-person. Stored payment methods for online. Unified shopper journey increases conversion.',
    },
  },
  {
    id: 'store2c',
    type: 'store',
    label: 'Store 2C',
    description: 'Physical or logical store (Unified Commerce)',
    details: {
      settlement: 'No settlement at store level. Transactions roll up to parent merchant account for settlement.',
      reconciliation: 'Store-level transaction logs for both online and in-person transactions. Store identifier visible in transaction metadata for unified reporting.',
      operations: 'Unified Commerce: Online checkout sessions + Terminal fleet assignment. Store reference used for both digital and physical channels. Store-level analytics across all touchpoints.',
      uplift: 'Network tokenization works across channels. Tokenized contactless (Apple Pay/Google Pay) for in-person. Stored payment methods for online. Unified shopper journey increases conversion.',
    },
  },
];

export const DEVELOPER_CONCERNS = [
  {
    id: 'api-keys',
    label: 'API Keys',
    description: 'Scoped to Merchant Account. One key serves multiple stores with no store-level awareness. Include merchantAccount in API requests.',
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    description: 'Configured at Company or Merchant level. No store-level webhook endpoint exists. Use eventCode and merchantReference for internal routing.',
  },
  {
    id: 'tokens',
    label: 'Token Groups / Recurring',
    description: 'Tied to shopperReference + Merchant Account. The store visited is irrelevant for recurring charges. Retrieve via GET /shoppers/{shopperReference}/paymentMethods.',
  },
  {
    id: 'client-key',
    label: 'Client Key',
    description: 'Front-end credential scoped to Merchant Account. No store-level client key. Used in AdyenCheckout({ clientKey, environment }).',
  },
];
