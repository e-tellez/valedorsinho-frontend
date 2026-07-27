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
      amount: { value: 0, currency },
      channel: "Web",
    };

    const response = await adyenCheckout(creds, "/paymentMethods", requestBody);

    return NextResponse.json({ requestBody, response });
  } catch (err) {
    return routeError(err);
  }
}
