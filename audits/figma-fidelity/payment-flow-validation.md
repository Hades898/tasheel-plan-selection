# Payment Method Flow Validation

Scope: Add and repair the payment method flow from Figma node `816:47301`, Add new card from Figma section node `1986:17197` (`1966:46187` empty Add New state and `1986:16800` filled Added New state), OTP from Figma node `814:24658` plus the user-supplied Verify payment screenshot, processing/buffer from Figma node `814:24673`, in-app success from Figma node `814:24721`, and transaction details from Figma node `1966:34633`.

No deploy was performed.

## Figma source

- Payment method selected / sheet: `816:47301`
- Add new card: section `1986:17197`, empty Add New state `1966:46187`, filled Added New state `1986:16800`
- OTP / Verify payment: `814:24658` plus user-supplied OTP screenshot `/Users/hadysoliman/.hermes/images/clip_20260609_160024_8.png`
- Bank authorization processing buffer: `814:24673`
- Successful purchase / in-app success: `814:24721`
- Payment status section: `814:24670`
- Figma screenshots captured:
  - Payment method: `/Users/hadysoliman/.hermes/image_cache/img_af75c3491c0c.png`
  - Bank buffer: `/Users/hadysoliman/.hermes/image_cache/img_e47dfb3a320b.png`
  - Successful purchase processing: `/Users/hadysoliman/.hermes/image_cache/img_12a2f5ee892d.png`
  - Successful purchase: `/Users/hadysoliman/.hermes/image_cache/img_0ff39448959f.png`

## Root cause of the previous inaccuracy

The first pass incorrectly treated the payment success route as a generic app success state after only using the supplied payment-sheet and bank-buffer nodes. That produced AI-invented UI:

- fake checkmark icon instead of Figma `Celebration Graphic`
- invented `Payment successful` copy instead of `Purchase Successful!`
- invented CTA (`View purchase` / `Back to BNPL home`) instead of Figma redirect copy
- missing source merchant logo asset on the success card
- success spacing based on generic centered status screen, not Figma geometry
- processing bar was static and auto-advanced too quickly for verification

Corrective rule: payment success/buffer screens must be frozen by Figma node ID and built from `get_design_context` + exported assets before completion. Text/route QA is not enough.

## Source changes

- `App.tsx`
  - Added payment and success assets to `figmaAssets`.
  - Removed the web/merchant success experience from the in-app success route: no Extrastores merchant card, no redirect-to-merchant text, no Safari/browser chrome, no `extrastores.com`.
  - Reworked payment method sheet with Figma card/Apple Pay/add-card icons.
  - Added `PaymentReviewCard` so payment amount is derived from selected dues.
  - Reworked Add new card from the old invented full-page debit-card preview into the Figma `1986:17197` bottom-sheet states: empty `1966:46187` with scrim + iOS numeric keyboard, and filled `1986:16800` without keyboard.
  - Made Add new card functional: real `TextInput` fields for card number / expiry / CVV, formatted native typing, custom keypad entry for the active field, disabled CTA until valid, CTA routes to OTP, scrim and grabber close the sheet.
  - Added payment-method sheet motion and backdrop repair: clean non-interactive Dues backdrop under scrim (no leaked back/X controls), animated sheet entrance/exit, animated scrim close, and corrected Apple Pay SVG aspect ratio/render box.
  - Added expiry calendar behavior: real calendar icon in the expiry field, tappable calendar picker with month choices, picker writes `MM/YY`, and custom keyboard hides while the calendar is open.
  - Added animated keyboard dismissal: when the card form becomes valid, the custom keypad slides/fades down before unmounting instead of disappearing instantly.
  - Fixed OTP header interaction/identity: removed the top-right X close affordance, replaced it with a dummy GCC bank logo, gave the back button a protected hit target, and added a click regression that routes back to the selected payment-method sheet.
  - Added processing/buffer screen using Figma hourglass asset.
  - Animated processing bar using React Native `Animated`; verified width changes at runtime.
  - Replaced generic payment-success state with Figma success frame `1691:67703` structure:
    - Figma celebration asset
    - merchant card with Figma merchant logo asset
    - review card
    - download card
    - redirect text
    - compact browser chrome + home indicator
  - Removed fake checkmark and invented success CTA.
  - Fixed no-scroll screen heights and success geometry so browser chrome lands at Figma y=752 in the runtime viewport.
- `public/figma/`
  - `paymentCardIcon.svg`
  - `paymentCardAddIcon.svg`
  - `paymentApplePay.svg`
  - `paymentHourglass.png`
  - `paymentSuccessCelebration.png`
  - `paymentSuccessMerchant.png`
  - `browserReload.svg`
  - `browserSiteSettings.svg`
- `scripts/payment-flow-fidelity-probe.cjs`
  - New regression gate for processing animation and success Figma fidelity.

## Runtime flow verified

Primary add-new-card path:

1. `/checkout/dues`
2. click `pay-selected-dues`
3. `/checkout/payment-method`
4. click `payment-row-add`
5. `/checkout/payment-method/add-card`
6. click `add-card-continue`
7. `/checkout/otp`
8. click `otp-verify-pay`
9. `/checkout/processing`
10. animated bar is observable
11. auto-advance to `/checkout/success`

Debit-card path:

1. `/checkout/payment-method`
2. click `payment-row-card`
3. `/checkout/payment-method/selected`
4. click `payment-pay-cta`
5. `/checkout/otp`

## Checks run

- `npm run typecheck` passed.
- `npm run export:web` passed.
- `node scripts/in-app-qa.cjs` passed.
- `node scripts/figma-geometry-probe.cjs` passed.
- `node scripts/payment-flow-fidelity-probe.cjs` passed.
- Static export contains payment/success Figma assets in `dist/figma`.

## New hard regression checks

`node scripts/payment-flow-fidelity-probe.cjs` now fails if:

- OTP header regresses: `scripts/payment-flow-fidelity-probe.cjs` verifies the X close button is absent, dummy `otp-gcc-bank-logo` exists, and clicking `otp-back` routes to `/checkout/payment-method/selected` with the selected payment sheet visible.
- Payment method sheet feels static/buggy: `scripts/payment-method-motion-asset-probe.cjs` verifies clean dimmed backdrop with no header back/close controls, animated sheet entrance, animated scrim close back to Dues, and loaded/non-cropped Apple Pay asset.
- Add new card empty state is missing Figma node `1966:46187` text/structure: `Add new card`, `Card Number`, `Expiry Date`, `MM/YY`, `CVV`, `Processing fee`, `Free`, `Amount to pay`, `800`, disabled `Add card and pay`.
- Add new card empty state leaks the old invented full-page content: `Use another debit card for this payment.`, preview debit card, `4111 1111 1111 4521`, `New debit card •••• 4521`, or `Add card and continue`.
- Add new card empty geometry drifts: sheet y=89/h=505, fields y=180/h=186, review y=386/w=370, CTA y=510/w=370, keyboard y=556, no CTA/review overlap, no literal `calendar` text.
- Add new card keyboard tap does not advance to the filled `1986:16800` state, or the filled state lacks `1111 2222 3333 4444`, `05/29`, `123`, active `Add card and pay 800`, no keyboard, sheet y=385, review y=682, CTA y=806.
- Add new card is static: `scripts/add-card-clickability-probe.cjs` verifies outside scrim close, grabber close, calendar picker open/select, native typing, custom keypad typing, animated keyboard close after valid fields, CTA enabling after valid fields, and CTA navigation to OTP.
- OTP does not start blank, or `Verify and pay` is enabled before 4 digits.
- OTP keyboard taps `1`, `2`, `3`, `4` do not fill all 4 visible boxes immediately.
- OTP lacks visible iOS numeric keyboard or has horizontal overflow.
- OTP header/subtitle overlaps `Enter OTP`, title stack/boxes are too compressed, CTA overlaps the review card, CTA overlaps keyboard, or keyboard is clipped.
- Processing bar width does not change over time.
- Processing title does not use Figma ellipsis text `Authorizing payment…`, processing does not carry `2,400` in direct Figma/probe mode, processing track is not 288×12, or Figma hourglass asset is missing.
- In-app success uses a fake `✓` glyph, leaks Safari/browser chrome or `extrastores.com`, lacks Figma text from node `814:24721`, misses the celebration asset, overflows horizontally, or drifts on key geometry.

`node scripts/transaction-details-figma-probe.cjs` now fails if:

- `/checkout/detail` is not sourced to Figma node `1966:34633` with 402×1330 scroll content.
- Hero/header/schedule/details anchors drift from Figma metadata: hero y=0/h=374, header y=62, schedule y=406, details y=718.
- The transaction frame has horizontal overflow, missing core text, or broken bottom scroll geometry.
- Bottom CTA/home state is clipped, overlaps the purchase details card, or does not open the payment-method sheet.
- Header/status remains sticky over scrolled content instead of belonging to the scroll frame, or the top white hero layer covers the status bar/back button. The probe hit-tests the back icon and `9:41` directly.

Latest audited probe result:

- Processing animated width: `11.609375 -> 268.09375`.
- Direct Add new card empty state: Figma node `1966:46187`, amount `800`, disabled `Add card and pay`, sheet y=89/h=505, keyboard y=556.
- Add new card filled state: Figma node `1986:16800`, filled values `1111 2222 3333 4444`, `05/29`, `123`, active `Add card and pay 800`, sheet y=385.
- OTP header/back probe passed: X close removed, dummy GCC bank logo visible, and back click routes to selected payment-method sheet.
- Payment method motion/asset probe passed: clean dimmed backdrop, animated sheet entrance, animated scrim close, and Apple Pay asset rendering.
- Add new card clickability probe passed: scrim close, calendar picker, native typing, animated keyboard close, custom keypad typing, CTA navigation, and grabber close.
- OTP starts blank, CTA is disabled before 4 digits, then visible keyboard taps fill 4 boxes.
- Success text has no `extrastores.com`, no merchant redirect, and no Safari/browser chrome.
- Transaction details node `1966:34633` probe passed with `scrollHeight=1330`, `maxScroll=456`, CTA visible at bottom state, and payment-method sheet opens from CTA.

## Screenshots

- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-method-sheet-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/add-card-1986-17197-empty-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/add-card-1986-17197-filled-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/add-card-functional-typed-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/otp-gcc-bank-back-fixed.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-method-motion-backdrop-fixed.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/add-card-calendar-picker-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/add-card-keyboard-closed-after-typing-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-add-new-card-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-otp-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/add-new-card-1966-46187-audited-v2.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/otp-814-24658-keyboard-audited-v2.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-processing-animated-final.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-success-814-24721-fixed-v2.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-method-sheet-viewport-fixed.png`

- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-method-safe-area-iphone-se-top-left.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/otp-safe-area-iphone-se-top-left.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/payment-method-safe-area-iphone-14-top-left.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/otp-safe-area-iphone-14-top-left.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/transaction-details-1966-34633-viewport-top-v2.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/transaction-details-1966-34633-viewport-bottom-v2.png`
- `/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/figma-fidelity/transaction-details-1966-34633-header-fixed.png`

## Notes / waivers

- Direct payment-flow deep links use a 2-dues Figma fixture amount (`2,400`) so the supplied Add Card/OTP screenshots can be validated without first clicking through Dues.
- Normal in-app Dues → payment flow preserves the actual selected dues amount; audited default selected amount is `1,800` and is guarded in `payment-flow-fidelity-probe.cjs`.
- Add-card and OTP are now tied to exact corrected sources: Add new card node `1966:46187` plus screenshot, OTP node `814:24658` plus screenshot.
- The Add Card screen intentionally displays the source screenshot’s prototype card fixture; no card details are submitted or stored.
- Existing full route map was preserved. No deploy was performed.
- Transaction details now follows Figma node `1966:34633` as a 402×1330 scroll frame. Header/status are part of the scroll frame, not sticky overlays, and the CTA/home indicator live at the bottom of the transaction content.
- Action sheets: Dues selector source has outside-scrim close; payment method sheet now has `payment-method-scrim` outside-tap close back to Dues.
- Safe-area/height: fixed Figma screens now scale from the 402×874 design viewport on short/narrow iPhones using explicit top-left transform compensation, so primary CTAs/keyboards do not clip under the notch/home area. Verified by `scripts/action-sheet-safe-area-probe.cjs` on iPhone SE, 390×844, 402×874, and 430×932; the probe also asserts every OTP custom-keyboard key is visible.
