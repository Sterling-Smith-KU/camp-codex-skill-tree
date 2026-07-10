// Verification pass for index.html — node/placeholder/edge counts, tooltip behavior,
// console errors, and a desktop + mobile screenshot. Run: npm install && npm run verify
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const here = dirname(fileURLToPath(import.meta.url));
const file = pathToFileURL(join(here, '..', 'index.html')).href;
const outDir = join(here, '..', 'verify-out');
mkdirSync(outDir, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(file, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const nodeCount = await page.locator('.orb.arm, .orb.root, .orb.capstone').count();
const placeholderCount = await page.locator('.orb.placeholder').count();
const trunkCount = await page.locator('.orb.trunk').count();
const edgeCount = await page.locator('#connectors path.edge').count();
const brandCount = await page.locator('#carousel .brand').count();
const spText = (await page.locator('.total-pill').innerText()).replace(/\s+/g, ' ').trim();
const totalSp = await page.evaluate(() =>
  TREE_DATA.filter(n => n.tier !== 'placeholder').reduce((s, n) => s + n.sp, 0));
const totalNodes = await page.evaluate(() =>
  TREE_DATA.filter(n => n.tier !== 'placeholder').length);

// hover one node per branch — confirm tooltip content matches TREE_DATA
const probeIds = ['fo-cap', 'ha-an6', 'ar-st5', 'cr-root'];
const tipResults = {};
for (const id of probeIds) {
  await page.locator(`.orb[data-id="${id}"]`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.locator(`.orb[data-id="${id}"]`).hover();
  await page.waitForTimeout(150);
  const shown = await page.locator('#tooltip.show').count();
  const name = await page.locator('#tooltip .tt-name').innerText();
  const sp = await page.locator('#tooltip .tt-sp').innerText();
  tipResults[id] = { shown: shown === 1, name, sp };
  await page.mouse.move(5, 5);
  await page.waitForTimeout(80);
}

await page.screenshot({ path: join(outDir, 'desktop.png'), fullPage: true });

const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(file, { waitUntil: 'networkidle' });
await m.waitForTimeout(300);
const bodyScrollW = await m.evaluate(() => document.documentElement.scrollWidth);
const winW = await m.evaluate(() => window.innerWidth);
await m.screenshot({ path: join(outDir, 'mobile.png'), fullPage: true });

const result = {
  nodeCount, expectedNodes: 49, nodesOk: nodeCount === 49 && totalNodes === 49,
  placeholderCount, expectedPlaceholders: 8, placeholdersOk: placeholderCount === 8,
  trunkCount, edgeCount, brandCount, spText, totalSp, spOk: totalSp === 57,
  tipResults,
  mobile: { bodyScrollW, winW, noHorizontalPageScroll: bodyScrollW <= winW + 1 },
  consoleErrors: errors,
};
console.log(JSON.stringify(result, null, 2));
console.log(`\nScreenshots written to ${outDir}/`);

await browser.close();
process.exit(errors.length || !result.nodesOk || !result.spOk ? 1 : 0);
