# GD-SEO-03 — İlk API verisiyle doğrulama ve küçük düzeltme paketi

**Tarih:** 07.11.2026
**Domain:** voltage.com.tr
**Hazırlayan:** SEO Director (Revenue). Uygulama: Webmaster (Technology). Onay: Hukuk & Uyum, QA.
**Durum:** Uygulandı 07.11.2026 (e5ae4f5); Hukuk ve QA onaylı. §3 listesinden farklar §11'de.

Ek kaynaklar: `GD-SEO-02.md`, `CTR-OPTIMIZATION-MAP.md`, `GSC-8-20-WAR-ROOM.md`, `KEYWORD-OWNERSHIP-MAP.md`, `OPERASYON-DEFTERI.md` §3.08.

---

## 0. Karar özeti

1. Verinin büyük kısmı **başlık sorunu göstermiyor.** Gösterim alıp tıklanmayan marka dışı kümelerin hepsi, sitenin kendi pozisyon bandı CTR'ı ile uyumlu. Sorun pozisyon, sorgu niyeti ve büyük olasılıkla SERP'te cevabın zaten görünmesi.
2. Bu sürümde **üç sayfa ve site haritası** değişiyor:
   - `/rehber/ptf-nedir`: SMF tanımı en öne alınıyor.
   - `/rehber/serbest-tuketici` ve `/rehber/tedarikci-degistirme`: `/kurumsal`'a gövde içi bağlantı. Yeni metin yok.
   - `sitemap.xml`: yalnızca ptf-nedir'in lastmod değeri.
3. Hiçbir başlık ve meta açıklama değişmiyor. Bunun gerekçesi §4'te.
4. En önemli marka ve kimlik işi sahipte: `/kurumsal` hiç taranmamış. URL denetiminden dizine ekleme isteği gönderilmeli (§6).
5. Ana sayfaya bu sürümde dokunulmuyor (kural 4). İki marka fikri önizleme bekliyor (§7).

---

## 1. Veri penceresi

| | Aralık | Not |
|---|---|---|
| Bu dönem | 08.10.2026 – 04.11.2026 (28 gün) | GD-SEO-02 (23.09.2026 yayını) bu dönemi tamamen kapsıyor |
| Önceki dönem | 10.09.2026 – 07.10.2026 (28 gün) | GD-SEO-02'yi ortadan bölüyor |
| 90 gün | 07.08.2026 – 04.11.2026 | Günlük seri ve sorgu toplamı |

- **Kaynak:** Search Console API (`tools/gsc-export.mjs --inspect`), mülk `sc-domain:voltage.com.tr`.
- **Veri durumu:** final. Çekim tarihi 07.11.2026.
- Ham dosyalar `gsc-data/` klasöründe; bu klasör git dışıdır. Bu raporda yalnızca toplamlar ve karar için gereken sorgular var.
- **Arama hacmi:** veride yok, kullanılmadı.

---

## 2. Bulgular

### 2.1 Toplamlar ve dürüst karşılaştırma

| Metrik | Bu dönem | Önceki dönem |
|---|---:|---:|
| Tıklama | 46 | 14 |
| Gösterim | 1.796 | 651 |
| CTR | %2,56 (%95 GA %1,93–3,40) | %2,15 |
| Ort. pozisyon | 6,8 | 11,1 |
| Sorgu | 80 | 54 |

**"+%176 gösterim" büyük ölçüde bir çukurdan dönüş.** Önceki dönem olağandışı düşüktü. Günlük seriye (07.08–04.11) göre:

| Aralık | Gösterim/gün | Tık/gün | CTR | Ort. poz. |
|---|---:|---:|---:|---:|
| 07.08 – 09.09 | 59,8 | 1,50 | %2,5 | 10,1 |
| 10.09 – 22.09 (GD-SEO-02 öncesi çukur) | 19,6 | 0,62 | %3,1 | 15,2 |
| 23.09 – 07.10 (GD-SEO-02 sonrası ilk 15 gün) | 26,4 | 0,40 | %1,5 | 8,5 |
| 08.10 – 21.10 | 36,7 | 1,00 | %2,7 | 8,5 |
| 22.10 – 04.11 | 91,6 | 2,29 | %2,5 | 6,2 |

- Çukur 08–10.09'da başladı, yani GD-SEO-02'den önce. Nedeni **NOT VERIFIED**.
- Toparlanma 17.10'dan sonra hızlandı. Aynı aralıkta iki şey daha oldu:
  - canlı PTF kesintisi (29.09–24.10, defter §3.1)
  - sitenin yaşının büyümesi
- Ağustos tabanına (07.08–09.09) göre: gösterim/gün +%7 (59,8 → 64,1), tık/gün +%9 (1,50 → 1,64). Bu farklar küçük.
- **GD-SEO-02'nin en temiz kanıtı sorgu pozisyonları.** Önceki dönem → bu dönem:

| Sorgu | Önceki poz. | Bu dönem poz. |
|---|---:|---:|
| ptf nedir | 39,3 | 8,3 |
| smf nedir | 27,0 | 7,3 |
| ptf smf | 28,0 | 7,0 |
| ptf | 29,9 | 6,5 |
| serbest tüketici limiti | 35,7 | 19,4 |

  Site geneli büyümeden ayrıştırılamaz.
- **İstisna:** "elektrik tedarikçi değiştirme" ve "elektrik serbest tüketici limiti 2026" Ağustos'ta 10,3 ve 9,2'deydi, bu dönem 10,1 ve 9,3'te. GD-SEO-02'nin başlık ve cevap kutusu değişiklikleri bu iki sorguyu oynatmadı.

### 2.2 Gösterimlerin %72'si anonim sorgularda

- Sorgu düzeyindeki satırlar toplam 503 gösterim ve 12 tık veriyor. Kalan **1.293 gösterim ve 34 tık (%72 / %74)** Search Console'un gizlediği sorgularda.
- Sorgu düzeyinde verilen her karar küçük bir örneğe dayanıyor. Bu yüzden sayfa düzeyi ölçütler ve kontrol sayfaları kullanıldı (§8).

Anonim kovanın tahmini ortalama pozisyonu ve CTR'ı (bu dönem). Hesap: sayfa toplamı eksi adı görünen sorgular, gösterime göre ağırlıklı.

| Sayfa | Anonim gösterim | Tahmini poz. | Tık | CTR |
|---|---:|---:|---:|---:|
| /rehber/tedarikci-degistirme | 467 | ≈5,3 | 14 | %3,0 |
| /rehber/serbest-tuketici | 207 | ≈5,7 | 2 | %1,0 |
| /rehber/ptf-nedir | 141 | ≈6,3 | 3 | %2,1 |
| /canli-ptf | 141 | ≈6,2 | 6 | %4,3 |
| /rehber/osb-elektrik-tedariki | 46 | ≈3,4 | 0 | %0 |

### 2.3 Başlık uyumsuzluğu mu, pozisyon mu, sıfır tık mı?

**Kıyas tabanı** sitenin kendi verisi; dış CTR eğrisi kullanılmadı. 90 günde (07.08–04.11), en az 3 gösterimli marka dışı sorgular:

| Pozisyon bandı | Tık / gösterim | CTR |
|---|---:|---:|
| 8–11 | 2 / 191 | %1,05 |
| 5–8 | 3 / 53 | %5,7 |

Bu dönem 5–8 bandı 3 / 125 = %2,4.

| Küme (08.10–04.11) | Gösterim / tık / poz. | Başlık uyumsuzluğu | Pozisyon kaynaklı | Sıfır tık (SERP cevabı) / YZ yüzeyi | Karar (güven) |
|---|---|---|---|---|---|
| Serbest tüketici limiti 2026 (4 varyant: "serbest tüketici limiti 2026", "elektrik …", "epdk …", "2026 serbest …") | 71 / 0 / 9,4. Önceki dönemde 0 gösterim. 90 günde 110 / 1 / 9,5 | **Desteklenmiyor.** Başlık sorguyla birebir aynı. | **Destekleniyor.** Taban %1,05 ile beklenen ≈0,7 tık; 0 tık olasılığı ≈%50. | **Olası.** Başlık ve meta cevabı (500 kWh) zaten veriyor. SERP'te öne çıkan snippet veya YZ özeti olup olmadığı **NOT VERIFIED** (§6, O5). | Başlık ve meta değişmez (orta) |
| PTF tanımı ("ptf nedir", "ptf ne demek", "elektrik ptf" vb.) | 50 / 0 / 8,2 (önceki 37,2) | Desteklenmiyor. Başlık "PTF Nedir?" ile başlıyor. | Destekleniyor. 8–11 bandı. | Tanım sorgusu, sıfır tık olasılığı yüksek (NOT VERIFIED) | Değişiklik yok (orta) |
| "ptf" (çıplak) | 60 / 1 / 6,5. 59 gösterim /rehber/ptf-nedir'de, 1 gösterim /canli-ptf'de (poz. 2) | — | Belirsiz niyet. 90 günde "ptf glass/pets/mode" gibi alakasız varyantlar da var. | — | Sayfa değişikliği yok. Sahiplik haritası güncellenmeli (§2.6). |
| SMF ("smf nedir", "ptf smf", "smf") | 32 / 0 / 7,0. Önceki 4 gösterim, 27,8 | **Kısmen destekleniyor.** Başlık "PTF Nedir?" ile başlıyor. Sayfada SMF ile başlayan bir tanım cümlesi yok; tanım paragrafın ortasında. | CTR açısından anlamlı sapma yok (beklenen 0,8–1,8 tık) | — | **Değişiklik 1** (orta-düşük): H2 ve tanım paragrafı. PTF kümeleri (110 gösterim) SMF'nin 3 katı olduğu için başlığa dokunulmuyor. |
| EPDK tedarikçi ("epdk tedarikçi değiştirme", "… seçimi") | 30 / 3 / 6,1 → %10 | — | Taban üstünde | — | Dokunulmaz (yüksek) |
| "elektrik tedarikçi değiştirme" | 11 / 0 / 10,1. 90 günde 44 / 0 / 10,3 | Desteklenmiyor. Başlık eşleşiyor, GD-SEO-02 sonrası pozisyon değişmedi. | Destekleniyor. Otorite sorunu. | — | Sayfa içi değişiklik yok. Bağlantı kazanımı (`LINK-KAZANIM-PLANI.md`). |
| /rehber/serbest-tuketici anonim kovası | 207 / 2 / ≈5,7 | Ölçülemez | Hayır, poz. iyi | **Olası:** görünür parçalar "evet", "ev", "konut icin", "indirimli", "2000 tl", "2800" konuşma devamı biçiminde ve mesken niyetli | Değişiklik yok (düşük). MWh ağırlıklı değeri düşük: 500 kWh eşiği hane ölçeği. |
| /rehber/osb-elektrik-tedariki | 54 / 0 / 3,1 (önceki 2 gösterim, 53,5) | Ölçülemez (46 anonim) | Hayır | Görünen tek sorgu İngilizce uzun bir soru istemi (8 gösterim, poz. 1,6) | Değişiklik yok. Sorgu verisi olmadan başlığa dokunulmaz. |

**Yapay zekâ modu izi (çıkarım, orta güven):**
- 28 günde görünür sorguların yaklaşık 27 gösteriminde iki biçim var:
  - tek kelimelik devam ifadeleri ("evet", "ev", "mesken", "en avantajlı", "nasıl başvurulur")
  - İngilizce, soru cümlesi biçiminde uzun istemler
- Bunlar klasik web aramasına benzemiyor. Pozisyonları 1–11 arasında.
- Anonim kovada daha fazlası olması muhtemel. API bu gösterimleri ayrı etiketlemiyor.
- Sonuç: sayfa CTR'ları klasik SERP CTR'ı gibi okunamaz. Sayfalar arası CTR farkı kısmen YZ yüzeyi payından kaynaklanabilir.

**Cihaz ve ülke (bu dönem):**
- Masaüstü 929 gösterim, CTR %2,8, poz. 7,2. Mobil 856 gösterim, CTR %2,3, poz. 6,5. Belirgin cihaz sorunu yok.
- Türkiye 1.709 gösterim (%95).

### 2.4 Marka ve kimlik

Marka kümesi ("volt" içeren sorgular): **134 gösterim, 7 tık, poz. 5,3.** Önceki dönem 133 / 2 / 8,4.

| Bulgu | Veri (08.10–04.11) | Yorum |
|---|---|---|
| "voltan" 0 tık | 42 / 0 / 4,0. 90 günde 181 / 1 / 5,0 | **İki açıklama var.** (a) "Voltan" kişi adı ve başka firmalar da kullanıyor; arayanların bir kısmı bizi aramıyor (NOT VERIFIED). (b) Ana sayfa başlığında "Voltan" 64. karakterde başlıyor, SERP'te başlık ~60 karakterde kesilir; "voltan" arayan, sonuçta "Voltan"ı göremeyebilir. "voltan elektrik" 13 / 3 / 3,2 (%23) ile çalışıyor. (b) yalnız ana sayfada çözülür → §7. |
| Yasal sayfalar marka sorgusu alıyor | "voltage enerji": ana sayfa 12 gösterim, poz. 1,4, 4 tık; /kullanim-kosullari 7 gösterim (poz. 10,1); /kvkk 4 gösterim (6,5). "voltage.com": /kvkk 5 gösterim (8,0). Yasal sayfalarda toplam 16 gösterim. | 1. sırada ana sayfa var. Yasal sayfalar ek sonuç olarak görünüyor, ana sonucu almıyor. Google, kimlik bilgisi taşıyan sayfa olarak dizindeki yasal metinleri seçiyor; asıl kimlik sayfası `/kurumsal` dizinde değil (çıkarım). **Yasal sayfalara noindex önerilmez.** Önce `/kurumsal` dizine alınır, sonra yeniden ölçülür. |
| `/kurumsal` dizinde değil | URL denetimi: "Keşfedildi - şu anda dizine eklenmiş değil", taranma tarihi boş. Site haritasındaki diğer 20 URL dizinde. | Repoda teknik engel yok: `index, follow`, kendi kanoniği, site haritasında, 20 sayfanın altbilgisinden bağlantı. **Gövde içi bağlantısı yok**; yalnızca altbilgi. 23.08'den beri taranmaması, düşük tarama önceliğine işaret ediyor. Çözüm: sahip dizin talebi (O1) ve iki gövde bağlantısı (Değişiklik 2–3). |
| `/?lang=en` ayrı sayfa | 10 gösterim, poz. 7,2 (90 günde 14) | `index.html` kanoniği sabit `https://voltage.com.tr/`; dil JavaScript ile değişiyor. Google URL'yi ayrı raporluyor; işlenen İngilizce içerik kanonikle çelişiyor (çıkarım). **Yapılandırmayla çözülmez.** `_redirects` sorgu dizesine göre eşleşmez ve yönlendirme EN erişimini keserdi. Kalıcı çözüm plan 3.5: önceden işlenmiş `/en/` ve hreflang. Ana sayfaya dokunur → §7. |
| http varyantları | `http://www.voltage.com.tr/` 4 gösterim, poz. 7,8 ("voltage enerji" 3 gösterim, 10,0). `http://voltage.com.tr/` 2 gösterim, poz. 1,5, 1 tık. | Eski dizin kayıtları. www → kök 301 kuralı `_redirects`'te; HTTPS yönlendirmesi Cloudflare bölge ayarında (repo dışı); HSTS başlığı var. Canlı yönlendirme bu ortamdan doğrulanamadı (vekil 403): **NOT VERIFIED**. Defter 3.07'ye göre www kaydı eski başlıkla görünüyordu → O4. |
| Site haritası "indexed: 0" | `sitemaps.json` | API'nin bu alanı güvenilir değil. URL denetimi 20/21 dizinde diyor. Son gönderim 22.08.2026, son indirme 28.10.2026 → O3. |
| Kapsam açığı | `/rehber/sktt` ve `/rehber/elektrik-faturasi-neden-yuksek` dizinde ama bu dönem 0 gösterim. `/kurumsal` dizinde değil. | Site haritasındaki 21 URL'nin 18'i gösterim aldı. SKTT kümesi ticari olarak önemli (yıllık 15.000 kWh üstü işletmeler). Bu sürümde veri yok; sonraki okumada izlenir. |

### 2.5 Sorgu×sayfa: "ptf" sahipliği

- `KEYWORD-OWNERSHIP-MAP.md` çıplak "ptf" için birincil sayfa olarak `/canli-ptf`'yi gösteriyor.
- Google aynı dönemde 60 gösterimin 59'unu `/rehber/ptf-nedir`'e verdi.
- ptf-nedir'in üstündeki "Bugünün PTF değerlerini mi arıyorsunuz?" kutusu veri niyetli ziyaretçiyi zaten `/canli-ptf`'ye yönlendiriyor.
- **Öneri (yalnız doküman):** haritada çıplak "ptf"nin birincil sayfası `/rehber/ptf-nedir`, ikincili `/canli-ptf` olsun. Google'ın seçimiyle savaşılmaz, sayfalar değişmez.
- /canli-ptf bu dönem 145 gösterim, CTR %4,1, poz. 7,0 ile iyi. Değişiklik yok.

---

## 3. Sıralı değişiklik listesi (bu sürüm)

Sıralama ölçütü: kanıtın gücü × MWh ağırlıklı değer × risk. Yeni URL yok. Kanonik, hreflang, robots ve `_redirects` değişmiyor; veri bunlarda somut bir sorun göstermedi.

Değişen sayfaların İngilizce sürümü veya EN bloğu yok (`lang="en"`, `data-en` ve `en-only` yok). Bu nedenle EN değişikliği yok.

### Değişiklik 1 — `/rehber/ptf-nedir`: SMF tanımı en öne

**Dosya:** `rehber/ptf-nedir.html`

**Kanıt (08.10–04.11):**
- "smf nedir": 21 gösterim, poz. 7,3, 0 tık
- "ptf smf": 10 gösterim, poz. 7,0, 0 tık
- "smf": 1 gösterim, poz. 1
- Önceki dönemde küme 4 gösterim, poz. 27,8 → Google sayfayı SMF için öne almaya başladı.

**Gerekçe:**
- "smf nedir" arayan, başlığı "PTF Nedir?" ile başlayan bir sonuç görüyor.
- Sayfada SMF ile başlayan tanım cümlesi yok; tanım "burada oluşan fiyat SMF'dir" diye paragraf ortasında geçiyor.
- H2'yi soru biçimine çevirmek ve tanımı ilk cümleye almak, snippet uygunluğu için en düşük riskli adım.
- Başlık korunuyor: PTF kümeleri ("ptf" 60 + PTF tanımı 50 gösterim) SMF'nin 3 katından büyük.

**Önce → sonra:**

| Öğe | Önce | Sonra |
|---|---|---|
| H2 | PTF ile SMF arasındaki fark nedir? | SMF nedir, PTF'den farkı ne? |
| Yeni paragraf (H2'nin hemen altında) | — | **SMF (Sistem Marjinal Fiyatı)**, elektrik sisteminin gerçek zamanlı dengelenmesi için Dengeleme Güç Piyasası'nda (DGP) saatlik olarak oluşan fiyattır. DGP'yi TEİAŞ bünyesindeki Milli Yük Tevzi Merkezi işletir. |
| Mevcut paragraf, tek ifade | … burada oluşan fiyat **SMF (Sistem Marjinal Fiyatı)**'dir. | … burada oluşan fiyat SMF'dir. |
| Görünür tarih | Yayın / son güncelleme: 23.09.2026 | Yayın / son güncelleme: 07.11.2026 |
| "Bu yazı hakkında" | Yayın/güncelleme tarihi: 23.09.2026. | Yayın/güncelleme tarihi: 07.11.2026. |
| JSON-LD `dateModified` | 2026-09-23 | 2026-11-07 |

**Değişmeyenler:**
- Başlık, meta, H1, Article `headline`, breadcrumb, og etiketleri, SSS.
- FAQPage JSON-LD aynı; görünür SSS'ye dokunulmadı, birebir eşleşme korunuyor.

**Olgular:** Yeni paragraftaki her olgu (DGP, TEİAŞ/MYTM, gerçek zamanlı, saatlik) sayfadaki mevcut PTF–SMF tablosunun satırlarının yeniden ifadesi. 23.09.2026'da Hukuk onayından geçmiş içerik; yeni olgu yok. Güncellik teyidi §9-S2'de.

**Tazelik:** Değişir (07.11.2026). Gerekçe: sayfa yeni bir soruya ("SMF nedir?") doğrudan cevap veren yeni bir paragraf kazanıyor; bu içerik değişikliği, kozmetik bir düzeltme değil.

### Değişiklik 2 — `/rehber/serbest-tuketici`: `/kurumsal`'a gövde bağlantısı

**Dosya:** `rehber/serbest-tuketici.html`

**Kanıt:**
- `/kurumsal` hiç taranmamış.
- Bu sayfa 03.11.2026'da tarandı ve bu dönem 310 gösterim aldı.
- Bağlantı yasal unvan çapasıyla veriliyor; marka kimliğini (Voltan Elektrik ↔ /kurumsal) güçlendirir.

**Önce → sonra:** `Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.), ETS/3424-8/2074 …` cümlesinde yasal unvan `/kurumsal` bağlantısı olur. Metin değişmez.

**Tazelik:** Değişmez. Yalnız bağlantı ekleniyor, içerik değişmiyor. `dateModified`, görünür tarih ve site haritası lastmod 2026-09-23'te kalır.

### Değişiklik 3 — `/rehber/tedarikci-degistirme`: `/kurumsal`'a gövde bağlantısı

**Dosya:** `rehber/tedarikci-degistirme.html`

**Kanıt:**
- Sitenin en çok gösterim alan sayfası (555 gösterim, 17 tık). 04.11.2026'da tarandı.
- Bağlantı, okuyucuya "lisansı doğrulayın" diyen maddenin içinde; bağlam doğal.

**Önce → sonra:** "Lisans" maddesindeki `(Voltage Enerji — Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.: ETS/3424-8/2074 …)` ifadesinde yasal unvan `/kurumsal` bağlantısı olur. Metin değişmez.

**Tazelik:** Değişmez (yalnız bağlantı).

### Değişiklik 4 — `sitemap.xml`

`/rehber/ptf-nedir` `<lastmod>` 2026-09-23 → 2026-11-07. Başka satır değişmez. `/kurumsal` lastmod 2026-08-23'te kalır; içeriği değişmedi.

**Hukuk incelemesine giren yeni veya değişen herkese açık metin:** yalnız Değişiklik 1'deki H2, iki yeni cümle, kısaltılan ifade ve iki tarih satırı. Değişiklik 2–3 metin değiştirmiyor.

**Pricing:** Fiyat iddiası yok. **Energy Market:** SMF tanımının güncelliği teyit edilmeli (§9-S2).

---

## 4. Değerlendirilip reddedilen değişiklikler

| Aday | Neden reddedildi |
|---|---|
| serbest-tuketici başlık ve meta (örn. "500 kWh"ı başlıktan çıkarmak, "Yıllara Göre" eklemek) | Başlık sorguyla birebir eşleşiyor. 0 tık sitenin 8–11 bandı CTR'ı ile uyumlu (P≈0,5). Pozisyon 90 günde 9,2–9,5 arasında sabit; GD-SEO-02 başlık değişikliği oynatmadı. Cevabı başlıktan saklamak tıklama tuzağı olur ve ilgiyi düşürür. Görünür sorgu parçaları mesken niyetli olduğu için MWh ağırlıklı değer de düşük. |
| tedarikci-degistirme meta açıklamasına "EPDK" eklemek | Sayfanın görünür en büyük sorgusu ("epdk tedarikçi değiştirme") zaten %10 CTR ile site tabanının üstünde. Gösterimlerin %84'ü anonim; meta değişikliği bu kovada kör bir değişiklik olur. Sitenin en iyi çalışan rehberinde gereksiz risk. Defter 3.05 ilkesi: "iyi başlığı bozmak risk". |
| tedarikci-degistirme H1'ini başlıkla eşlemek ("… Değiştirme") | Başlığın birebir karşılığı olan "elektrik tedarikçisi değiştirme" 18,9'da, eksiz "elektrik tedarikçi değiştirme" 10,1'de. Sorun eşleşme değil, otorite. |
| tedarikci-degistirme'ye "Elektrik dağıtım şirketi değiştirilebilir mi?" SSS'si | Talep gerçek ama küçük: bu dönem 3 gösterim (poz. 11). 90 günde bu kümede 10 gösterim ve 1 tık var. Cevabın çekirdek iddiası ("dağıtım şirketi aboneye göre değişmez, bölgeye göre bellidir") bu çalışmada kaynakla doğrulanmadı (**NOT VERIFIED**). Hukuk dayanağı teyit ederse sonraki sürüm adayı (§9-S4). |
| ptf-nedir başlığına "SMF Nedir" eklemek | PTF kümeleri (110 gösterim) SMF'nin (32) üç katından büyük. H2 ve tanım paragrafı aynı amaca daha düşük riskle hizmet ediyor. |
| Yasal sayfalara noindex | Yasal sayfalar 1. sıradaki ana sayfanın yerini almıyor. KVKK metni bulunabilir kalmalı. Önce `/kurumsal`. |
| OSB ve sektör sayfalarında başlık işi | Sorguların %85'i anonim; görünen tek sorgu YZ istemi. Kanıt yok. |

---

## 5. Marka ve kimlik işlerinin sınıflandırması

| Konu | Şimdi içerik veya yapılandırmayla | Sahipte | Ana sayfaya dokunur (önizleme) |
|---|---|---|---|
| `/kurumsal` dizinde değil | Değişiklik 2–3 (gövde bağlantıları) | O1 dizin talebi, O3 site haritası | — |
| Yasal sayfalar marka sorgusu alıyor | Değişiklik yok; `/kurumsal` dizine alınınca yeniden ölçülür | — | — |
| "voltan" 0 tık | — | O5 SERP kontrolü (kimin sonuçları var?) | H-1 başlık, H-2 meta |
| "voltag" (36 gösterim, poz. 6,3, 0 tık; 90 günde 88 / 0) | Değişiklik yok. Niyet belirsiz: "voltage" yazımının yarısı veya başka bir marka olabilir (NOT VERIFIED). | — | — |
| `/?lang=en` | Yapılandırmayla çözülmez | — | H-3 (plan 3.5) |
| http varyantları | Repoda değişiklik yok (www → kök 301 zaten var) | O4 URL denetimi | — |

---

## 6. Sahip aksiyonları

| # | Ne zaman | Aksiyon | Neden |
|---|---|---|---|
| O1 | Webmaster yayınladıktan sonra, aynı gün | Search Console → URL denetimi → `https://voltage.com.tr/kurumsal` → **Dizine eklenmesini iste** | Hiç taranmamış kimlik sayfası. Tek başına en etkili adım. |
| O2 | Aynı gün | URL denetimi → `https://voltage.com.tr/rehber/ptf-nedir` → **Dizine eklenmesini iste** | SMF değişikliğinin hızlı taranması |
| O3 | Aynı gün | Site haritaları → `https://voltage.com.tr/sitemap.xml` → yeniden gönder | Son gönderim 22.08.2026 |
| O4 | Bu hafta | URL denetimi → `http://www.voltage.com.tr/`. Beklenen: "Sayfa yönlendirmeli", Google kanoniği `https://voltage.com.tr/`. Farklıysa Technology Executive'e (Cloudflare HTTPS yönlendirmesi). | Eski www kaydı. Defter 3.07'de eski başlıkla görünüyordu. |
| O4-uyarı | — | **Kaldırma aracını (Removals) kullanmayın.** Google'ın yardım belgesine göre kaldırma isteği http/https ve www/www'suz tüm varyantlara uygulanır. Ana sayfayı yaklaşık 6 ay gizler. Eski kayıt 301 ile kendiliğinden düşer. | Felaket riski |
| O5 | Bu hafta | Elle SERP kontrolü: gizli pencere, google.com.tr, mobil ve masaüstü. Sorgular: "serbest tüketici limiti 2026", "ptf nedir", "smf nedir", "voltan". Not edilecekler: YZ özeti var mı, öne çıkan snippet var mı, bizim sonucumuz hangi başlıkla ve kaçıncı sırada görünüyor, "voltan" için ilk 5 sonuç kime ait. Yalnız özet deftere yazılır; ekran görüntüleri repoya girmez. | §2.3'teki sıfır tık ve YZ hipotezini yalnız bu kontrol doğrular |
| O6 | 10.12.2026 | Sonraki okuma (§8), anahtarsız yolla giriş, iş bitince `gcloud auth revoke --all` | Ölçüm |

---

## 7. Ana sayfa fikirleri (önizleme gerekir, bu sürümde değil)

Kural 4 gereği hiçbiri bu sürümde uygulanmaz. Her biri önce sahibe önizleme olarak gösterilir, sonra Hukuk onayından geçer.

| # | Fikir | Kanıt | Risk |
|---|---|---|---|
| H-1 | Başlık 84 → 60 karakter, "Voltan" görünür kısımda: `Voltage Enerji (Voltan Elektrik A.Ş.) \| Elektrik Tedarikçisi` | "voltan" 42 gösterim, 0 tık, poz. 4,0 (08.10–04.11); 90 günde 181 / 1. Mevcut başlıkta "Voltan" 64. karakterde başlıyor. | "voltage enerji" şu an 1,4'te ve %33 CTR'da; bozulmamalı. "Kurumsal ve Endüstriyel" konumlandırması başlıktan düşer. |
| H-2 | Meta 219 → 141 karakter: `Voltan Elektrik A.Ş.'nin markası Voltage Enerji, EPDK lisansıyla 2011'den bu yana kurumsal ve endüstriyel tüketicilere elektrik tedarik eder.` | Mevcut meta kesiliyor (GD-SEO-02 §18) ve "Voltan" içermiyor. | Mevcut metindeki "ilk oyuncularından" (doğrulanmamış üstünlük ifadesi) ve "güvenilir elektrik tedariki" (süreklilik çağrışımı) çıkar. Hukuk bunu olumlu bulabilir; yine de onay gerekir. |
| H-3 | `/?lang=en` yerine önceden işlenmiş `/en/` ve iki yönlü hreflang (plan 3.5) | `/?lang=en` 10 gösterimle ayrı sayfa olarak raporlanıyor (08.10–04.11) | Technology Executive işi. Ana sayfa yapısına ve site haritasına dokunur. |

---

## 8. Ölçüm planı (sonraki okuma)

**Ne zaman:** 10.12.2026. Araç penceresi: bitiş bugün−3.

| | Aralık |
|---|---|
| Ölçüm dönemi | 10.11.2026 – 07.12.2026 (yayından sonraki ilk 3 gün tarama payı olarak dışarıda) |
| Kıyas | Bu raporun dönemi, 08.10 – 04.11.2026 |

Aracın kendi "önceki dönem"i (13.10–09.11) yayın öncesi günleri de içerir. Bu yüzden kıyas bu raporun dosyalarıyla yapılır.

**Hazırlık:**
- Bugünkü dosyalar `gsc-data/2026-11-07/` altına taşınır.
- Yeni okuma `--inspect --out gsc-data/2026-12-10` ile alınır. İkisi de git dışında kalır.

**Ara kontrol:** 21.11.2026'da URL denetimiyle `/kurumsal` ve `/rehber/ptf-nedir` (sahip).

| Ölçüt | Taban (08.10–04.11) | Başarı | Geri alma veya inceleme |
|---|---|---|---|
| `/kurumsal` dizin durumu | Keşfedildi, taranmadı | 21.11.2026'ya kadar "Gönderildi ve dizine eklendi" | 21.11'de hâlâ taranmamışsa: tekrar talep, ardından seo-technical denetimi (sayfa boyutu, işleme, iç bağlantı) |
| `/kurumsal` marka gösterimi | 0 | En az bir marka sorgusunda gösterim | — |
| Marka sorgularında yasal sayfalara düşen gösterim | 16 | Azalma (yalnız yön; küçük örnek) | — |
| SMF kümesi ("smf nedir", "ptf smf", "smf"), ağırlıklı poz. | 32 gösterim, poz. 7,0, 0 tık | Poz. ≤ 5,0 ve en az 25 gösterim, ya da en az 2 tık | Poz. > 9,0 |
| PTF kümeleri koruma | "ptf" 6,5; "ptf nedir" 8,3 | — | "ptf" > 8,5 veya "ptf nedir" > 10,5 → H2 değişikliği gözden geçirilir. Kontrol sayfaları da aynı yönde kaydıysa bu site geneli harekettir; geri alma yapılmaz. |
| `/rehber/ptf-nedir` sayfa CTR | 4 / 284 = %1,41 (GA %0,55–3,56), poz. 7,0 | CTR > %3,6 | CTR < %0,55 (gösterim ≥ 250) |
| Kontrol: `/rehber/tedarikci-degistirme` (yalnız bağlantı) | 17 / 555 = %3,06 (GA %1,92–4,85), poz. 7,1 | — | CTR < %1,9 (gösterim ≥ 400) |
| Kontrol: serbest tüketici 2026 kümesi | 71 / 0 / 9,4 | Değişiklik beklenmiyor | Aralık'taki 2027 limit haberleri bu kümeyi oynatabilir |
| Site toplamı | 46 / 1.796 / %2,56 / 6,8 | Yalnız bağlam | Son 14 günün ivmesi (91,6 gösterim/gün) zaten yükseliyor; bu sürüme atfedilmez |
| Dizin kapsamı | 20/21 dizinde; 18/21 gösterim aldı | 21/21 dizinde | — |
| Organik lead (MWh ağırlıklı) | **Ölçülemiyor**: lead kaydında açılış sayfası yok (§9-S5) | — | — |

**Dürüst sınır:** Bu hacimlerde 4 hafta yalnız büyük değişimleri gösterir. Yukarıdaki güven aralıklarının içinde kalan CTR farkları yorumlanmaz. Pozisyon birincil ölçüt, tık ikincil.

---

## 9. Açık sorular ve riskler

- **S1 (Hukuk, mevcut içerik).** Kural 1, 04.11.2026'da CLAUDE.md'ye girdi; GD-SEO-02 Hukuk onayı (23.09) bundan önceydi. Aşağıdaki mevcut ifadeler yeni kural altında yeniden okunmalı. Bu sürüm bunlara dokunmuyor.
  - tedarikci-degistirme "Elektrik kesilir mi?" bölümü: "EPİAŞ kayıtlarında kesintisiz olarak birbirini izler" ve "kendisinden kaynaklı herhangi bir kesintiye yol açmaz"
  - aynı sayfanın meta açıklamasındaki "elektrik kesilir mi" sorusu
  - serbest-tuketici'deki "elektrik kullanan hemen her işletme ve mesken abonelerinin büyük bölümü 2026 itibarıyla serbest tüketici niteliğindedir" ve "katbekat üzerinde tüketir" ifadeleri. Kaynaksız nicel genelleme (kural 2).
- **S2 (Energy Market).** SMF'nin saatlik oluştuğu ve DGP'yi TEİAŞ MYTM'nin işlettiği bilgisi, sayfadaki mevcut tabloyla aynı. Dengeleme veya uzlaştırma periyodunda yakın tarihli bir değişiklik varsa (NOT VERIFIED), tablo ve yeni cümle birlikte düzeltilmeli.
- **S3 (Energy Market ve Hukuk, zaman kritik).** 2026 SKTT limitleri 30.10.2025 tarihli Karar 13912 ile belirlenmişti. 2027 SKTT limitleri için Ekim–Kasım 2026'da bir karar yayımlanmış olabilir (**NOT VERIFIED**). Resmî Gazete kontrol edilmeli. Varsa sktt, serbest-tuketici, hesaplama sayfası ve sektör rehberleri 01.01.2027'den önce güncellenir.
- **S4 (Hukuk).** "Dağıtım şirketi aboneye göre değişmez, bölgeye göre bellidir" iddiası için dayanak (6446 sayılı Kanun'daki ilgili madde) teyit edilirse, tedarikci-degistirme'ye SSS eklenir (§4).
- **S5 (Analytics ve Technology).** Lead kaydı (`functions/api/lead.js`) UTM tutuyor ama açılış veya yönlendiren sayfayı tutmuyor. Organik ziyaretçide UTM yok. Bu yüzden birimin ana KPI'ı (organik nitelikli lead, MWh ağırlıklı) sayfa bazında ölçülemiyor. Form ana sayfada; çözüm ana sayfa JavaScript'ine dokunur → sahip önizlemesi. Kişisel veri içermeyen, yalnız yol bilgisi taşıyan bir alan önerilir.
- **S6 (Orkestratör).** Aralık hazırlığı: 2027 serbest tüketici limiti kararı yayımlandığında (tarih NOT VERIFIED; 2021 limiti RG 22.12.2020'de, 2026 limiti RG 23.12.2025'te yayımlandı) aynı gün güncellenecek yerler:
  - 12 herkese açık dosya: `rehber/` altındaki 10 sayfa, `rehber.html`, `elektrik-faturasi-hesaplama.html`
  - hesaplama aracındaki `SERBEST = 500` sabiti
  - `llms.txt` ve `linkedin-queue.json`
  
  Şablon şimdi Hukuk'tan geçirilebilir; sayı ve karar numarası yalnız Resmî Gazete'den sonra girer.
- **S7 (doküman).** `KEYWORD-OWNERSHIP-MAP.md`'de "ptf (çıplak)" satırının güncellenmesi (§2.5). Kararın `OPERASYON-DEFTERI.md`'ye işlenmesi Orkestratörde.

---

## 10. Uygulama ve QA kontrol listesi (Webmaster, QA)

1. Değişiklik 1–4'ü tam metin değiştirme olarak uygula. Her arama metni dosyada bir kez geçer. 07.11.2026'da kopyalar üzerinde denendi: tümü tek eşleşme, JSON-LD geçerli, sayfa başına bir H1.
2. ptf-nedir'de üç tarih eşleşmeli: görünür tarih, "Bu yazı hakkında" ve `dateModified` = site haritası lastmod = 2026-11-07. serbest-tuketici ve tedarikci-degistirme tarihleri değişmez.
3. FAQPage JSON-LD'leri değişmez; görünür SSS ile birebir eşleşme korunur.
4. `/kurumsal` bağlantıları temiz URL'de 200 dönmeli. Kırık iç bağlantı 0.
5. `index.html`, kanonik, robots, `_redirects`, `_headers`, hreflang: değişiklik yok.
6. 375 px ve masaüstü: yeni paragraf taşma yapmamalı.
7. Değişen satırlarda kural 1 taraması: %, ₺, "en ucuz", "tasarruf", "garanti", "kesintisiz" geçmemeli. Denendi: 0.
8. Sıra: QA kararı → Hukuk onayı → çalışma dalını push et → `main`'i ileri sar (`DEPLOY.md`). Ardından sahip O1–O3.

---

## 11. Uygulama notu (07.11.2026, Orchestrator)

Uygulanan set, §3'teki listeden Hukuk ve Enerji Piyasası incelemesiyle şu noktalarda ayrıldı:

- **SMF cümlesi:** "saatlik" ifadesi çıkarıldı. DGP uzlaştırma dönemi 01.01.2027'de 15 dakikaya iniyor (DUY m.91(2), RG 21.01.2025 sayı 32789; ikincil kaynaklardan, birincil metin Hukuk teyidinde). Aynı nedenle tablodaki SMF satırı, "saatlerde" → "dönemlerde" ve "geçmiş saatlik serisi" → "geçmiş serileri" düzeltildi. "PTF'yi kim belirler?" SSS'ine EPDK'nın asgari ve azami fiyat limitleri eklendi; rakam verilmedi.
- **GÖP/GİP katılım iddiası:** ilk yayında (e5ae4f5) sahip teyidi beklendiği için kaldırılmıştı. Sahip aynı gün teyit etti; cümle geri eklendi. Sayfa, Hukuk'un onayladığı 24 maddelik setle bayt bayt aynıdır.
- **Kontrol sayfaları artık yalnız bağlantı değil:**
  - `/rehber/tedarikci-degistirme`: "Elektrik kesilir mi?" cevabı kural 1'e göre yeniden yazıldı.
  - `/rehber/serbest-tuketici`: kaynaksız "mesken abonelerinin büyük bölümü", "katbekat" ve "fiilen tüm tüketici tabanı" ifadeleri değişti.
  - İkisinin de tarihleri 07.11.2026'ya taşındı. §8'deki kontrol satırları artık saf kontrol değildir: bu sayfalardaki hareket, metin değişikliğinin etkisiyle karışır. Site geneli hareket için `/canli-ptf` ve `/rehber/osb-elektrik-tedariki` izlenir.
- §10 madde 2 ("serbest-tuketici ve tedarikci-degistirme tarihleri değişmez") bu nedenle geçersizdir.
