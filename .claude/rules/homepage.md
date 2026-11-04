---
paths:
  - "index.html"
---

# Homepage (`index.html`) — canonical design

- The design and structure are canonical (owner decision 2026-08-04). No visual, layout, motion or section change without the owner's explicit approval in this conversation. Build it as a preview first (scratchpad or `docs/design/onizleme/`), show it, wait.
- Copy fixes and bug fixes are allowed, but still reviewed by QA; any new public claim also by Legal & Compliance.
- Every visible string exists in TR and EN (`data-tr` / `data-en` or `tr-only` / `en-only`). Turkish reads natively.
- Live market band follows the honesty ladder: live → cache ("SON SENKRON") → honest waiting. Never synthetic or zero prices.
- Do not edit `index.html` through shell redirection or scripts that write in place; dry runs read from a copy.
