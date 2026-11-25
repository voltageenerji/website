# Piyasa verisi mimarisi — EPİAŞ kimliği yalnız proxy'de

**Karar:** Orchestrator, 25 Kasım 2026 (sahip talimatı: "EPİAŞ kimlik doğrulaması merkezi olarak proxy üzerinden yürütülsün; website yalnız gerekli piyasa verisine erişsin; ticaret altyapısı ile halka açık site arasında güvenlik izolasyonu sağlansın").
**Durum:** tasarım + kod hazırlığı. Üretimde hiçbir şey değişmedi. Proxy'ye dağıtım sahibin işidir ve 10 Aralık sonrası açık onay ister.

## 1. Bugünkü durum (25.11.2026 ölçümü)

**epias-proxy** (`https://epias-proxy.emirhantan-ku.workers.dev`), Cloudflare Worker. Kaynak kodu erişilebilir hiçbir depoda yok (website, voltan-os, seo-veri tarandı; website geçmişinde yalnız 27.07 tarihli, geri alınmış bir ek uç taslağı var).

| Uç | Yanıt | Önbellek başlığı | Not |
|---|---|---|---|
| `/health` | `{ok, service, time}` | — | |
| `/ptf/today` | 24 saatlik PTF, `updatedAt` | `public, max-age=300` | ardışık 3 istekte 2'si yeniden üretildi (`updatedAt` farklı, ~1,8 sn), 1'i önbellekten (0,2 sn) → önbellek kısmi; eşzamanlı yükte ziyaretçi başına EPİAŞ isteği oluşabilir |
| `/ptf/stats` | gün ve ay ortalaması | `public, max-age=1800` | ardışık 2 istekte ikisi de yeniden üretildi |
| `/ptf/range?from&to` | saatlik PTF aralığı | `public, max-age=1800` | |

CORS yalnız `https://voltage.com.tr`. SMF, sistem yönü ve dengesizlik fiyatı **yok**.

**Bilinen tüketiciler (değişmemeli):**

| Tüketici | Uç | Ne için | Etki alanı |
|---|---|---|---|
| website ana sayfa şeridi ve kart (tarayıcı) | `/ptf/today`, `/ptf/stats` | canlı PTF | kamuya açık |
| website `/canli-ptf` sunucu çizimi | `/ptf/today`, `/ptf/stats` | SEO sayfası | kamuya açık |
| Voltan OS `lib/piyasa.ts` `ptfOnerisi` | `/ptf/stats` | **teklif referans PTF'si** (ay başından ortalama) | ticari |
| Voltan OS `lib/piyasa.ts` `ptfAyi` | `/ptf/stats` | **bayi hakedişi** aylık PTF kaydı | finansal |
| Voltan OS `lib/tahmin-gop.ts` `ptfBugunSaatlik` | `/ptf/today` | **GÖP tahmini** profil katsayıları | ticaret |

Ticaret sistemleri (gip-bot, Voltan OS GÖP/EPYS/teminat istemcileri) kendi EPİAŞ hesaplarıyla CAS'a ayrıca bağlanır; proxy'nin hangi hesabı kullandığı sahipte (açık soru).

## 2. Hedef mimari

```
EPİAŞ CAS + Şeffaflık  ◄── yalnız proxy (kimlik burada; EPİAŞ'a istek sayısı ziyaretçiden bağımsız)
        ▲
        │ zamanlanmış tazeleme (bugün+dün 10 dk'da bir; geçmiş günler bir kez doldurulur, KV'de saklanır)
 epias-proxy ── mevcut uçlar AYNEN (/ptf/*, /health)
        │      yeni, ayrı modül: /piyasa/v1/* (yalnız okuma, sunucudan sunucuya, belirteçli)
        ▼
 website Pages Functions (/dengesizlik-maliyeti, /veri) ── EPİAŞ kimliği YOK, yalnız dar kapsamlı okuma belirteci
        ▼
 ziyaretçi ── kenar önbelleğinden; ziyaretçi EPİAŞ'a hiç istek doğurmaz
```

İlkeler:
1. **Website'ta EPİAŞ kimliği yok.** Website yalnız `PIYASA_VERI_ANAHTAR` taşır: yalnız `/piyasa/v1/*` okuma yetkisi verir; sızarsa bile EPİAŞ hesabına, ticaret sistemlerine ya da mevcut uçlara etkisi yoktur, proxy'nin önbelleğinden kamuya açık piyasa verisi okunur. Tercih edilen bağlantı: aynı Cloudflare hesabındaysa **servis bağlaması** (`PIYASA_VERI`); değilse HTTPS + belirteç.
2. **Mevcut tüketiciler etkilenmez.** Yeni modül ayrı dosyadır; mevcut koda yalnız iki kanca satırı eklenir (yönlendirici başı ve `scheduled`). `PIYASA_ETKIN` kapalıyken `/piyasa/*` 404 döner; mevcut uçların yanıtı bayt bayt aynı kalır (test edilir).
3. **Ziyaretçi başına EPİAŞ isteği yok.** EPİAŞ çağrısı yalnız (a) zamanlanmış tazelemede, (b) KV'de olmayan bir gün ilk istendiğinde, küresel bütçe içinde yapılır. Geçmiş 2026 günleri bir kez doldurulunca ziyaretçi trafiği EPİAŞ'a hiç ulaşmaz.
4. **Dürüstlük:** yayımlanmamış dönem `null` (asla 0, asla taşıma); çakışan yinelenen satır `null` + sayaç; bayat veri işaretli.
5. **Dağıtım üretimi değiştirmeden denenir:** `wrangler versions upload` → sürüm önizleme adresi; üretim trafiği eski sürümde kalır. Website önizlemesi (Preview ortamı) bu adrese bağlanır. Üretime alma 10 Aralık sonrası, açık onayla.

## 3. Sözleşme: `piyasa/v1`

```
GET /piyasa/v1/dengesizlik?tarih=YYYY-MM-DD
GET /piyasa/v1/dengesizlik?bas=YYYY-MM-DD&bit=YYYY-MM-DD      (bas ≤ bit, en çok 31 gün)
Kimlik: Authorization: Bearer <PIYASA_OKUMA_ANAHTARI>   (servis bağlamasında da aynı başlık)
CORS başlığı YOK; OPTIONS 405. Yanıt: Cache-Control: no-store; X-Robots-Tag: noindex.

200 {
  "surum": 1,
  "kaynak": "EPİAŞ Şeffaflık Platformu — PTF, SMF ve SDF Listeleme",
  "uretildi": "<ISO, yanıtın üretildiği an>",
  "gunler": [
    { "tarih": "2026-11-24",
      "cekildi": "<ISO, bu günün EPİAŞ'tan son alındığı an>",
      "bayat": false,                 // tazeleme penceresi aşıldı ve son deneme başarısızsa true
      "tam": true,                    // her dönemde iki dengesizlik fiyatı da yayımlanmışsa
      "donemler": [
        { "bas": "2026-11-24T00:00:00+03:00", "dk": 60,
          "ptf": 2492.08, "smf": 2500, "pozitif": 2417.32, "negatif": 2650,
          "yon": "acik" | "fazla" | "denge" | null, "yonHam": "Enerji Açığı" | null }
      ] } ] }
   // Değer yoksa null. Dönem sayısı veriden gelir (24 bugün; 96 olursa 96).
400 { "hata": { "kod": "parametre", "mesaj": "…" } }
401 { "hata": { "kod": "yetki" } }
404 (PIYASA_ETKIN kapalı)
503 { "hata": { "kod": "veri-yok" | "butce" | "gecici", "mesaj": "…" } } + Retry-After
```

Aralık isteğinde KV'de olmayan günler varsa: bütçe izin verirse tamamlanır, vermezse **503** (eksik dosya üretilmez).

## 4. Tazeleme ve yük politikası (proxy)

| Veri | Tazeleme | EPİAŞ isteği |
|---|---|---|
| Bugün + dün | zamanlanmış görev 10 dk'da bir (tek istek iki günü kapsar); istekte, `cekildi` 5 dk'dan eskiyse ve bütçe varsa | ~144/gün |
| 2–45 gün önce | günde bir kez (uzlaştırma ve düzeltme penceresi) | ~1–2/gün (aylık istekle) |
| 45 günden eski | ilk doldurmadan sonra haftada bir doğrulama | ihmal edilebilir |
| İlk doldurma (1.1.2026'dan bugüne) | gece görevinde ay ay | toplam ~11, bir kez |

Küresel bütçe: dakikada en çok 10 rapor isteği + 1 giriş (zamanlanmış görev için 4 ayrılmış). Giriş reddinde artan bekleme (5 dk → 30 dk → 2 sa; kimlik değişince hemen). Bilet bellekte ve KV'de şifreli. Hiçbir günlükte kimlik, bilet ya da yanıt gövdesi yok.

## 5. Website tarafı (önbellek)

Website `/piyasa/v1` yanıtını kenar önbelleğinde tutar (bugün/dün 2 dk, geçmiş 6 sa), anahtar başına tek uçuş, proxy'ye dakikalık bütçe; dürüstlük merdiveni (canlı → bayat "SON SENKRON" → bekleme) aynen.

## 6. Sahipten gerekenler

1. **Proxy kaynak kodu:** özel bir depo (`voltageenerji/epias-proxy`) açıp Cloudflare'deki güncel kodu oraya yüklemek (Workers & Pages → epias-proxy → Edit code → indir). Kodda kullanıcı adı/şifre yazılı olmamalı; yazılıysa önce Settings → Variables'a taşınmalı.
2. Proxy'nin kullandığı EPİAŞ hesabının ticaret hesaplarından ayrı, yalnız Şeffaflık için açılmış bir hesap olup olmadığı. Değilse ayrı bir Şeffaflık hesabı önerilir.
3. Dağıtım (önizleme sürümü): `wrangler versions upload` + sürüme özel `PIYASA_OKUMA_ANAHTARI` + KV ad alanı; website Preview ortamına `PIYASA_VERI_URL` ve `PIYASA_VERI_ANAHTAR`. Üretim sürümü ve üretim sırları değişmez.
