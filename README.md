# موقع عسل النقاء (naqaahoney.com)

موقع React + Vite + Tailwind، ثابت بالكامل (بدون سيرفر).

## تشغيل محلي
    npm install
    npm run dev

## بناء الموقع
    npm run build      # الناتج في مجلد dist

## النشر المجاني
- Cloudflare Workers (Import a repository): Build command = `npm run build` ، Deploy command = `npx wrangler deploy` (الإعدادات بملف wrangler.jsonc)
- أو Netlify: Build command = `npm run build` ، Publish directory = `dist`
