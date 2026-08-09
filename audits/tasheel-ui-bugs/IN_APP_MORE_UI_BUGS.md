# Tasheel BNPL — More In-App UI Bugs

Scope: read-only audit. No app code changed, no commit, no deploy.

User priority: current in-app work is not accurate enough. Preserve the full clickable flow and route map. Do not replace screens. Do not add fake browser/Safari chrome.

Figma references captured:
- App home: `1741:79204` → `/Users/hadysoliman/.hermes/image_cache/img_091703a9e3e0.png`
- Transaction detail: `1741:79381` → `/Users/hadysoliman/.hermes/image_cache/img_d0089cd6a6dd.png`
- Insights: `1741:79259` → `/Users/hadysoliman/.hermes/image_cache/img_ce5c311a900d.png`
- My Purchases: `1741:79334` → `/Users/hadysoliman/.hermes/image_cache/img_789fbaaf7bf0.png`
- Dues: `1747:80163` → `/Users/hadysoliman/.hermes/image_cache/img_923919c3cf9c.png`

Live routes audited:
- `/checkout/app-home`
- `/checkout/detail`
- `/checkout/insights`
- `/checkout/purchases`
- `/checkout/dues`
- sanity checks: `/checkout/home`, `/checkout/details`, `/bnpl`, `/bnpl/plan-detail`

Evidence:
- Contact sheet: `audits/tasheel-ui-bugs/more/in-app-correct-routes-contact-sheet.png`
- Route metrics: `audits/tasheel-ui-bugs/more/in-app-route-summary.json`
- Screenshots: `screenshots/more/*-{mobile,short,desktop}.png`

## P0 / Flow and usability bugs

### P0-1: Transaction detail content is clipped and not scrollable

Route: `/checkout/detail`

Evidence:
- Mobile 390x844: `scrollHeight/clientHeight = 844/844`, but `maxElementBottom = 1074`.
- Short mobile 390x640: `scrollHeight/clientHeight = 640/640`, but `maxElementBottom = 1074`.
- Desktop 1280x720: `scrollHeight/clientHeight = 720/720`, but `maxElementBottom = 1074`.

Observed:
- The detail page visually cuts off most of the Purchase Details table.
- CTA appears at the bottom while detail rows continue behind/below the visible area.

Figma expectation:
- Figma `1741:79381` shows full payment schedule, full Purchase Details table, CTA, and home indicator inside the frame.

Minimal safe fix:
- Add a vertical scroll container or correct the fixed-height clipping for `/checkout/detail`.
- Keep the current design system and route.
- Do not rebuild the screen or add browser chrome.

### P0-2: My Purchases content exceeds viewport with no page scroll protection

Route: `/checkout/purchases`

Evidence:
- Mobile: `maxElementBottom = 908` while viewport is 844.
- Short mobile: `maxElementBottom = 908` while viewport is 640.
- Desktop: `maxElementBottom = 908` while viewport is 720.
- `scrollHeight === clientHeight` in all cases.

Observed:
- Lower purchase card is cut in normal and short viewports.
- The page exposes more content than fits but does not provide reliable vertical scroll.

Figma expectation:
- Figma `1741:79334` shows the purchase cards cleanly within a 402x918 frame.

Minimal safe fix:
- Add vertical list scroll or page scroll for the purchases list.
- Preserve `/checkout/purchases` and current click behavior.

### P0-3: Expected direct route aliases are missing

Routes tested:
- `/checkout/home` → 404
- `/checkout/details` → 404

Working routes:
- `/checkout/app-home`
- `/checkout/detail`

Observed:
- The route names are inconsistent and easy to break during handoff.
- Earlier audit attempts naturally tried `/checkout/home` and `/checkout/details` because those match screen names.

Minimal safe fix:
- Add aliases/redirects for `/checkout/home → /checkout/app-home` and `/checkout/details → /checkout/detail`, or document the route map in QA.
- Do not alter existing working routes.

## P1 / High-visibility Figma mismatches

### P1-1: In-app screens omit the Figma app status bar/home indicator layer

Routes: all in-app routes audited.

Observed:
- Live semantic screens generally start directly with app content/back button.
- Figma references include iOS status bar at top and home indicator at bottom.

Important distinction:
- This is app/device chrome inside the Figma mobile frame, not fake Safari/browser navigation. Do not add Safari UI.

Minimal safe fix:
- If management-review fidelity is the goal, add the app status bar/home indicator treatment consistently to the in-app prototype shell only.
- If product preview intentionally omits device chrome, mark this as a waived fidelity difference in validation.

### P1-2: Transaction detail screen is scaled too large versus Figma

Route: `/checkout/detail`

Observed:
- Header card, payment schedule, typography, and CTA are much larger than Figma.
- Figma uses a more compact, information-dense 310x1024 layout.
- Live version appears zoomed/cropped, causing the P0 clipping.

Minimal safe fix:
- Match the Figma screen density: reduce vertical padding, card heights, type sizes, and schedule row spacing for this route.
- Verify the full details table and CTA are visible/scrollable.

### P1-3: Dues screen data/content does not match Figma

Route: `/checkout/dues`

Observed live:
- `3 Dues Selected`
- amount `3,000`
- remaining `600`
- list includes Extra Stores, Jarir, Noon, Extra Stores

Figma expectation:
- `4 Dues Selected`
- amount `1,800`
- remaining `1200`
- list is Extra Stores + multiple Jarir entries.

Minimal safe fix:
- Align seeded prototype data with Figma for this screen, unless the data change is intentional.
- If intentional, document as content deviation.

### P1-4: Dues ring visualization is not faithful

Route: `/checkout/dues`

Observed live:
- Simple green donut with a large uninterrupted arc.
- Missing the Figma’s multi-stop segmented ring, soft shadow, and circular payment markers.

Figma expectation:
- Ring has multiple green segments/dots and a dimensional shadowed treatment.

Minimal safe fix:
- Use the Figma-exported ring asset or recreate with verified SVG/asset export.
- Avoid hand-approximating the ring if fidelity matters.

### P1-5: My Purchases header missing close button

Route: `/checkout/purchases`

Observed:
- Back button + logo exist.
- Right close/dismiss button is missing.

Figma expectation:
- Back button left, Tasheel logo center, close button right.

Minimal safe fix:
- Add only the missing app-frame close button using the current circular header style.
- No browser/Safari chrome.

### P1-6: App home spacing/scale diverges from Figma

Route: `/checkout/app-home`

Observed:
- Live content is scaled larger and shifted down/right compared to Figma.
- Bottom nav is larger/wider, sits higher with no home indicator.
- Active purchase and Next up cards are larger with heavier spacing.
- Top gradient region is taller and less subtle.

Minimal safe fix:
- Tune spacing and scale against Figma node `1741:79204`: top padding, icon sizes, card width/radius, bottom-nav size, and section vertical rhythm.

### P1-7: Insights chart/card density differs from Figma

Route: `/checkout/insights`

Observed:
- Chart bars appear taller/larger and the content block is shifted downward.
- Transaction cards are slightly larger and more separated.
- Status/home indicator layers are missing.

Minimal safe fix:
- Reduce vertical spacing and chart/card dimensions to match Figma `1741:79259`.
- Validate with side-by-side screenshot.

## P2 / Polish and QA gaps

### P2-1: Merchant/logo treatments vary screen to screen

Observed:
- Some screens use different Extra/Jarir/Noon logo treatments and fallback sizes.
- Previous Claude audit flagged merchant-logo fallback risk.

Minimal safe fix:
- Use stable local assets or verified inline brand chips consistently.
- Never fallback to Tasheel logo for a merchant.

### P2-2: Route QA should include correct direct URLs and short-height clipping checks

Add route checks for:
- `/checkout/app-home`
- `/checkout/detail`
- `/checkout/insights`
- `/checkout/purchases`
- `/checkout/dues`
- `/checkout/home` alias behavior
- `/checkout/details` alias behavior

Viewports:
- 390x844 mobile
- 390x640 short mobile
- 1280x720 desktop

Assertions:
- console error count = 0
- direct route opens intended screen
- all primary actions visible or scroll-reachable
- no page content below viewport when `scrollHeight === clientHeight`

## Recommended next Claude task

Do not let Claude rebuild the app. Give Claude this bounded task:

> Preserve the current deployed full clickable BNPL flow and route map. Do not replace screens. Do not add fake Safari/browser chrome. Compare only these in-app screens against Figma nodes `1741:79204`, `1741:79381`, `1741:79259`, `1741:79334`, and `1747:80163`. Fix bounded UI bugs: detail/purchases scroll clipping, route aliases, missing purchases close button, dues data/ring fidelity, and app-home/insights spacing. Run desktop/mobile/short screenshots and do not deploy until source/deploy mismatch is resolved.
