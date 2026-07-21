import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenTerminal, routeError } from "@/lib/adyen/server";

/**
 * POST /api/terminal/make-payment
 *
 * Forwards a NEXO SaleToPOIRequest to the Adyen Terminal Cloud API (/sync)
 * and returns the raw SaleToPOIResponse.
 *
 * Body:    { SaleToPOIRequest: { ... } }
 * Response: { SaleToPOIResponse: { ... } }
 */
export async function POST(req: NextRequest) {
  try {
    const creds = await requireAdyenCreds();
    const body = await req.json();

    const response = await adyenTerminal<Record<string, unknown>>(creds, body);
    return NextResponse.json(response);
  } catch (err) {
    return routeError(err);
  }
}
