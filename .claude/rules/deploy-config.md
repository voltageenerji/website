---
paths:
  - "_redirects"
  - "_headers"
  - "robots.txt"
  - ".github/workflows/**"
  - "DEPLOY.md"
---

# Deploy configuration and CI

- **Keep internal paths blocked.** `_redirects` must keep the 302 rules for `/docs/*`, `/lib/*`, `/tools/*`, `/game404/*`, `/.claude/*`, `/.github/*`, `CLAUDE.md`, `DEPLOY.md`, `CHANGELOG.md`, `README.md`, `.gitignore`. `robots.txt` keeps `/api/`, `/panel`, `/lib/`, `/tools/`, `/docs/` disallowed.
- **One domain.** voltan.* and www only 301 to https://voltage.com.tr.
- **The repo is public.** Workflows print HTTP status codes and aggregates, never response bodies containing customer data, tokens or lead details. Secrets only via `secrets.*`.
- **Temporary workflows** (probes, one-off reads) live only on the working branch and are deleted as soon as they have served.
- **Cache.** `/canli-ptf` sets its own Cache-Control in the function; do not add a `_headers` rule for it.
