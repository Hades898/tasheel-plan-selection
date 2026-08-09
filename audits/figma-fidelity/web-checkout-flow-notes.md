# Web checkout new-user flow — build notes (2026-06-10)

Source section: `355:48766` "Merchant web-checkout - New User" (Figma file geEFxJ11n2KySAZB6zsjEh).
Scope (user-confirmed): **happy path only**; iOS-accurate notification banner (no Figma frame exists);
**Nafath** as primary identity path. Branches (Rejected 1725:71182, Quick Call, BNPL Plus 2003:12122,
Tool Tip 2003:12497, Full Schedule 2003:12885) deferred until sign-off.

## Happy-path frames (extract design context per screen before building)

1. Merchant checkout `355:58228` (390×848) — DONE extracting. Spec below.
2. Confirm Mobile Number `355:45048`
3. OTP `355:45094` (variant: Counter enabled `1613:22358` — resend countdown state)
4. Identity Verification `1628:32393` (+ Date Picker state `1628:32758`; alt frame `1929:12116` — check which is canonical)
5. Nafath `1929:61813`
6. Tenure/plan: candidates `1961:27293`, `2003:12123`, month variants `1878:13093`(2mo)/`1878:13247`(3mo)/`1865:3575`(4mo) — inspect before choosing
7. Payment Method (web): inside section `1691:68503` — find happy frame
8. Processing `1691:67680` → Success `1691:67703` (merchant-browser success w/ extrastores.com glass chrome)
9. iOS notification banner (built from system pattern + real Tasheel icon) → tap → app `/checkout/detail`

## Route plan (App.tsx)

`checkout` (rebuilt merchant page) → `wcMobile` → `wcOtp` → `wcIdentity` → `wcNafath` → `wcTenure`
→ `wcPayment` → `wcProcessing` → `wcSuccess` → `wcNotification` → `detail` (existing app screen).
Paths: `/checkout` + `/checkout/onboarding/{mobile,otp,identity,nafath,tenure,payment,processing,success,notification}`.
All wc screens: `surface="checkout"` (Inter), 390-wide design, ScreenFade mount transition
(opacity 0→1 + translateX 24→0, ~280ms, bezier(0.32,0.72,0,1)).

## Merchant checkout 355:58228 spec (extracted)

- Status bar standard; width 390.
- Header p16: "Extrastores" Inter Bold 18 #121212; "Complete your purchase" Inter 13 #666.
- Body p24 gap16:
  - Product card: white, border #dfe5e5, r12, p14, gap14. Thumb 48×48 #f7f7f7 r8 containing **📱 emoji 20px** (NOT a drawn svg). Title Inter SemiBold 15 #121212; "256GB — Natural Titanium" Inter 12 #666; "SAR 6,553.85" Inter Bold 16.
  - "Payment Method" Inter SemiBold 15.
  - Unselected rows: white, border #dfe5e5 (1px), r12, p16, gap12; radio 20px border-2 #dfe5e5; label Inter 14 #121212. Order: Credit / Debit Card, Apple Pay, Cash on Delivery.
  - Selected (Tasheel BNPL): bg #f7f7f7, border-2 #121212; radio border-2 #121212 + 10px #121212 dot; title Inter SemiBold 14; sub "Split into 3–12 monthly installments" Inter 12 #666.
- CTA container px24 pt16 pb24: button #121212 r14 py18, "Proceed with Tasheel BNPL" Inter SemiBold 16 white.
- Safari compact tabs (px28 pt16): 48px frosted circles (rgba(250,250,250,0.7), blur 12, border white, shadow 0 2 40 rgba(0,0,0,.1)) with SF chevron.backward / ellipsis glyphs; center search bar 218×48 with siteSettings icon left, "extrastores.com" SF Pro 17 center, reload icon right. Reuse existing assets browserReload.svg / browserSiteSettings.svg. Home indicator below (gated by SHOW_FAKE_CHROME).

Variables on this frame: Text/OnSecondary #101b1b, Icon/OnSecondary #101b1b, bg_dark #030712.

## Conventions

- No drawn brand assets; emoji glyphs are per-source. SF symbol glyphs (‹ ⋯) via system font Text ok.
- Download each screen's asset URLs immediately (they expire); save under public/figma/wc*.svg/png.
- After each screen: typecheck + rebuild + screenshot vs Figma reference (Read both), fix, then next.
- Validation report at the end; extend probes for the wc flow happy path.

## Progress log

- [x] Merchant page spec extracted; rebuild in progress (replaces drawn phone SVG + wrong chrome).
- [x] Mobile number — built (wcMobile, dynamic phone state, assets wcTasheelLogo/wcSaudiFlag/wcCloseX.svg)
- [x] OTP — built (wcOtp, live 01:30 countdown, digit pop animation, Edit pill -> wcMobile, asset wcTimerClock.svg)
- [x] Identity + date picker — built (wcIdentity + WcDatePicker iOS calendar popover, assets wcCalendar/wcShieldTick.svg)
- [x] Nafath — built (wcNafath, random session code, waiting pulse + 2.6s auto-approve, asset wcNafathMark.svg)
- [x] Tenure — built (wcTenure live 2/3/4 stepper, coherent math anchored to Figma 3mo fee 55.30: fee(n)=27.65*(n-1) on cart 4,250.25; WcPlanDetailsSheet from 2003:12123)
- [x] Payment method (web) — built (wcPayment from 1961:27293; assets wcApplePayRow/wcVisaRow/wcMadaRow/wcNetworksRow.png, wcCardAdd/wcInfoCircle.svg; Apple Pay triggers native sheet on iOS HTTPS)
- [x] Processing + Success — built (wcProcessing rocket+animated gradient bar from 1691:67680; wcSuccess live plan/reference/10s countdown from 1691:67703; assets wcRocket/wcBadgeAppStore/wcBadgeGooglePlay.png)
- [x] Notification + app handoff — built (wcNotification iOS lock screen + frosted banner with real Tasheel mark; tap -> /checkout/detail)
- [x] Flow probe (scripts/wc-flow-probe.cjs, passing) + validation report (web-checkout-flow-validation.md)
