import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blazorperformance.com',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
