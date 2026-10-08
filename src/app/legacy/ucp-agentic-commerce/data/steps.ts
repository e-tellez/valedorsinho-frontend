export const PHASES = [
  { id: 'discovery', label: 'Phase 1 — Discovery', color: 'discovery', steps: [1, 2] },
  { id: 'catalog', label: 'Phase 2 — Catalog & Cart', color: 'catalog', steps: [3, 4, 5] },
  { id: 'negotiation', label: 'Phase 3 — Capability Negotiation', color: 'negotiation', steps: [6, 7, 8, 9] },
  { id: 'payment', label: 'Phase 4 — Payment Acquisition', color: 'payment', steps: [10, 11] },
  { id: 'checkout', label: 'Phase 5 — Checkout & Authorization', color: 'checkout', steps: [12, 13, 14] },
  { id: 'order', label: 'Phase 6 — Order & Confirmation', color: 'order', steps: [15] },
];

export const ACTORS = [
  { id: 'agent', label: 'AI Buyer Agent', sublabel: '(Platform)', col: 0 },
  { id: 'wallet', label: 'Credential Provider', sublabel: '(Wallet)', col: 1 },
  { id: 'psp', label: 'PSP Orchestration', sublabel: 'Layer', col: 2 },
  { id: 'merchant', label: 'Merchant Server', sublabel: '(Business)', col: 3 },
  { id: 'network', label: 'Card Network', sublabel: '(Visa/MC)', col: 4 },
];

export const STEPS = [
  {
    id: 1,
    phase: 'discovery',
    from: 'agent',
    to: 'merchant',
    label: 'Discover UCP Profile',
    action: 'GET /.well-known/ucp',
    description:
      'The AI Buyer Agent sends a discovery request to the merchant\'s well-known UCP endpoint. This is the first touch — the agent learns what capabilities, payment handlers, and signing keys the merchant exposes before any transaction begins.',
    ucpDetail: 'Agent discovers merchant profile: services, capabilities, payment handlers, signing keys.',
    capability: null,
    payload: {
      method: 'GET',
      url: 'https://merchant.example.com/.well-known/ucp',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UCPAgent/1.0',
      },
    },
  },
  {
    id: 2,
    phase: 'discovery',
    from: 'merchant',
    to: 'agent',
    label: 'Return UCP Profile',
    action: 'UCP Profile Response',
    description:
      'The Merchant Server returns its full UCP Profile — declaring all supported capabilities, supported payment handler configurations (including PSP public key and token URL), and signing keys for verifying future requests.',
    ucpDetail: 'Declares dev.ucp.shopping.checkout, dev.ucp.shopping.cart, dev.ucp.shopping.catalog.search, dev.ucp.shopping.order, dev.ucp.shopping.fulfillment, dev.ucp.shopping.discount + PSP payment handler config.',
    capability: null,
    payload: {
      ucp_version: '1.0',
      profile_uri: 'https://merchant.example.com/.well-known/ucp',
      merchant: {
        name: 'Acme Shop',
        id: 'merchant_acme_001',
      },
      capabilities: [
        { name: 'dev.ucp.shopping.catalog.search', version: '1.2' },
        { name: 'dev.ucp.shopping.cart', version: '1.0' },
        { name: 'dev.ucp.shopping.checkout', version: '2.1' },
        { name: 'dev.ucp.shopping.order', version: '1.1' },
        { name: 'dev.ucp.shopping.fulfillment', version: '1.0', requires: 'dev.ucp.shopping.checkout' },
        { name: 'dev.ucp.shopping.discount', version: '1.0', requires: 'dev.ucp.shopping.checkout' },
      ],
      payment_handlers: [
        {
          handler_id: 'psp_stripe_001',
          provider: 'Stripe',
          config: {
            token_url: 'https://api.stripe.com/v1/tokens',
            public_key: 'pk_live_acme_xxxxxxxxxxxx',
            supported_networks: ['visa', 'mastercard', 'amex'],
          },
        },
      ],
      signing_keys: [
        {
          kid: 'merchant-key-2024',
          alg: 'ES256',
          use: 'sig',
          kty: 'EC',
        },
      ],
    },
  },
  {
    id: 3,
    phase: 'catalog',
    from: 'agent',
    to: 'merchant',
    label: 'Search Catalog',
    action: 'POST /catalog/search',
    description:
      'The agent searches the merchant\'s product catalog using the discovered catalog.search capability. The UCP-Agent header carries the agent\'s profile URI so the merchant can resolve its identity and capabilities.',
    ucpDetail: 'Capability: dev.ucp.shopping.catalog.search. UCP-Agent header advertises agent profile URI.',
    capability: 'dev.ucp.shopping.catalog.search',
    payload: {
      method: 'POST',
      url: 'https://merchant.example.com/catalog/search',
      headers: {
        'Content-Type': 'application/json',
        'UCP-Agent': 'profile=https://agent.example.com/.well-known/ucp',
      },
      body: {
        query: 'wireless noise-cancelling headphones',
        filters: {
          price_max: 350,
          in_stock: true,
          category: 'electronics',
        },
        limit: 5,
      },
    },
  },
  {
    id: 4,
    phase: 'catalog',
    from: 'merchant',
    to: 'agent',
    label: 'Return Product Results',
    action: 'Catalog Search Response',
    description:
      'The merchant returns matching products. The response includes an active ucp.capabilities[] array showing the intersection of capabilities that both parties mutually support — establishing a capability context for the session.',
    ucpDetail: 'Response includes ucp.capabilities[] — the active intersection of agent and merchant capabilities for this session.',
    capability: 'dev.ucp.shopping.catalog.search',
    payload: {
      'ucp.capabilities': [
        'dev.ucp.shopping.catalog.search',
        'dev.ucp.shopping.cart',
        'dev.ucp.shopping.checkout',
      ],
      results: [
        {
          product_id: 'prod_sony_wh1000xm5',
          name: 'Sony WH-1000XM5 Headphones',
          price: 279.99,
          currency: 'USD',
          in_stock: true,
          rating: 4.8,
          image_url: 'https://cdn.acmeshop.com/products/sony-wh1000xm5.jpg',
        },
        {
          product_id: 'prod_bose_qc45',
          name: 'Bose QuietComfort 45',
          price: 329.00,
          currency: 'USD',
          in_stock: true,
          rating: 4.7,
          image_url: 'https://cdn.acmeshop.com/products/bose-qc45.jpg',
        },
      ],
      total: 2,
    },
  },
  {
    id: 5,
    phase: 'catalog',
    from: 'agent',
    to: 'merchant',
    label: 'Add to Cart',
    action: 'POST /cart',
    description:
      'The agent adds the chosen product to the cart. This uses the dev.ucp.shopping.cart capability. The cart operation is stateful — the merchant returns a cart_id used in subsequent checkout steps.',
    ucpDetail: 'Capability: dev.ucp.shopping.cart. Cart ID returned for checkout session binding.',
    capability: 'dev.ucp.shopping.cart',
    payload: {
      method: 'POST',
      url: 'https://merchant.example.com/cart',
      headers: {
        'Content-Type': 'application/json',
        'UCP-Agent': 'profile=https://agent.example.com/.well-known/ucp',
      },
      body: {
        items: [
          {
            product_id: 'prod_sony_wh1000xm5',
            quantity: 1,
            unit_price: 279.99,
          },
        ],
      },
      response: {
        cart_id: 'cart_8f3k2j9x',
        subtotal: 279.99,
        currency: 'USD',
        item_count: 1,
      },
    },
  },
  {
    id: 6,
    phase: 'negotiation',
    from: 'agent',
    to: 'merchant',
    label: 'Create Checkout Session',
    action: 'POST /checkout-sessions',
    description:
      'The agent initiates a checkout session by posting its own UCP profile URI in the UCP-Agent header. This triggers the critical capability negotiation handshake — the merchant will now fetch and resolve the agent\'s profile to compute a shared capability set.',
    ucpDetail: 'Advertises agent capabilities + supported payment handlers. UCP-Agent header carries profile URI for merchant resolution.',
    capability: 'dev.ucp.shopping.checkout',
    payload: {
      method: 'POST',
      url: 'https://merchant.example.com/checkout-sessions',
      headers: {
        'Content-Type': 'application/json',
        'UCP-Agent': 'profile=https://agent.platform.example/.well-known/ucp; version=1.0',
      },
      body: {
        cart_id: 'cart_8f3k2j9x',
        agent_capabilities: [
          { name: 'dev.ucp.shopping.checkout', version: '2.1' },
          { name: 'dev.ucp.shopping.fulfillment', version: '1.0' },
          { name: 'dev.ucp.shopping.discount', version: '1.0' },
          { name: 'dev.ucp.shopping.order', version: '1.1' },
        ],
        supported_payment_handlers: ['psp_stripe_001', 'psp_adyen_002'],
        fulfillment_preferences: {
          method: 'standard_shipping',
          address: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94105',
            country: 'US',
          },
        },
      },
    },
  },
  {
    id: 7,
    phase: 'negotiation',
    from: 'merchant',
    to: 'agent',
    label: 'Resolve Agent Profile',
    action: 'GET agent profile URI',
    description:
      'The Merchant Server fetches the agent\'s profile from the URI provided in the UCP-Agent header. This is how the merchant independently verifies the agent\'s declared capabilities and resolves its signing keys — no trust on the agent\'s self-reported data alone.',
    ucpDetail: 'Merchant resolves agent signing keys + capabilities from the agent\'s UCP profile endpoint.',
    capability: null,
    payload: {
      method: 'GET',
      url: 'https://agent.platform.example/.well-known/ucp',
      headers: {
        'Accept': 'application/json',
      },
      resolved_profile: {
        ucp_version: '1.0',
        agent_id: 'agent_shopbot_v2',
        platform: 'ShopBot Platform',
        capabilities: [
          { name: 'dev.ucp.shopping.checkout', version: '2.1' },
          { name: 'dev.ucp.shopping.fulfillment', version: '1.0' },
          { name: 'dev.ucp.shopping.discount', version: '1.0' },
          { name: 'dev.ucp.shopping.order', version: '1.1' },
          { name: 'dev.ucp.common.identity_linking', version: '1.0' },
        ],
        signing_keys: [
          { kid: 'agent-key-2024', alg: 'ES256', use: 'sig', kty: 'EC' },
        ],
      },
    },
  },
  {
    id: 8,
    phase: 'negotiation',
    from: 'merchant',
    to: 'merchant',
    label: 'Compute Capability Intersection',
    action: 'Intersection Algorithm',
    description:
      'The merchant runs the UCP capability intersection algorithm: match capabilities by name → select the highest mutually supported version → prune any extensions whose parent capability is absent from either party (e.g., dev.ucp.shopping.discount requires dev.ucp.shopping.checkout). The result is the active capability set for this session.',
    ucpDetail: 'Intersection algorithm: match by name → select highest mutual version → prune orphaned extensions (e.g., dev.ucp.shopping.discount requires dev.ucp.shopping.checkout).',
    capability: null,
    payload: {
      merchant_capabilities: [
        'dev.ucp.shopping.catalog.search@1.2',
        'dev.ucp.shopping.cart@1.0',
        'dev.ucp.shopping.checkout@2.1',
        'dev.ucp.shopping.order@1.1',
        'dev.ucp.shopping.fulfillment@1.0',
        'dev.ucp.shopping.discount@1.0',
      ],
      agent_capabilities: [
        'dev.ucp.shopping.checkout@2.1',
        'dev.ucp.shopping.fulfillment@1.0',
        'dev.ucp.shopping.discount@1.0',
        'dev.ucp.shopping.order@1.1',
        'dev.ucp.common.identity_linking@1.0',
      ],
      intersection_result: [
        { name: 'dev.ucp.shopping.checkout', version: '2.1', status: 'active' },
        { name: 'dev.ucp.shopping.fulfillment', version: '1.0', status: 'active', parent: 'dev.ucp.shopping.checkout' },
        { name: 'dev.ucp.shopping.discount', version: '1.0', status: 'active', parent: 'dev.ucp.shopping.checkout' },
        { name: 'dev.ucp.shopping.order', version: '1.1', status: 'active' },
        { name: 'dev.ucp.shopping.catalog.search', version: null, status: 'pruned', reason: 'not in agent capabilities' },
        { name: 'dev.ucp.common.identity_linking', version: null, status: 'pruned', reason: 'not in merchant capabilities' },
      ],
    },
  },
  {
    id: 9,
    phase: 'negotiation',
    from: 'merchant',
    to: 'agent',
    label: 'Return Checkout Session',
    action: 'Checkout Session Response',
    description:
      'The merchant returns the negotiated checkout session: the active capability set, resolved payment handler configuration (PSP public key + token URL), fulfillment options, and applicable discounts. This is the foundation the agent uses to complete payment.',
    ucpDetail: 'Active ucp.capabilities[], resolved payment_handlers (PSP config + public key + handler_id), fulfillment options, applied discounts.',
    capability: 'dev.ucp.shopping.checkout',
    payload: {
      session_id: 'cs_live_Xk9mJ2pQ8rL4nV6',
      status: 'pending_payment',
      expires_at: '2024-01-15T10:35:00Z',
      'ucp.capabilities': [
        { name: 'dev.ucp.shopping.checkout', version: '2.1' },
        { name: 'dev.ucp.shopping.fulfillment', version: '1.0' },
        { name: 'dev.ucp.shopping.discount', version: '1.0' },
        { name: 'dev.ucp.shopping.order', version: '1.1' },
      ],
      payment_handlers: [
        {
          handler_id: 'psp_stripe_001',
          provider: 'Stripe',
          config: {
            token_url: 'https://api.stripe.com/v1/tokens',
            public_key: 'pk_live_acme_xxxxxxxxxxxx',
            supported_networks: ['visa', 'mastercard', 'amex'],
          },
        },
      ],
      order_summary: {
        items: [{ product_id: 'prod_sony_wh1000xm5', quantity: 1, price: 279.99 }],
        subtotal: 279.99,
        discounts: [{ code: 'AGENT10', amount: -27.99, description: '10% agent discount' }],
        shipping: 0.00,
        tax: 20.16,
        total: 272.16,
        currency: 'USD',
      },
      fulfillment: {
        method: 'standard_shipping',
        estimated_delivery: '2024-01-18',
        carrier: 'UPS',
      },
    },
  },
  {
    id: 10,
    phase: 'payment',
    from: 'agent',
    to: 'wallet',
    label: 'Obtain Payment Credential',
    action: 'Agent ↔ Wallet Authentication',
    description:
      'The agent calls its linked Credential Provider (Wallet) to obtain the user\'s payment credential for this transaction. The wallet authenticates the user (via AP2 mandate or digital wallet token) and returns a credential reference — raw card data never leaves the wallet.',
    ucpDetail: 'Capability: dev.ucp.common.identity_linking. Wallet authenticates user via AP2 mandate or digital wallet token.',
    capability: 'dev.ucp.common.identity_linking',
    payload: {
      method: 'POST',
      url: 'https://wallet.provider.example/credentials/payment',
      headers: {
        'Authorization': 'Bearer agent_token_eyJhbGc...',
        'Content-Type': 'application/json',
      },
      body: {
        merchant_id: 'merchant_acme_001',
        session_id: 'cs_live_Xk9mJ2pQ8rL4nV6',
        amount: 272.16,
        currency: 'USD',
        handler_id: 'psp_stripe_001',
        ap2_mandate: {
          type: 'checkout_mandate',
          scope: ['payment', 'shipping'],
          max_amount: 300.00,
          expires_at: '2024-01-15T11:00:00Z',
        },
      },
      response: {
        credential_ref: 'cred_ref_7xK2mN9pQ3rL',
        card_last4: '4242',
        card_brand: 'visa',
        wallet_token: 'wt_ApplePayToken_xxxx',
        ap2_proof: 'eyJhbGciOiJFUzI1NiJ9.eyJtYW5kYXRlX2lkIjoibWFuZGF0...',
      },
    },
  },
  {
    id: 11,
    phase: 'payment',
    from: 'agent',
    to: 'psp',
    label: 'Tokenize Payment',
    action: 'POST config.token_url (PSP)',
    description:
      'Using the token_url from the PSP handler config (discovered in step 9), the agent calls the PSP tokenization endpoint directly with the wallet credential. The PSP returns an opaque network token. Raw card data never touches the merchant server — minimizing PCI DSS scope.',
    ucpDetail: 'Agent calls PSP tokenization endpoint (config.token_url) directly. PSP returns opaque network token (tok_...) — raw card data never touches merchant.',
    capability: null,
    payload: {
      method: 'POST',
      url: 'https://api.stripe.com/v1/tokens',
      headers: {
        'Authorization': 'Bearer pk_live_acme_xxxxxxxxxxxx',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        wallet_token: 'wt_ApplePayToken_xxxx',
        credential_ref: 'cred_ref_7xK2mN9pQ3rL',
        session_id: 'cs_live_Xk9mJ2pQ8rL4nV6',
      },
      response: {
        id: 'tok_1OxKmJ2eZvKYlo2C8pQrLm4N',
        object: 'token',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2027,
          funding: 'credit',
        },
        created: 1705312800,
        livemode: true,
        type: 'card',
        used: false,
      },
    },
  },
  {
    id: 12,
    phase: 'checkout',
    from: 'agent',
    to: 'merchant',
    label: 'Complete Checkout',
    action: 'POST /checkout-sessions/{id}/complete',
    description:
      'The agent submits the PSP token + handler_id + trust signals to the merchant to complete checkout. Signals include device fingerprint context (buyer_ip, user_agent) and the AP2 checkout mandate proof — cryptographic evidence that a human previously authorized this type of autonomous purchase.',
    ucpDetail: 'signals: dev.ucp.buyer_ip, dev.ucp.user_agent; AP2: checkout_mandate (signed proof).',
    capability: 'dev.ucp.shopping.checkout',
    payload: {
      method: 'POST',
      url: 'https://merchant.example.com/checkout-sessions/cs_live_Xk9mJ2pQ8rL4nV6/complete',
      headers: {
        'Content-Type': 'application/json',
        'UCP-Agent': 'profile=https://agent.platform.example/.well-known/ucp',
      },
      body: {
        payment: {
          handler_id: 'psp_stripe_001',
          token: 'tok_1OxKmJ2eZvKYlo2C8pQrLm4N',
        },
        signals: {
          'dev.ucp.buyer_ip': '198.51.100.42',
          'dev.ucp.user_agent': 'UCPAgent/1.0 ShopBot/2.3',
          'dev.ucp.device_fingerprint': 'fp_Kx9mL2pQ8r',
        },
        ap2: {
          type: 'checkout_mandate',
          proof: 'eyJhbGciOiJFUzI1NiJ9.eyJtYW5kYXRlX2lkIjoibWFuZGF0...',
          mandate_id: 'mandate_user_7xK2mN',
          scope: ['payment', 'shipping'],
        },
      },
    },
  },
  {
    id: 13,
    phase: 'checkout',
    from: 'merchant',
    to: 'psp',
    label: 'Authorize via PSP',
    action: 'PSP Authorization Request',
    description:
      'The Merchant Server submits the PSP token to the PSP authorization API to charge the user. The merchant passes the amount, currency, and metadata. The PSP routes the authorization to the appropriate card network.',
    ucpDetail: 'PSP authorization request using network token. PSP routes to card network for authorization.',
    capability: null,
    payload: {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      headers: {
        'Authorization': 'Bearer sk_live_merchant_secret_key',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': 'cs_live_Xk9mJ2pQ8rL4nV6',
      },
      body: {
        amount: 27216,
        currency: 'usd',
        source: 'tok_1OxKmJ2eZvKYlo2C8pQrLm4N',
        description: 'Acme Shop — Sony WH-1000XM5',
        metadata: {
          session_id: 'cs_live_Xk9mJ2pQ8rL4nV6',
          merchant_id: 'merchant_acme_001',
          agent_id: 'agent_shopbot_v2',
        },
        capture: true,
      },
    },
  },
  {
    id: 14,
    phase: 'checkout',
    from: 'psp',
    to: 'network',
    label: 'Network Authorization & Settlement',
    action: 'Authorization & Settlement',
    description:
      'The PSP routes the authorization to the card network (Visa/Mastercard). The network validates the transaction, checks fraud signals, and returns an authorization code. The PSP captures the funds and initiates settlement.',
    ucpDetail: 'Network returns auth code; PSP captures funds. Settlement T+1.',
    capability: null,
    payload: {
      authorization_request: {
        network: 'visa',
        amount: 27216,
        currency: 'USD',
        merchant_category_code: '5732',
        terminal_id: 'STRIPE_VIRTUAL_001',
        card_token: 'network_token_VIS4242xxxx',
        three_ds_data: {
          eci: '05',
          authentication_value: 'AAABBIIFmAAAAAAAAAAAAAAAAAA=',
          ds_transaction_id: 'f879ea1c-aa2c-4441-8194-xxxx',
        },
      },
      authorization_response: {
        auth_code: 'AUTH_892XKL',
        network_transaction_id: 'VIS_TXN_20240115_8f3k2j9x',
        response_code: '00',
        status: 'approved',
        avs_result: 'Y',
        cvv_result: 'M',
        settlement: {
          status: 'initiated',
          settlement_date: '2024-01-16',
          net_amount: 27216,
        },
      },
    },
  },
  {
    id: 15,
    phase: 'order',
    from: 'merchant',
    to: 'agent',
    label: 'Order Confirmation',
    action: 'Order Confirmation Response',
    description:
      'The Merchant Server returns the final order confirmation to the agent. The transaction lifecycle is complete — the agent can relay the receipt to the end user. The order ID, status, and receipt URL are returned using the dev.ucp.shopping.order capability.',
    ucpDetail: 'Capability: dev.ucp.shopping.order; status completed; order ID, receipt.',
    capability: 'dev.ucp.shopping.order',
    payload: {
      'ucp.capability': 'dev.ucp.shopping.order',
      order_id: 'ord_Kx9mL2pQ8rV6nJ4',
      status: 'completed',
      session_id: 'cs_live_Xk9mJ2pQ8rL4nV6',
      payment: {
        status: 'captured',
        amount: 272.16,
        currency: 'USD',
        auth_code: 'AUTH_892XKL',
        last4: '4242',
        brand: 'visa',
      },
      items: [
        {
          product_id: 'prod_sony_wh1000xm5',
          name: 'Sony WH-1000XM5 Headphones',
          quantity: 1,
          price: 279.99,
        },
      ],
      discounts_applied: [{ code: 'AGENT10', amount: -27.99 }],
      fulfillment: {
        method: 'standard_shipping',
        tracking_number: 'UPS_1Z999AA10123456784',
        estimated_delivery: '2024-01-18',
        carrier: 'UPS',
      },
      receipt_url: 'https://merchant.example.com/receipts/ord_Kx9mL2pQ8rV6nJ4',
      created_at: '2024-01-15T10:34:12Z',
    },
  },
];

export type UcpActor = (typeof ACTORS)[number];
export type UcpPhase = (typeof PHASES)[number];
export type UcpStep = (typeof STEPS)[number];
export type UcpTriggerInitiator = 'user' | 'agent' | 'merchant' | 'psp' | 'network';
export type UcpStepTrigger = {
  initiator: UcpTriggerInitiator;
  causedBy: number | null;
  event: string;
  condition: string;
  field: string | null;
};

export function getPhaseForStep(stepId: number | undefined) {
  return PHASES.find(p => stepId !== undefined && p.steps.includes(stepId));
}

export function getActorByIdMap(): Record<string, UcpActor> {
  return Object.fromEntries(ACTORS.map(a => [a.id, a]));
}

export const STEP_TRIGGERS: Record<number, UcpStepTrigger> = {
  1: {
    initiator: 'user',
    causedBy: null,
    event: 'User/system instruction to purchase',
    condition: 'Agent receives task: "Buy noise-cancelling headphones ≤ $350"',
    field: null,
  },
  2: {
    initiator: 'merchant',
    causedBy: 1,
    event: 'HTTP GET /.well-known/ucp received from agent',
    condition: 'Merchant handles incoming UCP discovery request',
    field: 'request.method = "GET" · request.path = "/.well-known/ucp"',
  },
  3: {
    initiator: 'agent',
    causedBy: 2,
    event: 'UCP profile resolved — catalog.search capability found',
    condition: 'Agent parsed capabilities[] and found a matching capability',
    field: 'capabilities[].name === "dev.ucp.shopping.catalog.search"',
  },
  4: {
    initiator: 'merchant',
    causedBy: 3,
    event: 'POST /catalog/search received with valid UCP-Agent header',
    condition: 'Merchant processes search query and builds result set',
    field: 'request.headers["UCP-Agent"] · request.body.query = "wireless noise-cancelling headphones"',
  },
  5: {
    initiator: 'agent',
    causedBy: 4,
    event: 'Catalog results scored — top result meets criteria',
    condition: 'results[0].price ≤ budget AND results[0].rating ≥ 4.5',
    field: 'results[0].product_id = "prod_sony_wh1000xm5" · price = 279.99 · rating = 4.8',
  },
  6: {
    initiator: 'agent',
    causedBy: 5,
    event: 'Cart created successfully — cart_id returned',
    condition: 'Agent has a cart_id and at least one item; initiates checkout',
    field: 'cart_response.cart_id = "cart_8f3k2j9x" · item_count = 1',
  },
  7: {
    initiator: 'merchant',
    causedBy: 6,
    event: 'POST /checkout-sessions received with UCP-Agent header',
    condition: 'Merchant extracts profile URI from header and fetches it independently',
    field: 'headers["UCP-Agent"] → profile = "https://agent.platform.example/.well-known/ucp"',
  },
  8: {
    initiator: 'merchant',
    causedBy: 7,
    event: 'Agent UCP profile fetched — capabilities[] resolved',
    condition: 'Both capability sets are available; intersection algorithm runs',
    field: 'agent_profile.capabilities.length > 0 AND merchant.capabilities.length > 0',
  },
  9: {
    initiator: 'merchant',
    causedBy: 8,
    event: 'Intersection computed — 4 active capabilities, pruned 2',
    condition: 'Active set non-empty; session response built with handlers + discounts',
    field: 'active = [checkout@2.1, fulfillment@1.0, discount@1.0, order@1.1] · pruned = [catalog.search, identity_linking]',
  },
  10: {
    initiator: 'agent',
    causedBy: 9,
    event: 'Checkout session returned payment_handlers[] with PSP config',
    condition: 'Agent finds a matching payment handler in its supported list',
    field: 'session.payment_handlers[0].handler_id = "psp_stripe_001" · config.token_url present',
  },
  11: {
    initiator: 'agent',
    causedBy: 10,
    event: 'Wallet returned credential_ref + ap2_proof',
    condition: 'Agent posts wallet credential to PSP token_url from handler config',
    field: 'credential_ref = "cred_ref_7xK2mN9pQ3rL" → POST "https://api.stripe.com/v1/tokens"',
  },
  12: {
    initiator: 'agent',
    causedBy: 11,
    event: 'PSP returned opaque network token (tok_...)',
    condition: 'Agent submits token + handler_id + AP2 mandate proof to merchant',
    field: 'token_response.id = "tok_1OxKmJ2eZvKYlo2C8pQrLm4N" · token_response.used = false',
  },
  13: {
    initiator: 'merchant',
    causedBy: 12,
    event: 'POST /checkout-sessions/{id}/complete received — token + AP2 proof verified',
    condition: 'Merchant validates AP2 mandate signature; calls PSP authorization API',
    field: 'body.payment.token = "tok_1OxKmJ2..." · body.ap2.proof signature valid',
  },
  14: {
    initiator: 'psp',
    causedBy: 13,
    event: 'PSP authorization request received from merchant',
    condition: 'PSP detokenizes and routes to Visa network for authorization',
    field: 'charge.amount = 27216 · charge.source = "tok_1OxKmJ2..." · capture = true',
  },
  15: {
    initiator: 'merchant',
    causedBy: 14,
    event: 'Network authorization approved — response_code "00"',
    condition: 'PSP captures funds; merchant creates order record and returns confirmation',
    field: 'auth_response.status = "approved" · auth_code = "AUTH_892XKL" → order_id = "ord_Kx9mL2pQ8rV6nJ4"',
  },
};
