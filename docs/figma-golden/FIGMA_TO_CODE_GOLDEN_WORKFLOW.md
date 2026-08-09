# Figma-to-Code / Figma-to-Expo Golden Workflow

Purpose: this is the default documented workflow for any future Figma-to-code, Figma-to-Expo, React Native Web, Expo prototype, or Figma fidelity repair work on this Mac.

Automatic trigger: the user should not need to ask for this workflow. When they provide a project/Figma and describe the UI/UX they want, Hermes/Codex/Claude should apply it automatically.

Execution bias: UI/UX and visual output are the main work. Keep loops fast, accurate, and high quality. Avoid backend-heavy planning or broad architecture unless the request truly needs backend/API/data work.

Figma-as-spec rule: if a screen, flow, component, icon, asset, text treatment, layout, or interaction exists in Figma, it must be implemented from the Figma source. Do not replace the Figma design with a newly invented “better” screen, generic AI layout, quick approximation, screenshot-inspired rebuild, or alternate component structure unless the user explicitly asks for redesign. Figma is the source of truth, not mood-board inspiration.

Source policy:
- Auto trigger: `/Users/hadysoliman/refs/FIGMA_TO_CODE_AUTO_TRIGGER.md`
- Enforcement kit: `/Users/hadysoliman/refs/figma-golden/README.md`
- Bootstrap script: `/Users/hadysoliman/refs/figma-golden/scripts/figma_golden_bootstrap.py`
- Preflight script: `/Users/hadysoliman/refs/figma-golden/scripts/figma_golden_preflight.py`
- Hermes skill reference: `/Users/hadysoliman/.hermes/skills/frontend/figma-expo-asset-accuracy/references/golden-figma-to-code-policy.md`
- Research workspace: `/Users/hadysoliman/.hermes/work/figma-to-code-golden-plan/`
- Skill to load first: `figma-expo-asset-accuracy`
- Also load: `ui-frontend-empowerment`, `impeccable`, and `design-taste-frontend` or `gpt-taste`.

## Default interpretation

When the user asks for Figma-to-code, Figma-to-Expo, Expo/RN Web prototype work, Figma visual fixes, or says a Figma output is inaccurate/generic/hand-built, do not start with implementation.

Start with the gated workflow:

1. Intake and tier declaration
2. Source Capture Gate
3. Design Authority Gate
4. Token / Design System Gate
5. Frame Spec Gate
6. Asset Gate
7. Source Implementation Gate
8. Route / Deploy Preservation Gate if public/clickable
9. Verification Gate
10. Fidelity Gate
11. Skeptical P0/P1/P2 Review Gate
12. Validation Gate

## Tier matrix

T0: Mechanical non-visual
- Copy fix, label change, pure logic.
- Minimal source pointer if design-linked, typecheck/smoke, minimal note.

T1: Small visual patch
- Spacing tweak, one component state, text style fix.
- Source ref/screenshot, token check, asset check if touched, before/after screenshots, light validation.

T2: New component or screen
- Source map, token/design-system extraction or local token map, asset manifest for custom assets, critical-node measured spec + testIDs, runtime geometry probe, matched screenshots/contact sheet, mechanical checks, validation.

T3: Flow / public prototype / brand-critical
- All T2 gates plus prototype interaction map, route/deploy preservation, full asset manifest with hashes, critical + repeated-node spec coverage, visual regression, skeptical P0/P1/P2 review, Design Authority final sign-off, complete VALIDATION.md.

T4: Design-system migration
- Variable inventory, token transform pipeline and modes, Code Connect/component mapping attempt, variant matrix, representative regression suite, migration validation.

## Must-fail P0 rules

Block the work or require explicit high-authority waiver if any of these occur:

- A Figma-provided screen, flow, frame, state, layout, interaction, component, asset, or text treatment is ignored and replaced with an invented AI/generic screen.
- Implementation treats Figma as loose inspiration instead of source-of-truth spec for any T2+ visual work.
- Agent redraws a Figma custom vector, icon, logo, illustration, brand mark, merchant mark, badge, bespoke progress ring, mask, photo, or textured/custom rendered asset.
- Agent substitutes emoji or a generic icon library for a Figma-sourced custom/brand asset.
- Asset is used without an asset manifest entry and Figma node traceability.
- Export crops canvas/viewBox/stroke padding when alignment depends on the full source canvas.
- MCP-generated code or plugin output is treated as canonical source of truth.
- Visual work starts before source, token/spec, and asset gates for T2+.
- A public/clickable prototype loses routes, aliases, direct deep links, base path assets, browser back/forward behavior, or deploy artifacts without explicit user approval.
- Fidelity is claimed without source screenshots, implementation screenshots, and runtime/spec evidence.

Allowed without manifest:
- Pure layout primitives: rectangles, borders, dividers, simple gradients/fills, layout containers, shadows.
- Text glyphs such as currency symbols, unless Figma rendered them as custom outlined artwork/logo.
- Library icons only if Figma/Code Connect explicitly maps to the exact icon library/name/weight/variant.

## Required artifact structure

Use this default unless the project already has a better convention:

```text
project-root/
  .figma-policy.json
  figma/
    source-map.md
    specs/
      design-system.json
      screens/
        <screen-or-flow>.json
    assets/
      asset-manifest.json
  artifacts/<slug>/
    screenshots/
    probes/
    reviews/
    VALIDATION.md
  assets/figma/
  app/
  components/
  theme/
```

## Agent roles

Use roles first, model names second:

- Design Authority: default to Claude Opus for design/taste interpretation and final visual acceptance.
- Implementer: Codex/Sonnet-class implementation after gates are satisfied.
- Skeptical Reviewer: Codex or Grok with P0/P1/P2 rubric.
- Orchestrator/Verifier: Hermes coordinates gates, artifacts, screenshots, validation, and deploy safety.

## Figma source capture checklist

For every T2+ job, capture:

- Figma URL, file key, node IDs, frame order, root frame dimensions.
- Figma MCP `get_design_context` for target frames.
- Figma MCP `get_variable_defs` for tokens/variables.
- Figma MCP screenshot(s) for reference.
- Figma metadata tree for hierarchy and child node IDs.
- Prototype interactions and target routes if clickable.
- Fonts, typography, colors, radii, spacing, shadows/elevation, component names, variants, states.
- Exportable asset nodes.

## Token and spec rules

- Pull variables/styles/modes/themes before coding.
- Map Figma variables to project tokens or create task-local tokens in `figma/specs/design-system.json`.
- Raw one-off values must be recorded as `rawFigmaValue` with source node, not invented in code.
- Create measured screen specs for critical nodes, not necessarily every node.
- Critical nodes: layout rails, major containers, key text, CTAs, navigation, cards/repeated components, asset-bearing nodes, one exemplar of each component variant.
- Every critical node needs a stable `testID` or selector for runtime probing.

## Verification requirements

For T2+:

- Typecheck/build relevant to project.
- Expo doctor when Expo/RN.
- Local preview.
- Runtime geometry + asset probe against spec.
- Matched Figma and implementation screenshots.
- Contact sheet.
- Console/page/redbox error check.
- Scroll reachability and safe-area checks.
- VALIDATION.md with evidence, deltas, waivers, verdict.

For T3+ additionally:

- Route map inventory and deploy diff before deploy.
- Direct deep links and aliases verified.
- Visual regression where feasible.
- Skeptical P0/P1/P2 review.
- Design Authority final acceptance.

## Waiver rule

High-impact waivers require explicit Design Authority + user/product-owner approval:

- asset redraw/substitution
- route/deploy deletion
- brand-fidelity P0
- public-prototype loss

Waiver format:

```text
Waiver: <specific delta or anti-pattern>
Reason: <why accepted>
Evidence: <paths/screenshots/probe output>
Approved by: <Design Authority + user/product owner> on <date>
Follow-up: <ticket/expiry/none>
```

## How future agents should begin

When asked to start new Figma work, say and do:

1. “I’m classifying this as T<0-4> because <reason>.”
2. Load `figma-expo-asset-accuracy`, `ui-frontend-empowerment`, `impeccable`, and a taste skill.
3. Create `figma/source-map.md` or task artifact equivalent.
4. Pull Figma MCP context, variables, screenshot, and metadata before coding.
5. Create or update `figma/specs/design-system.json`, screen specs, and asset manifest.
6. Only then start implementation.
7. Finish with screenshots, runtime probe, P0/P1/P2 review if tier requires, and `VALIDATION.md`.

## Current limitations from the research run

The golden plan was validated through Grok research, Codex adversarial critique, primary tooling docs, and existing local proven workflows. Search limitations were documented honestly:

- Managed web search/Firecrawl hit billing limits.
- Browser search hit bot/CAPTCHA on several engines.
- X/Reddit were not directly searchable in this run.
- GitHub search JSONs returned empty arrays.

Therefore the workflow is grounded in primary docs and local battle-tested enforcement patterns, not broad social/web corpus validation.
