# Figma extraction notes — Tasheel BNPL Expo Web prototype

Source: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=1747-80160&t=RAYSMNWk38F3VbHP-4
Root node: `1747:80160`
MCP: Figma Dev Mode MCP Server via http://127.0.0.1:3845/mcp
Exported at: 2026-06-04T13:28:57Z

## Direct child frames found
- `1741:78002` — 6.0 — Extrastores Checkout — 390×848 at x=0, y=241
- `1741:78634` — Confirm Mobile Number — 390×848 at x=1227, y=241
- `1741:78043` — OTP — 390×848 at x=2454, y=241
- `1741:78067` — OTP — 390×848 at x=3681, y=241
- `1741:78576` — Identity Verification — 390×848 at x=4908, y=241
- `1741:78605` — Identity Verification — 390×848 at x=6135, y=241
- `1741:78091` — Nafath — 390×848 at x=7362, y=241
- `1741:78139` — Quick Call — 390×848 at x=8589, y=241
- `1741:78156` — Tenure — 390×848 at x=9816, y=241
- `1741:78226` — Tenure — 390×848 at x=11043, y=241
- `1741:78493` — Processing — 390×848 at x=12270, y=241
- `1741:78516` — Processing — 390×848 at x=13497, y=241
- `1747:80000` — Screen — 589×1276 at x=14724, y=27
- `1741:79204` — BNPL Home — 402×1033 at x=16150, y=148
- `1741:79381` — Transaction details [flow] — 402×1330 at x=17391, y=0
- `1741:79259` — Insights · Full history — 402×870 at x=18628, y=230
- `1741:79334` — My purchases — 402×918 at x=19867, y=206
- `1747:80163` — My dues — 402×890 at x=21106, y=220

## Exported PNGs
- `1741:78002` — 6.0 — Extrastores Checkout → `assets/figma-screens/checkout-1741-78002.png` — 414×860 — exported
- `1741:78634` — Confirm Mobile Number → `assets/figma-screens/confirm-mobile-1741-78634.png` — 438×860 — exported
- `1741:78043` — OTP empty → `assets/figma-screens/otp-empty-1741-78043.png` — 390×848 — exported
- `1741:78067` — OTP filled → `assets/figma-screens/otp-filled-1741-78067.png` — 390×848 — exported
- `1741:78576` — Identity Verification empty → `assets/figma-screens/identity-empty-1741-78576.png` — 414×860 — exported
- `1741:78605` — Identity Verification filled → `assets/figma-screens/identity-filled-1741-78605.png` — 414×860 — exported
- `1741:78091` — Nafath → `assets/figma-screens/nafath-1741-78091.png` — 414×860 — exported
- `1741:78139` — Quick Call → `assets/figma-screens/quick-call-1741-78139.png` — 542×916 — exported
- `1741:78156` — Tenure plan → `assets/figma-screens/tenure-plan-1741-78156.png` — 414×860 — exported
- `1741:78226` — Tenure payment method → `assets/figma-screens/tenure-payment-1741-78226.png` — 414×860 — exported
- `1741:78493` — Processing → `assets/figma-screens/processing-1741-78493.png` — 414×860 — exported
- `1741:78516` — Approved / Download app → `assets/figma-screens/success-1741-78516.png` — 414×860 — exported
- `1747:80000` — Tasheel card animation → `assets/figma-screens/card-animation-1747-80000.png` — 473×1024 — exported
- `1741:79204` — BNPL Home → `assets/figma-screens/bnpl-home-1741-79204.png` — 399×1024 — exported
- `1741:79381` — Transaction details [flow] → `assets/figma-screens/transaction-details-1741-79381.png` — 310×1024 — exported
- `1741:79259` — Insights · Full history → `assets/figma-screens/insights-history-1741-79259.png` — 402×870 — exported
- `1741:79334` — My purchases → `assets/figma-screens/my-purchases-1741-79334.png` — 402×918 — exported
- `1747:80163` — My dues → `assets/figma-screens/my-dues-1747-80163.png` — 402×890 — exported

## Notes / uncertainties
- Figma MCP screenshot output is treated as current visual source; parent still must run rendered browser QA against Expo Web output.
- Some screenshot dimensions differ from metadata because Figma rendered visible bounds/contents; App.tsx should use exported PNG dimensions for scaling.
