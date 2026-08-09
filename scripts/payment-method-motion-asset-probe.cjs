#!/usr/bin/env node
const { chromium } = require('playwright');

const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout';

(async () => {
  const failures = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

  await page.goto(`${base}/payment-method?motion=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="payment-method-sheet"]', { timeout: 2500 });
  const early = await page.evaluate(() => {
    const sheet = document.querySelector('[data-testid="payment-method-sheet"]')?.getBoundingClientRect();
    const text = document.body.innerText;
    const apple = document.querySelector('[data-testid="payment-row-apple"] img');
    const appleRect = apple?.getBoundingClientRect();
    const appleSrc = apple?.getAttribute('src') || '';
    return {
      sheetTop: sheet?.top ?? null,
      text,
      hasHeaderCloseButton: !!document.querySelector('[aria-label="Close"]'),
      hasHeaderBackButton: !!document.querySelector('[aria-label="Back"]'),
      appleSrc,
      appleRect: appleRect ? { width: appleRect.width, height: appleRect.height, top: appleRect.top, left: appleRect.left } : null,
    };
  });
  await page.waitForTimeout(170);
  const mid = await page.evaluate(() => document.querySelector('[data-testid="payment-method-sheet"]')?.getBoundingClientRect().top ?? null);
  await page.waitForTimeout(220);
  const settled = await page.evaluate(() => document.querySelector('[data-testid="payment-method-sheet"]')?.getBoundingClientRect().top ?? null);

  const appleSettled = await page.evaluate(() => {
    const apple = document.querySelector('[data-testid="payment-row-apple"] img');
    const r = apple?.getBoundingClientRect();
    return {
      src: apple?.getAttribute('src') || '',
      complete: apple ? apple.complete : false,
      natural: apple ? { w: apple.naturalWidth, h: apple.naturalHeight } : null,
      rect: r ? { width: r.width, height: r.height } : null,
    };
  });

  if (early.hasHeaderCloseButton || early.hasHeaderBackButton) failures.push(`payment backdrop still exposes header back/close controls: ${JSON.stringify({ back: early.hasHeaderBackButton, close: early.hasHeaderCloseButton })}`);
  if (!early.appleSrc.includes('paymentApplePay.svg')) failures.push(`Apple Pay row is not using paymentApplePay.svg: ${early.appleSrc}`);
  if (!early.appleRect || early.appleRect.width < 30 || early.appleRect.height < 30) failures.push(`Apple Pay logo render box too small/cropped: ${JSON.stringify(early.appleRect)}`);
  if (!appleSettled.complete || (appleSettled.natural && appleSettled.natural.w === 0)) failures.push(`Apple Pay image did not load after settle: ${JSON.stringify(appleSettled)}`);
  if (typeof early.sheetTop === 'number' && typeof mid === 'number' && typeof settled === 'number') {
    if (!(early.sheetTop > mid && mid >= settled - 2)) failures.push(`payment sheet did not animate upward on entrance: ${JSON.stringify({ early: early.sheetTop, mid, settled })}`);
  } else {
    failures.push(`payment sheet motion rects missing: ${JSON.stringify({ early: early.sheetTop, mid, settled })}`);
  }

  await page.screenshot({ path: 'screenshots/figma-fidelity/payment-method-motion-backdrop-fixed.png', fullPage: false });

  await page.click('[data-testid="payment-method-scrim"]', { position: { x: 200, y: 90 } });
  await page.waitForTimeout(260);
  const closed = await page.evaluate(() => ({
    path: location.pathname,
    sheet: !!document.querySelector('[data-testid="payment-method-sheet"]'),
    dues: !!document.querySelector('[data-testid="my-dues-1843-17915"]'),
  }));
  if (closed.sheet || !closed.dues || !closed.path.includes('/checkout/dues')) failures.push(`scrim close did not animate/route back to dues: ${JSON.stringify(closed)}`);

  await browser.close();

  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures, early, mid, settled }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, checked: ['clean dimmed backdrop', 'sheet entrance motion', 'scrim close exit', 'Apple Pay asset'] }, null, 2));
})();
