You are Claude Code. You own the MAIN DESIGN/BUILD WORK for Tasheel BNPL prototype fixes. Hermes will only orchestrate and verify. Codex will review after you.

CRITICAL USER CONTEXT:
- A previous agent ruined the flow by replacing it with a narrow checkout slice. Do NOT repeat that.
- Preserve the current deployed full clickable flow and route map.
- Do NOT add fake Safari/browser navbar/chrome.
- Do NOT replace the experience with screenshots only or a narrow route.
- Make bounded fixes to the existing in-app BNPL experience for higher Figma accuracy and fewer UI bugs.

PROJECT:
/Users/hadysoliman/tasheel-bnpl-browser-prototype

DEPLOYED SOURCE RECONCILIATION:
- Current main source is stale screenshot-gallery. It does NOT match public gh-pages.
- Public deployed full-flow is at origin/gh-pages commit 67fc4bb.
- A gh-pages worktree exists at /tmp/tasheel-gh-pages-audit.
- The deployed bundle is readable at /tmp/tasheel-gh-pages-audit/_expo/static/js/web/entry-300af7ba8ee4f4c2ab1fd7490deaf0ea.js.
- Reconstruct/restore source in this repo from the deployed full-flow behavior, then apply fixes. Do not deploy.

FIGMA SOURCE:
User root: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=814-23900&t=j4iGP56XKrdloEVc-4
Target in-app nodes:
- App home: 1741:79204
- Transaction detail: 1741:79381
- Insights: 1741:79259
- My Purchases: 1741:79334
- Dues: 1747:80163

EXISTING AUDIT REPORTS/EVIDENCE TO READ FIRST:
- audits/tasheel-ui-bugs/IN_APP_MORE_UI_BUGS.md
- audits/tasheel-ui-bugs/COMBINED-UI-BUG-AUDIT.md
- audits/tasheel-ui-bugs/more/in-app-route-summary.json
- audits/tasheel-ui-bugs/more/in-app-correct-routes-contact-sheet.png
- screenshots/more/app-home-mobile.png
- screenshots/more/detail-mobile.png
- screenshots/more/insights-mobile.png
- screenshots/more/purchases-mobile.png
- screenshots/more/dues-mobile.png

FIX ALL OF THESE, SAFELY:
1. Reconcile source vs deploy by creating/restoring Expo Router source files matching current deployed full flow:
   - /checkout/index
   - /checkout/app-home
   - /checkout/detail
   - /checkout/insights
   - /checkout/purchases
   - /checkout/dues
   - preserve existing checkout flow routes as needed.
2. Add aliases/redirects:
   - /checkout/home -> /checkout/app-home
   - /checkout/details -> /checkout/detail
3. Fix /checkout/detail clipping: full payment schedule + full purchase details + CTA must be scroll-reachable on 390x844, 390x640, and desktop.
4. Fix /checkout/purchases clipping: all purchase cards must be scroll-reachable on 390x844, 390x640, and desktop.
5. Add missing right close/dismiss button on My Purchases, matching Figma app-frame button. Do not add Safari/browser chrome.
6. Improve Figma fidelity for app-home, detail, insights, purchases, dues: spacing, scale, status/home indicator treatment only if appropriate for app-frame fidelity, card sizes, typography density.
7. Fix dues data to match Figma unless you find a reason in source not to:
   - 4 Dues Selected
   - amount 1,800
   - remaining 1200
   - list like Figma (Extra Stores + Jarir entries), not Noon drift.
8. Improve dues ring fidelity using a verified local/SVG/CSS implementation; avoid sloppy simple donut if you can make segmented markers closer.
9. Add QA script/checks that explicitly capture/check these routes at desktop, mobile, short mobile:
   - /checkout/app-home
   - /checkout/detail
   - /checkout/insights
   - /checkout/purchases
   - /checkout/dues
   - /checkout/home alias
   - /checkout/details alias
10. Do not commit and do not deploy. Leave changes in working tree.

IMPLEMENTATION NOTES:
- You may create app/ and components/ source files as needed.
- Keep Expo SDK 56 compatible.
- Prefer React Native / Expo Router patterns.
- Use real local assets already in repo when possible.
- If exact Figma SVG/assets are unavailable, approximate carefully but document remaining gaps.

VERIFY BEFORE FINISHING:
- npm run typecheck
- npx expo-doctor
- npm run export:web
- run or create purchase/in-app QA script

FINAL RESPONSE:
- list files changed
- commands run/results
- remaining caveats
