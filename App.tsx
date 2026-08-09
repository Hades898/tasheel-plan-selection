import { StatusBar } from 'expo-status-bar';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

type RouteKey = 'checkout' | 'saLogin' | 'saOtp' | 'saAddCard' | 'superHome' | 'appHome' | 'detail' | 'insights' | 'insightsCategory' | 'insightsEmpty' | 'purchases' | 'dues' | 'nextUp' | 'paymentMethod' | 'paymentSelected' | 'addCard' | 'cardAdded' | 'otp' | 'processing' | 'insufficient' | 'declined' | 'success'
  | 'wcMobile' | 'wcOtp' | 'wcIdentity' | 'wcNafath' | 'wcQuickCall' | 'wcTenure' | 'wcPayment' | 'wcProcessing' | 'wcSuccess' | 'wcNotification';
type PayMethod = 'card' | 'apple';
type Merchant = 'extra' | 'jarir' | 'noon';

type DueItem = {
  id: string;
  kind: Merchant;
  name: string;
  product: string;
  amount: number;
  dueAt: string;
  when: string;
  installmentLabel: string;
};

type DuesSummary = {
  selectedIds: Set<string>;
  selectedItems: DueItem[];
  selectedCount: number;
  selectedAmount: number;
  visibleTotal: number;
  totalAmount: number;
  hiddenCount: number;
  remainingVisibleAmount: number;
  remainingAllAmount: number;
  visibleCount: number;
  totalCount: number;
};

const VISIBLE_DUES_COUNT = 4;

const DUE_ITEMS: DueItem[] = [
  { id: 'extra-iphone-apr20', kind: 'extra', name: 'Extra Stores', product: 'iPhone 16 Pro Max', amount: 1800, dueAt: '2026-04-20', when: 'In 2 days  - April 20th', installmentLabel: '1 of 4' },
  { id: 'jarir-macbook-apr27', kind: 'jarir', name: 'Jarir', product: 'MacBook Air M4', amount: 600, dueAt: '2026-04-27', when: 'In 9 days  - April 27th', installmentLabel: '2 of 4' },
  { id: 'noon-airpods-may04', kind: 'noon', name: 'Noon', product: 'AirPods Pro', amount: 300, dueAt: '2026-05-04', when: 'In 16 days  - May 4th', installmentLabel: '3 of 4' },
  { id: 'jarir-ipad-may11', kind: 'jarir', name: 'Jarir', product: 'Multiple products', amount: 300, dueAt: '2026-05-11', when: 'In 23 days  - May 11th', installmentLabel: '4 of 4' },
];

const formatAmount = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
// The homepage upcoming-payment flow pays a fixed 4,250 (matches the home card); the older
// dues flow is no longer wired into the homepage, so this stays constant for coherence.
const paymentFlowAmount = (_summary: DuesSummary) => 4250;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dueMonth = (item: DueItem) => MONTH_NAMES[parseInt(item.dueAt.slice(5, 7), 10) - 1];
const joinMonths = (months: string[]) => months.length <= 1 ? (months[0] ?? '') : months.length === 2 ? `${months[0]} and ${months[1]}` : `${months.slice(0, -1).join(', ')} and ${months[months.length - 1]}`;

// Launches the real native Apple Pay sheet when available (Safari over HTTPS on
// iOS/macOS). The prototype has no merchant server, so the sheet is presented,
// then closed after a beat and the flow continues; everywhere else it falls
// straight through to the prototype processing screen.
const launchNativeApplePay = (amount: number, onDone: () => void) => {
  try {
    const APS = (globalThis as { ApplePaySession?: any }).ApplePaySession;
    if (!APS || !APS.canMakePayments()) {
      onDone();
      return;
    }
    const session = new APS(3, {
      countryCode: 'SA',
      currencyCode: 'SAR',
      supportedNetworks: ['visa', 'masterCard', 'mada'],
      merchantCapabilities: ['supports3DS'],
      total: { label: 'Tasheel Finance', amount: amount.toFixed(2) },
    });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onDone();
    };
    session.onvalidatemerchant = () => {
      setTimeout(() => {
        try { session.abort(); } catch { /* sheet already closed */ }
        finish();
      }, 1600);
    };
    session.oncancel = finish;
    session.begin();
  } catch {
    onDone();
  }
};
const sortedDues = (items: DueItem[]) => [...items].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
const paymentFixtureDueIds = () => new Set(sortedDues(DUE_ITEMS).slice(0, 2).map(item => item.id));
const defaultDueIds = (route?: RouteKey) => {
  const paymentRoutes: RouteKey[] = ['paymentMethod', 'paymentSelected', 'addCard', 'cardAdded', 'otp', 'processing', 'success'];
  if (route && paymentRoutes.includes(route)) return paymentFixtureDueIds();
  return new Set(DUE_ITEMS.length ? [sortedDues(DUE_ITEMS)[0].id] : []);
};

function deriveDuesSummary(items: DueItem[], selectedIds: Set<string>): DuesSummary {
  const ordered = sortedDues(items);
  const visible = ordered.slice(0, VISIBLE_DUES_COUNT);
  const selectedItems = ordered.filter((item) => selectedIds.has(item.id));
  const selectedAmount = selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const visibleTotal = visible.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = ordered.reduce((sum, item) => sum + item.amount, 0);
  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedItems.length,
    selectedAmount,
    visibleTotal,
    totalAmount,
    hiddenCount: Math.max(0, ordered.length - visible.length),
    remainingVisibleAmount: Math.max(0, visibleTotal - selectedAmount),
    remainingAllAmount: Math.max(0, totalAmount - selectedAmount),
    visibleCount: visible.length,
    totalCount: ordered.length,
  };
}

const green = '#022b10';
const neon = '#3eff00';
const canvas = '#f9fafb';
const surface = '#ffffff';
const text = '#030712';
const muted = '#4b5563';
const border = '#e5e7eb';
const borderSubtle = '#f3f4f6';
const greenMid = '#166534';

// Two type systems per Figma spec (BNPL_FIGMA_SPEC.md / figma-spec/*.json):
//  - App screens use SF Pro (Apple system stack; no bundled SF Pro file here).
//  - The merchant checkout (Figma 355:58228) uses Inter.
// We scope the active family with a CSS custom property (`--surface-font`) so each
// React Native Web `Text` inherits the correct font per surface, instead of one
// global blanket that forced SF Pro everywhere (which clobbered checkout's Inter).
const SF_PRO = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif';
const INTER = 'Inter, "Inter Fallback", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

if (typeof document !== 'undefined') {
  const styleId = 'tasheel-typography';
  if (!document.getElementById(styleId)) {
    // Load the real Inter webfont so checkout matches the Figma source instead of
    // falling back to a system face. Fallback stack keeps text rendering offline.
    if (!document.querySelector('link[data-tasheel-inter]')) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://fonts.gstatic.com';
      preconnect.crossOrigin = 'anonymous';
      preconnect.setAttribute('data-tasheel-inter', '');
      document.head.appendChild(preconnect);
      const interLink = document.createElement('link');
      interLink.rel = 'stylesheet';
      interLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
      interLink.setAttribute('data-tasheel-inter', '');
      document.head.appendChild(interLink);
    }

    const el = document.createElement('style');
    el.id = styleId;
    el.textContent = [
      // Default surface (app screens) resolves to SF Pro.
      `html,body,#root{--surface-font:${SF_PRO};font-family:var(--surface-font);background-color:#ffffff;}`,
      // Checkout opts into Inter; the variable cascades to its whole subtree.
      `[data-surface="checkout"]{--surface-font:${INTER};}`,
      // System UI islands (Safari chrome, status bar) inside checkout re-scope to SF.
      `[data-surface="app"]{--surface-font:${SF_PRO};}`,
      // Force every RNW text element to follow the active surface font (overriding
      // RNW's built-in Text font-family) while leaving SVG glyph nodes untouched.
      `#root *:not(svg):not(g):not(path):not(circle):not(rect):not(defs):not(stop):not(lineargradient):not(filter){font-family:var(--surface-font) !important;-webkit-font-smoothing:antialiased;}`,
      // Kill browser focus rings (the DS has its own active-input styling) and
      // left-align the iOS date-input value to match the other form fields.
      `#root input:focus,#root textarea:focus{outline:none !important;box-shadow:none !important;}`,
      `input::-webkit-date-and-time-value{text-align:left;}`,
      `[data-saviewport="1"]{padding-bottom:0 !important;padding-top:0 !important;}`,
    ].join('');
    document.head.appendChild(el);
  }
}

const figmaAssets = {
  extraLogo: '/figma/extraLogo.png',
  jarirLogo: '/figma/jarirLogo.png',
  noonLogo: '/figma/noonLogo.png',
  homeDuesIcon: '/figma/homeDuesIcon.png',
  homePurchasesIcon: '/figma/homePurchasesIcon.png',
  homeInsightsIcon: '/figma/homeInsightsIcon.png',
  levels: '/figma/levels.svg',
  duesTrack: '/figma/duesTrack.svg',
  duesFilled: '/figma/duesFilled.png',
  duesDot: '/figma/duesDot.svg',
  duesLeadingHaloV3: '/figma/duesLeadingHaloV3.svg',
  duesTrackEmptyV4: '/figma/duesTrackEmptyV4.svg',
  duesFilledV4: '/figma/duesFilledV4.svg',
  duesDotVertical: '/figma/duesDotVertical.svg',
  duesDotRight: '/figma/duesDotRight.svg',
  duesDotLeft: '/figma/duesDotLeft.svg',
  tasheelLogoPartA: '/figma/tasheelLogoPartA.svg',
  tasheelLogoPartB: '/figma/tasheelLogoPartB.svg',
  tasheelLogoPartC: '/figma/tasheelLogoPartC.svg',
  iconChevronLeft: '/figma/iconChevronLeft.svg',
  iconClose: '/figma/iconClose.svg',
  iconChevronRight: '/figma/iconChevronRight.svg',
  homeElementA: '/figma/homeElementA.svg',
  homeElementB: '/figma/homeElementB.svg',
  riyalDark: '/figma/riyalDark.svg',
  riyalOnPrimary: '/figma/riyalOnPrimary.svg',
  paymentCardIcon: '/figma/paymentCardIcon.svg',
  paymentCardAddIcon: '/figma/paymentCardAddIcon.svg',
  paymentApplePay: '/figma/paymentApplePay.svg',
  paymentHourglass: '/figma/paymentHourglass.png',
  otpBankPage: '/figma/otpBankPage.png',
  wcTasheelLogo: '/figma/wcTasheelLogo.svg',
  wcSaudiFlag: '/figma/wcSaudiFlag.svg',
  wcCloseX: '/figma/wcCloseX.svg',
  wcTimerClock: '/figma/wcTimerClock.svg',
  wcCalendar: '/figma/wcCalendar.svg',
  wcShieldTick: '/figma/wcShieldTick.svg',
  wcNafathMark: '/figma/wcNafathMark.svg',
  wcCartIcon: '/figma/wcCartIcon.svg',
  wcArrowRight: '/figma/wcArrowRight.svg',
  wcMinus: '/figma/wcMinus.svg',
  wcPlus: '/figma/wcPlus.svg',
  wcApplePay: '/figma/wcApplePay.svg',
  wcVisa: '/figma/wcVisa.svg',
  wcMada: '/figma/wcMada.svg',
  wcMastercard: '/figma/wcMastercard.svg',
  wcCardAdd: '/figma/wcCardAdd.svg',
  wcInfoCircle: '/figma/wcInfoCircle.svg',
  wcRocket: '/figma/wcRocket.png',
  wcQuickCallArt: '/figma/wcQuickCallArt.jpg',
  wcBadgeAppStore: '/figma/wcBadgeAppStore.png',
  wcSmegFridge: '/figma/wcSmegFridge.jpg',
  wcBadgeGooglePlay: '/figma/wcBadgeGooglePlay.png',
  tabHome: '/figma/tabHome.svg',
  tabFlash: '/figma/tabFlash.svg',
  tabBnpl: '/figma/tabBnpl.svg',
  tabProfile: '/figma/tabProfile.svg',
  paymentSuccessCelebration: '/figma/paymentSuccessCelebration.png',
  paymentSuccessMerchant: '/figma/paymentSuccessMerchant.png',
  browserReload: '/figma/browserReload.svg',
  browserSiteSettings: '/figma/browserSiteSettings.svg',
  // --- Superapp landing page (Figma 2741:27487) ---
  saHeroFitbit: '/figma/sa_heroFitbit.png',
  saFitbitLogo: '/figma/sa_fitbitLogo.png',
  saRiyal: '/figma/sa_riyal.svg',
  saAvatar: '/figma/sa_avatar.png',
  saBell: '/figma/sa_bellWhite.svg',
  saQnPayLater: '/figma/sa_qnPayLater.png',
  saQnPersonalFinance: '/figma/sa_qnPersonalFinance.png',
  saQnCards: '/figma/sa_qnCards.png',
  saAvA: '/figma/sa_avA.png',
  saAvB: '/figma/sa_avB.png',
  saAvC: '/figma/sa_avC.png',
  saBnSamsungLogo: '/figma/sa_bnSamsungLogo.png',
  saBnSamsungImg: '/figma/sa_bnSamsungImg.png',
  saBnPayLaterLogo: '/figma/sa_bnPayLaterLogo.png',
  saBnPhoneImg: '/figma/sa_bnPhoneImg.png',
  saBnIkeaImg: '/figma/sa_bnIkeaImg.png',
  saBnIkeaLogo: '/figma/sa_bnIkeaLogo.png',
  saStExtra: '/figma/sa_stExtra.png',
  saStApple: '/figma/sa_stApple.png',
  saStJordan: '/figma/sa_stJordan.png',
  saStNamshi: '/figma/sa_stNamshi.png',
  saStZara: '/figma/sa_stZara.png',
  saDlCashbackBg: '/figma/sa_dlCashbackBg.png',
  saDlCashbackLogo: '/figma/sa_dlCashbackLogo.png',
  saDlBogoBg: '/figma/sa_dlBogoBg.png',
  saDlBogoLogo: '/figma/sa_dlBogoLogo.png',
  saDlDiscountBg: '/figma/sa_dlDiscountBg.png',
  saDlDiscountLogo: '/figma/sa_dlDiscountLogo.png',
  saElIphoneBg: '/figma/sa_elIphoneBg.png',
  saElIphoneLogo: '/figma/sa_elIphoneLogo.png',
  saElSamsungBg: '/figma/sa_elSamsungBg.png',
  saElSamsungLogo: '/figma/sa_elSamsungLogo.png',
  saElPs5Bg: '/figma/sa_elPs5Bg.png',
  saElPs5Logo: '/figma/sa_elPs5Logo.png',
  saHaTvBg: '/figma/sa_haTvBg.png',
  saHaTvLogo: '/figma/sa_haTvLogo.png',
  saHaSmegBg: '/figma/sa_haSmegBg.png',
  saHaSmegLogo: '/figma/sa_haSmegLogo.png',
  saHaDysonBg: '/figma/sa_haDysonBg.png',
  saHaDysonLogo: '/figma/sa_haDysonLogo.png',
  saBlPersonalLoan: '/figma/sa_blPersonalLoan.png',
  saBlCreditCard: '/figma/sa_blCreditCard.png',
  saCatPopular: '/figma/sa_catPopular.svg',
  saCatFashion: '/figma/sa_catFashion.svg',
  saCatHome: '/figma/sa_catHome.svg',
  saCatElectronics: '/figma/sa_catElectronics.svg',
  saCatTravel: '/figma/sa_catTravel.svg',
  saCatLuxury: '/figma/sa_catLuxury.svg',
  saCatBeauty: '/figma/sa_catBeauty.svg',
  saCatSports: '/figma/sa_catSports.svg',
  saTabExplore: '/figma/sa_tabExplore.svg',
  saTabStores: '/figma/sa_tabStores.svg',
  saTabOffers: '/figma/sa_tabOffers.svg',
  saTabPurchases: '/figma/sa_tabPurchases.svg',
  saTabSearch: '/figma/sa_tabSearch.svg',
  // Updated tab-bar icons (Figma 2741:27756)
  saNav2Explore: '/figma/sa_nav2Explore.svg',
  saNav2Stores: '/figma/sa_nav2Stores.svg',
  saNav2Offers: '/figma/sa_nav2Offers.svg',
  saNav2Purchases: '/figma/sa_nav2Purchases.svg',
  saNav2Search: '/figma/sa_nav2Search.svg',
  // Login + OTP (Figma 2761:29566)
  saLoginBg: '/figma/sa_loginBg.jpg',
  saTasheelFinanceLogo: '/figma/sa_logoFill.svg',
  saSaudiFlag: '/figma/sa_saudiFlag.svg',
  saClockIcon: '/figma/sa_clockIcon.svg',
} as const;

type FigmaImageKey = keyof typeof figmaAssets;

function publicAssetPath(path: string) {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath === githubPagesBase || currentPath.startsWith(`${githubPagesBase}/`)) {
      return `${githubPagesBase}${path}`;
    }
  }
  return path;
}

function figmaImageSource(asset: FigmaImageKey) {
  return { uri: publicAssetPath(figmaAssets[asset]) };
}

const routeFromPath = (path: string): RouteKey => {
  if (path.includes('/checkout/onboarding/mobile')) return 'wcMobile';
  if (path.includes('/checkout/onboarding/otp')) return 'wcOtp';
  if (path.includes('/checkout/onboarding/identity')) return 'wcIdentity';
  if (path.includes('/checkout/onboarding/nafath')) return 'wcNafath';
  if (path.includes('/checkout/onboarding/quick-call')) return 'wcQuickCall';
  if (path.includes('/checkout/onboarding/tenure')) return 'wcTenure';
  if (path.includes('/checkout/onboarding/payment')) return 'wcPayment';
  if (path.includes('/checkout/onboarding/processing')) return 'wcProcessing';
  if (path.includes('/checkout/onboarding/success')) return 'wcSuccess';
  if (path.includes('/checkout/notification')) return 'wcNotification';
  if (path.includes('/checkout/login')) return 'saLogin';
  if (path.includes('/checkout/otp-login')) return 'saOtp';
  if (path.includes('/checkout/add-card-home')) return 'saAddCard';
  if (path.includes('/checkout/superhome')) return 'superHome';
  if (path.includes('/checkout/app-home') || path.includes('/checkout/home')) return 'appHome';
  if (path.includes('/checkout/detail') || path.includes('/checkout/details')) return 'detail';
  if (path.includes('/checkout/insights/category')) return 'insightsCategory';
  if (path.includes('/checkout/insights/empty')) return 'insightsEmpty';
  if (path.includes('/checkout/insights')) return 'insights';
  if (path.includes('/checkout/purchases')) return 'purchases';
  if (path.includes('/checkout/next-up')) return 'nextUp';
  if (path.includes('/checkout/payment-method/selected')) return 'paymentSelected';
  if (path.includes('/checkout/payment-method/add-card')) return 'addCard';
  if (path.includes('/checkout/payment-method/added')) return 'cardAdded';
  if (path.includes('/checkout/payment-method')) return 'paymentMethod';
  if (path.includes('/checkout/otp')) return 'otp';
  if (path.includes('/checkout/processing')) return 'processing';
  if (path.includes('/checkout/insufficient')) return 'insufficient';
  if (path.includes('/checkout/declined')) return 'declined';
  if (path.includes('/checkout/success')) return 'success';
  if (path.includes('/checkout/dues')) return 'dues';
  return 'checkout';
};

function currentPath() {
  if (typeof window === 'undefined') return '/checkout';
  return window.location.pathname;
}

const githubPagesBase = '/tasheel-bnpl-prototype';

function withDeployBase(path: string) {
  if (typeof window === 'undefined') return path;
  const currentPath = window.location.pathname;
  if (currentPath === githubPagesBase || currentPath.startsWith(`${githubPagesBase}/`)) {
    return `${githubPagesBase}${path}`;
  }
  return path;
}

function pushPath(path: string) {
  if (typeof window !== 'undefined') window.history.pushState({}, '', withDeployBase(path));
}

function Riyal({ size = 14, color = text, weight = '600' }: { size?: number; color?: string; weight?: '400' | '500' | '600' | '700' }) {
  const asset: FigmaImageKey = color === neon ? 'riyalOnPrimary' : 'riyalDark';
  return <Image source={figmaImageSource(asset)} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: size, height: size, marginRight: Math.max(3, size * 0.22), opacity: color === muted ? 0.72 : 1, tintColor: color === neon ? undefined : color }} />;
}

function Money({ amount, decimals, size = 16, color = text, weight = '600' }: { amount: string; decimals?: string; size?: number; color?: string; weight?: '400' | '500' | '600' | '700' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Riyal size={Math.max(10, Math.round(size * 0.56))} color={color} weight={weight} />
      <Text style={{ fontSize: size, fontWeight: weight, color, letterSpacing: -0.4 }}>{amount}</Text>
      {decimals ? <Text style={{ fontSize: Math.max(11, size - 8), fontWeight: '400', color }}>{decimals}</Text> : null}
    </View>
  );
}

function TasheelMark({ size = 30 }: { size?: number }) {
  // Source-exported Tasheel company mark from Figma node 1216:10387.
  return (
    <View style={{ width: size, height: size, position: 'relative', overflow: 'hidden' }}>
      <Image source={figmaImageSource('tasheelLogoPartA')} resizeMode="stretch" accessibilityIgnoresInvertColors style={{ position: 'absolute', left: size * 0.1051, top: size * 0.4779, width: size * 0.2073, height: size * 0.4363 }} />
      <Image source={figmaImageSource('tasheelLogoPartB')} resizeMode="stretch" accessibilityIgnoresInvertColors style={{ position: 'absolute', left: size * 0.3124, top: size * 0.0417, width: size * 0.2073, height: size * 0.4362 }} />
      <Image source={figmaImageSource('tasheelLogoPartC')} resizeMode="stretch" accessibilityIgnoresInvertColors style={{ position: 'absolute', left: size * 0.3115, top: size * 0.0818, width: size * 0.5437, height: size * 0.8719 }} />
    </View>
  );
}

// Status-bar signal/wifi/battery cluster — Figma export (levels.svg, 103×22).
// On a real iOS device the OS already draws the status bar and home indicator, so
// the prototype's fake chrome (9:41 strip, black home-indicator bars) must not
// render there — it double-draws and eats real estate. Desktop browsers keep the
// fake chrome to sell the phone frame.
const IS_IOS_DEVICE = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || '') && typeof document !== 'undefined' && 'ontouchend' in document;
const SHOW_FAKE_CHROME = !IS_IOS_DEVICE;

// Tracks the *visual* viewport height (shrinks when the iOS keyboard opens; innerHeight does not).
// Also keeps the document pinned to the top so the keyboard can't scroll a gap into view.
function useVisualViewportHeight() {
  const { height } = useWindowDimensions();
  const [vh, setVh] = useState(height);
  useEffect(() => {
    if (SHOW_FAKE_CHROME || typeof window === 'undefined' || !window.visualViewport) { setVh(height); return; }
    const vv = window.visualViewport;
    const update = () => {
      setVh(vv.height);
      // iOS scrolls the page to reveal the focused input; force it back to the top so the
      // app container (sized to vv.height) stays flush with the keyboard — no white gap.
      if (window.scrollY !== 0 || vv.offsetTop !== 0) window.scrollTo(0, 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, [height]);
  return SHOW_FAKE_CHROME ? height : vh;
}

function StatusStrip({ pointerEvents = 'auto' }: { pointerEvents?: 'auto' | 'none' }) {
  if (!SHOW_FAKE_CHROME) return null;
  return (
    <View pointerEvents={pointerEvents} style={styles.statusStrip}>
      <Text style={styles.statusTime}>9:41</Text>
      <Image
        source={figmaImageSource('levels')}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessibilityLabel="Signal, Wi-Fi and battery"
        style={styles.statusLevels}
      />
    </View>
  );
}

function HomeIndicator() {
  if (!SHOW_FAKE_CHROME) return null;
  return <View style={styles.homeIndicator} />;
}

function FakeHomeIndicator1843() {
  if (!SHOW_FAKE_CHROME) return null;
  return <View style={styles.homeIndicator1843} />;
}

function RoundButton({ glyph, label, onPress }: { glyph: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
      {glyph === '‹' ? (
        <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityLabel={label}>
          <Path d="M15 5.5L8.5 12L15 18.5" fill="none" stroke={text} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : glyph === '×' ? (
        <Svg width={21} height={21} viewBox="0 0 24 24" accessibilityLabel={label}>
          <Path d="M7 7L17 17M17 7L7 17" fill="none" stroke={text} strokeWidth={2.1} strokeLinecap="round" />
        </Svg>
      ) : <Text style={styles.roundButtonText}>{glyph}</Text>}
    </Pressable>
  );
}

// --- Merchant marks sourced from Figma exports ---
function MerchantBadge({ kind, size = 36, testID }: { kind: Merchant; size?: number; testID?: string }) {
  if (kind === 'jarir') {
    const inner = size * 0.62;
    return (
      <View testID={testID || 'merchant-jarir'} style={[styles.merchantBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#ffffff' }]}>
        <View style={{ width: inner, height: inner, overflow: 'hidden', position: 'relative' }}>
          <Image source={figmaImageSource('jarirLogo')} resizeMode="stretch" accessibilityIgnoresInvertColors style={{ position: 'absolute', left: -inner * 1.53, top: -inner * 1.11, width: inner * 6.93, height: inner * 3.33 }} />
        </View>
      </View>
    );
  }
  const asset: FigmaImageKey = kind === 'extra' ? 'extraLogo' : 'noonLogo';
  const imageStyle = kind === 'extra' ? { width: size * 0.65, height: size * 0.45 } : { width: size * 0.72, height: size * 0.72 };
  return (
    <View testID={testID || `merchant-${kind}`} style={[styles.merchantBadge, { width: size, height: size, borderRadius: size * 0.24, backgroundColor: '#ffffff' }]}>
      <Image source={figmaImageSource(asset)} resizeMode="contain" accessibilityIgnoresInvertColors style={imageStyle} />
    </View>
  );
}

// --- Figma-exported home action-tile icons ---
function FigmaActionIcon({ asset, testID }: { asset: FigmaImageKey; testID?: string }) {
  return <Image testID={testID} source={figmaImageSource(asset)} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.figmaActionIcon} />;
}

function IconCoins({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <G>
        <Path d="M8 24 C8 21 12 19.5 17 19.5 C22 19.5 26 21 26 24 L26 28 C26 31 22 32.5 17 32.5 C12 32.5 8 31 8 28 Z" fill="#e9a23b" />
        <Path d="M8 24 C8 27 12 28.5 17 28.5 C22 28.5 26 27 26 24 C26 21 22 19.5 17 19.5 C12 19.5 8 21 8 24 Z" fill="#f5c451" />
        <Path d="M14 11 C14 8.2 18 7 22.5 7 C27 7 31 8.2 31 11 L31 16 C31 18.8 27 20 22.5 20 C18 20 14 18.8 14 16 Z" fill="#d98e2b" />
        <Path d="M14 11 C14 13.8 18 15 22.5 15 C27 15 31 13.8 31 11 C31 8.2 27 7 22.5 7 C18 7 14 8.2 14 11 Z" fill="#f5c451" />
      </G>
    </Svg>
  );
}

function IconBag({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M11 14 L29 14 L31 33 C31 34.1 30.1 35 29 35 L11 35 C9.9 35 9 34.1 9 33 Z" fill="#0a5a2a" />
      <Path d="M14 16 L14 12 C14 8.7 16.7 6 20 6 C23.3 6 26 8.7 26 12 L26 16" stroke="#0a5a2a" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Circle cx="27.5" cy="27.5" r="6.5" fill="#39d353" />
      <Path d="M24.6 27.6 L26.6 29.6 L30.6 25.2" stroke="#063417" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconChart({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x="8" y="22" width="5" height="10" rx="1.6" fill="#9fd9a8" />
      <Rect x="16" y="16" width="5" height="16" rx="1.6" fill="#3aa64a" />
      <Rect x="24" y="11" width="5" height="21" rx="1.6" fill="#0a5a2a" />
      <Circle cx="28" cy="13" r="7" fill="none" stroke="#0a5a2a" strokeWidth={2.4} />
      <Path d="M33 18 L37 22" stroke="#0a5a2a" strokeWidth={2.8} strokeLinecap="round" />
    </Svg>
  );
}

function Progress({ value, segments = 0 }: { value: number; segments?: number }) {
  // Figma DS progress (1069:21): gradient fill #166534 -> #3eff00, #e5e7eb track,
  // white 2px dashes on installment boundaries, 8px tall, radius 4.
  return (
    <View style={styles.progressTrackSmall}>
      <View style={[styles.progressFillWrap, { width: `${Math.max(0, Math.min(100, value * 100))}%` }]}>
        <Svg width="100%" height={8} preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id="installmentFill" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#166534" />
              <Stop offset="1" stopColor="#3eff00" />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="8" fill="url(#installmentFill)" />
        </Svg>
      </View>
      {Array.from({ length: Math.max(0, segments - 1) }, (_, i) => (
        <View key={`dash-${i}`} style={[styles.progressDash, { left: `${((i + 1) / segments) * 100}%` }]} />
      ))}
    </View>
  );
}

function ThickProgress({ value }: { value: number }) {
  const pct = Math.max(6, Math.min(100, value * 100));
  return (
    <View style={styles.thickTrack}>
      <View style={[styles.thickFill, { width: `${pct}%` }]} />
      <View style={[styles.thickThumb, { left: `${pct}%` }]} />
    </View>
  );
}

function Radio({ selected, color = green }: { selected?: boolean; color?: string }) {
  return (
    <View style={[styles.radioOuter, { borderColor: selected ? color : '#cbd5e1' }]}>
      {selected ? <View style={[styles.radioInner, { backgroundColor: color }]} /> : null}
    </View>
  );
}

function SegTabs({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.tabs}>
      {['All', 'Active', 'Completed'].map((tab) => (
        <Pressable key={tab} onPress={() => onChange(tab)} style={[styles.tab, value === tab && styles.tabActive]} accessibilityRole="tab">
          <Text style={[styles.tabText, value === tab && styles.tabTextActive]}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function AppShell({ children, scroll = true, surface = 'app' }: { children: React.ReactNode; scroll?: boolean; surface?: 'app' | 'checkout' }) {
  const { width, height } = useWindowDimensions();
  const designWidth = 402;
  // Real iOS devices hide the fake 44px status strip, so fixed screens are 830 tall there.
  const designHeight = SHOW_FAKE_CHROME ? 874 : 830;
  // `dataSet` is a React Native Web prop (renders data-surface="…") used to scope
  // the per-surface font family; cast through any since RN's View types omit it.
  const surfaceProps = { dataSet: { surface } } as any;

  if (!SHOW_FAKE_CHROME) {
    // Real iOS: fill the device width edge-to-edge and scale the whole design up
    // with CSS zoom (width / 402), so typography/hierarchy keeps the intended
    // proportions on wider phones. zoom affects layout (unlike transform), and
    // width-only scaling keeps the page stable when the keyboard resizes the
    // viewport. Fixed frames keep their 830 design height and scroll if taller.
    const zoom = width / designWidth;
    const inner = scroll
      ? children
      : <View style={{ width: designWidth, height: designHeight, overflow: 'hidden' }}>{children}</View>;
    return (
      <SafeAreaView style={[styles.outer, { backgroundColor: canvas }]}>
        <StatusBar style="dark" />
        <ScrollView style={{ width: '100%', flex: 1 }} contentContainerStyle={styles.outerScroll} showsVerticalScrollIndicator={false}>
          <View {...surfaceProps} style={[styles.phone, { maxWidth: width }]}>
            {createElement('div', { style: { zoom, minHeight: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 } }, inner)}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const maxWidth = Math.min(402, width);
  const fixedScale = Math.min(1, width / designWidth, height / designHeight);
  const content = <View {...surfaceProps} style={[styles.phone, { maxWidth }]}>{children}</View>;
  const fixedTranslateX = -(designWidth * (1 - fixedScale)) / 2;
  const fixedTranslateY = -(designHeight * (1 - fixedScale)) / 2;
  const fixedContent = (
    <View style={{ width: designWidth * fixedScale, height: designHeight * fixedScale, overflow: 'hidden' }}>
      <View {...surfaceProps} style={[styles.phone, { width: designWidth, height: designHeight, transform: [{ translateX: fixedTranslateX }, { translateY: fixedTranslateY }, { scale: fixedScale }] } as any]}>{children}</View>
    </View>
  );
  return (
    <SafeAreaView style={styles.outer}>
      <StatusBar style="dark" />
      {scroll ? (
        <ScrollView style={{ width: '100%', flex: 1 }} contentContainerStyle={styles.outerScroll} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.outerScroll, { flex: 1 }]}>{fixedContent}</View>
      )}
    </SafeAreaView>
  );
}

function Header({ title, subtitle, showLogo, rightClose, onBack, onClose }: { title?: string; subtitle?: string; showLogo?: boolean; rightClose?: boolean; onBack: () => void; onClose?: () => void }) {
  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerRow}>
        <RoundButton glyph="‹" label="Back" onPress={onBack} />
        {showLogo ? <TasheelMark size={26} /> : title ? <Text style={styles.centerTitle}>{title}</Text> : <View />}
        {rightClose ? <RoundButton glyph="×" label="Close" onPress={onClose || onBack} /> : <View style={{ width: 44 }} />}
      </View>
      {title && showLogo ? <Text style={styles.pageTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Checkout — neutral merchant web checkout (Figma 355:58228)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Merchant web-checkout — new-user flow (Figma section 355:48766)
// ---------------------------------------------------------------------------

// Mount transition shared by the web-checkout flow screens.
function ScreenFade({ children }: { children: React.ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 300, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View style={{ flex: 1, opacity: a, transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

// Safari compact tab bar (Figma 1613:21847) — system UI, so it re-scopes to SF Pro.
// On a real iOS device Safari provides the actual chrome, so rendering ours would
// double it; collapse to a small bottom spacer instead.
function SafariCompactBar({ url, onBack }: { url: string; onBack?: () => void }) {
  if (!SHOW_FAKE_CHROME) return <View style={{ height: 24 }} />;
  const blurStyle = { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as object;
  return (
    <View style={styles.wcSafariWrap} {...({ dataSet: { surface: 'app' } } as object)}>
      <View style={styles.wcSafariRow}>
        <Pressable onPress={onBack} disabled={!onBack} style={[styles.wcSafariCircle, blurStyle]} accessibilityRole="button" accessibilityLabel="Browser back">
          <Text style={styles.wcSafariGlyph}>‹</Text>
        </Pressable>
        <View style={[styles.wcSafariSearch, blurStyle]}>
          <Image source={figmaImageSource('browserSiteSettings')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.wcSafariSiteIcon} />
          <Text numberOfLines={1} style={styles.wcSafariUrl}>{url}</Text>
          <Image source={figmaImageSource('browserReload')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.wcSafariReloadIcon} />
        </View>
        <View style={[styles.wcSafariCircle, blurStyle]}>
          <Text style={styles.wcSafariGlyph}>⋯</Text>
        </View>
      </View>
      <View style={styles.wcSafariBottom}>
        {SHOW_FAKE_CHROME ? <View style={styles.wcHomeIndicatorBar} /> : null}
      </View>
    </View>
  );
}

function WcPayOption({ label, sub, selected, onPress }: { label: string; sub?: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: !!selected }} style={[styles.wcOptRow, selected && styles.wcOptRowSelected]}>
      <View style={[styles.wcRadio, selected && styles.wcRadioSelected]}>{selected ? <View style={styles.wcRadioDot} /> : null}</View>
      <View style={{ gap: 2 }}>
        <Text style={[styles.wcOptLabel, selected && styles.wcOptLabelSelected]}>{label}</Text>
        {sub ? <Text style={styles.wcOptSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

// Merchant cart payment row — icon left, label, radio right (extra.com pattern).
function XPayRow({ label, icon, selected, onPress }: { label: string; icon: FigmaImageKey; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: !!selected }} style={[styles.xPayRow, selected && styles.xPayRowSelected]}>
      <Image source={figmaImageSource(icon)} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.xPayIcon} />
      <Text style={styles.xPayLabel}>{label}</Text>
      <View style={[styles.xPayRadio, selected && styles.xPayRadioOn]}>{selected ? <View style={styles.xPayRadioDot} /> : null}</View>
    </Pressable>
  );
}

// Merchant entry — extra.com product page mimic (SMEG MP00015644), with Tasheel
// replacing Baseeta in the "Shop now, pay later!" section. Real product image/price
// from extra.com; tabby/tamara figures are the live site's values for this product.
function Checkout({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  const [added, setAdded] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'card' | 'apple' | 'tasheel'>('tasheel');
  const [howOpen, setHowOpen] = useState(false);
  return (
    <AppShell surface="checkout">
      <StatusStrip />
      <ScreenFade>
      <View testID="wc-merchant-pdp" style={styles.xPage}>
        <View style={styles.xHeader}>
          <Pressable style={styles.xHeaderSide} onPress={() => added && setAdded(false)} accessibilityRole="button" accessibilityLabel={added ? 'Back to product' : 'Back'}>
            <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M14.5 5 8 12l6.5 7" fill="none" stroke="#13316b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
          <Image source={figmaImageSource('extraLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 46, height: 34 }} />
          <View style={[styles.xHeaderSide, { flexDirection: 'row', gap: 18, justifyContent: 'flex-end' }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#13316b" strokeWidth={1.8} /><Path d="M15.5 15.5 L20.5 20.5" stroke="#13316b" strokeWidth={1.8} strokeLinecap="round" /></Svg>
            <Pressable onPress={() => setAdded(true)} accessibilityRole="button" accessibilityLabel="View cart">
              <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M5 7h2.2l1.6 9.4a1.4 1.4 0 0 0 1.4 1.1h7.2a1.4 1.4 0 0 0 1.4-1.1L20.4 9H8" fill="none" stroke="#13316b" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="11" cy="20.6" r="1.15" fill="#13316b" /><Circle cx="17.4" cy="20.6" r="1.15" fill="#13316b" /></Svg>
            </Pressable>
          </View>
        </View>
        {added ? (
          <ScrollView testID="wc-merchant-cart" style={styles.xCartPage} contentContainerStyle={styles.xCartContent}>
            <Text style={styles.xCartTitle}>Your cart</Text>
            <View style={styles.xCartProduct}>
              <Image source={figmaImageSource('wcSmegFridge')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.xCartProductImage} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.xCartBrand}>SMEG</Text>
                <Text style={styles.xCartProductTitle}>50's Retro Style Refrigerator</Text>
                <Text style={styles.xCartMeta}>Right Handle · Black · Qty 1</Text>
              </View>
              <Money amount={wcMoney(WC_CART_TOTAL)} size={16} weight="700" />
            </View>
            <View style={styles.xCartSummary}>
              <Text style={styles.xCartSummaryLabel}>Order total</Text>
              <Money amount={wcMoney(WC_CART_TOTAL)} size={20} weight="700" />
            </View>
            <Text style={styles.xCartSectionTitle}>Payment option</Text>
            <View style={{ gap: 12 }}>
              <XPayRow label="Credit / Debit Card" icon="paymentCardIcon" selected={checkoutMethod === 'card'} onPress={() => setCheckoutMethod('card')} />
              <XPayRow label="Apple Pay" icon="wcApplePay" selected={checkoutMethod === 'apple'} onPress={() => setCheckoutMethod('apple')} />
            </View>
            <View style={styles.xSnplHeader}>
              <Svg width={30} height={24} viewBox="0 0 30 24"><Rect x="1.5" y="4" width="24" height="16.5" rx="3" fill="#fff" stroke="#1467b3" strokeWidth={1.8} /><Path d="M6 16.5h6" stroke="#1467b3" strokeWidth={1.8} strokeLinecap="round" strokeDasharray="2.6 2.4" /><Rect x="5.5" y="8" width="5" height="3.6" rx="1" fill="#1467b3" /><Path d="M20.5 2.5 26.5 8.5 24 11" fill="#ffd23a" opacity="0.9" /></Svg>
              <Text style={styles.xSnplTitle}>Shop now, pay later!</Text>
            </View>
            <Pressable
              testID="wc-tasheel-offer"
              accessibilityRole="button"
              accessibilityLabel={`Continue with Tasheel Finance, instant 10 percent off, pay ${wcMoney(WC_DISCOUNTED_TOTAL)} instead of ${wcMoney(WC_CART_TOTAL)}`}
              onPress={() => { setCheckoutMethod('tasheel'); setRoute('wcMobile'); }}
              style={[styles.xOfferCard, checkoutMethod === 'tasheel' && styles.xOfferCardSelected]}
            >
              <View style={styles.xOfferTopRow}>
                <Image source={figmaImageSource('wcTasheelLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 88, height: 26 }} />
                <View style={[styles.xOfferRadio, checkoutMethod === 'tasheel' && styles.xOfferRadioOn]}>
                  {checkoutMethod === 'tasheel' ? <View style={styles.xOfferRadioDot} /> : null}
                </View>
              </View>
              <Text style={styles.xOfferTitle}>Split your purchases your way!</Text>
              <Text style={styles.xOfferBody}>
                Instant 10% off your order — pay {wcMoney(WC_DISCOUNTED_TOTAL)} instead of {wcMoney(WC_CART_TOTAL)}, in up to {WC_TENURES[WC_TENURES.length - 1]} payments.
              </Text>
              <Pressable onPress={() => setHowOpen((v) => !v)} accessibilityRole="button" accessibilityLabel="How does Tasheel Finance work?" hitSlop={6}>
                <Text style={styles.xOfferLink}>{howOpen ? 'Hide details' : 'How does it work?'}</Text>
              </Pressable>
              {howOpen ? (
                <View style={styles.xOfferSteps}>
                  {[
                    'Verify your number and ID — takes about a minute.',
                    `Pick a plan from 2 to ${WC_TENURES[WC_TENURES.length - 1]} months.`,
                    'Pay the first instalment now, the rest on schedule.',
                  ].map((line, i) => (
                    <View key={line} style={styles.xOfferStepRow}>
                      <View style={styles.xOfferStepNum}><Text style={styles.xOfferStepNumText}>{i + 1}</Text></View>
                      <Text style={styles.xOfferStepText}>{line}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
            <View style={styles.xRivalRow}>
              <View style={styles.xRivalCard}>
                <View style={styles.xTabbyChip}><Text style={styles.xTabbyText}>tabby</Text></View>
                <Text style={styles.xRivalTitle}>Pace your payments</Text>
                <Text style={styles.xRivalBody}>4 monthly payments of {wcMoney(WC_CART_TOTAL / 4)}, interest-free.</Text>
                <Text style={styles.xRivalLink}>Learn more</Text>
              </View>
              <View style={styles.xRivalCard}>
                <View style={styles.xTamaraChip}><Text style={styles.xTamaraText}>tamara</Text></View>
                <Text style={styles.xRivalTitle}>Shop & split with tamara</Text>
                <Text style={styles.xRivalBody}>Up to 24 months from {wcMoney(WC_CART_TOTAL / 24)} — or pay in 4. Sharia-compliant.</Text>
                <Text style={styles.xRivalLink}>Learn more</Text>
              </View>
            </View>
            <Pressable testID="wc-cart-continue" style={styles.xCartContinue} onPress={() => checkoutMethod === 'tasheel' && setRoute('wcMobile')} accessibilityRole="button" accessibilityLabel="Continue with Tasheel Finance">
              <Text style={styles.xCartContinueText}>{checkoutMethod === 'tasheel' ? 'Continue with Tasheel Finance' : 'Select Tasheel Finance to continue'}</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <>
            <View style={styles.xImageCard}>
              <Image source={figmaImageSource('wcSmegFridge')} resizeMode="contain" accessibilityIgnoresInvertColors accessibilityLabel="SMEG retro refrigerator, black" style={styles.xProductImg} />
            </View>
            <View style={styles.xBody}>
              <Text style={styles.xBrand}>SMEG</Text>
              <Text style={styles.xTitle}>50's Retro Style Freestanding Refrigerator, Right Handle, Black</Text>
              <View style={styles.xRatingRow}>
                <Text style={styles.xStars}>★★★★★</Text>
                <Text style={styles.xRatingText}>4.8 (26)</Text>
              </View>
              <View style={styles.xPriceRow}>
                <Text style={styles.xPriceCurrency}>SAR</Text>
                <Text style={styles.xPrice}>7,000</Text>
                <Text style={styles.xVat}>Incl. VAT</Text>
              </View>
              <Pressable testID="wc-add-to-cart" style={styles.xAddCartPrimary} onPress={() => setAdded(true)} accessibilityRole="button" accessibilityLabel="Add refrigerator to cart">
                <Text style={styles.xAddCartPrimaryText}>Add to cart</Text>
              </Pressable>
            </View>
          </>
        )}
        <SafariCompactBar url="extra.com" />
      </View>
      </ScreenFade>
    </AppShell>
  );
}

// Home top gradient (Figma 1885:12070): soft green wash fading into the canvas.
function HomeGradient() {
  return (
    <Svg width="100%" height={415} preserveAspectRatio="none">
      <Defs>
        <SvgLinearGradient id="homeWash" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e6f6df" />
          <Stop offset="0.35" stopColor="#f0faec" />
          <Stop offset="0.7" stopColor="#f6faf4" />
          <Stop offset="1" stopColor="#f9fafb" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="415" fill="url(#homeWash)" />
    </Svg>
  );
}

// Decorative brand elements (Figma 1885:12071/12072), positioned per source frames.
function HomeDecor() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 415 }}>
      <Image source={figmaImageSource('homeElementA')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ position: 'absolute', left: 290, top: -180, width: 393, height: 358, opacity: 0.35 }} />
      <Image source={figmaImageSource('homeElementB')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ position: 'absolute', left: 22, top: 210, width: 556, height: 601, opacity: 0.25 }} />
    </View>
  );
}

// Home action tile (Figma 1885:12087 row) — source-exported 3D icon in a white circle.
function ActionTile({ label, asset, testID, onPress }: { label: string; asset: FigmaImageKey; testID?: string; onPress: () => void }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }: { pressed: boolean }) => [styles.actionTile, pressed && styles.pressed]}>
      <View style={styles.actionIcon}>
        <Image source={figmaImageSource(asset)} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 46, height: 46 }} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

// Escapes RNW's ScrollView containing-block (its identity transform captures any
// fixed descendant) by portaling viewport-pinned UI to document.body on device.
function ViewportLayer({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (SHOW_FAKE_CHROME || typeof document === 'undefined') return;
    return () => {
      // Safari latches its notch/status chrome tint to the dark scrim and doesn't
      // re-evaluate when the overlay unmounts; recreating the theme-color meta
      // forces it to re-tint back to the page color.
      const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
      const content = meta?.getAttribute('content') || '#ffffff';
      meta?.remove();
      requestAnimationFrame(() => {
        const fresh = document.createElement('meta');
        fresh.name = 'theme-color';
        fresh.content = content;
        document.head.appendChild(fresh);
      });
    };
  }, []);
  if (SHOW_FAKE_CHROME || typeof document === 'undefined') return <>{children}</>;
  // The portal div is pointerEvents:none (taps pass through to the page); wrap children in a
  // box-none View so interactive descendants (buttons, scrims) still receive taps on device.
  return createPortal(
    createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 1000, zoom: width / 402, pointerEvents: 'none' } },
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>{children}</View>,
    ),
    document.body,
  );
}

// Leave-checkout confirmation (Figma 2003:32239) — the X never quits immediately.
function WcLeaveSheet({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true }).start();
  }, [rise]);
  return (
    <ViewportLayer><View style={styles.wcPickerOverlay} pointerEvents="auto">
      <Pressable style={styles.wcPickerScrim} onPress={onStay} accessibilityRole="button" accessibilityLabel="Keep going" />
      <Animated.View style={[styles.wcDetailsSheet, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }) }] }]}>
        <View style={styles.sheetGrabber} />
        <Text style={styles.wcDetailsTitle}>Leave checkout?</Text>
        <Text style={styles.wcLeaveBody}>You'll lose your progress and will need to start over if you come back. Leaving opens the Tasheel app, where you can pick this up from your account.</Text>
        <Pressable testID="wc-leave-stay" style={styles.wcGreenCta} onPress={onStay} accessibilityRole="button">
          <Text style={styles.wcGreenCtaText}>Keep going</Text>
        </Pressable>
        <Pressable testID="wc-leave-confirm" style={styles.wcLeaveLink} onPress={() => { wcOpenTasheelApp(); onLeave(); }} accessibilityRole="button" accessibilityLabel="Leave checkout and open the Tasheel app">
          <Text style={styles.wcLeaveLinkText}>Leave checkout</Text>
        </Pressable>
      </Animated.View>
    </View></ViewportLayer>
  );
}

// Onboarding header sheet (Figma 1929:11374): white card with x-close, Tasheel wordmark, عربية.
// The close button opens the leave-confirmation sheet before calling onClose.
function WcOnboardHeader({ onClose }: { onClose: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <View style={[styles.wcObHeader, { paddingTop: SHOW_FAKE_CHROME ? 70 : 26 }]}>
        <View style={styles.wcObHeaderRow}>
          <Pressable testID="wc-onboard-close" onPress={() => setConfirmOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close Tasheel checkout" style={styles.wcObCloseBox}>
            <Image source={figmaImageSource('wcCloseX')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.wcObCloseIcon} />
          </Pressable>
          <Image source={figmaImageSource('wcTasheelLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.wcObLogo} />
          <Text style={styles.wcObArabic}>العربية</Text>
        </View>
      </View>
      {confirmOpen ? <WcLeaveSheet onStay={() => setConfirmOpen(false)} onLeave={() => { setConfirmOpen(false); onClose(); }} /> : null}
    </>
  );
}

const formatSaudiPhone = (p: string) => `+966 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;

// Figma 355:45048 — Confirm Mobile Number.
function WcMobile({ setRoute, phone, setPhone }: { setRoute: (r: RouteKey) => void; phone: string; setPhone: (p: string) => void }) {
  const valid = phone.replace(/\D/g, '').length === 9;
  return (
    <AppShell>
      <View testID="wc-mobile-355-45048" style={styles.wcObScreen}>
        <ScreenFade>
          <WcOnboardHeader onClose={() => setRoute('checkout')} />
          <View style={styles.wcObContent}>
            <View style={styles.wcObCard}>
              <View style={{ gap: 8 }}>
                <Text style={styles.wcObTitle}>Let's get you started</Text>
                <Text style={styles.wcObSub}>Split your purchase into easy installments</Text>
              </View>
              <View style={{ gap: 16, width: '100%' }}>
                <View style={{ gap: 12 }}>
                  <Text style={styles.wcFieldLabel}>Phone number</Text>
                  <View style={styles.wcInputRow}>
                    <View style={styles.wcInputLead}>
                      <View style={styles.wcFlagWrap}><Image source={figmaImageSource('wcSaudiFlag')} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.wcFlagImg} /></View>
                      <Text style={styles.wcDialCode}>+966</Text>
                    </View>
                    <View style={styles.wcInputDivider} />
                    <TextInput testID="wc-phone-input" value={phone} onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 9))} keyboardType="number-pad" style={styles.wcPhoneInput} />
                  </View>
                </View>
                <Pressable testID="wc-mobile-continue" disabled={!valid} style={[styles.wcGreenCta, !valid && styles.wcGreenCtaDisabled]} onPress={() => valid && setRoute('wcOtp')} accessibilityRole="button" accessibilityState={{ disabled: !valid }}>
                  <Text style={[styles.wcGreenCtaText, !valid && styles.wcGreenCtaTextDisabled]}>Confirm mobile number</Text>
                </Pressable>
              </View>
            </View>
            <Pressable onPress={() => setPhone('')} style={styles.wcAltLinkWrap} accessibilityRole="button" accessibilityLabel="Use a different number">
              <Text style={styles.wcAltLinkText}>Not your number? <Text style={styles.wcAltLinkUnderline}>Use a different one</Text></Text>
            </Pressable>
          </View>
          <View style={styles.wcObBottom}>
            <Text style={styles.wcTosText}>By continuing, you agree to Tasheel's Terms of Service and Privacy Policy.</Text>
            <SafariCompactBar url="extrastores.com" onBack={() => setRoute('checkout')} />
          </View>
        </ScreenFade>
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// Figma 2036:13138 (updated) — onboarding OTP as a card: boxes, timer and Confirm
// inside one sheet; the system keyboard does the typing (no drawn keyboard).
function WcOtp({ setRoute, phone }: { setRoute: (r: RouteKey) => void; phone: string }) {
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(90);
  const inputRef = useRef<TextInput>(null);
  const complete = otp.length === 4;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    if (!otp.length) return;
    pop.setValue(0.6);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 240, useNativeDriver: true }).start();
  }, [otp, pop]);

  const timer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <AppShell>
      <View testID="wc-otp-2036-13138" style={styles.wcObScreen}>
        <ScreenFade>
          <WcOnboardHeader onClose={() => setRoute('checkout')} />
          <View style={styles.wcObContent}>
            <View style={styles.wcObCard}>
              <View style={{ gap: 8, width: '100%' }}>
                <Text style={styles.wcObTitle}>Enter the 4-digit code</Text>
                <View style={styles.wcOtpSubRow}>
                  <Text style={styles.wcOtpSubText}>sent to you at {formatSaudiPhone(phone)}.</Text>
                  <Pressable testID="wc-otp-edit" style={styles.wcEditPill} onPress={() => setRoute('wcMobile')} accessibilityRole="button" accessibilityLabel="Edit phone number">
                    <Text style={styles.wcEditPillText}>Edit</Text>
                  </Pressable>
                </View>
              </View>
              <View style={{ gap: 16, width: '100%' }}>
                <TextInput ref={inputRef} testID="wc-otp-hidden-input" value={otp} onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" maxLength={4} style={styles.otpHiddenInput} />
                <Pressable testID="wc-otp-boxes" style={styles.wcOtpBoxRowCard} onPress={() => inputRef.current?.focus()} accessibilityRole="button" accessibilityLabel="Enter the 4-digit code">
                  {[0, 1, 2, 3].map(i => {
                    const filled = i < otp.length;
                    const active = i === otp.length || (complete && i === 3);
                    return (
                      <View key={i} style={[styles.wcOtpBox, active && styles.wcOtpBoxActive]}>
                        {filled ? (
                          <Animated.Text style={[styles.wcOtpBoxDigit, i === otp.length - 1 && { transform: [{ scale: pop }] }]}>{otp[i]}</Animated.Text>
                        ) : active ? (
                          <Text style={styles.wcOtpBoxCaret}>|</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </Pressable>
                <View style={styles.wcTimerRowCard}>
                  <Svg width={16} height={16} viewBox="0 0 12.6667 14.6667" accessibilityLabel="Timer">
                    <Path d="M11.3333 8.33333C11.3333 5.57191 9.09476 3.33333 6.33333 3.33333C3.57191 3.33333 1.33333 5.57191 1.33333 8.33333C1.33333 11.0948 3.57191 13.3333 6.33333 13.3333C9.09476 13.3333 11.3333 11.0948 11.3333 8.33333ZM5.66667 5.66667C5.66667 5.29848 5.96514 5 6.33333 5C6.70152 5 7 5.29848 7 5.66667V7.95573L8.3431 8.76172C8.65874 8.95118 8.76103 9.36074 8.57161 9.67643C8.38216 9.99208 7.97259 10.0944 7.65695 9.90495L5.99028 8.90495C5.78946 8.78443 5.66667 8.56741 5.66667 8.33333V5.66667ZM10.4587 1.47135C10.1525 1.26727 9.73864 1.35 9.53456 1.65614C9.33048 1.96229 9.41321 2.37617 9.71935 2.58025L11.0527 3.46891C11.3588 3.673 11.7727 3.59027 11.9768 3.28412C12.1809 2.97798 12.0981 2.5641 11.792 2.36002L10.4587 1.47135ZM3.13243 1.65614C2.92835 1.35 2.51447 1.26727 2.20833 1.47135L0.874992 2.36002C0.568848 2.5641 0.486119 2.97798 0.690201 3.28412C0.894284 3.59027 1.30816 3.673 1.61431 3.46891L2.94764 2.58025C3.25378 2.37617 3.33651 1.96229 3.13243 1.65614Z" fill="#4B5563" />
                  </Svg>
                  <Text style={styles.wcTimerText}>{timer}</Text>
                </View>
                {secondsLeft === 0 ? (
                  <View style={styles.wcResendRow}>
                    <Text style={styles.wcResendText}>Didn't get it?</Text>
                    <Pressable testID="wc-otp-resend" style={styles.wcEditPill} onPress={() => { setSecondsLeft(90); setOtp(''); }} accessibilityRole="button" accessibilityLabel="Resend code">
                      <Text style={styles.wcEditPillText}>Resend</Text>
                    </Pressable>
                  </View>
                ) : null}
                <Pressable testID="wc-otp-confirm" disabled={!complete} style={[styles.wcGreenCta, { width: '100%' }, !complete && styles.wcGreenCtaDisabled]} onPress={() => complete && setRoute('wcQuickCall')} accessibilityRole="button" accessibilityState={{ disabled: !complete }}>
                  <Text style={[styles.wcGreenCtaText, !complete && styles.wcGreenCtaTextDisabled]}>Confirm OTP</Text>
                </Pressable>
              </View>
            </View>
            <Pressable onPress={() => setRoute('wcMobile')} style={styles.wcAltLinkWrap} accessibilityRole="button" accessibilityLabel="Use a different number">
              <Text style={styles.wcAltLinkText}>Not your number? <Text style={styles.wcAltLinkUnderline}>Use a different one</Text></Text>
            </Pressable>
          </View>
          <View style={styles.wcObBottom}>
            <Text style={styles.wcTosText}>By continuing, you agree to Tasheel's Terms of Service and Privacy Policy.</Text>
            <SafariCompactBar url="extrastores.com" onBack={() => setRoute('wcMobile')} />
          </View>
        </ScreenFade>
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// Figma 1628:32393 — Identity Verification (Yaqeen). DOB uses the native iOS date picker.
function WcIdentity({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  const [idNumber, setIdNumber] = useState('');
  const [dob, setDob] = useState(''); // yyyy-mm-dd from the native date input
  const dobRef = useRef<HTMLInputElement | null>(null);
  const valid = idNumber.replace(/\D/g, '').length === 10 && dob.length === 10;
  const openNativePicker = () => {
    const el = dobRef.current;
    if (!el) return;
    const picker = (el as HTMLInputElement & { showPicker?: () => void }).showPicker;
    if (typeof picker === 'function') {
      try { picker.call(el); return; } catch { /* fall through to focus */ }
    }
    el.focus();
  };
  return (
    <AppShell>
      <View testID="wc-identity-1628-32393" style={styles.wcObScreen}>
        <ScreenFade>
          <WcOnboardHeader onClose={() => setRoute('checkout')} />
          <View style={styles.wcObContent}>
            <View style={styles.wcObCard}>
              <View style={{ gap: 8, width: '100%' }}>
                <Text style={styles.wcIdTitle}>Identity Verification</Text>
                <Text style={styles.wcIdSub}>We need your National ID and date of birth for Yaqeen verification.</Text>
              </View>
              <View style={{ gap: 12, width: '100%' }}>
                <Text style={styles.wcFieldLabel}>National ID or Iqama number</Text>
                <View style={styles.wcInputRow}>
                  <TextInput testID="wc-id-input" value={idNumber} onChangeText={v => setIdNumber(v.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad" placeholder="e.g., 10xxxxxxxx" placeholderTextColor={muted} style={styles.wcTextField} />
                </View>
              </View>
              <View style={{ gap: 12, width: '100%' }}>
                <Text style={styles.wcFieldLabel}>Date of Birth</Text>
                <View style={styles.wcInputRow}>
                  {/* Native date input so iOS presents its own calendar/wheel picker. */}
                  {createElement('input', {
                    'data-testid': 'wc-dob-input',
                    type: 'date',
                    ref: dobRef,
                    value: dob,
                    min: '1940-01-01',
                    max: '2008-12-31',
                    onChange: (e: { target: { value: string } }) => setDob(e.target.value),
                    style: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: dob ? '#030712' : '#4b5563', fontFamily: 'inherit', padding: 0, margin: 0, WebkitAppearance: 'none', appearance: 'none', minHeight: 22, letterSpacing: '-0.24px' },
                  })}
                  <Pressable testID="wc-dob-calendar" onPress={openNativePicker} hitSlop={8} accessibilityRole="button" accessibilityLabel="Pick date of birth">
                    <Image source={figmaImageSource('wcCalendar')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 24, height: 24 }} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.wcShieldRow}>
                <Image source={figmaImageSource('wcShieldTick')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 20, height: 20 }} />
                <Text style={styles.wcShieldText}>Your data is verified through Yaqeen, Saudi Arabia's official identity platform.</Text>
              </View>
              <Pressable testID="wc-identity-confirm" disabled={!valid} style={[styles.wcGreenCta, { width: '100%' }, !valid && styles.wcGreenCtaDisabled]} onPress={() => valid && setRoute('wcNafath')} accessibilityRole="button" accessibilityState={{ disabled: !valid }}>
                <Text style={[styles.wcGreenCtaText, !valid && styles.wcGreenCtaTextDisabled]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.wcObBottom}>
            <SafariCompactBar url="extrastores.com" onBack={() => setRoute('wcOtp')} />
          </View>
        </ScreenFade>
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// Figma 1929:61813 — Nafath verification. The session code is generated per visit
// and the CTA simulates app approval (pulse + auto-advance) so nothing is static.
function WcNafath({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  const [code] = useState(() => String(10 + Math.floor(Math.random() * 90)));
  const [waiting, setWaiting] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!waiting) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.45, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    const timer = setTimeout(() => setRoute('wcQuickCall'), 2600);
    return () => { loop.stop(); clearTimeout(timer); };
  }, [waiting, pulse, setRoute]);
  return (
    <AppShell>
      <View testID="wc-nafath-1929-61813" style={styles.wcObScreen}>
        <ScreenFade>
          <WcOnboardHeader onClose={() => setRoute('checkout')} />
          <View style={styles.wcNafathCenter}>
            <View style={styles.wcNafathCircle}>
              <Image source={figmaImageSource('wcNafathMark')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.wcNafathMark} />
            </View>
            <Text style={styles.wcNafathTitle}>Verify via Nafath</Text>
            <Animated.Text testID="wc-nafath-code" style={[styles.wcNafathCode, waiting && { opacity: pulse }]}>{code}</Animated.Text>
            <View style={styles.wcNafathCard}>
              <Text style={styles.wcNafathHowTitle}>How to use Nafath:</Text>
              {[
                ['1', 'Click here to download or open the Nafath app', true],
                ['2', 'Register or login to your account', false],
                ['3', 'Approve the access', false],
                ['4', 'Select the number displayed above', false],
              ].map(([n, label, underline]) => (
                <View key={String(n)} style={styles.wcNafathStep}>
                  <View style={styles.wcNafathStepNum}><Text style={styles.wcNafathStepNumText}>{n}</Text></View>
                  <Text style={[styles.wcNafathStepText, underline ? styles.wcAltLinkUnderline : null]}>{label}</Text>
                </View>
              ))}
              <Pressable testID="wc-nafath-open" style={[styles.wcGreenCta, { width: '100%', borderRadius: 25 }]} onPress={() => setWaiting(true)} accessibilityRole="button">
                <Text style={styles.wcGreenCtaText}>{waiting ? 'Waiting for approval…' : 'Open Nafath App'}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.wcObBottom}>
            <SafariCompactBar url="extrastores.com" onBack={() => setRoute('wcIdentity')} />
          </View>
          <Image source={figmaImageSource('wcQuickCallArt')} style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        </ScreenFade>
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// Harun meeting fixture: discount first, then finance only up to the available
// BNPL limit. Any excess becomes the down payment; today's charge also includes
// the first installment. Unknown long-tenure rates stay blocked, never inferred.
const WC_CART_TOTAL = 7000.00;
const WC_CART_ITEMS = 1;
const WC_ORDER_REFERENCE = 'EXT-2026-45210';
const WC_DISCOUNT_RATE = 0.10;
const WC_DISCOUNT_AMOUNT = Math.round(WC_CART_TOTAL * WC_DISCOUNT_RATE * 100) / 100;
const WC_DISCOUNTED_TOTAL = Math.round((WC_CART_TOTAL - WC_DISCOUNT_AMOUNT) * 100) / 100;
const WC_AVAILABLE_LIMIT = 5000.00;
const WC_FINANCED_PRINCIPAL = Math.min(WC_DISCOUNTED_TOTAL, WC_AVAILABLE_LIMIT);
const WC_DOWN_PAYMENT = Math.max(0, Math.round((WC_DISCOUNTED_TOTAL - WC_FINANCED_PRINCIPAL) * 100) / 100);
const WC_TENURES = [2, 3, 4, 6, 9, 12, 24, 36] as const;
// 2 and 3 months are free; 4 months and longer carry a 1% Murabaha fee on the
// financed principal. Every tenure has a rate, so no plan is ever unselectable.
const WC_FEE_RATES: Record<number, number> = {
  2: 0,
  3: 0,
  4: 0.01,
  6: 0.01,
  9: 0.01,
  12: 0.01,
  24: 0.01,
  36: 0.01,
};
const wcPlanFeeRate = (months: number) => WC_FEE_RATES[months] ?? 0;
const wcPlanFee = (months: number) => Math.round(WC_FINANCED_PRINCIPAL * wcPlanFeeRate(months) * 100) / 100;
const wcPlanTotal = (months: number) => Math.round((WC_DISCOUNTED_TOTAL + wcPlanFee(months)) * 100) / 100;
const wcPlanMonthly = (months: number) => Math.round(((WC_FINANCED_PRINCIPAL + wcPlanFee(months)) / months) * 100) / 100;
const wcPlanToday = (months: number) => Math.round((WC_DOWN_PAYMENT + wcPlanMonthly(months)) * 100) / 100;
// Deep link into the native Tasheel SwiftUI app. Nothing happens if the app is
// not installed, so the current web screen remains available as a fallback.
const wcOpenTasheelApp = (destination = 'tasheel://bnpl') => {
  if (typeof window === 'undefined') return;
  try { window.location.href = destination; } catch { /* scheme unsupported */ }
};
const wcPurchaseDeepLink = (months: number) => {
  const params = new URLSearchParams({
    orderRef: WC_ORDER_REFERENCE,
    amount: WC_DISCOUNTED_TOTAL.toFixed(2),
    months: String(months),
    merchant: 'extrastores',
  });
  return `tasheel://bnpl/plan-detail?${params.toString()}`;
};
const wcAdjacentTenure = (months: number, offset: -1 | 1) => {
  const index = WC_TENURES.indexOf(months as (typeof WC_TENURES)[number]);
  const next = index + offset;
  return next >= 0 && next < WC_TENURES.length ? WC_TENURES[next] : null;
};
const wcMoney = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wcPaymentsWord = (n: number) => (n === 1 ? 'payment' : 'payments');

// Figma 1628:55884 / 1933:74219 — Quick call verification after Nafath. The CTA
// itself morphs into the success state, holds 2s, then continues to plan selection.
function WcQuickCall({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  const [phase, setPhase] = useState<'idle' | 'calling' | 'verified'>('idle');
  const pulse = useRef(new Animated.Value(1)).current;
  const swap = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (phase !== 'calling') return;
    const timer = setTimeout(() => {
      // morph: dip the label out, pop the pill, fade success label in
      Animated.sequence([
        Animated.timing(swap, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(swap, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1.08, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.spring(pulse, { toValue: 1, friction: 5, tension: 220, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
      setPhase('verified');
    }, 1900);
    return () => clearTimeout(timer);
  }, [phase, pulse, swap]);
  useEffect(() => {
    if (phase !== 'verified') return;
    const timer = setTimeout(() => setRoute('wcTenure'), 2000);
    return () => clearTimeout(timer);
  }, [phase, setRoute]);
  return (
    <AppShell>
      <View testID="wc-quickcall-1628-55884" style={styles.wcObScreen}>
        <ScreenFade>
          <View style={styles.wcQcArtWrap}>
            <Image source={figmaImageSource('wcQuickCallArt')} resizeMode="contain" accessibilityIgnoresInvertColors accessibilityLabel="Tasheel incoming call" style={styles.wcQcArt} />
          </View>
          <View style={styles.wcQcPanel}>
            <Text style={styles.wcQcTitle}>Ready for a quick call?</Text>
            <Text style={styles.wcQcSub}>We'll call your registered number. Enter the code you hear to continue.</Text>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Pressable testID="wc-quickcall-cta" disabled={phase !== 'idle'} style={[styles.wcGreenCta, styles.wcQcCta, phase === 'calling' && { opacity: 0.8 }]} onPress={() => setPhase('calling')} accessibilityRole="button" accessibilityLabel={phase === 'verified' ? 'Verification successful' : 'Call me now'}>
              <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: swap }}>
                {phase === 'verified' ? <View style={styles.wcQcToastDot}><Text style={styles.wcQcToastCheck}>✓</Text></View> : null}
                <Text style={styles.wcGreenCtaText}>{phase === 'idle' ? 'Call Me Now' : phase === 'calling' ? 'Calling you…' : 'Verification successful'}</Text>
              </Animated.View>
              </Pressable>
            </Animated.View>
          </View>
          <View style={styles.wcObBottom}>
            <SafariCompactBar url="extrastores.com" onBack={() => setRoute('wcOtp')} />
          </View>
        </ScreenFade>
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// Figma 1878:13093 / 13247 / 1865:3575 — source layout extended to the
// meeting-approved 2/3/4/6/9/12/24/36-month product set.
function WcTenure({ setRoute, months, setMonths }: { setRoute: (r: RouteKey) => void; months: number; setMonths: (m: number) => void }) {
  const [sheet, setSheet] = useState<null | 'details' | 'schedule' | 'cart' | 'fee'>(null);
  const swap = useRef(new Animated.Value(1)).current;
  const bump = (next: number) => {
    if (!WC_TENURES.includes(next as (typeof WC_TENURES)[number]) || next === months) return;
    swap.setValue(0.3);
    Animated.spring(swap, { toValue: 1, friction: 7, tension: 180, useNativeDriver: true }).start();
    setMonths(next);
  };
  const previous = wcAdjacentTenure(months, -1);
  const next = wcAdjacentTenure(months, 1);
  const fee = wcPlanFee(months);
  return (
    <AppShell>
      <View testID="wc-tenure-1878-13247" style={styles.wcObScreen}>
        <ScreenFade>
          <WcOnboardHeader onClose={() => setRoute('checkout')} />
          <View style={styles.wcTenureContent}>
            <Pressable testID="wc-cart-pill" style={styles.wcCartPill} onPress={() => setSheet('cart')} accessibilityRole="button" accessibilityLabel="View cart details">
              <View style={styles.wcCartLeft}>
                <Image source={figmaImageSource('wcCartIcon')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 16, height: 16 }} />
                <Text style={styles.wcCartItems}>{WC_CART_ITEMS} {WC_CART_ITEMS === 1 ? 'Item' : 'Items'}</Text>
              </View>
              <View style={styles.wcCartRight}>
                <View style={styles.wcCartDiscountChip}><Text style={styles.wcCartDiscountChipText}>10% off</Text></View>
                <Text style={styles.wcCartWasPrice}>{formatAmount(Math.round(WC_CART_TOTAL))}</Text>
                <Money amount={wcMoney(WC_DISCOUNTED_TOTAL)} size={16} weight="700" />
                <Image source={figmaImageSource('wcArrowRight')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 13, height: 13 }} />
              </View>
            </Pressable>
            <View style={styles.wcPlanCard}>
              <View style={{ gap: 6, width: '100%' }}>
                <Text style={styles.wcPlanTitle}>Choose your plan</Text>
                <Text style={styles.wcPlanSub}>You can split your purchase up to <Text style={{ fontWeight: '600' }}>36 months</Text></Text>
              </View>
              <View style={styles.wcStepperTrack}>
                <Pressable testID="wc-plan-minus" disabled={previous === null} onPress={() => previous !== null && bump(previous)} style={[styles.wcStepperMinus, previous === null && { opacity: 0.45 }]} accessibilityRole="button" accessibilityLabel="Previous plan">
                  <Image source={figmaImageSource('wcMinus')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 23, height: 3 }} />
                </Pressable>
                <View style={styles.wcStepperCenter}>
                  <Pressable onPress={() => previous !== null && bump(previous)} disabled={previous === null} accessibilityRole="button" accessibilityLabel={previous === null ? 'No previous plan' : `${previous} months`}>
                    <Text style={styles.wcStepperSide}>{previous ?? ' '}</Text>
                  </Pressable>
                  <View style={{ alignItems: 'center', gap: 2 }}>
                    <Animated.Text testID="wc-plan-months" style={[styles.wcStepperMain, { transform: [{ scale: swap }] }]}>{months}</Animated.Text>
                    <Text style={styles.wcStepperMonthsLabel}>Months</Text>
                  </View>
                  <Pressable onPress={() => next !== null && bump(next)} disabled={next === null} accessibilityRole="button" accessibilityLabel={next === null ? 'No next plan' : `${next} months`}>
                    <Text style={styles.wcStepperSide}>{next ?? ' '}</Text>
                  </Pressable>
                </View>
                <Pressable testID="wc-plan-plus" disabled={next === null} onPress={() => next !== null && bump(next)} style={[styles.wcStepperPlus, next === null && { opacity: 0.45 }]} accessibilityRole="button" accessibilityLabel="Next plan">
                  <Image source={figmaImageSource('wcPlus')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 22, height: 22 }} />
                </Pressable>
              </View>
              <FadeSwap swapKey={`plan-${months}`}>
                <View style={styles.wcPlanHero}>
                  <View style={styles.wcPlanHeroRow}>
                    <Riyal size={20} />
                    <Text style={styles.wcPlanHeroAmount}>{wcMoney(wcPlanToday(months))}</Text>
                    <Text style={styles.wcPlanHeroToday}> today</Text>
                  </View>
                  <Text style={styles.wcPlanThen}>Then <Riyal size={12} color={muted} /> {wcMoney(wcPlanMonthly(months))} / Month</Text>
                  <View style={styles.wcPlanFeesRow}>
                    <Text style={styles.wcPlanFees}>{fee === 0 ? 'No fees' : <>Fees <Riyal size={11} color={muted} /> {wcMoney(fee)}</>}</Text>
                    {fee > 0 ? (
                      <Pressable testID="wc-four-month-fee-help" onPress={() => setSheet('fee')} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Explain the ${months} month fee`}>
                        <Image source={figmaImageSource('wcInfoCircle')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 14, height: 14 }} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </FadeSwap>
              <View style={{ gap: 12, width: '100%' }}>
                <Pressable testID="wc-plan-continue" style={styles.wcGreenCta} onPress={() => setRoute('wcPayment')} accessibilityRole="button">
                  <Text style={styles.wcGreenCtaText}>Continue with plan</Text>
                </Pressable>
                <Pressable testID="wc-plan-details" style={styles.wcGreyCta} onPress={() => setSheet('details')} accessibilityRole="button">
                  <Text style={styles.wcGreyCtaText}>View plan details</Text>
                </Pressable>
              </View>
            </View>
          </View>
          <View style={styles.wcObBottom}>
            <SafariCompactBar url="extrastores.com" onBack={() => setRoute('wcQuickCall')} />
          </View>
        </ScreenFade>
        {sheet === 'details' ? <WcPlanDetailsSheet months={months} onClose={() => setSheet(null)} onViewSchedule={() => setSheet('schedule')} onContinue={() => setRoute('wcPayment')} /> : null}
        {sheet === 'schedule' ? <WcFullScheduleSheet months={months} onClose={() => setSheet(null)} /> : null}
        {sheet === 'cart' ? <WcCartSheet onClose={() => setSheet(null)} /> : null}
        {sheet === 'fee' ? <WcFourMonthFeeSheet onClose={() => setSheet(null)} /> : null}
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// Figma 2003:12123 — Plan details sheet, derived live from the selected tenure.
function WcPlanDetailsSheet({ months, onClose, onViewSchedule, onContinue }: { months: number; onClose: () => void; onViewSchedule: () => void; onContinue?: () => void }) {
  const rise = useRef(new Animated.Value(0)).current;
  const [feeTipOpen, setFeeTipOpen] = useState(false);
  const fee = wcPlanFee(months);
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true }).start();
  }, [rise]);
  const endMonth = MONTH_NAMES[(6 + months - 2) % 12]; // monthlies run 1 Jul .. 1 (Jul+n-2); demo clock June 2026
  const startMonth = MONTH_NAMES[6 % 12];
  return (
    <ViewportLayer><View style={styles.wcPickerOverlay} pointerEvents="auto">
      <Pressable style={styles.wcPickerScrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close plan details" />
      <Animated.View style={[styles.wcDetailsSheet, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] }]}>
        <View style={styles.sheetGrabber} />
        <Text style={styles.wcDetailsTitle}>Plan details</Text>
        <View style={styles.wcDetailsCard}>
          <View style={styles.reviewLine}>
            <Text style={styles.wcDetailsStrong}>{months} monthly payments</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}><Money amount={wcMoney(wcPlanMonthly(months))} size={16} /><Text style={styles.wcDetailsDim}>/mo</Text></View>
          </View>
          <Progress value={1 / months} segments={months} />
          <View style={styles.reviewLine}>
            <Text style={styles.wcDetailsDim}>Down payment today</Text>
            <Text style={styles.wcDetailsDim}>Ends 1 {endMonth}</Text>
          </View>
        </View>
        <View style={styles.wcDetailsCard}>
          <View style={styles.reviewLine}>
            <Text style={styles.wcDetailsLabel}>Due today</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.wcNowBadge}><Text style={styles.wcNowBadgeText}>Now</Text></View>
              <Money amount={wcMoney(wcPlanToday(months))} size={17} color={greenMid} />
            </View>
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewLine}>
            <View>
              <Text style={styles.wcDetailsLabel}>Then monthly</Text>
              <Text style={styles.wcDetailsDim}>{months - 1} {wcPaymentsWord(months - 1)} · {months === 2 ? `1 ${startMonth}` : `1 ${startMonth} – 1 ${endMonth}`}</Text>
            </View>
            <Money amount={wcMoney(wcPlanMonthly(months))} size={17} />
          </View>
          <Pressable testID="wc-view-full-schedule" style={styles.wcScheduleLinkRow} onPress={onViewSchedule} accessibilityRole="button" accessibilityLabel="View full schedule">
            <Text style={styles.wcScheduleLinkText}>View full schedule</Text>
            <Text style={styles.wcScheduleLinkChevron}>›</Text>
          </Pressable>
        </View>
        <View style={styles.wcDetailsCard}>
          <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>Order total</Text><Money amount={wcMoney(WC_CART_TOTAL)} size={17} /></View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewLine}><Text style={[styles.wcDetailsLabel, { color: greenMid }]}>Tasheel discount (10%)</Text><Text style={styles.wcFeeFree}>− <Riyal size={10} color={greenMid} /> {wcMoney(WC_DISCOUNT_AMOUNT)}</Text></View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>Available BNPL limit</Text><Money amount={wcMoney(WC_AVAILABLE_LIMIT)} size={17} /></View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>Down payment</Text><Money amount={wcMoney(WC_DOWN_PAYMENT)} size={17} /></View>
          <View style={styles.reviewDivider} />
          <View style={[styles.reviewLine, { position: 'relative' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={styles.wcDetailsLabel}>Processing fee</Text>
              <Pressable testID="wc-fee-info" onPress={() => setFeeTipOpen(v => !v)} hitSlop={10} accessibilityRole="button" accessibilityLabel="What is the processing fee?">
                <Image source={figmaImageSource('wcInfoCircle')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 13, height: 13 }} />
              </Pressable>
            </View>
            {fee === 0 ? <Text style={styles.wcDetailsDim}>No fees</Text> : <Money amount={wcMoney(fee)} size={17} />}
            {feeTipOpen ? (
              <View style={styles.wcFeeTip} pointerEvents="none">
                <Text style={styles.wcFeeTipText}>{fee === 0 ? 'This plan has no fees and no interest.' : `Plans of 4 months and longer carry a 1% Murabaha fee on the financed amount. It is split equally across the ${months} installments.`}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewLine}><Text style={styles.wcDetailsStrong}>Total</Text><Money amount={wcMoney(wcPlanTotal(months))} size={17} weight="700" /></View>
        </View>
        <Pressable testID="wc-details-got-it" style={styles.wcGreenCta} onPress={onContinue ?? onClose} accessibilityRole="button">
          <Text style={styles.wcGreenCtaText}>{onContinue ? 'Continue with plan' : 'Got it'}</Text>
        </Pressable>
      </Animated.View>
    </View></ViewportLayer>
  );
}

function WcFourMonthFeeSheet({ onClose }: { onClose: () => void }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true }).start();
  }, [rise]);
  return (
    <ViewportLayer><View style={styles.wcPickerOverlay} pointerEvents="auto">
      <Pressable style={styles.wcPickerScrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close fee explanation" />
      <Animated.View style={[styles.wcDetailsSheet, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }) }] }]}>
        <View style={styles.sheetGrabber} />
        <Text style={styles.wcDetailsTitle}>4-month plan fee</Text>
        <View style={styles.wcDetailsCard}>
          <Text style={styles.wcWhyText}>This plan has a 1% Murabaha fee and no interest.</Text>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>Financed amount</Text><Money amount={wcMoney(WC_FINANCED_PRINCIPAL)} size={16} /></View>
          <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>Total fee</Text><Money amount={wcMoney(wcPlanFee(4) ?? 0)} size={16} /></View>
          <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>Fee treatment</Text><Text style={styles.wcDetailsStrong}>Split across 4 payments</Text></View>
        </View>
        <Pressable testID="wc-four-month-fee-got-it" style={styles.wcGreenCta} onPress={onClose} accessibilityRole="button">
          <Text style={styles.wcGreenCtaText}>Got it</Text>
        </Pressable>
      </Animated.View>
    </View></ViewportLayer>
  );
}

// Figma 2003:12885 — Full schedule timeline, derived live from the selected tenure.
function WcFullScheduleSheet({ months, onClose }: { months: number; onClose: () => void }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true }).start();
  }, [rise]);
  const rows = Array.from({ length: months }, (_, i) => {
    if (i === 0) return { label: 'Today', sub: 'Down payment', amount: wcPlanToday(months), badge: 'Due today' as const };
    return { label: `1 ${MONTH_NAMES[(6 + i - 1) % 12].slice(0, 3)}`, sub: `Payment ${i + 1} of ${months}`, amount: wcPlanMonthly(months), badge: i === months - 1 ? ('Final' as const) : null };
  });
  return (
    <ViewportLayer><View style={styles.wcPickerOverlay} pointerEvents="auto">
      <Pressable style={styles.wcPickerScrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close schedule" />
      <Animated.View style={[styles.wcDetailsSheet, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [460, 0] }) }] }]}>
        <View style={styles.sheetGrabber} />
        <Text style={styles.wcDetailsTitle}>Plan details</Text>
        <View style={{ gap: 2, marginBottom: 6 }}>
          <Text style={styles.wcDetailsStrong}>{months} monthly payments</Text>
          <Text style={styles.wcDetailsDim}>First payment today, then {months - 1} {wcPaymentsWord(months - 1)} monthly</Text>
        </View>
        <View testID="wc-schedule-rows" style={{ gap: 0 }}>
          {rows.map((r, i) => (
            <View key={r.label} style={styles.wcScheduleRow}>
              <View style={styles.wcScheduleRail}>
                <View style={[styles.wcScheduleDot, i === 0 && styles.wcScheduleDotActive]}>{i === 0 ? <View style={styles.wcScheduleDotInner} /> : null}</View>
                {i < rows.length - 1 ? <View style={styles.wcScheduleLine} /> : null}
              </View>
              <View style={styles.wcScheduleBody}>
                <View>
                  <Text style={styles.wcScheduleLabel}>{r.label}</Text>
                  <Text style={styles.wcDetailsDim}>{r.sub}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Money amount={wcMoney(r.amount)} size={15} color={i === 0 ? greenMid : text} />
                  {r.badge ? (
                    <View style={[styles.wcNowBadge, r.badge === 'Final' && { backgroundColor: '#eceff1' }]}>
                      <Text style={[styles.wcNowBadgeText, r.badge === 'Final' && { color: muted }]}>{r.badge}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
        <Pressable testID="wc-schedule-got-it" style={styles.wcGreenCta} onPress={onClose} accessibilityRole="button">
          <Text style={styles.wcGreenCtaText}>Got it</Text>
        </Pressable>
      </Animated.View>
    </View></ViewportLayer>
  );
}

// "Why am I paying this today?" — opened from the info icon next to the down payment.
function WcWhyTodaySheet({ months, onClose }: { months: number; onClose: () => void }) {
  const rise = useRef(new Animated.Value(0)).current;
  const fee = wcPlanFee(months);
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true }).start();
  }, [rise]);
  return (
    <ViewportLayer><View style={styles.wcPickerOverlay} pointerEvents="auto">
      <Pressable style={styles.wcPickerScrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <Animated.View style={[styles.wcDetailsSheet, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [380, 0] }) }] }]}>
        <View style={styles.sheetGrabber} />
        <Text style={styles.wcDetailsTitle}>Why you pay this today</Text>
        <View style={styles.wcDetailsCard}>
          <View style={styles.wcWhyRow}>
            <View style={styles.wcWhyDot} />
            <Text style={styles.wcWhyText}>Your discounted order is <Riyal size={10} color={muted} /> {wcMoney(WC_DISCOUNTED_TOTAL)}. Your available limit finances <Riyal size={10} color={muted} /> {wcMoney(WC_FINANCED_PRINCIPAL)}, so the required down payment is <Riyal size={10} color={muted} /> {wcMoney(WC_DOWN_PAYMENT)}.</Text>
          </View>
          <View style={styles.wcWhyRow}>
            <View style={styles.wcWhyDot} />
            <Text style={styles.wcWhyText}>Your first installment of <Riyal size={10} color={muted} /> {wcMoney(wcPlanMonthly(months))} is added to the down payment today.</Text>
          </View>
          <View style={styles.wcWhyRow}>
            <View style={styles.wcWhyDot} />
            <Text style={styles.wcWhyText}>{fee === 0 ? 'This plan has no fees and no interest.' : <>The <Riyal size={12} color={muted} /> {wcMoney(fee)} Murabaha fee is included in the equal installments.</>}</Text>
          </View>
        </View>
        <Pressable testID="wc-why-got-it" style={styles.wcGreenCta} onPress={onClose} accessibilityRole="button">
          <Text style={styles.wcGreenCtaText}>Got it</Text>
        </Pressable>
      </Animated.View>
    </View></ViewportLayer>
  );
}

// Figma 1885:12758 — Cart details sheet (items sum to the cart total).
const WC_CART_ITEMS_LIST = [
  { name: "SMEG 50's Retro Refrigerator", sub: 'Right Handle · Black', amount: 7000.00 },
];

function WcCartSheet({ onClose }: { onClose: () => void }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true }).start();
  }, [rise]);
  return (
    <ViewportLayer><View style={styles.wcPickerOverlay} pointerEvents="auto">
      <Pressable style={styles.wcPickerScrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close cart" />
      <Animated.View style={[styles.wcDetailsSheet, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [380, 0] }) }] }]}>
        <View style={styles.sheetGrabber} />
        <Text style={styles.wcDetailsTitle}>Cart details</Text>
        <Text style={[styles.wcDetailsDim, { marginTop: -8, marginBottom: 2 }]}>{WC_CART_ITEMS_LIST.length} {WC_CART_ITEMS_LIST.length === 1 ? 'item' : 'items'} in your cart</Text>
        {WC_CART_ITEMS_LIST.map(item => (
          <View key={item.name} style={[styles.wcDetailsCard, styles.wcCartItemRow]}>
            <View style={styles.wcCartItemIcon}><Image source={figmaImageSource('wcCartIcon')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 16, height: 16 }} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.wcDetailsStrong}>{item.name}</Text>
              <Text style={styles.wcDetailsDim}>{item.sub}</Text>
            </View>
            <Money amount={wcMoney(item.amount)} size={15} />
          </View>
        ))}
        <View style={[styles.wcDetailsCard, { gap: 10 }]}>
          <View style={styles.wcCartTotalRow}>
            <Text style={styles.wcDetailsDim}>Subtotal</Text>
            <Money amount={wcMoney(WC_CART_TOTAL)} size={15} color={muted} />
          </View>
          <View style={styles.wcCartTotalRow}>
            <Text style={styles.wcCartDiscountLabel}>Tasheel discount (10%)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.wcCartDiscountLabel}>− </Text>
              <Money amount={wcMoney(WC_DISCOUNT_AMOUNT)} size={15} color={greenMid} weight="700" />
            </View>
          </View>
          <View style={styles.wcCartTotalDivider} />
          <View style={styles.wcCartTotalRow}>
            <Text style={styles.wcDetailsLabel}>Total</Text>
            <Money amount={wcMoney(WC_DISCOUNTED_TOTAL)} size={17} weight="700" />
          </View>
        </View>
        <Pressable testID="wc-cart-got-it" style={styles.wcGreenCta} onPress={onClose} accessibilityRole="button">
          <Text style={styles.wcGreenCtaText}>Got it</Text>
        </Pressable>
      </Animated.View>
    </View></ViewportLayer>
  );
}

type WcPayKind = 'apple' | 'card';

function WcPayRadio({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.wcPayRadio, selected && styles.wcPayRadioSelected]}>
      {selected ? <View style={styles.wcPayRadioDot} /> : null}
    </View>
  );
}

const WC_MURABAHA_DOCUMENTS = [
  { key: 'holding', title: 'Holding Certificate' },
  { key: 'loan', title: 'Loan Contract' },
  { key: 'sales', title: 'Sales Agreement' },
] as const;

function WcMurabahaSheet({ accepted, setAccepted, onClose }: { accepted: boolean; setAccepted: (accepted: boolean) => void; onClose: () => void }) {
  const rise = useRef(new Animated.Value(0)).current;
  const [documentTitle, setDocumentTitle] = useState<string | null>(null);
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 280, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true }).start();
  }, [rise]);
  return (
    <ViewportLayer><View style={styles.wcPickerOverlay} pointerEvents="auto">
      <Pressable style={styles.wcPickerScrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close Murabaha documents" />
      <Animated.View testID="wc-murabaha-sheet" style={[styles.wcMurabahaSheet, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [540, 0] }) }] }]}>
        <View style={styles.wcMurabahaHeader}>
          {documentTitle ? (
            <Pressable testID="wc-murabaha-document-back" onPress={() => setDocumentTitle(null)} accessibilityRole="button" accessibilityLabel="Back to Murabaha documents" style={styles.wcMurabahaClose}>
              <Text style={styles.wcMurabahaCloseGlyph}>‹</Text>
            </Pressable>
          ) : <View style={{ width: 44 }} />}
          <Text style={styles.wcMurabahaTitle}>{documentTitle ?? 'Murabaha documents'}</Text>
          <Pressable testID="wc-murabaha-close" onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.wcMurabahaClose}>
            <Text style={styles.wcMurabahaCloseGlyph}>×</Text>
          </Pressable>
        </View>

        {documentTitle ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.wcDocumentPreview}>
            <View style={styles.wcDocumentIcon}><Text style={styles.wcDocumentIconGlyph}>≡</Text></View>
            <Text style={styles.wcDocumentHeading}>{documentTitle}</Text>
            <Text style={styles.wcDocumentBody}>Review the complete document provided for this purchase before accepting the Murabaha agreement.</Text>
            <View style={styles.wcDocumentRule} />
            <Text style={styles.wcDocumentBody}>The final legal document will contain the approved purchase amount, payment schedule, applicable Murabaha fee, and contractual terms.</Text>
          </ScrollView>
        ) : (
          <>
            <View style={styles.wcMurabahaList}>
              {WC_MURABAHA_DOCUMENTS.map((document, index) => (
                <View key={document.key}>
                  <Pressable testID={`wc-murabaha-document-${document.key}`} style={styles.wcMurabahaRow} onPress={() => setDocumentTitle(document.title)} accessibilityRole="button" accessibilityLabel={`Open ${document.title}`}>
                    <View style={styles.wcDocumentIcon}><Text style={styles.wcDocumentIconGlyph}>≡</Text></View>
                    <Text style={styles.wcMurabahaRowText}>{document.title}</Text>
                    <Text style={styles.wcMurabahaChevron}>›</Text>
                  </Pressable>
                  {index < WC_MURABAHA_DOCUMENTS.length - 1 ? <View style={styles.wcPayDivider} /> : null}
                </View>
              ))}
            </View>
            <Text style={styles.wcMurabahaAgreeLabel}>Agree here:</Text>
            <Pressable testID="wc-murabaha-accept" style={styles.wcMurabahaAccept} onPress={() => setAccepted(!accepted)} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}>
              <Text style={styles.wcMurabahaAcceptText}>Accept Murabaha agreement</Text>
              <View style={[styles.wcAgreementCheckbox, accepted && styles.wcAgreementCheckboxSelected]}>{accepted ? <Text style={styles.wcAgreementCheck}>✓</Text> : null}</View>
            </Pressable>
          </>
        )}
      </Animated.View>
    </View></ViewportLayer>
  );
}

// Figma 1961:27293 — payment plan summary + payment method selection.
function WcPayment({ setRoute, months, setMonths }: { setRoute: (r: RouteKey) => void; months: number; setMonths: (m: number) => void }) {
  const [method, setMethod] = useState<WcPayKind | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [sheet, setSheet] = useState<null | 'details' | 'schedule' | 'why' | 'leave' | 'murabaha'>(null);
  const today = wcPlanToday(months);
  const canPay = method !== null && agreementAccepted;
  const payCta = (
    <View style={styles.wcStickyCtaBar} pointerEvents="auto">
      <Pressable testID="wc-pay-cta" disabled={!canPay} style={[styles.wcGreenCta, { flexDirection: 'row', gap: 2 }, !canPay && styles.wcGreenCtaDisabled]} onPress={() => pay()} accessibilityRole="button" accessibilityState={{ disabled: !canPay }}>
        <Text style={[styles.wcGreenCtaText, !canPay && styles.wcGreenCtaTextDisabled]}>Pay  </Text><Riyal size={12} color={canPay ? neon : muted} /><Text style={[styles.wcGreenCtaText, !canPay && styles.wcGreenCtaTextDisabled]}>{wcMoney(today)}</Text>
      </Pressable>
    </View>
  );
  const pay = () => {
    if (!canPay || !method) return;
    if (method === 'apple') {
      launchNativeApplePay(today, () => setRoute('wcProcessing'));
      return;
    }
    setRoute('wcProcessing');
  };
  return (
    <AppShell>
      <View testID="wc-payment-1961-27293" style={styles.wcObScreen}>
        <ScreenFade>
          <View style={styles.wcPaySheet}>
            <View style={[styles.wcObHeaderRow, { marginTop: SHOW_FAKE_CHROME ? 70 : 26 }]}>
              <Pressable testID="wc-pay-back" onPress={() => setRoute('wcTenure')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.wcObCloseBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M15 5.5L8.5 12L15 18.5" fill="none" stroke={text} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
              </Pressable>
              <Image source={figmaImageSource('wcTasheelLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.wcObLogo} />
              <Text style={styles.wcObArabic}>العربية</Text>
            </View>
            <FadeSwap swapKey={`pay-plan-${months}`}>
              <View style={{ gap: 4, marginTop: 10 }}>
                <Text style={styles.wcPayPlanLabel}>Your payment plan</Text>
                <View style={styles.wcPayHeroRow}>
                  <Riyal size={20} />
                  <Text style={styles.wcPlanHeroAmount}>{wcMoney(today)}</Text>
                  <Text style={styles.wcPlanHeroToday}> today</Text>
                  <Pressable testID="wc-why-today" onPress={() => setSheet('why')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Why am I paying this today?">
                    <Image source={figmaImageSource('wcInfoCircle')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 14, height: 14, marginLeft: 6 }} />
                  </Pressable>
                </View>
                <Text style={[styles.wcPayThen, { marginTop: 4 }]}>Then <Text style={styles.wcPayThenStrong}>{months - 1}</Text> {wcPaymentsWord(months - 1)} of <Riyal size={11} color={muted} /> <Text style={styles.wcPayThenStrong}>{wcMoney(wcPlanMonthly(months))}</Text>/mo</Text>
                <Text style={styles.wcPayStartLine}>{months === 2 ? 'Due on Jul 1 2026' : `Starting from Jul 1 to ${MONTH_NAMES[(6 + months - 2) % 12].slice(0, 3)} 1 2026`}</Text>
              </View>
            </FadeSwap>
            <View style={styles.wcPayActionsRow}>
              <Pressable testID="wc-pay-change" style={styles.wcPayActionPill} onPress={() => setRoute('wcTenure')} accessibilityRole="button"><Text style={styles.wcPayActionText}>Change</Text></Pressable>
              <Pressable testID="wc-pay-details" style={styles.wcPayActionPill} onPress={() => setSheet('details')} accessibilityRole="button"><Text style={styles.wcPayActionText}>Details</Text></Pressable>
            </View>
          </View>
          <View style={styles.wcPayBody}>
            <Text style={styles.wcPayMethodTitle}>Payment method</Text>
            <View style={{ marginTop: 14 }}>
              <Pressable testID="wc-pay-row-apple" style={styles.wcPayRow} onPress={() => setMethod('apple')} accessibilityRole="radio" accessibilityState={{ selected: method === 'apple' }}>
                <View style={styles.wcPayRowLeft}>
                  <View style={styles.wcPayLogoTile}><Image source={figmaImageSource('wcApplePay')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 34, height: 34 }} /></View>
                  <Text style={styles.wcPayRowTitle}>Apple Pay</Text>
                </View>
                <WcPayRadio selected={method === 'apple'} />
              </Pressable>
              <View style={styles.wcPayDivider} />
              <Pressable testID="wc-pay-row-add" style={({ pressed }: { pressed: boolean }) => [styles.wcPayRow, pressed && { opacity: 0.55 }]} onPress={() => setMethod('card')} accessibilityRole="radio" accessibilityState={{ selected: method === 'card' }} accessibilityLabel="Add new card">
                <View style={styles.wcPayRowLeft}>
                  <View style={styles.wcPayLogoTile}><Image source={figmaImageSource('wcCardAdd')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 26, height: 26 }} /></View>
                  <Text style={styles.wcPayRowTitle}>Add new card</Text>
                </View>
                <WcPayRadio selected={method === 'card'} />
              </Pressable>
            </View>
            <View style={styles.wcNetworksRow}>
              <Image source={figmaImageSource('wcVisa')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 35, height: 12 }} />
              <Image source={figmaImageSource('wcMastercard')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 18, height: 18 }} />
              <View style={styles.wcNetworkBadge}><Image source={figmaImageSource('wcApplePay')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 20, height: 20 }} /></View>
              <Image source={figmaImageSource('wcMada')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 28, height: 10 }} />
            </View>
            <Pressable testID="wc-murabaha-entry" style={styles.wcAgreementEntry} onPress={() => setSheet('murabaha')} accessibilityRole="button" accessibilityLabel="Review and accept Murabaha agreement">
              <View style={[styles.wcAgreementCheckbox, agreementAccepted && styles.wcAgreementCheckboxSelected]}>{agreementAccepted ? <Text style={styles.wcAgreementCheck}>✓</Text> : null}</View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.wcAgreementEntryTitle}>{agreementAccepted ? 'Murabaha agreement accepted' : 'Accept Murabaha agreement'}</Text>
                <Text style={styles.wcAgreementEntrySub}>Review the required documents before paying</Text>
              </View>
              <Text style={styles.wcMurabahaChevron}>›</Text>
            </Pressable>
          </View>
          <View style={styles.wcObBottom}>
            {SHOW_FAKE_CHROME ? payCta : null}
            <SafariCompactBar url="extrastores.com" onBack={() => setRoute('wcTenure')} />
          </View>
        </ScreenFade>
        {SHOW_FAKE_CHROME ? null : <ViewportLayer>{payCta}</ViewportLayer>}
        {sheet === 'details' ? <WcPlanDetailsSheet months={months} onClose={() => setSheet(null)} onViewSchedule={() => setSheet('schedule')} /> : null}
        {sheet === 'schedule' ? <WcFullScheduleSheet months={months} onClose={() => setSheet(null)} /> : null}
        {sheet === 'why' ? <WcWhyTodaySheet months={months} onClose={() => setSheet(null)} /> : null}
        {sheet === 'murabaha' ? <WcMurabahaSheet accepted={agreementAccepted} setAccepted={setAgreementAccepted} onClose={() => setSheet(null)} /> : null}
        {sheet === 'leave' ? <WcLeaveSheet onStay={() => setSheet(null)} onLeave={() => setRoute('checkout')} /> : null}
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// Live-demo hook: `?tasheel=N` anchors the whole web flow to a phone notification
// fired N seconds after load, so processing lands on success at the same moment.
// T0 is captured at module load, not at render, so time already spent on earlier
// screens counts against the budget. Without the param the flow runs at its own pace.
const WC_DEMO_T0 = Date.now();
const WC_DEMO_WINDOW_MS = (() => {
  if (typeof location === 'undefined') return null;
  const match = /[?&]tasheel=(\d+)/.exec(location.search);
  return match ? parseInt(match[1], 10) * 1000 : null;
})();
const WC_PROCESSING_MS = 2900;

// Figma 1691:67680 — web processing with rocket + animated bar, auto-advances to success.
function WcProcessing({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const hold = WC_DEMO_WINDOW_MS
      ? Math.max(WC_PROCESSING_MS, WC_DEMO_WINDOW_MS - 2000 - (Date.now() - WC_DEMO_T0))
      : WC_PROCESSING_MS;
    Animated.timing(progress, { toValue: 1, duration: hold - 300, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    const timer = setTimeout(() => setRoute('wcSuccess'), hold);
    return () => clearTimeout(timer);
  }, [progress, setRoute]);
  return (
    <AppShell scroll={!SHOW_FAKE_CHROME}>
      <View testID="wc-processing-1691-67680" style={SHOW_FAKE_CHROME ? styles.wcObScreenFixed : [styles.wcObScreen, { flex: 1 }]}>
        <View style={styles.wcProcLogoRow}><TasheelMark size={44} /></View>
        <View style={styles.wcProcCenter}>
          <Image source={figmaImageSource('wcRocket')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 180, height: 180 }} />
          <View style={{ gap: 12, alignItems: 'center', marginTop: 23 }}>
            <Text style={styles.wcProcTitle}>Processing Purchase...</Text>
            <Text style={styles.wcProcSub}>Please don't close or leave this page.</Text>
          </View>
          <View testID="wc-processing-track" style={styles.wcProcTrack}>
            <Animated.View style={[styles.wcProcFillWrap, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['8%', '100%'] }) }]}>
              <Svg width="100%" height={12} preserveAspectRatio="none">
                <Defs>
                  <SvgLinearGradient id="wcProcGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#166534" />
                    <Stop offset="1" stopColor="#3eff00" />
                  </SvgLinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="12" fill="url(#wcProcGrad)" />
              </Svg>
            </Animated.View>
          </View>
        </View>
        <View style={styles.wcObBottom}>
          <SafariCompactBar url="extrastores.com" />
        </View>
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// Figma 1691:67703 — Purchase Successful with live plan data. This is the last
// web screen: the flow hands off to the installed Tasheel app from here. The
// handoff is an explicit tap rather than a timed redirect, because iOS only
// honours a custom-scheme navigation that comes from a real user gesture.
function WcSuccess({ months }: { months: number }) {
  return (
    <AppShell scroll={!SHOW_FAKE_CHROME}>
      <View testID="wc-success-1691-67703" style={SHOW_FAKE_CHROME ? styles.wcObScreenFixed : [styles.wcObScreen, { flex: 1 }]}>
        <ScreenFade>
        <View style={styles.wcSuccessBody}>
          <Image source={figmaImageSource('paymentSuccessCelebration')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 101, height: 94, alignSelf: 'center', marginTop: SHOW_FAKE_CHROME ? 40 : 8 }} />
          <Text style={styles.wcSuccessTitle}>Purchase Successful!</Text>
          <Text style={styles.wcSuccessSub}>Your order is confirmed and your payment plan is set up. You can track your installments anytime in Tasheel app.</Text>
          <View style={styles.wcSuccessCard}>
            <View style={styles.wcSuccessMerchantRow}>
              <View style={styles.wcSuccessMerchantLogo}><Image source={figmaImageSource('extraLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 30, height: 30 }} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wcSuccessMerchantName}>Extrastores</Text>
                <Text style={styles.wcSuccessMerchantSub}>{WC_CART_ITEMS} {WC_CART_ITEMS === 1 ? 'Item' : 'Items'}</Text>
              </View>
              <Money amount={wcMoney(WC_DISCOUNTED_TOTAL)} size={18} weight="700" />
            </View>
          </View>
          <View style={styles.wcSuccessCard}>
            <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>Plan</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Riyal size={11} /><Text style={styles.wcSuccessValue}>{months} Month x {wcMoney(wcPlanMonthly(months))}</Text></View></View>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>First payment</Text><Text style={styles.wcSuccessValue}>July 1st, 2026</Text></View>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewLine}><Text style={styles.wcDetailsLabel}>Reference</Text><Text style={styles.wcSuccessValue}>{WC_ORDER_REFERENCE}</Text></View>
          </View>
          <View style={[styles.wcSuccessCard, { gap: 10 }]}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <TasheelMark size={26} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.wcSuccessDownloadTitle}>Download Tasheel app</Text>
                <Text style={styles.wcSuccessMerchantSub}>Track installments and pay early whenever you like</Text>
              </View>
            </View>
            <View style={styles.wcBadgeRow}>
              <Image source={figmaImageSource('wcBadgeAppStore')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 81, height: 27 }} />
              <Image source={figmaImageSource('wcBadgeGooglePlay')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 91, height: 27 }} />
            </View>
          </View>
          <Pressable testID="wc-success-open-app" style={styles.wcGreenCta} onPress={() => wcOpenTasheelApp(wcPurchaseDeepLink(months))} accessibilityRole="button" accessibilityLabel="Open the Tasheel app to view your plan">
            <Text style={styles.wcGreenCtaText}>Open the Tasheel app</Text>
          </Pressable>
        </View>
        <View style={styles.wcObBottom}>
          <SafariCompactBar url="extrastores.com" />
        </View>
        </ScreenFade>
        <View style={styles.wcStatusOverlay} pointerEvents="none"><StatusStrip pointerEvents="none" /></View>
      </View>
    </AppShell>
  );
}

// iOS lock-screen push notification — system UI pattern with the real Tasheel mark.
// This is the handoff out of the web: tapping the banner deep-links into the real
// Tasheel app rather than continuing into the web-rendered app simulation. If the
// app is not installed nothing happens and the lock scene stays put.
function WcNotification({ setRoute, months }: { setRoute: (r: RouteKey) => void; months: number }) {
  const drop = useRef(new Animated.Value(0)).current;
  // On a real phone the user sees the actual status-bar clock right above this scene,
  // so the lock screen must show the real time/date; desktop keeps the 9:41 fixture.
  const [now] = useState(() => new Date());
  const clock = SHOW_FAKE_CHROME ? '9:41' : `${((now.getHours() + 11) % 12) + 1}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dateLine = SHOW_FAKE_CHROME ? 'Tuesday, June 10' : `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(drop, { toValue: 1, friction: 9, tension: 70, useNativeDriver: true }).start();
    }, 700);
    return () => clearTimeout(timer);
  }, [drop]);
  useEffect(() => {
    // Tint Safari's surrounding chrome dark so the lock scene fills the phone.
    if (typeof document === 'undefined') return;
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0b1410';
    const setTheme = (c: string) => {
      const m = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
      if (m) m.content = c;
    };
    setTheme('#0b1410');
    return () => {
      document.body.style.backgroundColor = prev;
      setTheme('#ffffff');
    };
  }, []);
  return (
    <AppShell scroll={!SHOW_FAKE_CHROME}>
      <View testID="wc-notification" style={SHOW_FAKE_CHROME ? styles.wcLockScreen : [styles.wcLockScreen, { height: undefined, flex: 1 }]}>
        <View style={styles.wcLockGlow} />
        <Text style={styles.wcLockDate}>{dateLine}</Text>
        <Text style={styles.wcLockClock}>{clock}</Text>
        <Animated.View style={[styles.wcNotifBanner, { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as object, { opacity: drop, transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] }) }] }]}>
          <Pressable testID="wc-notification-banner" style={styles.wcNotifInner} onPress={() => wcOpenTasheelApp(wcPurchaseDeepLink(months))} accessibilityRole="button" accessibilityLabel="Open the Tasheel app">
            <View style={styles.wcNotifAppIcon}><TasheelMark size={26} /></View>
            <View style={{ flex: 1, gap: 1 }}>
              <View style={styles.wcNotifTitleRow}>
                <Text style={styles.wcNotifApp}>TASHEEL</Text>
                <Text style={styles.wcNotifTime}>now</Text>
              </View>
              <Text style={styles.wcNotifTitle}>Purchase confirmed 🎉</Text>
              <Text style={styles.wcNotifBody}>Your Extrastores purchase of <Riyal size={12} color={muted} /> {wcMoney(WC_DISCOUNTED_TOTAL)} after discount is split over {months} months. Tap to view your plan.</Text>
            </View>
          </Pressable>
        </Animated.View>
        <View style={styles.wcLockBottomRow}>
          <View style={styles.wcLockCircle}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path d="M8 2.5h8v3.2l-2.2 3.1v12.7a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V8.8L8 5.7Z" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinejoin="round" />
              <Path d="M8 5.2h8" stroke="#fff" strokeWidth={1.4} />
            </Svg>
          </View>
          <View style={styles.wcLockCircle}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Rect x="2.8" y="6.2" width="18.4" height="13.6" rx="2.6" fill="none" stroke="#fff" strokeWidth={1.7} />
              <Path d="M8.2 6.2 9.8 3.8h4.4l1.6 2.4" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinejoin="round" />
              <Circle cx="12" cy="13" r="3.4" fill="none" stroke="#fff" strokeWidth={1.7} />
            </Svg>
          </View>
        </View>
        {SHOW_FAKE_CHROME ? <View style={styles.wcLockHomeIndicator} /> : null}
      </View>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Superapp landing homepage (Figma 2741:27487) — the screen the lock-screen
// notification opens into. SF Pro surface, iOS 26 "liquid glass" controls,
// real exported Figma imagery (hero, banners, store/offer art, category icons).
// ---------------------------------------------------------------------------
const SA_BLUR = { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as object;
// iOS 26 "liquid glass" — heavier blur + saturation so the bar refracts the content behind it.
const SA_GLASS = { backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)' } as object;

// Clean line icons (iOS-style, stroked) — replaces the heavy filled SVG exports.
function SaIcon({ name, color = '#8e8e93', size = 24 }: { name: 'home' | 'bag' | 'sale' | 'receipt' | 'search' | 'bell'; color?: string; size?: number }) {
  const sw = 1.8;
  const common = { fill: 'none' as const, stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityIgnoresInvertColors>
      {name === 'home' && (<>
        <Path d="M3.5 11.5 12 4l8.5 7.5" {...common} />
        <Path d="M5.5 10v9.5a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V10" {...common} />
      </>)}
      {name === 'bag' && (<>
        <Path d="M6 8h12l.7 11.2a1.4 1.4 0 0 1-1.4 1.5H6.7a1.4 1.4 0 0 1-1.4-1.5L6 8Z" {...common} />
        <Path d="M9 8.5V6.6a3 3 0 0 1 6 0v1.9" {...common} />
      </>)}
      {name === 'sale' && (<>
        <Path d="M12.4 3.2H19a1.8 1.8 0 0 1 1.8 1.8v6.6a1.8 1.8 0 0 1-.53 1.27l-7.4 7.4a1.8 1.8 0 0 1-2.55 0l-5.06-5.06a1.8 1.8 0 0 1 0-2.55l7.4-7.4A1.8 1.8 0 0 1 12.4 3.2Z" {...common} />
        <Circle cx="16.2" cy="7.8" r="1.25" fill={color} />
        <Path d="M9 14.8l3.6-3.6" {...common} />
      </>)}
      {name === 'receipt' && (<>
        <Path d="M6.5 3.2h11a.6.6 0 0 1 .6.6v16.4l-2.55-1.3-2.55 1.3-2.5-1.3-2.55 1.3-2.5-1.3V3.8a.6.6 0 0 1 .6-.6Z" {...common} />
        <Path d="M9 8h6M9 11.6h6" {...common} />
      </>)}
      {name === 'search' && (<>
        <Circle cx="11" cy="11" r="6.4" {...common} />
        <Path d="M15.8 15.8 20.5 20.5" {...common} />
      </>)}
      {name === 'bell' && (<>
        <Path d="M6 9.5a6 6 0 0 1 12 0c0 4.6 1.4 5.8 2 6.7H4c.6-.9 2-2.1 2-6.7Z" {...common} />
        <Path d="M10 19.5a2 2 0 0 0 4 0" {...common} />
      </>)}
    </Svg>
  );
}

function SaChevron({ size = 18, color = '#00191c' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityIgnoresInvertColors>
      <Path d="M9 5.5L15.5 12L9 18.5" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SaGlassButton({ label, onPress, testID, style }: { label: string; onPress?: () => void; testID?: string; style?: object }) {
  return (
    <Pressable testID={testID} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.saGlassBtn, SA_BLUR, style, pressed && { opacity: 0.75 }]}>
      <Text style={styles.saGlassBtnText}>{label}</Text>
    </Pressable>
  );
}

function SaSectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.saSectionHeader}>
      <Text style={styles.saSectionTitle}>{title}</Text>
      <SaChevron />
    </Pressable>
  );
}

function SaStore({ asset, name, bg, onPress }: { asset: FigmaImageKey; name: string; bg?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.saStore} accessibilityRole="button" accessibilityLabel={name}>
      <View style={[styles.saStoreCircle, bg ? { backgroundColor: bg } : null]}>
        <Image source={figmaImageSource(asset)} resizeMode="cover" accessibilityIgnoresInvertColors style={{ width: '100%', height: '100%', borderRadius: 36 }} />
      </View>
      <Text style={styles.saStoreName} numberOfLines={1}>{name}</Text>
    </Pressable>
  );
}

// Deals card — full-bleed art with the title set over a frosted gradient (Figma 2741:27619).
function SaDealCard({ bg, logo, title, onPress }: { bg: FigmaImageKey; logo: FigmaImageKey; title: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.saDealCard} accessibilityRole="button">
      <Image source={figmaImageSource(bg)} resizeMode="cover" accessibilityIgnoresInvertColors style={StyleSheet.absoluteFill} />
      <View style={styles.saDealScrim}>
        <Svg width="100%" height="100%">
          <Defs>
            <SvgLinearGradient id="saDealGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000000" stopOpacity={0} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0.45} />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#saDealGrad)" />
        </Svg>
      </View>
      <Image source={figmaImageSource(logo)} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.saDealLogo} />
      <Text style={styles.saDealTitle}>{title}</Text>
    </Pressable>
  );
}

// Category offer card — framed art on top, title + sub beneath (Figma 2741:27650).
function SaOfferCard({ bg, logo, title, sub, framed, onPress }: { bg: FigmaImageKey; logo: FigmaImageKey; title: string; sub: string; framed?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.saOfferCard} accessibilityRole="button">
      <View style={[styles.saOfferArt, framed && styles.saOfferArtFramed]}>
        <Image source={figmaImageSource(bg)} resizeMode="cover" accessibilityIgnoresInvertColors style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
        <Image source={figmaImageSource(logo)} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.saOfferLogo} />
      </View>
      <View style={{ gap: 4, width: 121 }}>
        <Text style={styles.saOfferTitle}>{title}</Text>
        <Text style={styles.saOfferSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

// Full-width promo banner with photographic background + diagonal teal scrim (Figma 2741:27633 / 27692).
function SaPromoBanner({ bg, kicker, title, height, onPress }: { bg: FigmaImageKey; kicker: string; title: string; height: number; onPress?: () => void }) {
  return (
    <View style={[styles.saPromo, { height }]}>
      <Image source={figmaImageSource(bg)} resizeMode="cover" accessibilityIgnoresInvertColors style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <SvgLinearGradient id={`saPromo${kicker.replace(/\s/g, '')}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#01160b" stopOpacity={0.86} />
            <Stop offset="0.42" stopColor="#03231a" stopOpacity={0.45} />
            <Stop offset="0.8" stopColor="#03231a" stopOpacity={0.05} />
            <Stop offset="1" stopColor="#03231a" stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#saPromo${kicker.replace(/\s/g, '')})`} />
      </Svg>
      <View style={styles.saPromoContent}>
        <Text style={styles.saPromoKicker}>{kicker}</Text>
        <Text style={styles.saPromoTitle}>{title}</Text>
        <View style={styles.saPromoBtnRow}><SaGlassButton label="Apply Now" onPress={onPress} /></View>
      </View>
    </View>
  );
}

function SaTabBar({ active, onTab, onSearch }: { active: string; onTab: (t: string) => void; onSearch: () => void }) {
  const tabs: Array<[string, FigmaImageKey]> = [
    ['Explore', 'saNav2Explore'],
    ['Stores', 'saNav2Stores'],
    ['offers', 'saNav2Offers'],
    ['Purchases', 'saNav2Purchases'],
  ];
  const activeIndex = Math.max(0, tabs.findIndex(([l]) => l === active));
  const [wrapW, setWrapW] = useState(0);
  const slide = useRef(new Animated.Value(activeIndex)).current;
  const itemW = wrapW > 0 ? (wrapW - 12) / tabs.length : 0;
  useEffect(() => {
    // iOS-26 liquid-glass tab bars morph the selection capsule to the tapped tab.
    Animated.spring(slide, { toValue: activeIndex, useNativeDriver: true, friction: 13, tension: 140 }).start();
  }, [activeIndex, slide]);
  const bar = (
    <View testID="superapp-tab-bar" style={styles.saTabBar} pointerEvents="box-none">
      <View style={styles.saTabPillWrap} onLayout={(e) => setWrapW(e.nativeEvent.layout.width)}>
        <View style={[styles.saTabPill, SA_GLASS]} />
        <View style={styles.saTabPillHighlight} pointerEvents="none" />
        {itemW > 0 ? (
          <Animated.View pointerEvents="none" style={[styles.saTabSelection, { width: itemW, transform: [{ translateX: Animated.multiply(slide, itemW) }] }]} />
        ) : null}
        {tabs.map(([label, icon]) => {
          const isActive = active === label;
          return (
            <Pressable key={label} onPress={() => onTab(label)} style={({ pressed }) => [styles.saTabItem, pressed && { opacity: 0.55 }]} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: isActive }}>
              <Image source={figmaImageSource(icon)} resizeMode="contain" accessibilityIgnoresInvertColors style={[styles.saTabIcon, { tintColor: isActive ? '#16720b' : '#6b7280' }]} />
              <Text style={[styles.saTabLabel, isActive && styles.saTabLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={onSearch} style={({ pressed }) => [styles.saTabSearch, SA_GLASS, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel="Search">
        <View style={styles.saTabSearchHighlight} pointerEvents="none" />
        <Image source={figmaImageSource('saNav2Search')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 26, height: 26, tintColor: '#1c1c1e' }} />
      </Pressable>
    </View>
  );
  // Device: ViewportLayer pins to the visual viewport (zoomed). Desktop/Dia (fake chrome):
  // portal a fixed, phone-width-centered overlay so the bar stays pinned while the page scrolls.
  if (!SHOW_FAKE_CHROME) return <ViewportLayer>{bar}</ViewportLayer>;
  if (typeof document === 'undefined') return bar;
  return createPortal(
    createElement('div', { style: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 402, zIndex: 1000, pointerEvents: 'none' } }, bar),
    document.body,
  );
}

// Pins a full-phone overlay to the visual viewport (search, etc.) regardless of scroll.
function SaPhoneOverlay({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  if (typeof document === 'undefined') return <>{children}</>;
  const zoom = SHOW_FAKE_CHROME ? 1 : width / 402;
  return createPortal(
    createElement('div', { style: { position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 402, zoom, zIndex: 1100, background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }, children),
    document.body,
  );
}

// In-page search — keeps the user on the homepage, no route change.
function SaSearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const suggestions = ['iPhone 17', 'Samsung S26', 'IKEA', 'PlayStation 5', 'Personal Loan', 'Credit Card', 'SMEG', 'Dyson', 'Air Jordan', 'Zara'];
  const popular: Array<[FigmaImageKey, string, string | undefined]> = [
    ['saStExtra', 'Extra', '#ffffff'], ['saStApple', 'Apple', '#ffffff'], ['saStJordan', 'Air Jordan', '#ec1f26'], ['saStNamshi', 'Namshi', '#ffffff'], ['saStZara', 'Zara', '#ffffff'],
  ];
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <View style={styles.saSearchScreen} testID="superapp-search">
      <View style={styles.saSearchTop}>
        <View style={styles.saSearchField}>
          <SaIcon name="search" color="#8e8e93" size={18} />
          <TextInput autoFocus value={q} onChangeText={setQ} placeholder="Search stores, offers, products" placeholderTextColor="#8e8e93" style={styles.saSearchInput} returnKeyType="search" />
          {q.length > 0 ? <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Clear"><Text style={styles.saSearchClear}>✕</Text></Pressable> : null}
        </View>
        <Pressable onPress={onClose} accessibilityRole="button"><Text style={styles.saSearchCancel}>Cancel</Text></Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        {q.trim().length === 0 ? (
          <>
            <Text style={styles.saSearchHeading}>Popular stores</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.saHScroll}>
              {popular.map(([a, n, bg]) => <SaStore key={n} asset={a} name={n} bg={bg} onPress={() => setQ(n)} />)}
            </ScrollView>
            <Text style={styles.saSearchHeading}>Trending searches</Text>
            <View style={styles.saChips}>
              {suggestions.map((s) => (
                <Pressable key={s} style={styles.saChip} onPress={() => setQ(s)} accessibilityRole="button">
                  <Text style={styles.saChipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <View style={{ paddingTop: 6 }}>
            {filtered.length ? filtered.map((s) => (
              <Pressable key={s} style={styles.saSearchResult} onPress={() => setQ(s)} accessibilityRole="button">
                <SaIcon name="search" color="#8e8e93" size={18} />
                <Text style={styles.saSearchResultText}>{s}</Text>
              </Pressable>
            )) : <Text style={styles.saSearchEmpty}>No results for “{q}”</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Real device viewport in design units (402-wide space). Tracks the *visual* viewport so the
// screen shrinks when the iOS keyboard opens (innerHeight doesn't change for the keyboard).
// Fake chrome keeps the fixed 874.
function useDeviceScreenHeight() {
  const { width } = useWindowDimensions();
  const vh = useVisualViewportHeight();
  if (SHOW_FAKE_CHROME) return 874;
  return Math.max(380, Math.round((vh * 402) / Math.max(1, width)));
}

// Full-screen container for keyboard-heavy screens (login/OTP). On real iOS it is a
// fixed element pinned EXACTLY to window.visualViewport (height + offset tracked live),
// so the on-screen keyboard can never leave a gap top or bottom. Desktop falls back to
// the normal AppShell phone frame.
function SaViewportScreen({ children, bg = '#0a1a10' }: { children: React.ReactNode; bg?: string }) {
  const { width, height: innerH } = useWindowDimensions();
  const [vp, setVp] = useState<{ w: number; h: number; top: number; left: number } | null>(null);
  useEffect(() => {
    if (SHOW_FAKE_CHROME || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      setVp({ w: vv.width, h: vv.height, top: vv.offsetTop, left: vv.offsetLeft });
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  if (SHOW_FAKE_CHROME || typeof document === 'undefined' || !vp) return <AppShell>{children}</AppShell>;
  const scale = vp.w / 402;
  // The container extends DOWN to the layout-viewport bottom (covering Safari's bottom
  // address bar / keyboard accessory with `bg` instead of leaving a white sliver), while
  // bottomInset pads the content up so it stays above the keyboard.
  const portalH = Math.max(vp.h, innerH - vp.top);
  const bottomInset = Math.max(0, portalH - vp.h);
  return createPortal(
    createElement('div',
      { style: { position: 'fixed', top: vp.top, left: vp.left, width: vp.w, height: portalH, overflow: 'hidden', background: bg, zIndex: 40 } },
      createElement('div',
        { style: { boxSizing: 'border-box', width: 402, height: portalH / scale, paddingBottom: bottomInset / scale, transform: `scale(${scale})`, transformOrigin: 'top left', display: 'flex', flexDirection: 'column' } },
        children,
      ),
    ),
    document.body,
  );
}

// White status row for photo-backed screens (Figma 2761:29371).
function SaStatusLight() {
  if (!SHOW_FAKE_CHROME) return null;
  return (
    <View style={styles.saStatusLight} pointerEvents="none">
      <Text style={styles.saStatusLightTime}>9:41</Text>
      <Image source={figmaImageSource('levels')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 78, height: 17, tintColor: '#ffffff' }} />
    </View>
  );
}

// Login — mobile number entry over a brand photo (Figma 2761:29360).
function SaLogin({ setRoute, phone, setPhone }: { setRoute: (r: RouteKey) => void; phone: string; setPhone: (p: string) => void }) {
  const [num, setNum] = useState('');
  const digits = num.replace(/\D/g, '');
  const valid = digits.length >= 9;
  const designH = useDeviceScreenHeight();
  const onContinue = () => {
    if (!valid) return;
    setPhone(digits.slice(-9));
    setRoute('saOtp');
  };
  return (
    <SaViewportScreen bg="#022b10">
      <ScreenFade>
      <View style={[styles.saLoginScreen, SHOW_FAKE_CHROME ? { height: designH } : { flex: 1 }]}>
        <ImageBackground source={figmaImageSource('saLoginBg')} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <Svg style={StyleSheet.absoluteFill} width={402} height={designH} preserveAspectRatio="none" pointerEvents="none">
          <Defs>
            <SvgLinearGradient id="saLoginGrad" x1={0} y1={0} x2={0} y2={designH} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#021b0e" stopOpacity={0.9} />
              <Stop offset="0.17" stopColor="#021b0e" stopOpacity={0} />
              <Stop offset="0.62" stopColor="#022b10" stopOpacity={0} />
              <Stop offset="1" stopColor="#022b10" stopOpacity={0.96} />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={402} height={designH} fill="url(#saLoginGrad)" />
        </Svg>
        <SaStatusLight />
        <View style={styles.saLoginContent}>
          <Image source={figmaImageSource('saTasheelFinanceLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.saLoginLogo} />
          <View style={styles.saLoginBottom}>
          <View style={[styles.saLoginCard, SA_GLASS]}>
            <View style={{ gap: 8 }}>
              <Text style={styles.saLoginTitle}>Enter your number</Text>
              <Text style={styles.saLoginSub}>To sign in or create an account</Text>
            </View>
            <View style={styles.saLoginInput}>
              <Image source={figmaImageSource('saSaudiFlag')} resizeMode="cover" accessibilityIgnoresInvertColors style={{ width: 24, height: 24, borderRadius: 12 }} />
              <View style={styles.saLoginDivider} />
              <TextInput
                value={num}
                onChangeText={(t) => setNum(t.replace(/[^0-9 ]/g, '').slice(0, 12))}
                placeholder="05_  _ _ _ _  _ _ _"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                style={styles.saLoginInputText}
                accessibilityLabel="Mobile number"
              />
            </View>
            <Pressable disabled={!valid} onPress={onContinue} style={[styles.saAuthBtn, valid && styles.saAuthBtnActive]} accessibilityRole="button">
              <Text style={[styles.saAuthBtnText, valid && styles.saAuthBtnTextActive]}>Continue</Text>
            </Pressable>
          </View>
          <Text style={styles.saLoginFooter}>Tas'heel Finance is regulated by the Saudi Central Bank{'\n'}and is fully Sharia-compliant.</Text>
          </View>
        </View>
      </View>
      </ScreenFade>
    </SaViewportScreen>
  );
}

// OTP — 4-digit verification (Figma 2761:29373).
function SaOtp({ setRoute, phone }: { setRoute: (r: RouteKey) => void; phone: string }) {
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(90);
  const inputRef = useRef<TextInput>(null);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const d = phone.replace(/\D/g, '').slice(-9);
  const formatted = d.length >= 9 ? `+966 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : '+966 50 327 3456';
  const valid = code.length === 4;
  const timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const designH = useDeviceScreenHeight();
  return (
    <SaViewportScreen bg="#f9fafb">
      <ScreenFade>
      <View style={[styles.saOtpScreen, SHOW_FAKE_CHROME ? { height: designH } : { flex: 1 }]}>
        <StatusStrip />
        <View style={styles.saOtpBackRow}>
          <Pressable onPress={() => setRoute('saLogin')} style={styles.saOtpBack} accessibilityRole="button" accessibilityLabel="Back">
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M15 5.5 8.5 12l6.5 6.5" fill="none" stroke="#030712" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
        </View>
        <View style={styles.saOtpBody}>
          <View style={styles.saOtpCard}>
            <View style={{ gap: 8 }}>
              <Text style={styles.saOtpTitle}>Enter the 4-digit code</Text>
              <View style={styles.saOtpSubRow}>
                <Text style={styles.saOtpSub}>sent to you at {formatted}.</Text>
                <Pressable onPress={() => setRoute('saLogin')} style={styles.saOtpEdit} accessibilityRole="button"><Text style={styles.saOtpEditText}>Edit</Text></Pressable>
              </View>
            </View>
            <View>
              <Pressable style={styles.saOtpBoxes} onPress={() => inputRef.current?.focus()}>
                {[0, 1, 2, 3].map((i) => {
                  const active = i === code.length;
                  const filled = i < code.length;
                  return (
                    <View key={i} style={[styles.saOtpBox, active && styles.saOtpBoxActive, filled && styles.saOtpBoxFilled]}>
                      <Text style={styles.saOtpDigit}>{code[i] || (active ? '|' : '')}</Text>
                    </View>
                  );
                })}
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus
                  style={styles.saOtpHiddenInput}
                  accessibilityLabel="Verification code"
                />
              </Pressable>
              <View style={styles.saOtpTimerRow}>
                <Image source={figmaImageSource('saClockIcon')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 16, height: 16, tintColor: '#4b5563' }} />
                <Text style={styles.saOtpTimer}>{timer}</Text>
              </View>
              <Pressable disabled={!valid} onPress={() => setRoute('superHome')} style={[styles.saAuthBtn, valid && styles.saAuthBtnActive]} accessibilityRole="button">
                <Text style={[styles.saAuthBtnText, valid && styles.saAuthBtnTextActive]}>Confirm OTP</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={() => setRoute('saLogin')} style={styles.saOtpDiff} accessibilityRole="button">
            <Text style={styles.saOtpDiffText}>Not your number? <Text style={styles.saOtpDiffLink}>Use a different one</Text></Text>
          </Pressable>
        </View>
      </View>
      </ScreenFade>
    </SaViewportScreen>
  );
}

// Clean add-card screen for the homepage flow — viewport-aware (button stays visible above
// the keyboard, disabled until the card is valid). Replaces the old animated AddCard sheet.
function SaAddCard({ setRoute, amount, onCardSubmit }: { setRoute: (r: RouteKey) => void; amount: number; onCardSubmit: (last4: string) => void }) {
  const [form, setForm] = useState<AddCardFormState>({ cardNumber: '', expiry: '', cvv: '' });
  const [activeField, setActiveField] = useState<AddCardFieldKey>('cardNumber');
  const complete = isAddCardComplete(form);
  const changeField = (key: AddCardFieldKey, value: string) => setForm((prev) => {
    if (key === 'cardNumber') return { ...prev, cardNumber: formatCardNumber(value) };
    if (key === 'expiry') return { ...prev, expiry: formatExpiry(value) };
    return { ...prev, cvv: value.replace(/\D/g, '').slice(0, 3) };
  });
  const submit = () => { if (!complete) return; onCardSubmit(form.cardNumber.replace(/\D/g, '').slice(-4)); setRoute('otp'); };
  return (
    <SaViewportScreen bg="#f9fafb">
      <ScreenFade>
      <View style={styles.saAddCardScreen}>
        <View style={styles.saAddCardBackRow}>
          <Pressable onPress={() => setRoute('superHome')} style={styles.saOtpBack} accessibilityRole="button" accessibilityLabel="Back">
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M15 5.5 8.5 12l6.5 6.5" fill="none" stroke="#030712" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
        </View>
        <View style={styles.saAddCardBody}>
          <Text style={styles.saAddCardTitle}>Add new card</Text>
          <CardInputField fieldKey="cardNumber" label="Card Number" value={form.cardNumber} placeholder="1234 5678 9012 3456" active={activeField === 'cardNumber'} onFocus={setActiveField} onChangeText={changeField} />
          <View style={styles.addCardSheetRow}>
            <CardInputField fieldKey="expiry" half label="Expiry Date" value={form.expiry} placeholder="MM/YY" active={activeField === 'expiry'} onFocus={setActiveField} onChangeText={changeField} />
            <CardInputField fieldKey="cvv" half label="CVV" value={form.cvv} placeholder="CVV" icon="info" active={activeField === 'cvv'} onFocus={setActiveField} onChangeText={changeField} />
          </View>
          <View style={styles.addCardSheetReview}>
            <View style={styles.reviewLine}><Text style={styles.addCardReviewLabel}>Processing fee</Text><Text style={styles.addCardFreeText}>Free</Text></View>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewLine}><Text style={styles.addCardReviewLabel}>Amount to pay</Text><Money amount={formatAmount(amount)} size={16} /></View>
          </View>
        </View>
        <View style={styles.saAddCardFooter}>
          <Pressable testID="sa-add-card-submit" disabled={!complete} onPress={submit} style={[styles.saAddCardBtn, complete && styles.saAuthBtnActive]} accessibilityRole="button" accessibilityState={{ disabled: !complete }}>
            <Text style={[styles.saAuthBtnText, complete && styles.saAuthBtnTextActive]}>Add card and pay </Text>
            <Money amount={formatAmount(amount)} size={17} color={complete ? neon : muted} />
          </Pressable>
        </View>
      </View>
      </ScreenFade>
    </SaViewportScreen>
  );
}

type HeroAd = { key: string; photo: FigmaImageKey; logo?: FigmaImageKey; lw?: number; lh?: number; title: string; sub: string; cta: string };
const HERO_ADS: HeroAd[] = [
  { key: 'fitbit', photo: 'saHeroFitbit', title: 'Light as Air.', sub: 'Strong on Health', cta: 'Shop Now' },
  { key: 'bogo', photo: 'saDlBogoBg', title: 'Buy one, get one free', sub: 'On the Samsung S26 family', cta: 'Shop Now' },
  { key: 'zara', photo: 'saDlCashbackBg', title: 'New season is in', sub: 'Shop ZARA now, pay later', cta: 'Shop Now' },
  { key: 'ps5', photo: 'saElPs5Bg', title: 'PlayStation 5', sub: 'Split it over 4 months, 0% fees', cta: 'Shop Now' },
];

function SaHeroSlide({ ad, width }: { ad: HeroAd; width: number }) {
  return (
    <ImageBackground source={figmaImageSource(ad.photo)} resizeMode="cover" style={{ width, height: '100%' }}>
      {!ad.logo ? <View style={styles.saHeroScrim} pointerEvents="none" /> : null}
      <View style={styles.saHeroCenter}>
        <View style={styles.saHeroContent}>
          <View style={styles.saPromotedPill}><Text style={styles.saPromotedText}>Promoted</Text></View>
          {ad.logo ? (
            <View style={styles.saFitbitCircle}>
              <Image source={figmaImageSource(ad.logo)} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: ad.lw, height: ad.lh }} />
            </View>
          ) : null}
          <View style={styles.saHeroTextWrap}>
            <Text style={styles.saHeroTitle}>{ad.title}</Text>
            <Text style={styles.saHeroSub}>{ad.sub}</Text>
          </View>
          <SaGlassButton label={ad.cta} style={{ alignSelf: 'center' }} />
        </View>
      </View>
    </ImageBackground>
  );
}

// Payment-method action sheet shown as an overlay over the homepage (no route change).
function SaPaymentSheet({ amount, method, setMethod, setRoute, onClose }: { amount: number; method: PayMethod; setMethod: (m: PayMethod) => void; setRoute: (r: RouteKey) => void; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const sheetMotion = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState(false);
  useEffect(() => {
    Animated.timing(sheetMotion, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [sheetMotion]);
  const close = () => {
    Animated.timing(sheetMotion, { toValue: 0, duration: 190, useNativeDriver: true }).start(() => onClose());
  };
  const pick = (m: PayMethod) => { setMethod(m); setSelected(true); };
  const methodLabel = method === 'apple' ? 'Apple Pay' : 'Debit Card •••• 4521';
  const canPay = amount > 0 && selected;
  const content = (
    <>
      <Animated.View style={[styles.paymentScrimAnimated, { opacity: sheetMotion.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close payment method sheet" onPress={close} style={styles.scrim} />
      </Animated.View>
      <Animated.View testID="payment-method-sheet" style={[styles.paymentSheet, { opacity: sheetMotion.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 1, 1] }), transform: [{ translateY: sheetMotion.interpolate({ inputRange: [0, 1], outputRange: [440, 0] }) }] }]}>
        <View style={styles.sheetGrabber} />
        <Text style={styles.sheetTitle}>Select payment method</Text>
        <View style={styles.paymentRowsCard}>
          <PaymentRow title="Debit Card" sub="Debit · ••••4521" icon="card" selected={selected && method === 'card'} onPress={() => pick('card')} />
          <PaymentRow title="Apple Pay" icon="apple" selected={selected && method === 'apple'} onPress={() => pick('apple')} />
          <PaymentRow title="Add new card" icon="add" selected={false} onPress={() => setRoute('saAddCard')} />
        </View>
        <PaymentReviewCard amount={amount} method={selected ? methodLabel : ''} />
        <Pressable testID="sa-pay-cta" disabled={!canPay} style={[styles.duesCtaInline, !canPay && styles.disabledCta]} onPress={() => {
          if (!canPay) return;
          if (method === 'apple') { launchNativeApplePay(amount, () => setRoute('processing')); return; }
          setRoute('otp');
        }} accessibilityRole="button" accessibilityLabel="Pay with selected method">
          <Text style={[styles.ctaText, !canPay && styles.disabledCtaText]}>{amount === 0 ? 'Select dues to pay' : 'Pay'}</Text><View style={{ width: 6 }} /><Riyal size={13} color={canPay ? neon : muted} /><Text style={[styles.ctaText, !canPay && styles.disabledCtaText]}>{formatAmount(amount)}</Text>
        </Pressable>
        <HomeIndicator />
      </Animated.View>
    </>
  );
  // Pin to the visible viewport over the (scrolling) homepage, on device and desktop.
  // The portal must be INTERACTIVE (pointerEvents auto) — ViewportLayer sets none, which
  // makes the scrim + buttons untappable on a real phone.
  if (typeof document === 'undefined') return content;
  if (SHOW_FAKE_CHROME) {
    return createPortal(
      createElement('div', { style: { position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 402, zIndex: 1000 } }, content),
      document.body,
    );
  }
  return createPortal(
    createElement('div', { style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, zoom: width / 402, pointerEvents: 'auto' } }, content),
    document.body,
  );
}

function SuperHome({ setRoute, method, setMethod }: { setRoute: (r: RouteKey) => void; method: PayMethod; setMethod: (m: PayMethod) => void }) {
  const [activeTab, setActiveTab] = useState('Explore');
  const [searchOpen, setSearchOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const heroScrollRef = useRef<ScrollView>(null);
  const [heroW, setHeroW] = useState(0);
  const [adIndex, setAdIndex] = useState(0);
  useEffect(() => {
    if (!heroW) return;
    const t = setInterval(() => {
      setAdIndex((prev) => {
        const next = (prev + 1) % HERO_ADS.length;
        heroScrollRef.current?.scrollTo({ x: next * heroW, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [heroW]);
  const stores: Array<[FigmaImageKey, string, string | undefined]> = [
    ['saStExtra', 'Extra', '#ffffff'],
    ['saStApple', 'Apple', '#ffffff'],
    ['saStJordan', 'Air Jordan', '#ec1f26'],
    ['saStNamshi', 'Namshi', '#ffffff'],
    ['saStZara', 'Zara', '#ffffff'],
  ];
  const categories: Array<[FigmaImageKey, string]> = [
    ['saCatPopular', 'Popular'], ['saCatFashion', 'Fashion'],
    ['saCatHome', 'Home'], ['saCatElectronics', 'Electronics'],
    ['saCatTravel', 'Travel'], ['saCatLuxury', 'Luxury'],
    ['saCatBeauty', 'Beauty'], ['saCatSports', 'Sports'],
  ];
  return (
    <AppShell>
      <View testID="superapp-home" style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
        {/* HERO — promoted Fitbit ad, with header + status overlaid */}
        <View style={styles.saHero} onLayout={(e) => setHeroW(e.nativeEvent.layout.width)}>
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            scrollEventThrottle={16}
            onScroll={(e) => setAdIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, heroW)))}
            onMomentumScrollEnd={(e) => setAdIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, heroW)))}
          >
            {heroW > 0 ? HERO_ADS.map((ad) => <SaHeroSlide key={ad.key} ad={ad} width={heroW} />) : null}
          </ScrollView>
          <View style={styles.saHeroOverlay} pointerEvents="box-none">
            <View style={styles.saStatusFloat} pointerEvents="none"><StatusStrip /></View>
            <View style={styles.saHeader} pointerEvents="none">
              <View style={styles.saHeaderLeft}>
                <Image source={figmaImageSource('saAvatar')} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.saAvatar} />
                <View>
                  <Text style={styles.saGreeting}>Good afternoon</Text>
                  <Text style={styles.saName}>Mohammed</Text>
                </View>
              </View>
              <View style={[styles.saBell, SA_GLASS]}>
                <SaIcon name="bell" color="#ffffff" size={21} />
              </View>
            </View>
          </View>
          <View style={styles.saHeroDots} pointerEvents="none">
            {HERO_ADS.map((_, i) => <View key={i} style={[styles.saDot, i === adIndex && styles.saDotActive]} />)}
          </View>
        </View>

        {/* CONTENT SHEET */}
        <View style={styles.saSheet}>
          {/* Quick nav: Pay Later / Personal Finance / Cards */}
          <View style={styles.saQuickNav}>
            {([['saQnPayLater', 'Pay Later', true], ['saQnPersonalFinance', 'Personal Finance', false], ['saQnCards', 'Cards', false]] as Array<[FigmaImageKey, string, boolean]>).map(([asset, label, active]) => (
              <View key={label} style={styles.saQuickItem}>
                <Image source={figmaImageSource(asset)} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.saQuickIcon} />
                <Text style={styles.saQuickLabel}>{label}</Text>
                {active ? <View style={styles.saQuickUnderline} /> : null}
              </View>
            ))}
          </View>

          {/* Upcoming payment card */}
          <View style={styles.saLimitCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saLimitLabel}>Your upcoming Payment</Text>
              <View style={styles.saAmountRow}>
                <Image source={figmaImageSource('saRiyal')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.saRiyalGlyph} />
                <Text style={styles.saAmountBig}>4,250.<Text style={styles.saAmountDec}>00</Text></Text>
              </View>
              <View style={styles.saStoresStackRow}>
                <View style={styles.saStoreStack}>
                  {(['saAvA', 'saAvB', 'saAvC'] as FigmaImageKey[]).map((a, i) => (
                    <Image key={a} source={figmaImageSource(a)} resizeMode="cover" accessibilityIgnoresInvertColors style={[styles.saStackAvatar, { marginLeft: i === 0 ? 0 : -7 }]} />
                  ))}
                </View>
                <Text style={styles.saMultiStores}>Multiple Stores</Text>
              </View>
            </View>
            <View style={styles.saLimitRight}>
              <View style={styles.saDueRow}>
                <Image source={figmaImageSource('wcCalendar')} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 14, height: 14, tintColor: muted }} />
                <Text style={styles.saDueText}>Due on <Text style={{ color: '#16720b' }}>30/04/2026</Text></Text>
              </View>
              <Pressable style={styles.saPayNow} onPress={() => setPayOpen(true)} accessibilityRole="button"><Text style={styles.saPayNowText}>Pay now</Text></Pressable>
            </View>
          </View>

          {/* Promo banners carousel */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 22 }} contentContainerStyle={styles.saHScroll}>
            <View style={[styles.saBanner, { backgroundColor: '#1c66af' }]}>
              <View style={styles.saBannerContent}>
                <Image source={figmaImageSource('saBnSamsungLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.saBannerLogo} />
                <View style={{ gap: 5 }}>
                  <Text style={styles.saBannerTitleLight}>Buy one get one free</Text>
                  <Text style={styles.saBannerSubLight}>on any Samsung S26 family</Text>
                </View>
                <SaGlassButton label="Claim offer" />
              </View>
              <Image source={figmaImageSource('saBnSamsungImg')} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.saBannerImg} />
            </View>
            <View style={[styles.saBanner, { backgroundColor: '#ffffff' }]}>
              <View style={styles.saBannerContent}>
                <Image source={figmaImageSource('saBnPayLaterLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.saBannerLogo} />
                <View style={{ gap: 5 }}>
                  <Text style={styles.saBannerTitleDark}>Enjoy now and pay later</Text>
                  <Text style={styles.saBannerSubDark}>Flexible payments. Your terms.</Text>
                </View>
                <SaGlassButton label="Claim offer" />
              </View>
              <Image source={figmaImageSource('saBnPhoneImg')} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.saBannerImg} />
            </View>
            <View style={[styles.saBanner, { backgroundColor: '#8ec63f' }]}>
              <View style={styles.saBannerContent}>
                <Image source={figmaImageSource('saBnIkeaLogo')} resizeMode="contain" accessibilityIgnoresInvertColors style={[styles.saBannerLogo, { width: 50, height: 20 }]} />
                <View style={{ gap: 5 }}>
                  <Text style={styles.saBannerTitleDark}>IKEA 10th Anniversary</Text>
                  <Text style={styles.saBannerSubDark}>50% Moneyback</Text>
                </View>
                <SaGlassButton label="Claim offer" />
              </View>
              <Image source={figmaImageSource('saBnIkeaImg')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.saBannerImg} />
            </View>
          </ScrollView>

          {/* Shop at */}
          <SaSectionHeader title="Shop at" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.saHScroll}>
            {stores.map(([asset, name, bg]) => <SaStore key={name} asset={asset} name={name} bg={bg} />)}
          </ScrollView>

          {/* Deals */}
          <SaSectionHeader title="Deals" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.saHScroll}>
            <SaDealCard bg="saDlCashbackBg" logo="saDlCashbackLogo" title={<><Text style={styles.saDealTitleExp}>25%</Text> Cashback</>} />
            <SaDealCard bg="saDlBogoBg" logo="saDlBogoLogo" title={<>Buy one{'\n'}get one</>} />
            <SaDealCard bg="saDlDiscountBg" logo="saDlDiscountLogo" title={<><Text style={styles.saDealTitleExp}>15%</Text>{'\n'}Discount</>} />
          </ScrollView>

          {/* Personal Loan */}
          <View style={{ marginTop: 18 }}>
            <SaPromoBanner bg="saBlPersonalLoan" kicker="Personal Loan" title="Easy and Fast Personal Finance" height={238} />
          </View>

          {/* Electronics */}
          <SaSectionHeader title="Electronics" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.saHScroll}>
            <SaOfferCard framed bg="saElIphoneBg" logo="saElIphoneLogo" title="Get it now and pay later" sub="On all iPhone 17 family." />
            <SaOfferCard bg="saElSamsungBg" logo="saElSamsungLogo" title="20% Cashback" sub="On your first purchase at Samsung" />
            <SaOfferCard bg="saElPs5Bg" logo="saElPs5Logo" title="25% Cashback" sub="PlayStation5 Black Edition" />
          </ScrollView>

          {/* Home Appliances */}
          <SaSectionHeader title="Home Appliances" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.saHScroll}>
            <SaOfferCard framed bg="saHaTvBg" logo="saHaTvLogo" title="Get it now and pay later" sub="On QNED TV series" />
            <SaOfferCard bg="saHaSmegBg" logo="saHaSmegLogo" title="30% instant discount" sub="On all SMEG products" />
            <SaOfferCard bg="saHaDysonBg" logo="saHaDysonLogo" title="Buy one get one" sub="On all Dyson products" />
          </ScrollView>

          {/* Credit Card */}
          <View style={{ marginTop: 18 }}>
            <SaPromoBanner bg="saBlCreditCard" kicker="Credit Card" title="Unlock all the possibilities with a tap" height={230} />
          </View>

          {/* Categories */}
          <SaSectionHeader title="Categories" />
          <View style={styles.saCatGrid}>
            {categories.map(([asset, label]) => (
              <View key={label} style={styles.saCatCard}>
                <Image source={figmaImageSource(asset)} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.saCatIcon} />
                <Text style={styles.saCatLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 130 }} />
        </View>
      </View>
      <SaTabBar active={activeTab} onTab={setActiveTab} onSearch={() => setSearchOpen(true)} />
      {searchOpen ? <SaPhoneOverlay><SaSearchOverlay onClose={() => setSearchOpen(false)} /></SaPhoneOverlay> : null}
      {payOpen ? <SaPaymentSheet amount={4250} method={method} setMethod={setMethod} setRoute={setRoute} onClose={() => setPayOpen(false)} /> : null}
    </AppShell>
  );
}

function AppHome({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  return (
    <AppShell>
      <View testID="app-home" style={{ flex: 1 }}>
      <View style={{ height: 415, position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' }}>
        <HomeGradient />
        <HomeDecor />
      </View>
      <StatusStrip />
      <View style={styles.appContentNoScroll}>
        <View style={styles.homeLogoRow}><TasheelMark size={44} /></View>
        <Text style={styles.nextPaymentLabel}>Your Next Payment</Text>
        <View style={styles.payRow}>
          <Money amount="4,250" decimals=".00" size={32} weight="700" />
          <Pressable style={styles.payNow} onPress={() => setRoute('detail')}><Text style={styles.payNowText}>Pay now</Text></Pressable>
        </View>
        <Text style={styles.dueText}>Jarir Store · due Apr 21</Text>
        <View style={styles.actionsRow}>
          <ActionTile label="My Dues" asset="homeDuesIcon" testID="home-action-dues" onPress={() => setRoute('dues')} />
          <ActionTile label="My Purchases" asset="homePurchasesIcon" testID="home-action-purchases" onPress={() => setRoute('purchases')} />
          <ActionTile label="My Insights" asset="homeInsightsIcon" testID="home-action-insights" onPress={() => setRoute('insights')} />
        </View>
        <SectionHeader title="Active Purchases" onPress={() => setRoute('purchases')} />
        <Pressable style={styles.homeCard} onPress={() => setRoute('detail')}>
          <CardTop kind="extra" title="Extrastores" sub="Feb 5" status="Active" />
          <Installment amount="450" text="1 of 3 installments paid" value={1 / 3} />
        </Pressable>
        <SectionHeader title="Next up" onPress={() => setRoute('dues')} />
        <View style={styles.nextCard}>
          <NextRow kind="extra" name="Extrastores" when="Tomorrow" amount="343.12" live />
          <Divider />
          <NextRow kind="jarir" name="Jarir Bookstore" when="In 6 days - April 20th" amount="250.50" />
          <Divider />
          <NextRow kind="noon" name="Noon" when="In 17 days - May 15th" amount="123.24" />
        </View>
      </View>
      <BottomNav setRoute={setRoute} />
      <View style={styles.homeIndicatorFloat} pointerEvents="none"><HomeIndicator /></View>
      </View>
    </AppShell>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitleSmall}>{title}</Text>
      <Pressable onPress={onPress}><Text style={styles.viewMore}>View More ›</Text></Pressable>
    </View>
  );
}

function CardTop({ kind, title, sub, status }: { kind: Merchant; title: string; sub: string; status?: string }) {
  return (
    <View style={styles.cardTop}>
      <MerchantBadge kind={kind} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
      {status ? <Text style={styles.statusText}>{status}</Text> : null}
    </View>
  );
}

function Installment({ text: label, amount, value, segments = 3 }: { text: string; amount: string; value: number; segments?: number }) {
  return (
    <>
      <View style={styles.installmentRow}>
        <Text style={styles.installText}>{label}</Text>
        <View style={styles.amountMonthly}>
          <Money amount={`${amount}.`} size={16} />
          <Text style={styles.mo}>00/mo</Text>
        </View>
      </View>
      <Progress value={value} segments={segments} />
    </>
  );
}

function NextRow({ kind, name, when, amount, live }: { kind: Merchant; name: string; when: string; amount: string; live?: boolean }) {
  return (
    <View style={styles.nextRow}>
      <View>
        <MerchantBadge kind={kind} size={34} />
        {live ? <View style={styles.liveDot} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nextName}>{name}</Text>
        <Text style={[styles.nextWhen, live && { color: '#139b34', fontWeight: '600' }]}>{when}</Text>
      </View>
      <Money amount={amount} size={16} />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ---------------------------------------------------------------------------
// Transaction detail (Figma 1966:34633)
// ---------------------------------------------------------------------------
function Detail({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  const rows: Array<[string, string, 'plain' | 'money' | 'paid' | 'remaining']> = [
    ['Total Amount', '3,666', 'money'],
    ['Monthly Payment', '916.50', 'money'],
    ['Installments', '4 Installments', 'plain'],
    ['Next Due Date', 'May 15th', 'plain'],
    ['Monthly Payment', '916.50', 'money'],
    ['Total Paid', '916.50', 'paid'],
    ['Remaining', '2,750', 'remaining'],
    ['Reference', 'TXN-2026-04152', 'plain'],
  ];
  const schedule = [
    ['May 15th', 'Due in 8 days', '916.50', true],
    ['June 15th', 'Due in 35 days', '916.50', false],
    ['July 15th', 'Due in 35 days', '916.50', false],
    ['August 15', 'Due in 35 days', '916.50', false],
  ] as const;
  return (
    <AppShell scroll={false}>
      <View testID="transaction-details-1966-34633" style={styles.transactionScreen1966}>
        <ScrollView
          testID="transaction-scroll-1966-34633"
          style={styles.transactionScroll}
          contentContainerStyle={styles.transactionScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.transactionCanvas1966}>
            <StatusStrip />
            <View testID="transaction-header-1966" pointerEvents="box-none" style={styles.transactionStickyHeader1966}>
              <RoundButton glyph="‹" label="Back" onPress={() => setRoute('superHome')} />
              <View style={{ width: 50 }} />
            </View>
            <View testID="transaction-hero-1966-34923" style={styles.transactionHero1966}>
              <View style={styles.transactionHeroContent1966}>
                <View style={styles.transactionHeroRow1966}>
                  <View style={styles.transactionHeroLeft1966}>
                    <MerchantBadge kind="extra" size={55} testID="transaction-merchant-logo" />
                    <View style={styles.transactionMerchantBlock1966}>
                      <Text testID="transaction-merchant-name" style={styles.transactionMerchant1966}>Extrastores</Text>
                      <Text style={styles.transactionDate1966}>25th of April, 2026</Text>
                    </View>
                  </View>
                  <View style={styles.transactionHeroRight1966}>
                    <Text style={styles.transactionStatus1966}>Active</Text>
                    <Money amount="3,666" decimals=".00" size={22} weight="600" />
                  </View>
                </View>
                <View testID="transaction-progress-1966" style={styles.transactionProgressTrack1966}>
                  <View style={styles.transactionProgressFill1966} />
                </View>
                <View style={styles.transactionProgressMeta1966}>
                  <View>
                    <Text style={styles.transactionMetaLabel1966}>1 Paid</Text>
                    <Money amount="916.50" size={17} weight="600" />
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.transactionMetaLabel1966}>3 Remaining</Text>
                    <Money amount="2,750" size={17} weight="600" />
                  </View>
                </View>
              </View>
            </View>

            <View testID="transaction-schedule-section" style={styles.transactionScheduleSection1966}>
              <Text style={styles.transactionSectionTitle1966}>Payment Schedule</Text>
              <View style={styles.transactionScheduleCard1966}>
                {schedule.map(([date, note, amt, isNext], i) => (
                  <View key={`${date}-${i}`} style={[styles.transactionScheduleRow1966, { height: isNext ? 47 : i < schedule.length - 1 ? 59 : 39 }]}>
                    <View style={styles.transactionScheduleLeft1966}>
                      {isNext ? (
                        <View style={styles.transactionNextRail1966}>
                          <Text style={styles.transactionNextPill1966}>Next</Text>
                          <View style={styles.transactionNextLine1966} />
                        </View>
                      ) : (
                        <View style={styles.transactionFutureRail1966}>
                          <View style={styles.transactionFutureLine1966} />
                          <View style={styles.transactionFutureDot1966} />
                          {i < schedule.length - 1 ? <View style={styles.transactionFutureLine1966} /> : null}
                        </View>
                      )}
                      <View style={styles.transactionScheduleText1966}>
                        <Text style={[styles.transactionScheduleDate1966, isNext && styles.transactionScheduleDateNext1966]}>{date}</Text>
                        <Text style={[styles.transactionScheduleNote1966, isNext && styles.transactionScheduleNoteNext1966]}>{note}</Text>
                      </View>
                    </View>
                    <Money amount={amt} size={16} weight="600" />
                  </View>
                ))}
              </View>
            </View>

            <View testID="transaction-purchase-details-section" style={styles.transactionDetailsSection1966}>
              <Text style={styles.transactionSectionTitle1966}>Purchase Details</Text>
              <View style={styles.transactionDetailsCard1966}>
                {rows.map(([label, value, kind], i) => (
                  <View key={`${label}-${i}`} style={[styles.transactionDetailsRow1966, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.transactionDetailsLabel1966, ['Installments', 'Next Due Date', 'Reference'].includes(label) && { color: muted }]}>{label}</Text>
                    {kind === 'money' || kind === 'paid' || kind === 'remaining' ? (
                      <Money amount={value} size={16} weight="600" color={kind === 'remaining' ? '#6e0f0d' : kind === 'paid' ? '#166534' : text} />
                    ) : (
                      <Text style={styles.transactionDetailsValue1966}>{value}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
            <Pressable testID="transaction-pay-next-installment" accessibilityRole="button" accessibilityLabel="Pay next installment" style={styles.transactionCta1966} onPress={() => setRoute('paymentMethod')}>
              <Text style={styles.transactionCtaText1966}>Pay next installment</Text>
            </Pressable>
            <View style={styles.transactionHomeIndicator1966} />
          </View>
        </ScrollView>
      </View>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Insights (Figma 1579:11144)
// ---------------------------------------------------------------------------
const INSIGHT_MONTHS = [
  { key: 'Nov', label: 'November', bar: 38 },
  { key: 'Dec', label: 'December', bar: 66 },
  { key: 'Jan', label: 'January', bar: 48 },
  { key: 'Feb', label: 'February', bar: 78 },
  { key: 'Mar', label: 'March', bar: 62 },
  { key: 'Apr', label: 'April', bar: 90 },
];
// Apr (bar 90) anchors to the Figma fixture total of 4,250; other months derive
// from the same bar profile so headline, tag and category amounts stay coherent.
const monthSpend = (bar: number) => Math.round((bar * 4250) / 90 / 10) * 10;
const spendTag = (bar: number) => `${(monthSpend(bar) / 1000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}k`;

const INSIGHT_CATEGORIES = [
  { emoji: '🛍', tile: '#fab5cc', name: 'Shopping', share: 42, merchants: 'Extrastores, Noon, 2 more', aprAmount: 1800 },
  { emoji: '🖥', tile: '#c7b0f5', name: 'Electronics', share: 28, merchants: 'Jarir, 1 more', aprAmount: 1200 },
  { emoji: '📄', tile: '#b2d9f7', name: 'Bills', share: 20, merchants: 'STC, Mobily', aprAmount: 850 },
  { emoji: '✈', tile: '#fcd4a8', name: 'Travel', share: 10, merchants: 'Careem, 1 more', aprAmount: 400 },
];

function FadeSwap({ children, swapKey }: { children: React.ReactNode; swapKey: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState({ children, swapKey });
  useEffect(() => {
    if (swapKey === shown.swapKey) {
      setShown(prev => (prev.children === children ? prev : { children, swapKey }));
      return;
    }
    Animated.timing(opacity, { toValue: 0, duration: 110, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setShown({ children, swapKey });
      Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  }, [swapKey, children, shown.swapKey, opacity]);
  return <Animated.View style={{ opacity }}>{shown.children}</Animated.View>;
}

function InsightsChart({ monthIndex, onSelect }: { monthIndex: number; onSelect: (i: number) => void }) {
  const anims = useRef(INSIGHT_MONTHS.map((_, i) => new Animated.Value(i === monthIndex ? 1 : 0))).current;
  // Months after the selected one have no data yet — they collapse to stubs.
  const STUB = 22;
  const heights = useRef(INSIGHT_MONTHS.map((m, i) => new Animated.Value(i > 5 ? STUB : m.bar))).current;
  useEffect(() => {
    Animated.parallel([
      ...anims.map((a, i) => Animated.timing(a, { toValue: i === monthIndex ? 1 : 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false })),
      ...heights.map((hv, i) => Animated.timing(hv, { toValue: i > monthIndex ? STUB : INSIGHT_MONTHS[i].bar, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false })),
    ]).start();
  }, [monthIndex, anims, heights]);
  return (
    <View style={styles.chart}>
      {INSIGHT_MONTHS.map((m, i) => {
        const a = anims[i];
        const h = m.bar;
        return (
          <Pressable key={m.key} accessibilityRole="button" accessibilityLabel={`Show ${m.label} insights`} testID={`insights-bar-${m.key}`} onPress={() => onSelect(i)} style={[styles.barCol, i > monthIndex && { opacity: 0.45 }]}>
            <Animated.Text style={[styles.barValue, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>{spendTag(m.bar)}</Animated.Text>
            <Animated.View style={{ width: 18, height: heights[i], justifyContent: 'flex-end' }}>
              <Animated.View style={[styles.bar, { height: heights[i] }]} />
              <Animated.View style={{ position: 'absolute', bottom: 0, opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }}>
                <Svg width={18} height={h}>
                  <Defs>
                    <SvgLinearGradient id={`barGrad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#5ef03a" />
                      <Stop offset="1" stopColor="#0a5a2a" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="18" height={h} rx="9" fill={`url(#barGrad-${m.key})`} />
                </Svg>
              </Animated.View>
            </Animated.View>
            <View style={styles.barLabelWrap}>
              <Animated.Text style={[styles.barLabel, { opacity: a.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>{m.key}</Animated.Text>
              <Animated.Text style={[styles.barLabel, styles.barLabelActive, { opacity: a }]}>{m.key}</Animated.Text>
            </View>
            <Animated.View style={[styles.barUnderline, { opacity: a }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

function InsightsTabs({ tab, onChange }: { tab: 'Transactions' | 'Categories'; onChange: (t: 'Transactions' | 'Categories') => void }) {
  const slide = useRef(new Animated.Value(tab === 'Transactions' ? 0 : 1)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    Animated.timing(slide, { toValue: tab === 'Transactions' ? 0 : 1, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [tab, slide]);
  const pillWidth = Math.max(0, (trackWidth - 8) / 2);
  return (
    <View style={styles.insightTabs} onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}>
      {pillWidth > 0 ? (
        <Animated.View style={[styles.insightTabPill, { width: pillWidth, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, pillWidth] }) }] }]} />
      ) : null}
      {(['Transactions', 'Categories'] as const).map(item => (
        <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => onChange(item)} style={styles.insightTabWrap}>
          <Text style={tab === item ? styles.insightTabActive : styles.insightTab}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Insights({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  const [tab, setTab] = useState<'Transactions' | 'Categories'>('Transactions');
  const [monthIndex, setMonthIndex] = useState(5);
  const month = INSIGHT_MONTHS[monthIndex];
  const spend = monthSpend(month.bar);
  const scaleByMonth = (aprAmount: number) => Math.round((aprAmount * spend) / 4250 / 10) * 10;
  return (
    <AppShell>
      <StatusStrip />
      <View style={styles.appContent}>
        <View style={styles.headerRow}>
          <RoundButton glyph="‹" label="Back" onPress={() => setRoute('superHome')} />
          <Text style={styles.centerTitle}>Insights</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Change month" style={styles.monthPill} onPress={() => setMonthIndex((monthIndex + 5) % INSIGHT_MONTHS.length)}><Text style={styles.monthText}>⌄ {month.label}</Text></Pressable>
        </View>
        <Text style={styles.insightLabel}>{`Spent in ${month.label}`}</Text>
        <FadeSwap swapKey={`amount-${monthIndex}`}>
          <Money amount={formatAmount(spend)} decimals=".00" size={32} weight="700" />
        </FadeSwap>
        <InsightsChart monthIndex={monthIndex} onSelect={setMonthIndex} />
        <InsightsTabs tab={tab} onChange={setTab} />
        <FadeSwap swapKey={`list-${tab}-${monthIndex}`}>
          <View style={styles.transactionList}>
            {tab === 'Transactions' ? (
              <>
                <Tx kind="extra" name="Extrastores" date={`${month.key} 15th · Paid`} amount={formatAmount(Math.round(monthSpend(month.bar) * 0.42))} />
                <Tx kind="jarir" name="Jarir" date={`${month.key} 20th · Paid`} amount={formatAmount(Math.round(monthSpend(month.bar) * 0.28))} />
                <Tx kind="jarir" name="Jarir" date={`${month.key} 8th · Paid`} amount={formatAmount(Math.round(monthSpend(month.bar) * 0.2))} />
                <Tx kind="noon" name="Noon" date={`${month.key} 3rd · Paid`} amount={formatAmount(Math.round(monthSpend(month.bar) * 0.1))} />
              </>
            ) : (
              INSIGHT_CATEGORIES.map(cat => (
                <CategoryRow key={cat.name} emoji={cat.emoji} tile={cat.tile} label={cat.name} sub={`${cat.share}% · ${cat.merchants}`} amount={formatAmount(scaleByMonth(cat.aprAmount))} />
              ))
            )}
          </View>
        </FadeSwap>
        <HomeIndicator />
      </View>
    </AppShell>
  );
}

// Figma 1579:10592 category row: emoji in a colored 40px tile, share/merchant
// sub-line, amount + chevron. No progress bars in the source.
function CategoryRow({ emoji, tile, label, sub, amount }: { emoji: string; tile: string; label: string; sub: string; amount: string }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.txRow, pressed && { opacity: 0.65 }]}>
      <View style={[styles.categoryTile, { backgroundColor: tile }]}><Text style={styles.categoryEmoji}>{emoji}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.categorySub}>{sub}</Text>
      </View>
      <Money amount={amount} size={16} />
      <Text style={styles.categoryChevron}>›</Text>
    </Pressable>
  );
}

function Tx({ kind, name, date, amount = '600' }: { kind: Merchant; name: string; date: string; amount?: string }) {
  return (
    <View style={styles.txRow}>
      <MerchantBadge kind={kind} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.cardSub}>{date}</Text>
      </View>
      <Money amount={amount} size={16} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// My Purchases (Figma 814:24392)
// ---------------------------------------------------------------------------
const purchases = [
  ['extra', 'Extrastores', 'Samsung Galaxy S26', '1', '3', '450', 'Active'],
  ['jarir', 'Jarir Bookstore', 'MacBook Air M4', '2', '4', '720', 'Active'],
  ['noon', 'Noon', 'AirPods Pro 3', '1', '3', '320', 'Active'],
  ['extra', 'Extrastores', 'Dyson V15 Vacuum', '3', '3', '450', 'Completed'],
] as const;

function Purchases({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  const [tab, setTab] = useState('All');
  const filtered = purchases.filter((p) => tab === 'All' || p[6] === tab);
  return (
    <AppShell>
      <StatusStrip />
      <View style={styles.appContent}>
        <Header title="My Purchases" subtitle="View all your purchases" showLogo rightClose onBack={() => setRoute('superHome')} onClose={() => setRoute('superHome')} />
        <SegTabs value={tab} onChange={setTab} />
        <View style={styles.purchaseList}>
          {filtered.map(([kind, name, product, paid, count, amount, status], i) => (
            <Pressable key={`${name}-${product}-${i}`} style={styles.purchaseCard} onPress={() => setRoute('detail')}>
              <CardTop kind={kind} title={name} sub={product} status={status} />
              <Installment text={`${paid} of ${count} installments paid`} amount={amount} value={Number(paid) / Number(count)} segments={Number(count)} />
            </Pressable>
          ))}
        </View>
        <HomeIndicator />
      </View>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// My Dues (Figma 1843:17915)
// ---------------------------------------------------------------------------
// DuesRing — dynamic SVG (one due = one quarter segment, clockwise from 12
// o'clock). Geometry per the Figma sandbox: 320x285 box, center (160,142.5),
// radius 126, stroke 31; boundary dots sit exactly on the ring path.
function DuesRing({ summary, totalAmount, secondaryText }: { summary: Pick<DuesSummary, 'selectedCount' | 'selectedAmount' | 'remainingVisibleAmount' | 'totalAmount'>; totalAmount?: number; secondaryText?: string }) {
  const caption = `${summary.selectedCount} Due${summary.selectedCount === 1 ? '' : 's'} Selected`;
  const secondary = secondaryText ?? `Remaining ${formatAmount(summary.remainingVisibleAmount)}`;
  const cx = 160;
  const cy = 142.5;
  const r = 126;
  const stroke = 31;
  const segments = Math.max(0, Math.min(4, summary.selectedCount));
  const sweep = (segments / 4) * 360;
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180; // 0deg = 12 o'clock, clockwise
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arcPath = (deg: number) => {
    if (deg <= 0) return '';
    const end = toXY(Math.min(deg, 359.999));
    const startPt = toXY(0);
    const large = deg > 180 ? 1 : 0;
    return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  };
  const lead = toXY(sweep);
  const boundaryAngles = [0, 90, 180, 270];
  return (
    <View testID="dues-ring" style={{ width: 320, height: 285 }} pointerEvents="none">
      <Svg width={320} height={285}>
        <Defs>
          <SvgLinearGradient id="duesArc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0b4f23" />
            <Stop offset="0.55" stopColor="#2bb318" />
            <Stop offset="1" stopColor="#52e500" />
          </SvgLinearGradient>
          <SvgLinearGradient id="duesTrack" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#eef0f2" />
            <Stop offset="1" stopColor="#e3e6e9" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={r} stroke="url(#duesTrack)" strokeWidth={stroke} fill="none" />
        {sweep > 0 ? <Path d={arcPath(sweep)} stroke="url(#duesArc)" strokeWidth={stroke} strokeLinecap="round" fill="none" /> : null}
        {boundaryAngles.map(a => {
          const p = toXY(a);
          return <Circle key={`dot-${a}`} cx={p.x} cy={p.y} r={12} fill="#f6f7f8" stroke="#e2e5e8" strokeWidth={1} />;
        })}
        {sweep > 0 ? (
          <>
            <Circle cx={lead.x} cy={lead.y} r={20} fill="#3ddd00" opacity={0.22} />
            <Circle cx={lead.x} cy={lead.y} r={12.5} fill="#3ddd00" />
            <Circle cx={lead.x - 3} cy={lead.y - 3.5} r={4} fill="#8dff57" opacity={0.85} />
          </>
        ) : null}
      </Svg>
      <View style={{ position: 'absolute', left: 92, top: 96, width: 137, alignItems: 'center' }}>
        <Text style={styles.ringCaption}>{caption}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Riyal size={19} />
          <Text style={styles.ringAmount}>{formatAmount(summary.selectedAmount)}</Text>
        </View>
        <Text style={styles.ringSecondary}>{secondary}</Text>
      </View>
    </View>
  );
}

function DuesHeader({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  return (
    <View style={styles.duesHeader1843}>
      <RoundButton glyph="‹" label="Back" onPress={() => setRoute('superHome')} />
    </View>
  );
}

function DueRow({ item, selected, testID, onPress }: { item: DueItem; selected?: boolean; testID?: string; onPress?: () => void }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${item.name} ${item.product} ${item.when} ${formatAmount(item.amount)} ${item.installmentLabel}`} accessibilityState={{ selected: !!selected }} onPress={onPress} style={({ pressed }) => [styles.dueRow, selected && styles.dueRowSelected, pressed && styles.pressed]}>
      <MerchantBadge kind={item.kind} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>{item.product} · {item.when}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Money amount={formatAmount(item.amount)} size={17} weight="600" />
        <Text style={[styles.cardSub, { marginTop: 3 }]}>{item.installmentLabel}</Text>
      </View>
    </Pressable>
  );
}

function Dues({ items, summary, selectedIds, setSelectedIds, setRoute }: { items: DueItem[]; summary: DuesSummary; selectedIds: Set<string>; setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>; setRoute: (r: RouteKey) => void }) {
  const ordered = sortedDues(items);
  const visibleDues = ordered.slice(0, VISIBLE_DUES_COUNT);
  const [showAllDues, setShowAllDues] = useState(false);
  const toggleDue = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const secondaryText = summary.selectedAmount > summary.visibleTotal ? `Selected from ${summary.totalCount} payments` : `Remaining ${formatAmount(summary.remainingVisibleAmount)}`;
  return (
    <AppShell scroll={false}>
      <StatusStrip />
      <View testID="my-dues-1843-17915" style={styles.duesFrame1843}>
        <DuesHeader setRoute={setRoute} />
        <View style={styles.ringWrap1843}><DuesRing summary={summary} totalAmount={summary.visibleTotal} secondaryText={secondaryText} /></View>
        <View style={styles.duesList}>
          {visibleDues.map((d, i) => (
            <DueRow key={d.id} testID={`due-row-${i}`} item={d} selected={selectedIds.has(d.id)} onPress={() => toggleDue(d.id)} />
          ))}
        </View>
        {summary.hiddenCount > 0 ? (
          <View style={styles.moreRow}>
            <Text style={styles.cardSub}>+{summary.hiddenCount} More next up payments</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="View all next-up payments" onPress={() => setShowAllDues(true)} style={styles.viewAllPill}>
              <Text style={styles.viewAllDark}>View all</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M9 5.5L15.5 12L9 18.5" fill="none" stroke={text} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
            </Pressable>
          </View>
        ) : null}
        <ViewportLayer>
        <View style={styles.duesCtaBackdrop} pointerEvents="none" />
        <Pressable testID="pay-selected-dues" disabled={summary.selectedAmount === 0} style={[styles.duesCtaPinned, summary.selectedAmount === 0 && styles.disabledCta]} onPress={() => summary.selectedAmount > 0 && setRoute('paymentMethod')} accessibilityRole="button" accessibilityLabel="Pay selected dues">
          <Text style={[styles.ctaText, summary.selectedAmount === 0 && styles.disabledCtaText]}>{summary.selectedAmount === 0 ? 'Select dues to pay' : 'Pay selected'}</Text>
          {summary.selectedAmount > 0 ? <><View style={{ width: 8 }} /><Riyal size={14} color={neon} weight="500" /><Text style={styles.ctaText}>{formatAmount(summary.selectedAmount)}</Text></> : null}
        </Pressable>
        </ViewportLayer>
        {showAllDues ? (
          <ViewportLayer>
          <View testID="dues-action-sheet" style={styles.duesSheetLayer}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close dues selector" onPress={() => setShowAllDues(false)} style={styles.duesSheetScrim} />
            <View style={styles.duesActionSheet}>
              <View style={styles.sheetGrabber} />
              <View style={styles.duesSheetHeaderRow}>
                <View>
                  <Text style={styles.duesSheetTitle}>Add dues to payment</Text>
                  <Text style={styles.duesSheetSub}>Choose which upcoming payments to settle now.</Text>
                </View>
                <RoundButton glyph="×" label="Close" onPress={() => setShowAllDues(false)} />
              </View>
              <ScrollView style={styles.duesSheetScroll} contentContainerStyle={styles.duesSheetList} showsVerticalScrollIndicator={false}>
                {ordered.map((d, i) => (
                  <DueRow key={`sheet-${d.id}`} testID={`due-sheet-row-${i}`} item={d} selected={selectedIds.has(d.id)} onPress={() => toggleDue(d.id)} />
                ))}
              </ScrollView>
              <Pressable testID="done-selecting-dues" disabled={summary.selectedAmount === 0} style={[styles.duesCtaInline, summary.selectedAmount === 0 && styles.disabledCta]} onPress={() => summary.selectedAmount > 0 && setShowAllDues(false)} accessibilityRole="button" accessibilityLabel="Done selecting dues">
                <Text style={[styles.ctaText, summary.selectedAmount === 0 && styles.disabledCtaText]}>{summary.selectedAmount === 0 ? 'Select at least one due' : 'Done'}</Text>
                {summary.selectedAmount > 0 ? <><View style={{ width: 8 }} /><Riyal size={14} color={neon} weight="500" /><Text style={styles.ctaText}>{formatAmount(summary.selectedAmount)}</Text></> : null}
              </Pressable>
            </View>
          </View>
          </ViewportLayer>
        ) : null}
        <FakeHomeIndicator1843 />
      </View>
    </AppShell>
  );
}

function NextUp({ items, summary, selectedIds, setSelectedIds, setRoute }: { items: DueItem[]; summary: DuesSummary; selectedIds: Set<string>; setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>; setRoute: (r: RouteKey) => void }) {
  const rows = sortedDues(items);
  const toggle = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const secondaryText = summary.selectedAmount > summary.visibleTotal ? `Selected from ${summary.totalCount} payments` : `Remaining ${formatAmount(summary.remainingVisibleAmount)}`;
  return (
    <AppShell scroll={false}>
      <StatusStrip />
      <View testID="next-up-814-24007" style={styles.duesFrame1843}>
        <Header onBack={() => setRoute('superHome')} rightClose onClose={() => setRoute('superHome')} showLogo />
        <View style={styles.nextUpHero}>
          <DuesRing summary={summary} totalAmount={summary.visibleTotal} secondaryText={secondaryText} />
        </View>
        <ScrollView style={styles.nextUpList} contentContainerStyle={{ gap: 10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {rows.map((d, i) => <DueRow key={d.id} testID={`next-up-row-${i}`} item={d} selected={selectedIds.has(d.id)} onPress={() => toggle(d.id)} />)}
        </ScrollView>
        <View style={styles.nextUpBottomFade}>
          <Pressable testID="next-up-pay-selected" disabled={summary.selectedAmount === 0} style={[styles.duesCta, summary.selectedAmount === 0 && styles.disabledCta]} onPress={() => summary.selectedAmount > 0 && setRoute('paymentMethod')}><Text style={[styles.ctaText, summary.selectedAmount === 0 && styles.disabledCtaText]}>{summary.selectedAmount === 0 ? 'Select dues to pay' : 'Pay selected'}</Text>{summary.selectedAmount > 0 ? <><View style={{ width: 8 }} /><Riyal size={14} color={neon} /><Text style={styles.ctaText}>{formatAmount(summary.selectedAmount)}</Text></> : null}</Pressable>
          <FakeHomeIndicator1843 />
        </View>
      </View>
    </AppShell>
  );
}

function PaymentMethodIcon({ type }: { type: 'card' | 'apple' | 'add' }) {
  const asset: FigmaImageKey = type === 'apple' ? 'paymentApplePay' : type === 'add' ? 'paymentCardAddIcon' : 'paymentCardIcon';
  return (
    <View style={[styles.paymentIcon, type === 'apple' && styles.paymentIconApple]}>
      <Image source={figmaImageSource(asset)} resizeMode="contain" accessibilityIgnoresInvertColors style={type === 'apple' ? styles.applePayIcon : styles.paymentSvgIcon} />
    </View>
  );
}

function PaymentRow({ title, sub, icon, selected, onPress }: { title: string; sub?: string; icon: 'card' | 'apple' | 'add'; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable testID={`payment-row-${icon}`} onPress={onPress} style={styles.paymentRow} accessibilityRole="radio" accessibilityState={{ checked: !!selected }}>
      <PaymentMethodIcon type={icon} />
      <View style={{ flex: 1 }}><Text style={styles.paymentTitle}>{title}</Text>{sub ? <Text style={styles.paymentSub}>{sub}</Text> : null}</View>
      <Radio selected={selected} color={greenMid} />
    </Pressable>
  );
}

function PaymentReviewCard({ amount, method = 'Debit Card •••• 4521', processingLabel = 'Processing fee' }: { amount: number; method?: string; processingLabel?: string }) {
  return (
    <View testID="payment-review-card" style={styles.paymentReviewCard}>
      <View style={styles.reviewLine}><Text style={styles.tableLabel}>{processingLabel}</Text><Text style={styles.successText}>Free</Text></View>
      <View style={styles.reviewDivider} />
      <View style={styles.reviewLine}><Text style={styles.tableLabel}>Amount to pay</Text><Money amount={formatAmount(amount)} size={16} /></View>
      {method ? <><View style={styles.reviewDivider} /><View style={styles.reviewLine}><Text style={styles.tableLabel}>Method</Text><Text style={styles.tableValue}>{method}</Text></View></> : null}
    </View>
  );
}

function PaymentMethodBackdrop({ summary }: { summary: DuesSummary }) {
  const ordered = sortedDues(DUE_ITEMS);
  const visibleDues = ordered.slice(0, VISIBLE_DUES_COUNT);
  const secondaryText = summary.selectedAmount > summary.visibleTotal ? `Selected from ${summary.totalCount} payments` : `Remaining ${formatAmount(summary.remainingVisibleAmount)}`;
  return (
    <View pointerEvents="none" style={styles.paymentBackdropClean}>
      <View style={styles.paymentBackdropLogo}><TasheelMark size={26} /></View>
      <View style={styles.paymentBackdropRing}><DuesRing summary={summary} totalAmount={summary.visibleTotal} secondaryText={secondaryText} /></View>
      <View style={styles.paymentBackdropRows}>
        {visibleDues.map((d, i) => <DueRow key={`payment-bg-${d.id}`} testID={`payment-bg-due-row-${i}`} item={d} selected={i === 0} />)}
      </View>
    </View>
  );
}

function PaymentMethodScreen({ setRoute, summary, selected = false, added = false, method, setMethod }: { setRoute: (r: RouteKey) => void; summary: DuesSummary; selected?: boolean; added?: boolean; method: PayMethod; setMethod: (m: PayMethod) => void }) {
  const hasMethod = selected || added;
  const methodLabel = method === 'apple' ? 'Apple Pay' : 'Debit Card •••• 4521';
  const pickMethod = (m: PayMethod) => {
    setMethod(m);
    setRoute('paymentSelected');
  };
  const sheetMotion = useRef(new Animated.Value(0)).current;
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    Animated.timing(sheetMotion, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [sheetMotion]);

  const closeSheet = () => {
    if (closing) return;
    setClosing(true);
    Animated.timing(sheetMotion, { toValue: 0, duration: 190, useNativeDriver: true }).start(() => setRoute('superHome'));
  };

  return (
    <AppShell scroll={false}>
      <StatusStrip pointerEvents="none" />
      <View testID="payment-method-flow-816-47301" style={styles.paymentScreen}>
        <PaymentMethodBackdrop summary={summary} />
        <ViewportLayer>
        <Animated.View testID="payment-method-scrim-animated" style={[styles.paymentScrimAnimated, { opacity: sheetMotion.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}>
          <Pressable testID="payment-method-scrim" accessibilityRole="button" accessibilityLabel="Close payment method sheet" onPress={closeSheet} style={styles.scrim} />
        </Animated.View>
        <Animated.View testID="payment-method-sheet" style={[styles.paymentSheet, { opacity: sheetMotion.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 1, 1] }), transform: [{ translateY: sheetMotion.interpolate({ inputRange: [0, 1], outputRange: [440, 0] }) }] }]}>
          <View style={styles.sheetGrabber} />
          <Text style={styles.sheetTitle}>Select payment method</Text>
          <View style={styles.paymentRowsCard}>
            <PaymentRow title="Debit Card" sub="Debit · ••••4521" icon="card" selected={hasMethod && method === 'card'} onPress={() => pickMethod('card')} />
            <PaymentRow title="Apple Pay" icon="apple" selected={hasMethod && method === 'apple'} onPress={() => pickMethod('apple')} />
            <PaymentRow title="Add new card" icon="add" selected={false} onPress={() => setRoute('addCard')} />
          </View>
          <PaymentReviewCard amount={summary.selectedAmount} method={hasMethod ? methodLabel : ''} />
          <Pressable testID="payment-pay-cta" disabled={summary.selectedAmount === 0 || !hasMethod} style={[styles.duesCtaInline, (summary.selectedAmount === 0 || !hasMethod) && styles.disabledCta]} onPress={() => {
            if (summary.selectedAmount === 0) return;
            if (!hasMethod) { setRoute('paymentSelected'); return; }
            if (method === 'apple') { launchNativeApplePay(summary.selectedAmount, () => setRoute('processing')); return; }
            setRoute('otp');
          }} accessibilityRole="button" accessibilityLabel="Pay selected dues with selected payment method">
            <Text style={[styles.ctaText, (summary.selectedAmount === 0 || !hasMethod) && styles.disabledCtaText]}>{summary.selectedAmount === 0 ? 'Select dues to pay' : 'Pay'}</Text><View style={{ width: 6 }} /><Riyal size={13} color={hasMethod ? neon : muted} /><Text style={[styles.ctaText, (summary.selectedAmount === 0 || !hasMethod) && styles.disabledCtaText]}>{formatAmount(summary.selectedAmount)}</Text>
          </Pressable>
          <HomeIndicator />
        </Animated.View>
        </ViewportLayer>
      </View>
    </AppShell>
  );
}

function AddCardBackdrop({ setRoute, summary }: { setRoute: (r: RouteKey) => void; summary: DuesSummary }) {
  const ordered = sortedDues(DUE_ITEMS);
  const visibleDues = ordered.slice(0, VISIBLE_DUES_COUNT);
  const secondaryText = summary.selectedAmount > summary.visibleTotal ? `Selected from ${summary.totalCount} payments` : `Remaining ${formatAmount(summary.remainingVisibleAmount)}`;
  return (
    <>
      <DuesHeader setRoute={setRoute} />
      <View style={styles.ringWrap1843}><DuesRing summary={summary} totalAmount={summary.visibleTotal} secondaryText={secondaryText} /></View>
      <View style={styles.duesList}>
        {visibleDues.map((d, i) => <DueRow key={d.id} testID={`add-card-bg-due-row-${i}`} item={d} selected={i === 0} />)}
      </View>
      <View style={styles.moreRow}>
        <Text style={styles.cardSub}>+5 More next up payments</Text>
        <View style={styles.viewAllPill}><Text style={styles.viewAllDark}>View all</Text><Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M9 5.5L15.5 12L9 18.5" fill="none" stroke={text} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /></Svg></View>
      </View>
      <View style={styles.duesCta}><Text style={styles.ctaText}>Pay selected</Text><View style={{ width: 8 }} /><Riyal size={14} color={neon} weight="500" /><Text style={styles.ctaText}>1,800</Text></View>
      <FakeHomeIndicator1843 />
    </>
  );
}

type AddCardFieldKey = 'cardNumber' | 'expiry' | 'cvv';

type AddCardFormState = {
  cardNumber: string;
  expiry: string;
  cvv: string;
};

const formatCardNumber = (value: string) => value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};
const isAddCardComplete = (form: AddCardFormState) => form.cardNumber.replace(/\D/g, '').length === 16 && form.expiry.replace(/\D/g, '').length === 4 && form.cvv.replace(/\D/g, '').length === 3;

function CalendarGlyph({ color = '#657083' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityLabel="Calendar icon">
      <Path d="M7 3.8v3M17 3.8v3M5.4 9.2h13.2" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={4.2} y={5.6} width={15.6} height={15} rx={3.2} fill="none" stroke={color} strokeWidth={1.8} />
      <Circle cx={8} cy={12.8} r={1.05} fill={color} />
      <Circle cx={12} cy={12.8} r={1.05} fill={color} />
      <Circle cx={16} cy={12.8} r={1.05} fill={color} />
      <Circle cx={8} cy={16.5} r={1.05} fill={color} />
      <Circle cx={12} cy={16.5} r={1.05} fill={color} />
    </Svg>
  );
}

function CardInputField({ label, value, placeholder, half, icon, fieldKey, active, onFocus, onChangeText, onCalendarPress }: { label: string; value: string; placeholder: string; half?: boolean; icon?: string; fieldKey: AddCardFieldKey; active: boolean; onFocus: (key: AddCardFieldKey) => void; onChangeText: (key: AddCardFieldKey, value: string) => void; onCalendarPress?: () => void }) {
  return (
    <View style={half ? styles.addCardSheetHalfField : styles.addCardSheetField}>
      <View style={styles.addCardSheetLabelRow}><Text style={styles.addCardSheetLabel}>{label}</Text>{icon === 'info' ? <Text style={styles.addCardSheetTinyIcon}>ⓘ</Text> : null}</View>
      <View style={[styles.addCardSheetInput, active && styles.addCardSheetInputActive]}>
        <TextInput
          testID={`add-card-input-${fieldKey}`}
          value={value}
          onFocus={() => onFocus(fieldKey)}
          onChangeText={(next) => onChangeText(fieldKey, next)}
          placeholder={placeholder}
          placeholderTextColor={muted}
          keyboardType="number-pad"
          inputMode="numeric"
          style={styles.addCardSheetTextInput}
          accessibilityLabel={label}
        />
        {icon === 'calendar' ? (
          <Pressable testID="add-card-calendar-open" style={styles.addCardCalendarButton} onPress={onCalendarPress} accessibilityRole="button" accessibilityLabel="Open expiry date calendar">
            <CalendarGlyph />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ExpiryCalendarPicker({ value, onSelect, onClose }: { value: string; onSelect: (expiry: string) => void; onClose: () => void }) {
  const months = ['01', '02', '03', '04', '05', '06'];
  const selected = value || '05/29';
  return (
    <View testID="add-card-expiry-calendar" style={styles.addCardCalendarPicker}>
      <View style={styles.addCardCalendarHeader}>
        <Text style={styles.addCardCalendarTitle}>Expiry date</Text>
        <Pressable testID="add-card-calendar-close" onPress={onClose} accessibilityRole="button" accessibilityLabel="Close expiry calendar"><Text style={styles.addCardCalendarClose}>×</Text></Pressable>
      </View>
      <Text style={styles.addCardCalendarYear}>2029</Text>
      <View style={styles.addCardCalendarGrid}>
        {months.map((month) => {
          const expiry = `${month}/29`;
          const active = selected === expiry;
          return (
            <Pressable key={month} testID={`add-card-calendar-month-${month}`} style={[styles.addCardCalendarMonth, active && styles.addCardCalendarMonthActive]} onPress={() => onSelect(expiry)} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Select ${month}/29`}>
              <Text style={[styles.addCardCalendarMonthText, active && styles.addCardCalendarMonthTextActive]}>{month}/29</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AddCardSheet({ shift, amount, form, activeField, calendarOpen, onFocusField, onChangeField, onOpenCalendar, onSelectExpiry, onCloseCalendar, onClose, onSubmit }: { shift: Animated.Value; amount: string; form: AddCardFormState; activeField: AddCardFieldKey; calendarOpen: boolean; onFocusField: (key: AddCardFieldKey) => void; onChangeField: (key: AddCardFieldKey, value: string) => void; onOpenCalendar: () => void; onSelectExpiry: (expiry: string) => void; onCloseCalendar: () => void; onClose: () => void; onSubmit: () => void }) {
  const complete = isAddCardComplete(form);
  return (
    <Animated.View testID={complete ? 'add-card-sheet-filled-1986-16800' : 'add-card-sheet-empty-1966-46187'} style={[styles.addCardSheet, complete && styles.addCardSheetFilled, { transform: [{ translateY: shift }] }]}>
      <Pressable testID="add-card-grabber-close" style={styles.sheetGrabberPressable} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close add card sheet"><View style={styles.sheetGrabber} /></Pressable>
      <Text style={styles.addCardSheetTitle}>Add new card</Text>
      <View testID="add-card-fields" style={[styles.addCardSheetFields, complete && styles.addCardSheetFieldsFilled]}>
        <CardInputField fieldKey="cardNumber" label="Card Number" value={form.cardNumber} placeholder="|" active={activeField === 'cardNumber'} onFocus={onFocusField} onChangeText={onChangeField} />
        <View style={styles.addCardSheetRow}>
          <CardInputField fieldKey="expiry" half label="Expiry Date" value={form.expiry} placeholder="MM/YY" icon="calendar" active={activeField === 'expiry'} onFocus={onFocusField} onChangeText={onChangeField} onCalendarPress={onOpenCalendar} />
          <CardInputField fieldKey="cvv" half label="CVV" value={form.cvv} placeholder="CVV" icon="info" active={activeField === 'cvv'} onFocus={onFocusField} onChangeText={onChangeField} />
        </View>
      </View>
      {calendarOpen ? <ExpiryCalendarPicker value={form.expiry} onSelect={onSelectExpiry} onClose={onCloseCalendar} /> : null}
      <View testID="add-card-review" style={styles.addCardSheetReview}>
        <View style={styles.reviewLine}><Text style={styles.addCardReviewLabel}>Processing fee</Text><Text style={styles.addCardFreeText}>Free</Text></View>
        <View style={styles.reviewDivider} />
        <View style={styles.reviewLine}><Text style={styles.addCardReviewLabel}>Amount to pay</Text><Money amount={amount} size={16} /></View>
      </View>
      <Pressable testID="add-card-continue" disabled={!complete} style={[styles.addCardSheetCta, complete && styles.addCardSheetCtaFilled, !complete && styles.addCardSheetCtaDisabled]} onPress={() => complete && onSubmit()} accessibilityRole="button" accessibilityState={{ disabled: !complete }} accessibilityLabel="Add card and pay">
        <Text style={[styles.addCardCtaText, !complete && styles.addCardSheetCtaTextDisabled]}>Add card and pay</Text><Money amount={amount} size={17} color={complete ? neon : muted} />
      </Pressable>
      {complete ? <FakeHomeIndicator1843 /> : null}
    </Animated.View>
  );
}

const ADD_CARD_SHEET_SETTLE = 296; // static top jump between empty (45) and filled (341) sheet specs
const ADD_CARD_KEYBOARD_DROP = 330;

function AddCard({ setRoute, summary, filled = false, onCardSubmit }: { setRoute: (r: RouteKey) => void; summary: DuesSummary; filled?: boolean; onCardSubmit: (last4: string) => void }) {
  const [form, setForm] = useState<AddCardFormState>(() => filled ? { cardNumber: '1111 2222 3333 4444', expiry: '05/29', cvv: '123' } : { cardNumber: '', expiry: '', cvv: '' });
  const [activeField, setActiveField] = useState<AddCardFieldKey>('cardNumber');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const complete = isAddCardComplete(form);
  const [keyboardVisible, setKeyboardVisible] = useState(!complete);
  const sheetShift = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(complete ? ADD_CARD_KEYBOARD_DROP : 0)).current;
  const prevComplete = useRef(complete);
  const closeSheet = () => setRoute('superHome');
  const changeField = (key: AddCardFieldKey, value: string) => setForm(prev => {
    if (key === 'cardNumber') return { ...prev, cardNumber: formatCardNumber(value) };
    if (key === 'expiry') return { ...prev, expiry: formatExpiry(value) };
    return { ...prev, cvv: value.replace(/\D/g, '').slice(0, 3) };
  });
  const addDigit = (digit: string) => changeField(activeField, `${form[activeField]}${digit}`);
  const removeDigit = () => changeField(activeField, form[activeField].slice(0, -1));

  useEffect(() => {
    if (complete === prevComplete.current) return;
    prevComplete.current = complete;
    const ease = Easing.bezier(0.32, 0.72, 0, 1);
    if (complete) {
      // The sheet's static top jumps 45 -> 341 the moment `complete` flips, so
      // start it shifted back up by the same delta and glide sheet + keyboard
      // down together. The short delay lets the last keypress register visually.
      sheetShift.setValue(-ADD_CARD_SHEET_SETTLE);
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(sheetShift, { toValue: 0, duration: 420, easing: ease, useNativeDriver: true }),
          Animated.timing(keyboardOffset, { toValue: ADD_CARD_KEYBOARD_DROP, duration: 420, easing: ease, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) setKeyboardVisible(false); });
      }, 140);
      return () => clearTimeout(timer);
    }
    setKeyboardVisible(true);
    sheetShift.setValue(ADD_CARD_SHEET_SETTLE);
    Animated.parallel([
      Animated.timing(sheetShift, { toValue: 0, duration: 360, easing: ease, useNativeDriver: true }),
      Animated.timing(keyboardOffset, { toValue: 0, duration: 360, easing: ease, useNativeDriver: true }),
    ]).start();
  }, [complete, sheetShift, keyboardOffset]);

  const focusField = (key: AddCardFieldKey) => {
    setActiveField(key);
    if (key !== 'expiry') setCalendarOpen(false);
  };
  const openCalendar = () => {
    setActiveField('expiry');
    setCalendarOpen(true);
  };
  const selectExpiry = (expiry: string) => {
    changeField('expiry', expiry);
    setCalendarOpen(false);
  };
  const closeCalendar = () => setCalendarOpen(false);

  return (
    <AppShell scroll={false}>
      <StatusStrip pointerEvents="none" />
      <View testID="add-new-card-figma" style={styles.addCardScreenFigma}>
        <Pressable testID="add-card-scrim" style={styles.addCardScrim} onPress={closeSheet} accessibilityRole="button" accessibilityLabel="Close add card sheet" />
        <AddCardSheet shift={sheetShift} amount={formatAmount(paymentFlowAmount(summary))} form={form} activeField={activeField} calendarOpen={calendarOpen} onFocusField={focusField} onChangeField={changeField} onOpenCalendar={openCalendar} onSelectExpiry={selectExpiry} onCloseCalendar={closeCalendar} onClose={closeSheet} onSubmit={() => { onCardSubmit(form.cardNumber.replace(/\D/g, '').slice(-4)); setRoute('otp'); }} />
        {keyboardVisible && !calendarOpen ? (
          <Animated.View testID="add-card-keyboard-animated" style={[styles.addCardKeyboardAnimated, { transform: [{ translateY: keyboardOffset }] }]}>
            <IOSNumericKeyboard tall testIDPrefix="add-card-key" onDigit={addDigit} onDelete={removeDigit} />
          </Animated.View>
        ) : null}
      </View>
    </AppShell>
  );
}

function IOSNumericKeyboard({ onDigit, onDelete, tall = false, testIDPrefix = 'otp-key' }: { onDigit: (digit: string) => void; onDelete: () => void; tall?: boolean; testIDPrefix?: string }) {
  // Real devices use the actual iOS keyboard (focused TextInputs); drawing the
  // design keyboard there stacks a second keyboard under the system one.
  if (!SHOW_FAKE_CHROME) return null;
  const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']];
  return (
    <View testID="ios-numeric-keyboard" style={[styles.iosKeyboard, tall && styles.iosKeyboardTall]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.iosKeyboardRow}>
          {row.map((key, keyIndex) => key === '' ? (
            <View key={`space-${rowIndex}-${keyIndex}`} style={styles.iosKeyboardKeySpace} />
          ) : (
            <Pressable key={key} testID={key === '⌫' ? `${testIDPrefix}-delete` : `${testIDPrefix}-${key}`} style={[styles.iosKeyboardKey, key === '⌫' && styles.iosKeyboardDeleteKey]} onPress={() => key === '⌫' ? onDelete() : onDigit(key)} accessibilityRole="button" accessibilityLabel={key === '⌫' ? 'Delete digit' : `Enter ${key}`}>
              <Text style={[styles.iosKeyboardKeyText, key === '⌫' && styles.iosKeyboardDeleteText]}>{key}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      {SHOW_FAKE_CHROME ? <View style={styles.iosKeyboardHomeIndicator} /> : null}
    </View>
  );
}

function OtpScreen({ setRoute, summary, cardLast4 }: { setRoute: (r: RouteKey) => void; summary: DuesSummary; cardLast4: string }) {
  const [otp, setOtp] = useState('');
  const inputRef = useRef<TextInput>(null);
  const otpAmount = paymentFlowAmount(summary);
  const addDigit = (digit: string) => {
    inputRef.current?.focus();
    setOtp(prev => (prev + digit).slice(0, 4));
  };
  const removeDigit = () => {
    inputRef.current?.focus();
    setOtp(prev => prev.slice(0, -1));
  };
  const otpComplete = otp.length === 4;

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppShell scroll={false}>
      <StatusStrip />
      <View testID="otp-screen-814-24658" style={styles.otpScreenFigma}>
        {/* Bank 3-D Secure page bitmap (Figma image 451 in 814:24658), clipped exactly as in the source frame */}
        <View style={styles.otpBankClip} pointerEvents="none">
          <Image source={figmaImageSource('otpBankPage')} accessibilityIgnoresInvertColors style={styles.otpBankImage} resizeMode="stretch" />
        </View>
        {/* Live verification text block (Figma 814:24665) carrying the real amount + card */}
        <View testID="otp-bank-text" style={styles.otpBankTextBlock} pointerEvents="none">
          <Text style={[styles.otpBankArabic, styles.otpBankArabicBold]}>للتحقق من عملية الشراء</Text>
          <Text style={styles.otpBankArabic}>تم إرسال رمز التحقق إلى جوالكم المنتهي ب *******467,</Text>
          <Text style={styles.otpBankArabic}>{`لتأكيد الدفع إلى Tasheel Finance بمبلغ ${formatAmount(otpAmount)}.00 SAR باستخدام بطاقة ${cardLast4}************`}</Text>
        </View>

        <TextInput ref={inputRef} testID="otp-hidden-input" value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" autoFocus maxLength={4} style={styles.otpHiddenInput} />

        <Pressable testID="otp-bank-input" style={styles.otpBankInputOverlay} onPress={() => inputRef.current?.focus()} accessibilityRole="button" accessibilityLabel="Verification code">
          <Text style={styles.otpBankCodeText}>{otp}</Text>
        </Pressable>
        <Pressable testID="otp-bank-submit" disabled={!otpComplete} style={styles.otpBankSubmitOverlay} onPress={() => otpComplete && setRoute('processing')} accessibilityRole="button" accessibilityState={{ disabled: !otpComplete }} accessibilityLabel="Submit verification code" />
        <IOSNumericKeyboard onDigit={addDigit} onDelete={removeDigit} />
      </View>
    </AppShell>
  );
}

function ProcessingScreen({ setRoute, summary }: { setRoute: (r: RouteKey) => void; summary: DuesSummary }) {
  const progress = useRef(new Animated.Value(0)).current;
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 288] });
  const processingAmount = paymentFlowAmount(summary);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 720, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0.28, duration: 360, useNativeDriver: false }),
      ]),
    );
    animation.start();
    const timer = setTimeout(() => setRoute('success'), 3000);
    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [progress, setRoute]);
  return (
    <AppShell scroll={false}>
      <StatusStrip />
      <View testID="processing-buffer-814-24673" style={styles.processingScreen}>
        <View testID="processing-content-frame" style={styles.processingCenter}>
          <Image testID="processing-hourglass-asset" source={figmaImageSource('paymentHourglass')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.hourglassImage} />
          <View style={styles.processingCopyBlock}>
            <Text style={styles.statusTitle}>Authorizing payment…</Text>
            <Text style={styles.statusBody}>Don’t close this screen. We’re confirming with your bank.</Text>
          </View>
          <View testID="processing-review-card" style={styles.processingReviewCard}>
            <View style={styles.reviewLine}><Text style={styles.tableLabel}>Method</Text><Text style={styles.tableValue}>Debit Card •••• 4521</Text></View>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewLine}><Text style={styles.tableLabel}>Amount</Text><Money amount={formatAmount(processingAmount)} size={16} /></View>
          </View>
          <View testID="processing-animated-track" style={styles.bufferTrack}><Animated.View testID="processing-animated-fill" style={[styles.bufferFill, { width: progressWidth }]} /></View>
          <Pressable testID="processing-skip-success" onPress={() => setRoute('success')} style={styles.invisibleSkip} accessibilityRole="button" accessibilityLabel="Skip to payment successful" />
        </View>
        <HomeIndicator />
      </View>
    </AppShell>
  );
}

function PaymentSuccess({ setRoute, summary }: { setRoute: (r: RouteKey) => void; summary: DuesSummary }) {
  const paidIds = summary.selectedIds.size ? summary.selectedIds : paymentFixtureDueIds();
  const paidDues = sortedDues(DUE_ITEMS).filter(d => paidIds.has(d.id));
  const months: string[] = [];
  for (const item of paidDues) {
    const m = dueMonth(item);
    if (!months.includes(m)) months.push(m);
  }
  const subtitle = `${joinMonths(months)} installment${paidDues.length === 1 ? '' : 's'} paid`;
  const nextDue = sortedDues(DUE_ITEMS).find(d => !paidIds.has(d.id));
  const nextWhen = nextDue ? nextDue.when.replace(/^In/, 'Due in').replace(/\s+-\s+/, ' · ') : '';
  return (
    <AppShell scroll={false}>
      <StatusStrip />
      <View testID="payment-successful-814-24721" style={styles.successScreenFigma}>
        <View testID="success-prog-814-24726" style={styles.successProgFigma}>
          <View style={styles.successTopBlockFigma}>
            <Image testID="success-celebration-asset" source={figmaImageSource('paymentSuccessCelebration')} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.successCelebrationFigma} />
            <View style={styles.successCopyFigma}>
              <Text style={styles.successTitleFigma}>Payment successful</Text>
              <Text testID="success-subtitle" style={styles.successSubtitleFigma}>{subtitle}</Text>
            </View>
          </View>

          {nextDue ? (
            <View testID="success-next-up-card" style={styles.successNextUpCard}>
              <View style={styles.successWarningDot} />
              <View style={styles.successNextCopy}>
                <Text style={styles.successNextTitle}>Next up — {nextDue.name}</Text>
                <Text style={styles.successNextSub}>{nextWhen}</Text>
              </View>
              <Money amount={formatAmount(nextDue.amount)} size={16} />
            </View>
          ) : null}
        </View>

        <ViewportLayer>
          <Pressable testID="success-home-button" style={styles.successHomeBtnPinned} onPress={() => setRoute('superHome')} accessibilityRole="button">
            <Text style={styles.successPlayText}>Home</Text>
          </Pressable>
        </ViewportLayer>
        <FakeHomeIndicator1843 />
      </View>
    </AppShell>
  );
}

function StatusLike({ kind, title, body, cta, onPress, onBack }: { kind: string; title: string; body: string; cta: string; onPress: () => void; onBack: () => void }) {
  return (
    <AppShell scroll={false}>
      <StatusStrip />
      <View testID={`status-${kind}`} style={styles.statusScreen}>
        <Header onBack={onBack} showLogo />
        <View style={styles.statusCenter}>
          <View style={[styles.statusBadge, (kind === 'declined' || kind === 'insufficient') && styles.statusBadgeError]}><Text style={styles.statusBadgeText}>!</Text></View>
          <Text style={styles.statusTitle}>{title}</Text>
          <Text style={styles.statusBody}>{body}</Text>
        </View>
        <Pressable style={styles.duesCtaInline} onPress={onPress}><Text style={styles.ctaText}>{cta}</Text></Pressable>
      </View>
    </AppShell>
  );
}

function BottomNav({ setRoute }: { setRoute: (r: RouteKey) => void }) {
  // Figma Tab Bar instance 1885:12116 (updated) — floating frosted pill, source icons.
  // Flash Cash and Profile are out of the BNPL prototype scope: pressed feedback only.
  const items: Array<[string, FigmaImageKey, RouteKey | null, boolean]> = [
    ['Home', 'tabHome', null, false],
    ['Flash Cash', 'tabFlash', null, false],
    ['BNPL', 'tabBnpl', 'appHome', true],
    ['Profile', 'tabProfile', null, false],
  ];
  const bar = (
    <View testID="home-tab-bar" style={styles.bottomNav} pointerEvents="box-none">
      <View style={[styles.bottomNavPill, { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as object]} />
      {items.map(([label, asset, route, active]) => (
        <Pressable key={label} onPress={() => route && setRoute(route)} style={({ pressed }: { pressed: boolean }) => [styles.navItem, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={label}>
          {active ? <View style={styles.navSelection} /> : null}
          <Image source={figmaImageSource(asset)} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.navIcon} />
          <Text style={[styles.navText, label === 'Home' && styles.navTextDim, active && styles.navTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
  // Pin to the visual viewport on device (the home page scrolls under it).
  return SHOW_FAKE_CHROME ? bar : <ViewportLayer>{bar}</ViewportLayer>;
}

export default function App() {
  const initial = useMemo(() => routeFromPath(currentPath()), []);
  const [route, setRouteState] = useState<RouteKey>(initial);
  const [selectedDueIds, setSelectedDueIds] = useState<Set<string>>(() => defaultDueIds(initial));
  const [payMethod, setPayMethod] = useState<PayMethod>('card');
  const [wcPhone, setWcPhone] = useState('581723467');
  const [wcMonths, setWcMonths] = useState(3);
  const [payCardLast4, setPayCardLast4] = useState('4521');
  const submitNewCard = (last4: string) => {
    setPayMethod('card');
    setPayCardLast4(last4 || '4521');
  };
  const duesSummary = useMemo(() => deriveDuesSummary(DUE_ITEMS, selectedDueIds), [selectedDueIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => setRouteState(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setRoute = (r: RouteKey) => {
    setRouteState(r);
    const map: Record<RouteKey, string> = {
      checkout: '/checkout', appHome: '/checkout/app-home', detail: '/checkout/detail', insights: '/checkout/insights', insightsCategory: '/checkout/insights/category', insightsEmpty: '/checkout/insights/empty', purchases: '/checkout/purchases', dues: '/checkout/dues', nextUp: '/checkout/next-up', paymentMethod: '/checkout/payment-method', paymentSelected: '/checkout/payment-method/selected', addCard: '/checkout/payment-method/add-card', cardAdded: '/checkout/payment-method/added', otp: '/checkout/otp', processing: '/checkout/processing', insufficient: '/checkout/insufficient', declined: '/checkout/declined', success: '/checkout/success',
      wcMobile: '/checkout/onboarding/mobile', wcOtp: '/checkout/onboarding/otp', wcIdentity: '/checkout/onboarding/identity', wcNafath: '/checkout/onboarding/nafath', wcQuickCall: '/checkout/onboarding/quick-call', wcTenure: '/checkout/onboarding/tenure', wcPayment: '/checkout/onboarding/payment', wcProcessing: '/checkout/onboarding/processing', wcSuccess: '/checkout/onboarding/success', wcNotification: '/checkout/notification', saLogin: '/checkout/login', saOtp: '/checkout/otp-login', saAddCard: '/checkout/add-card-home', superHome: '/checkout/superhome'
    };
    pushPath(map[r]);
  };
  if (route === 'wcMobile') return <WcMobile setRoute={setRoute} phone={wcPhone} setPhone={setWcPhone} />;
  if (route === 'wcOtp') return <WcOtp setRoute={setRoute} phone={wcPhone} />;
  if (route === 'wcIdentity') return <WcIdentity setRoute={setRoute} />;
  if (route === 'wcNafath') return <WcNafath setRoute={setRoute} />;
  if (route === 'wcQuickCall') return <WcQuickCall setRoute={setRoute} />;
  if (route === 'wcTenure') return <WcTenure setRoute={setRoute} months={wcMonths} setMonths={setWcMonths} />;
  if (route === 'wcPayment') return <WcPayment setRoute={setRoute} months={wcMonths} setMonths={setWcMonths} />;
  if (route === 'wcProcessing') return <WcProcessing setRoute={setRoute} />;
  if (route === 'wcSuccess') return <WcSuccess months={wcMonths} />;
  if (route === 'wcNotification') return <WcNotification setRoute={setRoute} months={wcMonths} />;
  if (route === 'saLogin') return <SaLogin setRoute={setRoute} phone={wcPhone} setPhone={setWcPhone} />;
  if (route === 'saOtp') return <SaOtp setRoute={setRoute} phone={wcPhone} />;
  if (route === 'saAddCard') return <SaAddCard setRoute={setRoute} amount={4250} onCardSubmit={submitNewCard} />;
  if (route === 'superHome') return <SuperHome setRoute={setRoute} method={payMethod} setMethod={setPayMethod} />;
  if (route === 'appHome') return <AppHome setRoute={setRoute} />;
  if (route === 'detail') return <Detail setRoute={setRoute} />;
  if (route === 'insights' || route === 'insightsCategory' || route === 'insightsEmpty') return <Insights setRoute={setRoute} />;
  if (route === 'purchases') return <Purchases setRoute={setRoute} />;
  if (route === 'dues') return <Dues items={DUE_ITEMS} summary={duesSummary} selectedIds={selectedDueIds} setSelectedIds={setSelectedDueIds} setRoute={setRoute} />;
  if (route === 'nextUp') return <NextUp items={DUE_ITEMS} summary={duesSummary} selectedIds={selectedDueIds} setSelectedIds={setSelectedDueIds} setRoute={setRoute} />;
  if (route === 'paymentMethod') return <PaymentMethodScreen setRoute={setRoute} summary={duesSummary} method={payMethod} setMethod={setPayMethod} />;
  if (route === 'paymentSelected') return <PaymentMethodScreen setRoute={setRoute} summary={duesSummary} selected method={payMethod} setMethod={setPayMethod} />;
  if (route === 'addCard') return <AddCard setRoute={setRoute} summary={duesSummary} onCardSubmit={submitNewCard} />;
  if (route === 'cardAdded') return <AddCard setRoute={setRoute} summary={duesSummary} filled onCardSubmit={submitNewCard} />;
  if (route === 'otp') return <OtpScreen setRoute={setRoute} summary={duesSummary} cardLast4={payCardLast4} />;
  if (route === 'processing') return <ProcessingScreen setRoute={setRoute} summary={duesSummary} />;
  if (route === 'insufficient') return <StatusLike kind="insufficient" title="Insufficient funds" body="This card does not have enough available balance. Choose another method or try again." cta="Choose another method" onPress={() => setRoute('paymentMethod')} onBack={() => setRoute('paymentSelected')} />;
  if (route === 'declined') return <StatusLike kind="declined" title="Payment declined" body="The bank declined this payment. No dues were paid." cta="Try again" onPress={() => setRoute('paymentMethod')} onBack={() => setRoute('paymentSelected')} />;
  if (route === 'success') return <PaymentSuccess setRoute={setRoute} summary={duesSummary} />;
  return <Checkout setRoute={setRoute} />;
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#dfe3e1', alignItems: 'center' },
  outerScroll: { flexGrow: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-start' },
  phone: { width: '100%', minHeight: '100%', flex: 1, backgroundColor: canvas, overflow: 'hidden' },

  statusStrip: { height: 44, paddingHorizontal: 24, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 },
  statusTime: { fontSize: 15, fontWeight: '600', color: '#0a0a0a', letterSpacing: 0.2 },
  statusLevels: { width: 78, height: 17 },
  homeIndicator: { alignSelf: 'center', width: 134, height: 5, borderRadius: 4, backgroundColor: '#0a0a0a', marginTop: 10, marginBottom: 8, opacity: 0.85 },

  appContent: { paddingHorizontal: 20, paddingBottom: 12 },
  appContentNoScroll: SHOW_FAKE_CHROME ? { paddingHorizontal: 16, paddingBottom: 8, flex: 1 } : { paddingHorizontal: 16, paddingBottom: 130 },
  homeLogoRow: { marginTop: 22, height: 48, justifyContent: 'center' },
  homeIndicatorFloat: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30 },

  headerBlock: { marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#0b3d1e', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, borderWidth: 0.5, borderColor: border },
  roundButtonText: { fontSize: 26, lineHeight: 28, fontWeight: '500', color: text },
  roundButtonIcon: { width: 20, height: 20 },
  pressed: { opacity: 0.78 },
  centerTitle: { fontSize: 16, fontWeight: '600', color: text },
  pageTitle: { fontSize: 32, lineHeight: 36, fontWeight: '700', color: text, marginTop: 16, letterSpacing: -1 },
  pageSubtitle: { color: muted, fontSize: 14, marginTop: 4 },

  // Checkout (neutral merchant)
  wcPage: { flex: 1, backgroundColor: '#fff' },
  wcMerchantHeader: { paddingHorizontal: 16, paddingVertical: 16, gap: 2 },
  wcMerchantName: { fontSize: 18, fontWeight: '700', color: '#121212' },
  wcMerchantSub: { fontSize: 13, color: '#666666' },
  wcBody: { flex: 1, padding: 24, gap: 16 },
  wcProductCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dfe5e5', borderRadius: 12, padding: 14 },
  wcProductThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#f7f7f7', alignItems: 'center', justifyContent: 'center' },
  wcProductEmoji: { fontSize: 20, lineHeight: 24 },
  wcProductTitle: { fontSize: 15, fontWeight: '600', color: '#121212' },
  wcProductMeta: { fontSize: 12, color: '#666666' },
  wcProductPrice: { fontSize: 16, fontWeight: '700', color: '#121212' },
  wcPayHeading: { fontSize: 15, fontWeight: '600', color: '#121212' },
  wcOptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dfe5e5', borderRadius: 12, padding: 16 },
  wcOptRowSelected: { backgroundColor: '#f7f7f7', borderWidth: 2, borderColor: '#121212', padding: 15 },
  wcRadio: { width: 20, height: 20, borderRadius: 999, borderWidth: 2, borderColor: '#dfe5e5', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  wcRadioSelected: { borderColor: '#121212' },
  wcRadioDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#121212' },
  wcOptLabel: { fontSize: 14, color: '#121212' },
  wcOptLabelSelected: { fontWeight: '600' },
  wcOptSub: { fontSize: 12, color: '#666666' },
  wcCtaWrap: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  wcCta: { backgroundColor: '#121212', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  wcCtaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  wcSafariWrap: { paddingTop: 16, paddingHorizontal: 28 },
  wcSafariRow: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  wcSafariCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(250,250,250,0.7)', borderWidth: 1, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 40, shadowOffset: { width: 0, height: 2 } },
  wcSafariGlyph: { fontSize: 23, lineHeight: 26, color: '#1b1b1b', fontWeight: '300' },
  wcSafariSearch: { width: 218, height: 48, borderRadius: 24, backgroundColor: 'rgba(250,250,250,0.7)', borderWidth: 1, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 42, shadowOffset: { width: 0, height: 2 } },
  wcSafariUrl: { fontSize: 17, color: '#1b1b1b', maxWidth: 150, textAlign: 'center' },
  wcSafariSiteIcon: { position: 'absolute', left: 14, top: 15, width: 15, height: 18 },
  wcSafariReloadIcon: { position: 'absolute', right: 12, top: 15, width: 15, height: 18 },
  wcSafariBottom: { height: 34, justifyContent: 'flex-end' },
  wcHomeIndicatorBar: { alignSelf: 'center', width: 144, height: 5, borderRadius: 100, backgroundColor: '#030712', marginBottom: 8 },
  wcStatusOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  wcObScreen: { flex: 1, backgroundColor: canvas },
  wcObHeader: { backgroundColor: '#fff', paddingHorizontal: 24, paddingBottom: 12, borderBottomLeftRadius: 52, borderBottomRightRadius: 40 },
  wcObHeaderRow: { height: 41, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wcObLogo: { width: 99, height: 29 },
  wcObArabic: { fontSize: 14, fontWeight: '700', color: '#16720b' },
  wcObCloseBox: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  wcObCloseIcon: { width: 11.7, height: 11.7 },
  wcObContent: { paddingHorizontal: 16, marginTop: 49, alignItems: 'center' },
  wcObCard: { width: '100%', backgroundColor: '#fff', borderRadius: 40, padding: 24, gap: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 16 } },
  wcObTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: '#1b1b1b', letterSpacing: 0.35 },
  wcObSub: { fontSize: 15, lineHeight: 20, color: muted, letterSpacing: -0.24 },
  wcFieldLabel: { fontSize: 15, lineHeight: 20, color: '#6b7280', letterSpacing: -0.24 },
  wcInputRow: { minHeight: 56, borderRadius: 16, borderWidth: 0.8, borderColor: border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  wcInputLead: { width: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wcFlagWrap: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  wcFlagImg: { width: 27, height: 24 },
  wcDialCode: { fontSize: 13, lineHeight: 18, color: muted, letterSpacing: -0.08 },
  wcInputDivider: { width: 1, height: 26, backgroundColor: border },
  wcPhoneInput: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '600', color: text, letterSpacing: -0.24, paddingVertical: 0 },
  wcGreenCta: { backgroundColor: green, borderRadius: 9999, minHeight: 50, maxHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  wcGreenCtaDisabled: { backgroundColor: '#e5e7eb' },
  wcGreenCtaText: { color: neon, fontSize: 17, lineHeight: 22, fontWeight: '500', letterSpacing: -0.41 },
  wcGreenCtaTextDisabled: { color: muted },
  wcAltLinkWrap: { paddingTop: 28, alignItems: 'center' },
  wcAltLinkText: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: muted, letterSpacing: -0.08 },
  wcAltLinkUnderline: { textDecorationLine: 'underline' },
  wcObBottom: { marginTop: 'auto', gap: 16, alignItems: 'center' },
  wcTosText: { width: 303, fontSize: 12, color: muted, textAlign: 'center' },
  wcObScreenFixed: { height: 830, backgroundColor: canvas, overflow: 'hidden' },
  wcOtpContent: { paddingHorizontal: 16, paddingTop: 50 },
  wcOtpTitle: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: '#000', letterSpacing: 0.36 },
  wcOtpSubRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wcOtpSubText: { width: 256, fontSize: 16, lineHeight: 21, color: '#4a5565', letterSpacing: -0.32 },
  wcEditPill: { minHeight: 28, maxHeight: 28, minWidth: 49, borderRadius: 9999, backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' },
  wcEditPillText: { fontSize: 15, lineHeight: 18, fontWeight: '500', color: text, letterSpacing: -0.08 },
  wcOtpBoxRow: { marginTop: 24, flexDirection: 'row', gap: 16 },
  wcOtpBoxRowCard: { flexDirection: 'row', gap: 16, width: '100%' },
  wcTimerRowCard: { flexDirection: 'row', gap: 4, alignItems: 'center', alignSelf: 'center' },
  wcResendRow: { flexDirection: 'row', gap: 10, alignItems: 'center', alignSelf: 'center', marginTop: -6 },
  wcResendText: { fontSize: 13, lineHeight: 18, color: muted, letterSpacing: -0.08 },
  wcOtpBox: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: borderSubtle, alignItems: 'center', justifyContent: 'center' },
  wcOtpBoxActive: { borderWidth: 0.8, borderColor: '#23a107', shadowColor: 'rgba(62,255,0,1)', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  wcOtpBoxDigit: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: text, letterSpacing: -0.24 },
  wcOtpBoxCaret: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: '#6b7280' },
  wcTimerRow: { marginTop: 24, flexDirection: 'row', gap: 4, alignItems: 'center', alignSelf: 'center' },
  wcTimerText: { fontSize: 13, lineHeight: 18, color: muted, letterSpacing: -0.08 },
  wcOtpBottom: { marginTop: 'auto', gap: 16, alignItems: 'stretch' },
  wcKeyboardSlot: { height: 274, width: '100%' },
  wcIdTitle: { fontSize: 22, lineHeight: 28, fontWeight: '600', color: text, letterSpacing: -0.2 },
  wcIdSub: { fontSize: 13, lineHeight: 17, color: '#666666' },
  wcTextField: { flex: 1, fontSize: 15, lineHeight: 20, color: text, letterSpacing: -0.24, paddingVertical: 0 },
  wcShieldRow: { flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%' },
  wcShieldText: { width: 280, fontSize: 12, lineHeight: 15, color: '#666666' },
  wcPickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 },
  wcPickerScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  wcPickerPanel: { position: 'absolute', top: 72, left: 16, right: 16, borderRadius: 24, backgroundColor: 'rgba(78,78,80,0.88)', padding: 18, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 40, shadowOffset: { width: 0, height: 16 } },
  wcPickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  wcPickerTitle: { color: '#fff', fontSize: 17, lineHeight: 22, fontWeight: '600' },
  wcPickerTitleChevron: { color: '#0a84ff', fontWeight: '600' },
  wcPickerNav: { flexDirection: 'row', gap: 26, paddingRight: 4 },
  wcPickerNavGlyph: { color: '#0a84ff', fontSize: 22, lineHeight: 24, fontWeight: '600' },
  wcPickerWeekRow: { flexDirection: 'row', paddingBottom: 4 },
  wcPickerWeekday: { flex: 1, textAlign: 'center', color: 'rgba(235,235,245,0.6)', fontSize: 11, lineHeight: 13, fontWeight: '600', letterSpacing: 0.06 },
  wcPickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  wcPickerCell: { width: `${100 / 7}%`, height: 41, alignItems: 'center', justifyContent: 'center' },
  wcPickerDayWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  wcPickerDayPicked: { backgroundColor: '#0a84ff' },
  wcPickerDay: { color: '#fff', fontSize: 17, lineHeight: 22 },
  wcPickerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  wcPickerReset: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: 'rgba(118,118,128,0.42)' },
  wcPickerResetText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  wcPickerOk: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0a84ff', alignItems: 'center', justifyContent: 'center' },
  wcPickerOkGlyph: { color: '#fff', fontSize: 19, fontWeight: '700' },
  wcNafathCenter: { flex: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 },
  wcNafathCircle: { width: 118, height: 118, borderRadius: 120, backgroundColor: '#319795', alignItems: 'center', justifyContent: 'center', padding: 20 },
  wcNafathMark: { width: 58, height: 25 },
  wcNafathTitle: { fontSize: 34, lineHeight: 41, fontWeight: '600', color: text, letterSpacing: -0.5, textAlign: 'center' },
  wcNafathCode: { fontSize: 28, lineHeight: 36, fontWeight: '600', color: '#1b1b1b', letterSpacing: -1, textAlign: 'center' },
  wcNafathCard: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 16, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  wcNafathHowTitle: { fontSize: 20, lineHeight: 25, color: '#1b1b1b', letterSpacing: 0.38 },
  wcNafathStep: { flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%' },
  wcNafathStepNum: { width: 20, height: 20, borderRadius: 120, backgroundColor: green, alignItems: 'center', justifyContent: 'center' },
  wcNafathStepNumText: { fontSize: 12, lineHeight: 16, color: neon, textAlign: 'center' },
  wcNafathStepText: { flex: 1, fontSize: 15, lineHeight: 20, color: text, letterSpacing: -0.24 },
  wcTenureContent: { paddingHorizontal: 16, marginTop: 24, gap: 16 },
  wcCartPill: { height: 49, borderRadius: 9999, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wcCartLeft: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  wcCartItems: { fontSize: 15, lineHeight: 20, color: text, letterSpacing: -0.24 },
  wcCartRight: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  wcCartTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wcCartTotalDivider: { height: 1, backgroundColor: '#e8ecea' },
  wcCartDiscountLabel: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: greenMid },
  wcCartDiscountChip: { backgroundColor: '#dff5d4', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  wcCartDiscountChipText: { fontSize: 11, lineHeight: 15, fontWeight: '700', color: '#16720b' },
  wcCartWasPrice: { fontSize: 13, lineHeight: 18, color: muted, textDecorationLine: 'line-through' },
  wcPlanCard: { width: '100%', minHeight: 550, backgroundColor: '#fff', borderRadius: 40, padding: 24, gap: 22, alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 16 } },
  wcPlanTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: text, letterSpacing: 0.36 },
  wcPlanSub: { fontSize: 13, lineHeight: 18, color: muted, letterSpacing: -0.08 },
  wcStepperTrack: { width: 310, borderRadius: 999, backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wcStepperMinus: { width: 47, height: 47, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: borderSubtle, alignItems: 'center', justifyContent: 'center' },
  wcStepperPlus: { width: 47, height: 47, borderRadius: 99, backgroundColor: green, alignItems: 'center', justifyContent: 'center' },
  wcStepperCenter: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 6 },
  wcStepperSide: { fontSize: 24, lineHeight: 41, fontWeight: '500', color: muted, opacity: 0.2, letterSpacing: 0.38, textAlign: 'center', minWidth: 16 },
  wcStepperMain: { fontSize: 34, lineHeight: 41, fontWeight: '700', color: '#000', letterSpacing: 0.38, textAlign: 'center' },
  wcStepperMonthsLabel: { fontSize: 12, lineHeight: 16, color: muted, marginTop: -6 },
  wcPlanHero: { alignItems: 'center', gap: 16 },
  wcPlanHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wcPlanHeroAmount: { fontSize: 34, lineHeight: 41, fontWeight: '700', color: text, letterSpacing: 0.38 },
  wcPlanHeroToday: { fontSize: 16, lineHeight: 22, color: muted },
  wcPlanThen: { fontSize: 17, lineHeight: 22, color: muted, letterSpacing: -0.41, textAlign: 'center' },
  wcPlanFees: { fontSize: 12, lineHeight: 16, color: muted, textAlign: 'center' },
  wcPlanFeesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: -8 },
  wcGreyCta: { backgroundColor: '#e5e7eb', borderRadius: 9999, minHeight: 50, maxHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 14, width: '100%' },
  wcGreyCtaText: { color: text, fontSize: 17, lineHeight: 22, fontWeight: '500', letterSpacing: -0.41 },
  wcDetailsSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '94%', backgroundColor: canvas, borderTopLeftRadius: 38, borderTopRightRadius: 38, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28, gap: 12, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 38, shadowOffset: { width: 0, height: -15 } },
  wcDetailsTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: text, letterSpacing: 0.35, marginTop: 6, marginBottom: 2 },
  wcDetailsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 10 },
  wcDetailsStrong: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: text, letterSpacing: -0.24 },
  wcDetailsLabel: { fontSize: 14, lineHeight: 19, color: muted },
  wcDetailsDim: { fontSize: 12, lineHeight: 16, color: muted },
  wcNowBadge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  wcNowBadgeText: { fontSize: 11, lineHeight: 14, fontWeight: '600', color: greenMid },
  wcPaySheet: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  wcPayPlanLabel: { fontSize: 14, lineHeight: 26, color: muted, letterSpacing: 0.38 },
  wcPayHeroRow: { flexDirection: 'row', alignItems: 'center' },
  wcPayThenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  wcPayThen: { fontSize: 15, lineHeight: 22, color: muted, letterSpacing: -0.24 },
  wcPayThenStrong: { fontWeight: '600', color: text },
  wcPayStartLine: { fontSize: 12, lineHeight: 16, color: '#8a929c', marginTop: 3 },
  wcMonthsBadge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  wcMonthsBadgeText: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: greenMid },
  wcPayActionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  wcPayActionPill: { flex: 1, height: 42, borderRadius: 999, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  wcPayActionText: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: text },
  wcPayBody: { paddingHorizontal: 16, marginTop: 28 },
  wcPayMethodTitle: { fontSize: 17, lineHeight: 26, fontWeight: '700', color: text },
  wcPayRow: { height: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wcPayRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  wcPayLogoTile: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: borderSubtle, alignItems: 'center', justifyContent: 'center' },
  wcPayRowTitle: { fontSize: 17, lineHeight: 22, color: text, letterSpacing: -0.41 },
  wcPayRowSub: { fontSize: 13, lineHeight: 16, color: muted, marginTop: 2 },
  wcPayDivider: { height: 1, backgroundColor: borderSubtle },
  wcPayRadio: { width: 20, height: 20, borderRadius: 999, borderWidth: 2, borderColor: '#d1d5db', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  wcPayRadioSelected: { borderColor: text },
  wcPayRadioDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: text },
  wcNetworksRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 24 },
  wcNetworkBadge: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, paddingHorizontal: 3, paddingVertical: 4 },
  wcAgreementEntry: { minHeight: 70, marginTop: 18, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: borderSubtle, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  wcAgreementEntryTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: text },
  wcAgreementEntrySub: { fontSize: 12, lineHeight: 16, color: muted },
  wcAgreementCheckbox: { width: 24, height: 24, borderRadius: 5, borderWidth: 2, borderColor: '#d1d5db', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  wcAgreementCheckboxSelected: { borderColor: green, backgroundColor: green },
  wcAgreementCheck: { color: '#fff', fontSize: 16, lineHeight: 18, fontWeight: '800' },
  wcMurabahaSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 620, backgroundColor: '#fff', borderTopLeftRadius: 38, borderTopRightRadius: 38, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 38, shadowOffset: { width: 0, height: -15 } },
  wcMurabahaHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  wcMurabahaTitle: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '700', color: text },
  wcMurabahaClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center' },
  wcMurabahaCloseGlyph: { fontSize: 31, lineHeight: 34, fontWeight: '300', color: text },
  wcMurabahaList: { marginTop: 20 },
  wcMurabahaRow: { height: 72, flexDirection: 'row', alignItems: 'center', gap: 14 },
  wcMurabahaRowText: { flex: 1, fontSize: 17, lineHeight: 22, fontWeight: '500', color: text },
  wcMurabahaChevron: { fontSize: 31, lineHeight: 32, fontWeight: '300', color: text },
  wcDocumentIcon: { width: 28, height: 32, borderRadius: 5, backgroundColor: '#b200ff', alignItems: 'center', justifyContent: 'center' },
  wcDocumentIconGlyph: { color: '#fff', fontSize: 20, lineHeight: 22, fontWeight: '800' },
  wcMurabahaAgreeLabel: { marginTop: 26, fontSize: 17, lineHeight: 22, fontWeight: '600', color: text },
  wcMurabahaAccept: { marginTop: 12, height: 64, borderRadius: 16, backgroundColor: '#f5f6f8', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wcMurabahaAcceptText: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '600', color: text },
  wcDocumentPreview: { paddingTop: 36, paddingBottom: 40, alignItems: 'flex-start', gap: 16 },
  wcDocumentHeading: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: text },
  wcDocumentBody: { fontSize: 15, lineHeight: 22, color: muted },
  wcDocumentRule: { width: '100%', height: 1, backgroundColor: borderSubtle },
  wcScheduleLinkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 },
  wcScheduleLinkText: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: '#16720b' },
  wcScheduleLinkChevron: { fontSize: 17, lineHeight: 19, color: muted },
  wcFeeTip: { position: 'absolute', left: 0, bottom: 26, width: 190, backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, zIndex: 10 },
  wcFeeTipText: { fontSize: 12, lineHeight: 16, color: muted },
  wcScheduleRow: { flexDirection: 'row', gap: 12 },
  wcScheduleRail: { width: 16, alignItems: 'center' },
  wcScheduleDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#d1d5db', backgroundColor: '#fff', marginTop: 4 },
  wcScheduleDotActive: { borderColor: greenMid, alignItems: 'center', justifyContent: 'center' },
  wcScheduleDotInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: greenMid },
  wcScheduleLine: { flex: 1, width: 1.5, backgroundColor: '#e5e7eb', marginVertical: 2 },
  wcScheduleBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 18 },
  wcScheduleLabel: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: text, letterSpacing: -0.24 },
  wcWhyRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  wcWhyText: { flex: 1, fontSize: 14, lineHeight: 20, color: text, letterSpacing: -0.15 },
  wcCartItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wcCartItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  wcStickyCtaBar: SHOW_FAKE_CHROME
    ? { paddingHorizontal: 16, width: '100%' }
    : { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 22, backgroundColor: 'rgba(249,250,251,0.96)', zIndex: 30, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
  wcWhyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9ca3af', marginTop: 7 },
  wcQcArtWrap: { marginTop: SHOW_FAKE_CHROME ? 50 : 44, marginHorizontal: 16, height: 300, borderRadius: 24, overflow: 'hidden', alignItems: 'center' },
  wcQcArt: { width: '100%', aspectRatio: 358 / 722 },
  wcQcToast: { position: 'absolute', top: SHOW_FAKE_CHROME ? 56 : 16, alignSelf: 'center', zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: green, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  wcQcToastDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: neon, alignItems: 'center', justifyContent: 'center' },
  wcQcToastCheck: { fontSize: 10, fontWeight: '800', color: green },
  wcQcToastText: { fontSize: 14, lineHeight: 18, fontWeight: '600', color: neon },
  wcQcPanel: { backgroundColor: '#fff', marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 32, paddingBottom: 24, alignItems: 'center', gap: 8 },
  wcQcTitle: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: text, letterSpacing: 0.36, textAlign: 'center' },
  wcQcSub: { fontSize: 14, lineHeight: 20, color: muted, textAlign: 'center', maxWidth: 330 },
  wcQcCta: { minWidth: 138, alignSelf: 'center', marginTop: 16, paddingHorizontal: 24 },
  wcQcCountPill: { alignSelf: 'center', marginTop: 16, backgroundColor: '#eceff1', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 13 },
  wcQcCountText: { fontSize: 15, lineHeight: 20, fontWeight: '500', color: muted },
  wcLeaveBody: { fontSize: 14, lineHeight: 20, color: muted, letterSpacing: -0.15, marginTop: -4, marginBottom: 6 },
  wcLeaveLink: { alignItems: 'center', paddingVertical: 12 },
  wcLeaveLinkText: { fontSize: 15, lineHeight: 20, fontWeight: '500', color: text },
  xPage: { flex: 1, backgroundColor: '#f2f6fa' },
  xHeader: { backgroundColor: '#fff', height: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xHeaderSide: { width: 64, flexDirection: 'row', alignItems: 'center' },
  wcFeeFree: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: greenMid },
  xHeaderGlyph: { fontSize: 26, lineHeight: 28, color: '#13316b', fontWeight: '400' },
  xImageCard: { flex: 1, minHeight: 260, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  xProductImg: { width: 300, height: '100%', maxHeight: 340 },
  xBody: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },
  xBrand: { fontSize: 13, fontWeight: '700', color: '#1467b3', letterSpacing: 0.4 },
  xTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: '#15191e', marginTop: 4 },
  xRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  xStars: { fontSize: 13, color: '#f5a623', letterSpacing: 1 },
  xRatingText: { fontSize: 12, color: '#5a6b7b' },
  xPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 10 },
  xPriceCurrency: { fontSize: 14, fontWeight: '700', color: '#15191e' },
  xPrice: { fontSize: 28, lineHeight: 32, fontWeight: '800', color: '#15191e' },
  xVat: { fontSize: 11, color: '#8a97a5', marginLeft: 2 },
  xSnplSection: { backgroundColor: '#eef3f8', borderRadius: 16, padding: 14, marginTop: 18, gap: 12 },
  xSnplHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2, paddingBottom: 2 },
  xSnplTitle: { fontSize: 18, lineHeight: 23, fontWeight: '800', color: '#15191e' },
  xSnplCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 7 },
  xTasheelChip: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3eaf1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  xTabbyChip: { alignSelf: 'flex-start', backgroundColor: '#3bffc1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  xTabbyText: { fontSize: 17, fontWeight: '800', color: '#0f1611', letterSpacing: -0.5 },
  xTamaraChip: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#f7b7d0' },
  xTamaraText: { fontSize: 17, fontWeight: '800', color: '#15191e', letterSpacing: -0.3 },
  xPayRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 62, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe3ec', borderRadius: 14, paddingHorizontal: 16 },
  xPayRowSelected: { borderColor: '#15191e', borderWidth: 2, paddingHorizontal: 15 },
  xPayIcon: { width: 24, height: 24 },
  xPayLabel: { flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '600', color: '#15191e' },
  xPayRadio: { width: 22, height: 22, borderRadius: 999, borderWidth: 1.5, borderColor: '#c3ccd6', alignItems: 'center', justifyContent: 'center' },
  xPayRadioOn: { borderColor: '#15191e', borderWidth: 2 },
  xPayRadioDot: { width: 11, height: 11, borderRadius: 999, backgroundColor: '#15191e' },
  xOfferCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe3ec', borderRadius: 14, padding: 16, gap: 7 },
  xOfferCardSelected: { backgroundColor: '#eefaea', borderColor: '#1c8a2b', borderWidth: 2, padding: 15 },
  xOfferTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  xOfferRadio: { width: 22, height: 22, borderRadius: 999, borderWidth: 1.5, borderColor: '#c3ccd6', alignItems: 'center', justifyContent: 'center' },
  xOfferRadioOn: { borderColor: '#1c8a2b', borderWidth: 2, backgroundColor: '#fff' },
  xOfferRadioDot: { width: 11, height: 11, borderRadius: 999, backgroundColor: '#1c8a2b' },
  xOfferTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: '#15191e', marginTop: 2 },
  xOfferBody: { fontSize: 15, lineHeight: 21, color: '#2c3a47' },
  xOfferLink: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: '#1467b3', marginTop: 2 },
  xOfferSteps: { gap: 8, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#cfe6c9' },
  xOfferStepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  xOfferStepNum: { width: 20, height: 20, borderRadius: 999, backgroundColor: '#1c8a2b', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  xOfferStepNumText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  xOfferStepText: { flex: 1, fontSize: 14, lineHeight: 19, color: '#2c3a47' },
  xRivalRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  xRivalCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe3ec', borderRadius: 14, padding: 14, gap: 7 },
  xRivalTitle: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: '#15191e', marginTop: 2 },
  xRivalBody: { fontSize: 13, lineHeight: 19, color: '#48566a' },
  xRivalLink: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: '#1467b3', marginTop: 2 },
  xSnplCardTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: '#15191e', marginTop: 3 },
  xSnplCardBody: { fontSize: 14, lineHeight: 20, color: '#2c3a47' },
  xSnplBig: { fontSize: 17, fontWeight: '800', color: '#15191e' },
  xSnplLink: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: '#1467b3', textDecorationLine: 'underline', marginTop: 2 },
  xAddCartPrimary: { marginTop: 14, height: 50, borderRadius: 25, backgroundColor: '#1467b3', alignItems: 'center', justifyContent: 'center' },
  xAddCartPrimaryText: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: '#fff' },
  xCartPage: { flex: 1, backgroundColor: '#f2f6fa' },
  xCartContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 110, gap: 16 },
  xCartTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: '#15191e' },
  xCartProduct: { minHeight: 112, borderRadius: 14, backgroundColor: '#fff', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  xCartProductImage: { width: 72, height: 88 },
  xCartBrand: { fontSize: 11, lineHeight: 15, fontWeight: '700', color: '#1467b3' },
  xCartProductTitle: { fontSize: 14, lineHeight: 19, fontWeight: '700', color: '#15191e' },
  xCartMeta: { fontSize: 11, lineHeight: 15, color: '#6b7785' },
  xCartSummary: { height: 64, borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xCartSummaryLabel: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: '#15191e' },
  xCartSectionTitle: { fontSize: 18, lineHeight: 23, fontWeight: '800', color: '#15191e', marginTop: 2 },
  xCartContinue: { minHeight: 52, borderRadius: 26, backgroundColor: '#003b18', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 4 },
  xCartContinueText: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: '#36ff00', textAlign: 'center' },
  xCtaRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  xAddCart: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1.6, borderColor: '#1467b3', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  xAddCartDone: { borderColor: '#1e8e3e' },
  xAddCartText: { fontSize: 15, fontWeight: '700', color: '#1467b3' },
  xBuyTasheel: { flex: 1.2, height: 50, borderRadius: 25, backgroundColor: green, alignItems: 'center', justifyContent: 'center' },
  xBuyTasheelText: { fontSize: 15, fontWeight: '600', color: neon },
  wcPayDisclaimer: { fontSize: 13, lineHeight: 18, color: muted, marginTop: 16, marginBottom: SHOW_FAKE_CHROME ? 12 : 110, maxWidth: 358 },
  wcProcLogoRow: { alignItems: 'center', paddingTop: 8 },
  wcProcCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: -40 },
  wcProcTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: text, letterSpacing: 0.36, textAlign: 'center' },
  wcProcSub: { fontSize: 13, lineHeight: 18, color: muted, textAlign: 'center' },
  wcProcTrack: { width: 288, height: 12, borderRadius: 999, backgroundColor: '#fff', overflow: 'hidden', marginTop: 26, borderWidth: 1, borderColor: borderSubtle },
  wcProcFillWrap: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden', borderRadius: 999 },
  wcSuccessBody: { paddingHorizontal: 16, gap: 12 },
  wcSuccessTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: text, letterSpacing: 0.36, textAlign: 'center', marginTop: 22 },
  wcSuccessSub: { fontSize: 14, lineHeight: 20, color: muted, textAlign: 'center', paddingHorizontal: 18, marginTop: 2, marginBottom: 10 },
  wcSuccessCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 12 },
  wcSuccessMerchantRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wcSuccessMerchantLogo: { width: 37, height: 37, borderRadius: 8, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  wcSuccessMerchantName: { fontSize: 16, lineHeight: 21, fontWeight: '600', color: text, letterSpacing: -0.32 },
  wcSuccessMerchantSub: { fontSize: 12, lineHeight: 16, color: muted },
  wcSuccessValue: { fontSize: 14, lineHeight: 19, fontWeight: '600', color: text },
  wcSuccessDownloadTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: text },
  wcBadgeRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  wcRedirectText: { fontSize: 13, lineHeight: 18, color: muted, textAlign: 'center', marginTop: 8 },
  wcLockScreen: { height: 830, backgroundColor: '#0b1410', overflow: 'hidden' },
  wcLockGlow: { position: 'absolute', top: -180, left: -120, width: 640, height: 640, borderRadius: 320, backgroundColor: 'rgba(34,110,60,0.35)' },
  wcLockDate: { marginTop: 84, textAlign: 'center', color: 'rgba(255,255,255,0.92)', fontSize: 20, lineHeight: 25, fontWeight: '500' },
  wcLockClock: { textAlign: 'center', color: 'rgba(255,255,255,0.96)', fontSize: 88, lineHeight: 96, fontWeight: '700', letterSpacing: -1 },
  wcNotifBanner: { marginTop: 28, marginHorizontal: 12, borderRadius: 24, backgroundColor: 'rgba(245,245,245,0.78)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 12 } },
  wcNotifInner: { flexDirection: 'row', gap: 10, padding: 14, alignItems: 'flex-start' },
  wcNotifAppIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  wcNotifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wcNotifApp: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: 'rgba(60,60,67,0.72)', letterSpacing: 0.4 },
  wcNotifTime: { fontSize: 12, lineHeight: 16, color: 'rgba(60,60,67,0.6)' },
  wcNotifTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: '#111' },
  wcNotifBody: { fontSize: 14, lineHeight: 19, color: '#1c1c1e' },
  wcLockBottomRow: { position: 'absolute', bottom: 56, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 52 },
  wcLockCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  wcLockCircleGlyph: { fontSize: 20 },
  wcLockHomeIndicator: { position: 'absolute', bottom: 8, alignSelf: 'center', width: 144, height: 5, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.9)' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 11, height: 11, borderRadius: 6 },
  checkoutCta: { minHeight: 56, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  checkoutCtaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  browserChrome: { minHeight: 64, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  browserCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(243,244,246,0.92)', alignItems: 'center', justifyContent: 'center' },
  browserIcon: { fontSize: 23, lineHeight: 26, color: '#121212', fontWeight: '500' },
  addressBar: { width: 218, height: 48, borderRadius: 24, backgroundColor: 'rgba(243,244,246,0.92)', alignItems: 'center', justifyContent: 'center' },
  addressText: { fontSize: 14, color: '#121212', fontWeight: '400' },

  // Generic CTA (in-app, dark green / neon)
  cta: { minHeight: 56, borderRadius: 28, backgroundColor: green, alignItems: 'center', justifyContent: 'center', marginTop: 18, paddingHorizontal: 18 },
  ctaText: { color: neon, fontSize: 16, fontWeight: '500' },

  // Home
  nextPaymentLabel: { color: '#4b5563', fontSize: 12, lineHeight: 16, marginTop: 28, fontWeight: '400' },
  payRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  payNow: { backgroundColor: green, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20, marginLeft: 'auto' },
  payNowText: { color: neon, fontWeight: '500', fontSize: 14 },
  dueText: { color: '#4b5563', fontSize: 12, lineHeight: 16, marginTop: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 38, marginTop: 32, marginBottom: 0 },
  actionTile: { alignItems: 'center', gap: 9, width: 92 },
  actionIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', borderWidth: 1, borderColor: borderSubtle, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#0b3d1e', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  figmaActionIcon: { width: 46, height: 46 },
  actionLabel: { fontSize: 13, color: text, fontWeight: '500' },
  sectionRow: { marginTop: 32, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleSmall: { color: text, fontSize: 17, fontWeight: '600' },
  viewMore: { color: green, fontSize: 13, fontWeight: '600' },
  homeCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#0b3d1e', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  merchantBadge: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: border, overflow: 'hidden' },
  cardTitle: { fontSize: 16, lineHeight: 21, color: text, fontWeight: '600', letterSpacing: -0.32 },
  cardSub: { fontSize: 11, lineHeight: 13, color: muted, marginTop: 1, letterSpacing: 0.06 },
  statusText: { fontSize: 12.5, fontWeight: '600', color: '#087c2d' },
  installmentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  installText: { color: '#374151', fontSize: 12.5 },
  amountMonthly: { flexDirection: 'row', alignItems: 'baseline' },
  mo: { color: text, fontSize: 16, fontWeight: '400', letterSpacing: -0.32 },
  progressTrackSmall: { height: 8, borderRadius: 4, backgroundColor: '#e5e7eb', overflow: 'hidden', marginTop: 8 },
  progressFillWrap: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  progressDash: { position: 'absolute', top: 1, width: 2, height: 6, marginLeft: -1, borderRadius: 1, backgroundColor: '#fff' },
  thickTrack: { height: 15, borderRadius: 999, backgroundColor: '#e6e8eb', marginTop: 4, justifyContent: 'center' },
  thickFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: '#27d552' },
  thickThumb: { position: 'absolute', width: 15, height: 15, borderRadius: 8, marginLeft: -7, backgroundColor: '#fff', borderWidth: 3, borderColor: '#169c39', shadowColor: '#0b3d1e', shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  nextCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#0b3d1e', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextName: { fontSize: 15.5, fontWeight: '600', color: text },
  nextWhen: { fontSize: 12, color: muted, marginTop: 2 },
  liveDot: { position: 'absolute', top: -2, right: -2, width: 11, height: 11, borderRadius: 6, backgroundColor: '#23c140', borderWidth: 2, borderColor: '#fff' },
  divider: { height: 1, backgroundColor: border, marginVertical: 13 },

  bottomNav: { position: 'absolute', left: 16, right: 16, bottom: 8, height: 95, paddingTop: 16, paddingBottom: 24, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  bottomNavPill: { position: 'absolute', left: 5, right: 5, top: 12, bottom: 20, borderRadius: 296, backgroundColor: 'rgba(247,247,247,0.82)', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 40, shadowOffset: { width: 0, height: 8 } },
  navItem: { flex: 1, height: 55, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 8 },
  navSelection: { position: 'absolute', top: 0, bottom: 0, left: -2, right: -2, borderRadius: 100, backgroundColor: '#f9fafb' },
  navIcon: { width: 24, height: 24 },
  navText: { fontSize: 11, lineHeight: 13, letterSpacing: 0.06, color: '#6b7280', fontWeight: '400' },
  navTextDim: { color: '#9ca3af', fontWeight: '500', letterSpacing: -0.2 },
  navTextActive: { color: '#166534', fontWeight: '500', letterSpacing: -0.2 },

  // --- Superapp landing homepage (Figma 2741:27487) ---
  saHero: { height: 540 },
  saHeroImg: { } as object,
  saStatusFloat: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  saHeroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6 },
  saHeroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  saHeroDots: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 6 },
  saDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  saDotActive: { width: 18, backgroundColor: '#ffffff' },
  saHeroCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 26 },
  saHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: SHOW_FAKE_CHROME ? 52 : 56 },
  saHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.3)' },
  saGreeting: { color: '#ffffff', fontSize: 17, lineHeight: 22, letterSpacing: -0.43 },
  saName: { color: '#ffffff', fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.26 },
  saBell: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 40, shadowOffset: { width: 0, height: 8 } },
  saHeroContent: { alignItems: 'center', gap: 14, paddingBottom: 22 },
  saPromotedPill: { backgroundColor: 'rgba(7,17,11,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.18)' },
  saPromotedText: { color: '#3eff00', fontSize: 11, lineHeight: 13, fontWeight: '600', letterSpacing: 0.1 },
  saFitbitCircle: { width: 91, height: 91, borderRadius: 46, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  saHeroTextWrap: { alignItems: 'center', gap: 3, paddingHorizontal: 16 },
  saHeroTitle: { color: '#ffffff', fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  saHeroSub: { color: 'rgba(255,255,255,0.95)', fontSize: 16, lineHeight: 21, fontWeight: '500', letterSpacing: -0.2, textAlign: 'center' },

  saGlassBtn: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', alignSelf: 'flex-start', marginTop: 2 },
  saGlassBtnText: { color: '#1a1a1a', fontSize: 13, fontWeight: '600', letterSpacing: -0.2 },

  saSheet: { backgroundColor: '#f3f4f6', marginTop: -26, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 26, zIndex: 2 },

  saSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginTop: 30, marginBottom: 16 },
  saSectionTitle: { color: '#00191c', fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.35 },

  saHScroll: { paddingHorizontal: 16, gap: 10 },

  saQuickNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginTop: 4, marginBottom: 30 },
  saQuickItem: { alignItems: 'center', gap: 2 },
  saQuickIcon: { width: 59, height: 49, borderRadius: 8 },
  saQuickLabel: { color: '#030712', fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: -0.08 },
  saQuickUnderline: { width: 51, height: 2, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: '#030712', marginTop: 1 },

  saLimitCard: { marginHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'stretch', shadowColor: '#787878', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  saLimitLabel: { color: '#4b5563', fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.06 },
  saAmountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  saRiyalGlyph: { width: 24, height: 24, marginRight: 6 },
  saAmountBig: { color: '#030712', fontSize: 40, lineHeight: 41, fontWeight: '700', letterSpacing: -0.5 },
  saAmountDec: { fontSize: 28, fontWeight: '600', letterSpacing: -0.3 },
  saStoresStackRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  saStoreStack: { flexDirection: 'row', alignItems: 'center' },
  saStackAvatar: { width: 21, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#ffffff' },
  saMultiStores: { color: '#4b5563', fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: -0.2 },
  saLimitRight: { justifyContent: 'space-between', alignItems: 'flex-end' },
  saDueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saDueText: { color: '#4b5563', fontSize: 11, lineHeight: 13, fontWeight: '600', letterSpacing: -0.2, textAlign: 'right' },
  saPayNow: { backgroundColor: '#022b10', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 14 },
  saPayNowText: { color: '#3eff00', fontSize: 13, lineHeight: 16, fontWeight: '600', letterSpacing: -0.2 },

  saBanner: { width: 358, height: 150, borderRadius: 24, overflow: 'hidden', flexDirection: 'row' },
  saBannerContent: { width: 215, padding: 16, justifyContent: 'center', gap: 12 },
  saBannerLogo: { width: 53, height: 24 },
  saBannerTitleDark: { color: '#000000', fontSize: 16, lineHeight: 22, fontWeight: '700' },
  saBannerSubDark: { color: '#727272', fontSize: 12, lineHeight: 17 },
  saBannerTitleLight: { color: '#ededed', fontSize: 16, lineHeight: 22, fontWeight: '700' },
  saBannerSubLight: { color: '#d9d9d9', fontSize: 12, lineHeight: 17 },
  saBannerImg: { width: 143, height: 150 },

  saDealCard: { width: 137, height: 158, borderRadius: 24, overflow: 'hidden', padding: 8, justifyContent: 'space-between', borderWidth: 1, borderColor: '#c6c6c8', backgroundColor: '#000' },
  saDealScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 },
  saDealLogo: { width: 33, height: 33, borderRadius: 16 },
  saDealTitle: { color: '#e5e7eb', fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.2 },
  saDealTitleExp: { fontSize: 22, fontWeight: '800' },

  saOfferCard: { width: 137, paddingBottom: 16, gap: 8 },
  saOfferArt: { width: 137, height: 137, borderRadius: 24, overflow: 'hidden', padding: 8, backgroundColor: '#000' },
  saOfferArtFramed: { borderWidth: 1, borderColor: '#c6c6c8' },
  saOfferLogo: { width: 24, height: 24, borderRadius: 12 },
  saOfferTitle: { color: '#1d1f1f', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  saOfferSub: { color: '#525454', fontSize: 12, lineHeight: 17 },

  saPromo: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden' },
  saPromoContent: { flex: 1, padding: 16, justifyContent: 'center' },
  saPromoKicker: { color: '#ffffff', fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.2 },
  saPromoTitle: { color: '#ffffff', fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.2, width: 220, marginTop: 12, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 6 },
  saPromoBtnRow: { marginTop: 22 },

  saStore: { width: 72, alignItems: 'center', gap: 4 },
  saStoreCircle: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  saStoreName: { color: '#000000', fontSize: 12, lineHeight: 17, textAlign: 'center' },

  saCatGrid: { paddingHorizontal: 17, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  saCatCard: { width: '47.6%', flexGrow: 1, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  saCatIcon: { width: 18, height: 18 },
  saCatLabel: { color: '#000000', fontSize: 16, lineHeight: 21, letterSpacing: -0.32 },

  saTabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 20 },
  saTabPillWrap: { flex: 1, height: 61, borderRadius: 296, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  saTabPill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 296, backgroundColor: 'rgba(255,255,255,0.6)', shadowColor: '#0b1f17', shadowOpacity: 0.16, shadowRadius: 32, shadowOffset: { width: 0, height: 10 } },
  saTabPillHighlight: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 296, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', borderTopColor: 'rgba(255,255,255,0.95)', borderBottomColor: 'rgba(255,255,255,0.4)' },
  saTabItem: { flex: 1, height: 55, alignItems: 'center', justifyContent: 'center', gap: 2 },
  saTabSelection: { position: 'absolute', top: 6, height: 49, left: 6, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.85)', shadowColor: '#0b1f17', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  saTabIcon: { width: 24, height: 24 },
  saTabLabel: { fontSize: 11, lineHeight: 13, letterSpacing: 0.06, color: '#030712' },
  saTabLabelActive: { color: '#16720b' },
  saTabSearch: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', shadowColor: '#0b1f17', shadowOpacity: 0.16, shadowRadius: 32, shadowOffset: { width: 0, height: 10 } },
  saTabSearchHighlight: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 27, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', borderTopColor: 'rgba(255,255,255,0.95)' },

  saSearchScreen: { flex: 1, backgroundColor: '#ffffff', paddingTop: SHOW_FAKE_CHROME ? 54 : 56 },
  saSearchTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  saSearchField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eeeef0', borderRadius: 12, paddingHorizontal: 12, height: 40 },
  saSearchInput: { flex: 1, fontSize: 16, color: '#030712', letterSpacing: -0.3, paddingVertical: 0, outlineStyle: 'none', outlineWidth: 0 } as object,
  saSearchClear: { color: '#8e8e93', fontSize: 13, paddingHorizontal: 2 },
  saSearchCancel: { color: '#16720b', fontSize: 16, fontWeight: '500', letterSpacing: -0.3 },
  saSearchHeading: { color: '#00191c', fontSize: 17, fontWeight: '700', letterSpacing: -0.2, paddingHorizontal: 20, marginTop: 18, marginBottom: 12 },
  saChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  saChip: { backgroundColor: '#f3f4f6', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  saChipText: { color: '#1d1f1f', fontSize: 14, letterSpacing: -0.2 },
  saSearchResult: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#ececed' },
  saSearchResultText: { color: '#030712', fontSize: 16, letterSpacing: -0.3 },
  saSearchEmpty: { color: '#8e8e93', fontSize: 15, paddingHorizontal: 20, paddingTop: 24, textAlign: 'center' },

  // --- Login (Figma 2761:29360) ---
  saStatusLight: { position: 'absolute', top: 0, left: 0, right: 0, height: 44, paddingHorizontal: 24, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 6 },
  saStatusLightTime: { fontSize: 15, fontWeight: '600', color: '#ffffff', letterSpacing: 0.2 },
  saLoginScreen: { height: SHOW_FAKE_CHROME ? 874 : 830, backgroundColor: '#0a1a10' },
  saLoginContent: { flex: 1, paddingHorizontal: 16, paddingTop: 62, paddingBottom: 24, justifyContent: 'space-between' },
  saLoginBottom: { gap: 16 },
  saLoginLogo: { width: 185, height: 55, alignSelf: 'center', marginTop: 8 },
  saLoginCard: { backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 40, padding: 28, gap: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.5)' },
  saLoginTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700', color: '#1b1b1b', letterSpacing: 0.2 },
  saLoginSub: { fontSize: 16, lineHeight: 21, color: '#1f2937', letterSpacing: -0.3 },
  saLoginInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderWidth: 0.8, borderColor: '#e5e7eb', borderRadius: 16, minHeight: 56, paddingHorizontal: 16 },
  saLoginDivider: { width: 1, height: 26, backgroundColor: '#e5e7eb' },
  saLoginInputText: { flex: 1, fontSize: 16, color: '#030712', letterSpacing: -0.2, paddingVertical: 0, outlineStyle: 'none', outlineWidth: 0 } as object,
  saLoginFooter: { color: '#ffffff', fontSize: 11, lineHeight: 14, textAlign: 'center', opacity: 0.92 },

  saAuthBtn: { backgroundColor: '#e5e7eb', borderRadius: 999, minHeight: 50, alignItems: 'center', justifyContent: 'center', width: '100%' },
  saAuthBtnActive: { backgroundColor: '#022b10' },
  saAuthBtnText: { color: '#6b7280', fontSize: 17, fontWeight: '500', letterSpacing: -0.41 },
  saAuthBtnTextActive: { color: '#3eff00' },

  // --- OTP (Figma 2761:29373) ---
  saOtpScreen: { flex: 1, backgroundColor: '#f9fafb' },
  saOtpBackRow: { paddingHorizontal: 16, paddingTop: SHOW_FAKE_CHROME ? 8 : 56, paddingBottom: 8 },
  saOtpBack: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  saOtpBody: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  saOtpCard: { backgroundColor: '#ffffff', borderRadius: 40, padding: 24, gap: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 16 } },
  saOtpTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: '#1b1b1b', letterSpacing: 0.35 },
  saOtpSubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  saOtpSub: { flex: 1, fontSize: 16, lineHeight: 21, color: '#4a5565', letterSpacing: -0.32 },
  saOtpEdit: { backgroundColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  saOtpEditText: { fontSize: 15, fontWeight: '500', color: '#030712', letterSpacing: -0.08 },
  saOtpBoxes: { flexDirection: 'row', gap: 16, position: 'relative' },
  saOtpBox: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  saOtpBoxActive: { borderColor: '#23a107', shadowColor: '#3eff00', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  saOtpBoxFilled: { borderColor: '#d1d5db' },
  saOtpDigit: { fontSize: 22, fontWeight: '600', color: '#030712' },
  saOtpHiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, color: 'transparent', outlineStyle: 'none', outlineWidth: 0 } as object,
  saOtpTimerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 18, marginBottom: 16 },
  saOtpTimer: { fontSize: 13, color: '#4b5563', letterSpacing: -0.08 },
  saOtpDiff: { alignItems: 'center', marginTop: 16, paddingTop: 4 },
  saOtpDiffText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  saOtpDiffLink: { textDecorationLine: 'underline', color: '#4b5563' },

  // --- Add card (homepage flow) ---
  saAddCardScreen: { flex: 1, backgroundColor: '#f9fafb' },
  saAddCardBackRow: { paddingHorizontal: 16, paddingTop: SHOW_FAKE_CHROME ? 8 : 56, paddingBottom: 8 },
  saAddCardBody: { flex: 1, paddingHorizontal: 16, gap: 18 },
  saAddCardTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: '#1b1b1b', letterSpacing: -0.3, marginBottom: 2 },
  saAddCardFooter: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  saAddCardBtn: { backgroundColor: '#e5e7eb', borderRadius: 999, minHeight: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%' },

  // Detail - Figma 1966:34633
  transactionScreen1966: { width: 402, height: 874, backgroundColor: canvas, overflow: 'hidden', position: 'relative' },
  transactionScroll: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  transactionScrollContent: { minHeight: 1330, paddingBottom: 0 },
  transactionCanvas1966: { width: 402, minHeight: 1330, height: 1330, position: 'relative', backgroundColor: canvas },
  transactionHero1966: { position: 'absolute', left: 0, top: 0, width: 402, height: 374, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 42, borderBottomRightRadius: 32, zIndex: 0 },
  transactionHeroContent1966: { position: 'absolute', left: 16, right: 16, top: 136 },
  transactionHeroRow1966: { width: 370, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  transactionHeroLeft1966: { minHeight: 116, justifyContent: 'center' },
  transactionMerchantBlock1966: { marginTop: 12 },
  transactionMerchant1966: { fontSize: 22, lineHeight: 28, fontWeight: '600', color: text, letterSpacing: -0.2 },
  transactionDate1966: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: text, opacity: 0.64, letterSpacing: -0.08, marginTop: 4 },
  transactionHeroRight1966: { minHeight: 116, alignItems: 'flex-end', justifyContent: 'space-between' },
  transactionStatus1966: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: '#166534', letterSpacing: -0.08 },
  transactionProgressTrack1966: { width: 370, height: 15, borderRadius: 7.5, backgroundColor: '#e5e7eb', overflow: 'hidden', marginTop: 24 },
  transactionProgressFill1966: { width: 92.5, height: 15, borderRadius: 7.5, backgroundColor: neon },
  transactionProgressMeta1966: { width: 370, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  transactionMetaLabel1966: { fontSize: 13, lineHeight: 18, color: '#4b5563', letterSpacing: -0.08, marginBottom: 6 },
  transactionStickyHeader1966: { position: 'absolute', top: 62, left: 16, right: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  transactionScheduleSection1966: { position: 'absolute', left: 16, right: 16, top: 406 },
  transactionSectionTitle1966: { fontSize: 20, lineHeight: 25, fontWeight: '600', color: text, letterSpacing: 0.38, marginBottom: 12 },
  transactionScheduleCard1966: { width: 370, height: 264, borderRadius: 24, backgroundColor: '#fff', padding: 12 },
  transactionScheduleRow1966: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  transactionScheduleLeft1966: { flexDirection: 'row', alignItems: 'center', minWidth: 158 },
  transactionNextRail1966: { width: 36, height: 47, alignItems: 'center', paddingTop: 2 },
  transactionNextPill1966: { borderWidth: 1, borderColor: '#15803d', backgroundColor: '#ecffe6', color: '#16720b', fontSize: 11, lineHeight: 13, fontWeight: '600', paddingHorizontal: 5, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  transactionNextLine1966: { width: 3, height: 18, borderRadius: 999, backgroundColor: '#e5e7eb', marginTop: 4 },
  transactionFutureRail1966: { width: 36, height: 47, alignItems: 'center', justifyContent: 'center' },
  transactionFutureLine1966: { width: 3, flex: 1, minHeight: 12, borderRadius: 999, backgroundColor: '#e5e7eb' },
  transactionFutureDot1966: { width: 13, height: 13, borderRadius: 7, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  transactionScheduleText1966: { marginLeft: 8, justifyContent: 'center' },
  transactionScheduleDate1966: { fontSize: 16, lineHeight: 21, fontWeight: '400', color: '#4b5563', letterSpacing: -0.32 },
  transactionScheduleDateNext1966: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: '#166534', letterSpacing: -0.41 },
  transactionScheduleNote1966: { fontSize: 11, lineHeight: 14, color: '#4b5563', marginTop: 4 },
  transactionScheduleNoteNext1966: { lineHeight: 13, fontWeight: '600', color: '#166534', letterSpacing: 0.06 },
  transactionDetailsSection1966: { position: 'absolute', left: 16, right: 16, top: 718 },
  transactionDetailsCard1966: { width: 370, height: 428, borderRadius: 24, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, overflow: 'hidden' },
  transactionDetailsRow1966: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  transactionDetailsLabel1966: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: text },
  transactionDetailsValue1966: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: text, letterSpacing: -0.24 },
  transactionBottomFade1966: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 132, backgroundColor: 'rgba(249,250,251,0.94)' },
  transactionCta1966: { position: 'absolute', left: 16, top: 1246, width: 370, height: 50, borderRadius: 999, backgroundColor: green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  transactionCtaText1966: { color: neon, fontSize: 17, lineHeight: 18, fontWeight: '500', letterSpacing: -0.2 },
  transactionHomeIndicator1966: { position: 'absolute', top: 1296, left: 129, width: 144, height: 5, borderRadius: 100, backgroundColor: '#030712' },

  // Detail (legacy styles kept for older route fragments)
  detailHero: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 0.5, borderColor: border, shadowColor: '#0b3d1e', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  detailHeroTop: { flexDirection: 'row', alignItems: 'center' },
  detailTitleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 },
  detailMerchant: { fontSize: 22, fontWeight: '600', color: text, letterSpacing: -0.5 },
  detailPaidRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  blockTitle: { marginTop: 22, marginBottom: 12, fontSize: 18, fontWeight: '600', color: text },
  scheduleCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 0.5, borderColor: border },
  scheduleRow: { flexDirection: 'row', gap: 12 },
  timeline: { alignItems: 'center', width: 16 },
  timelineDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: '#d1d5db', backgroundColor: '#fff' },
  timelineDotActive: { backgroundColor: '#169c39', borderColor: '#169c39' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#e5e7eb', marginVertical: 2 },
  scheduleTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextPill: { backgroundColor: '#e5f8e9', color: '#15963a', fontSize: 11, fontWeight: '600', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden' },
  scheduleDate: { fontSize: 15, fontWeight: '600', color: text },
  detailsTable: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 0.5, borderColor: border, overflow: 'hidden' },
  tableRow: { minHeight: 46, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: border },
  tableLabel: { color: muted, fontSize: 13.5 },
  tableValue: { color: text, fontSize: 13.5, fontWeight: '600' },

  // Insights
  monthPill: { height: 38, borderRadius: 19, paddingHorizontal: 16, backgroundColor: '#fff', justifyContent: 'center', borderWidth: 0.5, borderColor: border },
  monthText: { fontWeight: '600', color: text, fontSize: 13 },
  insightLabel: { marginTop: 20, color: muted, fontSize: 13 },
  chart: { height: 130, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 16, marginBottom: 18 },
  barCol: { alignItems: 'center', justifyContent: 'flex-end', width: 44 },
  bar: { width: 18, borderRadius: 9, backgroundColor: '#d5dbe1' },
  barActive: { backgroundColor: '#22db3f' },
  barValue: { color: '#087c2d', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  barLabelWrap: { width: 44, marginTop: 9, alignItems: 'center' },
  barLabel: { fontSize: 11, color: muted, textAlign: 'center' },
  barUnderline: { width: 26, height: 2, backgroundColor: text, marginTop: 6 },
  insightTabs: { height: 46, borderRadius: 23, backgroundColor: '#eceff1', flexDirection: 'row', alignItems: 'center', padding: 4, marginBottom: 16 },
  insightTabPill: { position: 'absolute', left: 4, top: 4, height: 38, borderRadius: 19, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  insightTabWrap: { flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  insightTabActive: { color: '#087c2d', fontWeight: '600', fontSize: 14 },
  insightTab: { flex: 1, textAlign: 'center', color: muted, fontWeight: '400', fontSize: 14 },
  transactionList: { gap: 11 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 13, borderWidth: 0.5, borderColor: border },
  categoryTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryEmoji: { fontSize: 18, lineHeight: 22 },
  categorySub: { color: muted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  categoryChevron: { color: muted, fontSize: 17, lineHeight: 20, marginLeft: 2 },
  barLabelActive: { position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', color: text, fontWeight: '600' },

  // Purchases tabs
  tabs: { height: 46, borderRadius: 23, backgroundColor: '#eceff1', flexDirection: 'row', alignItems: 'center', padding: 4, marginBottom: 16 },
  tab: { flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  tabText: { color: muted, fontWeight: '500', fontSize: 14 },
  tabTextActive: { color: '#087c2d' },
  purchaseList: { gap: 10 },
  purchaseCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 0.5, borderColor: border, paddingHorizontal: 14, paddingVertical: 11, shadowColor: '#0b3d1e', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },

  // Dues (Figma 1843:17915)
  duesFrame1843: { height: 846, position: 'relative', backgroundColor: canvas, overflow: 'hidden' },
  duesHeader1843: { position: 'absolute', left: 16, top: 26, width: 50, height: 50, zIndex: 3 },
  ringCaption: { fontSize: 13, lineHeight: 18, color: muted, textAlign: 'center' },
  ringAmount: { fontSize: 34, lineHeight: 41, fontWeight: '700', color: text, letterSpacing: 0.38 },
  ringSecondary: { fontSize: 13, lineHeight: 18, color: muted, textAlign: 'center', marginTop: 4 },
  ringWrap1843: { position: 'absolute', left: 41, top: 84, width: 320, height: 285, alignItems: 'center' },
  duesRingFrame1843: { width: 320, height: 285, position: 'relative' },
  duesDynamicSvg: { position: 'absolute', left: 0, top: 0, width: 320, height: 285 },
  duesLeadingHaloV3: { position: 'absolute', left: 19, top: -5, width: 282, height: 285 },
  duesTrackEmptyV4: { position: 'absolute', left: 35, top: 12, width: 124, height: 188 },
  duesFilledV4: { position: 'absolute', left: 51, top: 12, width: 236, height: 252 },
  duesDotAsset: { position: 'absolute', width: 26, height: 26 },
  ringCenter: { position: 'absolute', top: 91, left: 92, width: 137, height: 97, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { fontSize: 13, lineHeight: 18, color: muted, marginBottom: 2, letterSpacing: -0.08 },
  ringSub: { fontSize: 13, lineHeight: 18, color: muted, letterSpacing: -0.08 },
  ringRemainingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 3 },
  duesList: { position: 'absolute', left: 16, top: 385, width: 370, gap: 10 },
  dueRow: { height: 72, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 24, borderWidth: 0, borderColor: 'transparent', paddingHorizontal: 16, paddingVertical: 16 },
  dueRowSelected: { borderColor: '#16720b', borderWidth: 1, backgroundColor: '#edf3ef' },
  duesSheetLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 20, justifyContent: 'flex-end' },
  duesSheetScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(3,7,18,0.28)' },
  duesActionSheet: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 16, paddingBottom: 24, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: -8 } },
  duesSheetHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  duesSheetTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: text, letterSpacing: 0.2 },
  duesSheetSub: { width: 260, marginTop: 4, fontSize: 13, lineHeight: 18, color: muted, letterSpacing: -0.08 },
  duesSheetScroll: { maxHeight: 405, marginBottom: 16 },
  duesSheetList: { gap: 10, paddingBottom: 4 },
  moreRow: { position: 'absolute', left: 16, top: 713, width: 370, height: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewAllPill: { minHeight: 35, flexDirection: 'row', alignItems: 'center', gap: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999 },
  viewAllDark: { color: text, fontWeight: '600', fontSize: 14, lineHeight: 18, letterSpacing: -0.2 },
  viewAllIcon: { width: 14, height: 14 },
  duesCta: { position: 'absolute', left: 16, top: 763, width: 370, height: 50, borderRadius: 25, backgroundColor: green, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 18 },
  duesCtaPinned: { position: 'absolute', left: 16, right: 16, bottom: 22, height: 50, borderRadius: 25, backgroundColor: green, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 18, shadowColor: '#0b1f17', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  duesCtaBackdrop: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 96, backgroundColor: canvas },
  homeIndicator1843: { position: 'absolute', alignSelf: 'center', width: 144, height: 5, borderRadius: 4, backgroundColor: '#0a0a0a', bottom: 8 },

  homeDecorA: { position: 'absolute', right: -112, top: -20, width: 330, height: 373, transform: [{ rotate: '86deg' }] },
  homeDecorB: { position: 'absolute', right: 67, top: -392, width: 486, height: 361, transform: [{ rotate: '-120deg' }] },
  nextUpHero: { position: 'absolute', left: 41, top: 88, width: 320, height: 285 },
  nextUpList: { position: 'absolute', left: 16, top: 405, width: 370, gap: 10 },
  nextUpBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 132, backgroundColor: 'rgba(255,255,255,0.94)', paddingTop: 16 },
  paymentScreen: { height: 830, position: 'relative', backgroundColor: canvas, overflow: 'hidden', paddingHorizontal: 0 },
  paymentScreenPlain: { height: 830, position: 'relative', backgroundColor: canvas, overflow: 'hidden', paddingHorizontal: 16, paddingBottom: 14 },
  paymentBackdropClean: { position: 'absolute', left: 0, top: 0, width: 402, height: 830, backgroundColor: canvas, overflow: 'hidden' },
  paymentBackdropLogo: { position: 'absolute', top: 29, left: 188, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  paymentBackdropRing: { position: 'absolute', top: 86, left: 41, width: 320, height: 285 },
  paymentBackdropRows: { position: 'absolute', left: 16, top: 405, width: 370, gap: 10 },
  paymentAmountWrap: { position: 'absolute', top: 86, left: 41, width: 320, height: 285 },
  paymentScrimAnimated: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 20 },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.70)' },
  paymentSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30, backgroundColor: canvas, borderTopLeftRadius: 38, borderTopRightRadius: 38, paddingHorizontal: 16, paddingTop: 5, paddingBottom: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 38, shadowOffset: { width: 0, height: -15 } },
  sheetGrabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 99, backgroundColor: '#cccccc', marginTop: 5, marginBottom: 18 },
  sheetGrabberPressable: { alignSelf: 'center', width: 96, height: 28, alignItems: 'center', justifyContent: 'flex-start' },
  sheetTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: text, letterSpacing: -0.3, marginBottom: 20 },
  paymentRowsCard: { gap: 20, marginBottom: 16 },
  paymentRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentIcon: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  paymentIconApple: { paddingHorizontal: 8 },
  paymentSvgIcon: { width: 26, height: 26 },
  applePayIcon: { width: 38, height: 38 },
  paymentIconText: { fontSize: 22, fontWeight: '700', color: text },
  paymentTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: text, letterSpacing: -0.41 },
  paymentSub: { fontSize: 13, lineHeight: 16, color: muted, marginTop: 4, letterSpacing: -0.2 },
  reviewCard: { minHeight: 52, borderRadius: 18, backgroundColor: '#fff', marginTop: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paymentReviewCard: { borderRadius: 24, backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  reviewLine: { minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  reviewDivider: { height: 1, backgroundColor: borderSubtle, width: '100%' },
  successText: { color: '#15803d', fontSize: 15, fontWeight: '400' },
  duesCtaInline: { minHeight: 50, borderRadius: 25, backgroundColor: green, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 18, paddingHorizontal: 20 },
  disabledCta: { backgroundColor: '#e5e7eb' },
  disabledCtaText: { color: '#6b7280' },
  cardForm: { gap: 12, marginTop: 10, flex: 1 },

  addCardScreenFigma: { height: 830, position: 'relative', backgroundColor: canvas, overflow: 'hidden' },
  addCardScrim: { position: 'absolute', left: 0, top: -44, width: 402, height: 890, backgroundColor: 'rgba(0,0,0,0.70)', zIndex: 20 },
  addCardSheet: { position: 'absolute', left: 0, top: 45, width: 402, bottom: 0, borderTopLeftRadius: 38, borderTopRightRadius: 38, backgroundColor: canvas, paddingHorizontal: 16, paddingTop: 5, zIndex: 30, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 38, shadowOffset: { width: 0, height: -15 } },
  addCardSheetFilled: { top: 341, height: 489, bottom: 0 },
  addCardSheetTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: text, letterSpacing: -0.3, marginBottom: 24 },
  addCardSheetFields: { width: 370, height: 186, gap: 14 },
  addCardSheetFieldsFilled: { height: 186 },
  addCardSheetField: { width: 370, height: 86 },
  addCardSheetRow: { width: 370, height: 86, flexDirection: 'row', gap: 16 },
  addCardSheetHalfField: { width: 177, height: 86 },
  addCardSheetLabelRow: { height: 18, flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  addCardSheetLabel: { fontSize: 13, lineHeight: 18, color: muted, letterSpacing: -0.08 },
  addCardSheetTinyIcon: { fontSize: 16, lineHeight: 18, color: '#6b7280' },
  addCardSheetInput: { height: 56, borderRadius: 16, backgroundColor: '#fff', borderWidth: 0.8, borderColor: border, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addCardSheetInputActive: { borderColor: green, borderWidth: 1.2, shadowColor: green, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  addCardSheetTextInput: { flex: 1, minWidth: 0, padding: 0, margin: 0, fontSize: 16, lineHeight: 21, color: text, letterSpacing: 0, outlineStyle: 'none' as any },
  addCardCalendarButton: { width: 34, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  addCardKeyboardAnimated: { position: 'absolute', left: 0, bottom: 0, width: 402, height: 318, zIndex: 40 },
  addCardCalendarPicker: { position: 'absolute', left: 16, top: 276, width: 370, minHeight: 152, borderRadius: 24, backgroundColor: '#fff', padding: 14, zIndex: 60, shadowColor: '#0f172a', shadowOpacity: 0.14, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } },
  addCardCalendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addCardCalendarTitle: { color: text, fontSize: 16, lineHeight: 21, fontWeight: '700', letterSpacing: -0.18 },
  addCardCalendarClose: { color: muted, fontSize: 26, lineHeight: 28, fontWeight: '300', paddingHorizontal: 4 },
  addCardCalendarYear: { color: muted, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  addCardCalendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addCardCalendarMonth: { width: 107, height: 38, borderRadius: 16, backgroundColor: '#f4f6f5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e6ebe8' },
  addCardCalendarMonthActive: { backgroundColor: green, borderColor: green },
  addCardCalendarMonthText: { color: text, fontSize: 14, lineHeight: 18, fontWeight: '600' },
  addCardCalendarMonthTextActive: { color: neon },
  addCardSheetPlaceholder: { color: muted },
  addCardSheetCalendar: { color: '#657083', fontSize: 24, lineHeight: 24 },
  addCardSheetReview: { width: 370, minHeight: 107, borderRadius: 24, backgroundColor: '#fff', padding: 16, gap: 16, marginTop: 20 },
  addCardReviewLabel: { color: muted, fontSize: 16, lineHeight: 21, letterSpacing: -0.32 },
  addCardFreeText: { color: '#15803d', fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.24 },
  addCardSheetCta: { position: 'absolute', left: 16, bottom: 34, width: 370, height: 50, borderRadius: 25, backgroundColor: green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addCardSheetCtaFilled: { bottom: 18 },
  addCardSheetCtaDisabled: { backgroundColor: '#e5e7eb' },
  addCardCtaText: { color: neon, fontSize: 17, lineHeight: 22, fontWeight: '500', letterSpacing: -0.2 },
  addCardSheetCtaTextDisabled: { color: muted },

  otpScreenFigma: { height: 830, position: 'relative', backgroundColor: '#fff', overflow: 'hidden' },
  otpBankClip: { position: 'absolute', left: 0, top: 84, width: 402, height: 746, overflow: 'hidden', backgroundColor: '#fff' },
  otpBankImage: { position: 'absolute', left: 17, top: -104.7, width: 366, height: 795.2 },
  otpBankTextBlock: { position: 'absolute', left: 16, top: 134, width: 367, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8 },
  otpBankArabic: { fontSize: 12, lineHeight: 18, color: '#030712', textAlign: 'right', writingDirection: 'rtl' },
  otpBankArabicBold: { fontWeight: '700' },
  otpHiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 },
  otpBankInputOverlay: { position: 'absolute', left: 97, top: 242, width: 210, height: 30, alignItems: 'center', justifyContent: 'center' },
  otpBankCodeText: { fontSize: 15, lineHeight: 18, color: '#030712', letterSpacing: 3, textAlign: 'center' },
  otpBankSubmitOverlay: { position: 'absolute', left: 97, top: 279, width: 210, height: 27 },
  iosKeyboard: { position: 'absolute', left: 0, bottom: 0, width: 402, height: 274, paddingTop: 12, paddingHorizontal: 8, paddingBottom: 34, backgroundColor: '#e6e9ed', gap: 6, borderTopLeftRadius: 27, borderTopRightRadius: 27, overflow: 'hidden', zIndex: 40 },
  iosKeyboardTall: { height: 318, paddingTop: 24, borderTopLeftRadius: 27, borderTopRightRadius: 27 },
  iosKeyboardRow: { flexDirection: 'row', gap: 6, height: 50 },
  iosKeyboardKey: { flex: 1, height: 50, borderRadius: 8.5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  iosKeyboardDeleteKey: { backgroundColor: 'transparent' },
  iosKeyboardKeySpace: { flex: 1, height: 50 },
  iosKeyboardKeyText: { fontSize: 23, lineHeight: 28, color: '#000', fontWeight: '400' },
  iosKeyboardDeleteText: { color: '#595959', fontSize: 22 },
  iosKeyboardHomeIndicator: { position: 'absolute', bottom: 8, left: 129, width: 144, height: 5, borderRadius: 100, backgroundColor: '#030712' },

  newCardPreview: { height: 132, borderRadius: 26, backgroundColor: green, padding: 18, justifyContent: 'space-between', shadowColor: '#022b10', shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
  newCardBrand: { color: neon, fontSize: 16, fontWeight: '700' },
  newCardNumber: { color: '#fff', fontSize: 20, fontWeight: '600', letterSpacing: 1.4 },
  newCardMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12 },
  formLabel: { fontSize: 13, color: muted, marginBottom: 6 },
  formInput: { height: 58, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: border, paddingHorizontal: 16, justifyContent: 'center' },
  formText: { fontSize: 17, color: text, fontWeight: '500' },
  formHint: { color: muted, fontSize: 12, lineHeight: 16, marginTop: 8 },
  statusScreen: { height: 830, paddingHorizontal: 16, backgroundColor: canvas, paddingBottom: 14 },
  statusCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 70 },
  statusBadge: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#f5f2e8', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  statusBadgeSuccess: { backgroundColor: '#ecffe6' },
  statusBadgeError: { backgroundColor: '#fee2e2' },
  statusBadgeText: { fontSize: 30, fontWeight: '700', color: green },
  statusTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: text, textAlign: 'center', letterSpacing: -0.3 },
  statusBody: { fontSize: 13, lineHeight: 18, color: muted, textAlign: 'center', marginTop: 10, maxWidth: 340 },
  otpPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 40 },
  otpBoxes: { flexDirection: 'row', gap: 10, marginTop: 18, marginBottom: 10 },
  otpBox: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center' },
  otpBoxFilled: { borderColor: green, backgroundColor: '#edf3ef' },
  otpText: { fontSize: 24, fontWeight: '700', color: text },
  processingScreen: { height: 830, paddingHorizontal: 24, backgroundColor: canvas, paddingBottom: 14 },
  processingCenter: { width: 354, alignSelf: 'center', alignItems: 'center', paddingTop: 115 },
  hourglassImage: { width: 118, height: 118, marginBottom: 23 },
  processingCopyBlock: { width: 354, alignItems: 'center', gap: 12, marginBottom: 23 },
  processingReviewCard: { width: 354, height: 107, borderRadius: 24, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, gap: 16 },
  bufferTrack: { width: 288, height: 12, borderRadius: 999, backgroundColor: '#fff', marginTop: 23, overflow: 'hidden' },
  bufferFill: { height: 12, borderRadius: 999, backgroundColor: green },
  invisibleSkip: { width: 1, height: 1, opacity: 0 },

  successScreenFigma: { height: 830, position: 'relative', backgroundColor: canvas, overflow: 'hidden' },
  successProgFigma: { position: 'absolute', left: 0, top: 171, width: 402, height: 377, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 28, overflow: 'hidden' },
  successTopBlockFigma: { width: 362, height: 202, alignItems: 'center', gap: 24 },
  successCelebrationFigma: { width: 122, height: 122 },
  successCopyFigma: { width: 362, alignItems: 'center', gap: 10 },
  successTitleFigma: { width: 370, fontSize: 28, lineHeight: 34, fontWeight: '700', color: text, letterSpacing: 0.36, textAlign: 'center' },
  successSubtitleFigma: { width: 308, fontSize: 13, lineHeight: 18, color: 'rgba(3,7,18,0.74)', letterSpacing: -0.08, textAlign: 'center' },
  successNextUpCard: { position: 'absolute', left: 20, top: 234, width: 362, height: 60, borderRadius: 16, backgroundColor: '#fff', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  successWarningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d98c1a' },
  successNextCopy: { flex: 1, height: 39, gap: 6, overflow: 'hidden' },
  successNextTitle: { fontSize: 15, lineHeight: 20, color: text, fontWeight: '600', letterSpacing: -0.24 },
  successNextSub: { fontSize: 11, lineHeight: 13, color: '#713f12', letterSpacing: 0.06 },
  successPlayButton: { position: 'absolute', left: 16, top: 742, width: 370, height: 50, borderRadius: 999, backgroundColor: green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 20, overflow: 'hidden' },
  successHomeBtnPinned: { position: 'absolute', left: 16, right: 16, bottom: 30, height: 50, borderRadius: 999, backgroundColor: green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 20, overflow: 'hidden' },
  successPlayText: { color: neon, fontSize: 17, lineHeight: 18, fontWeight: '500', letterSpacing: -0.2 },

  successScreen: { height: 830, backgroundColor: canvas, overflow: 'hidden', paddingHorizontal: 16, paddingBottom: 14 },
  successMainFrame: { flex: 1, overflow: 'hidden' },
  successTopBlock: { width: 358, alignSelf: 'center', alignItems: 'center', gap: 12, paddingTop: 86 },
  successCelebration: { width: 86, height: 86 },
  successTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: text, letterSpacing: -0.3, textAlign: 'center' },
  successSubtitle: { width: 310, fontSize: 15, lineHeight: 20, color: muted, textAlign: 'center', letterSpacing: -0.2 },
  successDetailsStack: { width: 358, alignSelf: 'center', gap: 13, marginTop: 62 },
  successMerchantCard: { width: 358, minHeight: 69, borderRadius: 24, backgroundColor: '#fff', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  successMerchantLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  successMerchantLogoBox: { width: 37, height: 37, borderRadius: 8, borderWidth: 1, borderColor: border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  successMerchantLogo: { width: 26, height: 18 },
  successMerchantName: { width: 110, fontSize: 17, lineHeight: 22, color: text, fontWeight: '600', letterSpacing: -0.41 },
  successReviewCard: { width: 358, borderRadius: 24, backgroundColor: '#fff', padding: 16, gap: 16, overflow: 'hidden' },
  successReviewLabel: { color: muted, fontSize: 15, lineHeight: 20, letterSpacing: -0.24 },
  successReviewValue: { color: text, fontSize: 16, lineHeight: 21, fontWeight: '600', letterSpacing: -0.32 },
  successDownloadCard: { width: 358, height: 60, borderRadius: 16, backgroundColor: '#fff', padding: 16, justifyContent: 'center', overflow: 'hidden' },
  successDownloadTextWrap: { gap: 6, overflow: 'hidden' },
  successDownloadTitle: { color: text, fontSize: 14, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  successDownloadSub: { color: '#666', fontSize: 11, lineHeight: 13, letterSpacing: 0.06 },
  successDoneButton: { width: 358, height: 56, borderRadius: 999, backgroundColor: green, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', shadowColor: '#0b3d1d', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  successRedirectText: { marginTop: 42, width: 358, color: '#4b5563', fontSize: 15, lineHeight: 20, textAlign: 'center', letterSpacing: -0.24 },
  successBrowserChrome: { height: 122, width: 390, alignSelf: 'center', paddingTop: 16, paddingHorizontal: 28, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  successBrowserCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(250,250,250,0.7)', borderWidth: 1, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 2 } },
  successBrowserGlyph: { fontSize: 23, color: '#1b1b1b', lineHeight: 24 },
  successAddressBar: { width: 218, height: 48, borderRadius: 24, backgroundColor: 'rgba(250,250,250,0.7)', borderWidth: 1, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 21, shadowOffset: { width: 0, height: 2 } },
  successAddressText: { fontSize: 17, color: '#1b1b1b', maxWidth: 160 },
  successAddressIconLeft: { position: 'absolute', left: 14, width: 15, height: 18 },
  successAddressIconRight: { position: 'absolute', right: 12, width: 15, height: 18 },
  successBrowserHomeIndicator: { position: 'absolute', bottom: 8, left: 123, width: 144, height: 5, borderRadius: 100, backgroundColor: '#030712' },
});
