import { type NextRequest, NextResponse } from "next/server";
import {
  requireAdyenCreds,
  adyenManagementPost,
  routeError,
  AdyenRouteError,
} from "@/lib/adyen/server";

/**
 * POST /api/fleet/reassign
 *
 * Body: { terminalIds: string[], storeId: string, merchantId: string }
 *
 * Reassigns each terminal to the target store via the Adyen Management API
 * (POST /v3/terminals/{terminalId}/reassign).
 *
 * Response: { summary: string }
 */
export async function POST(req: NextRequest) {
  try {
    const creds = await requireAdyenCreds();

    const body = await req.json();
    const { terminalIds, storeId, merchantId } = body as {
      terminalIds?: string[];
      storeId?: string;
      merchantId?: string;
    };

    if (!terminalIds || terminalIds.length === 0) {
      throw new AdyenRouteError(400, "BAD_REQUEST", "terminalIds is required and must be non-empty.");
    }
    if (!storeId) {
      throw new AdyenRouteError(400, "BAD_REQUEST", "storeId is required.");
    }
    if (!merchantId) {
      throw new AdyenRouteError(400, "BAD_REQUEST", "merchantId is required.");
    }

    const results = await Promise.allSettled(
      terminalIds.map((id) =>
        adyenManagementPost(creds, `/terminals/${encodeURIComponent(id)}/reassign`, {
          merchantId,
          storeId,
        }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;

    const summary =
      failed === 0
        ? `${succeeded} terminal${succeeded !== 1 ? "s" : ""} reassigned successfully.`
        : `${succeeded} succeeded, ${failed} failed.`;

    return NextResponse.json({ summary });
  } catch (err) {
    return routeError(err);
  }
}
