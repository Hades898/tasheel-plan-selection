# Restart handoff — Tasheel BNPL browser prototype

Date: 2026-06-09
Branch: `fix/in-app-fidelity`
Project: `/Users/hadysoliman/tasheel-bnpl-browser-prototype`

## Why this file exists

User is restarting the laptop and wants to pick up exactly where the current Dues/Figma-fidelity work left off.

## Current user priority

Make the Tasheel BNPL in-app prototype PE-perfect for the Dues happy case and worst/worst-edge case:

- Dues screen should be a coherent payment-selection engine, not just Figma-looking static UI.
- Math must make sense.
- `View all` must only exist if there are actually hidden upcoming dues.
- Ring must be interactive, state-driven, visually clean, and tied to selection state.
- Default state should select only the nearest upcoming/top due.
- User can add more dues through the action sheet.
- Payment Method must carry the selected amount forward.

## Latest implemented state

### Main Dues engine

Implemented in `App.tsx`:

- Shared `DUE_ITEMS` dataset with 9 upcoming due instances.
- Main Dues screen previews first 4 nearest dues.
- Hidden count is computed: `9 total - 4 visible = +5 More next up payments`.
- `View all` opens a bottom action sheet with all 9 dues.
- Selection state is lifted to `App()` so Dues, Next Up, and Payment Method share the same selected dues.
- Default selected due is nearest/top row only.
- Zero selected disables CTA.
- Payment Method amount now uses selected due total instead of hardcoded `1,800`.

### Current visible due data

Visible preview rows:

1. Extra Stores — iPhone 16 Pro Max — SAR 1,800 — In 2 days / April 20th — 2 of 4
2. Jarir — MacBook Air M4 — SAR 600 — In 9 days / April 27th — 2 of 4
3. Noon — AirPods Pro — SAR 300 — In 16 days / May 4th — 2 of 3
4. Jarir — iPad Air — SAR 300 — In 23 days / May 11th — 3 of 4

Hidden rows in `View all`:

5. Extra Stores — Dyson V15 — SAR 300 — In 30 days / May 18th — 3 of 4
6. Jarir — Gaming Monitor — SAR 600 — In 37 days / May 25th — 3 of 4
7. Noon — Apple Watch — SAR 300 — In 44 days / June 1st — 3 of 3
8. Extra Stores — iPhone 16 Pro Max — SAR 300 — In 51 days / June 8th — 4 of 4
9. Jarir — MacBook Air M4 — SAR 600 — In 58 days / June 15th — 4 of 4

### Math invariants now implemented

Derived in `deriveDuesSummary()`:

- `selectedCount = count(selected due IDs)`
- `selectedAmount = sum(selected due amounts)`
- `visibleTotal = sum(first 4 visible dues) = 3,000`
- `totalAmount = sum(all 9 dues) = 5,400`
- `hiddenCount = max(0, totalCount - visibleCount)`
- `remainingVisibleAmount = max(0, visibleTotal - selectedAmount)`
- CTA amount = `selectedAmount`
- Ring center amount = `selectedAmount`
- Payment Method amount = `selectedAmount`

### Current happy case

At `/checkout/dues`:

- 1 Due Selected
- SAR 1,800
- Remaining SAR 1,200
- `+5 More next up payments`
- CTA: Pay selected SAR 1,800

### Current worst/edge case behavior

Verified with Playwright:

- Zero selected:
  - 0 Dues Selected
  - amount 0
  - CTA disabled
  - copy: `Select dues to pay`
- Add one more due from sheet:
  - 2 Dues Selected
  - amount 2,400
- Select all four visible preview dues:
  - 4 Dues Selected
  - amount 3,000
  - remaining 0
- Payment Method carries selected amount; tested with 3,000.

## Ring state

Current ring is a reconstructed dynamic SVG in `DuesRing()`.

- Ring progress is amount-based against the visible window: `selectedAmount / visibleTotal`.
- Default 1,800 / 3,000 displays about 60% arc.
- Weird pale halo/blob around dots was removed.
- Dot/marker colors were softened.
- Six markers are currently used as Figma-like visual progress anchors, not one marker per all 9 dues.

Important caveat: the ring is behavior-correct and cleaner, but it is still not literal pixel-perfect Figma artwork. If the user says the ring still is not good enough, next step should be a ring-specific Figma asset/spec pass:

1. Re-open Figma node `1843:17915`.
2. Extract ring group/layers from MCP.
3. Build an exact measured ring spec: center, radius, stroke width, arc path, marker positions, marker colors, inner disk size.
4. Patch `DuesRing()` only.
5. Verify via screenshot comparison and Playwright dash/selection checks.

## Key Figma nodes

- Board/root flow: `814:23900`
- Dues screen: `1843:17915`
- Old/stale overlay/sheet node previously confused with base dues: `876:17923`

Figma URL:
https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=1843-17915&t=j4iGP56XKrdloEVc-4

## Validation already run and passing

Last verified after the Dues engine refactor:

```bash
cd /Users/hadysoliman/tasheel-bnpl-browser-prototype
npm run typecheck
npm run export:web
node scripts/in-app-qa.cjs
node scripts/figma-geometry-probe.cjs
node scripts/typography-probe.cjs
```

A custom Playwright happy/worst-case flow also passed:

- default coherent state
- `View all` reveals all 9 rows
- adding second due updates to 2,400
- selecting all visible preview dues updates to 3,000
- Payment Method carries 3,000
- zero selected disables CTA
- ring dash changes after selection change

## Current local preview URLs

Before restart, local servers were running outside Hermes tracked background process list:

- `127.0.0.1:4174` PID `30866`
- `127.0.0.1:4182` PID `60858`

After laptop restart these will be gone. To restart preview:

```bash
cd /Users/hadysoliman/tasheel-bnpl-browser-prototype
npm run export:web
python3 scripts/serve-spa.cjs 4174 dist
```

If that script signature fails, use:

```bash
node scripts/serve-spa.cjs dist 4174
```

Then open:

```text
http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/dues?resume=1
```

If needed, inspect `scripts/serve-spa.cjs` for exact args.

## Files most relevant to continue

### Source

- `App.tsx`
  - `DUE_ITEMS`
  - `deriveDuesSummary()`
  - `DuesRing()`
  - `DueRow()`
  - `Dues()`
  - `NextUp()`
  - `PaymentMethodScreen()`
  - lifted `selectedDueIds` in `App()`

### QA scripts

- `scripts/in-app-qa.cjs`
- `scripts/figma-geometry-probe.cjs`
- `scripts/typography-probe.cjs`
- `scripts/patch-gh-pages-export.cjs`

### Reports

- `audits/figma-fidelity/dues-perfect-engine-validation.md`
- `audits/figma-fidelity/ring-dot-cleanup-data-fix-report.md`
- `audits/figma-fidelity/dues-default-action-sheet-fix-report.md`
- `audits/figma-fidelity/dynamic-dues-ring-fix-report.md`
- `audits/figma-fidelity/clickability-ui-bug-hunt-report.md`
- `audits/figma-fidelity/ui-flow-repair-report.md`
- `audits/figma-fidelity/flow-map-814-23900.md`

## Current git/worktree warning

Branch: `fix/in-app-fidelity`.

There are many uncommitted changes. `git status --short` currently shows many `AD` entries for static/exported artifacts and generated files, plus modified source/scripts. Do not commit blindly.

Before committing/deploying, do a cleanup pass:

```bash
cd /Users/hadysoliman/tasheel-bnpl-browser-prototype
git status --short
git diff -- App.tsx scripts/in-app-qa.cjs scripts/patch-gh-pages-export.cjs scripts/figma-geometry-probe.cjs scripts/typography-probe.cjs
git diff --stat
```

Likely commit-worthy source/report changes:

- `App.tsx`
- `scripts/in-app-qa.cjs`
- `scripts/patch-gh-pages-export.cjs`
- `scripts/figma-geometry-probe.cjs`
- `scripts/typography-probe.cjs`
- `audits/figma-fidelity/*.md`
- `figma-spec/*` if generated specs are intended to be tracked
- `public/figma/*` if needed for asset fidelity

Be careful with the many generated/deleted static route files and `assets/node_modules/...` paths; verify whether they are intentional tracked artifacts before staging.

## Recommended next prompt after restart

Paste this to continue:

```text
Pick up from /Users/hadysoliman/tasheel-bnpl-browser-prototype/RESTART_HANDOFF.md. Start by reading that file, checking git status, restarting the local preview, then visually QA the Dues screen and especially the ring against Figma node 1843:17915. Do not deploy. If the ring is still not pixel-perfect, do a ring-specific Figma asset/spec pass and patch only DuesRing.
```

## Do not forget

- Do not deploy without explicit user approval.
- Do not replace the prototype with a narrow slice.
- Preserve full route map and existing flow.
- UI/UX/Figma fidelity only; avoid backend work.
- Use Figma as source of truth when it exists.
- User is not satisfied by generic/local-model design output; use real references and browser screenshot verification.
