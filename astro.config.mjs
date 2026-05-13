import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://divorceu.ae',
  trailingSlash: 'always',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) =>
        !page.includes('/thank-you') &&
        !page.includes('/404') &&
        !page.includes('/disclaimer') &&
        !page.includes('/privacy'),
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
