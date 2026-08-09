const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto('https://hades898.github.io/tasheel-bnpl-prototype/checkout/onboarding/tenure', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  const t = await p.evaluate(() => document.body.innerText);
  await p.getByTestId('wc-cart-pill').click(); await p.waitForTimeout(900);
  const s = await p.evaluate(() => document.body.innerText);
  await p.screenshot({ path: 'screenshots/live-cartsheet.png' });
  console.log(JSON.stringify({ planSub: t.includes('You can split your purchase up to 36 months'), sheetDiscount: s.includes('Tasheel discount (10%)') && s.includes('6,300.00') }));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
