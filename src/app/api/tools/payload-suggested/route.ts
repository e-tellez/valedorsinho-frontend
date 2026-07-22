import { type NextRequest, NextResponse } from "next/server";
import type { Vertical } from "@/lib/adyen/types";

/**
 * POST /api/tools/payload-suggested
 *
 * Body: { verticals: string[] }
 *
 * Merges the payload fields from the selected merchant verticals into a
 * recommended base /payments payload. No Adyen API call is made.
 *
 * Response: { payload: Record<string, unknown> }
 */

// ---------------------------------------------------------------------------
// Vertical payload registry — keep in sync with /api/tools/verticals
// ---------------------------------------------------------------------------

const VERTICAL_PAYLOADS: Record<string, Record<string, unknown>> = {
  minimum_mandatory: {
    shopperIP: "192.0.2.1",
    channel: "Web",
    origin: "https://your-website.com",
    countryCode: "NL",
    shopperLocale: "en-US",
    browserInfo: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
      acceptHeader: "*/*",
      language: "en-US",
      colorDepth: 24,
      screenHeight: 1080,
      screenWidth: 1920,
      timeZoneOffset: -60,
      javaEnabled: false,
    },
  },
  hotels: {
    additionalData: {
      "lodging.checkInDate": "2024-01-15",
      "lodging.checkOutDate": "2024-01-18",
      "lodging.totalRoomTax": "1500",
      "lodging.roomTax": "500",
      "lodging.roomRate": "5000",
      "lodging.noShowIndicator": "0",
      "lodging.folioNumber": "FOL-001",
      "lodging.fireSafetyActIndicator": "1",
      "lodging.propertyPhoneNumber": "+1-800-000-0000",
    },
  },
  airlines: {
    additionalData: {
      "airline.flight_date": "2024-01-15",
      "airline.flight_number": "AB1234",
      "airline.passenger_name": "John Doe",
      "airline.ticket_number": "ABC123456789",
      "airline.origin_airport_code": "MEX",
      "airline.destination_airport_code": "JFK",
      "airline.airline_code": "AB",
      "airline.number_in_party": "1",
      "airline.agency_plan_name": "DIRECT",
      "airline.boarding_fee": "0",
    },
  },
  digital_wallet: {
    shopperReference: "YOUR_SHOPPER_REFERENCE",
    shopperEmail: "shopper@example.com",
    shopperInteraction: "Ecommerce",
  },
  subscription: {
    shopperReference: "YOUR_SHOPPER_REFERENCE",
    shopperEmail: "shopper@example.com",
    storePaymentMethod: true,
    shopperInteraction: "Ecommerce",
    recurringProcessingModel: "Subscription",
  },
  ride_hailing: {
    additionalData: {
      "ridehailing.arrivalCity": "Amsterdam",
      "ridehailing.departureCity": "Rotterdam",
      "ridehailing.driverName": "Jane Doe",
      "ridehailing.vehicleType": "sedan",
      "ridehailing.pickupDate": "2024-01-15T10:00:00.000Z",
      "ridehailing.dropoffDate": "2024-01-15T10:45:00.000Z",
    },
  },
  restaurants: {
    additionalData: {
      "foodAndBeverage.customerRefNumber": "ORDER-001",
      "foodAndBeverage.tipAmount": "200",
    },
  },
  retail: {
    shopperReference: "YOUR_SHOPPER_REFERENCE",
    shopperEmail: "shopper@example.com",
    shopperInteraction: "Ecommerce",
  },
  tickets: {
    additionalData: {
      "ticket.number_in_party": "2",
      "ticket.event_city": "Amsterdam",
      "ticket.event_date": "2024-03-15T20:00:00.000Z",
      "ticket.event_name": "Concert",
      "ticket.venue_name": "Ziggo Dome",
    },
  },
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const verticals: string[] = body?.verticals ?? [];

    // Base payload always included
    const base: Record<string, unknown> = {
      merchantAccount: "YOUR_MERCHANT_ACCOUNT",
      reference: "ORDER-REFERENCE",
      amount: { value: 1000, currency: "EUR" },
      paymentMethod: { type: "scheme" },
      returnUrl: "https://your-website.com/checkout/result",
    };

    // Merge vertical-specific fields; additionalData objects are deep-merged
    let mergedAdditionalData: Record<string, unknown> = {};

    for (const key of verticals) {
      const fields = VERTICAL_PAYLOADS[key];
      if (!fields) continue;

      for (const [field, value] of Object.entries(fields)) {
        if (field === "additionalData" && typeof value === "object" && value !== null) {
          mergedAdditionalData = { ...mergedAdditionalData, ...(value as Record<string, unknown>) };
        } else {
          base[field] = value;
        }
      }
    }

    if (Object.keys(mergedAdditionalData).length > 0) {
      base.additionalData = mergedAdditionalData;
    }

    return NextResponse.json({ payload: base });
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
      { status: 400 },
    );
  }
}
