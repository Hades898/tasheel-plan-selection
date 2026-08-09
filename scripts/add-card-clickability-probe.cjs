#!/usr/bin/env node
const { chromium } = require('playwright');

const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout';

(async () => {
  const failures = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

  const readState = async () => page.evaluate(() => {
    const val = (sel) => document.querySelector(sel)?.value || '';
    const rect = (sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, top: r.top, bottom: r.bottom, width: r.width, height: r.height } : null; };
    const cta = document.querySelector('[data-testid="add-card-continue"]');
    return {
      text: document.body.innerText.replace(/\s+/g, ' '),
      url: location.pathname,
      card: val('[data-testid="add-card-input-cardNumber"]'),
      expiry: val('[data-testid="add-card-input-expiry"]'),
      cvv: val('[data-testid="add-card-input-cvv"]'),
      emptySheet: !!document.querySelector('[data-testid="add-card-sheet-empty-1966-46187"]'),
      filledSheet: !!document.querySelector('[data-testid="add-card-sheet-filled-1986-16800"]'),
      keyboard: rect('[data-testid="ios-numeric-keyboard"]'),
      animatedKeyboard: rect('[data-testid="add-card-keyboard-animated"]'),
      calendar: rect('[data-testid="add-card-expiry-calendar"]'),
      ctaDisabled: cta?.getAttribute('aria-disabled') === 'true' || cta?.getAttribute('disabled') !== null,
      cta: rect('[data-testid="add-card-continue"]'),
      review: rect('[data-testid="add-card-review"]'),
    };
  });

  let state;

  await page.goto(`${base}/payment-method/add-card?clickability=scrim`, { waitUntil: 'networkidle' });
  await page.click('[data-testid="add-card-scrim"]', { position: { x: 24, y: 70 } });
  await page.waitForURL(/payment-method(\?|$)/, { timeout: 1500 }).catch(() => failures.push('tapping add-card scrim did not close back to payment-method route'));

  await page.goto(`${base}/payment-method/add-card?clickability=calendar`, { waitUntil: 'networkidle' });
  await page.click('[data-testid="add-card-calendar-open"]');
  state = await readState();
  if (!state.calendar || state.keyboard) failures.push(`calendar picker did not open and hide keyboard: ${JSON.stringify(state)}`);
  await page.click('[data-testid="add-card-calendar-month-05"]');
  state = await readState();
  if (state.expiry !== '05/29') failures.push(`calendar picker did not write expiry date, got ${state.expiry}`);
  if (state.calendar) failures.push('calendar picker stayed open after selecting a month');

  await page.goto(`${base}/payment-method/add-card?clickability=typing`, { waitUntil: 'networkidle' });
  state = await readState();
  if (!state.emptySheet || !state.keyboard || !state.ctaDisabled) failures.push(`initial add-card state is not interactive empty state: ${JSON.stringify(state)}`);
  await page.click('[data-testid="add-card-input-cardNumber"]');
  await page.keyboard.type('1111222233334444');
  await page.click('[data-testid="add-card-input-expiry"]');
  await page.keyboard.type('0529');
  await page.click('[data-testid="add-card-input-cvv"]');
  await page.keyboard.type('123');
  state = await readState();
  if (state.card !== '1111 2222 3333 4444') failures.push(`native typing did not format card number, got ${state.card}`);
  if (state.expiry !== '05/29') failures.push(`native typing did not format expiry, got ${state.expiry}`);
  if (state.cvv !== '123') failures.push(`native typing did not capture cvv, got ${state.cvv}`);
  if (state.ctaDisabled) failures.push(`CTA stayed disabled after valid native typing: ${JSON.stringify(state)}`);
  if (!state.filledSheet) failures.push(`filled state did not appear after valid typing: ${JSON.stringify(state)}`);
  if (!state.animatedKeyboard) failures.push('keyboard close did not animate: animated keyboard wrapper disappeared immediately');
  // 140ms settle delay + 420ms glide before the keyboard unmounts.
  await page.waitForTimeout(750);
  state = await readState();
  if (state.keyboard || state.animatedKeyboard) failures.push(`keyboard did not finish closing after valid typing: ${JSON.stringify(state)}`);
  if (state.review.bottom > state.cta.top - 8) failures.push(`review/CTA overlap after typing: ${JSON.stringify(state)}`);
  await page.click('[data-testid="add-card-continue"]');
  await page.waitForURL(/otp/, { timeout: 1500 }).catch(() => failures.push('enabled add-card CTA did not navigate to OTP'));

  await page.goto(`${base}/payment-method/add-card?clickability=custom-keyboard`, { waitUntil: 'networkidle' });
  await page.click('[data-testid="add-card-input-cardNumber"]');
  for (const d of '1111222233334444') await page.click(`[data-testid="add-card-key-${d}"]`);
  await page.click('[data-testid="add-card-input-expiry"]');
  for (const d of '0529') await page.click(`[data-testid="add-card-key-${d}"]`);
  await page.click('[data-testid="add-card-input-cvv"]');
  for (const d of '123') await page.click(`[data-testid="add-card-key-${d}"]`);
  state = await readState();
  if (state.card !== '1111 2222 3333 4444' || state.expiry !== '05/29' || state.cvv !== '123') failures.push(`custom keypad did not fill fields: ${JSON.stringify(state)}`);
  if (state.ctaDisabled) failures.push('custom keypad did not enable CTA after valid entry');

  await page.goto(`${base}/payment-method/add-card?clickability=grabber`, { waitUntil: 'networkidle' });
  await page.click('[data-testid="add-card-grabber-close"]');
  await page.waitForURL(/payment-method(\?|$)/, { timeout: 1500 }).catch(() => failures.push('tap on sheet grabber did not close sheet'));

  await browser.close();
  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, checked: ['scrim close', 'calendar picker', 'native typing', 'animated keyboard close', 'custom keypad typing', 'CTA navigation', 'grabber close'] }, null, 2));
})();
