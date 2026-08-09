# Task: Fix BNPL prototype font-weight fidelity

Repo: `/Users/hadysoliman/tasheel-bnpl-browser-prototype`

User correction: font weights are incorrect too.

Source of truth:
- `audits/figma-fidelity/BNPL_FIGMA_SPEC.md`
- Figma checkout frame: `355:58228`
- Figma app frames: home `1843:18080`, detail `814:24410`, dues `876:17923`, purchases `814:24392`, insights `1579:11144`

Important spec lines:
- Checkout uses Inter.
- App screens use SF Pro.
- App type styles:
  - large title 34/41 bold tracking 0.38
  - title medium 22/28 semibold tracking -0.2
  - title S 20/25 semibold tracking 0.38
  - headline 17/22 semibold tracking -0.41
  - body/callout 16/21 regular or semibold tracking -0.32
  - subhead 15/20 regular/semibold tracking -0.24
  - footnote 13/18 regular/semibold tracking -0.08
  - caption 12/16 regular
  - caption2 11/13 regular
  - app button large 17/22 medium tracking -0.41, labels around 15 medium
- Checkout spec:
  - Merchant title Inter Bold 18
  - subtitle Inter Regular 13
  - product title 15 semibold
  - meta 12 regular
  - price 16 bold
  - Payment Method Inter semibold 15
  - option text 14 regular, BNPL title 14 semibold, sub 12 regular
  - CTA Inter semibold 16

Problem:
`App.tsx` currently uses many `fontWeight: '900'`, `'800'`, and `'700'` values that make the UI much heavier than Figma. Do not change route map, text content, assets, or screen structure except if necessary to preserve visual fidelity.

Deliverables:
1. Patch `App.tsx` so weights align with the Figma spec. Prefer semantic mapping:
   - regular = `400`
   - medium = `500`
   - semibold = `600`
   - bold = `700`
   - avoid `800`/`900` unless a Figma style is actually extra-bold/black, which this spec does not call for.
2. Extend `scripts/typography-probe.cjs` so it verifies representative computed font weights, not only font family.
3. Run `npm run typecheck`, `npm run export:web`, and `npm run qa:typography`.
4. Write a concise report at `audits/figma-fidelity/claude-font-weight-fix-report.md` listing changed weight policy and verification output.

Use source-level Expo/RN-web code only. No screenshots. No full-screen image rendering.