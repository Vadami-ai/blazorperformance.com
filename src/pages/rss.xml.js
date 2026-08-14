import { getCollection } from 'astro:content';

const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export async function GET(context) {
  const site = context.site?.href ?? 'https://blazorperformance.com/';
  const entries = (await getCollection('news')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  const items = entries
    .map(
      (e) => `    <item>
      <title>${esc(e.data.title)}</title>
      <link>${site}whats-new/</link>
      <guid isPermaLink="false">${esc(e.id)}</guid>
      <pubDate>${e.data.date.toUTCString()}</pubDate>
      <description>${esc(e.body ?? '')}</description>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BlazorPerformance.com: What's new</title>
    <link>${site}</link>
    <description>New tools, playbooks, and curated resources for Blazor scalability and performance engineering.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
