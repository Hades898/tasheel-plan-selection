# Typography Fidelity Fix — Report

## Defect found
The Figma spec requires **two type systems** (`BNPL_FIGMA_SPEC.md` / `figma-spec/*.json`):

- Merchant checkout (Figma `355:58228`) → **Inter**
- App screens (home / detail / insights / purchases / dues) → **SF Pro** (Apple system stack)

A single global blanket `font-family` override was forcing **SF Pro everywhere**, clobbering
checkout's Inter so the merchant surface rendered in the wrong family. Inter was also never
loaded as a real webfont, so even unscoped text fell back to a system face.

## Fix (files changed)
`App.tsx`:

- Replaced the global blanket override with a **per-surface CSS custom property**
  (`--surface-font`). The default (app) surface resolves to the SF Pro stack; an
  element carrying `data-surface="checkout"` switches its whole subtree to the Inter stack.
- The `AppShell` emits `data-surface` via React Native Web's `dataSet` prop, so checkout
  (`<AppShell surface="checkout">`) opts into Inter while app screens inherit SF Pro.
- The `#root *` font-family rule now points at `var(--surface-font)` (excluding SVG glyph
  nodes) instead of hard-coding one family.
- The real **Inter webfont** is injected (preconnect + Google Fonts stylesheet) so checkout
  matches the Figma source, with a system fallback stack for offline rendering.

`package.json` and `scripts/typography-probe.cjs`:

- Added `npm run qa:typography`, a computed-style probe that verifies checkout text starts with Inter while app-screen text starts with the SF Pro/Apple system stack.

## Verification — results from this run
| Command | Result |
|---|---|
| `npm run typecheck` | **passed** (re-run this session, exit 0) |
| `npm run export:web` | **passed** |
| `npm run qa:in-app` | **passed** |
| `node scripts/figma-geometry-probe.cjs` | **passed** |
| `node scripts/typography-probe.cjs` | **passed** |

Typography-probe detail (`audits/figma-fidelity/typography-probe.json`): all 9 cases pass —

- 3 checkout cases → computed first family `inter`, `interLoaded: true`, `data-surface="checkout"`.
- 6 app-screen cases (home/detail/purchases/insights/dues) → computed first family `-apple-system` (SF), `data-surface="app"`.

No regression: checkout = Inter, app screens = SF Pro, confirming the global-blanket defect is resolved.
