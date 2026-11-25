/**
 * piyasa/v1 — epias-proxy için kendi kendine yeten piyasa verisi modülü.
 *
 * Mimari karar ve sözleşme: docs/epias-proxy/PIYASA-VERI-MIMARISI.md (§3 sözleşme, §4 yük politikası).
 * EPİAŞ uç bilgisi: docs/seo/DENGESIZLIK-KAYNAK-TEYIT.md ("Veri kaynağı").
 *   POST https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf
 *        gövde {startDate, endDate, page?} (ISO-8601, +03:00), başlık TGT
 *   POST https://giris.epias.com.tr/cas/v1/tickets (form username/password, Accept text/plain) → "TGT-…"
 * DOĞRULANMAYANLAR (savunmacı yazıldı): yanıt zarfı, endDate yorumu, istek başına aralık sınırı,
 * sayfalama varsayılanı, date/time alanlarının biçimi, bilet ömrü.
 *
 * Kaynak: website deposundaki functions/_lib/epias.js ve functions/_lib/dengesizlik.js'in EPİAŞ'a
 * bakan bölümleri buraya KOPYALANDI (website o kodu silecek; bu dosya tek başına çalışır).
 *
 * KANCA (mevcut proxy koduna eklenen satırlar; bkz. README.md):
 *   import { piyasaIstegi, piyasaZamanli } from './piyasa.js';
 *   fetch():     const piyasaYaniti = await piyasaIstegi(request, env, ctx); if (piyasaYaniti) return piyasaYaniti;
 *   scheduled(): ctx.waitUntil(piyasaZamanli(controller, env, ctx));
 *
 * DIŞA AKTARILANLAR
 *   piyasaIstegi(request, env, ctx, secenek?) → Response | null
 *     /piyasa ve /piyasa/* dışındaki her istek için null (ana yönlendirici devam eder; env'e,
 *     gövdeye, KV'ye dokunulmaz). ASLA fırlatmaz.
 *   piyasaZamanli(controller, env, ctx, secenek?) → Promise<void>   ASLA fırlatmaz.
 *   secenek: { fetch, simdi, kv, cache, epiasPost(url, govdeNesnesi) → Response,
 *              kullaniciDegiskeni, parolaDegiskeni, zamanAsimiMs, azamiAltIstek }
 *
 * YÜK POLİTİKASI (§4)
 *   - KV önce: her gün ayrı kayıt (piyasa:v1:gun:YYYY-MM-DD). Ziyaretçi isteği önce KV'yi okur.
 *   - Zamanlanmış görev (10 dk): bugün + dün TEK istekle tazelenir. Gece penceresinde (varsayılan
 *     02:00–05:59 İstanbul) her turda EN ÇOK BİR bakım işi: eksik 2026 günlerini ay ay doldurma →
 *     2–45 gün önceki günleri günde bir yeniden denetleme → daha eski günleri haftada bir doğrulama.
 *     Her iş tek "dilim"dir (ay içinde sabit gün parçası, varsayılan 8 gün; PIYASA_DILIM_GUN).
 *   - İstek yolunda EPİAŞ'a yalnız (a) KV'de olmayan gün için, (b) bugün/dün kaydı 15 dk'dan eski
 *     (zamanlanmış görev en az bir tur kaçırdı) ise gidilir; ikisi de tek-uçuş + dakikalık bütçe
 *     (zamanlanmış göreve 4 ayrılmış) + anahtar bazında büyüyen bekleme içinde.
 *   - KV'ye yalnız içerik değişince yazılır (içerik özeti "durum" kaydında). Son kontrol zamanı
 *     her turda tek "durum" kaydına yazılır (≤ 144 yazma/gün).
 *   - Çağrı başına G/Ç sayacı: fetch + KV + Cache API işlemlerinin TOPLAMI en çok 45 (ücretsiz plan
 *     50 alt istek varsayımı); bakım işi sığmayan günleri sonraki tura bırakır.
 *
 * DÜRÜSTLÜK: yayımlanmamış dönem null (asla 0, asla taşıma); çakışan yinelenen satır null + sayaç;
 * EPİAŞ'ın hiç döndürmediği dönem ızgarada null; dönem sayısı veriden (24 / 96); "tam" ve "bayat"
 * işaretleri. Eksik gün içeren aralık 503 döner (yarım dosya yok).
 *
 * GÜVENLİK: kimlik yalnız env'den. Bilet KV ve Cache API'de AES-GCM ile şifreli (anahtar parolanın
 * HKDF türevi). Okuma belirteci sabit süreli karşılaştırılır (SHA-256 özetleri üzerinde XOR), iki
 * yuva (döndürme). Kimlik, bilet, belirteç ve yanıt gövdesi ASLA loglanmaz, yanıta ya da önbellek
 * anahtarına girmez; log yalnız neden kodu ve sayaç taşır. CORS başlığı yok.
 */

// =============================================================== sabitler ==

export const SURUM = 1;
export const KAYNAK = 'EPİAŞ Şeffaflık Platformu — PTF, SMF ve SDF Listeleme';
const GIRIS_URL = 'https://giris.epias.com.tr/cas/v1/tickets';
const RAPOR_URL = 'https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf';

/** İstenebilen en erken gün ve en uzun aralık. */
export const ILK_GUN = '2026-01-01';
export const AZAMI_ARALIK_GUN = 31;

/** Türkiye kalıcı olarak UTC+3 (yaz saati uygulaması yok). */
const OFSET = '+03:00';
const OFSET_MS = 3 * 60 * 60 * 1000;

const ZAMAN_ASIMI_MS = 6000;                          // tek üst-akış çağrısı (giriş ya da rapor)
const TGT_TTL_S = 100 * 60;                           // resmî ömür 2 saat; 100 dk'da yenilenir
/** Dakikalık üst-akış bütçesi (§4): 10 rapor (4'ü zamanlanmış göreve ayrılmış) + 1 giriş. */
export const BUTCE = Object.freeze({ rapor: 10, zamanliAyrilan: 4, giris: 1 });
const HATA_ADIMLARI_S = [60, 5 * 60, 30 * 60];        // anahtar bazında başarısızlık: büyüyen bekleme
const HATA_ADIMLARI_ONCELIKLI_S = [60, 5 * 60];       // bugün+dün anahtarı: üst sınır 5 dk
const HATA_SAKLAMA_S = 2 * 60 * 60;
const ENGEL_RED_ADIMLARI_S = [5 * 60, 30 * 60, 2 * 60 * 60]; // giriş reddi / kalıcı 401: 5 dk → 30 dk → 2 sa
const ENGEL_SAKLAMA_S = 4 * 60 * 60;
const ENGEL_GECICI_S = 60;                            // ağ / zaman aşımı / 5xx
const ENGEL_GUVEN_MS = 60 * 1000;                     // engel kaydı bu süre bellekten okunur, sonra KV'den
const YARIM_TTL_S = 10 * 60;                          // yarıda kalan sayfalı çekim
const AZAMI_SAYFA = 12;
const UCUS_AZAMI_MS = 20000;                          // asılı kalmış tek-uçuşa katılma sınırı
const UCUS_ISARET_S = 20;                             // Cache API "çekim sürüyor" işareti

/** "bayat" pencereleri: bu süreden eski cekildi → bayat:true. */
export const PENCERE = Object.freeze({ son2Ms: 15 * 60 * 1000, uzlastirmaMs: 26 * 60 * 60 * 1000, eskiMs: 8 * 24 * 60 * 60 * 1000 });
const UZLASTIRMA_GUN = 45;
/** İstek yolunda bugün/dün yenilemesi yalnız kayıt bu süreden eskiyse (zamanlanmış görev bir tur kaçırdı). */
export const ISTEK_TAZELEME_MS = 15 * 60 * 1000;
const DOGRULAMA_ARALIGI_MS = 7 * 24 * 60 * 60 * 1000;
const YOK_TEKRAR_MS = 7 * 24 * 60 * 60 * 1000;        // EPİAŞ'ın veri döndürmediği gün en erken 7 gün sonra yeniden denenir
const CRON_ASGARI_MS = 5 * 60 * 1000;                 // iki zamanlanmış tur arası en kısa süre (çift tetiklemeye karşı)
const GECE_VARSAYILAN = [2, 6];                       // İstanbul saati [başlangıç, bitiş): 24 tur
/**
 * Dilim: bir takvim ayının içindeki sabit gün parçası (ay ay ilerlenir, her çağrı tek dilim normalleştirir).
 * Varsayılan 8 gün (ay = 4 parça, en çok 8 gün): ücretsiz planın 10 ms CPU sınırı varsayımı. node ölçümü
 * (olcum/cpu.mjs): 31 günlük ay normalleştiren gece turu medyan ~9 ms, p90 ~15–17 ms → sınırı aşar.
 * Ücretli planda PIYASA_DILIM_GUN=31 → ay başına tek istek.
 */
const DILIM_GUN_VARSAYILAN = 8;
/** İstek yolunda bir çağrının en çok kaç eksik dilimi EPİAŞ'tan tamamlayabileceği (CPU ve G/Ç sınırı). */
const ISTEK_AZAMI_DILIM = 2;
/** Çağrı başına G/Ç tavanı (fetch + KV + Cache API). Ücretsiz plan alt istek sınırı 50. */
export const AZAMI_ALT_ISTEK = 45;
const ISTEGE_BAGLI_PAY = 4;                           // isteğe bağlı (önbellek) işlemleri bu kadar boş yer bırakır
const BELLEK_GUN_SON2_MS = 60 * 1000;
const BELLEK_GUN_ESKI_MS = 10 * 60 * 1000;
const BELLEK_DURUM_MS = 30 * 1000;
const BELLEK_SINIRI = 512;
/** Okuma belirtecinin en kısa uzunluğu; daha kısası yapılandırılmamış sayılır (kapalı başarısızlık). */
export const ANAHTAR_EN_KISA = 32;

const KV_ON = 'piyasa:v1:';
export const KV_DURUM = KV_ON + 'durum';
export const kvGunAnahtari = (ymd) => `${KV_ON}gun:${ymd}`;
const CACHE_KOK = 'https://piyasa-modulu.invalid/v1/';

// ============================================================ süreç belleği ==

const bellekGun = new Map();   // ymd → {kayit, ozet, son}
let bellekDurum = null;        // {deger, son}
const ucusta = new Map();      // anahtar → {bas, is}
const kucuk = new Map();       // tgt / engel / geri/* / yarim/* → {kayit, son, okundu}
let biletBellek = null;        // {tgt, taze} — düz metin YALNIZ süreç belleğinde
let biletUcus = null;
let butceBellek = yeniButce(-1);
let parmakBellek = null;
let sonUstAkisDurumu = null;
const logAnahtarlari = new Set();

/** İç sayaçlar (değer taşımaz; /piyasa/v1/durum ve testler için; süreç başına). */
export const sayaclar = {
  cakisma: 0, butceAsimi: 0, kisaDevre: 0, altIstekSiniri: 0, ustAkis: 0, giris: 0,
  kvOkuma: 0, kvYazma: 0, kvHata: 0, bozukKayit: 0, yayimAzaldi: 0, istekYoluCekim: 0,
};

function yeniButce(dakika) { return { dakika, rapor: 0, raporIstek: 0, giris: 0, ortakOkundu: false, kirli: false }; }

/** Yalnız testler için: süreç belleğini boşaltır. */
export function _bellekTemizle() {
  bellekGun.clear(); bellekDurum = null; ucusta.clear(); kucuk.clear();
  biletBellek = null; biletUcus = null; butceBellek = yeniButce(-1); parmakBellek = null; sonUstAkisDurumu = null;
  logAnahtarlari.clear(); reddedilenBiletler.clear();
  for (const k of Object.keys(sayaclar)) sayaclar[k] = 0;
}

/** Log: yalnız sabit neden kodu + sayı/tarih. Değer, kimlik, bilet, belirteç, gövde ASLA. */
function log(kod, ...ek) {
  try { console.error('piyasa:', kod, ...ek.filter((x) => typeof x === 'number' || (typeof x === 'string' && /^[\w:./-]{0,40}$/.test(x)))); } catch (e) { /* yok say */ }
}
/** Aynı kodu süreç başına dakikada bir kez loglar. */
function logSeyrek(kod, dakika) {
  const a = `${kod}@${dakika}`;
  if (logAnahtarlari.has(a)) return;
  if (logAnahtarlari.size > 256) logAnahtarlari.clear();
  logAnahtarlari.add(a);
  log(kod);
}

// ============================================================ tarih yardımcıları ==

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

export function ymdGecerli(ymd) {
  const m = typeof ymd === 'string' ? YMD.exec(ymd) : null;
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1) return false;
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}
export function gunEkle(ymd, n) {
  const m = YMD.exec(ymd);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)).toISOString().slice(0, 10);
}
export function gunFarki(a, b) {
  const ma = YMD.exec(a), mb = YMD.exec(b);
  return Math.round((Date.UTC(+mb[1], +mb[2] - 1, +mb[3]) - Date.UTC(+ma[1], +ma[2] - 1, +ma[3])) / 86400000);
}
export function istanbulBugun(ms) { return new Date(ms + OFSET_MS).toISOString().slice(0, 10); }
export function istanbulIso(ms) { return new Date(ms + OFSET_MS).toISOString().slice(0, 19) + OFSET; }
function istanbulSaat(ms) { return new Date(ms + OFSET_MS).getUTCHours(); }
function gunBasiMs(ymd) { return Date.parse(`${ymd}T00:00:00${OFSET}`); }
function aySonu(ymd) { const [y, m] = ymd.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); }
const enKucuk = (a, b) => (a < b ? a : b);
const enBuyuk = (a, b) => (a > b ? a : b);

/** PIYASA_DILIM_GUN (1–31) ya da varsayılan. */
function dilimGunu(env) {
  const v = env && /^\d{1,2}$/.test(String(env.PIYASA_DILIM_GUN || '')) ? +env.PIYASA_DILIM_GUN : NaN;
  return v >= 1 && v <= 31 ? v : DILIM_GUN_VARSAYILAN;
}
/**
 * g gününü içeren dilim. Ay, round(uzunluk / n) parçaya bölünür; artan günler son parçaya eklenir
 * (n=8: 31 gün → 1–8, 9–16, 17–24, 25–31; n=10: 28 gün → 1–10, 11–20, 21–28). → {bas, bit (sinir ile kırpılmış), son}
 */
export function dilimBul(g, n, sinir) {
  const ayBasi = `${g.slice(0, 7)}-01`, aySon = aySonu(g);
  const uzunluk = +aySon.slice(8, 10), gun = +g.slice(8, 10);
  const adet = Math.max(1, Math.round(uzunluk / n)); // son parça en çok ~1,5 × n gün (Şubat, n=10 → 1–10, 11–20, 21–28)
  const k = Math.min(Math.floor((gun - 1) / n), adet - 1);
  const basGun = 1 + k * n, sonGun = k === adet - 1 ? uzunluk : (k + 1) * n;
  const bas = enBuyuk(gunEkle(ayBasi, basGun - 1), ILK_GUN);
  const son = gunEkle(ayBasi, sonGun - 1);
  return { bas, bit: sinir && son > sinir ? sinir : son, son };
}

export function aralikSinirlari(bas, bit) {
  // endDate günün son saat başıdır (yorum DOĞRULANMADI; dönen satırlar ayrıca istenen güne süzülür).
  return { startDate: `${bas}T00:00:00${OFSET}`, endDate: `${bit}T23:00:00${OFSET}` };
}

// =================================================== normalleştirme (kopya) ==

/** Yalnızca sonlu sayı ya da boş olmayan sayısal metin; null/''/[] ASLA 0 olmaz. */
export function sayi(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** EPİAŞ sistem yönü etiketi → 'acik' | 'fazla' | 'denge' | null. Yön ASLA PTF–SMF kıyasından çıkarılmaz. */
export function yonCoz(v) {
  if (typeof v !== 'string') return null;
  const s = v
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return null;
  if (/\bacigi?\b|\bacik\b|\bdeficit\b|\bshortage\b/.test(s)) return 'acik';
  if (/\bfazla(si)?\b|\bsurplus\b|\bexcess\b/.test(s)) return 'fazla';
  if (/^(sistem )?denge(de)?$|^dengede|^balanced?$|^in balance$|^balance$/.test(s)) return 'denge';
  return null;
}

/** EPİAŞ'ın ham yön metni (kırpılmış) ya da null. */
function yonHamCoz(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim().replace(/\s+/g, ' ');
  return s ? s.slice(0, 64) : null;
}

/** Yanıttan kalem listesi; zarf DOĞRULANMADI. Tanınmayan → null ([] ise []). */
export function ogelerCikar(j) {
  if (Array.isArray(j)) return j;
  if (!j || typeof j !== 'object') return null;
  const b = j.body;
  if (Array.isArray(b)) return b;
  if (b && typeof b === 'object') {
    if (Array.isArray(b.content)) return b.content;
    if (Array.isArray(b.items)) return b.items;
  }
  if (Array.isArray(j.items)) return j.items;
  if (Array.isArray(j.content)) return j.content;
  return null;
}

/** Sayfa bilgisi {number, size, total} ya da null (j.page ya da j.body.page). */
export function sayfaBilgisi(j) {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return null;
  const p = (j.page && typeof j.page === 'object' ? j.page : null) || (j.body && typeof j.body === 'object' && !Array.isArray(j.body) && j.body.page && typeof j.body.page === 'object' ? j.body.page : null);
  if (!p) return null;
  const total = sayi(p.total);
  if (total === null) return null;
  const number = sayi(p.number), size = sayi(p.size);
  return { number: number === null ? 1 : number, size: size === null ? 0 : size, total };
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?)?/;

function isoDakika(m) {
  const hh = +m[4], mm = +m[5];
  if (hh > 23 || mm > 59) return null;
  let dk = hh * 60 + mm;
  const of = m[7];
  if (of && of !== OFSET && of !== '+0300') {
    const r = of === 'Z' ? ['+', '00', '00'] : /^([+-])(\d{2}):?(\d{2})$/.exec(of).slice(1);
    const ofDk = (r[0] === '-' ? -1 : 1) * (+r[1] * 60 + +r[2]);
    dk = (((dk - ofDk + 180) % 1440) + 1440) % 1440;
  }
  return dk;
}

function isoGun(m) {
  if (!ymdGecerli(`${m[1]}-${m[2]}-${m[3]}`)) return null;
  if (m[4] === undefined || !m[7] || m[7] === OFSET || m[7] === '+0300') return `${m[1]}-${m[2]}-${m[3]}`;
  const of = m[7] === 'Z' ? '+00:00' : (m[7].includes(':') ? m[7] : m[7].slice(0, 3) + ':' + m[7].slice(3));
  const ms = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}${of}`);
  return Number.isFinite(ms) ? new Date(ms + OFSET_MS).toISOString().slice(0, 10) : null;
}

/** Kalemin zaman adayları {gun, dDk, tDk} ya da null (bkz. donemlerAyrintili). */
function zamanAdaylari(o) {
  const d = typeof o.date === 'string' ? ISO.exec(o.date.trim()) : null;
  const alan = [o.time, o.hour].find((x) => typeof x === 'string' && x.trim() !== '');
  const zs = alan ? alan.trim() : '';
  const zIso = zs ? ISO.exec(zs) : null;
  const zSaat = zs && !zIso ? /^(\d{1,2}):(\d{2})/.exec(zs) : null;
  let tDk = null;
  if (zIso && zIso[4] !== undefined) tDk = isoDakika(zIso);
  else if (zSaat) { const hh = +zSaat[1], mm = +zSaat[2]; if (hh <= 23 && mm <= 59) tDk = hh * 60 + mm; }
  let gun = d ? isoGun(d) : null;
  let dDk = null;
  if (gun && d[4] !== undefined) dDk = isoDakika(d);
  if (!gun && zIso && zIso[4] !== undefined) gun = isoGun(zIso);
  if (!gun) return null;
  if (dDk === null && tDk === null) dDk = 0;
  return { gun, dDk, tDk };
}

const iki = (n) => String(n).padStart(2, '0');
function basIso(ymd, dakika) { return `${ymd}T${iki(Math.floor(dakika / 60))}:${iki(dakika % 60)}:00${OFSET}`; }
const donemGunu = (d) => d.bas.slice(0, 10);
const donemDakikasi = (d) => +d.bas.slice(11, 13) * 60 + +d.bas.slice(14, 16);

const GECERLI_DK = [5, 10, 15, 20, 30, 60];
const DEGER_ALANLARI = ['ptf', 'smf', 'pozitif', 'negatif', 'yon'];
const ayniDeger = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : a === b);

/**
 * Ham kalemler → {donemler, cakisma, cokme}.
 *   donemler: sıralı, tekil {bas, dk, ptf, smf, pozitif, negatif, yon, yonHam}
 *   cakisma:  kopyaların FARKLI değer taşıdığı dönem sayısı (o dönem tümüyle null olur)
 *   cokme:    bir günün satırları tek döneme çöktü (tarih/saat biçimi çözülemedi)
 * Dönem başlangıcı: date ve time/hour alanlarından, gün içinde saat bileşeni DEĞİŞEN alan.
 * Dönem uzunluğu (dk): aynı gün içindeki ardışık başlangıçların en küçük farkı (varsayılan 60).
 */
export function donemlerAyrintili(hamOgeler) {
  const bos = { donemler: [], cakisma: 0, cokme: false };
  if (!Array.isArray(hamOgeler)) return bos;
  const gunler = new Map();
  for (const o of hamOgeler) {
    if (!o || typeof o !== 'object') continue;
    const z = zamanAdaylari(o);
    if (!z) continue;
    if (!gunler.has(z.gun)) gunler.set(z.gun, []);
    gunler.get(z.gun).push({ o, z });
  }
  const harita = new Map();
  const cakisan = new Set();
  let cokme = false;
  for (const [gun, satirlar] of gunler) {
    const farkliT = new Set(satirlar.map((x) => x.z.tDk).filter((v) => v !== null)).size;
    const farkliD = new Set(satirlar.map((x) => x.z.dDk).filter((v) => v !== null)).size;
    const gunAnahtarlari = new Set();
    for (const { o, z } of satirlar) {
      let dk;
      if (z.tDk === null) dk = z.dDk;
      else if (z.dDk === null) dk = z.tDk;
      else if (farkliT > farkliD) dk = z.tDk;
      else if (farkliD > farkliT) dk = z.dDk;
      else dk = z.tDk !== z.dDk && z.tDk === 0 ? z.dDk : z.tDk;
      const anahtar = basIso(gun, dk);
      gunAnahtarlari.add(anahtar);
      const yeni = {
        bas: anahtar, dk: 60, ptf: sayi(o.ptf), smf: sayi(o.smf), pozitif: sayi(o.positiveImbalance),
        negatif: sayi(o.negativeImbalance), yon: yonCoz(o.systemStatus), yonHam: yonHamCoz(o.systemStatus),
      };
      const eski = harita.get(anahtar);
      if (!eski) { harita.set(anahtar, yeni); continue; }
      for (const a of DEGER_ALANLARI) {
        if (yeni[a] === null) continue;
        if (eski[a] === null) eski[a] = yeni[a];
        else if (!ayniDeger(eski[a], yeni[a])) cakisan.add(anahtar);
      }
      if (eski.yonHam === null) eski.yonHam = yeni.yonHam;
    }
    if (satirlar.length >= 4 && gunAnahtarlari.size === 1 && cakisan.has([...gunAnahtarlari][0])) cokme = true;
  }
  for (const anahtar of cakisan) {
    const d = harita.get(anahtar);
    for (const a of DEGER_ALANLARI) d[a] = null; // hangi kopya doğru bilinemez: değer üretilmez
    d.yonHam = null;
  }
  const liste = [...harita.values()].sort((x, y) => (x.bas < y.bas ? -1 : x.bas > y.bas ? 1 : 0));
  const gunDk = new Map();
  for (let i = 1; i < liste.length; i++) {
    const g = donemGunu(liste[i]);
    if (donemGunu(liste[i - 1]) !== g) continue;
    const fark = donemDakikasi(liste[i]) - donemDakikasi(liste[i - 1]);
    if (fark > 0 && (!gunDk.has(g) || fark < gunDk.get(g))) gunDk.set(g, fark);
  }
  for (const d of liste) {
    const f = gunDk.get(donemGunu(d));
    d.dk = GECERLI_DK.includes(f) ? f : 60;
  }
  return { donemler: liste, cakisma: cakisan.size, cokme };
}

/** Hiç gerçek değer taşıyor mu? (tümü null dizi "veri" sayılmaz) */
export function veriVar(liste) {
  return Array.isArray(liste) && liste.some((d) => d.ptf !== null || d.smf !== null || d.pozitif !== null || d.negatif !== null);
}

/** Tek günün tam ızgarası: EPİAŞ'ın döndürmediği dönemler tümü null eklenir. Dönem sayısı = 1440 / dk. */
export function gunIzgarasi(ymd, liste) {
  const gun = (Array.isArray(liste) ? liste : []).filter((d) => donemGunu(d) === ymd);
  if (!gun.length) return [];
  const dk = gun[0].dk;
  const harita = new Map(gun.map((d) => [donemDakikasi(d), d]));
  const out = [];
  for (let m = 0; m < 1440; m += dk) {
    out.push(harita.get(m) || { bas: basIso(ymd, m), dk, ptf: null, smf: null, pozitif: null, negatif: null, yon: null, yonHam: null });
  }
  for (const d of gun) if (donemDakikasi(d) % dk !== 0) out.push(d);
  return out.sort((x, y) => (x.bas < y.bas ? -1 : 1));
}

/** Sözleşmedeki dönem alanları (beyaz liste; iç alan sızmaz). */
function donemCikti(p) {
  return { bas: p.bas, dk: p.dk, ptf: p.ptf, smf: p.smf, pozitif: p.pozitif, negatif: p.negatif, yon: p.yon, yonHam: p.yonHam };
}
const yayimSayisi = (donemler) => donemler.filter((p) => p.pozitif !== null && p.negatif !== null).length;

// ======================================================== çağrı bağlamı / G/Ç ==

function baglam(env, ctx, secenek, tur) {
  const s = secenek || {};
  const azami = Number.isFinite(s.azamiAltIstek) && s.azamiAltIstek >= 8 ? Math.floor(s.azamiAltIstek) : AZAMI_ALT_ISTEK;
  const kullaniciAdi = typeof s.kullaniciDegiskeni === 'string' ? s.kullaniciDegiskeni : 'EPIAS_USERNAME';
  const parolaAdi = typeof s.parolaDegiskeni === 'string' ? s.parolaDegiskeni : 'EPIAS_PASSWORD';
  return {
    env, ctx, tur,
    // tavan: normal işlemler (azami - 1); son "durum" yazımı için 1 birim her zaman ayrılır.
    io: { n: 0, azami: azami - 1, tavan: azami },
    fetch: typeof s.fetch === 'function' ? s.fetch : (u, i) => globalThis.fetch(u, i),
    epiasPost: typeof s.epiasPost === 'function' ? s.epiasPost : null,
    simdi: typeof s.simdi === 'function' ? s.simdi : () => Date.now(),
    kv: s.kv !== undefined ? s.kv : (env && env.PIYASA_KV) || null,
    cache: s.cache !== undefined ? s.cache : (typeof caches !== 'undefined' && caches && caches.default) || null,
    zamanAsimiMs: Number.isFinite(s.zamanAsimiMs) ? s.zamanAsimiMs : ZAMAN_ASIMI_MS,
    kullanici: env && typeof env[kullaniciAdi] === 'string' ? env[kullaniciAdi] : '',
    parola: env && typeof env[parolaAdi] === 'string' ? env[parolaAdi] : '',
    sonUstAkis: null,
  };
}

const kimlikVar = (c) => !!c.epiasPost || (c.kullanici !== '' && c.parola !== '');

function ioVar(c, n = 1) { return c.io.n + n <= c.io.azami; }
function ioAl(c, n = 1) {
  if (!ioVar(c, n)) { sayaclar.altIstekSiniri++; return false; }
  c.io.n += n;
  return true;
}
/** İsteğe bağlı işlem (önbellek): zorunlu işlemlere yer bırakır. */
const ioIstege = (c) => c.io.n + 1 <= c.io.azami - ISTEGE_BAGLI_PAY;

function arkaPlan(c, p) {
  const q = Promise.resolve(p).catch(() => {});
  if (c && c.ctx && typeof c.ctx.waitUntil === 'function') { try { c.ctx.waitUntil(q); } catch (e) { /* yok say */ } }
  return q;
}

/** KV okuma → değer | null (yok) | undefined (okunamadı / G/Ç sınırı). */
async function kvOku(c, anahtar) {
  if (!c.kv || typeof c.kv.get !== 'function' || !ioAl(c)) return undefined;
  try {
    sayaclar.kvOkuma++;
    const v = await c.kv.get(anahtar, 'json');
    return v === undefined ? null : v;
  } catch (e) {
    sayaclar.kvHata++;
    return undefined;
  }
}

/** KV yazma → true | false. zorunlu: ayrılmış son birimi kullanabilir (yalnız durum kaydı). */
async function kvYaz(c, anahtar, deger, ttlS, zorunlu) {
  if (!c.kv || typeof c.kv.put !== 'function') return false;
  if (zorunlu) { if (c.io.n + 1 > c.io.tavan) { sayaclar.altIstekSiniri++; return false; } c.io.n++; } else if (!ioAl(c)) return false;
  try {
    sayaclar.kvYazma++;
    await c.kv.put(anahtar, JSON.stringify(deger), ttlS ? { expirationTtl: Math.max(60, Math.floor(ttlS)) } : undefined);
    return true;
  } catch (e) {
    sayaclar.kvHata++;
    log('kv-yazma-hata');
    return false;
  }
}

async function onbOku(c, anahtar) {
  if (!c.cache || !ioIstege(c) || !ioAl(c)) return null;
  try {
    const r = await c.cache.match(CACHE_KOK + anahtar);
    return r ? await r.json() : null;
  } catch (e) { return null; }
}
function onbYaz(c, anahtar, deger, ttlS) {
  if (!c.cache || !ioIstege(c) || !ioAl(c)) return Promise.resolve();
  return arkaPlan(c, (async () => {
    await c.cache.put(CACHE_KOK + anahtar, new Response(JSON.stringify(deger), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${Math.max(1, Math.floor(ttlS))}` },
    }));
  })());
}
async function onbSil(c, anahtar) {
  if (!c.cache || typeof c.cache.delete !== 'function' || !ioIstege(c) || !ioAl(c)) return;
  try { await c.cache.delete(CACHE_KOK + anahtar); } catch (e) { /* yok say */ }
}

/**
 * Küçük kayıtlar (tgt, engel, geri/*, yarim/*): bellek → Cache API → (kv ise) KV.
 * Saklanan biçim {son, kayit}; kayit.yazildi en yeni olan kazanır.
 * guvenMs verilirse bellek o süre boyunca kesin kabul edilir (yokluk da), sonra paylaşılan katmanlar yeniden okunur.
 */
async function katmanOku(c, anahtar, sec) {
  const kv = !!(sec && sec.kv), guvenMs = sec && Number.isFinite(sec.guvenMs) ? sec.guvenMs : null;
  const an = c.simdi();
  const b = kucuk.get(anahtar);
  if (b && an < b.son && (guvenMs === null || an < b.okundu + guvenMs)) return b.kayit;
  const adaylar = [];
  if (b && an < b.son && b.kayit) adaylar.push({ kayit: b.kayit, son: b.son });
  const ck = await onbOku(c, anahtar);
  if (ck && Number.isFinite(ck.son) && an < ck.son && ck.kayit) adaylar.push(ck);
  if (kv) {
    const kk = await kvOku(c, KV_ON + anahtar);
    if (kk && Number.isFinite(kk.son) && an < kk.son && kk.kayit) adaylar.push(kk);
  }
  adaylar.sort((x, y) => (y.kayit.yazildi || 0) - (x.kayit.yazildi || 0));
  const sec0 = adaylar[0] || null;
  if (sec0) kucukYaz(anahtar, { kayit: sec0.kayit, son: sec0.son, okundu: an });
  else if (guvenMs !== null) kucukYaz(anahtar, { kayit: null, son: an + guvenMs, okundu: an });
  return sec0 ? sec0.kayit : null;
}
function kucukYaz(anahtar, v) {
  if (kucuk.size >= BELLEK_SINIRI && !kucuk.has(anahtar)) kucuk.delete(kucuk.keys().next().value);
  kucuk.set(anahtar, v);
}
function katmanYaz(c, anahtar, kayit, saklamaS, sec) {
  const an = c.simdi();
  const son = an + saklamaS * 1000;
  kucukYaz(anahtar, { kayit, son, okundu: an });
  const govde = { son, kayit };
  const isler = [onbYaz(c, anahtar, govde, saklamaS)];
  if (sec && sec.kv) isler.push(kvYaz(c, KV_ON + anahtar, govde, saklamaS));
  return arkaPlan(c, Promise.allSettled(isler));
}

// ===================================================================== bütçe ==

/**
 * Dakikalık üst-akış bütçesinden bir birim (tur: 'giris' | 'rapor').
 * İstek yolu raporda en çok (rapor − zamanliAyrilan) birim kullanır; kalan pay zamanlanmış göreve ayrılmıştır.
 * Sayaç süreç belleğinde; Cache API varsa dakikada bir okunur, çağrı sonunda bir kez yazılır
 * (yaklaşık paylaşım; workers.dev'de Cache API etkisiz olabilir → süreç başına sınır).
 */
async function butceAl(c, tur) {
  const dakika = Math.floor(c.simdi() / 60000);
  if (butceBellek.dakika !== dakika) butceBellek = yeniButce(dakika);
  if (!butceBellek.ortakOkundu && c.cache) {
    butceBellek.ortakOkundu = true;
    const o = await onbOku(c, `butce/${dakika}`);
    if (o && butceBellek.dakika === dakika) for (const t of ['rapor', 'raporIstek', 'giris']) if (Number.isFinite(o[t]) && o[t] > butceBellek[t]) butceBellek[t] = o[t];
  }
  const zamanli = c.tur === 'zamanli';
  const dolu = tur === 'giris'
    ? butceBellek.giris >= BUTCE.giris
    : butceBellek.rapor >= BUTCE.rapor || (!zamanli && butceBellek.raporIstek >= BUTCE.rapor - BUTCE.zamanliAyrilan);
  if (dolu) { sayaclar.butceAsimi++; logSeyrek(`butce-doldu-${tur}`, dakika); return false; }
  if (tur === 'giris') butceBellek.giris++;
  else { butceBellek.rapor++; if (!zamanli) butceBellek.raporIstek++; }
  butceBellek.kirli = true;
  return true;
}
function butceYaz(c) {
  if (!butceBellek.kirli || !c.cache) return;
  butceBellek.kirli = false;
  const { dakika, rapor, raporIstek, giris } = butceBellek;
  onbYaz(c, `butce/${dakika}`, { rapor, raporIstek, giris }, 120);
}
function butceKalanS(c) { return Math.max(1, 60 - Math.floor((c.simdi() % 60000) / 1000)); }

// ============================================================ kimlik / bilet ==

const kodlayici = new TextEncoder();
const cozucu = new TextDecoder();
const b64 = (bayt) => { let s = ''; for (const b of bayt) s += String.fromCharCode(b); return btoa(s); };
const b64Coz = (metin) => Uint8Array.from(atob(metin), (ch) => ch.charCodeAt(0));
const hex = (bayt) => Array.from(bayt, (b) => b.toString(16).padStart(2, '0')).join('');
const TUZ = kodlayici.encode('voltage.com.tr/epias-proxy/piyasa-v1');

/** Kimlik parmak izi (HKDF-SHA-256, 64 bit): engel kaydı kimliğe bağlanır; kimlik değişince engel kalkar. */
async function kimlikParmagi(c) {
  if (c.epiasPost) return 'enjekte';
  const kimlik = `${c.kullanici}\n${c.parola}`;
  if (parmakBellek && parmakBellek.kimlik === kimlik) return parmakBellek.deger;
  let deger = '';
  try {
    const ham = await crypto.subtle.importKey('raw', kodlayici.encode(c.parola), 'HKDF', false, ['deriveBits']);
    const bit = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: TUZ, info: kodlayici.encode(`parmak-v1:${c.kullanici}`) }, ham, 64);
    deger = b64(new Uint8Array(bit));
  } catch (e) { /* türetilemezse boş: engel kimlikten bağımsız işler */ }
  parmakBellek = { kimlik, deger };
  return deger;
}

async function sifreAnahtari(c) {
  const ham = await crypto.subtle.importKey('raw', kodlayici.encode(c.parola), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: TUZ, info: kodlayici.encode('tgt-v1') }, ham, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function biletSifrele(c, tgt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const veri = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await sifreAnahtari(c), kodlayici.encode(tgt));
  return { iv: b64(iv), veri: b64(new Uint8Array(veri)) };
}
async function biletCoz(c, sifreli) {
  try {
    if (!sifreli || typeof sifreli.iv !== 'string' || typeof sifreli.veri !== 'string') return null;
    const duz = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64Coz(sifreli.iv) }, await sifreAnahtari(c), b64Coz(sifreli.veri));
    const tgt = cozucu.decode(duz);
    return /^TGT-[A-Za-z0-9._-]{6,}$/.test(tgt) ? tgt : null;
  } catch (e) { return null; }
}
function biletAyikla(metin, konum) {
  for (const k of [metin, konum]) {
    if (typeof k !== 'string') continue;
    const m = /TGT-[A-Za-z0-9._-]{6,}/.exec(k);
    if (m) return m[0];
  }
  return null;
}

async function engelKaydi(c) {
  const k = await katmanOku(c, 'engel', { kv: true, guvenMs: ENGEL_GUVEN_MS });
  if (!k) return null;
  return (k.parmak || '') === (await kimlikParmagi(c)) ? k : null;
}
async function engelOku(c) {
  const k = await engelKaydi(c);
  return k && Number.isFinite(k.taze) && c.simdi() < k.taze && k.deger && typeof k.deger.neden === 'string' ? k.deger.neden : null;
}
/** kalici: reddedilen giriş / taze biletle de 401 → büyüyen aralık (KV'ye yazılır, tüm veri merkezleri görür). */
async function engelYaz(c, neden, kalici) {
  const an = c.simdi();
  const onceki = await engelKaydi(c);
  const eskiAdim = onceki && Number.isFinite(onceki.adim) ? onceki.adim : 0;
  const adim = kalici ? eskiAdim + 1 : eskiAdim;
  const sureS = kalici ? ENGEL_RED_ADIMLARI_S[Math.min(adim, ENGEL_RED_ADIMLARI_S.length) - 1] : ENGEL_GECICI_S;
  log('engel', neden, sureS);
  return katmanYaz(c, 'engel', { deger: { neden }, taze: an + sureS * 1000, yazildi: an, adim, parmak: await kimlikParmagi(c) }, adim ? ENGEL_SAKLAMA_S : sureS, { kv: kalici });
}
async function engelTemizle(c) {
  const onceki = await engelKaydi(c);
  if (!onceki || (!(onceki.adim > 0) && !(Number.isFinite(onceki.taze) && c.simdi() < onceki.taze))) return null;
  return katmanYaz(c, 'engel', { deger: null, taze: 0, yazildi: c.simdi(), adim: 0, parmak: await kimlikParmagi(c) }, 60, { kv: onceki.adim > 0 });
}

/** Zaman aşımlı iş: fetch VE gövde okuma aynı sürede kalır. */
async function sureli(c, is) {
  let zamanlayici;
  const kontrol = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const asim = new Promise((_, ret) => { zamanlayici = setTimeout(() => { if (kontrol) kontrol.abort(); ret(new Error('zaman-asimi')); }, c.zamanAsimiMs); });
  try { return await Promise.race([is(kontrol ? kontrol.signal : undefined), asim]); } finally { clearTimeout(zamanlayici); }
}
function ustAkisNedeni(e) { const m = e && e.message; return m === 'zaman-asimi' ? 'zaman-asimi' : m === 'altistek' ? 'altistek' : 'ag'; }

/** Rapor ucunun reddettiği biletler (süreç başına): önbellek/KV'den yeniden KULLANILMAZ. */
const reddedilenBiletler = new Set();
function biletReddedildi(tgt) {
  if (!tgt) return;
  if (reddedilenBiletler.size > 32) reddedilenBiletler.clear();
  reddedilenBiletler.add(tgt);
  if (biletBellek && biletBellek.tgt === tgt) biletBellek = null;
}

/**
 * → {tgt, yeni?} | {hata}. yeni: bilet bu uçuşta yapılan girişle alındı (401 alırsa yenileme
 * anlamsızdır: hesap/yetki sorunu). gecersiz: rapor ucunun az önce reddettiği bilet.
 */
async function biletAl(c, gecersiz) {
  if (gecersiz) biletReddedildi(gecersiz);
  if (biletBellek && c.simdi() < biletBellek.taze && !reddedilenBiletler.has(biletBellek.tgt)) return { tgt: biletBellek.tgt };
  if (!gecersiz) {
    const k = await katmanOku(c, 'tgt', { kv: true });
    if (k && Number.isFinite(k.taze) && c.simdi() < k.taze) {
      const tgt = await biletCoz(c, k.sifreli);
      if (tgt && !reddedilenBiletler.has(tgt)) { biletBellek = { tgt, taze: k.taze }; return { tgt }; }
    }
    if (biletBellek && c.simdi() < biletBellek.taze && !reddedilenBiletler.has(biletBellek.tgt)) return { tgt: biletBellek.tgt };
  }
  if (biletUcus && Date.now() - biletUcus.bas < UCUS_AZAMI_MS) return biletUcus.is;
  const ucus = { bas: Date.now(), is: null };
  ucus.is = (async () => {
    if (!(await butceAl(c, 'giris'))) return { hata: 'butce' };
    let sonuc;
    try {
      sonuc = await sureli(c, async (signal) => {
        if (!ioAl(c)) throw new Error('altistek');
        sayaclar.giris++;
        const r = await c.fetch(GIRIS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/plain' },
          body: new URLSearchParams({ username: c.kullanici, password: c.parola }).toString(),
          signal,
        });
        if (r.status === 400 || r.status === 401 || r.status === 403) return { hata: 'giris-reddedildi' };
        if (r.status < 200 || r.status > 299) return { hata: 'giris-hata' };
        let metin = '';
        try { metin = await r.text(); } catch (e) { /* biçim hatası */ }
        const t = biletAyikla(metin, r.headers && r.headers.get ? r.headers.get('Location') : null);
        return t ? { tgt: t } : { hata: 'giris-bicim' };
      });
    } catch (e) {
      const n = ustAkisNedeni(e);
      sonuc = { hata: n === 'altistek' ? 'altistek' : n === 'zaman-asimi' ? 'giris-zaman-asimi' : 'giris-ag' };
    }
    if (sonuc.hata) {
      if (sonuc.hata !== 'altistek') await engelYaz(c, sonuc.hata, sonuc.hata === 'giris-reddedildi');
      return sonuc;
    }
    await engelTemizle(c);
    const an = c.simdi();
    const taze = an + TGT_TTL_S * 1000;
    biletBellek = { tgt: sonuc.tgt, taze };
    try {
      katmanYaz(c, 'tgt', { sifreli: await biletSifrele(c, sonuc.tgt), taze, yazildi: an }, TGT_TTL_S, { kv: true });
    } catch (e) { /* şifreleme yoksa bilet yalnız süreç belleğinde */ }
    return { tgt: sonuc.tgt, yeni: true };
  })();
  biletUcus = ucus;
  arkaPlan(c, ucus.is);
  try { return await ucus.is; } finally { if (biletUcus === ucus) biletUcus = null; }
}

// ===================================================================== rapor ==

/** → {ogeler} | {hata, kisaDevre?}. anahtar: yarım sayfalı çekimin saklandığı anahtar. */
async function raporCek(c, anahtar, bas, bit) {
  const engel = await engelOku(c);
  if (engel) { sayaclar.kisaDevre++; return { hata: engel, kisaDevre: true }; }
  const sinirlar = aralikSinirlari(bas, bit);

  const istek = async (tgt, sayfa) => {
    if (!(await butceAl(c, 'rapor'))) return { hata: 'butce', kisaDevre: true };
    try {
      return await sureli(c, async (signal) => {
        if (!ioAl(c)) throw new Error('altistek');
        sayaclar.ustAkis++;
        const govde = sayfa ? { ...sinirlar, page: sayfa } : sinirlar;
        const r = c.epiasPost
          ? await c.epiasPost(RAPOR_URL, govde)
          : await c.fetch(RAPOR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', TGT: tgt }, body: JSON.stringify(govde), signal });
        const durum = r && Number.isFinite(r.status) ? r.status : 0;
        c.sonUstAkis = durum; sonUstAkisDurumu = durum;
        if (!r || !r.ok) return { durum: durum || 599 };
        let j;
        try { j = await r.json(); } catch (e) { return { hata: 'bicim' }; }
        const ogeler = ogelerCikar(j);
        return ogeler === null ? { hata: 'bicim' } : { ogeler, sayfa: sayfaBilgisi(j) };
      });
    } catch (e) {
      const n = ustAkisNedeni(e);
      return n === 'altistek' ? { hata: 'altistek', kisaDevre: true } : { hata: n };
    }
  };
  const yetkisiz = (x) => x.durum === 401 || x.durum === 403;

  let b = { tgt: null };
  if (!c.epiasPost) {
    b = await biletAl(c, null);
    if (b.hata) return { hata: b.hata, kisaDevre: b.hata === 'butce' || b.hata === 'altistek' };
  }
  let yenilendi = false;
  const cagir = async (sayfa) => {
    let x = await istek(b.tgt, sayfa);
    if (yetkisiz(x) && !yenilendi && !c.epiasPost && !b.yeni) {
      yenilendi = true; // önbellekteki bilet geçersizleşmiş olabilir: BİR kez yenile
      b = await biletAl(c, b.tgt);
      if (b.hata) return { hata: b.hata, kisaDevre: b.hata === 'butce' || b.hata === 'altistek' };
      x = await istek(b.tgt, sayfa);
    }
    if (yetkisiz(x)) {
      // Taze girişle alınmış biletle de 401: hesap/yetki sorunu. Giriş döngüsü yok, büyüyen engel.
      biletReddedildi(b.tgt);
      await engelYaz(c, 'servis-yetki', true);
      return { hata: 'servis-yetki' };
    }
    if (x.durum) return { hata: 'servis-hata' };
    return x;
  };

  const yarimAnahtar = 'yarim/' + anahtar;
  const yarimYaz = (deger, sureS) => { const an = c.simdi(); return katmanYaz(c, yarimAnahtar, { deger, taze: an + sureS * 1000, yazildi: an }, sureS, { kv: false }); };
  let ogeler, sf, sonraki;
  const yarim = await katmanOku(c, yarimAnahtar, {});
  const y0 = yarim && c.simdi() < yarim.taze ? yarim.deger : null;
  if (y0 && Array.isArray(y0.ogeler) && y0.sf && y0.sf.size > 0 && Number.isFinite(y0.sonraki)) {
    ({ ogeler, sf, sonraki } = y0);
  } else {
    const x = await cagir(null);
    if (x.hata) return x;
    ogeler = x.ogeler;
    sf = x.sayfa;
    if (!sf || sf.total <= ogeler.length) return { ogeler };
    if (!(sf.size > 0)) return { hata: 'eksik' };
    if (Math.ceil(sf.total / sf.size) > AZAMI_SAYFA) return { hata: 'eksik' };
    sonraki = sf.number + 1;
    yarimYaz({ ogeler, sf, sonraki }, YARIM_TTL_S);
  }
  const sonSayfa = sf.number + Math.ceil(sf.total / sf.size) - 1;
  for (let n = sonraki; n <= sonSayfa && ogeler.length < sf.total; n++) {
    const y = await cagir({ number: n, size: sf.size });
    if (y.hata === 'butce' || y.hata === 'altistek') return { hata: y.hata, kisaDevre: true }; // tamamlanan sayfalar saklı
    if (y.hata === 'servis-yetki' || (y.hata && y.hata.startsWith('giris'))) return y;
    if (y.hata || !y.ogeler.length) return { hata: 'eksik' };
    if (!y.sayfa || y.sayfa.number !== n || y.sayfa.total !== sf.total) { yarimYaz(null, 1); return { hata: 'eksik' }; }
    ogeler = ogeler.concat(y.ogeler);
    yarimYaz({ ogeler, sf, sonraki: n + 1 }, YARIM_TTL_S);
  }
  yarimYaz(null, 1);
  if (ogeler.length !== sf.total) return { hata: 'eksik' };
  return { ogeler };
}

// ========================================================= çekim + tek-uçuş ==

/**
 * Tek-uçuş çekim: aynı anahtar için süreçte tek üst-akış çağrısı; sonuç (KV yazımı dahil) paylaşılır.
 * → {tamam:true, gunler: Map<ymd, donemler>, an} | {tamam:false, neden, retryS}
 * sec: { oncelikli (bugün+dün), istek (istek yolu: anahtar bekleme + Cache işareti), kaydet(sonuc) }
 */
function cek(c, anahtar, bas, bit, sec) {
  const u0 = ucusta.get(anahtar);
  if (u0 && Date.now() - u0.bas < UCUS_AZAMI_MS) return u0.is;
  const u = { bas: Date.now(), is: null };
  ucusta.set(anahtar, u); // await'ten ÖNCE: eşzamanlı çağrılar aynı uçuşa katılır
  u.is = (async () => {
    try { return await cekIc(c, anahtar, bas, bit, sec || {}); }
    catch (e) { log('cekim-beklenmeyen', e && e.name); return { tamam: false, neden: 'hata', retryS: 60 }; }
    finally { if (ucusta.get(anahtar) === u) ucusta.delete(anahtar); }
  })();
  arkaPlan(c, u.is);
  return u.is;
}

async function cekIc(c, anahtar, bas, bit, sec) {
  if (!kimlikVar(c)) { logSeyrek('kimlik-yok', Math.floor(c.simdi() / 60000)); return { tamam: false, neden: 'kimlik-yok', retryS: 600 }; }
  const geriAnahtar = 'geri/' + anahtar;
  let geri = null;
  if (sec.istek) {
    geri = await katmanOku(c, geriAnahtar, {});
    if (geri && c.simdi() < geri.taze) return { tamam: false, neden: 'bekleme', retryS: Math.max(1, Math.ceil((geri.taze - c.simdi()) / 1000)) };
    const isaret = await onbOku(c, 'ucus/' + anahtar);
    if (isaret && Number.isFinite(isaret.taze) && c.simdi() < isaret.taze) return { tamam: false, neden: 'ucusta', retryS: 5 };
    onbYaz(c, 'ucus/' + anahtar, { taze: c.simdi() + UCUS_ISARET_S * 1000 }, UCUS_ISARET_S);
    sayaclar.istekYoluCekim++;
  }
  const r = await raporCek(c, anahtar, bas, bit);
  if (sec.istek) arkaPlan(c, onbSil(c, 'ucus/' + anahtar));
  let neden = r.hata || null;
  let gunler = null;
  if (!neden) {
    const a = donemlerAyrintili(r.ogeler);
    if (a.cokme) neden = 'bicim';
    else {
      if (a.cakisma) { sayaclar.cakisma += a.cakisma; log('cakisan-yinelenen-satir', a.cakisma, bas, bit); }
      gunler = new Map();
      for (let g = bas; g <= bit; g = gunEkle(g, 1)) {
        const izgara = gunIzgarasi(g, a.donemler);
        if (veriVar(izgara)) gunler.set(g, izgara.map(donemCikti));
      }
    }
  }
  const an = c.simdi();
  if (!neden) {
    if (geri && geri.hataSayisi) katmanYaz(c, geriAnahtar, { taze: 0, yazildi: an, hataSayisi: 0 }, 60, { kv: false });
    const sonuc = { tamam: true, gunler, an };
    if (typeof sec.kaydet === 'function') await sec.kaydet(sonuc);
    return sonuc;
  }
  if (r.kisaDevre) {
    const retryS = neden === 'butce' ? butceKalanS(c) : neden === 'altistek' ? 5 : 60;
    return { tamam: false, neden, retryS };
  }
  log('epias-alinamadi', neden);
  if (!sec.istek) return { tamam: false, neden, retryS: 60 };
  const hataSayisi = (geri && Number.isFinite(geri.hataSayisi) ? geri.hataSayisi : 0) + 1;
  const adimlar = sec.oncelikli ? HATA_ADIMLARI_ONCELIKLI_S : HATA_ADIMLARI_S;
  const bekleS = adimlar[Math.min(hataSayisi, adimlar.length) - 1];
  katmanYaz(c, geriAnahtar, { taze: an + bekleS * 1000, yazildi: an, hataSayisi }, HATA_SAKLAMA_S, { kv: false });
  return { tamam: false, neden, retryS: bekleS };
}

// ================================================================ KV kayıtları ==

/**
 * Durum kaydı (tek KV anahtarı): g = gün → [içerik özeti, son kontrol ms, yayımlanan dönem sayısı];
 * dl = dilim başlangıcı → son tam denetim ms; yok = EPİAŞ'ın veri döndürmediği gün → son deneme ms; cron.
 */
function bosDurum() { return { s: 1, g: {}, dl: {}, yok: {}, cron: null }; }
const nesne = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
function durumNormal(d) {
  if (!d || typeof d !== 'object' || d.s !== 1 || !d.g || typeof d.g !== 'object') return bosDurum();
  return { s: 1, g: nesne(d.g), dl: nesne(d.dl), yok: nesne(d.yok), cron: d.cron && typeof d.cron === 'object' ? d.cron : null };
}
/** Durum kaydı: bellek (30 sn) → KV. undefined → okunamadı. */
async function durumOku(c, taze) {
  const an = c.simdi();
  if (!taze && bellekDurum && an < bellekDurum.son) return bellekDurum.deger;
  const v = await kvOku(c, KV_DURUM);
  if (v === undefined) return undefined;
  const d = durumNormal(v);
  bellekDurum = { deger: d, son: an + BELLEK_DURUM_MS };
  return d;
}

/** İçerik özeti: dönem dizisinin JSON metninin SHA-256'sının ilk 64 biti (metin bir kez üretilir). */
async function metinOzeti(metin) {
  const b = await crypto.subtle.digest('SHA-256', kodlayici.encode(metin));
  return hex(new Uint8Array(b).slice(0, 8));
}
const icerikOzeti = (donemler) => metinOzeti(JSON.stringify(donemler));
/** Gün kaydı: {s:1, tarih, cekildi (ms), ozet, donemler}. Özet kayıtla saklanır: okumada yeniden hesaplanmaz. */
function gunKaydiGecerli(k, g) {
  return !!k && k.s === 1 && k.tarih === g && Number.isFinite(k.cekildi) && typeof k.ozet === 'string' && Array.isArray(k.donemler) && k.donemler.length > 0;
}
function bellekGunYaz(c, g, kayit, ozet) {
  if (bellekGun.size >= BELLEK_SINIRI && !bellekGun.has(g)) bellekGun.delete(bellekGun.keys().next().value);
  const bugun = istanbulBugun(c.simdi());
  bellekGun.set(g, { kayit, ozet, son: c.simdi() + (g >= gunEkle(bugun, -1) ? BELLEK_GUN_SON2_MS : BELLEK_GUN_ESKI_MS) });
}

/**
 * Gün kayıtları: bellek → KV (toplu okuma destekleniyorsa tek işlem). → Map<ymd, {kayit, ozet}|null> | undefined
 * Durum kaydı bellekteki kopyadan daha yeni bir içerik özeti gösteriyorsa bellek kopyası atlanır (KV'den okunur).
 */
async function gunleriOku(c, gunler, durum) {
  const an = c.simdi();
  const out = new Map();
  const eksik = [];
  for (const g of gunler) {
    const b = bellekGun.get(g);
    const d = durum && Array.isArray(durum.g[g]) ? durum.g[g] : null;
    const eskiKopya = b && d && b.ozet && d[0] !== b.ozet && Number.isFinite(d[1]) && d[1] > b.kayit.cekildi;
    if (b && an < b.son && !eskiKopya) out.set(g, b); else eksik.push(g);
  }
  if (!eksik.length) return out;
  if (!c.kv || typeof c.kv.get !== 'function') return undefined;
  let toplu = null;
  if (eksik.length > 1 && ioVar(c, 1)) {
    try {
      c.io.n++;
      sayaclar.kvOkuma++;
      const m = await c.kv.get(eksik.map(kvGunAnahtari), 'json');
      if (m instanceof Map) toplu = m;
    } catch (e) { /* toplu okuma yok: tek tek */ }
  }
  const degerler = toplu
    ? eksik.map((g) => (toplu.has(kvGunAnahtari(g)) ? toplu.get(kvGunAnahtari(g)) ?? null : null))
    : await Promise.all(eksik.map((g) => kvOku(c, kvGunAnahtari(g))));
  for (let i = 0; i < eksik.length; i++) {
    const g = eksik[i], v = degerler[i];
    if (v === undefined) return undefined; // okunamadı: EPİAŞ'a gidilmez, 503 gecici
    if (v === null) { out.set(g, null); continue; }
    if (!gunKaydiGecerli(v, g)) { sayaclar.bozukKayit++; out.set(g, null); continue; }
    bellekGunYaz(c, g, v, v.ozet);
    out.set(g, { kayit: v, ozet: v.ozet });
  }
  return out;
}

/**
 * Çekilen günleri kaydeder: içerik özeti durum kaydındakiyle aynıysa KV'ye YAZILMAZ (yalnız kontrol
 * zamanı güncellenir). G/Ç sınırına sığmayan gün yazılmaz (özet güncellenmez → sonraki turda yazılır).
 * once: önce yazılacak günler (istenen günler). → {yazilan, atlanan, degisti}
 */
async function kaydet(c, durum, gunler, an, once) {
  const sira = [...new Set([...(once || []).filter((g) => gunler.has(g)), ...[...gunler.keys()].sort()])];
  const yazilacak = [];
  let atlanan = 0, degisti = false;
  for (const g of sira) {
    const donemler = gunler.get(g);
    const metin = JSON.stringify(donemler);
    const ozet = await metinOzeti(metin);
    const kayit = { s: 1, tarih: g, cekildi: an, ozet, donemler };
    const yayim = yayimSayisi(donemler);
    const onceki = Array.isArray(durum.g[g]) ? durum.g[g] : null;
    bellekGunYaz(c, g, kayit, ozet);
    if (onceki && onceki[0] === ozet) { durum.g[g] = [ozet, an, yayim]; degisti = true; continue; }
    if (onceki && Number.isFinite(onceki[2]) && yayim < onceki[2]) { sayaclar.yayimAzaldi++; log('yayim-azaldi', g, onceki[2], yayim); }
    if (!ioVar(c, 1)) { atlanan++; continue; }
    yazilacak.push({ g, ozet, yayim, deger: `{"s":1,"tarih":"${g}","cekildi":${an},"ozet":"${ozet}","donemler":${metin}}` });
    c.io.n++; // G/Ç birimi şimdi ayrılır; yazım aşağıda paralel
  }
  const sonuclar = await Promise.all(yazilacak.map(async (y) => {
    try { sayaclar.kvYazma++; await c.kv.put(kvGunAnahtari(y.g), y.deger); return true; } catch (e) { sayaclar.kvHata++; return false; }
  }));
  let yazilan = 0;
  yazilacak.forEach((y, i) => {
    if (sonuclar[i]) { durum.g[y.g] = [y.ozet, an, y.yayim]; yazilan++; degisti = true; } else atlanan++;
  });
  if (sonuclar.some((x) => !x)) log('kv-yazma-hata');
  return { yazilan, atlanan, degisti };
}

/** İstek yolunda çekilen günleri kaydeder ve durum kaydını (yeniden okuyup) günceller. */
function istekKaydedici(c, once) {
  return async (sonuc) => {
    const durum = await durumOku(c, true);
    if (durum === undefined) { for (const [g, d] of sonuc.gunler) { const oz = await icerikOzeti(d); bellekGunYaz(c, g, { s: 1, tarih: g, cekildi: sonuc.an, ozet: oz, donemler: d }, oz); } return; }
    const k = await kaydet(c, durum, sonuc.gunler, sonuc.an, once);
    if (k.degisti && (await kvYaz(c, KV_DURUM, durum, 0, true))) bellekDurum = { deger: durum, son: c.simdi() + BELLEK_DURUM_MS };
  };
}

/** Günün EPİAŞ'tan son alındığı an: kayıt zamanı ya da (içerik özeti eşleşiyorsa) durumdaki son kontrol. */
function etkinCekildi(g, girdi, durum) {
  const k = durum && Array.isArray(durum.g[g]) ? durum.g[g] : null;
  const kontrol = k && k[0] === girdi.ozet && Number.isFinite(k[1]) ? k[1] : 0;
  return Math.max(girdi.kayit.cekildi, kontrol);
}
function pencere(g, bugun) {
  if (g >= gunEkle(bugun, -1)) return PENCERE.son2Ms;
  if (g >= gunEkle(bugun, -UZLASTIRMA_GUN)) return PENCERE.uzlastirmaMs;
  return PENCERE.eskiMs;
}

// =============================================================== HTTP yanıtı ==

function yanit(durum, govde, ek) {
  const h = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
    'X-Content-Type-Options': 'nosniff',
  });
  if (ek) for (const [k, v] of Object.entries(ek)) h.set(k, v);
  return new Response(JSON.stringify(govde), { status: durum, headers: h });
}
const hata400 = (mesaj) => yanit(400, { hata: { kod: 'parametre', mesaj } });
function hata503(kod, mesaj, retryS) {
  return yanit(503, { hata: { kod, mesaj } }, { 'Retry-After': String(Math.max(1, Math.min(86400, Math.ceil(retryS || 60)))) });
}
const MESAJ_503 = {
  'veri-yok': 'İstenen günlerden en az biri için EPİAŞ verisi henüz yok.',
  butce: 'EPİAŞ istek bütçesi bu dakika için doldu; eksik günler daha sonra tamamlanacak.',
  gecici: 'Veri şu anda alınamadı; daha sonra yeniden deneyin.',
};

// ============================================================ okuma belirteci ==

async function ozetBayt(metin) { return new Uint8Array(await crypto.subtle.digest('SHA-256', kodlayici.encode(metin))); }
/** Sabit süreli karşılaştırma: iki metnin SHA-256 özetleri (sabit 32 bayt) XOR ile; erken çıkış yok. */
export async function belirtecEsit(a, b) {
  const [x, y] = await Promise.all([ozetBayt(String(a)), ozetBayt(String(b))]);
  let fark = 0;
  for (let i = 0; i < 32; i++) fark |= x[i] ^ y[i];
  return fark === 0;
}
const anahtarGecerli = (k) => typeof k === 'string' && k.length >= ANAHTAR_EN_KISA;

async function yetkili(request, env, dakika) {
  const baslik = request.headers.get('Authorization') || '';
  const m = /^Bearer +([\x21-\x7E]{1,512}) *$/i.exec(baslik);
  const verilen = m ? m[1] : '';
  const k1 = anahtarGecerli(env.PIYASA_OKUMA_ANAHTARI) ? env.PIYASA_OKUMA_ANAHTARI : null;
  const k2 = anahtarGecerli(env.PIYASA_OKUMA_ANAHTARI_2) ? env.PIYASA_OKUMA_ANAHTARI_2 : null;
  if (!k1 && !k2) { logSeyrek('okuma-anahtari-yok', dakika); return false; }
  // Her iki yuva da HER ZAMAN karşılaştırılır (kısa devre yok); boş yuva yerine dolu olan yeniden kullanılır.
  const [e1, e2] = await Promise.all([belirtecEsit(verilen, k1 || k2), belirtecEsit(verilen, k2 || k1)]);
  return verilen !== '' && (e1 | e2) === 1;
}

// ================================================================ istek yolu ==

function parametreler(params, bugun) {
  const izinli = new Set(['tarih', 'bas', 'bit']);
  for (const k of new Set(params.keys())) {
    if (!izinli.has(k)) return { hata: 'Bilinmeyen parametre.' };
    if (params.getAll(k).length > 1) return { hata: 'Yinelenen parametre.' };
  }
  const gecerli = (g) => ymdGecerli(g) && g >= ILK_GUN && g <= bugun;
  if (params.has('tarih')) {
    if (params.has('bas') || params.has('bit')) return { hata: 'tarih ile bas/bit birlikte kullanılamaz.' };
    const t = params.get('tarih');
    if (!gecerli(t)) return { hata: `tarih YYYY-MM-DD biçiminde, ${ILK_GUN} ile bugün (İstanbul) arasında olmalı.` };
    return { gunler: [t] };
  }
  if (!params.has('bas') || !params.has('bit')) return { hata: 'tarih ya da bas ve bit gerekli.' };
  const bas = params.get('bas'), bit = params.get('bit');
  if (!gecerli(bas) || !gecerli(bit)) return { hata: `bas ve bit YYYY-MM-DD biçiminde, ${ILK_GUN} ile bugün (İstanbul) arasında olmalı.` };
  if (bas > bit) return { hata: 'bas, bit gününden sonra olamaz.' };
  if (gunFarki(bas, bit) + 1 > AZAMI_ARALIK_GUN) return { hata: `Aralık en çok ${AZAMI_ARALIK_GUN} gün olabilir.` };
  const gunler = [];
  for (let g = bas; g <= bit; g = gunEkle(g, 1)) gunler.push(g);
  return { gunler };
}

async function dengesizlik(c, params) {
  const an = c.simdi();
  const bugun = istanbulBugun(an), dun = gunEkle(bugun, -1), sinir = gunEkle(bugun, -2);
  const p = parametreler(params, bugun);
  if (p.hata) return hata400(p.hata);
  if (!c.kv) { logSeyrek('kv-baglamasi-yok', Math.floor(an / 60000)); return hata503('gecici', MESAJ_503.gecici, 60); }

  let durum = await durumOku(c, false);
  if (durum === undefined) return hata503('gecici', MESAJ_503.gecici, 30);
  const kayitlar = await gunleriOku(c, p.gunler, durum);
  if (kayitlar === undefined) return hata503('gecici', MESAJ_503.gecici, 30);

  const isler = [];
  const hatalar = [];
  // Uçuşa başka bir çağrı (ör. zamanlanmış görev) başladıysa bellek henüz yazılmamış olabilir: sonuçtan kur.
  const girdi = (r, g) => bellekGun.get(g) || { kayit: { s: 1, tarih: g, cekildi: r.an, donemler: r.gunler.get(g) }, ozet: null };
  // (a/b) bugün + dün: KV'de yoksa ya da kayıt 15 dk'dan eskiyse (zamanlanmış görev tur kaçırdı) tek istek.
  const son2 = p.gunler.filter((g) => g >= dun);
  if (son2.length) {
    const eksikSon2 = son2.some((g) => !kayitlar.get(g));
    const eskimis = son2.some((g) => kayitlar.get(g) && an - etkinCekildi(g, kayitlar.get(g), durum) > ISTEK_TAZELEME_MS);
    if (eksikSon2 || eskimis) {
      isler.push(cek(c, 'son2', dun, bugun, { oncelikli: true, istek: true, kaydet: istekKaydedici(c, son2) }).then((r) => {
        if (r.tamam) { for (const g of son2) if (r.gunler.has(g)) kayitlar.set(g, girdi(r, g)); }
        else if (eksikSon2) hatalar.push(r);
      }));
    }
  }
  // (a) daha eski eksik günler: dilim başına tek istek (ay içinde sabit parça; bugün−2 ile kırpılır).
  // Bir çağrı en çok ISTEK_AZAMI_DILIM dilim tamamlar (CPU / G/Ç); kalanı sonraki isteğe ya da gece bakımına kalır.
  const n = dilimGunu(c.env);
  const dilimler = new Map();
  for (const g of p.gunler) {
    if (g >= dun || kayitlar.get(g)) continue;
    const d = dilimBul(g, n, sinir);
    if (!dilimler.has(d.bas)) dilimler.set(d.bas, { ...d, liste: [] });
    dilimler.get(d.bas).liste.push(g);
  }
  let dilimSiniri = false;
  for (const d of [...dilimler.values()].slice(0, ISTEK_AZAMI_DILIM)) {
    isler.push(cek(c, `dilim/${d.bas}/${d.bit}`, d.bas, d.bit, { istek: true, kaydet: istekKaydedici(c, d.liste) }).then((r) => {
      if (r.tamam) { for (const g of d.liste) if (r.gunler.has(g)) kayitlar.set(g, girdi(r, g)); }
      else hatalar.push(r);
    }));
  }
  if (dilimler.size > ISTEK_AZAMI_DILIM) dilimSiniri = true;
  if (isler.length) {
    await Promise.all(isler);
    if (bellekDurum && bellekDurum.deger) durum = bellekDurum.deger;
  }

  const eksik = p.gunler.filter((g) => !kayitlar.get(g));
  if (eksik.length) {
    const h = hatalar.find((x) => x.neden === 'butce') || hatalar[0];
    if (h) return h.neden === 'butce' ? hata503('butce', MESAJ_503.butce, h.retryS) : hata503('gecici', MESAJ_503.gecici, h.retryS);
    // Çağrı başına dilim sınırı: tamamlanan dilimler KV'de; kalanı bir sonraki istekte.
    if (dilimSiniri) return hata503('butce', MESAJ_503.butce, 2);
    return hata503('veri-yok', MESAJ_503['veri-yok'], eksik.some((g) => g >= dun) ? 600 : 3600);
  }
  const uretAn = c.simdi();
  const gunler = p.gunler.map((g) => {
    const girdi = kayitlar.get(g);
    const cekildiMs = etkinCekildi(g, girdi, durum);
    const donemler = girdi.kayit.donemler.map(donemCikti);
    return {
      tarih: g,
      cekildi: istanbulIso(cekildiMs),
      bayat: uretAn - cekildiMs > pencere(g, bugun),
      tam: donemler.length > 0 && donemler.every((d) => d.pozitif !== null && d.negatif !== null),
      donemler,
    };
  });
  return yanit(200, { surum: SURUM, kaynak: KAYNAK, uretildi: istanbulIso(uretAn), gunler });
}

async function durumYaniti(c) {
  const an = c.simdi();
  const durum = c.kv ? await durumOku(c, false) : undefined;
  if (durum === undefined) return hata503('gecici', MESAJ_503.gecici, 30);
  const sinir = gunEkle(istanbulBugun(an), -2);
  let eksikGun = 0;
  for (let g = ILK_GUN; g <= sinir; g = gunEkle(g, 1)) if (!durum.g[g]) eksikGun++;
  const cr = durum.cron || {};
  const dakika = Math.floor(an / 60000);
  const bu = butceBellek.dakika === dakika ? butceBellek : yeniButce(dakika);
  return yanit(200, {
    surum: SURUM,
    uretildi: istanbulIso(an),
    kv: { gunSayisi: Object.keys(durum.g).length, eksikGun, veriYokIsaretli: Object.keys(durum.yok).length, denetlenenDilim: Object.keys(durum.dl).length, dilimGun: dilimGunu(c.env) },
    zamanli: {
      son: Number.isFinite(cr.son) ? istanbulIso(cr.son) : null,
      sonuc: typeof cr.sonuc === 'string' ? cr.sonuc : null,
      bakim: typeof cr.bakim === 'string' ? cr.bakim : null,
      ustAkisDurum: Number.isFinite(cr.ustAkis) ? cr.ustAkis : null,
      altIstek: Number.isFinite(cr.altIstek) ? cr.altIstek : null,
    },
    surec: {
      sonUstAkisDurum: Number.isFinite(sonUstAkisDurumu) ? sonUstAkisDurumu : null,
      butceBuDakika: { rapor: bu.rapor, raporIstek: bu.raporIstek, giris: bu.giris },
      butceSiniri: { rapor: BUTCE.rapor, zamanliAyrilan: BUTCE.zamanliAyrilan, giris: BUTCE.giris },
      sayac: { ...sayaclar },
    },
    girisEngeli: (await engelOku(c)) || null,
    kimlik: c.epiasPost ? 'enjekte' : kimlikVar(c) ? 'yerlesik' : 'yok',
  });
}

/**
 * /piyasa ve /piyasa/* → Response; başka her yol → null (ana yönlendirici devam eder).
 * Sıra: PIYASA_ETKIN !== "1" → 404 · GET dışı → 405 · belirteç → 401 · yol.
 */
export async function piyasaIstegi(request, env, ctx, secenek) {
  let yol;
  try {
    const u = typeof request.url === 'string' ? request.url : '';
    if (!u.includes('/piyasa')) return null;
    yol = new URL(u).pathname;
  } catch (e) { return null; }
  if (yol !== '/piyasa' && !yol.startsWith('/piyasa/')) return null;
  let c = null;
  try {
    if (!env || env.PIYASA_ETKIN !== '1') return yanit(404, { hata: { kod: 'bulunamadi' } });
    if (request.method !== 'GET') return yanit(405, { hata: { kod: 'yontem' } }, { Allow: 'GET' });
    const s = secenek || {};
    const an = typeof s.simdi === 'function' ? s.simdi() : Date.now();
    if (!(await yetkili(request, env, Math.floor(an / 60000)))) return yanit(401, { hata: { kod: 'yetki' } }, { 'WWW-Authenticate': 'Bearer' });
    c = baglam(env, ctx, secenek, 'istek');
    if (yol === '/piyasa/v1/dengesizlik') return await dengesizlik(c, new URL(request.url).searchParams);
    if (yol === '/piyasa/v1/durum') return await durumYaniti(c);
    return yanit(404, { hata: { kod: 'bulunamadi' } });
  } catch (e) {
    log('istek-beklenmeyen', e && e.name);
    return hata503('gecici', MESAJ_503.gecici, 60);
  } finally {
    if (c) { try { butceYaz(c); } catch (e) { /* yok say */ } }
  }
}

// =========================================================== zamanlanmış görev ==

function geceSaatleri(env) {
  const m = env && typeof env.PIYASA_GECE === 'string' ? /^(\d{1,2})-(\d{1,2})$/.exec(env.PIYASA_GECE.trim()) : null;
  if (m && +m[1] < +m[2] && +m[2] <= 24) return [+m[1], +m[2]];
  return GECE_VARSAYILAN;
}

/**
 * Gece bakım işi seçimi (öncelik sırası; her iş TEK dilim):
 *   doldurma   — ILK_GUN … bugün−2 arasında KV'de olmayan ilk günün dilimi (ay ay ilerler)
 *   uzlastirma — [bugün−45, bugün−2] ile kesişen ve bu gece tam denetlenmemiş dilim
 *   dogrulama  — daha eski dilimlerden son denetimi ≥ 7 gün olan en eskisi
 * n: dilim uzunluğu (gün). → {tur, bas, bit, anahtar} | null
 */
export function bakimSec(durum, bugun, an, n = DILIM_GUN_VARSAYILAN) {
  const sinir = gunEkle(bugun, -2);
  if (sinir < ILK_GUN) return null;
  const is = (tur, d) => ({ tur, bas: d.bas, bit: d.bit, anahtar: `dilim/${d.bas}/${d.bit}` });
  for (let g = ILK_GUN; g <= sinir; g = gunEkle(g, 1)) {
    if (durum.g[g]) continue;
    if (Number.isFinite(durum.yok[g]) && an - durum.yok[g] < YOK_TEKRAR_MS) continue;
    return is('doldurma', dilimBul(g, n, sinir));
  }
  const pBas = enBuyuk(gunEkle(bugun, -UZLASTIRMA_GUN), ILK_GUN);
  const geceBasi = gunBasiMs(bugun);
  const ilkUzlastirma = dilimBul(pBas, n, sinir).bas;
  for (let g = ilkUzlastirma; g <= sinir;) {
    const d = dilimBul(g, n, sinir);
    if ((durum.dl[d.bas] || 0) < geceBasi) return is('uzlastirma', d);
    g = gunEkle(d.son, 1);
  }
  let aday = null;
  for (let g = ILK_GUN; g < ilkUzlastirma;) {
    const d = dilimBul(g, n, sinir);
    const t = durum.dl[d.bas] || 0;
    if (an - t >= DOGRULAMA_ARALIGI_MS && (!aday || t < aday.t)) aday = { d, t };
    g = gunEkle(d.son, 1);
  }
  return aday ? is('dogrulama', aday.d) : null;
}

async function zamanliCalis(c) {
  const an = c.simdi();
  const bugun = istanbulBugun(an), dun = gunEkle(bugun, -1);
  const durum = await durumOku(c, true);
  if (durum === undefined) { log('zamanli-kv-okunamadi'); return 'kv-hata'; }
  const s = c.env && /^\d{1,5}$/.test(String(c.env.PIYASA_CRON_ASGARI_SN || '')) ? +c.env.PIYASA_CRON_ASGARI_SN * 1000 : CRON_ASGARI_MS;
  if (durum.cron && Number.isFinite(durum.cron.son) && an >= durum.cron.son && an - durum.cron.son < s) return 'erken';

  let sonuc, bakim = null;
  const r = await cek(c, 'son2', dun, bugun, { oncelikli: true });
  if (r.tamam) {
    const k = await kaydet(c, durum, r.gunler, r.an, [bugun, dun]);
    sonuc = !r.gunler.has(bugun) ? 'bugun-veri-yok' : k.atlanan ? 'tamam-kismi' : 'tamam';
  } else sonuc = r.neden;

  const [gBas, gBit] = geceSaatleri(c.env);
  const saat = istanbulSaat(an);
  if (saat >= gBas && saat < gBit) {
    const is = bakimSec(durum, bugun, an, dilimGunu(c.env));
    if (is) {
      if (!ioVar(c, 10)) bakim = `${is.tur}:altistek`;
      else {
        const rr = await cek(c, is.anahtar, is.bas, is.bit, {});
        if (rr.tamam) {
          const k = await kaydet(c, durum, rr.gunler, rr.an, []);
          for (let g = is.bas; g <= is.bit; g = gunEkle(g, 1)) {
            if (rr.gunler.has(g)) delete durum.yok[g];
            else if (!durum.g[g]) durum.yok[g] = an;
          }
          if (!k.atlanan) durum.dl[is.bas] = an;
          bakim = k.atlanan ? `${is.tur}:kismi` : is.tur;
        } else bakim = `${is.tur}:${rr.neden}`;
      }
    }
  }
  durum.cron = { son: an, sonuc, bakim, ustAkis: Number.isFinite(c.sonUstAkis) ? c.sonUstAkis : null, altIstek: c.io.n + 1 };
  if (await kvYaz(c, KV_DURUM, durum, 0, true)) bellekDurum = { deger: durum, son: c.simdi() + BELLEK_DURUM_MS };
  if (sonuc !== 'tamam' || (bakim && bakim.includes(':'))) log('zamanli', sonuc, bakim || '-');
  return sonuc;
}

/**
 * Zamanlanmış görev kancası. PIYASA_ETKIN !== "1" → hiçbir şey yapmaz.
 * env.PIYASA_CRON verilmişse yalnız o cron ifadesiyle tetiklenen turlar işlenir (proxy'nin başka
 * cron'ları varsa). ASLA fırlatmaz.
 */
export async function piyasaZamanli(controller, env, ctx, secenek) {
  let c = null;
  try {
    if (!env || env.PIYASA_ETKIN !== '1') return;
    if (typeof env.PIYASA_CRON === 'string' && env.PIYASA_CRON && (!controller || controller.cron !== env.PIYASA_CRON)) return;
    c = baglam(env, ctx, secenek, 'zamanli');
    if (!c.kv) { log('kv-baglamasi-yok'); return; }
    await zamanliCalis(c);
  } catch (e) {
    log('zamanli-beklenmeyen', e && e.name);
  } finally {
    if (c) { try { butceYaz(c); } catch (e) { /* yok say */ } }
  }
}

/** Yalnız testler için iç işlevler. */
export const _ic = { parametreler, etkinCekildi, pencere, icerikOzeti, durumNormal, geceSaatleri, CACHE_KOK };
