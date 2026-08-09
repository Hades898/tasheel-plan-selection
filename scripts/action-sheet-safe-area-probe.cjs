#!/usr/bin/env node
const { chromium } = require('playwright');

const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout';
const viewports = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-12-13-14', width: 390, height: 844 },
  { name: 'figma-402', width: 402, height: 874 },
  { name: 'iphone-plus-max', width: 430, height: 932 },
];
const fixedRoutes = [
  { route: '/dues', root: '[data-testid="my-dues-1843-17915"]', bottom: '[data-testid="pay-selected-dues"]' },
  { route: '/payment-method', root: '[data-testid="payment-method-flow-816-47301"]', bottom: '[data-testid="payment-pay-cta"]', sheet: '[data-testid="payment-method-sheet"]' },
  { route: '/payment-method/add-card', root: '[data-testid="add-new-card-figma"]', bottom: '[data-testid="add-card-continue"]' },
  { route: '/otp', root: '[data-testid="otp-screen-814-24658"]', bottom: '[data-testid="ios-numeric-keyboard"]' },
  { route: '/processing', root: '[data-testid="processing-buffer-814-24673"]', bottom: '[data-testid="processing-animated-track"]' },
  { route: '/success', root: '[data-testid="payment-successful-814-24721"]', bottom: '[data-testid="success-home-button"]' },
];

function rectScript(sel) {
  return (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  };
}

(async () => {
  const failures = [];
  const results = [];
  const browser = await chromium.launch({ headless: true });

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    // Active payment sheet: outside tap should close to Dues.
    await page.goto(`${base}/payment-method?scrim=${Date.now()}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="payment-method-sheet"]', { timeout: 2000 });
    await page.click('[data-testid="payment-method-scrim"]', { position: { x: Math.min(200, viewport.width - 1), y: 90 } });
    await page.waitForTimeout(280);
    const paymentClosed = await page.evaluate(() => ({
      url: location.pathname,
      sheet: !!document.querySelector('[data-testid="payment-method-sheet"]'),
      dues: !!document.querySelector('[data-testid="my-dues-1843-17915"]'),
    }));
    if (paymentClosed.sheet || !paymentClosed.dues || !paymentClosed.url.includes('/checkout/dues')) {
      failures.push(`${viewport.name}: payment method sheet did not close on outside tap: ${JSON.stringify(paymentClosed)}`);
    }

    // Source guard for Dues sheet outside close. Current fixture has no hidden rows, so verify source/runtime selector if sheet exists.
    const duesSheetSourceOk = true; // App.tsx has a Pressable scrim with Close dues selector; source is checked by static probe below.

    for (const cfg of fixedRoutes) {
      await page.goto(`${base}${cfg.route}?safe=${Date.now()}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(80);
      if (cfg.route === '/otp') {
        for (const k of ['1', '2', '3', '4']) await page.click(`[data-testid="otp-key-${k}"]`);
      }
      const data = await page.evaluate(({ rootSel, bottomSel }) => {
        const rect = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        };
        const allRects = [...document.querySelectorAll('[data-testid]')].map(el => {
          const r = el.getBoundingClientRect();
          return { id: el.getAttribute('data-testid'), top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
        });
        return {
          url: location.pathname,
          bodyW: document.documentElement.scrollWidth,
          viewportW: innerWidth,
          bodyH: document.documentElement.scrollHeight,
          viewportH: innerHeight,
          overflowX: document.documentElement.scrollWidth > innerWidth + 1,
          root: rect(rootSel),
          bottom: rect(bottomSel),
          status: rect('[data-testid="status-strip"]') || null,
          allRects,
          consoleErrors: window.__qaConsoleErrors || [],
        };
      }, { rootSel: cfg.root, bottomSel: cfg.bottom });
      results.push({ viewport: viewport.name, route: cfg.route, root: data.root, bottom: data.bottom, overflowX: data.overflowX });
      if (data.overflowX) failures.push(`${viewport.name} ${cfg.route}: horizontal overflow body ${data.bodyW} > viewport ${data.viewportW}`);
      if (!data.root) failures.push(`${viewport.name} ${cfg.route}: missing root ${cfg.root}`);
      if (!data.bottom) failures.push(`${viewport.name} ${cfg.route}: missing bottom target ${cfg.bottom}`);
      if (data.root && data.root.top < -1) failures.push(`${viewport.name} ${cfg.route}: root starts above viewport/notch top ${data.root.top}`);
      if (data.bottom && data.bottom.bottom > viewport.height + 1) failures.push(`${viewport.name} ${cfg.route}: bottom target clipped ${cfg.bottom} bottom ${data.bottom.bottom} > viewport ${viewport.height}`);
      // OTP intentionally shows an iOS keyboard flush to the bottom; that is valid as long as it is not clipped.
      if (['/payment-method','/payment-method/add-card','/success'].includes(cfg.route) && data.bottom && data.bottom.bottom > viewport.height - 4) {
        failures.push(`${viewport.name} ${cfg.route}: fixed primary control too close/clipped near home indicator: bottom ${data.bottom.bottom}, viewport ${viewport.height}`);
      }
      if (cfg.route === '/otp') {
        const keyRects = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="otp-key-"]')].map(el => {
          const r = el.getBoundingClientRect();
          return { id: el.getAttribute('data-testid'), top: r.top, bottom: r.bottom, left: r.left, right: r.right, visible: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth };
        }));
        const hiddenKeys = keyRects.filter(k => !k.visible).map(k => k.id);
        if (hiddenKeys.length) failures.push(`${viewport.name} /otp: keyboard keys not visible: ${hiddenKeys.join(', ')}`);
      }
    }
    await page.close();
  }

  await browser.close();
  const staticSource = require('fs').readFileSync('App.tsx', 'utf8');
  if (!staticSource.includes('accessibilityLabel="Close dues selector"') || !staticSource.includes('setShowAllDues(false)} style={styles.duesSheetScrim}')) {
    failures.push('Dues action sheet does not have a tappable outside scrim close handler in source');
  }
  if (!staticSource.includes('testID="payment-method-scrim"') || !staticSource.includes('onPress={closeSheet}') || !staticSource.includes("Animated.timing(sheetMotion, { toValue: 0, duration: 190")) {
    failures.push('Payment method sheet does not have a tappable animated outside scrim close handler in source');
  }

  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures, results }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, checkedViewports: viewports.map(v => v.name), results }, null, 2));
})().catch(err => { console.error(err); process.exit(1); });
