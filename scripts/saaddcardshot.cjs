const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  await ctx.addInitScript(() => { try { Object.defineProperty(document, 'ontouchend', { value: null, configurable: true }); } catch(e){} });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/add-card-home', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const btnVisibleEmpty = await p.getByTestId('sa-add-card-submit').isVisible();
  const disabledEmpty = await p.getByTestId('sa-add-card-submit').getAttribute('aria-disabled');
  await p.screenshot({ path: 'screenshots/sa-addcard-empty.png' });
  // fill the fields
  await p.getByLabel('Card Number').fill('1111 2222 3333 4444');
  await p.getByLabel('Expiry Date').fill('0529');
  await p.getByLabel('CVV').fill('123');
  await p.waitForTimeout(400);
  const disabledFull = await p.getByTestId('sa-add-card-submit').getAttribute('aria-disabled');
  console.log(JSON.stringify({ btnVisibleEmpty, disabledEmpty, disabledFull }));
  await b.close();
})().catch(e=>{console.error(String(e));process.exit(1);});
