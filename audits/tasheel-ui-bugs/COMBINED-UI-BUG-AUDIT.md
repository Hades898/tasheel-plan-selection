# Tasheel BNPL Combined UI Bug Audit

Scope: read-only audit. No code changes, no deploy.

User source of truth:
- Figma root: `814:23900` (`BNPL - updated`)
- Priority screen: My Purchases / purchase page
- Known mapped purchase node: `1741:79334`
- Public route audited: `https://hades898.github.io/tasheel-bnpl-prototype/checkout/purchases`

Agent split:
- Claude: Figma-connected fidelity review using Figma MCP and existing live/reference captures.
- Codex: code/route/QA audit using repo source, live metrics, and screenshot evidence.
- Hermes: orchestration only, screenshot capture, console checks, and report collation.

## Highest-confidence findings

### P0: Current `main` source and deployed public flow are not the same implementation

Codex found that checked-in `App.tsx` is a screenshot-frame gallery with a side-panel navigator and no route parsing, while the public `/checkout/purchases` route renders a semantic full-screen purchase page with real text/buttons.

Why this matters: rebuilding/deploying from `main` can overwrite the current full clickable public flow. This is exactly what caused the earlier damage.

Minimal safe fix:
- Before any future deploy, reconcile source and deployed behavior.
- Either recover the source implementation that produced `gh-pages@67fc4bb`, or treat `gh-pages` as the current deployed source-of-truth until main is corrected.
- Add a predeploy guard that verifies `/checkout`, `/checkout/purchases`, and click-through flow before push.

### P0/P1: My Purchases lower content is clipped or at risk of being unreachable

Evidence from live metrics:
- desktop viewport 1280x720: last purchase card extends below visible viewport.
- mobile viewport 390x844: lower card area also extends beyond viewport.
- measured `scrollHeight === clientHeight`, meaning page-level scrolling is not exposing all content.

Minimal safe fix:
- Preserve the current full flow.
- Add vertical scrolling to the My Purchases screen/list or phone viewport, depending on which implementation is recovered.
- Do not add fake Safari/browser chrome.

### P1: My Purchases header is missing the Figma right-side close button

Claude compared Figma `1741:79334` against live screenshots and found the Figma header expects:
- back button left
- Tasheel logo center
- close/dismiss button right

Live route shows back + logo but no right close affordance.

Minimal safe fix:
- Add only the missing app-frame close button, matching the existing circular header-button style.
- Do not introduce browser/Safari UI.
- Wire it to the existing intended flow behavior only after confirming the Figma prototype destination.

### P1: Purchase frame sizing/scaling can drift from Figma

Codex found `App.tsx` currently forces all frames into a 390x848 viewport even though My Purchases is documented as `402x918`.

Minimal safe fix:
- If working on the screenshot-flow source, use each step's documented width/height for scaling/scroll behavior rather than hard-capping all screens to 390x848.
- For My Purchases, preserve 402x918 as the source frame dimensions.

### P1/P2: Merchant logos have fragile rendering/fallback behavior

Claude observed a mobile-logo risk: Noon/Jarir can degrade into a wrong/fallback brand mark depending on viewport/load behavior.

Minimal safe fix:
- Use stable local assets or inline brand-chip components for merchant marks.
- Do not use a generic Tasheel mark as merchant-logo fallback.

### P2: QA is not specific enough for the purchase page

Current QA does not explicitly prove:
- `/checkout/purchases` direct route works.
- purchase screen scroll/reachability works.
- Figma node `1741:79334` matches live output.
- the full flow survives after changes.

Minimal safe fix:
- Add purchase-specific Playwright capture/checks for desktop, mobile, and short mobile.
- Add a route map check before deploy.

### P2: Figma metadata is stale/conflicting

Repo notes reference old root `1747:80160`, while the current user-provided Figma root is `814:23900`.

Minimal safe fix:
- Update docs/metadata to reference `814:23900` as the active Figma root.
- Keep existing child node IDs only after confirming they still belong under the updated Figma context.

## Reports created

- `audits/tasheel-ui-bugs/claude-figma-compare-report.md`
- `audits/tasheel-ui-bugs/codex-ui-bug-audit.md`
- `audits/tasheel-ui-bugs/COMBINED-UI-BUG-AUDIT.md`

## Screenshots and metrics created

- `screenshots/purchase-live-desktop.png`
- `screenshots/purchase-live-mobile.png`
- `screenshots/checkout-live-desktop.png`
- `audits/tasheel-ui-bugs/purchase-live-desktop.json`
- `audits/tasheel-ui-bugs/purchase-live-mobile.json`
- `audits/tasheel-ui-bugs/checkout-live-desktop.json`

## Safe next Claude implementation brief

Use Claude only after source/deploy mismatch is resolved or explicitly target the deployed-flow source.

Rules for next implementation:
1. Preserve the full clickable flow.
2. Preserve route map and direct links.
3. Do not replace the app with a narrow checkout slice.
4. Do not add fake Safari/browser chrome.
5. Fix only My Purchases reachability, missing close button, merchant-logo fallback, and purchase-specific QA.
6. Run desktop/mobile screenshots before any deploy.
