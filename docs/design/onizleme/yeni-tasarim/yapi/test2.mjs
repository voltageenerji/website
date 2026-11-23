// Hazırlık sayfası davranış testleri — 2. tur. Gerçek veri gönderilmez: /api/lead ve epias-proxy yanıtları taklit edilir.
import { chromium, SAYFA, CIKTI, ornekVeri } from './ortak.mjs';
import { writeFileSync } from 'fs';

const sonuc = [];
let gecen = 0, kalan = 0;
function ok(ad, kosul, ayrinti = '') {
  if (kosul) gecen++; else kalan++;
  sonuc.push((kosul ? 'GEÇTİ  ' : 'KALDI  ') + ad + (ayrinti && !kosul ? '  → ' + ayrinti : ''));
  if (!kosul) console.log('KALDI  ' + ad + (ayrinti ? '  → ' + ayrinti : ''));
}
function not(m) { sonuc.push('       ' + m); }
const b = await chromium.launch();

async function baglam({ w = 1280, h = 800, ptf = 'canli', eksik = [], azalt = false, js = true, dsf = 1 } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: azalt ? 'reduce' : 'no-preference', javaScriptEnabled: js, deviceScaleFactor: dsf });
  const durum = { ptf, eksik, lead: null, gonderiler: [], konsol: [], istekler: [] };
  await ctx.route('https://epias-proxy.emirhantan-ku.workers.dev/**', async (route) => {
    const u = route.request().url();
    durum.istekler.push(u);
    if (durum.ptf === 'kapali') return route.abort('connectionrefused');
    const bas = { 'access-control-allow-origin': '*' };
    if (u.endsWith('/ptf/today')) return route.fulfill({ status: 200, contentType: 'application/json', headers: bas, body: JSON.stringify(ornekVeri(durum.eksik)) });
    if (u.endsWith('/ptf/stats')) return route.fulfill({ status: 200, contentType: 'application/json', headers: bas, body: JSON.stringify({ monthAvg: 2345.67, monthRange: '2026-11-01..23' }) });
    return route.fulfill({ status: 404, body: '' });
  });
  await ctx.route('**/api/lead', async (route) => {
    const r = route.request();
    const tur = r.headers()['content-type'] || '';
    let govde = null;
    try { govde = tur.includes('json') ? JSON.parse(r.postData() || 'null') : null; } catch (e) {}
    durum.gonderiler.push({ tur, govde, ham: tur.includes('json') ? null : (r.postDataBuffer() || Buffer.alloc(0)) });
    if (durum.lead) return route.fulfill(durum.lead);
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') durum.konsol.push('console: ' + m.text()); });
  p.on('pageerror', (e) => durum.konsol.push('pageerror: ' + e.message));
  p.on('requestfailed', (r) => { if (!/epias-proxy/.test(r.url())) durum.konsol.push('requestfailed: ' + r.url()); });
  p.on('response', (r) => { if (r.status() >= 400 && !/api\/lead/.test(r.url())) durum.konsol.push('http ' + r.status() + ': ' + r.url()); });
  return { ctx, p, durum };
}
async function ac(p, sorgu = '', bekle = 500) {
  await p.goto(SAYFA + sorgu, { waitUntil: 'networkidle' });
  await p.waitForTimeout(bekle);
}
const metin = (p, s) => p.locator(s).first().textContent();
async function kaydirmaBitsin(p) {
  let once = -1;
  for (let i = 0; i < 40; i++) { const y = await p.evaluate(() => window.scrollY); if (y === once) return y; once = y; await p.waitForTimeout(120); }
  return once;
}
const clsKur = (p) => p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });

// ───────────────────────── A. yapı, başlıklar, sade tasarım dili ─────────────────────────
{
  const { ctx, p, durum } = await baglam({ w: 1440, h: 900 });
  await ac(p);
  ok('A1 konsol hatası yok (1440, canlı veri)', durum.konsol.length === 0, durum.konsol.join(' | '));
  const y = await p.evaluate(() => {
    const mono = [...document.querySelectorAll('body *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && /Plex Mono/.test(getComputedStyle(e).fontFamily) && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]'));
    const serif = [...document.querySelectorAll('body *')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && /Newsreader/.test(getComputedStyle(e).fontFamily) && !e.closest('.en-only'));
    const bas = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    let onceki = 0, atlama = [];
    bas.forEach(h => { const n = +h.tagName[1]; if (n > onceki + 1) atlama.push(h.tagName + ':' + h.textContent.trim().slice(0, 20)); onceki = n; });
    const h1 = document.querySelector('h1');
    return {
      h1: document.querySelectorAll('h1').length, h1Cocuk: [...h1.children].map(c => c.className).join(','), h1Metin: h1.textContent.replace(/\s+/g, ' ').trim(),
      ustGor: getComputedStyle(h1.querySelector('.h1-ust')).textTransform + '/' + parseFloat(getComputedStyle(h1.querySelector('.h1-ust')).fontSize), anaAile: getComputedStyle(h1.querySelector('.h1-ana')).fontFamily,
      eyebrow: document.querySelectorAll('.eyebrow, .kicker').length,
      atlama, h2: document.querySelectorAll('h2').length, h3: document.querySelectorAll('h3').length,
      main: document.querySelectorAll('main').length, mainIcinde: !!document.querySelector('main #kapak') && !!document.querySelector('main #leadForm') && !document.querySelector('main footer'),
      atla: document.querySelector('a.skip') && document.querySelector('a.skip').getAttribute('href'),
      idler: ['kapak', 'hizmetler', 'canli-piyasa', 'hakkimizda', 'yaklasim', 'iletisim', 'teklif', 'leadForm', 'nav', 'mobileMenu', 'mobileMenuBtn', 'kfPtf', 'kfStamp', 'lgAvg', 'lgMoK', 'lgMo', 'lgMinH', 'lgMaxH', 'lgUpd', 'lmLine', 'lmArea', 'lmDot', 'lmMode', 'saatTablo', 'leadSubmit', 'leadStatus', 'lead-yesil', 'lead-kvkk', 'lead-fatura', 'lead-mesken-not'].filter(i => !document.getElementById(i)),
      cift: [...document.querySelectorAll('[id]')].map(e => e.id).filter((v, i, a) => a.indexOf(v) !== i),
      logo: document.querySelector('.nav-logo-mark').classList.contains('gorsel-hazir'), logoImg: getComputedStyle(document.querySelector('.nav-logo-mark img')).display,
      marka: [getComputedStyle(document.querySelector('.nav-logo-name')).fontFamily, getComputedStyle(document.querySelector('.cl-word')).fontFamily].join(' | '),
      foto: (() => { const i = document.querySelector('.hero-photo img'); return [i.complete, i.naturalWidth, i.currentSrc.split('/').pop(), document.querySelector('.hero-media').className]; })(),
      kok: [...document.querySelectorAll('[src],[href],[action]')].map(e => e.getAttribute('src') || e.getAttribute('href') || e.getAttribute('action')).filter(u => !/^(\/|#|https:\/\/|mailto:|img\/kapak)/.test(u)),
      sus: ['.sec-no', '.nav-folio', '.service-num', '.tline-svg', '.art-rings', '.exhibit-tag', '.step-s', '.app-l', '.callout-src', '.callout-d', '.mcp-rail', '.kpi-band', '.reveal:not(form)'].filter(s => document.querySelector(s)),
      yazi: ['EXHIBIT A', 'VOLTAGE FELSEFESİ', 'TEK HAT ŞEMASI', 'KAPAK ·', '01 / 09'].filter(t => document.body.innerText.includes(t)),
      okSuz: [...document.querySelectorAll('svg.arrow')].filter(s => !s.closest('a, button')).length,
      kart: (() => { const c = getComputedStyle(document.getElementById('ptfKart')); return [c.backdropFilter, c.boxShadow, c.backgroundColor].join(' | '); })(),
      mono: [...new Set(mono.map(e => { const k = e.closest('.kf-stamp, .ptf-ticks, .lm-mode, .lg-v, .saat-tablo, .mono'); return k ? 'İZİNLİ ' + (k.id ? '#' + k.id : '.' + String(k.className).split(' ').join('.')) : 'DIŞ ' + e.tagName + '.' + e.className; }))],
      serif: [...new Set(serif.map(e => e.className || e.tagName))],
      golge: [...document.querySelectorAll('main *, footer *')].filter(e => { const s = getComputedStyle(e).boxShadow; return s !== 'none' && !e.closest('form') && !e.closest('.saat-tablo'); }).map(e => e.className).slice(0, 5),
    };
  });
  ok('A2 tek <h1>; içinde üst satır (.h1-ust) ve slogan (.h1-ana); ayrı üst başlık öğesi yok', y.h1 === 1 && y.h1Cocuk === 'h1-ust,h1-ana' && y.eyebrow === 0 && y.h1Metin === 'Sanayi ve Ticarethaneler için Elektrik Tedariki Sanayinin enerjisini piyasayla buluşturuyoruz.', JSON.stringify([y.h1, y.h1Cocuk, y.h1Metin]));
  ok('A3 H1 görünümü: üst satır küçük büyük harfli sans, slogan serif', /uppercase\/13/.test(y.ustGor) && /Newsreader/.test(y.anaAile), y.ustGor + ' ' + y.anaAile);
  ok('A4 başlık sırası: atlanan düzey yok (H1 → H2 → H3)', y.atlama.length === 0, y.atlama.join(','));
  not(`başlık sayısı: H1 1, H2 ${y.h2}, H3 ${y.h3}`);
  ok('A5 <main> var; içerik içinde, footer dışında; atlama bağlantısı #icerik', y.main === 1 && y.mainIcinde && y.atla === '#icerik');
  ok('A6 betiklerin ve gelen bağlantıların kullandığı id değerleri duruyor; yinelenen id yok', y.idler.length === 0 && y.cift.length === 0, y.idler.concat(y.cift).join(','));
  ok('A7 logo işareti görsel olarak yüklendi; marka yazısı kapakta ve altta sans (Archivo)', y.logo && y.logoImg === 'block' && !/Newsreader/.test(y.marka) && /Archivo/.test(y.marka), y.marka);
  ok('A8 kapak fotoğrafı yüklendi (WebP), yedek kapalı', y.foto[0] && y.foto[1] > 0 && /\.webp$/.test(y.foto[2]) && !/yedek/.test(y.foto[3]), JSON.stringify(y.foto));
  ok('A9 yollar kökten başlıyor (kapak görselleri dışında göreli yol yok)', y.kok.length === 0, y.kok.join(','));
  ok('A10 süs öğeleri yok: bölüm numarası, folyo, hizmet numarası, tek hat şeması, halkalar, EXHIBIT A, S1–S5, A/B/C, felsefe etiketi, ray, belirme', y.sus.length === 0 && y.yazi.length === 0, y.sus.concat(y.yazi).join(','));
  ok('A11 ok simgesi yalnız gerçek bağlantı ve düğmelerde', y.okSuz === 0, String(y.okSuz));
  ok('A12 PTF kartı düz panel: bulanıklık ve gölge yok, zemin opak', /^none/.test(y.kart) && / \| none \| rgb\(11, 18, 38\)$/.test(y.kart), y.kart);
  ok('A13 gölge kullanan öğe yok (form odak halkası dışında)', y.golge.length === 0, y.golge.join(','));
  const monoDisi = y.mono.filter(m => m.startsWith('DIŞ'));
  ok('A14 monospace yalnız piyasa verisi, saat damgası ve teknik kimliklerde (lisans no, sicil no)', monoDisi.length === 0, monoDisi.join(' , '));
  not('monospace kullanan öğeler: ' + y.mono.join(' '));
  ok('A15 serif yalnız üç yerde: kapak sloganı, Hakkında cümlesi ve imza, şirket sözü', y.serif.every(s => /h1-ana|about-claim|tr-only|about-signature-text|callout-t/.test(s)) && y.serif.length <= 5, y.serif.join(','));
  not('serif kullanan öğeler: ' + y.serif.join(' '));
  await ctx.close();
  for (const w of [1440, 375]) {
    const k = await baglam({ w, h: w === 375 ? 667 : 900 });
    await clsKur(k.p);
    await ac(k.p, '', 1500);
    const cls = await k.p.evaluate(() => window.__cls);
    ok(`A16 yerleşim kayması yok (CLS, ${w}, canlı veri gelirken)`, cls < 0.01, cls.toFixed(4));
    await k.ctx.close();
  }
}

// ───────────────────────── B. dil değiştirici ─────────────────────────
{
  const { ctx, p } = await baglam({ w: 1280, azalt: true });
  await ac(p);
  const oku = () => p.evaluate(() => {
    const dil = document.documentElement.lang;
    const uyumsuz = [];
    document.querySelectorAll('[data-tr][data-en]').forEach(el => {
      const bek = el.getAttribute('data-' + dil);
      if (el.children.length === 0 && el.textContent !== bek) uyumsuz.push(el.tagName + ':' + el.textContent.slice(0, 30) + ' ≠ ' + bek.slice(0, 30));
      if (el.children.length !== 0) uyumsuz.push('ÇOCUKLU ÇİFT: ' + el.tagName + '.' + el.className);
    });
    const gor = (s) => [...document.querySelectorAll(s)].filter(e => getComputedStyle(e).display !== 'none').length;
    return {
      dil, uyumsuz, baslik: document.title, tanim: document.querySelector('meta[name=description]').content,
      ogt: document.querySelector('meta[property="og:title"]').content, ogl: document.querySelector('meta[property="og:locale"]').content,
      trGor: gor('.tr-only'), enGor: gor('.en-only'), trTop: document.querySelectorAll('.tr-only').length, enTop: document.querySelectorAll('.en-only').length,
      damga: document.getElementById('kfStamp').textContent, mod: document.getElementById('lmMode').textContent,
      aylik: document.getElementById('lgMoK').textContent, yer: document.getElementById('lead-mesaj').placeholder,
      basili: [...document.querySelectorAll('.lang-btn')].map(x => x.dataset.lang + ':' + x.getAttribute('aria-pressed') + ':' + x.classList.contains('active')).join(' '),
      kayit: localStorage.getItem('voltage-lang'), h1: document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
      h2: [...document.querySelectorAll('main h2')].map(h => [...h.querySelectorAll('span')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent).join('') || h.textContent.trim()).join(' | '),
    };
  });
  let d = await oku();
  ok('B1 açılış Türkçe; tüm çiftler TR metninde; çocuklu çeviri çifti yok', d.dil === 'tr' && d.uyumsuz.length === 0 && d.enGor === 0 && d.trGor === d.trTop, JSON.stringify(d.uyumsuz.slice(0, 3)));
  ok('B1 TR H2 metinleri talimattaki gibi', d.h2 === 'Hizmetlerimiz | Hizmet Verdiğimiz Sektörler | Güncel Elektrik Piyasası Verileri | Elektrik Tedarik Süreci | Elektrik Tedarik Sözleşmesi Modelleri | EPDK Tedarik Lisansı | Voltage Enerji Hakkında | Neden Voltage? | İletişim', d.h2);
  await p.click('.nav-right .lang-btn[data-lang="en"]');
  d = await oku();
  ok('B2 EN: html lang, tüm çiftler EN metninde, tr-only gizli', d.dil === 'en' && d.uyumsuz.length === 0 && d.trGor === 0 && d.enGor === d.enTop, JSON.stringify(d.uyumsuz.slice(0, 3)));
  ok('B2 EN H2 metinleri talimattaki gibi', d.h2 === 'Our Services | Sectors We Serve | Current Electricity Market Data | Electricity Supply Process | Electricity Supply Contract Models | EPDK Supply License | About Voltage Enerji | Why Voltage? | Contact', d.h2);
  ok('B3 EN: title / description / og:title / og:locale değişti', /Electricity Supplier$/.test(d.baslik) && /^Voltage Enerji, the brand/.test(d.tanim) && d.ogt === d.baslik && d.ogl === 'en_US', d.baslik);
  ok('B4 EN: canlı damga, kip, aylık etiket, yer tutucu İngilizce', /^HOUR \d\d:00/.test(d.damga) && d.mod === 'LIVE' && /^MONTHLY AVG/.test(d.aylik) && /^Current contract/.test(d.yer), JSON.stringify([d.damga, d.mod, d.aylik]));
  ok('B5 EN: aria-pressed ve etkin sınıf (üst bant ve menü panelindeki düğmeler birlikte)', d.basili === 'tr:false:false en:true:true tr:false:false en:true:true' && d.kayit === 'en', d.basili);
  ok('B6 EN H1: iki parça', d.h1 === "Electricity Supply for Industry and Businesses We connect industry's energy with the market.", d.h1);
  await p.click('.nav-right .lang-btn[data-lang="tr"]');
  d = await oku();
  ok('B7 TR’ye dönüş: tüm çiftler TR, başlık ve tanım TR, en-only gizli', d.dil === 'tr' && d.uyumsuz.length === 0 && d.enGor === 0 && /Elektrik Tedarikçisi$/.test(d.baslik) && d.ogl === 'tr_TR' && /^SAAT /.test(d.damga), JSON.stringify(d.uyumsuz.slice(0, 3)));
  await ctx.close();
  const k = await baglam({ w: 1280 });
  await ac(k.p, '?lang=en');
  ok('B8 ?lang=en ile açılış İngilizce', await k.p.evaluate(() => document.documentElement.lang === 'en' && document.querySelector('.h1-ana').textContent.startsWith('We connect')));
  await k.ctx.close();
}

// ───────────────────────── C. menü bağlantıları, yumuşak kaydırma ─────────────────────────
for (const w of [1280, 375]) {
  const { ctx, p } = await baglam({ w, h: w === 375 ? 667 : 800 });
  await ac(p);
  const mobil = w < 1040;
  for (const hedef of ['hakkimizda', 'hizmetler', 'yaklasim', 'iletisim', 'teklif']) {
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(250);
    if (hedef === 'teklif') await p.click('.nav-right a[href="#teklif"]');
    else if (mobil) { await p.click('#mobileMenuBtn'); await p.click(`#mobileMenu a[href="#${hedef}"]`); }
    else await p.click(`.nav-links a[href="#${hedef}"]`);
    await kaydirmaBitsin(p);
    const r = await p.evaluate((id) => { const e = document.getElementById(id); const n = document.getElementById('nav').getBoundingClientRect(); return { ust: Math.round(e.getBoundingClientRect().top), nav: Math.round(n.bottom), menu: document.getElementById('mobileMenu').hidden }; }, hedef);
    ok(`C1 ${w}px ${hedef === 'teklif' ? 'üst banttaki “Teklif Al”' : 'menü'} → #${hedef}: hedef üst bandın hemen altında`, r.ust >= r.nav && r.ust <= r.nav + 40 && r.menu, JSON.stringify(r));
  }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(250);
  await p.click('.hero-actions a[href="#teklif"]'); await kaydirmaBitsin(p);
  let r = await p.evaluate(() => { const f = document.querySelector('.form-title').getBoundingClientRect(); const n = document.getElementById('nav').getBoundingClientRect(); return [Math.round(f.top), Math.round(n.bottom), innerHeight]; });
  ok(`C2 ${w}px kapak “Teklif Al” → form başlığı görünür`, r[0] >= r[1] && r[0] < r[2], r.join('/'));
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(250);
  await p.click('.hero-actions a[href="#hizmetler"]'); await kaydirmaBitsin(p);
  r = await p.evaluate(() => [Math.round(document.getElementById('hizmetler').getBoundingClientRect().top), Math.round(document.getElementById('nav').getBoundingClientRect().bottom), document.getElementById('nav').classList.contains('scrolled')]);
  ok(`C3 ${w}px kapak “Hizmetlerimizi İncele” → #hizmetler; üst bant “scrolled”`, r[0] >= r[1] && r[0] <= r[1] + 40 && r[2], r.join('/'));
  await ctx.close();
}

// ───────────────────────── D. telefon: üst bant, menü, kapak düzeni ─────────────────────────
for (const [w, h] of [[375, 667], [390, 844], [320, 568], [430, 932]]) {
  const { ctx, p } = await baglam({ w, h });
  await ac(p);
  const d = await p.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); const q = e.getBoundingClientRect(); return { ust: Math.round(q.top), alt: Math.round(q.bottom), sol: Math.round(q.left), sag: Math.round(q.right), g: Math.round(q.width), y: Math.round(q.height), gor: getComputedStyle(e).display !== 'none' && q.width > 0 }; };
    return {
      cta: r('.nav-right .nav-cta'), ctaZemin: getComputedStyle(document.querySelector('.nav-right .nav-cta')).backgroundColor, dugme: r('#mobileMenuBtn'), dilUst: r('.nav-right .lang-toggle').gor, logo: r('.nav-logo'),
      h1: r('h1'), alt: r('.hero-sub'), birincil: r('.hero-actions .btn-primary'), ikincil: r('.hero-actions .btn-ghost'), kart: r('#ptfKart'), kapak: r('.hero'), grafik: r('.ptf-chart').gor,
      kartIc: ['.ptf-title', '#kfStamp', '.ptf-label', '#kfPtf', '.ptf-link'].map(s => r(s).gor), vh: innerHeight, sabit: [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).position === 'fixed' && e.id !== 'nav' && e.id !== 'mobileMenu').length,
    };
  });
  ok(`D1 ${w}px üst bant: logo, “Teklif Al” (sarı, ≥44 px) ve menü düğmesi (44×44) yan yana sığıyor; dil seçimi üst bantta değil`, d.cta.gor && d.cta.y >= 44 && d.ctaZemin === 'rgb(245, 180, 28)' && d.dugme.g === 44 && d.dugme.y === 44 && !d.dilUst && d.logo.sag <= d.cta.sol - 6 && d.cta.sag <= d.dugme.sol - 6 && d.dugme.sag <= w - 14, JSON.stringify([d.logo.sag, d.cta, d.dugme]));
  ok(`D2 ${w}px kapak sırası: H1 → alt metin → Teklif Al → ikinci düğme → küçük PTF kartı (grafik yok)`, d.h1.alt <= d.alt.ust && d.alt.alt <= d.birincil.ust && d.birincil.alt <= d.ikincil.ust && d.ikincil.alt <= d.kart.ust && !d.grafik && d.kartIc.every(Boolean), JSON.stringify([d.h1.alt, d.alt.ust, d.birincil.ust, d.ikincil.ust, d.kart.ust, d.grafik]));
  ok(`D3 ${w}px kapak gereğinden uzun değil: karttan sonra en çok 48 px; kart düğme çiftinden kısa; yapışkan alt çubuk yok`, d.kapak.alt - d.kart.alt <= 48 && d.kart.y <= 200 && d.sabit === 0, JSON.stringify([d.kapak.y, d.kapak.alt - d.kart.alt, d.kart.y, d.sabit]));
  ok(`D4 ${w}px ilk ekranda “Teklif Al” (kapak düğmesi) görünür`, d.birincil.alt <= d.vh, d.birincil.alt + '/' + d.vh);
  not(`${w}×${h}: kapak yüksekliği ${d.kapak.y} px, PTF kartı ${d.kart.y} px, kapak “Teklif Al” alt kenarı ${d.birincil.alt} px`);
  if (w === 375) {
    const dm = () => p.evaluate(() => { const m = document.getElementById('mobileMenu'), bt = document.getElementById('mobileMenuBtn'); return { gizli: m.hidden, gor: getComputedStyle(m).display, acik: bt.getAttribute('aria-expanded'), govde: document.body.classList.contains('menu-open'), bag: [...m.querySelectorAll('a')].map(a => Math.round(a.getBoundingClientRect().height)), dil: [...m.querySelectorAll('.lang-btn')].map(x => { const q = x.getBoundingClientRect(); return Math.round(q.width) + 'x' + Math.round(q.height); }) }; });
    let m = await dm();
    ok('D5 menü kapalı açılır', m.gizli && m.gor === 'none' && m.acik === 'false');
    await p.click('#mobileMenuBtn'); m = await dm();
    ok('D6 düğme menüyü açar: 6 bağlantı ≥44 px, dil düğmeleri panelde ≥44×44, gövde kilidi', !m.gizli && m.gor === 'flex' && m.acik === 'true' && m.govde && m.bag.length === 6 && m.bag.every(x => x >= 44) && m.dil.length === 2 && m.dil.every(s => s.split('x').every(v => +v >= 44)), JSON.stringify(m));
    await p.screenshot({ path: `${CIKTI}/r2/durum/mobil-menu-375.png` });
    await p.click('#mobileMenu .lang-btn[data-lang="en"]');
    const en = await p.evaluate(() => [document.documentElement.lang, document.querySelector('#mobileMenu a').textContent, document.getElementById('mobileMenu').hidden, document.querySelector('.nav-right .nav-cta').textContent]);
    ok('D7 paneldeki dil düğmesi dili değiştirir, panel açık kalır', en[0] === 'en' && en[1] === 'About' && en[2] === false && en[3] === 'Get a Quote', en.join());
    await p.click('#mobileMenu .lang-btn[data-lang="tr"]');
    await p.keyboard.press('Escape'); m = await dm();
    ok('D8 Escape menüyü kapatır', m.gizli && m.acik === 'false' && !m.govde);
    await p.click('#mobileMenuBtn'); await p.click('#mobileMenuBtn'); m = await dm();
    ok('D9 düğmeye ikinci dokunuş kapatır', m.gizli);
  }
  await ctx.close();
}
{
  const k = await baglam({ w: 1280, azalt: true });
  await ac(k.p);
  await k.p.keyboard.press('Tab'); await k.p.waitForTimeout(80);
  const s1 = await k.p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return [a.className, Math.round(r.top), getComputedStyle(a).outlineStyle]; });
  await k.p.keyboard.press('Enter'); await k.p.waitForTimeout(300);
  const s2 = await k.p.evaluate(() => document.activeElement && document.activeElement.id);
  ok('D10 ilk Tab atlama bağlantısını gösterir; Enter odağı <main>’e taşır', s1[0] === 'skip' && s1[1] >= 0 && s2 === 'icerik', JSON.stringify([s1, s2]));
  // odak görünürlüğü: sekmeyle gezilen her öğede çerçeve ya da halka
  const odaksiz = [];
  await k.p.evaluate(() => window.scrollTo(0, 0));
  for (let i = 0; i < 70; i++) {
    await k.p.keyboard.press('Tab'); await k.p.waitForTimeout(40);
    const o = await k.p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const c = getComputedStyle(a); const r = a.getBoundingClientRect(); return { ad: a.tagName + '.' + String(a.className).slice(0, 18) + '#' + a.id, cerceve: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) >= 2, halka: c.boxShadow !== 'none', gor: r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 }; });
    if (o && !(o.cerceve || o.halka)) odaksiz.push(o.ad);
    if (o && !o.gor) odaksiz.push('GÖRÜNMÜYOR ' + o.ad);
  }
  ok('D11 klavye odağı her öğede görünür (70 Tab adımı: üst bant, kapak, bağlantılar, form alanları)', odaksiz.length === 0, [...new Set(odaksiz)].join(' , '));
  await k.ctx.close();
}

// ───────────────────────── E. piyasa verisi: kapak kartı, özet, saatlik tablo ─────────────────────────
const SAYI = /^\d{1,3}(\.\d{3})*,\d{2}$/;
async function ptfOku(p) {
  return p.evaluate(() => {
    const g = (i) => document.getElementById(i);
    const k = g('ptfKart');
    const hucre = [...document.querySelectorAll('#saatTablo tbody td')].map(t => t.textContent);
    return {
      durum: k.dataset.state, deger: g('kfPtf').textContent, damga: g('kfStamp').textContent, sinif: g('kfStamp').className,
      cizgi: g('heroLine').getAttribute('d') || '', alan: g('heroArea').getAttribute('d') || '', nokta: g('heroDot').style.display,
      bos: getComputedStyle(k.querySelector('.ptf-empty')).display, yuk: Math.round(k.getBoundingClientRect().height * 10) / 10,
      cetvel: [g('lgAvg').textContent, g('lgMo').textContent, g('lgMinH').textContent, g('lgMaxH').textContent, g('lgUpd').textContent], mod: g('lmMode').textContent,
      lm: g('lmLine').getAttribute('d') || '', hucre, satir: document.querySelectorAll('#saatTablo tbody tr').length, saat: [...document.querySelectorAll('#saatTablo tbody th')].map(t => t.textContent).join(','),
      simdi: [...document.querySelectorAll('#saatTablo tbody tr.simdi th')].map(t => t.textContent).join(','),
      kartMetin: k.innerText.replace(/\s+/g, ' '), bolum: document.getElementById('canli-piyasa').innerText,
      bolumYuk: Math.round(document.getElementById('canli-piyasa').getBoundingClientRect().height),
    };
  });
}
const kartYuk = {}, bolumYuk = {};
{ // E1 canlı
  const { ctx, p, durum } = await baglam({ w: 1440, h: 900, azalt: true });
  await ac(p);
  const d = await ptfOku(p);
  kartYuk.canli = d.yuk; bolumYuk.canli = d.bolumYuk;
  const simdi = String(+new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hourCycle: 'h23' }).format(new Date())).padStart(2, '0') + ':00';
  ok('E1 CANLI kapak kartı: değer sayı, damga “SAAT ss:00 · EPİAŞ”, durum live', d.durum === 'live' && SAYI.test(d.deger) && /^SAAT \d\d:00 · EPİAŞ$/.test(d.damga) && d.sinif === 'kf-stamp', JSON.stringify([d.durum, d.deger, d.damga]));
  ok('E1 CANLI kapak kartı: gün eğrisi çizildi (24 nokta), o saatin noktası görünür', d.cizgi.split(/[ML]/).length - 1 === 24 && d.alan.endsWith('Z') && d.nokta === '' && d.bos === 'none');
  ok('E1 kapak kartında yalnız: başlık, damga, PTF değeri, gün eğrisi, bağlantı (başka sayı yok)', d.kartMetin.replace(/\b\d\d:00\b/g, '').replace(d.deger, '').match(/\d/g) === null && !/%/.test(d.kartMetin), d.kartMetin);
  ok('E1 CANLI bölüm: büyük grafik çizildi, özet dolu (gün ort., ay ort., en düşük, en yüksek, durum)', d.lm.length > 50 && /₺\/MWh$/.test(d.cetvel[0]) && /₺\/MWh$/.test(d.cetvel[1]) && /^\d\d:00 · /.test(d.cetvel[2]) && /^\d\d:00 · /.test(d.cetvel[3]) && /^SAAT/.test(d.cetvel[4]) && d.mod === 'CANLI', JSON.stringify(d.cetvel));
  ok('E1 CANLI saatlik tablo: gerçek <table>, 24 satır (00:00–23:00), 24 değer sayı, o saatin satırı işaretli', d.satir === 24 && d.saat.startsWith('00:00,01:00') && d.saat.endsWith('22:00,23:00') && d.hucre.every(v => SAYI.test(v)) && d.simdi === simdi, JSON.stringify([d.satir, d.simdi, simdi, d.hucre.slice(0, 3)]));
  const ornek = ornekVeri();
  const bekle = ornek.items.map(i => i.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  ok('E1 tablo değerleri proxy yanıtındaki saatlik fiyatlarla birebir aynı; kapak değeri = o saatin tablo değeri', JSON.stringify(d.hucre) === JSON.stringify(bekle) && d.deger === d.hucre[+simdi.slice(0, 2)], d.hucre.slice(0, 2) + ' / ' + bekle.slice(0, 2));
  ok('E1 bölüm kapaktaki “şu anki saat” rakamını manşet yapmıyor: KPI bandı ve ray yok; kapak değeri bölümde yalnız tablo satırında', await p.evaluate((v) => !document.querySelector('.kpi-band, .kpi-num, .mcp-rail') && [...document.querySelectorAll('#canli-piyasa *')].filter(e => e.children.length === 0 && e.textContent.trim() === v).every(e => e.tagName === 'TD'), d.deger));
  ok('E1 önbellek anahtarı “voltage-ptf-cache” yazıldı; yalnız /ptf/today ve /ptf/stats çağrıldı', await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('voltage-ptf-cache')); return c && c.prices.length === 24 && Number.isFinite(c.price); }) && [...new Set(durum.istekler.map(u => u.replace(/^https:\/\/[^/]+/, '')))].sort().join() === '/ptf/stats,/ptf/today', [...new Set(durum.istekler)].join());
  await p.locator('.hero').screenshot({ path: `${CIKTI}/r2/durum/ptf-1-canli-kapak-1440.png` });
  await p.locator('#canli-piyasa').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(200);
  await p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r2/durum/ptf-1-canli-bolum-1440.png` });
  // E2 proxy kapalı + bugünkü önbellek
  durum.ptf = 'kapali';
  await ac(p);
  const s = await ptfOku(p);
  kartYuk.onbellek = s.yuk; bolumYuk.onbellek = s.bolumYuk;
  ok('E2 ÖNBELLEK: damga “SON SENKRON ss:dd”, durum cached, değer önbellekteki sayı', s.durum === 'cached' && /^SON SENKRON \d\d:\d\d$/.test(s.damga) && s.sinif === 'kf-stamp stale' && s.deger === d.deger, JSON.stringify([s.durum, s.deger, s.damga]));
  ok('E2 ÖNBELLEK: grafik ve tablo bugünün önbelleğinden; “şu an” noktası ve satır işareti yok; kip SON SENKRON', s.cizgi === d.cizgi && s.nokta === 'none' && s.mod === 'SON SENKRON' && JSON.stringify(s.hucre) === JSON.stringify(d.hucre) && s.simdi === '' && /^SON SENKRON/.test(s.cetvel[4]), JSON.stringify([s.nokta, s.mod, s.simdi]));
  await p.locator('.hero').screenshot({ path: `${CIKTI}/r2/durum/ptf-2-onbellek-kapak-1440.png` });
  await p.locator('#canli-piyasa').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(200);
  await p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r2/durum/ptf-2-onbellek-bolum-1440.png` });
  // E2b dünkü önbellek
  await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('voltage-ptf-cache')); const dun = new Date(Date.now() - 864e5); c.date = dun.toDateString(); c.ts = dun.getTime(); localStorage.setItem('voltage-ptf-cache', JSON.stringify(c)); });
  await ac(p);
  const s2 = await ptfOku(p);
  ok('E2b DÜNKÜ ÖNBELLEK: değer + “SON SENKRON gg.aa ss:dd”; grafik boş; tablo 24 × “—” (dünün saatleri bugüne yazılmaz)', s2.durum === 'cached' && /^SON SENKRON \d\d\.\d\d \d\d:\d\d$/.test(s2.damga) && SAYI.test(s2.deger) && s2.cizgi === '' && s2.bos !== 'none' && s2.hucre.every(v => v === '—'), JSON.stringify([s2.damga, s2.deger, s2.hucre.slice(0, 2)]));
  await ctx.close();
}
{ // E3 proxy kapalı, önbellek yok
  const { ctx, p, durum } = await baglam({ w: 1440, h: 900, ptf: 'kapali', azalt: true });
  await ac(p);
  const d = await ptfOku(p);
  kartYuk.bekleme = d.yuk; bolumYuk.bekleme = d.bolumYuk;
  ok('E3 VERİ YOK: değer “—”, damga “EPİAŞ VERİSİ BEKLENİYOR”, durum waiting', d.durum === 'waiting' && d.deger === '—' && d.damga === 'EPİAŞ VERİSİ BEKLENİYOR' && d.sinif === 'kf-stamp waiting', JSON.stringify([d.durum, d.deger, d.damga]));
  ok('E3 VERİ YOK: grafikler boş, nokta yok, “Saatlik veri bekleniyor”; özet “—”; tablo 24 × “—”; kip VERİ BEKLENİYOR', d.cizgi === '' && d.alan === '' && d.nokta === 'none' && d.bos !== 'none' && d.lm === '' && d.cetvel.slice(0, 4).every(v => v === '—') && d.hucre.length === 24 && d.hucre.every(v => v === '—') && d.mod === 'VERİ BEKLENİYOR' && d.simdi === '', JSON.stringify([d.cetvel, d.mod]));
  ok('E3 VERİ YOK: bölümde ve kartta saat etiketleri dışında rakam yok (0 ya da yer tutucu sayı yok)', !/\d/.test(d.kartMetin.replace(/\b\d\d:00\b/g, '')) && !/\d/.test(d.bolum.replace(/\b\d\d:00\b/g, '').replace(/24 (Saat|Hours)/i, '').replace(/24 SAAT/i, '')), d.bolum.replace(/\b\d\d:00\b/g, '').replace(/\s+/g, ' ').slice(0, 200));
  ok('E3 VERİ YOK: yalnız proxy isteği düştü, başka konsol hatası yok', durum.konsol.filter(k => !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(k)).length === 0, durum.konsol.join(' | '));
  await p.locator('.hero').screenshot({ path: `${CIKTI}/r2/durum/ptf-3-veri-yok-kapak-1440.png` });
  await p.locator('#canli-piyasa').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(200);
  await p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r2/durum/ptf-3-veri-yok-bolum-1440.png` });
  await p.click('.nav-right .lang-btn[data-lang="en"]');
  const e = await ptfOku(p);
  ok('E3 VERİ YOK (EN): “AWAITING EPIAS DATA”, değer “—”', e.damga === 'AWAITING EPIAS DATA' && e.deger === '—' && e.mod === 'AWAITING DATA', e.damga);
  await ctx.close();
  const o = await baglam({ w: 1280 });
  await ac(o.p, '?ptfoff');
  const od = await ptfOku(o.p);
  ok('E3 ?ptfoff test kancası: istek atılmaz, dürüst bekleme', od.deger === '—' && od.durum === 'waiting' && o.durum.istekler.length === 0, JSON.stringify([od.deger, o.durum.istekler.length]));
  await o.ctx.close();
}
ok('E4 kapak kartı ve piyasa bölümü üç durumda aynı yükseklikte (kayma yok)', kartYuk.canli === kartYuk.onbellek && kartYuk.canli === kartYuk.bekleme && bolumYuk.canli === bolumYuk.onbellek && bolumYuk.canli === bolumYuk.bekleme, JSON.stringify([kartYuk, bolumYuk]));
{ // E5 eksik saat
  const simdi = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hourCycle: 'h23' }).format(new Date());
  const eksik = [...new Set([simdi, (simdi + 5) % 24, (simdi + 6) % 24])];
  const { ctx, p } = await baglam({ w: 1440, h: 900, eksik, azalt: true });
  await ac(p);
  const d = await ptfOku(p);
  const parca = d.cizgi.split('M').length - 1;
  ok('E5 EKSİK SAAT: şu anki saat yoksa kapak değeri “—” (0 değil), durum live', d.deger === '—' && d.durum === 'live', d.deger);
  ok('E5 EKSİK SAAT: tabloda eksik saatler “—”, öbürleri sayı; çizgi boşlukta kopuyor', eksik.every(h => d.hucre[h] === '—') && d.hucre.filter(v => SAYI.test(v)).length === 24 - eksik.length && parca >= 2 && d.nokta === 'none', JSON.stringify(eksik.map(h => d.hucre[h])) + ' parça ' + parca);
  ok('E5 EKSİK SAAT: hiçbir yerde 0,00 yok', !/(^|\D)0,00/.test(await p.evaluate(() => document.querySelector('main').innerText)));
  await p.locator('#canli-piyasa').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(200);
  await p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r2/durum/ptf-4-eksik-saat-bolum-1440.png` });
  await ctx.close();
}
for (const w of [1440, 768, 375, 320]) { // E6 yükseklikler dil ve durumdan bağımsız
  const { ctx, p, durum } = await baglam({ w, h: 800, azalt: true });
  const olc = () => p.evaluate(() => [Math.round(document.getElementById('ptfKart').getBoundingClientRect().height), Math.round(document.getElementById('canli-piyasa').getBoundingClientRect().height), Math.round(document.querySelector('.hero').getBoundingClientRect().height)].join('/'));
  const dilSec = (d) => p.evaluate((x) => window.setLanguage(x), d);
  const yuk = [];
  await ac(p); yuk.push(await olc());
  durum.ptf = 'kapali';
  await ac(p); yuk.push(await olc());
  await p.evaluate(() => localStorage.removeItem('voltage-ptf-cache'));
  await ac(p); yuk.push(await olc());
  await dilSec('en'); const en1 = await olc();
  const tasma = await p.evaluate(() => { const k = document.getElementById('ptfKart'); return [...k.querySelectorAll('.ptf-title,.kf-stamp,.ptf-value,.ptf-label')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > k.getBoundingClientRect().right - 8).map(e => e.className); });
  ok(`E6 ${w}px kart, kapak ve piyasa bölümü yüksekliği veri durumundan bağımsız (canlı = önbellek = bekleme); kart içeriği sığıyor`, new Set(yuk).size === 1 && tasma.length === 0, yuk.join(' , ') + ' EN ' + en1 + ' ' + tasma.join(','));
  await ctx.close();
}
{ // E7 betik kapalı
  const j = await baglam({ w: 1280, h: 800, js: false });
  await j.p.goto(SAYFA, { waitUntil: 'load' });
  const r = await j.p.evaluate(() => { const s = document.getElementById('canli-piyasa'); const v = s.querySelector('.lm-veri'); const n = s.querySelector('.lm-noscript'); return { veri: getComputedStyle(v).display, cumle: n ? n.innerText : '', bag: n ? !!n.querySelector('a[href="/canli-ptf"]') : false, yazi: s.innerText.replace(/\s+/g, ' '), bos: [...s.querySelectorAll('svg, table')].filter(e => e.getBoundingClientRect().height > 0).length }; });
  ok('E7 BETİK KAPALI: bölümde düz cümle ve /canli-ptf bağlantısı; boş grafik, özet ya da tablo görünmez', r.veri === 'none' && r.bag && /Canlı PTF sayfasında/.test(r.cumle) && r.bos === 0 && !/—/.test(r.yazi.replace('— ', '')), JSON.stringify(r));
  await j.p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r2/durum/ptf-5-betik-kapali-bolum-1280.png` });
  // betik kapalıyken sayfanın bütün Türkçe içeriği görünür mü: betik açıkken görünen metinle karşılaştır
  const kapali = await j.p.evaluate(() => document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean));
  const kart = await j.p.evaluate(() => [document.getElementById('kfPtf').textContent, document.getElementById('kfStamp').textContent, getComputedStyle(document.querySelector('.hero-photo img')).display, [...document.querySelectorAll('main section, .trust, footer')].filter(e => +getComputedStyle(e).opacity < 1 || getComputedStyle(e).visibility === 'hidden').length]);
  await j.ctx.close();
  const a = await baglam({ w: 1280, h: 800, ptf: 'kapali' });
  await ac(a.p);
  const acik = await a.p.evaluate(() => { document.querySelector('#canli-piyasa .lm-veri').remove(); return document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean); });
  await a.ctx.close();
  const eksikSatir = acik.filter(s => !kapali.includes(s));
  ok('E8 BETİK KAPALI: betik açıkken görünen bütün Türkçe metin (piyasa sayıları dışında) betiksiz de görünür', eksikSatir.length === 0, eksikSatir.slice(0, 5).join(' | '));
  ok('E8 BETİK KAPALI: kapak kartı dürüst bekleme metniyle durur (“—”, “EPİAŞ VERİSİ BEKLENİYOR”); gizli bölüm yok', kart[0] === '—' && kart[1] === 'EPİAŞ VERİSİ BEKLENİYOR' && kart[3] === 0, kart.join());
  not(`betik kapalı görünür satır: ${kapali.length}; betik açık (piyasa göstergeleri hariç): ${acik.length}`);
}

// ───────────────────────── F. teklif formu ─────────────────────────
async function doldur(p, { mesken = false } = {}) {
  await p.fill('#lead-ad', 'Test'); await p.fill('#lead-soyad', 'Kullanıcı');
  await p.fill('#lead-telefon', '5550000000'); await p.fill('#lead-eposta', 'test@example.com');
  await p.selectOption('#lead-tarife', mesken ? 'mesken' : 'og-sanayi');
  if (!mesken) { await p.fill('#lead-sirket', 'Deneme Sanayi A.Ş.'); await p.selectOption('#lead-sektor', 'uretim-sanayi'); await p.check('#lead-odeme-ikisi'); }
  await p.selectOption('#lead-tuketim', mesken ? '500-750' : '100000-250000');
  await p.check('#lead-kvkk');
}
const gorunur = (p, s) => p.evaluate((q) => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); const n = document.getElementById('nav').getBoundingClientRect().bottom; return { ust: Math.round(r.top), alt: Math.round(r.bottom), nav: Math.round(n), vh: innerHeight, odak: document.activeElement === e, gor: getComputedStyle(e).display !== 'none' && r.height > 0 }; }, s);
for (const w of [1280, 375]) {
  {
    const { ctx, p, durum } = await baglam({ w, h: 800 });
    await ac(p, '#leadForm');
    await p.click('#leadSubmit'); await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ gecerli: document.getElementById('leadForm').checkValidity(), odak: document.activeElement && document.activeElement.id, dugme: document.getElementById('leadSubmit').disabled }));
    ok(`F1 ${w}px boş gönderim engellenir (istek yok, odak ilk zorunlu alanda)`, durum.gonderiler.length === 0 && !r.gecerli && r.odak === 'lead-ad' && !r.dugme, JSON.stringify(r));
    await ctx.close();
  }
  {
    const { ctx, p, durum } = await baglam({ w, h: 800 });
    await ac(p, '?utm_source=deneme&utm_medium=test');
    await p.locator('#leadForm').scrollIntoViewIfNeeded();
    await doldur(p);
    await p.fill('#lead-tuketim-kwh', '142.500'); await p.fill('#lead-mesaj', 'Deneme notu');
    await p.click('#leadSubmit'); await p.waitForSelector('.form-success');
    await p.waitForTimeout(300);
    const g = durum.gonderiler[0] || {}; const v = g.govde || {};
    ok(`F2 ${w}px geçerli gönderim: tek JSON isteği, tüm alanlar gövdede`, durum.gonderiler.length === 1 && /json/.test(g.tur) && v.ad === 'Test' && v.soyad === 'Kullanıcı' && v.sirket === 'Deneme Sanayi A.Ş.' && v.telefon === '5550000000' && v.eposta === 'test@example.com' && v.tarife === 'og-sanayi' && v.tuketim === '100000-250000' && v.sektor === 'uretim-sanayi' && v.tuketim_kwh === '142.500' && v.odeme_tercihi === 'ikisi' && v.yesil === false && v.mesaj === 'Deneme notu' && v.kvkk === true && v.website === '' && v.lang === 'tr', JSON.stringify(v));
    ok(`F2 ${w}px kaynak “dogrudan”, UTM yakalandı`, v.kaynak === 'dogrudan' && v.utm && v.utm.utm_source === 'deneme' && v.utm.utm_medium === 'test', JSON.stringify([v.kaynak, v.utm]));
    const s = await gorunur(p, '.form-success');
    const yazi = await metin(p, '.form-success');
    ok(`F2 ${w}px başarı mesajı görünür, üst bandın altında ve odakta`, s && s.gor && s.odak && s.ust >= s.nav && s.ust < s.vh && /KAYIT ALINDI/.test(yazi) && /Talebiniz alındı\./.test(yazi) && /Genellikle bir iş günü içinde e-posta ya da telefonla dönüş yapıyoruz\./.test(yazi), JSON.stringify(s));
    await p.screenshot({ path: `${CIKTI}/r2/durum/form-basari-${w}.png` });
    await p.evaluate(() => window.setLanguage('en'));
    ok(`F2 ${w}px başarı mesajı dil değişince çevrilir`, /REQUEST RECEIVED/.test(await metin(p, '.form-success')) && /We usually get back to you by e-mail or phone within one business day\./.test(await metin(p, '.form-success')));
    await ctx.close();
  }
  {
    const { ctx, p, durum } = await baglam({ w, h: 800 });
    await ac(p, '?kaynak=rehber-sktt#leadForm', 1200);
    const f = await p.evaluate(() => { const t = document.querySelector('.form-title').getBoundingClientRect(); const fr = document.getElementById('leadForm').getBoundingClientRect(); const n = document.getElementById('nav').getBoundingClientRect(); return { baslikUst: Math.round(t.top), baslikAlt: Math.round(t.bottom), formUst: Math.round(fr.top), nav: Math.round(n.bottom), vh: innerHeight }; });
    ok(`G1 ${w}px /?kaynak=rehber-sktt#leadForm: form başlığı sabit bandın altında görünür`, f.baslikUst >= f.nav && f.baslikAlt < f.vh && f.formUst >= f.nav && f.formUst <= f.nav + 24, JSON.stringify(f));
    await p.screenshot({ path: `${CIKTI}/r2/durum/hash-leadForm-${w}.png` });
    await doldur(p);
    await p.click('#leadSubmit'); await p.waitForSelector('.form-success');
    ok(`F3 ${w}px ?kaynak=rehber-sktt gövdede “rehber-sktt”`, durum.gonderiler[0] && durum.gonderiler[0].govde.kaynak === 'rehber-sktt');
    await ctx.close();
  }
  {
    const { ctx, p, durum } = await baglam({ w, h: 800 });
    durum.lead = { status: 500, contentType: 'application/json', body: '{"ok":false}' };
    await ac(p);
    await p.locator('#leadForm').scrollIntoViewIfNeeded();
    await doldur(p);
    await p.evaluate(() => window.scrollBy(0, -400));
    await p.click('#leadSubmit'); await p.waitForSelector('#leadStatus.error'); await p.waitForTimeout(300);
    const s = await gorunur(p, '#leadStatus');
    const r = await p.evaluate(() => ({ yazi: document.getElementById('leadStatus').textContent, bag: !!document.querySelector('#leadStatus a[href="mailto:info@voltage.com.tr"]'), dugme: document.getElementById('leadSubmit').disabled, etiket: document.querySelector('#leadSubmit span').textContent, rol: document.getElementById('leadStatus').getAttribute('role'), ad: document.getElementById('lead-ad').value }));
    ok(`F4 ${w}px 500: hata mesajı görünür, odakta, görüş alanında; düğme yeniden etkin; girilenler duruyor`, s.gor && s.odak && s.ust >= s.nav && s.alt <= s.vh && /^Talebiniz gönderilemedi\. Lütfen tekrar deneyin veya info@voltage\.com\.tr adresine yazın\.$/.test(r.yazi) && r.bag && !r.dugme && r.etiket === 'Teklif Talep Et' && r.rol === 'alert' && r.ad === 'Test', JSON.stringify([s, r.yazi]));
    await p.screenshot({ path: `${CIKTI}/r2/durum/form-hata-${w}.png` });
    durum.lead = { status: 429, contentType: 'application/json', body: '{"ok":false,"error":"rate_limited"}' };
    await p.click('#leadSubmit'); await p.waitForTimeout(500);
    ok(`F4 ${w}px 429: hız sınırı mesajı`, /^Kısa sürede çok sayıda talep gönderildi/.test(await metin(p, '#leadStatus')));
    await ctx.close();
  }
}
{ // F5 yeşil enerji kutucuğu
  const { ctx, p, durum } = await baglam({ w: 1280, h: 900 });
  await ac(p);
  await p.locator('#lead-yesil').scrollIntoViewIfNeeded();
  const renk = () => p.evaluate(() => { const f = document.getElementById('leadForm'); return { yesil: f.classList.contains('yesil'), dugme: getComputedStyle(document.getElementById('leadSubmit')).backgroundColor, kenar: getComputedStyle(f).borderTopColor, zemin: getComputedStyle(f, '::before').opacity, yol: getComputedStyle(f.querySelector('.fl-d')).opacity, ofset: getComputedStyle(f.querySelector('.fl-d')).strokeDashoffset, ikon: getComputedStyle(f.querySelector('.form-green-ikon')).color }; });
  const once = await renk();
  await p.check('#lead-yesil'); await p.waitForTimeout(5200);
  const sonra = await renk();
  ok('F5 yeşil kutucuk: form “yesil” sınıfı, yeşil düğme ve kenar, zemin yeşerir, yaprak dalı çizilir', !once.yesil && once.zemin === '0' && once.yol === '0' && sonra.yesil && sonra.dugme === 'rgb(37, 96, 59)' && sonra.kenar === 'rgb(183, 209, 174)' && sonra.zemin === '1' && +sonra.yol > 0.7 && parseFloat(sonra.ofset) === 0 && sonra.ikon === 'rgb(47, 122, 68)', JSON.stringify([once, sonra]));
  await p.locator('#leadForm').screenshot({ path: `${CIKTI}/r2/durum/form-yesil-1280.png` });
  await doldur(p);
  await p.click('#leadSubmit'); await p.waitForSelector('.form-success');
  ok('F5 yeşil seçim gövdede yesil:true', durum.gonderiler[0].govde.yesil === true);
  await ctx.close();
  const k = await baglam({ w: 375, h: 812, dsf: 2 });
  await ac(k.p);
  await k.p.locator('#lead-yesil').scrollIntoViewIfNeeded();
  await k.p.check('#lead-yesil'); await k.p.waitForTimeout(5200);
  await k.p.locator('#leadForm').screenshot({ path: `${CIKTI}/r2/durum/form-yesil-375.png` });
  await k.p.uncheck('#lead-yesil'); await k.p.waitForTimeout(3200);
  const geri = await k.p.evaluate(() => { const f = document.getElementById('leadForm'); return [f.classList.contains('yesil'), getComputedStyle(document.getElementById('leadSubmit')).backgroundColor, getComputedStyle(f.querySelector('.fl-d')).opacity]; });
  ok('F5 kutucuk kaldırılınca form eski görünüme döner', geri[0] === false && geri[1] === 'rgb(245, 180, 28)' && geri[2] === '0', JSON.stringify(geri));
  await k.ctx.close();
}
{ // F6 fatura yükleme denetimi
  const { ctx, p, durum } = await baglam({ w: 1280, h: 900 });
  await ac(p);
  await p.locator('#leadForm').scrollIntoViewIfNeeded();
  await doldur(p);
  const pdf = (ad, boy = 2000) => ({ name: ad, mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(boy, 32)]) });
  await p.setInputFiles('#lead-fatura', { name: 'not.txt', mimeType: 'text/plain', buffer: Buffer.from('deneme') });
  await p.click('#leadSubmit'); await p.waitForSelector('#leadStatus.error');
  let s = await gorunur(p, '#leadStatus');
  ok('F6 geçersiz tür (.txt): “Lütfen PDF, JPG, PNG, WEBP ya da HEIC yükleyin.”, istek yok, mesaj odakta', (await metin(p, '#leadStatus')) === 'Lütfen PDF, JPG, PNG, WEBP ya da HEIC yükleyin.' && durum.gonderiler.length === 0 && s.odak && s.ust >= s.nav);
  await p.setInputFiles('#lead-fatura', [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf'), pdf('d.pdf')]);
  await p.click('#leadSubmit'); await p.waitForTimeout(400);
  ok('F6 dört dosya: “En fazla 3 fatura dosyası yükleyebilirsiniz.”, istek yok', (await metin(p, '#leadStatus')) === 'En fazla 3 fatura dosyası yükleyebilirsiniz.' && durum.gonderiler.length === 0);
  await p.setInputFiles('#lead-fatura', pdf('buyuk.pdf', 8 * 1024 * 1024 + 10));
  await p.click('#leadSubmit'); await p.waitForTimeout(600);
  ok('F6 8 MB üstü dosya: “Her dosya en fazla 8 MB olabilir.”, istek yok', (await metin(p, '#leadStatus')) === 'Her dosya en fazla 8 MB olabilir.' && durum.gonderiler.length === 0);
  await p.setInputFiles('#lead-fatura', [pdf('x.pdf', 4 * 1024 * 1024), pdf('y.pdf', 4 * 1024 * 1024), pdf('z.pdf', 3 * 1024 * 1024)]);
  await p.click('#leadSubmit'); await p.waitForTimeout(800);
  ok('F6 toplam 10 MB üstü: “Dosyaların toplamı en fazla 10 MB olabilir.”, istek yok', (await metin(p, '#leadStatus')) === 'Dosyaların toplamı en fazla 10 MB olabilir.' && durum.gonderiler.length === 0);
  await p.setInputFiles('#lead-fatura', pdf('fatura.pdf'));
  await p.click('#leadSubmit'); await p.waitForSelector('.form-success');
  const g = durum.gonderiler[0];
  const ham = g.ham.toString('latin1');
  ok('F6 geçerli PDF: multipart gönderim, payload JSON + fatura dosyası', durum.gonderiler.length === 1 && /multipart\/form-data/.test(g.tur) && /name="payload"/.test(ham) && /name="fatura"; filename="fatura\.pdf"/.test(ham) && /"kaynak":"dogrudan"/.test(ham));
  await ctx.close();
  const k = await baglam({ w: 1280, h: 900 });
  let sayac = 0;
  await k.ctx.unroute('**/api/lead');
  await k.ctx.route('**/api/lead', (route) => { sayac++; const t = route.request().headers()['content-type'] || ''; return /multipart/.test(t) ? route.fulfill({ status: 502, body: 'x' }) : route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await ac(k.p);
  await k.p.locator('#leadForm').scrollIntoViewIfNeeded();
  await doldur(k.p);
  await k.p.setInputFiles('#lead-fatura', pdf('fatura.pdf'));
  await k.p.click('#leadSubmit'); await k.p.waitForSelector('.form-success');
  ok('F6 dosyalı gönderim 5xx: bir kez dosyasız denenir, “faturanız yüklenemedi” notu', sayac === 2 && /Talebiniz alındı, ancak faturanız yüklenemedi/.test(await metin(k.p, '.form-success')));
  await k.ctx.close();
}
{ // F7 mesken, tuzak alan, KVKK, ödeme seçenekleri
  const { ctx, p, durum } = await baglam({ w: 1280, h: 900 });
  await ac(p);
  await p.locator('#leadForm').scrollIntoViewIfNeeded();
  const odeme = await p.evaluate(() => [...document.querySelectorAll('input[name="odeme_tercihi"]')].map(r => r.value + (r.required ? '*' : '')).join(','));
  ok('F7 ödeme seçenekleri: ön ödemeli, faturadan sonra, ikisi; etiketler görünür', odeme === 'onodemeli*,vadeli,ikisi' && await p.evaluate(() => [...document.querySelectorAll('.form-choice b.tr-only')].map(x => x.textContent).join('|') === 'Ön ödemeli|Faturadan sonra öde|İkisini de görmek istiyorum'), odeme);
  await p.selectOption('#lead-tarife', 'mesken');
  const m = await p.evaluate(() => ({ sirket: getComputedStyle(document.getElementById('lead-sirket').closest('.form-group')).display, sektor: getComputedStyle(document.getElementById('lead-sektor').closest('.form-group')).display, odeme: getComputedStyle(document.querySelector('fieldset.form-choices')).display, not: getComputedStyle(document.getElementById('lead-mesken-not')).display, bant: [...document.getElementById('lead-tuketim').options].map(o => o.value).join('|'), yer: document.getElementById('lead-tuketim-kwh').placeholder, zorunlu: document.getElementById('lead-sirket').required }));
  ok('F7 mesken: şirket, sektör, ödeme gizlenir; not görünür; ev bantları gelir', m.sirket === 'none' && m.sektor === 'none' && m.odeme === 'none' && m.not !== 'none' && m.bant.startsWith('|0-300|300-500') && m.yer === 'Örn. 650 kWh' && !m.zorunlu, JSON.stringify(m));
  await doldur(p, { mesken: true });
  await p.click('#leadSubmit'); await p.waitForSelector('.form-success');
  const v = durum.gonderiler[0].govde;
  ok('F7 mesken gönderimi: tarife mesken, bant 500-750, şirket ve ödeme boş', v.tarife === 'mesken' && v.tuketim === '500-750' && v.sirket === '' && v.odeme_tercihi === '' && v.sektor === '');
  await ctx.close();
  const k = await baglam({ w: 1280, h: 900 });
  await ac(k.p);
  const hp = await k.p.evaluate(() => { const e = document.querySelector('.hp-field'); const r = e.getBoundingClientRect(); return { sol: r.left, tab: document.getElementById('lead-website').tabIndex, gizli: e.getAttribute('aria-hidden') }; });
  ok('F7 tuzak alan ekran dışında, sekme sırasında değil', hp.sol < -1000 && hp.tab === -1 && hp.gizli === 'true', JSON.stringify(hp));
  const etiket = await k.p.evaluate(() => [...document.querySelectorAll('#leadForm input:not([type=radio]):not([type=checkbox]), #leadForm select, #leadForm textarea')].filter(e => !e.closest('.hp-field') && !(e.labels && e.labels.length && e.labels[0].textContent.trim())).map(e => e.id));
  ok('F7 her form alanının görünür etiketi var', etiket.length === 0, etiket.join(','));
  await k.p.locator('#leadForm').scrollIntoViewIfNeeded();
  await doldur(k.p); await k.p.uncheck('#lead-kvkk');
  await k.p.click('#leadSubmit'); await k.p.waitForTimeout(400);
  ok('F7 KVKK onayı olmadan gönderilmez', k.durum.gonderiler.length === 0 && await k.p.evaluate(() => document.activeElement.id === 'lead-kvkk'));
  const kv = await k.p.evaluate(() => { const a = document.querySelector('.form-consent a'); return [a.getAttribute('href'), a.target, a.rel]; });
  ok('F7 KVKK bağlantısı /kvkk, yeni sekme', kv.join() === '/kvkk,_blank,noopener', kv.join());
  await k.ctx.close();
  const e = await baglam({ w: 1280, h: 900 });
  await ac(e.p, '?lang=en');
  await e.p.locator('#leadForm').scrollIntoViewIfNeeded();
  await doldur(e.p);
  await e.p.click('#leadSubmit'); await e.p.waitForSelector('.form-success');
  ok('F8 EN gönderim: lang en, İngilizce başarı metni', e.durum.gonderiler[0].govde.lang === 'en' && /Your request has been received\./.test(await metin(e.p, '.form-success')));
  await e.ctx.close();
}

// ───────────────────────── G. bağlantıyla geliş (#teklif, #iletisim, diğer çapalar) ─────────────────────────
for (const w of [1280, 375]) {
  for (const kare of ['#teklif', '#iletisim']) {
    const { ctx, p } = await baglam({ w, h: 800 });
    await ac(p, kare, 1200);
    const r = await p.evaluate((k) => { const e = document.getElementById(k === '#iletisim' ? 'iletisim' : 'leadForm').getBoundingClientRect(); return [Math.round(e.top), Math.round(document.getElementById('nav').getBoundingClientRect().bottom)]; }, kare);
    ok(`G2 ${w}px /${kare}: hedef bandın 16 px altında`, r[0] >= r[1] && r[0] <= r[1] + 24, r.join('/'));
    await ctx.close();
  }
  for (const kare of ['#hakkimizda', '#yaklasim', '#hizmetler']) {
    const { ctx, p } = await baglam({ w, h: 800 });
    await ac(p, kare, 900);
    const r = await p.evaluate((k) => { const e = document.querySelector(k).getBoundingClientRect(); const h = document.querySelector(k + ' h2').getBoundingClientRect(); return [Math.round(e.top), Math.round(h.top), Math.round(document.getElementById('nav').getBoundingClientRect().bottom), innerHeight]; }, kare);
    ok(`G3 ${w}px /${kare}: bölüm başlığı bandın altında, ilk ekranda`, Math.abs(r[0]) <= 2 && r[1] >= r[2] && r[1] < r[3], r.join('/'));
    await ctx.close();
  }
}

// ───────────────────────── H. hareket azaltma, fotoğraf yedeği, logo yedeği ─────────────────────────
{
  const { ctx, p } = await baglam({ w: 1280, h: 800, azalt: true });
  await ac(p);
  const r = await p.evaluate(() => ({ kay: getComputedStyle(document.documentElement).scrollBehavior, anim: document.getAnimations().length, gizli: [...document.querySelectorAll('main *')].filter(e => +getComputedStyle(e).opacity === 0 && !e.closest('.form-flora, .form-flora-kutu, .hp-field') && e.getBoundingClientRect().height > 0).length }));
  ok('H1 hareket azaltma: yumuşak kaydırma kapalı, çalışan animasyon yok, gizli içerik yok', r.kay === 'auto' && r.anim === 0 && r.gizli === 0, JSON.stringify(r));
  await ctx.close();
  const n = await baglam({ w: 1280, h: 800 });
  await ac(n.p);
  const g = await n.p.evaluate(() => ({ anim: document.getAnimations().length, gizli: [...document.querySelectorAll('main *')].filter(e => (+getComputedStyle(e).opacity < 1 || getComputedStyle(e).transform !== 'none') && !e.closest('.form-flora, .form-flora-kutu, .hp-field, form')).map(e => e.className).slice(0, 5), io: /IntersectionObserver/.test([...document.scripts].map(s => s.textContent).join('')) }));
  ok('H2 kaydırınca belirme kaldırıldı: açılışta gizli ya da kaydırılmış öğe yok, IntersectionObserver yok', g.gizli.length === 0 && !g.io, JSON.stringify(g));
  await n.ctx.close();
  const f = await baglam({ w: 1440, h: 900, azalt: true });
  await f.ctx.route('**/img/kapak-*', (route) => route.abort());
  await ac(f.p);
  const y = await f.p.evaluate(() => [document.querySelector('.hero-media').classList.contains('yedek'), getComputedStyle(document.querySelector('.hero-placeholder')).display, getComputedStyle(document.querySelector('.hero-photo')).display]);
  ok('H3 fotoğraf yüklenemezse çizim silüet devreye girer', y[0] && y[1] === 'block' && y[2] === 'none', y.join());
  await f.p.locator('.hero').screenshot({ path: `${CIKTI}/r2/durum/kapak-yedek-1440.png` });
  await f.ctx.close();
  const l = await baglam({ w: 1280, h: 800 });
  await l.ctx.route('**/voltage-enerji-logo.svg', (route) => route.abort());
  await ac(l.p);
  const lg = await l.p.evaluate(() => [document.querySelector('.nav-logo-mark').classList.contains('gorsel-hazir'), getComputedStyle(document.querySelector('.nav-logo-mark svg')).display]);
  ok('H4 logo görseli yüklenemezse satır içi çizim görünür', lg[0] === false && lg[1] !== 'none', lg.join());
  await l.ctx.close();
  // kapak görseli seçimi: dar ekranda dikey kırpım, geniş ekranda 3:1 set
  for (const [w, dsf, bek] of [[375, 2, /kapak-mobil-579\.webp$/], [700, 1, /kapak-mobil-579\.webp$/], [768, 1, /kapak-2172\.webp$/], [1440, 1, /kapak-2172\.webp$/], [1440, 2, /kapak-2172\.webp$/]]) {
    const k = await baglam({ w, h: 800, dsf });
    await ac(k.p, '', 200);
    const src = await k.p.evaluate(() => document.querySelector('.hero-photo img').currentSrc);
    ok(`H5 ${w}px @${dsf}x kapak görseli: ${src.split('/').pop()}`, bek.test(src), src);
    await k.ctx.close();
  }
}

// ───────────────────────── I. yerleşim: yatay taşma, dokunma hedefleri, seçim kutuları ─────────────────────────
for (const w of [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440]) {
  for (const dil of ['tr', 'en']) {
    const { ctx, p } = await baglam({ w, h: 800, azalt: true });
    await ac(p, '?lang=' + dil, 200);
    const r = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const tasan = [];
      document.querySelectorAll('main *, footer *, header *').forEach(el => {
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const q = el.getBoundingClientRect(); if (!q.width || !q.height) return;
        if (q.right <= vw + 0.5 && q.left >= -0.5) return;
        let a = el.parentElement, kirp = false;
        while (a && a !== document.documentElement) { if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(a).overflowX)) { kirp = true; break; } a = a.parentElement; }
        if (!kirp) tasan.push(el.tagName + '.' + String(el.className.baseVal ?? el.className).slice(0, 24));
      });
      const kirpik = [...document.querySelectorAll('header a, header span, main h1, main h2, main h3, main p, main a, main span, main td, main th, main dt, main dd, main li, main label, main button, main div, footer a, footer div, footer span')].filter(e => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.display !== 'inline' && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && !/(auto|scroll)/.test(cs.overflowX) && !e.closest('.form-flora') && !e.closest('.hp-field') && !e.classList.contains('form') && !e.classList.contains('form-flora-kutu') && !e.classList.contains('hero-media') && !e.classList.contains('hero-copy') && !e.classList.contains('hero-text'); }).map(e => e.tagName + '.' + String(e.className).slice(0, 24) + ':' + e.scrollWidth + '>' + e.clientWidth);
      return { sw: document.documentElement.scrollWidth, vw, tasan: tasan.slice(0, 6), kirpik: kirpik.slice(0, 6) };
    });
    ok(`I1 ${w}px ${dil.toUpperCase()} yatay sayfa kaydırması yok, kırpılan metin yok`, r.sw <= r.vw && r.tasan.length === 0 && r.kirpik.length === 0, JSON.stringify(r));
    await ctx.close();
  }
}
for (const w of [320, 375]) {
  for (const dil of ['tr', 'en']) {
    const { ctx, p } = await baglam({ w, h: 800, azalt: true });
    await ac(p, '?lang=' + dil, 200);
    await p.evaluate(() => document.fonts.ready);
    const olc = () => p.evaluate(() => {
      const c = document.createElement('canvas').getContext('2d'); const dar = [];
      document.querySelectorAll('#leadForm select').forEach(s => {
        const cs = getComputedStyle(s); if (cs.display === 'none' || !s.clientWidth) return;
        c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const yer = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        [...s.options].forEach(o => { const g = c.measureText(o.textContent).width; if (g > yer) dar.push(s.id + ':"' + o.textContent + '" ' + Math.ceil(g) + '>' + Math.floor(yer)); });
      });
      return dar;
    });
    const a = await olc();
    await p.selectOption('#lead-tarife', 'mesken');
    const m = await olc();
    ok(`I2 ${w}px ${dil.toUpperCase()} seçim kutularında en uzun seçenek sığıyor (iş ve mesken bantları)`, a.length === 0 && m.length === 0, a.concat(m).join(' | '));
    await ctx.close();
  }
}
for (const w of [320, 375, 430]) {
  const { ctx, p } = await baglam({ w, h: 800, azalt: true });
  await ac(p);
  const olc = () => p.evaluate(() => [...document.querySelectorAll('a, button, select, input:not([type=hidden]), textarea, label.form-choice, label.form-green, label.form-consent')].filter(e => { if (e.closest('.hp-field') || e.closest('[hidden]') || e.classList.contains('skip')) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); if (!r.width) return false; if ((e.type === 'checkbox' || e.type === 'radio') && e.closest('label')) return false; return r.width < 44 || r.height < 44; }).map(e => e.tagName + '.' + String(e.className).slice(0, 20) + ' "' + e.textContent.trim().slice(0, 18) + '" ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
  const kucuk = await olc();
  await p.click('#mobileMenuBtn');
  const menude = await p.evaluate(() => [...document.querySelectorAll('#mobileMenu a, #mobileMenu button')].filter(e => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(e => e.textContent + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
  ok(`I3 ${w}px dokunma hedefleri en az 44×44 px (bağlantı, düğme, alan, seçenek etiketi; menü paneli dahil)`, kucuk.length === 0 && menude.length === 0, kucuk.concat(menude).join(' | '));
  await ctx.close();
}
for (const w of [1280, 1440, 1040]) {
  const { ctx, p } = await baglam({ w, h: 800, azalt: true });
  await ac(p);
  const r = await p.evaluate(() => { const a = document.querySelector('.contact-info').getBoundingClientRect(), f = document.getElementById('leadForm').getBoundingClientRect(), t = document.getElementById('teklif').getBoundingClientRect(); return { yan: f.left >= a.right && Math.abs(f.top - a.top) < 40, capa: Math.round(t.top - f.top) }; });
  ok(`I4 ${w}px form iletişim bilgilerinin yanında, aynı hizada; #teklif çapası formun üstünde`, r.yan && Math.abs(r.capa) <= 1, JSON.stringify(r));
  await ctx.close();
}
{ // tablo telefonda: sayfa içinde, yatay kaydırma gerektirmeden okunur
  const { ctx, p } = await baglam({ w: 320, h: 640, azalt: true });
  await ac(p);
  const t = await p.evaluate(() => { const s = document.getElementById('saatTablo').getBoundingClientRect(); const f = document.querySelector('.fin-table').getBoundingClientRect(); const sat = document.querySelector('#saatTablo tbody tr').getBoundingClientRect(); return { sol: Math.round(s.left), sag: Math.round(s.right), fsag: Math.round(f.right), satir: Math.round(sat.height), yazi: parseFloat(getComputedStyle(document.querySelector('#saatTablo td')).fontSize), model: [...document.querySelectorAll('.fin-table .ft-m')].filter(e => getComputedStyle(e).display !== 'none').length }; });
  ok('I5 320px saatlik tablo ve model tablosu ekrana sığıyor (yatay kaydırma yok); model tablosunda her değerin başında model adı', t.sol >= 0 && t.sag <= 320 && t.fsag <= 320 && t.yazi >= 14 && t.model === 9, JSON.stringify(t));
  await ctx.close();
}

await b.close();
writeFileSync(`${CIKTI}/r2/test-sonucu.txt`, 'HAZIRLIK SAYFASI — DAVRANIŞ TESTLERİ (2. tur)\nSayfa: ' + SAYFA + '\n\n' + sonuc.join('\n') + `\n\nTOPLAM: ${gecen} geçti, ${kalan} kaldı\n`);
console.log(`\nTOPLAM: ${gecen} geçti, ${kalan} kaldı  (ayrıntı: ${CIKTI}/r2/test-sonucu.txt)`);
process.exit(kalan ? 1 : 0);
