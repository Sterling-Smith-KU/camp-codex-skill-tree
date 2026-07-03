# Camp Codex Builder Skill Tree — Design Spec

**Date:** 2026-07-03
**Status:** Draft for review
**Owner:** Sterling-Smith-KU

## 1. Overview

A single-page, self-contained web **showcase** that renders the *Camp Codex builder skill tree* as a
video-game-style perk tree. The content comes from [`camp-codex-skill-tree.md`](../../../camp-codex-skill-tree.md):
four color-coded branches (one per session) growing upward from a shared root, each branch built from a
Root node → two parallel arms → a Capstone. The page is read-only (visitors explore, they cannot edit or
add nodes) and is deployed live via GitHub Pages.

## 2. Goals / Non-goals

**Goals**
- Faithfully render all 49 nodes (57 SP) from the source md, grouped into 4 branches and their arms.
- Look like a real game skill tree (glowing nodes, curved connectors, tiers, capstones), not generic AI slop.
- Interactive tooltips: hovering/tapping a node reveals its name, tier, SP cost, and "lets you…" text.
- Leave the top-tier bubble(s) of each branch **blank** as placeholders for future (unwritten) content.
- A company/tool carousel at the bottom featuring the brands referenced in the md.
- Ship live on GitHub Pages.

**Non-goals**
- No user editing, auth, persistence, or backend. Static page only.
- No build tooling / frameworks / package manager. Hand-authored HTML/CSS/JS.
- No external network dependencies at runtime (no CDN) — everything inlined for reliability and speed.

## 3. Content & data model

All node content is encoded as a **JS data array** inside `index.html` — the single source of truth for
rendering. This makes the remaining ~55% of content (future nodes) trivial to add later: append objects,
no layout rewrite.

Each node object:
```
{ id, branch, tier, arm, label, sp, tooltip, placeholder }
```
- `branch`: `foundation | harness | architecture | craft`
- `tier`: `root | arm | capstone | placeholder`
- `arm`: which of the two parallel arms (e.g. `doctrine` / `discipline`); null for root/capstone
- `sp`: skill-point cost (1 or 2); null for blank placeholders
- `placeholder: true` marks a blank top bubble (no label/tooltip; faint dashed styling)

Branch metadata (color, session title, SP total) is a separate small object.

**Color key (from the md):** 🟡 Foundation · 🟢 The Harness · 🔴 Architecture · 🔵 The Craft.
The root trunk uses a neutral/premium accent (not branch-green) so it reads as the shared base.

## 4. Layout & structure

Root trunk **"CAMP CODEX BUILDER"** sits bottom-center. Four branches climb upward, left→right:
Foundation, The Harness, Architecture, The Craft. Per branch, bottom→top:

1. **Root node** (connects down to the trunk)
2. Splits into **two arms** — each a short vertical chain of nodes (uneven lengths are fine)
3. Arms **converge into the Capstone**
4. Above the capstone: **1–2 blank placeholder bubbles** (the "top bubbles left blank")

Node positions are computed by a small layout function from the data (column per branch, x-offset per arm,
y-step per tier) — not hand-placed pixel by pixel — so the tree stays consistent and extensible.
Connectors are **SVG cubic-bezier paths** tinted per branch, drawn beneath the nodes.

## 5. Visual design (elevated game feel)

- **Canvas:** dark, atmospheric background (deep charcoal/green-black) with subtle vignette so branch colors glow.
- **Nodes:** circular, colored ring per branch + soft outer glow; earned nodes filled, placeholders faint/dashed.
  Capstones are larger with a crown/emphasis accent; the root trunk is the most prominent element.
- **Connectors:** curved bezier SVG, per-branch tint, faint gradient/glow.
- **Chrome:** header (title + short subtitle), a **legend** (4 branch colors + tier meaning), and an SP
  **counter** ("57 SP · 49 nodes") with per-branch totals (13 / 15 / 14 / 15).
- If a light background is later preferred, only the canvas/token variables change; structure is unaffected.

## 6. Interaction

- Each node shows its label. **Hover (desktop) / tap (mobile)** reveals a tooltip card: name · tier · SP · tooltip text.
- Subtle scale + glow on the hovered node.
- Read-only: no add/edit/drag affordances.
- **Responsive:** the wide tree lives in a horizontally scrollable canvas on small screens; the page `body`
  never scrolls sideways. Tooltips reposition to stay on-screen.

## 7. Company / tool carousel (bottom of page)

An infinite, auto-scrolling marquee ("Built with") featuring the tools/companies named in the md:
**OpenAI, Anthropic/Claude, GitHub, VS Code, Supabase, Mermaid, Google Stitch, Notion, Gmail, Cloudflare,
shadcn/ui, Chrome DevTools, Mem0, Claude-Mem** (plus room for more).
- Rendered as **inline SVG brand marks / styled wordmark chips** (self-contained, no external logo requests).
- Continuous CSS-transform marquee; pauses on hover; respects `prefers-reduced-motion`.

## 8. Deployment

- New **public** GitHub repo `camp-codex-skill-tree` under Sterling-Smith-KU.
- Repo contents: `index.html` (self-contained), `README.md`, `camp-codex-skill-tree.md` (source/provenance),
  this spec under `docs/superpowers/specs/`.
- **GitHub Pages** served from `main` branch root → live at
  `https://sterling-smith-ku.github.io/camp-codex-skill-tree/`.

## 9. Build order & testing

Per the "build everything, then test" instruction (consistent with the md's *Skip TDD Early* doctrine),
all build phases complete before a single verification pass:

1. **Scaffold** — project files, README, source md, local git, GitHub repo.
2. **Data model** — encode all 49 nodes + placeholders + branch metadata.
3. **Layout engine** — compute positions; render nodes + SVG connectors.
4. **Visual styling** — dark canvas, glowing nodes, capstones, root trunk, legend, SP counters.
5. **Interaction** — hover/tap tooltips, hover glow, responsive scroll.
6. **Company carousel** — infinite brand marquee at page bottom.
7. **Test & deploy** *(only after 1–6)* — Playwright/manual pass: every node's tooltip fires, counts are
   correct (49 nodes / 57 SP / per-branch totals), placeholders are blank, responsive + reduced-motion behave;
   then enable GitHub Pages and confirm the live URL renders.

## 10. Risks / open questions

- **Brand logos:** exact-brand SVGs vary in availability; fallback is clean wordmark chips in brand colors. Acceptable.
- **Dark vs. reference light-green:** design departs from the reference screenshot's background per the
  "elevated" choice; canvas is a single variable to flip if desired.
- **Blank-bubble count:** default is 1–2 placeholders above each capstone; easily tuned.
