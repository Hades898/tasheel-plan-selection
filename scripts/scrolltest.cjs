const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 680 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  await ctx.addInitScript(() => { try { Object.defineProperty(document, 'ontouchend', { value: null, configurable: true }); } catch(e){} });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/superhome', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const before = await p.evaluate(() => { let best=0; document.querySelectorAll('*').forEach(el=>{ if(el.scrollHeight-el.clientHeight>best && el.clientHeight>300) best=el.scrollHeight-el.clientHeight; }); return best; });
  // scroll the tallest inner scroller
  await p.evaluate(() => { let b=null,h=0; document.querySelectorAll('*').forEach(el=>{ const s=el.scrollHeight-el.clientHeight; if(s>h && el.clientHeight>300){h=s;b=el;} }); if(b) b.scrollTop=600; });
  await p.waitForTimeout(400);
  const after = await p.evaluate(() => { let b=null,h=0; document.querySelectorAll('*').forEach(el=>{ const s=el.scrollHeight-el.clientHeight; if(s>h && el.clientHeight>300){h=s;b=el;} }); return b?b.scrollTop:-1; });
  console.log(JSON.stringify({ maxScrollable: before, scrolledTo: after }));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
