# GD-SEO-01 — Voltage Search Demand & SEO Opportunity Audit

**Tarama tarihi:** 23.09.2026
**Domain:** voltage.com.tr
**Hazırlayan:** Orkestratör (SEO birimi + Webmaster + QA + Hukuk & Uyum)
**Durum:** Audit + uygulama + doğrulama tamamlandı. Yayın QA ve Hukuk onayına bağlıdır (bkz. §15).

---

## Veri kuralları (bu raporun tamamı için)

- **Arama hacmi rakamı yoktur.** Elimizde Google Ads Keyword Planner, Semrush veya Ahrefs erişimi yok. Hacim sütunları bu yüzden `NOT VERIFIED` yazar. Göreli talep yorumu yalnızca SERP'teki rekabet yoğunluğundan çıkarılmıştır ve öyle etiketlenmiştir.
- **Pozisyonlar yalnızca Google Search Console'dan gelir.** Son GSC okuması 29.08.2026 tarihlidir (son 28 gün ortalaması). GSC'de görünmeyen her sorgu `NOT RANKING / NOT VERIFIED` olarak işaretlidir. Bu, "sıralamıyoruz" demek değildir; "doğrulanmış veri yok" demektir.
- **SERP gözlemi sınırlıdır.** Kullanılabilen web arama aracı ABD konumludur. Google TR'nin ilk 10'u, featured snippet, AI Overview ve People Also Ask kutuları bu araçla görülemez. Aşağıdaki SERP analizi, sorgu başına dönen alan adları ve sayfa türleri üzerinden yapılmıştır. Kişiselleştirilmemiş Google TR kontrolü sahibin tarayıcısından yapılmalıdır (§16).
- **Tarife fiyatları doğrulanamadı.** EPDK sitesi bu ortamdan erişilemiyor. İkincil kaynaklar 2026 mesken birim fiyatı, kademe yapısı ve KDV oranı konusunda birbiriyle çelişiyor (bir kaynak 0-240 kWh iki kademe, diğeri dört kademe; KDV için %10 ve %20 birlikte geçiyor). Bu yüzden hiçbir sayfaya tarife fiyatı gömülmedi.

Doğrulanmış düzenleyici veriler:

| Veri | Değer | Dayanak |
|---|---|---|
| Serbest tüketici limiti 2026 | 500 kWh/yıl | EPDK Kurul Kararı 14039, RG 23.12.2025 / 33116 |
| SKTT limiti 2026, mesken | 4.000 kWh/yıl (2025: 5.000) | EPDK Kurul Kararı 13912 (30.10.2025), RG 31.10.2025, yürürlük 01.01.2026 |
| SKTT limiti 2026, diğer | 15.000 kWh/yıl | aynı karar |
| SKTT başlangıcı | Limitin aşıldığı ayı izleyen üçüncü ayın ilk günü | aynı karar |
| Elektrik tüketim vergisi | Mesken ve ticarethane %5, sanayi %1 | birden çok bağımsız kaynakta tutarlı |

---

## 1. Executive Summary

Voltage'ın organik görünürlüğü **marka ve B2B rehber sorgularında** yoğunlaşmış durumda. Son GSC okumasında 28 günde 38 tıklama ve yaklaşık 1,19 bin gösterim var. Tıklamaların çoğu marka sorgularından ve tedarikçi değiştirme / sektör rehberlerinden geliyor.

Brief'in ana sorusu şuydu: insanlar gerçekte ne arıyor ve biz neredeyiz? Cevap üç parçalı:

1. **En büyük hacim tüketici fatura sorgularında** ("elektrik faturası hesaplama", "1 kWh kaç TL", "faturam neden yüksek geldi"). Bu SERP'ler hesaplama siteleri, haber siteleri ve görevli perakende şirketlerinin blogları tarafından tutuluyor. Voltage bu sorgularda **hiç görünmüyordu** (sayfa yoktu).
2. **En yüksek ticari değer B2B / yüksek tüketim sorgularında** ("SKTT", "son kaynak tedarik tarifesi", "serbest tüketici limiti", "tedarikçi değiştirme", "PTF endeksli"). Burada rakipler küçük tedarikçiler ve danışmanlar; SERP kazanılabilir. SKTT için hiç sayfamız yoktu. Oysa SKTT, kararsız yüksek tüketimli abonenin tedarikçi arayışına başladığı andır.
3. **Tüketici fatura trafiği, doğru köprüyle ticari trafiğe dönüşebilir.** Fatura hesaplayan kullanıcı yıllık tüketimini girdiğinde SKTT / serbest tüketici durumunu görür. Limit üstündeyse doğal bir sonraki adım bir tedarikçiyle konuşmaktır.

**Uygulanan:** 3 yeni URL (1 araç sayfası, 2 rehber), 4 mevcut sayfa güncellemesi, 1 schema uyum düzeltmesi, iç link, sitemap, önbellek kuralı, llms.txt ve OG kartları.

**Bilerek uygulanmayan:** tasarruf hesaplayıcı (şirket kuralı: sıfır tasarruf iddiası), "100 kWh kaç TL" türü programatik sayfalar (ince içerik ve kanibalizasyon), fatura sorgulama / ödeme sayfaları (bu niyet dağıtım ve görevli perakende şirketlerine ait).

---

## 2. Current Search Visibility

Kaynak: GSC, 29.08.2026 okuması (son 28 gün).

| Metrik | Değer |
|---|---|
| Tıklama | 38 |
| Gösterim | ~1,19 bin |
| Dizindeki sayfa | Ana sayfa, /canli-ptf, /kurumsal, rehber hub ve 11 rehber (URL denetimi yeni başlıkları doğruladı) |

Sayfa bazında ortalama pozisyon (GSC):

| Sayfa | Ort. pozisyon |
|---|---:|
| /rehber/tedarikci-degistirme | 5,7 |
| /rehber/tekstil-elektrik | 4,4 |
| / (ana sayfa) | 9,0 |
| /rehber/ptf-nedir | 11,7 |
| /rehber/serbest-tuketici | 13,1 |
| /canli-ptf | 13,2 |

**AI görünürlüğü:** ChatGPT, Perplexity ve Google AI Overview atıfları bu ortamdan ölçülemez. `llms.txt` güncel ve tüm rehberleri, aracı ve kurumsal kimliği listeliyor. Kurumsal sayfa ve Organization schema'sı lisans, sicil ve marka tescil numaralarını taşıyor. Ölçüm: `NOT VERIFIED`.

---

## 3. Keyword Universe

Hacim sütunu yoktur (bkz. veri kuralları). "Talep göstergesi", SERP'teki rakip yoğunluğundan çıkarılan niteliksel bir işarettir; rakam değildir.

| Küme | Örnek sorgular | Niyet | Talep göstergesi | Hedef URL |
|---|---|---|---|---|
| A. Fatura hesaplama | elektrik faturası hesaplama (2026), nasıl hesaplanır, hesaplama robotu | Araç / bilgi | Çok yüksek rekabet: 10+ hesaplama sitesi | /elektrik-faturasi-hesaplama |
| A. Yüksek fatura | faturam neden yüksek geldi, neden arttı, itiraz | Bilgi / sorun çözme | Yüksek: haber, perakende blogları, şikâyet siteleri | /rehber/elektrik-faturasi-neden-yuksek |
| A. Fatura kalemleri | elektrik faturası kalemleri | Bilgi | Orta: perakende ve tedarikçi blogları | /elektrik-faturasi-hesaplama (#kalemler) |
| A. Navigasyonel | elektrik faturası sorgulama, ödeme | Navigasyonel | Yüksek ama bize ait değil | **Hedeflenmez** |
| A. Fatura düşürme | elektrik faturası nasıl düşürülür | Bilgi | Yüksek: cihaz verimliliği içerikleri | **Hedeflenmez** (tasarruf iddiası riski) |
| B. Birim fiyat | 1 kWh kaç TL, kWh fiyatı, birim fiyat 2026 | Bilgi / araç | Çok yüksek | /elektrik-faturasi-hesaplama (#birim-maliyet) |
| B. kWh → TL | 100…5000 kWh kaç TL | Araç | Yüksek, uzun kuyruk | /elektrik-faturasi-hesaplama (#tahmini-fatura) |
| B. Tüketim hesaplama | elektrik tüketim hesaplama | Araç (cihaz bazlı) | Yüksek | **Hedeflenmez** (cihaz watt hesabı, ticari bağ zayıf) |
| C. Tedarikçi değiştirme | tedarikçi değiştirme, nasıl değiştirilir, şirket değiştirme | Ticari | Orta, kazanılabilir | /rehber/tedarikci-degistirme |
| C. Tedarikçi arama | elektrik tedarikçisi, sanayi / fabrika / işletme tedarikçisi | Ticari / transactional | Orta: listeler ve tedarikçi siteleri | / (ana sayfa) + sektör rehberleri |
| C. "Ucuz" | ucuz elektrik tedarikçisi | Ticari | Orta | **Hedeflenmez** (fiyat iddiası riski) |
| D. Serbest tüketici | serbest tüketici nedir, limiti, 2026 limiti, nasıl olunur | Bilgi → ticari | Orta | /rehber/serbest-tuketici |
| E. SKTT | SKTT nedir, son kaynak tedarik tarifesi 2026, SKTT limiti, SKTT'den nasıl çıkılır | Bilgi → ticari (yüksek) | Orta: perakende siteleri, danışmanlar, hukuk blogları | **/rehber/sktt (yeni)** |
| E. SKTT hesaplama | SKTT hesaplama 2026 | Araç | Düşük-orta | /elektrik-faturasi-hesaplama (#statu) + /rehber/sktt |
| F. PTF bilgi | PTF nedir, PTF elektrik, gün öncesi piyasası | Bilgi | Orta | /rehber/ptf-nedir |
| F. PTF veri | PTF bugün, PTF fiyatları, saatlik elektrik fiyatları | Veri / navigasyonel | Orta: EPİAŞ ve veri siteleri | /canli-ptf |
| F. PTF endeksli | PTF endeksli elektrik (nedir) | Ticari bilgi | Düşük-orta | /rehber/ptf-nedir (#yeni H2) |

---

## 4. SERP Analysis

Yöntem: ABD konumlu web arama aracıyla sorgu başına dönen alan adları ve sayfa türleri. Google TR'ye özgü özellikler (featured snippet, AI Overview, PAA, related searches, video, haber, reklam yoğunluğu) **NOT VERIFIED**.

| Sorgu | Baskın sonuç türü | Gözlenen alan adları (örnek) | Çıkarım |
|---|---|---|---|
| elektrik faturası hesaplama 2026 | Hesaplama siteleri | forelektrik, piagrid, hesapmatik, aydinlatma.org, hemenhesap, hesapsonuc, yetkilielektrikcim, powerenerji | Sabit tarifeli hesaplayıcılar ilk sayfayı tutuyor. Kaynaklar birbiriyle çelişen tarife rakamları veriyor. Farklılaşma: kullanıcının **kendi faturasıyla** çalışan, tarife uydurmayan araç. |
| 1 kWh elektrik kaç TL 2026 | Haber + hesaplama | donanimhaber, aydinlatma.org, forelektrik, piagrid, solaravm | Aynı çelişki. Tek bir "doğru rakam" vermek yerine "faturanızdan hesaplayın" yaklaşımı hem dürüst hem ayırt edici. |
| elektrik faturam neden yüksek geldi | Haber, perakende blogu, şikâyet | hurriyet, aydemperakende, sikayetvar, faturakilavuzu, gazelektrik | İçeriklerin çoğu cihaz / alışkanlık odaklı. **Fiyat kaynaklı nedenler** (tarife güncellemesi, kademe, SKTT, reaktif, endeksli sözleşme) zayıf işleniyor: fırsat. |
| SKTT nedir / nasıl çıkılır | Perakende şirketleri, tedarikçi blogları, hukuk | gedizperakende, epdk.gov.tr, kepsas, trepas, vtcenerji, hukukcularevi, viessmann | Bazı sonuçlar **eski 5.000 kWh limitini** hâlâ gösteriyor. Güncel ve kaynaklı sayfa için açık fırsat. |
| PTF endeksli elektrik nedir | Küçük tedarikçi blogları | gelkaenerji, zenergy, selenkaenerji, minasenerji, dengedegerleme | Rakiplerin bir kısmı "endeksli daha düşük maliyet sağlar" gibi iddialar içeriyor. Biz karşılaştırmayı iddiasız tabloyla verdik. |
| elektrik tedarikçileri (sanayi) | Liste siteleri, EPDK | enerjiatlasi, akillitarife, apollo.eco, epdk.gov.tr | Liste siteleri baskın. Bazı sonuçlar kapanmış encazip.com sayfalarını hâlâ gösteriyor (arama indeksinin eski kopyası). |
| elektrik faturası kalemleri | Tedarikçi ve perakende blogları | eceenerji, elektraenerji, akillitarife, oepsas | Orta rekabet. Araç sayfasındaki kalemler bölümü bu niyeti karşılar. |

---

## 5. Current Voltage Rankings

Kaynak: GSC 29.08.2026. Diğer tüm satırlar `NOT RANKING / NOT VERIFIED`.

| Sorgu | Voltage ort. pozisyonu | Sıralayan URL |
|---|---:|---|
| voltan elektrik | 2,2 | / |
| voltan | 4,6 | / |
| elektrik serbest tüketici limiti 2026 | 9,2 | /rehber/serbest-tuketici |
| elektrik tedarikçi değiştirme | 10,3 | /rehber/tedarikci-degistirme |
| ptf | 18,5 | /canli-ptf, /rehber/ptf-nedir |
| serbest tüketici | 50,3 | /rehber/serbest-tuketici |
| elektrik faturası hesaplama | NOT RANKING / NOT VERIFIED | (sayfa yoktu) |
| 1 kWh elektrik kaç TL | NOT RANKING / NOT VERIFIED | (sayfa yoktu) |
| elektrik faturası neden yüksek gelir | NOT RANKING / NOT VERIFIED | (sayfa yoktu) |
| SKTT nedir / son kaynak tedarik tarifesi | NOT RANKING / NOT VERIFIED | (sayfa yoktu) |
| PTF endeksli elektrik | NOT RANKING / NOT VERIFIED | — |
| voltage elektrik | NOT VERIFIED | Aynı adı taşıyan bir taahhüt firması öne çıkıyor; /kurumsal bunun için kuruldu |

---

## 6. Competitor Analysis

Voltage'ın organik rakipleri iki gruba ayrılıyor. Kurumsal rakip listesiyle aynı değildir.

| Grup | Örnek | Güçlü yanı | Zayıf yanı / bizim açımız |
|---|---|---|---|
| Hesaplama siteleri | forelektrik, piagrid, hesapmatik, hemenhesap, aydinlatma.org | Araç + çok sayıda uzun kuyruk sayfası, sık güncelleme | Tarife rakamları kaynaksız ve birbirleriyle çelişik. Lisanslı tedarikçi değiller. |
| Görevli perakende şirketleri | gedizperakende, aydemperakende, kepsas, trepas, oepsas | Resmî konum, marka otoritesi | Kendi tarifelerini anlatır. Tedarikçi değiştirmeyi teşvik etmezler. |
| Küçük tedarikçiler / danışmanlar | gelkaenerji, zenergy, selenkaenerji, vtcenerji, minasenerji | B2B rehber içerikleri | İnce içerik, kaynaksız iddialar, eski limitler. |
| Liste / karşılaştırma | enerjiatlasi, akillitarife | Geniş kapsam | Tedarik hizmeti vermezler. |

Backlink ve otorite karşılaştırması bu ortamda yapılamaz (Ahrefs / Semrush yok): `NOT VERIFIED`.

---

## 7. Content Gap

| Boşluk | Önce | Sonra |
|---|---|---|
| SKTT için sayfa | Yoktu, yalnızca serbest tüketici rehberinde bir paragraf | /rehber/sktt |
| Fatura hesaplama / birim maliyet | Yoktu | /elektrik-faturasi-hesaplama (3 araç) |
| Yüksek fatura nedenleri (fiyat kaynaklı) | Yoktu | /rehber/elektrik-faturasi-neden-yuksek |
| PTF endeksli ve sabit fiyat karşılaştırması | ptf-nedir içinde dağınık | ptf-nedir'e ayrı H2, tablo ve SSS |
| Serbest tüketici rehberinde 4.000 kWh tanımı | "SKTT'den ayrı destekli tarife kademe sınırı" | Karar 13912'ye dayalı SKTT mesken limiti olarak düzeltildi (Hukuk onayına işaretli) |
| Kurumsal sayfa SSS | Schema'da vardı, sayfada görünmüyordu | Görünür SSS eklendi, schema ile birebir |

---

## 8. Search Intent Map

| Niyet | Kullanıcı | Sayfa | Dönüşüm adımı |
|---|---|---|---|
| "Faturam ne kadar olur / 1 kWh kaç TL" | Mesken, küçük işletme | /elektrik-faturasi-hesaplama | Araç 3 ile SKTT / serbest tüketici durumu → "Faturamı Analiz Ettir" |
| "Faturam neden yüksek" | Mesken, işletme | /rehber/elektrik-faturasi-neden-yuksek | Fiyat kaynaklı neden → SKTT rehberi → analiz talebi |
| "SKTT nedir / nasıl çıkarım" | Yüksek tüketimli mesken, ticarethane, sanayi | /rehber/sktt | "SKTT Analizi İste" |
| "Serbest tüketici miyim" | İşletme | /rehber/serbest-tuketici | Tedarikçi değiştirme rehberi → teklif |
| "Tedarikçi nasıl değiştirilir" | İşletme | /rehber/tedarikci-degistirme | Teklif talebi |
| "PTF / PTF endeksli" | Enerji yöneticisi, sanayi | /rehber/ptf-nedir, /canli-ptf | Teklif talebi |
| "Voltage / Voltan kimdir" | Marka araması | /kurumsal, / | Güven → teklif |

---

## 9. Topic Cluster Architecture

```
Rehber hub (/rehber)
├─ Tedarik ve mevzuat kümesi
│  ├─ /rehber/serbest-tuketici  (pillar: serbest tüketici)
│  ├─ /rehber/sktt              (YENİ, pillar: SKTT)
│  ├─ /rehber/tedarikci-degistirme
│  └─ /rehber/osb-elektrik-tedariki
├─ Fatura kümesi
│  ├─ /elektrik-faturasi-hesaplama   (YENİ, araç)
│  └─ /rehber/elektrik-faturasi-neden-yuksek (YENİ)
├─ Piyasa kümesi
│  ├─ /rehber/ptf-nedir  (+ PTF endeksli bölümü)
│  └─ /canli-ptf         (veri)
└─ Sektör kümesi (tekstil, demir-çelik, kimya, veri merkezi, soğuk zincir, cam-seramik, yenilenebilir)
```

Kanibalizasyon kontrolü: serbest-tuketici "tedarikçi seçme hakkı ve 500 kWh" niyetine, sktt "limit aşımında uygulanan tarife ve çıkış" niyetine hizmet eder. İki sayfa birbirine bağlanır ve farklı başlık / H1 taşır.

---

## 10. Technical SEO Audit

| Kontrol | Sonuç |
|---|---|
| JSON-LD geçerliliği (tüm sayfalar) | Geçti |
| FAQPage schema ↔ görünür SSS | **Hata bulundu:** /kurumsal'da 4 soru schema'da vardı ama sayfada yoktu (Google yönergesine aykırı). Düzeltildi. |
| İç link kırığı | 0 |
| Sitemap | Geçerli XML, 21 URL (3 yeni). Değişen 4 sayfanın lastmod'u güncellendi. |
| Canonical / og:url / breadcrumb | Yeni sayfalarda tutarlı, temiz URL |
| H1 | Her yeni sayfada 1 |
| Başlık / meta uzunluğu | Başlıklar 64-75, meta açıklamalar 149-170 karakter |
| Mobil (375 px) yatay taşma | Yok (yeni ve değişen 6 sayfa test edildi) |
| Araç JS hataları | Yok (Playwright, masaüstü ve mobil) |
| Önbellek | /elektrik-faturasi-hesaplama için 300 sn + revalidate kuralı eklendi. Rehberler mevcut /rehber/* kuralını kullanıyor. |
| robots.txt | Yeni URL'ler engellenmiyor |
| Önceden bilinen, açık konu | voltan.* alan adları Cloudflare'de "Verifying" durumunda. 301 yönlendirmesi alan adları aktif olunca devreye girer. |

---

## 11. Conversion Opportunities

- **Araç 3 → SKTT köprüsü:** Limit üstündeki kullanıcıya SKTT rehberi ve analiz CTA'sı gösterilir.
- **Araç 1 → Araç 2 aktarımı:** Kullanıcı kendi birim maliyetini bir kez girer, tüm tüketim seviyelerini görür.
- **Tasarruf yerine analiz:** CTA'lar "Faturamı Analiz Ettir" ve "SKTT Analizi İste". Tasarruf yüzdesi veya tutarı yok.
- **Ölçüm önerisi (Analytics'e):** Araç etkileşimi ve CTA tıklaması için olay takibi henüz yok. §16'da.

---

## 12. Recommended URL Architecture

| URL | Durum | Gerekçe |
|---|---|---|
| /elektrik-faturasi-hesaplama | **Oluşturuldu** | Kök düzeyde araç. Aranan ifadeyle birebir, kısa. |
| /rehber/sktt | **Oluşturuldu** | Rehber kümesinde, serbest-tuketici'nin kardeşi |
| /rehber/elektrik-faturasi-neden-yuksek | **Oluşturuldu** | Sorun çözme niyeti |
| /elektrik-fiyati/100-kwh … /5000-kwh | **Reddedildi** | Aynı içeriğin sayı değiştirilmiş kopyaları olurdu (ince içerik). Doğrulanmış tarife olmadan rakam da veremezler. Tek araç sayfası tüm seviyeleri tablo olarak veriyor. |
| /serbest-tuketici/ (ayrı hub) | **Reddedildi** | /rehber/serbest-tuketici ile kanibalizasyon |
| /tasarruf-hesaplama | **Reddedildi** | Sıfır tasarruf iddiası kuralı |
| /elektrik-faturasi-sorgulama, /odeme | **Reddedildi** | Navigasyonel niyet; kullanıcı dağıtım / görevli perakende şirketini arıyor |
| /elektrik-tuketim-hesaplama (cihaz bazlı) | **Ertelendi** | Talep var ama ticari bağ zayıf. İleride değerlendirilebilir. |

Mevcut URL'lerin hiçbiri değiştirilmedi.

---

## 13. Priority Matrix

| Fırsat | Öncelik | Durum |
|---|---|---|
| SKTT rehberi | HIGH | Yapıldı |
| Fatura hesaplama aracı (tarifesiz) | HIGH | Yapıldı |
| Serbest tüketici rehberindeki 4.000 kWh tanımının düzeltilmesi | HIGH | Yapıldı, Hukuk onayında |
| /kurumsal görünür SSS | HIGH | Yapıldı |
| Yüksek fatura rehberi | MEDIUM | Yapıldı |
| PTF endeksli bölümü | MEDIUM | Yapıldı |
| Doğrulanmış EPDK tarifesiyle araca "referans tarife" katmanı | MEDIUM | Bekliyor (veri) |
| GSC'de yeni URL'lerin dizine gönderimi | HIGH | Sahip tarafı (§16) |
| Araç olay takibi | MEDIUM | Bekliyor |
| Cihaz bazlı tüketim hesaplayıcı | LOW | Ertelendi |
| EN sürümleri | LOW | Ertelendi (rehberler şu an yalnız TR) |

---

## 14. Implementation Plan

1. Araştırma: SERP türleri, düzenleyici veri doğrulaması, mevcut içerik taraması. ✔
2. Mimari: kümeler, URL kararları, kanibalizasyon kontrolü. ✔
3. Sayfalar: rehber şablonu birebir kullanıldı (tasarım sistemi korunarak). ✔
4. Araçlar: istemci tarafı, tarife gömülmeden, Türkçe sayı biçimi. ✔
5. Schema: Breadcrumb + Article / WebApplication + görünür SSS ile birebir FAQPage. ✔
6. İç link: hub kartları ve bağlamsal linkler. ✔
7. Teknik: sitemap, _headers, llms.txt, OG kartları. ✔
8. Doğrulama: JSON-LD, link, sitemap, mobil, tarayıcı testleri. ✔
9. QA + Hukuk incelemesi → düzeltme → main'e yayın. (§15)

---

## 15. Implemented Changes

| Dosya | Değişiklik |
|---|---|
| elektrik-faturasi-hesaplama.html | **Yeni.** Araç 1: fatura toplamı ÷ kWh = gerçek TL/kWh, isteğe bağlı kalem dağılımı. Araç 2: aynı birim maliyetle 100-5.000 kWh tahmini tutar ve kademe uyarısı. Araç 3: serbest tüketici (500) ve SKTT (4.000 / 15.000) durum kontrolü. Fatura kalemleri tablosu, tarife kaynağı (EPDK), SSS. WebApplication + FAQPage schema. |
| rehber/sktt.html | **Yeni.** 2026 limit tablosu, Karar 13912, başlangıç zamanı, fiyatlama mantığı, iki çıkış yolu, SKTT ve serbest tüketici farkı, SSS. |
| rehber/elektrik-faturasi-neden-yuksek.html | **Yeni.** Tüketim kaynaklı ve fiyat kaynaklı nedenler, kontrol listesi, itiraz yolları, SSS. |
| rehber/serbest-tuketici.html | 4.000 kWh paragrafı Karar 13912'ye dayalı SKTT limiti olarak yeniden yazıldı, /rehber/sktt'ye link. |
| rehber/ptf-nedir.html | "PTF endeksli elektrik nedir, sabit fiyattan farkı ne?" H2 + karşılaştırma tablosu + 1 SSS (schema'ya da eklendi). |
| kurumsal.html | Schema'daki 4 SSS görünür hâle getirildi. |
| rehber.html | 3 yeni hub kartı. |
| rehber/tedarikci-degistirme.html | Araca bağlamsal link. |
| sitemap.xml, _headers, llms.txt | 3 URL, önbellek kuralı, rehber ve araç girdileri. |
| og/*.jpg | 3 yeni paylaşım kartı. |

Tarayıcı testi (Playwright, 1280 px ve 375 px): 38/38 kontrol geçti. Doğrulama sırasında bulunan hata: Araç 1'den Araç 2'ye aktarılan birim maliyet 2 haneye yuvarlanıyordu; 1.000 kWh'te 3 TL sapma yapıyordu. Tam hassasiyetle aktarılacak şekilde düzeltildi.

### İnceleme turu (QA + Hukuk & Uyum)

| Bulgu | Kaynak | Karar |
|---|---|---|
| Tam 500 kWh "serbest tüketici" sayılıyordu (6446 md. 3: "daha fazla") | QA + Hukuk | Düzeltildi |
| 1. araç geçersizleşince 2. araç eski birim maliyetle tablo göstermeye devam ediyordu | QA | Düzeltildi |
| "Vergiler tedarikçiden bağımsız, aynı kalır" ifadesi: oranlar sabit ama tutarlar enerji bedeliyle değişir | Hukuk | Düzeltildi |
| SKTT testi "son 12 ay" diye anlatılıyordu; sonuç kesin dille veriliyordu | Hukuk + QA | Takvim yılı esası, başlangıç zamanı ve "olabilir" dili |
| Araç çıktısında feragat yoktu (ekran görüntüsü teklif gibi okunabilirdi) | Hukuk | "Teklif veya taahhüt değildir" notu eklendi |
| "Mesken tarifesi kademelidir" doğrulanmamış veri | Hukuk + QA | Koşullu dile çevrildi |
| İtiraz yolları eksikti | Hukuk | Düzenleyen şirket, dağıtım şirketi, EPDK, tüketici hakem heyeti (6502) |
| Sabit fiyat "garanti" gibi okunuyordu | Hukuk | Sözleşme istisnaları eklendi |
| serbest-tuketici H2 "SKTT nedir?" yeni sayfayla çakışıyordu | QA | H2 yeniden adlandırıldı |
| Kurumsal SSS'deki lisans tarihi ve marka no. "doğrulanmamış" | Hukuk | **Reddedildi:** bu oturumda TÜRKPATENT kaydı ve lisans bilgisi doğrulanmıştı; kimlik tablosunda zaten yayında |
| SKTT'nin PTF tabanlı olduğu ifadesi | QA | **Korundu:** mevcut yayındaki rehberle ve Hukuk değerlendirmesiyle tutarlı |

---

## 16. Remaining Work

**Sahip tarafı (bizim yapamayacağımız):**

- GSC → URL Denetimi → 3 yeni URL için "Dizine eklenmesini iste".
- GSC'de 4 hafta sonra yeni sorguların ilk pozisyon okuması (bu rapor için karşılaştırma tabanı §5).
- Kişiselleştirilmemiş Google TR SERP kontrolü (gizli pencere): featured snippet, AI Overview ve PAA gözlemi.
- Doğrulanmış EPDK tarife tablosu (PDF) paylaşılırsa araca "referans tarife" katmanı eklenir.
- Hukuk: serbest-tuketici rehberindeki 4.000 kWh tanımı değişikliğinin avukat tarafından teyidi.
- voltan.* alan adlarının Cloudflare doğrulaması.

**Ekip tarafı:**

- Araç kullanımı ve CTA tıklaması için olay takibi (Analytics).
- Arama hacmi için Keyword Planner erişimi sağlanırsa bu raporun §3'ü rakamlarla güncellenir.
- EN sürümleri (düşük öncelik).
