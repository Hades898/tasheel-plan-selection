# Figma Golden Intake Plan

Use this file as the starting plan whenever a new Figma-to-code / Figma-to-Expo task begins.

## 0. Classify tier

- [ ] T0 Mechanical non-visual
- [ ] T1 Small visual patch
- [ ] T2 New component or screen
- [ ] T3 Flow / public prototype / brand-critical
- [ ] T4 Design-system migration

Chosen tier:
Reason:

## 1. Intake fields

Figma URL(s):
Node ID(s):
Project path:
Existing deploy/prototype URL:
Target platform(s): Expo Go / dev client / iOS sim / Android / RN Web / GitHub Pages / other
Scope:
Known constraints:

## 2. Required skills/references

- [ ] `figma-expo-asset-accuracy`
- [ ] `figma-expo-asset-accuracy/references/golden-figma-to-code-policy.md`
- [ ] `ui-frontend-empowerment`
- [ ] `impeccable`
- [ ] `design-taste-frontend` or `gpt-taste`
- [ ] copy/UX skills if user-facing copy is touched

## 3. Source Capture Gate

- [ ] Figma source map created
- [ ] `get_design_context` captured
- [ ] `get_variable_defs` captured
- [ ] Figma screenshot captured
- [ ] metadata/hierarchy captured
- [ ] frame dimensions/order recorded
- [ ] prototype interactions recorded if clickable

Artifact paths:

## 4. Design Authority Gate

- [ ] Design read written
- [ ] Typography criteria
- [ ] Color/token criteria
- [ ] Layout/spacing criteria
- [ ] Motion/interactions criteria
- [ ] Do-not-change constraints
- [ ] Final acceptance criteria

Artifact path:

## 5. Token / Design System Gate

- [ ] Existing project tokens/theme read
- [ ] Figma variables/styles/modes extracted
- [ ] `figma/specs/design-system.json` created or updated
- [ ] Raw Figma values recorded if no variable exists
- [ ] Code Connect/component mapping attempted where relevant

Artifact path:

## 6. Frame Spec Gate

- [ ] Critical nodes identified
- [ ] `figma/specs/screens/<screen>.json` created
- [ ] Critical nodes have bounds/styles/token refs
- [ ] Asset-bearing nodes linked to manifest keys
- [ ] Stable testIDs/selectors mapped
- [ ] Tolerances declared

Artifact paths:

## 7. Asset Gate

- [ ] Exportable assets identified
- [ ] Logos/custom icons/brand marks/illustrations/etc exported from Figma
- [ ] `figma/assets/asset-manifest.json` created
- [ ] hashes/dimensions/viewBox/preserveCanvas/stroke policy recorded
- [ ] no unwaived agent-redrawn assets

Artifact paths:

## 8. Implementation Gate

- [ ] Canonical source edited only after gates above
- [ ] Project components reused
- [ ] Tokens used instead of arbitrary literals
- [ ] Exported assets used instead of redraws
- [ ] TestIDs/selectors added
- [ ] Expo/RN platform behavior respected

Changed files:

## 9. Route / Deploy Preservation Gate (T3+ or public)

- [ ] source route map captured
- [ ] existing public route/deploy artifact captured
- [ ] direct deep links tested
- [ ] aliases/base path/assets checked
- [ ] deploy diff checked for mass deletions

Evidence:

## 10. Verification Gate

- [ ] typecheck/build
- [ ] expo-doctor if Expo
- [ ] local preview
- [ ] console/redbox/page errors
- [ ] scroll reachability
- [ ] safe areas/responsive
- [ ] runtime probe against spec
- [ ] Figma screenshot
- [ ] implementation screenshot
- [ ] contact sheet
- [ ] visual regression if tier requires

Evidence paths:

## 11. Skeptical Review Gate

- [ ] P0/P1/P2 review completed if required
- [ ] all P0s closed or properly waived
- [ ] P1/P2 status documented

Review path:

## 12. VALIDATION.md

- [ ] Source section complete
- [ ] Design Authority section complete
- [ ] Assets section complete
- [ ] Implementation section complete
- [ ] Checks section complete
- [ ] Screenshots section complete
- [ ] Fidelity deltas section complete
- [ ] Reviewer results complete
- [ ] Verdict recorded: PASS / PASS WITH WAIVERS / FAIL

Validation path:
