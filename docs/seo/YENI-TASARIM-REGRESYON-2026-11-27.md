# Yeni tasarım SEO, GEO ve LLM regresyon denetimi (2026-11-27)

**Hazırlayan:** Teknik SEO ajanı (`seo-technical`), Orchestrator görevlendirmesi
**Karşılaştırma:** üretim `main` @ 50649ca ↔ yayın adayı (RC) `claude/yayin-yeni-tasarim` @ 0879f2b
**Canlı ölçüm adresleri:** üretim https://voltage.com.tr ve üretim takma adı https://website-dh5.pages.dev (main) ↔ RC önizlemesi https://9c79718b.website-dh5.pages.dev
**Kapsam:** 28 sitemap URL'si + `/panel` + 404, `robots.txt`, `sitemap.xml`, `llms.txt`, iç dosya 302'leri.
**Veri ilkesi:** bu belgede yalnız toplu sayılar, durum kodları ve başlık değerleri var. Search Console satırı yok.

## Karar: PASS WITH NOTES

Yayını engelleyen bir regresyon bulunmadı. Metadata, canonical, robots, JSON-LD, indekslenebilirlik ve iç bağlantılar main ile birebir aynı ya da daha iyi. Ana sayfadaki metin değişikliği anahtar kelime ve varlık kapsamını genişletiyor. Performansta tek ölçülebilir gerileme, alt sayfa kabuğunda web fontu değiştiğinde **masaüstünde** oluşan düzen kayması (CLS). Medyanlar "iyi" eşiğinin (0,1) altında kalıyor, mobil CLS ise belirgin biçimde iyileşiyor. Düzeltmesi 10 satırlık bir CSS ekidir (N1, aşağıda). Webmaster'a yayından önce ya da yayından sonraki 7 gün içinde uygulanması önerilir; zamanlamayı Orchestrator belirler.

| Alan | Eski → yeni | Regresyon | Önem |
|---|---|---|---|
| 1. Metadata (title, description, robots, canonical, hreflang, OG/Twitter, lang) | 30 sayfada birebir aynı | Yok | — |
| 2. Yapılandırılmış veri (JSON-LD) | 30 sayfada anlamsal olarak birebir aynı; FAQ ↔ görünür metin uyumu 22/22 sayfada tam | Yok | — |
| 3. İndekslenebilirlik (durum kodu, yönlendirme, X-Robots-Tag, robots, sitemap, 302, 404) | Aynı; pages.dev artık noindex (kasıtlı kazanım) | Yok | — |
| 4. Semantik içerik | 22 alt sayfanın içerik bölgesi birebir aynı; ana sayfada kapsam arttı; yer işareti (landmark) yapısı iyileşti | Yok | — |
| 5. İç bağlantılar | Kayıp bağlantı 0, kırık 0, öksüz sayfa 0; 4 hedefin gelen bağlantısı arttı | Yok | — |
| 6. GEO/LLM hazırlığı | 6 bot kullanıcı ajanı aynı baytı alıyor; SSR yerinde; künye 3 sayfadan 26 sayfaya çıktı | Yok | — |
| 7. Performans | Mobil LCP aynı ya da daha iyi; ana sayfa LCP iyileşti; masaüstü alt sayfa CLS'si yükseldi | **Evet (N1)** | Düşük-Orta |

## Yöntem

- **Statik karşılaştırma:** `origin/main` ve `0879f2b` git archive ile çıkarıldı. Her HTML sayfası BeautifulSoup ile ayrıştırıldı: meta ve link etiketleri, JSON-LD, H1–H6, görünür metin (JS kapalı, script, style ve template hariç), `data-en` metinleri, img ve alt, bağlantılar ve anchor metinleri, landmark sayıları. İçerik bölgesi eşitliği için eski `div.page` alt öğeleri (gezinti izi ve alt bilgi hariç) ile yeni `main div.wrap` alt öğeleri, boşluk normalleştirilerek HTML düzeyinde karşılaştırıldı.
- **Yerel sunum:** her iki ağaç `wrangler pages dev` (3.99.0) ile Functions ve `_redirects`/`_headers` birlikte sunuldu; `Host: voltage.com.tr`, `website-dh5.pages.dev` ve `9c79718b.website-dh5.pages.dev` başlıklarıyla üretim ve önizleme taklit edildi.
- **Gerçek ağ:** çalışma dalında geçici GitHub Actions iş akışı `gecici-seo-regresyon.yml` kullanıldı (koşular 46007089328, 46008392277, 46009041250). Günlüklere yalnız durum kodu, başlık değeri, bayt sayısı, sha256 öneki ve metrik yazıldı. İş akışı cbee5b0 ile silindi.
- **Lighthouse:** 1. tur LH 12.2.1, 5 koşu (bu sürüm güncel Chrome'da LCP öğesi denetimini üretemedi). 2. tur LH 12.6.1, sayfa ve form faktörü başına 7 koşu, main ve RC dönüşümlü çalıştı. 3. tur LH 12.6.1, mobilde `--throttling-method=devtools` ile 5 koşu. Ana tablolar 2. turun medyanlarıdır; 3. tur benzetim (Lantern) yapaylıklarını ayıklamak için kullanıldı.

## 1. Metadata

30 HTML dosyasının tamamında (28 sitemap sayfası, `/panel`, `404.html`) şu alanlar **bayt düzeyinde aynı**: `<html lang>`, `<title>`, tüm `<meta name|property>` değerleri (description, robots, viewport, og:*, twitter:*), `<link>` etiketleri (canonical, alternate, icon, preconnect, Google Fonts stylesheet).

- Ana sayfa canonical `https://voltage.com.tr/`, robots `index, follow, max-snippet:-1, max-image-preview:large`, `og:locale:alternate en_US`: değişmedi.
- hreflang her iki ağaçta da yok. Değişiklik yok; EN mimarisi plan maddesi 3.5'te ayrıca ele alınıyor.
- `404.html` her iki ağaçta `noindex, follow`.

**Regresyon: yok.**

## 2. Yapılandırılmış veri

- Her sayfadaki JSON-LD blokları ayrıştırıldı ve `sort_keys` ile normalleştirilip karşılaştırıldı. 30 sayfanın tamamında **birebir aynı**; ayrıştırma hatası yok.
- Ana sayfa tipleri: Organization, WebSite, Service, OfferCatalog, Offer, PostalAddress, ContactPoint, PropertyValue, ImageObject, Country. Ana sayfanın görünür metni değişti ama JSON-LD'deki iddiaların (unvan, lisans, adres, iletişim) karşılığı yeni görünür metinde duruyor. Künye bölümü "İletişim ve Sicil Bilgileri" adıyla korundu.
- FAQPage içeren 22 sayfada (alt sayfalar ve rehberler) her soru ve cevap görünür metinde aranarak doğrulandı: 22 sayfanın 22'sinde tam uyum. İlk taramada `serbest-tuketici` ve `tedarikci-degistirme` sayfalarında görülen 3 "uyumsuzluk", ayrıştırıcının bağlantı metinleri etrafına koyduğu boşluktan kaynaklanıyordu, gerçek bir fark değil. Bu iki sayfa zaten dondurulmuş ve değişmemiş durumda.

**Regresyon: yok.**

## 3. İndekslenebilirlik

### 3.1 Canlı ölçüm (GitHub Actions, gerçek CDN)

| Kontrol | voltage.com.tr (main) | website-dh5.pages.dev (main) | 9c79718b (RC) |
|---|---|---|---|
| 28 sitemap sayfası | 28 × 200, X-Robots-Tag yok | 28 × 200, X-Robots-Tag yok, baytlar üretimle aynı (sha eşleşiyor) | 28 × 200, `X-Robots-Tag: noindex` (`/canli-ptf`: `noindex, nofollow` + robots meta noindex) |
| `/index.html` | 301 → `/` | 301 → `/` | 301 → `/` |
| `.html` uzantılı (4 örnek) | 308 → temiz URL | 308 | 308 |
| Sondaki eğik çizgi (`/rehber/`, `/kurumsal/`) | 308 → eğik çizgisiz | 308 | 308 |
| `/rehber/yenilenebilir-ureticiler` | 301 → `/rehber/yek-g-nedir` | 301 | 301 |
| `/docs/*`, `/lib/*`, `/tools/*`, `/game404/*`, `/.claude/*`, `/.github/*`, `CLAUDE.md`, `DEPLOY.md`, `CHANGELOG.md`, `README.md`, `.gitignore` | 11 × 302 → `/` | 11 × 302 | 11 × 302 |
| Olmayan URL | 404, robots meta noindex | 404 | 404 |
| `robots.txt` | 200 | 200, aynı sha | 200, **aynı sha** (değişmedi) |
| `sitemap.xml` | 200 | 200 | 200; tek fark ana sayfa `lastmod` 2026-11-23 → 2026-11-27 (kasıtlı) |
| `llms.txt` | 200 | 200 | 200, **aynı sha** |
| `www.voltage.com.tr/kurumsal` | 301 → `https://voltage.com.tr/kurumsal` | | |
| `/img/*.webp` | 404 (henüz yok) | 404 | 200, `Cache-Control: public, max-age=86400, must-revalidate` |

### 3.2 RC'nin üretim alan adında davranışı (yerel taklit)

RC henüz voltage.com.tr'de sunulmadığı için üretim alan adındaki davranışı yerelde `Host: voltage.com.tr` ile taklit edildi. 55 yolun (sayfalar, yönlendirmeler, 302'ler, statik dosyalar) durum kodu, `Location`, `X-Robots-Tag` ve `Cache-Control` değerleri main ile **birebir aynı**. Tek fark `/img/kapak-1200.webp`: main'de 404, RC'de 200. Üretim hostunda X-Robots-Tag yok, `/canli-ptf` robots meta etiketi değişmiyor (`functions/_lib/onizleme.js` yalnız voltage.com.tr ve www dışındaki hostları işaretliyor; `docs/qa/test-ssr-ptf.mjs` testi de bunu doğruluyor). `_headers` dosyasındaki `https://:project.pages.dev/*` ve `https://:version.:project.pages.dev/*` kalıpları Cloudflare belgesindeki biçimde ve özel alan adıyla eşleşmiyor.

Sonuç: yayından sonra `website-dh5.pages.dev` takma adı da noindex olacak. Bu kasıtlı bir değişiklik ve kopya içerik riskini kapatıyor.

**Regresyon: yok.** Yayından sonra doğrulanacak maddeler "Yayın sonrası kontroller" bölümünde.

## 4. Semantik içerik

### 4.1 Alt sayfalar (22 yeniden giydirilen sayfa + 404)

- **İçerik bölgesi HTML'i birebir aynı:** `canli-ptf`, `rehber`, `kurumsal`, `sanayi-elektrik-tedariki`, `elektrik-faturasi-hesaplama` ve 15 rehber (H1, güncelleme tarihi, gövde, CTA, "Bu yazı hakkında" kutusu dahil).
- `kvkk`, `cerez-politikasi`, `kullanim-kosullari`: tek fark, gövdenin başındaki "← voltage.com.tr ana sayfa" bağlantısının kalkması. Ana sayfa bağlantısı artık üst banttaki logodan ve gezinti izinden veriliyor; bağlantı kaybı yok (bkz. §5).
- Başlık yapısı (H1–H6) 29 sayfada aynı, her sayfada tek H1.
- Kabuğun eklediği görünür metin (her sayfada yaklaşık 63–66 kelime): "İçeriğe atla", üst menü (Hakkımızda, Hizmetler, Yaklaşım, Rehber, Canlı PTF, İletişim, Teklif Al) ve dört sütunlu künye alt bilgisi (unvan, EPDK Tedarik Lisansı ETS/3424-8/2074, Acıbadem adresi ve 34718 Kadıköy, info@voltage.com.tr, Ticaret Sicil 786882-0, Kuruluş 2011, EPİAŞ Piyasa Katılımcısı, yasal bağlantılar).
- **Landmark kazanımı:** eski alt sayfalarda `<header>` ve `<main>` yoktu. RC'de 25 sayfada `header` 1, `main` 1, `nav` 3 (ana menü, gezinti izi, alt bilgi). İçerik artık ana bölge olarak işaretli; bu, ayrıştırıcıların ve LLM'lerin şablonu içerikten ayırmasını kolaylaştırıyor.
- Dondurulmuş 3 rehber (`ptf-nedir`, `serbest-tuketici`, `tedarikci-degistirme`) ve `panel.html`: baytlar aynı (canlıda sha da eşleşiyor).

### 4.2 Ana sayfa: metin değişikliklerinin tamamı

| Bölge | Eski | Yeni |
|---|---|---|
| H1 | "Türkiye'nin endüstriyel enerji ortağı, Voltage." (TR ve EN ayrı span'lerde, ikisi de DOM'da) | "Sanayi ve Ticarethaneler için Elektrik Tedariki · Sanayinin enerjisini piyasayla buluşturuyoruz." (EN, `data-en` ile) |
| Kapak alt metni | "…yüksek tüketimli kurumsal ve endüstriyel müşterilere…" | "…sanayi ve ticarethanelere…" (GÖP, GİP, ikili anlaşma ve Voltan Elektrik A.Ş. korundu) |
| Kapak düğmeleri | "Teklif Talep Edin", "Hizmetlerimiz" | "Teklif Al", "Hizmetlerimizi İncele" |
| Güven şeridi | "EPDK Tedarik Lisansı ETS/3424-8/2074 · Piyasa Deneyimi 15 yıl · Est. 2011" | "2011'den bu yana EPDK lisanslı tedarikçi · EPDK Lisansı ETS/3424-8/2074 · Piyasa katılımcısı GÖP ve GİP · Türkiye'nin tamamı · Sanayi ve ticarethane" |
| Canlı veri kartı | "Canlı Piyasa / EPİAŞ piyasasını anlık okuyoruz", saat, en düşük, en yüksek ve "Bugünün Cetveli" alanları "—" | "Güncel Piyasa Verisi · PTF (₺/MWh) · Saatlik veri bekleniyor · Piyasa verilerini detaylı incele" (dürüst bekleme hâli, uydurma değer yok) |
| H2 bölüm başlıkları | Canlı Piyasa · Çalıştığımız Tesis Sınıfları · Teklif'ten ilk faturaya, beş adım · Üç Sözleşme Modeli · Bir firma kadar köklü, bir ortak kadar yakın · Uçtan uca enerji çözüm portföyü · Neden Voltage? · İletişim | **Hizmetlerimiz · Hizmet Verdiğimiz Sektörler · Güncel Elektrik Piyasası Verileri · Elektrik Tedarik Süreci · Elektrik Tedarik Sözleşmesi Modelleri · Voltage Enerji Hakkında** · Neden Voltage? · İletişim |
| H3 | 5 adet | 30 adet: 5 hizmet, 7 sektör, 3 piyasa verisi, 5 süreç adımı, Şirket Bilgileri, EPDK Tedarik Lisansı, 3 "Neden Voltage" maddesi ("Piyasa Zekâsı" → "Elektrik Piyasalarında Uzmanlık"), Teklif Talebi, İletişim ve Sicil Bilgileri |
| Sektör notları | 7 tesis sınıfı (◆ listesi) | 7 sektör kartı, fotoğraf ve alt metinle; "Görseller temsilîdir; müşterilerimizin tesislerini ya da belirli bir tesisi göstermez." notu; "Tüm sektör rehberleri" bağlantısı |
| Süreç | S1–S5, "Onboard" | Keşif, Modelleme, Teklif, Tedarikçi Değişimi, Devreye Alma |
| Kaldırılan dekoratif metin | "KAPAK · 01 / 09", bölüm numaraları 02–09, "EXHIBIT A", "TEK HAT ŞEMASI — ŞEMATİK · ÖLÇEKSİZ", "VOLTAGE FELSEFESİ · EST. 2011" | — |
| Künye | "EPİAŞ Üyesi", "Est. 2011" | "EPİAŞ Piyasa Katılımcısı", "Kuruluş 2011" |

Başlık hiyerarşisi temiz: H1 → H2 → H3, seviye atlaması yok. Eski yapıdaki slogan H2'leri, aranabilir ve açıklayıcı H2'lerle değiştirildi. Bu bir **kazanım**: "Elektrik Tedarik Süreci" ve "Elektrik Tedarik Sözleşmesi Modelleri" doğrudan sorgu kalıplarıyla örtüşüyor.

### 4.3 Ana sayfa: anahtar kelime ve varlık kapsamı (JS kapalı görünür TR metin, geçiş sayısı)

| Terim | Eski | Yeni | | Terim | Eski | Yeni |
|---|---|---|---|---|---|---|
| elektrik tedarik(i) | 2 | 5 | | Voltan Elektrik | 7 | 7 |
| tedarikçi | 3 | 5 | | Voltage Enerji | 3 | 5 |
| PTF | 6 | 13 | | EPİAŞ | 9 | 8 |
| EPDK | 7 | 8 | | 786882-0 (sicil) | 3 | 3 |
| lisans | 7 | 8 | | Acıbadem / Kadıköy | 3 / 3 | 3 / 3 |
| ETS/3424-8/2074 | 6 | 5 | | info@voltage.com.tr | 2 | 2 |
| GÖP / GİP | 4 / 3 | 5 / 4 | | sabit / endeksli / hibrit | 9 / 8 / 2 | 9 / 11 / 2 |
| Gün Öncesi / Gün İçi | 6 / 3 | 5 / 3 | | YEK-G | 2 | 2 |
| ikili anlaşma | 4 | 4 | | OSB | 4 | 4 |
| sanayi | 3 | 7 | | demir, çelik, kimya, tekstil, veri merkezi, soğuk zincir, lojistik, cam, seramik | 1–2 | aynı |
| ticarethane | 2 | 5 | | endüstriyel / kurumsal | 5 / 5 | 3 / 3 |
| fatura / teklif / tüketim | 14 / 15 / 13 | 14 / 14 / 12 | | 2011 | 10 | 8 |

- **Kaybolan önemli terim yok.** Eski metinde geçen her ticari ve varlık terimi yeni metinde de en az bir kez geçiyor. Azalmalar (endüstriyel, kurumsal, 2011, ETS 6→5) dekoratif tekrarların kalkmasından; terimler title, description ve JSON-LD'de aynen duruyor.
- **Kazanım:** "elektrik tedariki" ve "sanayi/ticarethane" kümesi H1'e girdi. Title ("…| Elektrik Tedarikçisi") ve description değişmediği için H1 ile title arasındaki konu uyumu arttı.
- "serbest tüketici" iki ağaçta da ana sayfada geçmiyor. Bu bir regresyon değil, bir fırsat; içerik kararı SEO Director'da.
- EN `data-en` kelime sayısı 871 → 928. Eski H1'de TR ve EN metin aynı anda DOM'daydı (JS kapalıyken karışık dilli H1); yeni H1'de DOM yalnız TR. Ayrı bir EN URL'si olmadığı (canonical `/`) için dizin etkisi nötr ya da olumlu.
- Görseller: ana sayfada 1 → 9 `<img>`. Kapak görseli `alt=""` (dekoratif, doğru kullanım), 7 sektör görselinin hepsinde TR alt ve `data-alt-en` var; hepsinde `width`/`height` ve `srcset` var; sektör görselleri `loading="lazy"`, kapak `fetchpriority="high"`.

**Regresyon: yok.**

## 5. İç bağlantılar

Sayfa düzeyinde yönlü graf (yalnız iç alan; fragman ve sorgu atılıp yola indirgendi; sayfa içi `#` bağlantıları hariç; `/panel` hariç):

| Hedef | Gelen bağlantı veren sayfa, eski → yeni | | Hedef | Eski → yeni |
|---|---|---|---|---|
| `/` | 28 → 28 | | `/rehber/ptf-nedir` | 17 → 17 |
| `/rehber` | 25 → **28** | | `/rehber/serbest-tuketici` | 14 → 14 |
| `/kurumsal` | 27 → **28** | | `/rehber/tedarikci-degistirme` | 15 → 15 |
| `/canli-ptf` | 9 → **26** | | `/rehber/osb-elektrik-tedariki` | 11 → 11 |
| `/cerez-politikasi` | 11 → **25** | | `/sanayi-elektrik-tedariki` | 9 → 9 |
| `/kvkk`, `/kullanim-kosullari` | 28 → 28 | | `/elektrik-faturasi-hesaplama` | 6 → 6 |
| Diğer 15 rehber | 3–6 → aynı | | `/404` | 0 → 0 |

- **Kaybolan çıkış bağlantısı: 0.** Hiçbir sayfa, eskiden bağlantı verdiği bir hedefi kaybetmedi; her sayfanın çıkış kümesi eskisini kapsıyor (rehberlerde artış: `/canli-ptf`, `/cerez-politikasi`).
- **Kırık iç bağlantı: 0** (iki ağaçta). **Eksik fragman hedefi: 0.** Kabuk menüsündeki `/#hakkimizda`, `/#hizmetler`, `/#yaklasim`, `/#iletisim` ile `#teklif` ve `#leadForm` kimlikleri RC ana sayfasında var. **Yinelenen id: 0.**
- **Öksüz sayfa: 0.** En az gelen bağlantı 3 sayfa (sektör rehberleri; değişmedi).
- **Anchor değişimi:** yalnız `/canli-ptf` hedefinde "Canlı PTF sayfasını aç" anchor'ı yerini "Saatlik PTF değerleri: Canlı PTF sayfasını aç", "Piyasa verilerini detaylı incele" ve "Canlı PTF sayfasında" anchor'larına bıraktı. Konu uyumu korunuyor. Başka hedefte kaybolan anchor yok.
- Ana sayfa 14 hedefe çıkış veriyor (küme aynı); sektör kartları 7 sektör rehberine bağlanmaya devam ediyor.

**Regresyon: yok.**

## 6. GEO ve LLM hazırlığı

- **Bot eşitliği (canlı):** voltage.com.tr ve RC önizlemesinde `/`, `/rehber/tekstil-elektrik`, `/rehber`, `/kurumsal`, `/elektrik-faturasi-hesaplama`, `/canli-ptf` sayfaları Chrome, Googlebot, Bingbot, GPTBot, ClaudeBot ve PerplexityBot kullanıcı ajanlarıyla istendi. 72 isteğin tamamı 200 döndü; her sayfada **6 ajan aynı baytı aldı** (aynı sha256). Bot engeli ya da gizleme (cloaking) yok.
- **JS kapalı içerik:** ana sayfadaki hizmet, sektör, süreç, sözleşme modelleri, şirket bilgileri ve künye metni ham HTML'de. Canlı PTF kartı JS kapalıyken "Saatlik veri bekleniyor" diyor; bu, dürüstlük merdivenine uygun. Alt sayfa içerikleri ham HTML'de.
- **`/canli-ptf` SSR:** 6 ajanın hepsinde `<body data-ssr` işareti var (main ve RC). Üretim hostunda robots meta `index`; önizlemede `noindex, nofollow`.
- **`llms.txt`:** RC ile main arasında bayt düzeyinde aynı. Listelenen 25 farklı URL'nin hepsi RC'de (üretim hostu taklidiyle) 200. Ana sayfanın eski sloganına atıf yok, dolayısıyla güncelleme gerekmiyor.
- **Varlık tutarlılığı (RC):** ETS/3424-8/2074 29 sayfada (main'de 25), sicil 786882-0, 34718 posta kodu ve Acıbadem adresi 26 sayfada (main'de 2–3). Yeni alt bilgi künyeyi her sayfaya taşıyor. Bu, LLM'lerin varlığı doğrulaması için belirgin bir kazanım. Unvan yazımları: "Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş." 59, "…Anonim Şirketi" 24 (JSON-LD legalName ile tutarlı), "Voltan Elektrik A.Ş." 16, "…İth. ve İhr. A.Ş." 3 (lisans künyesi). Bu dağılım main'deki içerikle aynı.
- Yasaklı veriler: "479 0510", "34660", "Bağcılar" iki ağaçta da 0. Ana sayfada "tasarruf" iki kez geçiyor; ikisi de "tasarruf yüzdesi ve tutar taahhüdü verilmez" dipnotu (main ile aynı).

**Regresyon: yok.**

## 7. Performans

### 7.1 Sayfa ağırlığı (HTML, yerel dosyalar; gzip -9 ve brotli -q11)

| Sayfa | Ham bayt, eski → yeni | gzip | brotli |
|---|---|---|---|
| `/` | 166.927 → 194.590 | 43.058 → 54.308 | 35.972 → 45.632 |
| `/rehber` | 16.410 → 34.291 | 5.187 → 10.528 | 4.523 → 9.237 |
| `/rehber/tekstil-elektrik` | 15.660 → 32.344 | 5.650 → 10.533 | 4.953 → 9.245 |
| `/canli-ptf` (statik kabuk) | 39.689 → 57.475 | 13.060 → 18.408 | 11.639 → 16.166 |
| `/elektrik-faturasi-hesaplama` | 29.155 → 50.486 | 9.223 → 15.715 | 8.154 → 13.633 |
| `/kurumsal` | 19.749 → 36.663 | 6.185 → 11.107 | 5.364 → 9.728 |
| 29 HTML toplamı | 712.292 → 1.187.207 | 221.219 → 365.208 | |

Artışın kaynağı, her alt sayfaya satır içi gömülen kabuk CSS'i (`<style>` 2,5 KB → 14–17 KB) ve künye alt bilgisi. Script yok; tek satır içi menü betiği 644 bayt, `<body>` sonunda. Render'ı engelleyen tek dış kaynak, iki ağaçta da aynı olan Google Fonts CSS'i.

**Lighthouse toplam aktarım (2. tur medyanı):** alt sayfalarda **düşüş**: rehber 321 → 242 KB, tekstil 322 → 242 KB, hesaplama 344 → 247 KB, canli-ptf 348 → 270 KB. Sebep: RC'de Newsreader italik dosyası (yaklaşık 87 KB) artık yüklenmiyor. İstek sayısı 1–3 azaldı. Ana sayfada **artış**: mobil 607 → 827 KB, masaüstü 607 → 936 KB, istek 20 → 27 (kapak ve 7 sektör WebP'si). Bu artış LCP'yi kötüleştirmiyor (bkz. 7.2).

**LCP öğesi:** alt sayfalarda iki ağaçta da gövdenin ilk paragrafı (`main > div.sayfa-govde > div.wrap > p`; eskide `div.page > p`). Ana sayfada main'de kapak üst yazısı (`div.kicker`, metin), RC'de kapak görseli (`picture.hero-photo > img`, `fetchpriority="high"`, ön yükleme tarayıcısı HTML'den buluyor). `object-fit: cover` kırpması nedeniyle `sizes="(min-width: 2100px) 100vw, 2100px"` masaüstünde 2172w (116 KB) dosyayı seçiyor; bu tasarım gereği, kusur değil.

### 7.2 Lighthouse: main (website-dh5.pages.dev) ↔ RC (9c79718b), 2. tur, 7 koşu medyanı, benzetimli kısıtlama

| Sayfa | Form | Skor | LCP (ms) | FCP (ms) | Speed Index (ms) | TBT (ms) | CLS | Gözlenen LCP (ms) | Toplam KB | İstek |
|---|---|---|---|---|---|---|---|---|---|---|
| / | mobil | 63 → 83 | 5993 → 4463 (RC aralık 3089-5826) | 5993 → 3114 | 5993 → 3114 | 0 → 0 | 0.000 → 0.028 | 331 → 244 | 607 → 827 | 20 → 27 |
| / | masaüstü | 91 → 92 | 1401 → 1407 (RC aralık 884-1457) | 1394 → 1306 | 1394 → 1306 | 0 → 0 | 0.000 → 0.003 | 305 → 211 | 607 → 936 | 20 → 27 |
| /rehber/tekstil-elektrik | mobil | 95 → 81 | 2355 → 3685 (RC aralık 2639-3696) | 2355 → 3685 | 2355 → 3685 | 0 → 0 | 0.003 → 0.003 | 158 → 180 | 322 → 242 | 12 → 11 |
| /rehber/tekstil-elektrik | masaüstü | 97 → 97 | 1013 → 920 (RC aralık 483-940) | 1013 → 894 | 1013 → 894 | 0 → 0 | 0.009 → **0.058** | 175 → 184 | 322 → 242 | 12 → 11 |
| /rehber | mobil | 92 → 94 | 2370 → 2486 (RC aralık 1585-3805) | 2370 → 2486 | 2370 → 2486 | 0 → 0 | **0.107 → 0.000** | 161 → 166 | 321 → 242 | 12 → 11 |
| /rehber | masaüstü | 97 → 96 | 993 → 915 (RC aralık 907-944) | 993 → 875 | 993 → 875 | 0 → 0 | 0.019 → **0.089** | 177 → 179 | 321 → 242 | 12 → 11 |
| /canli-ptf | mobil | 68 → 77 | 5126 → 4048 (RC aralık 3646-4894) | 5126 → 4048 | 5126 → 4065 | 0 → 0 | 0.010 → 0.001 | 1850 → 286 | 348 → 270 | 16 → 15 |
| /canli-ptf | masaüstü | 99 → 100 | 810 → 607 (RC aralık 604-627) | 810 → 607 | 810 → 607 | 0 → 0 | 0.008 → 0.006 | 268 → 273 | 348 → 270 | 16 → 15 |
| /elektrik-faturasi-hesaplama | mobil | 99 → 99 | 1632 → 1792 (RC aralık 1780-2699) | 1632 → 1792 | 1632 → 1792 | 0 → 0 | 0.016 → 0.033 | 197 → 211 | 344 → 247 | 14 → 11 |
| /elektrik-faturasi-hesaplama | masaüstü | 96 → 98 | 1059 → 938 (RC aralık 921-987) | 1059 → 938 | 1059 → 938 | 0 → 0 | 0.026 → 0.001 | 191 → 209 | 344 → 247 | 14 → 11 |
| /kurumsal | mobil | 95 → 99 | 2386 → 1747 (RC aralık 1722-2817) | 2386 → 1591 | 2386 → 1591 | 0 → 0 | 0.008 → 0.015 | 205 → 184 | 263 → 258 | 13 → 12 |
| /kurumsal | masaüstü | 97 → 98 | 958 → 929 (RC aralık 903-955) | 958 → 929 | 958 → 929 | 0 → 0 | 0.000 → 0.000 | 221 → 215 | 263 → 258 | 13 → 12 |

**3. tur: mobil, devtools kısıtlaması (gerçekten kısıtlanmış yükleme), 5 koşu medyanı:**

| Sayfa | Skor | LCP (ms) | FCP (ms) | Speed Index (ms) | TBT (ms) | CLS |
|---|---|---|---|---|---|---|
| / | 96 → 99 | **2516 → 1653** (RC aralık 1618–1701) | 1469 → 1300 | 1718 → 1778 | 93 → 74 | 0.004 → 0.028 |
| /rehber/tekstil-elektrik | 100 → 100 | 1304 → 1312 (1277–1334) | 1304 → 1312 | 1412 → 1380 | 0 → 0 | 0.003 → 0.003 |
| /rehber | 97 → 100 | 1324 → 1331 (1308–1358) | 1324 → 1331 | 1398 → 1405 | 0 → 3 | 0.107 → 0.000 |
| /kurumsal | 100 → 100 | 1317 → 1300 (1277–1317) | 1317 → 1300 | 1373 → 1353 | 0 → 0 | 0.008 → 0.015 |

**Gürültü notu:** benzetimli mobil değerler kümelenme gösteriyor (yaklaşık 1,6 / 2,35 / 2,65 / 3,1 / 3,7 / 5,9 sn). Bu, Lantern'in Google Fonts kaynağına bağlantıyı modellerken ürettiği basamaklardan geliyor. 1. turda aynı sayfada main mobil LCP 2,34–4,13 sn arasında oynadı. `/canli-ptf` mobil main'deki 1,7 sn TTFB, SSR'nin proxy'ye giden ilk isteğinden (önbellek ıskası) kaynaklanıyor; tasarımla ilgisi yok.

### 7.3 Değerlendirme

- **LCP, FCP, TBT, Speed Index: gerileme yok.** Benzetimde tekstil mobil LCP medyanı 2355 → 3685 ms görünüyor. Ancak (a) gözlenen LCP 158 → 180 ms (eşit), (b) devtools kısıtlamalı gerçek yüklemede 1304 → 1312 ms (eşit), (c) aynı kabuğu ve aynı HTML boyutunu taşıyan `/rehber` ve `/kurumsal` benzetimde de eşit ya da daha iyi. Bu fark bir Lantern yapaylığı, kullanıcıya yansıyan bir gerileme değil. Ana sayfa LCP'si gerçek kısıtlamalı yüklemede 2,52 → 1,65 sn ile **iyileşti**.
- **CLS: karışık.** Mobilde `/rehber` 0,107 → 0,000 (iyileştirme gerekir bölgesinden iyi bölgesine) ve `/canli-ptf` 1. turda 0,137 → 0,001. Mobil öncelikli dizinde bu net bir kazanım. **Masaüstünde** alt sayfa kabuğu geriliyor: `/rehber` 0,019 → 0,089 (7/7 koşu), tekstil 0,009 → 0,058 (7 koşunun 2'sinde 0,119). Kayan öğe her koşuda `main > div.sayfa-govde` ve içindeki paragraflar ya da kartlar; Lighthouse'un belirttiği neden "Web font loaded" (Archivo woff2). Ana sayfa mobilde 0,000 → 0,028 (`aside#ptfKart`, eşiğin çok altında). Bkz. N1.

## Notlar ve düzeltme tarifleri

### N1. Masaüstü alt sayfa CLS'si: Archivo font değişimi (Düşük-Orta, tek gerileme)

- **Kanıt:** 2. turda 7/7 koşuda `/rehber` masaüstü CLS 0,0892 (main 0,019). Kaynak `div.sayfa-govde > div.wrap > p > a` ve `.cards`, neden "Web font loaded" (`fonts.gstatic.com/s/archivo/v25/…woff2`). Tekstil masaüstü CLS medyanı 0,058, en kötü 0,119 (main 0,009). Yerel LH 12.6.1'de aynı tablo: rc `/rehber` 0,113, main 0,015.
- **Sebep:** yeni kabukta gövde metni `--sans: 'Archivo', -apple-system, 'Segoe UI', sans-serif` ile yazılıyor, `display=swap` geçerli. Font gelene kadar metin metrikleri farklı bir sistem fontuyla diziliyor (Linux'ta DejaVu Sans; Windows'ta Segoe UI), font gelince satırlar yeniden kırılıyor. Eski alt sayfalarda gövde Newsreader/Georgia ile yazılıyordu; yine bir kayma vardı ama daha küçüktü.
- **Ölçülen standart:** Core Web Vitals CLS "iyi" ≤ 0,1 (p75). Medyanlar eşiğin altında; tekstilde 2/7 koşu üstünde.
- **Asgari düzeltme (Webmaster):** metrikleri eşlenmiş bir yedek yüz tanımlanıp `--sans` yığınına Archivo'nun hemen arkasına eklenir. Değerler, Archivo woff2'nin (`fonts.gstatic.com/s/archivo/v25/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sLydOxKsv4Rn.woff2`: unitsPerEm 1000, typoAscender 878, typoDescender −210, lineGap 0) ve Arial ile metrik uyumlu Liberation Sans'ın aynı Türkçe örnek metin üzerindeki ortalama glif genişliği oranından hesaplandı:
  - Dosya: `docs/design/onizleme/yeni-tasarim/sayfalar/kabuk.css`. Bu yalnız alt sayfa kabuğunu etkiler; `index.html` değişmez, kural 4'e dokunulmaz. Dosyanın başına şu eklenir:
    ```css
    @font-face { font-family: 'Archivo Fallback'; src: local('Arial'), local('Liberation Sans'), local('Helvetica');
      size-adjust: 99.7%; ascent-override: 88.1%; descent-override: 21.1%; line-gap-override: 0%; }
    :root { --sans: 'Archivo', 'Archivo Fallback', -apple-system, 'Segoe UI', sans-serif; }
    ```
  - Ardından `docs/design/onizleme/yeni-tasarim/sayfalar/kur-sayfalar.py` ile 25 alt sayfa (+404) yeniden üretilir; içerik bölgeleri değişmez. CSP'ye etkisi yok (`local()` font, dış istek yok).
  - Başlık fontu (Newsreader, `.sayfa-bas h1`) LCP öğesi değil ve ölçümlerde kayma kaynağı olarak görünmedi; ona dokunulmaz.
- **Kabul ölçütü (QA):** LH 12.6.1 masaüstü, 7 koşu medyanı: `/rehber` ve `/rehber/tekstil-elektrik` için CLS ≤ 0,02 (main düzeyi) ve hiçbir koşu 0,1'in üstünde değil; mobil CLS'nin bugünkü düzeyi (≤ 0,005) bozulmamış; görsel karşılaştırmada font yüklendikten sonraki ekran görüntüsü bugünküyle aynı.
- **Ana sayfa:** mobil CLS 0,028 (`aside#ptfKart`) eşiğin çok altında; ana sayfa için değişiklik önerilmiyor. Önerilirse kural 4 gereği önce sahibin onayı gerekir.

### N2. Ana sayfa ağırlık bütçesi (Bilgi)

Ana sayfanın toplam aktarımı mobilde 607 → 827 KB, masaüstünde 607 → 936 KB; istek sayısı 20 → 27. LCP iyileştiği için gerileme sayılmadı. Bundan sonrası için bütçe önerisi: ana sayfa ≤ 1.000 KB masaüstü ve ≤ 900 KB mobil (Lighthouse toplam bayt), ≤ 30 istek; yeni bir görsel bu bütçeyi aşıyorsa sektör görsellerinden biri çıkarılır ya da sıkıştırılır.

### N3. Alt sayfa HTML'i iki katına çıktı (Bilgi)

Alt sayfa kabuk CSS'i her sayfaya satır içi gömülüyor (gzip ile yaklaşık 5 KB). `/canli-ptf` statik kabuğu brotli ile 16,2 KB; bu, ilk TCP penceresinin (yaklaşık 14,6 KB) üstünde ve teorik olarak bir ek gidiş-dönüş demek. Ölçümde bu etki görülmedi (masaüstü 810 → 607 ms, gözlenen 268 → 273 ms). Bugün işlem gerekmiyor. Alt sayfa sayısı ya da kabuk CSS'i büyürse ortak CSS'in önbelleğe alınabilir tek bir dosyaya taşınması değerlendirilir. Bu, render'ı engelleyen bir istek ekler; ölçmeden yapılmamalı.

### N4. Lantern yapaylığı: kovalanmasın (Bilgi)

Benzetimli mobil Lighthouse'ta tekstil rehberinin skoru 95 → 81 görünüyor. Devtools kısıtlamalı yüklemede iki ağaç eşit (100/100, LCP 1304 ↔ 1312 ms). İleride bu sayfada "skor düştü" alarmı gelirse önce devtools kısıtlamalı ölçüm alınmalı.

### N5. Önceden var olan ve bu sürümle değişmeyen durumlar (Bilgi, regresyon değil)

- hreflang yok, EN ayrı dizinlenemiyor (plan maddesi 3.5).
- "serbest tüketici" ana sayfa metninde geçmiyor (içerik fırsatı; SEO Director).
- `panel` önizlemede ilk X-Robots-Tag başlığı olarak `noindex` döndürüyor. Üretim hostunda kendi `noindex, nofollow, noarchive` değeri korunuyor (yerel taklitle doğrulandı); robots.txt ile de engelli.

## Yayın sonrası kontroller (Webmaster ve QA, main ileri alındıktan sonra 15 dakika içinde)

1. `curl -sI https://voltage.com.tr/`, `/rehber/tekstil-elektrik`, `/kurumsal`, `/canli-ptf`: 200 dönmeli, **X-Robots-Tag başlığı olmamalı**. `/canli-ptf` HTML'inde `<meta name="robots" content="noindex` olmamalı.
2. `curl -sI https://website-dh5.pages.dev/`: `X-Robots-Tag: noindex` olmalı (kasıtlı).
3. `curl -sI https://voltage.com.tr/img/kapak-1600.webp`: 200, `Cache-Control: public, max-age=86400, must-revalidate`.
4. `sitemap.xml` ana sayfa `lastmod` 2026-11-27; `robots.txt` ve `llms.txt` değişmemiş olmalı.
5. Search Console URL denetimi: `/` ve `/rehber/tekstil-elektrik` için "Canlı URL'yi test et": dizine eklenebilir, oluşturulan HTML'de H1 doğru. Bu adım seo-search-console tarafından yürütülür; sonuç satırları repoya yazılmaz.
6. 7 ve 28 gün sonra: seo-search-console ana sayfa ve rehberler için gösterim ve tıklama toplamlarını yayın öncesi aynı dönemle karşılaştırır. CrUX ya da GSC Core Web Vitals raporunda masaüstü CLS izlenir (N1 uygulanmadıysa öncelikli).

## İzlenebilirlik

- Geçici iş akışı commit'leri: 4f2cde2 (1. tur), 3a37f84 (2. tur), 225e747 (3. tur), cbee5b0 (silme). Koşular: 46007089328, 46008392277, 46009041250. Günlüklerde yalnız sayılar, durum kodları ve başlık değerleri var.
- Analiz betikleri ve ara çıktılar oturumun geçici çalışma dizinindeydi; repoya alınmadı.
