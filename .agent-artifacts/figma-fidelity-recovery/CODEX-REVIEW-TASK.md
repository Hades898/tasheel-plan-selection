# Codex Review Task: Tasheel BNPL Figma Fidelity Gate

Review only. Do not edit files. Be strict.

Use:

- `.agent-artifacts/figma-fidelity-recovery/FIGMA-SOURCE-MAP.md`
- `.agent-artifacts/figma-fidelity-recovery/OPUS-DESIGN-AUTHORITY.md` if present
- `figma-spec/*.json`
- `assets/figma/asset-manifest.json`
- `~/.codex/skills/figma-expo-asset-accuracy/templates/CODEX_FIGMA_FIDELITY_REVIEW.md`

## Classify findings

P0:
- implementation is still an approximation but claims fidelity
- missing Figma spec for target screens
- missing asset manifest / invented assets
- route/deploy preservation risk
- generated export used as canonical source
- smoke QA used as fidelity QA

P1:
- tokens/radii/type/shadows not mapped from Figma
- key geometry drift unmeasured
- no runtime probe
- missing screenshots/contact sheet
- inner ScrollView/short mobile not checked

P2:
- maintainability, naming, test coverage, cleanup

## Output

Use this shape:

```md
# Codex Figma Fidelity Review

## Verdict
PASS / BLOCKED

## P0 blockers

## P1 major issues

## P2 follow-ups

## Evidence checked

## Missing evidence

## Deploy decision
```

Deploy must remain blocked unless specs, assets, runtime probe, screenshots, route QA, and validation are present for the target slice.
