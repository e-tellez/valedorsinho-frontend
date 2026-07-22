import { type NextRequest, NextResponse } from "next/server";
import { requireAdyenCreds, adyenManagement, routeError } from "@/lib/adyen/server";

/**
 * GET /api/fleet/terminals?pageNumber=1&pageSize=20[&searchQuery=...]
 *
 * Returns a paginated list of all terminals accessible to the caller's API key
 * via the Adyen Management API (/v3/terminals).
 *
 * Response: { data: Terminal[], pagesTotal?: number }
 */
export async function GET(req: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const { searchParams } = new URL(req.url);

    const params: Record<string, string> = {
      pageNumber: searchParams.get("pageNumber") ?? "1",
      pageSize: searchParams.get("pageSize") ?? "20",
    };

    const searchQuery = searchParams.get("searchQuery");
    if (searchQuery) params.searchQuery = searchQuery;

    const result = await adyenManagement<{ data: unknown[]; pagesTotal?: number }>(
      creds,
      "/terminals",
      params,
    );

    return NextResponse.json({ data: result.data ?? [], pagesTotal: result.pagesTotal ?? 1 });
  } catch (err) {
    return routeError(err);
  }
}
