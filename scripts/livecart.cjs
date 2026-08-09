const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  const bad = [];
  p.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await p.goto('https://hades898.github.io/tasheel-bnpl-prototype/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: 'screenshots/live-01-pdp.png' });
  await p.getByTestId('wc-add-to-cart').click();
  await p.waitForTimeout(1000);
  await p.mouse.wheel(0, 800);
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'screenshots/live-02-cart.png' });
  const t = await p.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({ badResponses: bad, tasheel10: t.includes('6,300.00'), tabby: t.includes('tabby'), tamara: t.includes('tamara') }));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
