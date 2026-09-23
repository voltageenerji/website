# Query → Page → CTA Map

Tüm CTA'lar /#iletisim teklif formuna gider. Hiçbir CTA tasarruf veya fiyat vaadi içermez.

| Query | Intent | Landing Page | CTA | Commercial Value |
|---|---|---|---|---|
| elektrik tedarikçi değiştirme, sağlayıcı değiştirme, epdk tedarikçi değiştirme | Ticari süreç | /rehber/tedarikci-degistirme | "Tedarikçi Değişikliği İçin Teklif Alın" (yeni) | Çok yüksek: karar aşamasındaki serbest tüketici |
| elektrik serbest tüketici limiti 2026, serbest tüketici | Bilgi → uygunluk | /rehber/serbest-tuketici | "Teklif Talep Edin" + araç (#statu) + tedarikçi değiştirme rehberi | Yüksek: uygunluğunu öğrenen işletme |
| SKTT nedir, son kaynak tedarik tarifesi | Bilgi → acil ticari | /rehber/sktt | "SKTT Analizi İste" | Çok yüksek: limit üstü, müzakeresiz fiyata maruz tüketici |
| ptf, günlük ptf fiyatları, gün öncesi piyasası elektrik fiyatları, ptf şeffaflık | Veri | /canli-ptf | "PTF Endeksli Tedarik Hakkında Bilgi Alın" (yeni) + ptf-nedir #ptf-endeksli + tedarikçi değiştirme | Orta: enerji yöneticisi, sanayi alıcısı; çoğu ziyaret bilgi amaçlı |
| ptf nedir, piyasa takas fiyatı, ptf smf | Tanım | /rehber/ptf-nedir | "PTF Endeksli Tedarik Hakkında Bilgi Alın" (yeni) | Orta |
| elektrik faturası hesaplama, 1 kWh kaç TL | Araç | /elektrik-faturasi-hesaplama | "Faturamı Analiz Ettir" + serbest tüketici ve SKTT rehberleri | Orta: yüksek hacim, karışık mesken ve işletme kitlesi |
| elektrik faturası neden yüksek | Sorun çözme | /rehber/elektrik-faturasi-neden-yuksek | "Faturamı Analiz Ettir" | Orta |
| osb elektrik (GSC: sayfa 22 gösterim, 7,6) | Ticari | /rehber/osb-elektrik-tedariki | "Teklif Talep Edin" | Yüksek: OSB sanayi tesisi, yüksek MWh |
| tekstil / demir-çelik elektrik (GSC: 4,4 / 8,0) | Ticari sektörel | sektör rehberleri | "Teklif Talep Edin" | Yüksek: yüksek MWh |
| voltan elektrik, voltage enerji | Marka | / | İletişim bölümü | Yüksek (sıcak) |

**Akış (uygulanan bağlantılar):**
- Fatura yolu: hesaplama → serbest tüketici → SKTT → tedarikçi değiştirme → teklif. Eksik halka olan hesaplama → serbest tüketici bağlantısı eklendi. SKTT → tedarikçi değiştirme zaten vardı. tedarikçi değiştirme → SKTT eklendi.
- Piyasa yolu: canlı PTF → PTF endeksli (#ptf-endeksli) → tedarikçi değiştirme → teklif. Canlı PTF'den iki halka da eklendi.
