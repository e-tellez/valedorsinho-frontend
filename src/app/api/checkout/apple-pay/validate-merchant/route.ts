import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenCheckout, routeError } from "@/lib/adyen/server";

/**
 * POST /api/checkout/apple-pay/validate-merchant
 *
 * Proxies the Apple Pay merchant validation step.
 * Called when the native ApplePaySession fires its `onvalidatemerchant` event.
 *
 * Because we use Adyen's internal Apple Pay certificate, we do NOT contact
 * Apple directly. Instead we POST to Adyen's /applePay/sessions endpoint
 * and Adyen handles the Apple server communication on our behalf.
 *
 * Expected body:
 *   validationURL     — the URL provided by the onvalidatemerchant event
 *   merchantIdentifier — from /paymentMethods response (configuration.merchantId)
 *   displayName        — from /paymentMethods response (configuration.merchantName)
 *   domainName         — window.location.hostname (must match registered domain)
 *
 * Returns:
 *   { merchantSession, requestBody, response }
 */
export async function POST(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await request.json();
    const { validationURL, merchantIdentifier, displayName, domainName } = body as {
      validationURL: string;
      merchantIdentifier: string;
      displayName: string;
      domainName: string;
    };

    if (!validationURL || !merchantIdentifier || !displayName || !domainName) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELDS", message: "validationURL, merchantIdentifier, displayName, and domainName are required." } },
        { status: 400 },
      );
    }

    const requestBody = {
      merchantAccount: creds.merchantAccount,
      displayName,
      domainName,
      merchantIdentifier,
    };

    // Adyen's /applePay/sessions endpoint contacts Apple's validation URL and
    // returns the opaque merchant session object to pass to
    // session.completeMerchantValidation().
    const response = await adyenCheckout(creds, "/applePay/sessions", requestBody);

    return NextResponse.json({ merchantSession: response, requestBody, response });
  } catch (err) {
    return routeError(err);
  }
}
