import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, routeError } from "@/lib/adyen/server";

/**
 * POST /api/terminal/decode-response
 *
 * Decodes a raw Adyen Terminal Cloud API response (SaleToPOIResponse)
 * into a structured TerminalPaymentResult for display.
 *
 * The AdditionalResponse field is base64-encoded key=value pairs per the
 * nexo EPAS standard — this route decodes it so the UI can display it.
 *
 * Body:    { SaleToPOIResponse: { ... } }
 * Response: TerminalPaymentResult
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check — ensure the caller is authenticated even though we only
    // process the payload locally (no outbound Adyen call).
    await requireAdyenCreds();

    const body = await req.json();
    const nexoResponse = body?.SaleToPOIResponse ?? {};
    const paymentResponse = nexoResponse?.PaymentResponse ?? {};
    const response = paymentResponse?.Response ?? {};
    const paymentResult = paymentResponse?.PaymentResult ?? {};
    const acquirerData = paymentResult?.PaymentAcquirerData ?? {};
    const cardData = paymentResult?.PaymentInstrumentData?.CardData ?? {};
    const amountsResp = paymentResult?.AmountsResp ?? {};

    const result = response?.Result ?? "Failure";
    const success = result === "Success";

    // Decode the base64 AdditionalResponse (key=value&key2=value2 pairs)
    let decodedAdditionalResponse: Record<string, string> | null = null;
    const additionalRaw: string | undefined = response?.AdditionalResponse;
    if (additionalRaw) {
      try {
        const decoded = Buffer.from(additionalRaw, "base64").toString("utf-8");
        decodedAdditionalResponse = Object.fromEntries(
          decoded.split("&").filter(Boolean).map((pair) => {
            const idx = pair.indexOf("=");
            return idx === -1
              ? [pair, ""]
              : [pair.slice(0, idx), decodeURIComponent(pair.slice(idx + 1))];
          }),
        );
      } catch {
        decodedAdditionalResponse = null;
      }
    }

    // Build human-readable payment summary
    const paymentSummary: Array<{ label: string; value: string }> = [];

    const maskedPan: string | undefined = cardData?.MaskedPan;
    const brand: string | undefined = cardData?.PaymentBrand;
    if (maskedPan || brand) {
      paymentSummary.push({ label: "Card", value: [brand, maskedPan].filter(Boolean).join(" ") });
    }

    const entryModes: string[] | undefined = cardData?.EntryMode;
    if (entryModes?.length) {
      paymentSummary.push({ label: "Entry Mode", value: entryModes.join(", ") });
    }

    const currency: string | undefined = amountsResp?.Currency;
    const amount: number | undefined = amountsResp?.AuthorizedAmount;
    if (currency && amount != null) {
      paymentSummary.push({ label: "Amount", value: `${amount} ${currency}` });
    }

    // PSP reference lives inside AdditionalResponse under "pspReference"
    const pspReference: string | undefined = decodedAdditionalResponse?.pspReference;
    if (pspReference) {
      paymentSummary.push({ label: "PSP Reference", value: pspReference });
    }

    const authCode: string | undefined = decodedAdditionalResponse?.authCode;
    if (authCode) {
      paymentSummary.push({ label: "Auth Code", value: authCode });
    }

    const errorCondition: string | undefined = response?.ErrorCondition;
    const resultTitle = success
      ? "Payment Authorised"
      : `Payment ${errorCondition ? errorCondition.replace(/([A-Z])/g, " $1").trim() : "Failed"}`;

    const resultMessage = success
      ? "The payment was successfully processed."
      : response?.AdditionalResponse
        ? undefined
        : errorCondition ?? "The payment was not completed.";

    return NextResponse.json({
      success,
      resultTitle,
      resultMessage,
      decodedAdditionalResponse,
      paymentSummary,
    });
  } catch (err) {
    return routeError(err);
  }
}
