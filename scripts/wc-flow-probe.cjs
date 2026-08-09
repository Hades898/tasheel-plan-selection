#!/usr/bin/env node
// End-to-end gate for the merchant web-checkout new-user flow (Figma section 355:48766).
// Clicks through the meeting-approved Harun path: merchant -> cart -> mobile -> OTP -> IVR -> tenure -> payment
// -> processing -> success -> iOS notification -> app transaction details.
const { chromium } = require('playwright');

const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout';

(async () => {
  const failures = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 848 }, deviceScaleFactor: 1 });
  const path = () => page.evaluate(() => location.pathname.replace('/tasheel-bnpl-prototype', ''));
  const expect = async (want, label) => {
    const got = await path();
    if (!got.includes(want)) failures.push(`${label}: expected path ${want}, got ${got}`);
  };

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const merchant = await page.evaluate(() => ({
    text: document.body.innerText.replace(/\s+/g, ' '),
    productImg: [...document.querySelectorAll('img')].some(i => (i.currentSrc || i.src).includes('wcSmegFridge') && i.naturalWidth > 0),
  }));
  for (const s of ['SMEG', "50's Retro Style Freestanding Refrigerator", '7,000', 'Shop now, pay later!', 'Add to cart']) {
    if (!merchant.text.includes(s)) failures.push(`merchant PDP missing: ${s}`);
  }
  if (!merchant.productImg) failures.push('merchant PDP product image not loaded');
  await page.click('[data-testid="wc-add-to-cart"]');
  await page.waitForTimeout(300);
  const cartText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  for (const s of ['Your cart', 'Credit / Debit Card', 'Apple Pay', 'Tasheel Finance']) {
    if (!cartText.includes(s)) failures.push(`cart missing: ${s}`);
  }
  await page.click('[data-testid="wc-cart-continue"]');
  await page.waitForTimeout(500);
  await expect('/checkout/onboarding/mobile', 'proceed CTA');

  const mobileText = await page.evaluate(() => document.body.innerText);
  for (const s of ["Let's get you started", 'Phone number', '+966', 'Confirm mobile number']) {
    if (!mobileText.includes(s)) failures.push(`mobile screen missing: ${s}`);
  }
  await page.click('[data-testid="wc-mobile-continue"]');
  await page.waitForTimeout(500);
  await expect('/checkout/onboarding/otp', 'mobile confirm');

  const otpDisabled = await page.evaluate(() => document.querySelector('[data-testid="wc-otp-confirm"]')?.getAttribute('aria-disabled') === 'true');
  if (!otpDisabled) failures.push('wc OTP confirm should start disabled');
  await page.click('[data-testid="wc-otp-boxes"]');
  await page.keyboard.type('1234');
  await page.waitForTimeout(300);
  await page.click('[data-testid="wc-otp-confirm"]');
  await page.waitForTimeout(500);
  await expect('/checkout/onboarding/quick-call', 'otp confirm');

  const qcText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  if (!qcText.includes('Ready for a quick call?') || !qcText.includes('Call Me Now')) failures.push('quick call screen content missing');
  await page.click('[data-testid="wc-quickcall-cta"]');
  await page.waitForTimeout(2300);
  const qcVerified = await page.evaluate(() => document.body.innerText.includes('Verification successful'));
  if (!qcVerified) failures.push('quick call button did not morph to verified state');
  await page.waitForTimeout(2300);
  await expect('/checkout/onboarding/tenure', 'quick call auto-continue after 2s');

  // plan must be fully interactive: amounts change with the stepper
  const heroText = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').match(/([\d,]+\.\d{2})\s*today/)?.[1] || '');
  const at3 = await heroText();
  await page.click('[data-testid="wc-plan-plus"]');
  await page.waitForTimeout(500);
  const at4 = await heroText();
  if (!at3 || !at4 || at3 === at4) failures.push(`tenure stepper did not change today amount: ${at3} -> ${at4}`);
  await page.click('[data-testid="wc-plan-details"]');
  await page.waitForTimeout(450);
  const details = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  if (!details.includes('Plan details') || !details.includes('Due today') || !details.includes('Order total')) failures.push('plan details sheet content missing');
  // From the tenure screen the details CTA is "Continue with plan" -> straight to payment.
  const detailsCta = await page.evaluate(() => document.querySelector('[data-testid="wc-details-got-it"]')?.textContent || '');
  if (!detailsCta.includes('Continue with plan')) failures.push(`tenure details CTA should continue with plan, got "${detailsCta}"`);
  await page.click('[data-testid="wc-details-got-it"]');
  await page.waitForTimeout(500);
  await expect('/checkout/onboarding/payment', 'details continue with plan');

  const payText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  for (const s of ['Your payment plan', 'Starting from Jul 1', 'Payment method', 'Apple Pay', 'Add new card', 'Accept Murabaha agreement']) {
    if (!payText.includes(s)) failures.push(`payment screen missing: ${s}`);
  }
  if (!payText.includes(at4)) failures.push(`payment screen does not carry tenure amount ${at4}`);
  const initiallyDisabled = await page.locator('[data-testid="wc-pay-cta"]').getAttribute('aria-disabled');
  if (initiallyDisabled !== 'true') failures.push('payment CTA should start disabled');
  await page.click('[data-testid="wc-pay-row-apple"]');
  await page.click('[data-testid="wc-murabaha-entry"]');
  await page.waitForTimeout(350);
  await page.click('[data-testid="wc-murabaha-accept"]');
  await page.click('[data-testid="wc-murabaha-close"]');
  await page.waitForTimeout(200);
  await page.click('[data-testid="wc-pay-cta"]');
  await page.waitForTimeout(700);
  await expect('/checkout/onboarding/processing', 'pay CTA');

  const w1 = await page.evaluate(() => document.querySelector('[data-testid="wc-processing-track"]')?.firstElementChild?.getBoundingClientRect().width || 0);
  await page.waitForTimeout(700);
  const w2 = await page.evaluate(() => document.querySelector('[data-testid="wc-processing-track"]')?.firstElementChild?.getBoundingClientRect().width || 0);
  if (Math.abs(w2 - w1) < 8) failures.push(`processing bar not animating: ${w1} -> ${w2}`);
  await page.waitForTimeout(2400);
  await expect('/checkout/onboarding/success', 'processing auto-advance');

  const successText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  for (const s of ['Purchase Successful!', 'Extrastores', 'Plan', 'First payment', 'Reference', 'Download Tasheel app', 'Redirecting to Extrastores']) {
    if (!successText.includes(s)) failures.push(`success screen missing: ${s}`);
  }
  if (!/EXT-2026-\d{5}/.test(successText)) failures.push('success reference not generated');
  await page.click('[data-testid="wc-success-redirect"]');
  await page.waitForTimeout(1300);
  await expect('/checkout/notification', 'redirect to notification scene');

  const notifText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  for (const s of ['TASHEEL', 'Purchase confirmed', '6,300.00', 'after discount']) {
    if (!notifText.includes(s)) failures.push(`notification missing: ${s}`);
  }
  await page.click('[data-testid="wc-notification-banner"]');
  await page.waitForTimeout(700);
  await expect('/checkout/detail', 'notification opens app purchase screen');

  await browser.close();
  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, flow: 'merchant -> cart -> mobile -> otp -> ivr -> tenure -> murabaha/payment -> processing -> success -> notification -> detail' }, null, 2));
})().catch(err => { console.error(err); process.exit(1); });
