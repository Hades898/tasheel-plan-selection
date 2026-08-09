Assess why the current Expo/React Native Web BNPL prototype output is visually inaccurate/bad compared to Figma, without editing files.

Context:
- Project: /Users/hadysoliman/tasheel-bnpl-browser-prototype
- Live/local target: http://127.0.0.1:4174/tasheel-bnpl-prototype/checkout
- Main file: App.tsx
- Figma checkout section node: 355:48766, key frame 355:58228 "6.0 — Extrastores Checkout"
- Figma inner app section node: 814:23900 "BNPL - updated", key flow includes 814:23901 home and 814:24410 transaction detail.
- Hermes Figma metadata was saved by tool to:
  - /var/folders/s2/fbf_w6gs1g97g2s1x99t2dlw0000gn/T/hermes-results/call_YSYuUzgKmbK5ZCAHdUCwcRwQ.txt for checkout metadata
  - /var/folders/s2/fbf_w6gs1g97g2s1x99t2dlw0000gn/T/hermes-results/call_2rwob1xJQWLPu9oUhehGg57D.txt for inner app metadata

Evaluate:
1. Root causes of visual inaccuracy, not just symptoms.
2. Whether current code truly implements Figma node geometry/tokens/components or approximates them.
3. Specific screens likely wrong: purchase/detail page, dues screen, app home after notification, checkout.
4. Whether previous "QA passed" was misleading and why.
5. What exact remediation workflow should be used next to get to high fidelity.

Constraints:
- Do not edit.
- Do not propose screenshot-as-UI or image slicing.
- No vague encouragement. Return harsh, concrete findings grouped P0/P1/P2 and a recovery plan.