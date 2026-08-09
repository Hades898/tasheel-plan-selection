**P0**
None.

**P1**
None.

**P2**
- [scripts/patch-gh-pages-export.cjs](/Users/hadysoliman/tasheel-bnpl-browser-prototype/scripts/patch-gh-pages-export.cjs:31): latent asset risk. If future Expo bundles emit `uri:"/assets/..."`, rewriting to `./assets/...` can resolve relative to deep routes like `/tasheel-bnpl-prototype/checkout/detail`. Current inspected `dist` does not show runtime asset URIs, so this is not blocking now.
- [App.tsx](/Users/hadysoliman/tasheel-bnpl-browser-prototype/App.tsx:23): route alias matching uses broad `path.includes(...)`. It supports `/checkout/home` and `/checkout/details`, but can false-positive on unrelated paths containing those substrings. Low risk for this static prototype.
- [scripts/in-app-qa.cjs](/Users/hadysoliman/tasheel-bnpl-browser-prototype/scripts/in-app-qa.cjs:51): QA checks required text for detail/purchases/dues, but does not assert bottom content for home/insights or fail on scroll/clipping. The saved short screenshots I inspected look acceptable.

**Deploy Verdict**
Pass / safe to deploy for GitHub Pages at `/tasheel-bnpl-prototype`.

Base-path patching is present in `index.html`/`404.html`, SPA deep routes and aliases are covered by QA, and I did not find fake Safari/browser chrome. The UI uses in-app mobile status/home indicators only.