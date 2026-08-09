# BNPL Figma fidelity spec v1

Source of truth only:
- Checkout route `/checkout`: Figma node `355:58228` inside section `355:48766`, frame name `6.0 — Extrastores Checkout`, 390x848.
- App home route `/checkout/app-home` and alias `/checkout/home`: Figma node `1843:18080`, frame name `BNPL Home`, 402x1033.
- Detail route `/checkout/detail` and alias `/checkout/details`: Figma node `814:24410`, frame name `Transaction details [flow]`, 402x1330.
- Dues route `/checkout/dues`: Figma node `876:17923`, frame name `6 Dues`, 402x890.
- Purchases route `/checkout/purchases`: Figma section `814:24389`; use frame `814:24392` `My purchases`, 402x918.
- Insights route `/checkout/insights`: Figma node `1579:11144`, frame name `Insights · Full history`, 402x870.

Hard constraints:
- Preserve full click flow and route aliases. Do not delete routes.
- Use real Expo / React Native Web components. Do not render full-screen screenshots as UI.
- Use exact Figma assets where the design supplies them. No emoji/generic approximations for logos, Riyal marks, device levels, ring, nav icons, decorative vectors, progress/thumb assets.
- If web-only CSS features are unavailable in RNW, approximate with RNW-supported equivalent but keep measured dimensions, positions, colors, text, and hierarchy.

Global app tokens from Figma `814:23900` / `355:48766`:
- App frame width: 402. Checkout frame width: 390. App canvas: #f9fafb. Surface: #ffffff.
- Primary text: #030712. Secondary text: #4b5563. Success text: #166534. Error text: #6e0f0d. Brand text: #16720b.
- Primary interactive background: #022b10. Text on primary / neon: #3eff00.
- Border default: #e5e7eb. Border subtle: #f3f4f6.
- Font family: SF Pro for app screens. Checkout uses Inter.
- App type styles: large title 34/41 bold tracking 0.38; title medium 22/28 semibold tracking -0.2; title S 20/25 semibold tracking 0.38; headline 17/22 semibold tracking -0.41; body/callout 16/21 regular or semibold tracking -0.32; subhead 15/20 tracking -0.24; footnote 13/18 tracking -0.08; caption 12/16; caption2 11/13 tracking 0.06. Button large 17/22 medium tracking -0.41 or label -0.2.
- Common app page width 402, horizontal content rail 16, card width 370. Common card radius 24. App CTA width 370, height 50, bg #022b10, radius 999, text #3eff00.
- Status bar: app screens 402x62 with padding top 21, bottom 19, horizontal 16. Time block 103x22, font SF Pro semibold 17 line 22. Levels asset 103x22.
- App header row: y=62, height 66. Round NTV buttons are 50x50, radius 999/120, bg rgba(255,255,255,0.2), shadow `0px 8px 40px rgba(0,0,0,0.12)`. Use exact chevron/x assets.
- iOS home indicator: bottom overlay height 34, black bar 144x5 at bottom 8; many screens have a bottom white gradient/fade above it.

Exact assets to use from `assets/figma/asset-manifest.json` after export:
- `levels.svg`: device levels/status icons.
- `extra-logo.png`, `jarir-logo.png`, `noon-logo.png`.
- `riyal-primary.svg`, `riyal-secondary.svg`, `riyal-success.svg`, `riyal-error.svg`, `riyal-on-primary.svg`, sizes vary by call site.
- `tasheel-logo-*` / nav icon vector assets if exported.
- `home-element-a.svg`, `home-element-b.svg` decorative background vectors.
- `home-dues-icon.png`, `home-purchases-icon.png`, `home-insights-icon.png`.
- `dues-track.svg`, `dues-filled.png`, `dues-dot.svg`.
- `payment-schedule-line.svg` / frame assets from detail.
- `browser-reload.svg`, `browser-site-settings.svg` for checkout browser chrome.

Checkout `355:58228` exact layout:
- Frame: bg white, width 390, height 848.
- Status row: h44, px24, py12, Inter 14, text #121212. Right text is `⦿ 📶 🔋`.
- Merchant header: h72, p16, gap2. `Extrastores` Inter Bold 18 #121212, subtitle Inter Regular 13 #666.
- Content frame: flex 1, p24, gap16.
- Product card: width full, bg white, border #dfe5e5 1, radius 12, p14, gap14. Thumb 48x48 bg #f7f7f7 radius 8, phone glyph text 20. Product title 15 semibold, meta 12 regular #666, price 16 bold.
- `Payment Method`: Inter semibold 15 #121212.
- Option rows: bg white, border #dfe5e5 1, radius 12, p16, gap12. Radio 20x20 border2 #dfe5e5. Text 14 regular #121212.
- Selected BNPL row: bg #f7f7f7, border #121212 2, radius 12, p16, radio 20 border2 #121212 with inner 10 #121212, title 14 semibold, sub 12 #666.
- CTA footer: pb24 pt16 px24. Button bg #121212, radius 14, py18, text Inter semibold 16 white.
- Browser chrome is part of checkout frame: Tabs Mode Compact at bottom, pt16 px28, back/reload buttons 48 circles blur, address bar 218x48 text `extrastores.com`, home indicator 144x5. Implement it because this is a web-checkout Figma experience, not app screen chrome.

Home `1843:18080` exact layout:
- Frame: 402x1033, bg #f9fafb. Top white panel 402x415. Decorative background elements at top/right using exported `home-element-a/b` vectors, not gradient substitute.
- Status bar at y=-0.38 h62.
- White bottom fade/home indicator overlay.
- Amount/pay block at x15.63 y140.5 w370, horizontal gap12. Amount container flex1, label `Your Next Payment` 12/16 #4b5563, amount row gap4, Riyal 24, amount `4,250.00` with 34/41 bold for main, 28 for dot, 16 for cents; sub `Jarir Store · due Apr 21` 12.
- Pay now button bg #022b10, px14 py7, radius999, text 15 medium #3eff00.
- Action row x15.63 y253.5 w370. Three actions, gap32. Each icon circle 70x70 bg white, border #f3f4f6, radius 9999, p12. Labels 13/18 medium #030712. Use exported action icon assets.
- Sticky logo icon at x16 y66.5 size48.
- Main content sheet at top 380, x centered, w402, bg #f9fafb, radius 32, p16, gap24.
- Section headers: title 16/21 semibold, View More 13/18 semibold #022b10 plus chevron 14.
- Active purchases carousel: row gap8 with 370-wide cards. Card bg white, border #f3f4f6, radius24, p16, gap12. Use extra logo 37, title 16, sub 12, status 12 #166534, progress 8 high with segmented gradient dashes, text `1 of 3 installments paid`, amount `450.00/mo`.
- Next up card: 370x223, bg white, border #f3f4f6, radius24, p16, gap17. Rows have logo 37, title 16, caption 12, amount 16, horizontal divider asset/1px.
- Bottom tab bar inside content: pb24 pt16 px24, tab container width352, glass bg/shadow, 4 tabs, BNPL selected with #f9fafb selection. Keep labels Home, Flash Cash, BNPL, Profile and exact icon assets.

Detail `814:24410` exact layout:
- Frame 402x1330 bg #f9fafb. Status y=-0.38 h62. Sticky header y62 with back button 50 at x16.
- Content column x0 px16 top136 w402 gap24. Cards are w370.
- TransactionDetails card: bg white, radius24, p16, w370. Top block gap24. Logo badge 55x55 p16 radius16 border #f3f4f6 with extra-logo asset 34x23. Title `Extrastores` 22/28 semibold #030712; date `25th of April, 2026 ` footnote 13/18 opacity64.
- Status `Active` at right 13/18 semibold #166534. Amount row Riyal 27, amount `3,666.00` 22/28 with regular cents.
- Progress h15 radius7.5: 1/4 filled gradient #3eff00 to #166534 then 3/4 #e5e7eb; thumb asset 13 at exact positions. Paid/remaining labels use 13 footnote and 17 amounts.
- Payment Schedule section title 20/25 semibold, card bg white radius24 p12 gap12. Next row with badge `Next`, date May 15th 17/22 #166534, sub 11/13, amount 916.50. Following rows use provided line/frame assets, dates June 15th, July 15th, August 15, amounts 916.50.
- Purchase Details section title 20/25. Review card bg white radius24 p16 gap16. Rows exactly: Total Amount 3,666; Monthly Payment 916.50; Installments 4 Installments; Next Due Date May 15th; Monthly Payment 916.50; Total Paid 916.50 success; Remaining 2,750 error; Reference TXN-2026-04152. Duplicate Monthly Payment is in Figma, keep it.
- CTA fixed at bottom above home indicator: width370, height50, bottom34, bg #022b10, radius999, text #3eff00, label `Pay Next Installment`.

Dues `876:17923` exact layout:
- Frame 402x890 bg #f9fafb. Status h62, header y62 h66 with back x16, close x/right16, centered Tasheel icon 50.
- DuesRing x41 y99 size320. Use exact assets: track at left20 top20 size280; filled img bottom/left per context; six dots 26 at coordinates: (163,22.4), (254.91,84.7), (254.91,209.3), (163,271), (39.09,209.3), (39.09,84.7). Center top117.5 left105, text `3 Dues Selected`, Riyal 24, amount `3,000`, sub `Remaining 1800`.
- List x0 px16 top419 w402 gap10. Rows w370 h72 radius24 p16. Selected rows bg #edf3ef border #16720b. Row logo 40, title 16/21 semibold, caption 11/13, amount 17/18, sub `2 of 4`.
- Row data: Extra Stores 1,800 selected; Jarir 600 selected; Jarir 600 selected; Jarir 600 not selected. Caption formatting exactly `In 2 days  - April 20th` or `In 7 days  - April 27th`.
- More row h35: `+5 More next up payments` and `View all` pill with chevron.
- Bottom CTA area: `Pay selected` + Riyal + `3,000`, width370 h50, bottom above gradient/home indicator.
- This frame includes a dark overlay and sheet bottom (selection modal) in design context. The current route can show base dues state by default; clicking View all or rows may show sheet if implemented. If time-limited, match visible base state first and preserve interaction.

Purchases `814:24392` exact layout:
- Frame 402x918. Status h62, Header h66. Content top144.
- Title block x16 y0 w370 h67. `My Purchases` 370x41, `View all your purchases` 143x18 at y49.
- Tab Bar x16 y91 w370 h44.
- Purchase list x16 y159 w370 h547. Cards at y0 h129, y145 h126, y287 h122, y425 h122. Details card: bg white border/subtle radius24 p16. Logo 37, title `Extrastores`, subtitle `Samsung Galaxy S26`, status text, progress width338 either h15 or h8. Text `1 of 3 installments paid`, amount `450.00/mo`.

Insights `1579:11144` exact layout:
- Frame 402x870 bg #f9fafb. Status h62, header y62 h66. Back button x16, centered title `Insights`, right month pill/button x296 w90 h45 with April and chevron.
- Content x0 px16 top144 w402 gap24.
- Hero: `Spent in April`, amount row Riyal 34 + `4,300` 34/41, chart 370x154. Chart bars: Nov 38, Dec 66, Jan 48, Feb 78, Mar 62, Apr 90. Bars 20 wide radius6. Apr has label 4.3k, gradient #3eff00 to #166534, underline 24x2.
- Tab Bar: p4, height around 44, Transactions selected with bg #e5e7eb radius100, text 17 #166534; Categories unselected.
- Transaction rows: w370 h72 bg white radius24 p16, logo 37, title 16, caption, amount 17. Rows: Extrastores Apr 15th · Paid 600; Jarir Apr 20th · Paid 600; Jarir Apr 20th · Paid 600; Noon Apr 15th · Paid 600.

Implementation notes:
- RNW does not support all Tailwind web effects, but supports `boxShadow` and many absolute/flex layouts. Use absolute positioning inside a fixed-width `ScreenFrame` for frame fidelity where needed, with route-level outer centering and scroll for frames taller than viewport.
- Prefer Image with `{ uri: assetPath }` for exact exported assets. For deploy, assets must be local paths under project, not localhost URLs.
- The prior `AppShell` can remain for outer centering/routing, but the actual screen content should be fixed 390 or 402 width frame, not max 430 adaptive approximation.
- Annotate important rendered elements with `dataSet={{ nodeId: '...' }}` or testID so geometry QA can assert them.
