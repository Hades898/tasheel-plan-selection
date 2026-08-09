You are Claude Code acting as the design/fidelity reviewer. The user explicitly wants Claude to do the design judgment and Figma comparison; Hermes is only orchestrating.

READ-ONLY AUDIT ONLY. Do not edit source files. Do not write commits. Do not deploy. Your final answer should be a concise markdown audit report.

Project: /Users/hadysoliman/tasheel-bnpl-browser-prototype
Public URL base: https://hades898.github.io/tasheel-bnpl-prototype/
User's Figma source: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=814-23900&t=j4iGP56XKrdloEVc-4
Root node: 814:23900, BNPL - updated
Priority screen: My Purchases / purchase page
Known existing mapped node: 1741:79334, My purchases
Existing exported asset: assets/figma-screens/my-purchases-1741-79334.png
Hermes captured Figma screenshot for purchase node: /Users/hadysoliman/.hermes/image_cache/img_789fbaaf7bf0.png
Hermes captured root screenshot: /Users/hadysoliman/.hermes/image_cache/img_c2b97ce6b65b.png
Hermes captured live screenshots:
- screenshots/purchase-live-desktop.png
- screenshots/purchase-live-mobile.png
- screenshots/checkout-live-desktop.png
Live metrics:
- audits/tasheel-ui-bugs/purchase-live-desktop.json
- audits/tasheel-ui-bugs/purchase-live-mobile.json
- audits/tasheel-ui-bugs/checkout-live-desktop.json

Instructions:
1. Use the Figma MCP to inspect node 814:23900 and specifically compare purchase screen node 1741:79334 if available.
2. Compare Figma vs current public deployed experience, especially /checkout/purchases.
3. Look for UI bugs and fidelity gaps, not redesign opportunities.
4. Preserve current full clickable flow and design system. Do not suggest replacing it with a narrowed route or fake browser chrome.
5. Rank findings by severity:
   - P0 breaks flow or makes a screen unusable
   - P1 visible mismatch/bug that management will notice
   - P2 polish/fidelity improvement
6. For each finding include: route/screen, observed behavior, Figma/source expectation, likely source file/area, minimal safe fix, and verification needed.
7. Include a short route coverage checklist for the full experience.

Return markdown only. Do not make code changes.