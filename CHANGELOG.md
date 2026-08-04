# CHANGELOG — voltage.com.tr Revizyonu (Aşama A–E, Temmuz 2026)

Kanonik kaynak: Voltage_Template.pdf. İlke: revizyon, yeniden yazım değil — mimari, içerik ve teknik altyapı korunur; değişen şey karakterdir ("yaşayan memorandum").

## Dosyalar

- **index.html** — tek değişen dosya. 2.966 → ~2.520 satır.
- **_headers, _redirects, robots.txt, sitemap.xml, DEPLOY.md, README.md** — DEĞİŞMEDİ (byte-birebir). CSP'ye origin eklenmedi; yeni fontlar mevcut Google Fonts origin'lerinden, /ptf/stats aynı worker origin'inde.

## index.html — eklenenler

- Kapak anatomisi: köşe braketleri, kicker, serif başlık + italik altın vurgu, mono künye (ETS/3424-8/2074 · EST. 2011 · İSTANBUL), hairline'lı key-facts şeridi — canlı PTF hücresi imza.
- Running header + folio: nav'a entegre, IO ile aktif bölüm, dinamik toplam (01 / 09), mobilde yalnız folio (F1), hairline kalır.
- Canlı Piyasa: koyu KPI bandı (grid dokusu + kaynak notu), cetvelli 24s grafik, "Bugünün Cetveli" ledger'ı, aylık ortalama satırı.
- Üç durumlu veri merdiveni (E1): CANLI (SAAT HH · EPİAŞ) → önbellek (SON SENKRON HH:MM) → dürüst bekleme (EPİAŞ VERİSİ BEKLENİYOR). Micro-jitter kaldırıldı; ray veri yokken gizli. Test kancası: ?ptfoff.
- /ptf/stats istemcisi: monthAvg + monthRange → "AYLIK ORTALAMA · 1–23 TEM" (TR/EN ay kısaltmaları); uç yokken "—". Number.isFinite korumalı, önbellekli.
- D2 model tablosu (Sabit/Endeksli/Hibrit; nitel sütunlar, tasarruf vaadi yok), Exhibit A (veri ledger'ı: lisans no, sahibi, veriliş 19 Eylül 2011 · Kurul Kararı 3424-8, geçerlilik 2031 · +20 yıl yenilemeyle 2051+), tesis sınıfları (elmas maddeler), rakamsız beş adımlı stepflow, A/B/C harfli kartlar, callout, grid dokulu kapanış paneli (künye Corporate Information Sheet ile birebir; cep yok).
- Tek hat şeması (şebeke→trafo→sayaç→tesis): scroll'da bir kez, 850 ms, "ŞEMATİK · ÖLÇEKSİZ".
- Tokenlar: --serif Newsreader, --sans Archivo, --mono IBM Plex Mono, --accent-text #826829 (krem üstü küçük altın metin, 4,77:1), --warm-fill, --green/--green-bright, --line-strong, --sp-section (+%20 beyaz alan).
- prefers-reduced-motion (CSS + SMIL temizliği), görünür klavye odağı, grain yalnız krem bölümlerde.

## index.html — kaldırılanlar

Aurora ×2 · marquee (+ yetim CSS) · HUD cam chip'leri · micro-jitter · tasarruf simülatörü (çarpanlar, %9,4) · "162 üye tesis", "<%1", "62/31/7", "14 gün", "M+ kWh/ay", "günlük yüzlerce işlem" · bölge/OSB eşleşmeleri ve 154 kV/Tier iddiaları · tüm pill'ler (radius 0) · Fraunces + Inter Tight yükü · ~630 satır ölü CSS.

## Ana kararların gerekçeleri

- Sans → Archivo: şablonla aile birliği (A kararı).
- Serif → Newsreader 400: PDF'te gömülü font yok (tümü vektör); glif eşleme Source Serif tahminini eledi — "şablon kazanır".
- Üç rollü altın: --accent yalnız grafik; --accent-dark yalnız ≥24px display + koyu zemin; --accent-text krem üstü küçük metin (AA).
- E1: sahte oynama rakam dürüstlüğünü bozuyordu; damga kesintide de dürüst.
- Marquee B1: içerik Hizmetler'de birebir vardı; döngü yalnız canlı veriye ait.
- Exhibit A: resmî belgenin taklidi değil, veri ledger'ı.
- 15 yıl düzeltmesi: hero + Yaklaşım kartı (iki nokta).

## Açık kalanlar (worker tarafı, kaynak sahibinde)

- /ptf/stats ucu (GET → { dayAvg, monthAvg, monthRange, publishedAt }); günde bir hesap + önbellek.
- ALLOWED_ORIGINS genişletmesi (voltage.com.tr + www + voltan varyantları).
- Deploy öncesi/sonrası Lighthouse mobil; gerçek cihazda CLS < 0.1.
