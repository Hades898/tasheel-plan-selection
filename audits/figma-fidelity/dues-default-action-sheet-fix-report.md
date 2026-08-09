# Dues Default + View All Action Sheet Fix

## User correction

The default Dues state should not preselect all dues. It should select only the nearest upcoming plan — the top row — and let the user add more dues from `View all`.

## Changes

- Dues default selection is now only the top / nearest upcoming due.
- Top due amount restored to `1,800`.
- Default ring state now shows:
  - `1 Due Selected`
  - `1,800`
  - `Remaining [SAR icon] 1200`
- Primary CTA now defaults to `Pay selected [SAR icon] 1,800`.
- `View all` no longer routes away to `/checkout/next-up`.
- `View all` now opens an in-place bottom action sheet over the Dues screen.
- The action sheet lists dues as selectable rows so the user can add/remove dues.
- Selecting another due in the sheet updates:
  - ring selected count
  - ring amount
  - remaining amount
  - Done CTA total
  - base CTA total after closing the sheet
- The action sheet can be closed with the scrim, close button, or Done CTA.

## Verification

Passed:

```bash
npm run typecheck
npm run export:web
node scripts/in-app-qa.cjs
node scripts/figma-geometry-probe.cjs
node scripts/typography-probe.cjs
```

Interactive Playwright checks passed:

- Default Dues route shows only `1 Due Selected` and `Pay selected 1,800`.
- `View all` opens the `dues-action-sheet` without route navigation.
- Action sheet copy explains adding more dues.
- Selecting one Jarir row updates to `2 Dues Selected` and `2,400`.
- Done closes the sheet and keeps the added due in the base screen.

## Visual check

Browser visual check confirms the action sheet appears as a rounded bottom sheet with scrim over the same Dues route.
