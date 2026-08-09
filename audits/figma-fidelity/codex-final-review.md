FAIL

P1 blocker:
- [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:684): Dues center summary does not match the Figma/source spec. Current UI renders `4 Dues Selected`, amount `1,800`, and `Remaining 1200`, but the Dues Figma spec expects `3 Dues Selected`, amount `3,000`, and `Remaining 1800`. This is also internally inconsistent with the CTA at [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:729), which says `Pay selected ﷼ 3,000`.

Verification gap tied to the blocker:
- [scripts/figma-geometry-probe.cjs](/Users/hadysoliman/tasheel-bnpl-browser-prototype/scripts/figma-geometry-probe.cjs:8) and [scripts/in-app-qa.cjs](/Users/hadysoliman/tasheel-bnpl-browser-prototype/scripts/in-app-qa.cjs:50) assert the stale wrong Dues copy, so the reported passing verification does not catch this P1 mismatch.

I did not find a P0/P1 route/base-path regression in `App.tsx`, and the current `dist/figma` export contains the top-level Figma assets used by the app.
