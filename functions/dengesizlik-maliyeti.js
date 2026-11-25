/**
 * GET /dengesizlik-maliyeti — sayfanın SUNUCU TARAFINDA render edilmiş hâli.
 *
 * functions/canli-ptf.js ile aynı yaklaşım: statik kabuk (dengesizlik-maliyeti.html)
 * context.next() ile alınır, gerçek veri çapalara gömülür. Tablo, özet, örnek
 * hesap ve JSON-LD tarayıcısız okunur (arama motorları, yapay zekâ ajanları).
 *
 * DÜRÜSTLÜK MERDİVENİ
 *   - EPİAŞ'tan şimdi alınan veri → "EPİAŞ VERİSİ" + alındığı an.
 *   - EPİAŞ'a ulaşılamıyor ama daha önce alınmış gerçek veri var → "SON SENKRON"
 *     + o çekimin zamanı (functions/_lib/epias.js, bayat:true).
 *   - Hiç veri yok → kabuk: "—" ve "EPİAŞ VERİSİ BEKLENİYOR". Uydurma rakam yok.
 *   - Yayımlanmamış dönem "—" kalır; 0 yazılmaz, taşınmaz.
 *   - SSR'da ne olursa olsun sayfa ayakta kalır (hata → statik kabuk).
 *   - EPİAŞ toplam 3,5 sn'den uzun sürerse beklenmez: bayat veri ya da bekleme hâli
 *     döner, çekim ctx.waitUntil ile sürer.
 *
 * ?tarih=YYYY-MM-DD  geçmiş gün (2026-01-01 … bugün, Europe/Istanbul). Tarihli
 *                    görünüm: robots "noindex, follow", canonical kendisi.
 * Geçersiz ?tarih    bugünün sayfası + görünür uyarı, HTTP 200, noindex,
 *                    canonical tarihsiz sayfa. (404 yerine: kullanıcı aracın
 *                    içinde kalır; adresteki değer sayfaya ASLA yansıtılmaz.)
 * ?veriyok           QA kancası: SSR atlanır, istemci de veri çekmez.
 *
 * FORMÜLE DAYALI GÜN İÇERİĞİ (örnek hesap, "†" formül karşılaştırması) yalnız
 * kural tablosunda formulGoster:true olan teslim günlerinde (2026-11-01 … 2026-12-31)
 * ve saatlik (dk = 60) veride gösterilir. Daha eski günlerde tablo yalnız EPİAŞ
 * değerlerini gösterir.
 */
import {
  kuralBul, birimFiyat, formulFarki, ozet, yayimlandi, donemEtiketi, donemDakikasi, tarihGecerli, istanbulBugun, istanbulDakika,
  gunEkle, YON_ADI, ILK_GUN, SAYFA_URL, VERI_URL, NOT_ORTALAMA,
} from './_lib/dengesizlik.js';
import { gunGetir } from './_lib/epias.js';

/** Sunucu render'ının EPİAŞ'ı bekleyeceği en uzun toplam süre. */
const SSR_SURE_MS = 3500;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const binlik = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const YON_KUCUK = { acik: 'enerji açığı', fazla: 'enerji fazlası', denge: 'dengede' };

/** tr-TR, 2 ondalık, gerçek eksi işareti (U+2212); sayı değilse "—". İstemcideki bicim() ile AYNI. */
export function bicim(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  const s = (Math.round(Math.abs(n) * 100 + 1e-7) / 100).toFixed(2).split('.');
  const out = binlik(s[0]) + ',' + s[1];
  return n < 0 && out !== '0,00' ? '−' + out : out;
}

/** Sabitler için: tam sayıysa ondalıksız ("4.500"), değilse bicim(). İstemcideki sabit() ile AYNI. */
export function sabit(n) {
  return Number.isInteger(n) ? binlik(String(n)) : bicim(n);
}

const katsayi = (n) => String(n).replace('.', ',');

/** "2026-11-23" → "23.11.2026" */
export function tarihTR(ymd) {
  const [y, m, d] = ymd.split('-');
  return `${d}.${m}.${y}`;
}

/** "2026-11-24T14:30:00+03:00" → "24.11.2026 14:30" */
const damgaZamani = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)} ${iso.slice(11, 16)}`;
const CEKILDI_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+03:00$/;

const BASLIK = 'Dengesizlik Maliyeti Hesaplama: Dengesizlik Fiyatı ve SMF';
const ACIKLAMA = 'Bugünün pozitif ve negatif dengesizlik fiyatı, SMF, PTF ve sistem yönü EPİAŞ verisiyle tek tabloda. Formül, k ve l katsayıları, hesaplayıcı, CSV ve Excel.';
const H1 = 'Dengesizlik Maliyeti: Pozitif ve Negatif Dengesizlik Fiyatı';
const INDIR_KAPALI = 'Veri alınamadığı için indirme şu an kapalı';

/**
 * Kabuktaki ÇAPALAR. Sunucu render'ı bu dizgileri birebir arar; kabukta biri
 * değişirse ilgili alan sessizce güncellenmeden kalırdı. Bu yüzden
 * docs/qa/test-dengesizlik.mjs her çapanın kabukta TAM BİR KEZ geçtiğini denetler.
 */
export const CAPA = Object.freeze({
  title: `<title>${BASLIK}</title>`,
  aciklama: `<meta name="description" content="${ACIKLAMA}">`,
  robots: '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">',
  canonical: `<link rel="canonical" href="${SAYFA_URL}">`,
  alternatifJson: `<link rel="alternate" type="application/json" href="${VERI_URL}?bicim=json"`,
  alternatifCsv: `<link rel="alternate" type="text/csv" href="${VERI_URL}?bicim=csv"`,
  ogUrl: `<meta property="og:url" content="${SAYFA_URL}">`,
  ogTitle: `<meta property="og:title" content="${BASLIK}">`,
  ogAciklama: `<meta property="og:description" content="${ACIKLAMA}">`,
  body: '<body>',
  h1: `<h1>${H1}</h1>`,
  gun: '<span id="dGun">—</span>',
  uyari: '<p class="uyari" id="dUyari" role="status"></p>',
  bantGun: '<span id="dBantGun">—</span>',
  mod: '<span class="live-mode waiting" id="dMod">VERİ BEKLENİYOR</span>',
  yayim: '<span id="dYayim">—</span>',
  ptfOrt: '<div class="cv" id="dPtfOrt">—</div>',
  smfOrt: '<div class="cv" id="dSmfOrt">—</div>',
  malPoz: '<div class="cv" id="dMalPoz">—</div>',
  malNeg: '<div class="cv" id="dMalNeg">—</div>',
  yonAcik: '<b id="dYonAcik">—</b>',
  yonFazla: '<b id="dYonFazla">—</b>',
  yonDenge: '<b id="dYonDenge">—</b>',
  damga: '<span class="live-stamp waiting" id="dDamga">EPİAŞ VERİSİ BEKLENİYOR</span>',
  ozet: '<p class="day-sum" id="dOzet"></p>',
  tarih: '<input type="date" id="dTarih" name="tarih" min="2026-01-01" required>',
  onceki: '<a class="btn-ikincil" id="dOnceki" rel="nofollow" aria-disabled="true">',
  sonraki: '<a class="btn-ikincil" id="dSonraki" rel="nofollow" aria-disabled="true">',
  csv: '<a class="btn-ikincil" id="dCsv" rel="nofollow" aria-disabled="true">',
  xlsx: '<a class="btn-ikincil" id="dXlsx" rel="nofollow" aria-disabled="true">',
  json: '<a class="btn-ikincil" id="dJson" rel="nofollow" aria-disabled="true">',
  indirNot: `<span class="indir-not" id="dIndirNot">${INDIR_KAPALI}</span>`,
  bas: '<input type="date" id="dBas" name="bas" min="2026-01-01" required>',
  bit: '<input type="date" id="dBit" name="bit" min="2026-01-01" required>',
  kuralUyari: '<p class="uyari" id="dKuralUyari" role="status"></p>',
  tabloBaslik: '<caption id="dTabloBaslik">Dönem bazında PTF, SMF, sistem yönü ve dengesizlik fiyatları · tüm değerler TL/MWh</caption>',
  tablo: '<tbody id="dTablo">\n        <tr><td colspan="8" class="bekle">Veri bekleniyor…</td></tr>\n      </tbody>',
  farkNot: '<p class="note fark-not" id="dFarkNot"></p>',
  donem: '<select id="hDonem"><option value="">Veri bekleniyor</option></select>',
  ornek: '<div class="ornek" id="dOrnek"></div>',
});

/** Çapayı güvenle değiştirir; çapa yoksa HTML'e dokunmaz. Fonksiyon biçimi: $&, $1 yorumlanmasın. */
function swap(html, anchor, replacement) {
  return html.includes(anchor) ? html.replace(anchor, () => replacement) : html;
}

const hucre = (n) => (n === null ? '<td class="bos">—</td>' : `<td>${bicim(n)}</td>`);
const veriOzn = (ad, v) => (v === null ? '' : ` data-${ad}="${v}"`);

/**
 * Tablo satırları. Dönem sayısı veriden gelir (24, 96, …); sabit sayı yok.
 * simdiDk: bugünün görünümünde İstanbul dakikası (içinde bulunulan dönem işaretlenir), yoksa null.
 * kural: o günün kuralı (formül karşılaştırması için; yoksa "†" basılmaz).
 * İstemcideki satirHtml() ile AYNI çıktı.
 */
export function satirlarHtml(donemler, simdiDk, kural) {
  let h = '';
  for (const d of donemler) {
    const b = donemDakikasi(d);
    const simdi = simdiDk !== null && simdiDk >= b && simdiDk < b + d.dk;
    const fark = formulFarki(d, kural);
    h += `<tr${simdi ? ' class="simdi"' : ''} data-bas="${d.bas}" data-dk="${d.dk}"`
      + veriOzn('ptf', d.ptf) + veriOzn('smf', d.smf) + veriOzn('yon', d.yon) + veriOzn('poz', d.pozitif) + veriOzn('neg', d.negatif) + '>'
      + `<th scope="row">${donemEtiketi(d)}`
      + (fark ? '<span class="fark" aria-hidden="true"> †</span><span class="sr-only"> (yayımlanan fiyat formül sonucundan farklı)</span>' : '')
      + (simdi ? '<span class="sr-only"> (içinde bulunulan dönem)</span>' : '') + '</th>'
      + hucre(d.ptf) + hucre(d.smf)
      + (d.yon ? `<td class="yon yon-${d.yon}">${YON_ADI[d.yon]}</td>` : '<td class="yon bos">—</td>')
      + hucre(d.pozitif) + hucre(d.negatif) + hucre(d.maliyetPozitif) + hucre(d.maliyetNegatif) + '</tr>';
  }
  return h;
}

/** "†" notu; fark yoksa ''. İstemcideki farkNotu() ile AYNI. */
export function farkNotu(n) {
  return n ? `† ${n} dönemde EPİAŞ'ın yayımladığı fiyat, bu sayfadaki formül sonucundan farklıdır; tabloda EPİAŞ değeri gösterilir.` : '';
}

/**
 * Tarihli, atıflı özet. İstemcideki ozetCumlesi() ile AYNI.
 * "Son yayımlanan dönem" yalnız gün tamamlanmamışsa yazılır.
 */
export function ozetCumlesi(tarih, o, donemler, cekildi) {
  if (!o.yayimlanan) return `${tarihTR(tarih)} için EPİAŞ henüz dengesizlik fiyatı yayımlamadı. Tabloda yalnızca yayımlanmış değerler görünür. Veri: EPİAŞ Şeffaflık Platformu.`;
  const kapsam = o.yayimlanan === o.toplam ? `${o.toplam} dönemin tamamı` : `${o.yayimlanan}/${o.toplam} dönem`;
  let s = `${tarihTR(tarih)} dengesizlik özeti (${kapsam}): ortalama pozitif dengesizlik fiyatı ${bicim(o.pozitifOrt)} TL/MWh; ortalama negatif dengesizlik fiyatı ${bicim(o.negatifOrt)} TL/MWh; `
    + `ortalama PTF ${bicim(o.ptfOrt)} TL/MWh; ortalama SMF ${bicim(o.smfOrt)} TL/MWh. `
    + `Ortalama pozitif dengesizlik maliyeti (PTF'ye göre) ${bicim(o.maliyetPozitifOrt)} TL/MWh, ortalama negatif dengesizlik maliyeti (PTF'ye göre) ${bicim(o.maliyetNegatifOrt)} TL/MWh. `
    + `Sistem yönü: ${o.yon.acik} dönem enerji açığı, ${o.yon.fazla} dönem enerji fazlası, ${o.yon.denge} dönem dengede.`;
  const yayimlananlar = donemler.filter(yayimlandi);
  if (o.yayimlanan !== o.toplam && yayimlananlar.length) {
    const d = yayimlananlar[yayimlananlar.length - 1];
    s += ` Son yayımlanan dönem ${donemEtiketi(d)}: pozitif dengesizlik fiyatı ${bicim(d.pozitif)} TL/MWh, negatif dengesizlik fiyatı ${bicim(d.negatif)} TL/MWh, PTF ${bicim(d.ptf)} TL/MWh, SMF ${bicim(d.smf)} TL/MWh`
      + (d.yon ? `, sistem yönü ${YON_KUCUK[d.yon]}` : '') + '.';
  }
  return s + ' Veri: EPİAŞ Şeffaflık Platformu' + (cekildi ? `, ${damgaZamani(cekildi)} (Türkiye saati) itibarıyla` : '')
    + '; ortalamalar Voltage Enerji tarafından bu veriden, yalnızca dengesizlik fiyatı yayımlanan dönemler üzerinden hesaplanmıştır. ' + NOT_ORTALAMA;
}

/** Tablonun üstündeki tarih uyarısı (veriden bağımsız). İstemcideki kuralUyarisi() ile AYNI. */
export function kuralUyarisi(tarih) {
  const kural = kuralBul(tarih);
  if (!kural) return 'Bu tarih için bu sayfada doğrulanmış bir dengesizlik fiyatı kuralı yok; tablo EPİAŞ\'ın yayımladığı değerleri gösterir. 110. maddenin 1 Ocak 2027\'den itibaren uygulanacak metni bu sayfada henüz doğrulanmamıştır.';
  if (!kural.formulGoster) return `Bu tarihte V değeri ${sabit(kural.V)} TL/MWh idi; aşağıdaki yöntem bölümü 1 Kasım 2026 ve sonrasında uygulanan değerleri anlatır.`;
  return '';
}

/** Hesaplayıcının dönem seçenekleri (sunucu doldurur; JS yokken de doğru). İstemcideki donemSecenekleri() ile AYNI. */
export function donemSecenekleriHtml(donemler) {
  let son = '';
  for (const d of donemler) if (yayimlandi(d)) son = d.bas;
  const hedef = son || donemler[0].bas;
  return donemler.map((d) => `<option value="${d.bas}"${d.bas === hedef ? ' selected' : ''}>${donemEtiketi(d)}${yayimlandi(d) ? '' : ' (yayımlanmadı)'}</option>`).join('');
}

/**
 * Örnek hesap: günün son tam yayımlanmış döneminden, KODLA hesaplanır.
 * Yalnız formülün gösterildiği teslim günlerinde (formulGoster) ve saatlik veride.
 * Formül sonucu EPİAŞ'ın yayımladığı değerle yan yana gösterilir; fark varsa
 * gizlenmez. Uygun dönem yoksa '' döner (bölüm görünmez).
 */
export function ornekHtml(tarih, donemler) {
  const kural = kuralBul(tarih);
  if (!kural || !kural.formulGoster) return '';
  if (donemler.some((x) => x.dk !== 60)) {
    // Saat içindeki 15 dakikalık SMF'ler için SMF_N = SMF_P varsayımı yapılmaz.
    return `<p>Bu günün verisi ${donemler[0].dk} dakikalık dönemlerle yayımlanmış; örnek hesap yalnızca saatlik dönemli günlerde gösterilir.</p>`;
  }
  let d = null, r = null;
  for (let i = donemler.length - 1; i >= 0; i--) {
    const x = donemler[i];
    if (!yayimlandi(x) || x.ptf === null || x.smf === null || !x.yon) continue;
    const y = birimFiyat({ ptf: x.ptf, smfN: x.smf, smfP: x.smf, yon: x.yon }, kural);
    if (y) { d = x; r = y; break; }
  }
  if (!d) return '';
  const p = bicim(d.ptf), s = bicim(d.smf);
  const neg = r.dalNegatif === 'tavan'
    ? `Negatif: max(PTF; SMF) = AFL olduğu için ${sabit(r.AFL)} × 1,05 × (1 + ${katsayi(r.k)}) = ${bicim(r.negatif)} TL/MWh`
    : `Negatif: max(${sabit(r.V)}; ${p}; ${s}) × (1 + ${katsayi(r.k)}) = ${bicim(r.negatif)} TL/MWh`;
  const poz = r.dalPozitif === 'esikAlti'
    ? `Pozitif: min(${p}; ${s}) = ${bicim(Math.min(d.ptf, d.smf))} &lt; V (${sabit(r.V)}) olduğu için (−1) × ${sabit(r.B)} × (1 + ${katsayi(r.l)}) = ${bicim(r.pozitif)} TL/MWh`
    : `Pozitif: min(${p}; ${s}) × (1 − ${katsayi(r.l)}) = ${bicim(r.pozitif)} TL/MWh`;
  const fN = Math.abs(r.negatif - d.negatif), fP = Math.abs(r.pozitif - d.pozitif);
  const uyum = !formulFarki(d, kural)
    ? 'Formül sonucu yayımlanan değerlerle aynıdır.'
    : `Formül sonucu ile yayımlanan değer arasında fark vardır (negatif ${bicim(fN)} TL/MWh, pozitif ${bicim(fP)} TL/MWh). Tabloda EPİAŞ'ın yayımladığı değer gösterilir.`;
  return `<h3>Örnek hesap: ${tarihTR(tarih)}, ${donemEtiketi(d)}</h3>`
    + `<p>EPİAŞ verisi: PTF ${p} TL/MWh; SMF ${s} TL/MWh; sistem yönü ${YON_KUCUK[d.yon]}. Bu yönde k = ${katsayi(r.k)} ve l = ${katsayi(r.l)}; V = ${sabit(r.V)} TL/MWh, B = ${sabit(r.B)} TL/MWh`
    + (r.AFL !== null ? `, AFL = ${sabit(r.AFL)} TL/MWh.` : '.') + '</p>'
    + `<p class="hesap-satiri">${neg}</p><p class="hesap-satiri">${poz}</p>`
    + `<p>EPİAŞ'ın bu dönem için yayımladığı değerler: negatif ${bicim(d.negatif)} TL/MWh, pozitif ${bicim(d.pozitif)} TL/MWh. ${uyum}</p>`
    + `<p class="hesap-satiri">Birim dengesizlik maliyeti (PTF'ye göre, EPİAŞ fiyatlarıyla): negatif ${bicim(d.negatif)} − ${p} = ${bicim(d.maliyetNegatif)} TL/MWh; pozitif ${p} − ${d.pozitif < 0 ? `(${bicim(d.pozitif)})` : bicim(d.pozitif)} = ${bicim(d.maliyetPozitif)} TL/MWh</p>`;
}

/** JSON-LD bloğunu ayrıştırıp düzenler; ayrıştırılamazsa dokunmaz. */
function jsonLdDuzenle(html, duzenle) {
  return html.replace(/(<script type="application\/ld\+json" id="dJsonLd">)([\s\S]*?)(<\/script>)/, (hepsi, a, govde, c) => {
    try {
      const j = JSON.parse(govde);
      duzenle(Array.isArray(j['@graph']) ? j['@graph'] : []);
      return `${a}\n${JSON.stringify(j).replace(/</g, '\\u003c')}\n${c}`;
    } catch (e) {
      return hepsi;
    }
  });
}

const dugum = (graf, tur) => graf.find((n) => n && n['@type'] === tur);

/**
 * Veriden BAĞIMSIZ hazırlık: seçili gün, tarih alanları, önceki/sonraki gün,
 * tarih uyarısı; tarihli görünümde başlık/açıklama/robots/canonical. Rakam basmaz.
 */
export function kabukHazirla(html, { tarih, bugun, tarihli, gecersiz }) {
  const t = tarihTR(tarih);
  html = swap(html, CAPA.gun, `<span id="dGun">${t}</span>`);
  html = swap(html, CAPA.bantGun, `<span id="dBantGun">${t}</span>`);
  html = swap(html, CAPA.tabloBaslik, `<caption id="dTabloBaslik">${t} · dönem bazında PTF, SMF, sistem yönü ve dengesizlik fiyatları · tüm değerler TL/MWh</caption>`);
  html = swap(html, CAPA.tarih, `<input type="date" id="dTarih" name="tarih" min="${ILK_GUN}" max="${bugun}" value="${tarih}" required>`);
  const bas0 = gunEkle(tarih, -6) < ILK_GUN ? ILK_GUN : gunEkle(tarih, -6);
  html = swap(html, CAPA.bas, `<input type="date" id="dBas" name="bas" min="${ILK_GUN}" max="${bugun}" value="${bas0}" required>`);
  html = swap(html, CAPA.bit, `<input type="date" id="dBit" name="bit" min="${ILK_GUN}" max="${bugun}" value="${tarih}" required>`);
  if (tarih > ILK_GUN) html = swap(html, CAPA.onceki, `<a class="btn-ikincil" id="dOnceki" rel="nofollow" href="/dengesizlik-maliyeti?tarih=${gunEkle(tarih, -1)}">`);
  if (tarih < bugun) html = swap(html, CAPA.sonraki, `<a class="btn-ikincil" id="dSonraki" rel="nofollow" href="/dengesizlik-maliyeti?tarih=${gunEkle(tarih, 1)}">`);
  const ku = kuralUyarisi(tarih);
  if (ku) html = swap(html, CAPA.kuralUyari, `<p class="uyari" id="dKuralUyari" role="status">${esc(ku)}</p>`);

  if (tarihli) {
    const kendi = `${SAYFA_URL}?tarih=${tarih}`;
    const baslik = `Dengesizlik Maliyeti ${t}: Dönem Bazında Fiyatlar`;
    const aciklama = `${t} için dönem bazında PTF, SMF, sistem yönü, pozitif ve negatif dengesizlik fiyatı. Veri: EPİAŞ Şeffaflık Platformu. CSV, Excel ve JSON indirme.`;
    html = swap(html, CAPA.robots, '<meta name="robots" content="noindex, follow">');
    html = swap(html, CAPA.canonical, `<link rel="canonical" href="${kendi}">`);
    html = swap(html, CAPA.ogUrl, `<meta property="og:url" content="${kendi}">`);
    html = swap(html, CAPA.title, `<title>${baslik}</title>`);
    html = swap(html, CAPA.ogTitle, `<meta property="og:title" content="${baslik}">`);
    html = swap(html, CAPA.aciklama, `<meta name="description" content="${aciklama}">`);
    html = swap(html, CAPA.ogAciklama, `<meta property="og:description" content="${aciklama}">`);
    html = swap(html, CAPA.h1, `<h1>${H1} · ${t}</h1>`);
    html = swap(html, CAPA.alternatifJson, `<link rel="alternate" type="application/json" href="${VERI_URL}?tarih=${tarih}&amp;bicim=json"`);
    html = swap(html, CAPA.alternatifCsv, `<link rel="alternate" type="text/csv" href="${VERI_URL}?tarih=${tarih}&amp;bicim=csv"`);
    html = jsonLdDuzenle(html, (graf) => {
      const sayfa = dugum(graf, 'WebPage');
      if (sayfa) { sayfa.url = kendi; sayfa.name = baslik; sayfa.description = aciklama; }
      // Tarihli görünüm o günün verisini anlatır: kapsam ve indirme adresleri o güne çekilir.
      const set = dugum(graf, 'Dataset');
      if (set) {
        set.temporalCoverage = tarih;
        if (Array.isArray(set.distribution)) {
          for (const dg of set.distribution) {
            const m = /[?&]bicim=(csv|xlsx|json)/.exec(dg.contentUrl || '');
            if (m) dg.contentUrl = `${VERI_URL}?tarih=${tarih}&bicim=${m[1]}`;
          }
        }
      }
    });
  } else if (gecersiz) {
    html = swap(html, CAPA.robots, '<meta name="robots" content="noindex, follow">');
  }
  return swap(html, CAPA.body, `<body data-tarih="${tarih}" data-bugun="${bugun}"${gecersiz ? ' data-gecersiz="1"' : ''}>`);
}

/** Geçersiz tarih uyarısı. Veri yokken "Bugünün verisi gösteriliyor" DENMEZ. İstemcideki uyariYaz() ile AYNI. */
export function gecersizUyarisi(bugun, veriVar) {
  return `Adresteki tarih geçerli değil ya da seçilebilir aralığın dışında. ${veriVar ? 'Bugünün verisi gösteriliyor. ' : ''}Seçilebilir aralık: ${tarihTR(ILK_GUN)} – ${tarihTR(bugun)}.`;
}

/** Gerçek veriyi gömer. sonuc: gunGetir çıktısı (durum 'veri'). */
export function veriBas(html, sonuc, { bugun, simdiDk }) {
  const { tarih, donemler, cekildi, bayat } = sonuc;
  const o = ozet(donemler);
  const kural = kuralBul(tarih);
  const zamanli = typeof cekildi === 'string' && CEKILDI_RE.test(cekildi);

  // Tablo — sayfanın çekirdeği. Fonksiyonla değiştir: değer içindeki $ dizileri yorumlanmasın.
  const satirlar = satirlarHtml(donemler, tarih === bugun ? simdiDk : null, kural);
  html = html.replace(/(<tbody id="dTablo">)[\s\S]*?(<\/tbody>)/, (m, a, b) => a + satirlar + b);

  // Dönem bazında tutarlılık: yayımlanan fiyat formülden farklıysa satır "†" taşır.
  const farkli = donemler.filter((d) => formulFarki(d, kural)).length;
  if (farkli) {
    html = swap(html, CAPA.farkNot, `<p class="note fark-not" id="dFarkNot">${esc(farkNotu(farkli))}</p>`);
    // Yapılandırılmış tek satır günlük: yalnız sayaç ve tarih, değer yok.
    console.warn(JSON.stringify({ olay: 'dengesizlik-formul-farki', tarih, donem: farkli }));
  }

  // Özet bandı
  html = swap(html, CAPA.yayim, `<span id="dYayim">${o.yayimlanan} / ${o.toplam}</span>`);
  html = swap(html, CAPA.ptfOrt, `<div class="cv" id="dPtfOrt">${bicim(o.ptfOrt)}</div>`);
  html = swap(html, CAPA.smfOrt, `<div class="cv" id="dSmfOrt">${bicim(o.smfOrt)}</div>`);
  html = swap(html, CAPA.malPoz, `<div class="cv" id="dMalPoz">${bicim(o.maliyetPozitifOrt)}</div>`);
  html = swap(html, CAPA.malNeg, `<div class="cv" id="dMalNeg">${bicim(o.maliyetNegatifOrt)}</div>`);
  if (o.yayimlanan) {
    html = swap(html, CAPA.yonAcik, `<b id="dYonAcik">${o.yon.acik}</b>`);
    html = swap(html, CAPA.yonFazla, `<b id="dYonFazla">${o.yon.fazla}</b>`);
    html = swap(html, CAPA.yonDenge, `<b id="dYonDenge">${o.yon.denge}</b>`);
  }

  // Durum damgası: çekim zamanı bilinmiyorsa "alındı" iddiası da edilmez.
  const an = zamanli ? `<time datetime="${cekildi}">${damgaZamani(cekildi)}</time>` : null;
  if (bayat) {
    html = swap(html, CAPA.mod, '<span class="live-mode stale" id="dMod">SON SENKRON</span>');
    html = swap(html, CAPA.damga, `<span class="live-stamp stale" id="dDamga">${an ? `SON SENKRON ${an}` : 'SON SENKRON —'}</span>`);
  } else {
    html = swap(html, CAPA.mod, '<span class="live-mode" id="dMod">EPİAŞ VERİSİ</span>');
    html = swap(html, CAPA.damga, `<span class="live-stamp" id="dDamga">${an ? `EPİAŞ'TAN ALINDI ${an}` : 'EPİAŞ VERİSİ'}</span>`);
  }

  // Tarihli özet: veri kendi gününü taşır (dönemler istenen güne süzülmüştür).
  html = swap(html, CAPA.ozet, `<p class="day-sum" id="dOzet">${esc(ozetCumlesi(tarih, o, donemler, zamanli ? cekildi : null))}</p>`);

  // İndirme bağlantıları yalnız veri varken açılır; kabukta pasif + görünür neden.
  for (const b of ['csv', 'xlsx', 'json']) {
    const id = `d${b[0].toUpperCase()}${b.slice(1)}`;
    html = swap(html, CAPA[b], `<a class="btn-ikincil" id="${id}" rel="nofollow" href="/dengesizlik-maliyeti/veri?tarih=${tarih}&amp;bicim=${b}" download>`);
  }
  html = swap(html, CAPA.indirNot, `<span class="indir-not" id="dIndirNot" hidden>${INDIR_KAPALI}</span>`);

  // Hesaplayıcının dönem seçenekleri (JS yokken de "Veri bekleniyor" demesin)
  html = swap(html, CAPA.donem, `<select id="hDonem">${donemSecenekleriHtml(donemler)}</select>`);

  // Örnek hesap (kodla; uygun dönem yoksa bölüm boş kalır)
  const ornek = ornekHtml(tarih, donemler);
  if (ornek) html = swap(html, CAPA.ornek, `<div class="ornek" id="dOrnek">${ornek}</div>`);

  // Geçersiz tarihte gösterilen bugünün verisi: uyarı bunu söyler.
  if (html.includes('data-gecersiz="1"')) html = swap(html, CAPA.uyari, `<p class="uyari" id="dUyari" role="status">${esc(gecersizUyarisi(bugun, true))}</p>`);

  // JSON-LD: yalnız dateModified veri çekim anına çekilir. Tarihsiz görünümde Dataset'in
  // kapsamı ("2026-01-01/..") ve indirme adresleri SABİT kalır.
  if (zamanli) {
    html = jsonLdDuzenle(html, (graf) => {
      const sayfa = dugum(graf, 'WebPage');
      if (sayfa) sayfa.dateModified = cekildi;
      const set = dugum(graf, 'Dataset');
      if (set) set.dateModified = cekildi;
    });
  }

  // İstemciye "bu sayfa sunucuda dolduruldu" işareti (ilk boyamada silmesin).
  return html.replace(/<body data-tarih="/, () => `<body data-ssr="1"${zamanli ? ` data-cekildi="${cekildi}"` : ''}${bayat ? ' data-bayat="1"' : ''} data-tarih="`);
}

function htmlYanit(html, kabuk, maxAge, sMaxAge, noindex) {
  // Kabuğun başlıkları (CSP, HSTS … — _headers) korunur; gövdeye bağlı olanlar atılır.
  const h = new Headers(kabuk && kabuk.headers ? kabuk.headers : undefined);
  for (const ad of ['content-length', 'etag', 'last-modified', 'content-encoding', 'accept-ranges', 'cache-control']) h.delete(ad);
  h.set('Content-Type', 'text/html; charset=utf-8');
  h.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMaxAge}, must-revalidate`);
  if (noindex) h.set('X-Robots-Tag', 'noindex, follow');
  return new Response(html, { status: 200, headers: h });
}

export async function onRequestGet(context) {
  const { request } = context;
  let shell = null;
  try {
    // context.next() → Pages'in kendi varlık hattı (temiz URL çözümü dahil).
    shell = await context.next();
    if (!shell) throw new Error('next() returned no response');
    if (shell.status !== 200) return shell;

    const q = new URL(request.url).searchParams;
    // QA kancası: SSR'ı atla, dürüst bekleme hâlini göster
    if (q.has('veriyok')) return shell;

    // context.secenek yalnız testlerde vardır (sahte fetch / sabit saat); üretimde tanımsızdır.
    const sec = context.secenek;
    const simdi = sec && typeof sec.simdi === 'function' ? sec.simdi() : Date.now();
    const bugun = istanbulBugun(simdi);
    const ham = q.get('tarih');
    const tarihli = ham !== null && tarihGecerli(ham, bugun);
    const gecersiz = ham !== null && !tarihli;
    const tarih = tarihli ? ham : bugun;
    const noindex = tarihli || gecersiz;

    const kabuk = await shell.clone().text();
    const hazir = kabukHazirla(kabuk, { tarih, bugun, tarihli, gecersiz });
    // Toplam süre sınırı (giriş + rapor tek sınır): aşılırsa bayat veri ya da bekleme
    // hâli döner; çekim ctx.waitUntil ile sürer ve bir sonraki isteğe hazır olur.
    const sonuc = await gunGetir(context.env, context, tarih, { sureMs: SSR_SURE_MS, ...(sec || {}) });
    // Dürüstlük: gerçek veri yoksa rakamsız kabuk döner ("—" + EPİAŞ VERİSİ BEKLENİYOR)
    if (!sonuc || sonuc.durum !== 'veri' || !sonuc.donemler.length) {
      const bekleyen = gecersiz ? swap(hazir, CAPA.uyari, `<p class="uyari" id="dUyari" role="status">${esc(gecersizUyarisi(bugun, false))}</p>`) : hazir;
      return htmlYanit(bekleyen, shell, 30, 60, noindex);
    }

    const dolu = veriBas(hazir, sonuc, { bugun, simdiDk: istanbulDakika(simdi) });
    // Bugün: yeni dönemler yayımlanıyor (60/300 sn). Geçmiş gün: 5 dk / 1 saat. Bayat veri: kısa.
    const [a, b] = sonuc.bayat ? [30, 60] : (tarih >= gunEkle(bugun, -1) ? [60, 300] : [300, 3600]);
    return htmlYanit(dolu, shell, a, b, noindex);
  } catch (e) {
    // SSR'da ne olursa olsun sayfa AYAKTA kalır.
    console.error('dengesizlik-maliyeti SSR failed, serving static shell:', e && e.message);
    if (shell) return shell;
    // null döndürmek runtime 500 demektir: yanıt gelmezse aşağıdaki 503'e düş.
    try { const yedek = await context.next(); if (yedek) return yedek; } catch (_) { /* aşağıda 503 */ }
    return new Response('Sayfa geçici olarak yüklenemedi.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}

// HEAD istekleri 405 almasın; SSR yolundan geçmez (gövdesiz yanıt için EPİAŞ'a gidilmez).
export async function onRequestHead(context) {
  const yanit = await context.next();
  try {
    // Tarihli (ve geçersiz tarihli) görünüm GET'te noindex'tir; HEAD de aynı başlığı taşır.
    if (yanit && yanit.status === 200 && new URL(context.request.url).searchParams.has('tarih')) {
      const h = new Headers(yanit.headers);
      h.set('X-Robots-Tag', 'noindex, follow');
      return new Response(null, { status: 200, headers: h });
    }
  } catch (e) { /* başlık eklenemediyse varlık yanıtı aynen döner */ }
  return yanit;
}
