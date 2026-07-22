import { NextResponse } from "next/server";
import { VERTICALS } from "@/lib/adyen/verticals";

/**
 * GET /api/tools/verticals
 *
 * Returns the list of merchant vertical definitions with their recommended
 * /payments payload fields. These are static; no Adyen API call is made.
 *
 * Response: Vertical[]
 */

export async function GET() {
  return NextResponse.json(VERTICALS);
}
