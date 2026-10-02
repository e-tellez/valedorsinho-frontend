# agents.md — etellez-workspace

## Project

**etellez-workspace** — multiple projects at `etellez.com`. Active: **Valedorsinho** (`/valedorsinho/`), an Adyen e-commerce & payments showcase connected to a FastAPI microservice on Railway.

Microservices (separate repos): `valedorsinho`, `money_flow`, `impuestos` — all FastAPI/Railway.
API contracts: `docs/api-contracts/{valedorsinho,money-flow,impuestos}.md`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| UI | Tailwind CSS v4, Lucide React |
| Auth | Supabase OTP / magic link (no password flow) |
| Deployment | Railway |
| Registry | Local `.npmrc` → `registry.npmjs.org` (overrides Adyen corporate Nexus) |

## Repository Structure

```
src/
  app/
    api/
      auth/                 # Local Supabase send-otp and verify handlers only
    auth/callback/          # Supabase code exchange + session-expiry cookie
    checkout/               # Checkout pages; /api/checkout/* is served by FastAPI
    setup/                  # Reads/writes FastAPI GET/PUT /api/auth/config
    ucp-agentic-commerce/   # Frontend-only UCP lifecycle demo
  components/
    adyen/
      checkout/             # AdyenCheckoutPage.tsx, StepIndicator.tsx
      shared/               # Shared components (see shared-components skill)
  context/adyen/CheckoutContext.tsx
  context/theme/
  hooks/adyen/
    useAdyen.ts             # SDK script + CSS loader; calls useCheckoutConfig internally
    useCheckoutConfig.ts    # GET /api/config/client → ClientConfig
  hooks/
    useTerminalSelector.ts  # Cascading merchant → store → terminal fetch hook
  lib/adyen/
    api.ts                  # apiFetch / apiGet / apiPost / apiPut
    constants.ts            # INTEGRATIONS, COUNTRY_CURRENCY_MAP, ADYEN_SDK_VERSION
    syntaxHighlight.ts      # JSON → HTML spans (ApiCallCard internal)
    translations.ts         # managePaymentsTranslations
    types.ts                # TS types mirroring FastAPI Pydantic models
    utils.ts                # formatDate(iso)
  lib/supabase/
    browser.ts              # getSupabaseBrowserClient()
    server.ts
    types.ts                # Supabase row types (WebhookItem, WebhookDetail, ...)
  middleware.ts             # Supabase JWT + 24-hour session guard; excludes public/auth/API routes
next.config.mjs              # Fallback rewrite proxies unmatched /api/* routes to FastAPI
```


## Frontend-Only Demos

- `src/app/ucp-agentic-commerce/` — UCP Agentic Commerce lifecycle demo ported from a standalone Vite app into Next.js. It is frontend-only and does not change `docs/api-contracts/valedorsinho.md`.

## Skills (`.devin/skills/`)

All domain rules live in skills — auto-loaded when relevant (`triggers: model`).

| Skill | Domain |
|---|---|
| `api-layer` | API fetch wrappers, env vars, type definitions |
| `auth` | Supabase OTP flow, middleware, roles |
| `adyen-sdk` | SDK config, hooks, 3DS, translations |
| `shared-components` | `src/components/adyen/shared/` reference |
| `branching` | Git hierarchy, commit conventions |
| `known-issues` | Anti-patterns to never re-introduce |
| `sync-skills` | Update skills + agents.md after breaking changes |

## Workflows (`.devin/workflows/`)

| Trigger | Purpose |
|---|---|
| `/review` | Code review for bugs, security issues, and improvements |
| `/sync-contract` | Sync API changes to `docs/api-contracts/*.md` and verify build |
