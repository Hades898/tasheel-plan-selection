const { chromium } = require('playwright');
const OUT = '/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/rev-01-pdp.png` });

  const pdpText = await p.evaluate(() => document.body.innerText);

  await p.getByTestId('wc-add-to-cart').click();
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/rev-02-cart-top.png` });
  await p.evaluate(() => { const s = document.querySelectorAll('div'); });
  await p.mouse.wheel(0, 700);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/rev-03-cart-snpl.png` });
  await p.mouse.wheel(0, 700);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/rev-04-cart-bottom.png` });

  const cartText = await p.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({
    pdp: {
      hasAddToCart: pdpText.includes('Add to cart'),
      snplLeaked: pdpText.includes('Shop now, pay later'),
      hasPrice: pdpText.includes('7,000'),
    },
    cart: {
      orderTotal: cartText.includes('Order total') && cartText.includes('7,000.00'),
      paymentOption: cartText.includes('Payment option'),
      card: cartText.includes('Credit / Debit Card'),
      apple: cartText.includes('Apple Pay'),
      snpl: cartText.includes('Shop now, pay later!'),
      discount: cartText.includes('6,300.00') && cartText.includes('10%'),
      tenure36: cartText.includes('36 payments'),
      how: cartText.includes('How does it work?'),
      tabby: cartText.includes('tabby') && cartText.includes('1,750.00'),
      tamara: cartText.includes('tamara') && cartText.includes('291.67'),
    },
  }, null, 2));
  await b.close();
})().catch(e => { console.error(String(e)); process.exit(1); });
