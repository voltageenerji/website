# piyasa/v1 modülü — epias-proxy için takılır modül

**Durum (25 Kasım 2026):** kod ve testler hazır; **üretimde hiçbir şey değişmedi.** Proxy'nin kendi kaynak kodu henüz elimizde değil. Bu klasör, kod gelince proxy'ye eklenecek bağımsız bir modüldür. Dağıtım sahibin işidir; üretime alma **10 Aralık sonrası ve sahibin açık onayıyla** yapılır.

Mimari karar ve sözleşme: [`../PIYASA-VERI-MIMARISI.md`](../PIYASA-VERI-MIMARISI.md) (§3 sözleşme, §4 yük politikası). EPİAŞ uç bilgisi: `docs/seo/DENGESIZLIK-KAYNAK-TEYIT.md`.

## Bu modül ne yapar

- EPİAŞ Şeffaflık "PTF, SMF ve SDF Listeleme" verisini **yalnız proxy'de** çeker (EPİAŞ kimliği yalnız proxy'de kalır) ve gün gün KV'de saklar.
- Website'a dar kapsamlı bir okuma ucu açar: `GET /piyasa/v1/dengesizlik` (Bearer belirteçli, CORS yok). Website'ın EPİAŞ kimliğine ihtiyacı kalmaz.
- Ziyaretçi trafiği EPİAŞ'a istek doğurmaz: önce KV okunur. EPİAŞ'a yalnız zamanlanmış görev (10 dk'da bir, bugün+dün tek istek; gece bakımı) ve KV'de hiç olmayan bir gün ilk istendiğinde (dakikalık bütçe içinde) gidilir.
- Mevcut uçlara (`/health`, `/ptf/today`, `/ptf/stats`, `/ptf/range`) dokunmaz: modül `/piyasa` ve `/piyasa/*` dışındaki her istekte hiçbir şey yapmadan `null` döner. Bu davranış testle kanıtlandı: durum kodu, başlıklar ve gövde bayt bayt aynı (aşağıda "Kanıt").

## Dosyalar

| Dosya | Ne |
|---|---|
| `piyasa.js` | Modülün kendisi (ES modül, bağımlılık yok). Proxy'ye kopyalanacak **tek** dosya. |
| `ornek-host.js` | Mevcut proxy'yi taklit eden asgari Worker. **Gerçek proxy kodu değildir.** Kanca satırlarının mevcut uçları değiştirmediğini kanıtlamak için var. |
| `test.mjs`, `test-verisi.mjs` | Çevrimdışı testler (ağ yok; EPİAŞ, KV ve Cache API taklit). `node docs/epias-proxy/piyasa-modulu/test.mjs` |
| `olcum/cpu.mjs` | CPU tahmini (node). |
| `olcum/workerd-olc.mjs`, `olcum/kancali.js`, `olcum/yalin.js` | Yerel workerd ölçümü (`wrangler dev`, yerel KV, `--test-scheduled`, sahte EPİAŞ). Çıktı depo dışına yazılır. |

Website deposundaki `functions/_lib/epias.js` ve `functions/_lib/dengesizlik.js` dosyalarının EPİAŞ'a bakan bölümleri `piyasa.js`'e **kopyalandı**: tek-uçuş giriş, büyüyen giriş engeli, kimlik parmak izi, AES-GCM bilet, dakikalık bütçe, anahtar bazında bekleme, sayfalı çekimde kaldığı yerden sürme, alan tespiti, yinelenen satır ve çakışma, null anlamı, `yonCoz`. Website o kodu silebilir; modül tek başına çalışır.

## Kanca satırları

Mevcut proxy koduna eklenecek satırlar şunlar: bir `import` ve iki kanca satırı.

```js
import { piyasaIstegi, piyasaZamanli } from './piyasa.js';

export default {
  async fetch(request, env, ctx) {
    const piyasaYaniti = await piyasaIstegi(request, env, ctx); if (piyasaYaniti) return piyasaYaniti; // KANCA 1
    // … mevcut yönlendirici AYNEN …
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(piyasaZamanli(controller, env, ctx)); // KANCA 2
    // … mevcut zamanlanmış görev (varsa) AYNEN …
  },
};
```

**Yerleşim kuralları:**

1. **KANCA 1 en dışta ve en başta olmalı.** Gelen her istek önce bu satırdan geçmeli: önbellek araması (`caches.default.match`), CORS sarmalayıcısı ya da kimlik ara katmanı bundan sonra gelmeli. Aksi durumda iki risk var: belirteçli bir yanıt önbellekten belirteçsiz birine sunulabilir, ya da yanıta CORS başlığı eklenebilir. Proxy bir yönlendirici kütüphanesi kullanıyorsa (Hono, itty-router vb.) satır yine `export default { fetch }` gövdesinin ilk satırıdır.
2. Proxy'de `scheduled` işleyicisi **yoksa** yukarıdaki üç satırlık `scheduled` bloğu eklenir. **Varsa** yalnız KANCA 2 satırı en başa eklenir. Proxy'nin başka cron ifadeleri de varsa `PIYASA_CRON` değişkenine bizim ifademiz yazılır (aşağıda). Böylece modül yalnız kendi turunda çalışır.
3. Modül hiçbir zaman fırlatmaz. `/piyasa` dışındaki isteklerde `env`'e, istek gövdesine, KV'ye ya da ağa dokunmaz.

**Proxy'nin kendi EPİAŞ girişini kullanmak (isteğe bağlı):** proxy'de zaten kimlikli bir POST yardımcısı varsa, aynı girişi paylaşmak için iki kancaya dördüncü argüman verilir:

```js
const piyasaSecenek = { epiasPost: (url, govde) => mevcutEpiasPost(url, govde) }; // → Promise<Response>
// KANCA 1: await piyasaIstegi(request, env, ctx, piyasaSecenek)
// KANCA 2: piyasaZamanli(controller, env, ctx, piyasaSecenek)
```

`govde` bir nesnedir (`{startDate, endDate, page?}`). Yardımcı `status` ve `json()` taşıyan bir `Response` döndürmelidir. Bu durumda modül CAS girişi yapmaz ve bilet saklamaz. 401/403 gelirse modül büyüyen bekleme uygular (5 dk → 30 dk → 2 sa).

Proxy'nin EPİAŞ kimliği başka adlı değişkenlerdeyse yardımcı vermek yerine adlar söylenebilir: `{ kullaniciDegiskeni: 'EPIAS_USER', parolaDegiskeni: 'EPIAS_PASS' }`. Varsayılan adlar `EPIAS_USERNAME` / `EPIAS_PASSWORD`'dür.

## `wrangler.toml` ekleri

```toml
[[kv_namespaces]]
binding = "PIYASA_KV"
id = "<wrangler kv namespace create piyasa-veri çıktısındaki id>"

[triggers]
crons = ["*/10 * * * *"]          # proxy'nin mevcut cron'ları varsa listeye EKLENİR

[vars]
PIYASA_ETKIN = "1"                # tam olarak "1" değilse /piyasa/* 404 döner ve zamanlanmış tur hiçbir şey yapmaz
# PIYASA_CRON = "*/10 * * * *"    # yalnız proxy'nin başka cron'ları varsa: modül yalnız bu ifadeyle çalışır
# PIYASA_DILIM_GUN = "31"         # yalnız ücretli planda: ay başına tek EPİAŞ isteği (varsayılan 8 gün)
# PIYASA_GECE = "2-6"             # gece bakım penceresi, İstanbul saati [başlangıç-bitiş) (varsayılan 2-6)
```

KV ad alanı oluşturma: `wrangler kv namespace create piyasa-veri`. Bu komut dağıtım yapmaz, yalnız boş bir ad alanı açar.

## Sırlar (dağıtım yapmayan komutla)

```sh
openssl rand -hex 32                                 # 64 karakterlik belirteç üretir (en az 32 karakter zorunlu)
wrangler versions secret put PIYASA_OKUMA_ANAHTARI   # değer istemde girilir; YENİ SÜRÜM oluşturur, DAĞITMAZ
# döndürme sırasında ikinci yuva:
wrangler versions secret put PIYASA_OKUMA_ANAHTARI_2
```

- **`wrangler secret put` KULLANILMAZ.** O komut yeni sürümü hemen üretime dağıtır.
- EPİAŞ kimliği proxy'de zaten tanımlı (adları açık soru, aşağıda). Yeni bir EPİAŞ sırrı gerekmez.
- Belirteç değeri sohbete, depoya, log'a ya da ekran görüntüsüne girmez. Website tarafına `PIYASA_VERI_ANAHTAR` olarak yalnız Cloudflare'in şifreli alanından girilir.
- **Döndürme:** (1) yeni değeri `_2` yuvasına koy → (2) website'ı yeni değere geçir → (3) yeni değeri 1. yuvaya koy → (4) `_2`'yi sil. Her iki yuva da her istekte sabit sürede karşılaştırılır. 32 karakterden kısa değerler yapılandırılmamış sayılır ve her istek 401 alır.

## Güvenli yayın sırası

1. **Yükleme (dağıtım yok):** kanca satırları ve `piyasa.js` proxy koduna eklenir, `wrangler.toml` güncellenir.
   ```sh
   wrangler versions upload --message "piyasa/v1 modülü"
   wrangler versions secret put PIYASA_OKUMA_ANAHTARI     # ayrı bir sürüm daha oluşur; bundan sonra BU sürüm kullanılır
   wrangler versions list                                 # son sürümün kimliği ve önizleme adresi
   ```
   Üretim trafiği eski sürümde kalır. Önizleme adresinin çıkması için Worker'da workers.dev ve önizleme adresleri (Preview URLs) açık olmalıdır.
2. **Önizleme adresinde kabul:** aşağıdaki denetim listesi önce üretim adresine, sonra önizleme adresine uygulanır. Mevcut uçlarda çıktılar aynı olmalıdır.
   - Önizleme sürümünde **cron çalışmaz** (zamanlanmış tetikler yalnız dağıtılmış sürümde çalışır; Cloudflare belgesine göre, burada doğrulanmadı). Önizlemede bugün/dün ilk istekte ve 15 dakikadan eski olduğunda istek yolunda tazelenir; geçmiş günler istendikçe dilim dilim dolar. Bunlar dakikalık bütçe içinde kalır.
3. **Website Preview ortamı** (Webmaster'ın işi): `PIYASA_VERI_URL` = önizleme adresi, `PIYASA_VERI_ANAHTAR` = belirteç. `/dengesizlik-maliyeti` önizlemede uçtan uca denenir. QA kararı ve gerekirse Hukuk & Uyum kararı alınır.
4. **Üretime alma: yalnız 10 Aralık sonrası ve sahibin açık onayıyla, kademeli.**
   ```sh
   wrangler versions deploy <YENI_SURUM>@10% <ESKI_SURUM>@90%   # mevcut uçlar denetim listesiyle yeniden denenir
   wrangler versions deploy <YENI_SURUM>@100%
   ```
   Kademeli dağıtım sırasında zamanlanmış tetiklerin hangi sürümde çalıştığı Cloudflare belgesinden ayrıca teyit edilmeli (doğrulanmadı). Cron'un etkin olduğu `%100` sonrası `/piyasa/v1/durum` ile görülür (`zamanli.son` her 10 dakikada ilerler).
5. **Geri alma** (her an, tek komut; KV verisi kalır, zararsızdır):
   ```sh
   wrangler rollback <ESKI_SURUM>        # ya da: wrangler versions deploy <ESKI_SURUM>@100%
   ```

### Mevcut uçlar denetim listesi (önce/sonra)

Gövde ekrana ya da log'a yazılmaz. Yalnız durum kodu, iki başlık ve alan adları karşılaştırılır.

```sh
BASE="https://<üretim ya da önizleme adresi>"
for u in /health /ptf/today /ptf/stats "/ptf/range?from=2026-11-01&to=2026-11-02" /olmayan-uc; do
  curl -s -o /tmp/govde.json -H "Origin: https://voltage.com.tr" \
    -w "$u %{http_code} cc=%header{cache-control} acao=%header{access-control-allow-origin}\n" "$BASE$u"
  jq -c '{alanlar: (keys? // null), kalem: ((.items|length)? // null)}' /tmp/govde.json 2>/dev/null || echo "  (JSON değil)"
done
rm -f /tmp/govde.json
curl -s -o /dev/null -w "OPTIONS %{http_code} acao=%header{access-control-allow-origin}\n" -X OPTIONS -H "Origin: https://voltage.com.tr" "$BASE/ptf/today"
# yeni uç (yalnız önizleme / yeni sürüm): belirteçsiz 401, belirteçli 200
curl -s -o /dev/null -w "piyasa belirteçsiz %{http_code}\n" "$BASE/piyasa/v1/dengesizlik?tarih=2026-11-24"
curl -s -o /dev/null -w "piyasa belirteçli %{http_code}\n" -H "Authorization: Bearer $PIYASA_OKUMA_ANAHTARI" "$BASE/piyasa/v1/dengesizlik?tarih=2026-11-24"
curl -s -H "Authorization: Bearer $PIYASA_OKUMA_ANAHTARI" "$BASE/piyasa/v1/durum" | jq -c '{kv, zamanli, girisEngeli}'
```

`$PIYASA_OKUMA_ANAHTARI` kabukta yalnız o oturum için tutulur (`read -s PIYASA_OKUMA_ANAHTARI`). Kabuk geçmişine yazılmaz. Mevcut uçlarda üretim ve önizleme satırları birebir aynı olmalıdır. `/ptf/today` ve `/health` içindeki zaman alanları her istekte değişir; bu yüzden gövde özeti değil, alan adları karşılaştırılır.

## Sözleşme (özet; bağlayıcı metin mimari belge §3)

- `GET /piyasa/v1/dengesizlik?tarih=YYYY-MM-DD` ya da `?bas=…&bit=…` (en çok 31 gün, 2026-01-01 … bugün İstanbul). Başka parametre, yinelenen parametre ya da karışık kullanım 400 alır.
- `Authorization: Bearer <belirteç>`. Yanlış ya da eksik belirteç `401 {"hata":{"kod":"yetki"}}` alır (`WWW-Authenticate: Bearer`).
- GET dışındaki her yöntem 405 alır (`Allow: GET`; OPTIONS dahil). CORS başlığı yok. Her yanıtta `Cache-Control: no-store`, `X-Robots-Tag: noindex`, `X-Content-Type-Options: nosniff`.
- 200: `{surum, kaynak, uretildi, gunler:[{tarih, cekildi, bayat, tam, donemler:[{bas, dk, ptf, smf, pozitif, negatif, yon, yonHam}]}]}`. Değeri olmayan alan `null` olur, asla 0 olmaz ve önceki değer taşınmaz. Dönem sayısı veriden gelir (24 ya da 96).
- 503 `veri-yok | butce | gecici` + `Retry-After`. İstenen günlerden biri eksikse yanıt 503 olur; yarım dosya üretilmez.
- `GET /piyasa/v1/durum` (belirteçli): yalnız sayaç ve kod döner (KV'deki gün sayısı, eksik gün sayısı, son zamanlanmış tur, son EPİAŞ durum kodu, bütçe kullanımı, giriş engeli neden kodu). Değer döndürmez.
- `PIYASA_ETKIN` tam olarak `"1"` değilse `/piyasa` ve `/piyasa/*` her yöntemde 404 alır. Modül hiçbir G/Ç yapmaz, zamanlanmış tur boş döner.

## Yük, istek hacmi ve sınırlar

**Plan varsayımı: Workers Free.** Çağrı başına 50 alt istek ve 10 ms CPU; KV günde 1.000 yazma ve 100.000 okuma. Plan açık sorudur. Ücretli planda yalnız `PIYASA_DILIM_GUN="31"` değiştirilir.

| Konu | Önlem | Ölçüm |
|---|---|---|
| 50 alt istek/çağrı | Modül her çağrıda fetch + KV + Cache API işlemlerini **toplam** sayar. Tavan 45, son durum yazımına 1 birim ayrılır. Sığmayan gün yazılmaz, sonraki tura kalır. KV ve Cache API işlemlerinin bu sınıra sayıldığı en kötü durum olarak varsayıldı. | node benzetimi: tur başına en çok 44–45 (31 günlük dilim), 23–27 (8 günlük dilim) |
| 10 ms CPU/çağrı | Doldurma ve denetim **ay içi sabit dilimlerle** yapılır: varsayılan 8 gün (ay 4 parça, her parça en çok 8 gün). Her turda en çok bir bakım dilimi işlenir. İstek yolu bir çağrıda en çok 2 eksik dilim tamamlar. | node (`olcum/cpu.mjs`, Workers ölçümü değil): 8 günlük dilimli gece turu medyan ~2,2 ms, p90 ~6,4 ms. 31 günlük ay medyan ~8–9 ms, p90 ~15–17 ms, yani ücretsiz planı aşar. Gündüz turu ~1 ms. 31 günlük aralık isteği KV'den ~1,5 ms. |
| EPİAŞ bütçesi | Dakikada 10 rapor (4'ü zamanlanmış göreve ayrılmış; istek yolu en çok 6) ve 1 giriş. Giriş tek-uçuştur. Reddedilen girişte 5 dk → 30 dk → 2 sa bekleme vardır; kimlik değişince engel hemen kalkar. Anahtar bazında 60 sn → 5 dk → 30 dk bekleme uygulanır. | 100 eşzamanlı soğuk istek: 6 rapor + 1 giriş |
| KV yazma (1.000/gün) | Gün kaydı yalnız içerik özeti değişince yazılır. Son kontrol zamanı tek `durum` kaydına, turda bir kez yazılır. Geçici giriş engeli KV'ye yazılmaz. | node 24 saat benzetimi (aşağıda) |

**Beklenen EPİAŞ istekleri (kararlı gün):** zamanlanmış görev 144 (bugün+dün tek istek) ve gece uzlaştırma denetimi ~6 (8 günlük dilimle [bugün−45, bugün−2] penceresi) ile **~150 rapor**. Buna ~15 giriş eklenir (bilet 100 dakikada yenilenir). Haftalık doğrulama 45 günden eski ~38 dilimi bir iki gecede yeniden çeker. İlk doldurma 2026'nın ~44 dilimidir ve ilk iki gecede bir kez yapılır. Ziyaretçi trafiği bu sayıyı artırmaz. Ölçülen: node benzetiminde kararlı gün 150–151 rapor, 15 giriş.

**KV kullanımı (node 24 saat benzetimi, yayım gecikmesi 4 saat varsayımı):** kararlı gün **~187 yazma**. Bunun 144'ü durum, ~20'si bugün, ~5'i dün, ~15'i bilet, kalanı gece değişikliğidir. İlk gün ~365, ikinci gün ~328 yazma (ilk doldurma). Okuma, dakikada 1 ziyaretçi isteği ve isteklerin yarısı soğuk süreçte gelirse ~3.300/gün. Website'ın kenar önbelleği (bugün/dün 2 dk, geçmiş 6 sa) proxy'ye gelen isteği bunun da altına indirir. En kötü durum (her turda bugün ve dün değişirse) ~144 + 288 + 15 ≈ 450 yazma/gün eder; yine 1.000'in altındadır.

**Bayat penceresi:** bugün/dün 15 dk, 2–45 gün önce 26 sa, daha eski 8 gün. `cekildi` bu süreyi aşmışsa `bayat: true` olur.

## Kanıt: mevcut uçlar değişmiyor

- `test.mjs` bölüm 15: `ornek-host.js` üç biçimde karşılaştırılır: kancasız, kancalı + `PIYASA_ETKIN` yok/`"0"`, kancalı + açık (KV, belirteç, kimlik). 15 istek denendi (`/health`, `/ptf/today` farklı Origin'lerle, `/ptf/stats`, `/ptf/range` geçerli/geçersiz, bilinmeyen yol, `/piyasax`, OPTIONS, POST, HEAD, Authorization başlıklı). Üç biçimde de durum, tüm başlıklar ve gövde baytları aynı çıktı. Bu sırada EPİAŞ'a ve KV'ye hiç gidilmedi.
- `olcum/workerd-olc.mjs`: aynı karşılaştırma yerel workerd'de (`wrangler dev`) üç ayrı Worker üzerinde yapıldı. `date` dışındaki başlıklar ve gövde özetleri karşılaştırıldı. Sonuçlar aşağıda.

## Açık sorular (sahipte)

1. Proxy hangi EPİAŞ hesabını kullanıyor? Ticaret hesaplarından ayrı, yalnız Şeffaflık için açılmış bir hesap mı? Kimlik hangi env adlarında duruyor?
2. Proxy'de `scheduled` işleyicisi ya da tanımlı cron var mı? Varsa ifadeleri neler? (`PIYASA_CRON` buna göre ayarlanır.)
3. Cloudflare planı Free mi, Paid mi? (Dilim uzunluğu ve sınır varsayımları buna bağlı.) Website ile proxy aynı hesapta mı? Aynı hesaptaysa servis bağlaması kullanılabilir.
4. Proxy'nin yönlendiricisinin önünde önbellek ya da CORS sarmalayıcısı var mı? (KANCA 1 bunların önüne konmalı.)
5. Gerçek EPİAŞ yanıt zarfı, sayfalama varsayılanı, istek başına aralık sınırı ve 15 dakikalık günlerde `endDate` yorumu doğrulanmadı. Bunlar kimlikle tek bir denemeyle görülür. Denemenin çıktısı yalnız alan adı ve sayı olmalıdır, gövde yazılmaz.
6. Cache API'nin `*.workers.dev` alt alanında etkisiz olduğu Cloudflare belgesinde geçiyor; burada doğrulanmadı. Etkisizse bütçe sayacı ve geçici engel süreç başına kalır. Kalıcı giriş engeli ve bilet KV'de tutulduğu için güvenlik buna bağlı değildir.
7. KV toplu okumanın (`get([anahtarlar])`) alt istek sayımına tek işlem olarak girdiği varsayıldı. Toplu okuma yoksa modül tek tek okur; 31 gün + durum = 32 işlem, tavanın altında kalır.

## Mimari belgeden sapmalar (bilinçli, gerekçeli)

1. **İstek yolunda bugün/dün tazelemesi 5 dk değil 15 dk.** Belge §4'te "istekte `cekildi` 5 dk'dan eskiyse" deniyor. Cron 10 dakikada bir çalıştığı için bu kural sağlıklı cron'da bile her 10 dakikanın yarısında ziyaretçi kaynaklı EPİAŞ isteği doğurur: ~288 istek/gün olur ve belgenin kendi ~144 tahminiyle çelişir. Görev yönergesi de "ziyaretçi EPİAŞ çağrısı doğurmaz" diyor. Seçim: istek yolu yalnız kayıt 15 dakikadan eskiyse (cron en az bir tur kaçırdıysa) tazeler. Sağlıklı cron'da ziyaretçi kaynaklı çağrı sıfırdır (2 saatlik testte ölçüldü). Sabit `ISTEK_TAZELEME_MS`.
2. **`bayat` tanımı:** belgede "pencere aşıldı **ve** son deneme başarısız" yazıyor. Burada pencere aşıldıysa, hiç deneme yapılmamış olsa da (ör. cron çalışmıyor) `bayat: true` döner. Bu daha dürüst bir okumadır.
3. **"Ay ay" yerine "ay içinde dilim dilim".** 31 günlük bir ayın tek çağrıda normalleştirilmesi node ölçümünde p90 ~15–17 ms tuttu; ücretsiz planın 10 ms CPU sınırını aşar. CPU sınırında kesilen bir tur durum kaydını yazamaz ve gece bakımı her gece yeniden başarısız olur. Bu yüzden varsayılan 8 günlük dilim seçildi. Sonuç: ilk doldurma ~11 değil ~44 istek, 2 gece; uzlaştırma denetimi ~1–2 değil ~6 istek/gün. Ücretli planda `PIYASA_DILIM_GUN="31"` belgedeki ay ay davranışını aynen verir: ilk doldurma 11 istek, tek gece.
4. **Uzlaştırma penceresi ay dilimiyle bile 2–3 istek/gün tutar** (44 günlük pencere 2–3 takvim ayına yayılır). Belgedeki "~1–2" tahmini düşük.
5. **Bütçe (dakikada 1 giriş) ile 401 sonrası bilet yenileme aynı dakikaya sığmaz.** Yeni girişle alınmış biletle 401 alınırsa yenileme denenmez, hemen büyüyen `servis-yetki` engeli uygulanır. Önbellekteki eski biletle 401 alınırsa yenileme bir sonraki dakikaya kalır (503 `butce`). Reddedilen bilet bir daha kullanılmaz. (Bu düzeltme bir test hatasıyla bulundu.)
6. **"Bilet bellekte ve KV'de şifreli"** uygulandı. Bilet ek olarak Cache API'de de şifreli tutulur.
7. **Kanca 2 değil 3 satır:** iki kanca satırına bir `import` satırı eklenir. Proxy'de `scheduled` yoksa üç satırlık blok gerekir.
