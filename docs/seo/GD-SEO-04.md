# GD-SEO-04 — YEK-G ve I-REC: siteye ne konabilir, SEO'ya katkısı ne olur (2026-11-11)

Sahibin talebi: "YEK-G ve I-REC sertifikaları da alacağız. Onlar hakkında siteye ne koyabiliriz ve SEO tarafında bizi ne kadar destekler?"

Çalışanlar: energy-market (mevzuat föyü), seo-keyword-research (talep ve rakip), legal-compliance (beyan çerçevesi). Sentez: Orchestrator.

## 0. Doğrulama sınırı

Oturumun ağı `epias.com.tr`, `resmigazete.gov.tr`, `mevzuat.gov.tr`, `eur-lex.europa.eu`, `trackingstandard.org` adreslerine ulaşamıyor. Bu belgedeki mevzuat bilgileri arama özetlerinden derlendi; **birincil metin açılmadı**. Rehber sayfaları yazılmadan önce her atıf birincil kaynaktan teyit edilir (geçici CI işiyle veya ağ izniyle). Arama hacimleri ölçülmedi: `NOT VERIFIED`.

## 1. Önce çözülmesi gereken çelişki

Site bugün YEK-G'yi verilen bir hizmet olarak beyan ediyor:

| Yer | İfade |
|---|---|
| `index.html` rozet | "YEK-G SERTİFİKALI SATICI / YEK-G CERTIFIED SELLER" |
| `index.html` hizmet kartı, menü, JSON-LD (`knowsAbout`, `Offer`) | "YEK-G belgeli yeşil enerji tedariği…" |
| `kurumsal.html` | "YEK-G belgeli yenilenebilir enerji tedariki sağlıyoruz" |
| `rehber/veri-merkezi-elektrik.html`, `rehber/yenilenebilir-ureticiler.html`, `rehber.html`, `llms.txt` | aynı beyanın türevleri |
| `docs/seo/GBP-VE-DIZIN-PAKETI.md`, `docs/marketing/LINKEDIN-KIT.md` | dış kanal metinleri |

Sahibin sözü ("alacağız") şirketin henüz sistemde olmadığı anlamına geliyorsa bu ifadeler kural 2'ye (uydurma yetkinlik yok) aykırıdır ve Legal görüşüne göre kaldırılmalıdır. "Sertifikalı satıcı" diye bir unvan ayrıca sistemde tanımlı görünmüyor (yalnızca sistem kullanıcısı / piyasa katılımcısı). Sahibe soruldu; karar bekliyor.

## 2. Bilgi özeti (teyit bekleyen)

- **YEK-G:** EPDK yönetmeliği (RG 14.11.2020/31304, yürürlük 01.06.2021; değişiklikler 2021, 2023, 2024). 1 belge = 1 MWh yenilenebilir üretim. EPİAŞ ihraç eder ve sistemi işletir. Transfer organize piyasada veya ikili; itfa tedarikçinin tüketici lehine bildirimiyle; geçerlilik üretim dönemi bitiminden 12 ay. Tedarik lisansı sahibi: EPİAŞ'a başvuru, katılım anlaşması(ları), yıllık katılım ücreti, organize piyasa için Takasbank teminatı. "Yeşil tarife (YETA)" görevli tedarik şirketlerine özgü düzenlenmiş üründür; bu ad kullanılmaz.
- **I-REC:** gönüllü, uluslararası sertifika (I-TRACK Foundation standardı; kayıt sistemi Evident). Türkiye ihraççısı olarak Foton görünüyor. Tedarikçi ya kendi katılımcı hesabını açar ya da hesabı olan bir aracıdan müşteri adına itfa ettirir.
- **Fark:** YEK-G ulusal ve mevzuatla kurulu; I-REC özel ve uluslararası raporlamada yaygın. Aynı MWh için ikisi birlikte kullanılmamalı.
- **Müşteri neden ister:** Kapsam 2 piyasa bazlı raporlama (GHG Protocol), CDP, RE100, ihracat müşterisi talepleri, TSRS.
- **SKDM/CBAM:** bu sertifikalar gömülü dolaylı emisyon hesabını düşürmez (Tüzük 2023/956; Komisyon S&C; fiilî değer yalnızca doğrudan bağlantı veya PPA ile). Site hiçbir SKDM faydası ima etmez.
- **Sertifika ne değildir:** fiziksel yeşil elektron, karbon kredisi, ek kapasite kanıtı.

## 3. SEO değerlendirmesi

- **Kendi verimiz** (GSC, 2026-10-10 – 11-06 ve 90 gün): yek-g / i-rec / yeşil sertifika içeren sorgu yok; 0 gösterim.
- **Manzara:** tanım sorgularında EPİAŞ, hukuk büroları ve büyük markalar; "yeşil enerji sertifikası" baş teriminde Enerjisa, CK, Gain, Aydem. Boşluk: tüketici gözüyle güncel rehber, YEK-G–I-REC karar çerçevesi, Kapsam 2'nin Türkçe açıklaması, SKDM konusunda dürüst ve kaynaklı anlatım.
- **Ulaşılabilirlik:** karşılaştırma, süreç, Kapsam 2 ve SKDM uzun kuyruk sorgularında ilk sayfa makul; tanım sorguları zor; baş terim ve YETA erişim dışı.
- **Ölçek (tahmin, taahhüt değil):** ilk 2–3 ayda sayfa başına 28 günde onlarca, en iyi ihtimalle düşük yüzler gösterim; küme toplamında ayda tek haneli–düşük onlu tık.
- **Asıl değer:** arayan kişi sürdürülebilirlik veya ihracat uyum yöneticisi (yüksek MWh'li talep); "kurumsal elektrik tedarikçisi" konu otoritesi; sektör rehberlerine iç bağlantı hedefi; yapay zekâ cevaplarında alıntılanma olasılığı (ölçülmedi).

## 4. Önerilen sayfa seti

**(a) Şimdi yayımlanabilir** — tarafsız, tarihli, kaynaklı; "Voltage sağlar" yok, fiyat yok; şema Article + FAQPage + BreadcrumbList; TR + EN.

| Sıra | URL | Hedef |
|---|---|---|
| 1 | `/rehber/yek-g-i-rec-farki` | yek-g i-rec farkı, hangisi geçerli |
| 2 | `/rehber/yek-g-nedir` | yek-g belgesi nedir, nasıl alınır, itfa |
| 3 | `/rehber/i-rec-nedir` | i-rec sertifikası nedir, nasıl alınır |
| 4 | `/rehber/kapsam-2-elektrik-emisyonu` | kapsam 2, piyasa bazlı / konum bazlı |
| 5 | `/rehber/skdm-elektrik-sertifika` | skdm elektrik, sertifika geçerli mi (birincil AB metni ve Legal onayı şart) |

**(b) Hizmet gerçekten başlayınca** — hizmet sayfası (Service şeması), ana sayfa ifadesi (önizleme + sahip onayı), sektör rehberlerinde teklif çağrısı, ticari sorgular.

## 5. Beyan sınırları (Legal)

- Şimdi: yalnızca eğitici içerik. "Yakında" duyurusu önerilmez.
- Kayıt sonrası: "GG.AA.YYYY itibarıyla EPİAŞ YEK-G sistemine kayıtlıyız…" (yalnızca fiilî statü, tarihle).
- Hizmet canlı: "Sözleşmede belirlenen dönem ve miktar için tüketiminiz kadar YEK-G belgesi adınıza itfa edilir; itfa kaydı tarafınıza iletilir."
- Asla: fiziksel yeşil elektrik, kayıtsız "%100 yeşil", karbon nötr / sıfır emisyon, SKDM yükünü azaltır, garanti, fiyat/tasarruf, "EPİAŞ onaylı / I-REC onaylı", logo kullanımı, "yeşil tarife" adı.
- Dayanak: 6502 s. Kanun m.61 vd.; Ticari Reklam Yönetmeliği m.17 (çevresel beyan değişikliği RG 01.07.2026/33297, yürürlük 01.08.2026 — teyit edilecek); Reklam Kurulu çevre beyanları kılavuzu (13.12.2022).

## 6. Sahibe sorulanlar

1. Bugün YEK-G sistemine kayıtlı mıyız, müşteri adına itfa yaptık mı? (Sitedeki mevcut beyanların kaderi buna bağlı.)
2. YEK-G: EPİAŞ'a tedarikçi olarak kayıt mı, başka katılımcıdan temin mi? Hedef tarih?
3. I-REC: kendi hesabımız mı, aracı üzerinden mi?
4. Ürün: tedarik sözleşmesine bağlı itfa mı, ayrıca yalnız sertifika satışı da mı?
