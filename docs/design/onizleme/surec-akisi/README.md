# Süreç akışı animasyonu — ONAY BEKLİYOR

**Durum:** Önizleme. Canlı ana sayfaya (`index.html`) uygulanmadı.
**Kaynak yöntem:** `docs/design/kaynaklar/ai-design-skills/skills/design-to-motion/SKILL.md`, website bağlamı, "Flow, connectors" hikâyesi. Uyarlama kuralları için `docs/design/kaynaklar/ai-design-skills/VOLTAGE-NOTU.md`.
**Hazırlanma:** 27.10.2026

## Ne yapar?

Ana sayfadaki "Teklif'ten ilk faturaya, beş adım" bölümü (04 Süreç):

1. Bölüm ekranın %30'u göründüğünde adımlar okuma sırasıyla gelir. Her adım 10px yükselir ve 4px bulanıklıktan netleşir; adımlar arası 90ms. Bugünkü toplu soluklaşmanın yerini alır.
2. Ardından altın ışık S1'den S4'e akar. Geçtiği kutu sitenin mevcut vurgu stilini (`.step.hi`: altın kenar, sıcak zemin) kısa süre alır ve oklar ileri itilir.
3. Zaten vurgulu olan S5'te ince bir halka yayılır.
4. Tur yaklaşık 4,4 saniye sürer, 10 saniyede bir yalnızca bölüm görünürken tekrar eder. Ekran dışında ve sekme gizliyken durur.

## Kurallar

- HTML işaretlemesi değişmez. Süsleme öğelerini (`.sf-glow`, `.sf-ring`, `.sf-arrow`) JS ekler.
- Yalnızca `opacity`, `transform` ve `filter` animasyonu. Ek kütüphane yok.
- `prefers-reduced-motion: reduce`: hiçbir animasyon kurulmaz, bölüm bugünkü gibi duruk görünür.
- Her tur, bugünkü tasarımla aynı kareye döner.
- Veri içermez; dürüstlük kuralı etkilenmez.
- Ayarlar `SF` nesnesinde: `repeat: false` yapılırsa akış yalnızca ilk görünüşte bir kez oynar.

## Doğrulama (27.10.2026, Chromium, gerçek site yazı tipleriyle)

| Kontrol | Sonuç |
|---|---|
| Yatay taşma, 1280 / 390 / 320 px, tur boyunca 10 an | Yok |
| Dinlenme karesi = bugünkü tasarım, 1280 px | PSNR sonsuz (piksel piksel aynı) |
| Dinlenme karesi = bugünkü tasarım, 390 px | 46,6 dB (yalnızca döndürülmüş okların kenar yumuşatması; beceri eşiği 38 dB) |
| Hareketi azalt | 0 animasyon, bölüm görünür |
| Ekran dışında durma / geri gelince devam | Geçti |
| Sayfa hatası | Yok |

## Onay sonrası canlıya alma

```bash
python3 -I docs/design/onizleme/surec-akisi/surec_patch.py index.html
```

Ardından QA turu (masaüstü ve mobil tarayıcı testi, hareketi azalt, taşma) ve yayın. Yama zaten uygulanmışsa betik durur.
