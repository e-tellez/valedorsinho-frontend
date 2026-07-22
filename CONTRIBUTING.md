# 🤝 Contributing to etellez-workspace

This document defines the collaboration standards for all projects hosted in this repository. Every contributor — human or AI — must follow these rules consistently.

---

## 🌿 Branching Model

This repo uses a **Scrum-based, project-namespaced branching model**. The `/` separator creates visual folder grouping in GitHub and git UIs (GitLens, etc.), and scales cleanly as new projects are added.

### Base Branches

| Branch    | Purpose                                      | Accepts PRs from          |
|-----------|----------------------------------------------|---------------------------|
| `main`    | Production-ready. Always deployable.         | `develop` only            |
| `develop` | Primary integration branch.                  | `<project>/epic/*` only   |

> ⚠️ **Never push directly to `main` or `develop`.**

### Work Branches

```
develop
└── <project>/epic/<description>       ← Scrum epic. Branched from develop.
    └── <project>/feature/<description> ← Scrum task. Branched from its parent epic.
```

**Rules:**
- Feature branches only merge back into their parent epic — **never directly into `develop`**.
- Epic branches merge into `develop` via PR when the epic is complete.

**Examples:**
```
valedorsinho/epic/digital
valedorsinho/feature/checkout-session-flow
money-flow/epic/ledger
money-flow/feature/monthly-summary-chart
```

### Full Workflow

```
develop → <project>/epic/<name> → <project>/feature/<name>
       ← PR into epic            ← PR epic into develop    ← PR develop into main
```

---

## 🔀 Merge & Rebase Strategy

| Branch type         | Sync with                  | Strategy                          | Push         |
|---------------------|----------------------------|-----------------------------------|--------------|
| `develop` / `main`  | —                          | No rebase. Merge only.            | Regular push |
| `<project>/epic/*`  | `origin/develop`           | `git merge origin/develop --no-edit` | Regular push |
| `<project>/feature/*` (unmerged) | parent epic | `git rebase origin/<parent-epic>` | `--force-with-lease` |

> ⚠️ **Never rebase shared or epic branches.** Rebasing rewrites commit hashes, causing diverged history and "Can't automatically merge" errors on PRs.

### Syncing an Epic Branch with Develop

```bash
git fetch origin
git merge origin/develop --no-edit
git push origin <epic-branch>
```

---

## ✍️ Commit Convention — Conventional Commits

Format: `type(scope): description`

| Type       | When to use                                 |
|------------|---------------------------------------------|
| `feat`     | New feature                                 |
| `fix`      | Bug fix                                     |
| `refactor` | Code restructure without behavior change    |
| `chore`    | Build, config, dependencies                 |
| `docs`     | Documentation only                          |
| `test`     | Adding or updating tests                    |
| `hotfix`   | Critical prod fix branched from `main`      |

**Examples:**
```
feat(checkout): add advanced flow component
fix(middleware): correct session expiry redirect
chore(deps): bump adyen-web to 6.x
docs(valedorsinho): update API contract for /checkout/sessions
```

---

## 📬 Pull Requests

### Naming
```
[Epic] Brief description of what was done
```

Examples:
- `[Digital] Add Sessions checkout flow`
- `[Tools] Implement payload validator`

### Body Template

```markdown
## What was done
- Bullet list of changes

## Why it was done
The problem or Scrum task this solves.

## How to test
UI steps or curl/Postman commands to verify.
```

---

## 📁 Project Structure Conventions

- Each project has its own route group under `src/app/<project>/`
- Each project has its own README at `docs/<project>/README.md`
- API contracts live at `docs/api-contracts/<project>.md`
- Windsurf AI workflows live at `.devin/workflows/`

---

## 🤖 AI Contributor Rules

When an AI (e.g. Windsurf Cascade) contributes to this repo, it must:
1. Identify the correct project and epic before writing code
2. Confirm it is on the correct `<project>/feature/<name>` branch
3. Follow all branching, commit, and PR conventions above
4. Never push directly to `develop` or `main`
