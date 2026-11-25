// !!! UYDURMA TEST VERİSİ — gerçek piyasa değeri DEĞİLDİR.
// Yalnızca docs/qa/test-dengesizlik*.mjs testleri içe aktarır; sayfada, veri
// ucunda ya da herhangi bir yayında KULLANILMAZ. (/docs/* dışarıya servis edilmez.)
//
// Sahte proxy, epias-proxy'nin `GET /piyasa/v1/dengesizlik` sözleşmesini
// (docs/epias-proxy/PIYASA-VERI-MIMARISI.md §3) taklit eder. Ağ yok.

const YON_HAM = { acik: 'Enerji Açığı', fazla: 'Enerji Fazlası', denge: 'Dengede' };
const iki = (n) => String(n).padStart(2, '0');

/**
 * UYDURMA test günü (sözleşme biçiminde dönemler): n = yayımlanmış dönem sayısı
 * (kalanında SMF, yön ve dengesizlik fiyatları null; PTF dolu).
 */
export function sahteGun(ymd, n = 24, adimDk = 60) {
  const out = [];
  const adet = 1440 / adimDk;
  for (let i = 0; i < adet; i++) {
    const dk = i * adimDk;
    const yayim = i < n;
    const ptf = 2000 + i * 10;
    const yon = ['acik', 'fazla', 'denge'][i % 3];
    const smf = yon === 'acik' ? ptf + 300 : yon === 'fazla' ? ptf - 400 : ptf;
    const k = { acik: 0.06, fazla: 0.03, denge: 0.03 }[yon];
    const l = { acik: 0.03, fazla: 0.06, denge: 0.03 }[yon];
    out.push({
      bas: `${ymd}T${iki(Math.floor(dk / 60))}:${iki(dk % 60)}:00+03:00`, dk: adimDk, ptf,
      smf: yayim ? smf : null,
      pozitif: yayim ? Math.round(Math.min(ptf, smf) * (1 - l) * 100) / 100 : null,
      negatif: yayim ? Math.round(Math.max(ptf, smf) * (1 + k) * 100) / 100 : null,
      yon: yayim ? yon : null,
      yonHam: yayim ? YON_HAM[yon] : null,
    });
  }
  return out;
}

/** Testlerin sabit "şimdi"si: 24.11.2026 14:30 (Europe/Istanbul). */
export const SABIT_AN = Date.UTC(2026, 10, 24, 11, 30, 0);

/** Sahte bağlantı: gerçek hiçbir proxy'ye ya da belirtece ait değildir. */
export const SAHTE_ENV = Object.freeze({ PIYASA_VERI_URL: 'https://piyasa-veri.ornek.invalid', PIYASA_VERI_ANAHTAR: 'test-okuma-belirteci-degeri' });

const gunEkle = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
/** epoch ms → "YYYY-MM-DDTHH:MM:SS+03:00" */
export const isoTR = (ms) => new Date(ms + 3 * 3600 * 1000).toISOString().slice(0, 19) + '+03:00';

/**
 * Sahte proxy. Her istek kaydedilir (url, yöntem, başlıklar).
 * ayar:
 *   gun(ymd) → dönem dizisi ya da null (gün yanıtta yok)      varsayılan sahteGun
 *   bayat(ymd) → boolean                                        varsayılan false
 *   cekildi(ymd, an) → ISO                                       varsayılan isteğin anı
 *   durum (HTTP), hataKod ('butce'|'veri-yok'|'gecici'), retryAfter (sn),
 *   govde (ham 200 gövdesi), duzenle(json) → json (sözleşme ihlali denemeleri),
 *   asili (yanıt hiç gelmez), govdeAsili (gövde hiç gelmez), firlat (ağ hatası),
 *   gecikmeMs, anahtar (kabul edilen belirteç; varsayılan SAHTE_ENV'deki)
 */
export function sahteProxy(ayar = {}) {
  const e = {
    ayar: { durum: 200, gun: (g) => sahteGun(g), anahtar: SAHTE_ENV.PIYASA_VERI_ANAHTAR, ...ayar },
    sayac: { istek: 0 },
    istekler: [],
    an: SABIT_AN,
    simdi: () => e.an,
    ilerlet: (ms) => { e.an += ms; },
  };
  const asili = () => new Promise(() => {});
  e.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const headers = {};
    for (const [k, v] of Object.entries(init.headers || {})) headers[k.toLowerCase()] = v;
    e.istekler.push({ url: String(url), host: u.host, yol: u.pathname, sorgu: u.search, method: init.method, headers, redirect: init.redirect });
    if (u.pathname !== '/piyasa/v1/dengesizlik') throw new Error('beklenmeyen yol: ' + u.pathname);
    e.sayac.istek++;
    const a = e.ayar;
    if (a.asili) return asili();
    if (a.gecikmeMs) await new Promise((coz) => setTimeout(coz, a.gecikmeMs));
    if (a.firlat) throw new TypeError('ag hatasi');
    if (headers.authorization !== `Bearer ${a.anahtar}`) return new Response('{"hata":{"kod":"yetki"}}', { status: 401 });
    if (a.durum !== 200) {
      const h = { 'Content-Type': 'application/json' };
      if (a.retryAfter !== undefined) h['Retry-After'] = String(a.retryAfter);
      const govde = a.durum === 503 ? JSON.stringify({ hata: { kod: a.hataKod || 'gecici', mesaj: 'sahte' } }) : '{"hata":{"kod":"sahte"}}';
      return new Response(a.durum === 404 ? 'yok' : govde, { status: a.durum, headers: h });
    }
    if (a.govdeAsili) return { ok: true, status: 200, json: asili, text: asili, headers: new Headers() };
    if (a.govde !== undefined) return new Response(a.govde, { status: 200 });
    const q = u.searchParams;
    const bas = q.get('tarih') || q.get('bas'), bit = q.get('tarih') || q.get('bit');
    const gunler = [];
    for (let g = bas; g <= bit; g = gunEkle(g, 1)) {
      const donemler = a.gun(g);
      if (donemler === null) continue;
      gunler.push({
        tarih: g, cekildi: a.cekildi ? a.cekildi(g, e.an) : isoTR(e.an), bayat: a.bayat ? a.bayat(g) : false,
        tam: donemler.every((d) => d.pozitif !== null && d.negatif !== null), donemler,
      });
    }
    let j = { surum: 1, kaynak: 'EPİAŞ Şeffaflık Platformu — PTF, SMF ve SDF Listeleme', uretildi: isoTR(e.an), gunler };
    if (a.duzenle) j = a.duzenle(j);
    return new Response(JSON.stringify(j), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  };
  return e;
}

/** Sahte servis bağlaması (env.PIYASA_VERI): aynı sahte proxy'ye gider. */
export function sahteBaglama(proxy) {
  return { fetch: (url, init) => proxy.fetch(url, init) };
}

/** Sahte Workers Cache API (caches.default). */
export function sahteCache() {
  const depo = new Map();
  return {
    depo,
    match: async (anahtar) => (depo.has(String(anahtar)) ? new Response(depo.get(String(anahtar))) : undefined),
    put: async (anahtar, yanit) => { depo.set(String(anahtar), await yanit.text()); },
  };
}
