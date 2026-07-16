# 🛒 Valedorsinho

Adyen e-commerce & payments showcase app, served under `etellez.com/valedorsinho/`.  
Connected to the `valedorsinho` FastAPI microservice on Railway. API contract: [`docs/api-contracts/valedorsinho.md`](../../../docs/api-contracts/valedorsinho.md).

---

## 📂 Route Map

```text
src/app/valedorsinho/
├── login/                   # OTP / magic link login
├── auth/                    # Supabase auth callback handler
├── page.tsx                 # Valedorsinho dashboard / home
│
├── checkout/                # Online Checkout
│   ├── select-integration/  # Choose Advanced or Sessions flow
│   ├── dropin/              # Advanced flow — Drop-in
│   ├── sessions/            # Sessions flow — Drop-in
│   ├── manage-payments/     # Stored payment methods management
│   ├── order/               # Order summary
│   ├── redirect/            # Post-redirect handler
│   └── result/              # Payment result page
│
├── terminal-payments/       # Unified Commerce — Terminal Payments
├── terminal-fleet/          # Unified Commerce — Terminal Fleet Manager
├── nfc-formatter/           # Unified Commerce — NFC Password Formatter
│
├── webhooks/                # Received webhook log viewer
├── setup/                   # API key / Client key / Merchant account config
├── management-api/          # Management API explorer (WIP)
├── payload-suggested/       # Payload suggestions by vertical
├── payload-validator/       # Payload validation against Adyen OpenAPI specs
└── ucp-agentic-commerce/    # UCP agentic commerce lifecycle demo
```

---

## 🔐 Authentication

Uses **Supabase OTP (Magic Link)** — no password flow.

1. User enters email at `/valedorsinho/login`
2. Supabase sends a magic link
3. Callback at `/valedorsinho/auth` exchanges the token for a session (httpOnly cookie)
4. `middleware.ts` validates the Supabase JWT for all routes under `valedorsinho/`

**Roles:** `admin` · `im` · `user` — affect config write access and webhook retention (admin: 5 days; im/user: 3 days).

---

## 🌿 Epic Mapping

Branching follows the workspace Scrum model (see root [`README.md`](../../../README.md#-branching-model)).

| Epic branch | Routes covered |
|---|---|
| `valedorsinho/epic/digital` | `checkout/`, `payload-suggested/`, `payload-validator/`, `ucp-agentic-commerce/` |
| `valedorsinho/epic/unified-commerce` | `terminal-payments/`, `terminal-fleet/`, `nfc-formatter/` |
| `valedorsinho/epic/tools-and-setup` | `setup/`, `management-api/`, `webhooks/` |
| `valedorsinho/epic/global-ui` | Theme toggle, layout, navigation |
