# VALIDATION — BNPL plan selection, two experiences

Mobile-web prototype of two plan-selection experiences, built from Figma
`geEFxJ11n2KySAZB6zsjEh` node **`3615:74055`** (Section 2).

| | Route | Figma frame |
|---|---|---|
| **A — Plan list** | `/checkout/onboarding/plans` | `3615:73832` ("2 Month") |
| **B — Tenure stepper** | `/checkout/onboarding/tenure` | `3529:83312` ("4 Month") |

Both are full-bleed mobile views (402 × 874 shell, no side chrome), forked from the
deployed prototype at `hades898.github.io/tasheel-bnpl-prototype` so they sit inside
the real checkout flow rather than standing alone.

---

## Source capture

| Artifact | Source |
|---|---|
| Design context | `get_design_context` on `3615:73836`, `3593:73823`, `3529:83319` |
| Metadata | `get_metadata` on `3615:74055` (full node tree, measured) |
| Variables | `get_variable_defs` on `3615:74055` |
| Screenshot | `get_screenshot` on `3615:74055` → `screenshots/plan-selection/figma-source.png` |

## Tokens (bound from Figma variables, not eyeballed)

| Role | Value | Figma variable |
|---|---|---|
| Canvas | `#f9fafb` | `Surface & Screen/bg_canvas` |
| Surface | `#ffffff` | `Surface & Screen/bg_surface` |
| Primary CTA | `#022b10` | `Surface & Screen/Interactive/bg_primary` |
| CTA ink | `#3eff00` | `Text/text_on_primary` |
| Ink | `#030712` / `#4b5563` / `#6b7280` | `text_primary` / `text_secondary` / `text_tertiary` |
| Success | `#166534` | `Status & Feedback/bg_success` |
| Success subtle | `#f0fdf4` | `Status & Feedback/bg_success_subtle` |
| Brand link | `#16720b` | `Text/text_brand` |
| Border subtle | `#f3f4f6` | `Stroke/border_subtle` |
| Disabled | `#e5e7eb` / `#9ca3af` | `bg_disabled` |
| Radii | card 40, row 24, badge 16 (bl/tr), pill 999 | source frames |

## Asset provenance — no agent-drawn marks

Every glyph on these screens is an exported Figma vector or an asset already in the
base. Nothing was redrawn.

| Asset | Source node | How it ships |
|---|---|---|
| `sale-03` (discount tag) | `2145:20527` | inlined `<Svg><Path>` (`SaleTag`), recoloured `#166534` / `#3eff00` |
| `minus` | `1673:59207` | `assets/figma/wcMinus.svg` (base) |
| `plus` | `1673:59201` | `assets/figma/wcPlus.svg` (base) |
| `shopping-cart` | `238:84953` | `assets/figma/wcCartIcon.svg` (base) |
| `arrow-right` | `238:76348` | `assets/figma/wcArrowRight.svg` (base) |
| Riyal glyph | `5469:2` | `assets/figma/riyalDark.svg` / `riyalOnPrimary.svg` (base) |
| Tasheel wordmark | base | `assets/figma/wcTasheelLogo.svg` |

Raw exports pulled during this run are kept in `assets/icons/` for reference.

## Technical verification

- `npm run typecheck` — clean
- `npm run export:web` — clean, 31 route aliases incl. `/checkout/onboarding/plans`
- Playwright run (`scripts/shot-plan-selection.cjs`) — **0 page errors** across both
  routes, all six tenures, and every sheet
- Fixed during the run: the selected tenure was stuck at `scale(0.3)` after any
  change — the slot is keyed by its value so it remounts, and the native-driver
  spring stayed bound to the unmounted node. Now driven from an effect with
  `useNativeDriver: false`. Verified: `matrix(1,0,0,1,0,0)` after settle.

## Visual verification

`screenshots/plan-selection/` (402 × 874 @2x, iPhone UA):

- `A-list-default.png`, `A-list-bottom.png`, `A-list-selected-12.png`,
  `A-list-discounts-sheet.png`, `A-list-cart-sheet.png`
- `B-stepper-4.png`, `B-stepper-2.png`, `B-stepper-24.png`,
  `B-stepper-discounts-sheet.png`, `B-stepper-details-sheet.png`

## Reference-lock match

**Preserved from source:** 24-radius white plan rows with `0 16px 40px rgba(0,0,0,.12)`;
the `#166534` discount badge tucked into the row's own top-right corner
(`border-bottom-left-radius:16` + `border-top-right-radius:16`, clipped by the row);
`#f3f4f6` tick rail with white `−` and dark-green `＋`; every tenure visible at 20%
with the selected one at 34px bold plus its unit label; `#f0fdf4` saving strip with an
underlined brand-green link; 34/28/22/15/13/12 type scale; cart pill with chip,
struck original and payable total.

**Rejected:** radio-button lists, card grids, gradient headers, generic Lucide swaps.

## Deliberate deviations from the Figma frames

1. **Tenures unified to 2 / 4 / 6 / 9 / 12 / 24.** The stepper frame lists exactly
   these six; the list frame shows `4, 4, 6, 9, 12, 24` with a duplicated 4. Both
   experiences must offer the same set to be comparable, so the stepper's set wins.
2. **Amounts are computed, not transcribed.** Several cells in the source are stale
   placeholders (row 1 reads "4 Payments · 177/mo"; row 6 reads "24 Payments ·
   354/mo"; "Save 85" repeats under 5% and 10% badges). Everything derives from one
   table instead.
3. **The tier saving actually reduces what you pay.** In the source the badge says
   "2% Off · Save 85" while the monthly stays at `4,250 ÷ n`, so the discount changes
   nothing. Here it comes off the financed amount, which is what a shopper would
   expect and what makes the plan-details ledger balance:
   `4,350 − 100 (Tasheel discount) − 425 (24-month saving) + 55.30 (fee) = 3,880.30`.
4. **Continue label.** Experience B's second CTA stays "View plan details" per source;
   the primary reads "Continue" on both screens so the two variants are comparable.
5. **`−` / `＋` buttons are 47px, not the 35px reported by the node.** The source
   node's own auto-layout padding contradicts that number, and 35px is below the
   44px tap-target floor. 47px matches the reference render.
6. **No selected state existed in the source** for the list rows, so one was designed:
   a 2px `#022b10` ring. Nothing is preselected, which is why Continue starts inert.

## Open delta

**Typeface.** The Figma frames bind `title_typeface` / `content_typeface` to **SF Pro**.
The base ships the checkout surface in **Inter** (`[data-surface="checkout"]`), which
is what the deployed reference uses, so these screens inherit Inter. Switching is one
line in `App.tsx`:

```
`[data-surface="checkout"]{--surface-font:${SF_PRO};}`
```

It restyles the entire checkout flow, not just these two screens, so it is left as a
decision rather than made silently.

## Slop detector

`node ~/.agents/skills/impeccable/scripts/detect.mjs --json App.tsx` → one warning,
`overused-font: Inter` at line 176. Pre-existing base decision; see **Open delta**.

## P0 / P1

- P0: 0
- P1: 0
- Open: typeface decision above
