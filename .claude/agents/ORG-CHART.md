# Voltan Energy AI Operating System — Organization Chart (Version 2.0)

Authoritative registry of all agents in the system. Every agent created under
the agent-creation protocol (see `CLAUDE.md`) MUST be registered here. An
agent not listed in this chart does not exist organizationally.

Version 2.0 approved with modifications on 2026-06-10 (see
`ORG-V2-PROPOSAL.md`). Modifications: Treasury & Capital Agent replaces the
proposed Finance Ops Agent; Investor Relations Agent added as a direct staff
function; organization design is bound by the identity principle in
`CLAUDE.md` — Voltan is an electricity supplier, aggregator and energy
trading company, not a generic SaaS business.

## Level 1 — Command

| Agent | Specification | Domain | Reports to | Status |
|---|---|---|---|---|
| Orchestrator Agent | `CLAUDE.md` (repo root) | Strategy, task decomposition, agent creation & supervision, quality control, final delivery | — (highest authority) | Active |

## Staff functions (report directly to the Orchestrator)

| Agent | Specification | Domain | Status | Registered |
|---|---|---|---|---|
| Analytics Agent | `analytics.md` | Metrics, reporting, KPIs, data analysis (energy-native metrics) | Active | 2026-06-10 |
| Legal & Compliance Agent | `legal-compliance.md` | KVKK, EPDK obligations, contracts, ad-claim review (blocking authority) | Active | 2026-06-10 |
| Investor Relations Agent | `investor-relations.md` | Equity story, investor KPI pack, data room, fundraising materials | Active | 2026-06-10 |

## Level 2 — Executives (report to the Orchestrator)

| Agent | Specification | Function | Direct reports | Status | Registered |
|---|---|---|---|---|---|
| Technology Executive | `technology-executive.md` | CTO: platform, deploy reliability, security, automation priorities | webmaster, automation-engineer, qa | Active | 2026-06-10 |
| Product Executive | `product-executive.md` | CPO: portal/app/aggregator roadmap, prioritization | product-manager, design | Active | 2026-06-10 |
| Revenue Executive | `revenue-executive.md` | CRO: acquisition→conversion→retention pipeline, MWh & customer growth | marketing, sales, growth, conversion, lifecycle-crm | Active | 2026-06-10 |
| Finance & Risk Executive | `finance-risk-executive.md` | CFO: P&L and margin-per-MWh governance, risk-appetite enforcement | pricing, billing-analysis, energy-market, treasury-capital, market-risk | Active | 2026-06-10 |
| Operations Executive | `operations-executive.md` | COO: switching execution, support quality, cost-to-serve | application, support | Active | 2026-06-10 |

## Level 3 — Specialists

| Agent | Specification | Domain | Reports to | Status | Registered |
|---|---|---|---|---|---|
| Webmaster Agent | `webmaster.md` | Website implementation, deploy, SEO, performance | technology-executive | Active | 2026-06-10 |
| Automation Engineer Agent | `automation-engineer.md` | Bill-OCR, EPİAŞ pipelines, integrations, workflow automation | technology-executive | Active | 2026-06-10 |
| QA Agent | `qa.md` | Release verification, regression checks, simulator-math validation | technology-executive | Active | 2026-06-10 |
| Product Manager Agent | `product-manager.md` | Portal, bill-upload, self-service, aggregator/VPP specs & backlog | product-executive | Active | 2026-06-10 |
| Design Agent | `design.md` | UI/UX, visual identity, accessibility | product-executive | Active | 2026-06-10 |
| Marketing Agent | `marketing.md` | Campaigns, content, brand positioning | revenue-executive | Active | 2026-06-10 |
| Sales Agent | `sales.md` | Lead conversion, offers, B2B/B2C sales flows | revenue-executive | Active | 2026-06-10 |
| Growth Agent | `growth.md` | Experiments, referral program, partnership channels | revenue-executive | Active | 2026-06-10 |
| Conversion Agent | `conversion.md` | End-to-end funnel conversion-rate ownership | revenue-executive | Active | 2026-06-10 |
| Lifecycle CRM Agent | `lifecycle-crm.md` | Nurture, onboarding journeys, churn triggers, win-back, renewals | revenue-executive | Active | 2026-06-10 |
| Pricing Agent | `pricing.md` | Tariff design, margin strategy, price simulations | finance-risk-executive | Active | 2026-06-10 |
| Billing Analysis Agent | `billing-analysis.md` | Invoice analysis, savings calculations | finance-risk-executive | Active | 2026-06-10 |
| Energy Market Agent | `energy-market.md` | EPİAŞ/PTF/SMF, EPDK regulation, market intelligence | finance-risk-executive | Active | 2026-06-10 |
| Treasury & Capital Agent | `treasury-capital.md` | Cash flow, teminat/collateral, receivables, capital structure | finance-risk-executive | Active | 2026-06-10 |
| Market Risk Agent | `market-risk.md` | PTF exposure, hedging, stress tests, risk limits | finance-risk-executive | Active | 2026-06-10 |
| Application Agent | `application.md` | Onboarding, application forms, switching process | operations-executive | Active | 2026-06-10 |
| Support Agent | `support.md` | Support content, FAQ, complaints, retention | operations-executive | Active | 2026-06-10 |

Total: 26 agents (1 + 3 staff + 5 executives + 17 specialists).

## Coordination rules

- Intra-domain peer coordination routes through the domain executive.
- Cross-domain coordination and conflicts route through the Orchestrator.
- Staff functions serve all domains; their traffic routes via the
  Orchestrator. Legal & Compliance holds blocking authority on publishing;
  only the Orchestrator may override.
- Strategy is set only at Level 1.

## Registration procedure for new agents

1. Complete all seven steps of the agent-creation protocol in `CLAUDE.md`.
2. Add a row to the appropriate table above, with today's date in the
   Registered column.
3. Add the agent to the hierarchy table in `CLAUDE.md`.
4. New-agent specs must comply with the identity principle: defined in
   energy-company terms, not SaaS-template terms.
5. Status values: `Active`, `Suspended`, `Retired`. Retired agents keep their
   row (with the spec file moved to `.claude/agents/retired/`) for audit
   history.
