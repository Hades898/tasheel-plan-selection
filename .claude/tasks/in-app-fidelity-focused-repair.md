# Focused Figma-to-Expo repair: inner app screens only

Repository: `/Users/hadysoliman/tasheel-bnpl-browser-prototype`

User intent:
- Preserve the existing hosted checkout flow and its routes. Do not rewrite or narrow checkout.
- Repair only the in-app screens after tapping `Proceed with Tasheel BNPL`.
- Use Expo / React Native Web primitives already in the project: `View`, `Text`, `Pressable`, `Image`, `react-native-svg`.
- No Tailwind, no screenshots, no fake browser chrome in the app section.
- Use SF Pro typography and Figma design-system/icon assets.
- Use the Figma source-of-truth nodes below.

Figma source nodes already extracted via Figma MCP:
- App flow parent: `814:23900`
- App home: `1843:18080`
- Purchases: `814:24392`
- Dues: `1843:17915`
- Transaction detail: `814:24410`
- Insights: `1579:11144`
- Checkout source: `355:48766`, but preserve current checkout behavior.

Figma tokens to enforce:
- Screen width: 402
- Screen height baseline: 870/890; long detail may scroll
- Font family: SF Pro for title and content styles
- bg_canvas #f9fafb
- bg_surface #ffffff
- bg_primary #022b10
- text_on_primary #3eff00
- text_primary #030712
- text_secondary #4b5563
- text_success #166534
- border_default #e5e7eb
- border_subtle #f3f4f6
- Headline/body sizes: large title 34/41, title 28/34, headline 17/22, callout 16/21, footnote 13/18, caption 12/16, caption2 11/13

Existing extracted assets:
- `assets/figma/extraLogo.png`, `jarirLogo.png`, `noonLogo.png`
- `assets/figma/levels.svg`
- `assets/figma/homeDuesIcon.png`, `homePurchasesIcon.png`, `homeInsightsIcon.png`
- `assets/figma/duesTrack.svg`, `duesFilled.png`, `duesDot.svg`
- `assets/figma/paymentLineTall.svg`, `paymentLineShort.svg`, `progressThumb.svg`
- Extra raw Figma exports in `assets/figma/raw/`

Current issues to fix:
1. App section still visually downgrades compared with checkout/Figma because typography is generic and not consistently SF Pro.
2. Purchases page must match Figma source: top title area at 144px, title `My Purchases`, subtitle, pill tab bar, 370px purchase cards, details copy: `Samsung Galaxy S26`, `1 of 3 installments paid`, etc.
3. Dues screen must match Figma source: ring starts around top 128 with 320x251 sandbox geometry, selected rows 72px high, Pay selected button 370x50, correct ring text `4 Dues Selected`, amount `1,800`, `Remaining 1200` if implementing node 1843:17915.
4. Detail screen must match 814:24410: 370px white rounded hero card, 15px progress with thumbs/line assets if possible, schedule card rows, purchase details table, sticky-ish bottom CTA.
5. Use `levels.svg` in status strip instead of hand-built status icons where straightforward.
6. Preserve route map and deep links under `/tasheel-bnpl-prototype/checkout/...`.
7. Preserve checkout page and its CTA route to appHome.

Implementation boundaries:
- Edit `App.tsx` and supporting scripts only if necessary.
- Do not install dependencies.
- Keep TypeScript compiling.
- Do not deploy.

Verification to run after edits:
- `npm run typecheck`
- `npm run export:web`
- `npm run qa:in-app`
- `node scripts/figma-geometry-probe.cjs`

Return a concise report with files changed, key deltas, and any remaining fidelity risk.
