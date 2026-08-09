const { chromium } = require('playwright');
(async () => {
  const base = 'http://127.0.0.1:4174/tasheel-bnpl-prototype';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 680 },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
  await ctx.addInitScript(() => {
    try { Object.defineProperty(document, 'ontouchend', { value: null, configurable: true }); } catch (e) {}
  });
  for (const [name, path] of [['login', '/checkout/login'], ['otp', '/checkout/otp-login']]) {
    const p = await ctx.newPage();
    await p.goto(base + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1100);
    await p.screenshot({ path: `screenshots/kb-${name}-full.png` });
    // Simulate keyboard: shrink the visual viewport (height ~ above-keyboard area).
    await p.setViewportSize({ width: 393, height: 380 });
    await p.waitForTimeout(700);
    await p.screenshot({ path: `screenshots/kb-${name}-open.png` });
    await p.close();
  }
  console.log('done');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
