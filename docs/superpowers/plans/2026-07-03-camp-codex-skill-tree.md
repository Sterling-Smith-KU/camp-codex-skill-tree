# Camp Codex Builder Skill Tree — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Implementation skill:** the visual build (HTML/CSS/JS craft) is done embodying **huashu-design** per the user's global UI routing.

**Goal:** Ship a self-contained, read-only web page that renders the Camp Codex builder skill tree as a glowing video-game perk tree, plus a "built with" company carousel, deployed live on GitHub Pages.

**Architecture:** A single `index.html` with inline `<style>` and `<script>` (no external/CDN requests). All node content is a JS data array; a small layout function computes node positions from that data; SVG cubic-bezier paths draw the connectors beneath absolutely-positioned circular node elements. Interaction and the carousel are vanilla JS + CSS.

**Tech Stack:** HTML5, CSS3 (custom properties, transforms, `@keyframes`), vanilla JS (ES2015+), inline SVG. No frameworks, no build step, no package manager. `gh`/`git` for repo + GitHub Pages.

## Global Constraints

- **Self-contained:** no external network requests at runtime — no CDN scripts, fonts, or remote images. Inline everything (brand marks as inline SVG or styled wordmark chips). System font stack.
- **Read-only showcase:** no add/edit/drag/persistence affordances anywhere.
- **Build-then-test:** implement Tasks 1–6 fully; do all verification in Task 7 (no per-task TDD, per the spec and the source md's *Skip TDD Early* doctrine).
- **Content source of truth:** [`camp-codex-skill-tree.md`](../../../camp-codex-skill-tree.md). Node labels, SP costs, and tooltip text must match it verbatim. Totals: **49 nodes**, **57 SP**; per-branch SP: Foundation 13 · Harness 15 · Architecture 14 · Craft 15.
- **Branch colors (from md):** Foundation `#EAB308` (🟡) · The Harness `#22C55E` (🟢) · Architecture `#EF4444` (🔴) · The Craft `#3B82F6` (🔵). Root trunk uses a neutral premium accent (warm off-white/gold), not branch-green.
- **Blank top bubbles:** each branch has 1–2 placeholder bubbles above its capstone — faint dashed circles, no label, no tooltip.
- **Responsive:** tree scrolls horizontally inside its own container on small screens; page `body` never scrolls sideways. Respect `prefers-reduced-motion` (carousel + hovers).
- **Repo:** public `camp-codex-skill-tree` under Sterling-Smith-KU; Pages from `main` root → `https://sterling-smith-ku.github.io/camp-codex-skill-tree/`.

---

## File structure

- `index.html` — the entire app: `<head>` inline `<style>`; `<body>` with header/legend/SP counter, `#tree` container (SVG connector layer + node layer), `#tooltip` element, `#carousel`; inline `<script>` with `BRANCHES`, `TREE_DATA`, `CAROUSEL_BRANDS`, layout, render, interaction, carousel.
- `README.md` — what it is, live URL, how to run locally, how to add future nodes.
- `camp-codex-skill-tree.md` — source content (already committed).
- `docs/superpowers/specs/…` , `docs/superpowers/plans/…` — spec + this plan (already committed).

Single-file `index.html` is intentional: it matches the approved "self-contained showcase" spec and keeps deployment trivial. Internal sections are separated by clear comment banners so each task edits a well-bounded region.

---

### Task 1: Repo scaffold + HTML skeleton + README

**Files:**
- Create: `index.html`
- Create: `README.md`

**Interfaces:**
- Produces: the DOM contract later tasks target — `header.tree-header`, `#sp-counter`, `#legend`, `#tree` (containing `<svg id="connectors">` and `<div id="nodes">`), `#tooltip`, `#carousel`.

- [ ] **Step 1: Create `index.html` skeleton** with the section scaffolding and empty style/script blocks:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Camp Codex Builder — Skill Tree</title>
  <style>/* ==== TASK 4: STYLES ==== */</style>
</head>
<body>
  <header class="tree-header">
    <h1>Camp Codex Builder</h1>
    <p class="subtitle">Four sessions with Josh Wexler, as a skill tree.</p>
    <div id="sp-counter"><!-- TASK 4 --></div>
    <div id="legend"><!-- TASK 4 --></div>
  </header>

  <main id="tree" aria-label="Skill tree">
    <svg id="connectors" aria-hidden="true"></svg>
    <div id="nodes"></div>
  </main>

  <div id="tooltip" role="tooltip" hidden></div>

  <section id="carousel" aria-label="Built with"><!-- TASK 6 --></section>

  <script>
  /* ==== TASK 2: DATA ==== */
  /* ==== TASK 3: LAYOUT + RENDER ==== */
  /* ==== TASK 5: INTERACTION ==== */
  /* ==== TASK 6: CAROUSEL ==== */
  </script>
</body>
</html>
```

- [ ] **Step 2: Create `README.md`** with title, one-paragraph description, the (pending) live URL, "open `index.html` in a browser to run locally," and a "Adding nodes" note pointing at `TREE_DATA` in `index.html`.

- [ ] **Step 3: Sanity check** — open `index.html` in a browser; confirm the header text renders and there are no console errors. (`start index.html` on Windows, or drag into a browser.)

- [ ] **Step 4: Commit**

```bash
git add index.html README.md
git commit -m "feat: scaffold skill-tree page skeleton and README"
```

---

### Task 2: Data model

**Files:**
- Modify: `index.html` (the `TASK 2: DATA` region of `<script>`)

**Interfaces:**
- Produces:
  - `BRANCHES` — ordered map keyed by `foundation|harness|architecture|craft`, each `{ name, session, color, spTotal, order, arms:[armA, armB] }`.
  - `TREE_DATA` — array of node objects `{ id, branch, tier, arm, label, sp, tooltip }` where `tier ∈ root|arm|capstone|placeholder`; placeholders are `{ id, branch, tier:'placeholder' }` (no label/sp/tooltip). `arm` names match `BRANCHES[branch].arms`.
  - `TRUNK` — `{ id:'trunk', label:'CAMP CODEX BUILDER' }`.
  - `CAROUSEL_BRANDS` — array of `{ name, mark }` (mark = inline-SVG string or null → wordmark chip). Defined here, consumed in Task 6.

- [ ] **Step 1: Add `BRANCHES`** with exact colors/SP:

```js
const BRANCHES = {
  foundation:   { name:'Foundation',   session:'Session 1 · Mindset & frameworks', color:'#EAB308', spTotal:13, order:0, arms:['doctrine','discipline'] },
  harness:      { name:'The Harness',  session:'Session 2 · Agentic harnesses',    color:'#22C55E', spTotal:15, order:1, arms:['anatomy','control'] },
  architecture: { name:'Architecture', session:'Session 3 · How apps work',        color:'#EF4444', spTotal:14, order:2, arms:['stack','method'] },
  craft:        { name:'The Craft',    session:'Session 4 · Design & optimization',color:'#3B82F6', spTotal:15, order:3, arms:['design','optimization'] },
};
const TRUNK = { id:'trunk', label:'CAMP CODEX BUILDER' };
```

- [ ] **Step 2: Add `TREE_DATA`** — one object per node, transcribed verbatim from `camp-codex-skill-tree.md`. Root `tier:'root'`, arm nodes `tier:'arm'` with the correct `arm`, capstone `tier:'capstone'`. Example (Foundation; repeat pattern for all four branches — see source md for every label/sp/tooltip):

```js
const TREE_DATA = [
  // FOUNDATION
  { id:'fo-root', branch:'foundation', tier:'root', arm:null, label:"BUILD, DON'T CHAT", sp:1, tooltip:"Lets you create apps, automations, agents, and workflows instead of just prompting a chatbot." },
  { id:'fo-d1', branch:'foundation', tier:'arm', arm:'doctrine', label:'VOCABULARY FIRST', sp:1, tooltip:"Grants the technical vocabulary you need to navigate a field that moves a mile a minute." },
  { id:'fo-d2', branch:'foundation', tier:'arm', arm:'doctrine', label:'THE THREE USES', sp:1, tooltip:"Unlocks AI's core modes: automate a task, augment a human, enable a new skill." },
  { id:'fo-d3', branch:'foundation', tier:'arm', arm:'doctrine', label:'FIVE ROLES', sp:1, tooltip:"Lets you cast AI as assistant, co-creative partner, tutor, coach, or advisor." },
  { id:'fo-d4', branch:'foundation', tier:'arm', arm:'doctrine', label:'CO-CREATIVE PARTNER', sp:2, tooltip:"Work with the model instead of just handing off; cuts hallucinations and weak output." },
  { id:'fo-x1', branch:'foundation', tier:'arm', arm:'discipline', label:'RESIST THE HYPE', sp:1, tooltip:"Try a new tool fast, keep what works, and walk past trend-chasing like \"caveman mode.\"" },
  { id:'fo-x2', branch:'foundation', tier:'arm', arm:'discipline', label:'TAME THE PEOPLE PLEASER', sp:1, tooltip:"Make the AI confirm its plan before it runs, so it stops over-building and burning your tokens." },
  { id:'fo-x3', branch:'foundation', tier:'arm', arm:'discipline', label:'AGENT CAUTION', sp:1, tooltip:"Avoid brittle, non-deterministic agent stacks that get expensive and break down over time." },
  { id:'fo-x4', branch:'foundation', tier:'arm', arm:'discipline', label:'MODEL ROULETTE', sp:1, tooltip:"Swap between Sonnet, Opus, and Haiku to match the model to the task's complexity." },
  { id:'fo-x5', branch:'foundation', tier:'arm', arm:'discipline', label:'CONFIG HIERARCHY', sp:1, tooltip:"Project instructions take priority; Codex reads project config before your system preferences." },
  { id:'fo-cap', branch:'foundation', tier:'capstone', arm:null, label:"ITERATE, DON'T ENVISION", sp:2, tooltip:"Ship small, fail, refine; constant iteration beats one grand vision, and credits reset, so take the risk." },
  // HARNESS, ARCHITECTURE, CRAFT: same shape — transcribe all nodes from the source md.
];
```

- [ ] **Step 3: Add placeholder bubbles** — append 2 placeholder objects per branch (top-tier blanks):

```js
for (const b of Object.keys(BRANCHES)) {
  TREE_DATA.push({ id:`${b}-ph1`, branch:b, tier:'placeholder' });
  TREE_DATA.push({ id:`${b}-ph2`, branch:b, tier:'placeholder' });
}
```

- [ ] **Step 4: Add `CAROUSEL_BRANDS`** — names from the md; `mark` inline SVG where easy, else `null`:

```js
const CAROUSEL_BRANDS = [
  {name:'OpenAI',mark:null},{name:'Claude',mark:null},{name:'Anthropic',mark:null},
  {name:'GitHub',mark:null},{name:'VS Code',mark:null},{name:'Supabase',mark:null},
  {name:'Mermaid',mark:null},{name:'Google Stitch',mark:null},{name:'Notion',mark:null},
  {name:'Gmail',mark:null},{name:'Cloudflare',mark:null},{name:'shadcn/ui',mark:null},
  {name:'Chrome DevTools',mark:null},{name:'Mem0',mark:null},{name:'Claude-Mem',mark:null},
];
```

- [ ] **Step 5: Data self-check** — in the browser console after load, verify counts:

```js
TREE_DATA.filter(n=>n.tier!=='placeholder').length // === 49
TREE_DATA.filter(n=>n.tier!=='placeholder').reduce((s,n)=>s+n.sp,0) // === 57
```

Fix any mismatch against the source md before committing.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: encode skill-tree node data, branches, and carousel brands"
```

---

### Task 3: Layout engine + node/connector rendering

**Files:**
- Modify: `index.html` (`TASK 3` region)

**Interfaces:**
- Consumes: `BRANCHES`, `TREE_DATA`, `TRUNK`.
- Produces: `computeLayout()` → `{ positions: {id:{x,y}}, edges:[{from,to,branch}], width, height }`; `renderTree()` which populates `#connectors` (SVG) and `#nodes` (DOM). Each node element is `<button class="node" data-id …>` (button = keyboard/focus accessible, still read-only). Sets `#tree`/`#connectors` width/height to `layout.width/height`.

- [ ] **Step 1: Write `computeLayout()`.** Grid math: each branch is a column of width `COL_W` (~260px) ordered by `BRANCHES[b].order`; `cx = COL_W/2 + order*COL_W`. Vertical tiers from the **bottom up**: trunk row at the bottom (`y = height - ROW`), branch root one row above, arm nodes stacked upward (`ROW_H` step), capstone above the tallest arm, placeholders above the capstone. Arms sit at `cx ± ARM_DX`. Build `edges`: `trunk→each root`; `root→first node of each arm`; consecutive arm nodes; `last node of each arm→capstone`; `capstone→each placeholder`. Return positions/edges/size.

```js
const COL_W=260, ROW_H=104, ARM_DX=64, NODE=54, PAD=48;
function computeLayout(){ /* returns {positions, edges, width, height} per the rules above */ }
```

- [ ] **Step 2: Write `curve(a,b)`** — SVG cubic-bezier path string between two points with vertical control handles for a smooth organic bend:

```js
function curve(a,b){ const my=(a.y+b.y)/2; return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`; }
```

- [ ] **Step 3: Write `renderTree()`** — for each edge append a `<path>` to `#connectors` (stroke = branch color, class `edge`); for each node append a positioned `<button class="node tier-… branch-…">` (placeholders get class `placeholder` and no text; others show a short label). Append the trunk node. Set SVG `viewBox`/size to layout size.

- [ ] **Step 4: Call it on load** — `renderTree(computeLayout());`.

- [ ] **Step 5: Sanity check** — reload; confirm four columns of nodes with curved lines converging on a bottom trunk, blanks at the top of each column. Layout may be unstyled/rough — that's Task 4.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: layout engine + SVG connectors + node rendering"
```

---

### Task 4: Visual styling (elevated game feel)

**Files:**
- Modify: `index.html` (`TASK 4` `<style>` + fill `#sp-counter`/`#legend` markup)

- [ ] **Step 1: Design tokens + canvas** — CSS custom properties for the 4 branch colors, a dark background (deep charcoal/green-black), radial vignette, and the neutral trunk accent. Set base typography (system stack, uppercase tracked labels).

- [ ] **Step 2: Node styling** — `.node` circular (`NODE`px), branch-colored ring + soft outer glow (`box-shadow`), dark fill, centered mini-label. `.tier-capstone` larger with a stronger glow + crown accent (a `::before` gem/▲). `.tier-root` prominent. Trunk node the boldest element. `.placeholder` faint, dashed ring, no fill, `opacity:.35`.

- [ ] **Step 3: Connector styling** — `.edge { fill:none; stroke-width:2.5; opacity:.55; }` with a subtle per-branch glow (`filter: drop-shadow`).

- [ ] **Step 4: Header, legend, SP counter** — render `#sp-counter` as "57 SP · 49 nodes" plus four per-branch chips (13/15/14/15) colored per branch; `#legend` shows the 4 branch swatches + a "tier" key (root · capstone · locked/placeholder). Center the header; constrain width.

- [ ] **Step 5: Tree framing** — `#tree` centered, generous padding, `position:relative`; `#connectors` absolutely behind `#nodes`. Give the canvas a faint bordered "panel" feel.

- [ ] **Step 6: Sanity check** — reload; the tree should read as a glowing perk tree with clear branch colors, emphasized capstones/root, and faint blank tops. Adjust tokens until it looks intentional (anti-slop).

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: game-style visual design — glowing nodes, capstones, legend, SP counter"
```

---

### Task 5: Interaction (tooltips + responsive)

**Files:**
- Modify: `index.html` (`TASK 5` script + tooltip/responsive CSS)

**Interfaces:**
- Consumes: rendered `.node` buttons with `data-id`; `TREE_DATA` by id; `#tooltip`.

- [ ] **Step 1: Tooltip content + show/hide** — on `.node` `mouseenter`/`focus`/`click`(mobile tap), look up the node by `data-id`; skip placeholders. Fill `#tooltip` with name · tier · `SP n` · tooltip text (branch-colored accent), unhide, and position near the node clamped to the viewport. Hide on `mouseleave`/`blur`/outside tap/`Esc`.

```js
function showTip(node, rect){ /* fill #tooltip, position clamped to viewport, unhide */ }
```

- [ ] **Step 2: Hover emphasis** — `.node:hover, .node:focus-visible { transform:scale(1.12); }` with intensified glow; smooth `transition`. Dim non-hovered? No — keep simple.

- [ ] **Step 3: Responsive** — wrap `#tree` so it scrolls horizontally on narrow screens (`overflow-x:auto`) while `html,body{overflow-x:hidden}` prevents page-level sideways scroll. Ensure tooltip clamps on small screens.

- [ ] **Step 4: Reduced motion** — `@media (prefers-reduced-motion: reduce)` removes hover scale transitions.

- [ ] **Step 5: Sanity check** — hover/tap several nodes across branches (incl. a capstone and a placeholder → placeholder shows nothing); resize narrow → tree scrolls, page doesn't; `Esc`/blur hides tooltip.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: interactive tooltips, hover emphasis, responsive scroll"
```

---

### Task 6: Company / tool carousel

**Files:**
- Modify: `index.html` (`#carousel` markup build + `TASK 6` CSS/JS)

**Interfaces:**
- Consumes: `CAROUSEL_BRANDS`.

- [ ] **Step 1: Build the track** — JS renders a `.marquee-track` containing one `.brand` chip per `CAROUSEL_BRANDS` entry (inline SVG `mark` if present, else a styled wordmark chip), then **duplicates the set once** so the loop is seamless.

```js
function initCarousel(){ /* build track from CAROUSEL_BRANDS, append a second copy for seamless loop */ }
```

- [ ] **Step 2: Marquee CSS** — a "Built with" label above; `.marquee` `overflow:hidden`; `.marquee-track` `display:flex; width:max-content; animation: scroll Ns linear infinite;` `@keyframes scroll { to { transform: translateX(-50%); } }`. Chips: pill, subtle border, muted→full color on hover.

- [ ] **Step 3: Pause + reduced motion** — `.marquee:hover .marquee-track { animation-play-state: paused; }`; under `prefers-reduced-motion: reduce`, disable the animation and allow the row to wrap/scroll instead.

- [ ] **Step 4: Sanity check** — brands scroll continuously with no visible seam/jump; hover pauses; reduced-motion shows a static readable row.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: 'built with' company carousel"
```

---

### Task 7: Verify + deploy (only after Tasks 1–6)

**Files:** none (verification + ops)

- [ ] **Step 1: Automated pass (Playwright).** Load `index.html` and assert: exactly 49 non-placeholder node buttons render; 8 placeholder bubbles render with no text; hovering/focusing a sample node in each branch shows a tooltip with the matching label + `SP`; SP counter reads "57 SP · 49 nodes"; no console errors. Capture a full-page screenshot (desktop + a ~390px mobile viewport) and eyeball for slop/overlap.

- [ ] **Step 2: Manual pass.** Confirm the four branch colors match the md key, capstones/root read as emphasized, blanks are faint at the top, page has no horizontal body scroll on mobile width, carousel loops seamlessly and pauses on hover.

- [ ] **Step 3: Fix anything found**, committing each fix (`fix: …`).

- [ ] **Step 4: Create the GitHub repo and push.**

```bash
gh repo create camp-codex-skill-tree --public --source=. --remote=origin \
  --description "Camp Codex builder sessions as an interactive skill tree" --push
```

- [ ] **Step 5: Enable GitHub Pages** (main branch, root):

```bash
gh api -X POST repos/Sterling-Smith-KU/camp-codex-skill-tree/pages \
  -f source[branch]=main -f source[path]=/ 2>/dev/null \
  || gh api -X PUT repos/Sterling-Smith-KU/camp-codex-skill-tree/pages -f source[branch]=main -f source[path]=/
```

- [ ] **Step 6: Confirm the live site.** Wait for the Pages build, then fetch `https://sterling-smith-ku.github.io/camp-codex-skill-tree/` and confirm HTTP 200 + the tree renders. Add the live URL to `README.md`, commit, and push.

```bash
gh api repos/Sterling-Smith-KU/camp-codex-skill-tree/pages --jq .html_url
```

---

## Self-Review

**1. Spec coverage:**
- §1 showcase/read-only → Global Constraints + node `<button>` with no edit affordances ✓
- §3 data model (`{id,branch,tier,arm,label,sp,tooltip,placeholder}`) → Task 2 ✓
- §4 layout (root→arms→capstone→blanks, trunk bottom, computed positions, bezier connectors) → Task 3 ✓
- §5 visuals (dark canvas, glow, capstone/root emphasis, legend, SP counter) → Task 4 ✓
- §6 interaction (hover/tap tooltip, hover glow, responsive scroll, reduced motion) → Task 5 ✓
- §7 carousel (inline marks, seamless loop, pause on hover, reduced motion) → Task 6 ✓
- §8 deploy (public repo, Pages from main root, live URL) → Task 7 ✓
- §9 build-then-test order → task ordering + Global Constraints ✓
- Node/SP totals (49/57; 13/15/14/15) → Global Constraints + Task 2 Step 5 + Task 7 Step 1 ✓

**2. Placeholder scan:** Task 2 asks to transcribe all nodes from the source md rather than duplicating 49 tooltips in the plan — the md is the verbatim source and is referenced explicitly; the shape + a full branch are shown. No "TBD/handle edge cases" left. ✓

**3. Type consistency:** `computeLayout()`, `renderTree()`, `curve()`, `showTip()`, `initCarousel()`, and the `BRANCHES`/`TREE_DATA`/`CAROUSEL_BRANDS`/`TRUNK` shapes are named identically wherever referenced. Arm names in `BRANCHES[b].arms` match the `arm` values used in `TREE_DATA`. ✓
