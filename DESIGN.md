---
name: Valedorsinho
description: Adyen Unified Commerce toolbox — the Reconciliation Ledger world
colors:
  # Light theme — the daytime concourse / paper ledger (canonical surfaces)
  paper-ground: "#e7e3da"
  paper-rail: "#ded8cd"
  paper-sheet: "#faf7f0"
  paper-raised: "#f1ede3"
  paper-line: "#d8d1c3"
  paper-rule: "#c2b9a7"
  ink: "#1b1e22"
  ink-muted: "#585a54"
  ink-faint: "#8a857a"
  # Dark theme — the lamplit warm charcoal (its home)
  night-ground: "#141311"
  night-rail: "#191714"
  night-sheet: "#201e19"
  night-raised: "#2a2721"
  night-line: "#343029"
  night-rule: "#494336"
  ink-night: "#f3f1ec"
  ink-night-muted: "#bcb6aa"
  ink-night-faint: "#8b8577"
  # Accents & semantics (light / night pairs)
  gold: "#8a5e0f"
  gold-strong: "#a9771c"
  gold-night: "#e9b840"
  gold-strong-night: "#f3c766"
  accent-blue: "#2f4b73"
  accent-blue-night: "#8fb0e0"
  exception-red: "#a9242b"
  exception-red-night: "#ef7074"
  posted-green: "#1d7a4b"
  posted-green-night: "#64c08d"
  # Three-party identity
  party-merchant: "#4a6aa0"
  party-shopper: "#4f8a6c"
  party-adyen: "#8268ad"
  party-merchant-night: "#8fb0e0"
  party-shopper-night: "#68c197"
  party-adyen-night: "#bb9fe0"
typography:
  display:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.78rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
rounded:
  xs: "6px"
  sm: "7px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  group: "20px"
components:
  button-accent:
    backgroundColor: "{colors.gold-strong}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "{colors.paper-sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.paper-sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "10px 11px"
  panel:
    backgroundColor: "{colors.paper-sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0"
  status-pill:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.xs}"
    padding: "2px 7px"
---

# Design System: Valedorsinho

## Overview

**Creative North Star: "The Reconciliation Ledger"**

Valedorsinho is read like a settlement day-book. A payment is a conversation between three systems — the merchant server, the shopper, and Adyen — and this interface's whole job is to make that conversation legible and reconcilable. The surfaces are ruled, tabular, and quiet: ink on warm paper by day, a lamplit warm charcoal by night. Nothing shouts. The one bright mark on any screen is **gold**, and it means exactly one thing — *this is active / selected*. Red is spent only on exceptions. Everything else earns its place through alignment, hairlines, and tabular rhythm.

This world deliberately **replaces** the project's legacy "terminal / cyberpunk" identity (neon cyan + green, scan-lines, glows, condensed signage). That look is an anti-reference, not a foundation. Where the old system shouted "technical" with costume, this one earns it through precise data display.

Both themes are first-class and chosen from the use scene — an engineer reading live message traffic in a bright room or a dim demo call — never by category default. Light is warm paper; dark is warm charcoal, so the two feel like the same object under different light rather than two different products.

**Key Characteristics:**
- Warm paper (light) ↔ warm charcoal (dark) duality; no cool/blue grounds.
- Gold is the sole active/selection accent; red is reserved for exceptions.
- Public Sans for everything, JetBrains Mono for figures, endpoints, and JSON.
- Dense, hairline-ruled, tabular surfaces with zebra separation in long logs.
- Quiet "settle" motion only — no departures-board theatrics, no glows.

## Colors

A restrained, warm, document palette: two neutral surface ramps (paper and charcoal), one gold accent that carries all active state, and a tight set of semantic and party-identity hues that do real data jobs.

### Primary
- **Ledger Gold** (light `#8a5e0f`, strong `#a9771c`; night `#e9b840`, strong `#f3c766`): the only active/selection accent. Active profile badge, active nav icon, focus rings, the `TEST` env flag, and the primary button. Appears on a small fraction of any screen — its rarity is the signal.

### Secondary
- **Ink Blue** (light `#2f4b73`; night `#8fb0e0`): data accent only — JSON keys and the merchant party identity. Never competes with gold for "active".

### Neutral — Paper (light)
- **Paper Ground** (`#e7e3da`): app background, the warm hall.
- **Paper Sheet** (`#faf7f0`): panels, rows, inputs — the ledger page.
- **Paper Raised** (`#f1ede3`): zebra rows, subtle fills, pills.
- **Paper Rule** (`#d8d1c3` hairline / `#c2b9a7` strong): dividers and borders.
- **Ink** (`#1b1e22` / muted `#585a54` / faint `#8a857a`): warm-tinted text, never pure gray.

### Neutral — Charcoal (dark)
- **Night Ground** (`#141311`) · **Night Sheet** (`#201e19`) · **Night Raised** (`#2a2721`) · **Night Rule** (`#343029` / `#494336`) · **Ink Night** (`#f3f1ec` / `#bcb6aa` / `#8b8577`). Warm charcoal, not blue-black.

### Semantic
- **Exception Red** (`#a9242b` / night `#ef7074`): declines, errors, failed reconciliation only.
- **Posted Green** (`#1d7a4b` / night `#64c08d`): authorised / success / posted.

### Three-Party Identity
- **Merchant** slate-blue · **Shopper** sage-green · **Adyen** muted-plum (light `#4a6aa0` / `#4f8a6c` / `#8268ad`; night `#8fb0e0` / `#68c197` / `#bb9fe0`). Small dots in the inspector hop line and flow nodes; a quiet categorical set, never traffic-light lamps.

### Named Rules
**The One Gold Rule.** Gold means "active / selected" and nothing else. If two things on a screen are gold, one of them is wrong.
**The Red-for-Exceptions Rule.** Red is only ever a refusal, an error, or a broken reconciliation. It is never decoration or a party color.

## Typography

**Display / Body Font:** Public Sans (with `ui-sans-serif, system-ui`)
**Label / Data Font:** JetBrains Mono (with `ui-monospace`)

**Character:** Public Sans is an institutional, neutral workhorse — serious without costume. JetBrains Mono carries every figure, endpoint, reference, and JSON payload, with tabular numerals on globally (`font-feature-settings: "tnum"`). The pairing reads like a well-set financial document, not a terminal.

### Hierarchy
- **Display** (700, 1.9rem, 1.05, −0.02em): page titles ("Payment Service Provider").
- **Title** (600, 1rem, −0.01em): feature/service names, panel and inspector headings.
- **Body** (400, 0.875rem, 1.55): descriptions and prose; keep ≤ ~70ch.
- **Label** (JetBrains Mono, 700, 0.78rem, uppercase, 0.08em): section headlines (OVERVIEW / ONLINE / …). Smaller mono labels (0.55–0.62rem, uppercase) tag payload sections, env, and legends.
- **Mono / Data** (JetBrains Mono, 0.72rem, 1.55): JSON payloads, endpoints, references, timestamps.

### Named Rules
**The Mono-for-Measurement Rule.** Monospace is only for code, data, endpoints, references, and labels — never as a "technical" costume on prose.
**The No-Signage Rule.** No condensed, all-caps display lettering. Headlines are Public Sans; the ledger's voice is tabular precision, not a departures board.

## Layout

A fixed three-column app shell: **left rail 256px · center `1fr` · right inspector 404px**, full-viewport height. The left rail holds the profile switcher and grouped feature nav; the center is the dashboard or active feature; the right is the message registry.

- **Density:** high and tabular. Hairline-ruled rows, no airy cards-in-cards.
- **Nav rhythm:** 20px between groups, 4px from a section headline to its items (more space above a heading than below it, so each headline caps the group beneath it).
- **Responsive:** at ≤1180px columns tighten (224 / 1fr / 340); at ≤940px the shell stacks, the rail becomes a horizontal strip, and the inspector hides.

## Elevation & Depth

Depth is mostly tonal, not shadow-driven. In **light**, panels sit on the ground with a soft warm shadow (real offset + blur). In **dark**, drop shadows barely register, so lift comes from a lighter panel tone **plus a 1px top highlight** (`inset 0 1px 0 rgba(255,255,255,.05)`). Surfaces are calm at rest; motion and hover add the life.

### Shadow Vocabulary
- **Panel** (`0 1px 2px rgba(39,33,22,.08), 0 8px 24px rgba(39,33,22,.08)` light; `0 1px 2px rgba(0,0,0,.5), 0 14px 38px rgba(0,0,0,.55)` dark): resting elevation for panels, rows, the profile switcher.
- **Panel-sm** (`0 1px 2px …`): subtle lift for nav/profile active state.

### Named Rules
**The Dark-Needs-a-Highlight Rule.** On charcoal, pair every lifted surface with a hairline top highlight; a drop shadow alone is invisible.

## Shapes

Soft, consistent rounded corners: `6px` (pills, icon buttons), `7px` (buttons, inputs, nav items), `8px` (JSON blocks), `10px` (panels, rows, profile switcher), `12px` (profile icon badges); status/party dots and tags are fully rounded (`999px`). Borders are 1px hairlines in the rule colors. **No** hard-offset block shadows, **no** colored side-bars.

## Components

### Buttons
- **Shape:** `7px` radius, 40px height.
- **Accent (primary):** gold fill (`gold-strong` light / `gold` night) with dark or white text; used sparingly (e.g. "Replay exchange").
- **Ghost (secondary):** sheet background, ink text, hairline border.
- **Hover:** soft panel shadow, no translate theatrics.

### Inputs / Fields
- Sheet background, 1px rule border, `7px` radius, JetBrains Mono value text.
- **Focus:** gold border + a 3px gold-tinted ring (`color-mix` of gold). Never a glow.

### Navigation
- Nav items: Public Sans 0.85rem, ink-muted, `7px` radius; hover raises to raised surface + ink. **Active** item: sheet background + soft shadow + **gold icon** + semibold label (no colored side-bar).
- Section headlines are mono uppercase labels; multi-item groups (Online / In-person / Operate) are collapsible via a chevron.

### Profile Switcher (signature)
- A row of three icon-badge buttons (PSP · Platform · Marketplace). Each is an icon in a rounded-square badge above a label.
- **Active:** badge filled gold (dark glyph), label in ink. **Disabled** (not-yet-enabled profiles): muted at 50% opacity. This is deliberately *not* an outlined-tile or segmented-wash pattern.

### Status Pill / Flap
- Rounded tag, mono uppercase. Carries a lamp dot or status code colored by state: **posted-green** (ok), **gold** (pending, with a soft blink), **exception-red** (error), ink-faint (info/neutral).

### Registry Log Entry (signature)
- Two-line header: line 1 = timestamp · party hop (`Merchant → Adyen` with identity dots) · status code (right-aligned); line 2 = bold title and the full method + endpoint, which **wrap rather than truncate**.
- Rows **zebra-stripe** (alternating sheet / raised) with a hairline divider for separation.
- Expandable rows reveal Request / Response JSON, each with **Copy** and **Download .json** actions. **Webhook** entries are static (no expand) — they belong to a dedicated webhook section.

## Do's and Don'ts

### Do:
- **Do** use gold only for active/selected chrome and keep it to a small fraction of the screen.
- **Do** keep red exclusively for exceptions (declines, errors, broken reconciliation).
- **Do** render all figures, references, endpoints, and JSON in JetBrains Mono with tabular numerals.
- **Do** separate dense lists with hairlines + zebra, and stack a bold label over its muted description.
- **Do** convey depth on dark surfaces with a lighter tone + 1px top highlight, and honor `prefers-reduced-motion`.

### Don't:
- **Don't** reintroduce the legacy terminal world: neon cyan/green, scan-lines, noise overlays, or glows.
- **Don't** use amber/green/red as glowing traffic-light status lamps, or cool/blue-black grounds.
- **Don't** use condensed, all-caps signage lettering for display type.
- **Don't** truncate titles or endpoints in the registry — let them wrap.
- **Don't** put a colored border-bar (>1px, left/right/bottom) on list items or cards (the AI "side-tab" tell).
- **Don't** make webhook entries expandable in the registry.
