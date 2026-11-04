---
paths:
  - "functions/**"
  - "lib/**"
  - "docs/qa/**"
---

# Pages Functions, shared libs and their tests

- **Honesty.** A price is a finite number or a non-empty numeric string; `null`, `''` and `[]` never become 0. Missing hours stay `null` / "—". No interpolation, no carry-forward.
- **Dates.** A dated summary prints only when the data's own date matches today (Europe/Istanbul); without a data date, not between 00:00 and 00:59.
- **Failure.** Server rendering never takes the page down: on any error, serve the static shell.
- **Security.** Secrets come from `env` only. Auth and rate limiting fail closed. Never log customer data, tokens or request bodies.
- **Tests.** Run the matching `docs/qa/test-*.mjs` after a change (`node docs/qa/test-ssr-ptf.mjs` for `functions/canli-ptf.js`); add a test for every bug fixed.
