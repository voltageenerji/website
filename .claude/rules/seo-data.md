---
paths:
  - "tools/gsc-export.mjs"
  - "docs/seo/**"
---

# Search Console data and SEO reports

- Search Console data comes from `tools/gsc-export.mjs` (official API). Its output goes to a git-ignored folder or the scratchpad, never into the repo, because the repo is public.
- Reports in `docs/seo/` may quote aggregates and the queries needed for a decision, each with its date range. Never invent search volumes or positions; anything not in the data is marked `NOT VERIFIED`.
- Search Console data lags 2–3 days; always state the exact date range used.
- The service-account key lives only in the cloud environment's variables (`GSC_SA_KEY_B64`, or `GSC_SA_KEY`). Never print, echo or write it to a file in the repo.
