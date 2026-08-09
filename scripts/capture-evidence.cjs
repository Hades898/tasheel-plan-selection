const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.OUT_DIR || 'screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function waitForVisibleImage(page) {
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.some((img) => {
      const r = img.getBoundingClientRect();
      return img.complete && img.naturalWidth > 0 && r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < window.innerHeight;
    });
  }, { timeout: 10000 });
}

async function advance(page, count) {
  for (let i = 0; i < count; i++) {
    await page.getByLabel('Next screen').click({ timeout: 5000 }).catch(() => null);
    await waitForVisibleImage(page).catch(() => page.waitForTimeout(350));
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const captures = [
    { name: 'local-desktop-first', viewport: { width: 1440, height: 1100 }, steps: 0 },
    { name: 'local-desktop-mid', viewport: { width: 1440, height: 1100 }, steps: 8 },
    { name: 'local-desktop-final', viewport: { width: 1440, height: 1100 }, steps: 17 },
    { name: 'local-mobile-first', viewport: { width: 390, height: 844 }, steps: 0 },
    { name: 'local-mobile-mid', viewport: { width: 390, height: 844 }, steps: 8 },
    { name: 'local-mobile-final', viewport: { width: 390, height: 844 }, steps: 17 },
    { name: 'local-short-first', viewport: { width: 375, height: 667 }, steps: 0 },
    { name: 'local-short-final', viewport: { width: 375, height: 667 }, steps: 17 },
  ];
  const manifest = [];
  for (const cap of captures) {
    const page = await browser.newPage({ viewport: cap.viewport });
    await page.goto(base, { waitUntil: 'networkidle' });
    await waitForVisibleImage(page).catch(() => page.waitForTimeout(500));
    await advance(page, cap.steps);
    await waitForVisibleImage(page).catch(() => page.waitForTimeout(500));
    const file = path.join(outDir, `${cap.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const stateText = await page.locator('text=/current source/').textContent().catch(() => 'end/no-current-source');
    manifest.push({ ...cap, file, stateText, bytes: fs.statSync(file).size });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify({ base, captures: manifest }, null, 2));
})().catch((err) => { console.error(err); process.exit(1); });
