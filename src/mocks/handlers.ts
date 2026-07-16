import { http, HttpResponse } from "msw";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 1. Config
// ---------------------------------------------------------------------------

const configHandlers = [
  http.get("/api/config/client", async () => {
    await delay(120);
    return HttpResponse.json({
      clientKey: "test_MOCK0000000000000000000000000000000",
      environment: "test",
      merchantAccount: "MockMerchantECOM",
    });
  }),

  http.get("/api/config/setup", async () => {
    await delay(80);
    return HttpResponse.json({
      apiKey: "mock_AQE...",
      clientKey: "test_MOCK0000000000000000000000000000000",
      merchantAccount: "MockMerchantECOM",
      locked: false,
    });
  }),

  http.put("/api/config/setup", async () => {
    await delay(200);
    return HttpResponse.json({ success: true });
  }),
];

// ---------------------------------------------------------------------------
// 2. Online Checkout
// ---------------------------------------------------------------------------

const checkoutHandlers = [
  http.get("/api/checkout/payment-methods", async () => {
    await delay(300);
    return HttpResponse.json({
      requestBody: {
        merchantAccount: "MockMerchantECOM",
        countryCode: "MX",
        amount: { value: 1000, currency: "MXN" },
      },
      response: {
        paymentMethods: [
          { name: "Credit Card", type: "scheme", brands: ["visa", "mc", "amex"] },
          { name: "OXXO", type: "oxxo" },
        ],
        storedPaymentMethods: [
          {
            id: "stored_mock_001",
            name: "VISA",
            type: "scheme",
            brand: "visa",
            lastFour: "1234",
            expiryMonth: "03",
            expiryYear: "2030",
          },
        ],
      },
    });
  }),

  http.post("/api/checkout/sessions", async () => {
    await delay(400);
    return HttpResponse.json({
      requestBody: {
        merchantAccount: "MockMerchantECOM",
        reference: `mock-ref-${Date.now()}`,
        amount: { value: 1000, currency: "MXN" },
        countryCode: "MX",
        returnUrl: "http://localhost:3000/checkout/result",
      },
      response: {
        id: `CS_MOCK${Date.now()}`,
        sessionData: "mock_session_data_string",
      },
    });
  }),

  http.post("/api/checkout/payments", async () => {
    await delay(500);
    return HttpResponse.json({
      resultCode: "Authorised",
      pspReference: `MOCK_PSP_${Date.now()}`,
    });
  }),

  http.post("/api/checkout/payments/details", async () => {
    await delay(350);
    return HttpResponse.json({
      resultCode: "Authorised",
      pspReference: `MOCK_PSP_DETAILS_${Date.now()}`,
    });
  }),

  http.post("/api/checkout/redirect", async () => {
    await delay(300);
    return HttpResponse.json({
      resultCode: "Authorised",
      pspReference: `MOCK_PSP_REDIRECT_${Date.now()}`,
    });
  }),

  http.post("/api/checkout/disable", async () => {
    await delay(250);
    return HttpResponse.json({
      response: "[detail-successfully-disabled]",
    });
  }),
];

// ---------------------------------------------------------------------------
// 3. Terminal Payments
// ---------------------------------------------------------------------------

const terminalHandlers = [
  http.get("/api/terminal/merchants", async () => {
    await delay(200);
    return HttpResponse.json({
      data: [
        { id: "MockMerchantECOM", name: "Mock Merchant ECOM", companyId: "MockCompany" },
        { id: "MockMerchantPOS", name: "Mock Merchant POS", companyId: "MockCompany" },
      ],
    });
  }),

  http.get("/api/terminal/stores", async () => {
    await delay(200);
    return HttpResponse.json({
      data: [
        { id: "ST_001", reference: "ST_001", description: "Mexico City Store", shopperStatement: "MX Store" },
        { id: "ST_002", reference: "ST_002", description: "Guadalajara Store", shopperStatement: "GDL Store" },
      ],
    });
  }),

  http.get("/api/terminal/terminals", async () => {
    await delay(250);
    return HttpResponse.json({
      data: [
        { id: "P400Plus-123456789", model: "P400Plus" },
        { id: "V400m-987654321", model: "V400m" },
      ],
    });
  }),

  http.post("/api/terminal/make-payment", async () => {
    await delay(1200);
    return HttpResponse.json({
      SaleToPOIResponse: {
        MessageHeader: {
          ProtocolVersion: "3.0",
          MessageClass: "Service",
          MessageCategory: "Payment",
          MessageType: "Response",
          ServiceID: "mock-service-id",
          SaleID: "Valedorsinho",
          POIID: "P400Plus-123456789",
        },
        PaymentResponse: {
          Response: { Result: "Success" },
          POIData: { POITransactionID: { TransactionID: `MOCK_TXN_${Date.now()}`, TimeStamp: new Date().toISOString() } },
          PaymentResult: {
            PaymentAcquirerData: { AcquirerTransactionID: { TransactionID: `ACQ_${Date.now()}` } },
            PaymentInstrumentData: {
              CardData: {
                MaskedPan: "****1234",
                PaymentBrand: "VISA",
                EntryMode: ["Contactless"],
              },
            },
          },
        },
      },
    });
  }),

  http.post("/api/terminal/decode-response", async () => {
    await delay(150);
    return HttpResponse.json({
      success: true,
      resultTitle: "Payment Authorised",
      resultMessage: "The payment was successfully processed.",
      decodedAdditionalResponse: {},
      paymentSummary: [
        { label: "Card", value: "VISA ****1234" },
        { label: "Entry Mode", value: "Contactless" },
        { label: "PSP Reference", value: `MOCK_${Date.now()}` },
      ],
    });
  }),
];

// ---------------------------------------------------------------------------
// 4. Fleet Management
// ---------------------------------------------------------------------------

const fleetHandlers = [
  http.get("/api/fleet/terminals", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("pageNumber") ?? "1");
    const size = parseInt(url.searchParams.get("pageSize") ?? "20");
    const now = new Date().toISOString();

    const all = Array.from({ length: 45 }, (_, i) => ({
      id: `P400Plus-${String(i + 1).padStart(9, "0")}`,
      model: i % 3 === 0 ? "V400m" : i % 2 === 0 ? "P400Plus" : "S1F2",
      serialNumber: `SN${String(100000 + i).padStart(9, "0")}`,
      firmwareVersion: "4.11.3",
      lastActivityAt: now,
      assignment: {
        companyId: "MockCompany",
        merchantId: "MockMerchantECOM",
        storeId: i % 2 === 0 ? "ST_001" : "ST_002",
        status: "Boarded",
      },
    }));

    const start = (page - 1) * size;
    return HttpResponse.json({
      data: all.slice(start, start + size),
      pagesTotal: Math.ceil(all.length / size),
    });
  }),

  http.get("/api/fleet/stores", async () => {
    await delay(200);
    return HttpResponse.json({
      data: [
        { id: "ST_001", reference: "ST_001", description: "Mexico City Store", shopperStatement: "MX Store" },
        { id: "ST_002", reference: "ST_002", description: "Guadalajara Store", shopperStatement: "GDL Store" },
      ],
    });
  }),

  http.post("/api/fleet/reassign", async () => {
    await delay(400);
    return HttpResponse.json({ summary: "Reassignment complete." });
  }),
];

// ---------------------------------------------------------------------------
// 5. Tools
// ---------------------------------------------------------------------------

const toolsHandlers = [
  http.get("/api/tools/verticals", async () => {
    await delay(150);
    return HttpResponse.json([
      { key: "minimum_mandatory", label: "Minimum Mandatory", description: "Core risk fields recommended for every /payments request.", payload: {} },
      { key: "hotels", label: "Hotels", description: "Lodging-specific fields for hotel bookings.", payload: {} },
      { key: "airlines", label: "Airlines", description: "Airline-specific fields for flight bookings.", payload: {} },
      { key: "digital_wallet", label: "Digital Wallet", description: "E-wallet and top-up flows.", payload: {} },
      { key: "subscription", label: "Subscription", description: "Recurring billing and subscription payments.", payload: {} },
      { key: "ride_hailing", label: "Ride Hailing", description: "Taxi and ride-sharing payments.", payload: {} },
      { key: "restaurants", label: "Restaurants", description: "Food & beverage point-of-sale.", payload: {} },
      { key: "retail", label: "Retail", description: "Physical retail and ECOM.", payload: {} },
      { key: "tickets", label: "Tickets", description: "Event ticketing and admission.", payload: {} },
    ]);
  }),

  http.post("/api/tools/payload-suggested", async () => {
    await delay(250);
    return HttpResponse.json({
      payload: {
        merchantAccount: "MockMerchantECOM",
        reference: "mock-order-001",
        amount: { value: 1000, currency: "EUR" },
        paymentMethod: { type: "scheme" },
        returnUrl: "http://localhost:3000/checkout/result",
        shopperIP: "192.0.2.1",
        shopperLocale: "en-US",
        countryCode: "MX",
      },
    });
  }),

  http.post("/api/tools/validate-payload", async () => {
    await delay(300);
    return HttpResponse.json({
      valid: true,
      errors: [],
    });
  }),
];

// ---------------------------------------------------------------------------
// 6. Auth
// ---------------------------------------------------------------------------

const authHandlers = [
  http.get("/api/auth/config", async () => {
    await delay(100);
    return HttpResponse.json({
      role: "im",
      api_key: "mock_AQE...",
      client_key: "test_MOCK0000000000000000000000000000000",
      merchant_account: "MockMerchantECOM",
      environment: "test",
      is_custom: false,
      locked: false,
    });
  }),

  http.put("/api/auth/config", async () => {
    await delay(200);
    return HttpResponse.json({
      role: "im",
      api_key: "mock_AQE...",
      client_key: "test_MOCK0000000000000000000000000000000",
      merchant_account: "MockMerchantECOM",
      environment: "test",
      is_custom: true,
      locked: false,
    });
  }),
];

// ---------------------------------------------------------------------------
// 7. Webhooks
// ---------------------------------------------------------------------------

const webhookHandlers = [
  http.get("/api/webhooks", async () => {
    await delay(200);
    const now = new Date();
    return HttpResponse.json({
      items: Array.from({ length: 10 }, (_, i) => ({
        id: `mock-webhook-${i + 1}`,
        user_id: "mock-user-id",
        merchant_account: "MockMerchantECOM",
        event_code: i % 2 === 0 ? "AUTHORISATION" : "CAPTURE",
        psp_reference: `MOCK_PSP_${i + 1}`,
        merchant_reference: `order-${100 + i}`,
        amount_value: 1000,
        amount_currency: "MXN",
        success: true,
        live: false,
        received_at: new Date(now.getTime() - i * 3600000).toISOString(),
        expires_at: new Date(now.getTime() + (3 - i) * 86400000).toISOString(),
      })),
    });
  }),

  http.get("/api/webhooks/:id", async ({ params }) => {
    await delay(150);
    return HttpResponse.json({
      id: params.id,
      user_id: "mock-user-id",
      merchant_account: "MockMerchantECOM",
      event_code: "AUTHORISATION",
      psp_reference: `MOCK_PSP_${params.id}`,
      merchant_reference: "order-001",
      amount_value: 1000,
      amount_currency: "MXN",
      success: true,
      live: false,
      received_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3 * 86400000).toISOString(),
      payload: {
        live: "false",
        notificationItems: [
          {
            NotificationRequestItem: {
              eventCode: "AUTHORISATION",
              merchantAccountCode: "MockMerchantECOM",
              pspReference: `MOCK_PSP_${params.id}`,
              merchantReference: "order-001",
              amount: { currency: "MXN", value: 1000 },
              success: "true",
              eventDate: new Date().toISOString(),
            },
          },
        ],
      },
    });
  }),
];

// ---------------------------------------------------------------------------
// Valedorsinho auth (OTP send — frontend Route Handler, intercepted for mock)
// ---------------------------------------------------------------------------

const valOtpHandlers = [
  http.post("/api/auth/send-otp", async () => {
    await delay(300);
    return HttpResponse.json({ success: true });
  }),
];

// ---------------------------------------------------------------------------
// Export all handlers
// ---------------------------------------------------------------------------

export const handlers = [
  ...configHandlers,
  ...checkoutHandlers,
  ...terminalHandlers,
  ...fleetHandlers,
  ...toolsHandlers,
  ...authHandlers,
  ...webhookHandlers,
  ...valOtpHandlers,
];
