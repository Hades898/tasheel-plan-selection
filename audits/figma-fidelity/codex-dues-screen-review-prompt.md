Review the current working tree for the Tasheel BNPL Expo/React Native Web prototype, focusing on the repaired dues route at /checkout/dues.

User complaint: dues screen is fully messed up versus Figma, back icons are wrong, company logo missing/wrong, merchant icons must be the same Figma assets, and we should keep finding UI bugs compared to Figma.

Figma source of truth:
- Dues frame node: 876:17923, screenshot/context already captured by Hermes.
- Header: status 9:41/levels, y62 header h66, back button left x16 y70 size 50 using Figma chevron-left asset, close button right x336 y70 size 50 using Figma x-close asset, centered Tasheel icon x176 y70 size 50 from Figma node 1216:10387.
- Dues ring: x41 y99 size 320. Track asset left20 top20 size280; filled asset left160 top20.75 width140 height278.5; six Figma dots at (163,22.4), (254.91,84.7), (254.91,209.3), (163,271), (39.09,209.3), (39.09,84.7). Center copy: 3 Dues Selected, Riyal + 3,000, Remaining 1800.
- Base dues list starts x16 y419 w370, rows h72 radius24 p16, selected bg #edf3ef border #16720b.
- The selected-installments sheet in node 876:17923 is visible by default: scrim rgba(0,0,0,0.7), sheet bottom h674 top y216 radius top 24, grabber x183 y227, title x16 y252, list x16 y306 with six 370x72 rows, first two selected, all Extra Stores 450, CTA top y812 (sheet local 596) w370 h50 Pay selected Riyal 900.

Implemented changes to review:
- Added Figma-exported assets in assets/figma and public/figma: tasheelLogoPartA/B/C, iconChevronLeft, iconClose, iconChevronRight, riyalDark, riyalOnPrimary.
- App.tsx now uses Figma asset images for the Tasheel mark, round header icons, Riyal mark, DuesRing assets/dots, base CTA, and sheet CTA.
- Dues route now renders the Figma bottom sheet overlay by default.

Verification already passed:
- npm run typecheck
- npm run export:web (postexport copied 32 figma assets)
- npm run qa:in-app
- node scripts/figma-geometry-probe.cjs
- npm run qa:typography
- Exact viewport probe 402x890 found no broken /figma images; body 402x890; sheet title x16 y252; sheet rows at y306,388,470,552,634,716; CTA amount y828.

Please review for P0/P1/P2 issues only:
- P0: route broken, build/deploy unsafe, missing critical assets, or severe hydration/runtime issue.
- P1: obvious mismatch to the Figma dues frame/spec above, especially header logo/icons, ring, sheet rows/CTA, asset usage, or route preservation.
- P2: smaller fidelity bug worth fixing before showing the user.

Return concise findings with file/line references and a final verdict: PASS or BLOCKED.