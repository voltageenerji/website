/**
 * Piyasa verisi istemcisi — epias-proxy'nin `GET /piyasa/v1/dengesizlik` ucu.
 *
 * MİMARİ (sahip kararı 25.11.2026; docs/epias-proxy/PIYASA-VERI-MIMARISI.md):
 * EPİAŞ kimliği YALNIZ proxy'dedir. Website EPİAŞ'a hiç bağlanmaz; yalnız proxy'nin
 * dar kapsamlı okuma ucunu, okuma belirteciyle çağırır.
 *
 * BAĞLANTI (env; değerler yalnız Cloudflare'in şifreli alanlarından gelir):
 *   1. env.PIYASA_VERI          servis bağlaması (tercih edilen): env.PIYASA_VERI.fetch(...)
 *   2. env.PIYASA_VERI_URL      proxy kökü (yalnız https), env.PIYASA_VERI_ANAHTAR ile
 *   Her iki yolda da (sözleşme §3) "Authorization: Bearer <PIYASA_VERI_ANAHTAR>" gönderilir.
 *   Hiçbiri yoksa: dürüst bekleme (neden 'baglanti-yok'), hiçbir istek atılmaz.
 *
 * SÖZLEŞME (functions/_lib/epias.js'in yerini alır; dışa aktarılan biçim aynıdır)
 *   gunGetir(env, ctx, ymd, secenek?)          → {durum:'veri'|'yok', tarih, donemler, cekildi, uretildi?, neden?, bayat?}
 *   aralikGetir(env, ctx, bas, bit, secenek?)  → {durum:'veri'|'yok', bas, bit, donemler, cekildi, uretildi?, neden?, bayat?}
 *   - ASLA fırlatmaz. Veri yoksa durum 'yok' + neden kodu; uydurma değer üretilmez.
 *   - cekildi: proxy'nin o günü EPİAŞ'tan son aldığı an (aralıkta en eskisi).
 *   - bayat:true → güncel veri şu an alınamadı (proxy kendisi bayat dedi, proxy'ye ulaşılamadı,
 *     bütçe ya da süre sınırı); dönen veri daha önce alınmış GERÇEK veridir (SON SENKRON).
 *   - secenek.sureMs: toplam süre sınırı; aşılırsa bayat ya da 'yok' (neden 'sure') döner,
 *     çekim ctx.waitUntil ile tamamlanıp önbelleğe yazılır.
 *   - secenek.yalnizOnbellek: proxy'ye HİÇ gidilmez (HEAD istekleri).
 *
 * ÜST-AKIŞA GÜVENİLMEZ: yanıt functions/_lib/dengesizlik.js piyasaCoz ile yeniden doğrulanır
 * (sürüm, zorunlu alanlar, bas/dk, null asla 0, çelişen kopya → "—"). Sözleşme ihlali → 'bicim'.
 * Bugün/dün için proxy "bayat değil" dese de cekildi 30 dk'dan eskiyse veri bayat işaretlenir.
 *
 * PROXY'Yİ KORUMA (ziyaretçi sayısı proxy'ye istek sayısına dönüşmez):
 *   1. Kenar önbelleği: bugün/dün 2 dk, geçmiş günler 6 sa; bayat kopya 24 saate kadar.
 *   2. Anahtar başına tek uçuş: eşzamanlı istekler aynı çağrıyı bekler.
 *   3. Dakikalık bütçe: en çok 12 proxy isteği; 4'ü BUGÜN ve DÜN için ayrılmıştır (eski günler ve
 *      aralıklar dakikada en çok 8). Aşılınca proxy'ye gidilmez; bayat ya da bekleme döner.
 *   4. Anahtar başına büyüyen bekleme: 60 sn → 5 dk → 30 dk (bugün/dün en çok 5 dk); proxy
 *      Retry-After verirse en az o kadar (en çok 30 dk).
 *   5. Proxy 401/403 (belirteç geçersiz): paylaşılan engel 5 dk → 30 dk → 2 sa; bu sürede hiçbir
 *      anahtar için istek atılmaz (yeniden deneme fırtınası yok). Belirteç değişince engel kalkar.
 *      Proxy 404 (modül kapalı): paylaşılan engel 5 dk.
 *   6. Aralık: tek proxy isteği (en çok 31 gün). Aralığın tüm günleri önbellekte tazeyse proxy'ye
 *      gidilmez; aralık yanıtındaki günler tek gün önbelleğine de yazılır.
 *
 * GÜVENLİK: belirteç yalnız env'den okunur ve yalnız Authorization başlığına girer. Belirteç
 * ASLA loglanmaz, yanıta, önbellek anahtarına ya da hata metnine girmez; engel kaydı belirtecin
 * kendisini değil SHA-256 parmak izinin ilk 64 bitini taşır. Yönlendirme izlenmez. Log yalnız
 * neden kodu ve sayaç taşır; yanıt gövdesi loglanmaz.
 *
 * ÖNBELLEK: süreç belleği → Workers Cache API (caches.default, sentetik anahtar). Anahtarlar
 * ".invalid" alan adındadır: dışarıdan hiçbir istekle eşleşemez.
 *
 * Bu dosya Pages Function DEĞİLDİR (onRequest* dışa aktarmaz, rota üretmez).
 */
import {
  piyasaCoz, gunIzgarasi, veriVar, istanbulBugun, gunEkle, gunFarki, tarihGecerli, AZAMI_ARALIK_GUN,
} from './dengesizlik.js';

const YOL = '/piyasa/v1/dengesizlik';
/** Servis bağlamasında adresin alan adı yönlendirmede kullanılmaz; yalnız yol ve sorgu önemlidir. */
const BAGLAMA_KOKU = 'https://piyasa-veri.baglama.invalid';

const ZAMAN_ASIMI_MS = 6000;        // tek proxy çağrısı (yanıt + gövde)
const KISA_TTL_S = 2 * 60;          // bugün / dün
const UZUN_TTL_S = 6 * 60 * 60;     // daha eski günler
const BAYAT_TTL_S = 60;             // proxy "bayat" dediyse kısa aralıkla yeniden sorulur
const TAZE_SINIR_MS = 30 * 60 * 1000; // bugün/dün: cekildi bundan eskiyse bayat işaretlenir
const HATA_ADIMLARI_S = [60, 5 * 60, 30 * 60];
const HATA_ADIMLARI_ONCELIKLI_S = [60, 5 * 60];
const HATA_SAKLAMA_S = 2 * 60 * 60;
const RETRY_AFTER_AZAMI_S = 30 * 60;
const ENGEL_YETKI_ADIMLARI_S = [5 * 60, 30 * 60, 2 * 60 * 60];
const ENGEL_KAPALI_S = 5 * 60;
const ENGEL_SAKLAMA_S = 4 * 60 * 60;
const SAKLAMA_S = 24 * 60 * 60;     // bayat kopyanın tutulma süresi
const ANAHTAR_KOKU = 'https://dengesizlik-onbellek.invalid/v2/';
const BELLEK_SINIRI = 512;          // seçilebilir gün sayısından (~365) büyük
// Paylaşılan (tek-uçuş) bir işe katılmanın azami yaşı: iptal edilen bir isteğin başlattığı G/Ç
// hiç tamamlanmayabilir; bu süreden eski uçuş "asılı" sayılır ve yenisi başlatılır.
const UCUS_AZAMI_MS = 20000;

/** Dakikalık proxy bütçesi (tüm anahtarlar için ortak). */
export const BUTCE = Object.freeze({ istek: 12, istekEski: 8 });

const bellek = new Map();   // anahtar → {kayit, son}
const ucusta = new Map();   // anahtar → {bas, is}
let butceBellek = { dakika: -1, istek: 0, istekEski: 0 };
let butceLogDakika = -1;
let parmakBellek = null;    // {girdi, deger}
/** İç sayaçlar (değer taşımaz; test ve teşhis için). */
export const sayaclar = { cakisma: 0, butceAsimi: 0, kisaDevre: 0, istek: 0 };

/** Yalnız testler için: süreç belleğini boşaltır. */
export function _bellekTemizle() {
  bellek.clear(); ucusta.clear();
  butceBellek = { dakika: -1, istek: 0, istekEski: 0 }; butceLogDakika = -1;
  parmakBellek = null;
  sayaclar.cakisma = 0; sayaclar.butceAsimi = 0; sayaclar.kisaDevre = 0; sayaclar.istek = 0;
}

function ayar(secenek) {
  const s = secenek || {};
  return {
    fetch: s.fetch || globalThis.fetch,
    simdi: typeof s.simdi === 'function' ? s.simdi : () => Date.now(),
    cache: s.cache !== undefined ? s.cache : (typeof caches !== 'undefined' && caches && caches.default) || null,
    zamanAsimiMs: Number.isFinite(s.zamanAsimiMs) ? s.zamanAsimiMs : ZAMAN_ASIMI_MS,
    sureMs: Number.isFinite(s.sureMs) && s.sureMs > 0 ? s.sureMs : null,
    yalnizOnbellek: s.yalnizOnbellek === true,
  };
}

/**
 * Bağlantı ayarı → {tur, kok, anahtar, fetch?} ya da null (yapılandırılmamış).
 * URL yolu yalnız https kabul eder; kullanıcı bilgisi, sorgu ya da parça taşıyan adres reddedilir.
 */
export function baglantiBul(env) {
  if (!env || typeof env !== 'object') return null;
  const ham = env.PIYASA_VERI_ANAHTAR;
  const anahtar = typeof ham === 'string' && ham.trim() ? ham.trim() : null;
  const b = env.PIYASA_VERI;
  if (b && typeof b.fetch === 'function') return { tur: 'baglama', kok: BAGLAMA_KOKU, anahtar, fetch: (u, i) => b.fetch(u, i) };
  if (!anahtar || typeof env.PIYASA_VERI_URL !== 'string') return null;
  let u;
  try { u = new URL(env.PIYASA_VERI_URL.trim()); } catch (e) { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash) return null;
  return { tur: 'https', kok: u.origin + u.pathname.replace(/\/+$/, ''), anahtar, fetch: null };
}

function arkaPlan(ctx, p) {
  const q = Promise.resolve(p).catch(() => {});
  if (ctx && typeof ctx.waitUntil === 'function') { try { ctx.waitUntil(q); } catch (e) { /* yok say */ } }
  return q;
}

/** Zaman aşımlı iş: fetch VE gövde okuma aynı sürenin içinde kalır. */
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
 * Kayıt: {deger, taze: ms, yazildi: ms, ...}. Fiziksel ömrü dolmuş kayıt dönmez. TAZE kayıt
 * bulan katman kazanır; hiçbiri taze değilse ilk bulunan (bayat) kayıt yedek olarak döner.
 */
async function oku(s, anahtar) {
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
  return aday;
}

function bellegeYaz(anahtar, kayit, son) {
  if (bellek.size >= BELLEK_SINIRI && !bellek.has(anahtar)) bellek.delete(bellek.keys().next().value);
  bellek.set(anahtar, { kayit, son });
}

/** saklamaS: fiziksel ömür (sn). */
function yaz(ctx, s, anahtar, kayit, saklamaS) {
  const son = s.simdi() + saklamaS * 1000;
  bellegeYaz(anahtar, kayit, son);
  if (!s.cache) return Promise.resolve();
  const govde = JSON.stringify({ son, kayit });
  return arkaPlan(ctx, (async () => {
    await s.cache.put(ANAHTAR_KOKU + anahtar, new Response(govde, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${Math.max(1, Math.floor(saklamaS))}` },
    }));
  })());
}

// ------------------------------------------------------------------- bütçe --

/**
 * Dakikalık bütçeden bir birim alır; dolduysa false. oncelikli = bugünün ya da dünün tek gün
 * isteği. Öncelikli OLMAYAN istekler dakikada en çok BUTCE.istekEski birim kullanabilir.
 * Sayaç süreç belleğinde ve Cache API'de tutulur (aynı veri merkezindeki süreçler arasında
 * paylaşılır; atomik değildir, üst sınır yaklaşık tutulur).
 */
async function butceAl(ctx, s, oncelikli) {
  const dakika = Math.floor(s.simdi() / 60000);
  if (butceBellek.dakika !== dakika) butceBellek = { dakika, istek: 0, istekEski: 0 };
  const dolu = () => {
    if (!(butceBellek.istek >= BUTCE.istek || (!oncelikli && butceBellek.istekEski >= BUTCE.istekEski))) return false;
    sayaclar.butceAsimi++;
    if (butceLogDakika !== dakika) { butceLogDakika = dakika; console.error('dengesizlik: dakikalık proxy bütçesi doldu'); }
    return true;
  };
  if (dolu()) return false;
  const anahtar = `${ANAHTAR_KOKU}butce/${dakika}`;
  if (s.cache) {
    try {
      const r = await s.cache.match(anahtar);
      const ortak = r ? await r.json() : null;
      if (ortak) for (const t of ['istek', 'istekEski']) if (Number.isFinite(ortak[t]) && ortak[t] > butceBellek[t]) butceBellek[t] = ortak[t];
    } catch (e) { /* sayaç okunamadıysa süreç sayacı geçerli */ }
    if (dolu()) return false;
  }
  butceBellek.istek++;
  if (!oncelikli) butceBellek.istekEski++;
  if (s.cache) {
    const govde = JSON.stringify({ istek: butceBellek.istek, istekEski: butceBellek.istekEski });
    arkaPlan(ctx, (async () => { await s.cache.put(anahtar, new Response(govde, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=120' } })); })());
  }
  return true;
}

// ----------------------------------------------------- paylaşılan engel ----

const kodlayici = new TextEncoder();
const b64 = (bayt) => { let t = ''; for (const x of bayt) t += String.fromCharCode(x); return btoa(t); };

/**
 * Bağlantının parmak izi: SHA-256(tür, kök, belirteç) ilk 64 bit. Engel kaydına yazılır;
 * belirteç ya da adres değişince eski engel geçersiz sayılır. Belirteç geri elde edilemez.
 */
async function parmakIzi(bag) {
  const girdi = `${bag.tur}\n${bag.kok}\n${bag.anahtar || ''}`;
  if (parmakBellek && parmakBellek.girdi === girdi) return parmakBellek.deger;
  let deger = '';
  try { deger = b64(new Uint8Array(await crypto.subtle.digest('SHA-256', kodlayici.encode(girdi))).slice(0, 8)); } catch (e) { /* boş: engel bağlantıdan bağımsız işler */ }
  parmakBellek = { girdi, deger };
  return deger;
}

async function engelKaydi(s, bag) {
  const k = await oku(s, 'engel');
  if (!k) return null;
  return (k.parmak || '') === (await parmakIzi(bag)) ? k : null;
}

/** Engel tazeyse neden kodu; değilse null. */
function engelNedeni(s, k) {
  return k && Number.isFinite(k.taze) && s.simdi() < k.taze && k.deger && typeof k.deger.neden === 'string' ? k.deger.neden : null;
}

/** yetki: büyüyen aralık (5 dk → 30 dk → 2 sa). kapali: 5 dk, adım değişmez. */
async function engelYaz(ctx, s, bag, onceki, neden) {
  const an = s.simdi();
  const eskiAdim = onceki && Number.isFinite(onceki.adim) ? onceki.adim : 0;
  const adim = neden === 'yetki' ? eskiAdim + 1 : eskiAdim;
  const sureS = neden === 'yetki' ? ENGEL_YETKI_ADIMLARI_S[Math.min(adim, ENGEL_YETKI_ADIMLARI_S.length) - 1] : ENGEL_KAPALI_S;
  return yaz(ctx, s, 'engel', { deger: { neden }, taze: an + sureS * 1000, yazildi: an, adim, parmak: await parmakIzi(bag) }, Math.max(sureS, adim ? ENGEL_SAKLAMA_S : 0));
}

// ------------------------------------------------------------ proxy çağrısı --

function retryAfterS(h) {
  try {
    const v = h && h.get ? h.get('Retry-After') : null;
    if (!v) return null;
    if (/^\d+$/.test(v.trim())) return Math.min(+v.trim(), RETRY_AFTER_AZAMI_S);
    const ms = Date.parse(v);
    return Number.isFinite(ms) ? Math.max(0, Math.min(Math.round((ms - Date.now()) / 1000), RETRY_AFTER_AZAMI_S)) : null;
  } catch (e) { return null; }
}

/**
 * Tek proxy çağrısı → {json} | {hata, retryS?}. Hata kodları: yetki, kapali, parametre,
 * vekil-butce, veri-yok, gecici, vekil-hata, bicim, zaman-asimi, ag. Gövde loglanmaz.
 */
async function vekilCagir(s, bag, sorgu) {
  sayaclar.istek++;
  try {
    return await sureli(s, async (signal) => {
      const headers = { Accept: 'application/json' };
      if (bag.anahtar) headers.Authorization = `Bearer ${bag.anahtar}`;
      const f = bag.tur === 'baglama' ? bag.fetch : s.fetch;
      const r = await f(`${bag.kok}${YOL}?${sorgu}`, { method: 'GET', headers, redirect: 'manual', signal });
      if (r.status === 200) {
        let j;
        try { j = await r.json(); } catch (e) { return { hata: 'bicim' }; }
        return { json: j };
      }
      if (r.status === 401 || r.status === 403) return { hata: 'yetki' };
      if (r.status === 404) return { hata: 'kapali' };
      if (r.status === 400) return { hata: 'parametre' };
      if (r.status === 503) {
        let kod = null;
        try { const j = await r.json(); kod = j && j.hata && typeof j.hata.kod === 'string' ? j.hata.kod : null; } catch (e) { /* kod yok */ }
        return { hata: kod === 'butce' ? 'vekil-butce' : kod === 'veri-yok' ? 'veri-yok' : 'gecici', retryS: retryAfterS(r.headers) };
      }
      return { hata: 'vekil-hata' };
    });
  } catch (e) {
    return { hata: e && e.message === 'zaman-asimi' ? 'zaman-asimi' : 'ag' };
  }
}

/** Günün tazelik penceresi ve bayatlığı (proxy'nin bayrağı + kendi denetimimiz). */
function gunDurumu(s, tarih, g, bugun) {
  const guncel = tarih >= gunEkle(bugun, -1);
  const eskimis = guncel && s.simdi() - Date.parse(g.cekildi) > TAZE_SINIR_MS;
  return { guncel, bayat: g.bayat || eskimis };
}

function ttlS(bayat, guncel) { return bayat ? BAYAT_TTL_S : guncel ? KISA_TTL_S : UZUN_TTL_S; }

/** Tek gün kaydını önbelleğe yazar (aralık yanıtının günleri de bu yoldan geçer). */
function gunYaz(ctx, s, tarih, deger, guncel) {
  const an = s.simdi();
  yaz(ctx, s, 'gun/' + tarih, { deger, taze: an + ttlS(!!deger.bayat, guncel) * 1000, yazildi: an }, SAKLAMA_S);
}

/** Proxy çağrısı + doğrulama + önbelleğe yazım. Fırlatmaz. */
async function cekVeYaz(env, ctx, s, bag, anahtar, bas, bit, bugun, kayit, eski) {
  const yedek = (neden) => (eski ? { ...eski, bayat: true, neden } : { durum: 'yok', neden });
  try {
    const tekGun = anahtar.startsWith('gun/');
    const oncelikli = tekGun && bas >= gunEkle(bugun, -1);
    const engel = await engelKaydi(s, bag);
    const engelVar = engelNedeni(s, engel);
    if (engelVar) { sayaclar.kisaDevre++; return yedek(engelVar); }
    if (!(await butceAl(ctx, s, oncelikli))) { sayaclar.kisaDevre++; return yedek('butce'); }

    const c = await vekilCagir(s, bag, tekGun ? `tarih=${bas}` : `bas=${bas}&bit=${bit}`);
    let neden = c.hata || null;
    let deger = null;
    if (!neden) {
      const p = piyasaCoz(c.json, bas, bit, s.simdi());
      if (p.hata) neden = p.hata;
      else {
        if (p.cakisma) {
          sayaclar.cakisma += p.cakisma;
          console.error('dengesizlik: çakışan yinelenen dönem —', p.cakisma, 'dönem', bas, bit); // yalnız sayaç ve tarih
        }
        const donemler = [];
        let cekildi = null, bayat = false;
        for (let g = bas; g <= bit; g = gunEkle(g, 1)) {
          const gun = p.gunler.get(g);
          const izgara = gun ? gunIzgarasi(g, gun.donemler) : [];
          if (!izgara.length) { neden = gun && tekGun ? 'bos' : 'eksik'; break; }
          const gd = gunDurumu(s, g, gun, bugun);
          if (!tekGun && veriVar(izgara)) {
            const gk = { durum: 'veri', donemler: izgara, cekildi: gun.cekildi, uretildi: p.uretildi };
            if (gd.bayat) { gk.bayat = true; gk.neden = 'vekil-bayat'; }
            gunYaz(ctx, s, g, gk, gd.guncel);
          }
          donemler.push(...izgara);
          if (!cekildi || gun.cekildi < cekildi) cekildi = gun.cekildi;
          if (gd.bayat) bayat = true;
        }
        if (!neden && !veriVar(donemler)) neden = 'bos';
        if (!neden) {
          deger = { durum: 'veri', donemler, cekildi, uretildi: p.uretildi };
          if (bayat) { deger.bayat = true; deger.neden = 'vekil-bayat'; }
          // Proxy'nin bayat verisi, elimizdeki DAHA YENİ kopyanın yerine geçmez: yeni kopya bayat
          // işaretiyle sunulmayı sürdürür (aşağıdaki hata yolu: büyüyen bekleme, 24 sa sınırı).
          if (bayat && eski && eski.cekildi > cekildi) { deger = null; neden = 'vekil-bayat'; }
        }
      }
    }
    if (engel && engel.adim && !c.hata) yaz(ctx, s, 'engel', { deger: null, taze: 0, yazildi: s.simdi(), adim: 0, parmak: engel.parmak }, 60);
    const an = s.simdi();
    if (deger) {
      const guncel = bit >= gunEkle(bugun, -1);
      yaz(ctx, s, anahtar, { deger, taze: an + ttlS(!!deger.bayat, guncel) * 1000, yazildi: an }, SAKLAMA_S);
      return deger;
    }
    if (neden === 'yetki' || neden === 'kapali') await engelYaz(ctx, s, bag, engel, neden);
    // Belirteç, adres ya da gövde loglanmaz: yalnız neden kodu.
    console.error('dengesizlik: piyasa verisi alınamadı —', neden);
    const hataSayisi = (kayit && Number.isFinite(kayit.hataSayisi) ? kayit.hataSayisi : 0) + 1;
    const adimlar = oncelikli ? HATA_ADIMLARI_ONCELIKLI_S : HATA_ADIMLARI_S;
    const bekleS = Math.max(adimlar[Math.min(hataSayisi, adimlar.length) - 1], Number.isFinite(c.retryS) ? c.retryS : 0);
    if (eski) {
      const d = { ...eski, bayat: true, neden };
      const kalan = Math.max(bekleS, Math.floor(((kayit.yazildi || an) + SAKLAMA_S * 1000 - an) / 1000));
      yaz(ctx, s, anahtar, { deger: d, taze: an + bekleS * 1000, yazildi: kayit.yazildi || an, eski, hataSonrasi: true, hataSayisi }, kalan);
      return d;
    }
    yaz(ctx, s, anahtar, { deger: { durum: 'yok', neden }, taze: an + bekleS * 1000, yazildi: an, hataSayisi }, HATA_SAKLAMA_S);
    return { durum: 'yok', neden };
  } catch (e) {
    console.error('dengesizlik: çekim beklenmeyen hata —', e && e.name);
    return yedek('hata');
  }
}

const SURE_DOLDU = Symbol('sure');

/** Bir anahtar (gün ya da aralık) için önbellekli, tek-uçuşlu çekim. */
async function parcaGetir(env, ctx, s, bag, anahtar, bas, bit, bugun) {
  const kayit = await oku(s, anahtar);
  if (kayit && s.simdi() < kayit.taze) return kayit.deger;
  const eskiHam = kayit ? (kayit.deger && kayit.deger.durum === 'veri' ? kayit.deger : kayit.eski || null) : null;
  const eski = eskiHam ? { durum: 'veri', donemler: eskiHam.donemler, cekildi: eskiHam.cekildi, uretildi: eskiHam.uretildi } : null;
  const yedek = (neden) => (eski ? { ...eski, bayat: true, neden } : { durum: 'yok', neden });
  if (s.yalnizOnbellek) return yedek('onbellek-yok');

  let ucus = ucusta.get(anahtar);
  if (!ucus || Date.now() - ucus.bas >= UCUS_AZAMI_MS) {
    ucus = { bas: Date.now(), is: cekVeYaz(env, ctx, s, bag, anahtar, bas, bit, bugun, kayit, eski) };
    ucusta.set(anahtar, ucus);
    const bu = ucus;
    bu.is.then(() => { if (ucusta.get(anahtar) === bu) ucusta.delete(anahtar); });
    // Başlatan istek erken dönse ya da istemci bağlantıyı kesse de çekim tamamlanıp önbelleğe yazılsın.
    arkaPlan(ctx, bu.is);
  }
  if (!s.sureMs) return ucus.is;
  let zamanlayici;
  const sonuc = await Promise.race([ucus.is, new Promise((coz) => { zamanlayici = setTimeout(() => coz(SURE_DOLDU), s.sureMs); })]);
  clearTimeout(zamanlayici);
  return sonuc !== SURE_DOLDU ? sonuc : yedek('sure');
}

function cikti(p) {
  const out = { durum: 'veri', donemler: p.donemler, cekildi: p.cekildi };
  if (p.uretildi) out.uretildi = p.uretildi;
  if (p.bayat) { out.bayat = true; out.neden = p.neden; }
  return out;
}

/** Tek gün. Dönen donemler günün tam ızgarasıdır (yayımlanmamış dönem tümü null). */
export async function gunGetir(env, ctx, ymd, secenek) {
  const yok = (neden) => ({ durum: 'yok', tarih: typeof ymd === 'string' ? ymd : null, donemler: [], cekildi: null, neden });
  try {
    const s = ayar(secenek);
    const bugun = istanbulBugun(s.simdi());
    if (!tarihGecerli(ymd, bugun)) return yok('gecersiz-tarih');
    const bag = baglantiBul(env);
    if (!bag) return yok('baglanti-yok');
    const p = await parcaGetir(env, ctx, s, bag, 'gun/' + ymd, ymd, ymd, bugun);
    if (p.durum !== 'veri' || !veriVar(p.donemler)) return yok(p.neden || 'bos');
    return { tarih: ymd, ...cikti(p) };
  } catch (e) {
    console.error('dengesizlik: gunGetir beklenmeyen hata —', e && e.name);
    return yok('hata');
  }
}

/**
 * Tarih aralığı (en çok 31 gün, uçlar dahil): proxy'ye TEK istek. Aralığın her günü tek gün
 * önbelleğinde tazeyse proxy'ye gidilmez. Bir gün eksikse 'eksik' döner: yarım dosya
 * tam gibi sunulmaz.
 */
export async function aralikGetir(env, ctx, bas, bit, secenek) {
  const yok = (neden) => ({ durum: 'yok', bas: typeof bas === 'string' ? bas : null, bit: typeof bit === 'string' ? bit : null, donemler: [], cekildi: null, neden });
  try {
    const s = ayar(secenek);
    const bugun = istanbulBugun(s.simdi());
    if (!tarihGecerli(bas, bugun) || !tarihGecerli(bit, bugun) || bas > bit) return yok('gecersiz-tarih');
    if (gunFarki(bas, bit) + 1 > AZAMI_ARALIK_GUN) return yok('aralik-uzun');
    const bag = baglantiBul(env);
    if (!bag) return yok('baglanti-yok');

    // Günlerin hepsi önbellekte tazeyse aralık oradan kurulur (proxy çağrısı yok).
    const parcalar = [];
    for (let g = bas; g <= bit; g = gunEkle(g, 1)) {
      const k = await oku(s, 'gun/' + g);
      if (!k || !(s.simdi() < k.taze) || !k.deger || k.deger.durum !== 'veri') { parcalar.length = 0; break; }
      parcalar.push(k.deger);
    }
    if (parcalar.length === gunFarki(bas, bit) + 1) {
      const birlesik = { durum: 'veri', donemler: parcalar.flatMap((p) => p.donemler), cekildi: parcalar.map((p) => p.cekildi).sort()[0], uretildi: parcalar.map((p) => p.uretildi || '').sort().at(-1) || undefined };
      const b = parcalar.find((p) => p.bayat);
      if (b) { birlesik.bayat = true; birlesik.neden = b.neden; }
      return { bas, bit, ...cikti(birlesik) };
    }
    const p = await parcaGetir(env, ctx, s, bag, `aralik/${bas}/${bit}`, bas, bit, bugun);
    if (p.durum !== 'veri' || !veriVar(p.donemler)) return yok(p.neden || 'bos');
    return { bas, bit, ...cikti(p) };
  } catch (e) {
    console.error('dengesizlik: aralikGetir beklenmeyen hata —', e && e.name);
    return yok('hata');
  }
}

/** Yalnız testler ve teşhis için: istemcinin Cache API anahtar kökü (sentetik). */
export const _ANAHTAR_KOKU = ANAHTAR_KOKU;
