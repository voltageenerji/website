# Yeni ana sayfa tasarımı — hazırlık dosyası

**Durum:** yayında değil. `index.html` bu klasörde bekler; yayın 10 Aralık SEO ölçümünden sonra, sahibin tam sayfa onayı ve QA (yeni cümleler için Hukuk) kararıyla yapılır. `/docs/*` sitede sunulmaz.

## Dosyalar

- `index.html` — ana sayfanın tamamı, tek dosya (stil ve betik satır içi). Kök `/index.html` yerine konduğunda düzenleme istemez.
- `img/kapak-800.webp`, `kapak-1200.webp`, `kapak-1600.webp`, `kapak-2172.webp` (3:1) ve `kapak-mobil-579.webp` (4:5, 700 px ve altı) — kapak fotoğrafı.

## Canlı sayfadan aynen alınanlar

Baş bölümü (yazı tipi bağlantısına kadar bayt bayt aynı), teklif formu (bayt bayt aynı), betikler (aşağıdaki dört ek dışında aynı), bölüm metinlerinin tamamı (TR/EN).

Betikteki ekler: (1) atlama bağlantısı yumuşak kaydırma işleyicisinin dışında, (2) dil düğmelerinde `aria-pressed`, (3) canlı veri denetleyicisi kapak kartını da besler (`ptfKart`, `heroLine`, `heroArea`, `heroDot`; çizim `drawOne` ile iki grafiğe gider), (4) kartın `data-state` değeri. Veri mantığı, önbellek anahtarı (`voltage-ptf-cache`) ve dürüstlük merdiveni değişmedi.

## Canlı sayfadan farklar

- Kapak: yeni üst başlık, H1, alt metin ve düğmeler (sahip onayı 23.11). Eski kapak şeridi (lisans no, "Piyasa Deneyimi", künye satırı) yerine PTF kartı ve güven şeridi.
- Bölüm sırası: Kapak, Hizmetler, Tesis Sınıfları, Canlı Piyasa, Süreç, Modeller, lisans kartı, Hakkımızda, Yaklaşım, alıntı, İletişim. Folyo numaraları buna göre.
- Hizmetler tek bölümdür (beş hizmet); önizlemedeki üçlü satır ayrıca yoktur. Açıklamalar telefonda da görünür.
- Tesis sınıfları: önizlemedeki koyu karolar, canlı sayfadaki başlık, yedi ad ve açıklamayla. Sekizinci karo "Tüm sektör rehberleri".
- Saatlik PTF rayı kapaktan Canlı Piyasa bölümünün üst kenarına taşındı (1040 px ve üstü, veri yoksa gizli).
- Menüye "Canlı PTF" eklendi. Menü 1039 px ve altında açılır panele döner.
- Modeller tablosu gerçek `<table>`; 759 px ve altında satır satır karta döner.
- Form masaüstünde iletişim bilgilerinin yanında; `#teklif` çapası formun hemen üstünde. Form belirme animasyonu beklemez.
- Büyük grafiğin saat etiketleri HTML satırıdır (SVG yazısı dar ekranda eziliyordu).
- `<main id="icerik">`, atlama bağlantısı, tek H1, lisans kartı başlığı H2.

## Kapak fotoğrafı

`<picture class="hero-photo">` içinde; yollar göreli (`img/…`). Yüklenemezse `<img onerror>` `.hero-media` öğesine `yedek` sınıfını ekler ve çizim silüet görünür. `sizes` değeri kapağın gerçek çizim genişliğine göredir (masaüstünde kapak yüksekliği × 3 ≈ 2100 px); `100vw` yazılırsa 1440 px ekranda 1600'lük dosya seçilir ve fotoğraf yumuşar.

## Yayın adımları

1. Sahibin tam sayfa onayı; QA kararı; yeni cümleler için Hukuk ve Uyum (aşağıdaki liste).
2. Canlı `index.html` o güne kadar değiştiyse metin eşitliği yeniden denetlenir ve fark buraya işlenir.
3. Beş `.webp` dosyası kökteki `/img/` klasörüne kopyalanır; sayfadaki altı `img/kapak-…` yolu `/img/kapak-…` yapılır.
4. Bu `index.html` kök `index.html` yerine konur (kanca sahip onayı sorar).
5. `_headers`: `/img/*` için önbellek kuralı (ör. `/og/*` ile aynı). CSP `img-src 'self'` yeterlidir.
6. `sitemap.xml` ana sayfa `<lastmod>`; `.claude/rules/homepage.md` içindeki kanonik tasarım tarihi; `docs/OPERASYON-DEFTERI.md` ve `CHANGELOG.md` kaydı.
7. Yayından sonra: kapak kartı ve Canlı Piyasa (yalnız "—" ise önce proxy), `/?kaynak=deneme#leadForm` ile bir deneme talebi, 375 ve 1280 px görünüm.

## Hukuk ve İngilizce denetimi bekleyen yeni metinler

| TR | EN |
|---|---|
| Elektrik Tedariki ve Enerji Ticareti | Electricity Supply and Energy Trading |
| Sanayinin enerjisini piyasayla buluşturuyoruz. | We connect industry's energy with the market. |
| … sanayi ve ticarethanelere sözleşmeye dayalı elektrik tedariki sağlıyoruz. | … to industrial and commercial consumers … |
| Teklif Al / Hizmetlerimizi İncele | Get a Quote / Explore Our Services |
| Güncel Piyasa Verisi · PTF | Current Market Data · MCP |
| Saatlik veri bekleniyor | Awaiting hourly data |
| Piyasa verilerini detaylı incele | View detailed market data |
| 2011'den bu yana · EPDK lisanslı tedarikçi | Since 2011 · EPDK-licensed supplier |
| Piyasa katılımcısı · GÖP ve GİP | Market participant · DAM and IDM |
| Türkiye'nin tamamı · Sanayi ve ticarethane | All of Türkiye · Industrial and commercial |
| Canlı PTF (menü) | Live MCP |
| Tüm sektör rehberleri | All sector guides |
| İçeriğe atla | Skip to content |

## Bilinen eksikler

- Dosya 177 KB (canlı 167 KB; gzip 47 KB / 43 KB). 77 KB'ı aynen alınan baş bölümü, form (yaprak çizimi dahil) ve betiktir.
- Temiz adresler ve `_redirects` yalnız `wrangler pages dev` ile denenebilir; denetimler `python3 -m http.server` ile yapıldı.
- Lighthouse ölçümü yapılmadı.
- Gerçek telefonda (iOS Safari) denenmedi; denetimler Chromium iledir.
