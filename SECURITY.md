# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities. Instead, use
GitHub's private reporting ("Security" tab → "Report a vulnerability") or email
**info@vadami.ai** with details and reproduction steps.

You can expect an acknowledgment within a few days. Please allow time for a fix
before any public disclosure.

## Scope

This is a fully static site: no server-side code, no accounts, no data
collection. The most relevant risks are supply-chain (npm dependencies, GitHub
Actions pipeline) and XSS via contributed content (resource-directory entries,
markdown) — reports in those areas are especially welcome.

## Supported versions

Only the deployed `main` branch is supported.
