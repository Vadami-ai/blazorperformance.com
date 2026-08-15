import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blazorperformance.com',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      // public/ tool builds are static assets, invisible to the page scanner
      customPages: ['https://blazorperformance.com/tools/capacity-calculator/'],
    }),
  ],
});
