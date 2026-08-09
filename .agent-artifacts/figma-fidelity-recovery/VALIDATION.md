# VALIDATION — Tasheel BNPL Figma Fidelity Recovery

## Verdict
BLOCKED FOR DEPLOY / PARTIAL SPEC-DRIVEN RECOVERY COMPLETE

This run moved the work from approximation toward a source-backed Figma-to-code workflow, but it is not a full fidelity pass and should not be deployed as final.

## Source
- Figma file: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL
- Checkout key frame: `355:58228`
- Home concrete frame: `1843:18080`
- Source map: `.agent-artifacts/figma-fidelity-recovery/FIGMA-SOURCE-MAP.md`
- Opus design authority: `.agent-artifacts/figma-fidelity-recovery/OPUS-DESIGN-AUTHORITY.md`

## Implemented slice
- First bounded implementation slice only: Home asset-fidelity pass.
- Replaced hand-drawn Home action icons with Figma-exported public assets:
  - `public/figma/homeDuesIcon.png`
  - `public/figma/homePurchasesIcon.png`
  - `public/figma/homeInsightsIcon.png`
- Replaced hand-drawn merchant logo badges with Figma-exported public assets:
  - `public/figma/extraLogo.png`
  - `public/figma/jarirLogo.png`
  - `public/figma/noonLogo.png`
- Added/used source mappings/testIDs for the first slice:
  - `app-home`
  - `home-action-dues`
  - `home-action-dues-asset`
  - `home-action-purchases`
  - `home-action-purchases-asset`
  - `home-action-insights`
  - `home-action-insights-asset`
  - `merchant-extra`
  - `merchant-jarir`
  - `merchant-noon`

## Spec/artifact files
- `figma-spec/home.json`
- `figma-spec/checkout.json`
- `assets/figma/asset-manifest.json`
- `scripts/figma-geometry-probe.cjs`
- `audits/figma-fidelity/geometry-probe.json`
- `audits/figma-fidelity/screenshots/home-mobile.png`
- `audits/figma-fidelity/screenshots/home-short.png`
- `audits/figma-fidelity/screenshots/checkout-mobile.png`
- `.agent-artifacts/figma-fidelity-recovery/codex-review.md`

## Checks run
- `npm run typecheck` — passed.
- `rm -rf dist && npm run export:web` — passed.
- `npm run qa:in-app` — passed for mobile, short, and desktop route checks.
- `QA_BASE_URL=http://127.0.0.1:4174 node scripts/figma-geometry-probe.cjs` — passed as a route/image/overflow probe.
- Browser DOM check for `/checkout/home` — 7 `/figma/` images complete with nonzero natural dimensions.
- Browser visual check for `/checkout/home` — Home action icons and merchant logos visibly render.

## Important limitation
`scripts/figma-geometry-probe.cjs` is not yet a true Figma fidelity probe. It confirms image loading, text presence, console health, overflow, and high-level rect data, but does not yet compare actual runtime geometry/styles against `figma-spec/*.json` with deltas and tolerances.

## Codex review
Codex verdict: BLOCKED.

Primary blockers:
- Missing measured specs for detail, dues, purchases, insights.
- Riyal mark is still not exported and source still uses a text glyph.
- Dues ring, checkout browser controls, status/device icons, and nav icons still contain recreated source rather than fully source-exported assets or waivers.
- No true expected-vs-actual Figma geometry/style probe yet.
- No full contact sheet/diff for the whole routed slice.

Review path:
`.agent-artifacts/figma-fidelity-recovery/codex-review.md`

## Deploy decision
Do not deploy this as final Figma fidelity.

Safe to keep as a local partial recovery slice. The first slice fixes the worst Home asset-substitution issue, but the full flow remains blocked until the next measured extraction/implementation pass covers the remaining screens and assets.

## Next recommended slice
1. Export/implement the real Riyal vector.
2. Replace DuesRing with exported `duesTrack`, `duesFilled`, `duesDot`, and `progressThumb` or document an explicit waiver.
3. Add measured `figma-spec/*.json` for Dues and Purchases.
4. Upgrade `scripts/figma-geometry-probe.cjs` to compare expected vs actual values with tolerance thresholds.
5. Capture Figma/live/contact-sheet evidence for Home + Dues before any deploy.
