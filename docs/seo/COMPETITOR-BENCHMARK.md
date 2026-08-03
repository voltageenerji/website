# RAKİP ARAMA BENCHMARK'I — voltage.com.tr (Kuruluş Raporu)

**Hazırlayan:** Rakip Arama İstihbarat Ajanı (seo-competitor-intel, Seviye 4)
**Rapor tarihi:** 2026-07-27
**Alıcı:** SEO Direktörü → seo-strategy, seo-keyword-research
**Yenileme kadansı önerisi:** 30 gün (tarife/limit duyuru dönemlerinde 14 gün)

---

## 0. Yöntem ve Kanıt Etiketleri

Bu rapordaki her iddia iki etiketten biriyle işaretlidir:

- **[CANLI-SERP 2026-07-27]** — Bu raporun hazırlandığı gün WebSearch üzerinden
  gözlemlenen gerçek arama sonuçları. **Önemli sınırlama:** arama altyapısı
  ABD lokasyonlu çalışmaktadır; Türkiye içinden yapılan aramalarda sıralamalar
  farklılaşabilir (özellikle yerel paket ve encazip gibi TR-otoriteli
  domainlerin konumu). Türkiye lokasyonlu doğrulama bir sonraki yenileme
  döngüsünde yapılmalıdır.
- **[MODEL-BİLGİ ~Oca 2026 — DOĞRULA]** — Canlı gözlemlenemeyen, model
  bilgisine dayanan tespit. Rakip sayfa içeriklerine doğrudan erişim bu
  oturumda engellendi (encazip.com DNS hatası; elektraenerji, piagrid,
  gazelektrik sayfaları proxy üzerinden 403 döndü); sayfa-içi format
  tespitleri bu nedenle SERP snippet'lerine ve model bilgisine dayanır.

Hacim/otorite skoru içeren hiçbir üçüncü taraf araç verisi bu raporda yoktur;
tüm talep değerlendirmeleri **nitel (yüksek/orta/düşük)** ve gerekçelidir.
MWh ağırlıklandırması standardımız gereği esastır: bir "OSB elektrik
tedariki" sorgusunun arkasındaki MWh, binlerce mesken fatura sorgusundan
değerlidir.

**Beş niyet kümemiz** (seo-keyword-research spesifikasyonundan):

1. **Uygunluk/eğitim** — serbest tüketici nedir/limiti, tedarikçi değiştirme, ikili anlaşma
2. **Ticari B2B** — fabrika/OSB/sanayi elektrik tedariki, kurumsal teklif
3. **Maliyet/fiyat** — elektrik birim fiyatı, kademe/tarife sorguları
4. **Piyasa verisi** — PTF nedir, güncel PTF, EPİAŞ fiyatları
5. **Marka/navigasyon** — Voltage Enerji / Voltan Elektrik varyantları

---

## 1. Katman Katman Savaş Alanı

### Katman 1 — Görevli/Perakende Devleri (Enerjisa, CK Enerji, Aydem, Gediz vb.)

**Canlı gözlem [CANLI-SERP 2026-07-27]:**
- Enerjisa, gözlemlenen SERP'lerde en tutarlı kurumsal varlık: "PTF nasıl
  takip edilir" rehberi, "Serbest tüketici hakları nelerdir?" SSS sayfası ve
  "ikili anlaşma ön bilgilendirme formu" PDF'i ile üç ayrı kümede
  (uygunluk, piyasa verisi, maliyet) sonuç aldı. Formatı: müşteri-işlemleri
  altında SSS/rehber sayfaları — satış sayfası değil, bilgilendirme.
- Aydem Perakende "elektrik tarifeleri" sayfasıyla tarife sorgularında;
  CK Boğaziçi "45 Soruda Elektrik Tüketicisi Olmak" uzun-form rehberiyle
  ikili anlaşma sorgusunda göründü.
- Gediz Perakende "Tasarruf Asistanı" cihaz-bazlı tüketim hesaplayıcısıyla
  hesaplama sorgusunda ilk sonuçtu — görevli şirketlerin hesaplayıcı
  formatına yatırım yaptığının kanıtı.
- **Çarpıcı boşluk:** Ticari B2B sorgularında ("sanayi elektrik fiyatları
  OSB elektrik tedariki") hiçbir görevli/perakende devi ilk sonuçlarda
  görünmedi. Devler mesken/perakende hacmine optimize; sanayi SERP'i
  bağımsızlara kalmış durumda.

**Model bilgisi [MODEL-BİLGİ ~Oca 2026 — DOĞRULA]:** Enerjisa ve Aydem'in
domain otoritesi haber siteleri ve kurumsal PR linkleriyle beslenir; marka
sorgu hacimleri organik görünürlüklerinin ana taşıyıcısıdır. Site yapıları
"müşteri işlemleri / faydalı bilgiler" hub'ları etrafında kuruludur ve
FAQ schema kullanımı yaygındır (PAA yakalama).

**Sonuç:** Bu katmanla mesken tarife/kademe sorgularında kafa kafaya savaş
kazanılamaz ve MWh değeri de düşük (mesken kapısı zaten kapalı). Ancak
sanayi tarafındaki yoklukları, en yüksek MWh'li kümeyi savunmasız bırakıyor.

### Katman 2 — Bağımsız Tedarikçiler (serbest tüketici talebi için rakipler)

**Canlı gözlem [CANLI-SERP 2026-07-27]:** Bu katman beklenenden kalabalık ve
SEO'ya bilinçli yatırım yapıyor:

| Rakip | Görüldüğü kümeler | Gözlemlenen format |
|---|---|---|
| Elektra Enerji (elektraenerji.com.tr) | B2B (OSB sayfası, sanayi/ticarethane fiyat sayfası), uygunluk (tedarikçi değiştirme) | Küme başına ayrı landing page — "kurumsal-elektrik/" dizini altında sistematik yapı |
| Gaz Elektrik (gazelektrik.com) | Uygunluk (tedarikçi değiştirme rehberi), maliyet (elektrik fiyatları) | "Faydalı bilgiler" içerik hub'ı |
| GELKA Enerji (gelkaenerji.com.tr) | B2B (sanayi+otel ana sayfa konumlandırması), piyasa verisi (PTF rehber makalesi) | Sektör-hedefli ana sayfa + makale |
| Zenergy, Minas, Selenka, My Enerji, Best Enerji, GEM Kurumsal | Piyasa verisi (PTF nedir), uygunluk (ikili anlaşma) | Tekil tanım/rehber makaleleri, çoğu sığ |

- "PTF nedir / güncel PTF" SERP'i küçük bağımsız tedarikçilerin tanım
  makaleleriyle dolu; ancak **hiçbiri canlı veri sunmuyor** — arama motoru
  özeti dahi "güncel fiyat için EPİAŞ'a gidin" diyor. Canlı PTF gösteren tek
  sonuç bir veri agregatörüydü (enerjiatlasi.com), tedarikçi değil.
- Sanayi/OSB SERP'inde sıralananlar (Gelka, Elektra) SEO gücü sınırlı,
  küçük-orta domainler. [MODEL-BİLGİ ~Oca 2026 — DOĞRULA: bu domainlerin
  backlink profilleri zayıftır, çoğunlukla dizin ve B2B rehber siteleri.]

**Sonuç:** Bağımsız katman, Voltan'ın doğrudan rakibi ve aynı zamanda en
yenilebilir katman. İçerik formatları kopyalanabilir düzeyde basit (tanım
makalesi + teklif formu); derinlik, canlı veri ve sektörel uzmanlıkla
farklılaşma alanı geniş.

### Katman 3 — Karşılaştırma/Geçiş Portalları (encazip tipi araya girenler)

**Canlı gözlem [CANLI-SERP 2026-07-27]:**
- **encazip.com**: Marka sorgusunda güçlü (kendi tedarikçi-karşılaştırma,
  tedarikçi-değiştirme ve tedarikçi-profil sayfaları + hakkında güçlü basın
  kaydı: Webrazzi, Cumhuriyet). "Aydem" gibi **rakip marka sorgularında bile**
  kendi tedarikçi-profil sayfasıyla sıralanıyor — marka-bitişik araya girme
  stratejisinin ders kitabı örneği. Hesaplama sorgusunda da mevcut.
  Platformda 21 tedarikçi listelediği ve komisyon modeliyle çalıştığı basında
  teyitli. Ancak jenerik "tedarikçi değiştirme 2026" sorgusunda ilk sonuçlarda
  görünmedi (ABD lokasyon uyarısı geçerli — TR'de daha güçlü olması muhtemel).
- **YENİ TEHDİT — piagrid.com**: 7 gözlemin 4'ünde sonuç aldı (serbest
  tüketici rehberi, elektrik fiyatları 2026, ikili anlaşma rehberi, fatura
  hesaplama 2026). "rehber/" ve "indirimli-elektrik/" dizinleriyle sistematik,
  yıl-damgalı (2026) içerik üretiyor. [MODEL-BİLGİ ~Oca 2026 — DOĞRULA:
  model bilgimde belirgin bir geçmişi yok; bu, **son 6-12 ayda agresif içerik
  hamlesi yapan yeni bir oyuncu** olduğuna işaret eder. Erken-tespit KPI'mız
  gereği bayrak: İZLE.]
- **akillitarife.com**: "Tedarikçi Karşılaştırma Rehberi" ile geçiş-niyeti
  sorgusunda sıralandı — ikinci bir karşılaştırma-içerik oyuncusu. Bayrak: İZLE.
- forelektrik.com, aydinlatma.org, apollo.eco, solaravm.com: hesaplayıcı ve
  fiyat sorgularında içerik/araç siteleri olarak mevcut.

**Sonuç:** Portallar geçiş niyetini tedarikçilerden önce yakalıyor; yıl-damgalı
başlık ("...2026") ve hesaplayıcı formatı standart silahları. Voltan portal
olamaz ve olmamalı; ama portal-farkında içerik (karşılaştırma kriterlerini
dürüstçe anlatan, "neye dikkat edilir" otoritesi kuran sayfalar) araya
girmenin meşru yolu.

### Katman 4 — Kurumsal Kaynaklar (EPDK, EPİAŞ, TEİAŞ) ve Haber Siteleri

**Canlı gözlem [CANLI-SERP 2026-07-27]:**
- "Serbest tüketici limiti 2026" SERP'i haber siteleri (AA, CNBC-e, Milli
  Gazete, Donanımhaber, TradingView) + sektör derneği (GENSED) tarafından
  domine edilmiş. Teyitli veri: **2026 limiti 500 kWh/yıl; EPDK Kurul Kararı
  23 Aralık 2025 Resmî Gazete; yürürlük 1 Ocak 2026** (2025'te 750 kWh idi).
- epias.com.tr "spot elektrik piyasası" sayfasıyla PTF sorgusunda mevcut ama
  Şeffaflık Platformu'nun kendisi SERP'te kullanıcı dostu bir sonuç üretmiyor;
  boşluğu enerjiatlasi.com gibi agregatörler dolduruyor.
- EPDK/TEİAŞ domainleri gözlemlenen ticari sorguların hiçbirinde ilk
  sonuçlarda yer almadı — otoriteleri mevzuat sorgularına sıkışmış durumda.

**Sonuç:** Kurumsal katman müşteri değil dikkat rakibi. Haber siteleri
duyuru anlarında (Aralık tarife/limit kararları) SERP'i 2-4 hafta işgal
ediyor, sonra çekiliyor: **duyuru-sonrası kalıcı sayfa** stratejisi (haber
söner, evergreen sayfa kalır) burada kazanma yoludur.

---

## 2. Küme Sahiplik Haritası (2026-07-27 itibarıyla)

| Küme | Mevcut sahip(ler) | Savunma gücü | MWh değeri | Voltan pozisyonu |
|---|---|---|---|---|
| 1. Uygunluk/eğitim | Parçalı: haberler + Enerjisa SSS + Piagrid + hukuk bürosu(!) | ZAYIF — bir hukuk bürosunun sıralanması arzın kalitesizliğinin kanıtı | Orta-yüksek (geçiş hunisinin girişi) | Yok — açık alan |
| 2. Ticari B2B (OSB/sanayi) | Gelka, Elektra, OSB'lerin kendi siteleri | ZAYIF-ORTA — küçük domainler | **EN YÜKSEK** — sorgu başına yüzlerce-binlerce MWh | Yok — birincil hedef |
| 3. Maliyet/fiyat | Donanımhaber, Piagrid, Forelektrik, görevli tarife sayfaları | ORTA — yıl-damgalı içerik yarışı | Düşük (mesken ağırlıklı; mesken kapısı kapalı) — sanayi birim fiyatı alt-kümesi hariç | Yok — yalnızca sanayi açısıyla gir |
| 4. Piyasa verisi (PTF) | Enerjiatlasi (veri), Enerjisa (rehber), küçük tedarikçi makaleleri | ZAYIF — kimse canlı veri + yorum birleştirmiyor | Yüksek (arayan profili: profesyonel/sanayi alıcısı) | **Yapısal avantaj: canlı PTF worker'ı zaten var** |
| 5. Marka/navigasyon | voltage.com.tr #2'de; #1 Crunchbase, gerisi dizinler (puan5, bulurum, elektrikpaketleri) | — | Orta (teklif niyetli navigasyon trafiği) | ZAYIF — marka SERP'i dizinlere terk edilmiş |

---

## 3. Format ve Link Desenleri

**Kazanan formatlar [CANLI-SERP 2026-07-27 gözlemi + snippet analizi]:**
1. **Yıl-damgalı rehber** ("... 2026") — Piagrid, Forelektrik, Yetkilielektrikçim
   sistematik kullanıyor; tazelik sinyaliyle haber sitelerine karşı tutunuyor.
2. **Hesaplayıcı/araç sayfası** — Gediz (tasarruf asistanı), encazip, Apollo;
   arama özetleri araçları doğrudan öne çıkarıyor.
3. **SSS/soru formatı** — Enerjisa SSS'leri ve CK'nın "45 Soruda" formatı;
   PAA (İnsanlar şunu da soruyor) yakalamaya optimize. [FAQ schema kullanımı:
   MODEL-BİLGİ ~Oca 2026 — DOĞRULA]
4. **Küme-başına-landing** — Elektra'nın "kurumsal-elektrik/" dizini: OSB,
   sanayi/ticarethane, tedarikçi değiştirme ayrı sayfalar.

**Link desenleri:** Canlı backlink verisi bu oturumda alınamadı. Gözlemlenebilir
dolaylı kanıt [CANLI-SERP 2026-07-27]: encazip'in basın kapsaması (Webrazzi,
Cumhuriyet, üniversite mezun ağı) portal otoritesinin kaynağı; sektör dernekleri
(GENSED) ve OSB siteleri (HOSAB, EOSB) enerji sorgularında sıralanabilen,
link verebilen otorite adaları. [Bağımsız tedarikçilerin link profillerinin
dizin-ağırlıklı ve zayıf olduğu tespiti: MODEL-BİLGİ ~Oca 2026 — DOĞRULA;
seo-backlink-audit ajanına araç destekli doğrulama önerilir.]

**SERP-özelliği yakalama:** ABD-lokasyon sınırlaması nedeniyle snippet/PAA/yerel
paket gözlemi güvenilir değildi; arama özetlerinde Enerjisa ve Piagrid
içeriklerinin kaynak olarak seçilmesi, bu domainlerin özet-dostu (soru-cevap
yapılı) içerik kurduğunun işareti. TR-lokasyonlu SERP-özelliği turu bir sonraki
döngünün birincil işi olmalı.

---

## 4. Asimetrik Açıklıklar (nasıl farklı kazanırız)

Standardımız gereği hiçbir öneri rakip içeriğinin taklidi değildir; her biri
"bu talep kanıtlandı → biz yapısal avantajla farklı kazanırız" formundadır.

**A1 — Canlı PTF: kimsenin gösteremediğini biz zaten gösteriyoruz.**
Kanıtlanan talep: onlarca tedarikçi "PTF nedir" makalesi yazmış; arama özeti
bile güncel fiyat bulamıyor [CANLI-SERP 2026-07-27]. Farklı kazanma: statik
tanım makalesi DEĞİL — epias-proxy worker'ından beslenen, saatlik canlı PTF +
tarihsel bağlam + "bu fiyat sanayi faturanıza ne yapar" yorumu içeren canlı
veri hub'ı. Rakiplerin bunu kopyalaması veri altyapısı gerektirir; bizde hazır.

**A2 — Sanayi/OSB derinliği: devlerin girmediği, cücelerin tuttuğu küme.**
Kanıtlanan talep: OSB/sanayi SERP'i var ve dolu; ama görevli devler yok,
sıralananlar zayıf domainler [CANLI-SERP 2026-07-27]. Farklı kazanma: Gelka
tarzı "bize teklif sorun" sayfası DEĞİL — sektör-bazlı (tekstil, metal, gıda,
otel), tüketim-profili-bazlı, PTF-endeksli ve sabit fiyat modellerini gerçek
sayılarla anlatan mühendislik derinliğinde içerik + simülatör entegrasyonu.

**A3 — Dürüst geçiş-süreci otoritesi: hukuk bürosunun sıralandığı SERP.**
Kanıtlanan talep: "tedarikçi değiştirme 2026" sorgusunda bir hukuk bürosu ve
haber siteleri sıralanıyor [CANLI-SERP 2026-07-27] — tedarikçilerin kendi
anlatımları güven vermiyor veya eksik. Farklı kazanma: satış broşürü DEĞİL —
EPDK mevzuatına atıflı, süre/adım/itiraz haklarını taahhüt gibi net veren,
"tedarikçi değiştirmek sayaç değiştirmez, ücretsizdir" düzeyinde şeffaf süreç
sayfası. YMYL güveni + application ajanının geçiş akışına doğrudan besleme.

**A4 — Duyuru-sonrası kalıcılık: haber söner, sayfa kalır.**
Kanıtlanan talep: 500 kWh limit kararı SERP'i haber sitelerinde [CANLI-SERP
2026-07-27]; haber içerikleri güncellenmez. Farklı kazanma: her Aralık
(limit + tarife kararları) öncesi hazır bekleyen, karar çıktığı gün güncellenen
evergreen "Serbest Tüketici [YIL]" sayfası; haber dalgası çekilince SERP'i
devralır.

**A5 — Marka SERP'i tahkimatı.**
Gözlem: "voltage enerji / voltan elektrik" SERP'inde #1 Crunchbase, gerisi
üçüncü-sınıf dizinler [CANLI-SERP 2026-07-27]. Teklif almaya gelen navigasyon
trafiği kontrolsüz sayfalara dağılıyor. Farklı kazanma: Organization schema,
tutarlı NAP, kurumsal profillerin sahiplenilmesi — seo-brand-entity ajanının
alanı; buradan bayrakla devredilir.

## 5. Kaçınılacak Kafa Kafaya Savaşlar

1. **Mesken kademe/tarife sorguları** — görevli devler + haber siteleri +
   mesken kapısı kararımız: MWh değeri düşük, savunma yüksek. GİRME.
2. **Jenerik fatura-hesaplayıcı yarışı** — Gediz/encazip/Apollo araçlarıyla
   tüketici-hesaplayıcı savaşı mesken trafiği getirir; MWh'e dönüşmez.
   (Sanayi tasarruf simülatörümüz farklı: o B2B hunisinin parçası.)
3. **encazip'in karşılaştırma-marka alanı** — "tedarikçi karşılaştırma" jenerik
   sorgularında portal otoritesiyle komisyon-model içeriğine karşı yarışmak
   yerine, karşılaştırma-farkında içerik (A3) ile niyeti yukarıdan yakala.
4. **"PTF nedir" tanım-makale kalabalığına 41. makaleyi eklemek** — tanım
   yarışı doymuş; yalnızca A1'in canlı-veri farkıyla girilir.

---

## 6. Karşı-Hamle Önerileri (MWh-ağırlıklı sırada, seo-strategy'ye)

| # | Karşı-hamle | Dayandığı açıklık | MWh gerekçesi | Aciliyet |
|---|---|---|---|---|
| 1 | **OSB/sanayi küme sayfaları** (sektör-bazlı seri + simülatör bağı) | A2 | Sorgu başına en yüksek MWh; rakip savunması en zayıf küme | Yüksek |
| 2 | **Canlı PTF hub'ı** (worker verisi + tarihsel bağlam + sanayi yorumu) | A1 | Arayan profili profesyonel/sanayi; yapısal avantaj yalnızca bizde | Yüksek |
| 3 | **Dürüst tedarikçi-değiştirme süreç sayfası** (EPDK-atıflı) | A3 | Geçiş hunisinin darboğazı; B2B başvuru akışını doğrudan besler | Yüksek |
| 4 | **"Serbest Tüketici 2026/2027" evergreen sayfası** (Aralık kararlarına hazır) | A4 | 500 kWh limitle fiilen tüm işletmeler kapsamda — uygunluk sorgusu B2B huni girişi | Orta — Kasım'a hazır olmalı |
| 5 | **Marka SERP'i tahkimatı** (seo-brand-entity'ye devir) | A5 | Mevcut teklif-niyetli trafiği kayıptan korur; düşük maliyet/hızlı kazanç | Orta |

**Erken-tespit bayrakları (KPI gereği):** piagrid.com (4/7 SERP'te, yeni ve
agresif — İZLE), akillitarife.com (karşılaştırma-içerik oyuncusu — İZLE).
Her ikisi bir sonraki yenileme döngüsünde sayfa-düzeyinde incelenmelidir
(bu döngüde erişim 403 ile engellendi).

---

## 7. Kanıt Günlüğü

| Tarih | Sorgu / Kaynak | Temel bulgu |
|---|---|---|
| 2026-07-27 | "elektrik tedarikçisi değiştirme serbest tüketici 2026" | Parçalı SERP: haber, hukuk bürosu, akillitarife, piagrid, elektra, gazelektrik; incumbent yok |
| 2026-07-27 | "sanayi elektrik fiyatları OSB elektrik tedariki" | Gelka, Elektra (2 sayfa), HOSAB, piagrid; görevli devler yok |
| 2026-07-27 | "güncel PTF fiyatı ... bugün" | Canlı veri gösteren tedarikçi yok; enerjiatlasi (agregatör) + tanım makaleleri |
| 2026-07-27 | "elektrik birim fiyatı 2026 kWh" | İçerik siteleri + piagrid/forelektrik; yıl-damgalı format hakim |
| 2026-07-27 | "encazip elektrik tedarikçi karşılaştırma" | encazip marka+basın gücü; 21 tedarikçili komisyon modeli teyitli |
| 2026-07-27 | "Enerjisa CK Enerji Aydem tarife" | Görevli devlerin tarife sayfaları + encazip'in Aydem profil sayfası (marka-araya-girme) |
| 2026-07-27 | "serbest tüketici limiti 2026 EPDK" | 500 kWh/yıl; RG 23.12.2025; yürürlük 01.01.2026; SERP haber+GENSED |
| 2026-07-27 | ""ikili anlaşma" elektrik nedir" | Enerjisa PDF, CK "45 Soruda", encazip, piagrid, küçük tedarikçi makaleleri |
| 2026-07-27 | "elektrik faturası hesaplama aracı" | Gediz Tasarruf Asistanı, aydinlatma.org, encazip, piagrid, Apollo |
| 2026-07-27 | ""voltage enerji" OR "voltan elektrik"" | voltage.com.tr #2; #1 Crunchbase; kalanı dizin siteleri |
| 2026-07-27 | Sayfa-düzeyi erişim denemeleri | encazip (DNS hatası), elektra/piagrid/gazelektrik (403) — sayfa formatları bir sonraki döngüde TR erişimle doğrulanacak |

*Rapor sonu. Sonraki yenileme: 2026-08-26 veya büyük rakip hamlesi tespitinde.*
