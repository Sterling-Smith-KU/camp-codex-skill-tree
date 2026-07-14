# Transition Doc — Camp Codex Skill Tree v2

**Written:** 2026-07-10, end of the v2 redesign + deploy session.
**For:** whoever (human or agent) picks this up next. Read this first; it supersedes
[`2026-07-10-next-session.md`](2026-07-10-next-session.md) (v1) and folds in
[`2026-07-10-v2-redesign.md`](2026-07-10-v2-redesign.md) (design decisions).

## 1. Current state

| What | Where |
|---|---|
| **Production (primary)** | https://camp-codex-skill-tree.vercel.app |
| GitHub Pages (mirror) | https://sterling-smith-ku.github.io/camp-codex-skill-tree/ |
| Repo | https://github.com/Sterling-Smith-KU/camp-codex-skill-tree (`main`) |
| Vercel project | `sterlingdemo/camp-codex-skill-tree` (account `sterling-smith-ku`) |

v2 is **shipped, verified, and live on both hosts**. It is the interactive 21-module skill
tree from the approved build spec
([`../specs/2026-07-10-skill-tree-v2-build-spec.md`](../specs/2026-07-10-skill-tree-v2-build-spec.md)):
three branches (Creativity `#FF3333` / AI Skills `#FFCC00` / Web & App Design `#33CCFF`) on
the spec's exact Mermaid topology, click-to-unlock with the sequential rule, cascade
re-lock, localStorage persistence, branch + total counters, verbatim tooltips, keyboard and
reduced-motion support, and a stacked mobile layout under 768px.

**2026-07-13**: Added a light/dark theme toggle (`#theme-toggle`, localStorage-persisted, dark default) and a scrolling "Built with" logo footer (`.tools-marquee`, ten monochrome tool marks). Spec: [`../specs/2026-07-11-tools-marquee-theme-toggle-design.md`](../specs/2026-07-11-tools-marquee-theme-toggle-design.md). Implementation plan: [`../plans/2026-07-13-tools-marquee-theme-toggle.md`](../plans/2026-07-13-tools-marquee-theme-toggle.md).

v1 (the 49-node read-only showcase) no longer exists on the page; it lives in git history
(`git show 0dea458:index.html`) with its own docs kept under `docs/superpowers/`.

## 2. Architecture in 30 seconds

- **One self-contained `index.html`** — inline base64 fonts (Chakra Petch + Inter), CSS
  tokens from spec §4, module data, topology, SVG tree, and all interaction JS. No
  frameworks, no build step, zero runtime network requests. Deployable to any static host.
- **`src/data/skillTree.json`** — the module data (id / branch / order / name /
  description). The same data is *inlined* in `index.html`; there is no build step
  connecting them, but `npm run verify` **fails if they drift**.
- Topology (parents, decorative connector nodes, edges) lives in the `NODES` / `EDGES`
  constants in `index.html` and must stay one-to-one with the spec's Mermaid diagram.

## 3. How to deploy

- **`git push origin main` deploys both hosts** (as of 2026-07-11): Vercel is connected
  to the GitHub repo and auto-deploys on push; GitHub Pages serves the repo root.
- Manual Vercel deploy (no push needed): `npx vercel deploy --prod --yes` from the repo
  root (CLI is authenticated on this machine as `sterling-smith-ku`). `.vercelignore`
  keeps node_modules/docs/scripts out of the upload.

## 4. How to edit content (most likely future task)

1. Edit `src/data/skillTree.json` **and** the identical `SKILL_TREE_DATA` block near the
   top of the `<script>` in `index.html`.
2. If modules are added/removed or re-parented, update `NODES` (position, diameter) and
   `EDGES` in `index.html`, keeping them faithful to an updated Mermaid diagram in the spec
   — the diagram is the authoritative topology, so change the spec first.
3. `npm run verify` — it checks data sync, counts, tooltips verbatim, the unlock rules,
   persistence, keyboard, mobile, and console errors. If you changed the topology, update
   `expectedEdges` and the count assertions in `scripts/verify.mjs` to match the new spec.
4. `node scripts/visual-crops.mjs` for high-res crops; eyeball labels fit inside circles
   (a runtime fit-pass shrinks overflowing labels, but check anyway).
5. Commit, push (Pages), and `npx vercel deploy --prod --yes` (Vercel).
6. **Tool logos** live in `src/data/toolLogos.json` and are mirrored by the inline
   `TOOL_LOGOS` constant near the top of the `<script>` in `index.html`. The same
   drift rule as `skillTree.json` applies: edit both, then run `npm run verify`.

## 5. Verification status at handoff

`npm run verify` — **all green, zero console errors** (2026-07-10). Covered: data sync,
21 modules / 35 edges / 11 decorative connectors / 1 root vs the Mermaid graph, all 21
tooltips verbatim + on-screen, blocked-click hint ("Unlock the previous module first."),
chain + parallel-arm unlocks, cascade re-lock, reload persistence, keyboard unlock,
reduced-motion, mobile stack + tap-to-unlock. Both live URLs spot-checked serving v2.

## 6. Deliberate decisions — don't relitigate casually

- **Single file, no runtime network** (portability + reliability; carried from v1).
- **Both hosts kept**: spec says Vercel, Pages was already live — both serve the identical
  static file, so keeping the mirror costs nothing.
- **Re-lock cascades** to dependents so the sequential invariant can't be violated.
- **"Available" modules** show a branch-color ring (locked-but-clickable affordance);
  fully locked stay gray per spec tokens.
- **Display names follow the Mermaid render** (spec §5 mapping): "Curiosity",
  "App Anatomy", "APIs", "Front-end vs. Back-end" — not the §3 long names.

## 7. Open items (only if asked)

1. ~~Connect Vercel ↔ GitHub~~ — **done 2026-07-11**; pushes to `main` auto-deploy both hosts.
2. ~~Supabase auth + shared persistence~~ — **dropped 2026-07-11**: the user decided this
   page needs no accounts. Don't re-propose it.
3. Custom domain on Vercel, if wanted.
4. Retiring the Pages mirror if double-hosting ever confuses anyone.
