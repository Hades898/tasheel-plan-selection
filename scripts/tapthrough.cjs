const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const mk = async () => {
    const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:4175/tasheel-bnpl-prototype/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1400);
    await p.getByTestId('wc-add-to-cart').click();
    await p.waitForTimeout(800);
    return p;
  };
  // A: tapping the Tasheel card navigates straight to the mobile step
  const p1 = await mk();
  await p1.getByTestId('wc-tasheel-offer').click();
  await p1.waitForTimeout(1200);
  const afterCard = await p1.evaluate(() => document.body.innerText);
  await p1.screenshot({ path: 'screenshots/tap-01-after-tasheel-card.png' });

  // B: the How-does-it-work link must expand, NOT navigate
  const p2 = await mk();
  await p2.mouse.wheel(0, 700); await p2.waitForTimeout(500);
  await p2.getByText('How does it work?').click();
  await p2.waitForTimeout(700);
  const afterHow = await p2.evaluate(() => document.body.innerText);
  await p2.screenshot({ path: 'screenshots/tap-02-how-expanded.png' });

  console.log(JSON.stringify({
    tasheelCard: { leftCart: !afterCard.includes('Your cart'), onMobileStep: /mobile|Mobile|966|number/i.test(afterCard) },
    howLink: { stayedOnCart: afterHow.includes('Your cart'), expanded: afterHow.includes('Pick a plan from 2 to 36 months') },
  }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
