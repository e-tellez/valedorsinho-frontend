import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenCheckout, routeError } from "@/lib/adyen/server";

/**
 * POST /api/checkout/apple-pay/payments
 *
 * Submits an Apple Pay payment to Adyen's /payments endpoint with the
 * Meses Sin Intereses (MSI) installments object for the Mexico market.
 *
 * Expected body:
 *   applePayToken   — base64-encoded, stringified paymentData from Apple Pay
 *   amountValue     — amount in minor units (e.g. 100000 = MXN 1,000.00)
 *   currency        — ISO 4217 currency code (default: "MXN")
 *   countryCode     — ISO 3166-1 alpha-2 country code (default: "MX")
 *   installmentCount — number of monthly installments: 3, 6, 9, or 12
 *
 * Returns:
 *   { requestBody, response }
 */
export async function POST(request: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await request.json();
    const {
      applePayToken,
      amountValue,
      currency = "MXN",
      countryCode = "MX",
      installmentCount,
    } = body as {
      applePayToken: string;
      amountValue: number;
      currency?: string;
      countryCode?: string;
      installmentCount: number;
    };

    if (!applePayToken) {
      return NextResponse.json(
        { error: { code: "MISSING_TOKEN", message: "applePayToken is required." } },
        { status: 400 },
      );
    }

    if (!installmentCount || ![3, 6, 9, 12].includes(installmentCount)) {
      return NextResponse.json(
        { error: { code: "INVALID_INSTALLMENTS", message: "installmentCount must be 3, 6, 9, or 12." } },
        { status: 400 },
      );
    }

    const requestBody: Record<string, unknown> = {
      merchantAccount: creds.merchantAccount,
      paymentMethod: {
        type: "applepay",
        // applePayToken must be the raw paymentData JSON object stringified
        // and then base64-encoded. The frontend handles this encoding.
        applePayToken,
      },
      amount: {
        value: amountValue ?? 0,
        currency,
      },
      reference: `apple-pay-msi-${crypto.randomUUID()}`,
      countryCode,
      channel: "Web",
      // Meses Sin Intereses (MSI) installments for Mexico.
      // Adyen settles the full amount immediately; the issuer bank splits
      // the charges across the requested number of months at 0% interest.
      installments: {
        value: installmentCount,
      },
      // returnUrl is not typically used for Apple Pay (no redirect flow),
      // but Adyen requires it in the payload.
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/apple-pay-msi`,
    };

    const response = await adyenCheckout(creds, "/payments", requestBody);

    return NextResponse.json({ requestBody, response });
  } catch (err) {
    return routeError(err);
  }
}
