/**
 * EPİAŞ Şeffaflık istemcisi — "PTF, SMF ve SDF Listeleme Servisi" (reporting-service).
 *
 * Dayanak: docs/seo/DENGESIZLIK-KAYNAK-TEYIT.md (EPİAŞ resmî teknik belgesi):
 *   POST https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf
 *        gövde {startDate, endDate, page?} (ISO-8601, +03:00), başlık TGT
 *   POST https://giris.epias.com.tr/cas/v1/tickets (form: username, password;
 *        Accept: text/plain) → HTTP 201 + "TGT-…"; bilet ömrü 2 saat
 * DOĞRULANMAYANLAR (savunmacı yazıldı): yanıt zarfı, endDate yorumu, istek
 * başına aralık sınırı, sayfalama varsayılanı, date/time alanlarının biçimi.
 *
 * SÖZLEŞME
 *   gunGetir(env, ctx, ymd, secenek?)          → {durum:'veri'|'yok', tarih, donemler, cekildi, neden?, bayat?}
 *   aralikGetir(env, ctx, bas, bit, secenek?)  → {durum:'veri'|'yok', bas, bit, donemler, cekildi, neden?, bayat?}
 *   - ASLA fırlatmaz. Veri yoksa durum 'yok' + neden kodu; uydurma değer üretilmez.
 *   - bayat:true → EPİAŞ'a şu an gidilmedi/ulaşılamadı; dönen veri daha önce
 *     EPİAŞ'tan alınmış gerçek veridir, "cekildi" o çekimin zamanıdır (SON SENKRON).
 *   - secenek.sureMs: toplam süre sınırı. Aşılırsa bayat ya da 'yok' (neden 'sure')
 *     döner; çekim ctx.waitUntil ile arka planda tamamlanır ve önbelleğe yazılır.
 *   - secenek.yalnizOnbellek: üst-akışa HİÇ gidilmez (HEAD istekleri).
 *
 * ÜST-AKIŞ KORUMASI (anonim ziyaretçi EPİAŞ hesabını yoramaz; aynı hesap ana
 * sayfadaki PTF'yi de besler, kilitlenmesi orayı da düşürür):
 *   1. Bilet alımı tek-uçuş: eşzamanlı istekler tek girişi bekler.
 *   2. Giriş hatası paylaşılan olumsuz önbellektedir: 400/401/403 → 5 dk,
 *      ağ / zaman aşımı / 5xx → 60 sn. Bu sürede hiçbir anahtar için giriş denenmez.
 *   3. Rapor 401 dönerse bilet BİR kez yenilenir; yine 401 ise aynı olumsuz
 *      önbellek devreye girer (giriş döngüsü yok).
 *   4. Küresel dakikalık bütçe: en çok 12 rapor isteği + 2 giriş (süreç belleği +
 *      Cache API sayacı). Aşılınca EPİAŞ'a gidilmez; bayat ya da bekleme döner.
 *   5. Başarısızlık anahtar bazında da 60 sn önbelleğe alınır.
 *
 * GÜVENLİK: kimlik yalnızca env'den okunur (EPIAS_USERNAME / EPIAS_PASSWORD).
 * Bilet Cache API ve KV'de DÜZ METİN saklanmaz: AES-GCM ile şifrelenir, anahtar
 * EPIAS_PASSWORD'dan HKDF-SHA-256 ile türetilir. Şifre çözülemezse yeniden giriş.
 * Kimlik, bilet ve yanıt gövdesi ASLA loglanmaz, yanıta ya da önbellek anahtarına
 * girmez; log yalnız neden kodu ve sayaç taşır.
 *
 * ÖNBELLEK: süreç belleği → Workers Cache API (caches.default, sentetik anahtar)
 * → varsa KV (env.PIYASA; isteğe bağlı). Anahtarlar ".invalid" alan adındadır:
 * dışarıdan hiçbir istekle eşleşemez.
 *
 * Bu dosya Pages Function DEĞİLDİR (onRequest* dışa aktarmaz, rota üretmez).
 */
import {
  donemlerAyrintili, ogelerCikar, sayfaBilgisi, aralikSinirlari, gunIzgarasi, veriVar, istanbulBugun, istanbulIso, gunEkle, gunFarki,
  tarihGecerli, donemGunu, AZAMI_ARALIK_GUN,
} from './dengesizlik.js';

const GIRIS_URL = 'https://giris.epias.com.tr/cas/v1/tickets';
const RAPOR_URL = 'https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf';

const ZAMAN_ASIMI_MS = 6000;       // tek bir üst-akış çağrısı (giriş ya da rapor)
const TGT_TTL_S = 100 * 60;        // resmî ömür 2 saat; 100 dk'da yenilenir
const KISA_TTL_S = 5 * 60;         // bugün / dün: yeni dönemler yayımlanıyor
const UZUN_TTL_S = 6 * 60 * 60;    // daha eski günler
const HATA_TTL_S = 60;             // anahtar bazında başarısızlık (ve bayat sunum) penceresi
const ENGEL_RED_S = 5 * 60;        // giriş reddedildi / rapor kalıcı 401: paylaşılan engel
const ENGEL_GECICI_S = 60;         // giriş ağ / zaman aşımı / 5xx: paylaşılan engel
const SAKLAMA_S = 24 * 60 * 60;    // bayat kopyanın tutulma süresi
const KV_YENILE_MS = 12 * 60 * 60 * 1000;
const ANAHTAR_KOKU = 'https://dengesizlik-onbellek.invalid/v1/';
const BELLEK_SINIRI = 512;         // seçilebilir gün + ay dilimi sayısından (~340) büyük
const AZAMI_SAYFA = 12;            // sayfalı yanıtta izlenecek en çok sayfa

/** Dakikalık üst-akış bütçesi (tüm anahtarlar için ortak). */
export const BUTCE = Object.freeze({ rapor: 12, giris: 2 });

const bellek = new Map();   // anahtar → {kayit, son}
const ucusta = new Map();   // anahtar → sürmekte olan çekim (aynı süreçte tek istek)
let biletBellek = null;     // {tgt, taze} — yalnız süreç belleğinde düz metin
let biletUcus = null;       // sürmekte olan giriş (tek-uçuş)
let butceBellek = { dakika: -1, rapor: 0, giris: 0 };
let butceLogDakika = -1;
/** İç sayaçlar (değer taşımaz; test ve teşhis için). */
export const sayaclar = { cakisma: 0, butceAsimi: 0, kisaDevre: 0 };

/** Yalnız testler için: süreç belleğini boşaltır. */
export function _bellekTemizle() {
  bellek.clear(); ucusta.clear();
  biletBellek = null; biletUcus = null;
  butceBellek = { dakika: -1, rapor: 0, giris: 0 }; butceLogDakika = -1;
  sayaclar.cakisma = 0; sayaclar.butceAsimi = 0; sayaclar.kisaDevre = 0;
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

// ------------------------------------------------------------------- bütçe --

/**
 * Dakikalık üst-akış bütçesinden bir birim alır; bütçe dolduysa false.
 * Sayaç süreç belleğinde ve Cache API'de tutulur (aynı veri merkezindeki
 * süreçler arasında paylaşılır; atomik değildir, üst sınır yaklaşık tutulur).
 */
async function butceAl(ctx, s, tur) {
  const dakika = Math.floor(s.simdi() / 60000);
  if (butceBellek.dakika !== dakika) butceBellek = { dakika, rapor: 0, giris: 0 };
  const dolu = () => {
    if (butceBellek[tur] < BUTCE[tur]) return false;
    sayaclar.butceAsimi++;
    if (butceLogDakika !== dakika) { butceLogDakika = dakika; console.error('dengesizlik: dakikalık üst-akış bütçesi doldu —', tur); }
    return true;
  };
  if (dolu()) return false;
  const anahtar = `${ANAHTAR_KOKU}butce/${dakika}`;
  if (s.cache) {
    try {
      const r = await s.cache.match(anahtar);
      const ortak = r ? await r.json() : null;
      if (ortak) for (const t of ['rapor', 'giris']) if (Number.isFinite(ortak[t]) && ortak[t] > butceBellek[t]) butceBellek[t] = ortak[t];
    } catch (e) { /* sayaç okunamadıysa süreç sayacı geçerli */ }
    if (dolu()) return false;
  }
  butceBellek[tur]++;
  if (s.cache) {
    const govde = JSON.stringify({ rapor: butceBellek.rapor, giris: butceBellek.giris });
    arkaPlan(ctx, (async () => { await s.cache.put(anahtar, new Response(govde, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=120' } })); })());
  }
  return true;
}

// ----------------------------------------------------- paylaşılan engel ----

/** Giriş (ya da kalıcı rapor 401) engeli tazeyse neden kodu; değilse null. */
async function engelOku(env, s) {
  const k = await oku(env, s, 'engel');
  return k && Number.isFinite(k.taze) && s.simdi() < k.taze && k.deger && typeof k.deger.neden === 'string' ? k.deger.neden : null;
}

function engelYaz(env, ctx, s, neden, sureS) {
  const an = s.simdi();
  return yaz(env, ctx, s, 'engel', { deger: { neden }, taze: an + sureS * 1000, yazildi: an }, sureS, true);
}

// -------------------------------------------------------------------- bilet --

const kodlayici = new TextEncoder();
const cozucu = new TextDecoder();
const b64 = (bayt) => { let s = ''; for (const b of bayt) s += String.fromCharCode(b); return btoa(s); };
const b64Coz = (metin) => Uint8Array.from(atob(metin), (c) => c.charCodeAt(0));

/** AES-GCM anahtarı: EPIAS_PASSWORD → HKDF-SHA-256. */
async function sifreAnahtari(env) {
  const ham = await crypto.subtle.importKey('raw', kodlayici.encode(String(env.EPIAS_PASSWORD)), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: kodlayici.encode('voltage.com.tr/dengesizlik-maliyeti'), info: kodlayici.encode('epias-tgt-v1') },
    ham, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

async function biletSifrele(env, tgt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const veri = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await sifreAnahtari(env), kodlayici.encode(tgt));
  return { iv: b64(iv), veri: b64(new Uint8Array(veri)) };
}

/** Çözülemezse (parola değişti, kayıt bozuk) null: çağıran yeniden giriş yapar. */
async function biletCoz(env, sifreli) {
  try {
    if (!sifreli || typeof sifreli.iv !== 'string' || typeof sifreli.veri !== 'string') return null;
    const duz = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64Coz(sifreli.iv) }, await sifreAnahtari(env), b64Coz(sifreli.veri));
    const tgt = cozucu.decode(duz);
    return /^TGT-[A-Za-z0-9._-]{6,}$/.test(tgt) ? tgt : null;
  } catch (e) {
    return null;
  }
}

function biletAyikla(metin, konum) {
  for (const kaynak of [metin, konum]) {
    if (typeof kaynak !== 'string') continue;
    const m = /TGT-[A-Za-z0-9._-]{6,}/.exec(kaynak);
    if (m) return m[0];
  }
  return null;
}

/**
 * → {tgt} | {hata}
 * gecersiz: rapor ucunun az önce reddettiği bilet (varsa). Verilirse önbellekteki
 * aynı bilet kullanılmaz; başka bir istek bileti çoktan yenilediyse o kullanılır.
 */
async function biletAl(env, ctx, s, gecersiz) {
  const simdi = s.simdi();
  if (biletBellek && simdi < biletBellek.taze && biletBellek.tgt !== gecersiz) return { tgt: biletBellek.tgt };
  if (gecersiz && biletBellek && biletBellek.tgt === gecersiz) biletBellek = null;
  if (!gecersiz) {
    const k = await oku(env, s, 'tgt');
    if (k && Number.isFinite(k.taze) && s.simdi() < k.taze) {
      const tgt = await biletCoz(env, k.sifreli);
      if (tgt) { biletBellek = { tgt, taze: k.taze }; return { tgt }; }
    }
    // Biz beklerken başka bir istek girişi tamamlamış olabilir.
    if (biletBellek && s.simdi() < biletBellek.taze) return { tgt: biletBellek.tgt };
  }
  // Tek-uçuş: eşzamanlı istekler aynı girişi bekler.
  if (biletUcus) return biletUcus;
  biletUcus = (async () => {
    if (!(await butceAl(ctx, s, 'giris'))) return { hata: 'butce' };
    let sonuc;
    try {
      sonuc = await sureli(s, async (signal) => {
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
    } catch (e) {
      sonuc = { hata: e && e.message === 'zaman-asimi' ? 'giris-zaman-asimi' : 'giris-ag' };
    }
    if (sonuc.hata) {
      // Paylaşılan olumsuz önbellek: bu süre boyunca HİÇBİR anahtar için giriş denenmez.
      engelYaz(env, ctx, s, sonuc.hata, sonuc.hata === 'giris-reddedildi' ? ENGEL_RED_S : ENGEL_GECICI_S);
      return sonuc;
    }
    const an = s.simdi();
    const taze = an + TGT_TTL_S * 1000;
    biletBellek = { tgt: sonuc.tgt, taze };
    try {
      // Kalıcı katmanlara yalnız şifreli hâli yazılır.
      yaz(env, ctx, s, 'tgt', { sifreli: await biletSifrele(env, sonuc.tgt), taze, yazildi: an }, TGT_TTL_S, true);
    } catch (e) { /* şifreleme yoksa bilet yalnız süreç belleğinde kalır */ }
    return { tgt: sonuc.tgt };
  })();
  try { return await biletUcus; } finally { biletUcus = null; }
}

// -------------------------------------------------------------------- rapor --

/** → {ogeler} | {hata, kisaDevre?} */
async function raporCek(env, ctx, s, bas, bit) {
  const engel = await engelOku(env, s);
  if (engel) { sayaclar.kisaDevre++; return { hata: engel, kisaDevre: true }; }

  const sinirlar = aralikSinirlari(bas, bit);
  // → {durum: HTTP kodu} | {ogeler, sayfa} | {hata}
  const istek = async (tgt, sayfa) => {
    if (!(await butceAl(ctx, s, 'rapor'))) return { hata: 'butce', kisaDevre: true };
    try {
      return await sureli(s, async (signal) => {
        const r = await s.fetch(RAPOR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', TGT: tgt },
          body: JSON.stringify(sayfa ? { ...sinirlar, page: sayfa } : sinirlar),
          signal,
        });
        if (!r.ok) return { durum: r.status };
        let j;
        try { j = await r.json(); } catch (e) { return { hata: 'bicim' }; }
        const ogeler = ogelerCikar(j);
        return ogeler === null ? { hata: 'bicim' } : { ogeler, sayfa: sayfaBilgisi(j) };
      });
    } catch (e) {
      return { hata: e && e.message === 'zaman-asimi' ? 'zaman-asimi' : 'ag' };
    }
  };
  const yetkisiz = (x) => x.durum === 401 || x.durum === 403;

  let b = await biletAl(env, ctx, s, null);
  if (b.hata) return { hata: b.hata, kisaDevre: b.hata === 'butce' };
  let x = await istek(b.tgt, null);
  if (yetkisiz(x)) {
    // Önbellekteki bilet geçersizleşmiş olabilir: BİR kez yenile, bir kez daha dene.
    b = await biletAl(env, ctx, s, b.tgt);
    if (b.hata) return { hata: b.hata, kisaDevre: b.hata === 'butce' };
    x = await istek(b.tgt, null);
    if (yetkisiz(x)) {
      // Taze biletle de 401: hesap/yetki sorunu. Giriş döngüsüne girilmez.
      biletBellek = null;
      engelYaz(env, ctx, s, 'servis-yetki', ENGEL_RED_S);
      return { hata: 'servis-yetki' };
    }
  }
  if (x.hata) return x;
  if (x.durum) return { hata: 'servis-hata' };

  // Sayfalama: page.total gelen öğe sayısından büyükse kalan sayfalar çekilir.
  // Tamamlanamazsa 'eksik': kesik liste "yayımlanmadı" gibi SUNULMAZ.
  let ogeler = x.ogeler;
  const sf = x.sayfa;
  if (sf && sf.total > ogeler.length) {
    if (!(sf.size > 0)) return { hata: 'eksik' };
    const sayfaSayisi = Math.ceil(sf.total / sf.size);
    if (sayfaSayisi > AZAMI_SAYFA) return { hata: 'eksik' };
    for (let n = sf.number + 1; n <= sf.number + sayfaSayisi - 1 && ogeler.length < sf.total; n++) {
      const y = await istek(b.tgt, { number: n, size: sf.size });
      if (y.hata === 'butce') return { hata: 'eksik', kisaDevre: true };
      if (y.hata || y.durum || !y.ogeler.length) return { hata: 'eksik' };
      ogeler = ogeler.concat(y.ogeler);
    }
    if (ogeler.length < sf.total) return { hata: 'eksik' };
  }
  return { ogeler };
}

/** Çekim + normalleştirme + önbelleğe yazım. Fırlatmaz. */
async function cekVeYaz(env, ctx, s, anahtar, bas, bit, bugun, kayit, eski) {
  try {
    const c = await raporCek(env, ctx, s, bas, bit);
    let neden = c.hata || null;
    let liste = null;
    if (!neden) {
      const a = donemlerAyrintili(c.ogeler);
      if (a.cokme) neden = 'bicim'; // bir günün satırları tek döneme çöktü: tarih/saat biçimi çözülemedi
      else {
        liste = a.donemler.filter((d) => { const g = donemGunu(d); return g >= bas && g <= bit; });
        if (a.cakisma) {
          sayaclar.cakisma += a.cakisma;
          // Yalnız sayaç ve tarih aralığı; değer loglanmaz.
          console.error('dengesizlik: çakışan yinelenen satır —', a.cakisma, 'dönem', bas, bit);
        }
        if (!veriVar(liste)) neden = 'bos';
      }
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
    // Kısa devre (paylaşılan engel / bütçe) zaten kendi yerinde loglandı ve
    // anahtar bazında kayıt gerektirmez: süresi dolunca ilk istek yeniden dener.
    if (c.kisaDevre) return eski ? { ...eski, bayat: true, neden } : { durum: 'yok', neden };
    // Kimlik, bilet ya da gövde loglanmaz: yalnız neden kodu.
    console.error('dengesizlik: EPİAŞ verisi alınamadı —', neden);
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
  } catch (e) {
    console.error('dengesizlik: çekim beklenmeyen hata —', e && e.name);
    return eski ? { ...eski, bayat: true, neden: 'hata' } : { durum: 'yok', neden: 'hata' };
  }
}

const SURE_DOLDU = Symbol('sure');

/**
 * Bir tarih parçası (gün ya da ay dilimi) için önbellekli çekim.
 * → {durum:'veri', donemler, cekildi, bayat?, neden?} | {durum:'yok', neden}
 */
async function parcaGetir(env, ctx, s, anahtar, bas, bit, bugun) {
  const kayit = await oku(env, s, anahtar);
  if (kayit && s.simdi() < kayit.taze) return kayit.deger;
  const eskiHam = kayit ? (kayit.deger && kayit.deger.durum === 'veri' ? kayit.deger : kayit.eski || null) : null;
  const eski = eskiHam ? { durum: 'veri', donemler: eskiHam.donemler, cekildi: eskiHam.cekildi } : null;
  const yedek = (neden) => (eski ? { ...eski, bayat: true, neden } : { durum: 'yok', neden });
  if (s.yalnizOnbellek) return yedek('onbellek-yok');

  let is = ucusta.get(anahtar);
  if (!is) {
    is = cekVeYaz(env, ctx, s, anahtar, bas, bit, bugun, kayit, eski);
    ucusta.set(anahtar, is);
    is.then(() => { if (ucusta.get(anahtar) === is) ucusta.delete(anahtar); });
  }
  if (!s.sureMs) return is;
  // Toplam süre sınırı: aşılırsa bayat/bekleme döner, çekim arka planda sürer.
  let zamanlayici;
  const sonuc = await Promise.race([is, new Promise((coz) => { zamanlayici = setTimeout(() => coz(SURE_DOLDU), s.sureMs); })]);
  clearTimeout(zamanlayici);
  if (sonuc !== SURE_DOLDU) return sonuc;
  arkaPlan(ctx, is);
  return yedek('sure');
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
