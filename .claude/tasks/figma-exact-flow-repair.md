You are Claude Code working as the primary design/build implementer for a Tasheel BNPL Expo / React Native Web prototype.

User request, exact intent:
- Hunt all UI bugs in the live flow: https://hades898.github.io/tasheel-bnpl-prototype/checkout
- Preserve the existing full clickable flow and public route map. Do not replace it with a narrow SPA, static screenshots, or a new redesign.
- Build real React Native / Expo UI from Figma to code. Do NOT render Figma frame screenshots as the product UI. Figma screenshots may be used only for reference/verification.
- Inner app screens after notification must be as accurate as possible to the Figma designs at node 814:23900.
- Web checkout experience must align to Figma node 355:48766.
- Known broken areas: purchase page is messed up, dues screen is messed up, many things in the flow are off.
- No fake Safari/browser chrome. App status/home indicators are okay only when they are part of the app screen design.

Repository:
/Users/hadysoliman/tasheel-bnpl-browser-prototype

Current branch:
fix/in-app-fidelity

Important safety context:
- main is restored to cf00700.
- origin/gh-pages is a patched public artifact at 89d5366 preserving the full route map.
- Current source branch is the place to build real source-level fixes so future deploys are safe.
- Do not push or deploy. Do not force-push. Do not delete routes/assets.

Figma nodes to use through MCP:
- Inner updated BNPL app section: 814:23900
  Key frames from this section:
  - 1843:18080 BNPL Home, 402x1033
  - 814:24410 Transaction details [flow], 402x1330
  - 1579:11144 Insights - Full history, 402x870
  - 814:24392 My purchases, 402x918
  - 876:17923 6 Dues, 402x890
  - 1843:17915 My dues, 402x890
  - 814:24082 Payment Method, 402x890
  - 816:47301 Payment Method Selected, 402x890
- Web checkout new-user section: 355:48766
  Key frame:
  - 355:58228 6.0 - Extrastores Checkout, 390x848

Primary implementation targets/routes:
- /checkout
- /checkout/app-home and alias /checkout/home
- /checkout/detail and alias /checkout/details
- /checkout/insights
- /checkout/purchases
- /checkout/dues

Required implementation approach:
1. Use Figma MCP design context for the exact frames above. Pull only the needed screens, not the whole file repeatedly.
2. Audit the current App.tsx against those frames.
3. Make source-level code changes in App.tsx and related QA scripts if needed.
4. Preserve the route map and click paths.
5. Fix obvious fidelity defects first:
   - Checkout should match the merchant checkout layout from 355:58228, not the current generic payment page snapshot.
   - App-home should match the updated BNPL home spacing, card hierarchy, bottom nav, status strip, and next-up list.
   - Transaction detail should match purchase-plan-clicked frame proportions and keep all bottom content reachable.
   - Purchases should match updated My purchases, including header, tabs, cards, spacing, close affordance if in Figma, and scroll reachability.
   - Dues should match updated dues design, including selected state, amount text, ring/summary treatment, merchant stack/list, bottom CTA, and no data drift.
   - Insights should match updated Insights Full history spacing and data hierarchy.
6. Use real RN components (View/Text/Pressable/ScrollView). Do not use img/div or screenshot rendering.
7. If exact custom icon/vector fidelity cannot be achieved in the timebox, export/reuse source assets or leave a clear TODO/waiver in the validation note. Do not substitute with emoji.
8. Keep TypeScript passing.

Quality gates to run before finishing:
- npm run typecheck
- npm run export:web
- If possible, run npm run qa:in-app against a local static server, or at least update/report what prevents it.

Return a concise final report with:
- Files changed
- Screens/routes fixed
- Figma nodes used
- Commands run and pass/fail
- Remaining fidelity gaps or waivers

Do not deploy. Do not push. Do not make destructive git operations.
