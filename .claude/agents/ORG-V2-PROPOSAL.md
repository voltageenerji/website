# Voltan AI Organization — Version 2.0 Proposal

Status: **APPROVED WITH MODIFICATIONS — 2026-06-10. Implemented.**
Modifications ordered at approval: (1) the proposed Finance Ops Agent is
replaced by the **Treasury & Capital Agent** (`treasury-capital`); (2) an
**Investor Relations Agent** (`investor-relations`) is added as a direct
staff function; (3) all organization design is bound to Voltan's identity as
an electricity supplier, aggregator and energy trading company — codified as
the identity principle in `CLAUDE.md`. The live hierarchy is maintained in
`ORG-CHART.md`; this document is retained as the audit record of the
decision.

Prepared: 2026-06-10 · Author: Orchestrator Agent

---

## 1. Audit of Version 1.0

### 1.1 Current state

1 Orchestrator + 10 Level 2 execution agents (webmaster, design, marketing,
sales, pricing, billing-analysis, application, support, analytics,
energy-market), all reporting directly to the Orchestrator, all peer
coordination routed through the Orchestrator.

### 1.2 Strengths

- Full coverage of the **current** value chain of a website-led supplier:
  attract (marketing) → convince (sales, pricing, billing-analysis) → onboard
  (application) → serve (support) → understand (analytics, energy-market).
- Protocol discipline: every agent has a complete spec (Domain, Standards,
  Inputs, Outputs, KPIs, Reporting) and is registered.
- Strong financial-integrity chain: pricing ↔ billing-analysis ↔ energy-market
  with "show your math" and reconciliation rules.

### 1.3 Structural weaknesses

- **Span of control.** 10 direct reports with 100% of coordination routed
  through Level 1. The Orchestrator is the single bottleneck; the structure
  saturates at roughly 12 agents and V2 needs ~19.
- **No verification capacity.** The Orchestrator must personally QA every
  output; there is no independent quality function.
- **Website-shaped, not platform-shaped.** The org mirrors today's static
  site, not the stated objective of a digital supplier **and aggregator
  platform**. Nobody owns what gets built next.
- **Revenue is modeled, not protected.** Pricing models margins, but no one
  owns PTF exposure, hedging, cash flow or collections — for an electricity
  supplier this is the largest single risk on the books.

### 1.4 Functional gap analysis (the five requested lenses)

| Lens | What exists | What is missing |
|---|---|---|
| **Executive** | Orchestrator does all executive work alone | Domain executives (technology, revenue, finance/risk, operations, product); legal & compliance officer (EPDK licensing, KVKK, contract law — energy-market only *reports* regulation, nobody *owns* compliance) |
| **Product** | Webmaster maintains a static site; design styles it | Product management: customer portal, mobile app, bill-upload pipeline, aggregator/VPP product roadmap; prioritization between revenue asks and platform debt |
| **Growth** | Marketing produces campaigns and content | Systematic experimentation (A/B), referral program, partnerships/channels, lifecycle CRM (email/SMS nurture, churn-prediction triggers, win-back) |
| **Conversion** | Sales owns funnel *design*; design owns layout | Nobody owns the conversion **rate** end-to-end: hypothesis backlog, test design, simulator→application drop-off, form abandonment, offer-page optimization |
| **Automation** | "Maximize operational automation" is a stated objective | Zero agents assigned to it: no bill-OCR pipeline, no EPİAŞ data pipelines beyond one proxy endpoint, no CRM/workflow integration, no support chatbot, no QA automation |

**Audit verdict:** V1.0 is a complete *storefront* organization with no
executive bench, no product function, no conversion ownership, no automation
capacity, and unmanaged market risk. It can run the website; it cannot run
the company.

---

## 2. Version 2.0 — Proposed organization

### 2.1 Hierarchy

```
Level 1  Orchestrator Agent (unchanged: strategy, final authority, QC)
│
├── Staff functions (direct reports, serve the whole org)
│   ├── analytics            (existing — elevated to staff)
│   └── legal-compliance     (NEW — KVKK, EPDK licensing, contracts, ad law)
│
├── Level 2: technology-executive (NEW)            — CTO function
│   ├── webmaster            (existing)
│   ├── automation-engineer  (NEW)
│   └── qa                   (NEW)
│
├── Level 2: product-executive (NEW)               — CPO function
│   ├── product-manager      (NEW)
│   └── design               (existing)
│
├── Level 2: revenue-executive (NEW)               — CRO function
│   ├── marketing            (existing)
│   ├── sales                (existing)
│   ├── growth               (NEW)
│   ├── conversion           (NEW)
│   └── lifecycle-crm        (NEW)
│
├── Level 2: finance-risk-executive (NEW)          — CFO function
│   ├── pricing              (existing)
│   ├── billing-analysis     (existing)
│   ├── energy-market        (existing)
│   ├── finance-ops          (NEW)
│   └── market-risk          (NEW)
│
└── Level 2: operations-executive (NEW)            — COO function
    ├── application          (existing)
    └── support              (existing)
```

Headcount: 20 agents (1 + 2 staff + 5 executives + 12 specialists).
Orchestrator's direct reports drop from 10 → 7. Routine peer coordination
moves inside each executive's domain; only cross-domain decisions escalate to
Level 1. **Strategy remains exclusively at Level 1 — executives decompose and
supervise, they do not set objectives.**

### 2.2 New agents — responsibilities

**Executives (Level 2).** Each executive: decomposes Orchestrator directives
for their domain, supervises and QCs subordinate output before it reaches
Level 1, resolves intra-domain conflicts, owns domain KPIs, escalates
cross-domain issues. One spec each under the standard protocol.

| Agent | Responsibilities (beyond the executive duties above) |
|---|---|
| `technology-executive` | Platform architecture, build-vs-buy, technical debt, security posture, deploy reliability |
| `product-executive` | Product vision execution: portal/app/aggregator roadmap, prioritization between revenue asks and platform work |
| `revenue-executive` | Unified acquisition→conversion→retention pipeline; budget allocation across marketing/growth/conversion; revenue forecast vs. actual |
| `finance-risk-executive` | P&L integrity, margin governance, risk appetite enforcement, investment-readiness reporting |
| `operations-executive` | Switch-execution reliability, support quality, cost-to-serve reduction, ops automation priorities (jointly with technology-executive) |

**Specialists (Level 3).**

| Agent | Responsibilities |
|---|---|
| `legal-compliance` (staff) | KVKK data inventory & consent texts, EPDK license obligations calendar, contract templates, advertising-claim review (blocking authority on publish) |
| `product-manager` | Requirements, specs and acceptance criteria for customer portal, bill-upload flow, self-service account, aggregator/VPP MVP; backlog management |
| `automation-engineer` | Bill-OCR/parse pipeline, EPİAŞ data pipelines (PTF history, forecast inputs), CRM & e-signature integrations, workflow automation, support-bot plumbing |
| `qa` | Test plans and regression checks for every webmaster/automation release; pre-publish verification of simulator math against pricing formulas |
| `growth` | Experiment backlog and A/B design, referral program, partnership channels (accountants, energy consultants, chambers of commerce) |
| `conversion` | Owns the conversion rate: funnel instrumentation review, drop-off diagnosis, landing/offer/form test execution, simulator→application optimization |
| `lifecycle-crm` | Nurture sequences (email/SMS), onboarding journeys, churn-risk triggers, win-back campaigns, contract-renewal automation |
| `finance-ops` | Cash-flow projection, receivables/DSO management, collections playbooks, EPİAŞ collateral (teminat) planning, unit economics for investor reporting |
| `market-risk` | PTF exposure measurement (open position by month/segment), hedge recommendations (GÖP/GİP/ikili anlaşma mix), stress tests, risk limits — flags any sales commitment that breaches limits |

**Existing agents:** specs unchanged except the Reporting section, which is
updated to name the new executive instead of the Orchestrator.

### 2.3 Expected ROI impact

Directional estimates with the reasoning stated; the Analytics Agent should
baseline each metric before and after rollout. Ordered by expected
profit-impact-per-unit-of-effort.

| Addition | Mechanism | Expected impact (assumptions stated) |
|---|---|---|
| `market-risk` | Caps downside of PTF spikes on fixed-price commitments | **Existential downside protection.** A single unhedged volatile quarter can erase a year of supplier margin; this is insurance, not growth — highest priority despite no upside number |
| `conversion` | Systematic funnel testing on existing traffic | +20–40% visitor→application rate within 2 quarters (typical CRO program on an unoptimized funnel); pure margin — zero added acquisition spend |
| `automation-engineer` | Bill parsing + switching workflow automation | Cost-to-acquire/serve down 30–50% per customer at scale; removes the manual ceiling on growth — precondition for "maximize operational automation" |
| `lifecycle-crm` | Nurture, renewal and win-back automation | +3–5 pts annual retention; in a recurring-revenue business each retention point compounds — LTV uplift typically 10–20% |
| `legal-compliance` | KVKK/EPDK/ad-claim review before publish | Avoided-loss: KVKK fines, license findings, forced campaign retractions; also unblocks faster publishing (pre-cleared templates) |
| `finance-ops` | DSO reduction, collateral planning, unit economics | Working-capital relief (energy retail is cash-hungry: teminat + receivables); investor-ready numbers serve the expansion objective directly |
| `product-manager` + `product-executive` | Portal, bill-upload, aggregator MVP | Opens the second revenue line (aggregation/VPP/demand response) and the moat; largest long-term upside, slowest payback |
| `growth` | Referral + partnerships + experiments | CAC-efficient channel mix; referral customers typically convert 2–3× better and churn less |
| Executive layer | Span-of-control fix, domain QC | Throughput: Orchestrator reviews 7 streams instead of 10+ outputs; quality: defects caught one level down; enables the org to scale past 20 agents |
| `qa` | Independent verification | Avoided-loss: prevents simulator-math errors and broken deploys on a trust-sensitive utility site, where one public pricing error costs more than the agent ever will |

### 2.4 Rollout phases

| Phase | Agents | Rationale |
|---|---|---|
| **1 — Protect & convert** (immediate) | `market-risk`, `conversion`, `automation-engineer`, `legal-compliance` | Caps the existential risk, monetizes existing traffic, removes the manual-ops ceiling, de-risks everything the org publishes |
| **2 — Executive layer & retention** | 5 executives, `lifecycle-crm`, `growth`, `finance-ops`; re-point existing agents' Reporting sections | Fixes span of control before agent count grows further; compounds revenue via retention and channels |
| **3 — Platform** | `product-manager`, `qa` (with `product-executive` from Phase 2 activating fully) | Builds toward the aggregator objective once Phases 1–2 fund and de-risk it |

### 2.5 Decision required

Approve V2.0 as proposed, approve with modifications, or reject. On approval
the Orchestrator will: create each new agent per the 7-step protocol, update
the Reporting sections of the ten existing agents, and re-issue
`ORG-CHART.md` with Level 2 (executive) and Level 3 (specialist) tables.
