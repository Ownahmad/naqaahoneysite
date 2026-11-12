import { type AnchorHTMLAttributes, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { ToastAction } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { LanguageProvider, LanguageSwitcher, text, useI18n } from '@/i18n';
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Facebook, Gift, Instagram, MapPin, Menu, MessageCircle, Phone, Star, X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Route, Switch } from 'wouter';
import { products, productPath, productThumbnail, type FilterKey, type Product } from './products';
import './light-theme.css';

const queryClient = new QueryClient();
const phone = '962782307118';
const whatsapp = (message: string) => `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
const instagramUrl = 'https://www.instagram.com/thepurehoney83';
const facebookUrl = 'https://www.facebook.com/share/19YSRMvwz3/?mibextid=wwXIfr';
const mapUrl = 'https://maps.app.goo.gl/8Sp9F1bWEX5653xN8';
const googleReviewsUrl = 'https://www.google.com/maps/place//data=!4m3!3m2!1s0x151b7b000c5e5ba7:0x9ccd02a2b364cfea!12e1';
type Localized = ReturnType<typeof text>;
type CatalogFilter = FilterKey | 'favorites';
const favoritesKey = 'naqaa-favorite-products';

function readFavorites(): string[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(favoritesKey) ?? '[]');
    return Array.isArray(saved) ? products.filter(product => saved.includes(product.id)).map(product => product.id) : [];
  } catch {
    return [];
  }
}
const offersLabel = text('البكجات والعروض', 'Bundles & offers');
const galleryPreview = (src: string) => src.replace(/\.jpg$/, '-preview.webp');

type GalleryItem = { src: string; label: Localized };

const gallery: GalleryItem[] = [
  { src: '/images/IMG-20260913-WA0031_1789289463645.jpg', label: text('واجهة المحل من الخارج', 'Shop exterior') },
  { src: '/images/IMG-20260913-WA0044_1789289463561.jpg', label: text('شمع العسل في المحل', 'Honeycomb in the shop') },
  { src: '/images/IMG-20260913-WA0006_1789289463721.jpg', label: text('المحل مساءً', 'The shop at night') },
  { src: '/images/IMG-20260913-WA0046_1789289463526.jpg', label: text('داخل محل عسل النقاء', 'Inside Pure Honey') },
  { src: '/images/IMG-20260913-WA0043_1789289463579.jpg', label: text('رفوف العسل في محل النقاء', 'Pure Honey shelves') },
  { src: '/images/IMG-20260913-WA0045_1789289463540.jpg', label: text('تشكيلة العسل في الرفوف', 'Honey selection on our shelves') },
];

function WhatsAppLink({ children, className = '', product, quantity, price, message, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; product?: string; quantity?: string; price?: string; message?: string }) {
  const { language } = useI18n();
  const defaultMessage = product
    ? language === 'ar' ? `السلام عليكم، أرغب بطلب ${product} من عسل النقاء بكمية ${quantity} بسعر ${price}. أرجو تأكيد الطلب.` : `Hello, I would like to order ${product} (${quantity}) from Pure Honey for ${price}. Please confirm my order.`
    : language === 'ar' ? 'السلام عليكم، أود الاستفسار عن منتجات عسل النقاء.' : 'Hello, I would like to ask about Pure Honey products.';
  return <a {...props} className={`focus-ring ${className}`} href={whatsapp(message ?? defaultMessage)}>{children}</a>;
}

function BrandMark({ large = false, header = false }: { large?: boolean; header?: boolean }) {
  const { t, s } = useI18n();
  return (
    <a href="#top" className="focus-ring group flex min-w-0 items-center gap-2.5" data-testid="link-brand">
      <span className={`relative shrink-0 overflow-hidden rounded-full border border-[#d69b39]/60 bg-[#111] shadow-[0_4px_18px_rgba(90,53,15,.18)] ${large ? 'h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28' : 'h-16 w-16'}`}>
        <img src="/images/brand-logo.webp" width="160" height="160" decoding="async" alt={t(s.logoAlt)} className="h-full w-full object-cover" />
      </span>
      <span className={`${header ? 'hidden sm:block' : 'block'} min-w-0 leading-none`}>
        <strong className={`block whitespace-nowrap font-display text-[#f4d58b] ${large ? 'text-xl sm:text-2xl md:text-3xl' : 'text-lg'}`}>{t(s.brand)}</strong>
        <small className={`mt-1.5 block whitespace-nowrap text-[#cdb582] ${large ? 'text-[10px] sm:text-xs' : 'text-[9px] md:text-[11px]'}`}>{t(s.tagline)}</small>
      </span>
    </a>
  );
}

function ProductCard({ product, favorite, onFavorite, onAdd }: { product: Product; favorite: boolean; onFavorite: () => void; onAdd: (product: Product, key: string, price: number) => void }) {
  const { t, s, money, dir } = useI18n();
  const [quantityKey, setQuantityKey] = useState(() => product.quantities.find(item => item.key === 'half')?.key ?? product.quantities[0].key);
  const selected = product.quantities.find(item => item.key === quantityKey) ?? product.quantities[0];
  const price = Number((product.price * selected.multiplier).toFixed(2));
  const category = product.category === 'honey' ? s.honey : product.category === 'bee' ? s.beeProducts : s.dermoder;
  return (
    <article className="product-card group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0a0a0a] shadow-xl transition-all hover:-translate-y-1 hover:border-white/20">
      <button type="button" onClick={onFavorite} aria-pressed={favorite} aria-label={`${t(text('المفضلة', 'Favorites'))} · ${t(product.name)}`} className="favorite-star focus-ring absolute start-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border">
        <Star size={21} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
      <a href={productPath(product.id)} className="product-image-panel focus-ring relative flex aspect-[4/5] items-center justify-center overflow-hidden p-3">
        <img src={productThumbnail(product.id)} loading="lazy" decoding="async" alt={t(product.name)} className="image-lift h-full w-full object-contain" />
        {product.category !== 'honey' && <span className="absolute end-3 top-3 rounded-full border border-[#f1d28e]/20 bg-black/80 px-3 py-1 text-xs font-bold text-[#f4d58b]">{t(product.tone)}</span>}
        <span className="absolute bottom-3 start-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f7e4b3] text-black opacity-0 group-hover:opacity-100"><ArrowUpRight size={16} aria-hidden="true" /></span>
      </a>
      <div className="relative z-20 flex min-h-[136px] flex-1 items-end justify-between gap-3 p-4">
        <div><span className="product-category mb-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold">{t(category)}</span><h3 className="font-display text-xl font-bold leading-tight text-[#f2dfb3]"><a className="focus-ring hover:underline" href={productPath(product.id)}>{t(product.name)}</a></h3><p className="mt-2 text-sm text-zinc-400">{t(product.description)}</p></div>
        <div className="shrink-0 text-end" dir={dir}><strong className="product-price font-display text-2xl">{money(price)}</strong><span className="block text-[10px] font-bold text-zinc-400">{t(selected.label)}</span></div>
      </div>
      <div className={`relative z-20 mx-4 mb-4 grid gap-1.5 rounded-xl border border-white/5 bg-[#141414] p-1 ${product.quantities.length > 2 ? 'grid-cols-3' : product.quantities.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`} role="group" aria-label={`${t(s.selectQuantity)} ${t(product.name)}`}>
        {product.quantities.map(item => <button key={item.key} type="button" onClick={() => setQuantityKey(item.key)} aria-pressed={quantityKey === item.key} className={`focus-ring rounded-lg px-2 py-2 text-xs font-extrabold ${quantityKey === item.key ? 'bg-[#b77c24] text-black' : 'text-[#c6ad81] hover:bg-[#222]'}`}><span dir="auto" className="block">{t(item.label)}</span>{t(item.grams) !== t(item.label) && <span dir="auto" className="mt-0.5 block text-[10px] font-normal opacity-75">{t(item.grams)}</span>}</button>)}
      </div>
      <div className="relative z-20 mx-4 mb-4 grid gap-2">
        <button type="button" onClick={() => onAdd(product, quantityKey, price)} className="honey-button flex w-full items-center justify-center gap-2 rounded-xl bg-[#d69b39] py-2.5 text-sm font-extrabold text-black" aria-label={`${t(s.addCart)} ${t(product.name)}`}>{t(s.addCart)} <ShoppingCart size={16} /></button>
        <WhatsAppLink product={t(product.name)} quantity={t(selected.label)} price={money(price)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] py-2.5 text-sm font-bold text-[#c6ad81] hover:bg-white/5">{t(s.orderWhatsapp)} <MessageCircle size={16} /></WhatsAppLink>
      </div>
    </article>
  );
}

function ProductCatalog({ filter, setFilter, favorites, onFavorite, onAdd }: { filter: CatalogFilter; setFilter: (key: CatalogFilter) => void; favorites: string[]; onFavorite: (id: string) => void; onAdd: (product: Product, key: string, price: number) => void }) {
  const { t, s } = useI18n();
  const filters: { key: CatalogFilter; label: Localized }[] = [{ key: 'all', label: s.all }, { key: 'honey', label: s.honey }, { key: 'bee', label: s.beeProducts }, { key: 'dermoder', label: s.dermoder }, { key: 'favorites', label: text('المفضلة', 'Favorites') }];
  const visible = products.filter(product => {
    if (filter === 'favorites') return favorites.includes(product.id);
    return filter === 'all' || product.category === filter;
  });
  return (
    <section id="products" className="scroll-mt-6 px-5 py-12 text-[#f1dfb5] lg:px-10 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div><span className="mb-3 block text-xs font-extrabold tracking-[.2em] text-[#d5a955]">{t(s.shelves)}</span><h2 className="font-display text-4xl text-[#f3dfae] sm:text-5xl">{t(s.products)}</h2><p className="mt-3 max-w-2xl text-zinc-300">{t(s.productIntro)}</p></div>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/70 p-1.5" role="tablist" aria-label={t(s.filterProducts)}>
            {filters.map(item => <button key={item.key} role="tab" aria-selected={filter === item.key} onClick={() => setFilter(item.key)} className={`focus-ring rounded-full px-4 py-2.5 text-sm font-extrabold ${filter === item.key ? 'bg-[#d69b39] text-black' : 'text-[#d8c39a] hover:bg-white/10'}`}>{item.key === 'favorites' && <Star className="me-1 inline-block" size={14} aria-hidden="true" />}{t(item.label)}</button>)}
          </div>
        </div>
        {filter === 'favorites' && visible.length === 0 && <p className="rounded-2xl border border-white/10 p-5">{t(text('المفضلة فارغة. اضغط على نجمة أي منتج لإضافته.', 'Your favorites list is empty. Select a product’s star to save it.'))}</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visible.map(product => <ProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onFavorite={() => onFavorite(product.id)} onAdd={onAdd} />)}</div>
      </div>
    </section>
  );
}

function Lightbox({ items, index, setIndex, close }: { items: GalleryItem[]; index: number; setIndex: (index: number) => void; close: () => void }) {
  const { t, s, dir, number } = useI18n();
  useEffect(() => {
    const previous = () => setIndex((index - 1 + items.length) % items.length);
    const next = () => setIndex((index + 1) % items.length);
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') (dir === 'rtl' ? next : previous)();
      if (event.key === 'ArrowRight') (dir === 'rtl' ? previous : next)();
    };
    document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [close, dir, index, items.length, setIndex]);
  const item = items[index];
  return (
    <div dir={dir} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={t(item.label)} onClick={close}>
      <button onClick={close} className="focus-ring absolute end-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#f0c56a] text-black" aria-label={t(s.closeImage)}><X /></button>
      <button onClick={event => { event.stopPropagation(); setIndex((index - 1 + items.length) % items.length); }} className="focus-ring absolute start-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-[#f0c56a]" aria-label={t(s.previousImage)}>{dir === 'rtl' ? <ChevronRight /> : <ChevronLeft />}</button>
      <figure onClick={event => event.stopPropagation()}><img src={item.src} alt={t(item.label)} className="max-h-[78vh] max-w-[85vw] rounded-xl object-contain" /><figcaption className="mt-4 text-center font-display text-lg text-[#f5d995]">{t(item.label)} <span className="text-sm text-zinc-500">({number(index + 1)} / {number(items.length)})</span></figcaption></figure>
      <button onClick={event => { event.stopPropagation(); setIndex((index + 1) % items.length); }} className="focus-ring absolute end-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-[#f0c56a]" aria-label={t(s.nextImage)}>{dir === 'rtl' ? <ChevronLeft /> : <ChevronRight />}</button>
    </div>
  );
}

type CartItem = { id: string; productId: string; quantityKey: string; price: number; count: number };
function Cart({ open, close, cart, update, remove, clear }: { open: boolean; close: () => void; cart: CartItem[]; update: (id: string, delta: number) => void; remove: (id: string) => void; clear: () => void }) {
  const { t, s, money, language, dir } = useI18n();
  const total = cart.reduce((sum, item) => sum + item.price * item.count, 0);
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); }; document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, close]);
  if (!open) return null;
  const lines = cart.map(item => {
    const product = products.find(entry => entry.id === item.productId)!; const quantity = product.quantities.find(entry => entry.key === item.quantityKey)!;
    return `- ${t(product.name)} (${t(quantity.label)}) x${item.count} = ${money(item.price * item.count)}`;
  }).join('\n');
  const message = language === 'ar' ? `السلام عليكم، أود طلب المنتجات التالية:\n\n${lines}\n\nالمجموع: ${money(total)}` : `Hello, I would like to order:\n\n${lines}\n\nTotal: ${money(total)}`;
  return (
    <div dir={dir} className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={t(s.shoppingCart)}>
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} aria-label={t(s.close)} />
      <aside className="relative flex h-full w-full max-w-md flex-col border-s border-white/10 bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-5"><h2 className="font-display text-xl text-[#f3dfae]">{t(s.shoppingCart)}</h2><button onClick={close} aria-label={t(s.close)}><X /></button></div>
        <div className="flex-1 overflow-y-auto p-5">{cart.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-zinc-500"><ShoppingCart size={48} className="mb-4 opacity-20" /><p>{t(s.emptyCart)}</p></div> :
          <div className="grid gap-4">{cart.map(item => {
            const product = products.find(entry => entry.id === item.productId)!; const quantity = product.quantities.find(entry => entry.key === item.quantityKey)!;
            return <div key={item.id} className="flex gap-3 rounded-xl border border-white/5 bg-[#141414] p-3"><img src={productThumbnail(product.id)} loading="lazy" decoding="async" alt={t(product.name)} className="h-20 w-20 rounded-lg bg-[#050505] object-contain p-2" /><div className="flex min-w-0 flex-1 flex-col justify-between"><div><h3 className="font-bold text-[#f2dfb3]">{t(product.name)}</h3><div className="text-xs text-[#d5a955]">{t(quantity.label)}</div></div><div className="mt-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2 rounded-lg bg-[#050505] px-2 py-1"><button onClick={() => update(item.id, -1)} aria-label={t(s.decrease)}><Minus size={14} /></button><span>{item.count}</span><button onClick={() => update(item.id, 1)} aria-label={t(s.increase)}><Plus size={14} /></button></div><strong className="text-[#efbd4f]">{money(item.price * item.count)}</strong><button onClick={() => remove(item.id)} className="text-red-400" aria-label={t(s.remove)}><Trash2 size={16} /></button></div></div></div>;
          })}</div>}</div>
        {cart.length > 0 && <div className="border-t border-white/10 p-5"><div className="mb-4 flex items-center justify-between font-bold"><span>{t(s.total)}</span><span className="font-display text-2xl text-[#efbd4f]">{money(total)}</span></div><WhatsAppLink message={message} className="honey-button flex w-full items-center justify-center gap-2 rounded-xl bg-[#d69b39] py-3.5 font-extrabold text-black">{t(s.checkout)} <MessageCircle size={18} /></WhatsAppLink><button onClick={clear} className="mt-3 w-full py-2 text-sm font-bold text-zinc-500 hover:text-white">{t(s.clearCart)}</button></div>}
      </aside>
    </div>
  );
}

const offers = [
  {
    name: text('بكج الشتاء', 'Winter Bundle'),
    description: text('كيلو عسل حمضيات، وعكبر، وقزحة سائلة.', '1 kg of citrus honey, propolis, and liquid black seed paste.'),
    image: '/images/winter-bundle-v3.webp',
    artworkClass: '',
    price: 15,
  },
  {
    name: text('بكج القوة', 'Power Bundle'),
    description: text('عسل جرجير مع 10 غرامات من غذاء ملكات النحل البودرة. السعر شامل التوصيل لكل المملكة.', 'Arugula honey with 10 g of powdered royal jelly. Includes delivery throughout Jordan.'),
    image: '/images/power-bundle.webp',
    price: 15,
    artworkClass: 'bundle-photo-cropped',
  },
];

function Offers() {
  const { t, money } = useI18n();
  return (
    <section id="offers" aria-labelledby="offers-title" className="scroll-mt-6 px-5 pb-6 pt-12 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <h2 id="offers-title" className="mb-5 flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl">
          <span className="bundle-gift grid h-12 w-12 shrink-0 place-items-center rounded-2xl" aria-hidden="true"><Gift size={27} /></span>
          {t(offersLabel)}
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {offers.map(offer => (
            <article key={offer.image} className="bundle-offer grid items-center gap-5 overflow-hidden rounded-3xl border p-5 sm:grid-cols-[1fr_minmax(0,11rem)] sm:p-6">
              <div>
                <h3 className="font-display text-3xl font-extrabold">{t(offer.name)}</h3>
                <p className="mt-2 leading-relaxed">{t(offer.description)}</p>
                <strong className="bundle-price mt-4 block font-display text-3xl">{money(offer.price)}</strong>
                <WhatsAppLink product={t(offer.name)} quantity={t(text('بكج واحد', 'one bundle'))} price={money(offer.price)} className="honey-button mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-extrabold">
                  {t(text('اطلب البكج', 'Order this bundle'))} <MessageCircle size={18} aria-hidden="true" />
                </WhatsAppLink>
              </div>
              <div className={`bundle-photo mx-auto w-full max-w-52 overflow-hidden rounded-2xl ${offer.artworkClass}`}>
                <img src={offer.image} alt={t(offer.name)} width="650" height="1165" loading="lazy" decoding="async" className="block h-auto w-full" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { t, s, language, dir } = useI18n();
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState<CatalogFilter>('all');
  const [lightbox, setLightbox] = useState<{ items: GalleryItem[]; index: number } | null>(null);
  const [favorites, setFavorites] = useState(readFavorites);
  useEffect(() => {
    try {
      window.localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    } catch {
      // Favorites still work for the current visit when storage is unavailable.
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(current => current.includes(id) ? current.filter(saved => saved !== id) : [...current, id]);
  };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(0);
  const nav = [{ href: '#products', label: s.honey, filter: 'honey' as FilterKey }, { href: '#products', label: s.beeProducts, filter: 'bee' as FilterKey }, { href: '#products', label: s.dermoder, filter: 'dermoder' as FilterKey }, { href: '#offers', label: offersLabel }, { href: '#our-shop', label: s.shop }, { href: '#location', label: s.location }, { href: '#contact', label: s.contact }];
  const add = (product: Product, quantityKey: string, price: number) => {
    const id = `${product.id}-${quantityKey}`; setCart(current => current.some(item => item.id === id) ? current.map(item => item.id === id ? { ...item, count: item.count + 1 } : item) : [...current, { id, productId: product.id, quantityKey, price, count: 1 }]);
    setCartAnimation(current => current + 1);
    const quantity = product.quantities.find(item => item.key === quantityKey)!;
    toast({ title: t(s.added), description: `${t(product.name)} · ${t(quantity.label)}`, duration: 2500, className: 'border-[#d69b39]/40 bg-white text-[#49351e]', action: <ToastAction altText={t(s.openCart)} onClick={() => setCartOpen(true)} className="border-[#d69b39]/50 bg-[#d69b39] font-extrabold text-black">{t(s.openCart)}</ToastAction> });
  };
  const ArrowForward = dir === 'rtl' ? ArrowLeft : ArrowRight;
  return (
    <main id="top" dir={dir} className="storefront-light overflow-hidden">
      <Cart open={cartOpen} close={() => setCartOpen(false)} cart={cart} update={(id, delta) => setCart(items => items.map(item => item.id === id ? { ...item, count: Math.max(1, item.count + delta) } : item))} remove={id => setCart(items => items.filter(item => item.id !== id))} clear={() => setCart([])} />
      {!cartOpen && !lightbox && <button type="button" onClick={() => setCartOpen(true)} aria-label={t(s.openCart)} data-testid="button-floating-cart" className="floating-cart focus-ring fixed end-4 z-40 flex items-center gap-2 rounded-full border border-[#b77c24]/30 bg-[#d99c37] px-3 py-3.5 font-bold text-[#241a0f] shadow-xl transition-transform hover:-translate-y-1 sm:end-6 sm:gap-3 sm:px-5">
        <ShoppingCart key={cartAnimation} size={22} className={cartAnimation ? "cart-added-icon" : undefined} aria-hidden="true" />
        <span>{t(s.cart)}</span>
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-sm" dir="ltr">{cart.reduce((sum, item) => sum + item.count, 0)}</span>
      </button>}
      {!cartOpen && !lightbox && <nav className="social-dock fixed start-4 z-40 flex items-center gap-2 rounded-full border border-[#e7ddcd] bg-white/95 p-1.5 shadow-xl backdrop-blur-md" aria-label={t(s.contact)}>
        <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label={t(s.facebook)} title={t(s.facebook)} data-testid="link-social-facebook" className="social-facebook focus-ring flex h-10 w-10 items-center justify-center rounded-full border sm:h-11 sm:w-11"><Facebook size={20} /></a>
        <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label={t(s.instagram)} title={t(s.instagram)} data-testid="link-social-instagram" className="social-instagram focus-ring flex h-10 w-10 items-center justify-center rounded-full border sm:h-11 sm:w-11"><Instagram size={20} /></a>
        <WhatsAppLink aria-label="WhatsApp" title="WhatsApp" data-testid="link-social-whatsapp" className="social-whatsapp focus-ring flex h-10 w-10 items-center justify-center rounded-full border sm:h-11 sm:w-11"><MessageCircle size={20} /></WhatsAppLink>
      </nav>}
      <header className="relative z-30 border-b border-white/5 bg-black/60 text-[#f7e3b2] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1536px] flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-5 lg:px-10"><BrandMark large header />
          <nav className="hidden items-center gap-4 text-sm font-bold 2xl:flex" aria-label={t(s.mainNav)}>{nav.map(item => <a key={item.href + t(item.label)} href={item.href} onClick={() => item.filter && setFilter(item.filter)} className="focus-ring whitespace-nowrap py-2 hover:text-[#f5c766]">{t(item.label)}</a>)}</nav>
          <div className="flex max-w-full flex-wrap items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher compact />
            {[
              { href: facebookUrl, label: s.facebook, Icon: Facebook, style: 'social-facebook' },
              { href: instagramUrl, label: s.instagram, Icon: Instagram, style: 'social-instagram' },
            ].map(({ href, label, Icon, style }) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" aria-label={t(label)} title={t(label)} className={`${style} focus-ring flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-2.5 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5`}><Icon size={18} /><span className="hidden lg:inline">{t(label)}</span></a>
            ))}
            <WhatsAppLink aria-label="WhatsApp" title="WhatsApp" data-testid="link-social-whatsapp-header" className="order-button focus-ring flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-2.5 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5"><MessageCircle size={18} /><span className="hidden lg:inline">{t(s.orderNow)}</span></WhatsAppLink>
            <a href={mapUrl} target="_blank" rel="noreferrer" aria-label={t(s.map)} title={t(s.map)} data-testid="link-social-location-header" className="social-location focus-ring flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-2.5 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5"><MapPin size={18} /><span className="hidden lg:inline">{t(s.map)}</span></a>
            <button onClick={() => setCartOpen(true)} className="focus-ring relative flex h-10 items-center justify-center gap-1 rounded-full border border-white/10 bg-[#111] px-2.5" aria-label={t(s.openCart)}><ShoppingCart size={18} className="text-[#f3cf82]" /><span className="hidden text-xs font-extrabold text-[#f3cf82] sm:inline">{t(s.cart)}</span>{cart.length > 0 && <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e4b95f] px-1 text-[10px] font-bold text-black">{cart.reduce((sum, item) => sum + item.count, 0)}</span>}</button>
            <button className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-white/10 2xl:hidden" onClick={() => setMenu(!menu)} aria-label={t(menu ? s.closeMenu : s.openMenu)}>{menu ? <X /> : <Menu />}</button>
          </div>
        </div>
        {menu && <nav className="border-t border-white/5 bg-[#050505] px-5 pb-5 2xl:hidden" aria-label={t(s.mobileNav)}>{nav.map(item => <a key={item.href + t(item.label)} href={item.href} onClick={() => { if (item.filter) setFilter(item.filter); setMenu(false); }} className="focus-ring block border-b border-white/5 py-3 font-bold text-[#f4db9a]">{t(item.label)}</a>)}</nav>}
      </header>

      <section className="shop-hero relative overflow-hidden text-[#f7e4b5]">
        <img src={galleryPreview(gallery[0].src)} alt="" fetchPriority="low" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-[.08]" /><div className="absolute inset-0 hero-shade" />
        <div className="hero-gold-glow" aria-hidden="true" />
        <div dir="rtl" className="hero-layout relative z-10 mx-auto max-w-7xl px-5 lg:px-10"><div dir={dir} className="hero-copy min-w-0 animate-rise-in"><p className="mb-4 flex items-center gap-3 text-sm font-bold tracking-[.12em] text-[#f0c56d]"><span className="h-px w-12 bg-[#f0c56d]" />{t(s.jordan)}</p><h1 className="hero-title text-[#edb547]">{t(s.brand)}<span className="block text-[.55em] text-white">{t(s.heroSub)}</span></h1><p className="hero-description mt-5 max-w-lg text-zinc-300">{t(s.heroCopy)}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3"><a href="#products" className="honey-button focus-ring inline-flex items-center gap-3 rounded-xl bg-[#d99c37] px-5 py-3.5 font-extrabold text-black">{t(s.browse)} <ArrowForward size={18} /></a><a href="#our-shop" className="focus-ring inline-flex items-center gap-3 rounded-xl border border-white/20 bg-black/40 px-5 py-3.5 font-bold text-white">{t(s.knowShop)} <ArrowUpRight size={18} /></a><a href={googleReviewsUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-[#e0af4c]/50 bg-[#fff2d8] px-4 py-3.5 font-extrabold text-[#624115] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f5dfb7]"><Star size={18} fill="currentColor" />{t(s.googleReviews)}</a></div>
          <div className="hero-verse mt-3 w-full max-w-full text-center">
            <p lang="ar" dir="rtl" className="font-quran text-[2.6rem] leading-[1.7] text-[#f3d58d] [text-shadow:0_0_36px_rgba(224,175,76,.35)] lg:text-5xl">﴿فِيهِ شِفَاءٌ لِلنَّاسِ﴾</p>
            {language === 'en' && <p className="text-base italic leading-7 text-[#d9c394]">{t(s.quranTranslation)}</p>}
          </div>
          <nav className="mt-5" aria-label={t(s.quickBrowse)}>
            <span className="mb-2 block text-xs font-bold text-[#72572b]">{t(s.quickBrowse)}</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'honey' as FilterKey, label: s.honey, image: productThumbnail(products[0].id) },
                { key: 'bee' as FilterKey, label: s.beeProducts, image: productThumbnail('royal-jelly') },
                { key: 'dermoder' as FilterKey, label: s.dermoder, image: productThumbnail(products.find(product => product.category === 'dermoder')!.id) },
              ].map(item => <a key={item.key} href="#products" onClick={() => setFilter(item.key)} data-testid={`link-quick-category-${item.key}`} className="quick-category focus-ring flex flex-col items-center gap-2 rounded-2xl border p-2.5 text-center text-xs font-bold transition-colors hover:-translate-y-0.5 sm:text-sm"><img src={item.image} alt="" decoding="async" fetchPriority="low" className="h-14 w-full rounded-lg object-contain" /><span>{t(item.label)}</span></a>)}
            </div>
          </nav>
        </div>
          <div className="hero-visual flex min-w-0 flex-col items-center">
            <div className="hero-product">
              <img src="/images/naqaa-hero-360.webp" srcSet="/images/naqaa-hero-360.webp 360w, /images/naqaa-hero-720.webp 720w" sizes="(min-width: 1024px) 304px, (min-width: 640px) 40vw, 264px" decoding="async" alt={t(text('تصميم عسل النقاء مع خلية نحل وشعار المحل', 'Pure Honey artwork with a beehive and shop logo'))} width="1080" height="1920" fetchPriority="high" />
            </div>
            <a href="/images/quality-seal-black.jpg" className="hero-seal focus-ring flex min-w-0 items-center gap-3">
            <div className="hero-seal-image relative aspect-square overflow-hidden rounded-full border border-[#d5a955]/50 bg-[#111] shadow-[0_8px_28px_rgba(213,169,85,.18)]">
              <img src="/images/quality-seal-preview.webp" loading="lazy" decoding="async" alt={t(text('ختم نقابة النحالين الأردنيين ورمز QR للتتبع', 'Jordanian Beekeepers Association seal and traceability QR code'))} className="absolute h-auto max-w-none" style={{ width: '160%', left: '-33.33%', top: '-63.33%' }} />
            </div>
            <div dir="ltr" className="mt-2 flex items-center justify-center gap-2">
              <strong className="text-base font-semibold text-[#d9c394] lg:text-lg">{t(text('الفحص المخبري', 'Laboratory testing'))}</strong>
              <img src="/images/lab-arrow-gold.png" alt="" aria-hidden="true" className="h-12 w-9 object-contain" />
            </div>
            </a>
          </div>
        </div>
      </section>

      <Offers />

      <ProductCatalog filter={filter} setFilter={setFilter} favorites={favorites} onFavorite={toggleFavorite} onAdd={add} />

      <section id="our-shop" className="border-t border-white/5 px-5 py-20 text-[#f4e1b4] lg:px-10 lg:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.9fr_1.1fr]"><div className="order-2 grid grid-cols-2 gap-4 lg:order-1"><div className="relative col-span-2 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-2"><img src={galleryPreview(gallery[3].src)} loading="lazy" decoding="async" alt={t(gallery[3].label)} className="h-[300px] w-full rounded-[1.2rem] object-cover sm:h-[390px]" /><span className="absolute bottom-7 end-7 rounded-full bg-black/80 px-4 py-2 text-xs font-bold text-[#e0af4c]">{t(s.insideShop)}</span></div><img src={galleryPreview(gallery[4].src)} loading="lazy" decoding="async" alt={t(gallery[4].label)} className="h-36 w-full rounded-2xl border border-white/10 object-cover sm:h-48" /><img src={galleryPreview(gallery[5].src)} loading="lazy" decoding="async" alt={t(gallery[5].label)} className="h-36 w-full rounded-2xl border border-white/10 object-cover sm:h-48" /></div>
        <div className="order-1 lg:order-2"><span className="mb-4 block text-xs font-extrabold tracking-[.2em] text-[#e0af4c]">{t(s.shopEyebrow)}</span><h2 className="font-display text-4xl leading-tight text-white sm:text-6xl">{t(s.fromShelves)}<br /><span className="text-[#f5d994]">{t(s.toHomes)}</span></h2><p className="mt-7 max-w-xl text-lg leading-9 text-zinc-300">{t(s.shopCopy)}</p><div className="mt-9 grid grid-cols-2 gap-4 border-t border-white/10 pt-7"><div><strong className="block font-display text-2xl text-[#e6b54d]">{t(s.realPhotos)}</strong><span className="text-sm text-zinc-400">{t(s.directShop)}</span></div><div><strong className="block font-display text-2xl text-[#e6b54d]">{t(s.yourChoice)}</strong><span className="text-sm text-zinc-400">{t(s.kiloLess)}</span></div></div><a href="#gallery" className="focus-ring mt-10 inline-flex items-center gap-3 border-b border-[#e1b34f]/50 pb-2 font-bold text-[#f2cc7d]">{t(s.viewPlace)} <ArrowForward size={18} /></a></div></div></section>

      <section id="gallery" className="px-5 py-20 text-[#f1dfb5] lg:px-10 lg:py-28"><div className="mx-auto max-w-7xl"><div className="mb-12 flex items-end justify-between"><div><span className="mb-3 block text-xs font-extrabold tracking-[.2em] text-[#d5a955]">{t(s.galleryEyebrow)}</span><h2 className="font-display text-4xl text-white sm:text-5xl">{t(s.insidePure)}</h2></div><a href="#our-shop" className="focus-ring hidden rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-zinc-300 lg:inline-flex">{t(s.backShop)}</a></div><div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">{gallery.map((item, index) => <button key={item.src} onClick={() => setLightbox({ items: gallery, index })} aria-label={`${t(s.enlarge)} ${t(item.label)}`} className="focus-ring group relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-white/10 bg-black"><img src={galleryPreview(item.src)} decoding="async" alt={t(item.label)} className="h-full w-full object-cover opacity-80 transition-transform group-hover:scale-105 group-hover:opacity-100" loading="lazy" /><span className="absolute inset-x-4 bottom-4 text-center font-display text-sm text-white opacity-0 group-hover:opacity-100">{t(item.label)}</span></button>)}</div></div></section>

      <section id="location" className="border-t border-white/5 bg-[#050505] px-5 py-20 text-[#f1dfb5] lg:px-10 lg:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center"><a href={mapUrl} target="_blank" rel="noreferrer" className="group focus-ring order-2 relative block aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] p-2 lg:order-1"><img src={galleryPreview(gallery[0].src)} loading="lazy" decoding="async" alt={t(gallery[0].label)} className="h-full w-full rounded-[1.4rem] object-cover opacity-80 group-hover:opacity-100" /><span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100"><span className="flex items-center gap-2 rounded-full bg-[#e0af4c] px-6 py-3 font-bold text-black">{t(s.googleMaps)} <MapPin size={18} /></span></span></a><div className="order-1 lg:order-2"><span className="mb-3 block text-xs font-extrabold tracking-[.2em] text-[#d5a955]">{t(s.visitEyebrow)}</span><h2 className="font-display text-4xl text-white sm:text-5xl">{t(s.visit)}</h2><p className="mt-5 max-w-lg text-lg leading-8 text-zinc-300">{t(s.visitCopy)}</p><a href={mapUrl} target="_blank" rel="noreferrer" className="focus-ring mt-8 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/50 px-6 py-3 font-bold text-[#f5db9d]">{t(s.directions)} <MapPin size={18} /></a></div></div></section>

      <footer id="contact" className="border-t border-white/10 bg-black px-5 pb-8 pt-20 text-[#dfb875] lg:px-10"><div className="mx-auto max-w-7xl"><div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-4"><div className="lg:col-span-2"><BrandMark /><p className="mt-6 max-w-sm text-sm leading-7 text-zinc-400">{t(s.footerCopy)}</p><div className="mt-8 flex flex-wrap gap-3"><a href={facebookUrl} target="_blank" rel="noreferrer" aria-label={t(s.facebook)} className="social-facebook focus-ring flex items-center gap-2 rounded-full border px-4 py-2.5 font-bold"><Facebook size={18} /><span>{t(s.facebook)}</span></a><a href={instagramUrl} target="_blank" rel="noreferrer" aria-label={t(s.instagram)} className="social-instagram focus-ring flex items-center gap-2 rounded-full border px-4 py-2.5 font-bold"><Instagram size={18} /><span>{t(s.instagram)}</span></a><WhatsAppLink aria-label="WhatsApp" className="social-whatsapp focus-ring flex items-center gap-2 rounded-full border px-4 py-2.5 font-bold"><MessageCircle size={18} /><span>WhatsApp</span></WhatsAppLink></div></div><div><strong className="mb-6 block font-display text-lg text-white">{t(s.quickLinks)}</strong><nav className="flex flex-col gap-4 text-sm text-zinc-400">{nav.slice(0, 4).map(item => <a key={item.href + t(item.label)} href={item.href} onClick={() => item.filter && setFilter(item.filter)}>{t(item.label)}</a>)}</nav></div><div><strong className="mb-6 block font-display text-lg text-white">{t(s.reachUs)}</strong><div className="flex flex-col gap-4 text-sm text-zinc-400"><WhatsAppLink className="flex items-center gap-3"><MessageCircle size={16} />{t(s.orderWhatsapp)}</WhatsAppLink><a href={`tel:${phone}`} className="focus-ring flex items-center gap-3"><Phone size={16} /><span dir="ltr">+{phone}</span></a><a href={mapUrl} target="_blank" rel="noreferrer" className="focus-ring flex items-center gap-3"><MapPin size={16} />{t(s.map)}</a></div></div></div><p className="mt-8 text-xs text-zinc-500">{t(s.rights)} &copy; {new Date().getFullYear()} {t(s.brand)}.</p></div></footer>
      {lightbox && <Lightbox items={lightbox.items} index={lightbox.index} close={() => setLightbox(null)} setIndex={index => setLightbox({ ...lightbox, index })} />}
    </main>
  );
}

function NotFound() {
  const { t, s, dir } = useI18n();
  return <div dir={dir} className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-5 text-center text-white"><BrandMark /><h1 className="mt-8 font-display text-3xl">{t(s.notFound)}</h1><p className="mt-4 text-zinc-400">{t(s.notFoundCopy)}</p><a href="/" className="honey-button mt-8 rounded-xl bg-[#d69b39] px-6 py-3 font-extrabold text-black">{t(s.home)}</a></div>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><ErrorBoundary><LanguageProvider><TooltipProvider><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></TooltipProvider><Toaster /></LanguageProvider></ErrorBoundary></QueryClientProvider>;
}