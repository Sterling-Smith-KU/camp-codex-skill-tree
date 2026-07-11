# Tools Marquee + Light/Dark Toggle — Design Spec

**Date:** 2026-07-11
**Status:** Approved by user (this conversation)
**Applies to:** `index.html` (single-file app), `scripts/verify.mjs`
**Builds on:** [2026-07-10-skill-tree-v2-build-spec.md](2026-07-10-skill-tree-v2-build-spec.md)

## 1. What we're adding

Two additive features to the live v2 skill tree page:

1. **Tools marquee** — a static footer strip after the tree with the ten company/tool
   logos used to build Camp Codex, scrolling in a continuous loop.
2. **Light/dark mode toggle** — a header button that flips the page between the current
   dark theme and a new light theme, persisted per visitor.

Both must preserve the page's standing constraints: **one self-contained `index.html`,
no frameworks, no build step, zero runtime network requests.**

## 2. User decisions (locked)

| Decision | Choice |
|---|---|
| Marquee content | Real brand logos only — no text labels |
| Logo treatment | Monochrome, dim (~60% opacity ink); official vector shapes |
| Placement | Static footer after the tree (not a fixed bar) |
| Theme default | Always dark on first visit; light is opt-in; choice saved to localStorage |

## 3. Tools marquee

### Content
Ten authentic brand marks, in this order:
OpenAI, Anthropic, Gemini, Notion, Supabase, Mermaid, Google Stitch, VS Code, GitHub, YouTube.

- Inline SVG only (zero-network rule). Source official vector paths — each brand's
  official assets or the CC0 [simple-icons](https://simpleicons.org) set, which carries
  authentic marks. The user's requirement: **logos must be the real thing**, not
  approximations. If no faithful vector exists for a mark (Google Stitch is the risk),
  stop and ask rather than substituting a lookalike.
- Every path uses `fill: currentColor`; a single CSS token colors all ten.
- Height ~26px, vertically centered, generous horizontal gap (~56px).
- Each logo wrapped in a `<span role="img" aria-label="<Tool name>" title="<Tool name>">`.

### Structure & styling
- New `<footer class="tools-marquee">` after `</main>` (after the tooltip div is fine —
  it must render below both the desktop tree and the mobile stack; the mobile stack is
  inside `<main>`, so any position after `<main>` works for both layouts).
- Full-width strip; `border-top: 1px solid var(--locked-stroke)`-style muted rule;
  vertical padding ~20px.
- Small label above the row: `BUILT WITH` — Chakra Petch (`var(--font-display)`),
  uppercase, ~11px, letter-spacing 0.08em, muted ink (same treatment as
  `.total-counter .lbl`), centered.
- Logo ink: muted foreground token at ~60% opacity (ivory on dark, ink on light —
  see §4 tokens).
- Soft fade masks at the strip's left/right edges (CSS `mask-image` /
  `-webkit-mask-image` linear-gradient on the scroll container).

### Animation
- Pure CSS marquee: the row of 10 logos is rendered **twice** in the DOM
  (second copy `aria-hidden="true"`); the track animates
  `transform: translateX(0 → -50%)` in an infinite linear keyframe loop, ~35s per cycle,
  so the wrap seam is invisible.
- `:hover` on the strip sets `animation-play-state: paused`.
- `@media (prefers-reduced-motion: reduce)`: animation removed; the row displays
  statically (first copy visible, container allows natural overflow clipping).
- No JS required for the marquee itself.

## 4. Light/dark theme

### Toggle control
- Icon button (moon in dark mode, sun in light mode — inline SVG, `currentColor`) in the
  `.site-header`, to the right of `.total-counter`.
- Styling matches the header's muted ink; `:focus-visible` ring consistent with the
  tree's node buttons; `aria-pressed` reflects light mode; `aria-label="Switch to light
  mode"` / `"…dark mode"` updated on toggle.

### Mechanism
- `html[data-theme="light"]` attribute drives everything; absence = dark (canonical).
- Persist under localStorage key `campCodexTheme` (value `"light"` — key is **separate**
  from the unlock-state key).
- Tiny inline `<script>` in `<head>` (before the `<style>` block) reads the key and sets
  the attribute before first paint — no flash of wrong theme.
- Toggle click flips the attribute and writes/removes the key.

### Tokenization
- Audit the stylesheet for hardcoded ink colors — the known offenders are the
  `rgba(245, 242, 234, …)` and `rgba(255, 255, 255, …)` values in `.subtitle`,
  `.total-counter .lbl`, `.m-node .m-name`, `.m-root-desc`, mobile `available/unlocked`
  names, and the tooltip shadow. Replace each with a CSS custom property.
- All theme-dependent values live in `:root` (dark defaults) with one
  `html[data-theme="light"]` override block. No duplicated component rules.

### Light palette
| Token | Dark (current) | Light |
|---|---|---|
| `--bg` | `#0B0E14` | `#F5F2EA` (the existing tooltip cream) |
| `--bg-glow` | `#131A26` | slightly deeper cream, e.g. `#EAE5D8` |
| foreground / `--root` | `#FFFFFF` | `#14161B` |
| muted ink (new token) | `rgba(245,242,234,.55)` | `rgba(20,22,27,.55)` |
| `--locked-stroke` | `#3A4150` | light equivalent, e.g. `#C9C4B6` |
| `--locked-fill` | `#171B23` | light equivalent, e.g. `#EDE9DE` |
| tooltip surface/ink | cream / dark ink | inverted: dark surface `#14161B` / cream ink |
| `--creativity` `#FF3333`, `--web-design` `#33CCFF` | unchanged | unchanged |
| `--ai-skills` | `#FFCC00` | darker variant (e.g. `#C9A100`) **for text/labels/counters only** so yellow stays legible on cream; node fills/edges may keep `#FFCC00` if contrast holds — judge visually via crops |

Exact light hex values above are starting points; tune visually during implementation,
but the structure (which tokens exist, what flips) is fixed. Node glow intensities may
need a light-mode adjustment (glows read differently on cream) — visual judgment call.

### Explicitly unchanged
- All unlock/re-lock logic, topology, persistence of unlock state, keyboard handling,
  tooltips' behavior, mobile stacking. Theme is CSS-tokens + one attribute + one button.
- No `prefers-color-scheme` auto-detection — default is always dark (user decision).

## 5. Verification (extend `scripts/verify.mjs`)

New checks, in addition to the entire existing suite staying green:

1. Marquee footer exists; contains exactly 10 unique tool marks (20 rendered logo nodes
   with the duplicated track); all 10 expected `aria-label` names present.
2. Marquee track has a running CSS animation; under emulated
   `prefers-reduced-motion: reduce` it does not animate.
3. Theme: page loads dark by default (no `data-theme`); clicking the toggle sets
   `data-theme="light"` and flips `aria-pressed`; after reload the light choice
   persists; toggling back returns to dark and clears the stored key.
4. Unlock state still persists independently of theme changes.
5. Zero console errors in **both** themes.
6. New visual crops in `scripts/visual-crops.mjs`: footer marquee (dark + light),
   full-page light mode, header with toggle.

## 6. Out of scope

- `prefers-color-scheme` detection (decided against).
- Full-color or hover-color logos (decided against — monochrome only).
- Any change to module data, topology, or `src/data/skillTree.json`.
