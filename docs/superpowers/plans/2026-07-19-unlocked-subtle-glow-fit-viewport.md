# Unlocked-by-Default, Subtle Glow, Fit-to-Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the click-to-unlock mechanic (all 21 modules permanently lit), soften the node/edge glow, and size the tree so it fits entirely in the desktop viewport.

**Architecture:** The whole site is one zero-dependency file, `index.html` (inline CSS + JS; the SVG tree is built at runtime from data constants). `src/data/skillTree.json` mirrors the inline module data verbatim and the Playwright suite `scripts/verify.mjs` asserts they match. Tests ARE `scripts/verify.mjs` — each task edits its assertions first, watches them fail, then edits `index.html` to pass.

**Tech Stack:** Vanilla HTML/CSS/JS, SVG, Playwright (dev-only, `npm run verify`).

**Spec:** `docs/superpowers/specs/2026-07-19-unlocked-subtle-glow-fit-viewport-design.md`

## Global Constraints

- `index.html` stays a single zero-dependency file; no new libraries.
- Inline `SKILL_TREE_DATA` must match `src/data/skillTree.json` verbatim (verify.mjs section 1 enforces this).
- Both themes must keep working: dark default, light via `html[data-theme="light"]`.
- Mobile (<768px) uses `.mobile-stack`; the SVG tree is desktop-only (≥768px).
- Test command: `npm run verify` (runs `node scripts/verify.mjs`; needs `npm install` and Playwright's Chromium once: `npx playwright install chromium`).
- Windows/PowerShell environment. Repo root: `C:\Users\smith\camp-codex-skill-tree`.
- Caution when reading `index.html`: lines ~14–83 contain giant base64 font lines that overflow read limits — read in narrow ranges or use grep.

## File Structure

- Modify: `index.html` — all three changes land here (CSS block ~lines 14–473, HTML body ~475–515, JS ~517–1175).
- Modify: `scripts/verify.mjs` — replace unlock-model assertions with always-lit + fit-to-viewport assertions.
- Modify: `src/data/skillTree.json` — drop the now-meaningless `"unlocked": false` field (mirrored inline).

---

### Task 1: Remove click-to-unlock — everything starts lit

**Files:**
- Modify: `scripts/verify.mjs`
- Modify: `index.html`
- Modify: `src/data/skillTree.json`

**Interfaces:**
- Consumes: current DOM contract (`#tree-svg g.node.module`, `#hit-layer button[data-id]`, `.m-node[data-id]`, `#tooltip`).
- Produces: static classes `g.node.module.unlocked` (21), `g.edge.lit` (21 — only edges whose child is a module; connector edges stay muted), `.m-node.unlocked` (21), `li.lit-in`; NO `#total-count`, NO `[data-branch-count]`, NO `[data-m-branch-count]`, NO `.tt-hint`, NO `aria-pressed` on module buttons; buttons get `aria-label` = `"<Name>. <Description>"`; `showTooltip(id, anchor)` is now 2-arg. Tasks 2–3 rely on `g.edge.lit` and `.tree-canvas` being unchanged structurally.

- [ ] **Step 1: Update verify.mjs assertions (the failing tests)**

Make these exact replacements in `scripts/verify.mjs`:

1a. Replace the header comment (lines 1–5):

```js
// Verification pass for the Camp Codex skill tree (v3 — all modules unlocked by default).
// Checks: data sync with src/data/skillTree.json, node/edge counts vs the approved
// Mermaid topology, tooltip content, always-lit state, keyboard access, mobile stack
// layout, console errors, screenshots.
// Run: npm install && npm run verify
```

1b. Replace ALL of section 5 (`/* ---------- 5. sequential unlock rule ---------- */` through the `check('count after cascade = 2', ...)` line) with:

```js
/* ---------- 5. everything unlocked on load; clicking never changes state ---------- */
const litState = () => page.evaluate(() => ({
  litNodes: document.querySelectorAll('#tree-svg g.node.module.unlocked').length,
  litEdges: document.querySelectorAll('#tree-svg g.edge.lit').length,
  hasCounter: !!document.getElementById('total-count'),
  branchCounts: document.querySelectorAll('[data-branch-count]').length,
  hasHint: !!document.querySelector('#tooltip .tt-hint'),
  pressed: document.querySelectorAll('#hit-layer button[aria-pressed]').length,
}));
let lit = await litState();
check('all 21 modules lit on load', lit.litNodes === 21, `got ${lit.litNodes}`);
check('all 21 module edges lit', lit.litEdges === 21, `got ${lit.litEdges}`);
check('no unlock counters', !lit.hasCounter && lit.branchCounts === 0);
check('no blocked-hint element', !lit.hasHint);
check('no aria-pressed toggles', lit.pressed === 0);

// clicking a node shows its tooltip and changes nothing
await page.click('#hit-layer button[data-id="context-engineering"]');
await page.waitForTimeout(150);
check('click shows tooltip', await page.locator('#tooltip.show').count() === 1);
lit = await litState();
check('click does not change lit state', lit.litNodes === 21 && lit.litEdges === 21);
check('no unlock key written', (await page.evaluate(() => localStorage.getItem('camp-codex-skill-tree:unlocked:v2'))) === null);
await page.mouse.move(720, 10);
```

1c. Replace ALL of section 6 (`/* ---------- 6. persistence across reload ---------- */` through the `check('state survives reload', ...)` statement) with:

```js
/* ---------- 6. reload: still fully lit ---------- */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(300);
lit = await litState();
check('still fully lit after reload', lit.litNodes === 21 && lit.litEdges === 21);
```

1d. In section 7, replace the two lines after `check('focus shows tooltip', ...)`:

```js
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
check('keyboard unlock', (await pressed('curiosity')) === 'true');
```

with:

```js
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
check('keyboard activation shows tooltip, no state change', await page.locator('#tooltip.show').count() === 1
  && (await litState()).litNodes === 21);
```

1e. In section 7b, delete this line (the counter no longer exists):

```js
check('unlock state independent of theme', (await totalCount()) === '3');
```

1f. Replace the section 9 tap block — from `await m.evaluate(() => localStorage.clear());` through `check('mobile: branch counter updates', mCount === '1 / 7');` — with (and change the section 9 header comment `tap-to-unlock` → `tap shows tooltip`):

```js
await m.tap('.m-node[data-id="app-anatomy"]');
await m.waitForTimeout(250);
const mLit = await m.evaluate(() => ({
  lit: document.querySelectorAll('.mobile-stack .m-node.unlocked').length,
  litIn: document.querySelectorAll('.mobile-stack li.lit-in').length,
  counters: document.querySelectorAll('[data-m-branch-count]').length,
  tip: !!document.querySelector('#tooltip.show'),
}));
check('mobile: all 21 rows lit + tap shows tooltip', mLit.lit === 21 && mLit.tip, JSON.stringify(mLit));
check('mobile: connectors lit, no counters', mLit.litIn === 21 && mLit.counters === 0);
```

1g. Replace the section 10 block from `await rm.evaluate(() => localStorage.clear());` through `check('reduced-motion unlock works', ...)` with:

```js
await rm.click('#hit-layer button[data-id="curiosity"]');
await rm.waitForTimeout(200);
check('reduced-motion: click shows tooltip', await rm.locator('#tooltip.show').count() === 1);
```

- [ ] **Step 2: Run to verify the new assertions fail**

Run: `npm run verify` (from `C:\Users\smith\camp-codex-skill-tree`; first time: `npm install; npx playwright install chromium`)
Expected: FAIL — `all 21 modules lit on load — got 0`, `all 21 module edges lit — got 0`, `no unlock counters`, `no blocked-hint element`, `no aria-pressed toggles`, `click does not change lit state`, `no unlock key written`, mobile lit checks. (Sections 1–4b should still pass.)

- [ ] **Step 3: Implement in index.html + skillTree.json**

All edits below are in `index.html` unless noted. Use exact-match edits; the base64 font lines make full-file reads fail, so edit surgically.

3a. **Meta description** (line ~7): change `— three branches, 21 modules, click to unlock."` to `— three branches, 21 modules."`

3b. **CSS deletions** (style block, ~lines 14–473). Delete each of these rules entirely:

```css
.total-counter {
  text-align: right;
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.total-counter .num {
  font-size: 28px;
  font-weight: 700;
  color: var(--root);
}
.total-counter .lbl {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--ink-muted);
}
```

```css
.branch-count {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.08em;
  fill: var(--node-text-color, var(--node-color));
  text-anchor: middle;
}
```

```css
.tooltip .tt-hint {
  margin-top: 8px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  display: none;
}
.tooltip.blocked .tt-hint { display: block; }
```

```css
.node.available circle { stroke: var(--node-color); }
.node.available text { fill: var(--node-text-bright); }
```

```css
.node.pulse { animation: node-pulse 0.25s ease-out; }
.node.shake { animation: node-shake 0.3s ease; }
```

```css
@keyframes node-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes node-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-3px); }
}
```

```css
  .mobile-branch .m-count {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--node-text-color, var(--node-color));
  }
```

```css
  .m-node.available .m-dot { border-color: var(--node-color); }
  .m-node.available .m-name { color: var(--node-text-bright); }
```

```css
  .m-node.shake { animation: node-shake 0.3s ease; }
```

And in the `@media (prefers-reduced-motion: reduce)` block, delete only this line (keep the rest):

```css
  .node.pulse, .node.shake, .m-node.shake { animation: none; }
```

3c. **Header markup**: replace

```html
    <p class="subtitle">Three branches, 21 modules. Click a module to unlock it — each one opens the next.</p>
```

with

```html
    <p class="subtitle">Three branches, 21 modules. Hover or tap a module to read it.</p>
```

and delete the counter block inside `.header-tools`:

```html
    <div class="total-counter">
      <span class="num"><span id="total-count">0</span> / 21</span>
      <span class="lbl">Modules unlocked</span>
    </div>
```

3d. **Tooltip markup**: delete

```html
  <div class="tt-hint">Unlock the previous module first.</div>
```

3e. **Inline data**: replace_all `, unlocked: false }` → ` }` (21 occurrences in the `SKILL_TREE_DATA.modules` array).

3f. **Delete the state section** — the whole block from `/* ================= state ================= */` through the end of `saveState()` (i.e., `STORAGE_KEY`, `const unlocked = new Set();`, `isAvailable`, `loadState`, `saveState`).

3g. **buildSvg — edges**: replace

```js
    const g = el("g", { class: "edge", "data-edge": `${p}->${c}`, style: branchVars(branch) }, gEdges);
    const d = edgePath(a, b);
    el("path", { class: "edge-halo", d }, g);
    el("path", { class: "edge-core", d }, g);
    if (NODES[c].kind === "module") edgeEls[c] = g;
```

with

```js
    /* edges into modules render lit; edges into decorative connectors stay muted */
    const g = el("g", { class: NODES[c].kind === "module" ? "edge lit" : "edge", "data-edge": `${p}->${c}`, style: branchVars(branch) }, gEdges);
    const d = edgePath(a, b);
    el("path", { class: "edge-halo", d }, g);
    el("path", { class: "edge-core", d }, g);
```

and delete the now-unused registry declarations:

```js
const edgeEls = {};   /* childId -> <g.edge> (module children only) */
```
```js
const mobileLis = {}; /* moduleId -> mobile <li> (for connector tinting) */
```

3h. **buildSvg — module nodes**: replace

```js
    const g = el("g", { class: "node module", "data-node": id, style: branchVars(n.branch) }, gNodes);
```

with

```js
    const g = el("g", { class: "node module unlocked", "data-node": id, style: branchVars(n.branch) }, gNodes);
```

3i. **buildSvg — branch chips**: delete the per-branch counter (keep the label rect/text above it):

```js
    el("rect", { class: "branch-chip-bg", x: n.x - 24, y: 1164, width: 48, height: 36, rx: 5 }, g);
    const t2 = el("text", { class: "branch-count", x: n.x, y: 1192, "data-branch-count": branch }, g);
    t2.textContent = "0";
```

3j. **buildSvg — hit buttons**: after `b.dataset.id = m.id;` add:

```js
    b.setAttribute("aria-label", `${m.name}. ${m.description}`);
```

3k. **buildMobile**: delete the counter span and its append —

```js
    const count = document.createElement("span");
    count.className = "m-count";
    count.dataset.mBranchCount = branch;
    count.textContent = "0 / 7";
    header.append(h2, count);
```

becomes

```js
    header.append(h2);
```

In the per-module forEach, make rows permanently lit and labeled — the loop body becomes:

```js
      .forEach(m => {
        const li = document.createElement("li");
        li.className = "lit-in";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "m-node unlocked";
        btn.dataset.id = m.id;
        btn.setAttribute("aria-label", `${m.name}. ${m.description}`);
        const dot = document.createElement("span");
        dot.className = "m-dot";
        const name = document.createElement("span");
        name.className = "m-name";
        name.textContent = m.name;
        btn.append(dot, name);
        li.appendChild(btn);
        ol.appendChild(li);
        mobileEls[m.id] = btn;
      });
```

(Changes vs current: `li.className = "lit-in"`, `"m-node unlocked"`, the `aria-label` line, and the `mobileLis[m.id] = li;` line is gone.)

3l. **Delete the render section** — everything from `/* ================= rendering state to the DOM ================= */` through the closing brace of `render()` (functions `stateOf`, `ariaLabel`, `render`).

3m. **Tooltip**: remove the blocked concept.

```js
let tooltipBlocked = false;
```
→ delete.

```js
function showTooltip(id, anchor, blocked) {
```
→ `function showTooltip(id, anchor) {`

Delete these two lines inside it:

```js
  tooltip.classList.toggle("blocked", !!blocked);
```
```js
  tooltipBlocked = !!blocked;
```

And in `hideTooltip`, change `tooltip.classList.remove("show", "blocked");` → `tooltip.classList.remove("show");`

3n. **Interactions**: delete `const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");`, the whole `flash()` function, and the whole `toggle()` function. Replace `wireButton` with:

```js
function wireButton(btn) {
  const id = btn.dataset.id;
  btn.addEventListener("click", () => showTooltip(id, btn));
  btn.addEventListener("mouseenter", () => {
    showTooltip(id, btn);
    if (nodeEls[id]) nodeEls[id].classList.add("hovered");
  });
  btn.addEventListener("mouseleave", () => {
    hideTooltip();
    if (nodeEls[id]) nodeEls[id].classList.remove("hovered");
  });
  btn.addEventListener("focus", () => showTooltip(id, btn));
  btn.addEventListener("blur", hideTooltip);
}
```

3o. **Boot block**: delete the `loadState();` and `render();` lines. Change the two root-link tooltip calls `showTooltip(JOSH.id, rootLinkEl, false)` → `showTooltip(JOSH.id, rootLinkEl)`. Change the scroll handler line `showTooltip(tooltipFor, tooltipAnchor, tooltipBlocked);` → `showTooltip(tooltipFor, tooltipAnchor);`

3p. **src/data/skillTree.json**: replace_all `, "unlocked": false }` → ` }` (21 occurrences). This keeps section-1 data-sync green because 3e made the same change inline.

- [ ] **Step 4: Run to verify everything passes**

Run: `npm run verify`
Expected: PASS — `{ "pass": true, "failures": [] }`, zero console errors. If `data-sync` fails, the inline data and JSON edits (3e vs 3p) drifted — diff them.

- [ ] **Step 5: Commit**

```powershell
git add index.html src/data/skillTree.json scripts/verify.mjs
git commit -m "feat: all modules start unlocked; remove click-to-unlock mechanic"
```

---

### Task 2: Subtler node lighting

**Files:**
- Modify: `index.html` (4 small value edits)

**Interfaces:**
- Consumes: `.node.unlocked` / `.edge.lit` classes from Task 1 (glow CSS unchanged structurally).
- Produces: nothing new — value-only change. No verify.mjs assertions cover glow; the suite guards against regressions.

- [ ] **Step 1: Dial down the glow values in index.html**

2a. CSS variable (dark-theme `:root` block): `--unlocked-glow: 0 0 14px;` → `--unlocked-glow: 0 0 6px;`

2b. Root hover glow, both themes: dark `--root-hover-glow: rgba(255, 255, 255, 0.45);` → `rgba(255, 255, 255, 0.25)`; light `--root-hover-glow: rgba(20, 22, 27, 0.3);` → `rgba(20, 22, 27, 0.18)`.

2c. Edge halo: `.edge.lit .edge-halo { stroke: var(--edge-color); opacity: 0.28; }` → `opacity: 0.18;`

2d. Branch glow alphas in the `BRANCHES` JS object — change all three `0.6` alphas to `0.3`:

```js
const BRANCHES = {
  "creativity":     { label: "Creativity",       cssColor: "var(--creativity)", textColor: "var(--creativity)",     glow: "rgba(255, 51, 51, 0.3)" },
  "ai-skills":      { label: "AI Skills",        cssColor: "var(--ai-skills)",  textColor: "var(--ai-skills-text)", glow: "rgba(255, 204, 0, 0.3)" },
  "web-app-design": { label: "Web & App Design", cssColor: "var(--web-design)", textColor: "var(--web-design)",     glow: "rgba(51, 204, 255, 0.3)" }
};
```

- [ ] **Step 2: Run verify + eyeball both themes**

Run: `npm run verify`
Expected: PASS. Then open `verify-out\desktop.png` (dark) and `verify-out\light.png` (light) and confirm nodes still read as lit but with a soft, subtle halo — no hard 14px bloom. If a theme looks dead or still hot, nudge only these values (blur 4–8px, alpha 0.2–0.4) and re-run.

- [ ] **Step 3: Commit**

```powershell
git add index.html
git commit -m "style: soften node and edge glow"
```

---

### Task 3: Fit the whole tree in the viewport

**Files:**
- Modify: `scripts/verify.mjs` (new fit assertions)
- Modify: `index.html` (`.tree-canvas` sizing)

**Interfaces:**
- Consumes: `.tree-canvas` container with `aspect-ratio: 1160 / 1330`; percentage-positioned `.hit-layer` children (scale automatically — do not touch them).
- Produces: no-vertical-scroll desktop layout; SVG remains `viewBox="0 0 1160 1330"` so browser/pinch zoom stays crisp (vector).

- [ ] **Step 1: Add failing fit assertions to verify.mjs**

Insert after the section-8 screenshot block (`await page.screenshot({ path: join(outDir, 'desktop.png'), fullPage: true });`):

```js
/* ---------- 8b. whole tree fits the viewport on desktop ---------- */
const fitAt = async (w, h) => {
  const c = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  await p.goto(file, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => ({
    overflow: document.documentElement.scrollHeight - window.innerHeight,
    treeH: document.querySelector('.tree-canvas').getBoundingClientRect().height,
  }));
  await c.close();
  return r;
};
const fit1440 = await fitAt(1440, 1000);
check('1440x1000: no vertical scroll', fit1440.overflow <= 1, `overflow ${fit1440.overflow}px`);
check('1440x1000: tree has real size', fit1440.treeH > 500, `tree ${fit1440.treeH}px`);
const fit1366 = await fitAt(1366, 768);
check('1366x768: no vertical scroll', fit1366.overflow <= 1, `overflow ${fit1366.overflow}px`);
```

- [ ] **Step 2: Run to verify the fit checks fail**

Run: `npm run verify`
Expected: FAIL on `1440x1000: no vertical scroll` and `1366x768: no vertical scroll` (tree currently renders ~1330px tall at full width; the page scrolls). Everything else PASS.

- [ ] **Step 3: Implement the sizing in index.html**

Replace:

```css
.tree-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 1160 / 1330;
}
```

with:

```css
.tree-canvas {
  position: relative;
  /* fit the whole 1160x1330 tree in the viewport: width derived from available
     height (100vh minus header + paddings + marquee); the SVG is vector, so
     browser/pinch zoom magnifies losslessly */
  aspect-ratio: 1160 / 1330;
  width: min(100%, calc((100vh - 260px) * (1160 / 1330)));
  margin: 0 auto;
}
```

The `260px` allowance covers header (~90px), `.tree-wrap` padding (8px + 48px), and the marquee footer (~112px). If Step 4 still shows a few px of overflow, raise the allowance (270–280px) rather than restructuring; if there's lots of slack, lower it. Do not change `viewBox`, `.hit-layer`, or the mobile breakpoint.

- [ ] **Step 4: Run to verify everything passes**

Run: `npm run verify`
Expected: PASS — `{ "pass": true, "failures": [] }`. Open `verify-out\desktop.png`: header, full tree (root to top connectors), and "Built with" marquee all visible with no scrollbar; tooltips still appear beside nodes (section 4 guards this).

- [ ] **Step 5: Commit**

```powershell
git add index.html scripts/verify.mjs
git commit -m "feat: fit entire tree in the viewport on desktop"
```
