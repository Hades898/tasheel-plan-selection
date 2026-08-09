# DESIGN.md

This project follows the Golden Figma-to-Code / Figma-to-Expo workflow.

## Source of Truth

Figma URL: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=355-48766
Node IDs: 355:58228, 1878:13247, 1961:27293, 1691:67680, 1691:67703
Tier: T3
Scope: Update merchant web checkout with Harun discount, limit, down-payment, tenure, Murabaha document, payment gating, and return-flow rules while preserving routes and assets.

If a screen, frame, flow, state, component, layout, interaction, copy treatment, icon, or asset exists in Figma, implement it from Figma as source-of-truth. Do not replace it with an invented AI/generic screen, alternate layout, quick approximation, or hand-built asset unless the user explicitly asks for redesign or grants a waiver.

## Design System

Populate from `figma/specs/design-system.json` before implementation.

- Colors: use Figma variables or recorded rawFigmaValue entries.
- Typography: use Figma font family, weight, size, line-height, and letter-spacing.
- Spacing/radii/shadows: use Figma variables/tokens or recorded values.
- Components: map Figma components/variants to source components and stable testIDs.

## Assets

Real Figma assets only for custom/brand elements. See `figma/assets/asset-manifest.json`.

Must export/fetch from Figma when present:
- logos and wordmarks
- custom icons
- brand/merchant/payment marks
- currency/Riyal/SAR marks when rendered as artwork
- rings, charts, illustrations, masks, images, textures

## Verification

Before claiming completion:
- `python3 scripts/figma_golden_preflight.py --project . --tier T3 --slug bnpl-meeting-rules`
- Runtime geometry/asset probes for critical nodes
- Figma screenshot + implementation screenshot + contact sheet
- `artifacts/bnpl-meeting-rules/VALIDATION.md` with final verdict

## Workflow Docs

- `docs/figma-golden/FIGMA_TO_CODE_AUTO_TRIGGER.md`
- `docs/figma-golden/FIGMA_TO_CODE_GOLDEN_WORKFLOW.md`
- `docs/figma-golden/FIGMA_TO_CODE_GOLDEN_POLICY.md`
