const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  await ctx.addInitScript(() => { try { Object.defineProperty(document, 'ontouchend', { value: null, configurable: true }); } catch(e){} });
  const p = await ctx.newPage();
  // success screen -> Home button
  await p.goto('http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/success', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  await p.getByText('Home', { exact: true }).click();
  await p.waitForTimeout(800);
  const afterHome = p.url();
  // tab bar still works: superhome -> tap Stores
  await p.waitForTimeout(400);
  await p.getByLabel('Stores').click();
  await p.waitForTimeout(300);
  const storesActive = await p.getByLabel('Stores').getAttribute('aria-selected');
  console.log(JSON.stringify({ afterHomeClick: afterHome.split('/checkout')[1], storesTabSelected: storesActive }));
  await b.close();
})().catch(e=>{console.error(String(e));process.exit(1);});
