import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenManagement, routeError } from "@/lib/adyen/server";

/**
 * GET /api/terminal/merchants
 *
 * Returns the list of merchant accounts accessible to the caller's API key
 * via the Adyen Management API (/v3/merchants).
 *
 * Response: { data: MerchantAccount[] }
 */
export async function GET(_req: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const result = await adyenManagement<{ data: unknown[]; itemsTotal?: number }>(
      creds,
      "/merchants",
      { pageSize: "100" },
    );

    return NextResponse.json({ data: result.data ?? [] });
  } catch (err) {
    return routeError(err);
  }
}
