# Unlocked-by-Default, Subtle Glow, Fit-to-Viewport — Design

**Date:** 2026-07-19
**Target:** `index.html` (single-file app; `src/data/skillTree.json` mirrors the data)

## Goal

Three changes to the skill tree page:

1. Remove the click-to-unlock mechanic — every module starts unlocked.
2. Make node lighting subtler — reduce the glow on lit nodes and edges.
3. Fit the entire tree in the viewport on load, with crisp zoom (already SVG/vector; rely on browser zoom).

Decisions confirmed with the user: browser zoom only (no in-page pan/zoom), and strip all unlock-related UI rather than keeping a decorative 21/21 counter.

## 1. Remove click-to-unlock

All 21 modules are permanently unlocked. The three-state model (locked / available / unlocked) collapses to a single lit state.

**Remove:**

- localStorage persistence: `STORAGE_KEY`, `loadState()`/seed logic, `saveState()`.
- The `unlocked` Set mutation logic in `toggle()` — unlock, re-lock cascade, and the blocked branch.
- `flash()` calls for `pulse` (on unlock) and `shake` (on blocked click), plus the `node-pulse` / `node-shake` keyframes and classes if no longer referenced.
- Tooltip "blocked" mode: the `.tt-hint` element ("Unlock the previous module first."), its CSS, and the `blocked` parameter threading through `showTooltip()`.
- `.node.locked` / `.node.available` CSS rules and the equivalent mobile-stack rules; `stateOf()` and `isAvailable()` simplify away (every module renders as `unlocked`, every edge as `lit`).
- Header total counter (`0 / 21 · Modules unlocked`) and the per-branch `n / 7` counts in the SVG branch chips and mobile stack headers.
- Unlock language: `<meta name="description">` ("click to unlock"), the subtitle, and aria-labels' "Unlocked." / "Locked. Click to unlock." status suffixes.

**Keep:**

- Click/tap on a node shows its tooltip (touch users have no hover). Hover behavior unchanged.
- The Josh root node remains a real link to his page.
- Decorative connector dots keep their muted styling — they are spacers, not modules.
- The mobile stack layout, with all modules shown lit.

**Subtitle rewrite:** instructional → descriptive, e.g. "Three branches, 21 modules. Hover or tap a module to read it."

## 2. Subtler node lighting

All values live in CSS custom properties / one branch config object:

- `--unlocked-glow: 0 0 14px` → `0 0 6px` (shared by SVG nodes and mobile dots).
- Branch glow colors in `BRANCHES` (`rgba(..., 0.6)`) → alpha `0.3`.
- `.edge.lit .edge-halo` opacity `0.28` → `0.18`.
- Root-node hover glow (`--root-hover-glow`) alphas reduced proportionally (dark `0.45` → `0.25`, light `0.3` → `0.18`).

Exact numbers may be nudged during implementation to look right in both dark and light themes, but the direction is fixed: smaller blur radius, lower alpha.

## 3. Fit tree to viewport

The SVG already has `viewBox="0 0 1160 1330"` — it is vector, so browser/pinch zoom stays crisp with no work. Only sizing changes:

- `.tree-canvas` currently fills container width with `aspect-ratio: 1160 / 1330`, making the tree taller than the viewport.
- Change: cap the rendered height to the visible viewport (approximately `calc(100vh − header/footer/padding allowance)`), derive width from the aspect ratio, and center horizontally. Concretely: `width: min(100%, calc((100vh − <allowance>) * 1160 / 1330)); margin-inline: auto;` with the aspect-ratio rule keeping height in sync.
- The `.hit-layer` buttons are percentage-positioned inside `.tree-canvas`, so they scale automatically. Tooltip positioning uses `getBoundingClientRect()`, so it also adapts.
- The mobile-stack breakpoint behavior is untouched; the cap only affects the desktop SVG layout.
- The `<allowance>` value is tuned at implementation time so header, tree, and "Built with" marquee all fit without scrolling at common desktop sizes (e.g. 1366×768 and up).

## Testing / verification

- Open the page in Chrome: full tree visible without scrolling at desktop sizes; nodes lit with subtle glow in both themes; clicking a node only shows the tooltip; Josh link still opens; no console errors; no localStorage writes.
- `scripts/verify.mjs` screenshots for visual confirmation (update any assertions that reference unlock state or counters).
- Keep `src/data/skillTree.json` consistent: the `unlocked: false` fields become meaningless — either flip to `true` or drop the field, mirroring whatever `index.html`'s inline data does.

## Out of scope

- In-page zoom/pan controls.
- Any redesign of layout, colors, typography, or the marquee/theme toggle.
