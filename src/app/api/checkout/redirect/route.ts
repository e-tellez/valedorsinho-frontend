import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenCheckout, routeError } from "@/lib/adyen/server";

/**
 * POST /api/checkout/redirect
 *
 * Called from the redirect result page after a shopper returns from an
 * issuer redirect (e.g. 3DS redirect challenge).
 * Wraps the redirectResult into a /payments/details call and returns the
 * final payment result.
 *
 * Expected body: { redirectResult, paymentData? }
 */
export async function POST(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await request.json();
    const { redirectResult, paymentData } = body;

    const adyenPayload: Record<string, unknown> = {
      details: { redirectResult },
    };
    if (paymentData) adyenPayload.paymentData = paymentData;

    const response = await adyenCheckout(creds, "/payments/details", adyenPayload);

    return NextResponse.json(response);
  } catch (err) {
    return routeError(err);
  }
}
