# VOLTAGE ENERJİ — KURUCU ANAHTAR KELİME HARİTASI (v1)

**Hazırlayan:** seo-keyword-research (Seviye 4) · **Rapor edilen:** SEO Direktörü
**Tarih:** 2026-07-27 · **Kapsam:** voltage.com.tr (TR birincil; EN seti ayrı fazda)
**Plan hizası:** AUDIT-2026-06-10-180-DAY-PLAN.md — madde 2.3 (ilk 6 içerik sayfası),
2.6 (mesken kapısı), yasak #3 (ücretli edinim yok) ve #4 (mesken tasarruf vaadi yok)

---

## 0. Metodoloji ve veri etiketleme

- **Hacim/zorluk aracı yok.** Bu haritadaki hiçbir arama hacmi sayısal değildir;
  talep tahminleri **nitel** (Yüksek/Orta/Düşük) olup gerekçelendirilmiştir.
  GSC verisi henüz mevcut değil (site tek sayfa, içerik yayını yok); yayın
  sonrası doğrulama seo-search-console üzerinden yapılacak.
- **Canlı SERP doğrulaması yapıldı** (WebSearch, 2026-07-27): serbest tüketici
  limiti, tedarikçi değiştirme, PTF, sanayi/OSB fiyat ve marka sorguları için
  sonuç sayfası şekli ve rakip ayak izi gözlemlendi. Kaynaklar her kümede
  tarihiyle belirtilmiştir.
- **Doğrulanmış piyasa gerçekleri** (içerik briefe girecek, Pricing/Legal
  onayı olmadan sayfada sayı yayınlanmaz — duran yasak #6):
  - 2026 serbest tüketici limiti: **yıllık 500 kWh** (2025'te 750 kWh idi).
    Kaynak: EPDK Kurul Kararı, Resmî Gazete 23.12.2025 sayı 33116; AA, GENSED
    (SERP doğrulaması 2026-07-27).
  - 2026 mesken kademe sınırı: **4.000 kWh/yıl** (5.000'den indirildi);
    ~%6'lık yüksek tüketimli mesken grubu (≈2,5 mn abone) destek dışı.
    Kaynak: CNN Türk, DonanımHaber haberleri (Kasım-Aralık 2025; SERP
    doğrulaması 2026-07-27). → Mesken "de-sübvanse kama" tam bu gruptur.
  - Marka SERP'i: voltage.com.tr #1; encazip tedarikçi profili, Crunchbase,
    elektrikpaketleri firma kaydı ilk sayfada. Lisans no ETS/3424-8/2074
    üçüncü taraf sayfalarda görünüyor (SERP doğrulaması 2026-07-27).
- **MWh ağırlıklı öncelik ilkesi:** bir sorgunun değeri arkasındaki MWh'tir.
  Tek bir "OSB elektrik tedariki" araması, binlerce genel fatura aramasından
  değerlidir. Öncelik sırası buna göredir, ham talebe göre değil.

**Mevcut hedef yüzeyler:** `/` (tek sayfa; çapalar: `#hizmetler`, `#simulator`,
`#yaklasim`, `#hakkimizda`, `#iletisim`+form), `/kvkk`, `/cerez-politikasi`,
`/kullanim-kosullari`. Sayfada sahiplenilmiş sektörler: OSB, tekstil,
demir-çelik, kimya, soğuk zincir, cam, veri merkezi.

---

## 1. Küme A — Ticari B2B (en yüksek MWh ağırlığı)

**Niyet:** ticari/işlemsel. **Huni aşaması:** alt huni → teklif formu.
**MWh önceliği: 1/5 (en yüksek).** Tek dönüşüm ≈ yıllık GWh mertebesinde yük.
**Talep:** Düşük-Orta hacim (nitel tahmin; niş B2B sorgular doğası gereği az
aranır) × çok yüksek sorgu başına değer.

**SERP gözlemi (2026-07-27):** "sanayi elektrik fiyatları / OSB elektrik birim
fiyatı" sorgularında OSB'lerin kendi tarife sayfaları (BOSB, EOSB, OSTİM,
HOSAB) ve karşılaştırma portalları (piagrid) dönüyor; **hiçbir tedarikçi bu
SERP'te sektör-spesifik ticari sayfayla güçlü değil** — açık boşluk.

| Anahtar kelime + çekimli/soru biçimleri | Huni | Talep (nitel) | Hedef sayfa | Not |
|---|---|---|---|---|
| osb elektrik tedariki · osb'de elektrik nereden alınır · osb katılımcısı tedarikçi değiştirebilir mi · osb elektrik birim fiyatı 2026 | Alt | Düşük-Orta | **YENİ:** `/osb-elektrik-tedariki` | OSB SERP'i OSB'lerin kendi siteleriyle dolu; açı: "OSB tarifesi vs ikili anlaşma karşılaştırması" |
| fabrika elektrik tedariki · fabrikalar için elektrik anlaşması · yüksek tüketimli tesis elektrik | Alt | Düşük | `/osb-elektrik-tedariki` + `/#iletisim` | Ayrı sayfa açma — OSB sayfası kapsar (kanibalizasyon önlemi) |
| sanayi elektrik fiyatları · sanayi elektriği kaç tl · sanayi elektrik birim fiyatı 2026 · orta gerilim elektrik fiyatı | Orta-Alt | Orta | **YENİ:** `/sanayi-elektrik-fiyatlari` (2. dalga) | Fiyat sayısı yayını Pricing+Legal onayına tabi; onaysız sürümde metodoloji + simülatör CTA |
| kurumsal elektrik teklifi · kurumsal elektrik tedarikçileri · ikili anlaşma elektrik teklifi al | Alt | Düşük | `/` (ana sayfa title zaten hedefliyor) + form | Ana sayfanın birincil sorgu seti; yeni sayfa AÇMA — kanibalizasyon riski |
| tekstil fabrikası elektrik maliyeti · tekstilde enerji maliyeti · iplik/boyahane elektrik tüketimi | Orta-Alt | Düşük | **YENİ:** `/tekstil-elektrik` | Sektör kartından iç link |
| demir çelik elektrik tüketimi · ark ocağı elektrik maliyeti · döküm tesisi elektrik tedariki | Orta-Alt | Düşük | **YENİ:** `/demir-celik-elektrik` | En yüksek MWh/tesis sektörü; PTF saatlik profil açısı güçlü |
| kimya tesisi elektrik · soğuk hava deposu elektrik tüketimi · cam fabrikası enerji maliyeti · veri merkezi elektrik tedariki | Orta-Alt | Düşük | **YENİ:** sektör sayfaları (2.-3. dalga) | Şablon = tekstil/çelik sayfası; kartlardan link |

**Kanibalizasyon notu (küme geneli):** Ana sayfa "kurumsal + endüstriyel
tedarikçi" jenerik setini tutar; sektör sayfaları yalnızca `sektör + elektrik`
uzun kuyruğunu alır. Sektör sayfaları ana sayfadaki sektör kartlarından
`<a>` ile bağlanmalı (şu an kartlar link değil — seo-onpage'e not).

---

## 2. Küme B — Uygunluk / Eğitim (serbest tüketici)

**Niyet:** bilgi → değerlendirme. **Huni:** üst-orta; simülatörü ve formu besler.
**MWh önceliği: 2/5.** YMYL otorite temelini kurar; B2B karar vericisi de bu
sorgularla araştırmaya başlar. **Talep:** Yüksek (nitel tahmin; gerekçe: limit
kararı ulusal haber oldu — AA, CNBC-e, Milli Gazete aynı SERP'te).

**SERP gözlemi (2026-07-27):** "serbest tüketici limiti 2026" SERP'i haber
siteleri + enerjisa/encazip/piagrid rehberleriyle dolu; "tedarikçi nasıl
değiştirilir" SERP'inde tedarikçi blogları (gazelektrik, elektraenerji,
minasenerji) ve encazip var. Rekabet orta; güncellik (2026 rakamı) ve
adım-adım süreç sayfasıyla girilebilir.

| Anahtar kelime + soru biçimleri | Huni | Talep | Hedef sayfa | Not |
|---|---|---|---|---|
| serbest tüketici nedir · serbest tüketici limiti 2026 · serbest tüketici nasıl olunur · 500 kwh limiti ne demek · serbest tüketici hakkı sorgulama | Üst | Yüksek | **YENİ:** `/serbest-tuketici-2026` | "nedir" + "limiti 2026" TEK sayfada (bölüm başlıklarıyla) — ikiye bölmek kanibalizasyon yaratır; yıllık güncellenen kalıcı URL değil, `-2026` yıllı URL + her yıl yeni sayfa yerine **kalıcı `/serbest-tuketici` + yıl bölümü** tercih edilir; nihai karar seo-strategy'nin |
| elektrik tedarikçisi nasıl değiştirilir · tedarikçi değiştirme süreci · elektrik şirketi değiştirmek ne kadar sürer · tedarikçi değiştirince sayaç değişir mi · elektrik kesilir mi | Orta | Orta-Yüksek | **YENİ:** `/tedarikci-degistirme` | PAA tipi sorular (sayaç, kesinti, süre) H2 olarak; formda biten süreç anlatımı — plan 2.3'ün açık isteği |
| ikili anlaşma nedir · ikili anlaşma elektrik · sabit fiyatlı elektrik anlaşması · endeksli elektrik anlaşması | Orta | Orta | `/tedarikci-degistirme` içinde bölüm; hacim doğrulanırsa 2. dalgada ayrı `/ikili-anlasma-nedir` | Ayrı açılırsa değiştirme sayfasıyla kanibalizasyon izlenmeli |
| son kaynak tedarik tarifesi nedir · sktt nedir | Orta | Düşük-Orta | `/serbest-tuketici-2026` içinde bölüm | Kademe/de-sübvansiyon bağlamıyla kesişir — mesken kapısına dikkat |

---

## 3. Küme C — Piyasa Verisi (PTF/EPİAŞ) — canlı ticker'ın kazanabileceği alan

**Niyet:** bilgi + tekrarlayan veri kontrolü. **Huni:** üst; ama izleyici kitlesi
profesyonel (enerji yöneticileri, mali işler) → dolaylı B2B değeri yüksek.
**MWh önceliği: 3/5.** **Talep:** "PTF nedir" Orta, "güncel PTF" Orta-Yüksek ve
**tekrarlayan** (nitel tahmin; gerekçe: günlük fiyat kontrol davranışı).

**SERP gözlemi (2026-07-27):** "PTF nedir" SERP'i tedarikçi blogları (zenergy,
gelka, zeros, minas) + encazip; "güncel PTF" tarafında enerjiatlasi.com/epias/ptf
ve myenerji veri sayfaları kazanıyor. **Voltan'ın canlı PTF ticker'ı (epias-proxy
worker) buradaki tek gerçek farklılaştırıcı varlık** — rakip blogların çoğu
statik metin.

| Anahtar kelime + soru biçimleri | Huni | Talep | Hedef sayfa | Not |
|---|---|---|---|---|
| ptf nedir · piyasa takas fiyatı nedir · ptf nasıl hesaplanır/oluşur · ptf neden yükselir | Üst | Orta | **YENİ:** `/ptf-nedir` (canlı ticker gömülü) | Açıklayıcı + canlı veri kombinasyonu; audit 1.4 dürüstlük düzeltmeleri (jitter kaldırma, fallback etiketi) ÖN KOŞUL — sahte canlılıkla bu SERP'e çıkılmaz |
| güncel ptf · bugünkü elektrik fiyatı ptf · epiaş ptf · ptf smf fiyatları · saatlik elektrik fiyatları | Üst (tekrarlayan) | Orta-Yüksek | `/ptf-nedir` v1'de aynı sayfa; hacim GSC'de doğrulanırsa 3. dalgada ayrı `/guncel-ptf` canlı sayfası | Ayrışma öncesi tek sayfa = kanibalizasyon yok; ayrışma sonrası "nedir"=açıklayıcı, "güncel"=veri sayfası olarak net niyet bölüşümü |
| smf nedir · sistem marjinal fiyatı · yekdem nedir · elektrik borsası nasıl çalışır · epiaş nedir · gün öncesi piyasası | Üst | Düşük-Orta | `/ptf-nedir` içinde bölümler; sonra ayrı açıklayıcılar (3. dalga) | docs/EPIAS-VERI-KATALOGU.md briefe kaynak |

---

## 4. Küme D — Maliyet / Fatura — **MESKEN KAPISI UYGULANIR**

**Niyet:** karışık (çoğunluk mesken şikâyeti + azınlık işletme analizi).
**Huni:** üst; yalnız B2B alt-segmenti değerli. **MWh önceliği: 4/5.**
**Talep:** Yüksek (nitel tahmin; gerekçe: kademe değişikliği ulusal gündem —
CNN Türk, DonanımHaber aynı SERP'te) — ama trafiğin büyük kısmı servis
veremeyeceğimiz mesken.

**MESKEN KAPISI (plan 2.6 + duran yasak #4):** aşağıda "MG" işaretli satırlar
haritalanmıştır ancak **tasarruf vaadiyle HEDEFLENMEZ**. İzinli tek çerçeve:
dürüst uygunluk kontrolü ("düzenlenmiş tarife sizin için daha ucuz — geçmeyin"
diyebilen) + de-sübvanse kama (>4.000 kWh/yıl) için bekleme listesi. Bu küme
için sayfa yayını mesken checker (2.6) hazır olana dek **beklemede**.

| Anahtar kelime + soru biçimleri | Huni | Talep | Hedef sayfa | Not |
|---|---|---|---|---|
| elektrik faturası neden yüksek geldi · fatura nasıl düşer **[MG]** | Üst | Yüksek | Hedeflenmez (v1) | Mesken kapısı; checker sonrası yeniden değerlendirilir |
| kademeli tarife nedir · 4000 kwh sınırı · kademe sınırı 2026 · devlet desteği kalkan aboneler **[MG — kama kesişimi]** | Üst | Yüksek (mevsimsel zirve) | **YENİ (koşullu, 2.6'ya bağlı):** `/kademe-2026` veya checker sayfası | De-sübvanse kama TAM bu sorgunun içinde; tasarruf vaadi olmadan "gerçek maliyet fiyatına geçenler için seçenekler" çerçevesi — legal-compliance onayı şart |
| elektrik kwh fiyatı 2026 · elektrik birim fiyatı · 1 kwh elektrik kaç tl **[MG ağırlıklı]** | Üst | Yüksek | Hedeflenmez (v1); B2B varyantı `/sanayi-elektrik-fiyatlari`'na | "sanayi/ticarethane kwh fiyatı" varyantları B2B sayfasına — mesken varyantından niyet ayrımı net tutulmalı |
| işletme elektrik gideri düşürme · fabrika enerji maliyeti azaltma · elektrik maliyet analizi | Orta | Düşük-Orta | Küme A sektör sayfaları + `/#simulator` | B2B-temiz alt küme; simülatör ana besleyicisi |

---

## 5. Küme E — Marka / Navigasyon

**Niyet:** navigasyon. **Huni:** her aşama. **MWh önceliği: 5/5 (bakım işi) —
ama kaybedilirse en pahalı küme.** **Talep:** Düşük (nitel tahmin; marka yaşına
ve pazarlama yokluğuna dayalı).

**SERP gözlemi (2026-07-27):** voltage.com.tr #1; encazip profili, Crunchbase,
elektrikpaketleri, puan5 ve LinkedIn ilk sayfada. Riskler: (a) encazip profili
"2024'te 950 kWh ve üzeri tüketenler geçebilir" gibi **bayat bilgiyi** taşıyor;
(b) "voltage" jenerik EN kelime — "voltage nedir" tipi sorgularla karışma.

| Anahtar kelime | Hedef sayfa | Not |
|---|---|---|
| voltage enerji · voltage.com.tr · voltan elektrik · voltan elektrik toptan satış a.ş. · voltage enerji iletişim/telefon | `/` + `/#iletisim` | Organization schema (name, alternateName, lisans no ETS/3424-8/2074, MERSİS — plan 1.5 footer işiyle birlikte) seo-onpage'e |
| voltage enerji yorum/şikayet · voltage enerji güvenilir mi | `/#hakkimizda` (v1) | İzleme: seo-competitor-intel; itibar içeriği ancak gerçek müşteri kanıtıyla |
| — bakım görevi — | — | encazip/elektrikpaketleri profillerindeki bayat limit bilgisi için düzeltme talebi → Direktör üzerinden marketing'e |

---

## 6. Mevsimsellik pencereleri (kümelere işaretli)

| Pencere | Tetikleyici | Zirve yapan kümeler |
|---|---|---|
| Aralık sonu – Ocak | EPDK serbest tüketici limit kararı (RG ~23 Aralık) + yıl başı tarife/kademe değişimi | B (limit sorguları), D (kademe) — **sayfalar Kasım'da güncel olmalı** |
| Çeyrek başları (Oca/Nis/Tem/Eki) | Tarife güncelleme haberleri | D, B |
| Yaz ortası (Tem-Ağu) | Soğutma yükü → PTF zirveleri haberleşir | C (güncel PTF), A (soğuk zincir) |
| Kış (Ara-Şub) | Isıtma + doğalgaz fiyat haberleri → PTF | C, D |
| Eki-Ara | Yıllık ikili anlaşma yenileme sezonu (takvim yılı sözleşmeleri) | A, B (değiştirme süreci) — outbound (plan 2.1) ile eşzamanlı |

---

## 7. Açılacak sayfalar — öncelik sıralaması

Sıralama = MWh ağırlığı × SERP boşluğu × plan 2.3 hizası. **İlk 6 = birinci
içerik dalgası** (plan 2.3: serbest tüketici rehberi ✓, tedarikçi değiştirme ✓,
sektör maliyet sayfaları OSB/tekstil/çelik ✓✓✓, PTF açıklayıcı ✓). Her sayfa
çalışan formda/simülatörde bitmeli (1.1 ön koşul).

| # | Sayfa (URL önerisi) | Küme | Gerekçe | Dalga |
|---|---|---|---|---|
| 1 | `/serbest-tuketici-2026` (rehber) | B | En yüksek talep × tüm B2B yolculuğunun giriş kapısı; 500 kWh güncelliği rekabet avantajı | **1** |
| 2 | `/osb-elektrik-tedariki` | A | En yüksek MWh/sorgu; SERP'te tedarikçi boşluğu; sayfadaki OSB kartına bağlanır | **1** |
| 3 | `/tedarikci-degistirme` (süreç) | B | Karar aşaması sorguları; doğrudan form dönüşümü; PAA soruları kapsanır | **1** |
| 4 | `/ptf-nedir` (canlı ticker gömülü) | C | Tek benzersiz varlıkla (canlı veri) kazanılabilir SERP; profesyonel kitle; ÖN KOŞUL: audit 1.4 dürüstlük düzeltmeleri | **1** |
| 5 | `/tekstil-elektrik` | A | Sahiplenilmiş sektör; OSB sayfasıyla iç bağlantı (Çerkezköy/İnegöl örnekleri sayfada mevcut) | **1** |
| 6 | `/demir-celik-elektrik` | A | En yüksek tüketim yoğunluklu sektör; PTF-saatlik-profil açısı özgün | **1** |
| 7 | `/sanayi-elektrik-fiyatlari` | A/D | Orta talep; sayı yayını Pricing+Legal kapısında | 2 |
| 8 | `/ikili-anlasma-nedir` | B | 1. dalga sonrası GSC kanıtına göre ayrıştır | 2 |
| 9 | Kalan sektör sayfaları (kimya, soğuk zincir, cam, veri merkezi) | A | Şablonlaşmış üretim; her biri kartından bağlanır | 2-3 |
| 10 | `/guncel-ptf` (ayrı canlı veri sayfası) | C | Ancak `/ptf-nedir` GSC'de "güncel" sorgu çekmeye başlarsa | 3 |
| 11 | `/kademe-2026` + mesken checker | D | **Koşullu:** plan 2.6 checker + legal onayı olmadan yayınlanmaz | Kapılı |

**Kapsama KPI başlangıcı:** 11 öncelikli kümeden bugün canlı hedef sayfası
olan: 2 (ana sayfa jenerik B2B + marka) → ilk dalga sonrası 8/11.

## 8. seo-strategy / seo-content-writer'a giden boşluk listesi

1. Sektör kartları link değil — sektör sayfaları açılınca kartlar `<a>` olmalı (seo-onpage).
2. Tek sayfa mimarisi tüm kümeleri `/`'e yığıyor; çok sayfalı yapıya geçişte
   çapa bölümleri (ör. `#simulator`) yeni sayfalardan kanonik iç linkle beslenmeli.
3. EN sayfa seti (plan 3.5) için EN anahtar kelime haritası ayrı görev — bu
   haritadan çeviri türetilmez.
4. encazip/elektrikpaketleri profillerindeki bayat serbest tüketici bilgisi
   (950 kWh/2024) düzeltme fırsatı.
5. GSC + Bing Webmaster kurulumları yoksa ilk dalga öncesi şart (seo-search-console).

---

*Sıfır kaynaksız sayısal iddia standardı uygulanmıştır: bu belgedeki tüm
rakamlar (500 kWh, 4.000 kWh, 750 kWh, %6/2,5 mn, lisans no) 2026-07-27
tarihli SERP doğrulamasındaki ikincil kaynaklara dayanır ve yayına girmeden
önce plan 1.8 birincil kaynak doğrulamasından geçmelidir. Talep ifadeleri
nitel tahmindir ve öyle etiketlenmiştir.*
