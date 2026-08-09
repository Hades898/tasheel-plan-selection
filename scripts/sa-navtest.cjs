const { chromium } = require('playwright');
(async () => {
  const base = 'http://127.0.0.1:4174/tasheel-bnpl-prototype';
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 402, height: 880 } });
  await p.goto(base + '/checkout/superhome', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  // click Pay now
  await p.getByText('Pay now', { exact: true }).first().click();
  await p.waitForTimeout(800);
  const afterPay = p.url();
  // click the back chevron (first round button)
  await p.locator('[aria-label="Back"]').first().click();
  await p.waitForTimeout(800);
  const afterBack = p.url();
  const onSuperHome = await p.getByTestId('superapp-home').count();
  console.log(JSON.stringify({ afterPay, afterBack, onSuperHome }, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
