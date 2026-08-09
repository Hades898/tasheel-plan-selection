const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.getByText('Pay now', { exact: true }).first().click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'screenshots/sa-paysheet.png', clip: { x: 420, y: 0, width: 440, height: 900 } });
  await b.close();
})().catch(e=>{console.error(String(e));process.exit(1);});
