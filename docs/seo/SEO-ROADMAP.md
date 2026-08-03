# SEO YOL HARİTASI — voltage.com.tr (Kurucu Sürüm v1.0)

**Hazırlayan:** seo-strategy (Seviye 4, SEO birimi)
**Rapor hattı:** SEO Direktörü → Orchestrator Agent
**Tarih:** 2026-07-27
**Girdiler:** KEYWORD-MAP.md · COMPETITOR-BENCHMARK.md · TECHNICAL-AUDIT.md ·
ENTITY-PLAYBOOK.md (tümü 2026-07-27) · AUDIT-2026-06-10-180-DAY-PLAN.md
(madde 2.3, 3.5, duran yasaklar)
**Revizyon kadansı:** Çeyreklik + tarife/limit olayı tetiklemeli (EPDK Aralık
kararları, çeyrek başı tarife güncellemeleri). Bir sonraki planlı revizyon:
2026-10-27 veya büyük piyasa/rakip hamlesi.

---

## 0. Yönetici özeti

Dört keşif raporu aynı resmi çiziyor: en yüksek MWh değerli arama kümeleri
(OSB/sanayi B2B, canlı PTF verisi, dürüst geçiş-süreci otoritesi) bugün ya
zayıf domainlerin ya da kimsenin elinde; Voltan'ın tek yapısal avantajı
(canlı PTF worker'ı) hiçbir rakipte yok. Ancak site DONDURULMUŞ durumda ve
1 kritik teknik kusur (K1: ana TR ticari sayfa Googlebot'a İngilizce render
oluyor) tüm içerik yatırımının temelini çürütüyor. Bu yüzden yol haritası
dört faza ayrılır: **Faz 0** küçük, tek paketlik teknik kilit açma (sahip
onayı gerekir); **Faz 1** altı `/rehber/` sayfalık ilk içerik dalgası;
**Faz 2** marka-SERP tahkimatı, entity yayılımı (sahip blokerleri çözülünce)
ve PTF hub'ı; **Faz 3** Kasım-Aralık sezonsal oyunu ("Serbest Tüketici 2027"
+ EPDK karar günü kapsaması). Mesken kapısı ve altı duran yasak tüm fazlarda
bağlayıcıdır. GSC erişimi ölçümün ön koşuludur ve bugün yoktur.

---

## 1. Gerçekler · Varsayımlar · Tavsiyeler (zorunlu ayrım)

### 1.1 Gerçekler (kaynaklı)

| # | Gerçek | Kaynak |
|---|---|---|
| G1 | `/` sayfası `navigator.language` ile Googlebot'a büyük olasılıkla EN render oluyor (K1); hreflang non-canonical `?lang=en`'e işaret ediyor (Y1) | TECHNICAL-AUDIT §3 (statik kod kanıtı, `index.html:1846`) |
| G2 | Site donuk; tüm site değişiklikleri sahip onayına tabi | TECHNICAL-AUDIT başlık bloğu |
| G3 | OSB/sanayi SERP'inde hiçbir görevli dev yok; sıralananlar zayıf domainler (Gelka, Elektra, OSB siteleri) | COMPETITOR-BENCHMARK §1-K1/K2 [CANLI-SERP 2026-07-27] |
| G4 | "Güncel PTF" SERP'inde canlı veri gösteren tek sonuç bir agregatör (enerjiatlasi); hiçbir tedarikçi canlı veri sunmuyor | COMPETITOR-BENCHMARK §1-K2, KEYWORD-MAP §3 |
| G5 | 2026 serbest tüketici limiti 500 kWh/yıl (RG 23.12.2025); mesken kademe sınırı 4.000 kWh/yıl | KEYWORD-MAP §0 (SERP doğrulaması; yayın öncesi plan 1.8 birincil kaynak teyidi şart) |
| G6 | Marka SERP'inde voltage.com.tr önde ama sayfanın kalanı Crunchbase + kontrolsüz dizinler; encazip profili bayat limit bilgisi taşıyor | KEYWORD-MAP §5, COMPETITOR-BENCHMARK §2 |
| G7 | Entity yayılımı 8 sahip blokerine kilitli (ünvan teyidi, NAP kararı, lisans/MERSİS çıktıları, sosyal hesap açılışları…) | ENTITY-PLAYBOOK §6 |
| G8 | İçerik sayfaları için bağlayıcı teknik çerçeve hazır: `/rehber/<slug>` deseni, head/şema/sitemap/iç-link/ağırlık kuralları | TECHNICAL-AUDIT §6 |
| G9 | Lead API (`functions/api/lead.js`) mevcut ve dürüst davranıyor; PTF düşüşünde "Temsili veri" etiketi var | TECHNICAL-AUDIT §4 |
| G10 | GSC / Bing Webmaster erişimi yok; hiçbir sıralama/tıklama verisi mevcut değil | KEYWORD-MAP §8-5, TECHNICAL-AUDIT yöntem notu |
| G11 | piagrid.com yeni-agresif oyuncu (7 gözlemin 4'ünde), akillitarife.com ikinci karşılaştırma oyuncusu — İZLE bayraklı | COMPETITOR-BENCHMARK §3, §6 |

### 1.2 Varsayımlar (doğrulama yoluyla birlikte)

| # | Varsayım | Nasıl doğrulanır |
|---|---|---|
| V1 | K1 nedeniyle `/`'in bugün EN başlıkla indekslendiği — statik çıkarım, saha teyidi yok | GSC URL Inspection → "View crawled page" (Faz 0 sonrası ilk iş; seo-search-console) |
| V2 | Tüm talep ifadeleri (Yüksek/Orta/Düşük) niteldir; sayısal hacim verisi yoktur | Yayın sonrası GSC sorgu verisi; 90. günde nicel revizyon |
| V3 | Rakip domainlerin backlink profillerinin zayıf olduğu [MODEL-BİLGİ] | seo-backlink-audit araç destekli doğrulama (Faz 2) |
| V4 | ABD lokasyonlu SERP gözlemleri TR SERP'ini temsil ediyor | TR lokasyonlu SERP turu — rakip istihbaratının bir sonraki döngüsü (2026-08-26) |
| V5 | Plan 1.4 dürüstlük düzeltmelerinin (jitter, fallback etiketi) tamamlandığı — teknik denetim güçlü yön olarak listeliyor ama QA saha teyidi bu belgede yok | QA regresyon + canlı sayfa kontrolü; `/rehber/ptf-nedir` yayın ön koşulu |
| V6 | Aralık 2026'da EPDK'nın 2027 limit kararını yine ~23 Aralık RG ile açıklayacağı (2025 deseni) | energy-market ajanı takvim takibi; Kasım revizyonunda teyit |

### 1.3 Tavsiye niteliğindeki kararlar (bu belgenin verdiği)

1. **URL kararı (KEYWORD-MAP §2'nin bana bıraktığı):** Serbest tüketici
   sayfası **kalıcı URL** alır: `/rehber/serbest-tuketici` — yıllı URL
   (`-2026`) AÇILMAZ. Gerekçe: rakip karşı-hamlesi A4 (haber söner, evergreen
   kalır) + teknik denetim §6.1 (URL istikrarı sıralama varlığıdır). Yıl,
   `<title>` ve H1'de taşınır ("Serbest Tüketici Limiti 2026…"), her Aralık
   aynı URL'de güncellenir.
2. **Tüm ilk-dalga sayfaları `/rehber/<slug>` altında** (teknik denetim §6.1
   bağlayıcı spec'i; KEYWORD-MAP'in kök-seviye URL önerileri buna uyarlanır).
   İleride ayrı ticari `/kurumsal/` dizini ihtiyacı doğarsa Faz 2 revizyonunda
   Direktör onayıyla değerlendirilir.
3. **Önceliklendirme birimi:** beklenen MWh-ağırlıklı lead değeri — ham
   trafik asla. Bir OSB sorgusu binlerce mesken sorgusundan değerlidir.

---

## 2. Önceliklendirme yöntemi

**Öncelik = Etki × Efor.** Etki, beklenen MWh-ağırlıklı lead değeriyle nitel
ölçeklenir (Çok Yüksek / Yüksek / Orta / Düşük — sayısal hacim verisi
olmadığı için nicelleştirilmez; V2). Efor sınıfları: **S** ≤1 gün · **M**
2–5 gün · **L** >5 gün. Kapılar (sahip onayı, Pricing+Legal, mesken kapısı,
entity blokerleri) önceliği değil **sıralamayı** belirler: yüksek etkili ama
kapılı iş, kapısı açılana dek bekler ve yerine bir alt sıradaki alınmaz —
kapıyı açma işi ayrı bir girişim olarak planlanır.

---

## 3. FAZ 0 — «Kilidi aç» (hemen; tek paket, SAHİP ONAYI bekler)

Tüm içerik yatırımının temeli. Site donuk olduğundan aşağıdaki dokuz madde
**tek küçük değişiklik paketi** olarak sahibe sunulur; uygulayıcı Webmaster,
doğrulayıcı QA. Toplam efor: **S-M (1–2 gün)**.

### 3.1 Onay paketi içeriği (TECHNICAL-AUDIT spec'leri birebir)

| # | İş | Denetim ref. | Efor |
|---|---|---|---|
| P0-1 | `navigator.language` otomatik-EN dalının kaldırılması (`index.html:1846-1848`) | **K1 — KRİTİK** | S |
| P0-2 | hreflang satırlarının head + sitemap'ten çıkarılması (`/en/` yayına dek) | **Y1 — YÜKSEK** | S |
| P0-3 | `/api/*` için `X-Robots-Tag: noindex` + `robots.txt`'e `Disallow: /api/` | O1 | S |
| P0-4 | Temiz URL'lere (`/kvkk` vb.) Cache-Control kuralları | O2 | S |
| P0-5 | Gerçek favicon dosyaları (`favicon.svg` + `favicon.ico`) | O4 | S |
| P0-6 | Sitemap `lastmod` tazeleme + "her içerik commit'i lastmod günceller" süreç kuralı | O5 | S |
| P0-7 | Ölü meta etiketlerinin silinmesi (`keywords`, `language`, `revisit-after`) | D1 | S |
| P0-8 | JSON-LD yorum düzeltmesi | D2 | S |
| P0-9 | Google Fonts self-host (latin-ext dahil) + CSP daraltma — paketin en büyük kalemi; sahip isterse Faz 1 commit'ine ertelenebilir | O3 | M |

### 3.2 Faz 0 eş-zamanlı, site dışı işler (onay gerektirmez / ayrı onay)

| Girişim | Ne | Neden (kanıt) | Sahip-uzman | Bağımlılık | Efor | Beklenen etki | Doğrulama metriği | Kapı |
|---|---|---|---|---|---|---|---|---|
| F0-A | **GSC + Bing Webmaster kurulumu ve mülk doğrulaması** | Ölçümsüz hiçbir KPI doğrulanamaz (G10); K1 saha teyidi (V1) buna bağlı | seo-search-console + Webmaster | DNS/deploy erişimi → sahip | S | Etkinleştirici (tüm ölçümün ön koşulu) | GSC mülkü aktif; ilk kapsama raporu çekildi | **SAHİP: doğrulama erişimi** |
| F0-B | K1 düzeltme teyidi: URL Inspection'da `/` render dili TR | V1 doğrulaması | seo-search-console | P0-1 + F0-A | S | Çok yüksek (ana ticari sayfanın doğru dilde indekslenmesi) | Crawled page `<title>` Türkçe, `html lang="tr"` | — |
| F0-C | `voltan.*` / `www` yönlendirmelerinin canlı curl teyidi | TECHNICAL-AUDIT D3/§8-3 | seo-technical → Webmaster | — | S | Düşük-orta (sinyal konsolidasyonu) | Tüm host'lar tek adım 301 | Bağlama gerekirse Webmaster |

**Faz 0 çıkış kriteri:** paket canlıda + GSC aktif + `/` TR render teyitli.
**Faz 1 içerik yayını bu çıkışa bağlıdır** — İngilizce indekslenen bir ana
sayfanın üzerine TR içerik mimarisi kurulmaz.

---

## 4. FAZ 1 — «İlk içerik dalgası» (Faz 0 çıkışı → ~30-45 gün)

KEYWORD-MAP §7'nin ilk 6 sayfası, plan 2.3 ile birebir hizalı; tümü
TECHNICAL-AUDIT §6 ön-uçuş spec'ine (head şablonu, Article+Breadcrumb şeması,
sitemap kuralı, iç bağlantı, ≤60 KB bütçe) tabidir. Her sayfa çalışan formda
veya simülatörde biter (plan 1.1 tamam — G9). Sayfa yayın onayı: içerik
Legal & Compliance temizinden geçer (duran kural); **sayı içeren her ifade
Pricing+Legal kapısında** (yasak #6) — onaysız sürümler sayı yayınlamaz,
metodoloji + CTA ile çıkar.

### 4.1 Sayfa girişimleri (öncelik sırasıyla)

| # | Girişim (URL) | Ne / Neden (kanıt) | Sahip-uzman | Bağımlılık | Efor | Beklenen etki (MWh gerekçesi) | Doğrulama metriği | Kapı |
|---|---|---|---|---|---|---|---|---|
| F1-1 | `/rehber/serbest-tuketici` | 2026 limiti (500 kWh) güncelliğiyle B2B yolculuğunun giriş kapısı; SERP'i parçalı-zayıf (G3-benzeri boşluk; COMPETITOR §2-küme 1: "bir hukuk bürosu sıralanıyor") | Brief: seo-keyword-research + seo-strategy; yazım: seo-content-writer; şema: seo-schema | Faz 0 çıkışı; 500 kWh rakamı plan 1.8 birincil kaynak teyidi | M | Yüksek — huni girişi; 500 kWh ile fiilen tüm işletmeler kapsamda | GSC: sorgu kümesinde gösterim>0, 90. günde ilk 20; sayfadan form başlatma olayı | Legal içerik temizi; rakam için Pricing+Legal |
| F1-2 | `/rehber/osb-elektrik-tedariki` | Sorgu başına en yüksek MWh; SERP'te tedarikçi boşluğu (G3); açı: OSB tarifesi vs ikili anlaşma | Brief: seo-competitor-intel (A2 açısı) + seo-keyword-research; yazım: seo-content-writer | Faz 0; ana sayfa OSB kartının `<a>` yapılması (seo-onpage) | M | **Çok yüksek** — tek dönüşüm yıllık GWh mertebesi | GSC: OSB kümesi gösterim/pozisyon; organik-kaynaklı OSB lead sayısı | Legal temizi |
| F1-3 | `/rehber/tedarikci-degistirme` | Karar-aşaması sorguları, doğrudan form dönüşümü; A3 "dürüst süreç otoritesi" (EPDK atıflı, 'sayaç değişmez, ücretsizdir') | Brief: seo-strategy (A3 çerçevesi); yazım: seo-content-writer; süreç doğruluğu: application ajanı (Direktör→Operations hattıyla) | Faz 0 | M | Yüksek — geçiş hunisinin darboğazı | GSC + form başlatma; PAA sorularında görünürlük | Legal temizi (süreç/taahhüt ifadeleri) |
| F1-4 | `/rehber/ptf-nedir` (canlı ticker gömülü) | Tek yapısal avantaj: canlı veri — hiçbir rakipte yok (G4, A1); profesyonel/sanayi arayan profili | Brief: seo-keyword-research (EPIAS-VERI-KATALOGU kaynaklı); yazım: seo-content-writer; gömme: Webmaster | Faz 0; **V5 teyidi (dürüst-veri QA'sı)** | M | Yüksek — dolaylı B2B, atıf/link mıknatısı | GSC: "ptf" kümesi; sayfaya dönen ziyaretçi oranı (tekrarlayan veri kontrolü davranışı) | QA dürüst-veri teyidi; Legal temizi |
| F1-5 | `/rehber/tekstil-elektrik` | Sahiplenilmiş sektör; OSB sayfası + sektör kartıyla iç bağlantı | Yazım: seo-content-writer (F1-2 şablonundan) | F1-2 yayını (şablon + iç link) | M | Orta-yüksek (sektörel MWh) | GSC sektör kümesi; karttan tıklama | Legal temizi |
| F1-6 | `/rehber/demir-celik-elektrik` | En yüksek MWh/tesis sektörü; PTF-saatlik-profil açısı özgün (A2) | Yazım: seo-content-writer | F1-2 şablonu; F1-4 (PTF bağlamı iç link) | M | Orta-yüksek (en yoğun tüketim sektörü) | GSC sektör kümesi | Legal temizi |

### 4.2 Dalga ile aynı commit'te giden yapısal işler

| Girişim | Ne | Sahip-uzman | Kapı |
|---|---|---|---|
| F1-7 | `/rehber` hub sayfası + footer "Rehber" bağlantısı + `_headers` `/rehber*` cache kuralları (TECHNICAL-AUDIT §6.5/6.7) | Webmaster + seo-internal-linking | Sahip onaylı dalga commit'i |
| F1-8 | Ana sayfa sektör kartlarının `<a>` yapılması (KEYWORD-MAP §8-1) | seo-onpage spec → Webmaster | Aynı paket |
| F1-9 | Sitemap'e hub + 6 sayfa ekleme (yayın commit'inde, `lastmod` gerçek) | Webmaster; QA doğrular | Süreç kuralı P0-6 |

**Kanibalizasyon kuralları (bağlayıcı):** "kurumsal elektrik" jenerik seti
ana sayfada kalır — yeni sayfa açılmaz; "fabrika elektrik" OSB sayfasında;
"ikili anlaşma" F1-3 içinde bölüm olarak başlar, ancak GSC kanıtı ayrışma
gösterirse Faz 2'de ayrı sayfa (KEYWORD-MAP §1-2).

**Faz 1 çıkış kriteri:** 6 sayfa + hub canlı ve indekslenmiş (GSC kapsama);
küme kapsaması 2/11 → 8/11; her sayfada form/simülatör CTA çalışır (QA).

---

## 5. FAZ 2 — «Otorite ve tahkimat» (~45-120. günler)

| # | Girişim | Ne / Neden (kanıt) | Sahip-uzman | Bağımlılık | Efor | Beklenen etki | Doğrulama metriği | Kapı |
|---|---|---|---|---|---|---|---|---|
| F2-1 | **Marka SERP tahkimatı** | Teklif-niyetli navigasyon trafiği kontrolsüz dizinlere dağılıyor (G6, A5); encazip profili bayat 950 kWh bilgisi taşıyor | seo-brand-entity (plan) + seo-local (dizin düzeltmeleri) + marketing (encazip/elektrikpaketleri düzeltme talebi, Direktör üzerinden) | Entity blokerleri 1-2 (ünvan+NAP) **[SAHİP-ONAYI]** | M | Yüksek — mevcut teklif niyetini kayıptan korur; düşük maliyet | Marka sorgularında ilk 10'da çelişkili-ad sonucu = 0; marka CTR (GSC) | **SAHİP: ünvan teyidi + NAP kararı** |
| F2-2 | **Entity yayılımı** (dizin NAP, sameAs, identifier, LinkedIn, Wikidata sırası) | ENTITY-PLAYBOOK §5 sıralı kontrol listesi; sameAs bugün boş | seo-brand-entity + seo-schema + seo-local + marketing + investor-relations (Crunchbase) | ENTITY-PLAYBOOK §6'daki 8 bloker **[SAHİP-ONAYI]**; footer MUST-FILL | M-L | Orta-yüksek (bilgi paneli hazırlığı; DD hijyeni) | Playbook §5 adım sayacı; aylık TR-SERP marka denetimi | Blokerler çözülmeden NAP yayılımı YOK (playbook kuralı) |
| F2-3 | **PTF hub genişletmesi** — `/rehber/guncel-ptf` ayrı canlı veri sayfası | Yalnızca F1-4 GSC'de "güncel ptf" sorguları çekmeye başlarsa (KEYWORD-MAP §3 koşulu) — niyet ayrışması kanıtla | seo-strategy kararı; yazım: seo-content-writer; Webmaster | F1-4 + ≥30 gün GSC verisi | M | Orta-yüksek (tekrarlayan profesyonel ziyaret; link mıknatısı) | GSC "güncel" sorgu ayrışması; dönen ziyaretçi | GSC kanıtı olmadan açılmaz (kanibalizasyon önlemi) |
| F2-4 | **Link kazanımı v1** | Rakip otoritesi basın/dernek linklerinden (COMPETITOR §3); bizim tek link-değer varlığımız canlı PTF + sektör rehberleri | seo-strategy (hedef listesi: GENSED, OSB siteleri, sektör basını) → marketing yürütür; seo-backlink-audit rakip profillerini araçla doğrular (V3) | F1 dalgası canlı; F1-4 yayını | M sürekli | Orta (otorite açığını kapatır) | Yeni yönlendiren domain sayısı (GSC bağlantı raporu); satın alınmış/spam link = 0 | Yasak #3: ücretli link/edinim YOK |
| F2-5 | `/rehber/sanayi-elektrik-fiyatlari` (2. dalga) | Orta talep, B2B fiyat niyeti (KEYWORD-MAP §1) | seo-content-writer; sayılar: pricing | F1 çıkışı | M | Orta-yüksek | GSC sanayi-fiyat kümesi | **Pricing+Legal onayı olmadan sayı yok** — onaysız sürüm metodoloji+simülatör CTA |
| F2-6 | Kalan sektör sayfaları (kimya, soğuk zincir, cam, veri merkezi) — şablondan | KEYWORD-MAP §7-9 | seo-content-writer | F1-5/6 şablon kanıtı (GSC'de sektör sayfaları iz bırakıyor mu?) | M | Orta | GSC sektör kümeleri | Legal temizi |
| F2-7 | TR lokasyonlu SERP + rakip sayfa-düzeyi doğrulama turu (piagrid, akillitarife İZLE bayrakları) | V4 sınırlaması; COMPETITOR §6 erken-tespit | seo-competitor-intel | — | S | Etkinleştirici | Doğrulanmış rakip format raporu | — |

**Faz 2 çıkış kriteri:** marka SERP'i ilk 10 temiz; entity adımlarından
sahip-blokersiz olanların tamamı işlenmiş; ≥10 sayfa canlı; ilk dış
bağlantılar kazanılmış.

---

## 6. FAZ 3 — «Sezonsal oyun» (Kasım–Aralık 2026)

Enerji SEO'sunun gerçek takvimi tarife/limit kararlarıdır (KEYWORD-MAP §6):
Aralık sonu EPDK limit kararı + yılbaşı kademe değişimi, B ve D kümelerini
zirveye taşır. Haber siteleri SERP'i 2-4 hafta işgal eder, sonra çekilir —
kazanan, **karar günü güncellenen evergreen sayfadır** (A4).

| # | Girişim | Ne / Neden | Sahip-uzman | Bağımlılık | Efor | Beklenen etki | Doğrulama metriği | Kapı |
|---|---|---|---|---|---|---|---|---|
| F3-1 | **"Serbest Tüketici 2027" evergreen hazırlığı (KASIM)** | F1-1 sayfası Kasım'da 2027-hazır hale getirilir: karar-öncesi bölüm ("2027 limiti ne zaman açıklanır"), karar günü güncelleme nöbeti | seo-content-writer + seo-strategy; kaynak izleme: energy-market (RG/EPDK) | F1-1 canlı + V6 takvim teyidi | S-M | Yüksek — yıllık en büyük talep dalgasını evergreen URL devralır | Karar sonrası 30 günde GSC: limit sorgularında pozisyon; haber çekilince sıralama devri | Yeni rakam yayını: birincil kaynak (RG) + Legal |
| F3-2 | **EPDK karar günü kapsaması (ARALIK)** | Karar RG'de yayınlandığı gün F1-1 ve etkilenen sayfalar güncellenir (`dateModified` + sitemap `lastmod` aynı commit) | seo-content-writer; yayın: Webmaster; teyit: energy-market | F3-1 | S | Yüksek (tazelik sinyali + doğruluk) | Güncelleme ile RG arasındaki saat farkı; GSC gösterim sıçraması | Rakamlar yalnız RG'den; Legal temizi |
| F3-3 | Çeyrek tarife pencereleri için güncelleme nöbeti kuralı (Oca/Nis/Tem/Eki) | KEYWORD-MAP §6 | seo-strategy süreç kuralı; yürütme content-writer | — | S süreç | Orta | Sayfa güncellik denetimi (aylık) | — |
| F3-4 | `/rehber/kademe-*` + mesken checker sayfası — **KOŞULLU** | De-sübvanse kama (>4.000 kWh/yıl) tam bu sorgularda; ama **mesken kapısı**: plan 2.6 checker'ı ("geçmeyin" diyebilen) hazır ve legal-compliance onaylı olmadan YAYINLANMAZ; tasarruf vaadi hiçbir koşulda yok (yasak #4) | product-manager + pricing/billing-analysis (checker); içerik: seo-content-writer | Plan 2.6 + 1.8 tarife teyidi + Legal onayı | M | Orta bugün, birleşik değer sonra (sıfır-CAC bekleme listesi) | Checker kullanım + bekleme listesi kayıtları; "geçmeyin" sonucu oranı raporlanır | **MESKEN KAPISI — çifte kilit: 2.6 + Legal** |

**Faz 3 çıkış kriteri:** Aralık karar dalgasında limit sorgularında evergreen
sayfa haber-sonrası SERP'i devralmış; hiçbir mesken tasarruf vaadi
yayınlanmamış.

---

## 7. KPI panosu — birim tanımı (bugün → 90 gün)

> **ÖN KOŞUL BAYRAĞI:** Bu panonun tamamı GSC erişimine bağlıdır (F0-A).
> GSC doğrulanana kadar hiçbir satır ölçülemez; kurulum Faz 0'ın parçasıdır.
> Bugünkü tüm "0/bilinmiyor" değerleri gerçek ölçüm yokluğunu yansıtır —
> hiçbir başlangıç değeri uydurulmamıştır (birim standardı: sıfır uydurma metrik).

| KPI | Tanım / kaynak | Bugün (2026-07-27) | 90-gün hedefi |
|---|---|---|---|
| K-1 Render dili doğruluğu | GSC URL Inspection: `/` crawled render TR mi | Bilinmiyor (V1: EN olduğu varsayılıyor) | TR — teyitli |
| K-2 İndekslenmiş hedef sayfa | GSC kapsama: hedef URL sayısı | 4 (`/` + 3 yasal) | 11 (+`/rehber` hub + 6 makale) |
| K-3 Küme kapsaması | KEYWORD-MAP'in 11 öncelikli kümesinden canlı hedef sayfası olan | 2/11 | 8/11 |
| K-4 Marka SERP temizliği | Çekirdek+tüzel sorgularda ilk 10'da çelişkili-ad sonucu (aylık manuel TR denetim + GSC marka CTR) | Bilinmiyor (ABD gözlemi: dizin kirliliği var) | 0 çelişkili sonuç |
| K-5 Organik gösterim/tıklama tabanı | GSC performans, marka-dışı sorgular | Ölçülemiyor (GSC yok) | İlk 30 günde taban çizgisi kurulur; 90. günde tabana karşı artış raporlanır (sayısal hedef taban olmadan verilmez) |
| K-6 Organik kaynaklı lead | Lead kaydında UTM/kaynak alanı (plan 1.2 enstrümantasyonu) | 0 ölçülü | Her organik lead'in %100 kaynak-atıflı olması; MWh-segmenti (OSB/sanayi/diğer) etiketli |
| K-7 MWh-ağırlıklı lead değeri | Organik lead'lerin beyan/tahmini yıllık tüketim toplamı (sales nitelendirmesiyle) | 0 ölçülü | Raporlanabilir hale gelmesi (ilk gerçek değer 90-gün revizyonunda taban olur) |
| K-8 Sayfa güncelliği | "Son güncelleme" ile gerçek içerik değişimi eşleşmesi; sitemap lastmod doğruluğu | — | %100 (QA denetimi) |
| K-9 Dış bağlantı | GSC bağlantı raporu: yönlendiren domain sayısı; satın alınmış link | Bilinmiyor | Taban + artış; satın alınmış/spam = 0 |
| K-10 CWV | GSC CWV raporu / CrUX (TECHNICAL-AUDIT §7 bütçeleri) | Saha verisi yok | Tüm sayfalar "İyi" kovada; bütçe ihlali 0 |

Raporlama: seo-search-console aylık çeker; seo-strategy çeyreklik revizyon
memosuyla Direktöre sunar. Gerçekleşen-vs-beklenen lead etkisi her girişimin
kapanışında bu panoya işlenir (birim KPI'ı).

---

## 8. Kapılar ve duran yasaklar — bu yol haritasında nasıl uygulanıyor

1. **Site donuk / sahip onayı:** Siteye dokunan her şey (Faz 0 paketi, F1
   dalga commit'leri, F3 güncellemeleri) sahip onaylı paketlerle gider.
2. **Yasak #6 (Pricing+Legal olmadan sayı yok):** 500/4.000 kWh dahil her
   rakam yayın öncesi plan 1.8 birincil kaynak + Legal temizi; F2-5 fiyat
   sayfası onaysız sürümde sayı taşımaz.
3. **Mesken kapısı (plan 2.6 + yasak #4):** D kümesi sayfaları F3-4'te çifte
   kilitli; tasarruf vaadi hiçbir yüzeyde yok; checker "geçmeyin" diyebilmeli.
4. **Yasak #3 (ölçüm öncesi ücretli edinim yok):** Bu yol haritası %100
   organik; link kazanımı da (F2-4) ücretsiz/hak edilmiş linkle sınırlı.
5. **Entity blokerleri (ENTITY-PLAYBOOK §6):** NAP/sameAs/Wikidata işleri
   sahip teyitleri gelmeden başlamaz; yanlış adresin 30 dizine kopyalanması
   geri alınamaz hata sınıfıdır.
6. **EEAT/YMYL:** Her sayfa lisanslı tedarikçi kimliği, canlı piyasa verisi
   ve gerçek süreç bilgisiyle yazılır; ince/affiliate-tarzı içerik reddedilir.

---

## 9. Sahibin vermesi gereken TEK en önemli karar

**Faz 0 paketini onaylamak** (§3.1'deki 9 maddelik tek küçük değişiklik
paketi + GSC mülk doğrulama erişimi). Gerekçe: K1 nedeniyle şirketin tek
ticari sayfası büyük olasılıkla yanlış dilde indeksleniyor; bu düzelmeden
yapılacak her içerik ve otorite yatırımı çürük temele döşenir. Paket 1-2
günlük iştir, kilitli tasarım sözleşmelerine dokunmaz ve tüm yol haritasının
kritik yoludur. (İkinci sıradaki karar — Faz 2'yi açan ünvan/NAP teyitleri —
Faz 0/1 yürürken paralel çözülebilir; kritik yolda değildir.)

---

*Bu belge yalnız plandır; hiçbir üretim dosyası değiştirilmemiştir. Tüm
uygulama sahip onayı sonrası Webmaster'da, doğrulama QA'da, ölçüm
seo-search-console'dadır. Sıfır uydurma metrik standardı uygulanmıştır:
belgede geçen tüm rakamlar kaynaklı gerçeklerdir veya açıkça hedef/varsayım
olarak etiketlenmiştir.*
