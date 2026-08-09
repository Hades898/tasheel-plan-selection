# Dynamic Dues Ring Fix Report

## Problem

The Dues ring was still effectively a static Figma asset. Row selection changed text/totals, but the ring itself did not behave like the Figma interaction model: each selected due should advance the informational ring to the next point and update the displayed total/remaining amount.

## Figma reference used

- Board/root flow: `814:23900`
- Dues screen: `1843:17915`
- Ring group: `1843:17963` (`DuesRing — Segmented (sandbox)`)
- Figma confirms visible anchor dots and center text:
  - `4 Dues Selected`
  - `1,800`
  - `Remaining 1200`

## Patch

Replaced the static filled-ring image layer with a source-level dynamic SVG ring:

- Ring arc is derived from `selectedCount / totalDues`.
- Active point anchors are derived from selected count.
- The active glow moves to the current point.
- Center label is derived from selected count.
- Center amount is derived from selected row totals.
- Remaining amount is derived from `totalAmount - selectedTotal`.
- Default state still matches Figma: 4 selected, 1,800 selected amount, Remaining 1200.
- Clicking a due row now updates:
  - row selected/unselected state
  - selected count
  - ring arc length
  - active point anchors
  - glow endpoint
  - displayed amount
  - remaining amount
  - CTA amount

## Interaction verification

Playwright click checks passed:

- Initial Dues screen shows `4 Dues Selected`, `1,800`, `Remaining 1200`.
- Dynamic SVG ring exists and exposes circle/dash state.
- Clicking a Jarir due changes the screen to `3 Dues Selected`, `1,200`, `Remaining 1800`.
- The active ring dash changes after the click.
- Clicking the same row again restores `4 Dues Selected`, `1,800`, `Remaining 1200`.

## Full verification

Commands passed:

```bash
npm run typecheck
npm run export:web
node scripts/in-app-qa.cjs
node scripts/figma-geometry-probe.cjs
node scripts/typography-probe.cjs
```

Browser visual checks:

- Default state visually shows a segmented active arc and active point anchors.
- After clicking a row, the ring shortens/moves, text changes to `3 Dues Selected`, amount changes to `1,200`, remaining changes to `1800`, and the clicked row becomes unselected.

## Remaining note

This is now state-driven and app-like, but it is still an SVG reconstruction of the ring behavior rather than multiple Figma-exported ring variants. If absolute pixel-perfect ring geometry is required, the next pass should export or spec every ring state from Figma and match each state point-by-point.
