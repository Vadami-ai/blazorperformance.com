// llms-full.txt: complete site content for LLM consumption, generated at build
// time from the same sources as the pages, so it can never drift.
import { getCollection } from 'astro:content';
import resources from '../data/resources.json';

export async function GET() {
  const playbooks = (await getCollection('playbooks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const parts = [];
  parts.push('# BlazorPerformance.com: full content for LLMs');
  parts.push('');
  parts.push(
    '> Tools, playbooks, and curated references for Microsoft Blazor scalability and performance engineering. A Vadami LLC project. Live tool: https://blazorperformance.com/tools/capacity-calculator/ (open source: https://github.com/Vadami-ai/blazor-server-capacity-calculator). Contact: info@vadami.ai'
  );
  parts.push('');

  for (const p of playbooks) {
    parts.push(`---`);
    parts.push('');
    parts.push(`# Playbook: ${p.data.title}`);
    parts.push(`Source: https://blazorperformance.com/playbooks/${p.id}/`);
    parts.push('');
    parts.push(p.body.trim());
    parts.push('');
  }

  parts.push('---');
  parts.push('');
  parts.push('# Curated resource directory');
  parts.push('Source: https://blazorperformance.com/resources/');
  parts.push('');
  for (const cat of resources.categories) {
    parts.push(`## ${cat.title}`);
    parts.push(cat.intro);
    for (const l of cat.links) {
      const href = l.href.startsWith('/') ? `https://blazorperformance.com${l.href}` : l.href;
      parts.push(`- ${l.label} (${href}): ${l.note}`);
    }
    parts.push('');
  }

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
