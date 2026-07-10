# Next-Session Handoff — Camp Codex Builder Skill Tree

**Written:** 2026-07-10, at the close of the build session that shipped v1.
**For:** whoever (human or agent) picks this project up next.

## 1. Current state — read this first

**Live:** https://sterling-smith-ku.github.io/camp-codex-skill-tree/
**Repo:** https://github.com/Sterling-Smith-KU/camp-codex-skill-tree (public, `main` branch, GitHub Pages serving from root)

v1 is **shipped and verified**. It is not a draft — it's a complete, working showcase:

- All **49 nodes / 57 SP** from `camp-codex-skill-tree.md` are rendered (4 branches × root→arms→capstone).
- **8 blank placeholder bubbles** (2 per branch, above each capstone) — these are the intentionally-unfilled ~55% of future content the user mentioned when commissioning this project. Nothing is broken; they're deliberate.
- Interactive hover/tap tooltips, dark game-tree visual style, "Built with" company carousel, responsive layout — all working, all verified.
- `git status` is clean, everything is pushed, `main` is the default branch.

**If your task is "add more nodes" or "fill in the placeholders," skip to §3 — that's most of what's left.**

## 2. How this project was built (context for continuity)

Built via the Superpowers workflow: **brainstorming → writing-plans → huashu-design (implementation) → verify → deploy**, all in one session on 2026-07-03, with this handoff written a week later on 2026-07-10 (no changes happened in between — the repo was untouched).

- Spec: [`docs/superpowers/specs/2026-07-03-camp-codex-skill-tree-design.md`](../specs/2026-07-03-camp-codex-skill-tree-design.md)
- Plan: [`docs/superpowers/plans/2026-07-03-camp-codex-skill-tree.md`](../plans/2026-07-03-camp-codex-skill-tree.md) (7 tasks, all completed)
- Source content: [`camp-codex-skill-tree.md`](../../../camp-codex-skill-tree.md) — the **verbatim source of truth** for every node label/SP/tooltip. If the md changes, `index.html`'s `TREE_DATA` should be re-synced by hand (no build step connects them).

**Key decisions made — don't relitigate these without a reason:**
- **Single self-contained `index.html`.** No frameworks, no CDN, no build step for the site itself. This was deliberate (see spec §1, "self-contained showcase"). Verification tooling (Playwright) is a *devDependency* only — it never ships to the page.
- **Read-only showcase.** No add/edit/drag UI. If a future ask is "let visitors add nodes," that's a different project shape (needs a backend or at least localStorage-based state) — treat it as a new brainstorming pass, not a quick patch.
- **Dark canvas**, not the light-green reference screenshot the user originally showed. User approved this explicitly in the spec review.
- **Branch colors are fixed** to the md's own key: Foundation `#EAB308` · Harness `#22C55E` · Architecture `#EF4444` · Craft `#3B82F6`. Root trunk uses a neutral gold (`--trunk: #F1E9CF`), not a branch color.

## 3. What's actually left (the real next steps)

### 3.1 Fill in the blank placeholder nodes (the main open item)
Each branch has 2 dashed, unlabeled placeholder bubbles above its capstone — ids `foundation-ph1`/`ph2`, `harness-ph1`/`ph2`, `architecture-ph1`/`ph2`, `craft-ph1`/`ph2`. These represent content not yet written (per the user's original "45% of content" note).

**To fill one in:** open `index.html`, find the placeholder-generation loop near the bottom of `TREE_DATA` (search for `-ph1`), and replace the relevant placeholder object with a real node:

```js
// Before (auto-generated placeholder):
{ id:'foundation-ph1', branch:'foundation', tier:'placeholder' }

// After (real node — same shape as every other node in TREE_DATA):
{ id:'foundation-ph1', branch:'foundation', tier:'arm', arm:'doctrine',
  label:'NEW NODE LABEL', sp:1, tooltip:"Lets you ..." }
```
Layout and SVG connectors are computed from this array (`computeLayout()` in the `<script>` block) — no manual positioning needed. If you promote *both* placeholders in a branch, that branch's blank row disappears entirely, which is fine.

**After editing, update three places that hardcode the totals** (these don't auto-derive from `TREE_DATA` in the UI, only in the verify script):
- `#sp-counter` markup in `index.html` (`"57 SP · 49 NODES"` + the four per-branch chip numbers)
- `BRANCHES[branch].spTotal` for the affected branch
- Re-run `npm run verify` — it *does* compute totals from data and will fail loudly (`spOk`/`nodesOk: false`) if the header text drifts from reality.

### 3.2 Re-run verification after any content or visual change
The Playwright script used during the build session lived in an ephemeral scratchpad and is gone — **it's now properly committed** to the repo as `scripts/verify.mjs` (this was added specifically so this handoff doc could point somewhere real). Usage:

```bash
npm install        # first time only, installs Playwright as a devDependency
npm run verify      # checks node/placeholder/SP counts, tooltip content, console errors,
                     # mobile horizontal-scroll, and writes verify-out/desktop.png + mobile.png
```
Exit code is non-zero if counts don't match expectations or console errors were seen — safe to wire into a pre-push habit.

### 3.3 Open cosmetic option (not started, purely optional)
At the end of the last session I offered and the user did not respond to: swapping the wordmark-chip carousel entries for real inline-SVG brand logos, and/or adding a subtle load-in animation for the branches. Neither is required — the current wordmark-chip carousel (colored dot + name) is a legitimate, intentional choice already (avoids the "fake logo" trap), not a placeholder needing fixing. Only pursue if the user asks.

## 4. File map

```
index.html                                   the entire app (data + layout + styles + interaction)
README.md                                    live URL, local-run instructions, "adding nodes" note
camp-codex-skill-tree.md                     source content — verbatim truth for node text
package.json / .gitignore                    verification tooling only (Playwright devDependency)
scripts/verify.mjs                           automated check: counts, tooltips, screenshots
docs/superpowers/specs/2026-07-03-*.md       original design spec (approved)
docs/superpowers/plans/2026-07-03-*.md       original implementation plan (all 7 tasks done)
docs/superpowers/handoff/2026-07-10-*.md     this file
```

## 5. If you're an agent picking this up cold

Read, in order: this file → the spec → the plan → `index.html`'s `TREE_DATA`/`BRANCHES` block. Don't re-run brainstorming for "add more nodes" work — that's a data-entry task inside an already-approved design (§3.1 above). Do use brainstorming again if the ask changes the *shape* of the project (editable/interactive tree, backend, new content categories beyond the four branches, etc.) rather than filling its existing mold.
