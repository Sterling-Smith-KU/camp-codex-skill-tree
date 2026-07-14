# Camp Codex — Skill Tree

An interactive, self-contained web page that renders the **Camp Codex curriculum** as a
game-style skill tree: three color-coded branches growing from a shared root, 21 modules,
click-to-unlock progression that persists in your browser.

**Live site:** https://camp-codex-skill-tree.vercel.app
(mirror: https://sterling-smith-ku.github.io/camp-codex-skill-tree/)

## How it works

- **Hover** (or tap) a module for its name and description.
- **Click** a module to unlock it — modules unlock in order along each arm; a module only
  opens once the one before it is unlocked. Clicking an unlocked module re-locks it (and
  everything that depended on it).
- Progress is saved in `localStorage` and survives a refresh. Counters track each branch
  (n / 7) and the whole tree (n / 21).
- The root of the tree is **Josh Wexler** — hover for his bio; clicking opens
  [joshwexler.com/coaching](https://joshwexler.com/coaching/) in a new tab. (On mobile his
  bio appears inline at the bottom of the stacked list.) He is not part of the unlock
  progression.

## Branches

| Branch | Color | Modules (order 1 → 7) |
|---|---|---|
| Creativity | 🔴 `#FF3333` | Curiosity → Burning Questions → (Own the Build → Start Small → Relentless Iteration) ∥ (Demo and Feedback → Portfolio Mindset) |
| AI Skills | 🟡 `#FFCC00` | LLM Fundamentals → (Coding Agents → Context Engineering → Version Control) ∥ (Skill Building → Superpowers → MCP Connections) |
| Web & App Design | 🔵 `#33CCFF` | App Anatomy → Front-end vs. Back-end → (APIs → Happy Path → Mermaid Blueprints) ∥ (Design Systems → Automated QA) |

The topology (including the small unlabeled connector nodes) reproduces the approved Mermaid
diagram in [`docs/superpowers/specs/2026-07-10-skill-tree-v2-build-spec.md`](docs/superpowers/specs/2026-07-10-skill-tree-v2-build-spec.md) one-to-one.

## Features

- **Light / dark mode** — a toggle in the header flips the palette; choice is persisted in
  `localStorage`. Dark is the default.
- **Scrolling "Built with" footer** — a marquee of ten monochrome tool logos (Claude,
  Notion, Supabase, Cursor, Stitch, VS Code, GitHub, YouTube, ChatGPT, Anthropic).

## What's here

- **`index.html`** — the entire app: inline fonts, CSS, data, SVG tree, and interactions.
  No frameworks, no build step, no network requests at runtime.
- **`src/data/skillTree.json`** — the module data (id, branch, order, name, description).
  The same data is inlined in `index.html`; `npm run verify` fails if the two drift apart.
- **`docs/superpowers/`** — specs, plans, and session handoffs (v1 docs kept for history).
- **`camp-codex-skill-tree.md`** — v1's source content (the 49-node read-only showcase),
  kept for provenance. The v1 page itself lives in git history.

## Run locally

Open `index.html` in any browser — no server needed. On viewports under 768px the tree
becomes three stacked branch lists.

## Verifying changes

```bash
npm install     # first time only — installs Playwright as a devDependency
npm run verify
```

Checks data sync with `src/data/skillTree.json`, node/edge counts against the approved
topology, verbatim tooltip content for all 21 modules, the sequential unlock rule (including
cascade re-lock), localStorage persistence, keyboard access, reduced motion, the mobile
stacked layout, and console errors; writes screenshots to `verify-out/` (git-ignored).
`node scripts/visual-crops.mjs` produces high-res branch crops for visual review.

## Deploying

`git push origin main` deploys both hosts: Vercel is connected to the GitHub repo
(auto-deploys on push) and GitHub Pages serves the repo root. For a manual Vercel
deploy without pushing, `npx vercel deploy --prod --yes` still works.

Picking this up in a new session? Read
[`docs/superpowers/handoff/2026-07-10-transition.md`](docs/superpowers/handoff/2026-07-10-transition.md) first.
