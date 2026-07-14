# Tools Marquee + Light/Dark Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scrolling footer marquee of the ten tool logos used to build Camp Codex, plus a persisted light/dark theme toggle, to the live skill-tree page.

**Architecture:** Everything lands in the single self-contained `index.html`: theme = CSS custom-property tokenization + one `html[data-theme="light"]` override block + a pre-paint hydration script; marquee = a static footer whose logo row is JS-built twice from an inline `TOOL_LOGOS` constant and animated with one pure-CSS keyframe. Verification extends the existing Playwright suite in `scripts/verify.mjs`.

**Tech Stack:** Vanilla HTML/CSS/JS (no frameworks, no build step), Playwright for verification (already a devDependency).

**Spec:** `docs/superpowers/specs/2026-07-11-tools-marquee-theme-toggle-design.md` (approved). Logo vectors are **already sourced, verified authentic, and committed** at `src/data/toolLogos.json` (commit `c5dcce2`) — do not re-source or substitute them.

## Global Constraints

- One self-contained `index.html` — no frameworks, no build step, **zero runtime network requests**.
- Repo convention: data files are mirrored verbatim as inline constants in `index.html`; `npm run verify` must fail if they drift (`src/data/toolLogos.json` ↔ `TOOL_LOGOS`, same pattern as `skillTree.json` ↔ `SKILL_TREE_DATA`).
- Logos: the ten authentic marks from `src/data/toolLogos.json`, monochrome via `fill: currentColor`, order fixed: OpenAI, Anthropic, Gemini, Notion, Supabase, Mermaid, Google Stitch, VS Code, GitHub, YouTube.
- Marquee: static footer (not fixed), label text exactly `Built with`, ~35s linear infinite loop, pauses on hover, static (no animation) under `prefers-reduced-motion: reduce`.
- Theme: dark is the default for everyone (no `prefers-color-scheme` detection). Light is opt-in, stored under localStorage key `camp-codex-skill-tree:theme` with value `light` (key removed when back on dark). No flash of wrong theme on load.
- Branch colors `--creativity #FF3333` / `--web-design #33CCFF` unchanged in both themes; `--ai-skills #FFCC00` unchanged for node fills/edges, but yellow **text** (branch counter, mobile branch headings) uses a darker variant in light mode.
- Unlock logic, topology, `src/data/skillTree.json`, and the unlock localStorage key must not change.
- Every task ends with the full `npm run verify` suite green and a commit.

---

### Task 1: Tokenize theme-dependent colors + pre-paint theme hydration

Pure refactor + plumbing: after this task the dark page renders pixel-identical, but every theme-dependent color lives in a CSS custom property, and a `data-theme="light"` attribute (settable only via devtools/localStorage for now) flips the whole palette.

**Files:**
- Modify: `index.html` (head, `:root` block, ~14 color declarations, `BRANCHES` config ~line 435, `branchStyle` ~line 580)

**Interfaces:**
- Produces: CSS tokens `--ink`, `--ink-muted`, `--node-text`, `--node-text-bright`, `--root-hover-glow`, `--m-root-ink`, `--tooltip-bg`, `--tooltip-ink`, `--shadow`, `--bg-glow-fade`, `--ai-skills-text`; the `html[data-theme="light"]` override block; pre-paint script reading `camp-codex-skill-tree:theme`. Task 2's toggle and Task 3's marquee (`--ink-muted` for logo ink) rely on these exact names.

- [ ] **Step 1: Add the pre-paint hydration script in `<head>`**

In `index.html`, immediately after the `<link rel="icon" …>` line (line 8) and before `<style>` (line 9), insert:

```html
<script>
/* pre-paint theme hydration — must run before the stylesheet applies so there is no flash */
try { if (localStorage.getItem("camp-codex-skill-tree:theme") === "light") document.documentElement.dataset.theme = "light"; } catch (e) { /* private mode etc. */ }
</script>
```

- [ ] **Step 2: Extend `:root` and add the light override block**

Replace the current `:root { … }` block (lines 15–36) with:

```css
:root {
  /* Surfaces */
  --bg: #0B0E14;
  --bg-glow: #131A26;
  --bg-glow-fade: rgba(19, 26, 38, 0);
  --surface: #F5F2EA;
  --surface-ink: #14161B;
  --tooltip-bg: #F5F2EA;
  --tooltip-ink: #14161B;
  --shadow: rgba(0, 0, 0, 0.45);

  /* Ink (theme-dependent text colors) */
  --ink: rgba(245, 242, 234, 0.92);
  --ink-muted: rgba(245, 242, 234, 0.55);
  --node-text: rgba(255, 255, 255, 0.5);
  --node-text-bright: rgba(255, 255, 255, 0.92);
  --root-hover-glow: rgba(255, 255, 255, 0.45);
  --m-root-ink: rgba(255, 255, 255, 0.72);

  /* Branch colors — match the approved Mermaid topology */
  --creativity: #FF3333;
  --ai-skills: #FFCC00;
  --ai-skills-text: #FFCC00;
  --web-design: #33CCFF;
  --root: #FFFFFF;

  /* Node states */
  --locked-stroke: #3A4150;
  --locked-fill: #171B23;
  --unlocked-glow: 0 0 14px;

  /* Type */
  --font-display: "Chakra Petch", "Rajdhani", sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
}

/* Light theme — dark stays the default; this only applies when the toggle set the attribute */
html[data-theme="light"] {
  --bg: #F5F2EA;
  --bg-glow: #EAE5D8;
  --bg-glow-fade: rgba(234, 229, 216, 0);
  --tooltip-bg: #14161B;
  --tooltip-ink: #F5F2EA;
  --shadow: rgba(0, 0, 0, 0.18);

  --ink: rgba(20, 22, 27, 0.92);
  --ink-muted: rgba(20, 22, 27, 0.6);
  --node-text: rgba(20, 22, 27, 0.5);
  --node-text-bright: rgba(20, 22, 27, 0.92);
  --root-hover-glow: rgba(20, 22, 27, 0.3);
  --m-root-ink: rgba(20, 22, 27, 0.75);

  --ai-skills-text: #A88A00;
  --root: #14161B;

  --locked-stroke: #C6C0B0;
  --locked-fill: #EDE9DE;
}
```

Note `--surface`/`--surface-ink` keep their dark-theme values in both themes: `--surface-ink` still colors the text inside unlocked (brightly filled) nodes, which needs dark ink on both themes. The tooltip moves to its own tokens.

- [ ] **Step 3: Point the hardcoded colors at the tokens**

Apply exactly these replacements (line numbers are pre-edit):

| Line | Rule | Old value | New value |
|---|---|---|---|
| 68 | `.site-header .subtitle` color | `rgba(245, 242, 234, 0.55)` | `var(--ink-muted)` |
| 86 | `.total-counter .lbl` color | `rgba(245, 242, 234, 0.55)` | `var(--ink-muted)` |
| 100 | `.tree-wrap::before` gradient end | `rgba(19, 26, 38, 0)` | `var(--bg-glow-fade)` |
| 146 | `.node text` fill | `rgba(255, 255, 255, 0.5)` | `var(--node-text)` |
| 152 | `.node.available text` fill | `rgba(255, 255, 255, 0.92)` | `var(--node-text-bright)` |
| 164 | `.node.root-node text` fill | `rgba(255, 255, 255, 0.92)` | `var(--node-text-bright)` |
| 165 | `.node.root-node.hovered circle` drop-shadow color | `rgba(255, 255, 255, 0.45)` | `var(--root-hover-glow)` |
| 187 | `.branch-label` fill | `rgba(245, 242, 234, 0.92)` | `var(--ink)` |
| 195 | `.branch-count` fill | `var(--node-color)` | `var(--node-text-color, var(--node-color))` |
| 228 | `.tooltip` background | `var(--surface)` | `var(--tooltip-bg)` |
| 229 | `.tooltip` color | `var(--surface-ink)` | `var(--tooltip-ink)` |
| 232 | `.tooltip` box-shadow color | `rgba(0, 0, 0, 0.45)` | `var(--shadow)` |
| 290 | `.mobile-branch h2` color | `var(--node-color)` | `var(--node-text-color, var(--node-color))` |
| 296 | `.mobile-branch .m-count` color | `var(--node-color)` | `var(--node-text-color, var(--node-color))` |
| 337 | `.m-node .m-name` color | `rgba(255, 255, 255, 0.5)` | `var(--node-text)` |
| 341 | `.m-node.available .m-name` color | `rgba(255, 255, 255, 0.92)` | `var(--node-text-bright)` |
| 359 | `.m-root-desc` color | `rgba(255, 255, 255, 0.72)` | `var(--m-root-ink)` |

Leave every other color alone — in particular `.node.unlocked text { fill: var(--surface-ink); }` and the branch glow rgba values in the JS `BRANCHES` config (glows work on both themes).

- [ ] **Step 4: Wire `--node-text-color` per branch in the JS**

In the `BRANCHES` config (~line 435), add a `textColor` per branch:

```js
const BRANCHES = {
  "creativity":     { label: "Creativity",       cssColor: "var(--creativity)", textColor: "var(--creativity)",     glow: "rgba(255, 51, 51, 0.6)" },
  "ai-skills":      { label: "AI Skills",        cssColor: "var(--ai-skills)",  textColor: "var(--ai-skills-text)", glow: "rgba(255, 204, 0, 0.6)" },
  "web-app-design": { label: "Web & App Design", cssColor: "var(--web-design)", textColor: "var(--web-design)",     glow: "rgba(51, 204, 255, 0.6)" }
};
```

In `branchStyle` (~line 580), emit the extra property. Old:

```js
  return `--node-color:${b.cssColor};--node-glow:${b.glow};--edge-color:${b.cssColor};`;
```

New:

```js
  return `--node-color:${b.cssColor};--node-text-color:${b.textColor};--node-glow:${b.glow};--edge-color:${b.cssColor};`;
```

The mobile stack sets colors via the same `branchStyle` string on each `.mobile-branch` section, so no other JS change is needed. (Verify with a grep: `branchStyle` should be the only place inline `--node-color` styles are assembled, plus the one `setProperty("--node-color", …)` call for hit-layer buttons at ~line 679 — buttons only use it for focus outlines, which should keep the node color, so leave that call untouched.)

- [ ] **Step 5: Run the full suite — must be green (pure refactor)**

Run: `npm run verify`
Expected: `"pass": true`, zero console errors.

Also spot-check dark renders identically and light plumbing works:

```bash
node -e "
import('playwright').then(async ({ chromium }) => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(require('url').pathToFileURL('index.html').href);
  const dark = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await p.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  const light = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log({ dark, light });
  await b.close();
});
"
```

Expected: `{ dark: 'rgb(11, 14, 20)', light: 'rgb(245, 242, 234)' }`

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "refactor: tokenize theme-dependent colors, add light palette + pre-paint hydration"
```

---

### Task 2: Theme toggle button

**Files:**
- Modify: `index.html` (header markup ~line 383, CSS after the `.total-counter` rules ~line 87, JS boot section ~line 903)
- Test: `scripts/verify.mjs` (new section 7b)

**Interfaces:**
- Consumes: Task 1's tokens and pre-paint script.
- Produces: `#theme-toggle` button; `html[data-theme="light"]` set/cleared on click; localStorage key `camp-codex-skill-tree:theme`; `initThemeToggle()` called at boot. Verify section 7b and Task 4's crops rely on `#theme-toggle`.

- [ ] **Step 1: Write the failing verification (section 7b)**

In `scripts/verify.mjs`, insert after section 7 (keyboard access, ends line ~173) and **before** section 8 (desktop screenshot):

```js
/* ---------- 7b. theme toggle: dark default, light opt-in, persisted ---------- */
const THEME_KEY = 'camp-codex-skill-tree:theme';
const bodyBg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const themeAttr = () => page.evaluate(() => document.documentElement.dataset.theme || null);
check('dark by default', (await themeAttr()) === null && (await bodyBg()) === 'rgb(11, 14, 20)');
check('toggle starts unpressed', (await page.getAttribute('#theme-toggle', 'aria-pressed')) === 'false');
await page.click('#theme-toggle');
await page.waitForTimeout(100);
check('toggle -> light', (await themeAttr()) === 'light' && (await bodyBg()) === 'rgb(245, 242, 234)');
check('toggle aria-pressed true', (await page.getAttribute('#theme-toggle', 'aria-pressed')) === 'true');
check('theme stored', (await page.evaluate(k => localStorage.getItem(k), THEME_KEY)) === 'light');
await page.screenshot({ path: join(outDir, 'light.png'), fullPage: true });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(300);
check('light persists across reload', (await themeAttr()) === 'light');
check('unlock state independent of theme', (await totalCount()) === '3');
await page.click('#theme-toggle');
await page.waitForTimeout(100);
check('toggle back to dark', (await themeAttr()) === null && (await bodyBg()) === 'rgb(11, 14, 20)');
check('theme key cleared on dark', (await page.evaluate(k => localStorage.getItem(k), THEME_KEY)) === null);
```

(The suite unlocked `llm-fundamentals`, `skill-building`, and `curiosity` by this point, hence `'3'`. Section 7b must end back on dark so the section-8 desktop screenshot stays canonical.)

- [ ] **Step 2: Run to verify it fails**

Run: `npm run verify`
Expected: FAIL — failures list contains `toggle starts unpressed` etc. (no `#theme-toggle` yet); Playwright will error on `page.click('#theme-toggle')` — that click timing out / throwing is the expected red state.

- [ ] **Step 3: Implement the toggle**

**Markup** — replace the header's counter div (lines 383–386) with a wrapper holding counter + button:

```html
  <div class="header-tools">
    <div class="total-counter">
      <span class="num"><span id="total-count">0</span> / 21</span>
      <span class="lbl">Modules unlocked</span>
    </div>
    <button id="theme-toggle" class="theme-toggle" type="button" aria-pressed="false" aria-label="Switch to light mode">
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    </button>
  </div>
```

**CSS** — after the `.total-counter .lbl` rule (~line 87):

```css
.header-tools { display: flex; align-items: flex-end; gap: 14px; }
.theme-toggle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--locked-stroke);
  background: transparent;
  color: var(--ink-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.theme-toggle:hover { color: var(--root); border-color: var(--root); }
.theme-toggle:focus-visible { outline: 2px solid var(--root); outline-offset: 2px; }
.theme-toggle svg { width: 18px; height: 18px; }
.theme-toggle .icon-sun { display: none; }
html[data-theme="light"] .theme-toggle .icon-moon { display: none; }
html[data-theme="light"] .theme-toggle .icon-sun { display: block; }
```

**JS** — add above the boot section (`/* ================= boot ================= */`, ~line 903):

```js
/* ================= theme toggle ================= */
const THEME_KEY = "camp-codex-skill-tree:theme";
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  const sync = () => {
    const light = document.documentElement.dataset.theme === "light";
    btn.setAttribute("aria-pressed", String(light));
    btn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
  };
  btn.addEventListener("click", () => {
    if (document.documentElement.dataset.theme === "light") {
      delete document.documentElement.dataset.theme;
      try { localStorage.removeItem(THEME_KEY); } catch (e) { /* ignore */ }
    } else {
      document.documentElement.dataset.theme = "light";
      try { localStorage.setItem(THEME_KEY, "light"); } catch (e) { /* ignore */ }
    }
    sync();
  });
  sync();
}
```

Inside the boot section, add `initThemeToggle();` alongside the existing init calls (after the tree/mobile builds).

- [ ] **Step 4: Run to verify it passes**

Run: `npm run verify`
Expected: `"pass": true`, zero console errors, `verify-out/light.png` written. Open `verify-out/light.png` and eyeball: cream background, legible labels, dark-yellow AI-Skills counter text, inverted (dark) tooltip is N/A here but nothing should look broken. Tune the light hexes in the `html[data-theme="light"]` block if something is illegible; the tokens' structure must not change.

- [ ] **Step 5: Commit**

```bash
git add index.html scripts/verify.mjs
git commit -m "feat: light/dark theme toggle, dark default, persisted per visitor"
```

---

### Task 3: Tools marquee footer

**Files:**
- Modify: `index.html` (markup after the tooltip div ~line 403, CSS before the reduced-motion block ~line 364, JS: `TOOL_LOGOS` const near `SKILL_TREE_DATA` ~line 406, `buildMarquee()` + boot call)
- Test: `scripts/verify.mjs` (new section 7c + one line each in the mobile and reduced-motion sections)

**Interfaces:**
- Consumes: `--ink-muted`, `--locked-stroke` tokens (Task 1).
- Produces: `<footer class="tools-marquee">` with `.marquee-label`, `.marquee-viewport`, `#marquee-track`, two `.marquee-group`s of ten `.tool-logo` spans; `window.TOOL_LOGOS`; keyframe named `marquee-scroll`. Verify 7c and Task 4's crops rely on these names.

- [ ] **Step 1: Write the failing verification (section 7c + two smoke lines)**

In `scripts/verify.mjs`, insert after section 7b:

```js
/* ---------- 7c. tools marquee ---------- */
const canonicalLogos = JSON.parse(readFileSync(join(here, '..', 'src', 'data', 'toolLogos.json'), 'utf8'));
const logoData = await page.evaluate(() => window.TOOL_LOGOS);
check('marquee data matches src/data/toolLogos.json', stable(logoData) === stable(canonicalLogos));
const mq = await page.evaluate(() => {
  const track = document.querySelector('.tools-marquee #marquee-track');
  const groups = [...document.querySelectorAll('.marquee-group')];
  const cs = track && getComputedStyle(track);
  return track && {
    groups: groups.length,
    perGroup: groups.map(g => g.querySelectorAll('.tool-logo').length),
    labels: [...groups[0].querySelectorAll('.tool-logo')].map(s => s.getAttribute('aria-label')),
    secondHidden: groups[1] && groups[1].getAttribute('aria-hidden') === 'true',
    animation: cs.animationName,
    playState: cs.animationPlayState,
    label: document.querySelector('.marquee-label').textContent.trim(),
  };
});
check('marquee: 2 groups of 10 logos', !!mq && mq.groups === 2 && mq.perGroup[0] === 10 && mq.perGroup[1] === 10);
check('marquee: all 10 tools in order', !!mq && stable(mq.labels) === stable(['OpenAI', 'Anthropic', 'Gemini', 'Notion', 'Supabase', 'Mermaid', 'Google Stitch', 'VS Code', 'GitHub', 'YouTube']));
check('marquee: duplicate group aria-hidden', !!mq && mq.secondHidden === true);
check('marquee: animation running', !!mq && mq.animation === 'marquee-scroll' && mq.playState === 'running');
check('marquee: label text', !!mq && mq.label === 'Built with');
```

In the mobile section's `m.evaluate` object (~line 187), add one key:

```js
  marqueeVisible: !!document.querySelector('.tools-marquee') && getComputedStyle(document.querySelector('.tools-marquee')).display !== 'none',
```

and after the existing mobile checks add:

```js
check('mobile: marquee present', mob.marqueeVisible);
```

In the reduced-motion section (before `await rmCtx.close();`), add:

```js
const rmMarquee = await rm.evaluate(() => getComputedStyle(document.getElementById('marquee-track')).animationName);
check('reduced-motion: marquee static', rmMarquee === 'none');
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run verify`
Expected: FAIL — `marquee data matches src/data/toolLogos.json`, `marquee: 2 groups of 10 logos`, `mobile: marquee present` in the failures list (and the reduced-motion evaluate will throw on the missing element — acceptable red state).

- [ ] **Step 3: Implement the marquee**

**Markup** — after the tooltip `</div>` (line 403), before `<script>`:

```html
<footer class="tools-marquee">
  <div class="marquee-label">Built with</div>
  <div class="marquee-viewport">
    <div class="marquee-track" id="marquee-track"></div>
  </div>
</footer>
```

**Data** — immediately after the `SKILL_TREE_DATA` constant in the `<script>`, add the inline mirror. Copy the array **verbatim** from `src/data/toolLogos.json` (all ten objects with their `id`, `name`, `viewBox`, `path`, optional `fillRule`, `source` fields — the verify data-sync check compares deep equality, so any drift fails):

```js
/* ================= tool logos (mirrors src/data/toolLogos.json verbatim) ================= */
const TOOL_LOGOS = /* paste the exact JSON array from src/data/toolLogos.json */;
window.TOOL_LOGOS = TOOL_LOGOS;
```

**CSS** — before the reduced-motion block (~line 364):

```css
/* ---------- tools marquee footer ---------- */
.tools-marquee {
  border-top: 1px solid var(--locked-stroke);
  margin-top: 8px;
  padding: 22px 0 28px;
}
.marquee-label {
  text-align: center;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 16px;
}
.marquee-viewport {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}
.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee-scroll 35s linear infinite;
}
.tools-marquee:hover .marquee-track { animation-play-state: paused; }
.marquee-group {
  display: flex;
  align-items: center;
  gap: 56px;
  padding-right: 56px;
}
.tool-logo { display: block; color: var(--ink-muted); }
.tool-logo svg { display: block; height: 26px; width: auto; }
/* the Stitch pill is much wider than tall; full cap height reads oversized next to square marks */
.tool-logo[data-id="stitch"] svg { height: 18px; }
@keyframes marquee-scroll { to { transform: translateX(-50%); } }
```

Inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
  .marquee-track { animation: none; }
```

**JS** — next to the other build functions:

```js
/* ================= tools marquee ================= */
function buildMarquee() {
  const track = document.getElementById("marquee-track");
  for (let copy = 0; copy < 2; copy++) {
    const group = document.createElement("div");
    group.className = "marquee-group";
    if (copy === 1) group.setAttribute("aria-hidden", "true");
    for (const logo of TOOL_LOGOS) {
      const item = document.createElement("span");
      item.className = "tool-logo";
      item.dataset.id = logo.id;
      item.setAttribute("role", "img");
      item.setAttribute("aria-label", logo.name);
      item.title = logo.name;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", logo.viewBox);
      svg.setAttribute("focusable", "false");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", logo.path);
      path.setAttribute("fill", "currentColor");
      if (logo.fillRule) path.setAttribute("fill-rule", logo.fillRule);
      svg.appendChild(path);
      item.appendChild(svg);
      group.appendChild(item);
    }
    track.appendChild(group);
  }
}
```

In the boot section, add `buildMarquee();` next to `initThemeToggle();`.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run verify`
Expected: `"pass": true`, zero console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html scripts/verify.mjs
git commit -m "feat: scrolling footer marquee of the ten tools used to build Camp Codex"
```

---

### Task 4: Visual crops, docs, deploy

**Files:**
- Modify: `scripts/visual-crops.mjs`, `README.md`, `docs/superpowers/handoff/2026-07-10-transition.md`

**Interfaces:**
- Consumes: `#theme-toggle` (Task 2), `.tools-marquee` (Task 3).

- [ ] **Step 1: Add marquee + light-mode crops**

In `scripts/visual-crops.mjs`, before `await browser.close();` (after the tooltip crop), add:

```js
// marquee footer + light mode + header toggle
await page.mouse.move(720, 5);
await page.locator('.tools-marquee').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const mqBox = await page.locator('.tools-marquee').boundingBox();
await page.screenshot({ path: join(out, 'crop-marquee-dark.png'), clip: mqBox });
await page.click('#theme-toggle');
await page.waitForTimeout(400);
await page.screenshot({ path: join(out, 'crop-marquee-light.png'), clip: mqBox });
await page.screenshot({ path: join(out, 'light-full.png'), fullPage: true });
const hdrBox = await page.locator('.site-header').boundingBox();
await page.screenshot({ path: join(out, 'crop-header-light.png'), clip: hdrBox });
await page.click('#theme-toggle'); // leave the page (and stored key) on dark
```

- [ ] **Step 2: Generate and review the crops**

Run: `node scripts/visual-crops.mjs`
Expected: `crops written to …/verify-out`.

Open and eyeball `crop-marquee-dark.png`, `crop-marquee-light.png`, `light-full.png`, `crop-header-light.png`:
- ten distinct authentic marks, uniform ink, no clipping, edge fades visible;
- Stitch pill roughly the same visual weight as its neighbors (adjust its 18px height if not);
- light mode fully legible — especially the AI-Skills yellow counter (`--ai-skills-text`) and locked nodes on cream.

Fix any visual misses by tuning CSS values (heights, gaps, light hexes), rerun crops, then rerun `npm run verify` — must stay green.

- [ ] **Step 3: Update docs**

- `README.md`: add the two features wherever the feature list / description lives (one or two lines: scrolling "Built with" logo footer; light/dark toggle, dark default, persisted).
- `docs/superpowers/handoff/2026-07-10-transition.md`: under "Current state", add one line noting the 2026-07-13 additions and pointers to `docs/superpowers/specs/2026-07-11-tools-marquee-theme-toggle-design.md` and this plan. Also append to §4 ("How to edit content"): tool logos live in `src/data/toolLogos.json` mirrored by the inline `TOOL_LOGOS` constant, same drift rule as `skillTree.json`.

- [ ] **Step 4: Final full verification**

Run: `npm run verify && node scripts/visual-crops.mjs`
Expected: `"pass": true`, zero console errors, crops written.

- [ ] **Step 5: Commit and deploy**

```bash
git add scripts/visual-crops.mjs README.md docs/superpowers/handoff/2026-07-10-transition.md
git commit -m "docs+chore: marquee/light-mode crops, README and handoff updates"
git push origin main
```

`git push origin main` auto-deploys both hosts (Vercel + GitHub Pages). After ~2 minutes, spot-check https://camp-codex-skill-tree.vercel.app — footer marquee scrolling, toggle flips and persists.
