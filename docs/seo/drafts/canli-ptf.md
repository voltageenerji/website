# /canli-ptf — Canlı PTF (veri sayfası, alıntılanabilir varlık)

```
title:       Canlı PTF — Güncel Gün Öncesi Elektrik Fiyatı | Voltage   (55 karakter)
meta:        Bugünün saatlik PTF verisi: canlı gün öncesi elektrik fiyatı, 24 saatlik grafik ve günün min-maks-ortalama değerleri. Kaynak: EPİAŞ Şeffaflık Platformu. (152 karakter)
h1:          Canlı PTF — Güncel Gün Öncesi Elektrik Fiyatı
breadcrumb:  Canlı PTF
cross-link:  "PTF nasıl oluşur" → /rehber/ptf-nedir
cross-link:  "ark ocaklı tesislerde yük kaydırma" → /rehber/demir-celik-elektrik
cross-link:  "soğuk zincir ve öne-soğutma" → /rehber/soguk-zincir-elektrik
cross-link:  "OSB tarifesi karşılaştırması" → /rehber/osb-elektrik-tedariki
CTA:         YALNIZCA sayfa sonu, yumuşak → /#iletisim "Tesisiniz için ne anlama geldiğini konuşalım"
küme/huni:   Küme C (piyasa verisi) · huni dışı/üst huni · tek iş: alıntılanabilir canlı veri varlığı olmak (link kazanımı), satış değil
yapı notu:   Bu bir VERİ sayfasıdır, rehber değildir. Statik metin canlı bileşenin çerçevesidir; yıldız veridir.
yerleşim:    [CANLI VERİ BİLEŞENİ] işaretçisi Webmaster tarafından canlı bant + 24 saatlik grafik + günün istatistikleriyle doldurulur (epias-proxy worker, ~15 dk tazeleme, "SON SENKRON" etiketli önbellek merdiveni).
FİYAT KURALI: Statik metinde HİÇBİR fiyat seviyesi/sayısı geçmez. Tüm sayısal değerler yalnızca canlı bileşende, zaman damgası ve kaynak etiketiyle görünür.
ÖN KOŞUL:    Audit 1.4 dürüstlük düzeltmeleri (jitter kaldırma, fallback etiketi) canlıda doğrulanmış olmalı — "sentetik veri göstermeyiz" iddiası ancak bu şartla yazılabilir.
```

---

## Giriş

Bu sayfa, Türkiye elektrik piyasasında bugün geçerli olan saatlik **Piyasa Takas Fiyatı'nı (PTF)** gösterir: içinde bulunduğumuz saatin fiyatı, günün 24 saatlik serisi ve günün en düşük, en yüksek ve ortalama değerleri. Veri, **EPİAŞ Şeffaflık Platformu**'ndan kendi altyapımızla çekilir ve gün boyunca düzenli aralıklarla tazelenir; her değerin yanında hangi saate ait olduğu ve en son ne zaman senkronize edildiği yazar.

Tek bir ilkemiz var: burada gördüğünüz her rakam gerçek piyasa verisidir. **Temsili, sentetik veya "canlı görünsün diye" oynatılmış veri göstermeyiz.** Veri akışı kesilirse sayfa uydurma bir değer üretmez; son senkron saatini açıkça belirtir ya da dürüstçe beklemede kalır.

**[CANLI VERİ BİLEŞENİ]**
*(Webmaster: canlı PTF bandı + 24 saatlik grafik + günün min/maks/ortalama istatistikleri buraya. Kaynak etiketi "EPİAŞ Şeffaflık", zaman damgası ve senkron durumu bileşenin içinde görünür olmalı.)*

## PTF nedir, bu rakam ne anlama gelir?

PTF, elektriğin Türkiye organize toptan piyasasındaki saatlik fiyatıdır. EPİAŞ'ın işlettiği Gün Öncesi Piyasası'nda, ertesi günün her saati için verilen alış ve satış tekliflerinin eşleştirilmesiyle oluşur. Yani "elektriğin fiyatı" tek bir sayı değildir: her gün, her saat için yeniden hesaplanan 24 değerlik bir seridir.

Bu rakam serbest piyasadaki fiyatlamanın ana referansıdır — endeksli ikili anlaşmalar ona bağlanır, sabit fiyat teklifleri onun beklentisi üzerine kurulur, tedarikçilerin portföy maliyeti ondan etkilenir. Mekanizmanın ayrıntısı, fiyatın neden yükselip düştüğü ve SMF ile farkı için [PTF nasıl oluşur rehberimize](/rehber/ptf-nedir) bakabilirsiniz.

## Bu veriyi nasıl okumalı?

**Saatlik oluşum.** Her saatin fiyatı bağımsız olarak, o saatte talebi karşılamak için devreye girmesi gereken en pahalı kaynağa göre belirlenir. Bu nedenle günün tek bir "fiyatı" yoktur; seriyi bütün olarak okumak gerekir.

**Gece ile puant farkı.** Talebin düşük olduğu gece saatleri ile akşam puantı arasındaki fark, aynı gün içinde belirgin olabilir. Tüketimin hangi saatte yapıldığı, ödenen ortalama fiyatı doğrudan etkiler.

**Min, maks ve ortalama ne söyler.** Günlük ortalama seviyeyi izlemek için pratiktir ama hiçbir tüketici "ortalamayı" ödemez; herkes kendi saatlik tüketim ağırlıklarıyla oluşan ortalamayı öder. Min–maks aralığı ise o günün oynaklığını gösterir: aralık genişledikçe, tüketimi saatler arasında kaydırabilmenin değeri artar.

## Sanayi tesisi için ne ifade eder?

Yükünü planlayabilen bir tesis için bu seri bir maliyet kalemi değil, bir karar aracıdır. Esnek proseslerin pahalı saatlerden ucuz saatlere kaydırılması, aynı yıllık tüketimle farklı bir fatura anlamına gelir — [ark ocaklı tesislerde ergitme planlaması](/rehber/demir-celik-elektrik) ve [soğuk zincirde öne-soğutma senaryoları](/rehber/soguk-zincir-elektrik) bunun en somut örnekleridir. OSB bünyesindeki tesisler için karşılaştırmanın nasıl kurulacağını [OSB elektrik tedariki rehberinde](/rehber/osb-elektrik-tedariki) anlattık.

## Kaynak gösterme ve alıntı

Bu sayfadaki verilerin birincil kaynağı **EPİAŞ Şeffaflık Platformu**'dur; saatlik PTF serisi orada kamuya açık olarak yayımlanır. Veri, EPDK Kurul Kararı 6282-4 (RG 28.05.2016/29725) uyarınca EPİAŞ tarafından kamuya açık yayımlanır; kullanımı EPİAŞ koşullarına tabidir. [HUKUK E1 — yayınlanan metin canli-ptf.html içindedir] Bu sayfadaki **sunum, grafik ve günlük özet görünüm** ise Voltage Enerji tarafından hazırlanmıştır.

Haber, rapor, sunum, tez veya blog yazılarınızda bu sayfayı ve grafiği **kaynak göstererek kullanabilirsiniz.** Tek ricamız, alıntının yanına sayfaya bağlantı verilmesidir:

> Kaynak: Voltage Enerji — Canlı PTF (https://voltage.com.tr/canli-ptf), veri: EPİAŞ Şeffaflık Platformu.

Belirli bir tarih aralığı, farklı bir grafik kesiti veya makine okunabilir bir çıktı gerekiyorsa basın ve araştırma talepleri için **info@voltage.com.tr** adresine yazabilirsiniz; talebinizi değerlendirip elimizdeki kapsamda yanıtlarız.

## Sık sorulan sorular

**PTF ne sıklıkla güncellenir?**
PTF, ertesi günün 24 saati için Gün Öncesi Piyasası sonuçlarıyla birlikte ilan edilir; gün içinde o günün saatlik değerleri sabittir. Bu sayfa ise içinde bulunulan saatin değerini ve günün serisini gün boyunca düzenli aralıklarla tazeler, her görünümde son senkron zamanını gösterir.

**Veri kaynağınız nedir?**
EPİAŞ Şeffaflık Platformu. Veriyi kendi altyapımızla (Cloudflare üzerinde çalışan bir veri aracımızla) çekip sayfada sunuyoruz; ara katmanda hiçbir düzeltme, yumuşatma veya tahmin uygulanmaz.

**Geçmiş PTF verisine nasıl ulaşırım?**
Geçmiş saatlik seriler EPİAŞ Şeffaflık Platformu'nda kamuya açık sunulur; tarih aralığı seçerek indirebilirsiniz. Bu sayfa yalnızca güncel günü gösterir.

---

Tesisinizin tüketim profili bu seriyle çakıştırıldığında ne çıktığı, saatlerinize bağlıdır.
*[CTA — Tesisiniz için ne anlama geldiğini konuşalım → /#iletisim]*

---

**Bu sayfa hakkında:** Veri kaynağı: EPİAŞ Şeffaflık Platformu (Gün Öncesi Piyasası saatlik PTF). Veri, gün boyunca düzenli aralıklarla tazelenir; her değer zaman damgasıyla gösterilir. Sayfa metninin yayın/güncelleme tarihi: 05.08.2026. Bu sayfada temsili veya sentetik veri gösterilmez; statik metinde fiyat seviyesi verilmez. Yayıncı: Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş. (Voltage Enerji), ETS/3424-8/2074 numaralı EPDK tedarik lisansıyla 19 Eylül 2011'den bu yana serbest piyasada faaliyet gösterir; GÖP ve GİP'te aktif katılımcıdır.
