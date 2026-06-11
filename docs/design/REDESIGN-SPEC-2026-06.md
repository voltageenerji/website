# VOLTAGE.COM.TR — REDESIGN SPECIFICATION (2026-06)

**Author:** Design Agent (L3, Product domain) · **For:** Webmaster Agent (implementation), QA Agent (verification)
**Mandate (owner, binding):** Redesign from scratch. KEEP the soft, predominantly LIGHT identity
(cream/off-white + dark ink + gold accent). Soft, premium, trustworthy. Not a dark-mode site.
**Constraints:** single-file static site (`index.html`), no frameworks, no build step. The new CSS
replaces BOTH existing style layers (current `<style>` block lines ~142–1994, which contains two
conflicting definitions of `.mcp-rail`, `.hud-chip`, `.live-market`, `.lm-*`, `.sectors`, `.sec-*`,
`.process*`, `.calc-*`, `.cert*`, `.hero-canvas`) with ONE coherent layer.
**Budget:** new `<style>` block ≤ 1,000 lines / ≤ 32 KB unminified (current ≈ 1,850 lines).
**Copy:** content text is NOT rewritten. Visual redesign only. Optional copy notes are quarantined
in §9 and require Marketing + Legal & Compliance sign-off before use.

---

## 0. Design direction (read first)

"Quiet ledger" — the site should feel like a beautifully typeset energy contract: warm paper
surfaces, generous whitespace, hairline rules, dark ink typography, and gold used the way a
notary uses a seal — rarely, and only where it means something (CTAs, the live price, key
emphasis). Exactly ONE dark section survives: the **Live Market band** (`.live-market`), where
the dark ground makes the PTF chart read like a trading terminal and provides the page's single
moment of contrast. Everything else — including the footer and the simulator — is light.

Conversion spine: **hero (5-second B2B value prop) → savings simulator (the engagement moment)
→ lead form (the capture moment)**. Every visual decision below either shortens that path or
builds the trust needed to take it. (Funnel priorities per
`docs/AUDIT-2026-06-10-180-DAY-PLAN.md` §1 finding 1, items 1.1–1.4, 3.2.)

---

## 1. Design system (section A)

### 1.1 Color tokens — replace the current `:root` block verbatim with:

```css
:root {
  /* Surfaces (light, warm) */
  --paper:        #F7F5EF;  /* page ground — 1 step lighter than current #F5F3EC for airier feel */
  --paper-warm:   #EFEBE0;  /* alternating section ground */
  --paper-raise:  #FFFFFF;  /* cards, form panel */
  --cream-deep:   #E7E2D3;  /* footer ground (light footer; warm, NOT dark) */

  /* Ink (text) */
  --ink:          #11141F;  /* primary text — slightly lifted from #0A0E1A; still 16:1+ on paper */
  --ink-soft:     #2B3142;  /* secondary text */
  --ink-muted:    #555D6E;  /* captions, labels — 6.2:1 on paper (see §6) */

  /* Lines */
  --line:         #E2DDCF;  /* hairlines on paper */
  --line-strong:  #CFC8B4;  /* card borders, dividers that must read */

  /* Accent — gold/bronze family. RULES: #C9A961 is DECORATIVE/ON-DARK ONLY.
     Text-bearing accent on light surfaces is ALWAYS --accent-ink. */
  --accent:       #C9A961;  /* fills, icon strokes, rules, on-dark text, CTA fill */
  --accent-dark:  #A68A44;  /* hover fills, large decorative numerals */
  --accent-ink:   #7E632B;  /* accent TEXT on light surfaces — 5.1:1 on --paper */

  /* The one dark section (live-market) */
  --night:        #0C101D;  /* section ground */
  --night-line:   rgba(245,243,236,0.10);
  --on-night:     #F5F3EC;  /* primary text on dark */
  --on-night-mut: rgba(245,243,236,0.68); /* muted on dark — keep alpha ≥ 0.68 (≈8.2:1) */

  /* Semantic */
  --pos:          #1F7A4D;  /* up/positive on light (5.0:1) */
  --pos-night:    #5BC489;  /* up/positive on dark (8.9:1) */
  --neg:          #B8332A;  /* errors, down-deltas on light (5.6:1 on paper) */

  /* Type */
  --serif: 'Fraunces', Georgia, serif;
  --sans:  'Inter Tight', -apple-system, 'Segoe UI', sans-serif;
  --mono:  ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;

  /* Motion */
  --ease:     cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-1: 150ms;  /* micro: hovers, focus */
  --dur-2: 300ms;  /* small: menu, toggles */
  --dur-3: 600ms;  /* large: reveals */

  /* Space scale (4-base). Use ONLY these steps. */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px; --s-5: 24px;
  --s-6: 32px; --s-7: 48px; --s-8: 64px; --s-9: 96px; --s-10: 128px;
  --sect-y: clamp(72px, 9vw, 128px);   /* vertical section padding */
  --sect-x: clamp(20px, 5vw, 48px);    /* horizontal page gutter */

  /* Radius */
  --r-sm: 10px;   /* chips, inputs */
  --r-md: 16px;   /* cards */
  --r-lg: 24px;   /* section-level panels (simulator, form) */
  --r-pill: 999px;

  /* Shadows — soft, diffuse, warm-tinted; never hard */
  --shadow-1: 0 1px 2px rgba(17,20,31,0.04), 0 4px 16px rgba(17,20,31,0.05);
  --shadow-2: 0 2px 4px rgba(17,20,31,0.05), 0 16px 48px -12px rgba(17,20,31,0.10);
  --shadow-cta: 0 8px 24px -8px rgba(166,138,68,0.45);
}
```

Notes for the Webmaster:
- Old tokens `--white`, `--line-soft`, `--red` map to `--paper-raise`, `--line`, `--neg`.
  Search-replace all usages; no old token may remain.
- `theme-color` meta (#0A0E1A) changes to `#F7F5EF` (light identity, mobile chrome matches page).
  Favicon SVG: change `rect fill` from `%230A0E1A` to `%23F7F5EF`, V-path stroke to `%2311141F`,
  keep gold circle/dot. Same change to apple-touch-icon.

### 1.2 Typography

Keep the **Fraunces (display serif) + Inter Tight (UI sans)** pairing — it is distinctive,
already brand-associated, and the serif's old-style warmth supports the paper identity. No
better 2-family Google pairing improves on it for this brand; do not change families.

**Subset the load** (saves ~40 KB of font payload):

```
https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,400&family=Inter+Tight:wght@400;500;600&display=swap
```

Dropped: Fraunces 500/600 (unused in new system), Inter Tight 300/700 (300 too faint for AA at
small sizes; 700 unused). `--mono` stays a system stack (never load IBM Plex Mono — the old CSS
referenced it without loading it).

Type scale (clamp-based, mobile-first):

| Token | Spec | Use |
|---|---|---|
| `--t-display` | Fraunces 300, `clamp(40px, 7vw, 96px)`, lh 1.0, ls −0.03em | h1 hero only |
| `--t-h2` | Fraunces 300, `clamp(32px, 4.5vw, 60px)`, lh 1.05, ls −0.025em | `.section-title` |
| `--t-h3` | Fraunces 400, `clamp(22px, 2.2vw, 28px)`, lh 1.2, ls −0.015em | card titles, form title |
| `--t-num` | Fraunces 300, `clamp(40px, 5vw, 72px)`, lh 1, tabular-nums | stats, simulator result |
| `--t-body` | Inter Tight 400, 16px (17px ≥1024px), lh 1.6 | paragraphs |
| `--t-small` | Inter Tight 400, 14px, lh 1.55 | descriptions, footer |
| `--t-label` | Inter Tight 500, 12px, lh 1.4, ls 0.14em, uppercase | section labels, form labels |
| `--t-micro` | Inter Tight 500, 11px, ls 0.12em, uppercase | meta, pills, disclaimers headers |

Hard floor: **no text below 11px** anywhere (current file has 9–10px instances — all rise to 11px).
Headline italics (`em` in `.section-title`/`.hero-title`): Fraunces italic 400, color
`--accent-ink` on light, `--accent` on the dark band.

### 1.3 Borders, dividers, iconography

- Hairlines: `1px solid var(--line)`; structural dividers `var(--line-strong)`.
- Card grids use `gap: 1px; background: var(--line)` technique (as today) inside a
  `--r-lg`-rounded, overflow-hidden wrapper.
- Icons: existing inline SVGs kept; stroke color `currentColor`, applied as `--ink` default,
  `--accent-dark` only inside `.sec-icon`. Stroke-width 1.3–1.5; no filled icons.

### 1.4 Motion rules

- Allowed: opacity/transform reveals (`.reveal`→`.in`, translateY 16px, `--dur-3` `--ease-out`),
  hover micro-moves ≤ 4px, the PTF rail marquee, the chart dot pulse.
- Removed from the old design: hero `slideUp` line masking (replace with single fadeUp of the
  whole h1 — cheaper and calmer), the aurora blobs' infinite drift (keep static radial washes,
  no animation), the `.marquee` brand strip animation if the section is kept (see §2.3).
- Every animation and the marquee MUST be disabled under reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .reveal { opacity: 1; transform: none; }
  html { scroll-behavior: auto; }
}
```

- `scroll-behavior: smooth` stays (JS smooth-scroll also present; both respect the rule above).

---

## 2. Layout per section (section B) — in DOM order

Section order is unchanged (no JS or anchor breakage): nav · mobile-menu · hero · marquee ·
live-market · sectors · process · calc (simulator) · certs · about (#hakkimizda) · services
(#hizmetler) · approach (#yaklasim) · quote · contact (#iletisim) · footer.

**One structural IA change (approved scope):** the calc section root gains `id="simulator"`
(`<section class="calc-section" id="simulator">`) so the hero can deep-link to it. Purely
additive; no existing anchor changes.

### 2.0 Navigation (`.nav`, `#nav`)

- Fixed top bar; `padding: 18px var(--sect-x)`; background `rgba(247,245,239,0.85)` +
  `backdrop-filter: blur(16px)`. `.scrolled` (JS toggles on `#nav`): padding 12px,
  `border-bottom: 1px solid var(--line)`, `--shadow-1`.
- Left: logo lockup as today (mark 28px + "Voltage" Fraunces 22px + divider + "ENERJİ" micro).
- Center: `.nav-links` — Inter Tight 500 13.5px, color `--ink-soft`, hover `--ink` with 1px
  underline grow (keep pattern, duration `--dur-1`).
- Right: `.lang-toggle` (unchanged markup/classes — JS contract) + `.nav-cta`.
- **`.nav-cta` becomes the gold CTA**: fill `--accent`, text `--ink`, weight 600, `--r-pill`,
  padding 10px 20px; hover fill `--accent-dark`, text stays `--ink` (8.6:1 → 5.0:1+ both states).
  *Reasoning:* the quote CTA is currently ink-on-ink with every other button; the single gold
  element in the nav makes "Teklif Al" the unmissable persistent action (audit 1.1/1.3).
- TR/EN: "Teklif Al"/"Get a Quote" both fit; min-width not needed. Nav links: TR strings are the
  longer set ("Hakkımızda") — gap drops from 42px to 32px at ≤1180px before the 640px collapse.

### 2.1 Hero (`.hero`)

Goal: an industrial buyer understands within 5 seconds: *who* (EPDK-licensed industrial
electricity supplier, since 2011), *what for me* (lower, contract-disciplined energy cost),
*what next* (simulate my bill / request a proposal).

- Layout: `min-height: 92vh` desktop / auto mobile; `padding: 200px var(--sect-x) 72px`
  (the PTF rail sits between nav and content, see below). Content max-width 1160px, left-aligned.
- **Background simplification:** keep `.hero-canvas` wrapper (decorative, no JS) but reduce to:
  one static warm radial wash top-right (`radial-gradient(circle at 80% 10%,
  rgba(201,169,97,0.14), transparent 60%)`) + the faint 64px grid with radial mask. DELETE the
  animated `.aurora` divs, the animated flow-line SVG (`.hero-svg-layer`) and `.hero-visual`
  compass SVG. *Reasoning:* they cost paint time and attention; the live PTF rail already
  provides "alive market" signal honestly. The paper-grain `body::before` overlay is also
  deleted (blend-mode over fixed inset is a scroll-performance tax on mobile).
- **PTF rail (`.mcp-rail` + `#mcpTrack`)** moves to a single definition: position static-in-flow
  at the very top of the hero (directly under the nav, full-bleed), height 36px, background
  `rgba(17,20,31,0.035)`, hairline top/bottom, `--mono` 11px. Cells as injected by JS
  (`.cell`, `b`, `.up`→`--pos`, `.dn`→`--neg`). Animation `rail 80s linear infinite`, paused
  under reduced motion. **Visible on mobile** (the old layer-1 CSS hid it at ≤1024px — the new
  one does not; it is the most honest trust signal we own).
- **HUD chips (`.hero-hud`, `.hud-chip.ul/.br`)**: keep BOTH (JS fills `#hudPtf`, `#sparkLine`,
  `#sparkArea`, `#sparkDot`, `#hudPtfStatus`). Restyle as light cards: `--paper-raise` at 0.8
  alpha + blur, `--r-md`, `--shadow-1`, border `--line`. `.ul` top-right under the rail; `.br`
  bottom-right. `#hudPtfStatus` (the "canlı/temsili" line) is 11px `--ink-muted` — never smaller,
  never hidden while the chip is visible: it is the honesty label (audit 1.4). At <960px the
  `.ul` chip docks full-width above the hero stats; `.br` is hidden (as today).
- Content stack: `.hero-eyebrow` (label style, gold 32px dash) → `h1.hero-title`
  (`--t-display`; TR/EN spans unchanged; single fadeUp) → `.hero-sub` two-column 17px text
  (1-col below 1024) → `.hero-actions`.
- **CTAs (markup change for Webmaster):**
  - Primary `.btn-primary` → `href="#simulator"`, label span keeps `data-tr`/`data-en` —
    *(optional copy note §9 suggests label change; default keeps existing strings)*. Style:
    fill `--ink`, text `--paper`, `--r-pill`, padding 16px 32px, arrow svg; hover: background
    `--accent-dark` slide kept but simplified to a plain background-color transition `--dur-2`.
  - Secondary `.btn-secondary` → `href="#iletisim"` — outline 1px `--ink`, hover ink fill.
  - *Reasoning:* directive: primary → simulator, secondary → form. The simulator is the
    highest-intent next step for a cold industrial visitor; the form is for the already-warm.
- `.hero-meta` (EPDK badge / İstanbul / Est. 2011): keep top-right, micro type; hidden <640px.
- `.hero-ticker` stats: 4-up hairline-top grid; numerals `--t-num` (smaller clamp 32–52px),
  units in `--accent-ink`. 2-up below 1024px, 2-up 24px gap at mobile.

### 2.2 Mobile menu (`#mobileMenu`, `.mobile-menu`)

- Full-width sheet under the nav, background `rgba(247,245,239,0.98)` + blur, slides/fades in
  `--dur-2` (display:flex via `.open` — JS contract unchanged).
- Links: 17px, 16px vertical padding (≥48px hit), hairline separators.
- `.mobile-menu-cta`: gold pill (same spec as `.nav-cta`), margin-top 20px.
- Burger `#mobileMenuBtn`: 44×44px hit area (current 22px lines + 8px padding ≈ 38px — increase
  padding to 11px); keep the 3-span → X transform tied to `aria-expanded`.

### 2.3 Marquee (`.marquee`)

Keep the section (it carries TR/EN service keywords) but restyle LIGHT: background
`--paper-warm`, hairline top/bottom, text Fraunces 20px `--ink-soft`, gold dots. Animation only
without reduced-motion. **Both `.marquee-track.tr-only` and `.marquee-track.en-only` tracks and
the lang-toggle display rule must survive** (see inventory). *Optional (flagged):* the section
may be dropped entirely to save weight — decision for Product Executive; if dropped, remove the
matching lang-toggle CSS exception too.

### 2.4 Live Market band (`.live-market`) — THE one dark section

- Background `--night`; faint gold 80px grid mask kept (static). Padding `--sect-y` `--sect-x`.
- `.section-label` `--on-night-mut`; `.section-title` `--on-night` with `em` in `--accent`.
- Grid `1.6fr 1fr`, gap 24px; 1-col <1024px.
- **Chart card `.lm-chart`**: `rgba(255,253,247,0.03)`, border `--night-line`, `--r-lg`,
  padding 28px. Head row: title (Fraunces 20px) + `#lmChartMeta` under it + `.lm-chart-now`
  right-aligned (`#lmNow` Fraunces 36px tabular + ₺ in `--accent`; `.delta` `--mono` 11px,
  `--pos-night` when ▲ / `--neg`-tinted `#E08A7E` when ▼ — pure CSS classless via JS text, so
  color stays `--pos-night` constant; acceptable).
  - **Honest-data state (`#lmChartMeta.fallback`)**: when JS sets `TEMSİLİ VERİ / INDICATIVE
    DATA`, the `.fallback` class renders it `--on-night-mut`, NO pulse dot, NO gold, with a
    1px dashed underline. The live state shows a small steady `--accent` dot (pulse only
    without reduced-motion). The live/temsili distinction must be visually unmistakable.
  - SVG internals keep ids `lmFill` (gradient), `lmArea`, `lmLine`, `lmDot`; axis labels move
    from `font-size 10` to `11`, fill `rgba(245,243,236,0.68)`.
- Side cards `.lm-card`: same surface; `h5` micro labels at `--on-night-mut` (alpha 0.68 — the
  old 0.45–0.55 values fail AA and are banned); `#lmSupply` rows: name 13px `--on-night`,
  sub 11px `--on-night-mut`, status dot `--pos-night`.
- **Portfolio-mix card**: bars `--accent` gradient on `rgba(245,243,236,0.08)`; the
  "Temsili dağılım —…" footnote renders 11px `--on-night-mut` (was 10px) and may not be removed
  or de-emphasized (compliance lock, see §7).

### 2.5 Sectors (`.sectors`)

- Light (`--paper`). Head: title left, intro paragraph right (flex, wraps <900px).
- `.sec-grid`: 4-col hairline grid in `--r-lg` wrapper; 2-col ≤1100px; 1-col ≤640px.
- `.sec-cell`: padding 32px 28px, min-height 260px; number `.sec-n` `--mono` 11px `--ink-muted`;
  icon 44px `--accent-dark`; title Fraunces 22px; desc 13.5px `--ink-soft`.
- Hover: background `--paper-warm` + 2px gold bottom rule scaleX (kept from layer 1 — it's the
  better affordance of the two old designs). No transform jumps.

### 2.6 Process timeline (`.process`)

- Ground `--paper-warm` with hairline top/bottom — visually separates "how it works".
- 5-col track, connecting hairline `--line-strong` behind dots; ≤960px: 2-col, line hidden;
  ≤520px: 1-col with a LEFT vertical rule connecting dots (new: `border-left` on track,
  dots offset −1px) so the sequence still reads as a path on mobile.
- `.process-dot`: 56px circle (76px was oversized), Fraunces 18px, `--paper` fill, `--line-strong`
  border; `.done` state: `--ink` fill, `--paper` text. Hover inversion kept, `--dur-2`.
- `.process-k` micro 11px / `.process-t` Fraunces 22px / `.process-d` 13.5px.
- *Reasoning:* "Teklif'ten ilk faturaya, 14 gün" is the strongest objection-killer on the page
  (switching pain); it sits directly before the simulator to prime the CTA.

### 2.7 Savings simulator (`.calc-section#simulator`) — the conversion moment

- **Section ground is LIGHT** (`--paper`); the drama lives in the result card.
- `.calc-grid`: one bordered panel (`--line-strong`, `--r-lg`, overflow hidden, `--shadow-2`),
  2 columns; 1-col <960px (controls first, result second — thumb reaches CTA last).
- **Controls (`.calc-controls`)**: ground `--paper-warm`, padding 48px (32px mobile).
  - Labels: `--t-label`; live values (`#calcMwh`, `#calcPrice`) Fraunces 17px `--ink`.
  - Ranges (`#calcRangeMwh`, `#calcRangePrice`): `accent-color: var(--accent-dark)`; custom
    thumb 22px (44px hit via 22px thumb + padded track area), track 4px `--line-strong`;
    visible `:focus-visible` ring (§6).
  - Model toggle `.calc-toggle`: pill group, active = `--ink` fill `--paper` text; inactive
    `--ink-soft` on transparent; min 44px height. (JS contract: `button` + `data-model` +
    `.active` — unchanged.)
- **Result card (`.calc-result`)**: ground `--ink`, text `--paper`, `--r-lg` on its side —
  the page's only dark *component* outside the live-market band (component, not section;
  within mandate). Padding 48px.
  - `.calc-result-k` micro 11px `--on-night-mut`.
  - `#calcTotal`: `--t-num` at full clamp (52–96px), tabular; ₺ in `--accent`.
  - `.calc-result-sub` ("Dengeleme, sapma… hariç"): 13px, alpha 0.68 — compliance-relevant,
    stays adjacent to the number.
  - `.calc-savings` 2-up: `#calcAnnual`, `#calcSavings` Fraunces 26px `--accent`.
  - **`#calcCta` is the most prominent button on the site**: full-width gold pill, fill
    `--accent`, text `--ink` 13px/600 uppercase, padding 18px, `--shadow-cta`; hover
    `#D9BC78`+1px lift; focus ring per §6. Nothing else inside the card may compete with it.
  - `.calc-disclaimer`: 11.5px, `rgba(245,243,236,0.68)`, margin-top 16px. **Text verbatim,
    always visible, never collapsed** (compliance lock).
- *Reasoning:* the result number + gold CTA + honest disclaimer in one card is the audit's
  "result-moment" (3.2); contrast (dark card on light page) makes it the page's focal point
  without violating the light identity.

### 2.8 Certifications strip (`.certs-strip`)

- Light, hairline top/bottom, centered wrap of pills, padding 48px.
- `.cert-pill`: `--r-pill`, border `--line-strong`, 11px micro, `--ink-soft`; the `b` prefix
  (EPDK/YEK-G/İTO/KVKK) in `--accent-ink` 600. Link pill (`a.cert-pill[href="/kvkk"]`) hover:
  border `--accent-dark`. Placed right after the simulator = trust immediately after the claim.

### 2.9 About (`#hakkimizda .about`)

- Light; 2-col `1.1fr 1fr` gap 96px; 1-col <1024px.
- Left: label → title → `.about-intro` (Fraunces 300, clamp 24–32px) → two `.about-body`
  16px paragraphs → `.about-signature` hairline-top row.
- Right `.about-stats`: hairline-stacked stat rows in `--r-lg` wrapper; values `--t-num`
  (44–64px); units `--accent-ink`. Hover wash `--paper-warm`.
- The HTML comment forbidding unverified quantitative stats stays in place (inventory §7).

### 2.10 Services (`#hizmetler .services`)

- **Was dark; becomes light `--paper-warm`** (one-dark-section rule). Numbered list rows with
  hairline separators; `.service-num` `--accent-ink`; `.service-name` Fraunces clamp 24–34px
  `--ink`; `.service-desc` 15px `--ink-soft` (hidden <1024px as today); arrow `--ink-muted`,
  hover `--accent-ink` + 4px translate. Row hover: background `--paper` wash.

### 2.11 Approach (`#yaklasim .approach`) and Quote (`.quote`)

- Approach: light; centered header; 3-col hairline card grid (1-col <1024px); icons 44px
  `--ink`; tags italic `--accent-ink`.
- Quote: `--paper-warm`, hairline top/bottom; mark glyph Fraunces italic 96px `--accent`
  (decorative, `aria-hidden` may be added); text Fraunces italic clamp 26–40px.

### 2.12 Contact / lead form (`#iletisim .contact`) — the capture moment

- 2-col `1fr 1.2fr` gap 80px; 1-col <1024px (info first — trust before ask).
- **Trust block (left)**: label → title → `.contact-info-text` (the "1 iş günü" response
  promise — visually emphasize: 17px, `--ink-soft`) → `.contact-details` hairline list
  (Telefon / E-posta / Merkez / Tüzel Kişilik). Detail values Fraunces 18px; links hover
  `--accent-ink` underline. The legal entity line stays — B2B buyers check it.
- **Form panel (`form.form#leadForm`)**: `--paper-raise`, border `--line`, `--r-lg`,
  `--shadow-2`, padding 48px 44px (32/24 mobile).
  - Inputs/selects/textarea: REPLACE underline-only style with soft boxes — background
    `--paper`, border 1px `--line-strong`, `--r-sm`, padding 12px 14px, min-height 46px;
    focus: border `--ink` + ring per §6. *Reasoning:* boxed fields outperform hairline fields
    on perceived affordance and mobile touch accuracy; this is the funnel's last step.
  - Labels above fields, `--t-label`, `--ink-muted`. Two-col rows collapse <640px.
  - **KVKK consent (`.form-consent`)**: 13px `--ink-soft`; checkbox 20×20px,
    `accent-color: var(--ink)`, wrapped in the existing `<label>` (whole row clickable ≥44px).
    Link underlined, hover `--accent-ink`. Text verbatim (compliance lock).
  - Honeypot `.hp-field` CSS unchanged (off-screen, aria-hidden).
  - **Error box (`#leadError`)**: border-left 3px `--neg`, background `rgba(184,51,42,0.06)`,
    text `--neg` 13px, `--r-sm`; `role="alert"` kept; JS toggles `display` inline — keep
    default `display:none` in CSS.
  - **Submit (`.form-submit`)**: full-width gold pill — same family as `#calcCta` (fill
    `--accent`, ink text, 600); the form's only gold element. Disabled state opacity 0.55 +
    `cursor: wait` kept ("Gönderiliyor…" text is JS-driven via the span — do not remove span).
  - **Success panel (`#leadSuccess.form.form-success`)**: same panel style; title Fraunces 26px;
    a 48px `--pos` check-circle SVG may be added above the title (decorative); numbered
    next-steps list with hairline separators, numerals `--accent-ink`. Default `display:none`
    via `.form-success` (JS shows it) — contract unchanged.

### 2.13 Footer (`.footer`)

- **Light footer**: ground `--cream-deep`, top border `--line-strong`; text `--ink-soft`;
  this keeps the single-dark-section rule and lets the page end on paper.
- 4-col top grid (brand+desc / Kurumsal / Hizmetler / İletişim); 2-col <1024px, 1-col <640px.
- Brand mark + "Voltage ENERJİ" lockup in `--ink` with sub in `--accent-ink`.
- Links 14px `--ink-soft`, hover `--ink` underline. Column titles `--t-label` `--ink-muted`.
- `.footer-bottom`: hairline-top row, 12px `--ink-muted`; legal links (`/kvkk`,
  `/cerez-politikasi`, `/kullanim-kosullari`) intact; **the commented MUST-FILL license/MERSİS
  block stays in the markup verbatim** (compliance lock).

### 2.14 NEW: mobile sticky bottom CTA bar

New element (additive — coordinate `track()` wiring with Webmaster):

```html
<div class="mobile-cta-bar" id="mobileCtaBar">
  <a href="tel:+902164790510" class="mcb-tel" aria-label="Telefon">[phone svg]</a>
  <a href="#simulator" class="mcb-sim" data-tr="Tasarrufu Hesapla" data-en="Estimate Savings">Tasarrufu Hesapla</a>
  <a href="#iletisim" class="mcb-quote" data-tr="Teklif Al" data-en="Get a Quote">Teklif Al</a>
</div>
```

- CSS: `position: fixed; bottom: 0; left: 0; right: 0; z-index: 90;` shown only ≤640px;
  ground `rgba(247,245,239,0.96)` + blur + top hairline + `--shadow-2` inverted;
  `padding: 10px var(--s-4) calc(10px + env(safe-area-inset-bottom))`.
- Layout: tel icon button 48×48 (outline) · simulator link (outline pill, flex 1) · Teklif Al
  (gold pill, flex 1). All hits ≥ 48px. Body gets `padding-bottom: 76px` at ≤640px so the
  footer legal links are never covered. Hide the bar when `#iletisim` is in viewport
  (small JS addition by Webmaster: IntersectionObserver toggling a `.hidden` class) so it
  never overlaps the form's submit button.
- *Reasoning:* audit 1.3 — majority-mobile traffic previously had no persistent path to either
  conversion point.

---

## 3. Responsive rules (section C)

Mobile-first. Breakpoints (max-width unless noted): **480 / 640 / 768 / 1024 / 1280**.

| Range | Rules |
|---|---|
| base (≤480) | 1-col everywhere; `--sect-x` ≈ 20px; h1 40–48px; hero stats 2-up gap 24px; sec/process/approach/footer 1-col; form rows 1-col; sticky CTA bar on; `.hud-chip.ul` full-width docked, `.br` hidden; rail visible; marquee 18px |
| ≤640 | `.nav-links`, `.nav-cta`, `.nav-logo-sub/divider` hidden; burger shown; sticky bar on; `.form` padding 32/24; footer-bottom stacks |
| 641–768 | burger still on (links hidden <768 — raise the old 640 cutoff: TR nav strings + lang toggle + CTA don't fit at 700px); sticky bar OFF ≥641 (nav-cta returns ≥768... see note) |
| ≤1024 | hero-sub 1-col; lm-grid 1-col; sec-grid 2-col; process 2-col (line hidden); calc-grid 1-col; about/contact 1-col; services desc hidden; footer 2-col |
| ≤1280 | container max 1140px; nav links gap 32px |
| >1280 | `.container` max-width 1280px (down from 1440 — measure ≤ ~75ch for body) |

Nav collapse note: move the `.nav-links { display:none }` cutoff from 640 to **768px**, and show
`.nav-cta` from **641px** up (it was hidden exactly where it mattered). Between 641–767:
logo + lang + gold CTA + burger.

TR/EN overflow rules (TR runs ~20–30% longer):
- All pills/buttons: `white-space: nowrap` ONLY on `.nav-cta` and lang buttons; everything else
  may wrap; buttons get `min-height` not fixed `height`.
- Verify at 360px width in TR: "Bu hesabı teklife dönüştürün" (calc CTA) wraps to 2 lines —
  allowed, keep `line-height 1.3`, padding holds ≥44px.
- `.process-d`, `.sec-desc` max-widths removed ≤640px (let them fill the column).
- QA must screenshot both languages at 360/768/1280 (existing QA gate).

---

## 4. Accessibility (section D)

### 4.1 Contrast pairs (computed, WCAG 2.1)

| Pair | Hex/Hex | Ratio | Verdict |
|---|---|---|---|
| Body text on page | `#11141F` on `#F7F5EF` | ≈ 16.6:1 | AAA |
| Secondary text | `#2B3142` on `#F7F5EF` | ≈ 12.4:1 | AAA |
| Muted text | `#555D6E` on `#F7F5EF` | ≈ 6.2:1 | AA (AAA large) |
| Muted on warm ground | `#555D6E` on `#EFEBE0` | ≈ 5.7:1 | AA |
| Accent TEXT on light | `#7E632B` on `#F7F5EF` | ≈ 5.1:1 | AA |
| CTA text on gold | `#11141F` on `#C9A961` | ≈ 8.4:1 | AAA |
| CTA hover | `#11141F` on `#A68A44` | ≈ 5.7:1 | AA |
| On-dark body | `#F5F3EC` on `#0C101D` | ≈ 17.0:1 | AAA |
| On-dark muted (α .68) | ≈`#ABA8A2` on `#0C101D` | ≈ 8.2:1 | AAA |
| Gold on dark | `#C9A961` on `#0C101D` | ≈ 8.4:1 | AAA |
| Positive on light | `#1F7A4D` on `#F7F5EF` | ≈ 5.0:1 | AA |
| Positive on dark | `#5BC489` on `#0C101D` | ≈ 8.8:1 | AAA |
| Error text | `#B8332A` on `#F7F5EF` | ≈ 5.6:1 | AA |

**Banned combinations:** `#C9A961` as text on any light surface (≈2.1:1); any on-dark text
below `rgba(245,243,236,0.62)`; `#A68A44` as normal-size text on light (3.4:1 — large
display text ≥24px only).

### 4.2 Focus states (global)

```css
:focus-visible {
  outline: 2px solid var(--accent-ink);
  outline-offset: 3px;
  border-radius: 4px;
}
.live-market :focus-visible, .calc-result :focus-visible {
  outline-color: var(--accent);
}
```

Never `outline: none` without a replacement. Range inputs get an explicit
`input[type=range]:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px rgba(126,99,43,0.35); }`
(+ `::-moz-range-thumb` twin).

### 4.3 Hit areas and semantics

- All interactive targets ≥ 44×44px: nav links (pad 12px vertical), lang buttons (pad to 44px
  square), burger 44px, mobile menu rows 48px, toggle buttons 44px, range thumbs 22px visual +
  full-track touch, checkbox row via padded label, sticky-bar items 48px.
- Headings hierarchy stays h1 → h2 (sections) → h3 (cards) — no skips.
- Add `aria-hidden="true"` to all decorative SVGs (hero canvas, arrows already partially done).
- `#lmChartMeta` live/temsili change: Webmaster adds `aria-live="polite"` to the element so the
  state change is announced (one attribute; no JS change).
- Keep: `role="alert"` on `#leadError`, `role="status" aria-live="polite"` on `#leadSuccess`,
  `aria-expanded/controls/label` on the burger, `role="group"` on lang toggle.
- Language toggle buttons get `aria-pressed` mirrored with `.active` (Webmaster: one-line JS
  addition in `setLanguage`; optional but recommended).

---

## 5. Asset specs (section E) — buildable with Pillow

Fonts for rendering: download Fraunces (`Fraunces[opsz,wght].ttf` or static 300/400) and
InterTight-Medium/SemiBold from Google Fonts GitHub releases into a temp dir; if unavailable
offline, fall back to DejaVuSerif/DejaVuSans and flag for re-render.

### 5.1 `og-image.jpg` — 1200×630, JPEG q≈90, sRGB

Light composition matching the new system:
1. Ground: flat `#F7F5EF`.
2. Subtle grid: vertical+horizontal 1px lines `#E2DDCF` every 64px, drawn only in the right
   40% of the canvas, faded (draw on overlay at 50% alpha).
3. Gold wash: radial ellipse centered (1050, 80), radius ~480px, `#C9A961` at 12% alpha
   (Pillow: paste a radially-faded overlay).
4. Brand mark at (96, 96): circle outline r=44 `#C9A961` width 3 + "V" chevron path
   (lines (74,72)→(96,124)→(118,72) in mark-local coords) `#11141F` width 7, round joints.
5. Wordmark: "Voltage" Fraunces 300, 124px, `#11141F`, baseline ~y=330, x=96; small caps
   "ENERJİ" Inter Tight SemiBold 28px, letterspacing ~8px, `#7E632B`, at x=100, y=360.
6. Subline: "Kurumsal ve Endüstriyel Elektrik Tedarikçisi" Inter Tight Medium 34px
   `#2B3142`, x=96, y=440.
7. Bottom strip: full-width 6px rule `#C9A961` at y=624; above it at x=96, y=576:
   "voltage.com.tr · EPDK Lisanslı Tedarikçi · Est. 2011" Inter Tight Medium 22px `#555D6E`.

### 5.2 `logo.png` — 512×512, PNG-24, transparent-safe

1. Ground: `#F7F5EF` full square (schema.org logo consumers prefer opaque; do NOT use
   transparency for the base file).
2. Centered mark: circle outline r=216 centered (256,256), `#C9A961`, stroke 8.
3. "V" chevron: (146,150)→(256,372)→(366,150), `#11141F`, stroke 26, round caps/joints.
4. Center dot: filled circle r=14 `#C9A961` at (256,256).
5. No wordmark (it's an avatar-scale mark). Margins: mark occupies ~84% of canvas.

Both must visually match the favicon after its §1.1 recolor (light ground, ink V, gold ring).

---

## 6. CSS architecture & performance (replaces both old layers)

Single `<style>` block, ordered: tokens → reset/base → utilities (`.container`,
`.section-label`, `.section-title`, buttons, `.reveal`) → components in DOM order → responsive
overrides grouped per breakpoint at the end → reduced-motion block last.

- Exactly ONE definition per component. The duplicated blocks (two `.mcp-rail`, two `.hud-chip`,
  two `.live-market` families, two `.sectors/.sec-*`, two `.process*`, two `.calc-*`, two
  `.cert*`, two `.hero-canvas`) are GONE.
- Keep the language-toggle rules at the very top, verbatim contract:

```css
html[lang="tr"] .en-only { display: none !important; }
html[lang="en"] .tr-only { display: none !important; }
html[lang="tr"] .marquee-track.en-only,
html[lang="en"] .marquee-track.tr-only { display: none !important; }
```

- No new external requests. Fonts trimmed per §1.2. No images added to the page (SVG inline only).
- Deletions beyond CSS: `.hero-visual` block, `.aurora` divs, animated hero SVG flow layer,
  `body::before` grain — markup removed by Webmaster (none have JS hooks; verify against §7
  before deleting anything else).
- Target: style block ≤ 1,000 lines; total `index.html` smaller than current 3,346 lines.

---

## 7. DO-NOT-BREAK inventory (section F) — 97 locked items

QA gate: every item below must exist and function after implementation. The JS block
(lines ~2792–3342) is NOT being rewritten; therefore every selector it queries must survive.

### 7.1 Element IDs queried by JS (30)

| # | ID | Consumer |
|---|---|---|
| 1 | `nav` | scroll → `.scrolled` class |
| 2 | `mobileMenuBtn` | menu toggle, `aria-expanded` |
| 3 | `mobileMenu` | `.open` class, link focus/close |
| 4 | `mcpTrack` | rail innerHTML injection |
| 5 | `hudPtf` | hourly PTF value |
| 6 | `hudPtfStatus` | canlı/temsili status line |
| 7 | `sparkLine` | HUD sparkline polyline `points` |
| 8 | `sparkArea` | HUD sparkline area `d` |
| 9 | `sparkDot` | HUD sparkline dot `cx/cy` |
| 10 | `lmNow` | chart current price |
| 11 | `lmChartMeta` | live/`fallback`-class meta label |
| 12 | `lmArea` | chart area path `d` |
| 13 | `lmLine` | chart line path `d` |
| 14 | `lmDot` | chart current-hour dot |
| 15 | `calcRangeMwh` | simulator input |
| 16 | `calcRangePrice` | simulator input |
| 17 | `calcMwh` | live MWh label |
| 18 | `calcPrice` | live price label |
| 19 | `calcTotal` | result total |
| 20 | `calcAnnual` | annual volume |
| 21 | `calcSavings` | savings % |
| 22 | `calcCta` | sim → form transfer + scroll + `track` |
| 23 | `simMwh` | hidden field (name `sim_mwh`) |
| 24 | `simPrice` | hidden field (name `sim_price`) |
| 25 | `simModel` | hidden field (name `sim_model`) |
| 26 | `leadForm` | submit handler, focusin → `form_start` |
| 27 | `leadSuccess` | success panel show |
| 28 | `leadError` | error box show |
| 29 | `f-tuketim` | CTA prefill of consumption band |
| 30 | `f-ad` | post-CTA focus target |

### 7.2 Anchor/section IDs (4): `hakkimizda`, `hizmetler`, `yaklasim`, `iletisim`
(nav, mobile menu, footer links, smooth-scroll). NEW additive: `simulator` on `.calc-section`.

### 7.3 Label-association IDs (8): `f-soyad`, `f-sirket`, `f-telefon`, `f-eposta`, `f-sektor`,
`f-mesaj`, `f-kvkk`, `f-website` (each has a `<label for>`; `f-website` is the honeypot pair).

### 7.4 Classes/selectors with JS or lang-toggle contracts (12)

1. `.lang-btn` + `data-lang` + `.active` toggling
2. `.lang-sep` (within toggle group markup)
3. `.reveal` / `.in` (IntersectionObserver)
4. `.calc-toggle button` + `data-model` + `.active`
5. `.form-submit` and its inner `<span data-tr data-en>` (busy-state relabeling)
6. `.live-market .delta` + `data-tr-suffix`/`data-en-suffix`
7. `.lm-chart-meta` + `.fallback` modifier (styled state, JS-toggled)
8. `.mobile-menu` `.open` modifier; `.nav` `.scrolled` modifier
9. Injected rail markup: `.cell`, `b`, `.up`, `.dn` (CSS must style them)
10. `.tr-only` / `.en-only` mechanism incl. `.marquee-track` exception rules
11. `a[href^="#"]` smooth scroll; `a[href^="tel:"]`/`a[href^="mailto:"]` tracking
12. `.hp-field` honeypot off-screen CSS (anti-spam; must remain visually hidden, aria-hidden)

### 7.5 Bilingual data attributes (8 attribute types)
`data-tr`, `data-en`, `data-tr-placeholder`, `data-en-placeholder`, `data-tr-strong`,
`data-en-strong`, `data-tr-suffix`, `data-en-suffix` — every element currently carrying them
keeps them with identical values (visual redesign does not touch strings).

### 7.6 Form field NAMES (13) — backend contract (`/api/lead` payload)
`ad`, `soyad`, `sirket`, `telefon`, `eposta`, `tuketim`, `sektor`, `mesaj`, `kvkk`,
`website` (honeypot), `sim_mwh`, `sim_price`, `sim_model`.

### 7.7 Select option VALUES (2 sets)
- `tuketim`: `0-100`, `100-500`, `500-1000`, `1000+` (CTA prefill logic depends on these)
- `sektor`: `uretim-sanayi`, `osb`, `hizmet-ticaret`, `veri-merkezi`, `diger`

### 7.8 SVG internal IDs (2 gradient pairs)
`sparkFill` (referenced by `#sparkArea` fill) and `lmFill` (referenced by `#lmArea` fill) —
keep or update both reference and definition together.

### 7.9 `track()` event surface (9) — analytics contract, must keep firing
`page_view`, `tel_click`, `mail_click`, `mobile_menu_open`, `sim_input`, `sim_result_cta`,
`form_start`, `form_submit_ok`, `form_submit_err`. (New sticky-bar links should ADD events,
e.g. `sticky_cta_click`, via Webmaster — never rename existing ones.)

### 7.10 Compliance-locked content (9) — verbatim survival, visible where noted

1. `<noscript>` banner (TR+EN text, must remain first element in `<body>`)
2. Simulator disclaimer `.calc-disclaimer` (TR+EN: "örnek senaryo… bağlayıcı teklif niteliği
   taşımaz…") — visible, adjacent to result
3. Simulator result qualifier `.calc-result-sub` ("Dengeleme, sapma, fatura hizmeti ve vergi
   hariç…") — visible
4. Portfolio-mix "Temsili" card label + footnote ("Temsili dağılım — … doğrulama sürecindedir.")
   + the `TODO(pricing)` HTML comment
5. JS fallback labels "TEMSİLİ VERİ / INDICATIVE DATA" + `#hudPtfStatus` strings (in script —
   untouched) and their `.fallback` styling state
6. KVKK consent label text + `/kvkk` link + `required` checkbox
7. Footer MUST-FILL commented block (EPDK license / MERSİS / sicil placeholders) — stays as
   comment until owner supplies values
8. Legal links `/kvkk`, `/cerez-politikasi`, `/kullanim-kosullari` (footer + cert pill)
9. About-stats "no unverified quantitative claims" HTML comment + current non-numeric stat values

**Count: 30 + 4 + 8 + 12 + 8 + 13 + 2 + 2 + 9 + 9 = 97 locked items.**

---

## 8. Acceptance checklist (QA gate before publish)

1. All 97 inventory items present; JS console clean on load, language toggle, simulator use,
   form submit (success + error paths), mobile menu.
2. TR and EN screenshots at 360 / 768 / 1280 — no overflow, no truncation, hero ≤ 5-second scan.
3. Lighthouse: Performance ≥ 90 mobile, A11y ≥ 95; CSS block ≤ 1,000 lines; fonts = 2 families,
   6 weight files max.
4. Contrast spot-checks per §4.1 table (axe or manual); focus visible on every interactive
   element by keyboard walk.
5. PTF proxy blocked test: TEMSİLİ VERİ state renders distinctly (no gold, no pulse) in both
   languages.
6. `prefers-reduced-motion: reduce`: zero animation, marquee static, reveals visible.
7. Sticky mobile CTA: visible ≤640px, hidden while `#iletisim` in view, safe-area respected,
   footer legal links reachable.
8. Simulator → CTA → form: prefill of `sim_*` hidden fields and `f-tuketim` band verified;
   `track` events observed in network log.

---

## 9. OPTIONAL copy notes (NOT part of this spec's scope — route to Marketing + Legal)

- Hero primary CTA label could read "Tasarrufunuzu Hesaplayın / Estimate Your Savings" now that
  it targets `#simulator` (today it reads "Teklif Talep Edin / Request a Proposal", which better
  fits the secondary). If adopted, swap the two labels rather than writing new copy.
- Form subtitle could state the response promise ("1 iş günü içinde dönüş") to repeat the trust
  cue at the capture moment — string already exists in `.contact-info-text`.
- The `.quote` section and `.marquee` are candidates for removal in a future content pass
  (length ÷ value); not exercised here.
