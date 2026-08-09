# Tasheel BNPL Figma Source Map

This file freezes the source of truth for a spec-driven rebuild. Do not use stale nodes from old repo docs unless they are reconciled here.

## Root sources

- Checkout root: `355:48766`
- Checkout key frame: `355:58228`
- Inner app root: `814:23900`
- Home root/section: `814:23901`
- Home first concrete frame: `1843:18080` (`BNPL Home`, 402×1033)
- Home conditions/menu group: `814:23902` (`Group 32764`, 360×448)
- Detail: `814:24410` (`Transaction details [flow]`, 402×1330)
- Dues root: `814:24004` (`Next Up` section)
- Dues primary screen: `876:17923` (`6 Dues`, 402×890)
- My dues screen: `1843:17915` (`My dues`, 402×890)
- Purchases root: `814:24389` (`My Purchases` section)
- Purchases screen: `814:24392` (`My purchases`, 402×918)
- Insights root: `814:24313` (`Insights` section)
- Insights screen examples: `1579:11144`, `1579:11218`, `1579:11321`, `1579:11292`, `1579:10592`

## Figma access smoke check

Verified in this session:

- `get_design_context(355:58228)` returned checkout structure and tokens/classes.
- `get_design_context(814:23901)` returned sparse section metadata, so child frames must be fetched individually.
- Checkout screenshot: `/Users/hadysoliman/.hermes/image_cache/img_88b59b528766.png`
- Home section screenshot: `/Users/hadysoliman/.hermes/image_cache/img_fbeb784ca18f.png`

## Required extraction pass

For every target frame, collect:

- Figma `get_design_context`
- Figma screenshot
- frame width/height
- variables/tokens
- component instances/variants
- text styles
- exportable assets
- exact x/y/w/h bounds for mapped nodes

## Additional frames to identify before implementation

- Dues frame: `876:17923`, `1843:17915`
- Purchases frame: `814:24392` (also `894:8481` alternate)
- Insights frames: `1579:11144`, `1579:11218`, `1579:11321`, `1579:11292`, `1579:10592`
- Any checkout sub-states: start from `355:48766`; key frame `355:58228`

## Non-negotiables

- Existing full clickable flow and route map stay intact.
- Do not replace the flow with a narrow SPA or single-screen export.
- Do not add fake browser/Safari chrome unless it is explicitly part of the Figma frame.
- Do not claim fidelity from smoke QA. Text exists + route loads is not fidelity.
- Do not hand-redraw merchant logos, Riyal icons, thumbs, DuesRing, or custom vectors unless explicitly waived.
- Use Figma variables/tokens instead of invented global design-system values.

## Required artifacts before a fidelity claim

- `figma-spec/*.json`
- `assets/figma/asset-manifest.json`
- runtime geometry/style probe output
- route/deep-link smoke QA output
- desktop/mobile/short-mobile screenshots
- Figma/live/contact-sheet screenshots
- `VALIDATION.md`
- Codex P0/P1/P2 review
- Opus final visual acceptance
