const { chromium } = require('playwright');
(async () => {
  const url = 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome';
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  // tab bar crop (bottom of viewport)
  await p.screenshot({ path: 'screenshots/sa-tabbar.png', clip: { x: 420, y: 770, width: 440, height: 120 } });
  // open search
  await p.getByLabel('Search').click();
  await p.waitForTimeout(700);
  await p.screenshot({ path: 'screenshots/sa-search-open.png' });
  // type a query
  await p.getByPlaceholder('Search stores, offers, products').fill('sam');
  await p.waitForTimeout(500);
  await p.screenshot({ path: 'screenshots/sa-search-typed.png' });
  // switch active tab to Stores (visual only)
  await p.getByText('Cancel').click();
  await p.waitForTimeout(400);
  await p.getByLabel('Stores').click();
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'screenshots/sa-tab-stores.png', clip: { x: 420, y: 770, width: 440, height: 120 } });
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
