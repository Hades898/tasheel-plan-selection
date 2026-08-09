# Codex review: BNPL font-weight fidelity fix

Repo: `/Users/hadysoliman/tasheel-bnpl-browser-prototype`

Review only the current diff for typography/font-weight fidelity. The user corrected that font weights are wrong.

Source of truth:
- `audits/figma-fidelity/BNPL_FIGMA_SPEC.md`
- `figma-spec/checkout.json`
- `figma-spec/home.json`

Expected policy:
- Checkout uses Inter and the Figma weights: title bold 700, subtitle/options/subcopy regular 400, product title/payment heading/selected BNPL/CTA semibold 600, price bold 700.
- App screens use SF Pro and the Figma iOS-style weights: labels/captions regular 400, small buttons medium 500, headings/titles/links/values semibold 600, large page title bold 700.
- Avoid 800/900 except if source Figma explicitly calls for extra-bold/black. It does not here.

Files changed:
- `App.tsx`
- `scripts/typography-probe.cjs`
- package/report artifacts may be present.

Checks already run by Hermes:
- `npm run typecheck` passed
- `npm run export:web` passed
- `npm run qa:typography` passed with 26/26 family+weight cases
- `npm run qa:in-app` passed
- `node scripts/figma-geometry-probe.cjs` passed

Please review as P0/P1/P2:
- P0: route/source/deploy safety broken, runtime errors, tests invalid/faked
- P1: significant font-weight mismatch with spec, probe misses an obvious critical text, over-heavy 800/900 remains on visible text without waiver
- P2: minor/optional refinements

Return verdict: PASS or BLOCK, with exact file/line references.