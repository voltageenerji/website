/**
 * Dengesizlik maliyeti — SAF MANTIK (ağ yok, saat yok, yan etki yok).
 *
 * Dayanak föyü: docs/seo/DENGESIZLIK-KAYNAK-TEYIT.md (24.11.2026). Buradaki her
 * sabit o föydeki "TEYİT EDİLDİ" satırlarından gelir; föyün "Açık" listesindeki
 * hiçbir şey burada varsayılmaz:
 *   - 31/12/2026 sonrası için kural YOKTUR (kuralBul → null).
 *   - 2026 kural geçmişi birincil kaynaklardan doğrulandı (Enerji Piyasası ajanı, 25.11.2026:
 *     1/1–25/11/2026 Resmî Gazete fihristleri ve içlerindeki tüm EPDK kararları).
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
 *
 * DOĞRULAMA DURUMU (her kural ve tavan girdisinde):
 *   'birincil' — değerler birincil kaynaklardan (Resmî Gazete, EPDK, DUY konsolide metni)
 *                okunup doğrulandı; dogrulamaTarihi o günü verir.
 *   'bekliyor' — değerler henüz birincil kaynaklardan doğrulanmadı (Enerji Piyasası ajanı
 *                2026 geçmişini doğruluyor). Bu teslim günlerinde formüle dayalı içerik
 *                (örnek hesap, "†" karşılaştırması, "Kendi senaryom" hesabı) GÖSTERİLMEZ.
 * Formüle dayalı içerik bir teslim günü için YALNIZ o günü kapsayan kural VE tavan girdisinin
 * ikisi de 'birincil' ise gösterilir (kuralBul → formulGoster). Doğrulanan tablo gelince
 * yalnız durumlar çevrilir / girdi eklenir; kod değişmez.
 */
export const KURALLAR = Object.freeze([
  Object.freeze({
    bas: '2026-01-01',
    bit: '2026-10-31',
    dogrulama: 'birincil',
    dogrulamaTarihi: '2026-11-25',
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
    dogrulama: 'birincil',
    dogrulamaTarihi: '2026-11-24',
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

/**
 * Tarih sürümlü azami/asgari fiyat limiti. bit: null → yeni karara kadar.
 * Doğrulama durumu teslim günü dönemine göre tutulur (aynı karar iki dönemde ayrı tarihte doğrulandı).
 */
export const TAVANLAR = Object.freeze([
  Object.freeze({
    bas: '2026-01-01',
    bit: '2026-04-03',
    dogrulama: 'birincil',
    dogrulamaTarihi: '2026-11-25',
    azami: 3400,
    asgari: 0,
    kaynak: '27/3/2025 tarihli ve 13423 sayılı Kurul Kararı (RG 5/4/2025-32861)',
  }),
  Object.freeze({
    bas: '2026-04-04',
    bit: '2026-10-31',
    dogrulama: 'birincil',
    dogrulamaTarihi: '2026-11-25',
    azami: 4500,
    asgari: 0,
    kaynak: '2/4/2026 tarihli ve 14459 sayılı Kurul Kararı (RG 3/4/2026-33213)',
  }),
  Object.freeze({
    bas: '2026-11-01',
    bit: null,
    dogrulama: 'birincil',
    dogrulamaTarihi: '2026-11-24',
    azami: 4500,
    asgari: 0,
    kaynak: '2/4/2026 tarihli ve 14459 sayılı Kurul Kararı (RG 3/4/2026-33213)',
  }),
]);

/**
 * YAYIM İSTİSNALARI: EPİAŞ'ın yayımladığı fiyatların o gün yürürlükteki formülden saatlerin çoğunda
 * farklı olduğu teslim günü aralıkları. Böyle bir aralıkta satır başına "†" ve örnek hesaptaki
 * karşılaştırma gösterilmez; tablonun üstünde tek bir gün düzeyi not gösterilir (JSON yayimNotlari,
 * XLSX "Bilgi" sayfası). Düzeltme gerekirse yalnız bu tablo değişir.
 * Şu an istisna YOK. EPİAŞ günlük bülten PDF'lerinde 1–25 Ocak 2026 fiyatları eski kurala göre;
 * Şeffaflık API değerleri formülle uyumlu (26.11.2026 kabul denetimi). Sayfa API değerlerini
 * gösterdiği için not gerekmez. 2026-11-03 12:00 için de aynı: yalnız bülten farklı.
 * Tek dönemlik farklar istisna DEĞİLDİR: olağan "†" ile gösterilir.
 */
export const YAYIM_NOTLARI = Object.freeze({});
export const YAYIM_ISTISNALARI = Object.freeze([]);

let aktifIstisnalar = YAYIM_ISTISNALARI;
let aktifNotlar = YAYIM_NOTLARI;

/**
 * YALNIZ TESTLER İÇİN: mekanizmayı UYDURMA bir istisna tablosuyla sınamak. Argümansız çağrı
 * yayımlanan tabloya (YAYIM_ISTISNALARI / YAYIM_NOTLARI) döner. Üretim kodu çağırmaz.
 */
export function _yayimIstisnaTablosu(istisnalar, notlar) {
  aktifIstisnalar = Array.isArray(istisnalar) ? istisnalar : YAYIM_ISTISNALARI;
  aktifNotlar = notlar && typeof notlar === 'object' ? notlar : YAYIM_NOTLARI;
}

/** O teslim gününün yayım istisnası ({bas, bit, not, metin}) ya da null. */
export function yayimIstisnasi(ymd) {
  if (!ymdGecerli(ymd)) return null;
  const x = aktifIstisnalar.find((i) => ymd >= i.bas && ymd <= i.bit);
  return x && aktifNotlar[x.not] ? { bas: x.bas, bit: x.bit, not: x.not, metin: aktifNotlar[x.not] } : null;
}

/** [bas, bit] ile kesişen yayım istisnaları → [{bas, bit, not: metin}] (JSON yayimNotlari, XLSX "Bilgi"). */
export function yayimNotlariAralik(bas, bit) {
  return aktifIstisnalar.filter((x) => x.bit >= bas && x.bas <= bit && aktifNotlar[x.not]).map((x) => ({ bas: x.bas, bit: x.bit, not: aktifNotlar[x.not] }));
}

/** Doğrulama durumları. */
export const DOGRULAMA = Object.freeze({ BIRINCIL: 'birincil', BEKLIYOR: 'bekliyor' });

/** Kural tablosunun birincil metinlerden doğrulandığı gün (föy tarihi). */
export const KURAL_DOGRULAMA = '2026-11-24';

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
 * O teslim günü için kural; yoksa null.
 * 2026-01-01 öncesi ve 2026-12-31 sonrası → null (bu sayfada kural yok).
 * Dönen nesne tavanı da taşır: AFL / asgari null ise tavan dalı uygulanmaz.
 * formulGoster: kural VE tavan girdisi 'birincil' ise true (aksi hâlde formüle dayalı içerik yok).
 */
export function kuralBul(ymd) {
  if (!ymdGecerli(ymd)) return null;
  for (const k of KURALLAR) {
    if (ymd >= k.bas && ymd <= k.bit) {
      const t = tavanBul(ymd);
      const dogrulandi = k.dogrulama === DOGRULAMA.BIRINCIL && !!t && t.dogrulama === DOGRULAMA.BIRINCIL;
      const istisna = yayimIstisnasi(ymd);
      return {
        bas: k.bas,
        bit: k.bit,
        dogrulama: k.dogrulama,
        tavanDogrulama: t ? t.dogrulama : null,
        formulGoster: dogrulandi,
        // Yayımlanan değerle formül karşılaştırması ("†", örnek hesaptaki uyum cümlesi): istisna günlerinde yok.
        karsilastir: dogrulandi && !istisna,
        istisna: istisna ? istisna.not : null,
        dogrulamaTarihi: dogrulandi ? [k.dogrulamaTarihi, t.dogrulamaTarihi].sort().at(-1) : null,
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
 * Kural × tavan kesişim dilimleri (tarih sırasıyla). Aynı kural diliminde tavan
 * değişirse (4/4/2026) iki ayrı girdi çıkar; her girdinin bas/bit'i KENDİ geçerlilik
 * aralığıdır, böylece girdiler birbirinden ayırt edilir.
 */
export function kuralDilimleri() {
  const out = [];
  for (const k of KURALLAR) {
    const sinirlar = [k.bas];
    for (const t of TAVANLAR) {
      if (t.bas > k.bas && t.bas <= k.bit) sinirlar.push(t.bas);
      if (t.bit !== null && t.bit >= k.bas && t.bit < k.bit) sinirlar.push(gunEkle(t.bit, 1));
    }
    const sirali = [...new Set(sinirlar)].sort();
    sirali.forEach((bas, i) => {
      const bit = i + 1 < sirali.length ? gunEkle(sirali[i + 1], -1) : k.bit;
      const r = kuralBul(bas);
      out.push({ bas, bit, V: r.V, B: r.B, k: r.k, l: r.l, AFL: r.AFL, asgari: r.asgari, tavanBas: r.tavanBas, tavanCarpani: r.tavanCarpani, kaynak: r.kaynak, dogrulama: r.dogrulama, tavanDogrulama: r.tavanDogrulama, dogrulandi: r.formulGoster });
    });
  }
  return out;
}

/** Formüle dayalı içeriğin gösterildiği (kural + tavan 'birincil') bitişik teslim günü aralıkları. */
export function dogrulanmisAraliklar() {
  const out = [];
  for (const d of kuralDilimleri()) {
    if (!d.dogrulandi) continue;
    const son = out.at(-1);
    if (son && gunEkle(son.bit, 1) === d.bas) son.bit = d.bit; else out.push({ bas: d.bas, bit: d.bit });
  }
  return out;
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
 * Yayımlanan dönem, formül sonucundan farklı mı? (|fark| > 0,01 TL/MWh)
 * Yalnız saatlik (dk = 60) dönemde ve formülün gösterildiği kural diliminde
 * karşılaştırılır; karşılaştırılamıyorsa false (iddia yok).
 * Saat içi 15 dakikalık SMF'ler bilinmediği için dk ≠ 60'ta SMF_N = SMF_P varsayılmaz.
 */
export function formulFarki(d, kural) {
  if (!d || !kural || kural.formulGoster !== true || kural.karsilastir === false || d.dk !== 60) return false;
  if (d.pozitif === null || d.negatif === null || d.ptf === null || d.smf === null || !d.yon) return false;
  const r = birimFiyat({ ptf: d.ptf, smfN: d.smf, smfP: d.smf, yon: d.yon }, kural);
  if (!r) return false;
  return Math.abs(r.negatif - d.negatif) > 0.01 + 1e-9 || Math.abs(r.pozitif - d.pozitif) > 0.01 + 1e-9;
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

export const GECERLI_DK = Object.freeze([5, 10, 15, 20, 30, 60]);
const ALANLAR5 = ['ptf', 'smf', 'pozitif', 'negatif', 'yon'];
const YONLER = ['acik', 'fazla', 'denge'];

function maliyetler(d) {
  d.maliyetNegatif = d.negatif !== null && d.ptf !== null ? temiz(d.negatif - d.ptf) : null;
  d.maliyetPozitif = d.pozitif !== null && d.ptf !== null ? temiz(d.ptf - d.pozitif) : null;
  return d;
}

const ayniDeger = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : a === b);

/** Sözleşmenin desteklediği tek sürüm (docs/epias-proxy/PIYASA-VERI-MIMARISI.md §3). */
export const PIYASA_SURUM = 1;
/** Tek yanıtta kabul edilen en çok gün (sözleşme sınırı 31; fazlası sözleşme ihlalidir). */
const AZAMI_YANIT_GUN = 31;
/** Gelecekteki bir zaman damgasına tanınan saat kayması payı. */
const SAAT_PAYI_MS = 5 * 60 * 1000;

const BAS_RE = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d):00\+03:00$/;
const AN_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * ISO-8601 an (ofsetli) → "YYYY-MM-DDTHH:MM:SS+03:00"; geçersizse ya da `simdi`den
 * belirgin biçimde ilerideyse null.
 */
export function anCoz(v, simdi) {
  if (typeof v !== 'string' || !AN_RE.test(v)) return null;
  const ms = Date.parse(v);
  if (!Number.isFinite(ms)) return null;
  if (Number.isFinite(simdi) && ms > simdi + SAAT_PAYI_MS) return null;
  return istanbulIso(ms);
}

/** Sözleşmede fiyat: sonlu sayı ya da null. Başka her şey sözleşme ihlalidir (undefined döner). */
function fiyatAlani(v) {
  if (v === null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return undefined;
}

/**
 * `GET /piyasa/v1/dengesizlik` yanıtı → doğrulanmış günler. ÜST-AKIŞA GÜVENİLMEZ:
 * proxy'nin ürettiği JSON burada yeniden doğrulanır ve normalleştirilir.
 *
 *   → { hata: null, gunler: Map<ymd, {tarih, cekildi, bayat, donemler}>, uretildi, cakisma }
 *   → { hata: 'bicim' }   sözleşme ihlali: sürüm yanlış, zorunlu alan yok, alan türü yanlış,
 *                          dönem başlangıcı/uzunluğu geçersiz, aynı gün iki kez
 *
 * - Zorunlu alanlar: surum (=1), uretildi, gunler[]; gün başına tarih, cekildi, bayat, donemler[];
 *   dönem başına bas, dk ve ptf/smf/pozitif/negatif/yon anahtarları (değer null olabilir).
 * - `tam`, `kaynak`, `yonHam` okunmaz: tamlık ve yayım durumu dönemlerden yeniden hesaplanır.
 * - null ASLA 0 olmaz; fiyat yalnız sonlu sayıdır (metin, boolean → sözleşme ihlali).
 * - bas: "YYYY-MM-DDTHH:MM:00+03:00", tarihi günün tarihi; dk ∈ {5,10,15,20,30,60}, gün içinde
 *   tek değer ve bas dk'ya bölünür. Dönem sayısı veriden gelir (24, 96, …).
 * - Aynı başlangıçlı kopyalar birleşir (boş alan diğerinden tamamlanır). Kopyalar ÇELİŞİYORSA
 *   hangisinin doğru olduğu bilinemez: o dönemin tüm alanları null ("—"), sayaç artar.
 * - İstenen [bas, bit] dışındaki günler yok sayılır.
 */
export function piyasaCoz(j, bas, bit, simdi) {
  const bicim = { hata: 'bicim' };
  if (!j || typeof j !== 'object' || Array.isArray(j)) return bicim;
  if (j.surum !== PIYASA_SURUM) return bicim;
  const uretildi = anCoz(j.uretildi, simdi);
  if (!uretildi || !Array.isArray(j.gunler) || j.gunler.length > AZAMI_YANIT_GUN) return bicim;
  const gunler = new Map();
  const gorulen = new Set();
  let cakisma = 0;
  for (const g of j.gunler) {
    if (!g || typeof g !== 'object' || Array.isArray(g) || !ymdGecerli(g.tarih)) return bicim;
    const cekildi = anCoz(g.cekildi, simdi);
    if (!cekildi || typeof g.bayat !== 'boolean' || !Array.isArray(g.donemler) || g.donemler.length > 1440 / 5 * 2) return bicim;
    if (gorulen.has(g.tarih)) return bicim;
    gorulen.add(g.tarih);
    const harita = new Map();
    const cakisan = new Set();
    let dk0 = null;
    for (const d of g.donemler) {
      if (!d || typeof d !== 'object' || Array.isArray(d)) return bicim;
      const m = typeof d.bas === 'string' ? BAS_RE.exec(d.bas) : null;
      if (!m || m[1] !== g.tarih) return bicim;
      if (!GECERLI_DK.includes(d.dk)) return bicim;
      if (dk0 === null) dk0 = d.dk; else if (d.dk !== dk0) return bicim;
      if ((+m[2] * 60 + +m[3]) % d.dk !== 0) return bicim;
      for (const a of ALANLAR5) if (!Object.prototype.hasOwnProperty.call(d, a)) return bicim;
      const yeni = { bas: d.bas, dk: d.dk, ptf: fiyatAlani(d.ptf), smf: fiyatAlani(d.smf), pozitif: fiyatAlani(d.pozitif), negatif: fiyatAlani(d.negatif), yon: d.yon };
      if (ALANLAR5.slice(0, 4).some((a) => yeni[a] === undefined)) return bicim;
      if (yeni.yon !== null && !YONLER.includes(yeni.yon)) return bicim;
      const eski = harita.get(d.bas);
      if (!eski) { harita.set(d.bas, yeni); continue; }
      for (const a of ALANLAR5) {
        if (yeni[a] === null) continue;
        if (eski[a] === null) eski[a] = yeni[a];
        else if (!ayniDeger(eski[a], yeni[a])) cakisan.add(d.bas);
      }
    }
    for (const b of cakisan) { const d = harita.get(b); for (const a of ALANLAR5) d[a] = null; }
    cakisma += cakisan.size;
    if (g.tarih < bas || g.tarih > bit) continue;
    const donemler = [...harita.values()].sort((x, y) => (x.bas < y.bas ? -1 : x.bas > y.bas ? 1 : 0)).map(maliyetler);
    gunler.set(g.tarih, { tarih: g.tarih, cekildi, bayat: g.bayat, donemler });
  }
  return { hata: null, gunler, uretildi, cakisma };
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

/** Sistem yönünün görünen adı (EPİAŞ'ın terimleri). */
export const YON_ADI = Object.freeze({ acik: 'Enerji açığı', fazla: 'Enerji fazlası', denge: 'Dengede' });

/** Atıf satırı (R8, sahip kararı 26.11.2026: sade sayfa) — DUY m.110 + Karar 14030 + veri kaynağı. */
export const ATIF = 'Dayanak: Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği m.110; katsayılar: 11/12/2025 tarihli ve 14030 sayılı Kurul Kararı. Veri: EPİAŞ Şeffaflık Platformu.';

/** Ortalamaların ne olduğu / ne olmadığı (özet cümlesi, JSON "not", XLSX "Bilgi"). */
export const NOT_ORTALAMA = 'Ortalamalar dönemlerin aritmetik ortalamasıdır; dengesizlik hacmiyle ağırlıklandırılmamıştır. Bir portföyün gerçekleşen ya da beklenen dengesizlik maliyeti değildir; her dönemde aynı yönde 1 MWh dengesizliği olan düz bir profilin MWh başı ortalamasına karşılık gelir.';

export const SAYFA_URL = 'https://voltage.com.tr/dengesizlik-maliyeti';
export const VERI_URL = 'https://voltage.com.tr/dengesizlik-maliyeti/veri';
