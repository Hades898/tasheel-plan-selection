const { chromium } = require('playwright');
(async () => {
  const url = 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome';
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1400);
  const setHero = (i) => {
    let best=null,bh=0;
    document.querySelectorAll('*').forEach(el=>{ const ho=el.scrollWidth-el.clientWidth; if(ho>50 && el.clientHeight>300 && el.clientHeight>bh){bh=el.clientHeight;best=el;} });
    if(best){ best.scrollLeft = i * best.clientWidth; }
    return best ? best.clientWidth : 0;
  };
  for (let i=0;i<4;i++){
    const w = await p.evaluate(setHero, i);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `screenshots/hero-${i}.png`, clip: { x: 420, y: 0, width: 402, height: 560 } });
  }
  console.log('done');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
