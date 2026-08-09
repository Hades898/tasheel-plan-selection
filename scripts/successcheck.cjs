const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4175/tasheel-bnpl-prototype/checkout/onboarding/success', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);
  await p.screenshot({ path: 'screenshots/succ-01.png', fullPage: false });
  const t0 = await p.evaluate(() => document.body.innerText);
  // wait past the old 6s countdown to prove it no longer auto-advances
  await p.waitForTimeout(9000);
  const t1 = await p.evaluate(() => document.body.innerText);
  await p.screenshot({ path: 'screenshots/succ-02-after-9s.png' });
  console.log(JSON.stringify({
    hasOpenAppCta: t0.includes('Open the Tasheel app'),
    countdownGone: !/Redirecting to Extrastores/.test(t0),
    stillOnSuccessAfter9s: t1.includes('Purchase Successful'),
    noLockScreen: !/Tap to view your plan|Purchase confirmed/.test(t1),
  }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
