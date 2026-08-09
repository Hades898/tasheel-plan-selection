# Codex re-review: BNPL font-weight fidelity fix after Money component P1

Repo: `/Users/hadysoliman/tasheel-bnpl-browser-prototype`

You previously BLOCKED because:
1. `Money` hard-coded main amount at 700, over-bolding ordinary app values.
2. typography probe did not cover app money values.

Fix now applied:
- `Money` and `Riyal` accept `weight`, defaulting to `600` for ordinary app values.
- Large source-backed amounts pass `weight="700"` only where intended: home hero `4,250`, insights hero `4,300`, dues ring `3,000`.
- Ordinary card/detail/schedule/transaction/dues-row amounts remain default `600`.
- `scripts/typography-probe.cjs` now covers 34 cases including app money values: `450`, `3,666`, `916.50`, `600`, `1,800`, plus bold hero/ring amounts.

Checks run:
- `npm run typecheck` passed
- `npm run export:web` passed
- `npm run qa:typography` passed 34/34
- `npm run qa:in-app` passed
- `node scripts/figma-geometry-probe.cjs` passed

Please re-review current diff only for typography/font-weight fidelity. Return PASS or BLOCK with P0/P1/P2 and exact file/line references.