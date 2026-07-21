import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenManagement, routeError, AdyenRouteError } from "@/lib/adyen/server";

/**
 * GET /api/terminal/terminals?merchantIds={id}[&storeIds={id}][&pageSize=100]
 *
 * Returns the list of terminals for a given merchant (and optionally store)
 * via the Adyen Management API (/v3/terminals).
 *
 * Response: { data: Terminal[] }
 */
export async function GET(req: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const { searchParams } = new URL(req.url);
    const merchantIds = searchParams.get("merchantIds");

    if (!merchantIds) {
      throw new AdyenRouteError(400, "BAD_REQUEST", "merchantIds query parameter is required.");
    }

    const params: Record<string, string> = {
      merchantIds,
      pageSize: searchParams.get("pageSize") ?? "100",
    };

    const storeIds = searchParams.get("storeIds");
    if (storeIds) params.storeIds = storeIds;

    const result = await adyenManagement<{ data: unknown[]; itemsTotal?: number }>(
      creds,
      "/terminals",
      params,
    );

    return NextResponse.json({ data: result.data ?? [] });
  } catch (err) {
    return routeError(err);
  }
}
