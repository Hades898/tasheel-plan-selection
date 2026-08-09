const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto('https://hades898.github.io/tasheel-bnpl-prototype/checkout/onboarding/success', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const t0 = await p.evaluate(() => document.body.innerText);
  await p.waitForTimeout(9000);
  const t1 = await p.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({
    liveHasOpenAppCta: t0.includes('Open the Tasheel app'),
    liveCountdownGone: !/Redirecting to Extrastores/.test(t0),
    liveNoLockScreenAfter9s: !/Purchase confirmed|Tap to view your plan/.test(t1),
  }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
