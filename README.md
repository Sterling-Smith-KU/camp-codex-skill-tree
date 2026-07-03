# Camp Codex Builder — Skill Tree

An interactive, self-contained web page that renders the **Camp Codex builder skill tree**
(four sessions with Josh Wexler) as a video-game-style perk tree. Read-only showcase — hover
any orb to read what that ability "lets you do."

**Live site:** https://sterling-smith-ku.github.io/camp-codex-skill-tree/

## What's here

- **`index.html`** — the entire app. Inline CSS + vanilla JS + SVG connectors. No frameworks,
  no build step, no external/CDN requests.
- **`camp-codex-skill-tree.md`** — the source content (49 nodes, 57 SP) the page is built from.
- **`docs/superpowers/`** — the design spec and implementation plan.

## Structure

Four color-coded branches climb from a shared root (**Camp Codex Builder**):

| Branch | Session | SP |
|---|---|---|
| 🟡 Foundation | Mindset & frameworks | 13 |
| 🟢 The Harness | Agentic harnesses | 15 |
| 🔴 Architecture | How apps work | 14 |
| 🔵 The Craft | Design & optimization | 15 |

Each branch: a **root** node → two parallel **arms** → a **capstone**. The faint dashed bubbles
at the top of each branch are **placeholders** for content not yet written.

## Run locally

Open `index.html` in any browser — that's it. No server needed.

## Adding nodes later

All content lives in the `TREE_DATA` array (and `BRANCHES` metadata) inside `index.html`.
To fill a blank top bubble, replace a `placeholder` entry with a real node object
(`{ id, branch, tier:'arm', arm, label, sp, tooltip }`); the layout and connectors update
automatically. Keep the running totals (currently 49 nodes / 57 SP) in sync with the header.
