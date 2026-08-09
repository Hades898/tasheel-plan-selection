# JOB_STATUS

**Job**: Tasheel BNPL Expo Web browser prototype
**Job ID**: parent-hermes-codex-fanin
**Started**: 2026-06-04T13:00:58Z
**Current Phase**: Dues/Figma fidelity hardening
**Status**: In progress — restart handoff saved

## Timeline

- [2026-06-04T13:00:58Z] Created Expo Web/Figma/deploy brief.
- [2026-06-04T13:08:22Z] Corrected scope to Expo Web browser prototype, not native simulator.
- [2026-06-04T13:54:44Z] Exported 18 Figma frames via Figma Dev Mode MCP.
- [2026-06-04T13:54:44Z] Repaired compact/mobile scaling for browser management view.
- [2026-06-04T13:54:44Z] Built Expo Web artifact and patched GitHub Pages project-relative asset paths.
- [2026-06-04T13:54:44Z] Deployed to gh-pages and verified live JS/image assets.
- [2026-06-04T13:54:44Z] Captured live desktop/mobile/short-height evidence screenshots.
- [2026-06-04T13:54:44Z] design_evidence_gate returned pass.
- [2026-06-04T13:54:44Z] Mandatory Codex critique returned PASS.
- [2026-06-08/09] Reopened project for Figma fidelity repair of in-app prototype, especially Dues screen.
- [2026-06-09] Fixed stale Dues overlay issue; verified base Dues screen visible.
- [2026-06-09] Added missing Figma route aliases/screens and repaired app-home/payment method/dues routes.
- [2026-06-09] Replaced heavy back/close icon assets with lighter inline SVG icons.
- [2026-06-09] Added prototype clickability for Dues, View all/action sheet, insights controls, and related routes.
- [2026-06-09] Refactored Dues into a coherent state-driven payment-selection engine with 9 dues, 4 visible preview rows, computed `+5 More`, default top due selected, bottom action sheet, and selected amount propagation to Payment Method.
- [2026-06-09] Improved dynamic Dues ring: amount-based progress, cleaned dot artifact/halo, softer markers/gradient. Ring still may need exact Figma asset/spec pass if user demands pixel-perfect visual match.
- [2026-06-09] Saved restart handoff at `RESTART_HANDOFF.md`.
- [2026-06-10] Payment flow round 2 from user bug list: Apple Pay made a real selectable method (select → review card → pay → processing, no bank OTP); add-card keyboard dismissal rebuilt as a single 560ms choreographed glide (sheet + keyboard together, no teleport) and sheet amount now carries the real flow amount; OTP route rebuilt as the actual Al Rajhi/VISA bank 3-D Secure page from Figma 814:24658 (exported bitmap + live Arabic verification text + interactive code field/إرسال overlays); BNPL Home polished to source (floating frosted tab bar with exported Figma icons, corrected header rhythm, DS gradient progress bar with installment dashes). All probes updated and passing. Report: `audits/figma-fidelity/payment-flow-round2-validation.md`.
- [2026-06-11] Round 4c — insights chart: months after the selected one now collapse to 22px stubs with animated height (selected month always reads dominant; fixes the January-dwarfed-by-ghost-bars issue); payment plan summary rebuilt to updated Figma 2042:42188 — 'Then {n-1} payments of {M}/mo' + 'Starting from Jul 1 to {end} 1 2026' line, months badge removed; wc-flow probe updated. Deployed.
- [2026-06-11] Round 4b — ring rolled back per user: the asset-composite looked worse (halo bleed); rebuilt the DYNAMIC SVG ring with correct geometry (320x285, c(160,142.5), r126, stroke 31, quarter-segment per due, boundary dots + leading glow ball exactly on the path, live center). Home now scrolls on device (dropped flex:1) with Next up clearing the pinned navbar; navbar fully static except BNPL; Next-up View More opens My Dues; purchases cards densified (padding 16->11v, gaps 14->10); insights: future months dim at 35%, transaction amounts derive from month spend (42/28/20/10%), typography probe updated. All gates green; deployed.
- [2026-06-11] Round 4 — app-section audit from user report: (1) home tab bar was unpinned/cropped on device — now ViewportLayer-portaled to the visual viewport (stable through scroll) with the UPDATED Figma navbar (fresh icon vectors incl. dark-green BNPL active circle, labels #6b7280) and home content clearance; (2) Flash Cash tab no longer jumps to the merchant PDP (out-of-scope tabs are press-feedback only); (3) DuesRing rebuilt from the Figma 'DuesRing — Segmented (sandbox)' 1929:11230 layer spec — real exported artwork (halo v3, track v4, gradient arc v4, six 3D dots) at exact coordinates with live center copy (fixes ring on dues + payment/add-card backdrops); (4) category/transaction rows got pressed feedback; (5) typography probe updated for the PDP entry. All 8 gates green; deployed.
- [2026-06-11] Round 3j — proactive bug hunt before app work: full-route sweep clean (0 console errors, 0 overflow, 0 broken assets on 14 routes); fixed 4 logic/copy bugs — '1 Items'/'1 items' pluralization (cart pill, cart sheet, success card), plan-details end-month off-by-one ('Ends 1 September' -> '1 August' at 3mo, range now matches the schedule), success first-payment date aligned to the schedule (July 1st), OTP 00:00 dead-end now shows the Figma Counter-enabled 'Didn't get it? / Resend' row (resets timer+code). Also fixed Safari's grey notch chrome: theme-color meta (white) injected at export, html/body white base, lock screen flips theme-color dark while mounted. All gates green; deployed.
- [2026-06-11] Round 3i — the 'fixed' Pay bar was still scrolling: RNW's ScrollView renders an identity transform that becomes a CSS containing block, capturing all fixed descendants (sheets included). Added ViewportLayer — a document.body portal (with matching zoom) used on device for the sticky Pay bar and all five action sheets; verified the bar stays put through scrolling (716/740 before+after) and sheets open fully visible mid-scroll. @types/react-dom added. Flow probe green; deployed.
- [2026-06-11] Round 3h — action sheets were anchoring to the bottom of the scrollable CONTENT (cropped below the fold on scrolling screens); all sheet overlays now position:fixed to the visual viewport on device (validated: details/schedule/why/leave/cart all end exactly at viewport bottom on iPhone sim) with maxHeight 94%. Payment method: no pre-selected method, Pay CTA sticky (fixed bottom bar) and disabled until a method is chosen, content padded behind it. Flow probe green; deployed.
- [2026-06-11] Round 3g — Quick call fixed per feedback + updated Figma 1933:74219: art rendered at true aspect (no more zoomed crop), pushed down from the top, PNG->JPEG (183KB->39KB) + prefetched during Nafath (perf); toast removed — the CTA itself morphs (dip/pop spring) from 'Calling you…' to '✓ Verification successful' and holds 2s before continuing. OTP rebuilt to the updated card design 2036:13138 (title/subtitle/Edit + boxes + timer + Confirm in one card, link below, no drawn keyboard — system keyboard types). Probes updated and green; deployed.
- [2026-06-11] Round 3f — Quick call verification step added after Nafath (Figma 1628:55884/1933:74219: real call illustration, Call Me Now -> calling -> Verification successful toast + Continuing-in-5s countdown -> tenure); leave-checkout confirmation sheet from Figma 2003:32239 wired to every X (Keep going / Leave checkout — never quits instantly); PDP Add-to-cart/Buy CTAs removed (Tasheel card is the entry); Apple Pay squeeze fixed (square 30x30 asset + preserveAspectRatio repaired across all wc vectors); why-sheet numbered circles -> plain dots; tenure plan-details CTA = 'Continue with plan' -> payment directly; plan-details prices enlarged (15->17); fees restored (27.65x(n-1)) with down payment intentionally ~10% below the monthly installment + fee; payment-method rows/labels given breathing room. Flow probe green; deployed.
- [2026-06-11] Round 3e — PDP header recentered (equal-width sides, SVG chevron), tabby/tamara removed, Tasheel card now shows the live split calc (Pay 4x 1,793.75/month, with no fees) with 'Buy now with Tasheel' as the card CTA; pricing re-anchored to the fridge alone (cart = 7,175.00, zero processing fees so every tenure divides the exact product price; fee rows read Free, why/tooltip copy updated). Flow probe green; deployed.
- [2026-06-11] Round 3d — merchant entry rebuilt as extra.com PDP mimic for SMEG MP00015644 (real product image + SAR 7,175 price scraped from extra.com; 'Shop now, pay later!' section with Tasheel replacing Baseeta, exact live tabby/tamara figures; Tasheel card + Buy-now CTA start onboarding). Cart re-anchored to the real product (fridge 7,175 + warranty 350.25 = 7,525.25 carried through all plan math/sheets/notification). Store badges re-composited at 8x density and the OTP clock inlined as a DOM vector (last pixelated assets). Recovered ActionTile/HomeGradient/HomeDecor lost in a block edit (typecheck caught). All probes pass; deployed.
- [2026-06-11] Round 3c — payment-plan completeness: correct info-circle vector + 'Why you pay this today' sheet, all card/network logos converted to true SVGs (no pixelation), Cart details sheet from Figma 1885:12758 wired to the cart pill, 'View full schedule' link + timeline sheet (2003:12885), processing-fee tooltip (2003:12497), device-wide CSS zoom so hierarchy reads at intended scale on wider phones. All 8 probes pass; deployed.
- [2026-06-11] Round 3b — real-device fixes from on-phone screenshots: fake Safari bar and design keyboards never render on real iOS (real chrome/keyboard take over), full-device-width pages with width-only frame scaling (no letterbox, no keyboard-shrink), native iOS date picker for DOB (custom calendar removed), focus rings killed, lock screen uses real time/date + dark Safari tinting + SVG system glyphs. All 8 probes pass; redeployed to gh-pages.
- [2026-06-10] Round 3 — Full merchant web-checkout new-user flow (Figma section 355:48766, happy path): Extrastores merchant page rebuilt from source (355:58228), then Tasheel onboarding — mobile (355:45048) → OTP (355:45094, live countdown) → identity + functional iOS date picker (1628:32393/32758) → Nafath with random session code + auto-approve (1929:61813) → fully interactive 2/3/4-month plan stepper with coherent live math + plan-details sheet (1878:*/2003:12123) → payment method with real Apple Pay/mada/VISA assets + native ApplePaySession on iOS (1961:27293) → rocket processing (1691:67680) → success with live plan/reference/10s redirect (1691:67703) → iOS lock-screen push notification → tap opens the app at /checkout/detail. 20 Figma assets exported; nothing agent-drawn; nothing static. New gate scripts/wc-flow-probe.cjs passes + all 7 existing probes green. Report: audits/figma-fidelity/web-checkout-flow-validation.md.
- [2026-06-10] Round 2c — Insights + real-device safe area: Insights rebuilt to Figma 1579:10592 (Spent-in header w/ 4,250.00, real categories Shopping/Electronics/Bills/Travel with emoji tiles + share/merchant sub-lines + chevrons, month-coherent derived amounts); animated month switching (bar gradient/tag/underline transitions, headline crossfade, list fade, sliding tab pill). Fake iOS chrome (9:41 strip + home-indicator bars) now auto-hides on real iOS devices (IS_IOS_DEVICE gate; fixed frames become 830 tall); viewport meta patched with viewport-fit=cover + maximum-scale=1. Fixed a self-recursive FakeHomeIndicator1843 introduced by a careless sed (crashed dues/add-card/success renderers). All 7 probe gates pass; iPhone-sim sweep shows no fake chrome and zero overflow on all key routes.
- [2026-06-10] Round 2b: success subtitle unclipped (fixed-height/overflow removed) and made dynamic (month list from paid dues, no count); success Next-up card now shows the nearest unpaid due; Apple Pay CTA triggers the real native ApplePaySession sheet on iOS Safari over HTTPS (aborts gracefully without a merchant server, flow continues), falling through silently elsewhere.

## Current validation

Last passing checks:

```bash
npm run typecheck
npm run export:web
node scripts/in-app-qa.cjs
node scripts/figma-geometry-probe.cjs
node scripts/typography-probe.cjs
```

Custom Playwright happy/worst case checks also passed:

- default Dues state coherent
- View all reveals all 9 dues
- add second due updates selected amount to 2,400
- select all visible dues updates selected amount to 3,000
- Payment Method carries selected amount
- zero selected disables CTA

## Resume pointer

Read `/Users/hadysoliman/tasheel-bnpl-browser-prototype/RESTART_HANDOFF.md` first after restart.

## Evidence / reports

- Live URL from original deploy: https://hades898.github.io/tasheel-bnpl-prototype/
- Current local preview before restart: http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout/dues?finalengine=visual
- Restart handoff: `RESTART_HANDOFF.md`
- Dues validation report: `audits/figma-fidelity/dues-perfect-engine-validation.md`
- Figma flow map: `audits/figma-fidelity/flow-map-814-23900.md`
- Dues Figma node: `1843:17915`
