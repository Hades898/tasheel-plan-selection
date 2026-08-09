# Claude task: identify and fix the typography fidelity issue

You are Claude Code deployed by Hermes because the user explicitly said: "we still have a typography issue use claude to figure it out. you must deploy claude."

Repository: `/Users/hadysoliman/tasheel-bnpl-browser-prototype`

Goal:
Fix the typography mismatch in the BNPL Expo/React Native Web prototype while preserving the working checkout flow and routes.

Hard constraints:
- Preserve all routes and aliases under `/tasheel-bnpl-prototype/checkout/...`.
- Do not remove the current Figma asset pipeline or route QA.
- Do not use screenshots as source of implementation.
- Use Figma/source spec and runtime computed typography checks.
- Keep source-level Expo/RN Web primitives, not static screenshots.
- Fix typography only unless you discover a P0/P1 typography-linked layout bug.

Important source files:
- `App.tsx`
- `audits/figma-fidelity/BNPL_FIGMA_SPEC.md`
- `figma-spec/home.json`
- `figma-spec/checkout.json`
- `scripts/in-app-qa.cjs`
- `scripts/figma-geometry-probe.cjs`
- `scripts/patch-gh-pages-export.cjs`

Known likely typography issue to investigate, not blindly assume:
- `App.tsx` currently injects a global CSS rule making `#root *` use the SF Pro stack. The Figma spec says app screens should use SF Pro, but checkout should use Inter. If global CSS overrides checkout text, checkout typography may be wrong.
- React Native Web `Text` font family may need explicit route/surface-level families rather than a global blanket override.
- Font weights/line heights/letter spacing may be off compared with Figma tokens.

Acceptance criteria:
1. Claude must inspect the source and Figma spec and identify the real typography defect(s).
2. Apply code fixes directly.
3. Add or update a lightweight typography probe if useful, to catch the issue in future. It should inspect computed CSS for representative text on checkout vs app screens.
4. Run and pass:
   - `npm run typecheck`
   - `npm run export:web`
   - ensure local server works on port 4174 if needed
   - `npm run qa:in-app`
   - `node scripts/figma-geometry-probe.cjs`
   - any typography probe you add
5. Write a concise report to `audits/figma-fidelity/claude-typography-fix-report.md` including:
   - what defect you found
   - files changed
   - verification commands and result
   - any remaining caveats

Please perform the work autonomously. If a command fails, fix it and rerun. Do not modify deployment branches or push.