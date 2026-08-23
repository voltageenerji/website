/**
 * GET /canli-ptf — sayfanın SUNUCU TARAFINDA render edilmiş hâli.
 *
 * NEDEN: Sayfa verisini yalnızca tarayıcı çekiyordu; Google'ın gördüğü HTML'de
 * hiçbir rakam yoktu. "Saatlik PTF fiyatları" gibi VERİ sorgularında üst sıradaki
 * rakipler (EPİAŞ, Selenka, Gain) rakamları sunucudan basıyor. Bu fonksiyon aynı
 * veriyi HTML'e gömer: tarayıcısı olmayan tarayıcı botları da tabloyu okur.
 *
 * DÜRÜSTLÜK KURALI (index.html ve statik sayfayla birebir aynı):
 *   - Veri çekilemezse statik kabuk olduğu gibi döner: "—" ve VERİ BEKLENİYOR.
 *     Asla eski/uydurma rakam basılmaz.
 *   - Değeri olmayan saat tabloda "—" kalır; taşıma/interpolasyon YOK.
 *   - Sunucu render'ı yalnızca ilk boyamadır; sayfadaki JS canlı tazelemeyi
 *     devralır (progressive enhancement).
 *
 * ?ptfoff  → SSR devre dışı (QA kancası, istemcideki kancayla aynı ad).
 */

const PROXY = 'https://epias-proxy.emirhantan-ku.workers.dev';
const TIMEOUT_MS = 4000;
const TR_MONTHS = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];

/** Yalnızca sayı veya boş olmayan sayısal metin; null/''/[] ASLA 0 olmaz. */
export function toPrice(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function fmt(n) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function hh(n) {
  return String(n).padStart(2, '0');
}

/** Europe/Istanbul saati (0-23). Türkiye kalıcı UTC+3. */
function istanbulHour() {
  try {
    const s = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hourCycle: 'h23' }).format(new Date());
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? Math.min(23, Math.max(0, n)) : null;
  } catch (e) {
    return null;
  }
}

/** Europe/Istanbul tarihi, YYYY-MM-DD (JSON-LD dateModified için). */
function istanbulDate() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch (e) {
    return null;
  }
}

async function fetchJson(url) {
  try {
    const r = await fetch(url, {
      cf: { cacheTtl: 120, cacheEverything: true },
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

/** Worker yanıtından 24 elemanlı fiyat dizisi; eksik saat null KALIR. */
export function pricesFrom(data) {
  if (!data || !Array.isArray(data.items) || !data.items.length) return null;
  const out = [];
  let any = false;
  for (let h = 0; h < 24; h++) {
    const it = data.items.find((x) => x && x.hour === h);
    const p = it ? toPrice(it.price) : null;
    if (p !== null) any = true;
    out.push(p);
  }
  return any ? out : null; // tek bir gerçek değer bile yoksa SSR yapma
}

/** "2026-08-01..23" → " · 1–23 AĞU" (istemcideki periodLabel ile aynı) */
function periodLabel(range) {
  const m = /^(\d{4})-(\d{2})-(\d{2})\.\.(\d{1,2})$/.exec(range || '');
  if (!m) return '';
  const ad = TR_MONTHS[parseInt(m[2], 10) - 1] || '';
  return ' · ' + parseInt(m[3], 10) + '–' + parseInt(m[4], 10) + ' ' + ad;
}

/** Tek bir çapayı güvenle değiştirir; çapa yoksa HTML'e dokunmaz. */
function swap(html, anchor, replacement) {
  return html.includes(anchor) ? html.replace(anchor, replacement) : html;
}

export function inject(html, prices, stats) {
  const nowH = istanbulHour();
  const vals = [];
  const idx = [];
  for (let h = 0; h < 24; h++) {
    if (prices[h] !== null) { vals.push(prices[h]); idx.push(h); }
  }

  // Saatlik tablo — sayfanın SEO çekirdeği
  let rows = '';
  for (let h = 0; h < 24; h++) {
    const v = prices[h];
    const isNow = nowH !== null && h === nowH && v !== null;
    rows += `<tr${isNow ? ' class="now"' : ''}><td>${hh(h)}:00</td><td>${v !== null ? fmt(v) : '—'}</td></tr>`;
  }
  // Fonksiyonla değiştir: değer içindeki $&, $', $1 gibi diziler desen olarak
  // yorumlanmasın (QA DEF-9 — bugün değerler sayı ama kapı kapalı kalsın).
  html = html.replace(/(<tbody id="pTable">)[\s\S]*?(<\/tbody>)/, (m, a, b) => a + rows + b);

  // Anlık değer + durum damgası. İkisi BİRLİKTE basılır: saat bilinmiyorsa
  // "CANLI" iddiası da edilmez (QA DEF-10).
  const nowPrice = nowH !== null ? prices[nowH] : null;
  html = swap(html, '<span id="pNow">—</span>', `<span id="pNow">${nowPrice !== null ? fmt(nowPrice) : '—'}</span>`);
  if (nowH !== null) {
    html = swap(html, '<span class="live-mode waiting" id="pMode">—</span>', '<span class="live-mode" id="pMode">CANLI</span>');
    html = swap(html, '<span class="live-stamp waiting" id="pStamp">—</span>', `<span class="live-stamp" id="pStamp">SAAT ${hh(nowH)}:00 · EPİAŞ</span>`);
  }

  // Günün min / maks / ortalama
  if (vals.length) {
    const min = Math.min.apply(null, vals);
    const max = Math.max.apply(null, vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    html = swap(html, '<div class="cv" id="pMin">—</div>', `<div class="cv" id="pMin">${fmt(min)}</div>`);
    html = swap(html, '<div class="cv" id="pMax">—</div>', `<div class="cv" id="pMax">${fmt(max)}</div>`);
    html = swap(html, '<div class="cv" id="pAvg">—</div>', `<div class="cv" id="pAvg">${fmt(avg)}</div>`);
    html = swap(html, '<div class="ch" id="pMinH"></div>', `<div class="ch" id="pMinH">${hh(idx[vals.indexOf(min)])}:00</div>`);
    html = swap(html, '<div class="ch" id="pMaxH"></div>', `<div class="ch" id="pMaxH">${hh(idx[vals.indexOf(max)])}:00</div>`);
  }

  // Aylık ortalama (opsiyonel — gelmezse "—" kalır)
  // Sözleşme alanı `monthRange` (bkz. CHANGELOG "/ptf/stats"); istemciler de
  // bunu okur. Dönem etiketi olmadan sayı basılmaz — atıfsız rakam yayınlamayız.
  if (stats && Number.isFinite(stats.monthAvg)) {
    const label = periodLabel(stats.monthRange);
    if (label) {
      html = swap(html, '<div class="cv" id="pMo">—</div>', `<div class="cv" id="pMo">${fmt(stats.monthAvg)}</div>`);
      html = swap(html, '<div class="ck" id="pMoK">Aylık Ortalama</div>', `<div class="ck" id="pMoK">Aylık Ortalama${label}</div>`);
    }
  }

  // Tazelik sinyali: sayfanın birincil içeriği (fiyat serisi) her gün değişir.
  const d = istanbulDate();
  if (d) html = html.replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/, () => `"dateModified":"${d}"`);

  // İstemciye "bu sayfa sunucuda dolduruldu" işareti: sayfadaki JS ilk boyamada
  // bu gerçek rakamların üzerine BOŞ durum yazmasın (QA DEF-1).
  html = swap(html, '<body>', '<body data-ssr="1">');

  return html;
}

function htmlResponse(html, maxAge, sMaxAge) {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${sMaxAge}, must-revalidate`,
    },
  });
}

export async function onRequestGet(context) {
  const { request } = context;
  let shell = null;
  try {
    // context.next() → Pages'in kendi varlık hattı. ASSETS binding'ine ve temiz
    // URL çözümüne bağımlı değiliz; 301 yönlendirmesi de doğmaz (QA DEF-3/DEF-4).
    shell = await context.next();
    if (!shell || shell.status !== 200) return shell;

    // QA kancası: SSR'ı atla, dürüst bekleme hâlini göster
    if (new URL(request.url).searchParams.has('ptfoff')) return shell;

    const html = await shell.clone().text();
    // İki uç paralel çekilir: bozuk proxy'de TTFB iki katına çıkmasın (QA DEF-8)
    const [today, stats] = await Promise.all([fetchJson(PROXY + '/ptf/today'), fetchJson(PROXY + '/ptf/stats')]);
    const prices = pricesFrom(today);
    // Dürüstlük: gerçek veri yoksa kabuk olduğu gibi döner ("—" + VERİ BEKLENİYOR)
    if (!prices) return htmlResponse(html, 30, 60);

    return htmlResponse(inject(html, prices, stats), 60, 300);
  } catch (e) {
    // SSR'da ne olursa olsun sayfa AYAKTA kalır.
    console.error('canli-ptf SSR failed, serving static shell:', e && e.message);
    if (shell) return shell;
    try { return await context.next(); } catch (_) { /* aşağıda 503 */ }
    return new Response('Sayfa geçici olarak yüklenemedi.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}

// HEAD istekleri (izleme araçları, bazı tarayıcı botları) 405 almasın.
export const onRequestHead = onRequestGet;
