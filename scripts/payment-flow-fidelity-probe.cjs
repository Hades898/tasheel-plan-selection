#!/usr/bin/env node
const { chromium } = require('playwright');

const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout';
const approx = (actual, expected, tolerance, label, failures) => {
  if (Math.abs(actual - expected) > tolerance) failures.push(`${label}: expected ${expected}±${tolerance}, got ${actual}`);
};

const rectEval = () => {
  const rect = (sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom } : null; };
  const assetUrls = (sel) => {
    const root = document.querySelector(sel);
    if (!root) return [];
    return [root, ...root.querySelectorAll('*')].map(el => `${el.getAttribute('style') || ''} ${el.getAttribute('src') || ''} ${getComputedStyle(el).backgroundImage || ''}`);
  };
  return { rect, assetUrls };
};

(async () => {
  const failures = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1 });

  await page.goto(`${base}/payment-method/add-card?probe=${Date.now()}`, { waitUntil: 'networkidle' });
  const addCard = await page.evaluate(() => {
    const rect = (sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom } : null; };
    const cta = document.querySelector('[data-testid="add-card-continue"]');
    return {
      text: document.body.innerText.replace(/\s+/g, ' '),
      screen: rect('[data-testid="add-new-card-figma"]'),
      sheet: rect('[data-testid="add-card-sheet-empty-1966-46187"]'),
      fields: rect('[data-testid="add-card-fields"]'),
      review: rect('[data-testid="add-card-review"]'),
      cta: rect('[data-testid="add-card-continue"]'),
      keyboard: rect('[data-testid="ios-numeric-keyboard"]'),
      disabled: cta?.getAttribute('aria-disabled') === 'true' || cta?.getAttribute('disabled') !== null,
      cardPlaceholder: document.querySelector('[data-testid="add-card-input-cardNumber"]')?.getAttribute('placeholder') || '',
      expiryPlaceholder: document.querySelector('[data-testid="add-card-input-expiry"]')?.getAttribute('placeholder') || '',
      cvvPlaceholder: document.querySelector('[data-testid="add-card-input-cvv"]')?.getAttribute('placeholder') || '',
      overflowX: document.documentElement.scrollWidth > innerWidth,
    };
  });
  for (const s of ['Add new card', 'Card Number', 'Expiry Date', 'CVV', 'Processing fee', 'Free', 'Amount to pay', '2,400', 'Add card and pay']) {
    if (!addCard.text.includes(s)) failures.push(`add-card empty state missing Figma text: ${s}`);
  }
  if (addCard.cardPlaceholder !== '|') failures.push(`add-card card placeholder should be |, got ${addCard.cardPlaceholder}`);
  if (addCard.expiryPlaceholder !== 'MM/YY') failures.push(`add-card expiry placeholder should be MM/YY, got ${addCard.expiryPlaceholder}`);
  if (addCard.cvvPlaceholder !== 'CVV') failures.push(`add-card CVV placeholder should be CVV, got ${addCard.cvvPlaceholder}`);
  for (const stale of ['Use another debit card for this payment.', 'Debit Card', '4111 1111 1111 4521', 'New debit card •••• 4521', 'Add card and continue']) {
    if (addCard.text.includes(stale)) failures.push(`add-card empty state still leaks old invented full-page content: ${stale}`);
  }
  if (addCard.text.includes('calendar')) failures.push('add-card shows literal "calendar" text instead of icon');
  if (!addCard.disabled) failures.push('add-card empty CTA should be disabled');
  if (!addCard.keyboard) failures.push('add-card empty state is missing iOS numeric keyboard');
  if (addCard.overflowX) failures.push('add-card has horizontal overflow');
  approx(addCard.sheet.top, 89, 3, 'add-card empty sheet top', failures);
  approx(addCard.sheet.height, 505, 3, 'add-card empty sheet height', failures);
  approx(addCard.fields.top, 180, 4, 'add-card empty fields top', failures);
  approx(addCard.fields.height, 186, 3, 'add-card empty fields height', failures);
  approx(addCard.review.top, 386, 4, 'add-card empty review top', failures);
  approx(addCard.review.width, 370, 1, 'add-card review width', failures);
  approx(addCard.cta.top, 510, 4, 'add-card empty CTA top', failures);
  approx(addCard.cta.width, 370, 1, 'add-card CTA width', failures);
  approx(addCard.keyboard.top, 556, 6, 'add-card keyboard top', failures);
  if (addCard.review.bottom > addCard.cta.top - 8) failures.push(`add-card CTA overlaps review: review bottom ${addCard.review.bottom}, CTA top ${addCard.cta.top}`);

  await page.click('[data-testid="add-card-input-cardNumber"]');
  await page.keyboard.type('1111222233334444');
  await page.click('[data-testid="add-card-input-expiry"]');
  await page.keyboard.type('0529');
  await page.click('[data-testid="add-card-input-cvv"]');
  await page.keyboard.type('123');
  await page.waitForSelector('[data-testid="add-card-sheet-filled-1986-16800"]', { timeout: 1500 }).catch(() => failures.push('add-card valid typing did not transition to filled card state'));
  // 140ms settle delay + 420ms sheet/keyboard glide before the filled geometry is final.
  await page.waitForTimeout(750);
  const cardAdded = await page.evaluate(() => {
    const rect = (sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom } : null; };
    return {
      text: document.body.innerText.replace(/\s+/g, ' '),
      sheet: rect('[data-testid="add-card-sheet-filled-1986-16800"]'),
      fields: rect('[data-testid="add-card-fields"]'),
      review: rect('[data-testid="add-card-review"]'),
      cta: rect('[data-testid="add-card-continue"]'),
      keyboard: rect('[data-testid="ios-numeric-keyboard"]'),
      disabled: document.querySelector('[data-testid="add-card-continue"]')?.getAttribute('aria-disabled'),
      card: document.querySelector('[data-testid="add-card-input-cardNumber"]')?.value || '',
      expiry: document.querySelector('[data-testid="add-card-input-expiry"]')?.value || '',
      cvv: document.querySelector('[data-testid="add-card-input-cvv"]')?.value || '',
    };
  });
  for (const s of ['Add new card', 'Processing fee', 'Amount to pay', '2,400', 'Add card and pay']) {
    if (!cardAdded.text.includes(s)) failures.push(`add-card filled state missing Figma text: ${s}`);
  }
  if (cardAdded.card !== '1111 2222 3333 4444') failures.push(`add-card filled card value mismatch: ${cardAdded.card}`);
  if (cardAdded.expiry !== '05/29') failures.push(`add-card filled expiry value mismatch: ${cardAdded.expiry}`);
  if (cardAdded.cvv !== '123') failures.push(`add-card filled cvv value mismatch: ${cardAdded.cvv}`);
  if (cardAdded.keyboard) failures.push('add-card filled state should not show keyboard');
  approx(cardAdded.sheet.top, 385, 3, 'add-card filled sheet top', failures);
  approx(cardAdded.fields.top, 476, 4, 'add-card filled fields top', failures);
  approx(cardAdded.review.top, 682, 4, 'add-card filled review top', failures);
  approx(cardAdded.cta.top, 806, 6, 'add-card filled CTA top', failures);
  if (cardAdded.review.bottom > cardAdded.cta.top - 8) failures.push(`add-card filled CTA overlaps review: review bottom ${cardAdded.review.bottom}, CTA top ${cardAdded.cta.top}`);

  await page.goto(`${base}/otp?probe=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="ios-numeric-keyboard"]', { timeout: 1500 });
  const otpBank = await page.evaluate(() => {
    const rect = (sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom } : null; };
    const img = [...document.querySelectorAll('img')].find(el => (el.currentSrc || el.src || '').includes('otpBankPage'));
    return {
      hasBack: !!document.querySelector('[data-testid="otp-back"]'),
      hasBankLogo: !!document.querySelector('[data-testid="otp-gcc-bank-logo"]'),
      bankImageLoaded: !!img && img.naturalWidth > 0,
      text: document.body.innerText.replace(/\s+/g, ' '),
      screen: rect('[data-testid="otp-screen-814-24658"]'),
      input: rect('[data-testid="otp-bank-input"]'),
      submit: rect('[data-testid="otp-bank-submit"]'),
      keyboard: rect('[data-testid="ios-numeric-keyboard"]'),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      submitDisabled: document.querySelector('[data-testid="otp-bank-submit"]')?.getAttribute('aria-disabled') === 'true',
    };
  });
  if (otpBank.hasBack) failures.push('otp still renders an app back button: the bank 3DS page (Figma 814:24658) has no app chrome');
  if (otpBank.hasBankLogo || otpBank.text.includes('GCC')) failures.push('otp still renders the invented GCC bank logo');
  for (const s of ['Verify payment', 'Enter OTP', 'Verify and pay']) {
    if (otpBank.text.includes(s)) failures.push(`otp still contains invented pre-bank-page copy: ${s}`);
  }
  if (!otpBank.bankImageLoaded) failures.push('otp bank 3DS page bitmap (otpBankPage.png) missing or not loaded');
  for (const s of ['للتحقق من عملية الشراء', 'Tasheel Finance', '2,400.00 SAR', '4521************']) {
    if (!otpBank.text.includes(s)) failures.push(`otp bank verification text missing: ${s}`);
  }
  if (!otpBank.keyboard) failures.push('otp iOS numeric keyboard is missing');
  if (otpBank.overflowX) failures.push('otp route has horizontal overflow');
  approx(otpBank.keyboard.width, 402, 1, 'otp keyboard width', failures);
  if (otpBank.keyboard.bottom > 874) failures.push(`otp keyboard clipped: bottom ${otpBank.keyboard.bottom}`);
  approx(otpBank.input.top, 286, 5, 'otp bank verification input top', failures);
  approx(otpBank.submit.top, 323, 5, 'otp bank submit button top', failures);
  if (!otpBank.submitDisabled) failures.push('otp bank submit should be disabled before 4 digits');
  await page.click('[data-testid="otp-key-1"]');
  await page.click('[data-testid="otp-key-2"]');
  await page.click('[data-testid="otp-key-3"]');
  await page.click('[data-testid="otp-key-4"]');
  const otpTyped = await page.evaluate(() => ({
    code: (document.querySelector('[data-testid="otp-bank-input"]')?.textContent || '').trim(),
    submitDisabled: document.querySelector('[data-testid="otp-bank-submit"]')?.getAttribute('aria-disabled') === 'true',
  }));
  if (otpTyped.code !== '1234') failures.push(`otp keys did not fill the bank verification field: "${otpTyped.code}"`);
  if (otpTyped.submitDisabled) failures.push('otp bank submit still disabled after 4 digits');
  await page.click('[data-testid="otp-bank-submit"]');
  await page.waitForTimeout(280);
  const otpSubmitPath = await page.evaluate(() => location.pathname);
  if (!otpSubmitPath.includes('/checkout/processing')) failures.push(`otp bank submit did not route to processing: ${otpSubmitPath}`);

  await page.goto(`${base}/processing?probe=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Authorizing payment', { timeout: 1000 });
  const fillWidth = async () => page.evaluate(() => document.querySelector('[data-testid="processing-animated-track"]')?.firstElementChild?.getBoundingClientRect().width || 0);
  await page.waitForTimeout(80);
  const w1 = await fillWidth();
  await page.waitForTimeout(520);
  const w2 = await fillWidth();
  if (Math.abs(w2 - w1) <= 10) failures.push(`processing bar is not animated: widths ${w1} -> ${w2}`);
  const processing = await page.evaluate(() => {
    const rect = (sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom } : null; };
    return {
      track: rect('[data-testid="processing-animated-track"]'),
      content: rect('[data-testid="processing-content-frame"]'),
      text: document.body.innerText.replace(/\s+/g, ' '),
      assets: performance.getEntriesByType('resource').map(e => e.name).filter(name => name.includes('/figma/')),
    };
  });
  if (!processing.text.includes('Authorizing payment…')) failures.push('processing title does not match Figma ellipsis text');
  if (!processing.text.includes('2,400')) failures.push('processing still shows stale amount instead of payment-flow amount 2,400');
  if (!processing.assets.some(name => name.includes('paymentHourglass.png'))) failures.push('processing did not load Figma hourglass asset');
  approx(processing.track.width, 288, 1, 'processing track width', failures);
  approx(processing.track.height, 12, 1, 'processing track height', failures);

  await page.waitForURL(/success/, { timeout: 5000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="success-celebration-asset"]');
    if (!root) return false;
    return [root, ...root.querySelectorAll('*')].some(el => `${el.getAttribute('style') || ''} ${el.getAttribute('src') || ''} ${getComputedStyle(el).backgroundImage || ''}`.includes('paymentSuccessCelebration.png'));
  }, { timeout: 2000 });
  const success = await page.evaluate(() => {
    const rect = (sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom } : null; };
    const assetUrls = (sel) => {
      const root = document.querySelector(sel);
      if (!root) return [];
      return [root, ...root.querySelectorAll('*')].map(el => `${el.getAttribute('style') || ''} ${el.getAttribute('src') || ''} ${getComputedStyle(el).backgroundImage || ''}`);
    };
    return {
      text: document.body.innerText.replace(/\s+/g, ' '),
      prog: rect('[data-testid="success-prog-814-24726"]'),
      celebration: rect('[data-testid="success-celebration-asset"]'),
      nextUp: rect('[data-testid="success-next-up-card"]'),
      play: rect('[data-testid="success-home-button"]'),
      browserChrome: rect('[data-testid="success-browser-chrome"]'),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      celebrationAssetUrls: assetUrls('[data-testid="success-celebration-asset"]'),
    };
  });

  if (success.text.includes('✓')) failures.push('success uses fake checkmark glyph instead of Figma celebration asset');
  if (success.text.includes('extrastores.com') || success.browserChrome) failures.push('success leaked Safari/browser chrome');
  // Fixture selection pays the two April dues, so the dynamic copy must read
  // month-based (no count) and Next up must roll to the nearest unpaid due (Noon, May 4).
  for (const s of ['Payment successful', 'April installments paid', 'Next up — Noon', 'Due in 16 days · May 4th', '300', 'Home']) {
    if (!success.text.includes(s)) failures.push(`success missing dynamic text: ${s}`);
  }
  if (/\d+\s+April installments paid/.test(success.text)) failures.push('success subtitle still prefixes a count before the month list');
  if (!success.celebrationAssetUrls.some(name => name.includes('paymentSuccessCelebration.png'))) failures.push('success did not load Figma celebration asset');
  if (success.overflowX) failures.push('success route has horizontal overflow');
  approx(success.prog.top, 215, 4, 'success prog top from Figma node 814:24726', failures);
  approx(success.prog.width, 402, 1, 'success prog width', failures);
  approx(success.celebration.width, 122, 1, 'success celebration width', failures);
  approx(success.celebration.height, 122, 1, 'success celebration height', failures);
  approx(success.nextUp.width, 362, 1, 'success next-up width', failures);
  approx(success.nextUp.height, 60, 1, 'success next-up height', failures);
  approx(success.play.width, 370, 1, 'success play button width', failures);
  approx(success.play.height, 50, 1, 'success play button height', failures);
  if (success.play.bottom > 874) failures.push(`success Play button clipped: bottom ${success.play.bottom}`);

  await browser.close();

  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures, addCard, otpBank, processing, success }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, animation: { w1, w2 }, addCardGeometry: addCard, otpGeometry: otpBank, processingGeometry: processing, successGeometry: success }, null, 2));
})().catch(err => {
  console.error(err);
  process.exit(1);
});
