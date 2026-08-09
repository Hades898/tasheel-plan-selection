#!/usr/bin/env node
const { chromium } = require('playwright');

const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout';
const failures = [];
const near = (actual, expected, tolerance, label) => {
  if (Math.abs(actual - expected) > tolerance) failures.push(`${label}: expected ${expected}±${tolerance}, got ${actual}`);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(`${base}/detail?transactionProbe=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="transaction-details-1966-34633"]', { timeout: 3000 });

  const top = await page.evaluate(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const scroll = document.querySelector('[data-testid="transaction-scroll-1966-34633"]');
    const text = document.body.innerText.replace(/\s+/g, ' ');
    return {
      text,
      scrollHeight: scroll?.scrollHeight,
      clientHeight: scroll?.clientHeight,
      screen: rect('[data-testid="transaction-details-1966-34633"]'),
      hero: rect('[data-testid="transaction-hero-1966-34923"]'),
      schedule: rect('[data-testid="transaction-schedule-section"]'),
      details: rect('[data-testid="transaction-purchase-details-section"]'),
      cta: rect('[data-testid="transaction-pay-next-installment"]'),
      header: rect('[data-testid="transaction-header-1966"]'),
      backHit: document.elementFromPoint(41, 87)?.outerHTML || '',
      timeHit: document.elementFromPoint(48, 28)?.textContent || document.elementFromPoint(48, 28)?.outerHTML || '',
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });

  for (const required of ['Extrastores', '25th of April, 2026', 'Active', '3,666', 'Payment Schedule', 'May 15th', 'Purchase Details', 'TXN-2026-04152', 'Pay next installment']) {
    if (!top.text.includes(required)) failures.push(`missing transaction text: ${required}`);
  }
  if (top.overflowX) failures.push('transaction screen has horizontal overflow at 402 viewport');
  near(top.screen.width, 402, 1, 'transaction root width');
  near(top.screen.height, 874, 1, 'transaction viewport height');
  near(top.scrollHeight, 1330, 3, 'transaction scrollHeight');
  near(top.hero.top, 0, 1, 'hero top');
  near(top.hero.height, 374, 1, 'hero height');
  near(top.header.top, 62, 1, 'header top');
  if (!top.backHit.includes('aria-label="Back"') && !top.backHit.includes('aria-label=\"Back\"')) failures.push('transaction back button is covered or not hit-test visible above hero');
  if (!String(top.timeHit).includes('9:41')) failures.push('transaction status time is covered or not hit-test visible above hero');
  near(top.schedule.top, 406, 2, 'schedule section top');
  near(top.schedule.height, 306, 8, 'schedule section height');
  near(top.details.top, 718, 2, 'details section top');
  near(top.details.height, 470, 8, 'details section height');

  const maxScroll = await page.evaluate(() => {
    const scroll = document.querySelector('[data-testid="transaction-scroll-1966-34633"]');
    scroll.scrollTop = scroll.scrollHeight;
    return scroll.scrollTop;
  });
  await page.waitForTimeout(80);
  const bottom = await page.evaluate(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    return {
      maxScroll: document.querySelector('[data-testid="transaction-scroll-1966-34633"]')?.scrollTop,
      header: rect('[data-testid="transaction-header-1966"]'),
      cta: rect('[data-testid="transaction-pay-next-installment"]'),
      details: rect('[data-testid="transaction-purchase-details-section"]'),
    };
  });
  if (bottom.header.bottom > 0) failures.push(`transaction header should scroll away at bottom, header bottom ${bottom.header.bottom}`);
  if (bottom.cta.left < 0 || bottom.cta.right > 402 || bottom.cta.bottom > 874 || bottom.cta.top < 0) failures.push(`transaction CTA clipped at bottom state: ${JSON.stringify(bottom.cta)}`);
  if (bottom.details.bottom > bottom.cta.top - 10) failures.push(`purchase details overlaps CTA at bottom state: details bottom ${bottom.details.bottom}, CTA top ${bottom.cta.top}`);

  await page.click('[data-testid="transaction-pay-next-installment"]');
  await page.waitForSelector('[data-testid="payment-method-sheet"]', { timeout: 2500 }).catch(() => failures.push('transaction CTA did not open payment method sheet'));

  await browser.close();
  if (failures.length) {
    console.error('transaction-details-figma-probe failed:\n' + failures.map(f => `- ${f}`).join('\n'));
    process.exit(1);
  }
  console.log(`transaction-details-figma-probe passed: scrollHeight=${top.scrollHeight}, maxScroll=${maxScroll}`);
})();
