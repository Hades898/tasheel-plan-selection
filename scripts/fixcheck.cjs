const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4175/tasheel-bnpl-prototype/checkout/onboarding/tenure', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);
  const sub = await p.evaluate(() => document.body.innerText);
  // step to a fee tenure and crop the fee row tight
  for (let i = 0; i < 3; i++) { await p.getByTestId('wc-plan-plus').click(); await p.waitForTimeout(350); }
  await p.waitForTimeout(600);
  const box = await p.getByTestId('wc-four-month-fee-help').boundingBox();
  await p.screenshot({ path: 'screenshots/fix-01-feerow.png', clip: { x: box.x - 150, y: box.y - 18, width: 300, height: 52 } });
  await p.screenshot({ path: 'screenshots/fix-02-plan.png' });
  // cart sheet
  await p.getByTestId('wc-cart-pill').click();
  await p.waitForTimeout(900);
  await p.screenshot({ path: 'screenshots/fix-03-cartsheet.png' });
  const sheet = await p.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({
    planSub: sub.includes('You can split your purchase up to 36 months'),
    cartSheet: { subtotal: sheet.includes('Subtotal') && sheet.includes('7,000.00'), discount: sheet.includes('Tasheel discount (10%)') && sheet.includes('700.00'), total: sheet.includes('6,300.00') },
  }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
