# Figma Source Map

Tier: T3  
Captured: 2026-07-22  
Scope: Harun merchant checkout, BNPL pricing and Murabaha gating, native merchant handoff, repayment cross-sell, and shortened in-app product applications.  
Target platforms: RN Web / GitHub Pages and native SwiftUI / iOS Simulator

## Design Authority

- Figma file: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=355-48766
- Checkout source: `355:58228` (390 x 844)
- Plan selection: `1878:13247`
- Payment review: `1741:78226`
- Processing: `1691:67680`
- Success: `1691:67703`
- Murabaha agreement: meeting screenshot at `artifacts/bnpl-meeting-rules/screenshots/meeting-murabaha-reference.png`
- Payment screenshot: `artifacts/bnpl-meeting-rules/screenshots/figma-payment-1741-78226.png`
- Measured checkout spec: `figma-spec/checkout.json`

The originally referenced payment node `1961:27293` is no longer present in the Figma file. Node `1741:78226` is the valid payment-review frame used for this implementation. The meeting screenshot overrides that older frame only for the new Murabaha document and acceptance interaction.

## Route Map

| Source frame/state | Runtime route or state | Test ID / trigger | Status |
| --- | --- | --- | --- |
| Merchant product | `/checkout` | `wc-add-to-cart` | verified |
| Cart | `/checkout` cart state | `wc-cart-continue` | verified |
| Mobile login | `/checkout/onboarding/mobile` | `wc-mobile-1628-55724` | verified |
| OTP | `/checkout/onboarding/otp` | `wc-otp-1628-55780` | verified |
| IVR | `/checkout/onboarding/quick-call` | `wc-quickcall-1628-55884` | verified |
| Plan selection `1878:13247` | `/checkout/tenure` | `wc-tenure-1878-13247` | verified |
| Payment `1741:78226` | `/checkout/payment` | `wc-payment-1961-27293` | verified |
| Murabaha sheet | payment modal state | `wc-murabaha-sheet` | verified |
| Processing `1691:67680` | `/checkout/processing` | `wc-processing-1691-67680` | verified |
| Success `1691:67703` | `/checkout/success` | `wc-success-1691-67703` | verified |
| Return to Tasheel | native BNPL landing | `WEB_CHECKOUT_DONE=1` | verified |
| Credit-card cross-sell | native action sheet | `CREDIT_UPSELL=1` | verified |
| Existing-customer card apply | native short flow | `APPLY_PRODUCT=cc` | verified |
| Existing-customer PF apply | native offer review | `APPLY_PRODUCT=pf` | verified |

## Native Reuse Rules

- Credit-card Apply Now starts at card-name selection and reuses the existing `NafathView`, `QuickCallView`, and `ReviewAndSignView` components.
- Personal Finance Apply Now starts at offer review; profile, OTP, identity, and account-creation screens are not repeated for an onboarded customer.
- Successful card completion activates the World card and shows it as linked to Apple Pay.
- The cross-sell appears only after the final purchase repayment, not at app launch.

## Waivers

- Existing Figma-exported SVG and bitmap files predate this change and do not retain their original export node IDs. Their paths and SHA-256 hashes are recorded in the asset manifest.
- The meeting supplied no rates for 6, 9, 12, 24, or 36 months. Those options remain visible but disabled with `Rate pending`; no financial values were invented.
