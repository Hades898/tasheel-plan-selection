# Clickability + UI Bug Hunt Report

## Trigger

User reported the flow still felt broken/static, especially the Dues screen, and asked for a UI bug hunt with more clickable behavior.

## Patches made

- Dues rows are now real interactive buttons with `accessibilityRole="button"` and selected state.
- Dues screen now keeps selection state in React state:
  - default state matches Figma copy: `4 Dues Selected`, amount `1,800`.
  - tapping a due row toggles its selected/unselected visual state.
  - ring label and amount update immediately.
  - CTA amount updates immediately.
  - CTA disables with a “Select dues to pay” state if nothing is selected.
- Dues “View all” now routes to `/checkout/next-up` instead of a generic purchases route.
- Next Up rows are now clickable/toggleable too, with dynamic total and CTA state.
- Detail CTA now routes into the payment-method flow instead of jumping back home.
- Insights is no longer static:
  - month pill cycles months.
  - chart month labels are clickable.
  - Transactions/Categories tabs are real tab buttons.
  - Categories tab renders category rows instead of static transaction content.
- Previously patched icon/currency issues remain:
  - lighter inline back/close SVGs.
  - Figma SAR/Riyal SVG marks instead of raw Arabic glyphs.
  - improved Jarir crop.

## Verification

Commands passed:

```bash
npm run typecheck
npm run export:web
node scripts/in-app-qa.cjs
node scripts/figma-geometry-probe.cjs
node scripts/typography-probe.cjs
```

Interactive Playwright click checks passed:

- Dues initial state shows `4 Dues Selected` and `1,800`.
- Clicking a Jarir row updates Dues to `3 Dues Selected` and `1,200`.
- Dues “View all” routes to `/checkout/next-up`.
- Next Up row click updates its selected total.
- Insights Categories tab renders category content.
- Chart month click updates the month context.
- Detail “Pay Next Installment” routes to `/checkout/payment-method`.

Browser visual check:

- Verified Dues after row click: selected count/amount changed, row selected state changed, CTA amount changed, and the back icon remains lightweight.

## Remaining UI issues / next pass

- Dues ring graphic is still visually static; the text/amount/rows update, but the ring arc itself does not yet redraw per selected total.
- Payment method option icons remain placeholder glyphs and need exact Figma-exported assets.
- Some route-complete variants (Insights empty/category, payment status screens) are interactive enough for flow review but not exact Figma-perfect replicas yet.
