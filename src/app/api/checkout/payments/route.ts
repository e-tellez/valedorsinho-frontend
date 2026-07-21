import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenCheckout, routeError } from "@/lib/adyen/server";

/**
 * POST /api/checkout/payments
 *
 * Expected body (from the Adyen SDK onSubmit + frontend fields):
 *   paymentMethod, amountValue, currency, countryCode, shopperReference,
 *   isGuest, shopperEmail?, browserInfo?, billingAddress?,
 *   storePaymentMethod?, returnUrl, origin
 *
 * Transforms into an Adyen /v71/payments payload and returns the raw
 * Adyen response (resultCode, pspReference, action?, ...).
 */
export async function POST(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await request.json();
    const {
      paymentMethod,
      amountValue,
      currency,
      countryCode,
      shopperReference,
      isGuest,
      shopperEmail,
      browserInfo,
      billingAddress,
      storePaymentMethod,
      returnUrl,
      origin,
    } = body;

    const adyenPayload: Record<string, unknown> = {
      merchantAccount: creds.merchantAccount,
      paymentMethod,
      amount: { value: amountValue ?? 0, currency: currency ?? "USD" },
      reference: `val-${crypto.randomUUID()}`,
      countryCode: countryCode ?? "US",
      channel: "Web",
      returnUrl,
      origin,
      additionalData: { allow3DS2: "true" },
      threeDS2RequestData: { nativeThreeDS: "preferred" },
    };

    if (!isGuest && shopperReference) {
      adyenPayload.shopperReference = shopperReference;
      adyenPayload.recurringProcessingModel = "CardOnFile";
      adyenPayload.shopperInteraction = "Ecommerce";
    }

    if (storePaymentMethod) {
      adyenPayload.storePaymentMethod = true;
    }

    if (shopperEmail) adyenPayload.shopperEmail = shopperEmail;
    if (browserInfo) adyenPayload.browserInfo = browserInfo;
    if (billingAddress) adyenPayload.billingAddress = billingAddress;

    const response = await adyenCheckout(creds, "/payments", adyenPayload);

    return NextResponse.json(response);
  } catch (err) {
    return routeError(err);
  }
}
