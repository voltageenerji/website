# GD-SEO-05 — Tam site denetimi ve "Enerji deyince Voltage" programı (2026-11-12)

Sahibin hedefi: "Daha fazla iyileştirme için bütün siteyi baştan sona analiz et. Enerji diyenin aklına Voltage gelene kadar devam."

Beş denetim (salt okuma, 12.11.2026): teknik SEO (seo-technical), içerik ve talep (seo-strategy), marka/varlık ve yapay zekâ görünürlüğü (seo-brand-entity), dönüşüm (conversion), uyum ve doğruluk (legal-compliance). Ham raporlar oturum kayıtlarında; bu belge sentez ve karardır. GSC verisi: 2026-10-10 – 11-06 (62 tık, 2.297 gösterim, pos. 7,0; gösterimlerin %72'si anonim sorgu).

## 1. Teşhis

1. **Site teknik olarak sağlam.** 28/28 URL 200, tekil canonical, kırık bağlantı ve yetim sayfa yok; GSC'de denetlenen 21 URL'nin 21'i dizinde. Hız lab ölçümünde iyi (CLS 0, TBT 0); tek ölçülebilir kayıp Google Fonts (~0,6–0,7 s mobil FCP).
2. **Görünürlük yalnız bilgi sorgularında.** Ticari sorgularda (fabrika/sanayi elektrik tedarikçisi) yokuz; ticari sayfa 12.11'de yayına girdi, Google site haritasını 07.11'den beri okumadı.
3. **Dışarıda bizi doğrulayan kaynak yok.** Lisans numarası aramada sonuç vermiyor; basın yok; Wikidata yok; tek dış kayıt Crunchbase (YEK-G ifadesi yanlış). Yapay zekâ asistanları "şirketin kendi beyanı" diyor. Kalıcı etki buradan gelir.
4. **Dönüşüm yolunda üç mekanik hata** (rehber CTA'sı formu göstermiyor, mobilde başarı mesajı ekran dışında, lead kaynağı kaydedilmiyor) — düzeltiliyor.
5. **Ana sayfada bazı ifadeler kurallarla ya da sahip beyanıyla çelişiyor** (endeksli riskin "bilançomuzda absorbe" edildiği cümle, "ilk oyuncularından/pioneer", "KVKK UYUMLU" rozeti, "endüstriyel enerji ortağı", "güvenilir", "+20 yıl yenilemeyle 2051+", bozuk EN cümle, rozetler). Sahip onayı ve önizleme gerekir.
6. **İngilizce içerik dizine girmiyor** (EN metin yalnız `data-en` özniteliklerinde). Statik `/en/` gerekir; sahip onayı.

## 2. Program (dalgalar)

### Dalga 1 — onay gerektirmeyen (başladı)
| Eylem | Kaynak denetim | Durum |
|---|---|---|
| Form yolu: CTA'lar `/?kaynak=…#leadForm`, çapa sabitleme, başarı/hata mesajı görünür ve odaklı, lead'e `kaynak` alanı, fatura aracında sonuç altı CTA | Dönüşüm #1, #3, #4, #5, #8 | Uygulanıyor |
| Uyum düzeltmeleri (ana sayfa dışı): llms.txt "dengeleme piyasası", veri merkezi mutlak ifadeleri, "son bir yıllık faturalar" (sanayi sayfası), "ortalama fiyatı düşürür", "her … serbest tüketici kapsamındadır", kullanım koşulları alıntı hükmü, og/rehber.jpg "11 rehber" | Uyum #2, #9–#13, #17 | Sırada |
| Her sayfaya Organization düğümü; `/kurumsal`'a tam düğüm; `identifier.propertyID`; llms.txt'ye `/rehber` | Teknik #3, #8; Marka #3–#4 | Sırada |
| Başlık/açıklama kısaltmaları: `/canli-ptf`, `/elektrik-faturasi-hesaplama`, `/rehber/elektrik-faturasi-neden-yuksek` | İçerik | Sırada |
| SKTT kanibalizasyonu: `/rehber`'den gövde içi bağlantı | İçerik #6 | Sırada |
| İçerik sayfalarında Google Fonts'u kendi sunucumuza alma | Teknik #4 | Dalga 1 sonu |

### Dalga 2 — sahip onayı (önizleme) gerektiren ana sayfa işleri
Uyum #1, #4–#8, #14–#16, #18; teknik #2 (`/en/`), #6 (erişilebilirlik), #9; dönüşüm #2 (masaüstü form yeri — sahip 11.11'de "kalsın" dedi; CTA'yı da etkilediği için yeniden soruluyor), #6, #7, #10, #11.

### Dalga 3 — yeni içerik (teyit föyü → yazım → Pricing/Legal/QA)
| Ay | Sayfa | Not |
|---|---|---|
| Kasım–Aralık | 15 dakikalık uzlaştırma: tüketici için ne değişir (20.12'ye kadar) | Föy oturumu başladı; sahipten: 2027'de dengesizlik maliyetini kim taşıyacak |
| Aralık | 10.12 sonrası dondurulmuş rehber düzeltmeleri; 2027 serbest tüketici limiti (RG yayımlanınca); EPDK tarife takvimi (tarih + karar no, fiyat yok) | — |
| Ocak | Sanayi elektrik faturası kalemleri (güç bedeli, reaktif, YEKDEM) | Föy |
| Şubat | İkili anlaşma: süre, fesih, yenileme, teminat | Föy + sahip bilgisi |
| Mart | Elektrik piyasası sözlüğü; SMF/dengesizlik (koşullu); sanayi sayfasının İngilizcesi | — |
| Nisan | Sektör sayfaları (sahibin gerçek sektör bilgisiyle) | — |
| Değerlendirilecek | Aylık PTF notu (yalnız EPİAŞ verisi) | EPİAŞ yeniden yayım şartları için Legal |

### Dalga 4 — site dışı (sahibin elinde; asıl kalıcı etki)
1. GSC ve Bing'de `sitemap.xml` yeniden gönderimi (Google 07.11'den beri okumadı).
2. Crunchbase sahipliği ve YEK-G ifadesinin düzeltilmesi (Voltan Solar bilgisi doğru: sahip teyidi 12.11).
3. Google İşletme Profili → Bing Places; LinkedIn/Facebook logo ve kapak `logo.png` ile aynı.
4. Gerçek dernek/oda üyelikleri ve profilleri; gerçek olayların basına yansıması (ör. YEK-G kaydı tamamlanınca), Legal kapısından.
5. elektrikpaketleri.com yanlış adres düzeltmesi.
6. Wikidata: resmî kalıcı kaynak (EPDK/RG URL) bulunduktan sonra.
7. Oturum ağına epdk.gov.tr, seffaflik.epias.com.tr, wikidata.org, crunchbase.com izni (doğrulama ekranlarının adresleri için).

## 3. Ölçüm
- Aylık sabit istem kontrolü (12.12'de ilki; ChatGPT, Gemini, Copilot, Perplexity, Google AI Overviews; oturum kapalı, 3 tekrar): listede miyiz, sıra, gösterilen kaynak, olgusal hata.
- İlerleme ölçütleri: ad verilen sorgularda sıfır olgusal hata; bizi doğrulayan üçüncü taraf kaynağın gösterilmesi; genel sorguda en az iki asistanda, 3 tekrarın en az birinde adımızın kendiliğinden geçmesi.
- Site: haftalık GSC çekimi (marka dışı gösterim, ticari sayfa gösterimi), Cloudflare Web Analytics (ziyaret), lead `kaynak` alanı (hangi sayfa lead üretiyor).
- Beklenti: içerik ve teknik işler zemini kurar; yapay zekâ listelerine girmek dış kaynaklara bağlıdır ve aylar sürer. Hiçbir eylem için sonuç taahhüdü yoktur.
