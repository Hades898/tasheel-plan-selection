# Claude Opus Task: Spec-Driven Tasheel BNPL Figma-to-Code Recovery

Claude owns design interpretation and design-significant implementation. Hermes orchestrates and verifies. Codex audits. Do not treat this as a visual polish pass.

## User correction

The existing implementation is not acceptable as Figma-to-code. It is a functional approximation. Rebuild from measured Figma spec. Smoke QA is not fidelity QA.

## Repo

`/Users/hadysoliman/tasheel-bnpl-browser-prototype`

## Source of truth

Read first:

- `.agent-artifacts/figma-fidelity-recovery/FIGMA-SOURCE-MAP.md`
- `~/.claude/skills/figma-expo-asset-accuracy/references/spec-driven-figma-to-code-recovery.md`
- `~/.claude/skills/figma-expo-asset-accuracy/references/orchestration-gates.md`
- `~/.claude/skills/figma-expo-asset-accuracy/templates/CLAUDE_OPUS_DESIGN_AUTHORITY.md`
- `~/.claude/skills/figma-expo-asset-accuracy/templates/FIGMA_SPEC.schema.json`
- `~/.claude/skills/figma-expo-asset-accuracy/templates/VALIDATION.md`

## Figma nodes to freeze

- Checkout root: `355:48766`
- Checkout key frame: `355:58228`
- Inner app root: `814:23900`
- Home root/section: `814:23901`
- Home first concrete frame: `1843:18080` (`BNPL Home`, 402×1033)
- Home conditions/menu group: `814:23902` (`Group 32764`, 360×448)
- Detail: `814:24410`

Also identify exact Dues, Purchases, and Insights frame IDs from the inner app root before rebuilding those screens.

## Scope for first run

Do NOT rebuild every screen in one pass.

First run deliverables:

1. Create Opus design authority artifact:
   - `.agent-artifacts/figma-fidelity-recovery/OPUS-DESIGN-AUTHORITY.md`
2. Create measured Figma spec files for the first two target screens:
   - `figma-spec/checkout.json`
   - `figma-spec/home.json`
3. Create or update:
   - `assets/figma/asset-manifest.json`
4. Identify exact component mapping from Figma nodes to source components/testIDs.
5. Do not deploy.
6. Do not claim completion.

## Hard rules

- Preserve existing full clickable flow and route map.
- No narrow SPA replacement.
- No fake browser/Safari chrome unless the Figma frame explicitly includes it and the existing product flow expects it.
- Use real Figma assets first.
- No emoji or generic icon substitutes.
- No hand-drawn merchant logos, Riyal icons, DuesRing/progress thumbs, or custom vectors unless waived.
- Use Figma variables/tokens. Do not invent a fake global design system.
- If exact asset export is blocked, record the blocker and waiver instead of substituting silently.
- Add `testID`s for mapped runtime nodes so a geometry/style probe can compare source against Figma.

## Checks if source code changes happen

- `npx tsc --noEmit`
- `npx expo-doctor`
- do not deploy

## Final output expected from Claude

- files changed
- source nodes processed
- blockers
- whether this run created specs only or also changed source
- exact next bounded implementation slice
