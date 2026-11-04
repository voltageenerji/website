---
paths:
  - "rehber.html"
  - "rehber/**/*.html"
  - "elektrik-faturasi-hesaplama.html"
  - "kurumsal.html"
  - "canli-ptf.html"
  - "sitemap.xml"
  - "llms.txt"
---

# Content pages (guides, tools, corporate, live PTF)

- **Claims.** No savings % or ₺, no "en ucuz", no price, continuity or "kesintisiz" guarantee. Comparative statements about görevli tedarik şirketleri go to Legal & Compliance first.
- **Facts.** Every regulatory figure carries its decision number and date (EPDK Kurul Kararı, Resmî Gazete date/issue) or a linked primary source. Verified 2026 values: serbest tüketici 500 kWh (Karar 14039); SKTT mesken 4.000 / diğer 15.000 kWh (Karar 13912); ETV %5 mesken-ticarethane, %1 sanayi. Tariff unit prices, kademe structure and KDV rate are NOT verified: never hard-code them.
- **FAQ schema.** Every `FAQPage` question and answer in JSON-LD matches the visible FAQ word for word. Change both together.
- **Headings.** One H1. Article `headline`, breadcrumb name and `og:title` stay in sync with the H1/title.
- **Freshness.** A content change updates the visible "son güncelleme" date, JSON-LD `dateModified` and the page's `<lastmod>` in `sitemap.xml`.
- **Calculators.** Outputs say "tahminidir" and "teklif veya taahhüt değildir". Thresholds follow the law: serbest tüketici is strictly above 500 kWh; SKTT applies above the limit.
- **Language.** Turkish reads natively. Prefer short sentences; avoid long dashes and slogan patterns ("X değil, Y", triplets).
- **Gate.** QA verdict before `main`; Legal & Compliance for any new public claim.
