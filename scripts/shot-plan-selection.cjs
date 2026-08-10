const { chromium } = require('playwright');

const OUT = process.env.OUT || '/Users/hadysoliman/Developer/tasheel-plan-selection/screenshots/plan-selection';
const BASE = 'http://127.0.0.1:4173/tasheel-plan-selection';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();

  const shot = async (name, full = false) => {
    await page.waitForTimeout(650);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
    console.log('shot', name);
  };

  // RN Web scrolls inside its own ScrollView, not the document.
  const scrollInner = async (to) => {
    await page.evaluate((y) => {
      const el = [...document.querySelectorAll('div')].find((d) => d.scrollHeight > d.clientHeight + 40 && getComputedStyle(d).overflowY !== 'visible');
      if (el) el.scrollTop = y === 'bottom' ? el.scrollHeight : y;
    }, to);
    await page.waitForTimeout(400);
  };

  // Experience A — list
  await page.goto(`${BASE}/checkout/onboarding/plans/`, { waitUntil: 'networkidle' });
  await shot('A-list-default');
  await scrollInner('bottom');
  await shot('A-list-bottom');
  await scrollInner(0);
  await page.getByTestId('wc-plan-row-12').click();
  await shot('A-list-selected-12');
  await page.getByTestId('wc-cart-link').click();
  await shot('A-list-cart-sheet');

  // Experience B — stepper
  await page.goto(`${BASE}/checkout/onboarding/tenure/`, { waitUntil: 'networkidle' });
  await shot('B-stepper-4');
  for (const [n, label] of [[2, 'B-stepper-2'], [24, 'B-stepper-24']]) {
    // Rail slots carry their discount in the label ("24 months, 10 percent off").
    await page.getByRole('button', { name: new RegExp(`^${n} months`) }).click();
    await shot(label);
  }
  await page.getByTestId('wc-plan-details').click();
  await shot('B-stepper-details-sheet');

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  console.log('errors:', errors);
  await browser.close();
})();
