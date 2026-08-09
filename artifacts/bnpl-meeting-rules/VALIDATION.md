# Validation: BNPL Meeting Rules

## Source

- Tier: T3
- Figma: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=355-48766
- Nodes: checkout `355:58228`, tenure `1878:13247`, payment `1741:78226`, processing `1691:67680`, success `1691:67703`
- Root frame: 390 x 844
- Meeting authority: `screenshots/meeting-murabaha-reference.png`
- Source map: `figma/source-map.md`
- Design tokens: `figma/specs/design-system.json`
- Asset manifest: `figma/assets/asset-manifest.json`

## Assets

- Manifest: `figma/assets/asset-manifest.json`
- Nine existing Figma exports are SHA-256 tracked.
- Native screens reuse the existing Super App asset catalog.
- No generated or replacement brand artwork was added.
- Inline SVG reviewer triage: `App.tsx` contains inherited simple UI primitives such as chevrons, radio/check marks, progress gradients, and data-chart geometry. These are allowed layout/control primitives, not redraws of Figma logos, merchant marks, illustrations, or bespoke brand assets.

## Implementation

Web checkout:

- `App.tsx`
- `scripts/patch-gh-pages-export.cjs`
- `scripts/bnpl-meeting-rules-probe.cjs`
- `scripts/wc-flow-probe.cjs`

Native app:

- `AppModel.swift`
- `ContentView.swift`
- `EligibilityFlow.swift`
- `OfferReviewFlow.swift`
- `ContractSigningFlow.swift`
- `MeetingFlows.swift`
- `TabContents.swift`
- `PurchasesPage.swift`
- `PaySheet.swift`
- `MerchantCheckoutFlow.swift`

Implemented behavior:

- eXtra merchant profile includes category, product, branches, Google Maps link, store information, and checkout handoff.
- Checkout is cart-first, then mobile, OTP, IVR, tenure, Murabaha/payment review, processing, and success.
- Harun pricing is `SAR 7,000 - 10% = SAR 6,300`, with `SAR 5,000` financed and `SAR 1,300` down payment.
- 2 and 3 months are zero fee/interest; 4 months has a 1% fee and help disclosure.
- Pay requires both payment-method selection and Murabaha acceptance.
- Repayment cross-sell appears after the final installment and offers a SAR 10,000 World card.
- Existing-customer credit-card Apply Now starts at card naming and reuses the existing Nafath, IVR, and contract components.
- Existing-customer Personal Finance Apply Now starts at offer review and does not repeat collected onboarding data.
- Card completion activates the card and shows Apple Pay linkage.

## Checks

- Web production build: PASS (`npm run build`)
- Meeting business-rule probe: PASS (`node scripts/bnpl-meeting-rules-probe.cjs`)
- Full checkout-flow probe: PASS (`node scripts/wc-flow-probe.cjs`)
- Native iOS build: PASS (`xcodebuild -scheme "Super App" ...`)
- Simulator install and launch: PASS
- Runtime route/test-ID coverage: PASS
- Console/page errors during probes: none
- Existing route aliases and GitHub Pages export patch: preserved
- Golden preflight: executed; exact evidence headings fixed. Its lexical scan still reports inherited inline SVG and raw hex in `App.tsx`, reviewed below.

Probe outputs:

- `probes/bnpl-meeting-rules.json`
- `probes/wc-flow.json`

## Screenshots

Web:

- `screenshots/web-extra-cart.png`
- `screenshots/web-harun-ivr.png`
- `screenshots/web-tenure-3-month.png`
- `screenshots/web-tenure-4-month.png`
- `screenshots/web-tenure-6-month-rate-pending.png`
- `screenshots/web-murabaha-documents.png`
- `screenshots/web-payment-method-only-disabled.png`
- `screenshots/web-payment-ready.png`

Native:

- `screenshots/native-extra-merchant.png`
- `screenshots/native-card-upsell.png`
- `screenshots/native-apply-cc-short.png`
- `screenshots/native-card-nafath-reused.png`
- `screenshots/native-card-quick-call-reused.png`
- `screenshots/native-card-review-sign-reused.png`
- `screenshots/native-world-card-success.png`
- `screenshots/native-world-card-active.png`
- `screenshots/native-apply-pf-offer.png`

Visual review result: PASS. Text is readable, sticky controls do not overlap content, the payment CTA visibly changes between gated and ready states, and native short flows use the established component styling.

## Review Findings

- P0 scanner finding, triaged non-issue: inherited `react-native-svg` control and chart primitives are not Figma brand/custom-asset substitutions. New task assets are manifest-tracked.
- P1 scanner finding, triaged legacy debt: `App.tsx` contains a measured token block plus older raw style colors across the pre-existing prototype. New BNPL colors map to `figma/specs/design-system.json`; repository-wide extraction is outside this behavior change.
- P0: none in the requested flow after reviewer triage.
- P1: none in the requested flow after reviewer triage.
- P2: rates for 6, 9, 12, 24, and 36 months remain pending product input.

## Verdict

PASS with one explicit product-data waiver and two inherited-source preflight findings reviewed as non-blocking.

The meeting did not provide fee or Murabaha rates for 6, 9, 12, 24, or 36 months. These plans are visible but disabled as `Rate pending`; no rates were inferred. Existing Figma-exported assets were reused and hash-tracked, although their original export node IDs predate this work and are unavailable.
