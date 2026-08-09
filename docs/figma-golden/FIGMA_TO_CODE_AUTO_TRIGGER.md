# Automatic Figma-to-Code / Figma-to-Expo Trigger

This is the compact always-on instruction for Hermes, Codex, and Claude on this Mac.

## Trigger phrases

Automatically apply this workflow when the user mentions or implies:

- Figma to code
- Figma to Expo
- Figma to React Native
- Figma to RN Web
- Expo prototype
- clickable prototype
- match this Figma
- make it accurate to Figma
- visual fidelity
- UI/UX from Figma
- fix/polish/redesign a Figma-built screen
- Claude should build the UI
- Codex should audit/review a Figma implementation

Do not wait for the user to request the workflow. The user wants to provide the project/Figma and describe the desired output. Agents should automatically run the workflow.

## Priority

UI/UX and visual output are the main work. Keep outputs fast, accurate, and high-quality.

Avoid overwhelming the user with backend-heavy plans unless the request truly needs backend/API/data work. Default to the smallest implementation loop that preserves visual quality and source fidelity.

## Figma-as-spec rule

If it exists in Figma, implement it from Figma. A Figma screen, frame, flow, icon, brand mark, copy style, spacing system, token, interaction, or component is not optional inspiration. Do not generate a different “good enough” AI screen, generic layout, invented component tree, or quick visual approximation unless the user explicitly asks for a redesign or waiver.

Failure to preserve a Figma-provided screen/flow/asset is a P0 fidelity failure, not a polish issue. Stop, extract the exact Figma node/frame/asset, and repair from source.

## Required docs

Read these first:

- `/Users/hadysoliman/refs/FIGMA_TO_CODE_GOLDEN_WORKFLOW.md`
- `/Users/hadysoliman/refs/FIGMA_GOLDEN_INTAKE_PLAN.md`
- `/Users/hadysoliman/refs/figma-golden/README.md`

If the target project does not already contain `.figma-policy.json`, `DESIGN.md`, `figma/source-map.md`, specs, asset manifest, and validation scaffolds, run the bootstrap script before implementation:

```bash
python3 /Users/hadysoliman/refs/figma-golden/scripts/figma_golden_bootstrap.py /path/to/project --slug <slug> --tier <T0-T4> --figma-url '<figma-url>' --node-ids '<node-ids>' --scope '<scope>'
```

Run preflight before claiming fidelity:

```bash
python3 scripts/figma_golden_preflight.py --project . --tier <T0-T4> --slug <slug>
```

Equivalent mirrors:

- Hermes: `/Users/hadysoliman/.hermes/refs/FIGMA_TO_CODE_GOLDEN_WORKFLOW.md`
- Codex: `/Users/hadysoliman/.codex/refs/FIGMA_TO_CODE_GOLDEN_WORKFLOW.md`
- Claude: `/Users/hadysoliman/.claude/refs/FIGMA_TO_CODE_GOLDEN_WORKFLOW.md`

## Skills / roles

Hermes:
- Load `figma-expo-asset-accuracy`
- Load `ui-frontend-empowerment`
- Load `impeccable`
- Load `design-taste-frontend` or `gpt-taste`

Claude:
- Acts as primary UI implementation/design authority when asked to build.
- Should use the Claude mirror at `/Users/hadysoliman/.claude/refs/FIGMA_TO_CODE_GOLDEN_WORKFLOW.md`.
- Must not skip source capture, assets, specs, and validation for T2+ work.

Codex:
- Acts as skeptical reviewer or implementation lane depending on task.
- Must use P0/P1/P2 review for T3+ or fidelity-sensitive work.

## Automatic start sequence

When a new project/Figma task arrives:

1. Classify tier T0-T4.
2. Create or update the intake artifact from `/Users/hadysoliman/refs/FIGMA_GOLDEN_INTAKE_PLAN.md`.
3. Capture Figma source via MCP before coding: design context, metadata, variables, screenshots.
4. Extract tokens/design system.
5. Create critical-node specs for T2+.
6. Export real Figma assets and create an asset manifest.
7. Implement in canonical source, using exported assets and tokens.
8. Verify with screenshots and runtime probes.
9. For T3+, run P0/P1/P2 skeptical review and route/deploy preservation checks.
10. Finish with `VALIDATION.md`.

## Non-negotiables

- If it exists in Figma, implement it from Figma. Do not replace Figma screens/flows/components/assets with invented AI/generic screens unless the user explicitly asks for redesign.
- No agent-drawn custom Figma assets unless explicitly waived by user/design authority.
- No fake generic icons/logos/brand marks when Figma has real assets.
- No implementation before source capture for T2+.
- No route/deploy deletion for public prototypes without explicit approval.
- No fidelity claim without Figma screenshot, implementation screenshot, and evidence.

## User experience

The user should not have to remember the workflow or ask for it. They should be able to say:

“Here is the Figma and project. Build this in Expo.”

The agent should then run the workflow automatically and report only concise progress, blockers, evidence, and final paths.
