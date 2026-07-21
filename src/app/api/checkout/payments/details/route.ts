import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenCheckout, routeError } from "@/lib/adyen/server";

/**
 * POST /api/checkout/payments/details
 *
 * Called by the Adyen SDK onAdditionalDetails callback after a 3DS challenge
 * or redirect. Forwards the SDK's state.data directly to Adyen and returns
 * the final payment result.
 *
 * Expected body: { details, paymentData? }
 */
export async function POST(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await request.json();
    const { details, paymentData } = body;

    const adyenPayload: Record<string, unknown> = { details };
    if (paymentData) adyenPayload.paymentData = paymentData;

    const response = await adyenCheckout(creds, "/payments/details", adyenPayload);

    return NextResponse.json(response);
  } catch (err) {
    return routeError(err);
  }
}
