# Merchant web-checkout new-user flow — validation (2026-06-10)

Source: Figma section `355:48766` "Merchant web-checkout - New User", file `geEFxJ11n2KySAZB6zsjEh`.
Scope: happy path (user-confirmed); Nafath identity; iOS-accurate notification (no Figma frame exists).
No deploy was performed.

## Flow (all routes live, fully interactive — nothing static)

1. `/checkout` — Extrastores merchant page (`355:58228`, Inter surface). Rebuilt from design
   context: emoji product thumb (was an agent-drawn SVG — removed), exact borders/radii/colors,
   selectable payment methods, Safari compact tab chrome with real reload/site-settings assets.
2. `/checkout/onboarding/mobile` (`355:45048`) — onboarding header (x-close `#DADADA` DS vector,
   Tasheel wordmark SVG, عربية), editable +966 phone field (real Saudi-flag vector), CTA disables
   on invalid length, "Use a different one" clears.
3. `/checkout/onboarding/otp` (`355:45094`) — live 01:30 countdown, digit pop animation, active
   box w/ `#23a107` border + neon glow, Edit pill returns to mobile, subtitle shows the typed number.
4. `/checkout/onboarding/identity` (`1628:32393`) — ID + DOB fields with auto-format, Yaqeen
   shield note, functional iOS calendar popover (`1628:32758`): month nav, day pick, Reset, confirm.
5. `/checkout/onboarding/nafath` (`1929:61813`) — real نفاذ mark in teal circle, per-session random
   2-digit code, 4-step card, CTA → "Waiting for approval…" pulse → auto-approve.
6. `/checkout/onboarding/tenure` (`1878:13093/13247/1865:3575`) — live −/+ stepper (2–4 months),
   neighbor numbers shift, amounts crossfade. Math is coherent and anchored to the Figma 3-month
   fee fixture: cart 4,250.25, `fee(n)=27.65×(n−1)` (3mo → 55.30 exactly as in the source copy),
   equal split with the down payment absorbing rounding. "View plan details" opens the
   `2003:12123` sheet with live numbers.
7. `/checkout/onboarding/payment` (`1961:27293`) — plan summary carries the chosen tenure
   (badge, today/monthly), Change → tenure, Details → sheet; selectable Apple Pay / mada debit /
   VISA debit rows (real exported brand assets), networks row, disclaimer; Pay CTA shows the live
   down payment. Apple Pay triggers the real native ApplePaySession sheet on iOS Safari over
   HTTPS (falls through gracefully elsewhere).
8. `/checkout/onboarding/processing` (`1691:67680`) — Figma rocket asset, animated gradient bar,
   auto-advance.
9. `/checkout/onboarding/success` (`1691:67703`) — celebration asset, merchant card (real eXtra
   logo), live Plan / First payment / generated `EXT-2026-#####` reference, Download Tasheel app
   card with exported App Store / Google Play badges, live 10s redirect countdown.
10. `/checkout/notification` — iOS lock screen (system pattern, not invented brand art): clock,
    frosted notification banner with the real Tasheel mark, spring drop-in. Tap → opens the app
    at `/checkout/detail` (existing transaction details screen).

## Assets exported from Figma (public/figma/)

wcTasheelLogo.svg, wcSaudiFlag.svg, wcCloseX.svg, wcTimerClock.svg, wcCalendar.svg,
wcShieldTick.svg, wcNafathMark.svg, wcCartIcon.svg, wcArrowRight.svg, wcMinus.svg, wcPlus.svg,
wcApplePayRow.png, wcVisaRow.png, wcMadaRow.png, wcNetworksRow.png, wcCardAdd.svg,
wcInfoCircle.svg, wcRocket.png, wcBadgeAppStore.png, wcBadgeGooglePlay.png.
No agent-drawn brand assets anywhere in the flow.

## Animations

ScreenFade mount transition on every step (300ms iOS curve), OTP digit pop (spring), Nafath
waiting pulse, stepper number spring + amount crossfades (FadeSwap), plan-details sheet rise,
processing gradient bar, success countdown, notification banner spring drop.

## Typography / surfaces

Merchant page = Inter (per Figma 355:58228); all Tasheel onboarding screens = SF Pro DS
(`title/content typeface`); Safari chrome re-scoped to SF inside the Inter surface via a new
`[data-surface="app"]` CSS reset.

## Checks (all passing)

- `npm run typecheck`, `npm run export:web`
- `node scripts/wc-flow-probe.cjs` — NEW end-to-end gate: full click-through with assertions on
  every route, dynamic stepper math, date-picker output format, generated Nafath code/reference,
  processing animation, and the notification → app handoff.
- Full existing suite unchanged and green: in-app-qa, payment-flow-fidelity, add-card-clickability,
  payment-method-motion-asset, action-sheet-safe-area, transaction-details-figma, typography.

## Per-screen visual evidence (screenshots/figma-fidelity/)

wc-merchant-live.png (vs /tmp figma ref), wc-mobile-live.png, wc-otp-live.png/typed,
wc-identity-live.png, wc-datepicker-live.png, wc-nafath-live.png, wc-tenure-3mo/4mo-live.png,
wc-plan-details-live.png, wc-payment-live.png, wc-processing-live.png, wc-success-live.png,
wc-notification-live.png, wc-detail-after-notification.png.

## Known deltas from source fixtures (intentional)

- Plan/payment amounts derive from coherent math instead of the source's self-contradictory
  fixtures (3mo frame says "1,416.25 today / then 2,000 / Month" which doesn't sum). The fee
  line matches the source exactly at 3 months. Layout/typography/tokens are per source.
- Merchant product price (6,553.85) and the Tasheel cart (2 items, 4,250) are both source
  fixtures that disagree; both kept as-is per their frames.
- Deferred branches (per scope decision): Rejected, Quick Call, BNPL Plus, full-schedule sheet.

## Round 3b — real-device fixes (from on-phone screenshots, 2026-06-11)

Bugs found in the user's iPhone screenshots, all fixed and redeployed:

1. **Safari chrome doubled** — the design's fake compact tab bar rendered under real Safari.
   `SafariCompactBar` now collapses to a spacer on real iOS devices.
2. **Width gap / letterboxing** — content was capped at 402pt and height-fit-scaled, leaving
   grey bands on a 430pt phone. On device: full-width pages, fixed frames scale by width only
   and scroll vertically when taller than the viewport; shell background blends with canvas.
3. **Double keyboard + shrinking screen** — the drawn Figma keyboard stacked under the real
   iOS keyboard, and height-based scaling shrank the whole frame when the keyboard resized the
   viewport. `IOSNumericKeyboard` never renders on device (real keyboard types into the real
   inputs); width-only scaling makes layout immune to keyboard viewport changes.
4. **DOB opened a text keyboard** — replaced the custom calendar popover with a native
   `input[type=date]`, so iOS presents its own system date picker (calendar icon calls
   `showPicker()`/focus). Custom `WcDatePicker` removed; flow probe updated.
5. **Blue browser focus rings** on inputs — removed via injected CSS (DS active styles remain).
6. **Lock screen felt fake on device** — it showed 9:41/June 10 next to the real status clock,
   sat on a light letterboxed page, and used emoji glyphs. Now: real time/date on device,
   `document.body` tinted `#0b1410` while mounted (Safari chrome blends dark), edge-to-edge
   fill, and clean white SVG flashlight/camera glyphs.
7. **OTP screens (wc + flow)** become flexible-height scroll screens on device with the
   keyboard slot removed, so the Confirm CTA anchors to the real bottom.

Verified on simulated iPhone 14 Pro Max (430pt): no fake Safari/keyboards anywhere, content
width = viewport width, zero horizontal overflow, DOB type=date, live clock, dark body.
All 8 probe gates pass (desktop behavior unchanged). Deployed to gh-pages.

## Round 3c — payment-plan completeness + crisp vectors (2026-06-11)

- **Help icon fixed + working**: the "today ⓘ" was rendering the wrong Figma asset (an empty
  circle). Correct DS info-circle vector exported; tapping it opens a new "Why you pay this
  today" action sheet (3 numbered points with live plan numbers). Figma's own tooltip copy is a
  "Description Needed" placeholder, so the microcopy is written, not invented from brand.
- **All logos now true SVG** (Apple Pay, VISA `#1565C0` wordmark, mada 8-path logo, Mastercard)
  replacing the 1x PNG node renders that pixelated on retina. Networks row rebuilt natively
  from the individual vectors.
- **Cart experience added** (Figma `1885:12758`): the "2 Items · 4,250 ›" pill opens the Cart
  details sheet — Iphone 17pro (3,799.00) + Apple Silicone Case (451.25), summing exactly to
  the cart total used by the plan math.
- **"View full schedule" added** to the Plan details sheet under "Then monthly" (green link per
  source), opening the Full Schedule timeline sheet (Figma `2003:12885`): Today/Down payment
  with Due-today badge → monthly rows → Final badge, all derived from the live tenure.
- **Processing fee ⓘ tooltip** added in Plan details (per Figma Tool Tip `2003:12497`).
- **Visual hierarchy on device**: pages now scale via CSS `zoom = deviceWidth / 402`, so wider
  phones see the design at its intended proportions instead of smaller-feeling type in
  stretched layouts (this also replaced transform-scaling for fixed frames on device).
- Regression note: a block replacement accidentally deleted four components (WcPayment/
  Processing/Success/Notification); caught by typecheck, restored with all fixes intact.
- All 8 probes pass; verified on iPhone 14 Pro Max sim (7 SVG logos, 0 PNG logos, sheets all
  open, zoom active, zero overflow). Deployed to gh-pages.

## Round 3d — extra.com PDP entry + final raster fixes (2026-06-11)

- Entry screen is now an extra.com product-page mimic for the SMEG 50's Retro Refrigerator
  (MP00015644): real product photo and SAR 7,175 price pulled from extra.com, extra-style
  header/rating/price, and the "Shop now, pay later!" section with **Tasheel replacing
  Baseeta** (real wordmark chip, "How does it work?" starts onboarding). tabby/tamara cards
  carry the live site's exact figures for this product (4×1793.75; 24mo from 349.78).
  "Buy now with Tasheel" CTA also enters the flow; "Add to cart" toggles an added state.
- Cart re-anchored to the product: fridge 7,175.00 + 2-Year Extended Warranty 350.25 =
  7,525.25, flowing through the plan stepper, sheets, success, and notification.
- App Store / Google Play badges re-composited at 8× density from the Figma vector
  fragments (were 1× PNGs); OTP countdown clock inlined as a DOM vector path.
- wc-flow-probe updated for the PDP entry + new totals; full suite green; deployed.
