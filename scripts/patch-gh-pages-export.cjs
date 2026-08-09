const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');
const index = path.join(dist, 'index.html');
const notFound = path.join(dist, '404.html');
if (!fs.existsSync(index)) {
  console.error(`Missing ${index}. Run npm run export:web first.`);
  process.exit(1);
}
const projectBase = '/tasheel-bnpl-prototype';
let html = fs.readFileSync(index, 'utf8');
html = html
  // viewport-fit=cover lets iOS expose safe-area env() insets; maximum-scale=1
  // stops Safari's focus-zoom jumping the fixed design frame around inputs.
  .replaceAll('content="width=device-width, initial-scale=1, shrink-to-fit=no"', 'content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover"')
  // theme-color drives Safari's status-bar/notch chrome tint (else it falls back to grey)
  .replaceAll('</title>', '</title><meta name="theme-color" content="#ffffff" />')
  // The JS bundle is content-hashed, but this shell is not: iOS Safari and WKWebView
  // will happily serve a cached copy pointing at a bundle from a previous deploy, so
  // a demo phone can sit on stale UI long after a fix ships. Refuse to cache the shell.
  .replaceAll('<meta charset="utf-8" />', '<meta charset="utf-8" /><meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" /><meta http-equiv="Pragma" content="no-cache" /><meta http-equiv="Expires" content="0" />')
  .replaceAll('href="/favicon.ico"', `href="${projectBase}/favicon.ico"`)
  .replaceAll('href="./favicon.ico"', `href="${projectBase}/favicon.ico"`)
  .replaceAll('src="/_expo/', `src="${projectBase}/_expo/`)
  .replaceAll('src="./_expo/', `src="${projectBase}/_expo/`)
  .replaceAll('href="/_expo/', `href="${projectBase}/_expo/`)
  .replaceAll('href="./_expo/', `href="${projectBase}/_expo/`);
fs.writeFileSync(index, html);
fs.writeFileSync(notFound, html);

const bundleDir = path.join(dist, '_expo', 'static', 'js', 'web');
const patchedBundles = [];
if (fs.existsSync(bundleDir)) {
  for (const file of fs.readdirSync(bundleDir)) {
    if (!file.endsWith('.js')) continue;
    const bundlePath = path.join(bundleDir, file);
    let bundle = fs.readFileSync(bundlePath, 'utf8');
    const next = bundle
      .replaceAll('uri:"/assets/', `uri:"${projectBase}/assets/`)
      .replaceAll("uri:'/assets/", `uri:'${projectBase}/assets/`)
      .replaceAll('uri:"./assets/', `uri:"${projectBase}/assets/`)
      .replaceAll("uri:'./assets/", `uri:'${projectBase}/assets/`);
    if (next !== bundle) {
      fs.writeFileSync(bundlePath, next);
      patchedBundles.push(bundlePath);
    }
  }
}

const srcFigma = path.resolve(__dirname, '..', 'assets', 'figma');
const dstFigma = path.join(dist, 'figma');
let copiedFigmaAssets = 0;
if (fs.existsSync(srcFigma)) {
  fs.mkdirSync(dstFigma, { recursive: true });
  for (const file of fs.readdirSync(srcFigma)) {
    const src = path.join(srcFigma, file);
    const dst = path.join(dstFigma, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dst);
      copiedFigmaAssets += 1;
    }
  }
}

const routeAliases = [
  'checkout', 'checkout/app-home', 'checkout/home', 'checkout/detail', 'checkout/details',
  'checkout/insights', 'checkout/insights/category', 'checkout/insights/empty',
  'checkout/purchases', 'checkout/dues', 'checkout/next-up',
  'checkout/payment-method', 'checkout/payment-method/selected', 'checkout/payment-method/add-card', 'checkout/payment-method/added',
  'checkout/otp', 'checkout/processing', 'checkout/insufficient', 'checkout/declined', 'checkout/success',
  'checkout/onboarding/mobile', 'checkout/onboarding/otp', 'checkout/onboarding/identity', 'checkout/onboarding/nafath',
  'checkout/onboarding/quick-call',
  'checkout/onboarding/tenure', 'checkout/onboarding/payment', 'checkout/onboarding/processing', 'checkout/onboarding/success',
  'checkout/notification'
];
let routeAliasFiles = 0;
for (const route of routeAliases) {
  const file = path.join(dist, route, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  routeAliasFiles += 1;
}
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('Patched Expo Web export for GitHub Pages project hosting:', { index, notFound, patchedBundles, copiedFigmaAssets, routeAliasFiles });
