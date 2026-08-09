const { chromium } = require('playwright');
(async () => {
  const base = 'http://127.0.0.1:4174/tasheel-bnpl-prototype';
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // Login screen
  await p.goto(base + '/checkout/login', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1400);
  await p.screenshot({ path: 'screenshots/auth-login.png', clip: { x: 439, y: 0, width: 402, height: 874 } });
  // type number
  await p.getByLabel('Mobile number').click();
  await p.getByLabel('Mobile number').fill('0512345678');
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'screenshots/auth-login-filled.png', clip: { x: 439, y: 0, width: 402, height: 874 } });
  // continue
  await p.getByText('Continue', { exact: true }).click();
  await p.waitForTimeout(900);
  const otpUrl = p.url();
  await p.screenshot({ path: 'screenshots/auth-otp.png', clip: { x: 439, y: 0, width: 402, height: 874 } });
  // type code
  await p.getByLabel('Verification code').fill('1234');
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'screenshots/auth-otp-filled.png', clip: { x: 439, y: 0, width: 402, height: 874 } });
  // confirm
  await p.getByText('Confirm OTP', { exact: true }).click();
  await p.waitForTimeout(1000);
  const homeUrl = p.url();
  const onHome = await p.getByTestId('superapp-home').count();
  console.log(JSON.stringify({ otpUrl, homeUrl, onHome }));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
