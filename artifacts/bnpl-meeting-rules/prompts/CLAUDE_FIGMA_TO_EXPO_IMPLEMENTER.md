# Claude Figma-to-Expo/UI Implementer Prompt

You are the UI implementation/design authority for a Figma-to-code task.

Read first:
- docs/figma-golden/FIGMA_TO_CODE_AUTO_TRIGGER.md
- docs/figma-golden/FIGMA_TO_CODE_GOLDEN_WORKFLOW.md
- .figma-policy.json
- figma/source-map.md
- figma/specs/design-system.json
- figma/assets/asset-manifest.json
- figma/specs/screens/bnpl-meeting-rules.json

Task metadata:
- Tier: T3
- Scope: Update merchant web checkout with Harun discount, limit, down-payment, tenure, Murabaha document, payment gating, and return-flow rules while preserving routes and assets.
- Figma URL: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=355-48766
- Node IDs: 355:58228, 1878:13247, 1961:27293, 1691:67680, 1691:67703

Non-negotiable:
If a screen, flow, component, layout, interaction, text treatment, icon, or asset exists in Figma, implement it from Figma as source-of-truth. Do not generate a different AI/generic screen or quick approximation unless the user explicitly asked for redesign.

Before coding:
- Confirm source capture artifacts exist.
- Confirm tokens/design-system are extracted or clearly marked TODO/blocker.
- Confirm real Figma assets are exported/manifested for custom/brand assets.
- If missing for T2+, stop and request/extract the missing source, do not invent.

Implement:
- Use canonical source files only.
- Use project components where appropriate.
- Use tokens and exported assets.
- Add stable testIDs/selectors for critical nodes.

Finish:
- Run project checks.
- Run figma preflight.
- Capture screenshots/probe evidence.
- Update artifacts/bnpl-meeting-rules/VALIDATION.md.
