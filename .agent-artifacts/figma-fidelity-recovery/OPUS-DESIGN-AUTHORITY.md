# Claude Opus Design Authority — Tasheel BNPL Figma-to-Code Recovery

Status: **FIRST RUN — design authority + component mapping + spec scaffold only.**
This run did NOT change source. This run did NOT measure live Figma (see Blocker).
Do not treat any value below marked `BLOCKED` as a fidelity-grade measurement.

## Source
- Figma file: `https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL`
- File key: `geEFxJ11n2KySAZB6zsjEh`
- Frozen node IDs (from `FIGMA-SOURCE-MAP.md`, authoritative):
  - Checkout root: `355:48766` · key frame: `355:58228`
  - Inner app root: `814:23900` · Home section: `814:23901`
  - Home concrete frame `BNPL Home` 402×1033: `1843:18080`
  - Home conditions/menu `Group 32764` 360×448: `814:23902`
  - Detail `Transaction details [flow]` 402×1330: `814:24410`
  - Dues root `Next Up`: `814:24004` · `6 Dues` 402×890: `876:17923` · `My dues` 402×890: `1843:17915`
  - Purchases root `My Purchases`: `814:24389` · `My purchases` 402×918: `814:24392`
  - Insights root: `814:24313` · examples: `1579:11144`, `1579:11218`, `1579:11321`, `1579:11292`, `1579:10592`
- Target platform: Expo (SDK 56) Web prototype, single-file `App.tsx`, route-driven.

### Stale / do-not-use nodes
`figma-extraction-notes.md` and `assets/figma-screens/*` use a DIFFERENT node namespace
(`1747:80160` root; `1741:78002` checkout; `1741:79204` home; `1741:79381` detail;
`1741:79334` purchases; `1747:80163` dues; `1741:79259` insights). These predate the freeze.
**They are marked STALE.** Frame dimensions from those exports (e.g. checkout 390×848) may differ
from the frozen frames (home is 402×1033 frozen vs 399×1024 stale export) and must be
re-measured against the frozen IDs before any fidelity claim. Do not seed specs from the stale exports.

## Blocker (gating the measured spec)
Live Figma MCP access is **NOT granted in this session**. `get_metadata` / `get_design_context` /
`get_variable_defs` against the frozen nodes returned permission-not-granted. Therefore:
- Exact node bounds (x/y/w/h), token hex values, font/size/line-height/tracking, radii, shadows,
  and Auto Layout gaps for the frozen frames are **UNMEASURED**.
- `figma-spec/checkout.json` and `figma-spec/home.json` are written as **schema-shaped scaffolds
  flagged `"_status": "blocked"`** with only the verifiable identity fields (node IDs, frame
  dimensions from the source map). Their `tokens` and per-node `bounds`/`style` are placeholders
  pending an approved Figma MCP pull. **They are not fidelity inputs yet.**
- No values were guessed from the existing approximation. No fabricated measurements were committed.

To clear this blocker: grant `mcp__plugin_figma_figma__*` (at minimum `get_metadata`,
`get_design_context`, `get_variable_defs`, `get_screenshot`) and re-run the measured-extraction slice.

## Design Read (from frozen screenshots + source map + existing exports)
- Product/user context: Saudi BNPL ("Tasheel"). Two surfaces: (1) a third-party merchant
  **checkout** that offers Tasheel BNPL as a payment method; (2) the **in-app BNPL flow**
  (Home → Transaction Detail, Dues, Purchases, Insights) reached after onboarding.
- Visual language: clean fintech, light canvas, rounded cards, a green primary (BNPL/approval) and
  a red accent (amounts due/remaining). Riyal currency mark appears with amounts.
- Density: mobile-first, 360–402 pt content width; generous card padding; bottom tab nav on app surfaces.
- Motion level: low; this is a clickable prototype. Preserve, do not add showy motion.
- Accessibility/safe-area: status strip + home indicator present in frames; respect safe areas.

## Tokens
- Color/typography/radius/shadow/spacing tokens: **BLOCKED — pull via `get_variable_defs`** on the
  frozen frames. The current source uses hardcoded hex (`green`, `text`, `#c8212d`, `#14983a`, etc.)
  — these are NOT confirmed against Figma variables and **must not** be treated as the design system.
- Hard rule: do **not** invent a global design-system token set. Bind to Figma variables once pulled.

## Component Mapping (Figma frozen node → source component → required testID)
Source components live in `App.tsx`. None currently expose `testID` (confirmed: 0 testIDs in file).
testIDs below are the REQUIRED mapping targets for the runtime geometry/style probe.

| Figma node | Source component (`App.tsx`) | Required testID | Notes |
| --- | --- | --- | --- |
| `355:58228` checkout key frame | `Checkout` (L283) | `checkout-screen` | route `/checkout` |
| checkout payment rows | `CheckoutOption` (L271) ×4 | `checkout-option-card` / `-apple` / `-cod` / `-bnpl` | BNPL row is the flow entry |
| checkout CTA | (button inside `Checkout`) | `checkout-cta` | preserve click → BNPL flow |
| checkout merchant chrome | `StatusStrip`/`Header` (L117/L254) | `checkout-statusbar` | only if frame includes it |
| `1843:18080` BNPL Home | `AppHome` (L353) | `app-home` | route `appHome` |
| home gradient hero | `HomeGradient` (L338) | `home-hero` | verify vs Figma fill/gradient token |
| `814:23902` menu `Group 32764` | `ActionTile` (L329) ×3 | `home-action-dues` / `-purchases` / `-insights` | **see asset violations** |
| `814:24410` Detail | `Detail` (L453) | `detail-screen` | route `detail` |
| detail installments | `Installment` (L415) | `detail-installment-{n}` | |
| `876:17923`/`1843:17915` Dues | `Dues` (L704) | `dues-screen` | route `dues` |
| dues progress ring | `DuesRing` (L642) | `dues-ring` | **asset violation — see below** |
| `814:24392` Purchases | `Purchases` (L616) | `purchases-screen` | route `purchases` |
| purchase row | `Tx` (L592) | `purchase-row-{n}` | |
| `1579:11144`… Insights | `Insights` (L558) | `insights-screen` | route `insights` |
| insights bars | `InsightsBar` (L534) | `insights-bar-{n}` | verify vs `levels.svg` export |
| bottom nav | `BottomNav` (L748) / `NavGlyph` (L767) | `bottom-nav`, `nav-home`/`-flash`/`-bnpl`/`-profile` | preserve routes |
| merchant logo | `MerchantBadge` (L143) | `merchant-{extra,jarir,noon}` | **asset violation — see below** |
| currency mark | `Riyal` (L62) | `riyal-mark` | **asset violation — see below** |

## Asset Requirements & VIOLATIONS (primary recovery finding)
Real exported assets already exist in `assets/figma/` (manifest present) but the source **hand-draws
substitutes instead of using them.** Per the hard rules this is a fidelity failure, not polish:

| Concern | Exported asset present | Current source (hand-drawn) | Action |
| --- | --- | --- | --- |
| Merchant logos | `extraLogo.png`, `jarirLogo.png`, `noonLogo.png` | `MerchantBadge` draws shapes | Replace with exported PNGs |
| Home action icons | `homeDuesIcon.png`, `homePurchasesIcon.png`, `homeInsightsIcon.png` | `IconCoins`/`IconBag`/`IconChart` vectors | Replace with exported PNGs |
| Dues ring | `duesTrack.svg`, `duesFilled.png`, `duesDot.svg`, `progressThumb.svg` | `DuesRing` hand-drawn | Recompose from exported parts |
| Riyal currency mark | (none exported yet) | `Riyal` hand-drawn vector | **BLOCKED — export from Figma; do not ship hand-drawn** |
| Insights levels | `levels.svg` | `InsightsBar` hand-drawn bars | Verify/replace against `levels.svg` |
| Checkout chrome | `checkoutReload.svg`, `checkoutSiteSettings.svg` | — | Use exports if frame includes them |
| Payment timeline | `paymentLineTall.svg`, `paymentLineShort.svg` | `Divider`/lines | Use exports |
| Home decor | `homeElementA.svg`, `homeElementB.svg` | `HomeGradient` | Verify against exports |

Asset-manifest gap: current `asset-manifest.json` records file/bytes/ephemeral `localhost:3845` URL
only. It is **missing Figma node IDs, intrinsic dimensions, density/scale, content hash, mapped usage,
and waivers** required by the Asset Gate. Enriched in this run with usage + node-id-BLOCKED + waiver
fields; node IDs/dims/hashes to be filled on the measured pull.

## Route / Flow Invariants (MUST preserve — verified in source)
- `routeFromPath` maps URL → `RouteKey`; default `/checkout`. `popstate` wired for back/forward.
- Routes: `/checkout` (Checkout), `appHome` (AppHome), `detail` (Detail), `insights` (Insights),
  `purchases` (Purchases), `dues` (Dues). Bottom nav switches among app routes.
- Click paths: checkout BNPL option → onboarding → app surfaces; section headers → detail/list screens;
  bottom nav between home/dues/purchases/insights.
- Browser back/forward via `popstate` must keep working. Base path / asset prefix unchanged.

## Implementation Constraints
- Must preserve: full clickable flow, route map, `popstate` behavior, all six routes.
- Must NOT add: fake browser/Safari chrome (unless the frozen frame explicitly contains it).
- Must NOT replace: the multi-route flow with a narrow single-screen SPA/export.
- Must NOT keep: hand-drawn merchant logos, home icons, dues ring, Riyal mark — replace with real assets.
- Allowed deviations: only documented waivers (e.g. Riyal mark until exported); record in manifest + VALIDATION.md.

## Acceptance Criteria (for the eventual measured implementation, NOT met this run)
- Geometry: ±2 px key UI / ±4 px secondary vs frozen-frame `get_metadata` bounds.
- Typography: exact font/size/line-height/weight from `get_design_context`, platform fallback waived only if documented.
- Colors: exact Figma variable match (no invented tokens).
- Assets/icons: source-exported only; no hand-drawn branded marks.
- Safe area/scroll: status strip + home indicator + inner ScrollView reachability.
- Interactions/states: selected payment option, nav active state, back/close.
- Screenshots required: Figma frozen-frame ref + Expo web at matching viewport + contact sheet + diff.

## Opus Decision
- Ready for implementation: **NO.** Blocked on live Figma measurement (permission not granted).
- Blockers: (1) Figma MCP access not granted → specs unmeasured; (2) Riyal mark not yet exported.
- Final design authority notes: The dominant, independently-verifiable defect is **hand-drawn
  substitutes for assets that already exist as exports.** The first source slice, once Figma is
  measured, should be a single screen (recommend **Home / `1843:18080`**) swapping
  `IconCoins/IconBag/IconChart` and `MerchantBadge` for the exported PNGs and adding the mapped
  testIDs — bounded, asset-backed, and probe-verifiable. Do NOT claim fidelity from this run.
