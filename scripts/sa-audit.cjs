const { chromium } = require('playwright');
(async () => {
  const url = 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome';
  const browser = await chromium.launch();
  const m = await browser.newPage({ viewport: { width: 402, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' });
  await m.goto(url, { waitUntil: 'networkidle' });
  await m.waitForTimeout(1600);
  // find the tallest scrollable element
  const findScroller = `(() => { let best=document.scrollingElement, bestH=0; document.querySelectorAll('*').forEach(el=>{ const s=el.scrollHeight-el.clientHeight; if(s>bestH && el.clientHeight>300){bestH=s;best=el;} }); return bestH; })()`;
  const maxScroll = await m.evaluate(findScroller);
  console.log('maxScroll', maxScroll);
  const offsets = [0, 640, 1280, 1920, 2560, 3000];
  for (let i = 0; i < offsets.length; i++) {
    await m.evaluate((y) => { let best=document.scrollingElement, bestH=0; document.querySelectorAll('*').forEach(el=>{ const s=el.scrollHeight-el.clientHeight; if(s>bestH && el.clientHeight>300){bestH=s;best=el;} }); best.scrollTop = y; }, offsets[i]);
    await m.waitForTimeout(350);
    await m.screenshot({ path: `screenshots/audit-${i}.png` });
  }
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
