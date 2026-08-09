# Dues Perfect Engine Validation

## Trigger

User rejected the previous Dues implementation because the math, `View all`, and ring were still not product-coherent. User asked for Grok/Codex/Claude to dive deeper and for a PE-perfect happy case and worst-case scenario.

## Agent review synthesis

Three review lanes were run:

- Claude/Opus-style design authority: treat Figma 1843:17915 as visual language, not a valid static data contract, because its hardcoded strings contradict each other.
- Codex-style technical audit: centralize due data and selection state; stop duplicating Dues/NextUp data; propagate selected amount into payment method.
- Grok-style skeptical product review: `+5 More` must reveal five hidden payments; ring semantics must be explicit; payment method must never revert to a stale amount.

## Implemented engine

### Canonical data

Dues now come from one shared `DUE_ITEMS` dataset with nine upcoming due instances.

Visible preview rows:

1. Extra Stores — iPhone 16 Pro Max — 1,800 — In 2 days / Apr 20 — 2 of 4
2. Jarir — MacBook Air M4 — 600 — In 9 days / Apr 27 — 2 of 4
3. Noon — AirPods Pro — 300 — In 16 days / May 4 — 2 of 3
4. Jarir — iPad Air — 300 — In 23 days / May 11 — 3 of 4

Hidden rows revealed by View all:

5. Extra Stores — Dyson V15 — 300 — In 30 days / May 18 — 3 of 4
6. Jarir — Gaming Monitor — 600 — In 37 days / May 25 — 3 of 4
7. Noon — Apple Watch — 300 — In 44 days / June 1 — 3 of 3
8. Extra Stores — iPhone 16 Pro Max — 300 — In 51 days / June 8 — 4 of 4
9. Jarir — MacBook Air M4 — 600 — In 58 days / June 15 — 4 of 4

`+5 More next up payments` is now computed from data: `9 - 4 = 5`.

### Math invariants

Derived from one source of truth:

- selectedCount = count(selected due IDs)
- selectedAmount = sum(selected due amounts)
- visibleTotal = first four due total = 3,000
- totalAmount = all nine due total = 5,400
- remainingVisibleAmount = max(0, visibleTotal - selectedAmount)
- CTA amount = selectedAmount
- ring amount = selectedAmount
- payment method amount = selectedAmount

### Happy case

Default route `/checkout/dues`:

- nearest due selected by default
- 1 Due Selected
- selected amount 1,800
- Remaining 1,200
- Pay selected 1,800
- +5 More next up payments

### Worst-case / edge states

Verified:

- zero selected: 0 Dues Selected, selected amount 0, CTA disabled with `Select dues to pay`
- all visible selected: 4 Dues Selected, 3,000, remaining 0, CTA/payment method carry 3,000
- hidden rows available: View all opens sheet with all 9 rows
- adding a second due from sheet updates to 2 Dues Selected / 2,400
- selected amount propagates into Payment Method instead of reverting to 1,800

## Ring update

- Changed ring progress to amount-based against the visible dues window: selectedAmount / visibleTotal.
- Default 1,800 / 3,000 now renders as ~60% arc, which matches the money-dominant center copy better than count-based 1/9.
- Kept six Figma-style markers as progress anchors instead of drawing nine tiny markers.
- Removed the weird halo/blob artifact.
- Softened marker colors and gradient so it feels less chart-like.

## Verification

Commands passed:

```bash
npm run typecheck
npm run export:web
node scripts/in-app-qa.cjs
node scripts/figma-geometry-probe.cjs
node scripts/typography-probe.cjs
```

Interactive Playwright checks passed:

- default coherent state
- hidden count visible and computed
- View all reveals all 9 dues
- adding second due updates to 2,400
- all visible selected updates to 3,000
- Payment Method carries selected 3,000
- zero selected disables CTA
- ring dash changes after selection change

## Visual QA

Browser visual check completed at:

`http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/dues?finalengine=visual`

Observed:

- no weird dot blob
- softer ring/dots
- default amount-based arc is visible
- rows show merchant + product + staggered dates
- +5 more is meaningful

## Remaining honest caveat

The ring is now behavior-correct and visually cleaner, but still reconstructed SVG rather than a direct exported Figma animated/variant asset. If the next bar is literal pixel-perfect ring artwork, the next step is to export/source the Figma ring layers as a spec and reproduce its exact arc path/dot SVGs per state.
