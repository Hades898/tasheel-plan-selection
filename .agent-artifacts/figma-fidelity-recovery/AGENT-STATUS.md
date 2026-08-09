# Agent Status: Figma Fidelity Recovery

## Run
- Started: 2026-06-08
- Orchestrator: Hermes
- Design authority: Claude Opus
- Implementation lane: blocked until spec layer exists
- Review lane: Codex read-only after artifacts exist
- Branch/worktree: existing repo branch `fix/in-app-fidelity`

## Scope
First bounded slice only:

1. Opus design authority artifact
2. `figma-spec/checkout.json`
3. `figma-spec/home.json`
4. `assets/figma/asset-manifest.json`
5. No deploy
6. No source rebuild yet unless explicitly narrow and spec-backed

## Current state
- Figma access verified for checkout and home/menu frames.
- Route/deploy preservation remains mandatory.
- Existing approximation is not considered Figma-to-code.

## Success criteria
- Opus artifact exists and cites exact Figma node IDs.
- Figma specs exist and include frame dimensions, node bounds, style/token values, asset references, and testID mapping.
- Asset manifest exists and records Figma asset URLs/paths/hashes/waivers.
- Next implementation slice is bounded to one screen.

## Failure signals
- Claude edits App.tsx before creating spec artifacts.
- Claude claims fidelity based on smoke QA.
- Generated export is used as canonical source.
- No asset manifest.
- No concrete node-to-component/testID mapping.

## Stop condition
Stop after spec/design-authority artifacts are created or after Claude max-turn/budget failure. Verify files before deciding next step.

## Logs
- Claude log: `.agent-artifacts/figma-fidelity-recovery/claude-spec-run.json`
- Codex review: `.agent-artifacts/figma-fidelity-recovery/codex-review.md`
