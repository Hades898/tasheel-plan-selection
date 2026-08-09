const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 402, height: 880 } });
  await p.goto('http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.getByText('Pay now', { exact: true }).first().click();
  await p.waitForTimeout(900);
  const url = p.url();
  const sheet = await p.getByTestId('payment-method-sheet').count();
  console.log(JSON.stringify({ url, sheetVisible: sheet }));
  await b.close();
})().catch(e=>{console.error(String(e));process.exit(1);});
