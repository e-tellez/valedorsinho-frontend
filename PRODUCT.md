# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary — Adyen Implementation Engineers / Managers.** Use Valedorsinho to demonstrate and prototype Adyen integration flows for and with merchants, both in guided demos and in exploratory build sessions.
- **Primary — the author as a personal sandbox.** Stand up and test Adyen flows quickly against the Adyen **TEST** environment.

Access is role-based (`admin`, `im`, `user`); configuration writes are restricted to `admin` and `im`.

## Product Purpose

A single "Adyen Unified Commerce Toolbox" that serves three jobs at once:

1. **Demonstrate** Adyen flows end-to-end so an audience can see how a given integration behaves.
2. **Learning sandbox** — a hands-on place to experiment with Adyen APIs and understand how messages move between the actors in a transaction.
3. **Integration prototyping** — a harness to assemble and validate real Adyen integrations before taking them to production.

Success means a user can pick a flow, run it against the real TEST environment, and watch the actual request/response/webhook exchange that produced the result.

## Positioning

Valedorsinho organizes Adyen's capabilities by **business-model profile** (PSP, Marketplace, Platform) and makes the full message exchange between the three actors in a transaction — the **merchant server**, the **shopper experience**, and the **Adyen server** — visible and inspectable in one place. That combination of profile-scoped feature sets plus live, three-party message tracing is what distinguishes it from running flows directly in Adyen's Customer Area or ad-hoc test scripts.

## Operating Context

- Runs against the Adyen **TEST** environment; no live/production shopper data.
- The UI delegates all business logic to an authoritative FastAPI microservice (Railway). `valedorsinho-backend/API_CONTRACT.md` is the authoritative contract; frontend types in `src/lib/adyen/types.ts` mirror it.
- Auth is Supabase OTP / magic link with a hard 24-hour session; `middleware.ts` guards protected routes.
- Adyen calls the backend webhook listener directly; received notifications are retained for a few days by role and surfaced in-app.
- In development, `next.config.mjs` rewrites `/api/*` to the local backend; in production it points at the Railway service.

## Capabilities and Constraints

### Profiles (business models)

- **PSP** — accept-payments model. **The only profile enabled now.**
- **Marketplace** and **Platform** — map to Adyen for Platforms (split payments, sub-merchant/user onboarding, KYC, balance accounts). **Not yet enabled.** Each is a **superset of PSP**: it inherits every PSP feature and adds its own, so PSP capabilities must remain reusable across profiles.
- Default entry point is the **PSP** profile showing its **Dashboard**.

### PSP features already implemented

Online Checkout (Drop-in, Sessions, Components, Manage Payments), Apple Pay + Meses Sin Intereses (MSI), Terminal Payments, Terminal Fleet management, NFC Formatter, Management API explorer, Webhook Logs, Payload Suggested, Payload Validator, Account Structure, UCP Agentic Commerce demo, and Setup (Adyen credentials). These are grouped today as Digital, Unified Commerce, and Additional Tools.

### Message-flow visibility

The product traces each transaction across three actors — **merchant server**, **shopper experience**, and **Adyen server**. Backend checkout responses carry a `requestBody` field expressly for debug display; this and webhook payloads feed an inspector surface (today: `ApiCallCard` / `ApiCallPanel`).

### Constraints and terminology

- Amount units differ by channel: **online checkout uses minor units**; **terminal payments use major units**.
- Tech stack is fixed by the existing codebase: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS v4, Lucide icons, Supabase SSR auth, FastAPI backend on Railway. A local `.npmrc` overrides the Adyen corporate Nexus registry.
- The API contract is authoritative: UI changes that cross the API boundary must stay in sync with `API_CONTRACT.md` and `src/lib/adyen/types.ts`.

## Brand Commitments

- Name: **Valedorsinho**. Current tagline: **"Adyen Unified Commerce Toolbox."**
- It is an unofficial showcase/sandbox built on Adyen; it is not an official Adyen product and must not imply Adyen endorsement.

## Evidence on Hand

- `valedorsinho-backend/API_CONTRACT.md` — authoritative API surface (config, checkout, terminal, fleet, tools, auth, webhooks).
- Working implemented features across the pages listed above.
- Existing JSON/API inspector components (`src/components/adyen/shared/ApiCallCard.tsx`, `ApiCallPanel.tsx`) and `src/lib/adyen/syntaxHighlight.ts`.
- Real Adyen TEST webhook events surfaced via `/webhooks`.
- No production/live transaction data, no customer testimonials, and no benchmarks exist — future work must not fabricate them.

## Product Principles

1. **Make the invisible visible.** Every flow exposes the real request, response, and webhook exchange between merchant server, shopper, and Adyen — never a mocked happy path presented as real.
2. **Organize by Adyen business model.** Features are scoped to a profile; PSP is the base and Marketplace/Platform extend it as supersets, so PSP capabilities stay reusable.
3. **Fidelity to real Adyen behavior.** Flows run against the real TEST environment and conform to the authoritative API contract.
4. **One default path, progressive depth.** Default to the PSP profile and its Dashboard, then let users drill into any feature without losing context.
5. **Teach while doing.** As it demonstrates a flow, the tool should also explain the concepts behind it.
