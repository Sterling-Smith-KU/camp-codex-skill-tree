// High-res crops of the tree for visual review against the approved Mermaid render.
// Run from the repo root: node scripts/visual-crops.mjs  → writes verify-out/crop-*.png
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const here = dirname(fileURLToPath(import.meta.url));
const file = pathToFileURL(join(here, '..', 'index.html')).href;
const out = join(here, '..', 'verify-out');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 2 });
await page.goto(file, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// light up a full red chain + partial yellow/blue for state review
for (const id of ['curiosity', 'burning-questions', 'own-the-build', 'start-small', 'relentless-iteration',
                  'llm-fundamentals', 'coding-agents', 'app-anatomy']) {
  await page.click(`#hit-layer button[data-id="${id}"]`);
  await page.waitForTimeout(60);
}
await page.mouse.move(720, 5);
await page.waitForTimeout(400);

const box = await page.locator('.tree-canvas').boundingBox();
const sx = box.width / 1160, sy = box.height / 1330;
const clip = (x, y, w, h) => ({ x: box.x + x * sx, y: box.y + y * sy, width: w * sx, height: h * sy });

await page.screenshot({ path: join(out, 'crop-red.png'), clip: clip(0, 20, 420, 1130) });
await page.screenshot({ path: join(out, 'crop-yellow.png'), clip: clip(370, 120, 420, 1210) });
await page.screenshot({ path: join(out, 'crop-blue.png'), clip: clip(760, 20, 400, 1130) });
await page.screenshot({ path: join(out, 'crop-base.png'), clip: clip(60, 980, 1040, 350) });

// tooltip open for review
await page.hover('#hit-layer button[data-id="context-engineering"]');
await page.waitForTimeout(250);
await page.screenshot({ path: join(out, 'crop-tooltip.png'), clip: clip(300, 560, 620, 320) });

await browser.close();
console.log('crops written to ' + out);
