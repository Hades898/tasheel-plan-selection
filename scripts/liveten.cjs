const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, bypassCSP: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto('https://hades898.github.io/tasheel-bnpl-prototype/checkout/onboarding/tenure', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  await p.screenshot({ path: 'screenshots/liveten-01.png' });
  const t = await p.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({
    bnplLimitsGone: !t.includes('BNPL up to'),
    midBannerGone: !t.includes('Tasheel discount'),
    discountInPill: t.includes('10% off') && t.includes('6,300.00'),
    pendingGone: !/pending/i.test(t),
    sarTextGone: !t.includes('SAR '),
  }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
