#!/usr/bin/env node
const path = require('path');
const { chromium } = require('playwright');

const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:4174/tasheel-bnpl-prototype';
const shots = path.resolve(__dirname, '..', 'artifacts', 'bnpl-meeting-rules', 'screenshots');

(async () => {
  const failures = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 848 }, deviceScaleFactor: 1 });
  const bodyText = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const expectText = async (needle, label) => {
    if (!(await bodyText()).includes(needle)) failures.push(`${label}: missing "${needle}"`);
  };
  const expectDisabled = async (testId, expected, label) => {
    const disabled = await page.locator(`[data-testid="${testId}"]`).getAttribute('aria-disabled');
    if ((disabled === 'true') !== expected) failures.push(`${label}: expected disabled=${expected}, got ${disabled}`);
  };

  await page.goto(`${base}/checkout`, { waitUntil: 'networkidle' });
  await expectText('7,000', 'merchant product price');
  await expectText('Add to cart', 'merchant PDP cart CTA');
  await page.click('[data-testid="wc-add-to-cart"]');
  await expectText('Your cart', 'cart screen');
  await expectText('Credit / Debit Card', 'cart payment options');
  await expectText('Apple Pay', 'cart payment options');
  await expectText('Tasheel Finance', 'cart payment options');
  await page.screenshot({ path: path.join(shots, 'web-extra-cart.png'), fullPage: true });
  await page.click('[data-testid="wc-cart-continue"]');
  if (!page.url().includes('/checkout/onboarding/mobile')) failures.push(`cart continue: unexpected ${page.url()}`);
  await page.click('[data-testid="wc-mobile-continue"]');
  await page.click('[data-testid="wc-otp-boxes"]');
  await page.keyboard.type('1234');
  await page.click('[data-testid="wc-otp-confirm"]');
  await page.waitForTimeout(350);
  if (!page.url().includes('/checkout/onboarding/quick-call')) failures.push(`Harun OTP should go directly to IVR, got ${page.url()}`);
  await expectText('Ready for a quick call?', 'Harun IVR');
  await page.screenshot({ path: path.join(shots, 'web-harun-ivr.png'), fullPage: true });

  await page.goto(`${base}/checkout/onboarding/tenure`, { waitUntil: 'networkidle' });
  await expectText('10% Tasheel discount', 'discount summary');
  await expectText('BNPL up to SAR 10,000.00', 'BNPL product maximum');
  await expectText('BNPL Plus up to SAR 50,000.00', 'BNPL Plus product maximum');
  await expectText('700.00', 'discount amount');
  await expectText('6,300.00', 'discounted order');
  await expectText('2,966.67', '3-month due today');

  await page.click('[data-testid="wc-plan-plus"]');
  await page.waitForTimeout(350);
  await expectText('2,562.50', '4-month due today');
  await expectText('Includes SAR 50.00 total fee', '4-month fee');
  if (await page.locator('[data-testid="wc-four-month-fee-help"]').count() !== 1) failures.push('4-month help icon missing');
  await page.screenshot({ path: path.join(shots, 'web-tenure-4-month.png'), fullPage: true });

  await page.click('[data-testid="wc-plan-plus"]');
  await page.waitForTimeout(350);
  await expectText('Murabaha fee rate pending', '6-month unresolved rate');
  await expectDisabled('wc-plan-continue', true, '6-month continue');
  await page.screenshot({ path: path.join(shots, 'web-tenure-6-month-rate-pending.png'), fullPage: true });

  await page.goto(`${base}/checkout/onboarding/payment`, { waitUntil: 'networkidle' });
  await expectDisabled('wc-pay-cta', true, 'payment initial');
  await page.click('[data-testid="wc-pay-row-apple"]');
  await expectDisabled('wc-pay-cta', true, 'method without agreement');
  await page.screenshot({ path: path.join(shots, 'web-payment-method-only-disabled.png'), fullPage: true });

  await page.click('[data-testid="wc-murabaha-entry"]');
  await page.waitForTimeout(400);
  await expectText('Holding Certificate', 'Murabaha sheet');
  await expectText('Loan Contract', 'Murabaha sheet');
  await expectText('Sales Agreement', 'Murabaha sheet');
  await page.screenshot({ path: path.join(shots, 'web-murabaha-documents.png'), fullPage: true });
  await page.click('[data-testid="wc-murabaha-accept"]');
  await page.click('[data-testid="wc-murabaha-close"]');
  await page.waitForTimeout(200);
  await expectText('Murabaha agreement accepted', 'accepted payment review');
  await expectDisabled('wc-pay-cta', false, 'method and agreement');
  await page.screenshot({ path: path.join(shots, 'web-payment-ready.png'), fullPage: true });

  await browser.close();
  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({
    ok: true,
    pricing: 'SAR 7,000 - 10% = SAR 6,300; SAR 5,000 financed; SAR 1,300 down payment',
    gating: 'payment method AND Murabaha acceptance',
    unresolvedRates: [6, 9, 12, 24, 36],
  }, null, 2));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
