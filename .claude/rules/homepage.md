---
paths:
  - "index.html"
---

# Homepage (`index.html`) — canonical design

- The design and structure are canonical: the new design went live on 2026-11-27 (main 4bf70d5, owner approval "Canlıya al"; earlier canon 2026-08-04). Its source lives in `docs/design/onizleme/yeni-tasarim/` (`yapi/kur.py` builds from `yapi/govde.html` + `yapi/stil.css`; tests `yapi/test2.mjs`). The live file uses `/img/` paths and the real proxy URL; the preparation copy uses relative `img/`. No visual, layout, motion or section change without the owner's explicit approval in this conversation. Build it as a preview first (scratchpad or `docs/design/onizleme/`), show it, wait.
- Copy fixes and bug fixes are allowed, but still reviewed by QA; any new public claim also by Legal & Compliance.
- Every visible string exists in TR and EN (`data-tr` / `data-en` or `tr-only` / `en-only`). Turkish reads natively.
- Live market band follows the honesty ladder: live → cache ("SON SENKRON") → honest waiting. Never synthetic or zero prices.
- Do not edit `index.html` through shell redirection or scripts that write in place; dry runs read from a copy.
- The green-energy "bahar" moment starts one frame after the tap (rAF + setTimeout 0) so it never adds to INP; keep it that way.
