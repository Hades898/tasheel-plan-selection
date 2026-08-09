const { chromium } = require('playwright');
const fs = require('fs');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4174/tasheel-bnpl-prototype';
const routes = [
  ['checkout', ['Extrastores', 'Proceed with Tasheel BNPL']],
  ['checkout/app-home', ['Your Next Payment', 'Active Purchases', 'Next up']],
  ['checkout/detail', ['Payment Schedule', 'Purchase Details', 'Pay next installment']],
  ['checkout/dues', ['1 Due Selected', 'Remaining 1,200', 'Pay selected']],
  ['checkout/purchases', ['My Purchases', 'View all your purchases', 'Samsung Galaxy S26']],
  ['checkout/insights', ['Spent in April', 'Transactions', 'Noon']],
];
const viewports = [
  ['mobile', { width: 390, height: 844 }],
  ['short', { width: 390, height: 640 }],
  ['desktop', { width: 1280, height: 720 }],
];
(async () => {
  fs.mkdirSync('audits/figma-fidelity', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const rows = [];
  for (const [viewportName, viewport] of viewports) {
    for (const [route, texts] of routes) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', err => errors.push(String(err)));
      await page.goto(`${base}/${route}?geo=${Date.now()}`, { waitUntil: 'networkidle', timeout: 30000 });
      const metrics = await page.evaluate((texts) => {
        function findTextNode(text) {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
          let node;
          while ((node = walker.nextNode())) {
            const el = node;
            const ownText = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent || '').join('').replace(/\s+/g, ' ').trim();
            if (ownText.includes(text)) return el;
            const subtreeText = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
            if (subtreeText.includes(text)) return el;
          }
          return null;
        }
        const body = document.body;
        const app = document.querySelector('#root') || body.firstElementChild || body;
        const appRect = app.getBoundingClientRect();
        const all = Array.from(document.querySelectorAll('*'));
        const overflowing = all.filter(el => el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== 'visible').slice(0, 10).map(el => ({ tag: el.tagName, text: (el.textContent || '').slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth }));
        const images = Array.from(document.images).map(img => ({ src: img.currentSrc || img.src, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })).filter(img => img.src.includes('/figma/') || img.src.includes('/assets/figma/') || img.src.includes('/assets/assets/figma/'));
        const brokenImages = images.filter(img => !img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0);
        const rects = {};
        for (const text of texts) {
          const el = findTextNode(text);
          if (!el) { rects[text] = null; continue; }
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          rects[text] = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color };
        }
        return {
          bodyW: body.scrollWidth,
          viewportW: innerWidth,
          bodyH: body.scrollHeight,
          viewportH: innerHeight,
          app: { x: Math.round(appRect.x), y: Math.round(appRect.y), w: Math.round(appRect.width), h: Math.round(appRect.height) },
          overflowX: body.scrollWidth > innerWidth + 2,
          overflowing,
          images,
          brokenImages,
          rects,
        };
      }, texts);
      rows.push({ route, viewportName, errors, ...metrics });
      await page.close();
    }
  }
  await browser.close();
  fs.writeFileSync('audits/figma-fidelity/geometry-probe.json', JSON.stringify(rows, null, 2));
  console.table(rows.map(r => ({ route: r.route, viewportName: r.viewportName, errors: r.errors.length, bodyW: r.bodyW, viewportW: r.viewportW, bodyH: r.bodyH, overflowX: r.overflowX, images: r.images.length, brokenImages: r.brokenImages.length, appW: r.app.w })));
  const failed = rows.filter(r => r.errors.length || r.overflowX || r.brokenImages.length || Object.values(r.rects).some(v => v === null));
  if (failed.length) {
    console.error('Geometry probe failed', JSON.stringify(failed.map(r => ({ route: r.route, viewportName: r.viewportName, errors: r.errors, overflowX: r.overflowX, brokenImages: r.brokenImages, missing: Object.entries(r.rects).filter(([,v]) => v === null).map(([k]) => k) })), null, 2));
    process.exit(1);
  }
})();
