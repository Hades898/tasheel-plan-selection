// Typography fidelity probe.
//
// Verifies the two type systems required by the Figma spec
// (audits/figma-fidelity/BNPL_FIGMA_SPEC.md / figma-spec/*.json):
//   - Merchant checkout (Figma 355:58228) renders in Inter.
//   - App screens (home/detail/insights/purchases/dues) render in SF Pro.
//   - Representative text weights match the Figma style scale instead of the
//     over-heavy 800/900 approximation that makes the flow look off.
const { chromium } = require('playwright');
const fs = require('fs');

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4174/tasheel-bnpl-prototype';

// Each case: route, representative text to measure, expected family, expected
// computed weight. Weight mapping follows the Figma spec:
// regular=400, medium=500, semibold=600, bold=700.
const cases = [
  // Checkout / Inter
  { route: 'checkout', text: 'SMEG', expect: 'inter', weight: 700, surface: 'checkout', note: 'PDP brand = bold' },
  { route: 'checkout', text: "50's Retro Style", expect: 'inter', weight: 600, surface: 'checkout', note: 'PDP product title = semibold' },
  { route: 'checkout', text: 'Shop now, pay later!', expect: 'inter', weight: 800, surface: 'checkout', note: 'SNPL heading = extrabold' },
  { route: 'checkout', text: 'Split your Purchases your way!', expect: 'inter', weight: 700, surface: 'checkout', note: 'Tasheel card title = bold' },
  { route: 'checkout', text: 'Buy now with Tasheel', expect: 'inter', weight: 600, surface: 'checkout', note: 'Tasheel entry link = semibold' },

  // App / SF Pro
  { route: 'checkout/app-home', text: 'Your Next Payment', expect: 'sf', weight: 400, surface: 'app', note: 'caption label = regular' },
  { route: 'checkout/app-home', text: '4,250', expect: 'sf', weight: 700, surface: 'app', note: 'home hero amount = large title bold' },
  { route: 'checkout/app-home', text: '450', expect: 'sf', weight: 600, surface: 'app', note: 'ordinary card amount value = semibold' },
  { route: 'checkout/app-home', text: 'Pay now', expect: 'sf', weight: 500, surface: 'app', note: 'small button label = medium' },
  { route: 'checkout/app-home', text: 'My Dues', expect: 'sf', weight: 500, surface: 'app', note: 'action tile label = medium' },
  { route: 'checkout/app-home', text: 'Active Purchases', expect: 'sf', weight: 600, surface: 'app', note: 'section headline = semibold' },
  { route: 'checkout/app-home', text: 'View More', expect: 'sf', weight: 600, surface: 'app', note: 'link label = semibold' },
  { route: 'checkout/detail', text: 'Extrastores', expect: 'sf', weight: 600, surface: 'app', note: 'detail title = title medium semibold' },
  { route: 'checkout/detail', text: '3,666', expect: 'sf', weight: 600, surface: 'app', note: 'detail amount = semibold value' },
  { route: 'checkout/detail', text: 'Payment Schedule', expect: 'sf', weight: 600, surface: 'app', note: 'title S = semibold' },
  { route: 'checkout/detail', text: '916.50', expect: 'sf', weight: 600, surface: 'app', note: 'ordinary payment amount = semibold value' },
  { route: 'checkout/detail', text: 'Reference', expect: 'sf', weight: 400, surface: 'app', note: 'table label = regular' },
  { route: 'checkout/detail', text: 'TXN-2026-04152', expect: 'sf', weight: 600, surface: 'app', note: 'table value = semibold' },
  { route: 'checkout/purchases', text: 'My Purchases', expect: 'sf', weight: 700, surface: 'app', note: 'large title = bold' },
  { route: 'checkout/purchases', text: 'View all your purchases', expect: 'sf', weight: 400, surface: 'app', note: 'subtitle = regular' },
  { route: 'checkout/insights', text: 'Insights', expect: 'sf', weight: 600, surface: 'app', note: 'center title = semibold' },
  { route: 'checkout/insights', text: 'Spent in April', expect: 'sf', weight: 400, surface: 'app', note: 'insight label = regular' },
  { route: 'checkout/insights', text: '4,250', expect: 'sf', weight: 700, surface: 'app', note: 'insights hero amount = large title bold' },
  { route: 'checkout/insights', text: 'Transactions', expect: 'sf', weight: 600, surface: 'app', note: 'active tab = semibold' },
  { route: 'checkout/insights', text: 'Categories', expect: 'sf', weight: 400, surface: 'app', note: 'inactive tab = regular' },
  { route: 'checkout/insights', text: '1,785', expect: 'sf', weight: 600, surface: 'app', note: 'transaction amount = semibold value' },
  { route: 'checkout/dues', text: '1 Due Selected', expect: 'sf', weight: 400, surface: 'app', note: 'ring label = regular' },
  { route: 'checkout/dues', text: '1,800', expect: 'sf', weight: 700, surface: 'app', note: 'dues ring amount = bold emphasis' },
  { route: 'checkout/dues', text: 'Remaining', expect: 'sf', weight: 400, surface: 'app', note: 'dues remaining label = regular with SAR icon amount' },
  { route: 'checkout/dues', text: '1,800', expect: 'sf', weight: 700, surface: 'app', note: 'dues selected amount visible in ring/CTA' },
  { route: 'checkout/dues', text: 'Pay selected', expect: 'sf', weight: 500, surface: 'app', note: 'primary app CTA = medium' },
];

function classify(fontFamily) {
  const first = (fontFamily || '').split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
  if (first === 'inter') return 'inter';
  if (first === '-apple-system' || first.startsWith('sf pro') || first === 'blinkmacsystemfont') return 'sf';
  return `other:${first}`;
}

function normalizeWeight(fontWeight) {
  const value = String(fontWeight || '').trim().toLowerCase();
  if (value === 'normal') return 400;
  if (value === 'bold') return 700;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

(async () => {
  fs.mkdirSync('audits/figma-fidelity', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const rows = [];
  for (const c of cases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${base}/${c.route}?typo=${Date.now()}`, { waitUntil: 'networkidle', timeout: 30000 });
    const result = await page.evaluate((c) => {
      function findTextNode(text) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        let node;
        while ((node = walker.nextNode())) {
          const own = Array.from(node.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent || '')
            .join('')
            .replace(/\s+/g, ' ')
            .trim();
          if (own.includes(text)) return node;
        }
        return null;
      }
      const el = findTextNode(c.text);
      if (!el) return { found: false };
      const cs = getComputedStyle(el);
      let surfaceAttr = null;
      let p = el;
      while (p && p !== document.documentElement) {
        if (p.getAttribute && p.getAttribute('data-surface')) { surfaceAttr = p.getAttribute('data-surface'); break; }
        p = p.parentElement;
      }
      const interLoaded = typeof document.fonts !== 'undefined'
        ? document.fonts.check('16px Inter')
        : null;
      return {
        found: true,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        surfaceAttr,
        interLoaded,
      };
    }, c);
    const actual = result.found ? classify(result.fontFamily) : 'missing';
    const actualWeight = result.found ? normalizeWeight(result.fontWeight) : null;
    const familyPass = actual === c.expect;
    const weightPass = actualWeight === c.weight;
    const pass = familyPass && weightPass;
    rows.push({ ...c, ...result, actualFamily: actual, actualWeight, familyPass, weightPass, pass });
    await page.close();
  }
  await browser.close();

  fs.writeFileSync('audits/figma-fidelity/typography-probe.json', JSON.stringify(rows, null, 2));
  console.table(
    rows.map((r) => ({
      route: r.route,
      text: r.text.slice(0, 28),
      expectFamily: r.expect,
      actualFamily: r.actualFamily,
      expectWeight: r.weight,
      actualWeight: r.actualWeight,
      pass: r.pass,
    }))
  );

  const failed = rows.filter((r) => !r.pass);
  if (failed.length) {
    console.error(
      'Typography probe FAILED:',
      JSON.stringify(
        failed.map((r) => ({
          route: r.route,
          text: r.text,
          expectFamily: r.expect,
          actualFamily: r.actualFamily,
          expectWeight: r.weight,
          actualWeight: r.actualWeight,
          fontFamily: r.fontFamily,
          fontWeight: r.fontWeight,
          note: r.note,
        })),
        null,
        2
      )
    );
    process.exit(1);
  }
  console.log('Typography probe passed: checkout=Inter, app=SF Pro, representative weights match Figma scale.');
})();
