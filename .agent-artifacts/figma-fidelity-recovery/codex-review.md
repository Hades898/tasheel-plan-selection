# Codex Figma Fidelity Review

## Verdict
BLOCKED

## P0 blockers
- Missing fidelity-grade Figma specs for the routed target slice. `figma-spec/` only contains `checkout.json` and `home.json`, while the source map and QA target `/checkout/detail`, `/checkout/details`, `/checkout/dues`, `/checkout/purchases`, and `/checkout/insights` as well.
- Asset gate is not closed. `assets/figma/asset-manifest.json` marks `riyalMark` as `blocked_export_required`, and `App.tsx` still renders a text glyph `﷼` instead of a Figma-exported Riyal vector.
- Invented/recreated assets remain in source despite available or required Figma assets. `DuesRing` is hand-rendered with SVG circles instead of `duesTrack`, `duesFilled`, `duesDot`, and `progressThumb`; checkout browser controls are text glyphs instead of `checkoutReload` / `checkoutSiteSettings`; status/device icons and nav icons are also recreated.
- Runtime “geometry probe” is not a fidelity probe. `scripts/figma-geometry-probe.cjs` checks route load, text presence, image load, console errors, and overflow, but does not compare actual DOM geometry/styles against Figma expected bounds with tolerances. Treating this as fidelity QA would be smoke QA used as fidelity QA.
- The implementation report explicitly says “pixel-perfectness is approximated” and allows recreated glyphs. That is incompatible with a deploy-ready fidelity claim under this gate.

## P1 major issues
- Key geometry drift is unmeasured. The probe output records rects, but no expected-vs-actual deltas, no pass/fail thresholds, and no node-level comparison against `figma-spec`.
- Screenshots are incomplete for the target slice. `audits/figma-fidelity/screenshots/` contains only `checkout-mobile.png`, `home-mobile.png`, and `home-short.png`; no detail, dues, purchases, insights, desktop, or contact sheet evidence exists in that requested folder.
- No Figma/live diff or contact-sheet artifact was found for the current frozen-node target slice. Older contact sheets exist under `audits/tasheel-ui-bugs/more/`, but those are tied to earlier/stale comparison work.
- Token/radius/type/shadow mapping is partial. Checkout/home specs contain some token values, but non-home app screens rely on broader prose specs and source constants rather than measured `figma-spec/*.json` node style mappings.
- Inner scroll/short-mobile evidence is not fidelity-grade. QA records scroll counts and screenshots, but does not assert bottom content reachability or compare tall-frame positions against Figma for detail, dues, purchases, and insights.

## P2 follow-ups
- Remove or quarantine dead hand-drawn icon components (`IconCoins`, `IconBag`, `IconChart`) once exported assets are the only path.
- Consolidate spec sources. There is both `figma-spec/*.json` and `audits/figma-fidelity/figma-fidelity-spec.json`; the latter includes broad screen requirements but is not equivalent to measured per-screen Figma specs.
- Add stable `testID` / node mappings across all target screens, not only home action tiles and merchant badges.
- Clean up stale audit artifacts that reference old node namespaces so future reviews do not mix frozen and stale sources.

## Evidence checked
- `.agent-artifacts/figma-fidelity-recovery/FIGMA-SOURCE-MAP.md`
- `.agent-artifacts/figma-fidelity-recovery/OPUS-DESIGN-AUTHORITY.md`
- `figma-spec/checkout.json`
- `figma-spec/home.json`
- `assets/figma/asset-manifest.json`
- `audits/figma-fidelity/BNPL_FIGMA_SPEC.md`
- `audits/figma-fidelity/figma-fidelity-spec.json`
- `audits/figma-fidelity/geometry-probe.json`
- `audits/figma-fidelity/claude-implementation-report.md`
- `audits/fix-verify/in-app-qa-summary.json`
- `audits/fix-verify/route-summary.json`
- `scripts/figma-geometry-probe.cjs`
- `App.tsx`
- Screenshot inventory under `audits/figma-fidelity/screenshots/` and `screenshots/fix-verify/`

## Missing evidence
- Measured `figma-spec/*.json` for detail, dues, purchases, insights, and any accepted aliases.
- Exported Riyal mark assets and source usage.
- Runtime probe with Figma expected bounds/styles, actual values, deltas, and tolerance failures.
- Current Figma-vs-live screenshots/contact sheet/diff for every target route and viewport.
- Validation artifact such as `VALIDATION.md`.
- Evidence that all required exported assets are used instead of recreated glyphs/SVG approximations.

## Deploy decision
Blocked. TypeScript, web export, route QA, image-load checks, and smoke probes are useful evidence, but the deploy gate requires specs, assets, runtime probe, screenshots, route QA, and validation for the full target slice. That bar is not met.
