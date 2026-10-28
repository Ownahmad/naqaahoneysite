import * as Dialog from '@radix-ui/react-dialog';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

export type Language = 'ar' | 'en';
type Text = { ar: string; en: string };

const STORAGE_KEY = 'pure-honey-language';

function storedLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'ar' || value === 'en') {
      document.documentElement.lang = value;
      document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export const text = (ar: string, en: string): Text => ({ ar, en });

function formatDisplayText(value: string): string {
  const digits = value.replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) - (digit >= '۰' ? 0x06f0 : 0x0660)));
  const units: Record<string, string> = { 'كغ': 'kg', 'غ': 'g', 'مل': 'ml' };
  return digits.replace(/^(\d+(?:\.\d+)?)\s*(كغ|غ|مل)$/, (_, amount: string, unit: string) => `${amount} ${units[unit]}`);
}

const strings = {
  brand: text('عسل النقاء', 'Pure Honey'),
  tagline: text('محل عسل أردني 🇯🇴', 'Jordanian honey shop 🇯🇴'),
  logoAlt: text('شعار عسل النقاء', 'Pure Honey logo'),
  chooseLanguage: text('أهلاً بكم في عسل النقاء', 'Welcome to Pure Honey'),
  chooseLanguageHint: text('يرجى اختيار اللغة للمتابعة', 'Please choose your language to continue'),
  arabic: text('العربية', 'Arabic'),
  english: text('English', 'English'),
  switchLanguage: text('تغيير اللغة', 'Change language'),
  all: text('الكل', 'All'),
  honey: text('أنواع العسل', 'Honey varieties'),
  beeProducts: text('منتجات العسل', 'Bee products'),
  dermoder: text('منتجات العناية بالبشرة', 'Skincare products'),
  shop: text('المحل', 'Our shop'),
  location: text('الموقع', 'Location'),
  contact: text('تواصل معنا', 'Contact'),
  mainNav: text('التنقل الرئيسي', 'Main navigation'),
  mobileNav: text('قائمة الهاتف', 'Mobile navigation'),
  instagram: text('إنستجرام', 'Instagram'),
  facebook: text('فيسبوك', 'Facebook'),
  map: text('موقع المحل', 'Shop location'),
  cart: text('السلة', 'Cart'),
  openCart: text('فتح السلة', 'Open cart'),
  orderNow: text('اطلب الآن', 'Order now'),
  openMenu: text('فتح القائمة', 'Open menu'),
  closeMenu: text('إغلاق القائمة', 'Close menu'),
  jordan: text('من قلب الأردن', 'From the heart of Jordan'),
  heroSub: text('صحة وشفاء', 'Health & healing'),
  heroCopy: text('عسل مختار من أجود أنواع العسل', 'Carefully selected from the finest varieties of honey'),
  browse: text('تصفّح منتجاتنا', 'Browse our products'),
  knowShop: text('تعرّف على محلنا', 'Discover our shop'),
  quranTranslation: text('', '“In it is healing for people.”'),
  shelves: text('رفوفنا المفتوحة', 'Our open shelves'),
  products: text('منتجاتنا', 'Our products'),
  productIntro: text('اختاروا الفئة المناسبة لتظهر منتجاتها، أو شاهدوا جميع منتجات عسل النقاء معاً.', 'Choose a category, or browse every Pure Honey product together.'),
  filterProducts: text('تصفية المنتجات', 'Filter products'),
  quickBrowse: text('تصفّح حسب القسم', 'Shop by category'),
  chooseQuantity: text('اختاروا الكمية المناسبة', 'Choose your preferred size'),
  selectQuantity: text('اختيار كمية', 'Select a size for'),
  enlarge: text('تكبير صورة', 'Enlarge image of'),
  addCart: text('أضف للسلة', 'Add to cart'),
  orderWhatsapp: text('اطلب عبر واتساب', 'Order on WhatsApp'),
  dinar: text('دينار', 'JOD'),
  added: text('تمت الإضافة إلى السلة', 'Added to cart'),
  closeImage: text('إغلاق الصورة', 'Close image'),
  previousImage: text('الصورة السابقة', 'Previous image'),
  nextImage: text('الصورة التالية', 'Next image'),
  shoppingCart: text('عربة التسوق', 'Shopping cart'),
  close: text('إغلاق', 'Close'),
  emptyCart: text('عربة التسوق فارغة', 'Your cart is empty'),
  decrease: text('تقليل الكمية', 'Decrease quantity'),
  increase: text('زيادة الكمية', 'Increase quantity'),
  remove: text('إزالة المنتج', 'Remove product'),
  total: text('المجموع الكلي:', 'Total:'),
  checkout: text('إتمام الطلب عبر واتساب', 'Checkout on WhatsApp'),
  clearCart: text('إفراغ العربة', 'Clear cart'),
  shopEyebrow: text('المحل كما هو', 'The real shop'),
  fromShelves: text('من رفوفنا', 'From our shelves'),
  toHomes: text('لبيوتكم', 'to your home'),
  shopCopy: text('صور حقيقية من محلنا في الأردن، حيث بتشوفوا الأصناف قدامكم وبتختاروا العسل اللي بناسب ذوقكم وميزانيتكم.', 'Real photos from our Jordan shop, where you can see every variety and choose the honey that suits your taste and budget.'),
  realPhotos: text('صور حقيقية', 'Real photos'),
  directShop: text('من محلنا مباشرة', 'Directly from our shop'),
  yourChoice: text('اختياركم', 'Your choice'),
  kiloLess: text('كيلو أو أقل', 'One kilo or less'),
  viewPlace: text('شاهدوا تفاصيل المكان', 'See the shop'),
  insideShop: text('من داخل محلنا', 'Inside our shop'),
  galleryEyebrow: text('الصور الحقيقية', 'Authentic photos'),
  insidePure: text('من داخل النقاء', 'Inside Pure Honey'),
  backShop: text('العودة لمعلومات المحل', 'Back to shop details'),
  visitEyebrow: text('موقعنا', 'Our location'),
  visit: text('زورونا في المحل', 'Visit our shop'),
  visitCopy: text('أبوابنا مفتوحة لكم لتجربة الأصناف بأنفسكم واختيار اللي بناسبكم. بنتشرف بزيارتكم في أي وقت.', 'Our doors are open so you can explore the varieties and choose what suits you. We would be delighted to welcome you.'),
  googleMaps: text('افتح في خرائط جوجل', 'Open in Google Maps'),
  directions: text('الوصول للموقع', 'Get directions'),
  footerCopy: text('عسل أردني مختار من أفضل المناحل، نقدّمه لكم بأسعار واضحة وكميات تناسب احتياجاتكم. زورونا أو اطلبوا أونلاين.', 'Selected Jordanian honey from outstanding apiaries, with clear prices and sizes for every need. Visit us or order online.'),
  quickLinks: text('روابط سريعة', 'Quick links'),
  reachUs: text('تواصلوا معنا', 'Get in touch'),
  rights: text('جميع الحقوق محفوظة', 'All rights reserved'),
  notFound: text('الصفحة غير موجودة', 'Page not found'),
  notFoundCopy: text('نعتذر، لم نتمكن من العثور على الصفحة المطلوبة.', 'Sorry, we could not find the page you requested.'),
  home: text('العودة للصفحة الرئيسية', 'Back to home'),
} as const;

type I18nContextValue = {
  language: Language;
  dir: 'rtl' | 'ltr';
  setLanguage: (language: Language) => void;
  t: (value: Text) => string;
  s: typeof strings;
  money: (value: number) => string;
  number: (value: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(storedLanguage);
  const [language, setLanguageState] = useState<Language>(initial ?? 'ar');
  const [needsChoice, setNeedsChoice] = useState(initial === null);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (next: Language) => {
    const nextDir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
    document.documentElement.dir = nextDir;
    document.body.dir = nextDir;
    setLanguageState(next);
    setNeedsChoice(false);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* storage may be unavailable */ }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [language, dir]);

  const value: I18nContextValue = {
    language,
    dir,
    setLanguage,
    t: (item) => formatDisplayText(item[language]),
    s: strings,
    money: (amount) => new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(amount),
    number: (amount) => new Intl.NumberFormat('en-JO').format(amount),
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
      <Dialog.Root open={needsChoice}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-white" />
          <Dialog.Content
            dir="ltr"
            className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-[#d69b39]/40 bg-white p-7 text-center text-[#382919] shadow-2xl focus:outline-none sm:p-9"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <img src="/logo.png" alt="شعار عسل النقاء | Pure Honey" className="mx-auto h-32 w-32 rounded-full border-2 border-[#d69b39]/70 bg-[#15110e] object-cover shadow-[0_10px_32px_rgba(90,53,15,.24)] sm:h-36 sm:w-36" />
            <Dialog.Title className="mt-5 font-display text-2xl text-[#765020]">
              <span lang="ar" dir="rtl" className="block">أهلاً بكم في عسل النقاء</span>
              <span lang="en" dir="ltr" className="mt-2 block text-xl">Welcome to Pure Honey</span>
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm leading-6 text-zinc-600">
              <span lang="ar" dir="rtl" className="block">يرجى اختيار اللغة للمتابعة</span>
              <span lang="en" dir="ltr" className="block">Please choose your language to continue</span>
            </Dialog.Description>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button autoFocus type="button" lang="ar" dir="rtl" onClick={() => setLanguage('ar')} className="focus-ring rounded-xl bg-[#d69b39] px-3 py-3.5 font-extrabold text-black">العربية</button>
              <button type="button" lang="en" dir="ltr" onClick={() => setLanguage('en')} className="focus-ring rounded-xl border border-[#d69b39]/50 bg-white px-3 py-3.5 font-bold text-[#765020]">English</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within LanguageProvider');
  return context;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t, s } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
      className="focus-ring flex h-10 shrink-0 items-center justify-center rounded-full border border-[#e4b95f]/35 bg-black/40 px-3 text-xs font-extrabold text-[#f3cf82] transition-colors hover:bg-[#d29432] hover:text-black"
      aria-label={t(s.switchLanguage)}
      title={t(s.switchLanguage)}
      data-testid="button-language"
    >
      {language === 'ar' ? 'EN' : compact ? 'ع' : 'العربية'}
    </button>
  );
}