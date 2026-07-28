import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenCheckout, routeError } from "@/lib/adyen/server";

/**
 * POST /api/checkout/apple-pay/payment-methods
 *
 * Fetches the /paymentMethods list filtered for Apple Pay in the MX market.
 * Returns the Apple Pay configuration block (merchantId, merchantName) that is
 * required for both the ApplePaySession initialisation and the merchant
 * validation call in the next step.
 *
 * Returns:
 *   { requestBody, response }
 */
export async function POST(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await request.json().catch(() => ({}));
    const countryCode = (body.countryCode as string) || "MX";
    const currency = (body.currency as string) || "MXN";

    const requestBody = {
      merchantAccount: creds.merchantAccount,
      countryCode,
      // Non-zero amount — Adyen may suppress wallet methods (Apple Pay, Google Pay)
      // when value is 0. Use 1000 minor units (MXN 10.00) as a safe default for
      // the payment-methods listing call.
      amount: { value: 1000, currency },
      channel: "Web",
    };

    const response = await adyenCheckout(creds, "/paymentMethods", requestBody);

    return NextResponse.json({ requestBody, response });
  } catch (err) {
    return routeError(err);
  }
}
