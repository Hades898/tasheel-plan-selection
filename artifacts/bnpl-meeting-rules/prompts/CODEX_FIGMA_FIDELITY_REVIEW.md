# Codex Figma Fidelity Review Prompt

Use this as the read-only review prompt after implementation and before deploy.

You are reviewing a Figma-to-Expo / React Native Web implementation. Be strict. Classify findings as P0/P1/P2.

## Inputs
- Repo path:
- Figma source map:
- Figma spec path(s):
- Asset manifest path:
- Opus design authority artifact:
- Validation artifact:
- Screenshots/contact sheet:
- Routes to verify:

## Review scope

Check:

1. Source-first discipline
   - Is canonical source in `app/`, `components/`, `lib/`, tokens/config/tests?
   - Did implementation paste or depend on generated export bundles as source?
   - Are static artifact hotfixes clearly labeled as hotfixes only?

2. Figma spec coverage
   - Do target screens have `figma-spec/*.json` or equivalent measured specs?
   - Do source components expose stable `testID`s for runtime probes?
   - Are key Figma nodes mapped to source components?

3. Asset fidelity
   - Does `assets/figma/asset-manifest.json` exist?
   - Are custom logos/icons/illustrations exported from Figma?
   - Are any assets redrawn, substituted, cropped, or replaced with emoji/library icons without waiver?

4. Token fidelity
   - Are Figma colors/type/radii/shadows mapped to tokens?
   - Is there a fake invented global design system?
   - Are platform fallbacks documented?

5. Route/deploy preservation
   - Are existing public routes preserved?
   - Are aliases preserved/added?
   - Are GitHub Pages base paths and `_expo` asset paths safe?
   - Would deploy delete old route files/assets?
   - Does browser back/forward sync with app route state?

6. Runtime QA
   - TypeScript passed?
   - expo-doctor passed where relevant?
   - export/web/local preview passed?
   - direct deep links passed?
   - desktop/mobile/short-mobile screenshots exist?
   - inner ScrollView reachability verified?
   - console/page errors captured?

7. Fidelity QA
   - Runtime geometry/style probe exists and passed?
   - Figma screenshot vs live screenshot compared?
   - Deltas are documented and fixed or waived?
   - No claim of pixel-perfect/100% fidelity without evidence?

## Output format

```md
# Codex Figma Fidelity Review

## Verdict
PASS / BLOCKED

## P0 blockers
- ...

## P1 major issues
- ...

## P2 follow-ups
- ...

## Evidence checked
- ...

## Missing evidence
- ...

## Deploy decision
Safe / blocked, with reason.
```

Any missing Figma spec, missing asset manifest, missing screenshots, or route-deletion risk is at least P1. If it can mislead the user into thinking an approximation is faithful, mark P0.


## Task-specific paths
- Tier: T3
- Source map: figma/source-map.md
- Design system: figma/specs/design-system.json
- Screen spec: figma/specs/screens/bnpl-meeting-rules.json
- Asset manifest: figma/assets/asset-manifest.json
- Validation: artifacts/bnpl-meeting-rules/VALIDATION.md

Extra P0: Any Figma-provided screen/flow/component/asset replaced by an invented AI/generic version is BLOCKED.
