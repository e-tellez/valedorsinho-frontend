import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenCheckout, routeError } from "@/lib/adyen/server";

/**
 * POST /api/checkout/sessions
 *
 * Creates an Adyen session for the Sessions integration flow.
 * Returns { requestBody, response } so the PreviewCard panels can display
 * the request / response side-by-side.
 *
 * Expected body: { amountValue, currency, countryCode, shopperReference?,
 *                  isGuest, shopperEmail?, returnUrl }
 */
export async function POST(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await request.json();
    const {
      amountValue,
      currency,
      countryCode,
      shopperReference,
      isGuest,
      shopperEmail,
      returnUrl,
    } = body;

    const requestBody: Record<string, unknown> = {
      merchantAccount: creds.merchantAccount,
      reference: `val-${crypto.randomUUID()}`,
      amount: { value: amountValue ?? 0, currency: currency ?? "USD" },
      countryCode: countryCode ?? "US",
      channel: "Web",
      returnUrl,
    };

    if (!isGuest && shopperReference) {
      requestBody.shopperReference = shopperReference;
      requestBody.recurringProcessingModel = "CardOnFile";
      requestBody.storePaymentMethodMode = "askForConsent";
    }

    if (shopperEmail) requestBody.shopperEmail = shopperEmail;

    const response = await adyenCheckout(creds, "/sessions", requestBody);

    return NextResponse.json({ requestBody, response });
  } catch (err) {
    return routeError(err);
  }
}
