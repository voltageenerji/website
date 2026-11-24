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
 *
 * ?tarih=YYYY-MM-DD  geçmiş gün (2026-01-01 … bugün, Europe/Istanbul). Tarihli
 *                    görünüm: robots "noindex, follow", canonical kendisi.
 * Geçersiz ?tarih    bugünün sayfası + görünür uyarı, HTTP 200, noindex,
 *                    canonical tarihsiz sayfa. (404 yerine: kullanıcı aracın
 *                    içinde kalır; adresteki değer sayfaya ASLA yansıtılmaz.)
 * ?veriyok           QA kancası: SSR atlanır, istemci de veri çekmez.
 */
import {
  kuralBul, birimFiyat, ozet, yayimlandi, donemEtiketi, donemDakikasi, tarihGecerli, istanbulBugun, istanbulDakika,
  gunEkle, YON_ADI, ILK_GUN, SAYFA_URL, VERI_URL,
} from './_lib/dengesizlik.js';
import { gunGetir } from './_lib/epias.js';

/** Sunucu render'ının EPİAŞ'ı bekleyeceği en uzun toplam süre. */
const SSR_SURE_MS = 3500;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** tr-TR, 2 ondalık, gerçek eksi işareti (U+2212); sayı değilse "—". İstemcideki bicim() ile AYNI. */
export function bicim(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  const s = (Math.round(Math.abs(n) * 100 + 1e-7) / 100).toFixed(2).split('.');
  const out = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1];
  return n < 0 && out !== '0,00' ? '−' + out : out;
}

/** Sabitler için: tam sayıysa ondalıksız ("4.500"), değilse bicim(). */
function sabit(n) {
  return Number.isInteger(n) ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : bicim(n);
}

const katsayi = (n) => String(n).replace('.', ',');

/** "2026-11-23" → "23.11.2026" */
export function tarihTR(ymd) {
  const [y, m, d] = ymd.split('-');
  return `${d}.${m}.${y}`;
}

/** Çapayı güvenle değiştirir; çapa yoksa HTML'e dokunmaz. Fonksiyon biçimi: $&, $1 yorumlanmasın. */
function swap(html, anchor, replacement) {
  return html.includes(anchor) ? html.replace(anchor, () => replacement) : html;
}

const hucre = (n) => (n === null ? '<td class="bos">—</td>' : `<td>${bicim(n)}</td>`);
const veriOzn = (ad, v) => (v === null ? '' : ` data-${ad}="${v}"`);

/**
 * Tablo satırları. Dönem sayısı veriden gelir (24, 96, …); sabit sayı yok.
 * simdiDk: bugünün görünümünde İstanbul dakikası (içinde bulunulan dönem işaretlenir), yoksa null.
 * İstemcideki satirHtml() ile AYNI çıktı.
 */
export function satirlarHtml(donemler, simdiDk) {
  let h = '';
  for (const d of donemler) {
    const b = donemDakikasi(d);
    const simdi = simdiDk !== null && simdiDk >= b && simdiDk < b + d.dk;
    h += `<tr${simdi ? ' class="simdi"' : ''} data-bas="${d.bas}" data-dk="${d.dk}"`
      + veriOzn('ptf', d.ptf) + veriOzn('smf', d.smf) + veriOzn('yon', d.yon) + veriOzn('poz', d.pozitif) + veriOzn('neg', d.negatif) + '>'
      + `<th scope="row">${donemEtiketi(d)}${simdi ? '<span class="sr-only"> (içinde bulunulan dönem)</span>' : ''}</th>`
      + hucre(d.ptf) + hucre(d.smf)
      + (d.yon ? `<td class="yon yon-${d.yon}">${YON_ADI[d.yon]}</td>` : '<td class="yon bos">—</td>')
      + hucre(d.pozitif) + hucre(d.negatif) + hucre(d.maliyetPozitif) + hucre(d.maliyetNegatif) + '</tr>';
  }
  return h;
}

/** Tarihli, atıflı tek cümlelik özet. İstemcideki ozetCumlesi() ile AYNI. */
export function ozetCumlesi(tarih, o) {
  if (!o.yayimlanan) return `${tarihTR(tarih)} için EPİAŞ henüz dengesizlik fiyatı yayımlamadı. Tabloda yalnızca yayımlanmış değerler görünür. Veri: EPİAŞ Şeffaflık Platformu.`;
  const kapsam = o.yayimlanan === o.toplam ? `${o.toplam} dönemin tamamı` : `${o.yayimlanan}/${o.toplam} dönem`;
  return `${tarihTR(tarih)} dengesizlik özeti (${kapsam}): ortalama PTF ${bicim(o.ptfOrt)} TL/MWh; ortalama SMF ${bicim(o.smfOrt)} TL/MWh; `
    + `PTF'ye göre ortalama maliyet pozitif dengesizlikte ${bicim(o.maliyetPozitifOrt)} TL/MWh, negatif dengesizlikte ${bicim(o.maliyetNegatifOrt)} TL/MWh. `
    + `Sistem yönü: ${o.yon.acik} dönem enerji açığı, ${o.yon.fazla} dönem enerji fazlası, ${o.yon.denge} dönem dengede. `
    + 'Veri: EPİAŞ Şeffaflık Platformu; ortalamalar Voltage Enerji tarafından bu veriden, yalnızca dengesizlik fiyatı yayımlanan dönemler üzerinden hesaplanmıştır.';
}

/** "2026-11-24T14:30:00+03:00" → "24.11 14:30" */
const damgaZamani = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)} ${iso.slice(11, 16)}`;

/**
 * Örnek hesap: günün son tam yayımlanmış döneminden, KODLA hesaplanır.
 * Formül sonucu EPİAŞ'ın yayımladığı değerle yan yana gösterilir; fark varsa
 * gizlenmez. Uygun dönem ya da doğrulanmış kural yoksa '' döner (bölüm görünmez).
 */
export function ornekHtml(tarih, donemler) {
  const kural = kuralBul(tarih);
  if (!kural) return '';
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
  const uyum = fN < 0.005 && fP < 0.005
    ? 'Formül sonucu yayımlanan değerlerle aynıdır.'
    : `Formül sonucu ile yayımlanan değer arasında fark vardır (negatif ${bicim(fN)} TL/MWh, pozitif ${bicim(fP)} TL/MWh). Tabloda EPİAŞ'ın yayımladığı değer gösterilir.`;
  return `<h3>Örnek hesap: ${tarihTR(tarih)}, ${donemEtiketi(d)}</h3>`
    + `<p>EPİAŞ verisi: PTF ${p} TL/MWh; SMF ${s} TL/MWh; sistem yönü ${YON_ADI[d.yon].toLocaleLowerCase('tr')}. Bu yönde k = ${katsayi(r.k)} ve l = ${katsayi(r.l)}; V = ${sabit(r.V)} TL/MWh, B = ${sabit(r.B)} TL/MWh`
    + (r.AFL !== null ? `, AFL = ${sabit(r.AFL)} TL/MWh.` : '.') + '</p>'
    + `<p class="hesap-satiri">${neg}</p><p class="hesap-satiri">${poz}</p>`
    + `<p>EPİAŞ'ın bu dönem için yayımladığı değerler: negatif ${bicim(d.negatif)} TL/MWh, pozitif ${bicim(d.pozitif)} TL/MWh. ${uyum}</p>`
    + `<p class="hesap-satiri">PTF'ye göre maliyet (EPİAŞ fiyatlarıyla): negatif ${bicim(d.negatif)} − ${p} = ${bicim(d.maliyetNegatif)} TL/MWh; pozitif ${p} − ${d.pozitif < 0 ? `(${bicim(d.pozitif)})` : bicim(d.pozitif)} = ${bicim(d.maliyetPozitif)} TL/MWh</p>`;
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
 * indirme bağlantıları; tarihli görünümde robots/canonical. Rakam basmaz.
 */
export function kabukHazirla(html, { tarih, bugun, tarihli, gecersiz }) {
  const t = tarihTR(tarih);
  html = swap(html, '<span id="dGun">—</span>', `<span id="dGun">${t}</span>`);
  html = swap(html, '<span id="dBantGun">—</span>', `<span id="dBantGun">${t}</span>`);
  html = swap(html, '<caption id="dTabloBaslik">Dönem bazında PTF, SMF, sistem yönü ve dengesizlik fiyatları · tüm değerler TL/MWh</caption>',
    `<caption id="dTabloBaslik">${t} · dönem bazında PTF, SMF, sistem yönü ve dengesizlik fiyatları · tüm değerler TL/MWh</caption>`);
  html = swap(html, '<input type="date" id="dTarih" name="tarih" min="2026-01-01" required>',
    `<input type="date" id="dTarih" name="tarih" min="${ILK_GUN}" max="${bugun}" value="${tarih}" required>`);
  const bas0 = gunEkle(tarih, -6) < ILK_GUN ? ILK_GUN : gunEkle(tarih, -6);
  html = swap(html, '<input type="date" id="dBas" name="bas" min="2026-01-01" required>',
    `<input type="date" id="dBas" name="bas" min="${ILK_GUN}" max="${bugun}" value="${bas0}" required>`);
  html = swap(html, '<input type="date" id="dBit" name="bit" min="2026-01-01" required>',
    `<input type="date" id="dBit" name="bit" min="${ILK_GUN}" max="${bugun}" value="${tarih}" required>`);
  if (tarih > ILK_GUN) {
    html = swap(html, '<a class="btn-ikincil" id="dOnceki" rel="nofollow" aria-disabled="true">',
      `<a class="btn-ikincil" id="dOnceki" rel="nofollow" href="/dengesizlik-maliyeti?tarih=${gunEkle(tarih, -1)}">`);
  }
  if (tarih < bugun) {
    html = swap(html, '<a class="btn-ikincil" id="dSonraki" rel="nofollow" aria-disabled="true">',
      `<a class="btn-ikincil" id="dSonraki" rel="nofollow" href="/dengesizlik-maliyeti?tarih=${gunEkle(tarih, 1)}">`);
  }
  for (const b of ['csv', 'xlsx', 'json']) {
    html = swap(html, `href="/dengesizlik-maliyeti/veri?bicim=${b}" download>`, `href="/dengesizlik-maliyeti/veri?tarih=${tarih}&amp;bicim=${b}" download>`);
  }

  if (tarihli) {
    const kendi = `${SAYFA_URL}?tarih=${tarih}`;
    html = swap(html, '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">', '<meta name="robots" content="noindex, follow">');
    html = swap(html, `<link rel="canonical" href="${SAYFA_URL}">`, `<link rel="canonical" href="${kendi}">`);
    html = swap(html, `<meta property="og:url" content="${SAYFA_URL}">`, `<meta property="og:url" content="${kendi}">`);
    html = swap(html, '<title>Dengesizlik Maliyeti: Pozitif ve Negatif Dengesizlik Fiyatı</title>', `<title>Dengesizlik Maliyeti ${t}: Dönem Bazında Fiyatlar</title>`);
    html = swap(html, `href="${VERI_URL}?bicim=json"`, `href="${VERI_URL}?tarih=${tarih}&amp;bicim=json"`);
    html = swap(html, `href="${VERI_URL}?bicim=csv"`, `href="${VERI_URL}?tarih=${tarih}&amp;bicim=csv"`);
    html = jsonLdDuzenle(html, (graf) => {
      const sayfa = dugum(graf, 'WebPage');
      if (sayfa) { sayfa.url = kendi; sayfa.name = `Dengesizlik Maliyeti ${t}: Dönem Bazında Fiyatlar`; }
    });
  } else if (gecersiz) {
    html = swap(html, '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">', '<meta name="robots" content="noindex, follow">');
    html = swap(html, '<p class="uyari" id="dUyari" role="status"></p>',
      `<p class="uyari" id="dUyari" role="status">Adresteki tarih geçerli değil ya da seçilebilir aralığın dışında. Bugünün verisi gösteriliyor. Seçilebilir aralık: ${tarihTR(ILK_GUN)} – ${tarihTR(bugun)}.</p>`);
  }
  return swap(html, '<body>', `<body data-tarih="${tarih}" data-bugun="${bugun}">`);
}

/** Gerçek veriyi gömer. sonuc: gunGetir çıktısı (durum 'veri'). */
export function veriBas(html, sonuc, { bugun, simdiDk }) {
  const { tarih, donemler, cekildi, bayat } = sonuc;
  const o = ozet(donemler);

  // Tablo — sayfanın çekirdeği. Fonksiyonla değiştir: değer içindeki $ dizileri yorumlanmasın.
  const satirlar = satirlarHtml(donemler, tarih === bugun ? simdiDk : null);
  html = html.replace(/(<tbody id="dTablo">)[\s\S]*?(<\/tbody>)/, (m, a, b) => a + satirlar + b);

  // Özet bandı
  html = swap(html, '<span id="dYayim">—</span>', `<span id="dYayim">${o.yayimlanan} / ${o.toplam}</span>`);
  html = swap(html, '<div class="cv" id="dPtfOrt">—</div>', `<div class="cv" id="dPtfOrt">${bicim(o.ptfOrt)}</div>`);
  html = swap(html, '<div class="cv" id="dSmfOrt">—</div>', `<div class="cv" id="dSmfOrt">${bicim(o.smfOrt)}</div>`);
  html = swap(html, '<div class="cv" id="dMalPoz">—</div>', `<div class="cv" id="dMalPoz">${bicim(o.maliyetPozitifOrt)}</div>`);
  html = swap(html, '<div class="cv" id="dMalNeg">—</div>', `<div class="cv" id="dMalNeg">${bicim(o.maliyetNegatifOrt)}</div>`);
  if (o.yayimlanan) {
    html = swap(html, '<b id="dYonAcik">—</b>', `<b id="dYonAcik">${o.yon.acik}</b>`);
    html = swap(html, '<b id="dYonFazla">—</b>', `<b id="dYonFazla">${o.yon.fazla}</b>`);
    html = swap(html, '<b id="dYonDenge">—</b>', `<b id="dYonDenge">${o.yon.denge}</b>`);
  }

  // Durum damgası: çekim zamanı bilinmiyorsa "alındı" iddiası da edilmez.
  const zamanli = typeof cekildi === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(cekildi);
  if (bayat) {
    html = swap(html, '<span class="live-mode waiting" id="dMod">VERİ BEKLENİYOR</span>', '<span class="live-mode stale" id="dMod">SON SENKRON</span>');
    html = swap(html, '<span class="live-stamp waiting" id="dDamga">EPİAŞ VERİSİ BEKLENİYOR</span>',
      `<span class="live-stamp stale" id="dDamga">SON SENKRON ${zamanli ? damgaZamani(cekildi) : '—'}</span>`);
  } else {
    html = swap(html, '<span class="live-mode waiting" id="dMod">VERİ BEKLENİYOR</span>', '<span class="live-mode" id="dMod">EPİAŞ VERİSİ</span>');
    html = swap(html, '<span class="live-stamp waiting" id="dDamga">EPİAŞ VERİSİ BEKLENİYOR</span>',
      `<span class="live-stamp" id="dDamga">${zamanli ? `EPİAŞ'TAN ALINDI ${damgaZamani(cekildi)}` : 'EPİAŞ VERİSİ'}</span>`);
  }

  // Tarihli özet: veri kendi gününü taşır (dönemler istenen güne süzülmüştür).
  html = swap(html, '<p class="day-sum" id="dOzet"></p>', `<p class="day-sum" id="dOzet">${esc(ozetCumlesi(tarih, o))}</p>`);

  // Örnek hesap (kodla; uygun dönem yoksa bölüm boş kalır)
  const ornek = ornekHtml(tarih, donemler);
  if (ornek) html = swap(html, '<div class="ornek" id="dOrnek"></div>', `<div class="ornek" id="dOrnek">${ornek}</div>`);

  // JSON-LD: veri günü, kapsam ve o günün indirme adresleri
  html = jsonLdDuzenle(html, (graf) => {
    const sayfa = dugum(graf, 'WebPage');
    // dateModified veri günüdür; yayın tarihinden eski bir güne geri çekilmez.
    if (sayfa && typeof sayfa.datePublished === 'string' && tarih >= sayfa.datePublished) sayfa.dateModified = tarih;
    const set = dugum(graf, 'Dataset');
    if (set) {
      set.temporalCoverage = tarih;
      if (sayfa && sayfa.dateModified) set.dateModified = sayfa.dateModified;
      if (Array.isArray(set.distribution)) {
        for (const dg of set.distribution) {
          const m = /[?&]bicim=(csv|xlsx|json)/.exec(dg.contentUrl || '');
          if (m) dg.contentUrl = `${VERI_URL}?tarih=${tarih}&bicim=${m[1]}`;
        }
      }
    }
  });

  // İstemciye "bu sayfa sunucuda dolduruldu" işareti (ilk boyamada silmesin).
  return html.replace(/<body data-tarih="/, () => `<body data-ssr="1"${zamanli ? ` data-cekildi="${esc(cekildi)}"` : ''}${bayat ? ' data-bayat="1"' : ''} data-tarih="`);
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
    if (!sonuc || sonuc.durum !== 'veri' || !sonuc.donemler.length) return htmlYanit(hazir, shell, 30, 60, noindex);

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
