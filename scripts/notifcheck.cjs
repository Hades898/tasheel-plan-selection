const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  const navs = [];
  p.on('framenavigated', f => { if (f === p.mainFrame()) navs.push(f.url()); });
  await p.goto('http://127.0.0.1:4175/tasheel-bnpl-prototype/checkout/notification', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  await p.getByTestId('wc-notification-banner').click();
  await p.waitForTimeout(1500);
  const after = await p.evaluate(() => document.body.innerText);
  await p.screenshot({ path: 'screenshots/notif-after-tap.png' });
  console.log(JSON.stringify({
    stayedOnLockScreen: after.includes('Purchase confirmed'),
    didNotEnterWebApp: !/My Dues|My Purchases|My Insights|Active Purchases/.test(after),
    schemeAttempted: navs.some(u => u.startsWith('tasheel:')),
    navs: navs.slice(-3),
  }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
