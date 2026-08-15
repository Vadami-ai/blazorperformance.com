# blazorperformance.com

Source for **[blazorperformance.com](https://blazorperformance.com)**: tools,
playbooks, and curated references for Blazor scalability and performance
engineering. A [Vadami LLC](https://vadami.ai) project.

Built with [Astro](https://astro.build), fully static, no client-side framework on
content pages. The hosted tools are self-contained bundles copied into
`public/tools/`.

## Contributing a resource

The resource directory is community-editable: edit
[`src/data/resources.json`](src/data/resources.json) and open a PR. Full scope
and process: [CONTRIBUTING.md](CONTRIBUTING.md). Ground rules:

- Place the link in the category matching the **problem it solves**, not its format.
- Write a 1–2 sentence annotation saying *why it's worth someone's time*; honest
  notes ("dated but the math holds") beat marketing copy.
- Performance/scalability relevance required; general Blazor content belongs in
  [Awesome Blazor](https://github.com/AdrienTorris/awesome-blazor) instead.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # static build to dist/
npm run sync-tools # refresh public/tools/ from ../blazor-server-capacity-calculator/dist
```

Content lives in:

| Path | What |
|---|---|
| `src/content/playbooks/*.md` | Playbook articles (frontmatter: title, description, date, readingTime) |
| `src/content/news/*.md` | What's-new entries (also feed `/rss.xml`) |
| `src/data/resources.json` | The curated resource directory |
| `public/tools/` | Hosted tool builds (synced, committed) |

## Deployment

Pushes to `main` deploy via GitHub Actions to GitHub Pages
(`.github/workflows/deploy.yml`); the custom domain is set through `public/CNAME`.
The build output is plain static files, so Cloudflare Pages works identically
(build command `npm run build`, output `dist`).

## License

Site code is [MIT](LICENSE) © Vadami LLC. Playbook prose © Vadami LLC, all rights
reserved. Resource annotations are contributed under MIT with the repo.
