# Yeni ana sayfa tasarımı — hazırlık dosyası

**Durum:** yayında değil. `index.html` bu klasörde bekler; yayın 10 Aralık SEO ölçümünden sonra, sahibin tam sayfa onayı ve QA (yeni cümleler için Hukuk) kararıyla yapılır. `/docs/*` sitede sunulmaz.

Bu sürüm 23.11 revizyon talimatının sonucudur: sade kurumsal dil, daha açık kapak fotoğrafı, tekrarsız piyasa verisi, telefon için ayrı kapak düzeni.

## Dosyalar

- `index.html` — ana sayfanın tamamı, tek dosya (stil ve betik satır içi).
- `img/kapak-800.webp`, `kapak-1200.webp`, `kapak-1600.webp`, `kapak-2172.webp` (3:1) ve `kapak-mobil-579.webp` (4:5, 700 px ve altı).

## Canlı sayfadan aynen alınanlar

- Baş bölümü: yazı tipi bağlantısına kadar bayt bayt aynı (title, description, canonical, robots, OG, Twitter, JSON-LD).
- Teklif formu: `<form>…</form>` bayt bayt aynı. Form betiği de bayt bayt aynı.
- Bölüm metinleri, beş hizmet, yedi sektör ve rehber bağlantıları, lisans bilgileri, dört rozet, Hakkında metni ve imza, üç ilke, şirket sözü, iletişim bilgileri, alt bilgi.
- Canlı veri mantığı: proxy çağrıları (`/ptf/today`, `/ptf/stats`), önbellek anahtarı (`voltage-ptf-cache`), dürüstlük merdiveni.

## Betikte yapılanlar

Çıkarılanlar (sayfada öğesi kalmadı): SMIL temizliği, kaydırınca belirme, saatlik ray, folyo, tek hat şeması.

Eklenenler:
1. Atlama bağlantısı yumuşak kaydırma işleyicisinin dışında.
2. Dil düğmelerinde `aria-pressed`.
3. Bağlantıyla gelişte yeniden hizalama `#hakkimizda`, `#yaklasim`, `#hizmetler` ve `#canli-piyasa` için de çalışır (bölüm boşlukları daraldığı için geç yüklenen yazı tipi başlığı sabit bandın altına itebiliyordu).
4. Canlı veri denetleyicisi kapak kartını (`ptfKart`, `heroLine`, `heroArea`, `heroDot`) ve saatlik tabloyu (`#saatTablo`) da doldurur. Tabloda eksik saat "—" kalır.

Betik `kpiNow`, `kpiMin`, `kpiMax`, `kpiStamp` öğelerini hâlâ arar; bulamayınca atlar (korumalı). Veri mantığına dokunmamak için bu satırlar bırakıldı.

## Canlı sayfadan farklar

- **Kapak:** H1 iki parçadır: üst satır (`.h1-ust`, arama niyeti) ve slogan (`.h1-ana`). Ayrı üst başlık öğesi yoktur. PTF kartı düz, opak paneldir. Koyu örtü yalnız metnin arkasındadır; durak yerleri metin sütununun kenarından hesaplanır.
- **Marka yazısı:** işaret aynı; "Voltage Enerji" yazısı üst bantta ve altta Archivo, büyük harf.
- **Kaldırılan süsler:** bölüm numaraları, folyo, hizmet numaraları, tek hat şeması, halkalar, "EXHIBIT A", "S1–S5", "A/B/C", "VOLTAGE FELSEFESİ · EST. 2011", işlevsiz oklar, kart gölgeleri, belirme animasyonları.
- **Yazı tipi kullanımı:** serif yalnız kapak sloganı, Hakkında cümlesi, imza ve şirket sözünde. Monospace yalnız piyasa verisi, saat damgası, lisans ve sicil numarasında.
- **Bölüm sırası:** Kapak, bilgi satırı, Hizmetler, Sektörler, Piyasa Verileri, Süreç, Modeller, EPDK Lisansı, Hakkında, Neden Voltage, şirket sözü, İletişim.
- **Piyasa verisi:** kapak kartı yalnız o saatin değerini gösterir. Bölümde 24 saatlik grafik, günün özeti ve 24 satırlık saatlik tablo vardır. Üç rakamlı bant ve kayan ray kaldırıldı. Betik kapalıyken bölüm bir cümle ve `/canli-ptf` bağlantısı gösterir.
- **Süreç:** gerçek `<ol>`; numaralar liste sırasıdır.
- **Lisans:** tanım listesi; rozetler düz metin satırı.
- **Telefon:** üst bantta "Teklif Al" ve menü düğmesi; dil seçimi menü panelinde. Kapak sırası: H1, alt metin, Teklif Al, ikinci düğme, küçük PTF kartı (grafiksiz). Alt boşluk yok.
- **Menü:** "Canlı PTF" eklendi. 1039 px ve altında panel.
- **Form:** masaüstünde iletişim bilgilerinin yanında; `#teklif` çapası formun hemen üstünde.

## Değişen ve kaldırılan metinler (canlıya göre)

Başlıklar (talimatla):

| Canlı | Hazırlık |
|---|---|
| Türkiye'nin endüstriyel enerji ortağı, Voltage. | Sanayi ve Ticarethaneler için Elektrik Tedariki + Sanayinin enerjisini piyasayla buluşturuyoruz. |
| Uçtan uca enerji çözüm portföyü. | Hizmetlerimiz |
| Çalıştığımız Tesis Sınıfları | Hizmet Verdiğimiz Sektörler |
| Canlı Piyasa | Güncel Elektrik Piyasası Verileri |
| EPİAŞ piyasasını anlık okuyoruz. | Gün öncesi piyasasında oluşan saatlik PTF değerleri. Kaynak: EPİAŞ Şeffaflık Platformu. |
| Teklif'ten ilk faturaya, beş adım. (H2) | Elektrik Tedarik Süreci (H2); eski cümle alt satır olarak duruyor |
| Üç Sözleşme Modeli | Elektrik Tedarik Sözleşmesi Modelleri |
| Bir firma kadar köklü, bir ortak kadar yakın. (H2) | Voltage Enerji Hakkında (H2); eski cümle alt satır olarak duruyor |
| Piyasa Zekâsı | Elektrik Piyasalarında Uzmanlık |

Eski kapak metinleri (kaldırıldı): Kurumsal Enerji Tedariki; kapak paragrafının eski hâli; ETS/3424-8/2074 · EST. 2011 · İSTANBUL; Teklif Talep Edin; Hizmetlerimiz (düğme); Gün Öncesi PTF — Canlı; Piyasa Deneyimi; 15 yıl · Est. 2011.

Etiketler (kaldırıldı): KAPAK · 01 / 09 ve bölüm numaraları; S1–S5; A, B, C; EXHIBIT A; TEK HAT ŞEMASI — ŞEMATİK · ÖLÇEKSİZ; VOLTAGE FELSEFESİ · EST. 2011; ◆ ve ▸ işaretleri.

Tekrarı önlemek için kaldırılan piyasa etiketleri: Şu Anki Saat · Gün Öncesi PTF; Bugünün En Düşüğü; Bugünün En Yükseği; KAYNAK: EPİAŞ ŞEFFAFLIK PLATFORMU · SAATLİK PTF. En düşük ve en yüksek saat özet listesinde, kaynak giriş cümlesinde duruyor.

Bağlantılar: kaldırılan hedef yok. Rayın `/canli-ptf` bağlantısı yerine aynı hedefe iki metin bağlantısı var.

## Hukuk ve İngilizce denetimi bekleyen yeni metinler

| TR | EN |
|---|---|
| Sanayi ve Ticarethaneler için Elektrik Tedariki | Electricity Supply for Industry and Businesses |
| Sanayinin enerjisini piyasayla buluşturuyoruz. | We connect industry's energy with the market. |
| … sanayi ve ticarethanelere sözleşmeye dayalı elektrik tedariki sağlıyoruz. | … to industrial and commercial consumers … |
| Teklif Al / Hizmetlerimizi İncele | Get a Quote / Explore Our Services |
| Güncel Piyasa Verisi · PTF | Current Market Data · MCP |
| Saatlik veri bekleniyor | Awaiting hourly data |
| Piyasa verilerini detaylı incele | View detailed market data |
| 2011'den bu yana · EPDK lisanslı tedarikçi | Since 2011 · EPDK-licensed supplier |
| Piyasa katılımcısı · GÖP ve GİP | Market participant · DAM and IDM |
| Türkiye'nin tamamı · Sanayi ve ticarethane | All of Türkiye · Industrial and commercial |
| Hizmetlerimiz | Our Services |
| Hizmet Verdiğimiz Sektörler | Sectors We Serve |
| Tüm sektör rehberleri | All sector guides |
| Güncel Elektrik Piyasası Verileri | Current Electricity Market Data |
| Gün öncesi piyasasında oluşan saatlik PTF değerleri. Kaynak: EPİAŞ Şeffaflık Platformu. | Hourly day-ahead market clearing prices (MCP). Source: EPİAŞ Transparency Platform. |
| Saatlik PTF · ₺/MWh · Saat · PTF | Hourly MCP · ₺/MWh · Hour · MCP |
| Elektrik Tedarik Süreci | Electricity Supply Process |
| Elektrik Tedarik Sözleşmesi Modelleri | Electricity Supply Contract Models |
| Voltage Enerji Hakkında | About Voltage Enerji |
| Elektrik Piyasalarında Uzmanlık | Expertise in Electricity Markets |
| Canlı PTF (menü) | Live MCP |
| İçeriğe atla | Skip to content |
| Betik kapalıyken: "Grafik ve saatlik tablo bu sayfada tarayıcı betiğiyle dolar. Güncel saatlik değerler Canlı PTF sayfasında yer alır." | yalnız Türkçe (dil değişimi betik ister) |

## Kapak fotoğrafı

`<picture class="hero-photo">` içinde; yollar göreli (`img/…`). Yüklenemezse `<img onerror>` `.hero-media` öğesine `yedek` sınıfını ekler ve çizim silüet görünür. `sizes` değeri kapağın gerçek çizim genişliğine göredir (kapak yüksekliği × 3 ≈ 2100 px); `100vw` yazılırsa 1440 px ekranda 1600'lük dosya seçilir ve fotoğraf yumuşar.

## Yayın adımları

1. Sahibin tam sayfa onayı; QA kararı; yukarıdaki yeni metinler için Hukuk ve Uyum.
2. Canlı `index.html` o güne kadar değiştiyse önce/sonra karşılaştırması yeniden çalıştırılır ve fark buraya işlenir.
3. Beş `.webp` dosyası kökteki `/img/` klasörüne kopyalanır; sayfadaki altı `img/kapak-…` yolu `/img/kapak-…` yapılır.
4. Bu `index.html` kök `index.html` yerine konur (kanca sahip onayı sorar).
5. `_headers`: `/img/*` için önbellek kuralı (ör. `/og/*` ile aynı). CSP `img-src 'self'` yeterlidir.
6. `sitemap.xml` ana sayfa `<lastmod>`; `.claude/rules/homepage.md` içindeki kanonik tasarım tarihi; `docs/OPERASYON-DEFTERI.md` ve `CHANGELOG.md` kaydı.
7. Yayından sonra: kapak kartı, saatlik tablo (yalnız "—" ise önce proxy), `/?kaynak=deneme#leadForm` ile bir deneme talebi, 375 ve 1280 px görünüm, Search Console'da H1 ve başlık değişikliğinin izlenmesi.

## Doğrulanamayanlar

- Temiz adresler ve `_redirects` (`wrangler pages dev` bu ortamda yok); denetimler `python3 -m http.server` ile yapıldı.
- Lighthouse puanı. Ölçümler Chromium + CDP ile laboratuvarda alındı; gerçek kullanıcı verisi değildir.
- iOS Safari ve Firefox. Denetimlerin tamamı Chromium iledir.
- Telefon kapak görseli 579×724 pikseldir; 3× ekranda yaklaşık 3 kat büyütülür ve yumuşak görünür. Daha yüksek çözünürlüklü dikey kırpım gerekir.
- Sıkıştırılmış (Brotli) HTML ile LCP; yerel sunucu sıkıştırmaz.
