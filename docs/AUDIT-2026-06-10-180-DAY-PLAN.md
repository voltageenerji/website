# VOLTAN — FULL-COMPANY AUDIT & 180-DAY EXECUTION PLAN

**Prepared by:** Orchestrator Agent, synthesizing eight delegated audit workstreams
**Date:** 2026-06-10 · **Plan window:** 2026-06-10 → 2026-12-07
**Audit agents:** webmaster, conversion, finance-risk-executive, revenue-executive,
energy-market, product-executive, investor-relations, market-risk
**Status:** Delivered for owner ratification. Decision asks in §6.

---

## 1. Consolidated audit verdict

**One sentence:** Voltan has the right story, the right segment focus and an
energy-native public posture — wired to a funnel that discards every lead, a
simulator whose savings numbers contradict its own math, an advertised
risk-absorption promise with no hedge book or risk framework behind it, zero
measurement, and zero investor-verifiable numbers; almost all of it is
fixable fast, and the fixes are cheap relative to what they unlock.

### Verdicts by audit area

| Area | Verdict | Score/Grade |
|---|---|---|
| Website (technical) | Well-crafted brochure; cannot carry acquisition today; top fixes ≈ 1–2 days of work | Fails as funnel, passes as brand |
| Conversion funnel | B2B brochure, not a funnel; final stage loses 100% of leads by construction; simulator's savings moment has no exit; mobile has no nav or CTA | Structurally ~0% conversion |
| Business model | Industrial focus correct; indexed/hybrid book viable now; **fixed-price book is an unhedged short dressed as a product**; SME is a dropdown, not a segment | Conditionally viable |
| Customer acquisition | Effectively zero capability: passive inbound to a phone number; no list, no channel, no measurement | Near-zero |
| Mesken roadmap | ~97% of households un-servable against the subsidized tariff; viable wedge = de-subsidized >~5,000 kWh/yr homes only | **Conditional NO-GO** on acquisition; GO on checker+waitlist |
| Aggregator roadmap | Stage −1 (not mentioned publicly; prerequisites of prerequisites missing); no operable aggregator license category yet (verify) | Pre-zero; cheap optionality available |
| Investor readiness | Story credible, zero verifiable numbers, no data room, compliance claims contradicted on-page | **2 / 10** |
| Trading capability | One display-only data feed; no blotter, no limits, no governance; first fixed-price contract = unmeasured short power position | **0.6 / 5** |

### The five findings that matter most (independently confirmed by multiple agents)

1. **The lead form has no backend.** `index.html:2477` — `onsubmit` shows an
   `alert()` and discards the data; inputs have no `name` attributes. Every
   lead since launch is unrecoverable, while the prospect is told "we'll call
   you within 1 business day." Found by 6 of 8 agents. The single most
   expensive bug in the company.
2. **Public savings claims contradict their own math.** `index.html:2920-2921`:
   displayed savings `{9.4, 6.8, 12.3}%` vs. coded price multipliers implying
   `{4.3, 2.2, 5.9}%`. Hardcoded, never Pricing-validated, Reklam
   Kurulu/EPDK claims exposure, and arithmetically impossible at a sane
   margin for the indexed product.
3. **The advertised model is an unhedged short position.** The site promises
   "we absorb market volatility on our balance sheet" with a 62%-spot
   sourcing mix and no evidenced hedge book, limits, blotter or stress
   framework. A 2021–22-style PTF episode on a modeled 60 GWh/month
   half-fixed book ≈ −36M TL/month on the fixed book alone, while EPİAŞ
   collateral calls and the receivables gap hit the same week (three cash
   drains, one trigger).
4. **Fabricated liveness + compliance contradiction.** PTF display jitters
   ±0.8% every 1.4s under a "LIVE · EPİAŞ" badge, the 15-minute re-sync is a
   no-op bug (`const anchor` never updates), the proxy-down fallback renders
   a synthetic curve still badged live; "KVKK UYUMLU" badge sits above three
   dead legal links while the form collects PII with no consent. For a
   licensed supplier these are regulatory-optics and DD landmines, each a
   day's fix.
5. **Nothing is measured and nothing is verifiable.** No analytics of any
   kind; no contract register, no financials in any artifact, placeholder
   stats shipped to production ("M+ kWh/ay"). The investor pack, the CAC
   ledger and the risk report are all unbuildable until systems of record
   exist.

---

## 2. 180-day execution plan

Prioritization = expected ROI × probability of success. Three phases; every
item has an owner in the V2.0 org and a measurable exit criterion. QA
verifies all website changes; Legal & Compliance clears all public content;
Pricing validates every public number — standing rules, not per-item notes.

### Phase 1 — Days 0–30: «Stop the bleeding, install the gates»

Highest-ROI, highest-certainty work. Mostly days of effort.

| # | Action | Owner (exec → agents) | ROI | P(success) |
|---|---|---|---|---|
| 1.1 | **Wire the lead form to a real backend** (CF Pages Function/Worker per existing stack), add `name` attrs, persistence + email notification, KVKK consent checkbox; add **simulator-result → form CTA with prefill** | Technology (webmaster, automation-engineer) + conversion; consent text: legal-compliance | Infinite (0→baseline lead capture) | Very high |
| 1.2 | **Instrument the funnel**: CF Web Analytics/GA4, events (sim_start, sim_result, form_start, form_submit, tel/mailto clicks), UTM capture into lead record; canonical lead schema + CAC ledger from day one | conversion + analytics | Enabling (prereq for all optimization & investor KPIs) | Very high |
| 1.3 | **Fix mobile**: working hamburger menu, persistent mobile CTA | Technology (webmaster) | High (majority traffic currently has no path) | Very high |
| 1.4 | **Honesty & credibility package**: remove PTF jitter, fix frozen-anchor re-sync bug, label fallback data honestly; fix/remove placeholder stats ("M+ kWh/ay", static "162 üye tesis"); add og-image/logo assets; fix `--line-strong`/`--mono` CSS; TR/EN parity fixes | Technology (webmaster, QA) | High (DD/regulatory optics) | Very high |
| 1.5 | **Legal surface**: publish KVKK aydınlatma metni, çerez politikası, kullanım koşulları; license number + MERSİS/ticaret sicil in footer; entity/brand memo | legal-compliance + webmaster | High (closes live KVKK exposure + DD red flag) | Very high |
| 1.6 | **Reconcile the simulator math**: Pricing produces a validated formula (real cost stack, baseline comparison) or the figures are labeled illustrative pending validation; displayed savings must equal modeled savings | Finance & Risk (pricing) + webmaster; legal-compliance clears | High (kills the claims exposure) | High |
| 1.7 | **Trading Gate 1**: position blotter + limit document (open MWh/month ≤20% of contracted load, stress-loss cap, tenor ≤M+12, counterparty tiers) ratified; pre-commitment risk-check workflow live. **Hard rule: no fixed-price MWh is committed before Gate 1 exists** | Finance & Risk (market-risk, treasury-capital) | Existential downside protection | Very high |
| 1.8 | **Verification sprint** (primary sources): EPDK license scope & EPİAŞ/VEP status; any off-repo sales commitments (if yes → immediate position measurement); 2026 serbest tüketici limit; current mesken tariff/kademe + de-subsidization rule (threshold, instrument, default price formula); azami uzlaştırma fiyatı; current teminat methodology | energy-market + legal-compliance + treasury-capital; owner supplies documents | Gates everything downstream | High |

**Phase 1 exit criteria:** leads captured and attributed (>0/week); zero
fabricated data on site; legal pages live; limit framework ratified;
verification checklist answered.

### Phase 2 — Days 31–90: «Acquire, measure, assemble»

| # | Action | Owner | ROI | P(success) |
|---|---|---|---|---|
| 2.1 | **B2B outbound motion**: named-account list (top 100: OSB tenants, sanayi odası members, site's own sectors), tiered by est. MWh; call+email sequences using PTF ticker/simulator as hook; every offer Pricing-validated and risk-checked | Revenue (sales) + pricing + market-risk | Highest TL-per-effort acquisition channel | High |
| 2.2 | **Broker & mali müşavir partner pilot**: commission-per-signed-MWh framework, 1-business-day quote SLA, pilot 5 brokers + 10 accountants (İstanbul/Kocaeli corridor) | Revenue (growth) + pricing + legal-compliance | High, fully variable cost | Medium-high |
| 2.3 | **SEO content, first 6 pages**: serbest tüketici 2026, tedarikçi değiştirme süreci, sector cost guides (OSB/tekstil/çelik), PTF explainer; native TR, ending in the working form | Revenue (marketing) | High at maturity, slow burn | High |
| 2.4 | **PTF/SMF data pipeline**: persist hourly history (backfill 3+ yrs), YEKDEM/imbalance components; extend epias-proxy to versioned store; load-forecasting v0 from portfolio profiles | Technology (automation-engineer) + energy-market | Enabling (hedging, pricing, aggregator baselines) | High |
| 2.5 | **Investor pack assembly**: license & corporate pack, 3-year financial summary, contract/portfolio register (system of record), risk one-pager (hedge ratio, open position, one stress), data-room index | investor-relations + treasury-capital + analytics; owner supplies source docs | High (readiness 2→~5-6/10) | Medium-high (gated on document existence) |
| 2.6 | **Mesken Stage 0** (gated on 1.8 tariff verification): eligibility checker with an honest "don't switch — the regulated tariff is cheaper for you" path; waitlist for the de-subsidized wedge (>~5,000 kWh/yr, EV, electric heating). **No savings promises anywhere** | product-manager + design + webmaster; math: pricing/billing-analysis; clearance: legal-compliance | Medium now, compounds later; zero-CAC pipeline | High |
| 2.7 | **Aggregator Stage 0**: flexibility-interest fields on quote form (peak kW, curtailable bands, windows, genset/storage), flexibility register v0, public "Esneklik & Agregasyon" section (no revenue/regulatory claims), OSOS data-consent in onboarding | Product (product-manager, design) + legal-compliance | Cheap optionality on the strategic moat | High |
| 2.8 | **Cash & collateral discipline**: rolling 13-week cash + teminat projection with headroom floor; weekly report; acquisition pace formally capped by collateral headroom | treasury-capital | Existential protection | High |
| 2.9 | **First monthly KPI pack** (energy-native definitions): MWh under contract, margin/MWh, energy-weighted churn, CAC/MWh, hedge ratio, open position, teminat headroom, DSO | analytics + owning agents | Investor + management visibility | High |

**Phase 2 exit criteria:** ≥40 qualified B2B conversations; ≥60 GWh/yr in
proposal stage; partner channel active (≥1 RFQ/month per partner); KPI pack
publishing monthly; data room ≥70% complete on standard checklist.

### Phase 3 — Days 91–180: «Hedge, convert, compound»

| # | Action | Owner | ROI | P(success) |
|---|---|---|---|---|
| 3.1 | **Hedge execution capability**: 2–3 wholesale counterparties credit-assessed with master agreements; VEP admission + Takasbank accounts confirmed; 2-week paper-trade cycle; then hedge live book to ratified ratios (≥80% M+1..3, ≥60% M+4..6 of committed fixed MWh) | Finance & Risk (market-risk, treasury-capital, energy-market) | Converts fixed-price product from speculation to business | Medium-high |
| 3.2 | **Conversion test program** on the now-instrumented funnel: execute CRO backlog (B2B/B2C path clarity, form friction, trust block, result-moment optimization) with pre-registered hypotheses | Revenue (conversion) + design + webmaster + QA | +20–40% funnel lift typical on unoptimized funnels | High |
| 3.3 | **Aggregator LOIs**: 2–3 industrial customers sign non-binding flexibility LOIs (kW, windows, notice period); stretch: one manual DR event against a PTF peak if portfolio allows | Revenue (sales) + product-manager; template: legal-compliance | The moat's first hard evidence | Medium |
| 3.4 | **Mesken Stage 1 conditional pilot** — only if T1 (≥5% verified spread vs. de-subsidized price), T2 (rule confirmed in force), T3 (claims-compliant calculator) all pass: digital-only indexed-with-cap offer to waitlist, hundreds of customers, instrumented for churn/margin not growth | Revenue + pricing + legal-compliance; gate ratified by Orchestrator | Medium; option value high | Medium (external gates) |
| 3.5 | **EN search visibility**: prerendered `/en/` with self-canonical (or drop hreflang until then); content program scales to 12+ pages | Technology (webmaster) + marketing | Medium | High |
| 3.6 | **Settlement reconciliation live**: monthly EPİAŞ uzlaştırma vs. internal ledger (±0.5%), owned by billing-analysis with market-risk review | Finance & Risk (billing-analysis) | Margin integrity | High |
| 3.7 | **Investor narrative deck + AI-org receipts**: 10–12 page deck on assembled numbers; 90 days of measured agent-org outputs (cost-to-serve trend, quote turnaround) as the operating-leverage evidence | investor-relations + analytics | Readiness → ~6-7/10; funding optionality | Medium-high |

### Standing prohibitions for the full 180 days

1. **No proprietary/directional trading.** Procurement-for-supply and book
   hedging only. Revisit after 12 months of clean desk track record.
2. **No fixed-price MWh commitment without a pre-commitment risk check**
   (Gate 1 workflow). Sales/Pricing are bound by this system-wide.
3. **No paid acquisition spend** until instrumentation (1.2) proves the
   funnel and a CPL/MWh ceiling is set. Then B2B long-tail search only.
4. **No mesken acquisition or savings claims** outside the gated Stage 1
   pilot. The checker must be able to say "don't switch."
5. **No aggregator platform capital** before Gate G1 (≥15–20 B2B sites,
   ≥10 MW registered curtailable, ≥2 LOIs) and Gate G2 (EPDK framework in
   force).
6. **No public number without a Pricing validation and Legal & Compliance
   clearance.** No exceptions, including the existing simulator constants.

---

## 3. Day-180 targets (ratify with plan)

| Metric | Today | Day-180 target |
|---|---|---|
| Lead capture | 0 (form discards) | 100% captured & source-attributed |
| Qualified B2B conversations | 0 measured | ≥40 cumulative |
| Proposal-stage pipeline | 0 measured | ≥60 GWh/yr |
| Signed B2B contracts | unverified | ≥3 new, all risk-checked |
| Fixed-price offers risk-checked pre-commitment | 0% (no system) | 100% |
| Hedge ratio on committed fixed book (M+1..3) | unmeasured | ≥80% |
| Investor readiness (IR score) | 2/10 | ≥6/10; data room ≥70% |
| Mesken | nothing | checker+waitlist live; pilot only if T1–T3 pass |
| Flexibility register | nothing | live; ≥10 MW identified (stretch); ≥2 LOIs |
| Public claims validated | 0% | 100% |

## 4. ROI × probability rationale (why this ordering)

Phase 1 dominates because it is near-zero cost, near-certain success, and
gates everything: a working form converts existing traffic that is already
paid for; the limit framework is insurance against the only scenario that
kills the company outright; the honesty/legal fixes remove findings that
would otherwise poison every sales call and DD conversation. Phase 2 builds
the only acquisition channels with proven TL-per-MWh economics for a Turkish
industrial supplier (outbound + intermediaries) while assembling the systems
of record that make numbers verifiable. Phase 3 spends on capability
(hedging, conversion testing, optionality) only after measurement and gates
exist — protecting against the classic supplier failure mode of growing an
unhedged, unmeasured book.

## 5. Verification dependencies (owner/primary-source, from §1.8)

EPDK license scope · EPİAŞ PK/GÖP/GİP/VEP status · existence of any off-repo
sales commitments (day-one position question) · 2026 serbest tüketici limit ·
current mesken tariff sheet, kademe threshold, de-subsidization rule ·
azami uzlaştırma fiyatı · current teminat methodology · OSOS thresholds ·
EPDK demand-side participation framework status. All agent knowledge is
dated ≤ early 2026 and flagged accordingly in the underlying audits.

## 6. Decision asks (owner)

1. **Ratify this plan** (or amend phase contents/targets).
2. **Answer the day-one risk question:** do any bilateral/fixed-price sales
   commitments exist today outside this repo? If yes, position measurement
   starts immediately.
3. **Supply source documents** for the investor pack: EPDK license, EPİAŞ
   registration, financials, contract base. Their existence sets the
   investor timeline; their absence is escalated as existential.
4. **Authorize Phase 1 implementation** — items 1.1–1.6 are largely in-repo
   website work the organization can begin executing immediately on
   approval.
