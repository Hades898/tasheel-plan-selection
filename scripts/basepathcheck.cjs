const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  const failed = [];
  p.on('requestfailed', r => failed.push(r.url()));
  p.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  const base = 'http://127.0.0.1:4175/tasheel-bnpl-prototype';
  await p.goto(`${base}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'screenshots/rev-06-basepath-pdp.png' });
  await p.getByTestId('wc-add-to-cart').click();
  await p.waitForTimeout(900);
  await p.mouse.wheel(0, 800);
  await p.waitForTimeout(600);
  await p.screenshot({ path: 'screenshots/rev-07-basepath-cart.png' });
  // deep link still resolves
  await p.goto(`${base}/checkout/dues`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const duesText = await p.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({ failedRequests: failed, duesRouteOk: duesText.length > 40 }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
