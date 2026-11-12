import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { products, productPath, type Product } from './src/products';

const site = 'https://honeynaqaa.com';
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));

function renderProduct(product: Product) {
  const url = site + productPath(product.id);
  const image = site + product.image;
  const name = escapeHtml(product.name.ar);
  const title = name + ' | عسل النقاء';
  const description = escapeHtml(product.description.ar);
  const options = product.quantities.map(quantity => ({
    label: quantity.grams.ar,
    price: Number((product.price * quantity.multiplier).toFixed(2)),
  }));
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name.ar,
    description: product.description.ar,
    image: [image],
    sku: product.id,
    url,
    offers: options.map(option => ({
      '@type': 'Offer',
      name: option.label,
      price: option.price,
      priceCurrency: 'JOD',
      url,
    })),
  };
  const orderOptions = options.map(option => {
    const message = encodeURIComponent(`السلام عليكم، أرغب بطلب ${product.name.ar} بكمية ${option.label} بسعر ${option.price} دينار أردني.`);
    return `<li><span><bdi>${escapeHtml(option.label)}</bdi> · <bdi>${option.price}</bdi> د.أ</span><a href="https://wa.me/962782307118?text=${message}">اطلب عبر واتساب</a></li>`;
  }).join('\n');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="/logo.png">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>
  <link rel="stylesheet" href="/product-page.css">
</head>
<body>
  <header><a href="/"><img src="/logo.png" alt="" width="48" height="48">عسل النقاء</a></header>
  <main>
    <img class="product-photo" src="${escapeHtml(product.image)}" alt="${name} من عسل النقاء">
    <div>
      <a href="/#products">جميع المنتجات</a>
      <h1>${name}</h1>
      <p>${description}</p>
      <ul>${orderOptions}</ul>
    </div>
  </main>
</body>
</html>`;
}

export function productPages(): Plugin {
  return {
    name: 'product-pages',
    apply: 'build',
    async writeBundle({ dir }) {
      if (!dir) throw new Error('Product pages require a build output directory.');
      await Promise.all(products.map(async product => {
        const directory = resolve(dir, 'products', product.id);
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, 'index.html'), renderProduct(product), 'utf8');
      }));
      const entries = products.map(product => `  <url>
    <loc>${site + productPath(product.id)}</loc>
    <image:image><image:loc>${escapeHtml(site + product.image)}</image:loc></image:image>
  </url>`).join('\n');
      await writeFile(resolve(dir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>${site}/</loc></url>
${entries}
</urlset>
`, 'utf8');
    },
  };
}
