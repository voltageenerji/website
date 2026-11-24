# Dengesizlik Maliyeti — kaynak teyit föyü

**Tarih:** 24 Kasım 2026. **Hazırlayan:** Enerji Piyasası ajanı; formül görüntüsü ve 14030 sayılı Kararı Orchestrator ayrıca gözle doğruladı.
**Kural:** `/dengesizlik-maliyeti` sayfasındaki her mevzuat cümlesi bu föydeki TEYİT EDİLDİ satırlarına dayanır. Aşağıdaki "Açık" maddeler hakkında sayfada hüküm cümlesi kurulmaz.

## Yayınlanabilir formül (teslim günü 1 Kasım 2026 ve sonrası; 31 Aralık 2026'ya kadar)

- **Negatif dengesizlik birim fiyatı** = max(V; PTF; SMF_N) × (1 + k). max(PTF; SMF_N) azami fiyat limitine (AFL) eşitse: AFL × 1,05 × (1 + k). — DUY m.110(1) (görüntüden okundu, s.102)
- **Pozitif dengesizlik birim fiyatı** = min(PTF; SMF_P) × (1 − l). min(PTF; SMF_P) < V ise: (−1) × B × (1 + l) (katılımcı öder). Sınır kesin "<". — DUY m.110(1)
- **k (negatif) / l (pozitif):** sistem enerji açığı yönünde k = 0,06, l = 0,03; enerji fazlası yönünde k = 0,03, l = 0,06; dengede ikisi 0,03. — Kurul Kararı 14030, 11/12/2025 (RG 29/12/2025-33122); 1/1/2026 teslim gününden itibaren
- **V** = 100 TL/MWh (1/11/2026'dan itibaren; öncesi başlangıç değeri 150). — Kurul Kararı 14911, 24/9/2026 (RG 19/10/2026-33405); DUY m.110(2), m.90(1)
- **B** = 100 TL/MWh (başlangıç değeri). — DUY m.110(2)
- **AFL** = 4.500 TL/MWh, asgari 0 (4/4/2026'dan itibaren). — Kurul Kararı 14459, 2/4/2026 (RG 3/4/2026)
- **SMF_N / SMF_P:** saat içindeki DGP uzlaştırma dönemleri SMF'lerinin en yükseği / en düşüğü. Bugün saatte tek SMF var (15 dakikalık DGP uzlaştırması en erken 1/1/2027; DUY m.91, Geçici m.40) → SMF_N = SMF_P = saatin SMF'si.
- **Sistem yönü** talimat hacimlerinden belirlenir (DUY m.101(1)); PTF–SMF kıyasından çıkarılmaz. Sayfada EPİAŞ'ın yayımladığı yön kullanılır.
- **SMF** ilgili uzlaştırma dönemini takip eden dört saat içinde duyurulur (DUY m.68(1)(e)); Şeffaflık belgeleri: "Veriler 4 saat önceki talimatları yansıtmaktadır."
- **Kesinleşme:** ön uzlaştırma bildirimi izleyen ayın 11'i, nihai bildirim 15'i (DUY m.132/A(1)); sonradan geçmişe dönük düzeltme olabilir (m.134(1)), itiraz 60 gün (m.133(1)).
- **"PTF'ye göre MWh başı maliyet"** (negatif fiyat − PTF; PTF − pozitif fiyat) mevzuat terimi DEĞİL, bizim türettiğimiz göstergedir; sayfada böyle etiketlenir.

## Veri kaynağı (EPİAŞ Şeffaflık, resmî teknik belge)

- `POST https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf` ("PTF SMF ve SDF Listeleme Servisi", reporting-service v1.3.28). Gövde: `startDate`, `endDate` (ISO-8601, +03:00). Yanıt alanları: `date`, `time`, `ptf`, `smf`, `positiveImbalance`, `negativeImbalance`, `systemStatus`. `TGT` başlığı zorunlu (giris.epias.com.tr CAS; bilet ömrü 2 saat). Girişsiz istek 401 döner (24.11'de denendi).
- Sayfada EPİAŞ'ın yayımladığı pozitif/negatif dengesizlik fiyatı gösterilir; formül açıklama ve hesaplayıcı içindir.

## Hukuk okuması eki (24 Kasım 2026; Hukuk & Uyum ajanı birincil metinleri yeniden indirip okudu)

- **Sistem dengesizlik fiyatı tanımı (TEYİT EDİLDİ, DUY m.4):** "Sistem dengesizlik fiyatı: Uzlaştırma dönemi bazında belirlenen piyasa katılımcılarının denge sorumluluklarından kaynaklanan enerji dengesizliklerine uygulanan fiyatı" (Orchestrator konsolide metinde ayrıca gördü).
- **V = 150 TL/MWh, 1 Ocak – 31 Ekim 2026 (TEYİT EDİLDİ, çekinceyle):** DUY m.110(2) başlangıç değeri; arada başka karar olmadığı tam taramayla doğrulanmadı. Sayfada formüle dayalı gün içeriği yalnız 1 Kasım 2026 ve sonrası için gösterilir.
- **KÜPST ayrı kalemdir (TEYİT EDİLDİ, DUY m.110(3)); 14907 sayılı Karar:** tüketim kapsamındaki uzlaştırmaya esas veriş-çekiş birimleri için katsayı 0,01, tolerans 0,30; 1/1/2027'den itibaren (Geçici m.1). Muhatap piyasa katılımcısıdır, son tüketici değil.
- **m.111(5) grup içi değerlendirme:** madde oranın sınırını koyar; 2026 için oran %5 (Kurul Kararı 13869), konsolide metindeki %10 değil. Sayfada oran rakamı yazılmaz.
- **m.132/A(1):** ön uzlaştırma bildirimi "en geç" izleyen ayın 11'i; nihai bildirim 15'i, tatile denk gelirse izleyen ilk iş günü.
- **m.68(1)(e):** SMF'yi dört saat içinde belirleyip piyasa katılımcılarına duyuran Sistem İşletmecisidir.
- **Karar 14459:** RG 3/4/2026, sayı 33213.
- **EPİAŞ Şeffaflık yeniden kullanım koşulu (BULUNDU; platformun canlı arayüz metni, 24.11.2026):** "EPİAŞ ŞEFFAFLIK PLATFORMU | Tüm hakları saklıdır. Burada sunulan tüm görsel, grafik ve veriler bilgilendirme amaçlı olup söz konusu verilerden kaynaklanabilecek kayıp ve zararlardan dolayı Enerji Piyasaları İşletme A.Ş. hukuken sorumluluk kabul etmez. Sunulan tüm içerik ve veriler kaynak gösterilmek suretiyle çoğaltılabilir ve kullanılabilir." → gösterim, türetilmiş gösterge ve dosya indirme kaynak gösterilerek yapılabilir. **Okunamayan:** üyelik formu / hesap koşulları (kayit.epias.com.tr ve giris.epias.com.tr'ye erişilemedi) → açık çapraz köken erişimi (CORS `*`) bu yüzden kapalı tutulur.
- **14/2/2026 tarihli Şeffaflık ve Piyasa Bozucu Davranışlar Yönetmeliği (RG 33168, yürürlük 1/6/2026):** yeniden kullanım kuralı yok; m.9(2) yanlış/yanıltıcı fiyat bilgisi yaymayı (bilmesi gereken yayıncı için) manipülasyon sayar, m.13 idari para cezası. EPDK "Piyasa Bozucu Davranışlar Rehberi" (15 Ekim 2026) Örnek 42: doğrulanmamış bilgi yayan enerji veri platformu. Sayfanın önlemleri: yalnız yayımlanan değer, eksikte "—", zaman damgası, bayat etiketi, formül–yayım karşılaştırması, hata bildirim kanalı.
- **Kurul Kararı 14968 (RG 20/10/2026):** 1/1/2027'den geçerli yayımlanacak veri listesi; okunan satırlarda SMF ve sistem yönü saatlik kalıyor.
- **m.110 ve 1/1/2027 (Hukuk okuması):** çatışma yalnız (1)–(2). fıkralarda; RG 32789 m.13'ün (3)–(4). fıkra kısmı 1/1/2027'de çatışmasız yürürlüğe girer. Sonraki değişikliklerin hiçbiri m.13'ü anmıyor, kaldırmıyor, ertelemiyor. Hukuk görüşü: 33122/33405 formülünün sürmesi daha olası (büyük olasılıkla Aralık sonunda temizlik değişikliğiyle), kesinlik düşük-orta; sayfa "değişecek" ya da "aynı kalacak" DEMEZ. EPDK'dan yazılı görüş ve kısa avukat notu önerilir.

**Uyum takvimi:** 1/12/2026 m.111(5) 2027 oranı kararı · 20–31/12/2026 Resmî Gazete taraması (m.110, 32789 m.13, k, l, V, B, tavan) · 1/1/2027 yürürlük (32789 m.5 ve m.13, 15 dk DGP, 14968, 14907 Geçici m.1) · 2/1/2027 sayfa metni gözden geçirme.

## Açık (yayında hüküm kurulmaz)

1. **1/1/2027 sonrası m.110:** RG 21/1/2025-32789 m.13, m.110(1)–(4)'ü eski tek formülle (V, B, tavan zammı ve yöne bağlı katsayı yok) yeniden yazıyor ve m.20'ye göre 1/1/2027'de yürürlüğe giriyor; 2025 ve 2026 değişiklikleriyle ilişkisi konsolide metinde notlanmamış. Hukuk ya da EPDK teyidi gelene kadar 2027 sonrası formül hakkında cümle kurulmaz; kural tablosunda 31/12/2026 sonrası "doğrulanmadı" durur.
2. 15 dakikalık DGP uzlaştırması başlayınca saatin sistem yönünün nasıl belirleneceği ve Şeffaflık'ın 15 dakikalık SMF yayımlayıp yayımlamayacağı.
3. EPİAŞ Şeffaflık üyelik / hesap koşulları (otomatik erişim, hesapla alınan verinin yeniden dağıtımı) okunamadı; genel yeniden kullanım koşulu yukarıda bulundu — sahipten üyelik formunda kabul edilen metin ve EPİAŞ Yardım Masası'na yazılı soru.
4. Kimlik gerektiren canlı veri denetimleri: eşik altı dalda `positiveImbalance` işareti, geçmiş derinliği, istek başına tarih aralığı sınırı, değerlerin sonradan revize edilip edilmediği.
5. Dengeden sorumlu grup içi netleştirme oranının güncel Kurul kararı (DUY m.111(5) metni %10 diyor, oran her yıl Kurulca belirlenir).
6. Yuvarlama kuralı (okunan metinlerde yok).
7. Karar taramasının tamlığı: "k, l, V, B ve tavanı değiştiren daha yeni karar yok" sonucu okunan RG sayılarına ve EPİAŞ duyuru aramasına dayanır; EPDK kararlarının tam taraması yapılmadı.

## Kapsam notu için doğrulanan maddeler

Dengeden sorumlu grup içi netleştirme (m.111(5)); kesinleşmiş üretim/tüketim planından sapma bedeli ayrı kalemdir ve 1/1/2027'den itibaren tüketim birimlerine de uygulanır (Kurul Kararı 14907, RG 19/10/2026-33405); Kurul kaynak bazlı, depolamalı üretim ve tüketim tesisleri için farklı metodoloji ya da katsayı uygulayabilir (m.110(5)).

## Atıf satırı

- **TR:** "Dayanak: Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği (RG 14/4/2009-27200) m.110 (RG 29/12/2025-33122 ve RG 19/10/2026-33405 ile değişik); k ve l katsayıları: 11/12/2025 tarihli ve 14030 sayılı Kurul Kararı (RG 29/12/2025-33122); V değeri: 24/9/2026 tarihli ve 14911 sayılı Kurul Kararı (RG 19/10/2026-33405); azami fiyat limiti: 2/4/2026 tarihli ve 14459 sayılı Kurul Kararı (RG 3/4/2026). Veri: EPİAŞ Şeffaflık Platformu. 24 Kasım 2026 itibarıyla."
- **EN:** "Basis: Electricity Market Balancing and Settlement Regulation (Official Gazette 14/4/2009, No. 27200), Art. 110 (as amended by OG 29/12/2025 No. 33122 and OG 19/10/2026 No. 33405); coefficients k and l: Board Decision No. 14030 of 11/12/2025 (OG 29/12/2025 No. 33122); value V: Board Decision No. 14911 of 24/9/2026 (OG 19/10/2026 No. 33405); price cap: Board Decision No. 14459 of 2/4/2026 (OG 3/4/2026). Data: EPİAŞ Transparency Platform. As of 24 November 2026."

## Birincil kaynak adresleri

- DUY konsolide: https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.12985.pdf (son değişiklik satırı "35- 19/10/2026 33405")
- RG 29/12/2025-33122: https://www.resmigazete.gov.tr/eskiler/2025/12/20251229-1.htm ; Karar 14030: https://www.resmigazete.gov.tr/eskiler/2025/12/20251229-19.pdf
- RG 19/10/2026-33405: https://www.resmigazete.gov.tr/eskiler/2026/10/20261019-2.pdf ; Kararlar 14907–14913: https://www.resmigazete.gov.tr/eskiler/2026/10/20261019-9.pdf
- RG 21/1/2025-32789: https://www.resmigazete.gov.tr/eskiler/2025/01/20250121-3.htm
- Karar 14459: https://www.resmigazete.gov.tr/eskiler/2026/04/20260403-12.pdf
- EPİAŞ teknik belgeler: https://seffaflik.epias.com.tr/reporting-service/technical/en/index.html ; https://seffaflik.epias.com.tr/electricity-service/technical/tr/index.html

---

# Ek: araştırma notları (ham; birebir alıntılar ve erişim günlüğü)

## Dengesizlik Maliyeti — arastirma notlari (Energy Market Agent)
Baslangic: 2026-11-24. Her madde: durum + alinti + URL + erisim tarihi.

## 0. Erisim gunlugu (hangi kaynak acildi / acilamadi)
- 2026-11-24: curl (Bash) -> proxy 403 CONNECT (policy block) for: www.mevzuat.gov.tr, www.resmigazete.gov.tr, www.epdk.gov.tr, seffaflik.epias.com.tr, www.epias.com.tr, www.foreks.com
- 2026-11-24: WebFetch -> ENOTFOUND (host outside session allowed domains) for: www.mevzuat.gov.tr, seffaflik.epias.com.tr, www.foreks.com, www.resmigazete.gov.tr, www.alomaliye.com, www.cnbce.com
- SONUC: Hicbir birincil kaynak ACILAMADI. Yalnizca WebSearch (arama sonucu ozetleri) calisiyor -> en iyi ihtimalle PARTIALLY.
- WebSearch ipucu (ikincil, dogrulanmadi): DUY degisikligi RG 19.10.2026 sayi 33405 (resmigazete.gov.tr/eskiler/2026/10/20261019-5.htm) ; ayrica alomaliye 21.10.2026 sayi 33407'de ikinci bir DUY degisikligi (Madde 132/E f.4 (c), teminat/temerrut) listeliyor. Tarih/sayi celiskisi elle teyit edilmeli.
- Ortam: oturum "Default" ortaminda (izinli host: yalniz s15-kling.klingai.com). "voltage-enerji" ortami (env_014RCfDF1W1sRVWJu6VfAQVo) www.resmigazete.gov.tr, www.mevzuat.gov.tr, www.epias.com.tr'ye izin veriyor AMA bu oturum oraya tasinamiyor; seffaflik.epias.com.tr ve www.epdk.gov.tr o ortamda da YOK.

## 1. Ic kaynak: docs/seo/15DK-UZLASTIRMA-KAYNAK-TEYIT.md (erisim 2026-11-12, birincil metinden; bu oturumda YENIDEN ACILMADI)
Kaynaklar o foyde: DUY konsolide PDF https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.12985.pdf (son degisiklik RG 21/10/2026-33407; 36 degisiklik);
RG-32789 https://www.resmigazete.gov.tr/eskiler/2025/01/20250121-3.htm ; RG-33122 https://www.resmigazete.gov.tr/eskiler/2025/12/20251229-1.htm (yururluk 1/1/2026) ;
RG-33405 https://www.resmigazete.gov.tr/eskiler/2026/10/20261019-2.pdf (28 madde, yururluk yayim gunu m.27; yalniz s.1,7,8 okundu) ; RG-33407 https://www.resmigazete.gov.tr/eskiler/2026/10/20261021-3.htm (yalniz m.132/E-4-c teminat).
Alintilar (foyden, 12.11.2026 konsolide metin):
- m.91(1): "Bir fatura dönemi içerisindeki her bir saat bir uzlaştırma dönemini oluşturur."
- m.91(2) (Ek:RG-21/1/2025-32789): "Dengeleme güç piyasasında uzlaştırma dönemi on beş dakika olarak uygulanır."
- Gecici 40(1): "...en geç 1/1/2027 tarihine kadar tamamlanır. Bu kapsamda söz konusu fıkraya ilişkin uygulamalar 1/1/2027 tarihine kadar başlatılmaz."
- m.4/1-ttt: "Sistem dengesizlik fiyatı: Uzlaştırma dönemi bazında belirlenen piyasa katılımcılarının denge sorumluluklarından kaynaklanan enerji dengesizliklerine uygulanan fiyatı,"
- m.9/1-c: "...Bir uzlaştırma dönemi için geçerli sistem dengesizlik fiyatı, söz konusu uzlaştırma dönemi için gün öncesi piyasasında belirlenmiş olan nihai piyasa takas fiyatı veya dengeleme güç piyasasında belirlenmiş olan … sistem marjinal fiyatı kullanılarak belirlenen fiyattır." ("saatlik" ibaresi RG-33405 m.2 ile kaldirildi)
- m.110(2) tanimlari: "SMF_Nt,u : … "u" uzlaştırma dönemi içerisindeki 91 inci madde kapsamında dengeleme güç piyasasında uygulanan "ç" uzlaştırma dönemleri için hesaplanan Sistem Marjinal Fiyatlarından maksimum olanı (TL/MWh)" ; "SMF_Pt,u : … minimum olanı (TL/MWh)"
- m.110(1)-(2): Degisik RG 29/12/2025-33122 (m.17, yururluk 1/1/2026); formuller RG 19/10/2026-33405 m.22 ile tekrar degisti.
- m.109(1): SMF "teklif bölgesinin uzlaştırma dönemi bazında enerji denge durumuna bağlı olarak" hesaplanir; a-c bentlerinde "saatte" -> "uzlaştırma döneminde" (RG-33405 m.21).
- m.111(2): EDM "u" (saat) donemi icin; DGP miktarlari "ç" donemleri; "g" = u icindeki DGP donemi sayisi (RG-33405 m.23).
- 32789 m.13 (m.110 f.1-4 degisikligi) 1/1/2027'de yururluge girecek sekilde yazilmis -> 1/1/2027'de hangi m.110 metni uygulanir = HUKUK SORUSU (acik).
!! EKSIK: m.110(1) EDTA/EDTB FORMULUNUN KENDISI ve k / l tanim-degerleri o foyde YAZILMADI ("Formül bu föyde yazılmadı"). Bu oturumun ana boslugu.

## 2. Ic kaynak: docs/EPIAS-VERI-KATALOGU.md (2026-07-25; eptr2 GitHub aynasindan, resmi dokuman degil)
- URL sablonu: https://seffaflik.epias.com.tr/electricity-service/v1/<grup>/data/<veri-seti> ; POST + JSON {startDate,endDate}
- eptr2 anahtarlari: smp, smp-dir, mcp, imbalance-price, mcp-smp-imb, imb-qty, imb-vol ; TGT (giris.epias.com.tr) -- hepsi "resmi dokumandan teyit gerekli"

## 3. IKINCIL (acik kaynak kutuphane, resmi DEGIL): Tideseed/eptr2 v1.4.1 (2026-11-17), raw.githubusercontent.com ACILDI 2026-11-24
URL: https://raw.githubusercontent.com/Tideseed/eptr2/main/src/eptr2/util/costs.py ; .../CHANGELOG.md ; .../src/eptr2/mapping/path.py
!!! KRITIK: kullanicinin hatirladigi min(PTF,SMF)*(1-k), max(PTF,SMF)*(1+l), k=l=0.03 formulu eptr2'ye gore "pre_2026" donemidir. 1/1/2026'dan itibaren FARKLI formul:
 eptr2 calculate_unit_imbalance_price_2026 (kod, birebir mantik):
   sistem yonu: PTF>SMF => fazla(+1); PTF<SMF => acik(-1); esitse EPIAS systemStatus'a bakilir
   fazla(+1): neg_margin=low(0.03), pos_margin=high(0.06) ; acik(-1): neg_margin=high(0.06), pos_margin=low(0.03) ; dengede: ikisi de 0.03
   neg_imb_price = max(PTF, SMF, V) * (1+neg_margin) * (1+ceil_margin eger max(PTF,SMF) >= azami fiyat ; ceil_margin=0.05)
   pos_imb_price = min(PTF,SMF)*(1-pos_margin)  EGER min(PTF,SMF) >= V ; DEGILSE  -B*(1+pos_margin)   (NEGATIF fiyat: fazla veren oder)
   Parametreler: 26_01 (2026-01-01..2026-10-31): V=150, B=100 ; 26_02 (2026-11-01'den): V=100, B=100 ; low 0.03, high 0.06, ceil 0.05 ; dsg_tolerance 0.05 ; kupst_floor_price 750
 eptr2'nin gosterdigi dayanaklar (kod yorumu; BIRINCILDEN TEYIT EDILMEDI):
   "EPDK Decision 14029 (11/12/2025, RG 29/12/2025 No. 33122), in force 2026-01-01" (KUPST katsayilari)
   "EPDK Decision 14907 (KÜPSM/KÜPST coefficients, replaces 14029) and Decision 14911 (V = 100 TL/MWh), both 24/09/2026, RG 19/10/2026 No. 33405" ; "effective from the first delivery hour of 2026-11-01 (the billing period after publication)"
   CHANGELOG v1.4.0 (2026-10-30): "V drops from 150 to 100 from the first delivery hour of 2026-11-01. The imbalance formula is unchanged."
   CHANGELOG v1.3.7 (2026-04-03): azami fiyat 4500 TL/MWh, "Official announcement on April 2, starting from April 4"; onceki 3400 (2025-04-05'ten)
   CHANGELOG v1.4.1: "EPİAŞ's mcp-smp-imb returns every hour of 2026-11-01 twice" ; "EPİAŞ's published imbalance prices are used where available"
 Celiski notu: ic foy (12.11) "m.110(1) EDTA/EDTB formulleri RG-33405 m.22 ile degisti" diyor; eptr2 "formula unchanged" diyor -> m.22'nin neyi degistirdigi BIRINCIL METINDEN okunmali.
 Endpoint (eptr2 path.py): mcp-smp-imb -> /electricity-service/v1/data/ptf-smf-sdf ?? (prefix data, prev reporting-service, label ptf-smf-sdf) -- tam yol asagida netlestirilecek

## 4. IKINCIL: Seffaflik API (eptr2 v1.4.1 aynasi; resmi teknik dokuman ACILAMADI)
- PTF: POST https://seffaflik.epias.com.tr/electricity-service/v1/markets/dam/data/mcp  (govde startDate,endDate)
- SMF: POST .../electricity-service/v1/markets/bpm/data/system-marginal-price
- Sistem yonu: POST .../electricity-service/v1/markets/bpm/data/system-direction
- PTF+SMF+SDF (EPIAS'in YAYIMLADIGI pozitif/negatif dengesizlik fiyati): POST https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf ?? (eptr2: prefix=data, prev=reporting-service, label=ptf-smf-sdf) ; web: https://seffaflik.epias.com.tr/electricity/electricity-market-reports/mcp-smp-and-imbalance-price-listing ("PTF, SMF ve SDF Listeleme")
  yanit alanlari (eptr2 kodundan gorulen): date, mcp(ptf), smp(smf), systemStatus ("Enerji Açığı"/"Enerji Fazlası"/"Dengede"; yayimlanmamis saatlerde bos), positiveImbalance, negativeImbalance
  davranis (eptr2 notu): bugunun tum saatleri doner, yayimlanmamis saatlerde SMP bos; 2026-11-01 gununun her saati IKI KEZ dondu (kopya satir) -> dedupe gerek
- Ayrica: imbalance-quantity, imbalance-amount, dsg-imbalance-quantity (markets/imbalance/data/...). Ayri bir "imbalance-price" ucu eptr2 v1.4.1'de YOK (ic katalogdaki `imbalance-price` anahtari teyit edilemedi).
- Auth: POST https://giris.epias.com.tr/cas/v1/tickets (username/password, Accept: text/plain) -> "TGT-..." ; isteklerde TGT basligi; eptr2 TGT'yi 1 sa 45 dk sonra yeniler (resmi omur teyit edilmedi). Kayit: https://kayit.epias.com.tr/epias-transparency-platform-registration-form
- Azami/asgari fiyat (eptr2 time.py, IKINCIL): 2026-04-04'ten 0 / 4500 TL/MWh (GIP 4635); 2025-04-05'ten 3400; 2024-07-01'den 3000; ... Kurul karar no eptr2'de YOK -> bulunamadi.
- ptf-smf-sdf ham yanit alanlari (eptr2 composite/price_and_cost.py'den): date (ISO, +03:00), time, ptf, smf, positiveImbalance, negativeImbalance, systemStatus. Istek tarih bicimi: startDate/endDate "YYYY-MM-DDTHH:00:00+03:00". Kontrat kodu PHyymmddHH (saatlik).
- Resmi teknik dokuman adresleri (ACILAMADI): https://seffaflik.epias.com.tr/electricity-service/technical/tr/index.html ; https://seffaflik.epias.com.tr/reporting-service/technical/en/index.html (ptf-smf-sdf raporlama servisinde olabilir)
- eptr2 notu: dengesizlik miktar/tutar (imb-qty/imb-vol) verisi "Settlement data is published after the 15th of the next month" (ikincil).

## 5. WebSearch (yalniz arama ozeti; sayfalar ACILAMADI) — 2026-11-24
- enerjigunlugu.net "EPDK'dan dengesizlik hesabına 100 TL/MWh düzenlemesi" (https://www.enerjigunlugu.net/epdkdan-dengesizlik-hesabina-100-tlmwh-duzenlemesi-70251h.htm): V=100 TL/MWh, 14911 sayili Kurul karari, RG 19 Ekim 2026; "yayimlandigi gunu izleyen fatura doneminden itibaren". -> eptr2 ile UYUMLU (2 ikincil kaynak).
- hibya: 24 Eylul 2026 tarihli 14907–14913 sayili yedi Kurul karari ayni RG'de.
- enerjigunlugu "Dengeleme yönetmeliğinde 28 maddelik değişiklik" (https://www.enerjigunlugu.net/dengeleme-yonetmeliginde-28-maddelik-degisiklik-70257h.htm) ; GENSED https://gensed.org/23777-2/ ; Lexology https://www.lexology.com/library/detail.aspx?g=6f5cf402-437a-4315-a02f-ac2ed2313353
- Arama ozeti: "SMF'ler uzlastirma doneminden sonra dort saat icinde duyurulur" (kaynak belirsiz, TEYITSIZ); "YAL/YAT teklifleri icin 10 MW asgari" (TEYITSIZ).
- Azami fiyat: arama ozeti -> 2 Nisan 2026 tarihli 14459 sayili Kurul Karari, GOP ve DGP asgari 0, azami 4.500 TL/MWh, 4 Nisan 2026'dan itibaren (cnbce, karar.com, steelradar; ikincil). eptr2 ile UYUMLU.
- grentistr.com rehberi (ikincil): "ayni yon %6, ters yon %3".
- !! k/l KARARI (arama ozeti, Lexpera kopyasi; sayfa ACILAMADI -> PARTIALLY): Enerji Piyasasi Duzenleme Kurulunun 11/12/2025 tarihli ve 14030 sayili Karari, RG 29/12/2025-33122.
  URL (ikincil): https://www.lexpera.com.tr/resmi-gazete/metin/enerji-piyasasi-duzenleme-kurulunun-11-12-2025-tarihli-ve-14030-sayili-karari-33122
  Ozet: sistem enerji ACIGI: l=0,03 k=0,06 ; enerji FAZLASI: l=0,06 k=0,03 ; DENGEDE: k=l=0,03.
  Yonetmelik metni (arama ozeti): k ve l "Kurul tarafından değeri "0" ile "1" arasında belirlenerek en az üç ay öncesinden duyurulmak kaydı ile" ; V_t,u baslangic degeri "150" TL/MWh, B_t,u baslangic degeri "100" TL/MWh, Kurul Karariyla belirlenir.
  RG 33122 icinde DUY degisikligi URL adayi: https://www.resmigazete.gov.tr/eskiler/2025/12/20251229-1.htm (ic foy) ; Yan Hizmetler Yon. degisikligi ...20251229-3.htm (arama)
  ACIK NOKTA: hangi harf (k mi l mi) pozitif/negatif dengesizlige uygulanir -> arama ozetleri CELISKILI. eptr2 + grentistr mantigi: sistem yonuyle AYNI yondeki dengesizlik %6, TERS yondeki %3 (acikta: negatif dengesizlik %6, pozitif %3). Harf eslemesi birincil metinden okunmadan YAYIMLANMAZ.
- V: 14911 sayili Kurul Karari (24/09/2026; RG 19/10/2026-33405): V=100 TL/MWh, yayimi izleyen fatura doneminden (1/11/2026) itibaren. Onceki: 150 (yonetmelik metnindeki baslangic degeri, 1/1/2026).
- Harf eslemesi (arama ozeti, RG 21/1/2025-32789 metninden): "l" = POZITIF enerji dengesizliginde, "k" = NEGATIF enerji dengesizliginde kullanilan katsayi; ikisi de Kurulca 0-1 arasi, en az uc ay onceden duyurularak belirlenir. -> 14030 ile birlikte: ACIK: negatif %6 (k), pozitif %3 (l); FAZLA: negatif %3, pozitif %6; DENGEDE ikisi %3. eptr2 koduyla UYUMLU. (Kullanicinin hafizasindaki k/l harfleri TERS.) PARTIALLY.
- Yan Hizmetler Yon. degisikligi (RG 29/12/2025-33122) tanimlarinda PEDF/NEDF (pozitif/negatif enerji dengesizlik fiyati), SMF_N, SMF_P, V_t,u (baslangic 150), B_t,u (baslangic 100) geciyor (arama ozeti).
- SMF yayim suresi ("dort saat"): arama ile TEYIT EDILEMEDI -> NOT VERIFIED. Foreks ozeti: SMF'lerin "ilgili uzlaştırma döneminin ardından belirlenerek piyasa katılımcılarına duyurulmasına ilişkin esaslar yeniden düzenlendi".
- DSG toleransi / YEKDEM / depolama muafiyetleri: arama ile bulunamadi. eptr2: dsg_tolerance 0.05 (dayanak gosterilmemis) ; KUPST ayri bir kalem (14029 -> 14907), 1/1/2027'den itibaren tuketim (cekis) birimlerine de KUPST (14907 Gecici m.1; eptr2 notu) -> Legal'e yonlendir.
- Itiraz/kesinlesme: 2021 tarihli haber (trthaber) — uzlastirma bildirimi/faturaya geriye donuk itiraz 12 ay, fatura tebliginden 60 gun icinde yazili; guncelligi TEYITSIZ. DUY madde no bulunamadi.
- Tarihsel derinlik, rate limit, resmi TGT omru: bulunamadi.

## 6. SONUC (2026-11-24)
Bu oturumda HICBIR birincil kaynak acilamadi. En guclu dayanaklar: (a) ic foy 12.11.2026 (birincil metinden, formul haric), (b) eptr2 v1.4.1 kodu (ikincil), (c) arama ozetleri (Lexpera 14030, enerjigunlugu 14911).
Elle teyit edilecek birincil belgeler: DUY konsolide m.109, m.110, m.111 (mevzuat.gov.tr 7.5.12985.pdf); RG 29/12/2025-33122 (DUY deg. m.17 + Kurul Karari 14030 + 14029); RG 19/10/2026-33405 (DUY deg. m.21-23 + Kurul Kararlari 14907, 14911); Kurul Karari 14459 (2/4/2026, azami fiyat); Seffaflik teknik dokumani (electricity-service + reporting-service).


## IKINCI TUR (2026-11-24) — resmi hostlar acildi; kaynak/ klasorundeki dosyalar + yeni indirmeler
## 7. DUY konsolide (kaynak/duy.pdf, mevzuat.gov.tr; 156 s.; degisiklik tablosu son satir "35- 19/10/2026 33405" -> 33405'i ICERIYOR; 33407 tabloda YOK) — pdftotext ile okundu
- m.109(1) BIREBIR: "Her bir teklif bölgesi için uzlaştırma dönemi bazında belirlenen Sistem Marjinal Fiyatı (SMFt,u), teklif bölgesinin uzlaştırma dönemi bazında enerji denge durumuna bağlı olarak aşağıdaki şekilde hesaplanır: a) Söz konusu (Değişik ibare: RG-19/10/2026-33405) uzlaştırma döneminde “t” teklif bölgesinde enerji açığı oluştuğunda, Sistem Marjinal Fiyatı, yük alma teklif fiyatlarının en düşüğünden başlanılmak üzere 101 inci madde uyarınca hesaplanan Net Talimat Hacmine tekabül eden en yüksek teklif fiyatına eşittir. b) ... enerji fazlası oluştuğunda, Sistem Marjinal Fiyatı, yük atma teklif fiyatlarının en yükseğinden başlanılmak üzere 101 inci madde uyarınca hesaplanan Net Talimat Hacmine tekabül eden en düşük teklif fiyatına eşittir. c) ... sistem dengede olduğunda, Sistem Marjinal Fiyatı, “t” teklif bölgesi ve “u” uzlaştırma dönemi için ... nihai piyasa takas fiyatına eşittir."
- m.110 baslik: "Enerji dengesizlik ... ve kesinleşmiş günlük üretim/tüketim programından sapma tutarının hesaplanması"; (1) "(Değişik: RG-29/12/2025-33122) Bir dengeden sorumlu tarafın her bir uzlaştırma dönemindeki enerji dengesizliğine ilişkin olarak bir fatura dönemi için tahakkuk ettirilecek borç ve/veya alacak tutarları aşağıdaki formüllere göre hesaplanır: (Değişik formül: RG-19/10/2026-33405) [GORUNTU] (Değişik formül: RG-19/10/2026-33405) [GORUNTU]"
- m.110(2) tanimlar BIREBIR: "AFLt,u : ... Gün Öncesi Piyasasında ve Dengeleme Güç Piyasasında Asgari ve Azami Fiyat Limitlerinin Belirlenmesine İlişkin Usul ve Esaslar uyarınca belirlenen azami fiyat limitini," ; "ku : Kurul tarafından değeri “0” ile “1” arasında belirlenerek katılımcıların negatif enerji dengesizliği halinde u uzlaştırma dönemindeki sistem yönüne bağlı olarak kullanılacak olan katsayıyı," ; "lu : ... pozitif enerji dengesizliği halinde u uzlaştırma dönemindeki sistem yönüne bağlı olarak kullanılacak olan katsayıyı," ; "Vt,u : Başlangıç değeri “150” (TL/MWh) olan ve Kurul Kararıyla belirlenen “t” teklif bölgesi ve “u” uzlaştırma dönemine ait birim fiyatı (TL/MWh)," ; "Bt,u : Başlangıç değeri “100” (TL/MWh) olan ve Kurul Kararıyla belirlenen ... birim fiyatı (TL/MWh)," ; SMF_N / SMF_P = "ç" donemleri SMF'lerinin maksimum / minimum olani; "ç : 91 inci maddenin ikinci fıkrası kapsamında tanımlanan ve dengeleme güç piyasasında uzlaştırma döneminde uygulanacak on beş dakikalık uzlaştırma dönemini"
  -> k = NEGATIF, l = POZITIF (VERIFIED). AFL (azami fiyat limiti) tanimda var -> tavan kosulu formulde olmali (goruntuden okunacak).
- m.110(3)-(6): KUPST ayri kalem; (5) "Kurul, bu madde kapsamında enerji dengesizlik ve kesinleşmiş günlük üretim/tüketim programından sapma tutarının hesaplanmasında kaynak bazlı ve depolamalı elektrik üretim tesisleri ile tüketim tesisleri için farklı metodolojiler veya katsayılar uygulayabilir."
- FORMULLER GORUNTU: metin katmaninda yok -> sayfa PNG'ye cevrilip okunacak.
- m.110(1) FORMUL — GORUNTUDEN OKUNARAK YAZILDI (duy.pdf s.102, 300 dpi kirpma work/duy_m110_crop-102.png):
  EDTA_f = ( Σ(t=1..m) Σ(u=1..n) max( EDT_f,t,u(+) ; 0 ) )            [Değişik formül: RG-19/10/2026-33405]
  EDTB_f = Σ Σ EDT_f,t,u(−) − ( Σ Σ min( EDT_f,t,u(+) ; 0 ) )          [Değişik formül: RG-19/10/2026-33405]
  EDM_f,t,u(−) > 0 ve max(NPTF_t,u , SMF_N_t,u) = AFL_t,u :   EDT_f,t,u(−) = ( EDM_f,t,u(−) × (AFL_t,u × 1,05) × (1 + k_u) )
  EDM_f,t,u(−) > 0 olan diğer hallerde;                        EDT_f,t,u(−) = ( EDM_f,t,u(−) × max(V_t,u , NPTF_t,u , SMF_N_t,u) × (1 + k_u) )
  EDM_f,t,u(+) > 0 ve min(NPTF_t,u , SMF_P_t,u) < V_t,u :      EDT_f,t,u(+) = ( EDM_f,t,u(+) × (−1) × (B_t,u) × (1 + l_u) )
  EDM_f,t,u(+) > 0 olan diğer hallerde;                        EDT_f,t,u(+) = ( EDM_f,t,u(+) × min(NPTF_t,u , SMF_P_t,u) × (1 − l_u) )
  SMF_N_t,u = max(SMF_t,ç) ; SMF_P_t,u = min(SMF_t,ç)                                          (17)
  => Sinir kosulu KESIN "<" (min(NPTF,SMF_P) < V). min = V ise normal dal. Tavan kosulu "=" AFL; %5 ek carpan METINDE VAR (1,05) ve (1+k) ile CARPILIR.
  => Pozitif dengesizlik "fiyati" V'nin altinda −B×(1+l): tutar NEGATIF olur; 33405 ile EDTA yalniz pozitif tutarlari, EDTB negatif cikan pozitif-dengesizlik tutarlarini da borca alir.
## 8. RG 19/10/2026-33405 DUY degisikligi (kaynak/rg33405.pdf; metin katmani bozuk -> s.7 ve s.8 GORUNTUDEN okundu)
- "MADDE 21- Aynı Yönetmeliğin 109 uncu maddesinin birinci fıkrasında yer alan “saatte” ibareleri “uzlaştırma döneminde” şeklinde değiştirilmiş, ikinci fıkrasına aşağıdaki cümle eklenmiştir. “Ancak 72 nci maddenin üçüncü fıkrası kapsamında soğuk veya ılık yedek olduğundan dolayı talimatlandırılmamış olan UEVÇB’lerin teklifleri Sistem Marjinal Fiyatının belirlenmesinde dikkate alınmaz.”"
- "MADDE 22- Aynı Yönetmeliğin 110 uncu maddesinin birinci fıkrasında yer alan “EDTAf ve EDTBf” formülleri ve altıncı fıkrası aşağıdaki şekilde değiştirilmiştir." -> yalniz EDTA_f = (ΣΣ max(EDT(+);0)) ve EDTB_f = ΣΣ EDT(−) − (ΣΣ min(EDT(+);0)) TOPLAMA formulleri (goruntu) + f.6 (toplayici KUPST). DONEM BAZLI FIYAT FORMULU (EDT(−), EDT(+)) 33405 ILE DEGISMEDI -> o kisim 33122'den.
- "MADDE 23- ... 111 inci maddesinin ikinci fıkrasında yer alan “KEYALMf,d,u,r” ve “KEYATMf,d,u,r” tanımları aşağıdaki şekilde değiştirilmiş ve aynı fıkraya aşağıdaki “g” tanımı eklenmiştir." ; "g “u” uzlaştırma dönemindeki 91 inci madde kapsamında dengeleme güç piyasasında uygulanan uzlaştırma dönemi sayısını,"
- "MADDE 24- ... 113 üncü maddesinin ikinci fıkrasının (a) ve (b) bentlerinde yer alan “yük atma talimatlarına” ibarelerinden sonra gelmek üzere “, beklenen üretim/tüketim miktarından sapmalarına” ibareleri eklenmiştir."
- "MADDE 26- ... GEÇİCİ MADDE 41- (1) 72 nci maddenin üçüncü fıkrasının (a) bendi uyarınca, devrede olan termik kaynaklı UEVÇB’ye yük değişim eğrilerine göre talimat verilmesi 1/1/2027 tarihinden itibaren uygulanır."
- "MADDE 27- Bu Yönetmelik yayımı tarihinde yürürlüğe girer." "MADDE 28- Bu Yönetmelik hükümlerini Enerji Piyasası Düzenleme Kurumu Başkanı yürütür."
## 9. RG 29/12/2025-33122 (bu oturumda indirildi; kaynak2/)
- Fihrist https://www.resmigazete.gov.tr/eskiler/2025/12/20251229.htm : 1=DUY degisikligi (20251229-1.htm), 3=Yan Hizmetler, 18=Kurul Karari 14029 (20251229-18.pdf), 19=Kurul Karari 14030 (20251229-19.pdf).
- DUY deg. (20251229-1.htm, cp1254): "MADDE 17- Aynı Yönetmeliğin 110 uncu maddesinin birinci ve ikinci fıkraları aşağıdaki şekilde değiştirilmiştir. “(1) Bir dengeden sorumlu tarafın her bir uzlaştırma dönemindeki enerji dengesizliğine ilişkin olarak bir fatura dönemi için tahakkuk ettirilecek borç ve/veya alacak tutarları aşağıdaki formüllere göre hesaplanır: [GORUNTU: 20251229-1_dosyalar/image002.jpg]" ; "MADDE 23- Bu Yönetmelik 1/1/2026 tarihinde yürürlüğe girer."
  Goruntuden okundu (image002.jpg): 33122'deki ilk hal EDTA_f = max( ΣΣ EDT(+) ; 0 ), EDTB_f = ΣΣ EDT(−) − min( ΣΣ EDT(+) ; 0 ); donem bazli EDT(−)/EDT(+) formulleri ve tanimlar konsolide metindekiyle AYNI (AFL×1,05×(1+k); max(V,NPTF,SMF_N)×(1+k); min(NPTF,SMF_P)<V -> ×(−1)×B×(1+l); diger -> min(NPTF,SMF_P)×(1−l)).
  => 33405 m.22 yalniz max/min'i toplamin ICINE aldi (donem bazinda isaret ayrimi). Fiyat formulu 1/1/2026'dan beri degismedi. (eptr2 "formula unchanged" ile celiski COZULDU.)
- m.22 (33122): 133(5) "Başvuru tarihi itibarıyla en fazla on iki ay önceki fatura dönemine ait itiraz başvuruları, itiraz başvurusunu takip eden üç ay içerisinde Piyasa İşletmecisi tarafından sonuçlandırılması veya Piyasa İşletmecisi tarafından diğer hataların tespit edilmesi durumunda, gerekli düzeltme işlemi gerçekleştirilir. Yapılan düzeltme piyasa katılımcısına yazılı olarak veya PYS üzerinden bildirilir."
- KURUL KARARI 14030 (20251229-19.pdf, taranmis goruntu; GORUNTUDEN okundu): "Karar No: 14030 Karar Tarihi: 11/12/2025 — Enerji Piyasası Düzenleme Kurulunun 11/12/2025 tarihli toplantısında; Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliğinin 110 uncu maddesi uyarınca enerji dengesizlik tutarının hesabında kullanılan “k” ve “l” katsayılarının 01/01/2026 teslim gününden itibaren, ilgili uzlaştırma döneminde; 1) Sistem enerji açığı yönünde ise “l” katsayısı 0,03 ve “k” katsayısı 0,06, 2) Sistem enerji fazlası yönünde ise “l” katsayısı 0,06 ve “k” katsayısı 0,03, 3) Sistem dengede ise “l” ve “k” katsayıları 0,03, olarak uygulanmak üzere piyasa katılımcılarına duyurulmasına, karar verilmiştir."  VERIFIED.
## 10. RG 19/10/2026-33405 Kurul Kararlari (https://www.resmigazete.gov.tr/eskiler/2026/10/20261019-9.pdf ; 10 s. taranmis goruntu; GORUNTUDEN okundu) — fihrist: "Enerji Piyasası Düzenleme Kurulunun 24/09/2026 Tarihli ve 14907, 14908, 14909, 14910, 14911, 14912 ve 14913 Sayılı Kararları"
- KARAR 14911 (s.8) BIREBIR: "Karar No: 14911 Karar Tarihi: 24/09/2026 — Enerji Piyasası Düzenleme Kurulunun 24/09/2026 tarihli toplantısında; Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliğinin 110 uncu maddesi uyarınca enerji dengesizlik tutarının hesabında kullanılan “Vt,u” değerinin kararın Resmi Gazete’de yayımlandığı günü takip eden fatura döneminden itibaren 100 TL/MWh olarak uygulanmak üzere piyasa katılımcılarına duyurulmasına, karar verilmiştir."  VERIFIED. (fatura donemi = takvim ayi, m.90 -> 1/11/2026 00:00'dan itibaren; onceki V=150 = yonetmelikteki baslangic degeri)
- KARAR 14907 (s.1-4) "Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliğinin 110 uncu Maddesi Uyarınca KÜPSM Değerinin ve KÜPSM ile KÜPST Hesaplamalarında Kullanılacak Katsayıların Belirlenmesi Hakkında Karar":
  m.2 n katsayisi: depolamali uretim 0,10; dengeleme birimi topluluklar 0,05; iletimden bagli lisanssiz 0,02; dagitimdan bagli lisanssiz 0,01; mustakil depolama 0,02; "e) Tüketim kapsamında oluşturulan uzlaştırmaya esas veriş çekiş birimleri için 0,01"; diger uretim: ariza adedi >=30 (yenilenebilir) / >=25 (diger) ise 0,08 degilse 0,05.
  m.3 tolerans: Rüzgar 0,15; Güneş 0,08; Depolamalı 0,05; Diğer 0,05; iletimden lisanssiz 0,20; dagitimdan lisanssiz 0,25; mustakil depolama 0,20; "(g) Dengeleme ve Uzlaştırma Yönetmeliğinin 17nci maddesinin ikinci fıkrasının (a), (b), (c) ve (ç) bentleri kapsamında oluşturulan uzlaştırmaya esas çekiş birimleri 0,75"; "(ğ) Diğer tüketimlere ilişkin uzlaştırmaya esas çekiş birimleri 0,30".
  "MADDE 6 – (1) 11/12/2025 tarihli ve 14029 sayılı Kurul Kararı yürürlükten kaldırmıştır." "GEÇİCİ MADDE 1- (1) Bu Karar’ın 2 nci maddesinin birinci fıkrasının (e) bendi ile 3 üncü maddesinin birinci fıkrasının (g) ve (ğ) bentleri 1/1/2027 tarihinden itibaren uygulanır." "MADDE 7 – (1) Bu Karar, yayımlandığı günü takip eden fatura dönemi itibarıyla yürürlüğe girer."
  => 1/1/2027'den itibaren TUKETIM (cekis) birimlerine KUPST: n=0,01, tolerans 0,30 (m.17/2 a-ç birimleri 0,75). VERIFIED (goruntu). Voltage icin dogrudan ilgili -> Legal + Market Risk.
- KARAR 14908 (s.5): TEIAS yerine getirilmeyen talimat raporlamasi kriterleri (konu disi).
## 11. DUY konsolide — diger maddeler (duy.pdf, pdftotext; BIREBIR)
- m.90(1): "Fatura dönemi, bir takvim ayının ilk günü saat 00:00’da başlayıp, aynı ayın son günü saat 24:00’da biten süreyi ifade eder."
- m.91: "(1) Bir fatura dönemi içerisindeki her bir saat bir uzlaştırma dönemini oluşturur. (2) (Ek: RG-21/1/2025-32789) Dengeleme güç piyasasında uzlaştırma dönemi on beş dakika olarak uygulanır."
- Gecici 40(1): "91 inci maddenin ikinci fıkrası kapsamında dengeleme güç piyasasında on beş dakikalık uzlaştırma dönemi için gerekli altyapı hazırlıkları sistem işletmecisi ve piyasa işletmecisi tarafından en geç 1/1/2027 tarihine kadar tamamlanır. Bu kapsamda söz konusu fıkraya ilişkin uygulamalar 1/1/2027 tarihine kadar başlatılmaz."
- m.68(1)(e): "(Değişik: RG-19/10/2026-33405) Her bir uzlaştırma dönemine ilişkin dengeleme güç piyasasında belirlenen sistem marjinal fiyatları, Sistem İşletmecisi tarafından ilgili uzlaştırma dönemini takip eden dört saat içinde belirlenerek piyasa katılımcılarına duyurulur."  -> SMF en gec donemden 4 saat sonra (VERIFIED; duyuran TEIAS=Sistem Isletmecisi).
- m.68(1)(d) son cumle: "Piyasa İşletmecisi, PYS aracılığıyla Sistem Marjinal Fiyatı ile yük alma ve yük atma talimatlarının belirlenmesinde; Kurum tarafından Başkan oluru ile yayımlanan Dengeleme Güç Piyasası Kapsamında Etiket Değerlerinin Belirlenmesi ve Sistem Marjinal Fiyatının Hesaplanması Prosedürünü esas alır."
- m.4/1-üüü: "Sistem marjinal fiyatı: Sistem yönünün enerji açığını göstermesi halinde yük alma teklif fiyatlarının en düşüğünden, sistem yönünün enerji fazlasını göstermesi halinde yük atma teklif fiyatlarının en yükseğinden başlanılmak üzere, dengeleme güç piyasası kapsamında verilen tüm talimatlar dikkate alınarak belirlenen net talimat hacmine tekabül eden teklif fiyatını,"
- m.101 baslik "Uzlaştırma dönemi bazında sistemin yönünün belirlenmesi": "(1) Uzlaştırma dönemi bazında bir fiyat bölgesine ilişkin sistem yönü ve Net Talimat Hacmi aşağıdaki formüllere göre belirlenir: ... (9a) ise ... enerji açığı oluşmuştur. ... (9b) ise ... enerji fazlası oluşmuştur. ... (9c) ise ... sistem dengededir." YALM/YATM = "0, 1 veya 2 etiket değerlerine sahip" kabul edilen YAL/YAT teklif miktarlari. (formuller goruntu, s.94)
- m.111(5): "Dengeden sorumlu grup üyesi piyasa katılımcısı için ilgili teklif bölgesi ve uzlaştırma dönemi bazında hesaplanan dengesizlik oranının yüzde ondan küçük veya eşit olması halinde ilgili piyasa katılımcısının bireysel enerji dengesizlik miktarının tamamı dengeden sorumlu grup içerisinde değerlendirilir. İlgili piyasa katılımcısının dengesizlik oranının yüzde ondan büyük olması halinde; dördüncü fıkra kapsamında belirlenen piyasa hacminin yüzde onuna denk gelen bireysel enerji dengesizlik miktarı dengeden sorumlu grup içerisinde değerlendirilirken, piyasa hacminin yüzde onunu aşan bireysel dengesizlik miktarı için ilgili piyasa katılımcısının bireysel enerji dengesizlik tutarı, 110 uncu maddenin birinci fıkrası uyarınca hesaplanarak dengeden sorumlu tarafa ayrıca yansıtılır. Bu fıkra kapsamında uygulanan dengesizlik oranının ne kadar düşürüleceği, her yılın 1 Aralık tarihine kadar Kurul kararı ile belirlenir."  (konsolide metinde YUZDE ON; guncel Kurul karari degeri AYRICA teyit edilmeli — eptr2 %5 diyor)
- Gecici 39(1): dagitim + gorevli tedarik DSG'leri icin dengesizlik orani "1/1/2027 tarihine kadar yüzde yüz olarak uygulanır."
- m.132/A(1): "...ön uzlaştırma bildirimi ... en geç fatura dönemini takip eden ayın onbirinci günü, nihai uzlaştırma bildirimi ise, fatura dönemini takip eden ayın onbeşinci günü, ... ayın onbeşinci gününün hafta sonu veya resmi tatile denk gelmesi durumunda hafta sonu veya resmi tatilin bitimini takip eden işgünü PYS aracılığı ile ilgili piyasa katılımcılarına duyurulur."
- m.132/B(1): on uzlastirma bildirimine itiraz "bildirimlerin yapıldığı ayın on ikinci günü saat 17:30’a kadar"; m.134(1): hakli itirazda duzeltme "takip eden ilk ön uzlaştırma bildiriminde belirtilir ve ilgili fatura bildiriminde, geçmişe dönük düzeltme kalemi olarak yer alır. Geçmişe dönük düzeltme kalemi, düzeltme yapılan fatura dönemine ilişkin tüm dengesizlik uzlaştırması işlemlerinin yeniden yapılarak ... belirlenir."
- m.101(1) formuller GORUNTUDEN (duy.pdf s.95): (9a) ΣΣ YALM_d,u,r > ΣΣ YATM_d,u,r ise "enerji açığı oluşmuştur"; (9b) ΣΣ YALM < ΣΣ YATM ise "enerji fazlası oluşmuştur"; (9c) esitse "sistem dengededir"; (9d) NTH_u = | ΣΣ YALM − ΣΣ YATM |.  => Sistem yonu TALIMAT HACIMLERIYLE tanimli (0/1/2 etiketli kabul edilen YAL/YAT), PTF-SMF karsilastirmasiyla DEGIL. Hesaplayici sistem yonunu EPIAS verisinden almali; PTF/SMF'den cikarim yalniz yaklasimdir.
## 12. RG 21/1/2025-32789 (https://www.resmigazete.gov.tr/eskiler/2025/01/20250121-3.htm ; bu oturumda indirildi)
- "MADDE 12- Aynı Yönetmeliğin 91 inci maddesine aşağıdaki fıkra eklenmiştir. “(2) Dengeleme güç piyasasında uzlaştırma dönemi on beş dakika olarak uygulanır.”"
- "MADDE 13- Aynı Yönetmeliğin 110 uncu maddesinin birinci, ikinci, üçüncü ve dördüncü fıkraları aşağıdaki şekilde değiştirilmiştir." Formul GORUNTUDEN (image007.jpg): EDT_f = Σ(t=1..m) Σ(u=1..n) [ ( EDM_f,t,u(−) × max(NPTF_t,u , SMF_N_t,u) × (1+k) ) + ( EDM_f,t,u(+) × min(NPTF_t,u , SMF_P_t,u) × (1−l) ) ] ; SMF_N = max(SMF_t,ç) ; SMF_P = min(SMF_t,ç). Tanimlar: "k Kurul tarafından değeri “0” ile “1” arasında belirlenerek en az üç ay öncesinden duyurulmak kaydı ile katılımcıların negatif enerji dengesizliği halinde kullanılacak olan katsayıyı, l ... pozitif enerji dengesizliği halinde kullanılacak olan katsayıyı" (sistem yonu, V, B, AFL YOK). f.3-4: KUPST "ç" donemi bazinda.
- "MADDE 20- Bu Yönetmeliğin; a) 4 üncü maddesi 1/6/2025 tarihinde, b) 5 inci ve 13 üncü maddeleri 1/1/2027 tarihinde, c) Diğer maddeleri yayımı tarihinde, yürürlüğe girer."
- => BILINEN: 32789 m.13, 1/1/2027'de m.110(1)-(4)'u V/B/AFL'siz ve yon-bagimsiz k/l ile YENIDEN yazacak sekilde yayimlanmis; sonradan 33122 m.17 (1/1/2026) ve 33405 m.22 ayni fikralari degistirmis. Konsolide metinde (24.11.2026) 32789 m.13'e dair dipnot/isaret YOK.
- => BILINMEYEN: 1/1/2027'de hangi metnin gecerli olacagi (32789 m.13 ortulu olarak hukumsuz mu kaldi, yoksa 1/1/2027'de devreye mi girer). Okunan hicbir metin bunu acikca cozmuyor -> HUKUK GORUSU / EPDK teyidi. Sayfada 2027 sonrasi icin formul TAAHHUDU verilmemeli.
- m.133(1): itiraz "...diğer durumlarda Piyasa İşletmecisine faturanın tebliğ tarihinden itibaren 60 gün içinde yazılı olarak yapılır." ; m.133(5) (33122 ile): "Başvuru tarihi itibarıyla en fazla on iki ay önceki fatura dönemine ait itiraz başvuruları..."
- m.70(4)(a) [azami fiyat]: "Dengeleme güç piyasasına sunulacak tüm teklif fiyatlarına ilişkin asgari ve azami fiyat limitleri, Kurul tarafından onaylanarak yürürlüğe giren Gün Öncesi Piyasasında ve Dengeleme Güç Piyasasında Asgari ve Azami Fiyat Limitlerinin Belirlenmesine İlişkin Usul ve Esaslar uyarınca Piyasa İşletmecisi tarafından belirlenerek PYS aracılığıyla piyasa katılımcılarına duyurulur."
- m.136(1): "...veri ve bilgilerin Piyasa İşletmecisinin uhdesindeki Şeffaflık Platformunda yayımlanması esastır. Şeffaflık Platformunda yayımlanacak bilgi ve veriler, yayımlanma periyodları ... Organize Toptan Elektrik Piyasalarında Şeffaflığın Teminine İlişkin Usul ve Esaslar ile belirlenir."
## 13. EPIAS resmi teknik dokuman — raporlama servisi (kaynak/raporlama-en.html = https://seffaflik.epias.com.tr/reporting-service/technical/en/index.html ; "transparency-reporting", Version v1.3.28) VERIFIED
- "Host : seffaflik.epias.com.tr  BasePath : /reporting-service  Schemes : HTTPS"
- "5.22. PTF SMF ve SDF Listeleme Servisi — POST /v1/data/ptf-smf-sdf" -> tam yol https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf ; (export: POST /v1/export/ptf-smf-sdf, exportType XLSX/CSV/PDF)
- Header: "TGT required — Required TGT header for authentication." ; Body PtfSmfSdfRequestDto: startDate (required, "Date value formatted as 2023-01-01T00:00:00+03:00"), endDate (required), page (optional, Paging info).
- Yanit PtfSmfSdfResponseDto: items = < PtfSmfSdfDataDto > array, page. PtfSmfSdfDataDto alanlari (hepsi optional): date "Date value formatted as 2023-01-01T00:00:00+03:00" string(date-time); negativeImbalance "Negative Imbalance Price (TL/MWh)" number; positiveImbalance "Positive Imbalance Price (TL/MWh)" number; ptf "MCP" number; smf "SMP" number; systemStatus "SMP Direction" string; time string(date-time).
- Auth: "you must first obtain a TGT (ticket granting ticket) from ... for production https://giris.epias.com.tr" ; POST https://giris.epias.com.tr/cas/v1/tickets (x-www-form-urlencoded username/password, Accept text/plain) -> "HTTP 201 Created with a TGT value" ; "Time-to-live(TTL) for TGT is 2 hours, you can use the same TGT for different service endpoints for this TTL period."
- Tarih: "The date fields in all incoming and outgoing messages to the service are in ISO-8601 format. The format should be yyyy-MM-dd’T’HH:mm:ssXXX. Data in this platform are displayed in Turkish time zone(which is +0300, for older data consider older daylight savings rules)"
- Dokumanda bu servis icin yayim saati, kesin/gecici ayrimi, istek basina tarih araligi siniri, cozunurluk ifadesi: YOK (aranacak: asagida grep).
## 14. EPIAS resmi teknik dokuman — electricity-service (kaynak/seffaflik-tr.html = https://seffaflik.epias.com.tr/electricity-service/technical/tr/index.html ; "Versiyon : v1.16.4"; "Sunucu : seffaflik.epias.com.tr  Kök Dizin : /electricity-service  Şemalar : HTTPS") VERIFIED
- 5.113 "Sistem Marjinal Fiyatı Listeleme Servisi — POST /v1/markets/bpm/data/system-marginal-price" ; Aciklama BIREBIR: "Sistem Marjinal Fiyatı, Dengeleme Güç Piyasasında net talimat hacmine karşılık gelen teklifin fiyatıdır. Veriler 4 saat önceki talimatları yansıtmaktadır." ; Header TGT gerekli; Body SystemMarginalPriceRequestDto {startDate gerekli, endDate gerekli, page opsiyonel, region opsiyonel "Bölge kısa adı (Ör: TR1 ...)"} ; Yanit items[] SystemMarginalPriceDataDto {date string(date-time) "2023-01-01T00:00:00+03:00 formatında tarih bilgisi."; hour "Saat Bilgisi" string(date-time); systemMarginalPrice "Sistem Marjinal Fiyatı (TL/MWh)" number} + statistics.smpArithmeticalAverage
- 5.112 "Sistem Yönü Listeleme Servisi — POST /v1/markets/bpm/data/system-direction" ; Aciklama: "Sistemde elektrik fazlası veya elektrik açığı olduğunu gösterir. Veriler 4 saat önceki talimatları yansıtmaktadır." ; Body SystemDirectionRequestDto {startDate, endDate gerekli; page, region opsiyonel} ; Yanit items[] SystemDirectionDataDto {date; hour "Saat Bilgisi" string; smpDirectionId integer(int64) (aciklama bos); systemDirection string (dokumandaki aciklama "Piyasa İşlem Hacmi" — bariz dokuman hatasi)}
- 5.128 "Piyasa Takas Fiyatı (PTF) Listeleme Servisi — POST /v1/markets/dam/data/mcp" ; Aciklama: "Piyasa Takas Fiyatı, Gün Öncesi Piyasası’na sunulan tekliflerin arz ve talebe göre eşleşmesiyle oluşan saatlik elektrik enerjisi fiyatıdır.Gösterge niteliğindeki Türkiye Cumhuriyet Merkez Bankası döviz alış kuru esas alınmıştır." ; Body PtfRequestDto {startDate, endDate gerekli; page opsiyonel} ; Yanit items[] PtfResponseDataDto {date; hour "Saat Bilgisi"; price "TL cinsinden PTF bilgisi (TL/MWh)."; priceEur; priceUsd} + statistic
- 5.125 K.PTF: POST /v1/markets/dam/data/interim-mcp ; "…itiraz süreci tamamlanmamış saatlik elektrik enerjisi fiyatıdır." ; body yalniz startDate ; alan marketTradePrice "K.PTF (TL/MWh)"
- TGT: "Bu şekilde alınan TGT bilgisinin 2 saat geçerliliği vardır. Bu süre zarfında, aynı TGT bilgisini, farklı servislere istek atarken kullanabilirsiniz."
- Dengesizlik: 5.183 Dengesizlik Tutarı, 5.184 Dengesizlik Miktarı, 5.181 DSG Dengesizlik Miktarı servisleri var; AYRI bir "dengesizlik fiyatı" servisi electricity-service'te YOK -> fiyat yalniz reporting-service ptf-smf-sdf'te.
- Dokumanlarda: istek basina tarih araligi siniri, rate limit, SMF icin kesin/gecici ayrimi, 15 dakikalik cozunurluk ifadesi YOK (grep: "en fazla", "tarih aralığı", "15 dakika", "kesinleş" -> ilgili sonuc yok). Tum fiyat DTO'larinda donem = date + hour (saatlik).
## 15. Azami/asgari fiyat limiti — KURUL KARARI 14459 (RG 3/4/2026; https://www.resmigazete.gov.tr/eskiler/2026/04/20260403-12.pdf s.47; fihrist "Enerji Piyasası Düzenleme Kurulunun 02/04/2026 Tarihli ve 14436, 14437 ve 14459 Sayılı Kararları"; taranmis -> GORUNTUDEN okundu) VERIFIED
- "Karar No: 14459 Karar Tarihi: 02/04/2026" — "Gün Öncesi Piyasasında ve Dengeleme Güç Piyasasında Asgari ve Azami Fiyat Limitlerinin Belirlenmesine İlişkin Usul ve Esaslarda Değişiklik Yapılmasına Dair Usul ve Esaslar": "MADDE 1 – 21/06/2015 tarihli ve 29393 sayılı Resmî Gazete’de yayımlanan ... Usul ve Esasların geçici 1 inci maddesinin beşinci fıkrası aşağıdaki şekilde değiştirilmiştir. “(5) Bu fıkra hükmünün yürürlüğe girdiği tarihten itibaren Kurul tarafından yeni bir karar alınıncaya kadar; ilgili piyasalarda asgari fiyat limitleri 0 TL/MWh, azami fiyat limitleri ise 4.500 TL/MWh olarak uygulanır. Bu uygulama süresince bu Usul ve Esasların 4 üncü maddesinin ikinci fıkrası hükümleri uygulanmaz.” MADDE 2 – Bu Usul ve Esaslar 4/4/2026 tarihinde yürürlüğe girer."
- Sonradan degisip degismedigi (4/4/2026 -> 24/11/2026): asagida EPIAS duyurulari ile kontrol.
- EPIAS duyurusu (https://www.epias.com.tr/tum-duyurular/piyasa-duyurulari/elektrik/dgp/gun-oncesi-piyasasinda-ve-dengeleme-guc-piyasasinda-azami-fiyat-limitinin-4-500-tl-mwh-belirlenmesine-iliskin-kurul-karari/ ; yayim 2026-04-02T14:11:58): 14459 sayili Kurul Karari metnini aynen aktarir; "yürürlüğe giriş tarihi 4 Nisan 2026". EPIAS site aramasi ("azami fiyat", "fiyat limit"; 24.11.2026): en yeni limit duyurusu BU (4.500); sonrasinda yeni limit duyurusu YOK. -> 24.11.2026 itibariyla 0 / 4.500 TL/MWh (VERIFIED: RG 3/4/2026 + EPIAS duyurusu; sonraki degisiklik icin yalniz EPIAS duyuru aramasi yapildi).
## 16. Kullanim kosullari / yeniden yayim
- epias.com.tr site aramasi ("kullanım koşulları", "yasal uyarı"): ilgili sayfa YOK. seffaflik.epias.com.tr ana sayfa (SPA) ve main.7c3b58f0.js icinde "kullanım koşul", "yasal uyarı", "terms of use", "disclaimer", "kaynak göster", "izinsiz" dizgileri: 0 sonuc. -> Seffaflik verisi icin yayimlanmis bir yeniden-kullanim/atif kosulu BULUNAMADI. Dayanak: DUY m.136(1) + "Organize Toptan Elektrik Piyasalarında Şeffaflığın Teminine İlişkin Usul ve Esaslar" (metni okunmadi). -> Legal & Compliance; gerekirse EPIAS'a yazili soru.
- Seffaflik arayuz etiketleri (main js): "Negatif Dengesizlik Fiyatı", "Pozitif Dengesizlik Fiyatı", "SMF Yön" ; servis url "/reporting-service/v1/data/ptf-smf-sdf".
- Konsolide metin kontrolu: kaynak/duy.pdf == https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.12985.pdf (24.11.2026 indirildi, bayt-bayt ayni; 156 s.). Degisiklik tablosu 35 satir, son "19/10/2026 33405". "33407" metinde 0 kez geciyor -> RG 21/10/2026-33407 (m.132/E-4-c) konsolide metne ISLENMEMIS gorunuyor (ic foy 12.11'de "36 degisiklik" diyordu: CELISKI, Orchestrator'a not). m.110 acisindan etkisi yok.

## 17. SONUC — ikinci tur (2026-11-24)
YAYIMLANABILIR FORMUL (1/11/2026'dan itibaren; birincil metinden):
  Negatif dengesizlik birim fiyati = max(V, PTF, SMF_N) × (1 + k)   ; max(PTF, SMF_N) = azami fiyat limiti (AFL) ise: AFL × 1,05 × (1 + k)
  Pozitif dengesizlik birim fiyati = min(PTF, SMF_P) × (1 − l)       ; min(PTF, SMF_P) < V ise: −B × (1 + l)
  k (negatif) / l (pozitif): acik 0,06 / 0,03 ; fazla 0,03 / 0,06 ; dengede 0,03 / 0,03 (Karar 14030, 1/1/2026 teslim gununden)
  V = 100 TL/MWh (Karar 14911, Kasim 2026 fatura doneminden; oncesi 150) ; B = 100 TL/MWh (m.110(2) baslangic degeri; degistiren karar okunan sayilarda yok)
  AFL = 4.500 TL/MWh, asgari 0 (Karar 14459, 4/4/2026'dan)
  Bugun DGP donemi saatlik uygulandigindan SMF_N = SMF_P = saatin SMF'si (Gecici 40: 15 dk uygulamasi 1/1/2027'den once baslatilmaz).
TEST ORNEKLERI (uydurma girdiler, yayinlanmaz): 
  A) acik: PTF 2.800, SMF 3.400 -> neg 3.400×1,06 = 3.604,00 ; poz 2.800×0,97 = 2.716,00 ; PTF'ye gore maliyet neg 804,00 / poz 84,00
  B) fazla + min<V: PTF 450, SMF 60 -> neg max(100,450,60)×1,03 = 463,50 ; poz 60<100 -> −100×1,06 = −106,00 ; maliyet neg 13,50 / poz 556,00
  C) fazla normal: PTF 2.000, SMF 1.200 -> neg 2.060,00 ; poz 1.200×0,94 = 1.128,00 ; maliyet 60,00 / 872,00
  D) sinir: fazla, PTF 450, SMF 100 (= V) -> poz 100×0,94 = 94,00 (kosul kesin "<")
  E) tavan: acik, PTF 4.500, SMF 4.500 -> neg 4.500×1,05×1,06 = 5.008,50 ; poz 4.500×0,97 = 4.365,00
ACIK KALANLAR: (1) 1/1/2027'de m.110: 32789 m.13 vs 33122/33405 metni (hukuk). (2) 15 dk DGP baslayinca "u" doneminin sistem yonunun nasil belirlenecegi + Seffaflik'in SMF'yi 15 dk yayimlayip yayimlamayacagi. (3) Seffaflik yeniden kullanim/atif kosullari. (4) ptf-smf-sdf: tarihsel derinlik, istek basi aralik siniri, positiveImbalance'in V dalinda isareti, gecici/kesin statusu (dokumanda yok; canli veriyle test). (5) DSG dengesizlik orani guncel Kurul karari (konsolide: %10). (6) Yuvarlama kurali (okunan metinde yok). (7) 14030/14911/14459 sonrasi baska karar olmadigi yalniz okunan RG sayilari + EPIAS duyuru aramasiyla kontrol edildi (tam EPDK karar taramasi yapilmadi).
