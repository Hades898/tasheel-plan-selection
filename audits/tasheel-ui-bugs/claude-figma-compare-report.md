# Tasheel BNPL — My Purchases Fidelity Audit
**Figma node 1741:79334 vs. live prototype** | 2026-06-08

---

## P0 — Critical (breaks design intent on a visible viewport)

### P0-1: Wrong merchant logos on mobile (Noon, Jarir)
**What:** The mobile live screenshot shows Jarir Bookstore and Noon both rendering as a red circle with a line/T-icon — the Tasheel brand icon appearing as a broken-image fallback. The desktop renders both correctly (Jarir = red "ج" circle; Noon = yellow "noon" pill).

**Root cause:** Logo images are loading correctly on desktop but failing on the mobile viewport (likely a CORS or relative-path issue at the deployed GitHub Pages origin). The fallback icon defaults to the Tasheel brand mark instead of an initial or letter avatar.

**Minimal fix:** Replace the network-loaded logo `<Image>` for Noon and Jarir with inline components that never fail: Noon = `<View style={{backgroundColor:'#FBDE00', borderRadius:8}}><Text>noon</Text></View>`, Jarir = `<View style={{backgroundColor:'#D32F2F', borderRadius:999}}><Text style={{color:'#fff'}}>ج</Text></View>`. These match the Figma exactly and have zero network dependency.

---

## P1 — High (design system departure, both viewports)

### P1-1: Missing × dismiss button in header
**What:** Figma header shows three elements — ‹ back (left), Tasheel logo (center), × close (right). Both live screenshots have only ‹ and the logo. The × is absent.

**Minimal fix:** Add a 44×44 `Pressable` to the right of the header `flexDirection:'row'` container. Use the same circular style as the ‹ button. `onPress` should call `goNext()` or navigate to `home`. Do not add any new navigation infrastructure.

```jsx
<Pressable onPress={goNext} style={styles.headerBtn}>
  <Text style={styles.headerBtnText}>✕</Text>
</Pressable>
```

Preserve the existing back press and full clickable-flow — this is purely additive.

---

### P1-2: Purchases image underflows the phone frame (≈19 px lateral gap)
**What:** `FigmaScreen` scales with `Math.min(390/step.width, 848/step.height)`. For purchases (`width:402, height:918`): `390/402 = 0.970`, `848/918 = 0.924` → scale = **0.924** (height wins). Rendered width = `402 × 0.924 ≈ 371 px` inside a 390 px frame — ~19 px of white on the sides. Same applies to `insights` (width 402) and `dues` (width 402).

**Minimal fix in `App.tsx` line 69 only — do not change anything else:**

```js
// Before
const imageScale = Math.min(390 / step.width, 848 / step.height);

// After — fill width; screen scrolls vertically if taller than 848
const imageScale = 390 / step.width;
```

The `screenScroll` ScrollView already handles vertical overflow, so this is safe. All screens narrower than 390 px (e.g. `details` at 310 px) will scale up slightly but remain contained by the 390 px clip.

---

## P2 — Polish

### P2-1: Empty `<title>` tag
Both audit JSONs show `"title": ""`. The browser tab is blank.

**Fix:** In the purchases route component (or `App.tsx` effect), set `document.title = "My Purchases — Tasheel"` when `screen === 'purchases'`.

---

### P2-2: Extra space before `/mo` on desktop
Desktop renders `₪ 450.00 /mo`; Figma and mobile both show `₪ 450.00/mo`. One extraneous space in the amount template string.

**Fix:** Find the string interpolation (likely `${amount} /mo`) and change to `${amount}/mo`.

---

### P2-3: Progress bar is flat green; Figma uses a left-to-right gradient
Figma's bar fills `#2DC653 → #4FD97B`. Live renders solid `#2DC653`.

**Fix (low priority):** Wrap the progress fill `<View>` with `<LinearGradient colors={['#2DC653','#4FD97B']} start={{x:0,y:0}} end={{x:1,y:0}}>` using `expo-linear-gradient`. Do not change bar height, border-radius, or percentage logic.

---

## What NOT to change
- Do not add fake Safari/browser chrome to the phone frame.
- Do not replace `FigmaScreen` static-PNG rendering with a narrow checkout-only route — the full step flow (`checkout → … → purchases → dues`) must stay clickable.
- Do not restructure navigation or introduce a router. All fixes above are additive or single-line changes.

---

## Verification Checklist

- [ ] **Mobile**: Noon card shows yellow pill with "noon" wordmark, not a red fallback icon
- [ ] **Mobile**: Jarir card shows red circle with Arabic "ج", not a red fallback icon
- [ ] **Both viewports**: Header has three elements — ‹ (left), logo (center), × (right)
- [ ] **Both viewports**: × press advances/closes the screen without breaking back-navigation
- [ ] **Both viewports**: Purchases image fills the full 390 px frame width (no white side strips)
- [ ] **Both viewports**: Amount reads `₪ 450.00/mo` with no space before `/mo`
- [ ] **Both viewports**: Filter tabs — "All" shows green text + white pill; inactive = grey text, no pill
- [ ] **Both viewports**: Progress bar percentages — 1/3 ≈ 33%, 2/3 ≈ 66%, 3/3 = 100% full
- [ ] **Both viewports**: "Completed" badge on AirPods Pro 3 card is visually distinct from "Active" green
- [ ] `document.title` is non-empty on the purchases route
- [ ] No browser/Safari chrome overlay on the phone frame
- [ ] Tapping a purchase card still advances to the next screen in the full prototype flow