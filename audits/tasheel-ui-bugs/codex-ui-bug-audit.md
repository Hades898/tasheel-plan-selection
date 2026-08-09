# Tasheel BNPL UI Audit Report

Read-only audit only. I did not edit files, commit, or deploy.

## Findings

### P0: My Purchases content is clipped and not scrollable in live evidence
**Evidence:** [purchase-live-desktop.json](/Users/hadysoliman/tasheel-bnpl-browser-prototype/audits/tasheel-ui-bugs/purchase-live-desktop.json:6), [purchase-live-mobile.json](/Users/hadysoliman/tasheel-bnpl-browser-prototype/audits/tasheel-ui-bugs/purchase-live-mobile.json:6)  
**Issue:** Metrics show `scrollHeight` equals `clientHeight`, but purchase card buttons extend below the viewport. Desktop card 5 ends at `y=884` in a 720px viewport. Mobile card 5 ends at `y=884` in an 844px viewport.  
**Impact:** Lower purchase rows are partially or fully unreachable. This breaks purchase-page usability.  
**Minimal safe fix:** Allow the purchase screen or inner purchase list to scroll vertically. Do not add browser/Safari chrome. For the screenshot-flow version, preserve the Figma image flow but make the phone viewport scrollable for frames taller than the viewport instead of hiding overflow.

### P0: Checked-in app and live purchase route appear to be different implementations
**Evidence:** [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:45), [purchase-live-desktop.json](/Users/hadysoliman/tasheel-bnpl-browser-prototype/audits/tasheel-ui-bugs/purchase-live-desktop.json:3), [checkout-live-desktop.json](/Users/hadysoliman/tasheel-bnpl-browser-prototype/audits/tasheel-ui-bugs/checkout-live-desktop.json:5)  
**Issue:** `App.tsx` renders exported Figma PNG frames with a side-panel navigator. The live metrics show semantic `/checkout` and `/checkout/purchases` screens with real text/buttons. There is no route parsing in `App.tsx`; it always starts at `checkout`.  
**Impact:** Rebuilding from this repo may replace the current deployed route behavior, or direct links like `/checkout/purchases` may not open My Purchases in the screenshot-flow app. This is exactly the kind of flow replacement risk the user called out.  
**Minimal safe fix:** Preserve the screenshot-based flow and add a small path-to-step initializer only: `/checkout` -> `checkout`, `/checkout/purchases` -> `purchases`. Optionally update history on step changes. Do not rebuild the flow as semantic cards.

### P1: Purchase Figma frame is forced into the wrong viewport size
**Evidence:** [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:68), [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:164), [figma-extraction-notes.md](/Users/hadysoliman/tasheel-bnpl-browser-prototype/figma-extraction-notes.md:45)  
**Issue:** `my-purchases-1741-79334.png` is `402x918`, but `FigmaScreen` hard-caps every frame into `390x848`. That scales My Purchases down to fit height and creates fidelity drift from the provided reference.  
**Impact:** The purchase screen appears narrower/shorter than Figma, and tall content behavior cannot match the original frame.  
**Minimal safe fix:** Use each `step.width` and `step.height` for the inner clip/scroll dimensions, then scale the outer phone container responsively. For My Purchases, keep `402x918` as the source frame size.

### P1: Live My Purchases misses top Figma chrome elements
**Evidence:** Figma reference `/Users/hadysoliman/.hermes/image_cache/img_789fbaaf7bf0.png`, [purchase-live-mobile.png](/Users/hadysoliman/tasheel-bnpl-browser-prototype/screenshots/purchase-live-mobile.png)  
**Issue:** Reference includes the iOS status bar and top-right close button. Live screenshot only has the left back button and logo.  
**Impact:** Visible fidelity mismatch on the priority screen. This is not asking for fake Safari/browser navbar; it is part of the Figma app frame.  
**Minimal safe fix:** If keeping semantic live route, add only the missing Figma app-frame elements. If reverting to screenshot-flow rendering, this is already present in the exported asset and should not be recreated manually.

### P1: Full-screen `Next screen` overlay can block meaningful purchase interactions
**Evidence:** [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:82), [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:167)  
**Issue:** One absolute `Pressable` covers the entire phone. That is fine for a tap-through demo, but it prevents separate hotspots such as back, close, card taps, or scroll gestures from behaving independently.  
**Impact:** The “full clickable flow around” My Purchases cannot be accurately tested if every tap means “next screen.”  
**Minimal safe fix:** Keep the screenshot flow, but define small route-specific hotspots for back/close/card/continue areas. Use full-screen next only on screens where the Figma flow genuinely has one obvious next action.

### P2: QA scripts do not directly verify the purchase route
**Evidence:** [browser-qa.cjs](/Users/hadysoliman/tasheel-bnpl-browser-prototype/scripts/browser-qa.cjs:39), [capture-evidence.cjs](/Users/hadysoliman/tasheel-bnpl-browser-prototype/scripts/capture-evidence.cjs:27)  
**Issue:** QA clicks only the first three states or captures first/mid/final. It does not directly assert `/checkout/purchases`, purchase scrollability, purchase visual size, or Figma node `1741:79334`.  
**Impact:** The priority bug can pass QA unnoticed.  
**Minimal safe fix:** Add explicit captures/assertions for root, `/checkout`, `/checkout/purchases`, purchase step `1741:79334`, desktop `1280x720`, mobile `390x844`, and short mobile.

### P2: Figma source metadata is stale/conflicting
**Evidence:** [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:109), [figma-extraction-notes.md](/Users/hadysoliman/tasheel-bnpl-browser-prototype/figma-extraction-notes.md:3)  
**Issue:** Repo copy and notes reference root `1747:80160`, while the current user-provided root is `814:23900`. Purchase node `1741:79334` is still known, but the root mismatch can send future fixes to the wrong Figma context.  
**Impact:** Higher chance of another incorrect replacement pass.  
**Minimal safe fix:** Update metadata/docs after confirming node `1741:79334` under root `814:23900`. Do not regenerate all frames unless the purchase frame actually changed.

## QA Checklist After Fixes

- Open `/checkout/` and confirm the flow still starts at the checkout screen.
- Open `/checkout/purchases` directly and confirm it lands on My Purchases, not the first checkout frame.
- On `390x844`, confirm My Purchases can scroll to the completed purchase card.
- On `1280x720`, confirm My Purchases can scroll or otherwise reveal all cards.
- Compare My Purchases against `/Users/hadysoliman/.hermes/image_cache/img_789fbaaf7bf0.png`: status bar, back button, close button, logo, tabs, card spacing, and progress bars.
- Click through the full Figma screenshot flow from checkout to dues without losing any existing step.
- Verify no fake Safari/browser navbar was added.
- Run `npm run typecheck`, `npm run build`, `npm run qa:browser`, and updated purchase-specific capture checks.