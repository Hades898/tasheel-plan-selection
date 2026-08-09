# UI Flow Repair Report — BNPL Figma node 814:23900

## Scope

Focused on UI/UX only: Figma flow mapping, route coverage, home crop/asset issues, back/close icons, SAR/Riyal SVG usage, and no-backend clickable prototype behavior.

## Repaired in this slice

- Added a Figma board flow map for node `814:23900` at `audits/figma-fidelity/flow-map-814-23900.md`.
- Expanded the browser prototype route map beyond the prior narrow set:
  - `/checkout/next-up`
  - `/checkout/payment-method`
  - `/checkout/payment-method/selected`
  - `/checkout/payment-method/add-card`
  - `/checkout/payment-method/added`
  - `/checkout/otp`
  - `/checkout/processing`
  - `/checkout/insufficient`
  - `/checkout/declined`
  - `/checkout/success`
  - aliases for `/checkout/insights/category` and `/checkout/insights/empty`
- Updated GitHub Pages export patching to generate deep-link alias HTML files for the new routes.
- Replaced raw Arabic Riyal glyph usage in the in-app UI with source Figma SAR/Riyal SVG assets (`riyalDark.svg`, `riyalOnPrimary.svg`).
- Fixed Detail table amounts so they render with the SVG currency mark instead of embedded `﷼` text.
- Added Figma home decorative assets (`homeElementA.svg`, `homeElementB.svg`) behind the home hero to address the odd cropped/plain home background.
- Preserved the Dues base screen and moved payment method into separate sheet routes so stale overlays do not hide the Dues route.

## Verified

- `npm run typecheck` passed.
- `npm run export:web` passed and copied 32 Figma assets plus 20 deep-link alias files.
- `node scripts/in-app-qa.cjs` passed.
- `node scripts/figma-geometry-probe.cjs` passed.
- `node scripts/typography-probe.cjs` passed.
- Additional Playwright route/image sweep passed for 16 current routes: 0 page errors, 0 broken images.
- Browser visual checks performed for:
  - `/checkout/app-home` — real action assets visible; home decor restored; SVG currency mark visible.
  - `/checkout/payment-method` — dimmed payment context and bottom-sheet flow visible with back/close controls.

## Remaining known fidelity gaps

- Payment method option icons are still simplified glyph placeholders for card/Apple/Google/add-card; they should be replaced with exact Figma-exported SVGs in the next fidelity pass.
- Insights category/empty routes are currently aliases to the main Insights screen; exact Figma variants still need implementation.
- Purchase detail bottom-sheet variants from `Purchase Plan Clicked` need exact node-by-node geometry if this flow is client-presentable.
- Some payment/status screens are route-complete, not exact Figma-perfect replicas yet; they unblock the missing-flow map but should get a second pass with extracted frame assets.
