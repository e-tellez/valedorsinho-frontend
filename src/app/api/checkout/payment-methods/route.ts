import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenCheckout, routeError } from "@/lib/adyen/server";

/**
 * GET /api/checkout/payment-methods
 *
 * Query params: countryCode, currency, shopperReference (optional)
 *
 * Calls POST /v71/paymentMethods on the Adyen Checkout API and returns:
 *   { requestBody, response }
 * The dual-envelope keeps the front-end PreviewCard panels working.
 */
export async function GET(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("countryCode") ?? "US";
    const currency = searchParams.get("currency") ?? "USD";
    const shopperReference = searchParams.get("shopperReference") ?? undefined;

    const requestBody: Record<string, unknown> = {
      merchantAccount: creds.merchantAccount,
      countryCode,
      amount: { currency, value: 0 },
      channel: "Web",
    };

    if (shopperReference) {
      requestBody.shopperReference = shopperReference;
    }

    const response = await adyenCheckout(creds, "/paymentMethods", requestBody);

    return NextResponse.json({ requestBody, response });
  } catch (err) {
    return routeError(err);
  }
}
