# CTR Optimization Map

**Veri:** GSC 03.08–27.08.2026 (29.08 okuması). Güncel veri: `GSC DATA UNAVAILABLE`.

**Eşik yöntemi:** Veri seti küçük: 84 sorgu, 1,19 bin gösterim. Marka dışı sorguların her biri 3–33 gösterimde ve hiçbirinde tıklama yok. Sorgu düzeyinde CTR karşılaştırması istatistiksel olarak anlamsızdır, bu yüzden keyfi bir eşik kullanılmadı. Karşılaştırma, benzer pozisyondaki **sayfalar** arasında yapıldı:

| Sayfa | Poz. | Gösterim | CTR |
|---|---:|---:|---:|
| /rehber/serbest-tuketici | 13,1 | 176 | %4,0 |
| /canli-ptf | 13,2 | 275 | %2,2 |
| /rehber/ptf-nedir | 11,7 | 140 | %0 |
| /rehber/tedarikci-degistirme | 5,7 | 217 | %3,2 |

ptf-nedir ve canli-ptf, aynı pozisyon bandındaki serbest-tuketici'nin belirgin altında. tedarikci-degistirme ilk 6'da olmasına rağmen %3,2'de kalıyor.

| Query | Impressions | CTR | Position | Current Title | Proposed Title | Proposed Meta | Reason |
|---|---:|---:|---:|---|---|---|---|
| ptf / günlük ptf fiyatları / gün öncesi piyasası elektrik fiyatları (sayfa: /canli-ptf) | 275 (sayfa) | %2,2 | 13,2 | Saatlik PTF Fiyatları — Bugünkü Gün Öncesi Elektrik Fiyatı \| Voltage | Günlük PTF Fiyatları: Bugünün Saatlik Gün Öncesi Elektrik Fiyatı | Bugünün PTF fiyatları saat saat: EPİAŞ Şeffaflık Platformu verisiyle günlük gün öncesi elektrik fiyatı, günün en düşük, en yüksek ve ortalama PTF değeri. | "Günlük" ifadesi eksikti. Snippet artık kaynak ve içerik vaadini ilk cümlede veriyor. Sayfa her vaadi karşılıyor (tablo, min/max/ortalama). **IMPLEMENTED** |
| ptf nedir / piyasa takas fiyatı / ptf smf (sayfa: /rehber/ptf-nedir) | 140 (sayfa) | %0 | 11,7 | PTF Nedir? Piyasa Takas Fiyatı Nasıl Oluşur? \| Voltage | PTF Nedir? Piyasa Takas Fiyatı Nasıl Oluşur, SMF'den Farkı Ne? | PTF (Piyasa Takas Fiyatı), Gün Öncesi Piyasası'nda saatlik oluşan elektrik fiyatıdır. Nasıl oluşur, SMF'den farkı ne, neden değişir? Bugünkü PTF'ye bağlantı. | Meta tanımı ilk cümlede veriyor ve veri niyetli okuyucuya bugünün PTF'sini vaat ediyor. Sayfadaki yönlendirme kutusu bu vaadi karşılıyor. SMF ekiyle "ptf smf" (36,4) niyeti kapsandı. **IMPLEMENTED** |
| elektrik serbest tüketici limiti 2026 / serbest tüketici limiti | 12 + 8 + 4 | %0 | 9,2 / 54,0 / 51,8 | Serbest Tüketici Nedir? 2026 Limiti 500 kWh \| Voltage Enerji | Serbest Tüketici Limiti 2026: 500 kWh — Serbest Tüketici Nedir? | 2026 serbest tüketici limiti yıllık 500 kWh (EPDK Kurul Kararı 14039). Serbest tüketici nedir, kimler tedarikçisini seçebilir, limit yıllara göre nasıl değişti? | Limit sorguları 24 gösterim, çıplak "serbest tüketici" 10 gösterim; başlık baskın niyete göre öne alındı. Meta karar numarasıyla güven sinyali veriyor. Tarihçe vaadini tablo karşılıyor. **IMPLEMENTED** |
| elektrik tedarikçi değiştirme / sağlayıcı değiştirme | 22 + 3 | %0 | 10,3 / 10,0 | Elektrik Tedarikçisi Nasıl Değiştirilir? Süreç Rehberi 2026 | Elektrik Tedarikçisi Değiştirme: Nasıl Yapılır, Ne Kadar Sürer? | Elektrik tedarikçisi (elektrik şirketi) değiştirme adım adım: sayaç değişir mi, elektrik kesilir mi, ne kadar sürer, hangi bilgiler gerekir? 2026 güncel rehber. | Sorgunun birebir ifadesi başlığa girdi. Meta, kullanıcıların sorduğu 4 soruyu listeliyor ve sayfa her birine başlık düzeyinde cevap veriyor. **IMPLEMENTED** |
| voltan (marka) | 53 | %0 | 4,6 | Voltage Enerji — Kurumsal ve Endüstriyel Elektrik Tedarikçisi \| Voltan Elektrik A.Ş. | Değişiklik yok | Değişiklik yok | "Voltan" genel bir kelime ve başka markalar da kullanıyor. Aramaların önemli kısmı bizi aramıyor olabilir. Ana sayfa tasarımı ve başlığı kanonik; marka riski alınmadı. |

**Reddedilen başlık kalıpları:** "En güncel", "hemen öğren", yüzde veya tasarruf vaadi, büyük harf. Hiçbir başlık sayfanın karşılamadığı bir şey vaat etmiyor.
