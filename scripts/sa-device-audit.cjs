const { chromium } = require('playwright');
(async () => {
  const base = 'http://127.0.0.1:4174/tasheel-bnpl-prototype';
  const browser = await chromium.launch();
  // Simulate a real iPhone (Safari visible area ~393x680) and force IS_IOS_DEVICE.
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 680 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
  await ctx.addInitScript(() => {
    // make `'ontouchend' in document` true so IS_IOS_DEVICE === true (real-device path)
    try { Object.defineProperty(document, 'ontouchend', { value: null, configurable: true }); } catch (e) {}
    try { Object.defineProperty(window, 'ontouchend', { value: null, configurable: true }); } catch (e) {}
  });
  const routes = [
    ['login', '/checkout/login'],
    ['otp', '/checkout/otp-login'],
    ['dues', '/checkout/dues'],
    ['paymethod', '/checkout/payment-method'],
    ['success', '/checkout/success'],
    ['home', '/checkout/superhome'],
  ];
  for (const [name, path] of routes) {
    const p = await ctx.newPage();
    await p.goto(base + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1300);
    await p.screenshot({ path: `screenshots/dev-${name}.png` });
    await p.close();
  }
  console.log('done');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
