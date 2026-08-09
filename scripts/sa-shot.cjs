const { chromium } = require('playwright');
(async () => {
  const url = 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome';
  const browser = await chromium.launch();
  // Tall mobile viewport so the whole RNW ScrollView lays out in one frame.
  const m = await browser.newPage({ viewport: { width: 402, height: 3050 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' });
  await m.goto(url, { waitUntil: 'networkidle' });
  await m.waitForTimeout(1600);
  await m.screenshot({ path: 'screenshots/sa-mobile-all.png' });
  // Split into two readable halves
  await m.setViewportSize({ width: 402, height: 1525 });
  await m.evaluate(() => window.scrollTo(0, 0));
  await m.waitForTimeout(300);
  await m.screenshot({ path: 'screenshots/sa-half1.png' });
  await m.evaluate(() => { const s = document.scrollingElement; s.scrollTop = 1525; document.querySelectorAll('*').forEach(el=>{ if (el.scrollHeight>el.clientHeight+200) el.scrollTop = 1525; }); });
  await m.waitForTimeout(300);
  await m.screenshot({ path: 'screenshots/sa-half2.png' });
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
