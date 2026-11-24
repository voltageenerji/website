/**
 * EPİAŞ Şeffaflık istemcisi — "PTF, SMF ve SDF Listeleme Servisi" (reporting-service).
 *
 * Dayanak: docs/seo/DENGESIZLIK-KAYNAK-TEYIT.md (EPİAŞ resmî teknik belgesi):
 *   POST https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf
 *        gövde {startDate, endDate} (ISO-8601, +03:00), başlık TGT
 *   POST https://giris.epias.com.tr/cas/v1/tickets (form: username, password;
 *        Accept: text/plain) → HTTP 201 + "TGT-…"; bilet ömrü 2 saat
 * DOĞRULANMAYANLAR (savunmacı yazıldı): yanıt zarfı, endDate yorumu, istek
 * başına aralık sınırı, sayfalama varsayılanı.
 *
 * SÖZLEŞME
 *   gunGetir(env, ctx, ymd, secenek?)          → {durum:'veri'|'yok', tarih, donemler, cekildi, neden?, bayat?}
 *   aralikGetir(env, ctx, bas, bit, secenek?)  → {durum:'veri'|'yok', bas, bit, donemler, cekildi, neden?, bayat?}
 *   - ASLA fırlatmaz. Veri yoksa durum 'yok' + neden kodu; uydurma değer üretilmez.
 *   - bayat:true → EPİAŞ'a şu an ulaşılamadı; dönen veri daha önce EPİAŞ'tan
 *     alınmış gerçek veridir, "cekildi" o çekimin zamanıdır (SON SENKRON).
 *
 * GÜVENLİK: kimlik yalnızca env'den okunur (EPIAS_USERNAME / EPIAS_PASSWORD).
 * Kimlik, bilet (TGT) ve yanıt gövdesi ASLA loglanmaz; log yalnız neden kodu taşır.
 *
 * ÖNBELLEK: süreç belleği → Workers Cache API (caches.default, sentetik anahtar)
 * → varsa KV (env.PIYASA; isteğe bağlı). Anahtarlar ".invalid" alan adındadır:
 * dışarıdan hiçbir istekle eşleşemez. Başarısızlık da 60 sn önbelleğe alınır;
 * kesintide her sayfa görüntülemesi EPİAŞ'a yeniden bağlanmaya çalışmaz.
 *
 * Bu dosya Pages Function DEĞİLDİR (onRequest* dışa aktarmaz, rota üretmez).
 */
import {
  donemler, ogelerCikar, aralikSinirlari, gunIzgarasi, veriVar, istanbulBugun, istanbulIso, gunEkle, gunFarki,
  tarihGecerli, donemGunu, AZAMI_ARALIK_GUN,
} from './dengesizlik.js';

const GIRIS_URL = 'https://giris.epias.com.tr/cas/v1/tickets';
const RAPOR_URL = 'https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf';

const ZAMAN_ASIMI_MS = 6000;
const TGT_TTL_S = 100 * 60;        // resmî ömür 2 saat; 100 dk'da yenilenir
const KISA_TTL_S = 5 * 60;         // bugün / dün: yeni dönemler yayımlanıyor
const UZUN_TTL_S = 6 * 60 * 60;    // daha eski günler
const HATA_TTL_S = 60;             // başarısızlık (ve bayat sunum) penceresi
const SAKLAMA_S = 24 * 60 * 60;    // bayat kopyanın tutulma süresi
const KV_YENILE_MS = 12 * 60 * 60 * 1000;
const ANAHTAR_KOKU = 'https://dengesizlik-onbellek.invalid/v1/';
const BELLEK_SINIRI = 80;

const bellek = new Map();   // anahtar → kayıt
const ucusta = new Map();   // anahtar → sürmekte olan çekim (aynı süreçte tek istek)

/** Yalnız testler için: süreç belleğini boşaltır. */
export function _bellekTemizle() { bellek.clear(); ucusta.clear(); }

function ayar(secenek) {
  const s = secenek || {};
  return {
    fetch: s.fetch || globalThis.fetch,
    simdi: typeof s.simdi === 'function' ? s.simdi : () => Date.now(),
    cache: s.cache !== undefined ? s.cache : (typeof caches !== 'undefined' && caches && caches.default) || null,
    zamanAsimiMs: Number.isFinite(s.zamanAsimiMs) ? s.zamanAsimiMs : ZAMAN_ASIMI_MS,
  };
}

function arkaPlan(ctx, p) {
  const q = Promise.resolve(p).catch(() => {});
  if (ctx && typeof ctx.waitUntil === 'function') { try { ctx.waitUntil(q); } catch (e) { /* yok say */ } }
  return q;
}

/**
 * Zaman aşımlı iş: fetch VE gövde okuma aynı sürenin içinde kalır.
 * AbortSignal + yarış: fetch sinyali yok saysa bile süre dolunca döner.
 */
async function sureli(s, is) {
  let zamanlayici;
  const kontrol = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const asim = new Promise((_, ret) => {
    zamanlayici = setTimeout(() => { if (kontrol) kontrol.abort(); ret(new Error('zaman-asimi')); }, s.zamanAsimiMs);
  });
  try {
    return await Promise.race([is(kontrol ? kontrol.signal : undefined), asim]);
  } finally {
    clearTimeout(zamanlayici);
  }
}

// ---------------------------------------------------------------- önbellek --

/**
 * Kayıt: {deger, taze: ms (bu ana kadar taze), yazildi: ms}. Fiziksel ömrü dolmuş
 * kayıt dönmez. Katmanlar sırayla gezilir; TAZE kayıt bulan katman kazanır,
 * hiçbiri taze değilse ilk bulunan (bayat) kayıt yedek olarak döner.
 */
async function oku(env, s, anahtar) {
  const simdi = s.simdi();
  let aday = null;
  const tart = (kayit, son) => {
    if (!kayit || !Number.isFinite(son) || simdi >= son) return false;
    if (Number.isFinite(kayit.taze) && simdi < kayit.taze) { bellegeYaz(anahtar, kayit, son); aday = kayit; return true; }
    if (!aday) aday = kayit;
    return false;
  };
  const b = bellek.get(anahtar);
  if (b) { if (simdi >= b.son) bellek.delete(anahtar); else if (tart(b.kayit, b.son)) return aday; }
  if (s.cache) {
    try {
      const r = await s.cache.match(ANAHTAR_KOKU + anahtar);
      if (r) { const k = await r.json(); if (k && tart(k.kayit, k.son)) return aday; }
    } catch (e) { /* önbellek hatası veriyi engellemez */ }
  }
  if (env && env.PIYASA && typeof env.PIYASA.get === 'function') {
    try {
      const k = await env.PIYASA.get('dengesizlik:' + anahtar, 'json');
      if (k && tart(k.kayit, k.son)) return aday;
    } catch (e) { /* KV isteğe bağlı */ }
  }
  return aday;
}

function bellegeYaz(anahtar, kayit, son) {
  if (bellek.size >= BELLEK_SINIRI && !bellek.has(anahtar)) bellek.delete(bellek.keys().next().value);
  bellek.set(anahtar, { kayit, son });
}

/** saklamaS: fiziksel ömür (sn). kv:false → KV'ye yazılmaz (kısa ömürlü hata kayıtları). */
function yaz(env, ctx, s, anahtar, kayit, saklamaS, kv) {
  const son = s.simdi() + saklamaS * 1000;
  bellegeYaz(anahtar, kayit, son);
  const govde = JSON.stringify({ son, kayit });
  const isler = [];
  if (s.cache) {
    isler.push((async () => {
      await s.cache.put(ANAHTAR_KOKU + anahtar, new Response(govde, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${Math.max(1, Math.floor(saklamaS))}` },
      }));
    })());
  }
  if (kv && env && env.PIYASA && typeof env.PIYASA.put === 'function') {
    isler.push((async () => { await env.PIYASA.put('dengesizlik:' + anahtar, govde, { expirationTtl: Math.max(60, Math.floor(saklamaS)) }); })());
  }
  return arkaPlan(ctx, Promise.allSettled(isler));
}

// -------------------------------------------------------------------- bilet --

function biletAyikla(metin, konum) {
  for (const kaynak of [metin, konum]) {
    if (typeof kaynak !== 'string') continue;
    const m = /TGT-[A-Za-z0-9._-]{6,}/.exec(kaynak);
    if (m) return m[0];
  }
  return null;
}

/** → {tgt} | {hata} */
async function biletAl(env, ctx, s, zorla) {
  if (!zorla) {
    const k = await oku(env, s, 'tgt');
    if (k && typeof k.tgt === 'string' && s.simdi() < k.taze) return { tgt: k.tgt };
  }
  let tgt;
  try {
    const sonuc = await sureli(s, async (signal) => {
      const r = await s.fetch(GIRIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/plain' },
        body: new URLSearchParams({ username: String(env.EPIAS_USERNAME), password: String(env.EPIAS_PASSWORD) }).toString(),
        signal,
      });
      if (r.status === 400 || r.status === 401 || r.status === 403) return { hata: 'giris-reddedildi' };
      if (r.status < 200 || r.status > 299) return { hata: 'giris-hata' };
      let metin = '';
      try { metin = await r.text(); } catch (e) { /* aşağıda biçim hatası */ }
      const t = biletAyikla(metin, r.headers && r.headers.get ? r.headers.get('Location') : null);
      return t ? { tgt: t } : { hata: 'giris-bicim' };
    });
    if (sonuc.hata) return sonuc;
    tgt = sonuc.tgt;
  } catch (e) {
    return { hata: e && e.message === 'zaman-asimi' ? 'giris-zaman-asimi' : 'giris-ag' };
  }
  const simdi = s.simdi();
  yaz(env, ctx, s, 'tgt', { tgt, taze: simdi + TGT_TTL_S * 1000, yazildi: simdi }, TGT_TTL_S, true);
  return { tgt };
}

// -------------------------------------------------------------------- rapor --

/** → {ogeler} | {hata} */
async function raporCek(env, ctx, s, bas, bit) {
  const govde = JSON.stringify(aralikSinirlari(bas, bit));
  // → {durum: HTTP kodu} | {ogeler} | {hata}
  const istek = (tgt) => sureli(s, async (signal) => {
    const r = await s.fetch(RAPOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', TGT: tgt },
      body: govde,
      signal,
    });
    if (!r.ok) return { durum: r.status };
    let j;
    try { j = await r.json(); } catch (e) { return { hata: 'bicim' }; }
    const ogeler = ogelerCikar(j);
    return ogeler === null ? { hata: 'bicim' } : { ogeler };
  });
  const yetkisiz = (x) => x.durum === 401 || x.durum === 403;
  let b = await biletAl(env, ctx, s, false);
  if (b.hata) return { hata: b.hata };
  let x;
  try {
    x = await istek(b.tgt);
    if (yetkisiz(x)) {
      // Önbellekteki bilet geçersizleşmiş olabilir: bir kez yenile, bir kez daha dene.
      b = await biletAl(env, ctx, s, true);
      if (b.hata) return { hata: b.hata };
      x = await istek(b.tgt);
    }
  } catch (e) {
    return { hata: e && e.message === 'zaman-asimi' ? 'zaman-asimi' : 'ag' };
  }
  if (yetkisiz(x)) return { hata: 'servis-yetki' };
  if (x.durum) return { hata: 'servis-hata' };
  return x;
}

/**
 * Bir tarih parçası (gün ya da ay dilimi) için önbellekli çekim.
 * → {durum:'veri', donemler, cekildi, bayat?} | {durum:'yok', neden}
 */
async function parcaGetir(env, ctx, s, anahtar, bas, bit, bugun) {
  const simdi = s.simdi();
  const kayit = await oku(env, s, anahtar);
  if (kayit && simdi < kayit.taze) return kayit.deger;
  if (ucusta.has(anahtar)) return ucusta.get(anahtar);

  const is = (async () => {
    const c = await raporCek(env, ctx, s, bas, bit);
    let neden = c.hata || null;
    let liste = null;
    if (!neden) {
      liste = donemler(c.ogeler).filter((d) => { const g = donemGunu(d); return g >= bas && g <= bit; });
      if (!veriVar(liste)) neden = 'bos';
    }
    const an = s.simdi();
    if (!neden) {
      const deger = { durum: 'veri', donemler: liste, cekildi: istanbulIso(an) };
      const taze = bit >= gunEkle(bugun, -1) ? KISA_TTL_S : UZUN_TTL_S;
      // KV'ye yalnız içerik değiştiyse ya da kopya eskidiyse yazılır (yazma kotası).
      const ayni = kayit && kayit.deger && kayit.deger.durum === 'veri' && !kayit.hataSonrasi
        && JSON.stringify(kayit.deger.donemler) === JSON.stringify(liste) && an - (kayit.kvYazildi || 0) < KV_YENILE_MS;
      yaz(env, ctx, s, anahtar, { deger, taze: an + taze * 1000, yazildi: an, kvYazildi: ayni ? kayit.kvYazildi : an }, SAKLAMA_S, !ayni);
      return deger;
    }
    // Kimlik, bilet ya da gövde loglanmaz: yalnız neden kodu.
    console.error('dengesizlik: EPİAŞ verisi alınamadı —', neden);
    const eski = kayit && kayit.deger && kayit.deger.durum === 'veri' ? kayit.deger : (kayit && kayit.eski) || null;
    if (eski) {
      // Dürüstlük merdiveni: daha önce alınmış GERÇEK veri, kendi çekim zamanıyla.
      const deger = { ...eski, bayat: true, neden };
      const kalan = Math.max(HATA_TTL_S, Math.floor(((kayit.yazildi || an) + SAKLAMA_S * 1000 - an) / 1000));
      yaz(env, ctx, s, anahtar, { deger, taze: an + HATA_TTL_S * 1000, yazildi: kayit.yazildi || an, kvYazildi: kayit.kvYazildi || 0, eski, hataSonrasi: true }, kalan, false);
      return deger;
    }
    const deger = { durum: 'yok', neden };
    yaz(env, ctx, s, anahtar, { deger, taze: an + HATA_TTL_S * 1000, yazildi: an }, HATA_TTL_S, false);
    return deger;
  })();
  ucusta.set(anahtar, is);
  try { return await is; } finally { ucusta.delete(anahtar); }
}

const kimlikVar = (env) => !!(env && typeof env.EPIAS_USERNAME === 'string' && env.EPIAS_USERNAME && typeof env.EPIAS_PASSWORD === 'string' && env.EPIAS_PASSWORD);

/** Tek gün. Dönen donemler günün tam ızgarasıdır (yayımlanmamış dönem tümü null). */
export async function gunGetir(env, ctx, ymd, secenek) {
  const yok = (neden) => ({ durum: 'yok', tarih: typeof ymd === 'string' ? ymd : null, donemler: [], cekildi: null, neden });
  try {
    const s = ayar(secenek);
    const bugun = istanbulBugun(s.simdi());
    if (!tarihGecerli(ymd, bugun)) return yok('gecersiz-tarih');
    if (!kimlikVar(env)) return yok('kimlik-yok');
    const p = await parcaGetir(env, ctx, s, 'gun/' + ymd, ymd, ymd, bugun);
    if (p.durum !== 'veri') return yok(p.neden || 'hata');
    const izgara = gunIzgarasi(ymd, p.donemler);
    if (!veriVar(izgara)) return yok('bos');
    const out = { durum: 'veri', tarih: ymd, donemler: izgara, cekildi: p.cekildi };
    if (p.bayat) { out.bayat = true; out.neden = p.neden; }
    return out;
  } catch (e) {
    console.error('dengesizlik: gunGetir beklenmeyen hata —', e && e.name);
    return yok('hata');
  }
}

/**
 * Tarih aralığı (en çok 31 gün, uçlar dahil). EPİAŞ'a takvim ayı dilimleriyle
 * gidilir (aralık başına en çok iki istek; önbellek anahtarı ay bazında). Böylece
 * kötü niyetli aralık kombinasyonları EPİAŞ'a istek yağdıramaz ve Workers'ın
 * istek başına alt istek sınırı aşılmaz.
 * Aralıktaki her günün en az bir satırı yoksa 'eksik' döner: yarım dosya
 * tam gibi sunulmaz.
 */
export async function aralikGetir(env, ctx, bas, bit, secenek) {
  const yok = (neden) => ({ durum: 'yok', bas: typeof bas === 'string' ? bas : null, bit: typeof bit === 'string' ? bit : null, donemler: [], cekildi: null, neden });
  try {
    const s = ayar(secenek);
    const bugun = istanbulBugun(s.simdi());
    if (!tarihGecerli(bas, bugun) || !tarihGecerli(bit, bugun) || bas > bit) return yok('gecersiz-tarih');
    if (gunFarki(bas, bit) + 1 > AZAMI_ARALIK_GUN) return yok('aralik-uzun');
    if (!kimlikVar(env)) return yok('kimlik-yok');

    const dilimler = [];
    let ay = bas.slice(0, 7);
    const sonAy = bit.slice(0, 7);
    for (let guard = 0; guard < 3; guard++) {
      const [y, m] = ay.split('-').map(Number);
      const ayBas = `${ay}-01`;
      const aySonu = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
      const dBit = aySonu < bugun ? aySonu : bugun;
      // Anahtar bitiş gününü de taşır: gece yarısından sonra dünkü ay kaydı "bugün"ü içermez.
      dilimler.push({ anahtar: `ay/${ay}/${dBit}`, bas: ayBas, bit: dBit });
      if (ay === sonAy) break;
      ay = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
    }
    const parcalar = await Promise.all(dilimler.map((d) => parcaGetir(env, ctx, s, d.anahtar, d.bas, d.bit, bugun)));
    const kotu = parcalar.find((p) => p.durum !== 'veri');
    if (kotu) return yok(kotu.neden || 'hata');

    const hepsi = parcalar.flatMap((p) => p.donemler);
    const out = [];
    for (let g = bas; g <= bit; g = gunEkle(g, 1)) {
      const izgara = gunIzgarasi(g, hepsi);
      if (!izgara.length) return yok('eksik');
      out.push(...izgara);
    }
    if (!veriVar(out)) return yok('bos');
    const sonuc = { durum: 'veri', bas, bit, donemler: out, cekildi: parcalar.map((p) => p.cekildi).sort()[0] };
    const bayat = parcalar.find((p) => p.bayat);
    if (bayat) { sonuc.bayat = true; sonuc.neden = bayat.neden; }
    return sonuc;
  } catch (e) {
    console.error('dengesizlik: aralikGetir beklenmeyen hata —', e && e.name);
    return yok('hata');
  }
}
