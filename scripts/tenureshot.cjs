const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  const base = 'http://127.0.0.1:4175/tasheel-bnpl-prototype';
  const bad = []; p.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await p.goto(`${base}/checkout/onboarding/tenure`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);
  await p.screenshot({ path: 'screenshots/ten-01-default.png' });
  const t2 = await p.evaluate(() => document.body.innerText);
  // step up to a fee-bearing tenure
  for (let i = 0; i < 3; i++) { await p.getByTestId('wc-plan-plus').click(); await p.waitForTimeout(400); }
  await p.waitForTimeout(600);
  await p.screenshot({ path: 'screenshots/ten-02-fee.png' });
  const tFee = await p.evaluate(() => document.body.innerText);
  // leave sheet
  await p.getByTestId('wc-onboard-close').click().catch(()=>{});
  await p.waitForTimeout(700);
  await p.screenshot({ path: 'screenshots/ten-03-leave.png' });
  const tLeave = await p.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({
    bad,
    default: { months: (t2.match(/(\d+)\s*Months/)||[])[1], noFees: t2.includes('No fees'), pendingGone: !/pending/i.test(t2), limitsGone: !t2.includes('BNPL up to'), discountChip: t2.includes('10% off'), sarTextGone: !t2.includes('SAR ') },
    fee: { months: (tFee.match(/(\d+)\s*Months/)||[])[1], hasFees: tFee.includes('Fees'), cta: tFee.includes('Continue with plan') },
    leave: { sheet: tLeave.includes('Leave checkout'), mentionsApp: tLeave.includes('Tasheel app') },
  }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
