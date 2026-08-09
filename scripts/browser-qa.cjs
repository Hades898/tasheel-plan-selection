const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const viewports = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'short-mobile', width: 375, height: 667 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(base, { waitUntil: 'networkidle' });
    const state = await page.evaluate(async () => {
      const de = document.documentElement;
      const body = document.body;
      const overflow = Math.max(de.scrollWidth - window.innerWidth, body.scrollWidth - window.innerWidth);
      const next = document.querySelector('[aria-label="Next screen"]');
      const nextRect = next ? next.getBoundingClientRect() : null;
      const phoneImgs = Array.from(document.querySelectorAll('img')).map((img) => {
        const r = img.getBoundingClientRect();
        return { src: img.getAttribute('src'), x: r.x, y: r.y, width: r.width, height: r.height, visible: r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < window.innerHeight };
      });
      return {
        title: document.title,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: de.scrollWidth,
        scrollHeight: de.scrollHeight,
        overflow,
        bodyTextIncludesBNPL: body.innerText.includes('BNPL Figma-matched prototype'),
        nextHitTarget: nextRect ? { x: nextRect.x, y: nextRect.y, width: nextRect.width, height: nextRect.height, visible: nextRect.width > 40 && nextRect.height > 40 && nextRect.bottom > 0 && nextRect.top < window.innerHeight } : null,
        visibleImageCount: phoneImgs.filter((x) => x.visible).length,
        largestImage: phoneImgs.sort((a,b)=>b.width*b.height-a.width*a.height)[0] || null,
      };
    });
    // Click through first 3 states and then select final visible row if possible on desktop.
    const labels = [];
    for (let i = 0; i < 3; i++) {
      labels.push(await page.locator('text=/current source/').textContent().catch(() => ''));
      await page.getByLabel('Next screen').click({ timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(100);
    }
    results.push({ viewport, state, clickedSources: labels });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify({ base, results }, null, 2));
})().catch((err) => { console.error(err); process.exit(1); });
