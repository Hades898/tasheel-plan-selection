# Ring Dot Cleanup + Dues Data Fix

## User correction

The endpoint dot had a weird extra pale shape around it, and the due rows felt fake because several items shared the same `In 7 days` timing.

## Changes

- Removed the extra endpoint halo circle from the dynamic Dues ring.
- Kept the clean filled ring markers directly on the ring stroke.
- Preserved the active arc and selected endpoint behavior without the blob/overlap artifact.
- Reworked due row data so the schedule makes more sense:
  - Extra Stores — `1,800` — `In 2 days - April 20th`
  - Jarir — `600` — `In 9 days - April 27th`
  - Noon — `300` — `In 16 days - May 4th`
  - Jarir — `300` — `In 23 days - May 11th`
- Kept total selectable due amount at `3,000`, so the default selected top due remains `1,800` and remaining stays `1200`.
- Aligned the Next Up ring total with the same revised due data.

## Verification

Passed:

```bash
npm run typecheck
npm run export:web
node scripts/in-app-qa.cjs
node scripts/figma-geometry-probe.cjs
node scripts/typography-probe.cjs
```

Interactive Playwright assertions passed:

- No endpoint halo/blob circle remains in the ring SVG.
- Staggered dates are visible: 2, 9, 16, and 23 days.
- Default state is still top-only selected: `1 Due Selected` / `Pay selected 1,800`.
- `View all` opens the dues action sheet.
- Adding the second due updates the sheet/ring state to `2 Dues Selected` / `2,400`.
