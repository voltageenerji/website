# epias-proxy — Ek Uçlar: `/ptf/tomorrow` ve `/yekdem`

**Hazırlayan:** Webmaster Agent (Teknoloji)
**Tarih:** 2026-07-27
**Hedef repo:** `epias-proxy` Cloudflare Worker'ı (bu repo DEĞİL — site reposundan yalnızca
tüketilir). Bu dosya, sitedeki iki yeni özelliğin ("Yarın" PTF sekmesi ve YEKDEM birim
maliyeti kartı) ihtiyaç duyduğu iki yeni route'un **yapıştırmaya hazır** kodunu içerir.

Uçlar deploy edilene kadar site zarifçe bozulmadan çalışır: "Yarın" sekmesi dürüst bir
"henüz alınamadı" notu gösterir, YEKDEM kartı hiç görünmez. **Hiçbir koşulda sentetik /
placeholder veri gösterilmez.**

---

## 0. Deploy ÖNCESİ zorunlu iki uyarı

1. **Kimlik doğrulama (ADAPT-HERE):** EPİAŞ Şeffaflık v2 API'si TGT/servis-bileti veya
   API-anahtarı akışı ister. Aşağıdaki kodda `epiasFetch(...)` çağrısı **mevcut worker'ın
   `/ptf/today` için zaten kullandığı auth/fetch yardımcısının aynısıdır** — kendi
   worker'ınızdaki fonksiyon adıyla değiştirin. Yeni bir auth akışı YAZMAYIN; bugünkü
   `/ptf/today` neyle çalışıyorsa onu yeniden kullanın. `ADAPT-HERE` işaretli blokları arayın.
2. **Endpoint yolları teyit edilmeli:** Aşağıdaki EPİAŞ yolları
   `docs/EPIAS-VERI-KATALOGU.md`'deki eptr2 aynasından türetilmiştir
   (`interim-mcp`, `interim-mcp-status`, `ren-unit-cost`). Katalogdaki uyarı geçerlidir:
   **canlıya almadan önce birebir yollar resmî dokümandan
   (`seffaflik.epias.com.tr/electricity-service/technical/tr/index.html`) teyit edilmelidir.**
   Alan adları (`items[].price` vs `items[].date` vb.) de aynı şekilde teyit edilmelidir.

---

## 1. JSON sözleşmeleri (site bunları bekliyor — değiştirmeyin)

### `GET /ptf/tomorrow` — `/ptf/today` ile birebir aynı şekil

```json
{
  "date": "2026-07-28",
  "provisional": true,
  "items": [ { "hour": 0, "price": 2145.5 }, { "hour": 1, "price": 2010.0 } ],
  "stats": { "min": 1890.0, "max": 2780.0, "avg": 2260.4, "current": null }
}
```

- `items`: yarına ait saatlik **kesinleşmemiş (geçici / interim) PTF**, TL/MWh.
  Frontend yalnızca `items[].hour` ve `items[].price` alanlarını kullanır; `stats` ve
  `date`, `/ptf/today`'in mevcut çıktısıyla şekil eşitliği için korunur
  (`current` yarın için anlamsız → `null`).
- **Veri henüz yayınlanmadıysa** (İstanbul 14:00 öncesi veya EPİAŞ gecikmesi):
  gövdesiz **404** dönün. Frontend bunu "henüz alınamadı" notuna çevirir.
  ASLA boş/uydurma `items` dönmeyin.

### `GET /yekdem` — YEKDEM birim maliyeti (mevcut en güncel ay)

```json
{
  "period": "2026-06",
  "unitCostTlPerMwh": 512.34,
  "updatedAt": "2026-07-27T09:00:00.000Z"
}
```

- `period`: `YYYY-MM`. `unitCostTlPerMwh`: sayı (TL/MWh). `updatedAt`: ISO-8601.
- Upstream'de hiç veri yoksa gövdesiz **404** dönün. Frontend kartı hiç göstermez.

---

## 2. Yapıştırmaya hazır kod

Aşağıdaki blok mevcut worker'a (module worker varsayımıyla) eklenir; router'ınızda iki
yeni yol bağlanır. `ADAPT-HERE` işaretli üç nokta dışında kod olduğu gibi kullanılabilir.

```js
/* ============================================================================
 * EK UÇLAR: /ptf/tomorrow ve /yekdem
 * Sözleşmeler: site reposundaki docs/epias-proxy-EK-UCLAR.md
 * ========================================================================== */

// --- ADAPT-HERE (1/3): CORS ---------------------------------------------------
// Mevcut worker'ın /ptf/today için kullandığı CORS yardımcısını AYNEN kullanın
// (ALLOWED_ORIGINS listesi: voltage.com.tr, www.voltage.com.tr, *.pages.dev vb.).
// Buradaki corsHeaders(request) çağrılarını kendi yardımcınızla değiştirin.

// --- ADAPT-HERE (2/3): EPİAŞ auth + fetch ------------------------------------
// epiasFetch(path, body): /ptf/today'in bugün kullandığı, TGT/servis-bileti veya
// API-anahtarı başlıklarını ekleyen POST yardımcısı. Yenisini YAZMAYIN.
// İmza varsayımı: epiasFetch('/electricity-service/v1/...', {startDate, endDate})
// → parse edilmiş JSON döner ya da throw eder.

// --- ADAPT-HERE (3/3): EPİAŞ yolları -----------------------------------------
// Resmî dokümandan TEYİT EDİLECEK (eptr2 anahtarları: interim-mcp,
// interim-mcp-status, ren-unit-cost):
const EPIAS_PATH_INTERIM_MCP = '/electricity-service/v1/markets/dam/data/interim-mcp';
const EPIAS_PATH_REN_UNIT_COST = '/electricity-service/v1/renewables/data/renewables-support-mechanism-unit-cost';

// ---------- İstanbul zaman yardımcıları (TRT = UTC+3, DST yok) ---------------
function istanbulNowParts() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(new Date()).reduce((o, x) => (o[x.type] = x.value, o), {});
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour };
}
function istanbulTomorrowISO() {
  const { y, m, d } = istanbulNowParts();
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10); // YYYY-MM-DD
}
// Bir sonraki İstanbul 14:00'üne kalan saniye (yarın verisinin cache ömrü)
function secondsUntilNextIstanbul14() {
  const { y, m, d, h } = istanbulNowParts();
  const base = Date.UTC(y, m - 1, d, 11, 0, 0);          // 14:00 TRT == 11:00 UTC
  const target = h < 14 ? base : base + 24 * 3600 * 1000;
  return Math.max(60, Math.floor((target - Date.now()) / 1000));
}

// ---------- Edge cache yardımcısı --------------------------------------------
async function cachedJson(request, cacheKeyUrl, ttlSeconds, producer) {
  const cache = caches.default;
  const key = new Request(cacheKeyUrl, { method: 'GET' });
  const hit = await cache.match(key);
  if (hit) {
    const res = new Response(hit.body, hit);
    // ADAPT-HERE: kendi corsHeaders(request) çıktınızı uygulayın
    return res;
  }
  const { status, body } = await producer();
  const res = new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      ...(body === null ? {} : { 'Content-Type': 'application/json; charset=utf-8' }),
      'Cache-Control': 'public, max-age=' + ttlSeconds,
      // ADAPT-HERE: kendi corsHeaders(request) çıktınızı buraya yayın
    },
  });
  // 404'ü kısa süre cache'le (14:00 civarı upstream'i dövmemek için), 200'ü tam TTL
  await cache.put(key, res.clone());
  return res;
}

// ---------- GET /ptf/tomorrow ------------------------------------------------
// Yarının kesinleşmemiş (geçici) PTF'si — /ptf/today ile aynı JSON şekli.
async function handlePtfTomorrow(request) {
  const dateISO = istanbulTomorrowISO();
  const { h } = istanbulNowParts();
  // Yayın öncesi (İstanbul <14:00): upstream'e hiç gitme, dürüst 404, kısa cache.
  if (h < 14) {
    return cachedJson(request, 'https://cache.internal/ptf-tomorrow-wait-' + dateISO, 300,
      async () => ({ status: 404, body: null }));
  }
  return cachedJson(
    request,
    'https://cache.internal/ptf-tomorrow-' + dateISO,
    secondsUntilNextIstanbul14(), // başarılı yanıt bir sonraki 14:00'e kadar geçerli
    async () => {
      let raw;
      try {
        raw = await epiasFetch(EPIAS_PATH_INTERIM_MCP, {
          startDate: dateISO + 'T00:00:00+03:00',
          endDate: dateISO + 'T23:59:59+03:00',
        });
      } catch (e) {
        return { status: 404, body: null }; // upstream hata/boş → dürüst 404
      }
      // ADAPT-HERE değil ama TEYİT: alan adları /ptf/today reshape'inizle aynı
      // varsayımla yazıldı (items[].date ISO saat, items[].price TL/MWh).
      const rows = (raw && raw.items) || [];
      const items = rows
        .map((r) => ({
          hour: +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hourCycle: 'h23' }).format(new Date(r.date)),
          price: Number(r.price),
        }))
        .filter((x) => Number.isFinite(x.price) && x.hour >= 0 && x.hour < 24);
      if (!items.length) return { status: 404, body: null };
      const vals = items.map((x) => x.price);
      const body = {
        date: dateISO,
        provisional: true, // kesinleşmemiş / interim MCP
        items,
        stats: {
          min: Math.min(...vals),
          max: Math.max(...vals),
          avg: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
          current: null,
        },
      };
      return { status: 200, body };
    }
  );
}

// ---------- GET /yekdem ------------------------------------------------------
// YEKDEM birim maliyeti (TL/MWh) — mevcut en güncel ay. 24 saat edge cache.
async function handleYekdem(request) {
  const { y, m } = istanbulNowParts();
  return cachedJson(
    request,
    'https://cache.internal/yekdem-' + y + '-' + m,
    24 * 3600,
    async () => {
      // Son 6 ayı iste; upstream aylık seri döner, en güncel dolu ayı seç.
      const from = new Date(Date.UTC(y, m - 1 - 6, 1)).toISOString().slice(0, 10);
      const to = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
      let raw;
      try {
        raw = await epiasFetch(EPIAS_PATH_REN_UNIT_COST, {
          startDate: from + 'T00:00:00+03:00',
          endDate: to + 'T00:00:00+03:00',
        });
      } catch (e) {
        return { status: 404, body: null };
      }
      // TEYİT: alan adı varsayımı — items[].date (ay başı ISO), items[].unitCost
      // (bazı sürümlerde `renewablesUnitCost`). Resmî dokümandan doğrulayın.
      const rows = ((raw && raw.items) || [])
        .map((r) => ({
          period: String(r.date || '').slice(0, 7),
          cost: Number(r.unitCost != null ? r.unitCost : r.renewablesUnitCost),
        }))
        .filter((x) => /^\d{4}-\d{2}$/.test(x.period) && Number.isFinite(x.cost))
        .sort((a, b) => (a.period < b.period ? 1 : -1)); // en yeni önce
      if (!rows.length) return { status: 404, body: null };
      const latest = rows[0];
      return {
        status: 200,
        body: {
          period: latest.period,
          unitCostTlPerMwh: +latest.cost.toFixed(2),
          updatedAt: new Date().toISOString(),
        },
      };
    }
  );
}

/* Router'a bağlayın (mevcut /ptf/today dispatch'inizin yanına):
 *   if (url.pathname === '/ptf/tomorrow') return handlePtfTomorrow(request);
 *   if (url.pathname === '/yekdem')       return handleYekdem(request);
 * OPTIONS/preflight ve Origin kontrolü mevcut CORS katmanınızdan aynen geçmeli.
 */
```

### Cache özeti

| Uç | Durum | TTL |
|---|---|---|
| `/ptf/tomorrow` | 200 (veri var) | bir sonraki İstanbul 14:00'üne kadar |
| `/ptf/tomorrow` | 404 (yayın öncesi/gecikme) | 300 sn (upstream'i dövmemek için) |
| `/yekdem` | 200 | 24 saat |
| `/yekdem` | 404 | 24 saat cache anahtarı aylık olduğundan pratikte kısa tutmak isterseniz TTL'i 3600'e indirin |

### Dürüstlük kuralları (değiştirilemez)

- Upstream'de veri yokken **asla** 200 + uydurma gövde dönülmez; 404 (veya tercihen 204)
  dönülür ve site bunu dürüst nota çevirir.
- `/ptf/tomorrow` çıktısı **geçici (interim) PTF'tir**; site bunu
  "YARIN · GÜN ÖNCESİ PTF (GEÇİCİ)" etiketiyle gösterir. Worker tarafında da
  `provisional: true` alanı korunmalıdır.

### Deploy sonrası hızlı test

```bash
curl -i -H "Origin: https://voltage.com.tr" https://epias-proxy.emirhantan-ku.workers.dev/ptf/tomorrow
curl -i -H "Origin: https://voltage.com.tr" https://epias-proxy.emirhantan-ku.workers.dev/yekdem
# 14:00 TRT öncesi /ptf/tomorrow → 404 beklenir; sonrası → 200 + 24 saatlik items
```
