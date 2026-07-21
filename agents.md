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
| Deployment | Vercel (`vercel.json`) |
| Registry | Local `.npmrc` → `registry.npmjs.org` (overrides Adyen corporate Nexus) |

## Repository Structure

```
src/
  app/
    (authenticated)/        # Future dashboard (not yet built)
    (public)/               # Portfolio / landing pages
    api/
      auth/                 # login, logout, refresh
      valedorsinho/
        auth/               # GET/PUT /api/valedorsinho/auth/config
        config/             # GET /api/config/client
    valedorsinho/           # All Valedorsinho routes, including ucp-agentic-commerce
  components/
    adyen/
      checkout/             # AdyenCheckoutPage.tsx, StepIndicator.tsx
      shared/               # Shared components (see below)
    ThemeToggle.tsx         # ⚠ duplicate — use shared/ThemeToggle
  context/adyen/CheckoutContext.tsx
  context/theme/
  hooks/adyen/
    useAdyen.ts             # SDK script + CSS loader; calls useCheckoutConfig internally
    useCheckoutConfig.ts    # GET /api/config/client → ClientConfig
  lib/adyen/
    api.ts                  # apiFetch / apiGet / apiPost / apiPut
    constants.ts            # INTEGRATIONS, COUNTRY_CURRENCY_MAP, ADYEN_SDK_VERSION
    syntaxHighlight.ts      # JSON → HTML spans (ApiCallCard internal)
    translations.ts         # managePaymentsTranslations
    types.ts                # TS types mirroring FastAPI Pydantic models
    utils.ts                # formatDate(iso)
    verticals.ts            # Vertical interface
  lib/supabase/browser.ts   # getSupabaseBrowserClient()
  lib/supabase/server.ts
  middleware.ts             # Supabase JWT guard for /valedorsinho/*; legacy JWT for others
```

## Shared Components (`src/components/adyen/shared/`)

| Component | Purpose | Key Props |
|---|---|---|
| `ApiCallCard` | API call inspector — **single source of truth; never use PreviewCard for API data** | `ApiCallEntry`: `method`, `endpoint`, `direction`, `statusCode`, `latencyMs`, `timestamp`, `request`, `response`, `extra` — pass raw objects |
| `PageHeader` | Centered title + back button + optional right slot | `title`, `subtitle`, `backHref`, `backLabel`, `right` |
| `StatusBanner` | Status message | `msg`, `type: "success" \| "error" \| "info"` |
| `DashCard` | Dashboard feature card | `href`, `icon`, `iconClass`, `title`, `description`, `badge`, `disabled` |
| `BackButton` | `← Back` link | `href`, `label` |
| `PreviewCard` | Raw JSON display for non-API-call contexts | `title`, `initialHtml`, `children` |

## API Layer

`src/lib/adyen/api.ts` — JWT-aware wrappers; auto-attach `Authorization: Bearer <supabase_jwt>`.
**Never use raw `fetch()` for backend calls.**

```ts
apiFetch<T>(path, options?)   // base
apiGet<T>(path, params?)      // GET + query params
apiPost<T>(path, body)        // POST JSON
apiPut<T>(path, body)         // PUT JSON
```

## Auth

Supabase OTP / magic link. Login at `/valedorsinho/login`, callback at `/valedorsinho/auth`.
`middleware.ts` validates Supabase JWT for all `valedorsinho/*` (except `/login` and `/auth/callback`).
`apiFetch` injects `Bearer <token>` automatically via `getSupabaseBrowserClient().auth.getSession()`.
Roles: `admin`, `im`, `user` — config write access + webhook retention (admin: 5 days, im/user: 3 days).

## Hooks & Context

**`useAdyen()`** → `{ AdyenCheckout, config, ready, error }`. Loads SDK + CSS; calls `useCheckoutConfig()` internally.
**`useCheckoutConfig()`** → `{ config, error, loading }`. Fetches `GET /api/config/client`.
**⚠ Never call both in the same component** — fires two `/api/config/client` requests.

**`CheckoutContext`** (`src/context/adyen/CheckoutContext.tsx`) — persists checkout state in `sessionStorage`.
```ts
const { state, setFlow, setOrder, setIntegration, reset } = useCheckout();
// state: { isGuest, shopperReference, amountMinorUnits, currency, countryCode, integrationType }
```

## Adyen Golden Rules

> **NEVER use CSS or HTML tricks to control Adyen UI — always use native SDK properties and callbacks.**

| Need | Correct approach |
|---|---|
| Hide pay button on stored cards | `paymentMethodsConfiguration.storedCard.showPayButton: false` |
| Hide security code on stored cards | `paymentMethodsConfiguration.storedCard.hideCVC: true` |
| Rename pay button | Top-level `translations: { "en-US": { payButton: "..." } }` — NOT `card.translations` |
| Remove stored method | `onDisableStoredPaymentMethod(id, resolve, reject)` callback |
| Stored methods + new card | Architectural split: Drop-in for stored, Card Component for new |

No native SDK property for a use case → split the UI architecturally. Never DOM/CSS workarounds.
SDK version: `ADYEN_SDK_VERSION` in `constants.ts` (currently `5.67.0`). Bump only there.
Translations: keep in `src/lib/adyen/translations.ts`.

## Amount Units

Online checkout → **minor units** (cents). Terminal payments → **major units** (whole currency).

## Branching Model

`develop → valedorsinho/epic/<name> → valedorsinho/feature/<name>`

Never commit to `main` or `develop`. Feature branches merge only into their parent epic.
Epic sync: `git merge origin/develop --no-edit` (never rebase). Feature sync: `git rebase origin/<epic>` + `--force-with-lease`.
**Before any edit:** `git branch --show-current` — if on `main`/`develop`, stop.
Commits: Conventional Commits `type(scope): description` — `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `hotfix`.
**No Devin attribution.** Never include `Generated with [Devin]`, `Co-Authored-By: Devin`, or any AI-generated footer in commit messages.

| Epic | Routes |
|---|---|
| `valedorsinho/epic/digital` | `checkout/`, `payload-suggested/`, `payload-validator/`, `ucp-agentic-commerce/` |
| `valedorsinho/epic/unified-commerce` | `terminal-payments/`, `terminal-fleet/`, `nfc-formatter/` |
| `valedorsinho/epic/tools-and-setup` | `setup/`, `management-api/`, `webhooks/` |
| `valedorsinho/epic/global-ui` | Theme toggle, layout, navigation, ApiCallCard |
| `valedorsinho/epic/code-refactor` | All refactor items below |

## Known Issues — Do Not Re-introduce (`valedorsinho/epic/code-refactor`)

| Priority | Issue |
|---|---|
| **Critical** | Double `useCheckoutConfig` fetch — `AdyenCheckoutPage.tsx` calls both `useCheckoutConfig()` and `useAdyen()` |
| **Critical** | Two `ThemeToggle` impls — `src/components/ThemeToggle.tsx` vs `src/components/adyen/shared/ThemeToggle.tsx` |
| **High** | `DashCard` inline in `valedorsinho/page.tsx`; shared `DashCard.tsx` is dead code |
| **High** | `formatDate` may be duplicated in page files — canonical: `src/lib/adyen/utils.ts` |
| **Medium** | Local types in `terminal-payments` / `terminal-fleet` overlap with `src/lib/adyen/types.ts` |
| **Medium** | Merchant → stores → terminals cascading fetch duplicated — candidate for `useTerminalSelector` hook |
| **Low** | Inline SVG icons in `valedorsinho/page.tsx` — replace with Lucide |

## Frontend-Only Demos

- `src/app/valedorsinho/ucp-agentic-commerce/` — UCP Agentic Commerce lifecycle demo ported from a standalone Vite app into Next.js. It is frontend-only and does not change `docs/api-contracts/valedorsinho.md`.

## Workflows (`.devin/workflows/`)

| Trigger | Purpose |
|---|---|
| `/sync-contract` | Sync API changes to `docs/api-contracts/*.md` and verify build |
