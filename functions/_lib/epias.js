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
 *   - bayat:true → güncel veri şu an alınamadı (hata, bütçe ya da süre sınırı); dönen veri daha önce
 *     EPİAŞ'tan alınmış gerçek veridir, "cekildi" o çekimin zamanıdır (SON SENKRON).
 *   - secenek.sureMs: toplam süre sınırı. Aşılırsa bayat ya da 'yok' (neden 'sure')
 *     döner; çekim ctx.waitUntil ile arka planda tamamlanır ve önbelleğe yazılır.
 *   - secenek.yalnizOnbellek: üst-akışa HİÇ gidilmez (HEAD istekleri).
 *
 * ÜST-AKIŞ KORUMASI (anonim ziyaretçi EPİAŞ hesabını yoramaz; aynı hesap ana
 * sayfadaki PTF'yi de besler, kilitlenmesi orayı da düşürür):
 *   1. Bilet alımı tek-uçuş: eşzamanlı istekler tek girişi bekler.
 *   2. Giriş hatası paylaşılan olumsuz önbellektedir. Reddedilen giriş (400/401/403)
 *      BÜYÜYEN aralıkla yeniden denenir: 5 dk → 30 dk → 2 sa (üst sınır). Ağ / zaman
 *      aşımı / 5xx → 60 sn. Bu sürede hiçbir anahtar için giriş denenmez. Başarılı
 *      girişte ya da kimlik değişince (HKDF parmak izi; sahibi parolayı düzeltti)
 *      engel hemen kalkar.
 *   3. Rapor 401 dönerse bilet BİR kez yenilenir; yine 401 ise aynı büyüyen engel
 *      devreye girer (giriş döngüsü yok).
 *   4. Küresel dakikalık bütçe: en çok 12 rapor isteği + 2 giriş (süreç belleği +
 *      Cache API sayacı). Rapor bütçesinin 4'ü BUGÜN ve DÜN için ayrılmıştır: eski
 *      günler ve aralıklar dakikada en çok 8 istek kullanabilir; eski günleri tarayan
 *      biri güncel sayfayı aç bırakamaz. Aşılınca EPİAŞ'a gidilmez; bayat ya da
 *      bekleme döner.
 *   5. Başarısızlık anahtar bazında BÜYÜYEN aralıkla önbelleğe alınır: 60 sn → 5 dk →
 *      30 dk (başarıda sıfırlanır). Sürekli hata veren bir aralık adım başına en çok
 *      bir üst-akış birimi harcar.
 *   6. Sayfalı bir çekim bütçe ya da süre yüzünden yarıda kalırsa tamamlanan sayfalar
 *      kısa süre saklanır; sonraki deneme baştan başlamaz, kaldığı sayfadan sürer.
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
const HATA_ADIMLARI_S = [60, 5 * 60, 30 * 60];        // anahtar bazında başarısızlık: büyüyen bekleme
const HATA_SAKLAMA_S = 2 * 60 * 60;                  // hata sayacının hatırlanma süresi
const ENGEL_RED_ADIMLARI_S = [5 * 60, 30 * 60, 2 * 60 * 60]; // giriş reddedildi / rapor kalıcı 401
const ENGEL_SAKLAMA_S = 4 * 60 * 60;                 // engel adımının hatırlanma süresi
const ENGEL_GECICI_S = 60;         // giriş ağ / zaman aşımı / 5xx: paylaşılan engel
const YARIM_TTL_S = 10 * 60;       // yarıda kalan sayfalı çekimin tamamlanan sayfaları
const SAKLAMA_S = 24 * 60 * 60;    // bayat kopyanın tutulma süresi
const KV_YENILE_MS = 12 * 60 * 60 * 1000;
const ANAHTAR_KOKU = 'https://dengesizlik-onbellek.invalid/v1/';
const BELLEK_SINIRI = 512;         // seçilebilir gün + ay dilimi sayısından (~340) büyük
const AZAMI_SAYFA = 12;            // sayfalı yanıtta izlenecek en çok sayfa
// Paylaşılan (tek-uçuş) bir işe katılmanın azami yaşı. Workers'ta bir isteğin başlattığı
// G/Ç, o istek iptal olursa (istemci bağlantıyı keserse) hiç tamamlanmayabilir; bu süreden
// eski bir uçuş "asılı" sayılır ve yenisi başlatılır (kalıcı kilitlenme olmaz).
const UCUS_AZAMI_MS = 20000;

/** Dakikalık üst-akış bütçesi (tüm anahtarlar için ortak). */
export const BUTCE = Object.freeze({ rapor: 12, raporEski: 8, giris: 2 });

const bellek = new Map();   // anahtar → {kayit, son}
const ucusta = new Map();   // anahtar → sürmekte olan çekim (aynı süreçte tek istek)
let biletBellek = null;     // {tgt, taze} — yalnız süreç belleğinde düz metin
let biletUcus = null;       // sürmekte olan giriş (tek-uçuş): {is, bas}
let butceBellek = { dakika: -1, rapor: 0, raporEski: 0, giris: 0 };
let butceLogDakika = -1;
let parmakBellek = null;    // {kimlik, deger} — kimlik parmak izi (süreç başına bir kez türetilir)
/** İç sayaçlar (değer taşımaz; test ve teşhis için). */
export const sayaclar = { cakisma: 0, butceAsimi: 0, kisaDevre: 0 };

/** Yalnız testler için: süreç belleğini boşaltır. */
export function _bellekTemizle() {
  bellek.clear(); ucusta.clear();
  biletBellek = null; biletUcus = null;
  butceBellek = { dakika: -1, rapor: 0, raporEski: 0, giris: 0 }; butceLogDakika = -1;
  parmakBellek = null;
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
async function oku(env, s, anahtar, kvsiz) {
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
  if (!kvsiz && env && env.PIYASA && typeof env.PIYASA.get === 'function') {
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
 * tur: 'giris' | 'rapor'. Rapor için oncelikli = bugün ya da dünün tek gün isteği.
 * Öncelikli OLMAYAN istekler (eski günler, aralıklar) dakikada en çok BUTCE.raporEski
 * birim kullanabilir; kalan pay (rapor − raporEski) bugün ve dün için ayrılmıştır.
 * Sayaç süreç belleğinde ve Cache API'de tutulur (aynı veri merkezindeki
 * süreçler arasında paylaşılır; atomik değildir, üst sınır yaklaşık tutulur).
 */
async function butceAl(ctx, s, tur, oncelikli) {
  const dakika = Math.floor(s.simdi() / 60000);
  if (butceBellek.dakika !== dakika) butceBellek = { dakika, rapor: 0, raporEski: 0, giris: 0 };
  const dolu = () => {
    const d = tur === 'giris' ? butceBellek.giris >= BUTCE.giris
      : butceBellek.rapor >= BUTCE.rapor || (!oncelikli && butceBellek.raporEski >= BUTCE.raporEski);
    if (!d) return false;
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
      if (ortak) for (const t of ['rapor', 'raporEski', 'giris']) if (Number.isFinite(ortak[t]) && ortak[t] > butceBellek[t]) butceBellek[t] = ortak[t];
    } catch (e) { /* sayaç okunamadıysa süreç sayacı geçerli */ }
    if (dolu()) return false;
  }
  if (tur === 'giris') butceBellek.giris++;
  else { butceBellek.rapor++; if (!oncelikli) butceBellek.raporEski++; }
  if (s.cache) {
    const govde = JSON.stringify({ rapor: butceBellek.rapor, raporEski: butceBellek.raporEski, giris: butceBellek.giris });
    arkaPlan(ctx, (async () => { await s.cache.put(anahtar, new Response(govde, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=120' } })); })());
  }
  return true;
}

// ----------------------------------------------------- paylaşılan engel ----

/**
 * Kimlik parmak izi: EPIAS_PASSWORD'dan (bilgi alanında kullanıcı adıyla) HKDF-SHA-256 ile
 * türetilen 64 bit. Engel kaydına yazılır; kimlik değişince (sahibi parolayı ya da kullanıcı
 * adını düzeltti) eski engel geçersiz sayılır ve giriş HEMEN denenir. Parola geri elde edilemez.
 */
async function kimlikParmagi(env) {
  const kimlik = `${env.EPIAS_USERNAME}\n${env.EPIAS_PASSWORD}`;
  if (parmakBellek && parmakBellek.kimlik === kimlik) return parmakBellek.deger;
  let deger = '';
  try {
    const ham = await crypto.subtle.importKey('raw', kodlayici.encode(String(env.EPIAS_PASSWORD)), 'HKDF', false, ['deriveBits']);
    const bit = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: kodlayici.encode('voltage.com.tr/dengesizlik-maliyeti'), info: kodlayici.encode(`epias-parmak-v1:${env.EPIAS_USERNAME}`) }, ham, 64,
    );
    deger = b64(new Uint8Array(bit));
  } catch (e) { /* türetilemezse parmak izi boş kalır: engel kimlikten bağımsız işler */ }
  parmakBellek = { kimlik, deger };
  return deger;
}

/** Bu kimliğe ait engel kaydı (taze olsun olmasın); yoksa null. */
async function engelKaydi(env, s) {
  const k = await oku(env, s, 'engel');
  if (!k) return null;
  return (k.parmak || '') === (await kimlikParmagi(env)) ? k : null;
}

/** Giriş (ya da kalıcı rapor 401) engeli tazeyse neden kodu; değilse null. */
async function engelOku(env, s) {
  const k = await engelKaydi(env, s);
  return k && Number.isFinite(k.taze) && s.simdi() < k.taze && k.deger && typeof k.deger.neden === 'string' ? k.deger.neden : null;
}

/**
 * kalici: reddedilen giriş / taze biletle de 401 → büyüyen aralık (5 dk → 30 dk → 2 sa).
 * Geçici hatalar (ağ, zaman aşımı, 5xx) 60 sn bekler ve adımı değiştirmez.
 */
async function engelYaz(env, ctx, s, neden, kalici) {
  const an = s.simdi();
  const onceki = await engelKaydi(env, s);
  const eskiAdim = onceki && Number.isFinite(onceki.adim) ? onceki.adim : 0;
  const adim = kalici ? eskiAdim + 1 : eskiAdim;
  const sureS = kalici ? ENGEL_RED_ADIMLARI_S[Math.min(adim, ENGEL_RED_ADIMLARI_S.length) - 1] : ENGEL_GECICI_S;
  return yaz(env, ctx, s, 'engel', { deger: { neden }, taze: an + sureS * 1000, yazildi: an, adim, parmak: await kimlikParmagi(env) }, adim ? ENGEL_SAKLAMA_S : sureS, true);
}

/** Başarılı girişte engel ve adım sayacı sıfırlanır. */
async function engelTemizle(env, ctx, s) {
  const an = s.simdi();
  return yaz(env, ctx, s, 'engel', { deger: null, taze: 0, yazildi: an, adim: 0, parmak: await kimlikParmagi(env) }, 60, true);
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
  // Tek-uçuş: eşzamanlı istekler aynı girişi bekler (asılı kalmış eski uçuş hariç).
  if (biletUcus && Date.now() - biletUcus.bas < UCUS_AZAMI_MS) return biletUcus.is;
  const ucus = { bas: Date.now(), is: null };
  ucus.is = (async () => {
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
      await engelYaz(env, ctx, s, sonuc.hata, sonuc.hata === 'giris-reddedildi');
      return sonuc;
    }
    await engelTemizle(env, ctx, s);
    const an = s.simdi();
    const taze = an + TGT_TTL_S * 1000;
    biletBellek = { tgt: sonuc.tgt, taze };
    try {
      // Kalıcı katmanlara yalnız şifreli hâli yazılır.
      yaz(env, ctx, s, 'tgt', { sifreli: await biletSifrele(env, sonuc.tgt), taze, yazildi: an }, TGT_TTL_S, true);
    } catch (e) { /* şifreleme yoksa bilet yalnız süreç belleğinde kalır */ }
    return { tgt: sonuc.tgt };
  })();
  biletUcus = ucus;
  // Başlatan istek erken dönse ya da istemci bağlantıyı kesse de giriş tamamlansın.
  arkaPlan(ctx, ucus.is);
  try { return await ucus.is; } finally { if (biletUcus === ucus) biletUcus = null; }
}

// -------------------------------------------------------------------- rapor --

/**
 * → {ogeler} | {hata, kisaDevre?}
 * anahtar: önbellek anahtarı (yarıda kalan sayfalı çekim bu anahtarla saklanır).
 * oncelikli: bugün ya da dünün tek gün isteği (bütçenin ayrılmış payını kullanabilir).
 */
async function raporCek(env, ctx, s, anahtar, bas, bit, oncelikli) {
  const engel = await engelOku(env, s);
  if (engel) { sayaclar.kisaDevre++; return { hata: engel, kisaDevre: true }; }

  const sinirlar = aralikSinirlari(bas, bit);
  // → {durum: HTTP kodu} | {ogeler, sayfa} | {hata}
  const istek = async (tgt, sayfa) => {
    if (!(await butceAl(ctx, s, 'rapor', oncelikli))) return { hata: 'butce', kisaDevre: true };
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
  let yenilendi = false;
  // Tek sayfa isteği; 401'de bilet (çekim başına) BİR kez yenilenir.
  const cagir = async (sayfa) => {
    let x = await istek(b.tgt, sayfa);
    if (yetkisiz(x) && !yenilendi) {
      // Önbellekteki bilet geçersizleşmiş olabilir: BİR kez yenile, bir kez daha dene.
      yenilendi = true;
      b = await biletAl(env, ctx, s, b.tgt);
      if (b.hata) return { hata: b.hata, kisaDevre: b.hata === 'butce' };
      x = await istek(b.tgt, sayfa);
    }
    if (yetkisiz(x)) {
      // Taze biletle de 401: hesap/yetki sorunu. Giriş döngüsüne girilmez.
      biletBellek = null;
      await engelYaz(env, ctx, s, 'servis-yetki', true);
      return { hata: 'servis-yetki' };
    }
    if (x.durum) return { hata: 'servis-hata' };
    return x;
  };

  // Yarıda kalmış sayfalı çekim varsa kaldığı sayfadan sürer (tamamlanan sayfalar yeniden istenmez).
  const yarimAnahtar = 'yarim/' + anahtar;
  const yarimYaz = (deger, sureS) => { const an = s.simdi(); return yaz(env, ctx, s, yarimAnahtar, { deger, taze: an + sureS * 1000, yazildi: an }, sureS, false); };
  let ogeler, sf, sonraki;
  const yarim = await oku(env, s, yarimAnahtar, true);
  const y0 = yarim && s.simdi() < yarim.taze ? yarim.deger : null;
  if (y0 && Array.isArray(y0.ogeler) && y0.sf && y0.sf.size > 0 && Number.isFinite(y0.sonraki)) {
    ({ ogeler, sf, sonraki } = y0);
  } else {
    const x = await cagir(null);
    if (x.hata) return x;
    ogeler = x.ogeler;
    sf = x.sayfa;
    if (!sf || sf.total <= ogeler.length) return { ogeler };
    // Sayfalama: page.total gelen öğe sayısından büyükse kalan sayfalar çekilir.
    // Tamamlanamazsa 'eksik': kesik liste "yayımlanmadı" gibi SUNULMAZ.
    if (!(sf.size > 0)) return { hata: 'eksik' };
    if (Math.ceil(sf.total / sf.size) > AZAMI_SAYFA) return { hata: 'eksik' };
    sonraki = sf.number + 1;
    yarimYaz({ ogeler, sf, sonraki }, YARIM_TTL_S);
  }
  const sonSayfa = sf.number + Math.ceil(sf.total / sf.size) - 1;
  for (let n = sonraki; n <= sonSayfa && ogeler.length < sf.total; n++) {
    const y = await cagir({ number: n, size: sf.size });
    // Bütçe doldu: tamamlanan sayfalar saklı kalır, sonraki deneme buradan sürer.
    if (y.hata === 'butce') return { hata: 'eksik', kisaDevre: true };
    if (y.hata === 'servis-yetki' || (y.hata && y.hata.startsWith('giris'))) return y;
    if (y.hata || !y.ogeler.length) return { hata: 'eksik' };
    // Sunucu istenen sayfayı döndürdüğünü KENDİSİ söylemeli: page parametresini yok sayıp
    // aynı ilk sayfayı yineleyen bir yanıt "tamamlandı" sayılmaz. Toplam da değişmemiş olmalı.
    if (!y.sayfa || y.sayfa.number !== n || y.sayfa.total !== sf.total) { yarimYaz(null, 1); return { hata: 'eksik' }; }
    ogeler = ogeler.concat(y.ogeler);
    yarimYaz({ ogeler, sf, sonraki: n + 1 }, YARIM_TTL_S);
  }
  yarimYaz(null, 1); // tamamlandı ya da tutarsız: yarım kayıt bir daha kullanılmaz
  // Toplam, bildirilen sayıyla TAM eşleşmeli (eksik de fazla da kapalı başarısızlık).
  if (ogeler.length !== sf.total) return { hata: 'eksik' };
  return { ogeler };
}

/** Çekim + normalleştirme + önbelleğe yazım. Fırlatmaz. */
async function cekVeYaz(env, ctx, s, anahtar, bas, bit, bugun, kayit, eski) {
  try {
    // Öncelik: yalnız bugünün ve dünün tek gün istekleri (aralıklar ve eski günler değil).
    const oncelikli = anahtar.startsWith('gun/') && bas >= gunEkle(bugun, -1);
    const c = await raporCek(env, ctx, s, anahtar, bas, bit, oncelikli);
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
    // Büyüyen bekleme: art arda başarısızlıkta 60 sn → 5 dk → 30 dk (başarıda sıfırlanır).
    const hataSayisi = (kayit && Number.isFinite(kayit.hataSayisi) ? kayit.hataSayisi : 0) + 1;
    const bekleS = HATA_ADIMLARI_S[Math.min(hataSayisi, HATA_ADIMLARI_S.length) - 1];
    if (eski) {
      // Dürüstlük merdiveni: daha önce alınmış GERÇEK veri, kendi çekim zamanıyla.
      const deger = { ...eski, bayat: true, neden };
      const kalan = Math.max(bekleS, Math.floor(((kayit.yazildi || an) + SAKLAMA_S * 1000 - an) / 1000));
      yaz(env, ctx, s, anahtar, { deger, taze: an + bekleS * 1000, yazildi: kayit.yazildi || an, kvYazildi: kayit.kvYazildi || 0, eski, hataSonrasi: true, hataSayisi }, kalan, false);
      return deger;
    }
    const deger = { durum: 'yok', neden };
    yaz(env, ctx, s, anahtar, { deger, taze: an + bekleS * 1000, yazildi: an, hataSayisi }, HATA_SAKLAMA_S, false);
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

  let ucus = ucusta.get(anahtar);
  if (!ucus || Date.now() - ucus.bas >= UCUS_AZAMI_MS) {
    ucus = { bas: Date.now(), is: cekVeYaz(env, ctx, s, anahtar, bas, bit, bugun, kayit, eski) };
    ucusta.set(anahtar, ucus);
    const bu = ucus;
    bu.is.then(() => { if (ucusta.get(anahtar) === bu) ucusta.delete(anahtar); });
    // Başlatan istek erken dönse ya da istemci bağlantıyı kesse de çekim tamamlanıp önbelleğe yazılsın.
    arkaPlan(ctx, bu.is);
  }
  const is = ucus.is;
  if (!s.sureMs) return is;
  // Toplam süre sınırı: aşılırsa bayat/bekleme döner, çekim arka planda sürer.
  let zamanlayici;
  const sonuc = await Promise.race([is, new Promise((coz) => { zamanlayici = setTimeout(() => coz(SURE_DOLDU), s.sureMs); })]);
  clearTimeout(zamanlayici);
  if (sonuc !== SURE_DOLDU) return sonuc;
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
