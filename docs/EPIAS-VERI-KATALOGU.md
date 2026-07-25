# EPİAŞ Şeffaflık Platformu — Veri Kataloğu (Voltan İç Dokümanı)

**Hazırlayan:** Energy Market Agent (Finans & Risk)
**Tarih:** 2026-07-25
**Soru:** "Sitede kullandığımız API ile başka hangi datalara kavuşabiliyoruz — tam liste."

---

## Doğrulama durumu (önce bunu okuyun)

- Resmî teknik dokümana (`seffaflik.epias.com.tr/electricity-service/technical/tr/index.html`)
  sandbox ağ kısıtı nedeniyle doğrudan erişilemedi (HTTP 403 / proxy CONNECT engeli).
- Katalog bunun yerine, aynı v2.0 API'sini birebir yansıtan açık kaynak istemci
  **`Tideseed/eptr2`** deposunun endpoint haritası (`src/eptr2/mapping/path.py`,
  213+ servis) üzerinden **2026-07-25 tarihinde canlı olarak GitHub'dan çekilerek**
  doğrulandı. Bu, resmî dokümanın güvenilir bir aynasıdır; ancak **birebir endpoint
  yolları canlıya alınmadan önce resmî dokümandan teyit edilmelidir.**
- Tarihsel kapsam ve yayın saatleri gibi bilgiler model bilgisidir (~Ocak 2026
  itibarıyla) ve "teyit gerekli" olarak işaretlenmiştir.
- URL şablonu (eptr2 aynasından doğrulandı, 2026-07-25):
  `https://seffaflik.epias.com.tr/electricity-service/v1/<grup>/data/<veri-seti>`
  (doğal gaz için `natural-gas-service/v1/...`, raporlar için `reporting-service`).
  Çağrılar POST + JSON gövde (`startDate`, `endDate`) ile yapılır.

## Kısa özet: bugün ne çekiyoruz, neye erişilebilir

Bugün sitenin `epias-proxy` Cloudflare Worker'ı **tek bir veri seti** çekiyor:
günün **PTF'si** (`/ptf/today` → GÖP Piyasa Takas Fiyatı, saatlik, 24 satır).

Aynı kaynak (EPİAŞ Şeffaflık Platformu v2.0 API) toplamda **210'dan fazla veri
setine** erişim veriyor: elektrikte GÖP/GİP/DGP fiyat ve miktarları, dengesizlik,
vadeli piyasa (VEP), YEK-G, tüketim ve üretim (gerçek zamanlı + uzlaştırma),
YEKDEM maliyetleri, serbest tüketici sayıları, iletim/enterkonneksiyon, barajlar,
kesinti bildirimleri; doğal gazda STP (SGP/GRF) ve VGP dahil. Yani bugün
kullandığımız kanalın üzerinden, tedarik işinin fiyatlama–hedge–teminat–tahmin
zincirinin neredeyse tüm piyasa-verisi girdileri çekilebilir.

---

## Tam katalog

Her tabloda: veri seti, granülerlik ve **Voltan için kullanım** (hangi ajana /
iş fonksiyonuna girdi olur). eptr2 çağrı anahtarları parantez içinde verildi —
worker'a eklerken resmî yol bu anahtarların path karşılığından teyit edilmeli.

### 1. GÖP — Gün Öncesi Piyasası (17 set) — eptr2 aynasından doğrulandı

| Veri seti (çağrı anahtarı) | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| PTF (`mcp`, alias `ptf`) | Piyasa Takas Fiyatı, TL/MWh | Saatlik | **Zaten çekiyoruz.** Fiyatlama, site ticker'ı, hedge fiyat referansı |
| Kesinleşmemiş PTF (`interim-mcp`) | ~14:00'te yayınlanan geçici PTF | Saatlik | Site ticker'ını erken güncelleme; gün içi repricing tetikleyicisi |
| K.PTF yayın durumu (`interim-mcp-status`) | Geçici PTF yayınlandı mı | Günlük | Worker'da yayın-bekleme mantığı (DST/eksik saat kontrolü) |
| GÖP eşleşme miktarı (`dam-clearing`) | Eşleşen alış-satış, MWh | Saatlik | Likidite göstergesi; market-risk |
| GÖP işlem hacmi (`dam-volume`) | TL hacim | Saatlik | Pazar büyüklüğü; investor KPI paketi |
| Alış teklif miktarı (`dam-bid`) | Teklif edilen alış, MWh | Saatlik | Talep baskısı sinyali; pricing |
| Satış teklif miktarı (`dam-offer`) | Teklif edilen satış, MWh | Saatlik | Arz baskısı sinyali; pricing |
| Arz-talep eğrisi (`supply-demand`) | Fiyat kademesi bazında arz/talep | Saatlik | Fiyat duyarlılık analizi; senaryo/stres testi (market-risk) |
| Blok alış (`dam-block-bid`) | Blok alış miktarları | Saatlik | Büyük oyuncu davranışı; market intelligence |
| Blok satış (`dam-block-offer`) | Blok satış miktarları | Saatlik | Aynı |
| Esnek alış teklifi (`dam-flexible-bid`) | Esnek teklif miktarı | Saatlik/Günlük | Piyasa mikroyapısı; düşük öncelik |
| Esnek satış teklifi (`dam-flexible-offer`) | Esnek teklif miktarı | Saatlik/Günlük | Aynı |
| Esnek eşleşme (`dam-flexible-matching`) | Eşleşen esnek teklifler | Saatlik/Günlük | Aynı |
| Fiyattan bağımsız alış (`pi-bid`) | FB alış teklifleri | Saatlik | Zorunlu alım davranışı analizi |
| Fiyattan bağımsız satış (`pi-offer`) | FB satış teklifleri | Saatlik | YEKDEM arzı takibi |
| GÖP fark tutarı (`dam-diff`) | Yuvarlama/fark tutarları | Saatlik | Uzlaştırma kontrolü; billing-analysis |
| Eşleşme org. listesi (`dam-clearing-org-list`) | Organizasyon listesi | Referans | Parametre çözümü için yardımcı servis |

### 2. GİP — Gün İçi Piyasası (11 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| AOF (`wap`) | Ağırlıklı ortalama fiyat | Saatlik (kontrat bazlı) | Gün içi pozisyon kapatma maliyeti; market-risk |
| Min-maks alış fiyatı (`idm-mm-bid`) | Kontrat bazında | Kontrat | Gün içi spread analizi |
| Min-maks satış fiyatı (`idm-mm-offer`) | Kontrat bazında | Kontrat | Aynı |
| Min-maks eşleşme fiyatı (`idm-mm-matching`) | Kontrat bazında | Kontrat | Aynı |
| Eşleşme miktarı (`idm-qty`) | MWh | Saatlik | GİP likiditesi — pozisyonu GİP'te mi DGP'de mi kapatmalı sorusu |
| İşlem hacmi (`idm-volume`) | TL | Saatlik | Aynı |
| Alış-satış miktarları (`idm-ob-qty`) | Teklif defteri miktarları | Saatlik | Derinlik analizi |
| İşlem akışı (`idm-log`) | Ticket bazlı işlem geçmişi | İşlem bazlı | Mikroyapı; düşük öncelik |
| Teklif listesi (`idm-order-history`) | Teklif geçmişi | İşlem bazlı | Aynı |
| Kontrat listesi (`idm-contract-list`) | Aktif kontratlar | Referans | Yardımcı servis |
| Kontrat özeti (`idm-summary`) | Kontrat bazında özet | Günlük | GİP raporlama; investor KPI |

### 3. DGP — Dengeleme Güç Piyasası (5 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| SMF (`smp`, alias `smf`) | Sistem Marjinal Fiyatı | Saatlik | **Faz 2.4 pipeline'ının çekirdeği.** Dengesizlik maliyeti, hedge tetikleyicileri |
| Sistem yönü (`smp-dir`) | Enerji açığı/fazlası | Saatlik | Sistem stres göstergesi; kısa vadeli fiyat sinyali |
| YAL talimatları (`bpm-up`) | Yük alma talimat miktarı | Saatlik | Sistem sıkışıklığı; SMF tahmini girdisi |
| YAT talimatları (`bpm-down`) | Yük atma talimat miktarı | Saatlik | Aynı |
| DGP talimat AOF (`bpm-orders-w-avg`) | Talimatların ağırlıklı ort. fiyatı | Saatlik | Dengeleme maliyet analizi |

### 4. Dengesizlik (6 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| Dengesizlik fiyatları (`imbalance-price`) | Pozitif/negatif dengesizlik fiyatı | Saatlik | **Portföy dengesizlik maliyetinin doğrudan girdisi** — pricing + market-risk |
| PTF-SMF-SDF birleşik (`mcp-smp-imb`) | Üçü tek serviste | Saatlik | Pipeline için en verimli tek çağrı |
| Dengesizlik miktarı (`imb-qty`) | Sistemin dengesizlik MWh'i | Saatlik | Pazar geneli tahmin kalitesi kıyası |
| Dengesizlik tutarı (`imb-vol`) | TL | Saatlik/Aylık | Sektör maliyet kıyası; investor KPI |
| DSG dengesizlik miktarı (`imb-qty-g`) | Dengeden sorumlu grup bazında | Aylık | DSG stratejisi değerlendirmesi (teminat/risk azaltımı) |
| DSG org. listesi (`imb-org-list`) | Referans liste | Referans | Yardımcı servis |

### 5. İkili Anlaşmalar (3 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| İA alış miktarı (`bi-long`) | Piyasa geneli ikili anlaşma alışları | Saatlik | Tezgahüstü pazarın büyüklüğü; tedarik stratejisi |
| İA satış miktarı (`bi-short`) | Satış tarafı | Saatlik | Aynı |
| EÜAŞ-GTŞ anlaşmaları (`bi-euas`) | EÜAŞ'ın görevli tedarik şirketlerine satışları | Aylık | Regüle segment maliyet tabanı; mesken tarife analizi (Faz 2.6 ile ilişkili) |

### 6. VEP — Vadeli Elektrik Piyasası (12 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| Kontrat fiyat özeti (`vep-contract-price-summary`) | Vadeli kontrat fiyatları | Kontrat/Günlük | **Hedge fiyat eğrisi** — market-risk'in forward eğri girdisi |
| Fiyat özetleri (`vep-price-summaries`) | Özet istatistikler | Günlük | Aynı |
| GGF (`vep-ggf`, `vep-ggf-period`) | Günlük gösterge fiyat | Günlük | Forward mark-to-market; teminat değerleme (treasury) |
| Eşleşme miktarı (`vep-matching-quantity`) | MWh | Kontrat | VEP likiditesi — hedge uygulanabilirliği |
| İşlem hacmi (`vep-trade-volume`) | TL | Kontrat | Aynı |
| Açık pozisyonlar (`vep-open-positions`) | Piyasa geneli açık pozisyon | Kontrat | Piyasa pozisyonlanması |
| İşlem geçmişi (`vep-transaction-history`, `-periods`) | İşlem bazlı | İşlem | Mikroyapı |
| Teslimat dönemi listesi (`vep-delivery-period-list`) | Referans | Referans | Yardımcı |
| Teslimat yılı listesi (`vep-delivery-year-list`) | Referans | Referans | Yardımcı |
| Yük tipi listesi (`vep-load-types`) | Baz/puant vb. | Referans | Yardımcı |

### 7. YEK-G — Yenilenebilir Enerji Kaynak Garanti Belgesi (10 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| Eşleşme fiyatı min-maks (`yek-g-match-price-minmax`) | YEK-G sertifika fiyatları | Günlük | **Yeşil tarife ürünü maliyeti** — pricing |
| AOF (`yek-g-wap`) | Ağırlıklı ortalama fiyat | Günlük | Aynı |
| Eşleşme miktarı (`yek-g-match-quantity`) | Adet | Günlük | Yeşil sertifika likiditesi |
| İşlem hacmi (`yek-g-trade-volume`) | TL | Günlük | Aynı |
| Teklif miktarı (`yek-g-order-quantity`) | Adet | Günlük | Aynı |
| İhraç edilen (`yek-g-issued`) | İhraç edilen belge sayısı | Aylık | Arz tarafı |
| İtfa edilen (`yek-g-redemptions`) | Kullanılan belgeler | Aylık | Kurumsal yeşil talep göstergesi — sales'e sinyal |
| İptal/çekilen (`yek-g-withdrawals`) | | Aylık | — |
| Süresi dolan (`yek-g-expirations`) | | Aylık | — |
| YEK-G ikili anlaşma (`yek-g-bilateral-contracts`) | Tezgahüstü YEK-G devirleri | Aylık | Pazar büyüklüğü |

### 8. Tüketim (16 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| Gerçek zamanlı tüketim (`rt-cons`) | Türkiye toplam tüketim | Saatlik | **Yük tahmini v0'ın temel girdisi**; site içerik ("Türkiye şu an ne tüketiyor") |
| Yük tahmin planı (`load-plan`) | Gün öncesi talep tahmini | Saatlik | Tahmin kıyas çizgisi; agregatör baseline metodolojisi |
| UEÇM (`uecm`) | Uzlaştırmaya esas çekiş miktarı | Saatlik/Aylık | Fatura/uzlaştırma doğrulama — billing-analysis |
| Serbest tüketici UEÇM (`st-uecm`) | ST segmenti çekişi | Aylık | **Adreslenebilir pazar (TAM) ölçümü** — investor KPI, sales hedefleme |
| Tedarik yükümlülüğü UEÇM (`su-uecm`) | Regüle segment çekişi | Aylık | Regüle/serbest pazar payı takibi |
| Serbest tüketici sayısı (`eligible-consumer-count`) | ST adedi | Aylık | **Switching pazarının büyüklüğü** — growth/sales/investor KPI |
| ST sayısı il/ilçe detayı (`eligible-consumer-count-detail`) | İl, ilçe, profil bazında | Aylık | Bölgesel satış hedefleme; saha stratejisi |
| ST tüketim miktarı (`eligible-consumer-quantity`) | ST tüketimi | Aylık | Segment bazlı MWh pazarı |
| Tüketici sayısı (`consumer-breakdown`) | Tüketici adetleri | Aylık | Pazar segmentasyonu |
| Tüketim kırılımı (`consumption-breakdown`) | İl ve profil bazında | Aylık | Bölgesel profil analizi; agregatör baseline |
| Yüzdesel tüketim (`percentage-consumption-info`) | Dağılım yüzdeleri | Aylık | Aynı |
| Uzun vadeli talep tahmini (`long-term-demand-forecast`) | Yıllık projeksiyonlar | Yıllık | Stratejik planlama; investor anlatısı |
| Planlı kesintiler (`planned-outages`) | Dağıtım bölgesi bazında | Günlük | Müşteri iletişimi (support); portföy tüketim anomali açıklaması |
| Plansız kesintiler (`unplanned-outages`) | Aynı | Günlük | Aynı |
| Aylık endeks / çarpan (`monthly-index`, `multiple-factor`, `mf-*`) | Sayaç okuma çarpanları, profil katsayıları | Aylık | Profil bazlı tüketim modelleme — billing-analysis, agregatör baseline |
| Referans listeler (`profile-group-list`, `province-list`, `district-list`, `get-distribution-companies`, `main-tariff-group-list`, `elig-profile-groups`) | İl/ilçe/profil/dağıtım şirketi | Referans | Parametre çözümü |

### 9. Üretim (15 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| Gerçek zamanlı üretim (`rt-gen`) | Kaynak bazında (hidro, rüzgar, güneş, kömür, gaz...) | Saatlik | Fiyat sürücüsü analizi; site içerik (üretim karması grafiği) |
| Santral bazlı GZÜ (`rt-gen-bulk`) | Santral kırılımı | Saatlik | Karşı taraf/rakip üretici takibi |
| KGÜP (`kgup`, `dpp-bulk`) | Kesinleşmiş günlük üretim programı | Saatlik | **Ertesi gün arz görünümü** — SMF/PTF tahmini girdisi |
| KGÜP v1 (`kgup-v1`) | İlk versiyon KGÜP | Saatlik | Program revizyon analizi |
| KUDÜP (`kudup`) | Uzlaştırma dönemi üretim planı | Saatlik | Gün içi arz revizyonları |
| EAK (`eak`) | Emre amade kapasite | Saatlik/Günlük | Arz sıkışıklığı erken uyarısı — market-risk stres testleri |
| UEVM (`uevm`) | Uzlaştırmaya esas veriş miktarı | Saatlik/Aylık | Kesinleşmiş üretim; kaynak bazlı analiz |
| Santral bazlı UEVM (`uevm-pp-list`) | Santral kırılımı | Aylık | Karşı taraf analizi |
| Kurulu güç (`installed-capacity` benzeri; eptr2'de kapasite servisleri) | Kaynak bazında kurulu güç | Aylık | Arz büyüme trendi; investor anlatısı |
| Lisanslı santral listesi (`lic-pp-list`) | Santraller | Referans | Yardımcı |
| Santral listeleri (`pp-list`, `pp-list-for-date-range`, `uevcb-list-bulk`) | Santral/UEVÇB referansları | Referans | Yardımcı |
| Organizasyon listeleri (`gen-org`, `gen-uevcb`, `eic-w/x-org-list`) | Üretici org/EIC kodları | Referans | Yardımcı |
| Rüzgar tahmini (`wind-forecast`) | RİTM rüzgar üretim tahmini | Saatlik | Rüzgar kaynaklı fiyat oynaklığı tahmini |
| Lisanssız üretim (YEKDEM bölümünde `ren-ul-gen`) | Lisanssız santral üretimi | Saatlik/Aylık | Öz tüketim/çatı GES pazarı takibi — agregatör ürünü |
| Barajlar (7 set: `dams-daily-level`, `-volume`, `-active-fullness`, `-active-volume`, `-water-energy-provision`, `-level-minmax`, `-volume-minmax`, `basin-list`) | Baraj doluluk, kot, enerji karşılığı | Günlük | **Hidro arz görünümü = mevsimsel PTF tahmini** — pricing/market-risk |

### 10. YEKDEM / Yenilenebilir (11 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| YEKDEM GZÜ (`ren-rt-gen`) | YEKDEM santralleri üretimi | Saatlik | YEKDEM hacim takibi |
| YEKDEM UEVM (`ren-uevm`) | Kesinleşmiş YEKDEM üretimi | Aylık | Aynı |
| YEKDEM birim maliyeti (`ren-unit-cost`) | TL/MWh birim maliyet | Aylık | **Tedarikçi maliyet kaleminin doğrudan girdisi** — pricing; simülatör doğruluğu |
| YEKDEM toplam maliyeti (`ren-total-cost`) | TL | Aylık | Aynı |
| YEKDEM geliri (`ren-income`) | TL | Aylık | Net maliyet hesabı |
| Lisanslı YEKDEM maliyeti (`ren-lic-cost`, eski adıyla YEKBED) | TL | Aylık | Aynı |
| Lisanssız üretim (`ren-ul-gen`) | MWh | Saatlik/Aylık | Çatı GES pazarı |
| Lisanssız maliyet (`ren-ul-cost`) | TL | Aylık | Aynı |
| YEKDEM kurulu gücü (`ren-capacity`) | MW | Aylık | Mekanizma büyüklüğü trendi |
| YEKDEM santral listesi (`ren-pp-list`) | Referans | Referans | Yardımcı |
| YEKDEM katılımcı listesi (`ren-participant-list`) | Referans | Referans | Yardımcı |

### 11. Yan Hizmetler (4 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| PFK miktarı (`anc-pf-qty`) | Primer frekans rezerv miktarı | Saatlik | İleride agregatör/VPP ürünü için pazar büyüklüğü |
| PFK fiyatı (`anc-pfk`) | Primer frekans kapasite fiyatı | Saatlik | **VPP gelir modeli girdisi** — product-manager'ın agregatör MVP'si |
| SFK miktarı (`anc-sf-qty`) | Sekonder frekans rezervi | Saatlik | Aynı |
| SFK fiyatı (`anc-sfk`) | Sekonder frekans kapasite fiyatı | Saatlik | Aynı |

### 12. İletim / Enterkonneksiyon (10 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| Enterkonneksiyon hat kapasiteleri (`line-capacities`, `capacity-demand`) | Sınır kapasiteleri | Aylık/Yıllık | İthalat/ihracat arz etkisi |
| Nomine kapasite (`nominal-capacity`) | Yön bazında | Günlük | Aynı |
| Ay öncesi kapasite tahmini (`tcat-pre-month-forecast`) | | Aylık | Aynı |
| Yıl öncesi kapasite tahmini (`tcat-pre-year-forecast`) | | Yıllık | Aynı |
| Uluslararası hat olayları (`international-line-events`) | Arıza/bakım | Olay bazlı | Arz şoku erken uyarısı |
| Kısıt maliyeti (`congestion-cost`) | İletim kısıt maliyetleri | Aylık | Sistem maliyeti trendi — iletim tarifesi baskısı |
| Sıfır bakiye düzeltme tutarı (`zero-balance`) | TL | Aylık | Uzlaştırma kalemi — billing-analysis |
| İSKK (`iskk`) | İletim sistemi kayıp katsayısı | Aylık | **Maliyet kalemi** — fiyat teklifi hesabında kayıp maliyeti |
| Yön listeleri (`intl-direction-list`, `intl-capacity-demand-direction-list`) | Referans | Referans | Yardımcı |
| Bölge listeleri (`region-list`, `distribution-region-list`) | Referans | Referans | Yardımcı |

### 13. Piyasa Genel / Katılımcılar / Duyurular (8 set) — eptr2 aynasından doğrulandı

| Veri seti | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| Piyasa katılımcıları (`market-participants`) | Katılımcı sayıları | Aylık | Rekabet yoğunluğu — market intelligence, investor KPI |
| Lisans tipine göre katılımcı (`participant-count-based-upon-license-type`) | Tedarik/üretim/toptan kırılımı | Aylık | **Tedarikçi sayısı trendi** — rekabet analizi |
| Katılımcı org. listesi (`market-participants-organization-list`) | Referans | Referans | Rakip tedarikçi listesi çıkarma |
| Piyasa mesaj sistemi (`mms`) | Acil piyasa mesajları, santral arıza/bakım | Olay bazlı | Arz şoku anlık takibi — market-risk alarm |
| MMS referansları (`mms-message-type-list`, `-pp-list`, `-region-list`, `-uevcb-list`) | Referans | Referans | Yardımcı |
| Elektrik piyasa hacimleri (`electricity-market-quantity`) | GÖP/GİP/DGP/İA fiziksel hacim payları | Aylık | **Pazar yapısı özeti** — investor KPI paketi, strateji |
| GDDK (`ra-*`: 8 servis — `ra-sum`, `ra-meters`, `ra-meter-volumes-*`, listeler) | Geriye dönük düzeltme kalemleri | Aylık/Dönemsel | Uzlaştırma düzeltmeleri — billing-analysis, treasury nakit akış tahmini |

Not: Teminat (teminat hesap detayları) Şeffaflık API'sinde **yayınlanmaz** — teminat
verisi EPİAŞ/Takasbank katılımcı ekranlarındadır. Treasury'nin teminat planlaması
buradaki fiyat/hacim verisinden türetilir (SMF ve PTF oynaklığı → teminat çağrısı riski).

### 14. Doğal Gaz — STP ve VGP (~70 set) — eptr2 aynasından doğrulandı

Elektrik-dışı taraf: `natural-gas-service` altında iki büyük grup.

**STP / Spot Gaz Piyasası (`ng-*`, ~30 set):**

| Öne çıkan veri setleri | İçerik | Granülerlik | Voltan için kullanım |
|---|---|---|---|
| GRF eşleşme/hacim (`ng-grp-match-qty`, `ng-grp-trade-volume`) | Gün öncesi referans fiyat işlemleri | Günlük | Gaz santral maliyeti → **elektrik fiyat tabanı tahmini** (spark spread) |
| Günlük referans fiyat GRF (`ng-drp`) | TL/1000 Sm³ | Günlük | Aynı — PTF tahmin modelinin girdisi |
| Haftalık referans fiyat (`ng-wrp`) | | Haftalık | Aynı |
| SGP fiyatları (`ng-spot-prices`) | Spot gaz fiyatları | Günlük | Aynı |
| Dengeleme gazı fiyatı (`ng-balancing-price`) | | Günlük | Gaz sistem stresi |
| Sistem yönü (`ng-system-direction`) | | Günlük | Aynı |
| Dengesizlik (`ng-imbalance-amount`, `-system`, `ng-shippers-imbalance-quantity`) | | Günlük | Gaz arz riski göstergesi |
| İşlem hacimleri (`ng-daily-trade-volume`, `-total-`, `-weekly-`) | | Günlük/Haftalık | Likidite |
| Kod operasyonları (`ng-blue/green/orange/code-four-ops`) | Acil durum işlemleri | Olay bazlı | Gaz krizi erken uyarısı → elektrik fiyat şoku alarmı |
| BAST, GDDK, fiziksel/sanal gerçekleşme, katılımcılar (`ng-bast`, `ng-gddk`, `ng-physical-realization`, `ng-virtual-realization`, `ng-participants`...) | | Çeşitli | Düşük öncelik |

**VGP / Vadeli Gaz Piyasası (`ng-vgp-*`, ~20 set):** kontrat fiyat özeti, GGF,
eşleşme miktarı, açık pozisyon, işlem hacmi/geçmişi, teslimat dönemleri (her biri
dönem/SE varyantlarıyla). Kullanım: ileri dönem gaz eğrisi → uzun vadeli elektrik
maliyet senaryoları (market-risk stres testleri).

**Gaz iletim (`ng-tr-*`, ~15 set):** giriş/çıkış nominasyon ve gerçekleşmeleri,
rezerve/maks. kapasiteler, stok, depolama tesisi listesi, günlük iletim. Kullanım:
gaz arz kısıtı → gaz santrali kullanılabilirliği → SMF riski (düşük öncelik, sadece
kriz dönemlerinde izlenir).

### 15. Raporlama servisleri — eptr2 aynasından doğrulandı (kısmen)

`reporting-service` altında birleşik rapor uçları var (ör. `electricity-market-quantity`).
Ayrıca platformun web arayüzündeki hazır raporlar (aylık piyasa raporları) API'de
kısmen karşılık bulur. **Kapsamın tamamı resmî dokümandan teyit edilmeli.**

---

## Öncelik tablosu — worker/pipeline'a ekleme sırası (Top 10)

Faz 2.4 ("PTF/SMF geçmiş pipeline, 3+ yıl backfill, YEKDEM/dengesizlik bileşenleri,
yük tahmini v0") ile hizalı sıralama:

| # | Veri seti | Gerekçe | Beslediği fonksiyon |
|---|---|---|---|
| 1 | `mcp-smp-imb` (PTF+SMF+dengesizlik fiyatı, tek çağrı) | Faz 2.4'ün çekirdeği; üç kritik seriyi tek endpoint'te verir, backfill maliyeti düşük | pricing, market-risk, hedge tetikleyicileri |
| 2 | PTF tarihsel backfill (`mcp`, 3+ yıl) | Simülatör ve tekliflerin tarihsel doğrulaması; mevsimsellik modeli | pricing, billing-analysis |
| 3 | `imbalance-price` + `imb-qty`/`imb-vol` | Portföy dengesizlik maliyeti = tedarikçinin ana riski; teminat çağrısı senaryoları | market-risk, treasury |
| 4 | `rt-cons` + `load-plan` | Yük tahmini v0'ın eğitim verisi; agregatör baseline metodolojisinin temeli | load forecasting, agregatör |
| 5 | `interim-mcp` (+`interim-mcp-status`) | Site ticker'ı ertesi gün fiyatını ~14:00'te gösterebilir — rakiplerin çoğu göstermiyor; düşük maliyetli ürün farkı | website, sales |
| 6 | `wap` + `idm-summary` (GİP AOF) | Gün içi pozisyon kapatma maliyeti; SMF'e karşı GİP alternatifinin fiyatı | market-risk |
| 7 | `eligible-consumer-count(-detail)` + `st-uecm` | Adreslenebilir pazarın resmi ölçümü, il bazında satış hedefleme, investor KPI | sales, growth, investor-relations |
| 8 | `ren-unit-cost` (YEKDEM birim maliyet) | Tedarik maliyet kaleminin resmî değeri; simülatör ve teklif matematiğinin doğruluğu | pricing, billing-analysis |
| 9 | `rt-gen` (kaynak bazlı üretim) + barajlar (`dams-active-fullness`) | Fiyat sürücüleri: hidro doluluk mevsimsel PTF'nin en iyi öncü göstergesi; site içerik değeri | market-risk, website |
| 10 | `yek-g-wap` + `yek-g-match-price-minmax` | Yeşil tarife ürünü maliyet tabanı; kurumsal satış argümanı | pricing, sales |

İkinci dalga (11+): KGÜP/EAK (arz görünümü), VEP fiyat özeti (forward eğri),
`ng-drp` (spark spread), MMS (arıza alarmı), yan hizmet fiyatları (VPP hazırlığı).

---

## Erişim notları

| Konu | Durum | Kaynak/Tarih |
|---|---|---|
| Kayıt zorunluluğu | v2.0 API (Aralık 2023 geçişi) **kayıtlı kullanıcı** ister: Şeffaflık Platformu'na e-posta ile kayıt → kullanıcı adı/şifre. Anonim API erişimi kapatıldı; web arayüzü ise halka açık. | eptr2 README (2026-07-25 canlı) + model bilgisi ~Oca 2026 — **teyit gerekli** |
| Kimlik doğrulama akışı | CAS/TGT: `giris.epias.com.tr` üzerinden TGT (Ticket Granting Ticket) alınır, isteklerde `TGT` başlığıyla gönderilir. TGT'nin ömrü sınırlıdır (saatler mertebesi) — worker'da TGT önbellekleme/yenileme gerekir (eptr2'deki `recycle_tgt` mantığının Cloudflare Worker karşılığı). | eptr2 (2026-07-25 canlı); TGT ömrü **teyit gerekli** |
| Mevcut worker'ın durumu | `epias-proxy`'nin bugün nasıl kimlik doğruladığı bu repo'dan görünmüyor (worker ayrı repo'da). Faz 2.4 öncesi kontrol edilmeli: kimlik bilgileri Worker secret'ında mı, TGT yenileme var mı? | İç tespit, 2026-07-25 |
| İstek biçimi | POST + JSON gövde: `{"startDate": "...", "endDate": "..."}` (ISO, TR saati UTC+3). Bazı servisler `orgId`, `ppId`, `uevcbId` gibi ek parametre ister. | eptr2 (2026-07-25 canlı) |
| Rate limit | Resmî olarak yayınlanmış bir limit bilgim yok; pratikte istek başına tarih aralığı sınırları (ör. bazı saatlik servislerde ~1 yıl/istek) uygulanır. Backfill batch'lenmeli. | Model bilgisi ~Oca 2026 — **teyit gerekli** |
| Tarihsel kapsam | PTF/SMF: piyasa başlangıcına dek (GÖP Ara 2011, DGP 2011); GİP: Tem 2015'ten; VEP: Haz 2021'den; YEK-G: Haz 2021'den; STP gaz: Eyl 2018'den. 3+ yıllık backfill hedefi tüm çekirdek seriler için rahatlıkla karşılanır. | Model bilgisi ~Oca 2026 — **teyit gerekli** |
| Ücret | Şeffaflık verisi ücretsizdir (kamuya açıklık yükümlülüğü kapsamında). | Model bilgisi ~Oca 2026 |
| Lisans/kullanım koşulları | Veriyi sitede yeniden yayınlarken EPİAŞ kaynak gösterimi koşulları kontrol edilmeli (mevcut ticker için de geçerli). | **Legal-compliance'a yönlendirilmeli** |
| Endpoint yolları | Bu dokümandaki çağrı anahtarları eptr2 aynasından; birebir resmî yollar (`.../v1/<grup>/data/<set>`) canlıya almadan önce resmî teknik dokümandan doğrulanmalı. | 2026-07-25 |

### Yeniden doğrulama gerektirenler (özet)

1. Resmî endpoint yolları ve parametre adları (doküman 403 verdi — ofis ağından açılmalı).
2. TGT ömrü ve rate limit politikası.
3. Tarihsel kapsam başlangıç tarihleri (seri bazında).
4. Raporlama servislerinin tam listesi.
5. Veri yeniden yayın (ticker/grafik) lisans koşulları → legal-compliance.

---

*Bu doküman piyasa verisi kataloğudur; fiyat seviyeleri içermez. Endpoint envanteri
2026-07-25'te eptr2 v2.0 aynasından canlı doğrulanmıştır; "teyit gerekli" işaretli
satırlar ~Ocak 2026 model bilgisidir.*
