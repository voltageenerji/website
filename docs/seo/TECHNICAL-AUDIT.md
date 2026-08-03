# TEKNİK SEO DENETİMİ — voltage.com.tr (Kuruluş Denetimi)

- **Hazırlayan:** Technical SEO Agent (Seviye 4, SEO birimi)
- **Rapor edilen:** SEO Director → Orchestrator Agent
- **Tarih:** 2026-07-27
- **Kapsam:** Repo üzerindeki gerçek artefaktlar — `index.html`, `_headers`,
  `_redirects`, `robots.txt`, `sitemap.xml`, yasal sayfalar
  (`kvkk.html`, `cerez-politikasi.html`, `kullanim-kosullari.html`),
  Pages Functions (`functions/api/lead.js`, `functions/api/event.js`)
- **Yöntem:** Statik repo analizi. Tarayıcı/lab ölçümü ve GSC saha verisi bu
  denetimde yok; doğrulama görevleri §8'de seo-search-console'a yönlendirildi.
- **Durum:** Site sahibin emriyle DONDURULMUŞ. Bu belge yalnızca denetim ve
  spesifikasyondur; tüm düzeltmeler **Webmaster'a, sahip onayıyla** yönlendirilir.
  Hiçbir spec, REDESIGN-SPEC-2026-06.md §7'deki 97 kilitli sözleşmeyi ihlal etmez.

---

## 1. Yönetici özeti

Site teknik olarak sağlam bir zeminde: içerik sunucu tarafında HTML'de mevcut
(JS'siz de okunabilir), canonical'lar stabil, ana sayfa gzip ~32 KB, çerezsiz
mimari ve temiz URL'ler yerinde. Tarihsel `?lang=en` self-canonical kusuru
**giderilmiş durumda** — `?lang=en` artık köke canonical veriyor.

Ancak **1 kritik kusur** var: dil başlatma kodu `navigator.language`'a bakarak
otomatik İngilizce'ye geçiyor. Googlebot'un render servisi (WRS) en-US locale
ile çalıştığı için, TR ana sayfanın **render edilen hâli büyük olasılıkla
İngilizce'dir** — İngilizce `<title>`, İngilizce meta description, gizlenmiş
Türkçe içerik. Ana ticari sayfa (TR, B2B elektrik tedariki) yanlış dilde
indekslenme riski taşıyor. Buna bağlı **1 yüksek** bulgu: `hreflang="en"`,
canonical'ı köke işaret eden `?lang=en` URL'sine veriliyor (hreflang →
non-canonical çelişkisi). Kalanlar orta/düşük hijyen maddeleri.

**Bulgu sayıları: 1 Kritik · 1 Yüksek · 5 Orta · 3 Düşük (toplam 10).**

---

## 2. Bulgu özeti tablosu

| # | Önem | Bulgu | Dosya |
|---|------|-------|-------|
| K1 | KRİTİK | `navigator.language` ile otomatik EN — Googlebot TR ana sayfayı İngilizce render ediyor | `index.html:1846` |
| Y1 | YÜKSEK | `hreflang="en"` non-canonical `?lang=en`'e işaret ediyor (head + sitemap) | `index.html:20`, `sitemap.xml:7` |
| O1 | ORTA | `/api/*` indekslenemezlik güvencesi eksik (X-Robots-Tag yok, robots Disallow yok) | `_headers:20-21`, `robots.txt` |
| O2 | ORTA | Cache-Control kuralları temiz URL'leri (`/kvkk` vb.) kapsamıyor | `_headers:12-17` |
| O3 | ORTA | Google Fonts harici ve render-blocking; latin-ext dâhil self-host edilmeli | `index.html:130-132`, `_headers:9` |
| O4 | ORTA | Favicon yalnızca data-URI — Google SERP favicon'u çekemez | `index.html:44-45` |
| O5 | ORTA | Sitemap `lastmod` bayat (2026-06-10; redesign 2026-07'de yayında) | `sitemap.xml:9` |
| D1 | DÜŞÜK | Ölü meta etiketleri: `keywords`, `revisit-after`, `language` | `index.html:11,14,15` |
| D2 | DÜŞÜK | JSON-LD kozmetikleri: yorum "LocalBusiness" diyor ama blokta yok; `sameAs` boş | `index.html:51,88` |
| D3 | DÜŞÜK | `_redirects` doğrulama notları: alan adları Pages projesine bağlı mı; `/index.html` kuralı gereksiz | `_redirects:5-15` |

---

## 3. Detaylı bulgular

### K1 — KRİTİK: Otomatik dil algılama Googlebot'a İngilizce sayfa render ettiriyor

**URL:** `https://voltage.com.tr/` (ana ticari sayfa)

**Kanıt:** `index.html:1835-1852` (`initLanguage`):

```js
} else if (navigator.language && !navigator.language.toLowerCase().startsWith('tr')) {
  lang = 'en';   // index.html:1846-1847
}
```

`setLanguage('en')` çağrısı (`index.html:1330-1343`) şunları yapar:
`document.documentElement.lang = 'en'` → CSS sözleşmesi
`html[lang="en"] .tr-only { display:none }` (`index.html:146`) tüm Türkçe
metni gizler; `document.title`, `meta[name=description]`, `og:title`,
`og:description`, `og:locale` İngilizce değerlerle değiştirilir
(`META_CONTENT.en`, `index.html:1324-1327`); 162 adet `data-tr/data-en`
düğümü İngilizce metinle yeniden yazılır.

**Gözlenen davranış (statik çıkarım):** Googlebot WRS `navigator.language =
"en-US"` ve boş `localStorage` ile render eder; `?lang` parametresi yoktur →
koşul tetiklenir → `/` URL'sinin **render edilmiş DOM'u İngilizce** olur.
Google, indeksleme için render edilmiş DOM'daki title/description/içeriği
kullanır.

**İhlal edilen standart:** Google'ın locale-adaptive sayfa rehberi — Googlebot
çoğunlukla ABD kaynaklı/en-US sinyalleriyle tarar; tarayıcı diline göre
içerik değiştiren sayfalar yalnızca tek (yanlış) varyantla indekslenir.
Ayrıca canonical/hreflang `/` URL'sini `hreflang="tr"` ilan ederken render
çıktısının EN olması tutarsızlıktır (dürüst-veri hizası da bozulur:
beyan edilen dil ≠ render edilen dil).

**Etki:** İndeks/gelir — en yüksek. Birincil TR ticari sayfa ("elektrik
tedarikçisi, kurumsal elektrik" sorguları) İngilizce başlıkla indekslenirse
TR SERP görünürlüğü ve CTR doğrudan zarar görür.

**Düzeltme spec'i (Webmaster'a, sahip onayıyla):**
`index.html:1846-1848`'deki `else if` dalını tamamen kaldır:

```js
// KALDIR:
      } else if (navigator.language && !navigator.language.toLowerCase().startsWith('tr')) {
        lang = 'en';
      }
```

Sonuç davranış: varsayılan `tr`; EN yalnızca (a) `?lang=en` parametresi veya
(b) kullanıcının kayıtlı tercihi (`localStorage 'voltage-lang'`) ya da
(c) `.lang-btn` tıklamasıyla açılır. `.lang-btn`/`data-lang`/`html[lang]`
sözleşmelerine (REDESIGN-SPEC §7.4/1) dokunulmaz; kaldırılan tek şey
kilitli olmayan tarayıcı-dili sezgisidir. Kalıcı çözüm plan 3.5'teki
prerendered `/en/`dir (bkz. §6.6) — yabancı ziyaretçi otomatiği o zaman
sunucu tarafında, doğru URL'de yaşar.

**QA doğrulaması:** Değişiklik sonrası GSC URL Inspection → `/` → "View
crawled page" ekran görüntüsünde `<title>` Türkçe olmalı; `html lang="tr"`.

---

### Y1 — YÜKSEK: `hreflang="en"` non-canonical bir URL'e işaret ediyor

**URL'ler:** `https://voltage.com.tr/` ve `https://voltage.com.tr/?lang=en`

**Kanıt:**
- `index.html:18-21`:
  ```html
  <link rel="canonical" href="https://voltage.com.tr/">
  <link rel="alternate" hreflang="tr" href="https://voltage.com.tr/">
  <link rel="alternate" hreflang="en" href="https://voltage.com.tr/?lang=en">
  <link rel="alternate" hreflang="x-default" href="https://voltage.com.tr/">
  ```
- `sitemap.xml:7`: aynı `?lang=en` hreflang alternatifi.
- `?lang=en` ayrı bir doküman değildir: aynı statik HTML'i sunar ve
  canonical'ı `https://voltage.com.tr/`dir (statik etiket; JS canonical'ı
  değiştirmiyor — bu kısmı doğru).

**Gözlenen durum:** Tarihsel kusurun tersi geçerli — `?lang=en` artık
self-canonical DEĞİL (iyi), ama bu yüzden `hreflang="en"` hedefi Google
tarafından canonical dışı sayılıp hreflang kümesi yok sayılır. Pratikte EN
varyantın indekslenebilir bir URL'i yok; hreflang bloğu ölü sinyal üretiyor.

**İhlal edilen standart:** Google hreflang rehberi — hreflang hedefleri
kendine canonical, indekslenebilir URL'ler olmalı; küme karşılıklı olmalı.

**Etki:** Yüksek (indeks tutarlılığı). Yanlış sinyal seti; ayrıca K1 ile
birleşince "TR ilan edilen, EN render edilen" tablo derinleşiyor.

**Düzeltme spec'i (Webmaster'a, sahip onayıyla)** — 180 günlük plan 3.5'in
kendi ifadesiyle uyumlu ("prerendered `/en/` with self-canonical **or drop
hreflang until then**"):

1. `index.html:19-21`'deki üç `<link rel="alternate" hreflang=...>` satırını
   sil (yalnız `en`'i silmek yetmez; tek başına `tr`+`x-default` çifti
   anlamsız kalır). `index.html:18` canonical satırı AYNEN kalır.
2. `sitemap.xml:6-8`'deki üç `xhtml:link` satırını ve `sitemap.xml:3`'teki
   `xmlns:xhtml` bildirimini sil.
3. `?lang=en` davranışına dokunma: 200 + canonical→`/` mevcut hâliyle doğru
   ara çözümdür (birleştirme, kayıp yok). `noindex` EKLEME — canonical
   konsolidasyonu yeterli ve daha güvenli.
4. Hedef durum `/en/` yayına girdiğinde hreflang §6.6'daki spec ile geri gelir.

---

### O1 — ORTA: `/api/*` indekslenemezliği sertleştirilmemiş

**URL'ler:** `/api/lead`, `/api/event`

**Kanıt:** `functions/api/lead.js:27` ve `functions/api/event.js:31` yalnızca
`onRequestPost` export ediyor → GET istekleri Pages tarafından 405 ile döner
(indekslenmez; gerçek risk düşük). Ancak `_headers:20-21` bloğunda
`X-Robots-Tag` yok ve `robots.txt`'te `Disallow: /api/` yok. Birim spec'i
"/api/* non-indexable olmalı" der; şu an bu, yalnızca "GET yok" varsayımına
yaslanıyor. İleride bir `onRequestGet` eklenirse (ör. sağlık ucu) sessizce
indekslenebilir hâle gelir.

**İhlal edilen standart:** Savunma katmanlı indeks hijyeni; birim standardı.

**Düzeltme spec'i (Webmaster'a, sahip onayıyla):**

`_headers` — mevcut `/api/*` bloğuna tek satır ekle:

```
/api/*
  Cache-Control: no-store
  X-Robots-Tag: noindex
```

`robots.txt` — tam hedef içerik:

```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://voltage.com.tr/sitemap.xml
```

(Not: `Disallow` + `X-Robots-Tag` birlikte güvenlidir; bu URL'lere hiçbir
dış bağlantı sinyali beklenmediği için "robots engeli noindex'i görünmez
kılar" çelişkisi pratik risk taşımaz.)

---

### O2 — ORTA: Cache-Control kuralları temiz URL'lerle eşleşmiyor

**URL'ler:** `/kvkk`, `/cerez-politikasi`, `/kullanim-kosullari`

**Kanıt:** `_headers:12-13` kuralı `/*.html` desenli; sitemap ve tüm iç
bağlantılar (`index.html:1266-1268`, canonical'lar `kvkk.html:12` vb.)
uzantısız URL'leri kullanıyor. Cloudflare Pages `_headers` eşleşmesi istek
yoluna göre yapılır → `/kvkk` isteği `/*.html` ile eşleşmez; bu üç sayfa
tanımsız (varsayılan) cache davranışıyla döner. `_headers:16-17`'deki `/`
istisnası bu boşluğun kök için zaten fark edildiğini gösteriyor.

**İhlal edilen standart:** HTTP önbellek hijyeni — HTML'de kısa TTL +
revalidate site politikası (`_headers:11`) tutarlı uygulanmalı.

**Düzeltme spec'i (Webmaster'a, sahip onayıyla):** `_headers`'a ekle:

```
/kvkk
  Cache-Control: public, max-age=300, must-revalidate

/cerez-politikasi
  Cache-Control: public, max-age=300, must-revalidate

/kullanim-kosullari
  Cache-Control: public, max-age=300, must-revalidate
```

(İçerik dalgasıyla birlikte §6.7'deki `/rehber*` kuralları da eklenir.)

---

### O3 — ORTA: Google Fonts render-blocking harici bağımlılık

**URL:** `/`

**Kanıt:** `index.html:130-132` — `fonts.googleapis.com` CSS'i render-blocking
`<link rel="stylesheet">`; iki preconnect; `_headers:9` CSP'de
`fonts.googleapis.com` (style-src) + `fonts.gstatic.com` (font-src)
istisnaları. `display=swap` mevcut (iyi). LCP elemanı büyük olasılıkla hero
başlık metni (`index.html:624`) → font zinciri FCP/LCP kritik yolunda: DNS +
TLS + CSS + iki ayrı origin'den WOFF2.

**İhlal edilen standart:** CWV kritik-yol pratiği (harici render-blocking
kaynak minimizasyonu); ayrıca CSP yüzeyinin gereksiz genişliği.

**Düzeltme spec'i (Webmaster'a, sahip onayıyla):**

1. Fraunces (300/400 + italic 400, `opsz` aralığıyla) ve Inter Tight
   (400/500/600) WOFF2 dosyalarını **latin + latin-ext** kapsamıyla indir
   (latin-ext ZORUNLU: ğ, ı, İ, ş, Ş karakterleri; eksikse Türkçe başlıklar
   fallback fonta düşer). `/assets/fonts/` altına koy — `_headers:24-25`
   immutable kuralı zaten hazır.
2. `index.html:130-132`'yi sil; `<style>` bloğunun başına `@font-face`
   tanımları ekle, hepsinde `font-display: swap`.
3. CSP'yi daralt (`_headers:9`): `style-src 'self' 'unsafe-inline'`;
   `font-src 'self'`.
4. QA: TR ve EN görünümde başlık/metin fontlarının değiştiğini ve Türkçe
   karakterlerin doğru glifle çıktığını görsel regresyonla doğrula.

---

### O4 — ORTA: Google'ın çekebileceği favicon dosyası yok

**URL:** `/favicon.ico` (mevcut değil), `index.html:44-45`

**Kanıt:** Favicon yalnızca `data:image/svg+xml,...` URI olarak tanımlı.
Google SERP favicon'u için Googlebot-Image'ın **çekebileceği gerçek bir URL**
gerekir; data-URI desteklenmez. Repo'da `favicon.ico`/`favicon.svg` yok →
mobil SERP'te jenerik dünya ikonu.

**İhlal edilen standart:** Google favicon yönergeleri (fetch edilebilir,
kararlı URL; ≥48×48 çoklu ölçek).

**Düzeltme spec'i (Webmaster'a, sahip onayıyla):**

1. `index.html:44`'teki SVG içeriğini `favicon.svg` adlı köke dosya olarak
   kaydet; ayrıca 48×48 (veya 32/48 çoklu) `favicon.ico` üret ve köke koy.
2. Head'de değişim: `index.html:44` satırını
   `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` yap; altına
   `<link rel="icon" sizes="48x48" href="/favicon.ico">` ekle. Yasal
   sayfalardaki data-URI ikonlar aynı şekilde `/favicon.svg`'ye çevrilebilir
   (düşük öncelik).
3. Tarayıcılar `/favicon.ico`'yu kendiliğinden de ister — dosyanın varlığı
   404 gürültüsünü de bitirir.

---

### O5 — ORTA: Sitemap `lastmod` değerleri bayat

**Kanıt:** `sitemap.xml:9` — `/` için `lastmod` `2026-06-10`; oysa
`index.html` redesign sonrası 2026-07'de güncellendi (repo mtime 27 Tem).
Yanıltıcı `lastmod`, Google'ın sitemap tarihlerine güvenini düşürür.

**İhlal edilen standart:** Sitemaps protokolü — `lastmod` gerçek son içerik
değişimini yansıtmalı (Google, tutarsız lastmod'ları yok saymaya başlar).

**Düzeltme spec'i (Webmaster'a, sahip onayıyla):** `/` girdisinin
`lastmod`'unu son gerçek içerik değişikliği tarihine (2026-07-27) çek.
**Süreç kuralı:** İndekslenebilir bir sayfayı değiştiren her commit, aynı
commit'te o sayfanın sitemap `lastmod`'unu günceller (Webmaster kontrol
listesi maddesi; QA regresyon kalemi). `changefreq`/`priority` alanlarına
dokunma (Google zaten yok sayıyor; kaldırmak da churn olur).

---

### D1 — DÜŞÜK: Ölü/itibarsız meta etiketleri

**Kanıt:** `index.html:11` `meta keywords`, `index.html:14` `meta language`,
`index.html:15` `meta revisit-after`. Üçü de hiçbir arama motorunca
kullanılmıyor; `keywords` yalnızca rakibe sorgu listesi sızdırır.
**Düzeltme spec'i:** Üç satırı sil. Başka değişiklik yok.

---

### D2 — DÜŞÜK: JSON-LD kozmetik tutarsızlıkları

**Kanıt:** `index.html:51` yorumu "Organization + Website + LocalBusiness"
der; blokta (`index.html:52-128`) LocalBusiness yok — yorum yanlış (kod
değil). `index.html:88` `"sameAs": []` boş. Şemanın kendisi görünür içerikle
uyumlu (dürüstlük kuralı ihlali YOK; adres/telefon `index.html:1076` ve
kvkk.html:40-41 ile tutarlı).
**Düzeltme spec'i:** Yorumu "Organization + WebSite + Service" olarak düzelt.
`sameAs` doldurumu teknik değil varlık (entity) işi — seo-schema /
seo-brand-entity'ye not: LinkedIn vb. resmî profiller açıldığında eklenmeli.

---

### D3 — DÜŞÜK: `_redirects` doğrulama ve fazlalık notları

**Kanıt:** `_redirects:5-12` — `www.voltage.com.tr` ve dört `voltan.*`
kuralı yalnızca bu alan adları **aynı Pages projesine custom domain olarak
bağlıysa** çalışır; repo'dan doğrulanamaz. `_redirects:15` `/index.html → /`
kuralı, Pages'in yerleşik 308 normalizasyonuyla çakışır (zararsız fazlalık;
Pages `.html` uzantılarını zaten 308 ile temizler — `/kvkk.html → /kvkk`
otomatiktir, kural gerekmez ve eklenmemiş olması doğru).
**İşlem:** Kod değişikliği YOK (istikrar önceliklidir). Doğrulama görevi
§8'e eklendi: her `voltan.*` host'unun canlıda 301 tek-adım voltage.com.tr'ye
döndüğü curl ile teyit edilmeli; dönmeyen alan adı Cloudflare'de projeye
bağlanmalı (Webmaster).

---

## 4. Güçlü yönler (koru — churn yok)

- **İçerik sunucu tarafında.** Tüm bölüm metinleri (TR ve EN) ilk HTML'de
  (`.tr-only`/`.en-only` span'ları + `data-tr/data-en`); JS kapalıyken bile
  sayfa okunur, `<noscript>` dürüst bir bilgilendirme verir
  (`index.html:531-536`). Tek `<h1>` (`index.html:624`), düzgün `<h2>`
  hiyerarşisi.
- **Canonical stabilitesi.** Kök ve üç yasal sayfa mutlak, uzantısız,
  self-canonical (`kvkk.html:12` vb.); JS canonical'a dokunmuyor. Tarihsel
  `?lang=en` self-canonical kusuru kapanmış.
- **Ağırlık.** 124,8 KB ham / 32,3 KB gzip HTML; ~32,7 KB inline CSS,
  ~23 KB inline JS; görsel yükü minimal (SVG'ler inline). LCP adayı metin.
- **Güvenlik başlıkları** eksiksiz (`_headers:4-9`); CSP render'ı engellemiyor
  (Googlebot WRS `'unsafe-inline'` script'leri ve worker `connect-src`'i
  ile sayfayı tam render edebilir).
- **Dürüst veri.** PTF canlı verisi düşerse "Temsili veri" etiketi
  (`index.html:1398-1400`); lead API kalıcılık yoksa başarı iddia etmiyor
  (`functions/api/lead.js:124-127`). Yapısal veri görünür içerikle uyumlu.
- **robots.txt + sitemap** sözdizimsel olarak doğru, sitemap robots'ta ilan
  edilmiş.

---

## 5. URL envanteri ve indekslenebilirlik

| URL | Beklenen durum | İndekslenebilir mi | Not |
|---|---|---|---|
| `/` | 200 | Evet (hedef: TR) | K1 çözülünceye dek render dili riskli |
| `/?lang=en` | 200 | Hayır (canonical → `/`) | Amaçlanan ara durum; Y1 sonrası hreflang'dan da çıkar |
| `/kvkk` | 200 | Evet | Self-canonical doğru |
| `/cerez-politikasi` | 200 | Evet | Self-canonical doğru |
| `/kullanim-kosullari` | 200 | Evet | Self-canonical doğru |
| `/kvkk.html` (ve diğer `.html`) | 308 → uzantısız | — | Pages otomatik normalizasyonu |
| `/index.html` | 301 → `/` | — | `_redirects:15` |
| `/api/lead`, `/api/event` | GET 405 / POST 200-204 | Hayır (O1 ile garantiye alınır) | POST-only Functions |
| `/logo.png`, `/og-image.jpg` | 200 | Görsel | JSON-LD/OG referansları tutarlı |
| `www.voltage.com.tr/*`, `voltan.*/*` | 301 → `voltage.com.tr/:splat` | — | D3: canlıda doğrulanacak |

---

## 6. ÖN-UÇUŞ SPEC'İ — İlk 6 içerik sayfası dalgası

Uygulama öncesi bağlayıcı teknik çerçeve (migration-safety standardı gereği
mimari değişiklik yayına çıkmadan bu spec'e uyum QA'da doğrulanır).

### 6.1 URL deseni: `/rehber/...` (karar: `/blog/...` DEĞİL)

- **Desen:** `https://voltage.com.tr/rehber/<slug>` — uzantısız, sondaki
  eğik çizgisiz; mevcut `/kvkk` desenzimiyle tutarlı.
- **Gerekçe:** Hedef sorgular B2B bilgi/karar amaçlı ("ikili anlaşma nedir",
  "serbest tüketici limiti") → kalıcı rehber içeriği. "Blog" tarihli/haber
  sinyali verir, güncelliğini yitirmiş algısı üretir; "rehber" Türkçe-native
  ve niyetle hizalı. Tarih URL'e girmez (evergreen; içerik güncellenir,
  URL sabit kalır — istikrar sıralama varlığıdır).
- **Slug kuralları:** küçük harf, ASCII'ye çevrilmiş Türkçe karakterler
  (ğ→g, ş→s, ı→i, ç→c, ö→o, ü→u), tire ayraç, ≤ 60 karakter, durak
  kelimesiz. Örnek: `/rehber/ikili-anlasma-nedir`.
- **Dosya yerleşimi:** hub `rehber.html` (URL `/rehber`), makaleler
  `rehber/<slug>.html` (URL `/rehber/<slug>`). **QA ön koşulu:** preview
  deploy'da `rehber.html` dosyası ile `rehber/` dizininin birlikte
  çakışmasız sunulduğu (308 döngüsü yok) doğrulanır.

### 6.2 Sayfa başı (head) şablonu — her makale için zorunlu

```html
<html lang="tr">
<title><Konu — ≤60 karakter> | Voltage Enerji</title>
<meta name="description" content="<140–160 karakter, sorgu niyetine cevap>">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="https://voltage.com.tr/rehber/<slug>">
<!-- hreflang YOK — /en/ aynası yayınlanana kadar (bkz. 6.6) -->
<meta property="og:type" content="article">
<meta property="og:url" content="https://voltage.com.tr/rehber/<slug>">
<meta property="og:title" / og:description / og:image (site geneli og-image.jpg kabul)>
```

Hub `/rehber`: `og:type` `website`, self-canonical
`https://voltage.com.tr/rehber`, `index, follow`.

### 6.3 Yapısal veri — makale başına

`BreadcrumbList` + `Article` (tek `<script type="application/ld+json">`):

```json
{ "@context": "https://schema.org", "@graph": [
  { "@type": "BreadcrumbList", "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://voltage.com.tr/" },
    { "@type": "ListItem", "position": 2, "name": "Rehber", "item": "https://voltage.com.tr/rehber" },
    { "@type": "ListItem", "position": 3, "name": "<Makale başlığı>" } ] },
  { "@type": "Article",
    "headline": "<görünür h1 ile birebir>",
    "inLanguage": "tr-TR",
    "datePublished": "<gerçek yayın tarihi>",
    "dateModified": "<gerçek son değişiklik>",
    "author": { "@id": "https://voltage.com.tr/#organization" },
    "publisher": { "@id": "https://voltage.com.tr/#organization" },
    "mainEntityOfPage": "https://voltage.com.tr/rehber/<slug>" } ] }
```

Dürüstlük kuralı: `datePublished/dateModified` uydurulamaz; görünür
"Son güncelleme" satırıyla (yasal sayfa deseni, `kvkk.html:36`) eşleşir.
Organization `@id`'si yalnız ana sayfada tanımlı olduğundan makale
sayfalarında `@id` referansı yeterlidir (Google graf birleştirmesi URL
üzerinden çalışır); istenirse minimal `Organization {@id, name, url}`
tekrarı eklenebilir.

### 6.4 Sitemap kuralı

- Her yeni sayfa, **yayın commit'inin kendisinde** `sitemap.xml`'e eklenir:
  `<loc>` mutlak uzantısız URL, `<lastmod>` yayın tarihi. Hub `/rehber` da
  eklenir. hreflang `xhtml:link` bloğu EKLENMEZ (6.6'ya kadar).
- İçerik güncellenen her sayfada `lastmod` aynı commit'te tazelenir (O5
  süreç kuralıyla aynı).
- 6 sayfa + hub sonrası sitemap ~11 URL: tek dosya yeterli, index gerekmez.

### 6.5 İç bağlantı giriş noktaları

1. **Ana sayfa footer** (`index.html:1205` bloğu): mevcut bağlantı sütununa
   `<a href="/rehber" data-tr="Rehber" data-en="Guides">Rehber</a>` eklenir
   (data-tr/data-en deseni korunur; kilitli sözleşmelere dokunmaz).
2. **Hub `/rehber`:** 6 makalenin tamamına açıklayıcı çapa metniyle bağlantı
   (çapa = hedef sorgu ifadesi, "buraya tıklayın" yasak).
3. **Makale içi:** görünür breadcrumb (Ana Sayfa › Rehber › başlık — JSON-LD
   ile birebir), gövdede 2–3 bağlamsal çapraz bağlantı (ilgili rehberler),
   sayfa sonunda tek CTA → `/#teklif` (form çapası; mutlak değil kök-göreli).
4. **Ana sayfa gövdesi:** ilgili bölümlerden (ör. çözüm kartları) en fazla
   2–3 bağlamsal rehber bağlantısı — nav'a madde eklemek zorunlu değil;
   seo-internal-linking ile koordinasyon SEO Director üzerinden.

### 6.6 EN mimarisi hedef durumu (plan 3.5 — bu dalgadan SONRA)

Sıra kesin: önce prerendered `/en/` ana sayfa, sonra içerik aynaları.

- `/en/` statik prerender (dosya `en/index.html`), `html lang="en"`,
  self-canonical `https://voltage.com.tr/en/`.
- hreflang o zaman iki yönlü döner: `/` üzerinde `tr→/`, `en→/en/`,
  `x-default→/`; `/en/` üzerinde aynı küme. Sitemap'te karşılıklı
  `xhtml:link` blokları geri gelir.
- `?lang=en` davranışı: 200 + canonical→`/` olarak kalabilir; tercihen
  `/_redirects`'e `/?lang=en → /en/ 301` KONMAZ (query-string kuralları
  Pages'te güvenilmez; JS ile `location.replace('/en/')` de churn —
  gerek yok, canonical yeterli).
- İçerik aynaları: `/en/guides/<slug>` (EN slug'lar İngilizce), her çift
  karşılıklı hreflang; birebir çevrilmemiş sayfa çifti hreflang'a girmez.

### 6.7 `_headers` eklemeleri (dalga ile aynı commit)

```
/rehber
  Cache-Control: public, max-age=300, must-revalidate

/rehber/*
  Cache-Control: public, max-age=300, must-revalidate
```

CSP `/*` bloğundan miras alınır; içerik sayfaları harici kaynak eklemediği
sürece CSP değişikliği gerekmez (kural: yeni harici origin = önce bu birimin
ön-uçuş incelemesi).

### 6.8 Sayfa ağırlık bütçesi (içerik sayfaları)

- HTML ≤ 60 KB ham / ≤ 20 KB gzip; ana sayfanın 32 KB'lık CSS'i
  **kopyalanmaz** — yasal sayfa deseni (~2 KB sayfaya özel inline CSS,
  `kvkk.html:14-30`) temel alınır. 6+ sayfada ortak stil ihtiyacı doğarsa
  paylaşılan `/assets/site.css` (immutable, `_headers:24-25` hazır) tek
  seferde çıkarılır — bu karar dalga uygulamasında verilir, şimdiden değil.
- Görseller: sayfa başına ≤ 120 KB toplam, `loading="lazy"`,
  `width/height` atribütleri zorunlu (CLS), tercihen AVIF/WebP.
- Font: O3 self-host çözümüyle aynı dosyalar; yeni ağırlık/aile eklenmez.
- JS: içerik sayfalarında hedef 0 KB (dil toggle'ı yok — sayfalar TR;
  EN aynası ayrı statik sayfa olacak).

---

## 7. CWV bütçesi — mevcut ve büyüme

| Metrik/kaynak | Mevcut (statik ölçüm) | Bütçe |
|---|---|---|
| Ana sayfa HTML | 124,8 KB ham / 32,3 KB gzip | ≤ 150 KB / ≤ 40 KB gzip |
| Inline CSS (ana sayfa) | ~32,7 KB | ≤ 36 KB |
| Inline JS (ana sayfa) | ~23 KB | ≤ 30 KB |
| Harici origin sayısı (render yolu) | 2 (Google Fonts) | 0 (O3 sonrası) |
| İçerik sayfası HTML | — | ≤ 60 KB ham / ≤ 20 KB gzip |
| Yeni harici script | 0 | 0 (istisna: CF Web Analytics, CSP notu `index.html:134-138` uyarınca) |

Lab/saha doğrulaması (bu denetimde yapılamadı — statik analiz): GSC CWV +
CrUX raporu seo-search-console'dan; marquee ve PTF grafik konteynerlerinin
sabit yükseklikle CLS üretmediği QA lab ölçümüyle teyit edilmeli.

---

## 8. Doğrulama görevleri (seo-search-console / Webmaster'a)

1. **K1 kanıtı ve düzeltme teyidi:** GSC URL Inspection → `/` → crawled
   page render'ında dil (önce: EN bekleniyor; düzeltme sonrası: TR).
2. `?lang=en` GSC'de "Duplicate, Google chose canonical" benzeri durumda mı
   — beklenen ve doğru; "Indexed" görünüyorsa Y1 önceliği yükselir.
3. `voltan.com.tr`, `www.voltan.com.tr`, `voltan.com`, `www.voltan.com`,
   `www.voltage.com.tr` canlıda tek adımlı 301 → `voltage.com.tr` dönüyor mu
   (curl -sI ile; zincir varsa Webmaster'a alan adı bağlama işi).
4. O4 sonrası SERP favicon'unun göründüğünün teyidi.
5. CWV saha verisi çekimi ve §7 bütçelerine karşı ilk kıyas raporu.

---

*Bu belge denetim ve spesifikasyondur; repo'daki hiçbir üretim dosyası
değiştirilmemiştir. Tüm düzeltmeler sahip onayı sonrası Webmaster
tarafından uygulanır, QA tarafından doğrulanır.*
