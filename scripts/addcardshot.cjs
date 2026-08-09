const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  await ctx.addInitScript(() => { try { Object.defineProperty(document, 'ontouchend', { value: null, configurable: true }); } catch(e){} });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/payment-method/add-card', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: 'screenshots/dev-addcard.png' });
  const has4250 = (await p.evaluate(() => document.body.innerText)).includes('4,250');
  console.log(JSON.stringify({ has4250 }));
  await b.close();
})().catch(e=>{console.error(String(e));process.exit(1);});
