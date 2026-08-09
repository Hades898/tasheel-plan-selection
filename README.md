# Tasheel BNPL — plan selection, two experiences

Mobile-web prototype of two ways to pick a BNPL plan, built from Figma
`geEFxJ11n2KySAZB6zsjEh` node [`3615:74055`](https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=3615-74055).

Forked from the deployed BNPL browser prototype
(`hades898.github.io/tasheel-bnpl-prototype`, branch `fix/in-app-fidelity`) so both
experiences sit inside the real merchant → Nafath → plan → payment flow instead of
standing alone.

## The two experiences

| | Route | What it optimises for |
|---|---|---|
| **A — Plan list** | `/checkout/onboarding/plans` | Comparing cost against tenure. Every plan is on screen at once, nothing is preselected, Continue stays inert until the shopper commits. |
| **B — Tenure stepper** | `/checkout/onboarding/tenure` | Deciding how long. One plan in view, the monthly amount is the hero, the rail changes it in place. |

Both share the cart pill, the discount-tier sheet, the plan-details sheet, and the
same pricing model, so a test compares the picker and nothing else.

## Run locally

```bash
npm install
npm run web          # Expo dev server
```

Static build, exactly as deployed:

```bash
npm run build        # typecheck + export + GitHub Pages patch → ./dist
npm run serve:dist   # http://127.0.0.1:4173
```

The export hard-codes a GitHub Pages project base (`/tasheel-plan-selection`) into
asset and bundle URLs, so `dist` must be served from that path. Override with
`GH_PAGES_BASE=/your-repo npm run build`.

## Screenshots

```bash
node scripts/shot-plan-selection.cjs   # → screenshots/plan-selection/
```

Requires the static build served at `http://127.0.0.1:4173/tasheel-plan-selection/`.

## Pricing model

One table drives both screens (`App.tsx`, `WC_*`):

- Cart: 2 items, **4,350** → **4,250** after the Tasheel discount
- Tenures: **2 / 4 / 6 / 9 / 12 / 24** payments
- 2 payments: no interest, no fee, no tier discount
- 4 / 6 / 9: **2% off** · 12: **5% off** · 24: **10% off** — taken off the financed
  amount, so a longer tenure lowers every installment
- Tenures of 4+ carry a one-time **55.30** processing fee

See [VALIDATION.md](./VALIDATION.md) for source capture, token bindings, asset
provenance, verification evidence, and the deliberate deviations from the Figma
placeholder numbers.
