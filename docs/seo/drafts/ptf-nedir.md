# /ptf-nedir — PTF Açıklayıcı (Küme C, canlı ticker gömülü)

```
title:       PTF Nedir? Piyasa Takas Fiyatı Nasıl Oluşur? | Voltage   (54 karakter)
meta:        PTF (Piyasa Takas Fiyatı) nedir, Gün Öncesi Piyasası'nda nasıl oluşur, neden değişir? EPİAŞ verisine dayalı açıklama ve canlı saatlik fiyat. (140 karakter)
h1:          PTF Nedir? Piyasa Takas Fiyatı Nasıl Oluşur?
breadcrumb:  PTF Nedir
cross-link:  "PTF endeksli ikili anlaşma" → /tedarikci-degistirme
cross-link:  "demir-çelik tesislerinde saatlik yük planlaması" → /demir-celik-elektrik
cross-link:  "serbest tüketici kimdir" → /serbest-tuketici
CTA:         Orta (canlı veri bölümü sonrası) + sayfa sonu → /#iletisim "Teklif Talep Edin"
küme/huni:   Küme C (piyasa verisi) · üst huni, profesyonel kitle · tek iş: canlı-veri otoritesi kurup teklif formuna yönlendirmek
ÖN KOŞUL:    Audit 1.4 dürüstlük düzeltmeleri (jitter kaldırma, fallback etiketi) yayından önce tamam olmalı.
yerleşim:    Ana sayfadaki canlı PTF bandı bu sayfaya gömülür (epias-proxy worker verisi, kaynak etiketi: EPİAŞ Şeffaflık).
FİYAT KURALI: Statik metinde hiçbir güncel fiyat seviyesi geçmez; fiyat yalnızca canlı bileşende görünür.
```

---

**PTF (Piyasa Takas Fiyatı)**, elektriğin Türkiye organize toptan piyasasındaki saatlik fiyatıdır: EPİAŞ'ın işlettiği Gün Öncesi Piyasası'nda (GÖP), her saat için verilen arz ve talep tekliflerinin eşleştirilmesiyle oluşur. Günün 24 saatinin her biri için ayrı bir PTF hesaplanır; bu nedenle "elektriğin fiyatı" tek bir sayı değil, her gün yeniden oluşan 24 değerlik bir seridir.

PTF, serbest piyasadaki fiyatlamanın ana referansıdır: endeksli ikili anlaşmalar ona bağlanır, sabit fiyat teklifleri onun beklentisi üzerine kurulur, tedarikçilerin portföy maliyeti ondan etkilenir.

## PTF nasıl oluşur?

Gün Öncesi Piyasası'nda katılımcılar — üreticiler, tedarikçiler, büyük tüketiciler — ertesi günün her saati için alış ve satış teklifleri verir. EPİAŞ, her saat için arz ve talep eğrilerini eşleştirir; eğrilerin kesiştiği noktadaki fiyat o saatin PTF'si olur. Sonuçlar teklif kapanışının ardından aynı gün ilan edilir ve ertesi gün fiziksel teslimatla uygulanır.

Mekanizmanın önemli sonuçları:

- **Marjinal fiyatlama:** Her saatte fiyatı, talebi karşılamak için devreye girmesi gereken en pahalı kaynak belirler. Talebin yüksek olduğu saatlerde daha pahalı santraller devreye girdiğinden PTF yükselir.
- **Saatlik çözünürlük:** Gece ile akşam puantı arasındaki fark, aynı gün içinde belirgin olabilir. Tüketimin hangi saatte yapıldığı, ödenen ortalama fiyatı doğrudan etkiler.
- **Şeffaflık:** Tüm sonuçlar EPİAŞ Şeffaflık Platformu'nda kamuya açık yayımlanır; PTF üzerine kurulan her sözleşme formülü herkesçe doğrulanabilir bir referansa dayanır.

## PTF ile SMF arasındaki fark nedir?

PTF, gün öncesinden planlanan dengenin fiyatıdır. Gerçek zamanda ise plan ile fiili durum arasındaki sapmalar Dengeleme Güç Piyasası'nda giderilir; burada oluşan fiyat **SMF (Sistem Marjinal Fiyatı)**'dir. Kısaca: PTF planın, SMF gerçekleşmenin fiyatıdır. Tüketimini öngörülebilir şekilde planlayan ve dengesizliği iyi yönetilen bir portföyde maliyet PTF'ye yakın seyreder; dengesizlik büyüdükçe SMF'nin etkisi artar. Dengeleme sorumluluğunun sözleşmede kimde olduğu tam da bu yüzden önemli bir sözleşme maddesidir.

## PTF neden yükselir veya düşer?

PTF'nin sürücüleri, elektrik sisteminin fizik ve yakıt ekonomisidir:

- **Talep:** Sıcaklık (yaz soğutma, kış ısıtma yükü), sanayi temposu, hafta içi/hafta sonu ve saat-içi tüketim ritmi.
- **Arz kompozisyonu:** Rüzgâr ve güneş üretimi yüksekken marjinal fiyat düşme eğilimindedir; bu kaynaklar zayıfken termik santraller marjinal hâle gelir.
- **Yakıt maliyetleri:** Doğal gaz ve ithal kömür fiyatları ile kur, termik üretimin maliyeti üzerinden PTF tabanını belirler.
- **Hidrolojik durum:** Barajlı hidrolik üretimin mevsimsel seyri arz esnekliğini etkiler.
- **Arıza ve bakımlar:** Büyük santral veya iletim kısıtları kısa vadeli sıçramalar yaratabilir.

Bu sürücülerin bileşimi mevsimsel desenler üretir; ancak hiçbir desen garantili değildir. Bu nedenle sorumlu bir tedarikçi PTF beklentisini taahhüt olarak değil, senaryo olarak sunar.

## Güncel PTF nereden takip edilir?

PTF'nin birincil kaynağı **EPİAŞ Şeffaflık Platformu**'dur; tüm saatlik sonuçlar orada yayımlanır. Voltage Enerji olarak bu veriyi kendi altyapımızla çekiyor ve [ana sayfamızdaki canlı PTF bandında](/#top) saatlik olarak yayınlıyoruz — kaynağı EPİAŞ Şeffaflık olan, günün saatlik serisini gösteren canlı bir görüntüleme.

*(Sayfa bileşeni: canlı PTF modülü burada gömülü — statik metinde fiyat seviyesi verilmez; güncel değerler yalnızca canlı bileşende, veri kaynağı ve zaman damgasıyla birlikte gösterilir.)*

*[CTA — Teklif Talep Edin → /#iletisim]*

## PTF sanayi faturasını nasıl etkiler?

Serbest tüketici statüsündeki bir tesis için PTF üç kanaldan anlam taşır:

**1. Endeksli sözleşmeler doğrudan PTF'ye bağlıdır.** Formül tipik olarak "PTF ± sözleşmede yazılı bileşenler" biçimindedir; tesisin ödediği fiyat piyasayla birlikte hareket eder.

**2. Sabit fiyat, PTF beklentisinin fiyatlanmış hâlidir.** Tedarikçinin sabit teklifi, sözleşme dönemine ilişkin PTF beklentisini ve üstlenilen riski içerir. Sabit fiyatı değerlendirmek, örtük olarak bir piyasa görüşünü değerlendirmektir.

**3. Yük profili, ödenen ortalama PTF'yi belirler.** Aynı yıllık tüketime sahip iki tesis, saat dağılımları farklıysa çok farklı ortalama fiyat öder. Gece çalışan hatlar, esnek planlanabilen yükler — örneğin [ark ocaklı tesislerde ergitme planlaması](/demir-celik-elektrik) — bu farkın en somut örnekleridir.

Bu üç kanalın tesisiniz için ne ifade ettiği, geçmiş tüketim verinizin referans dönem PTF serisiyle çakıştırılmasıyla hesaplanır; [tedarikçi değiştirme rehberinde](/tedarikci-degistirme) anlattığımız modelleme adımı tam olarak budur. [Serbest tüketici](/serbest-tuketici) kapsamındaki her işletme bu analizi talep edebilir.

## Sık sorulan sorular

**PTF hangi para birimiyle ve birimle ifade edilir?**
PTF, TL/MWh cinsinden ilan edilir. Faturalardaki kr/kWh dönüşümü aritmetik bir çevrimdir.

**GÖP dışında piyasa var mı?**
Evet: Gün İçi Piyasası (GİP) gün içindeki pozisyon düzeltmelerine, Dengeleme Güç Piyasası gerçek zamanlı dengeye hizmet eder. Voltage Enerji 2011'den bu yana GÖP ve GİP'te aktif katılımcıdır (EPDK tedarik lisansı ETS/3424-8/2074).

**PTF'yi kim belirler?**
Hiçbir kurum fiyatı "belirlemez"; PTF, EPİAŞ'ın işlettiği eşleşme mekanizmasında arz ve talebin kesişiminden çıkar.

**Sözleşmede PTF referansı nasıl yazılmalı?**
Endeksli bir sözleşmede hangi dönemin PTF'sinin (saatlik mi, aylık ağırlıklı ortalama mı), hangi katsayı ve ek bileşenlerle fiyata dönüştüğü açıkça yazılmalıdır. Formülün her terimi sözleşme metninde yer almıyorsa teklif karşılaştırılabilir değildir; bizim standardımız formülün tamamının yazılı olmasıdır.

**Geçmiş PTF verisine nereden ulaşılır?**
EPİAŞ Şeffaflık Platformu, geçmiş saatlik PTF serilerini kamuya açık sunar. Referans dönem analizi — tesisinizin tüketim profilinin geçmiş fiyat serisiyle çakıştırılması — bu veri üzerinde yapılır ve teklif modellememizin temelidir.

**Aylık ortalama PTF neyi gösterir, neyi göstermez?**
Aylık ortalama, seviyeyi izlemek için pratiktir; ancak tesisin fiilen ödediği ortalama, kendi saatlik tüketim ağırlıklarıyla hesaplanır. Puant saatlerde yoğunlaşan tüketici aylık ortalamanın üstünü, geceye yayılan tüketici altını öder — sektör sayfalarımızda bu farkın yük planlamasıyla nasıl yönetildiği anlatılır.

*[CTA — Teklif Talep Edin → /#iletisim]*

---

**Bu yazı hakkında:** Yayın/güncelleme tarihi: 05.08.2026. Kaynaklar: EPİAŞ Şeffaflık Platformu (canlı veri kaynağı); EPİAŞ Gün Öncesi Piyasası işleyiş düzenlemeleri; 6446 sayılı Elektrik Piyasası Kanunu. Bu sayfadaki canlı fiyat verisi EPİAŞ Şeffaflık Platformu'ndan alınır; metin içinde güncel fiyat seviyesi verilmez.
