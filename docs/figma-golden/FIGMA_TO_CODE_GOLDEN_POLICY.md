**GOLDEN FIGMA-TO-CODE / FIGMA-TO-EXPO POLICY — Final Synthesis (v1.1)**

**Status**: Compact, tier-driven, enforceable. Drop this + the three templates into any project.

### Rebuttals: Codex CONDITIONAL PASS Critique

1. **“Run every time” vs tiering** — **Accept**. Ambiguity removed. Tier (T0–T4) is declared at intake and determines exact mandatory gates/artifacts. Checklist is now explicitly tier-adjusted.

2. **Tool-name coupling (Opus/Hermes/Grok/Codex) vs roles** — **Accept**. Policy now uses durable roles first: Design Authority, Implementer, Skeptical Reviewer, Orchestrator. Named models (Opus default for Authority; Grok/Codex default for Skeptical; Hermes-style orchestration; Codex/Sonnet-class for impl) are recommended defaults only.

3. **Overstated research base** — **Accept**. GitHub search JSONs were empty arrays. Web/Firecrawl tooling hit billing/CAPTCHA blocks. Primary grounding: official Figma Dev Mode MCP + Code Connect docs, Figma Variables/REST, DTCG spec (with its draft caveats), Expo/RN asset + router docs, Maestro/Chromatic patterns, and prior battle-tested gold-plan-work enforcement artifacts (schemas, asset contracts, gates, visual loops, VALIDATION). No broad GitHub corpus validation is claimed. Limitations section below is mandatory in this document.

4. **Asset rule too blunt** — **Accept**. Boundaries added (artwork vs primitives, currency glyphs, mapped generic icons). Exact must-fail list below.

5. **Token extraction underspecified** — **Accept**. Added: modes/themes extraction, raw/one-off value policy (promote or document), semantic preference, platform transforms, and Code Connect mapping requirement where applicable.

6. **Frame specs too broad** — **Accept**. Replaced exhaustive-per-node with explicit “critical node coverage” rules scaled by tier.

7. **RN native runtime probes hand-wavy** — **Accept**. Scoped precisely: geometry + asset presence/dims + mandatory visual regression. onLayout limits stated. Web probes deeper where available. Screenshots + regression are co-equal with probes.

8. **Waiver governance weak** — **Accept**. High-impact (assets, routes, brand fidelity P0s) now require Design Authority + user/product-owner sign-off. Implementer self-waiver limited to low-impact P2 inside tolerance. Expiry/follow-up required for material waivers.

9. **Automation missing** — **Accept**. New “Enforcement Mechanisms” section lists required guards/checkers (manifest cross-ref, no-new-inline-Svg, token literal scan, critical-spec coverage, route deletion guard, VALIDATION completeness). Actual scripts belong in companion enforcement skill (e.g., figma-expo-asset-accuracy pattern).

10. **MCP treated as magic** — **Accept**. Explicit rule added: MCP (including generated reference code) is evidence and starting point only. Figma node data, variables, screenshots, exported assets, project tokens, and Code Connect mappings are canonical. All generated snippets must be RN/Expo-adapted.

All other baseline strengths (source-first, measured specs before edits, asset traceability, route preservation, layered verification, authority separation, artifact auditability) retained and tightened.

### Tier Matrix (T0–T4) — Primary Classifier

**Declare tier at intake. All later gates and checklist items are filtered by it.**

| Tier | Name                        | Examples                              | Mandatory (non-waivable without authority) | Waived (by default)                          | Skeptical Review |
|------|-----------------------------|---------------------------------------|--------------------------------------------|----------------------------------------------|------------------|
| T0   | Mechanical non-visual      | Copy fix, label change, pure logic   | Source pointer (if design-linked), typecheck, minimal note | Tokens, specs, assets, probes, Design Authority, screenshots, VALIDATION full | None required |
| T1   | Small visual patch         | Spacing tweak, one state, text style | Source ref/screenshot, token check (or local map), asset check if touched, before/after shots, light VALIDATION | Full source-map, full DS extraction, full per-frame spec, P0/P1/P2 | Optional |
| T2   | New component or screen    | Standard new screen or reusable comp | Source map, token/DS extraction (or documented local), asset manifest for custom, critical-node measured spec + testIDs, runtime geometry probe, matched screenshots + contact sheet, mechanical, VALIDATION | Full prototype/deploy guard (if unaffected), full visual regression baseline (if not in CI) | Recommended if risk |
| T3   | Flow / public prototype / brand-critical | Clickable prototype, public deploy, brand surface | All T2 + prototype interaction map, route/deploy preservation + diff guard, full asset manifest + hashes, critical + repeated-node coverage, visual regression (Maestro/Chromatic), full skeptical P0/P1/P2, Design Authority final sign-off, complete VALIDATION | None without explicit Design Authority + user sign-off | Required |
| T4   | Design-system migration    | Token pipeline, component library, broad variant work | Variable inventory, token transform pipeline + modes, Code Connect/component mapping attempt, variant matrix, representative regression suite, migration validation | Exhaustive per-screen specs (sample representative surfaces) | Required |

**Rule**: No “run every time” blanket. Document tier in source-map and VALIDATION. Higher tier can always be chosen voluntarily.

### No Design Substitution — Figma Is Source of Truth

If a screen, frame, flow, state, component, layout, interaction, copy treatment, icon, or asset exists in Figma, implement it from Figma. Figma is an executable source-of-truth spec, not a mood board. Do not substitute an AI/generic version for an existing Figma design.

**P0 FAIL (must block or require explicit user/design-authority waiver):**
- Replacing a Figma-provided screen or flow with an invented AI/generic screen.
- Using a “better looking” alternate layout when the task is fidelity, not redesign.
- Implementing only the visible/obvious slice while ignoring organized sections, arrows, states, overlays, or child frames present in Figma.
- Treating route/text smoke tests as completion when source Figma structure, assets, geometry, or interaction states are missing.
- Calling an approximate, Figma-inspired rebuild “Figma-to-code done.”

If a Figma file is ambiguous, stop and document the ambiguity. Do not fill gaps with AI slop. Use source capture, per-frame specs, assets, and explicit waivers.

### No Agent-Drawn Assets — Exact Must-Fail Rules (P0)

**MUST export or fetch real Figma assets for**:
- Logos, custom icons, brand marks, merchant marks, flags, badges, illustrations, bespoke progress/graphic elements, masks, photos, textured or custom-rendered surfaces.
- Any vector or raster that carries brand identity or is not a pure layout primitive.

**MUST record in asset-manifest.json** (per schema): key, figmaNodeId, figmaName, kind, exportedPath, source dims, preserveCanvas (bool), viewBox, strokePolicy, hash (recommended), usage, status, waiverReason (if any).

**Allowed in code (no manifest entry required)**:
- Pure layout primitives: rectangles, borders, simple dividers, layout containers, shadows, solid fills, simple gradients (when tokenized).
- Text glyphs: currency symbols ($ € £ ¥), %, numerals, punctuation — unless Figma renders them as custom outlined artwork or logo.
- Library icons (SF Symbols, lucide, etc.) **only** when the Figma design system / Code Connect explicitly maps the node to that exact library + name + weight/variant. Record the mapping.

**P0 FAIL (must block or require explicit high-authority waiver)**:
- Any inline `<Svg>` / path / shape recreation of a Figma custom vector, icon, logo, illustration, or brand element.
- Emoji or generic library substitution for a Figma-sourced custom/brand asset.
- Asset import or usage without corresponding manifest entry + figmaNodeId traceability.
- Cropping to visible bounds on padding/canvas-critical assets when alignment or stroke depends on full export.
- Treating generated MCP reference code or plugin exports as the source of truth for assets instead of the exported files + manifest.

Waivers for the above require Design Authority + user/product owner sign-off (not implementer alone). Record in manifest + VALIDATION with expiry or follow-up ticket.

### Token / Design-System Extraction Rules

- Pull variables via get_variable_defs (or export) including collections, primitives, semantic aliases, modes/themes.
- Map to existing project theme before introducing literals. Prefer semantic names.
- Raw / one-off Figma values (no variable): promote to task-local token in design-system.json (with figmaNodeId source) **or** document explicitly as “rawFigmaValue” + node + visual acceptance. Do not invent hex/px/spacing without record.
- Resolve and document modes/themes and platform transforms (RN line-height, density, safe-area adjustments, font fallbacks).
- Code Connect: capture mappings/suggestions where Figma components exist in the target codebase. Use before one-off generation.
- P0: New visual work with arbitrary literals while variables or project tokens exist and are applicable.

### Measured Specs — Critical Node Coverage (Not Exhaustive)

Per `figma-spec/<screen>.json` (schema is authoritative):

**Critical nodes (minimum for T2+)**: layout rails / major containers, primary headlines + body text blocks, CTAs / primary buttons, navigation / tab / header elements, cards or repeated content containers, all asset-bearing nodes, at least one full exemplar of every used component variant.

**T3+**: Add repeated instances and flow-critical nodes. Broader coverage expected.

**T1**: Changed nodes only (mini-spec acceptable).

**Always**: stable testId per critical node, exact bounds (x/y/w/h), style with token refs (or rawFigmaValue record), asset refs (manifest keys), prototype interactions, per-node or default tolerances.

Exhaustive full-tree specs are optional except T4 or explicit brand-critical T3.

### Runtime Probes — RN Native Scope

- **Mandatory for T2+ fidelity claims**: geometry (onLayout / measure / testing-library bounds + insets for critical nodes) + asset presence + rendered dimensions vs manifest + spec.
- **Do not claim**: full typography fidelity, color, shadows, stroke caps, text wrapping, or transforms from onLayout alone.
- Web / RN Web: deeper (getBoundingClientRect + getComputedStyle on stable testIds).
- **Always paired with**: matched Figma vs impl screenshots (viewport/scale/device matched) + contact sheet + visual regression (Maestro assertScreenshot native default 95% with cropOn; Chromatic/Loki for web/stories).
- Output: machine-readable deltas vs spec + tolerances. Commit log.

### Waiver Governance (Enforceable)

- Format (in VALIDATION or review): “Waiver: [specific delta/anti-pattern]. Reason: [...]. Evidence: [...]. Approved by: [Design Authority + user name] on [date]. Follow-up: [ticket / none / expiry date].”
- Asset redraw, route deletion, brand-fidelity P0, or public-prototype loss: Design Authority + user/product-owner sign-off required.
- Implementer may self-document low-impact P2 inside tolerance only.
- High-impact waivers should carry expiry or follow-up ticket.

### Enforcement Mechanisms (Required)

Projects/Skills using this policy **must** provide or reference:
- Asset manifest cross-check (code imports + grep for new `<Svg>`, icon components, or raw paths not in manifest).
- No-new-inline-custom-asset guard (fail on unmanifested custom vectors).
- Token literal scanner (flag hex/radius/spacing/font literals outside theme or documented rawFigmaValue).
- Critical-spec coverage checker (every critical node has testId + spec entry).
- Screenshot / contact-sheet capture contract + visual regression runner.
- Route/deletion guard (pre-deploy `git diff` or worktree inventory of routes/assets/aliases vs public).
- VALIDATION completeness + verdict checker.

These may be scripts, preflight hooks, CI gates, or a companion skill. Absence of enforcement is itself a process gap to note in VALIDATION.

### Folder / Artifact Structure (Standard + Configurable)

```
project-root/
  .figma-policy.json                 # optional: { "artifactRoot": "figma/", "defaultTolerances": {...}, "tiers": {...} }
  figma/                             # or docs/figma-to-code/
    source-map.md
    specs/
      design-system.json
      screens/
        <screen-or-flow>.json
    assets/
      asset-manifest.json
  artifacts/<slug>/                  # per-task
    screenshots/                     # figma-*.png, impl-*.png, contact-*.png
    probes/
    reviews/
    VALIDATION.md
  assets/figma/ ...                  # exported assets (or src/assets/figma, project convention)
  (code) app/ components/ theme/ ... # with stable testIDs matching spec nodes
```

Source of truth for schemas: `templates/FIGMA_SPEC.schema.json`, `asset-manifest.schema.json`, `VALIDATION.md`.

### Compact Gated Workflow (Tier-Filtered)

1. Intake + declare T0–T4 + artifact dir.
2. Source Capture Gate (MCP `get_design_context` / `get_variable_defs` / `get_screenshot` / `get_metadata` preferred; node IDs + prototype map mandatory for ≥T2).
3. Design Authority (criteria + sign-off before visual edits for ≥T2).
4. Token/DS extraction (modes, mappings, raw handling documented).
5. Measured spec(s) at critical-node depth for tier.
6. Asset Gate (export + manifest complete before any asset-dependent visual code).
7. Implement in canonical source only (tokens + exported assets + Code Connect + testIDs). Adapt, do not copy MCP snippets literally.
8. Route/Deploy Guard (T3+ or public).
9. Verification: mechanical + runtime probe (geometry+assets) + matched screenshots + contact sheet + visual regression (per tier) + functional.
10. Skeptical P0/P1/P2 review (per tier).
11. Design Authority final visual acceptance.
12. Complete VALIDATION.md with evidence, deltas, waivers, verdict.

Loop on fidelity: update spec/asset/probe, fix source, re-verify. No silent polish.

### Final Checklist (Tier-Adjusted — Agents Use This)

**All tiers**:
- Tier declared in source-map + VALIDATION.
- Source pointer / capture committed.
- Mechanical checks clean.
- VALIDATION.md present with verdict.

**T1+**: Token check or local map; asset check if visuals touched; before/after or ref + impl screenshots.

**T2+**: Source map; DS extraction (or local); critical-node spec + testIDs; runtime geometry+asset probe + deltas; matched screenshots + contact sheet; asset manifest complete for custom; no unwaived P0 anti-patterns.

**T3+**: Prototype map + interactions; route/deploy diff clean or approved; visual regression; skeptical review completed; Design Authority final sign-off; full VALIDATION with evidence.

Only after tier-appropriate pass + committed VALIDATION is the work complete.

### Tolerances (Default; Override in Spec)

- Primary geometry (rails, key positions, padding): ±2 px
- Secondary: ±4 px
- Radius: ±1 px
- Colors / token refs: exact match or logged delta + visual acceptance
- Typography: family/weight/size exact; line-height/wrapping per spec or platform norm
- Assets: exact file + preserveCanvas/viewBox/strokePolicy honored

### Source & Research Limitations (Honest)

- GitHub searches (design-tokens, figma-expo, figma-mcp-code-connect) returned empty arrays.
- Managed web search / Firecrawl hit billing/insufficient balance limits.
- Browser searches frequently triggered bot/CAPTCHA blocks.
- No xurl / X API search executed in this run.
- Primary evidence: official Figma MCP/Dev Mode/Code Connect documentation, Figma Variables & REST API, DTCG format (explicitly a working draft in cited sources), Expo Image / Router / RN SVG docs, Maestro & Chromatic visual testing patterns, and prior gold-plan-work enforcement artifacts that had already been applied successfully on real Figma-to-Expo work.
- MCP reference code is treated strictly as evidence, not gospel (per rebuttal).
- This policy is therefore grounded in primary tooling docs + proven enforcement patterns, not broad secondary corpus validation. Update when new public case studies or MCP capabilities emerge.

### Pass / Fail Rubric (Use in VALIDATION)

- **PASS**: All tier-mandatory evidence present, no open P0, deltas within tolerance or properly waived, Design Authority visual acceptance, VALIDATION complete.
- **PASS WITH WAIVERS**: As above + documented waivers meeting governance rules.
- **FAIL**: Missing mandatory artifact/evidence for tier, open P0 (especially asset/route/source violations), unwaived high-impact anti-pattern, or visual rejection by Authority.

**Evidence required for every must-pass item**: artifact paths, command output, screenshots, MCP logs, diffs, or dated sign-offs.

This is the enforceable, cross-project form. Use with the provided schemas and a preflight/enforcement companion for automation.