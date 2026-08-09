# Font-weight fidelity fix report

## Scope

User correction: font weights were still incorrect after the font-family pass.

Target files:
- `App.tsx`
- `scripts/typography-probe.cjs`

Source of truth:
- `audits/figma-fidelity/BNPL_FIGMA_SPEC.md`
- `figma-spec/checkout.json`
- `figma-spec/home.json`
- Figma nodes: checkout `355:58228`, app surfaces from `814:23900` / routed frames.

## Claude attempt

A bounded Claude Code task was created at `.claude/tasks/font-weight-fidelity-fix.md`, but Claude could not write because the non-interactive permission prompt declined file edits. Hermes applied the fix directly and sent the result to Codex for review.

## Weight policy applied

Figma weight scale now used in code:
- regular: `400`
- medium: `500`
- semibold: `600`
- bold: `700`
- no visible `800` / `900` font weights remain in `App.tsx`

Checkout / Inter:
- merchant title: `700`
- subtitle, unselected options, subcopy: `400`
- product title, payment heading, selected BNPL title, CTA: `600`
- product price: `700`

App / SF Pro:
- labels, captions, body copy: `400`
- small/app CTA labels and action-tile labels: `500`
- section titles, links, status text, table values, ordinary money values: `600`
- large title/page title and source-backed emphasized hero/ring amounts: `700`

## Code changes

`App.tsx`:
- Changed over-heavy `800`/`900` text styles to Figma-aligned `400`/`500`/`600`/`700`.
- Added `coLabelSelected` so checkout option labels can be regular by default and semibold only for the selected BNPL row.
- Changed `Money` and `Riyal` to accept a `weight` prop.
- `Money` now defaults to `600` so ordinary app amounts do not render as bold.
- Explicit `weight="700"` is only used for source-backed emphasized amounts:
  - home hero `4,250`
  - insights hero `4,300`
  - dues ring `3,000`

`scripts/typography-probe.cjs`:
- Extended from font-family only to font-family plus computed font-weight.
- Probe now has 34 cases.
- Added app money-value coverage so a shared `Money` regression cannot slip through:
  - `450`
  - `3,666`
  - `916.50`
  - `600`
  - `1,800`
  - plus bold hero/ring amounts.

## Verification run by Hermes

Passed:
- `npm run typecheck`
- `npm run export:web`
- `npm run qa:typography` with 34/34 passing family+weight cases
- `npm run qa:in-app`
- `node scripts/figma-geometry-probe.cjs`

## Codex review

First Codex review: BLOCKED.
- P1: `Money` still hard-coded `700` and over-bolded ordinary app values.
- P1: probe did not cover app money values.

Fix applied:
- `Money` defaulted to `600` with explicit `weight` prop.
- Typography probe extended to cover app money values.

Second Codex review: PASS.
- No P0/P1/P2 findings for typography/font-weight fidelity.
- Codex confirmed ordinary app money values are now `600`, intended emphasized app amounts are `700`, and probe coverage has 34 cases.
