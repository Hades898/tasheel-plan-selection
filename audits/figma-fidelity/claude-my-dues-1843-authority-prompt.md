You are Claude Opus acting ONLY as a no-tools design authority for a Figma-to-Expo implementation.

Do not call tools. Do not ask questions. Use only this compact source spec and screenshot-derived observations.

Source:
- Figma URL: https://www.figma.com/design/geEFxJ11n2KySAZB6zsjEh/BNPL?node-id=1843-17915&t=j4iGP56XKrdloEVc-4
- Node: 1843:17915, frame name My dues, 402x890.
- Compact spec file created by Hermes: figma-spec/my-dues-1843-17915.json.
- Existing repo: /Users/hadysoliman/tasheel-bnpl-browser-prototype.
- Current route /checkout/dues implements an older similar dues screen and should be adjusted to this node.

Key visible facts from source screenshot:
- Header only shows status bar and a back circular button at x16/y70. No visible centered Tasheel icon and no visible close button in this node screenshot.
- Ring begins around y128, size 320x251. Center copy: 4 Dues Selected, amount 1,800, secondary Remaining 1200.
- List begins around y430 with four 370x72 rows, 10-12px gaps, radius 24. First three selected rows are pale #edf3ef with green #16720b border. Fourth row is white/no green border.
- Row content: Extra Stores 1,800, Jarir 600, Jarir 600, Jarir 600. Captions and 2 of 4 exactly as Figma.
- More row: +5 More next up payments, View all ›.
- Bottom CTA: width 370 height 50, dark #022b10, neon #3eff00 text: Pay selected ﷼ 3,000. Home indicator visible below.

Return a concise implementation acceptance rubric: P0 blockers, P1 fidelity risks, and a recommended bounded implementation strategy for Codex/Hermes. Do not mention that you need to inspect files or Figma live.