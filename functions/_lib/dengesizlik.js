/**
 * Dengesizlik maliyeti — SAF MANTIK (ağ yok, saat yok, yan etki yok).
 *
 * Dayanak föyü: docs/seo/DENGESIZLIK-KAYNAK-TEYIT.md (24.11.2026). Buradaki her
 * sabit o föydeki "TEYİT EDİLDİ" satırlarından gelir; föyün "Açık" listesindeki
 * hiçbir şey burada varsayılmaz:
 *   - 31/12/2026 sonrası için kural YOKTUR (kuralBul → null).
 *   - 4/4/2026 öncesi için azami fiyat limiti doğrulanmadı → tavan dalı yok.
 *   - Yuvarlama kuralı doğrulanmadı → burada yuvarlama YAPILMAZ; yalnızca kayan
 *     nokta gürültüsü temizlenir (gösterimdeki 2 hane bir sunum tercihidir).
 *
 * DÜRÜSTLÜK KURALI (functions/canli-ptf.js ile aynı): değeri olmayan alan null
 * kalır. null / '' / [] ASLA 0 olmaz; taşıma ve ara değer üretme yoktur.
 *
 * DÖNEMDEN BAĞIMSIZ: hiçbir yerde "24 saat" varsayımı yok. Dönem uzunluğu (dk)
 * ardışık dönem başlangıçlarının farkından türetilir; 96 satırlık 15 dakikalık
 * bir seri aynı koddan geçer.
 *
 * Bu dosya Pages Function DEĞİLDİR (onRequest* dışa aktarmaz, rota üretmez).
 */

/** Türkiye kalıcı olarak UTC+3. */
export const OFSET = '+03:00';
const OFSET_MS = 3 * 60 * 60 * 1000;

/** Bu araçta seçilebilen en erken teslim günü (kural tablosunun başlangıcı). */
export const ILK_GUN = '2026-01-01';

/** Tek istekte indirilebilen en uzun aralık (gün). */
export const AZAMI_ARALIK_GUN = 31;

/**
 * Tarih sürümlü kural tablosu (teslim gününe göre).
 * k: negatif dengesizlikte, l: pozitif dengesizlikte kullanılan katsayı;
 * ikisi de ilgili uzlaştırma dönemindeki sistem yönüne bağlıdır.
 */
export const KURALLAR = Object.freeze([
  Object.freeze({
    bas: '2026-01-01',
    bit: '2026-10-31',
    V: 150,
    B: 100,
    tavanCarpani: 1.05,
    k: Object.freeze({ acik: 0.06, fazla: 0.03, denge: 0.03 }),
    l: Object.freeze({ acik: 0.03, fazla: 0.06, denge: 0.03 }),
    kaynak: Object.freeze({
      formul: 'DUY m.110(1) (RG 29/12/2025-33122 ile değişik)',
      katsayi: '11/12/2025 tarihli ve 14030 sayılı Kurul Kararı (RG 29/12/2025-33122)',
      V: 'DUY m.110(2): başlangıç değeri',
      B: 'DUY m.110(2): başlangıç değeri',
    }),
  }),
  Object.freeze({
    bas: '2026-11-01',
    bit: '2026-12-31',
    V: 100,
    B: 100,
    tavanCarpani: 1.05,
    k: Object.freeze({ acik: 0.06, fazla: 0.03, denge: 0.03 }),
    l: Object.freeze({ acik: 0.03, fazla: 0.06, denge: 0.03 }),
    kaynak: Object.freeze({
      formul: 'DUY m.110(1) (RG 29/12/2025-33122 ve RG 19/10/2026-33405 ile değişik)',
      katsayi: '11/12/2025 tarihli ve 14030 sayılı Kurul Kararı (RG 29/12/2025-33122)',
      V: '24/9/2026 tarihli ve 14911 sayılı Kurul Kararı (RG 19/10/2026-33405)',
      B: 'DUY m.110(2): başlangıç değeri',
    }),
  }),
]);

/** Tarih sürümlü azami/asgari fiyat limiti. bit: null → yeni karara kadar. */
export const TAVANLAR = Object.freeze([
  Object.freeze({
    bas: '2026-04-04',
    bit: null,
    azami: 4500,
    asgari: 0,
    kaynak: '2/4/2026 tarihli ve 14459 sayılı Kurul Kararı (RG 3/4/2026)',
  }),
]);

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Gerçek bir takvim günü mü? (2026-02-30 → false) */
export function ymdGecerli(ymd) {
  const m = typeof ymd === 'string' ? YMD.exec(ymd) : null;
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1) return false;
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** ymd + n gün (takvim günü; saat dilimi etkisi yok). */
export function gunEkle(ymd, n) {
  const m = YMD.exec(ymd);
  const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n));
  return t.toISOString().slice(0, 10);
}

/** b − a, gün olarak. */
export function gunFarki(a, b) {
  const ma = YMD.exec(a), mb = YMD.exec(b);
  return Math.round((Date.UTC(+mb[1], +mb[2] - 1, +mb[3]) - Date.UTC(+ma[1], +ma[2] - 1, +ma[3])) / 86400000);
}

/** Europe/Istanbul takvim günü (YYYY-MM-DD). Türkiye kalıcı UTC+3. */
export function istanbulBugun(simdi = Date.now()) {
  return new Date(simdi + OFSET_MS).toISOString().slice(0, 10);
}

/** Epoch ms → "YYYY-MM-DDTHH:MM:SS+03:00" (Europe/Istanbul duvar saati). */
export function istanbulIso(simdi = Date.now()) {
  return new Date(simdi + OFSET_MS).toISOString().slice(0, 19) + OFSET;
}

/** Europe/Istanbul duvar saati, gün başından dakika olarak (0–1439). */
export function istanbulDakika(simdi = Date.now()) {
  const t = new Date(simdi + OFSET_MS);
  return t.getUTCHours() * 60 + t.getUTCMinutes();
}

/** İzin verilen aralık: 2026-01-01 … bugün (Europe/Istanbul). */
export function tarihGecerli(ymd, bugun) {
  if (!ymdGecerli(ymd) || !ymdGecerli(bugun)) return false;
  return ymd >= ILK_GUN && ymd <= bugun;
}

/** O teslim günü için geçerli azami/asgari fiyat limiti ya da null. */
export function tavanBul(ymd) {
  if (!ymdGecerli(ymd)) return null;
  for (const t of TAVANLAR) {
    if (ymd >= t.bas && (t.bit === null || ymd <= t.bit)) return t;
  }
  return null;
}

/**
 * O teslim günü için doğrulanmış kural; yoksa null.
 * 2026-01-01 öncesi ve 2026-12-31 sonrası → null (doğrulanmış kural yok).
 * Dönen nesne tavanı da taşır: AFL / asgari null ise tavan dalı uygulanmaz.
 */
export function kuralBul(ymd) {
  if (!ymdGecerli(ymd)) return null;
  for (const k of KURALLAR) {
    if (ymd >= k.bas && ymd <= k.bit) {
      const t = tavanBul(ymd);
      return {
        bas: k.bas,
        bit: k.bit,
        V: k.V,
        B: k.B,
        tavanCarpani: k.tavanCarpani,
        k: k.k,
        l: k.l,
        AFL: t ? t.azami : null,
        asgari: t ? t.asgari : null,
        tavanBas: t ? t.bas : null,
        kaynak: { ...k.kaynak, tavan: t ? t.kaynak : null },
      };
    }
  }
  return null;
}

/**
 * Yalnızca sonlu sayı ya da boş olmayan sayısal metin; null/''/[] ASLA 0 olmaz.
 * (functions/canli-ptf.js içindeki toPrice ile aynı anlam.)
 */
export function sayi(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Kayan nokta gürültüsünü temizler (3604.0000000000005 → 3604). Yuvarlama kuralı DEĞİLDİR. */
export function temiz(n) {
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n * 1e6) / 1e6;
  return r === 0 ? 0 : r;
}

/**
 * EPİAŞ'ın sistem yönü etiketi → 'acik' | 'fazla' | 'denge' | null.
 * Büyük/küçük harf, Türkçe harfler ve İngilizce etiketlere toleranslı.
 * Boş ya da tanınmayan etiket null döner; yön ASLA PTF–SMF kıyasından çıkarılmaz.
 */
export function yonCoz(v) {
  if (typeof v !== 'string') return null;
  const s = v
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return null;
  // Kelime sınırı zorunlu: "açıklanmadı" gibi bir metin "açık" sayılmasın.
  if (/\bacigi?\b|\bacik\b|\bdeficit\b|\bshortage\b/.test(s)) return 'acik';
  if (/\bfazla(si)?\b|\bsurplus\b|\bexcess\b/.test(s)) return 'fazla';
  if (/^(sistem )?denge(de)?$|^dengede|^balanced?$|^in balance$|^balance$/.test(s)) return 'denge';
  return null;
}

/**
 * Doğrulanmış formülle birim fiyat (TL/MWh).
 *   negatif = max(V; PTF; SMF_N) × (1 + k);  max(PTF; SMF_N) = AFL ise AFL × 1,05 × (1 + k)
 *   pozitif = min(PTF; SMF_P) × (1 − l);     min(PTF; SMF_P) < V ise (−1) × B × (1 + l)
 * Girdi ya da kural eksikse null. Tavan biliniyorsa limit dışı girdi de null.
 */
export function birimFiyat(girdi, kural) {
  if (!girdi || !kural) return null;
  const ptf = sayi(girdi.ptf), smfN = sayi(girdi.smfN), smfP = sayi(girdi.smfP);
  if (ptf === null || smfN === null || smfP === null) return null;
  const yon = girdi.yon;
  if (yon !== 'acik' && yon !== 'fazla' && yon !== 'denge') return null;
  const k = kural.k[yon], l = kural.l[yon];
  const V = kural.V, B = kural.B, AFL = kural.AFL;
  if (![k, l, V, B].every(Number.isFinite)) return null;
  if (AFL !== null && AFL !== undefined) {
    const alt = Number.isFinite(kural.asgari) ? kural.asgari : -Infinity;
    for (const x of [ptf, smfN, smfP]) if (x > AFL || x < alt) return null;
  }

  let negatif, dalNegatif;
  if (Number.isFinite(AFL) && Math.max(ptf, smfN) === AFL) {
    negatif = AFL * kural.tavanCarpani * (1 + k);
    dalNegatif = 'tavan';
  } else {
    negatif = Math.max(V, ptf, smfN) * (1 + k);
    dalNegatif = 'genel';
  }

  let pozitif, dalPozitif;
  const enDusuk = Math.min(ptf, smfP);
  if (enDusuk < V) { // sınır kesin "<": min = V ise genel dal
    pozitif = -1 * B * (1 + l);
    dalPozitif = 'esikAlti';
  } else {
    pozitif = enDusuk * (1 - l);
    dalPozitif = 'genel';
  }

  return {
    negatif: temiz(negatif),
    pozitif: temiz(pozitif),
    dalNegatif,
    dalPozitif,
    k, l, V, B,
    AFL: Number.isFinite(AFL) ? AFL : null,
  };
}

/**
 * EPİAŞ yanıtından kalem listesi. Zarf biçimi DOĞRULANMADI; savunmacı okunur:
 * body.content | body.items | items | content | çıplak dizi (ve body'nin kendisi dizi).
 * Tanınmayan biçim → null (boş liste [] ise [] döner).
 */
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

/**
 * Yanıttaki sayfa bilgisi (resmî belge: yanıt {items[], page{number,size,sort,total}}).
 * → {number, size, total} (sayılar) ya da null. Zarf biçimi doğrulanmadığı için
 * hem j.page hem j.body.page okunur.
 */
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

/** ISO eşleşmesindeki saat bölümü → İstanbul duvar saatiyle gün başından dakika (ofset dönüştürülür). */
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

/** ISO tarih(-saat) eşleşmesi → İstanbul takvim günü; geçersizse null. */
function isoGun(m) {
  if (!ymdGecerli(`${m[1]}-${m[2]}-${m[3]}`)) return null;
  if (m[4] === undefined || !m[7] || m[7] === OFSET || m[7] === '+0300') return `${m[1]}-${m[2]}-${m[3]}`;
  const of = m[7] === 'Z' ? '+00:00' : (m[7].includes(':') ? m[7] : m[7].slice(0, 3) + ':' + m[7].slice(3));
  const ms = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}${of}`);
  return Number.isFinite(ms) ? new Date(ms + OFSET_MS).toISOString().slice(0, 10) : null;
}

/**
 * Bir kalemin zaman adayları: {gun, dDk, tDk} ya da null.
 *   gun: date alanının (yoksa ISO time/hour alanının) İstanbul günü. time alanı
 *        "1970-01-01T13:00:00+03:00" gibi tarihsiz bir an olabilir; o tarih güne karıştırılmaz.
 *   dDk: date alanının saat bölümü (yoksa null) · tDk: time/hour alanının saati (yoksa null)
 * Hangisinin dönem başlangıcı olduğuna GÜN bazında karar verilir (bkz. donemlerAyrintili).
 */
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
  if (dDk === null && tDk === null) dDk = 0; // yalnız gün verilmiş: 00:00
  return { gun, dDk, tDk };
}

const iki = (n) => String(n).padStart(2, '0');

/** {ymd, dk} → "YYYY-MM-DDTHH:MM:00+03:00" */
export function basIso(ymd, dakika) {
  return `${ymd}T${iki(Math.floor(dakika / 60))}:${iki(dakika % 60)}:00${OFSET}`;
}

/** Dönemin günü (YYYY-MM-DD) ve gün başından dakikası. */
export function donemGunu(d) { return d.bas.slice(0, 10); }
export function donemDakikasi(d) { return +d.bas.slice(11, 13) * 60 + +d.bas.slice(14, 16); }

/** "00:00–01:00" (bitiş gün sonuysa 24:00) */
export function donemEtiketi(d) {
  const b = donemDakikasi(d), s = b + d.dk;
  const f = (x) => `${iki(Math.floor(x / 60))}:${iki(x % 60)}`;
  return `${f(b)}–${f(s)}`;
}

const GECERLI_DK = [5, 10, 15, 20, 30, 60];
const ALANLAR5 = ['ptf', 'smf', 'pozitif', 'negatif', 'yon'];

function maliyetler(d) {
  d.maliyetNegatif = d.negatif !== null && d.ptf !== null ? temiz(d.negatif - d.ptf) : null;
  d.maliyetPozitif = d.pozitif !== null && d.ptf !== null ? temiz(d.ptf - d.pozitif) : null;
  return d;
}

const ayniDeger = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : a === b);

/**
 * Ham EPİAŞ kalemleri → {donemler, cakisma, cokme}.
 *   donemler: sıralı, tekilleştirilmiş dizi
 *     {bas, dk, ptf, smf, pozitif, negatif, yon, maliyetNegatif, maliyetPozitif}
 *   cakisma:  aynı döneme ait kopyaların FARKLI değer taşıdığı dönem sayısı
 *   cokme:    bir günün satırları tek döneme çöktüyse true (tarih/saat biçimi çözülemedi)
 *
 * - DÖNEM BAŞLANGICI: date ve time/hour alanlarından, gün içinde saat bileşeni
 *   DEĞİŞEN alan seçilir (EPİAŞ belgesi ikisini de date-time diye tanımlar; hangisinin
 *   saati taşıdığı doğrulanmadı). Eşitlikte time alanı; ikisi farklıysa ve biri 00:00
 *   ise diğeri.
 * - Aynı başlangıçlı kopyalar birleşir (EPİAŞ bir günün her saatini iki kez
 *   döndürmüştü): boş alan diğer kopyadan tamamlanır. Kopyalar ÇELİŞİYORSA hangisinin
 *   doğru olduğu bilinemez: o dönemin tüm alanları null olur ("—"), sayaç artar.
 * - Boş alanlar null KALIR. Maliyet, iki işleneni de varsa hesaplanır.
 * - dk: aynı gün içindeki ardışık başlangıçların en küçük farkı (varsayılan 60).
 */
export function donemlerAyrintili(hamOgeler) {
  const bos = { donemler: [], cakisma: 0, cokme: false };
  if (!Array.isArray(hamOgeler)) return bos;

  // 1) Zaman adayları, gün bazında gruplanır
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
    // 2) Bu günde saat bileşeni değişen alan hangisi?
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
      const yeni = { bas: anahtar, dk: 60, ptf: sayi(o.ptf), smf: sayi(o.smf), pozitif: sayi(o.positiveImbalance), negatif: sayi(o.negativeImbalance), yon: yonCoz(o.systemStatus) };
      const eski = harita.get(anahtar);
      if (!eski) { harita.set(anahtar, yeni); continue; }
      for (const a of ALANLAR5) {
        if (yeni[a] === null) continue;
        if (eski[a] === null) eski[a] = yeni[a];
        else if (!ayniDeger(eski[a], yeni[a])) cakisan.add(anahtar);
      }
    }
    // 3) Çok satır tek döneme çöktü ve satırlar birbirini tutmuyor: biçim çözülemedi
    if (satirlar.length >= 4 && gunAnahtarlari.size === 1 && cakisan.has([...gunAnahtarlari][0])) cokme = true;
  }
  for (const anahtar of cakisan) {
    const d = harita.get(anahtar);
    for (const a of ALANLAR5) d[a] = null; // hangi kopya doğru bilinemez: değer üretilmez
  }
  const liste = [...harita.values()].sort((x, y) => (x.bas < y.bas ? -1 : x.bas > y.bas ? 1 : 0));

  // Dönem uzunluğu: gün bazında en küçük ardışık fark
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
    maliyetler(d);
  }
  return { donemler: liste, cakisma: cakisan.size, cokme };
}

/** Yalnız dönem dizisi (bkz. donemlerAyrintili). */
export function donemler(hamOgeler) {
  return donemlerAyrintili(hamOgeler).donemler;
}

/** EPİAŞ o dönemin dengesizlik fiyatlarını yayımladı mı? */
export function yayimlandi(d) {
  return !!d && d.pozitif !== null && d.negatif !== null;
}

/** Hiç gerçek değer taşıyor mu? (tamamı null bir dizi "veri" sayılmaz) */
export function veriVar(liste) {
  return Array.isArray(liste) && liste.some((d) => d.ptf !== null || d.smf !== null || d.pozitif !== null || d.negatif !== null);
}

/**
 * Tek günün tam dönem ızgarası: EPİAŞ'ın hiç döndürmediği dönemler tümü null
 * satır olarak eklenir (tabloda "—"). Değer üretilmez. Dönem sayısı = 1440 / dk.
 */
export function gunIzgarasi(ymd, liste) {
  const gun = (Array.isArray(liste) ? liste : []).filter((d) => donemGunu(d) === ymd);
  if (!gun.length) return [];
  const dk = gun[0].dk;
  const harita = new Map(gun.map((d) => [donemDakikasi(d), d]));
  const out = [];
  for (let m = 0; m < 1440; m += dk) {
    out.push(harita.get(m) || { bas: basIso(ymd, m), dk, ptf: null, smf: null, pozitif: null, negatif: null, yon: null, maliyetNegatif: null, maliyetPozitif: null });
  }
  // ızgaraya oturmayan (beklenmeyen dakikalı) gerçek satırlar da kaybolmaz
  for (const d of gun) if (donemDakikasi(d) % dk !== 0) out.push(d);
  return out.sort((x, y) => (x.bas < y.bas ? -1 : 1));
}

function ortalama(dizi) {
  const v = dizi.filter((x) => x !== null);
  return v.length ? temiz(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

/**
 * Özet. Ortalamalar YALNIZCA dengesizlik fiyatı yayımlanmış dönemler üzerinden
 * alınır (aritmetik ortalama; hacim ağırlığı yok). Hiç yoksa null.
 */
export function ozet(liste) {
  const hepsi = Array.isArray(liste) ? liste : [];
  const y = hepsi.filter(yayimlandi);
  const yon = { acik: 0, fazla: 0, denge: 0 };
  for (const d of y) if (d.yon && d.yon in yon) yon[d.yon]++;
  return {
    toplam: hepsi.length,
    yayimlanan: y.length,
    ptfOrt: ortalama(y.map((d) => d.ptf)),
    smfOrt: ortalama(y.map((d) => d.smf)),
    pozitifOrt: ortalama(y.map((d) => d.pozitif)),
    negatifOrt: ortalama(y.map((d) => d.negatif)),
    maliyetPozitifOrt: ortalama(y.map((d) => d.maliyetPozitif)),
    maliyetNegatifOrt: ortalama(y.map((d) => d.maliyetNegatif)),
    yon,
  };
}

/**
 * Bir günün EPİAŞ istek sınırları (ISO-8601, +03:00).
 * endDate günün son saat başıdır: servis bitişi "gün dahil" de "an dahil" de
 * yorumlasa saatlik serinin tamamı kapsanır (yorum DOĞRULANMADI; dönen satırlar
 * ayrıca istenen güne süzülür).
 */
export function gunSinirlari(ymd) {
  return aralikSinirlari(ymd, ymd);
}

export function aralikSinirlari(bas, bit) {
  return { startDate: `${bas}T00:00:00${OFSET}`, endDate: `${bit}T23:00:00${OFSET}` };
}

/** Sistem yönünün görünen adı (EPİAŞ'ın terimleri). */
export const YON_ADI = Object.freeze({ acik: 'Enerji açığı', fazla: 'Enerji fazlası', denge: 'Dengede' });

/** Atıf satırı — föydeki TR metin, birebir (24 Kasım 2026 itibarıyla). */
export const ATIF = 'Dayanak: Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği (RG 14/4/2009-27200) m.110 (RG 29/12/2025-33122 ve RG 19/10/2026-33405 ile değişik); k ve l katsayıları: 11/12/2025 tarihli ve 14030 sayılı Kurul Kararı (RG 29/12/2025-33122); V değeri: 24/9/2026 tarihli ve 14911 sayılı Kurul Kararı (RG 19/10/2026-33405); azami fiyat limiti: 2/4/2026 tarihli ve 14459 sayılı Kurul Kararı (RG 3/4/2026). Veri: EPİAŞ Şeffaflık Platformu. 24 Kasım 2026 itibarıyla.';

export const SAYFA_URL = 'https://voltage.com.tr/dengesizlik-maliyeti';
export const VERI_URL = 'https://voltage.com.tr/dengesizlik-maliyeti/veri';
