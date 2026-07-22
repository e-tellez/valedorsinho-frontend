// Supabase row types for the webhooks table.
// Keep Adyen API types in src/lib/adyen/types.ts.

export interface WebhookItem {
  id: string;
  user_id: string;
  merchant_account: string;
  event_code: string;
  psp_reference: string;
  merchant_reference: string;
  amount_value: number;
  amount_currency: string;
  success: boolean;
  live: boolean;
  received_at: string;
  expires_at: string;
}

export interface WebhookDetail extends WebhookItem {
  payload: object;
}

export interface WebhookListResponse {
  items: WebhookItem[];
}
