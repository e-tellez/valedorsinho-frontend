import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenPal, routeError } from "@/lib/adyen/server";

/**
 * POST /api/checkout/disable
 *
 * Disables (removes) a stored payment method for a shopper via the Adyen
 * Recurring API (POST /pal/servlet/Recurring/v49/disable).
 *
 * Expected body: { shopperReference, storedPaymentMethodId }
 * Returns:       { response: "[detail-successfully-disabled]" }
 */
export async function POST(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await request.json();
    const { shopperReference, storedPaymentMethodId } = body;

    const adyenPayload = {
      merchantAccount: creds.merchantAccount,
      shopperReference,
      recurringDetailReference: storedPaymentMethodId,
    };

    const response = await adyenPal(
      creds,
      "/pal/servlet/Recurring/v49/disable",
      adyenPayload,
    );

    return NextResponse.json(response);
  } catch (err) {
    return routeError(err);
  }
}
