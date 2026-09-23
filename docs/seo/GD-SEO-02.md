# GD-SEO-02 — Growth & Ranking Acceleration

**Tarih:** 23.09.2026
**Domain:** voltage.com.tr
**Hazırlayan:** Orkestratör (seo-competitor-intel, QA, Hukuk & Uyum)
**Durum:** Analiz + uygulama + doğrulama tamamlandı. QA: RELEASE. Hukuk & Uyum: CLEAR WITH CHANGES (uygulandı). 23.09.2026'da main'e yayınlandı.

Ek dosyalar:
- `GSC-8-20-WAR-ROOM.md`
- `CTR-OPTIMIZATION-MAP.md`
- `KEYWORD-OWNERSHIP-MAP.md`
- `COMPETITOR-GAP-ANALYSIS.md`
- `QUERY-TO-CONVERSION-MAP.md`
- `GSC-EXPORT-PROMPT.md`

---

## Veri durumu (önce okuyun)

- **`GSC DATA UNAVAILABLE` (güncel).** Bu ortamda GSC bağlayıcısı, API erişimi veya dışa aktarım dosyası yok. Kullanılabilen tek gerçek veri, sahibin Chrome eklentisiyle 29.08.2026'da okuduğu GSC ekranıdır.
- **Veri aralığı:** Mülkte veri 03.08.2026'da başlıyor. Okuma 03.08–27.08 (25 gün) aralığını kapsıyor. "Son 28 gün / önceki 28 gün" ve "90 gün" karşılaştırmaları **yapılamaz**: önceki dönem 0. GD-SEO-01 bu aralığı "son 28 gün" diye yazmıştı; düzeltildi.
- **Kapsam:** Anlık görüntüde 84 sorgunun ilk 20'si ve 18 sayfanın ilk 10'u var. Sorgu×sayfa kırılımı yok. Sorguların sıraladığı URL'ler konu eşleşmesinden çıkarıldı ve **NOT VERIFIED** işaretlidir.
- **Arama hacmi:** yok, uydurulmadı.
- **Güncel pozisyon:** bilinmiyor, iddia edilmiyor.

---

## 1. Executive Summary

Phase 2, Google'ın zaten gösterim verdiği yerlere odaklandı. Gösterimlerin %72'si dört sayfada toplanıyor:

| Sayfa | Gösterim | Ort. poz. |
|---|---:|---:|
| /canli-ptf | 275 | 13,2 |
| /rehber/tedarikci-degistirme | 217 | 5,7 |
| /rehber/serbest-tuketici | 176 | 13,1 |
| /rehber/ptf-nedir | 140 | 11,7 |

Ana sayfa ayrıca 276 gösterim aldı; ağırlıklı olarak marka aramalarından.

Bu dört sayfada, 8–20 bandındaki sorgulara göre başlık, H1, ilk paragraf, içerik derinliği, iç bağlantı ve CTA düzenlendi. Yeni URL açılmadı. Veri, kanıtın yeni sayfa açmayı desteklemediğini gösterdi (§14).

En önemli bulgular:
1. **En çok gösterim alan sayfa (/canli-ptf) iç bağlantıda en zayıflardan biriydi:** 18 sayfadan yalnızca 5'i bağlanıyordu. 8'e çıkarıldı. Sayfaya taranabilir, tarihli günlük özet (sunucu tarafında) eklendi.
2. **/rehber/ptf-nedir** 140 gösterimde 0 tıklama aldı; aynı pozisyon bandındaki sayfaların belirgin altında. Başlık, meta ve "bugünün PTF'si" yönlendirmesi düzenlendi. SMF karşılaştırması derinleştirildi.
3. **Serbest tüketici sayfası** yıla bağlı sorguda 9,2'de, yılsız limit sorgusunda 54'te. Cevap en üste alındı, doğrulanmış 2020–2026 tarihçesi eklendi, başlık limit niyetine çevrildi.
4. **tedarikci-degistirme** sayfasında sorgunun birebir ifadesi başlıkta yoktu; eklendi. Sayfa ortalaması 5,7 olduğu için H1 korundu.

Dürüst değerlendirme: toplam veri 25 günlük ve 1,19 bin gösterim. Değişikliklerin etkisi ancak 2–4 hafta sonra, `GSC-EXPORT-PROMPT.md` ile alınacak yeni okumayla ölçülebilir.

---

## 2. GSC Baseline

Kaynak: GSC, 03.08–27.08.2026.

| Metrik | Değer |
|---|---:|
| Tıklama | 38 |
| Gösterim | 1.190 |
| CTR | %3,2 |
| Ortalama pozisyon | 10,4 |
| Sorgu sayısı | 84 |
| Sayfa sayısı (gösterim alan) | 18 |
| Dizinde (Indexing, 21.08) | 18 dizinde / 9 dizinde değil |
| Ülke | Türkiye 1.025 gösterim ve 37 tıklama |
| Cihaz | Masaüstü 667 gösterim (poz. 12,7), mobil 521 gösterim (poz. 7,4) |

Dizinde olmayan sayfaların sebepleri: 5 × 404, 2 × yönlendirme, 1 × robots engeli, 1 × alternatif kanonik. 404 ve yönlendirme listesi ekranda yoktu; §12'ye bakın.

---

## 3. GSC Opportunity Queries

| Query | Clicks | Impr. | CTR | Pos. | Landing Page (çıkarım) | Type | Action |
|---|---:|---:|---:|---:|---|---|---|
| voltan | 0 | 53 | %0 | 4,6 | / | E Brand | Koru. "Voltan" başka markalarca da kullanılıyor. |
| ptf | 0 | 33 | %0 | 18,5 | /canli-ptf | B High Opportunity | Uygulandı |
| elektrik tedarikçi değiştirme | 0 | 22 | %0 | 10,3 | /rehber/tedarikci-degistirme | B | Uygulandı |
| voltag | 0 | 19 | %0 | 10,0 | / | E Brand | Koru |
| voltan elektrik | 2 | 18 | %11,1 | 2,2 | / | E Brand | Koru |
| elektrik serbest tüketici limiti 2026 | 0 | 12 | %0 | 9,2 | /rehber/serbest-tuketici | A/B | Uygulandı |
| ptf şeffaflık | 0 | 11 | %0 | 7,8 | /canli-ptf | A Quick Win (navigasyonel) | Uygulandı |
| serbest tüketici | 0 | 10 | %0 | 50,3 | /rehber/serbest-tuketici | >40 (otorite açığı) | Dolaylı |
| serbest tüketici limiti | 0 | 8 | %0 | 54,0 | /rehber/serbest-tuketici | >40 | Başlık öne alındı |
| ptf nedir | 0 | 7 | %0 | 20,3 | /rehber/ptf-nedir | B/C sınır | Uygulandı |
| piyasa takas fiyatı | 0 | 6 | %0 | 27,7 | /rehber/ptf-nedir | C Emerging | Uygulandı (dolaylı) |
| gün öncesi piyasası elektrik fiyatları | 0 | 5 | %0 | 19,2 | /canli-ptf | B | Uygulandı |
| ptf smf | 0 | 5 | %0 | 36,4 | /rehber/ptf-nedir | C | Uygulandı |
| piyasa takas fiyatı tahmini ptf | 0 | 5 | %0 | 52,8 | — | F | Tahmin yayımlamıyoruz; hedeflenmez |
| epdk tedarikçi değiştirme | 1 | 4 | %25 | 7,5 | /rehber/tedarikci-degistirme | A | Mevzuat bloğu Hukuk'ta |
| günlük ptf fiyatları | 0 | 4 | %0 | 20,5 | /canli-ptf | B/C sınır | Uygulandı |
| serbest tüketici limit | 0 | 4 | %0 | 51,8 | /rehber/serbest-tuketici | >40 | Dolaylı |
| veri merkezi enerji verimliliği | 0 | 4 | %0 | 87,2 | /rehber/veri-merkezi-elektrik | F | Hedeflenmez |
| voltes enerji | 0 | 3 | %0 | 8,7 | / | F (başka marka) | — |
| elektrik sağlayıcı değiştirme | 0 | 3 | %0 | 10,0 | /rehber/tedarikci-degistirme | B | Uygulandı |

Kalan 64 sorgu: **NOT VERIFIED** (ekranda yoktu).

**D (Discovery):** Marka dışı hiçbir sorguda tıklama yok. Sorgu başına gösterim 3–33 olduğu için sorgu düzeyinde CTR kıyası anlamsız. Kıyas sayfa düzeyinde yapıldı (§5).

---

## 4. 8–20 War Room

Ayrıntı `GSC-8-20-WAR-ROOM.md` dosyasında. Özet:

| Query | Pos. | Durum |
|---|---:|---|
| ptf | 18,5 | IMPLEMENTED |
| elektrik tedarikçi değiştirme | 10,3 | IMPLEMENTED (takvim Hukuk'ta) |
| elektrik serbest tüketici limiti 2026 | 9,2 | IMPLEMENTED |
| gün öncesi piyasası elektrik fiyatları | 19,2 | IMPLEMENTED |
| elektrik sağlayıcı değiştirme | 10,0 | IMPLEMENTED |
| ptf nedir | 20,3 | IMPLEMENTED |
| günlük ptf fiyatları | 20,5 | IMPLEMENTED |
| voltag | 10,0 | Marka, değişiklik yok |
| voltes enerji | 8,7 | İlgisiz |

## 5. CTR Opportunities

Ayrıntı `CTR-OPTIMIZATION-MAP.md` dosyasında. Benzer pozisyondaki sayfalar arasındaki kıyas:

| Sayfa | CTR | Pozisyon |
|---|---:|---:|
| /rehber/serbest-tuketici | %4,0 | 13,1 |
| /canli-ptf | %2,2 | 13,2 |
| /rehber/ptf-nedir | %0 | 11,7 |

Bu kıyasa göre canli-ptf ve ptf-nedir başlık ve meta adayıydı. Dört sayfanın başlık ve metası değişti. Marka başlığına dokunulmadı.

## 6. Cannibalization Audit

| Çift | Risk | Karar |
|---|---|---|
| /canli-ptf ↔ /rehber/ptf-nedir, "ptf" sorgusunda | Orta | Niyete göre ayrıştırıldı: veri ↔ tanım. Başlıklar ayrıştı, karşılıklı bağlantı ve yönlendirme eklendi. Birleştirme veya yönlendirme yapılmadı; iki sayfa farklı niyetlere hizmet ediyor ve ikisi de gösterim alıyor. Sorgu×sayfa verisiyle yeniden kontrol edilecek. |
| /rehber/serbest-tuketici ↔ /rehber/sktt | Düşük | Phase 1'de H2 yeniden adlandırılmıştı. İkisi de birbirine bağlanıyor. |
| /elektrik-faturasi-hesaplama ↔ /rehber/elektrik-faturasi-neden-yuksek | Düşük | Araç ↔ sorun çözme niyeti. |
| Eş anlamlılar ("elektrik şirketi / sağlayıcı değiştirme") | — | Ayrı sayfa açılmadı. /rehber/tedarikci-degistirme'de toplandı. |

## 7. Keyword Ownership Map

Ayrıntı `KEYWORD-OWNERSHIP-MAP.md` dosyasında. Her küme için tek birincil URL belirlendi.

## 8. Competitor Gap Analysis

Ayrıntı `COMPETITOR-GAP-ANALYSIS.md` dosyasında. **Sınır:** rakip sayfaları açılamadı; ağ politikası engelledi. Bulgular SERP başlık ve snippet'lerine dayanıyor.

Uygulanan açık kapatmaları:
- Serbest tüketici tarihçesi
- Şeffaflık bağlantısı
- Tarihli günlük özet
- SMF tablosu
- Belge listesi
- Bayat atıflar

Doğrulama bekleyenler:
- DUY geçiş takvimi
- SKTT KBK değerleri
- Azami fiyat limiti
- GÖP saatleri

## 9. Content Gap

| Tier | Konu | Karar |
|---|---|---|
| 1 (gösterim var) | PTF–SMF farkı (36,4) | Mevcut sayfada tablo olarak kapatıldı. Ayrı sayfa Phase 3 adayı. |
| 1 | Günlük PTF verisi | Mevcut sayfada özet. Çok günlü seri Phase 3 (proxy uç noktası gerekir). |
| 1 | Tedarikçi değiştirme takvimi | Hukuk doğrulaması bekliyor. |
| 2 | SKTT formülü ve KBK | Doğrulama bekliyor. |
| 2 | Tedarikçi lisans doğrulama (EPDK lisans sorgusu) | Phase 3. |
| 3 | Cihaz bazlı tüketim hesaplama | Reddedildi (ticari bağ zayıf). |

## 10. Internal Linking Opportunities

Gelen iç bağlantı sayısı (404 sayfası dâhil, tüm HTML sayfalar):

| Sayfa | Önce | Sonra | Eklenen kaynaklar |
|---|---:|---:|---|
| /canli-ptf | 5 | 8 | rehber hub kartı, demir-çelik, OSB |
| /rehber/serbest-tuketici | 10 | 11 | hesaplama |
| /rehber/tedarikci-degistirme | 13 | 14 | canli-ptf |
| /rehber/sktt | 4 | 5 | tedarikci-degistirme |
| /elektrik-faturasi-hesaplama | 5 | 6 | serbest-tuketici |
| /rehber/elektrik-faturasi-neden-yuksek | 2 | 3 | sktt |

Yetim sayfa yok. Ana sayfaya bağlantı eklenmedi, çünkü ana sayfa tasarımı onaysız değiştirilmez.

## 11. Conversion Map

Ayrıntı `QUERY-TO-CONVERSION-MAP.md` dosyasında. Yeni CTA metinleri:
- "Tedarikçi Değişikliği İçin Teklif Alın"
- "PTF Endeksli Tedarik Hakkında Bilgi Alın" (canli-ptf ve ptf-nedir)

Tasarruf ifadesi yok.

## 12. Technical SEO Findings

| Kontrol | Sonuç |
|---|---|
| Kanonik, robots, og:url (19 sayfa, önce/sonra) | Değişmedi |
| H1 | Her sayfada 1 |
| JSON-LD | Tümü geçerli. Tüm FAQPage'ler görünür SSS ile birebir. Article headline ve breadcrumb yeni H1 ile eşlendi. |
| Kırık iç bağlantı | 0 |
| Çapa hedefleri (#ptf-endeksli, #statu) | Mevcut |
| Sitemap | Geçerli XML, 21 URL. Değişen 5 sayfanın lastmod'u güncellendi. |
| Trailing slash | Temiz URL; kanonikler slash'sız ve tutarlı. |
| Yönlendirme zinciri | `_redirects` tek adımlı (www ve voltan.* → kök, /index.html → /). Zincir yok. |
| Mobil (375 px) ve masaüstü | Değişen 11 sayfada yatay taşma yok, JS hatası yok. CTA'lar görünür. |
| SSR | test-ssr-ptf 69/69 (17 yeni test). Veri yoksa özet basılmaz ve CSS ile gizlenir. Veri günü bugünle eşleşmezse veya gün bilgisi yokken saat 00:00–00:59 arasındaysa özet basılmaz. |
| Core Web Vitals | Bu ortamdan ölçülemez (canlı siteye erişim yok) — NOT VERIFIED |
| GSC Indexing: 5 × 404, 2 × yönlendirme | URL listesi ekranda yoktu. `GSC-EXPORT-PROMPT.md` 6. adımı bu listeyi istiyor. Eski site URL'leri çıkarsa 301 eklenir. |
| GSC Sitemaps "Temporary processing error" (29.08) | Sitemap geçerli. Sahip GSC'de yeniden gönderebilir. |
| robots.txt | Değişiklik gerekmedi. |

## 13. Changes Implemented

| Değişiklik | Neden (kanıt) |
|---|---|
| serbest-tuketici başlık, H1, meta | Limit sorguları 24 gösterim, çıplak sorgu 10; 2026 sorgusu 9,2'de |
| serbest-tuketici kısa cevap kutusu | Cevap 3. paragraftaydı |
| serbest-tuketici 2020–2026 tablosu | SERP'teki haber ve EPDK sayfalarına karşı tarihçe; değerler AA ve EPİAŞ duyurularıyla doğrulandı |
| serbest-tuketici 2 SSS | En çok aranan soru ve uygunluk sorusu |
| canli-ptf başlık, H1, meta | "günlük ptf fiyatları" (20,5), CTR %2,2 < %4,0 |
| canli-ptf SSR tarihli özet | "gün öncesi piyasası elektrik fiyatları" SERP'inde tarihli özetler kazanıyor |
| canli-ptf Şeffaflık bölümü ve bağlantısı | "ptf şeffaflık" 7,8; bağlantı yoktu |
| ptf-nedir başlık, meta, bugünün PTF yönlendirmesi | 140 gösterim / 0 tıklama |
| ptf-nedir SMF tablosu | "ptf smf" 36,4; SERP zayıf |
| ptf-nedir bayat atıflar → /canli-ptf | Sayfa artık olmayan bir yapıyı gösteriyordu |
| tedarikci-degistirme başlık, meta, eş anlamlılar, bilgi listesi, SSS | 10,3 ve 10,0; rakip snippet'leri belge listesi veriyor |
| tedarikci-degistirme vergi cümlesi | GD-SEO-01'de Hukuk'un düzelttiği ifadeyle tutarlılık |
| 6 yeni bağlamsal iç bağlantı ve hub kartı | Otorite akışı (§10) |
| sitemap lastmod, llms.txt | Tazelik sinyali |
| GD-SEO-01 veri aralığı düzeltmesi | Rapor "son 28 gün" diyordu, gerçekte 03.08–27.08 |

## 14. Pages Created

**Yok.** Değerlendirilen ve açılmayan sayfalar:
- **/rehber/ptf-smf-farki:** 5 gösterim var. Mevcut sayfada tablo olarak kapatıldı. Gösterim artarsa Phase 3'te açılır, ptf-nedir'deki bölüm özet ve bağlantıya indirilir.
- **Programatik "100 / 200 / 300 / 500 / 1000 kWh elektrik kaç TL":** Ayrı niyet farkı yok, hepsi aynı hesap. Doğrulanmış tarife olmadan her sayfa ya boş ya da uydurma rakam içerir. Doorway riski var. Tek araç sayfası tüm seviyeleri veriyor.
- **Eş anlamlı sayfalar** ("elektrik şirketi değiştirme"): kanibalizasyon riski.

## 15. Pages Modified

| URL | Değişiklik öncesi başlık | Sonrası |
|---|---|---|
| /rehber/serbest-tuketici | Serbest Tüketici Nedir? 2026 Limiti 500 kWh \| Voltage Enerji | Serbest Tüketici Limiti 2026: 500 kWh — Serbest Tüketici Nedir? |
| /canli-ptf | Saatlik PTF Fiyatları — Bugünkü Gün Öncesi Elektrik Fiyatı \| Voltage | Günlük PTF Fiyatları: Bugünün Saatlik Gün Öncesi Elektrik Fiyatı |
| /rehber/ptf-nedir | PTF Nedir? Piyasa Takas Fiyatı Nasıl Oluşur? \| Voltage | PTF Nedir? Piyasa Takas Fiyatı Nasıl Oluşur, SMF'den Farkı Ne? |
| /rehber/tedarikci-degistirme | Elektrik Tedarikçisi Nasıl Değiştirilir? Süreç Rehberi 2026 | Elektrik Tedarikçisi Değiştirme: Nasıl Yapılır, Ne Kadar Sürer? |
| /rehber, /elektrik-faturasi-hesaplama, /rehber/sktt, /rehber/demir-celik-elektrik, /rehber/osb-elektrik-tedariki | — | Yalnızca iç bağlantı veya hub kartı |

H1 değişiklikleri:
- **serbest-tuketici:** "Serbest Tüketici Nedir? 2026 Limiti ve Anlamı" → "Serbest Tüketici Nedir? 2026 Serbest Tüketici Limiti: 500 kWh"
- **canli-ptf:** eski başlıkla aynı olan H1 → "Günlük PTF Fiyatları — Bugünün Saatlik Gün Öncesi Elektrik Fiyatı"
- **ptf-nedir** ve **tedarikci-degistirme:** H1 korundu.

Değişiklik öncesi durumun tam kaydı (başlık, meta, kanonik, H1, schema türleri, bağlantılar): commit `edecfde`. Önce/sonra karşılaştırması §17'de.

## 16. Pages Merged / Redirected

**Yok.** Birleştirme veya yönlendirme gerektiren kanibalizasyon bulunmadı. Tek orta risk (canli-ptf ↔ ptf-nedir) niyet ayrıştırmasıyla ele alındı.

## 17. QA Results

| Test | Sonuç |
|---|---|
| Önce/sonra SEO regresyonu (19 sayfa) | 0 regresyon. Kanonik, robots ve og:url değişmedi. Hiçbir bağlantı veya schema türü kaybolmadı. |
| JSON-LD, SSS senkronu, H1, kırık bağlantı, sitemap | 0 sorun |
| test-ssr-ptf.mjs | 69 / 69 |
| test-ssr-hydration.mjs | Çalıştırılamadı: `playwright` paketi bu ortamda yok; değişiklikten önce de aynı hata. Hidrasyon tarayıcı testinde ayrıca doğrulandı: SSR özeti istemci JS'i tarafından silinmiyor. |
| Tarayıcı: 11 sayfa × 2 görünüm | 50 / 50: taşma yok, JS hatası yok, CTA görünür |
| Hesaplama aracı regresyonu | 46 / 46 |
| QA ajanı (commit 3e5172c) | **RELEASE.** 0 engelleyici, 8 düşük veya orta bulgu. Hepsi kapatıldı (aşağıda). QA ayrıca 320 px görünümü ve kısmi gün SSR senaryosunu test etti. |
| Hukuk & Uyum ajanı (commit 3e5172c) | **CLEAR WITH CHANGES.** 3 yayın öncesi zorunlu, 4 kısa vadeli, 2 tavsiye maddesi. Hepsi uygulandı; bir tanesinde gerekçeli sapma var (aşağıda). |
| Düzeltmeler sonrası yeniden doğrulama | Regresyon 0, JSON-LD ve SSS senkronu 0 sorun, kırık bağlantı 0, SSR 69/69, tarayıcı 50/50, hesaplama 46/46 |

### İnceleme bulguları ve kararlar

| Bulgu | Kaynak | Karar |
|---|---|---|
| SSR özeti sunucu saatiyle tarihleniyor; gece yarısı önbellek penceresinde dünün serisi bugünün tarihiyle basılabilir | Hukuk #2, QA D1 | **Düzeltildi, gerekçeli sapmayla.** Veri kendi gününü taşıyorsa eşleşme zorunlu. Hukuk, gün bilgisi yoksa hiç basılmamasını önerdi. Proxy'nin sözleşmesinde gün alanı yok ve o repo kapsam dışı. Bu durumda özet yalnızca 00:00–00:59 aralığında basılmıyor; bu tampon bilinen önbellek pencerelerinin (120 + 300 sn) üzerinde. Saatlik tablo da aynı "bugün" varsayımıyla çalışıyor. Kalıcı çözüm Phase 3'te: proxy'ye `date` alanı. |
| Özet cümlesi hesaplanan değerleri EPİAŞ yayını gibi gösteriyor | Hukuk #2 | Düzeltildi: "…Voltage Enerji tarafından bu veriden hesaplanmıştır." |
| 2023 satırı kaynaksız | Hukuk #1 | Düzeltildi. Karar numarası için kaynaklar çelişiyor (11496 / 11497); numara yazılmadı, kaynak bağlantısı verildi. 2021 satırına RG sayısı eklendi. |
| "Tedarikçi değiştirmek SKTT'den çıkmanın doğrudan yoludur" | Hukuk #3 | Düzeltildi: görevli tedarik şirketi dâhil herhangi bir lisanslı tedarikçiyle ikili anlaşma. |
| Vergi cümlesi kaynaksız ve "orantılı" ifadesi yanlış | Hukuk #4 | Düzeltildi: 2464 ve 3065 sayılı Kanunlar. Aynı ifade Phase 1'de hesaplama sayfasına da girmişti; orada da düzeltildi. |
| Dengeleme ve Uzlaştırma Yönetmeliği tarihsiz | Hukuk #5 | Düzeltildi: RG 14.04.2009, sayı 27200. |
| Birim çevrimi örneği güncel fiyat gibi okunabilir | Hukuk #6, QA D7 | Düzeltildi: "varsayımsal"; tedarikçi maliyet bileşenleri eklendi. |
| canli-ptf "Bu sayfa hakkında" tarihi eski | Hukuk #7, QA D2 | Düzeltildi. |
| Serbest tüketici uygunluk cevabı eksik | Hukuk #8 | Düzeltildi: 6446 md. 3, e-Devlet girişli EPİAŞ portalı. |
| EPİAŞ veri yeniden yayım şartları | Hukuk #9 | Risk kaydında kalıyor. Özet yeni risk eklemiyor; sayfa düzeyinde şartların okunması gerekiyor. |
| WebPage JSON-LD açıklaması eski | QA D3 | Düzeltildi. |
| ptf-nedir'de tablo CSS'i yok | QA D4 | Düzeltildi; boş başlık hücresi `td`. |
| "Elektrik Tedarikçi Değiştirme" ek eksik, 68 karakter | QA D5 | Düzeltildi: "Elektrik Tedarikçisi Değiştirme: Nasıl Yapılır, Ne Kadar Sürer?" (63). |
| demir-çelik bağlantı cümlesi fiilsiz | QA D6 | Düzeltildi. |
| rehber, demir-çelik ve OSB tarihleri senkronsuz | QA D8 | Düzeltildi. dateModified, "güncelleme" satırı ve sitemap eşlendi. |

**Elle kontrol edilecek dış bağlantılar** (ağ engeli nedeniyle burada açılamadı):
- tuketici.epias.com.tr
- Tablodaki AA ve EPİAŞ duyuruları
- Erdem & Erdem makalesi
- Resmî Gazete 23.12.2025 sayfası
- Şeffaflık PTF raporu

## 18. Remaining Opportunities

- **Güncel GSC okuması.** `GSC-EXPORT-PROMPT.md` ile, 07.10.2026'dan sonra. Sorgu×sayfa kırılımı "ptf" kanibalizasyon kararını doğrular veya değiştirir.
- **404 ve yönlendirme URL listesi.** GSC'den alınacak. Eski site URL'lerine 301 eklenecek.
- **Hukuk doğrulaması bekleyenler:** DUY geçiş takvimi, mevzuat dayanağı bloğu, SKTT KBK değerleri.
- **Energy Market doğrulaması bekleyenler:** GÖP saatleri, azami fiyat limiti.
- **Proxy'ye `date` alanı.** /ptf/today yanıtı verinin gününü taşımalı; SSR özeti o zaman tam eşleşmeyle çalışır.
- **EPİAŞ yeniden yayım şartları.** Hukuk risk kaydı; güncel şartların okunması.
- **Çok günlü PTF serisi.** Dün, yarın, 7 ve 30 gün. epias-proxy'de uç nokta gerekir; o repo bu çalışmanın kapsamı dışında.
- **Serbest tüketici genel terimi (50+).** İçerik değil otorite sorunu. Bağlantı kazanımı `LINK-KAZANIM-PLANI.md` üzerinden.
- **Ana sayfa meta açıklaması 219 karakter.** SERP'te kesilir. Ana sayfa tasarımı kanonik olduğu için sahibin onayına bırakıldı.

## 19. Recommended Phase 3

1. Güncel GSC verisiyle bu raporun 3–5. bölümlerini yeniden kur ve pozisyon deltasını ölç.
2. Doğrulama bekleyen dört içerik bloğunu uzman onayından geçirip yayımla.
3. /canli-ptf'yi çok günlü veri sayfasına dönüştür. Voltage'ın kendi verisi, taklit edilemez varlığı.
4. "ptf smf" gösterimi artarsa ayrı PTF–SMF rehberini aç.
5. EPİAŞ ve EPDK kaynaklarına atıf yapan sektör yayınlarından bağlantı kazan (serbest tüketici genel terimi için otorite).

---

## KPI Baseline

| KPI | Baseline (03.08–27.08.2026) | Phase 2 Result |
|---|---:|---:|
| Clicks | 38 | NOT VERIFIED |
| Impressions | 1.190 | NOT VERIFIED |
| CTR | %3,2 | NOT VERIFIED |
| Average Position | 10,4 | NOT VERIFIED |
| Queries | 84 | NOT VERIFIED |
| Queries Position 1–3 | ≥1 (ilk 20'de 1; tam dağılım NOT VERIFIED) | NOT VERIFIED |
| Queries Position 4–10 | ≥7 (ilk 20'de) | NOT VERIFIED |
| Queries Position 11–20 | ≥3 (ilk 20'de) | NOT VERIFIED |
| Indexed Pages | 18 (21.08) | NOT VERIFIED |
| Commercial Landing Pages | 18 (teklif CTA'lı sayfa) | 18 |

## TOP 20 SEO OPPORTUNITIES

Sıralama ölçütü: gösterim × ticari değer × pozisyon yakınlığı × CTR açığı. Hacim kullanılmadı.

| # | Query | Current Position | Impressions | URL | Opportunity | Action |
|---:|---|---:|---:|---|---|---|
| 1 | elektrik tedarikçi değiştirme | 10,3 | 22 | /rehber/tedarikci-degistirme | 1. sayfa sınırında, en yüksek ticari niyet | Başlık, eş anlamlılar, bilgi listesi — IMPLEMENTED |
| 2 | elektrik serbest tüketici limiti 2026 | 9,2 | 12 | /rehber/serbest-tuketici | 1. sayfada, ilk 3'e aday | Kısa cevap, tarihçe, başlık — IMPLEMENTED |
| 3 | ptf | 18,5 | 33 | /canli-ptf | En yüksek marka dışı gösterim | Başlık, SSR özet, iç bağlantı — IMPLEMENTED |
| 4 | epdk tedarikçi değiştirme | 7,5 | 4 | /rehber/tedarikci-degistirme | Tek marka dışı tıklama; ilk 3'e aday | Mevzuat bloğu — Hukuk'ta |
| 5 | gün öncesi piyasası elektrik fiyatları | 19,2 | 5 | /canli-ptf | Tarihli özet açığı | SSR özet — IMPLEMENTED |
| 6 | elektrik sağlayıcı değiştirme | 10,0 | 3 | /rehber/tedarikci-degistirme | Eş anlamlı | IMPLEMENTED |
| 7 | ptf nedir | 20,3 | 7 | /rehber/ptf-nedir | 0 tıklama / 140 sayfa gösterimi | Başlık, meta, yönlendirme — IMPLEMENTED |
| 8 | günlük ptf fiyatları | 20,5 | 4 | /canli-ptf | Başlık uyumsuzluğu | IMPLEMENTED |
| 9 | ptf şeffaflık | 7,8 | 11 | /canli-ptf | Navigasyonel; atıf fırsatı | Şeffaflık bölümü — IMPLEMENTED |
| 10 | piyasa takas fiyatı | 27,7 | 6 | /rehber/ptf-nedir | C bandı | Dolaylı (başlık, tablo) — IMPLEMENTED |
| 11 | ptf smf | 36,4 | 5 | /rehber/ptf-nedir | Zayıf SERP | Tablo — IMPLEMENTED; ayrı sayfa Phase 3 |
| 12 | serbest tüketici limiti | 54,0 | 8 | /rehber/serbest-tuketici | Otorite açığı | Başlık öne alındı; bağlantı kazanımı Phase 3 |
| 13 | serbest tüketici | 50,3 | 10 | /rehber/serbest-tuketici | Otorite ve mesken niyeti | Bağlantı kazanımı Phase 3 |
| 14 | serbest tüketici limit | 51,8 | 4 | /rehber/serbest-tuketici | #12 ile aynı küme | Aynı |
| 15 | osb elektrik (sayfa düzeyi) | 7,6 | 22 (sayfa) | /rehber/osb-elektrik-tedariki | Yüksek MWh; 0 tıklama | Sorgu verisi gerekli — NOT VERIFIED |
| 16 | demir-çelik elektrik (sayfa düzeyi) | 8,0 | 24 (sayfa) | /rehber/demir-celik-elektrik | Yüksek MWh | Canlı PTF bağlantısı — IMPLEMENTED |
| 17 | tekstil elektrik (sayfa düzeyi) | 4,4 | 35 (sayfa) | /rehber/tekstil-elektrik | Kazanan; koru | Değişiklik yok |
| 18 | voltan elektrik | 2,2 | 18 | / | Marka | Koru |
| 19 | voltan / voltag | 4,6 / 10,0 | 53 / 19 | / | Marka, belirsiz terim | Koru |
| 20 | SKTT kümesi | NOT RANKING / NOT VERIFIED | — | /rehber/sktt | Sayfa 23.09'da yayında; dizin durumu bilinmiyor | GSC'de dizin talebi |

## TOP 10 NEXT ACTIONS

1. **Optimize /rehber/tedarikci-degistirme.** Sorgu "elektrik tedarikçi değiştirme", ~10,3. Neden: 1. sayfa sınırında ve en ticari sorgu. Mekanizma: başlık ve sorgu eşleşmesi, eş anlamlı kapsamı, içerik derinliği. **Status: IMPLEMENTED**
2. **Optimize /rehber/serbest-tuketici.** Sorgu "elektrik serbest tüketici limiti 2026", ~9,2. Neden: 1. sayfada. Mekanizma: cevabın en üste alınması (snippet adayı), doğrulanmış tarihçe tablosu, limit odaklı başlık. **Status: IMPLEMENTED**
3. **Optimize /canli-ptf.** Sorgular "ptf" 18,5 ve "günlük ptf fiyatları" 20,5. Neden: sitenin en çok gösterim alan sayfası. Mekanizma: başlık, taranabilir tarihli SSR özeti, iç bağlantı 5 → 8. **Status: IMPLEMENTED**
4. **Optimize /rehber/ptf-nedir.** Neden: 140 gösterim / 0 tıklama. Mekanizma: CTR (başlık, meta), veri niyetine yönlendirme, SMF derinliği. **Status: IMPLEMENTED**
5. **Güncel GSC okuması al.** Neden: Phase 2'nin etkisini ölçmek ve sorgu×sayfa kanıtı. Hedef: tüm site. Mekanizma: ölçüm. **Status: PENDING (sahip, 07.10.2026 sonrası, `GSC-EXPORT-PROMPT.md`)**
6. **Yeni URL'ler için dizin talebi.** URL'ler: /rehber/sktt, /elektrik-faturasi-hesaplama, /rehber/elektrik-faturasi-neden-yuksek. Mekanizma: dizine girme. **Status: PENDING (sahip, GSC)**
7. **Tedarikçi değiştirme takvimi ve mevzuat bloğu.** Neden: "epdk tedarikçi değiştirme" 7,5 ve rakiplerin bayat takvimleri. Hedef: /rehber/tedarikci-degistirme. Mekanizma: içerik derinliği ve otorite. **Status: BLOCKED — Hukuk doğrulaması**
8. **404 URL'lerine 301.** Neden: GSC'de 5 × 404. Hedef: `_redirects`. Mekanizma: bağlantı değerini kurtarma. **Status: PENDING (URL listesi GSC'den)**
9. **Çok günlü PTF serisi.** Neden: rakip veri sayfaları çok dönemli veri veriyor. Hedef: /canli-ptf. Mekanizma: içerik benzersizliği. **Status: PHASE 3 (epias-proxy uç noktası gerekir)**
10. **SKTT formülü ve KBK değerleri.** Neden: görevli şirket SERP'leri formülü veriyor. Hedef: /rehber/sktt. Mekanizma: içerik derinliği. **Status: BLOCKED — Hukuk / Energy Market doğrulaması**
