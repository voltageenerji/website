# Voltan Energy AI Operating System — Organization Chart

Authoritative registry of all agents in the system. Every agent created under
the agent-creation protocol (see `CLAUDE.md`) MUST be registered here. An
agent not listed in this chart does not exist organizationally.

## Level 1 — Command

| Agent | Specification | Domain | Reports to | Status |
|---|---|---|---|---|
| Orchestrator Agent | `CLAUDE.md` (repo root) | Strategy, task decomposition, agent creation & supervision, quality control, final delivery | — (highest authority) | Active |

## Level 2 — Execution

All Level 2 agents report to the Orchestrator Agent. Peer-to-peer coordination
routes through the Orchestrator.

| Agent | Specification | Domain | Key peer dependencies | Status | Registered |
|---|---|---|---|---|---|
| Webmaster Agent | `webmaster.md` | Website implementation, deploy, SEO, performance | design, marketing | Active | 2026-06-10 |
| Design Agent | `design.md` | UI/UX, visual identity, accessibility | webmaster | Active | 2026-06-10 |
| Marketing Agent | `marketing.md` | Campaigns, content, brand positioning, growth | pricing, sales, analytics | Active | 2026-06-10 |
| Sales Agent | `sales.md` | Lead conversion, offers, funnel, B2B/B2C sales | pricing, billing-analysis, application | Active | 2026-06-10 |
| Pricing Agent | `pricing.md` | Tariff design, margin strategy, price simulations | energy-market, billing-analysis | Active | 2026-06-10 |
| Billing Analysis Agent | `billing-analysis.md` | Invoice analysis, savings calculations | pricing | Active | 2026-06-10 |
| Application Agent | `application.md` | Onboarding, application forms, switching process | sales, support, energy-market | Active | 2026-06-10 |
| Support Agent | `support.md` | Support content, FAQ, complaints, retention | application, billing-analysis | Active | 2026-06-10 |
| Analytics Agent | `analytics.md` | Metrics, reporting, KPIs, data analysis | all (read-only consumer of outputs) | Active | 2026-06-10 |
| Energy Market Agent | `energy-market.md` | EPİAŞ/PTF, EPDK regulation, market intelligence | pricing | Active | 2026-06-10 |

## Registration procedure for new agents

1. Complete all seven steps of the agent-creation protocol in `CLAUDE.md`.
2. Add a row to the appropriate level table above (create a new level section
   if the hierarchy deepens), with today's date in the Registered column.
3. Add the agent to the hierarchy table in `CLAUDE.md`.
4. Status values: `Active`, `Suspended`, `Retired`. Retired agents keep their
   row (with the spec file moved to `.claude/agents/retired/`) for audit
   history.
