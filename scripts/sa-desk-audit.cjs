const { chromium } = require('playwright');
(async () => {
  const url = 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome';
  const browser = await chromium.launch();
  // Desktop (no touch) => SHOW_FAKE_CHROME = true, the path Dia renders.
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const findScroll = (y) => { let best=document.scrollingElement, bestH=0; document.querySelectorAll('*').forEach(el=>{ const s=el.scrollHeight-el.clientHeight; if(s>bestH && el.clientHeight>300){bestH=s;best=el;} }); best.scrollTop = y; return best.scrollHeight; };
  const offsets = [0, 760, 1520, 2280];
  for (let i=0;i<offsets.length;i++){
    await p.evaluate(findScroll, offsets[i]);
    await p.waitForTimeout(350);
    await p.screenshot({ path: `screenshots/desk-${i}.png` });
  }
  await browser.close();
  console.log('done');
})().catch(e=>{console.error(e);process.exit(1);});
