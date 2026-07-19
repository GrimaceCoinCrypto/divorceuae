import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://divorceu.ae',
  trailingSlash: 'always',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => {
        const p = decodeURIComponent(page);
        return (
          !p.includes('/thank-you') &&
          !p.includes('/404') &&
          !p.includes('/disclaimer') &&
          !p.includes('/privacy') &&
          !p.includes('إخلاء-المسؤولية') &&
          !p.includes('سياسة-الخصوصية')
        );
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
