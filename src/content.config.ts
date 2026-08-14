import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const playbooks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/playbooks' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    readingTime: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

export const collections = { playbooks, news };
