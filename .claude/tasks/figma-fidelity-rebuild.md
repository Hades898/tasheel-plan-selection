You are Claude Code acting as the design/build implementation agent for a Figma-to-Expo React Native Web fidelity repair.

Repository: /Users/hadysoliman/tasheel-bnpl-browser-prototype
Branch: fix/in-app-fidelity

User goal:
Repair the live BNPL checkout/app flow so the inner app screens after notification and the web checkout match Figma source exactly. Purchase page and dues screen are known bad. Preserve the full flow/routes. No screenshot-as-UI. Pure Figma-to-code implementation.

Read these files first:
1. audits/figma-fidelity/BNPL_FIGMA_SPEC.md
2. audits/figma-fidelity/figma-fidelity-spec.json
3. assets/figma/asset-manifest.json
4. App.tsx
5. scripts/in-app-qa.cjs

Hard requirements:
- Preserve route aliases and click flow:
  /checkout
  /checkout/app-home and /checkout/home
  /checkout/detail and /checkout/details
  /checkout/dues
  /checkout/purchases
  /checkout/insights
- Do not replace screens with screenshots or static full-screen images.
- Use Expo / React Native Web primitives and react-native-svg.
- Convert Figma geometry into RN styles: fixed 390/402 frame widths, exact top/left/width/height where provided, exact colors, typography, radii, spacing.
- Use local downloaded assets from assets/figma for logos/ring/status/icons where practical. Do not use localhost asset URLs in runtime code.
- If an SVG asset cannot be imported directly, use react-native-svg approximations for simple icons but keep dimensions/placement. Use Image for PNG logos/icons.
- Keep typecheck passing.
- Do not deploy.

Implementation approach:
- It is acceptable to replace most of App.tsx with a more faithful component system if that is faster and safer.
- Create reusable components: ScreenFrame, StatusBarFigma, HeaderFigma, HomeIndicatorFigma, MerchantLogo, RiyalMark, PrimaryButton, ProgressSegmented, PurchaseCard, NextPaymentRow, DuesRing, TabBar.
- For frame fidelity, prefer absolute-positioned 390/402-width screen components inside route-level ScrollView rather than adaptive approximation.
- The content may scroll vertically for tall frames, but inside each screen the visible layout should be at the Figma coordinates.
- Annotate root screen frames with testID and/or dataSet node ids where RNW supports it.

Acceptance commands to run before finishing:
- npm run typecheck
- npm run export:web
- npm run qa:in-app

Write a short report to audits/figma-fidelity/claude-implementation-report.md with:
- files changed
- routes preserved
- which Figma nodes were implemented
- any remaining waivers
- exact command results

Do the implementation now. Do not ask questions.
