const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.getByTestId('wc-add-to-cart').click();
  await p.waitForTimeout(700);
  await p.getByText('How does it work?').click();
  await p.waitForTimeout(500);
  const t = await p.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({ expanded: t.includes('Pick a plan from 2 to 36 months'), hideLink: t.includes('Hide details'), stillTasheelSelected: t.includes('Continue with Tasheel Finance') }));
  await p.screenshot({ path: 'screenshots/rev-05-how-expanded.png' });
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
