import { http, HttpResponse } from "msw";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Shared mock state — multiple company accounts with one active, plus users.
// Lets the account switcher and admin panel behave coherently in mock mode.
// ---------------------------------------------------------------------------

interface MockAccount {
  id: string;
  label: string;
  clientKey: string;
  merchantAccount: string;
  locked: boolean;
  apiKeyConfigured: boolean;
}

const mockAccounts: MockAccount[] = [
  { id: "acct-1", label: "Primary", clientKey: "test_MOCKPRIMARY0000000000000000000000", merchantAccount: "MockMerchantECOM", locked: false, apiKeyConfigured: true },
  { id: "acct-2", label: "Secondary Co", clientKey: "test_MOCKSECONDARY00000000000000000000", merchantAccount: "SecondaryCoECOM", locked: false, apiKeyConfigured: true },
];
let mockActiveId = "acct-1";
let mockAccountSeq = 2;
const FALLBACK_ACCOUNT: MockAccount = { id: "", label: "", clientKey: "", merchantAccount: "", locked: false, apiKeyConfigured: false };
const activeAccount = (): MockAccount => mockAccounts.find((a) => a.id === mockActiveId) ?? mockAccounts[0] ?? FALLBACK_ACCOUNT;
const toAccountDto = (a: MockAccount) => ({ ...a, isActive: a.id === mockActiveId });

interface MockUser {
  userId: string;
  email: string;
  role: "admin" | "im" | "user";
}

const mockUsers: MockUser[] = [
  { userId: "me", email: "me@adyen.com", role: "admin" },
  { userId: "u2", email: "colleague@adyen.com", role: "im" },
  { userId: "u3", email: "viewer@adyen.com", role: "user" },
];

// ---------------------------------------------------------------------------
// 1. Config
// ---------------------------------------------------------------------------

const configHandlers = [
  http.get("/api/config/client", async () => {
    await delay(120);
    const active = activeAccount();
    return HttpResponse.json({
      clientKey: active.clientKey,
      environment: "test",
      merchantAccount: active.merchantAccount,
    });
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

const configFor = (account: MockAccount) => ({
  role: "admin" as const,
  clientKey: account.clientKey,
  merchantAccount: account.merchantAccount,
  environment: "test" as const,
  isCustom: true,
  locked: account.locked,
  apiKeyConfigured: account.apiKeyConfigured,
  canConfigure: true,
});

const authHandlers = [
  http.get("/api/auth/config", async () => {
    await delay(100);
    return HttpResponse.json(configFor(activeAccount()));
  }),

  http.put("/api/auth/config", async ({ request }) => {
    await delay(200);
    const body = (await request.json().catch(() => ({}))) as Partial<MockAccount>;
    const active = activeAccount();
    if (body.clientKey) active.clientKey = body.clientKey;
    if (body.merchantAccount) active.merchantAccount = body.merchantAccount;
    active.apiKeyConfigured = true;
    return HttpResponse.json(configFor(active));
  }),

  // --- Multiple saved company accounts ---
  http.get("/api/auth/accounts", async () => {
    await delay(120);
    return HttpResponse.json({ accounts: mockAccounts.map(toAccountDto) });
  }),

  http.post("/api/auth/accounts", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { label?: string; clientKey: string; merchantAccount: string };
    mockAccountSeq += 1;
    const account: MockAccount = {
      id: `acct-${mockAccountSeq}`,
      label: body.label || "",
      clientKey: body.clientKey,
      merchantAccount: body.merchantAccount,
      locked: false,
      apiKeyConfigured: true,
    };
    mockAccounts.push(account);
    if (mockAccounts.length === 1) mockActiveId = account.id;
    return HttpResponse.json(toAccountDto(account));
  }),

  http.put("/api/auth/accounts/:id", async ({ params, request }) => {
    await delay(200);
    const account = mockAccounts.find((a) => a.id === params.id);
    if (!account) return HttpResponse.json({ detail: "Account not found" }, { status: 404 });
    const body = (await request.json()) as { label?: string; clientKey: string; merchantAccount: string };
    account.label = body.label || "";
    account.clientKey = body.clientKey;
    account.merchantAccount = body.merchantAccount;
    account.apiKeyConfigured = true;
    return HttpResponse.json(toAccountDto(account));
  }),

  http.delete("/api/auth/accounts/:id", async ({ params }) => {
    await delay(150);
    const index = mockAccounts.findIndex((a) => a.id === params.id);
    if (index === -1) return HttpResponse.json({ detail: "Account not found" }, { status: 404 });
    mockAccounts.splice(index, 1);
    if (mockActiveId === params.id) mockActiveId = mockAccounts[0]?.id ?? "";
    return new HttpResponse(null, { status: 204 });
  }),

  http.put("/api/auth/accounts/:id/activate", async ({ params }) => {
    await delay(150);
    const account = mockAccounts.find((a) => a.id === params.id);
    if (!account) return HttpResponse.json({ detail: "Account not found" }, { status: 404 });
    mockActiveId = account.id;
    return HttpResponse.json(toAccountDto(account));
  }),
];

// ---------------------------------------------------------------------------
// Admin — user & role management
// ---------------------------------------------------------------------------

const adminHandlers = [
  http.get("/api/admin/users", async () => {
    await delay(150);
    return HttpResponse.json({ users: mockUsers });
  }),

  http.put("/api/admin/users/:id/role", async ({ params, request }) => {
    await delay(200);
    const body = (await request.json()) as { role: "admin" | "im" | "user" };
    const user = mockUsers.find((u) => u.userId === params.id);
    if (user) user.role = body.role;
    return HttpResponse.json(
      user ?? { userId: params.id, email: "unknown@adyen.com", role: body.role },
    );
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
  ...adminHandlers,
  ...webhookHandlers,
  ...valOtpHandlers,
];
