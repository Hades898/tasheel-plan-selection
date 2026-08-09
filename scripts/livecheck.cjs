const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 402, height: 880 } });
  await p.goto('https://hades898.github.io/tasheel-bnpl-prototype/checkout/superhome', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.getByText('Pay now', { exact: true }).first().click();
  await p.waitForTimeout(900);
  const body = await p.evaluate(() => document.body.innerText);
  const amt = body.match(/Amount to pay[\s\S]{0,40}/);
  const payBtn = body.match(/Pay[\s\S]{0,20}/g);
  console.log('Amount to pay text:', amt ? amt[0].replace(/\n/g,' ') : 'NOT FOUND');
  console.log('has 4,250:', body.includes('4,250'), ' has 1,800:', body.includes('1,800'));
  await b.close();
})().catch(e=>{console.error(String(e));process.exit(1);});
