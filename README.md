# 🌐 etellez-workspace

Welcome to the **etellez-workspace**, the centralized frontend hub for `etellez.com`.

This repository operates as a **Hub-and-Spoke** frontend architecture. It serves the public-facing professional portfolio while acting as the secure gateway and UI dashboard for a suite of decoupled FastAPI microservices hosted on Railway.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching, commit, and PR standards.

---

## 🏗️ Architecture

This Next.js application handles routing, authentication (Supabase JWT), and UI rendering, delegating all business logic to isolated FastAPI microservices.

### Connected Micro-Backends

| Service | Description | Visibility |
|---|---|---|
| 💰 `money_flow` | Financial ledger and cashflow management | Collaborative |
| 🗂️ `impuestos` | Automated tax document processing | Private |
| 🛒 `valedorsinho` | Adyen e-commerce, payments, and UCP agentic commerce showcase | Private |

API contracts for each service live in [`docs/api-contracts/`](docs/api-contracts/).

---

## 🗂️ App Structure

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) — App Router |
| Library | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| Charts | Recharts |
| Auth | Supabase (OTP / Magic Link) |
| Deployment | Vercel |

---

## 📂 Project Structure

Next.js Route Groups separate public pages from authenticated applications without affecting URLs.

```text
src/app/
├── (public)/          # Public portfolio (etellez.com)
├── (authenticated)/   # Reserved for future secure dashboards
├── valedorsinho/      # Valedorsinho — Adyen showcase app → see valedorsinho/README.md
├── api/               # Next.js API routes (auth handlers, proxies)
└── middleware.ts      # Edge middleware — Supabase JWT validation & route protection
```

---

## 🔐 Authentication

Two independent auth systems run side-by-side, enforced by `middleware.ts`.

| Scope | Provider | Storage |
|-------|----------|---------|
| `(public)/`, `(authenticated)/` | Custom JWT | httpOnly cookies (`access_token` / `refresh_token`) |
| `valedorsinho/` | Supabase OTP magic-link | httpOnly cookies via `@supabase/ssr` · hard 24h session expiry |

---

## 📁 Projects

| Project | Docs | API Contract |
|---------|------|--------------|
| 🛒 Valedorsinho | [docs/valedorsinho/README.md](./docs/valedorsinho/README.md) | [docs/api-contracts/valedorsinho.md](./docs/api-contracts/valedorsinho.md) |
| 💰 Money Flow | — | [docs/api-contracts/money-flow.md](./docs/api-contracts/money-flow.md) |
| 🗂️ Impuestos | — | [docs/api-contracts/impuestos.md](./docs/api-contracts/impuestos.md) |

---

## 🌿 Branching Model

Scrum-based branching with project-namespaced branches.

```
main ← develop ← <project>/epic/<name> ← <project>/feature/<name>
```

| Branch type | Pattern | Merges into |
|---|---|---|
| Epic | `<project>/epic/<name>` | `develop` (via PR) |
| Feature | `<project>/feature/<name>` | its parent epic (via PR) |

- **Never push directly to `main` or `develop`.**
- **Feature branches never merge directly into `develop`.**
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`

Epic mapping per project lives alongside the code — see [`valedorsinho/README.md`](src/app/valedorsinho/README.md#-epic-mapping).

---

## ⚙️ Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in the required values before running.
