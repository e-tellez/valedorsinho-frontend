import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenManagement, routeError, AdyenRouteError } from "@/lib/adyen/server";

/**
 * GET /api/fleet/stores?merchantId={id}
 *
 * Returns the list of stores for a given merchant account
 * via the Adyen Management API (/v3/merchants/{merchantId}/stores).
 *
 * Response: { data: Store[] }
 */
export async function GET(req: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get("merchantId");

    if (!merchantId) {
      throw new AdyenRouteError(400, "BAD_REQUEST", "merchantId query parameter is required.");
    }

    const result = await adyenManagement<{ data: unknown[]; itemsTotal?: number }>(
      creds,
      `/merchants/${encodeURIComponent(merchantId)}/stores`,
      { pageSize: "100" },
    );

    return NextResponse.json({ data: result.data ?? [] });
  } catch (err) {
    return routeError(err);
  }
}
