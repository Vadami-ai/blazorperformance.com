# Contributing to blazorperformance.com

Thanks for helping make Blazor performance knowledge easier to find. This page
explains what we accept, what we don't, and how a change gets to production.

## What's in scope for public contributions

| Area | Files | Notes |
|---|---|---|
| **Resource directory** (primary) | `src/data/resources.json` | New annotated links, corrections to stale links, better annotations |
| **Factual corrections** | `src/content/playbooks/*.md` | Typos, broken links, outdated commands or SKU facts, with a source for factual changes |
| **Site bugs** | `src/**` | Rendering issues, accessibility fixes, performance improvements, mobile issues |

### Resource entry ground rules

- Place the link in the category matching the **problem it solves**, not its format.
- Write a 1–2 sentence annotation (40+ characters) saying *why it's worth someone's
  time*; honest notes ("dated but the math holds") beat marketing copy.
- Performance/scalability relevance required. General Blazor content belongs in
  [Awesome Blazor](https://github.com/AdrianWilczynski/Awesome-Blazor) instead.
- No self-promotion without substance: linking your own article is fine if it
  teaches something this directory lacks; a product landing page is not.
- Style: no em dashes in prose (CI enforces this); use commas, colons, or periods.

## What's out of scope

- **Playbook authorship and opinions**: playbooks carry the maintainer's voice and
  field experience. Propose topics or corrections in an issue instead of PRing new
  playbooks.
- **Design, branding, About, and Work-with-me pages**: these represent Vadami LLC
  and are maintainer-owned.
- **`public/tools/`**: these are build artifacts synced from the tool repos. To
  improve the calculator, contribute at
  [blazor-server-capacity-calculator](https://github.com/Vadami-ai/blazor-server-capacity-calculator)
  instead; changes here would be overwritten by the next sync.
- **What's-new entries** (`src/content/news/`): maintainer-curated changelog.

## How the PR process works

1. **Fork** the repo and make your change on a branch.
2. **Open a PR** against `main`. Keep it small; one resource or one fix per PR
   reviews fastest.
3. **CI runs automatically**: it builds the site and validates
   `resources.json` structure, annotation length, and style rules. First-time
   contributors' workflows need a maintainer click to start (a GitHub safeguard
   for public repos).
4. **Review**: the maintainer checks scope and the ground rules above. Expect
   either a merge, a small change request, or an honest "this belongs in
   Awesome Blazor instead."
5. **Merge to `main` deploys automatically**: the Deploy workflow builds and
   publishes to blazorperformance.com within about a minute. Your entry also
   flows into the machine-readable `llms-full.txt` automatically; no extra steps.

## Local preview

```bash
npm install
npm run dev
```

## Questions

Open an issue, or email info@vadami.ai.
