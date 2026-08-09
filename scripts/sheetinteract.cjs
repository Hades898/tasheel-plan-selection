const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  await ctx.addInitScript(() => { try { Object.defineProperty(document, 'ontouchend', { value: null, configurable: true }); } catch(e){} });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.getByText('Pay now', { exact: true }).first().click();
  await p.waitForTimeout(800);
  // tap Debit Card (a button) -> should select (Pay becomes enabled)
  await p.getByText('Debit Card', { exact: true }).click();
  await p.waitForTimeout(400);
  const payDisabled = await p.getByTestId('sa-pay-cta').evaluate(el => el.getAttribute('aria-disabled'));
  // tap scrim (top area) -> should close
  await p.mouse.click(196, 120);
  await p.waitForTimeout(700);
  const sheetGone = await p.getByTestId('payment-method-sheet').count();
  console.log(JSON.stringify({ payDisabledAfterPick: payDisabled, sheetClosedOnOutsideTap: sheetGone === 0 }));
  // Add new card -> no ring
  await p.getByText('Pay now', { exact: true }).first().click();
  await p.waitForTimeout(700);
  await p.getByText('Add new card', { exact: true }).click();
  await p.waitForTimeout(800);
  const ring = await p.locator('[data-testid^="add-card-bg-due-row"]').count();
  const addSheet = await p.locator('[data-testid^="add-card-sheet"]').count();
  console.log(JSON.stringify({ addCardRingRows: ring, addCardSheet: addSheet }));
  await b.close();
})().catch(e=>{console.error(String(e));process.exit(1);});
