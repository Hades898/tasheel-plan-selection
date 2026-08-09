# Payment Flow Round 2 — Apple Pay, Add-Card Motion, Bank OTP, Home Tab Bar

Date: 2026-06-10. No deploy was performed.

## User-reported bugs fixed

### 1. Apple Pay was unusable in the payment method sheet

Root cause: the Apple Pay row's `onPress` routed to `paymentSelected`, which hardcoded the
Debit Card as the selected method. There was no payment-method state anywhere.

Fix in `App.tsx`:

- New `PayMethod` (`'card' | 'apple'`) state lifted to `App()` alongside `payCardLast4`.
- Both rows are now real selectors: tapping Apple Pay selects it (green radio), the review
  card `Method` line shows `Apple Pay`, and the CTA stays coherent.
- Paying with Apple Pay routes directly to `processing` (no bank OTP — banks do not OTP
  Apple Pay), then success. Card payments keep the OTP step.
- Deep links to `/checkout/payment-method/selected` still default to the debit card, so all
  existing probe geometry is unchanged.

### 2. Add-card keyboard dismissal felt broken

Root cause: when the form became valid, the keyboard faded/slid over 220ms while the sheet
itself *instantly teleported* 296px down (static `top: 45 -> 341` style swap).

Fix in `App.tsx` (`AddCard` / `AddCardSheet`):

- One choreographed motion: a compensation `sheetShift` value starts at `-296` the moment
  the static style flips, and glides to `0` in 420ms (`Easing.bezier(0.32, 0.72, 0, 1)`,
  iOS sheet curve) in parallel with the keyboard sliding down 330px (no opacity fade —
  real iOS keyboards slide, they don't fade).
- A 140ms delay lets the final CVV digit visibly register before the glide starts.
- Deleting a digit reverses the same choreography (sheet glides back up, keyboard slides in).
- Bonus correctness fix: the sheet's `Amount to pay` was hardcoded `800`; it now carries the
  real flow amount (`paymentFlowAmount(summary)`), e.g. 1,800 from the default Dues
  selection or 2,400 in the probe fixture.

### 3. Bank OTP screen was wrong

Root cause: the previous screen was an invented "Verify payment / Enter OTP" hybrid with a
fake GCC logo — but Figma node `814:24658` is an actual **Al Rajhi Bank 3-D Secure page**
(VISA + alrajhi bank header, Arabic RTL copy, single Verification Code field, blue إرسال
button) shown over the system numeric keyboard.

Fix in `App.tsx` (`OtpScreen`) + assets:

- Exported the real bank-page bitmap from Figma (`public/figma/otpBankPage.png`, image 451)
  and placed it with the exact source clip geometry (clip y=128, image x=17 w=366 h=795.2).
- The white verification text block (Figma `814:24665`) is live text overlaying the bitmap,
  carrying the real payment amount and card last4 (existing debit `4521`, or the last4 the
  user typed in Add new card via lifted state).
- Interactive overlays measured from the bitmap: typed code renders inside the bitmap's
  Verification Code box (`otp-bank-input`, page y≈286), and إرسال is a press target
  (`otp-bank-submit`, page y≈323, disabled until 4 digits) routing to `processing`.
- Removed the invented back button, GCC logo, OTP boxes, review card, and "Verify and pay"
  CTA. Keyboard restyled to the Figma keyboard component (`#e6e9ed` bg, 50px white keys,
  radius 8.5, 23px SF digits, `#595959` delete glyph).

### 4. Polish pass — BNPL Home fidelity (Figma `1885:12069`)

- **Tab bar** rebuilt from Figma instance `1885:12116`: floating frosted pill (radius 296,
  `rgba(247,247,247,0.82)` + backdrop blur, shadow `0 8 40 rgba(0,0,0,0.12)`) positioned
  x16/y771/w370/h95 so content tucks underneath; four source-exported SVG icons
  (`tabHome/tabFlash/tabBnpl/tabProfile.svg`) replace the previous agent-drawn glyphs;
  BNPL active state uses the `#f9fafb` selection pill + `#166534` label, Home label is
  `#9ca3af` per source.
- **Header rhythm** matched to source: logo 44px at y≈66, label y142.5, amount y166.5,
  merchant line y215.5, tiles y264, sections y390/586 (was ~56px compressed).
- **Progress bar** rebuilt from DS component `1069:21`: gradient fill `#166534 -> #3eff00`,
  `#e5e7eb` track, radius 4, white 2px dashes on installment boundaries. Fill stays
  math-coherent (1 of 3 = 1/3; the Figma fixture's decorative 2/3 fill was not copied).
- Cards: radius 24, border `#f3f4f6`. `450.00/mo` typography now matches the source run
  (semibold `450.` + regular `00/mo`, both 16px). Next-up date separators use the source
  `-` form.

## Checks run (all passing)

- `npm run typecheck`
- `npm run export:web`
- `node scripts/in-app-qa.cjs`
- `node scripts/figma-geometry-probe.cjs`
- `node scripts/typography-probe.cjs`
- `node scripts/payment-flow-fidelity-probe.cjs` (OTP section rewritten for the bank page;
  add-card amount fixture updated 800 -> 2,400; settle waits extended for the new glide)
- `node scripts/add-card-clickability-probe.cjs`
- `node scripts/payment-method-motion-asset-probe.cjs`
- `node scripts/action-sheet-safe-area-probe.cjs`
- `node scripts/transaction-details-figma-probe.cjs`

Runtime flow verified with Playwright: Apple Pay select -> `Pay 2,400` ->
`/checkout/processing`; card path unchanged through bank OTP (`1234` typed via keyboard,
إرسال -> processing).

## Evidence screenshots (`screenshots/figma-fidelity/`)

- `otp-bank-page-rebuilt.png`, `otp-bank-page-typed.png`
- `payment-method-apple-selected.png`
- `add-card-glide-mid.png`, `add-card-glide-settled.png`
- `app-home-fixed.png` vs `app-home-figma-1885-12069.png`

## Round 2b additions (same day)

- **Success subtitle unclipped + dynamic**: `successCopyFigma` dropped its fixed
  56px height/`overflow: hidden` (content is 62px — descenders were sheared). Copy now
  derives from the actually-paid dues: month list with no count
  ("April installments paid", "April and May installments paid", singular for one due).
  Verified live: April-only and April+May selections both correct.
- **Success Next-up card is data-driven**: shows the nearest *unpaid* due
  (name/when/amount) instead of the static Extrastores fixture; hides when everything
  is paid.
- **Real native Apple Pay on iOS**: `launchNativeApplePay()` presents the genuine
  `ApplePaySession` sheet on Safari/iOS over HTTPS (SAR, mada/visa/mastercard,
  `Tasheel Finance` total). No merchant server exists, so after presenting, the session
  aborts (~1.6s) or the user cancels — either way the prototype continues to processing.
  Non-Safari/local falls through instantly to the previous behavior. Note: the native
  sheet only appears on the HTTPS deploy (e.g. GitHub Pages), not on http://127.0.0.1.
- Probe updated: success assertions now expect the dynamic month copy
  (`April installments paid`, `Next up — Noon`, `Due in 16 days · May 4th`, `300`) and
  fail if a count prefixes the month list.

## New probe regression rules

- OTP must be the bank 3DS page: bitmap loaded, Arabic verification text with live amount +
  card last4, no back button/GCC logo/"Enter OTP"/"Verify and pay" copy, submit disabled
  until 4 digits, keys fill the bank field, submit routes to processing.
- Add-card filled geometry is sampled after the 560ms glide; keyboard must animate, not pop.
