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
- Keyless path (key creation is blocked by org policy): the owner signs in once per session (`gcloud auth login --no-launch-browser`; only the one-time PKCE code is pasted, never a password or key), then `GSC_IMPERSONATE=gsc-okuyucu@voltage-search-console.iam.gserviceaccount.com node tools/gsc-export.mjs`. Never print access tokens. Run manual gcloud commands as `env -u CLOUDSDK_AUTH_ACCESS_TOKEN CLOUDSDK_CORE_DISABLE_FILE_LOGGING=1 gcloud …` (gcloud otherwise writes tokens to `~/.config/gcloud/logs`). When done: `gcloud auth revoke --all`, then `rm -rf ~/.config/gcloud/logs ~/.config/gcloud/credentials.db ~/.config/gcloud/access_tokens.db`.
