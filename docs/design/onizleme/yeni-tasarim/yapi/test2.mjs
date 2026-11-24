// Hazırlık sayfası davranış testleri — 3. tur (24.11 revizyonu). Gerçek veri gönderilmez: /api/lead ve epias-proxy yanıtları taklit edilir.
import { chromium, SAYFA, CIKTI, ornekVeri, ONCEKI, sektorYedegi, eksikGorseller } from './ortak.mjs';
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
{ const e = eksikGorseller(); if (e.length) not(`UYARI: ${e.length}/21 sektör görseli dosyası img/ klasöründe yok; bu koşuda yerlerine aynı ölçüde düz renkli TEST görseli döndürüldü (dosya yazılmadı): ${e.join(', ')}`); else not('sektör görselleri: 21/21 dosya img/ klasöründe; testler gerçek dosyalarla koştu'); }

async function baglam({ w = 1280, h = 800, ptf = 'canli', eksik = [], azalt = false, js = true, dsf = 1 } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: azalt ? 'reduce' : 'no-preference', javaScriptEnabled: js, deviceScaleFactor: dsf });
  const durum = { ptf, eksik, lead: null, gonderiler: [], konsol: [], istekler: [] };
  await sektorYedegi(ctx);
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
      idler: ['kapak', 'hizmetler', 'canli-piyasa', 'hakkimizda', 'yaklasim', 'iletisim', 'teklif', 'leadForm', 'nav', 'mobileMenu', 'mobileMenuBtn', 'kfPtf', 'kfStamp', 'lgAvg', 'lgMoK', 'lgMo', 'lgMinH', 'lgMaxH', 'lgUpd', 'lmLine', 'lmArea', 'lmDot', 'lmMode', 'saatTablo', 'leadSubmit', 'leadStatus', 'lead-yesil', 'lead-kvkk', 'lead-fatura', 'lead-mesken-not', 'saatBaslik', 'leadFaturaKutu', 'leadFaturaDurum'].filter(i => !document.getElementById(i)),
      cift: [...document.querySelectorAll('[id]')].map(e => e.id).filter((v, i, a) => a.indexOf(v) !== i),
      logo: document.querySelector('.nav-logo-mark').classList.contains('gorsel-hazir'), logoImg: getComputedStyle(document.querySelector('.nav-logo-mark img')).display,
      marka: [getComputedStyle(document.querySelector('.nav-logo-name')).fontFamily, getComputedStyle(document.querySelector('.cl-word')).fontFamily].join(' | '),
      foto: (() => { const i = document.querySelector('.hero-photo img'); return [i.complete, i.naturalWidth, i.currentSrc.split('/').pop(), document.querySelector('.hero-media').className]; })(),
      kok: [...document.querySelectorAll('[src],[href],[action]')].map(e => e.getAttribute('src') || e.getAttribute('href') || e.getAttribute('action')).filter(u => !/^(\/|#|https:\/\/|mailto:|img\/kapak|img\/sektor-)/.test(u)),
      sus: ['.sec-no', '.nav-folio', '.service-num', '.tline-svg', '.art-rings', '.exhibit-tag', '.step-s', '.app-l', '.callout-src', '.callout-d', '.kpi-band', '.reveal:not(form)'].filter(s => document.querySelector(s)),
      yazi: ['EXHIBIT A', 'VOLTAGE FELSEFESİ', 'TEK HAT ŞEMASI', 'KAPAK ·', '01 / 09'].filter(t => document.body.innerText.includes(t)),
      okSuz: [...document.querySelectorAll('svg.arrow')].filter(s => !s.closest('a, button')).length,
      kart: (() => { const c = getComputedStyle(document.getElementById('ptfKart')); return [c.backdropFilter, c.boxShadow, c.backgroundColor].join(' | '); })(),
      mono: [...new Set(mono.map(e => { const k = e.closest('.kf-stamp, .ptf-ticks, .lm-mode, .lg-v, .saat-tablo, .mono, .mcp-rail'); return k ? 'İZİNLİ ' + (k.id ? '#' + k.id : '.' + String(k.className).split(' ').join('.')) : 'DIŞ ' + e.tagName + '.' + e.className; }))],
      serif: [...new Set(serif.map(e => e.className || e.tagName))],
      claim: document.querySelectorAll('.about-claim, .quotec').length,
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
  ok('A9 yollar kökten başlıyor (kapak ve sektör görselleri dışında göreli yol yok)', y.kok.length === 0, y.kok.join(','));
  ok('A10 süs öğeleri yok: bölüm numarası, folyo, hizmet numarası, tek hat şeması, halkalar, EXHIBIT A, S1–S5, A/B/C, felsefe etiketi, ray, belirme', y.sus.length === 0 && y.yazi.length === 0, y.sus.concat(y.yazi).join(','));
  ok('A11 ok simgesi yalnız gerçek bağlantı ve düğmelerde', y.okSuz === 0, String(y.okSuz));
  ok('A12 PTF kartı düz panel: bulanıklık ve gölge yok, zemin opak', /^none/.test(y.kart) && / \| none \| rgb\(11, 18, 38\)$/.test(y.kart), y.kart);
  ok('A13 gölge kullanan öğe yok (form odak halkası dışında)', y.golge.length === 0, y.golge.join(','));
  const monoDisi = y.mono.filter(m => m.startsWith('DIŞ'));
  ok('A14 monospace yalnız piyasa verisi, saat damgası ve teknik kimliklerde (lisans no, sicil no)', monoDisi.length === 0, monoDisi.join(' , '));
  not('monospace kullanan öğeler: ' + y.mono.join(' '));
  ok('A15 serif yalnız üç yerde: kapak sloganı, imza, şirket cümlesi (slogan satırı kaldırıldı)', y.serif.every(s => /h1-ana|tr-only|about-signature-text|callout-t/.test(s)) && y.serif.length <= 4 && y.claim === 0, y.serif.join(',') + ' claim/quotec ' + y.claim);
  not('serif kullanan öğeler: ' + y.serif.join(' '));
  await ctx.close();
  for (const w of [1440, 390, 375]) {
    const k = await baglam({ w, h: w === 375 ? 667 : (w === 390 ? 844 : 900) });
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
      h3: [...document.querySelectorAll('main h3')].filter(h => !h.closest('[hidden]')).map(h => [...h.querySelectorAll('span')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent).join('') || h.textContent.trim()),
      alt: [...document.querySelectorAll('.sektor-foto img')].map(i => i.alt), altUyum: [...document.querySelectorAll('img[data-alt-tr]')].every(i => i.alt === i.getAttribute('data-alt-' + dil)),
      kayit: localStorage.getItem('voltage-lang'), h1: document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
      h2: [...document.querySelectorAll('main h2')].map(h => [...h.querySelectorAll('span')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent).join('') || h.textContent.trim()).join(' | '),
    };
  });
  let d = await oku();
  ok('B1 açılış Türkçe; tüm çiftler TR metninde; çocuklu çeviri çifti yok', d.dil === 'tr' && d.uyumsuz.length === 0 && d.enGor === 0 && d.trGor === d.trTop, JSON.stringify(d.uyumsuz.slice(0, 3)));
  ok('B1 TR H2 metinleri talimattaki gibi', d.h2 === 'Hizmetlerimiz | Hizmet Verdiğimiz Sektörler | Güncel Elektrik Piyasası Verileri | Elektrik Tedarik Süreci | Elektrik Tedarik Sözleşmesi Modelleri | Voltage Enerji Hakkında | Neden Voltage? | İletişim', d.h2);
  const H3TR = ['Endüstriyel Tedarik', 'GÖP & GİP Operasyonu', 'Portföy Yönetimi', 'Yenilenebilir Enerji Tedariki', 'Enerji Danışmanlığı', 'Demir-Çelik & Döküm', 'Kimya & Petrokimya', 'OSB & Endüstri Bölgeleri', 'Lojistik & Soğuk Zincir', 'Cam & Seramik', 'Veri Merkezleri & Telekom', 'Tekstil & Kompozit', 'Gün Öncesi PTF · 24 Saat · ₺/MWh', 'Günlük Piyasa Özeti', 'Saatlik PTF · ₺/MWh', 'Keşif', 'Modelleme', 'Teklif', 'Tedarikçi Değişimi', 'Devreye Alma', 'Şirket Bilgileri', 'EPDK Tedarik Lisansı', 'Sözleşme Disiplini', 'Elektrik Piyasalarında Uzmanlık', 'Şeffaf Yapı', 'Teklif Talebi', 'İletişim ve Sicil Bilgileri'];
  ok('B1 TR H3 metinleri: beş hizmet, yedi sektör, piyasa ara başlıkları (“Günlük Piyasa Özeti”), beş adım (“Tedarikçi Değişimi”), şirket bilgileri, EPDK lisansı (H3), üç ilke, form, iletişim bilgileri', JSON.stringify(d.h3) === JSON.stringify(H3TR) && !d.h3.includes('Onboard') && !d.h3.includes('Bugünün Cetveli'), JSON.stringify(d.h3.filter(x => !H3TR.includes(x)).concat(H3TR.filter(x => !d.h3.includes(x)))));
  const ALTTR = ['Çelik fabrikasında potadan dökülen erimiş metal', 'Alacakaranlıkta bir petrokimya tesisinin damıtma kuleleri ve boru hatları', 'Organize sanayi bölgesindeki fabrika binalarının havadan görünümü', 'Yüksek raflı soğuk hava deposunun içi', 'Cam şişe üretim hattında kızgın şişeler', 'Veri merkezinde sunucu kabinleri arasındaki koridor', 'Dokuma fabrikasında sıra sıra dokuma tezgâhları'];
  const ALTEN = ['Molten metal being poured from a ladle in a steel plant', 'Distillation columns and pipe racks of a petrochemical plant at dusk', 'Aerial view of factory buildings in an organised industrial zone', 'Interior of a high-bay cold storage warehouse', 'Glowing hot bottles on a glass production line', 'Aisle between server racks in a data centre', 'Rows of looms in a weaving mill'];
  ok('B1 TR: yedi sektör görselinin alt metni Türkçe', JSON.stringify(d.alt) === JSON.stringify(ALTTR) && d.altUyum, JSON.stringify(d.alt));
  await p.click('.nav-right .lang-btn[data-lang="en"]');
  d = await oku();
  const H3EN = ['Industrial Supply', 'Day-Ahead & Intra-Day Operations', 'Portfolio Management', 'Renewable Energy Supply', 'Energy Advisory', 'Steel & Foundry', 'Chemicals & Petrochem', 'Organized Industrial Zones', 'Logistics & Cold Chain', 'Glass & Ceramics', 'Data Centers & Telecom', 'Textile & Composites', 'Day-Ahead MCP · 24 Hours · ₺/MWh', 'Daily Market Summary', 'Hourly MCP · ₺/MWh', 'Discovery', 'Modeling', 'Proposal', 'Supplier Switch', 'Go-live', 'Company Details', 'EPDK Supply License', 'Contract Discipline', 'Expertise in Electricity Markets', 'Transparent Structure', 'Request a Proposal', 'Contact and Registry Details'];
  ok('B2 EN H3 metinleri (“Daily Market Summary”, “Supplier Switch”, “Company Details”, “Contact and Registry Details” dahil)', JSON.stringify(d.h3) === JSON.stringify(H3EN), JSON.stringify(d.h3.filter(x => !H3EN.includes(x)).concat(H3EN.filter(x => !d.h3.includes(x)))));
  ok('B2 EN: yedi sektör görselinin alt metni İngilizce (dil düğmesi alt metnini de değiştirir)', JSON.stringify(d.alt) === JSON.stringify(ALTEN) && d.altUyum, JSON.stringify(d.alt));
  ok('B2 EN: html lang, tüm çiftler EN metninde, tr-only gizli', d.dil === 'en' && d.uyumsuz.length === 0 && d.trGor === 0 && d.enGor === d.enTop, JSON.stringify(d.uyumsuz.slice(0, 3)));
  ok('B2 EN H2 metinleri talimattaki gibi', d.h2 === 'Our Services | Sectors We Serve | Current Electricity Market Data | Electricity Supply Process | Electricity Supply Contract Models | About Voltage Enerji | Why Voltage? | Contact', d.h2);
  ok('B3 EN: title / description / og:title / og:locale değişti', /Electricity Supplier$/.test(d.baslik) && /^Voltage Enerji, the brand/.test(d.tanim) && d.ogt === d.baslik && d.ogl === 'en_US', d.baslik);
  ok('B4 EN: canlı damga, kip, aylık etiket, yer tutucu İngilizce', /^HOUR \d\d:00/.test(d.damga) && d.mod === 'LIVE' && /^MONTHLY AVG/.test(d.aylik) && /^Current contract/.test(d.yer), JSON.stringify([d.damga, d.mod, d.aylik]));
  ok('B5 EN: aria-pressed ve etkin sınıf (üst bant ve menü panelindeki düğmeler birlikte)', d.basili === 'tr:false:false en:true:true tr:false:false en:true:true' && d.kayit === 'en', d.basili);
  ok('B6 EN H1: iki parça', d.h1 === "Electricity Supply for Industry and Businesses We connect industry's energy with the market.", d.h1);
  await p.click('.nav-right .lang-btn[data-lang="tr"]');
  d = await oku();
  ok('B7 TR’ye dönüş: tüm çiftler TR, başlık ve tanım TR, en-only gizli, alt metinleri yeniden Türkçe', d.dil === 'tr' && d.uyumsuz.length === 0 && d.enGor === 0 && /Elektrik Tedarikçisi$/.test(d.baslik) && d.ogl === 'tr_TR' && /^SAAT /.test(d.damga) && JSON.stringify(d.alt) === JSON.stringify(ALTTR), JSON.stringify(d.uyumsuz.slice(0, 3)));
  await ctx.close();
  const k = await baglam({ w: 1280 });
  await ac(k.p, '?lang=en');
  ok('B8 ?lang=en ile açılış İngilizce (alt metinleri ve dosya seçici dahil)', await k.p.evaluate(() => document.documentElement.lang === 'en' && document.querySelector('.h1-ana').textContent.startsWith('We connect') && document.querySelector('.sektor-foto img').alt.startsWith('Molten metal') && document.querySelector('.dosya-dugme').textContent === 'Choose Files' && document.getElementById('leadFaturaDurum').textContent === 'No file chosen'));
  await k.ctx.close();
}

// ───────────────────────── C. menü bağlantıları, yumuşak kaydırma ─────────────────────────
for (const w of [1440, 1280, 390, 375]) {
  const { ctx, p } = await baglam({ w, h: w === 375 ? 667 : (w === 390 ? 844 : (w === 1440 ? 900 : 800)) });
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
    if (hedef === 'teklif') { const f = await p.evaluate(() => { const t = document.querySelector('.form-title').getBoundingClientRect(), a = document.getElementById('lead-ad').getBoundingClientRect(), n = document.getElementById('nav').getBoundingClientRect(); return { baslik: Math.round(t.top), alan: Math.round(a.bottom), nav: Math.round(n.bottom), vh: innerHeight }; }); ok(`C1 ${w}px “Teklif Al” inişi: form başlığı ve ilk alan ilk ekranda, bandın altında (arada başka içerik yok)`, f.baslik >= f.nav && f.baslik <= f.nav + 90 && f.alan <= f.vh, JSON.stringify(f)); not(`${w}px “Teklif Al” → form üst kenarı ${r.ust} px, üst bant alt kenarı ${r.nav} px, form başlığı ${f.baslik} px, ilk alanın alt kenarı ${f.alan} px (ekran ${f.vh} px)`); }
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
  ok(`D3 ${w}px kapak gereğinden uzun değil: karttan sonra en çok 48 px + 44 px şerit yeri; kart düğme çiftinden kısa; yapışkan alt çubuk yok`, d.kapak.alt - d.kart.alt <= 48 + 44 && d.kart.y <= 200 && d.sabit === 0, JSON.stringify([d.kapak.y, d.kapak.alt - d.kart.alt, d.kart.y, d.sabit]));
  const ds = await p.evaluate(() => { const e = document.getElementById('mcpRail'); const r = e.getBoundingClientRect(); const k = document.getElementById('ptfKart').getBoundingClientRect(); const hb = document.getElementById('kapak').getBoundingClientRect(); return [e.hidden, Math.round(r.height), Math.round(hb.bottom - r.bottom), Math.round(r.top - k.bottom), e.querySelectorAll('.cell').length]; });
  ok(`D3 ${w}px şerit telefonda da var: 44 px (dokunma hedefi), kapağın alt kenarında, kartla çakışmıyor (≥ 24 px)`, ds[0] === false && ds[1] === 44 && ds[2] === 0 && ds[3] >= 24 && ds[4] === 48, JSON.stringify(ds));
  ok(`D4 ${w}px ilk ekranda “Teklif Al” (kapak düğmesi) görünür`, d.birincil.alt <= d.vh, d.birincil.alt + '/' + d.vh);
  not(`${w}×${h}: kapak yüksekliği ${d.kapak.y} px, PTF kartı ${d.kart.y} px, kapak “Teklif Al” alt kenarı ${d.birincil.alt} px`);
  if (w === 375) {
    const dm = () => p.evaluate(() => { const m = document.getElementById('mobileMenu'), bt = document.getElementById('mobileMenuBtn'); return { gizli: m.hidden, gor: getComputedStyle(m).display, acik: bt.getAttribute('aria-expanded'), govde: document.body.classList.contains('menu-open'), bag: [...m.querySelectorAll('a')].map(a => Math.round(a.getBoundingClientRect().height)), dil: [...m.querySelectorAll('.lang-btn')].map(x => { const q = x.getBoundingClientRect(); return Math.round(q.width) + 'x' + Math.round(q.height); }) }; });
    let m = await dm();
    ok('D5 menü kapalı açılır', m.gizli && m.gor === 'none' && m.acik === 'false');
    await p.click('#mobileMenuBtn'); m = await dm();
    ok('D6 düğme menüyü açar: 6 bağlantı ≥44 px, dil düğmeleri panelde ≥44×44, gövde kilidi', !m.gizli && m.gor === 'flex' && m.acik === 'true' && m.govde && m.bag.length === 6 && m.bag.every(x => x >= 44) && m.dil.length === 2 && m.dil.every(s => s.split('x').every(v => +v >= 44)), JSON.stringify(m));
    await p.screenshot({ path: `${CIKTI}/r3/durum/mobil-menu-375.png` });
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
  const tablolar = await p.evaluate(() => [...document.querySelectorAll('#saatTablo table')].map(t => ({ satir: t.tBodies[0].rows.length, ilk: t.tBodies[0].rows[0].cells[0].textContent, bas: [...t.tHead.rows[0].cells].map(c => c.textContent + ':' + c.scope).join(','), ad: (document.getElementById(t.getAttribute('aria-labelledby')) || {}).textContent, ust: Math.round(t.getBoundingClientRect().top), sol: Math.round(t.getBoundingClientRect().left) })));
  ok('E1 saatlik tablo dört kısa gerçek tablo: 6’şar satır (00, 06, 12, 18’den başlar), sütun başlıkları “Saat / PTF” (scope=col), adları “Saatlik PTF · ₺/MWh”; geniş ekranda yan yana', tablolar.length === 4 && tablolar.every(t => t.satir === 6 && t.bas === 'Saat:col,PTF:col' && t.ad === 'Saatlik PTF · ₺/MWh') && tablolar.map(t => t.ilk).join() === '00:00,06:00,12:00,18:00' && new Set(tablolar.map(t => t.ust)).size === 1 && new Set(tablolar.map(t => t.sol)).size === 4, JSON.stringify(tablolar));
  ok('E1 CANLI saatlik tablo: gerçek <table>, 24 satır (00:00–23:00), 24 değer sayı, o saatin satırı işaretli', d.satir === 24 && d.saat.startsWith('00:00,01:00') && d.saat.endsWith('22:00,23:00') && d.hucre.every(v => SAYI.test(v)) && d.simdi === simdi, JSON.stringify([d.satir, d.simdi, simdi, d.hucre.slice(0, 3)]));
  const ornek = ornekVeri();
  const bekle = ornek.items.map(i => i.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  ok('E1 tablo değerleri proxy yanıtındaki saatlik fiyatlarla birebir aynı; kapak değeri = o saatin tablo değeri', JSON.stringify(d.hucre) === JSON.stringify(bekle) && d.deger === d.hucre[+simdi.slice(0, 2)], d.hucre.slice(0, 2) + ' / ' + bekle.slice(0, 2));
  ok('E1 bölüm kapaktaki “şu anki saat” rakamını manşet yapmıyor: KPI bandı yok; kapak değeri bölümde yalnız tablo satırında', await p.evaluate((v) => !document.querySelector('.kpi-band, .kpi-num') && [...document.querySelectorAll('#canli-piyasa *')].filter(e => e.children.length === 0 && e.textContent.trim() === v).every(e => e.tagName === 'TD'), d.deger));
  // Saatlik PTF şeridi (24.11, sahibin isteği): yalnız gerçek veriyle dolar; kapağın yerleşimini değiştirmez
  const serit = await p.evaluate(() => { const r = document.getElementById('mcpRail'); const k = s => document.querySelector(s).getBoundingClientRect(); const rr = r.getBoundingClientRect(); const h = [...r.querySelectorAll('.cell')]; return { gizli: r.hidden, href: r.getAttribute('href'), ad: r.getAttribute('aria-label'), ust: rr.top, alt: rr.bottom, kapakAlt: k('#kapak').bottom, kartAlt: k('#ptfKart').bottom, dugmeAlt: k('.hero-actions').bottom, n: h.length, saat: h.slice(0, 24).map(c => c.textContent.slice(0, 5)).join(), fiyat: h.slice(0, 24).map(c => c.querySelector('b').textContent), ilkFark: h[0].querySelector('.up, .dn') === null, es: h.slice(0, 24).map(c => c.textContent).join('|') === h.slice(24).map(c => c.textContent).join('|'), anim: getComputedStyle(r.firstElementChild).animationName, tasma: document.documentElement.scrollWidth - innerWidth }; });
  ok('E1 şerit: veriyle göründü, 24 saat × 2 (kesintisiz döngü), 00:00–23:00, /canli-ptf bağlantısı, adı var', !serit.gizli && serit.n === 48 && serit.es && serit.saat.startsWith('00:00,01:00') && serit.saat.endsWith('22:00,23:00') && serit.href === '/canli-ptf' && /PTF/.test(serit.ad), JSON.stringify([serit.gizli, serit.n, serit.es, serit.href]));
  ok('E1 şerit değerleri proxy yanıtındaki saatlik fiyatların yuvarlanmışı; günün ilk saatinde fark yazılmaz', JSON.stringify(serit.fiyat) === JSON.stringify(ornek.items.map(i => Math.round(i.price).toLocaleString('tr-TR'))) && serit.ilkFark, serit.fiyat.slice(0, 3).join());
  ok('E1 şerit kapağın alt kenarında (40 px), kart ve düğmelerle çakışmıyor (≥ 24 px boşluk), yatay taşma yok', Math.abs(serit.alt - serit.kapakAlt) < 1 && Math.round(serit.alt - serit.ust) === 40 && serit.ust - Math.max(serit.kartAlt, serit.dugmeAlt) >= 24 && serit.tasma === 0 && serit.anim === 'rail', JSON.stringify(serit));
  await p.hover('#mcpRail'); const durdu = await p.evaluate(() => getComputedStyle(document.getElementById('mcpTrack')).animationPlayState); await p.mouse.move(5, 5);
  ok('E1 şerit üstüne gelince durur (hareketi durdurma yolu)', durdu === 'paused', durdu);
  ok('E1 önbellek anahtarı “voltage-ptf-cache” yazıldı; yalnız /ptf/today ve /ptf/stats çağrıldı', await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('voltage-ptf-cache')); return c && c.prices.length === 24 && Number.isFinite(c.price); }) && [...new Set(durum.istekler.map(u => u.replace(/^https:\/\/[^/]+/, '')))].sort().join() === '/ptf/stats,/ptf/today', [...new Set(durum.istekler)].join());
  await p.locator('.hero').screenshot({ path: `${CIKTI}/r3/durum/ptf-1-canli-kapak-1440.png` });
  await p.locator('#canli-piyasa').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(200);
  await p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r3/durum/ptf-1-canli-bolum-1440.png` });
  // E2 proxy kapalı + bugünkü önbellek
  durum.ptf = 'kapali';
  await ac(p);
  const s = await ptfOku(p);
  kartYuk.onbellek = s.yuk; bolumYuk.onbellek = s.bolumYuk;
  ok('E2 ÖNBELLEK: damga “SON SENKRON ss:dd”, durum cached, değer önbellekteki sayı', s.durum === 'cached' && /^SON SENKRON \d\d:\d\d$/.test(s.damga) && s.sinif === 'kf-stamp stale' && s.deger === d.deger, JSON.stringify([s.durum, s.deger, s.damga]));
  ok('E2 ÖNBELLEK: grafik ve tablo bugünün önbelleğinden; “şu an” noktası ve satır işareti yok; kip SON SENKRON', s.cizgi === d.cizgi && s.nokta === 'none' && s.mod === 'SON SENKRON' && JSON.stringify(s.hucre) === JSON.stringify(d.hucre) && s.simdi === '' && /^SON SENKRON/.test(s.cetvel[4]), JSON.stringify([s.nokta, s.mod, s.simdi]));
  await p.locator('.hero').screenshot({ path: `${CIKTI}/r3/durum/ptf-2-onbellek-kapak-1440.png` });
  await p.locator('#canli-piyasa').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(200);
  await p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r3/durum/ptf-2-onbellek-bolum-1440.png` });
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
  await p.locator('.hero').screenshot({ path: `${CIKTI}/r3/durum/ptf-3-veri-yok-kapak-1440.png` });
  await p.locator('#canli-piyasa').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(200);
  await p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r3/durum/ptf-3-veri-yok-bolum-1440.png` });
  await p.click('.nav-right .lang-btn[data-lang="en"]');
  const e = await ptfOku(p);
  ok('E3 VERİ YOK (EN): “AWAITING EPIAS DATA”, değer “—”', e.damga === 'AWAITING EPIAS DATA' && e.deger === '—' && e.mod === 'AWAITING DATA', e.damga);
  ok('E3 şeridin erişilebilir adı dille değişir (EN)', await p.evaluate(() => document.getElementById('mcpRail').getAttribute('aria-label')) === 'Hourly MCP values: open the Live MCP page');
  await ctx.close();
  const o = await baglam({ w: 1280 });
  await ac(o.p, '?ptfoff');
  const od = await ptfOku(o.p);
  ok('E3 ?ptfoff test kancası: istek atılmaz, dürüst bekleme', od.deger === '—' && od.durum === 'waiting' && o.durum.istekler.length === 0, JSON.stringify([od.deger, o.durum.istekler.length]));
  ok('E3 veri yokken şerit gizli kalır (uydurma değer yok)', await o.p.evaluate(() => { const r = document.getElementById('mcpRail'); return r.hidden && r.getBoundingClientRect().height === 0 && r.querySelectorAll('.cell').length === 0; }));
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
  await p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r3/durum/ptf-4-eksik-saat-bolum-1440.png` });
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
  await j.p.locator('#canli-piyasa').screenshot({ path: `${CIKTI}/r3/durum/ptf-5-betik-kapali-bolum-1280.png` });
  // betik kapalıyken sayfanın bütün Türkçe içeriği görünür mü: betik açıkken görünen metinle karşılaştır
  const kapali = await j.p.evaluate(() => document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean));
  const kart = await j.p.evaluate(() => [document.getElementById('kfPtf').textContent, document.getElementById('kfStamp').textContent, getComputedStyle(document.querySelector('.hero-photo img')).display, [...document.querySelectorAll('main section, .trust, footer')].filter(e => +getComputedStyle(e).opacity < 1 || getComputedStyle(e).visibility === 'hidden').length]);
  await j.ctx.close();
  const a = await baglam({ w: 1280, h: 800, ptf: 'kapali' });
  await ac(a.p);
  const acik = await a.p.evaluate(() => { document.querySelector('#canli-piyasa .lm-veri').remove(); return document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean); });
  await a.ctx.close();
  const eksikSatir = acik.filter(s => !kapali.includes(s) && s !== 'Dosya Seç' && s !== 'Dosya seçilmedi'); // dosya seçicinin iki satırı betikle görünür; betiksiz yerli girdi durur
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
    await p.screenshot({ path: `${CIKTI}/r3/durum/form-basari-${w}.png` });
    await p.evaluate(() => window.setLanguage('en'));
    ok(`F2 ${w}px başarı mesajı dil değişince çevrilir`, /REQUEST RECEIVED/.test(await metin(p, '.form-success')) && /We usually get back to you by e-mail or phone within one business day\./.test(await metin(p, '.form-success')));
    await ctx.close();
  }
  {
    const { ctx, p, durum } = await baglam({ w, h: 800 });
    await ac(p, '?kaynak=rehber-sktt#leadForm', 1200);
    const f = await p.evaluate(() => { const t = document.querySelector('.form-title').getBoundingClientRect(); const fr = document.getElementById('leadForm').getBoundingClientRect(); const n = document.getElementById('nav').getBoundingClientRect(); return { baslikUst: Math.round(t.top), baslikAlt: Math.round(t.bottom), formUst: Math.round(fr.top), nav: Math.round(n.bottom), vh: innerHeight }; });
    ok(`G1 ${w}px /?kaynak=rehber-sktt#leadForm: form başlığı sabit bandın altında görünür`, f.baslikUst >= f.nav && f.baslikAlt < f.vh && f.formUst >= f.nav && f.formUst <= f.nav + 24, JSON.stringify(f));
    await p.screenshot({ path: `${CIKTI}/r3/durum/hash-leadForm-${w}.png` });
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
    await p.screenshot({ path: `${CIKTI}/r3/durum/form-hata-${w}.png` });
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
  await p.locator('#leadForm').screenshot({ path: `${CIKTI}/r3/durum/form-yesil-1280.png` });
  await doldur(p);
  await p.click('#leadSubmit'); await p.waitForSelector('.form-success');
  ok('F5 yeşil seçim gövdede yesil:true', durum.gonderiler[0].govde.yesil === true);
  await ctx.close();
  const k = await baglam({ w: 375, h: 812, dsf: 2 });
  await ac(k.p);
  await k.p.locator('#lead-yesil').scrollIntoViewIfNeeded();
  await k.p.check('#lead-yesil'); await k.p.waitForTimeout(5200);
  await k.p.locator('#leadForm').screenshot({ path: `${CIKTI}/r3/durum/form-yesil-375.png` });
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
for (const w of [1440, 1280, 390, 375]) {
  for (const kare of ['#teklif', '#iletisim']) {
    const { ctx, p } = await baglam({ w, h: 800 });
    await ac(p, kare, 1200);
    const r = await p.evaluate((k) => { const e = document.getElementById(k === '#iletisim' ? 'iletisim' : 'leadForm').getBoundingClientRect(); return [Math.round(e.top), Math.round(document.getElementById('nav').getBoundingClientRect().bottom)]; }, kare);
    ok(`G2 ${w}px /${kare}: hedef bandın 16 px altında`, r[0] >= r[1] && r[0] <= r[1] + 24, r.join('/'));
    await ctx.close();
  }
  for (const kare of ['#hakkimizda', '#yaklasim', '#hizmetler', '#canli-piyasa']) {
    const { ctx, p } = await baglam({ w, h: 800 });
    await ac(p, kare, 900);
    const r = await p.evaluate((k) => { const e = document.querySelector(k).getBoundingClientRect(); const h = document.querySelector(k + ' h2').getBoundingClientRect(); return [Math.round(e.top), Math.round(h.top), Math.round(document.getElementById('nav').getBoundingClientRect().bottom), innerHeight]; }, kare);
    ok(`G3 ${w}px /${kare}: bölüm başlığı bandın altında, ilk ekranda`, r[0] >= -2 && r[0] <= r[2] && r[1] >= r[2] && r[1] <= r[2] + 110 && r[1] < r[3], r.join('/'));
    await ctx.close();
  }
}

// ───────────────────────── H. hareket azaltma, fotoğraf yedeği, logo yedeği ─────────────────────────
{
  const { ctx, p } = await baglam({ w: 1280, h: 800, azalt: true });
  await ac(p);
  const r = await p.evaluate(() => ({ kay: getComputedStyle(document.documentElement).scrollBehavior, anim: document.getAnimations().length, gizli: [...document.querySelectorAll('main *')].filter(e => +getComputedStyle(e).opacity === 0 && !e.closest('.form-flora, .form-flora-kutu, .hp-field') && e.id !== 'lead-fatura' && e.getBoundingClientRect().height > 0).length }));
  ok('H1 hareket azaltma: yumuşak kaydırma kapalı, çalışan animasyon yok, gizli içerik yok', r.kay === 'auto' && r.anim === 0 && r.gizli === 0, JSON.stringify(r));
  await ctx.close();
  const n = await baglam({ w: 1280, h: 800 });
  await ac(n.p);
  const g = await n.p.evaluate(() => ({ anim: document.getAnimations().length, gizli: [...document.querySelectorAll('main *')].filter(e => (+getComputedStyle(e).opacity < 1 || getComputedStyle(e).transform !== 'none') && !e.closest('.form-flora, .form-flora-kutu, .hp-field, form, .mcp-rail')).map(e => e.className).slice(0, 5), io: /IntersectionObserver/.test([...document.scripts].map(s => s.textContent).join('')) }));
  ok('H2 kaydırınca belirme kaldırıldı: açılışta gizli ya da kaydırılmış öğe yok, IntersectionObserver yok', g.gizli.length === 0 && !g.io, JSON.stringify(g));
  await n.ctx.close();
  const f = await baglam({ w: 1440, h: 900, azalt: true });
  await f.ctx.route('**/img/kapak-*', (route) => route.abort());
  await ac(f.p);
  const y = await f.p.evaluate(() => [document.querySelector('.hero-media').classList.contains('yedek'), getComputedStyle(document.querySelector('.hero-placeholder')).display, getComputedStyle(document.querySelector('.hero-photo')).display]);
  ok('H3 fotoğraf yüklenemezse çizim silüet devreye girer', y[0] && y[1] === 'block' && y[2] === 'none', y.join());
  await f.p.locator('.hero').screenshot({ path: `${CIKTI}/r3/durum/kapak-yedek-1440.png` });
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
      const kirpik = [...document.querySelectorAll('header a, header span, main h1, main h2, main h3, main p, main a, main span, main td, main th, main dt, main dd, main li, main label, main button, main div, footer a, footer div, footer span')].filter(e => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.display !== 'inline' && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && !/(auto|scroll)/.test(cs.overflowX) && !e.closest('.form-flora') && !e.closest('.hp-field') && !e.classList.contains('form') && !e.classList.contains('form-flora-kutu') && !e.classList.contains('mcp-rail') && !e.classList.contains('hero-media') && !e.classList.contains('hero-copy') && !e.classList.contains('hero-text'); }).map(e => e.tagName + '.' + String(e.className).slice(0, 24) + ':' + e.scrollWidth + '>' + e.clientWidth);
      return { sw: document.documentElement.scrollWidth, vw, tasan: tasan.slice(0, 6), kirpik: kirpik.slice(0, 6) };
    });
    ok(`I1 ${w}px ${dil.toUpperCase()} yatay sayfa kaydırması yok, kırpılan metin yok`, r.sw <= r.vw && r.tasan.length === 0 && r.kirpik.length === 0, JSON.stringify(r));
    if (w < 760) { await p.evaluate(() => document.querySelectorAll('details.acilir').forEach(d => { d.open = true; })); const a = await p.evaluate(() => { const vw = document.documentElement.clientWidth; return { sw: document.documentElement.scrollWidth, vw, tasan: [...document.querySelectorAll('details.acilir *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > vw + 0.5 || q.left < -0.5); }).map(e => e.tagName + '.' + e.className).slice(0, 4) }; }); ok(`I1 ${w}px ${dil.toUpperCase()} açılır alanlar açıkken de yatay taşma yok`, a.sw <= a.vw && a.tasan.length === 0, JSON.stringify(a)); }
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
  const olc = () => p.evaluate(() => [...document.querySelectorAll('a, button, select, input:not([type=hidden]), textarea, summary, label.dosya-dugme, label.form-choice, label.form-green, label.form-consent')].filter(e => { if (e.closest('.hp-field') || e.closest('[hidden]') || e.classList.contains('skip')) return false; if (e.id === 'lead-fatura' && e.closest('.dosya.hazir')) return false; /* görsel olarak gizli; dokunma hedefi etiket düğmesidir */ const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); if (!r.width) return false; if ((e.type === 'checkbox' || e.type === 'radio') && e.closest('label')) return false; return r.width < 44 || r.height < 44; }).map(e => e.tagName + '.' + String(e.className).slice(0, 20) + ' "' + e.textContent.trim().slice(0, 18) + '" ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
  const kucuk = await olc();
  await p.evaluate(() => document.querySelectorAll('details.acilir').forEach(d => { d.open = true; }));
  kucuk.push(...(await olc()).filter(x => !kucuk.includes(x)).map(x => 'AÇIKKEN ' + x));
  await p.click('#mobileMenuBtn');
  const menude = await p.evaluate(() => [...document.querySelectorAll('#mobileMenu a, #mobileMenu button')].filter(e => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(e => e.textContent + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
  ok(`I3 ${w}px dokunma hedefleri en az 44×44 px (bağlantı, düğme, alan, seçenek etiketi, açılır alan başlığı, dosya düğmesi; alanlar kapalı ve açıkken; menü paneli dahil)`, kucuk.length === 0 && menude.length === 0, kucuk.concat(menude).join(' | '));
  await ctx.close();
}
for (const w of [1280, 1440, 1040]) {
  const { ctx, p } = await baglam({ w, h: 800, azalt: true });
  await ac(p);
  const r = await p.evaluate(() => { const a = document.querySelector('.contact-head').getBoundingClientRect(), k = document.querySelector('.contact-kunye').getBoundingClientRect(), f = document.getElementById('leadForm').getBoundingClientRect(), t = document.getElementById('teklif').getBoundingClientRect(); return { yan: f.left >= a.right && Math.abs(f.top - a.top) < 40, kunye: k.top >= a.bottom && k.right <= f.left && k.bottom <= f.bottom, capa: Math.round(t.top - f.top) }; });
  ok(`I4 ${w}px form başlık sütununun yanında, aynı hizada; iletişim ve sicil bilgileri sol sütunda başlığın altında; #teklif çapası formun üstünde`, r.yan && r.kunye && Math.abs(r.capa) <= 1, JSON.stringify(r));
  await ctx.close();
}
{ // tablo telefonda: sayfa içinde, yatay kaydırma gerektirmeden okunur
  const { ctx, p } = await baglam({ w: 320, h: 640, azalt: true });
  await ac(p);
  await p.evaluate(() => { document.querySelector('.lm-saatlik details').open = true; });
  const t = await p.evaluate(() => { const s = document.getElementById('saatTablo').getBoundingClientRect(); const f = document.querySelector('.fin-table').getBoundingClientRect(); const sat = document.querySelector('#saatTablo tbody tr').getBoundingClientRect(); return { sol: Math.round(s.left), sag: Math.round(s.right), fsag: Math.round(f.right), satir: Math.round(sat.height), yazi: parseFloat(getComputedStyle(document.querySelector('#saatTablo td')).fontSize), model: [...document.querySelectorAll('.fin-table .ft-m')].filter(e => getComputedStyle(e).display !== 'none').length, sutun: new Set([...document.querySelectorAll('#saatTablo table')].map(x => Math.round(x.getBoundingClientRect().left))).size }; });
  ok('I5 320px saatlik tablo (açıkken, 2 × 2) ve model tablosu ekrana sığıyor (yatay kaydırma yok); model tablosunda her değerin başında model adı', t.sol >= 0 && t.sag <= 320 && t.fsag <= 320 && t.yazi >= 14 && t.model === 9 && t.sutun === 2, JSON.stringify(t));
  await ctx.close();
}

// ───────────────────────── J. açılır alanlar (<details>): telefon, masaüstü, betiksiz, yeniden boyutlama ─────────────────────────
const KAYNAK = await (await fetch(SAYFA)).text();
const ALANLAR = ['Saatlik PTF · ₺/MWh', 'Şirket Bilgileri', 'EPDK Tedarik Lisansı', 'İletişim ve Sicil Bilgileri'];
const alanOku = (p) => p.evaluate(() => [...document.querySelectorAll('details.acilir')].map(d => { const s = d.querySelector('summary'); const r = s.getBoundingClientRect(); const ic = [...d.children].filter(c => c !== s); return { ad: [...s.querySelectorAll('h3 span')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent).join('') || s.textContent.trim(), acik: d.open, y: Math.round(r.height), g: Math.round(r.width), icY: Math.round(d.getBoundingClientRect().height - r.height), icGor: ic.some(c => c.checkVisibility()), tab: s.getAttribute('tabindex'), isaret: getComputedStyle(s, '::after').content, h3: !!s.querySelector('h3'), imlec: getComputedStyle(s).cursor }; }));
{
  const govdeKaynak = KAYNAK.slice(KAYNAK.indexOf('<body'), KAYNAK.indexOf('<script>\n// Navigation'));
  const kaynakAcik = (govdeKaynak.match(/<details class="acilir" open>/g) || []).length, kaynakTum = (govdeKaynak.match(/<details\b/g) || []).length;
  const icerik = ['19 Eylül 2011 · Kurul Kararı 3424-8', '2031 · süre uzatımı EPDK onayına tabi', 'Enerji Piyasası Düzenleme Kurumu', '786882-0 · İstanbul', 'OSB + endüstriyel tesisler', 'GÖP · GİP · İkili Anlaşmalar', 'Acıbadem Mah. Elysium Elit', 'mailto:info@voltage.com.tr', '<th scope="row">00:00</th>', '<th scope="row">23:00</th>'].filter(t => !govdeKaynak.includes(t));
  ok('J1 kaynak HTML: dört <details>, dördü de “open” ile gelir; açılır alanların bütün içeriği HTML’de (betikle eklenen içerik yok)', kaynakAcik === 4 && kaynakTum === 4 && icerik.length === 0 && (govdeKaynak.match(/<th scope="row">\d\d:00<\/th><td>—<\/td>/g) || []).length === 24, JSON.stringify([kaynakAcik, kaynakTum, icerik]));
  for (const [w, h] of [[390, 844], [320, 568]]) {
    const { ctx, p, durum } = await baglam({ w, h });
    await ac(p);
    let a = await alanOku(p);
    ok(`J2 ${w}px telefon: dört alan kapalı başlar (saatlik tablo, şirket bilgileri, EPDK lisansı, iletişim ve sicil bilgileri); başlık satırı ≥ 44 px, tam genişlikte, işaretli, H3`, a.length === 4 && JSON.stringify(a.map(x => x.ad)) === JSON.stringify(ALANLAR) && a.every(x => !x.acik && x.y >= 44 && x.g >= w - 2 * 40 && x.icY <= 2 && !x.icGor && x.tab === null && x.isaret !== 'none' && x.h3 && x.imlec === 'pointer'), JSON.stringify(a));
    const sira = await p.evaluate(() => { const y = (s) => Math.round(document.querySelector(s).getBoundingClientRect().top + scrollY); return { bas: y('.contact-head'), form: y('#leadForm'), kunye: y('.contact-kunye'), metin: y('.about-metin'), imza: y('.about-signature'), akunye: y('.about-kunye'), rozet: y('.marks'), ozet: y('.lm-ledger'), saat: y('.lm-saatlik') }; });
    ok(`J3 ${w}px telefon sırası: İletişim başlığı → teklif formu → iletişim ve sicil bilgileri; Hakkında metni → imza → şirket bilgileri ve lisans → rozetler; piyasa özeti → saatlik tablo`, sira.bas < sira.form && sira.form < sira.kunye && sira.metin < sira.imza && sira.imza < sira.akunye && sira.akunye < sira.rozet && sira.ozet < sira.saat, JSON.stringify(sira));
    const ara = await p.evaluate(() => { const f = document.getElementById('leadForm').getBoundingClientRect().top, b = document.getElementById('iletisim').getBoundingClientRect().top; return Math.round(f - b); });
    ok(`J3 ${w}px İletişim bölümünün başından forma kadar yalnız başlık ve iki kısa cümle (≤ 330 px)`, ara <= 330, String(ara));
    for (let i = 0; i < 4; i++) {
      const sec = `details.acilir >> nth=${i}`;
      await p.locator(sec).locator('summary').scrollIntoViewIfNeeded();
      await p.locator(sec).locator('summary').click();
      const acik = await p.locator(sec).evaluate(d => ({ acik: d.open, ic: Math.round(d.getBoundingClientRect().height - d.querySelector('summary').getBoundingClientRect().height), tasma: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
      await p.locator(sec).locator('summary').click();
      const kapali = await p.locator(sec).evaluate(d => d.open);
      ok(`J4 ${w}px “${ALANLAR[i]}”: dokununca açılır (içerik görünür, taşma yok), yeniden dokununca kapanır`, acik.acik && acik.ic > 60 && !acik.tasma && !kapali, JSON.stringify([acik, kapali]));
    }
    if (w === 390) {
      // klavye: önceki bağlantıdan Tab ile başlığa gelinir; odak çerçevesi görünür; Enter açar
      await p.evaluate(() => document.querySelector('.lm-link a').focus());
      await p.keyboard.press('Tab');
      const o = await p.evaluate(() => { const e = document.activeElement; const c = getComputedStyle(e); return { etiket: e.tagName, cerceve: c.outlineStyle + ' ' + c.outlineWidth, y: Math.round(e.getBoundingClientRect().height) }; });
      await p.keyboard.press('Enter');
      const ac1 = await p.evaluate(() => document.querySelector('.lm-saatlik details').open);
      await p.keyboard.press('Enter');
      ok('J5 390px klavye: Tab ile açılır alan başlığına gelinir, odak çerçevesi görünür (2 px), Enter açar ve kapatır', o.etiket === 'SUMMARY' && /solid 2px/.test(o.cerceve) && ac1 && !(await p.evaluate(() => document.querySelector('.lm-saatlik details').open)), JSON.stringify(o));
      await p.evaluate(() => document.querySelectorAll('details.acilir').forEach(d => { d.open = true; }));
      const tablo = await p.evaluate(() => { const t = [...document.querySelectorAll('#saatTablo table')].map(x => x.getBoundingClientRect()); return { sutun: new Set(t.map(r => Math.round(r.left))).size, satir: new Set(t.map(r => Math.round(r.top))).size, hucre: [...document.querySelectorAll('#saatTablo tbody td')].filter(x => /^\d{1,3}(\.\d{3})*,\d{2}$/.test(x.textContent)).length, yuk: Math.round(document.getElementById('saatTablo').getBoundingClientRect().height) }; });
      ok('J6 390px saatlik tablo açıkken 2 × 2 dizilir (dört kısa tablo), 24 değer dolu; 24 alt alta satırdan kısa', tablo.sutun === 2 && tablo.satir === 2 && tablo.hucre === 24 && tablo.yuk < 420, JSON.stringify(tablo));
      await p.screenshot({ path: `${CIKTI}/r3/durum/acilir-390-acik.png`, fullPage: true });
    }
    ok(`J2 ${w}px telefon: konsol hatası yok`, durum.konsol.length === 0, durum.konsol.join(' | '));
    await ctx.close();
  }
  for (const w of [1440, 1280, 768]) {
    const { ctx, p } = await baglam({ w, h: 900 });
    await ac(p);
    let a = await alanOku(p);
    ok(`J7 ${w}px geniş ekran: dört alan açık, içerik görünür; başlık düz ara başlıktır (işaret yok, sekme sırasında değil)`, a.length === 4 && a.every(x => x.acik && x.icY > 60 && x.icGor && x.tab === '-1' && x.isaret === 'none' && x.imlec !== 'pointer'), JSON.stringify(a));
    await p.evaluate(() => document.querySelectorAll('details.acilir summary').forEach(s => s.click()));
    a = await alanOku(p);
    ok(`J7 ${w}px geniş ekran: başlığa tıklamak alanı kapatmaz`, a.every(x => x.acik), JSON.stringify(a.map(x => x.acik)));
    await ctx.close();
  }
  { // yeniden boyutlama: telefonda kapalı kalan alan geniş ekranda açılır
    const { ctx, p } = await baglam({ w: 390, h: 844 });
    await ac(p);
    const once = (await alanOku(p)).map(x => x.acik).join();
    await p.setViewportSize({ width: 1280, height: 800 }); await p.waitForTimeout(250);
    const genis = await alanOku(p);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
    const dar = await alanOku(p);
    ok('J8 ekran genişleyince (390 → 1280) kapalı alanlar açılır ve başlık sekme sırasından çıkar; daralınca başlık yeniden dokunulabilir olur', once === 'false,false,false,false' && genis.every(x => x.acik && x.tab === '-1') && dar.every(x => x.tab === null && x.isaret !== 'none'), JSON.stringify([once, genis.map(x => x.acik + ':' + x.tab), dar.map(x => x.tab)]));
    await ctx.close();
  }
  for (const [w, h] of [[390, 844], [1280, 800]]) { // betik kapalı
    const j = await baglam({ w, h, js: false });
    await j.p.goto(SAYFA, { waitUntil: 'load' });
    const r = await j.p.evaluate(() => ({ alan: [...document.querySelectorAll('details.acilir')].map(d => d.open && [...d.children].slice(1).reduce((t, c) => t + c.getBoundingClientRect().height, 0) > 0), gorsel: [...document.querySelectorAll('.sektor-foto img')].map(i => !!i.getAttribute('src') && i.getBoundingClientRect().height > 40).filter(Boolean).length, girdi: (() => { const g = document.getElementById('lead-fatura'); const q = g.getBoundingClientRect(); const c = getComputedStyle(g); return { g: Math.round(q.width), y: Math.round(q.height), opak: c.opacity, gor: c.display !== 'none' && c.visibility !== 'hidden' }; })(), ozel: [getComputedStyle(document.querySelector('.dosya-dugme')).display, getComputedStyle(document.querySelector('.dosya-durum')).display], form: [...document.querySelectorAll('#leadForm input:not([type=hidden]), #leadForm select, #leadForm textarea, #leadSubmit')].filter(e => !e.closest('.hp-field') && e.id !== 'lead-fatura').every(e => e.getBoundingClientRect().height >= 18 && !e.disabled), metin: document.body.innerText }));
    // piyasa alanı betiksiz gizlenir (yerine cümle ve /canli-ptf bağlantısı): saatlik tablo alanı görünmez, öbür üç alan açık ve görünür
    ok(`J9 ${w}px BETİK KAPALI: açılır alanlar açık (lisans, şirket, iletişim bilgileri görünür; piyasa alanı yerine cümle)`, r.alan.length === 4 && r.alan.slice(1).every(Boolean) && /19 Eylül 2011 · Kurul Kararı 3424-8/.test(r.metin) && /OSB \+ endüstriyel tesisler/.test(r.metin) && /Acıbadem Mah\. Elysium Elit/.test(r.metin) && /Canlı PTF sayfasında/.test(r.metin), JSON.stringify(r.alan));
    ok(`J9 ${w}px BETİK KAPALI: yedi sektör görseli sayfada (src dolu, alanı ayrılmış); form alanları ve gönder düğmesi kullanılabilir`, r.gorsel === 7 && r.form, JSON.stringify([r.gorsel, r.form]));
    ok(`J9 ${w}px BETİK KAPALI: yerli dosya girdisi görünür ve kullanılabilir; yerelleştirilmiş düğme ve durum satırı gizli`, r.girdi.gor && r.girdi.g > 150 && r.girdi.y >= 40 && r.girdi.opak === '1' && r.ozel.join() === 'none,none', JSON.stringify([r.girdi, r.ozel]));
    if (w === 390) await j.p.screenshot({ path: `${CIKTI}/r3/durum/betik-kapali-390.png`, fullPage: true });
    await j.ctx.close();
  }
}

// ───────────────────────── K. dosya seçici (TR/EN düğme ve durum metni) ─────────────────────────
{
  const { readFileSync } = await import('fs');
  const CANLI = readFileSync('/home/user/website/index.html', 'utf8');
  const canliGirdi = (CANLI.match(/<input type="file"[^>]*id="lead-fatura"[^>]*>/) || [''])[0];
  const yeniGirdi = (KAYNAK.match(/<input type="file"[^>]*id="lead-fatura"[^>]*>/) || [''])[0];
  ok('K1 <input type="file"> etiketi canlı sayfadakiyle bayt bayt aynı (id, name, accept, multiple)', canliGirdi.length > 50 && canliGirdi === yeniGirdi && /id="lead-fatura" name="fatura" accept="[^"]+" multiple>$/.test(yeniGirdi), yeniGirdi);
  const fa = CANLI.slice(CANLI.indexOf('<form class="form reveal"'), CANLI.indexOf('</form>') + 7), fb = KAYNAK.slice(KAYNAK.indexOf('<form class="form reveal"'), KAYNAK.indexOf('</form>') + 7);
  const geri = fb.replace(/^ *<div class="dosya" id="leadFaturaKutu">\n( *)  (<input type="file"[^\n]*>)\n *<label class="dosya-dugme"[^\n]*<\/label>\n *<span class="dosya-durum"[^\n]*<\/span>\n *<\/div>\n/m, '$1$2\n');
  ok('K1 form işaretlemesi: dosya seçici dönüşümü geri alınınca <form>…</form> canlıyla bayt bayt aynı (başka değişiklik yok)', fa !== fb && fa === geri, `canlı ${fa.length}, hazırlık ${fb.length}, geri alınmış ${geri.length}`);
  const pdf = (ad, boy = 2000) => ({ name: ad, mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(boy, 32)]) });
  for (const w of [1280, 390]) {
    const { ctx, p, durum } = await baglam({ w, h: 844 });
    await ac(p);
    await p.locator('#leadFaturaKutu').scrollIntoViewIfNeeded();
    const oku = () => p.evaluate(() => { const g = document.getElementById('lead-fatura'), l = document.querySelector('.dosya-dugme'), d = document.getElementById('leadFaturaDurum'), k = document.getElementById('leadFaturaKutu'); const q = g.getBoundingClientRect(), lq = l.getBoundingClientRect(), c = getComputedStyle(g); return { dugme: l.textContent, durum: d.textContent, icin: l.htmlFor, canli: d.getAttribute('aria-live'), girdi: { g: q.width, y: q.height, opak: c.opacity, gor: c.display !== 'none' && c.visibility !== 'hidden', tab: g.tabIndex, tur: g.type, ad: g.name, cok: g.multiple, kabul: g.accept, n: g.files.length }, dugmeBoy: [Math.round(lq.width), Math.round(lq.height)], hazir: k.className, kutuY: Math.round(k.getBoundingClientRect().height), tasma: d.getBoundingClientRect().right <= k.getBoundingClientRect().right + 0.5 && document.documentElement.scrollWidth <= document.documentElement.clientWidth, yerliYazi: getComputedStyle(g).opacity === '0' }; });
    let d = await oku();
    ok(`K2 ${w}px TR: görünen düğme “Dosya Seç”, durum “Dosya seçilmedi”; tarayıcının kendi “Choose Files” yazısı görünmez`, d.dugme === 'Dosya Seç' && d.durum === 'Dosya seçilmedi' && d.yerliYazi && /hazir/.test(d.hazir) && d.canli === 'polite', JSON.stringify(d));
    ok(`K2 ${w}px girdi DOM’da, görsel olarak gizli ama odaklanabilir (aynı id/name/accept/multiple); düğme bir <label for="lead-fatura">, ≥ 44 px`, d.girdi.gor && d.girdi.g <= 1 && d.girdi.y <= 1 && d.girdi.opak === '0' && d.girdi.tab === 0 && d.girdi.tur === 'file' && d.girdi.ad === 'fatura' && d.girdi.cok && /application\/pdf/.test(d.girdi.kabul) && /\.heif$/.test(d.girdi.kabul) && d.icin === 'lead-fatura' && d.dugmeBoy[1] >= 44 && d.dugmeBoy[0] >= 44, JSON.stringify([d.girdi, d.icin, d.dugmeBoy]));
    await p.evaluate(() => document.getElementById('lead-sektor').focus());
    await p.keyboard.press('Tab');
    const odak = await p.evaluate(() => { const l = getComputedStyle(document.querySelector('.dosya-dugme')); return { kim: document.activeElement.id, cerceve: l.outlineStyle + ' ' + l.outlineWidth }; });
    ok(`K3 ${w}px klavye: Sektör alanından Tab ile dosya girdisine gelinir; odak çerçevesi etiket düğmesinde görünür`, odak.kim === 'lead-fatura' && /solid 2px/.test(odak.cerceve), JSON.stringify(odak));
    const [secici] = await Promise.all([p.waitForEvent('filechooser'), p.click('.dosya-dugme')]);
    ok(`K4 ${w}px düğmeye tıklamak dosya seçme penceresini açar (çoklu seçim açık)`, secici.isMultiple() && (await secici.element().getAttribute('id')) === 'lead-fatura');
    await secici.setFiles([pdf('ekim-faturasi.pdf')]);
    d = await oku();
    ok(`K5 ${w}px bir dosya seçilince durum dosya adını gösterir`, d.durum === 'ekim-faturasi.pdf' && d.girdi.n === 1 && /dolu/.test(d.hazir), d.durum);
    await p.evaluate(() => window.setLanguage('en'));
    d = await oku();
    ok(`K5 ${w}px EN: düğme “Choose Files”; seçili tek dosyanın adı durur`, d.dugme === 'Choose Files' && d.durum === 'ekim-faturasi.pdf', JSON.stringify([d.dugme, d.durum]));
    await p.setInputFiles('#lead-fatura', [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')]);
    d = await oku();
    ok(`K6 ${w}px EN: üç dosya seçilince “3 files selected”`, d.durum === '3 files selected' && d.girdi.n === 3, d.durum);
    await p.evaluate(() => window.setLanguage('tr'));
    d = await oku();
    ok(`K6 ${w}px TR: üç dosya seçiliyken “3 dosya seçildi”, düğme “Dosya Seç”`, d.durum === '3 dosya seçildi' && d.dugme === 'Dosya Seç', JSON.stringify([d.dugme, d.durum]));
    await p.setInputFiles('#lead-fatura', [pdf('cok-uzun-bir-dosya-adi-2026-ekim-kasim-aralik-donemi-elektrik-faturasi-taranmis-kopya-son-hali.pdf')]);
    d = await oku();
    ok(`K7 ${w}px uzun dosya adı kutuyu taşırmaz (tek satır, sonu kısaltılır); kutu yüksekliği değişmez`, d.tasma && d.kutuY === 60, JSON.stringify([d.tasma, d.kutuY]));
    await p.setInputFiles('#lead-fatura', []);
    d = await oku();
    ok(`K7 ${w}px seçim boşaltılınca “Dosya seçilmedi”; EN’de “No file chosen”`, d.durum === 'Dosya seçilmedi' && !/dolu/.test(d.hazir) && await p.evaluate(() => { window.setLanguage('en'); const t = document.getElementById('leadFaturaDurum').textContent; window.setLanguage('tr'); return t === 'No file chosen'; }), d.durum);
    // seçiciyle seçilen dosya mevcut yükleme mantığıyla gider (multipart)
    await doldur(p);
    const [s2] = await Promise.all([p.waitForEvent('filechooser'), p.click('.dosya-dugme')]);
    await s2.setFiles([pdf('fatura-1.pdf'), pdf('fatura-2.pdf')]);
    await p.click('#leadSubmit'); await p.waitForSelector('.form-success');
    const g = durum.gonderiler[0]; const ham = g.ham ? g.ham.toString('latin1') : '';
    ok(`K8 ${w}px seçiciyle seçilen iki dosya mevcut yükleme mantığıyla gider (multipart, iki “fatura” parçası); konsol hatası yok`, durum.gonderiler.length === 1 && /multipart\/form-data/.test(g.tur) && (ham.match(/name="fatura"; filename="fatura-[12]\.pdf"/g) || []).length === 2 && durum.konsol.length === 0, durum.konsol.join(' | '));
    await ctx.close();
  }
  { // dört dosya: mevcut sınır iletisi aynen çalışır; durum satırı sayıyı gösterir
    const { ctx, p, durum } = await baglam({ w: 1280, h: 900 });
    await ac(p);
    await p.locator('#leadForm').scrollIntoViewIfNeeded();
    await doldur(p);
    await p.setInputFiles('#lead-fatura', [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf'), pdf('d.pdf')]);
    const dr = await metin(p, '#leadFaturaDurum');
    await p.click('#leadSubmit'); await p.waitForSelector('#leadStatus.error');
    ok('K9 dört dosya: durum “4 dosya seçildi”; gönderimde mevcut sınır iletisi (“En fazla 3 fatura dosyası yükleyebilirsiniz.”), istek yok', dr === '4 dosya seçildi' && (await metin(p, '#leadStatus')) === 'En fazla 3 fatura dosyası yükleyebilirsiniz.' && durum.gonderiler.length === 0, dr);
    await p.check('#lead-yesil'); await p.waitForTimeout(400);
    const kenar = await p.evaluate(() => getComputedStyle(document.getElementById('leadFaturaKutu')).borderTopStyle);
    ok('K9 yeşil enerji seçiliyken dosya kutusu yerinde (kesik çizgili kenar durur)', kenar === 'dashed', kenar);
    await ctx.close();
  }
}

// ───────────────────────── L. sektör görselleri, hizmetler, zemin ritmi, sayfa boyu ─────────────────────────
{
  const SEKTOR = [['demir-celik', '/rehber/demir-celik-elektrik', 'Demir-Çelik & Döküm'], ['kimya', '/rehber/kimya-elektrik', 'Kimya & Petrokimya'], ['osb', '/rehber/osb-elektrik-tedariki', 'OSB & Endüstri Bölgeleri'], ['lojistik', '/rehber/soguk-zincir-elektrik', 'Lojistik & Soğuk Zincir'], ['cam-seramik', '/rehber/cam-seramik-elektrik', 'Cam & Seramik'], ['veri-merkezi', '/rehber/veri-merkezi-elektrik', 'Veri Merkezleri & Telekom'], ['tekstil', '/rehber/tekstil-elektrik', 'Tekstil & Kompozit']];
  const eksikDosya = eksikGorseller();
  ok('L0 sektör görseli dosyaları: 21/21 img/ klasöründe (7 sektör × 480/800/1200)', eksikDosya.length === 0, 'eksik: ' + eksikDosya.join(', '));
  const { ctx, p, durum } = await baglam({ w: 1440, h: 900 });
  await ac(p);
  const y = await p.evaluate(() => ({
    img: [...document.querySelectorAll('.sectors img')].map(i => ({ src: i.getAttribute('src'), srcset: i.getAttribute('srcset'), sizes: i.getAttribute('sizes'), w: i.getAttribute('width'), h: i.getAttribute('height'), lazy: i.loading, dec: i.decoding, alt: i.alt, ust: Math.round(i.getBoundingClientRect().top + scrollY), tr: i.getAttribute('data-alt-tr'), en: i.getAttribute('data-alt-en') })),
    bag: [...document.querySelectorAll('.sectors .sektor h3 a')].map(a => [a.getAttribute('href'), a.textContent]), tum: [...document.querySelectorAll('.sectors a[href="/rehber"]')].map(a => a.textContent.trim()),
    yazi: [...document.querySelectorAll('.sectors .sektor')].map(s => !!s.querySelector('h3') && s.querySelector('p').textContent.length > 10).filter(Boolean).length,
    not: (() => { const n = document.querySelector('.sektor-not'); return [n.textContent, n.getAttribute('data-en'), Math.round(n.getBoundingClientRect().height), parseFloat(getComputedStyle(n).fontSize)]; })(),
    kart: [...document.querySelectorAll('.sectors .sektor')].map(s => { const c = getComputedStyle(s); return c.borderRadius + '|' + c.boxShadow + '|' + c.backgroundColor + '|' + c.borderTopWidth; }), ortu: [...document.querySelectorAll('.sektor-foto *')].filter(e => e.tagName !== 'IMG').length,
    svc: { h3: [...document.querySelectorAll('#hizmetler .svc-list h3')].map(h => h.textContent.trim()), bag: [...document.querySelectorAll('#hizmetler a')].map(a => a.getAttribute('href') + '|' + a.textContent.trim()), p: [...document.querySelectorAll('#hizmetler .svc-list p')].filter(x => x.textContent.length > 60).length, sus: document.querySelectorAll('#hizmetler img, #hizmetler svg:not(.arrow), #hizmetler [class*="num"]').length, sol: (() => { const w = document.querySelector('#hizmetler .wrap').getBoundingClientRect(), l = [...document.querySelectorAll('#hizmetler .svc-list li')].map(x => x.getBoundingClientRect()); return [Math.round(Math.min(...l.map(r => r.left)) - w.left - parseFloat(getComputedStyle(document.querySelector('#hizmetler .wrap')).paddingLeft)), Math.round(Math.max(...l.map(r => r.right)) - Math.min(...l.map(r => r.left)))]; })() },
  }));
  ok('L1 hizmetler: beş hizmet H3, beş açıklama; ilk hizmet /sanayi-elektrik-tedariki bağlantısını korur; görsel, şema, numara ya da simge yok', JSON.stringify(y.svc.h3) === JSON.stringify(['Endüstriyel Tedarik', 'GÖP & GİP Operasyonu', 'Portföy Yönetimi', 'Yenilenebilir Enerji Tedariki', 'Enerji Danışmanlığı']) && y.svc.bag.join() === '/sanayi-elektrik-tedariki|Endüstriyel Tedarik' && y.svc.p === 5 && y.svc.sus === 0, JSON.stringify(y.svc));
  ok('L1 hizmetler 1440: ızgara içerik genişliğinin tamamını kullanır (solda boşluk yok)', y.svc.sol[0] <= 0 && y.svc.sol[1] >= 1240, JSON.stringify(y.svc.sol));
  ok('L2 yedi sektör: adı H3 ve rehber bağlantısı, açıklaması duruyor; “Tüm sektör rehberleri” → /rehber', JSON.stringify(y.bag) === JSON.stringify(SEKTOR.map(s => [s[1], s[2]])) && y.yazi === 7 && y.tum.join() === 'Tüm sektör rehberleri', JSON.stringify(y.bag));
  ok('L3 yedi görsel: srcset 480w/800w/1200w (kendi dosyaları), sizes dolu, width=1200 height=800, loading=lazy, decoding=async', y.img.length === 7 && y.img.every((i, n) => i.srcset === [480, 800, 1200].map(k => `img/sektor-${SEKTOR[n][0]}-${k}.webp ${k}w`).join(', ') && i.src === `img/sektor-${SEKTOR[n][0]}-800.webp` && /^\(min-width: 1384px\) \d+px, \(min-width: 1040px\) \d+vw, /.test(i.sizes) && i.w === '1200' && i.h === '800' && i.lazy === 'lazy' && i.dec === 'async'), JSON.stringify(y.img.map(i => i.sizes)));
  ok('L3 görsellerin alt metni TR ve EN dolu, anahtar kelime yığını değil (≤ 12 kelime, “elektrik tedariki/fiyat” gibi arama kalıbı yok)', y.img.every(i => i.alt === i.tr && i.tr.length > 15 && i.en.length > 15 && i.tr.split(' ').length <= 12 && !/tedarik|fiyat|ucuz|voltage/i.test(i.tr + i.en)), JSON.stringify(y.img.map(i => i.alt)));
  ok('L3 görsellerin hepsi ilk ekranın altında (1440×900): kapak görseli LCP adayı kalır', y.img.every(i => i.ust > 900), y.img.map(i => i.ust).join());
  ok('L4 temsilî görsel notu bölümde görünür (TR ve EN)', y.not[0] === 'Görseller temsilîdir; Voltage Enerji tesislerini göstermez.' && y.not[1] === 'Images are illustrative and do not show Voltage Enerji facilities.' && y.not[2] > 0 && y.not[3] >= 13, JSON.stringify(y.not));
  ok('L5 dizgi: kart kutusu yok (yuvarlak köşe, gölge, zemin, çerçeve yok); görsel üstünde yazı ya da örtü yok', y.kart.every(k => /^0px\|none\|rgba\(0, 0, 0, 0\)\|0px$/.test(k)) && y.ortu === 0, JSON.stringify(y.kart.slice(0, 2)));
  const olcu = async (w, h, dsf = 1) => {
    const k = await baglam({ w, h, dsf });
    await ac(k.p, '', 200);
    await k.p.evaluate(async () => { for (let yy = 0; yy < document.documentElement.scrollHeight; yy += 400) { scrollTo(0, yy); await new Promise(r => setTimeout(r, 60)); } });
    await k.p.waitForLoadState('networkidle'); await k.p.waitForTimeout(300);
    const r = await k.p.evaluate(() => [...document.querySelectorAll('.sektor-foto img')].map(i => { const q = i.getBoundingClientRect(); const dosya = (i.currentSrc || '').split('/').pop(); return { ad: i.getAttribute('src').replace(/^img\/sektor-|-800\.webp$/g, ''), g: Math.round(q.width), y: Math.round(q.height), dosya, dw: +((dosya.match(/-(\d+)\.webp$/) || [])[1] || 0), tamam: i.complete && i.naturalWidth > 0, yuva: i.naturalWidth /* w tanımlı srcset'te doğal genişlik = sizes ile bildirilen yuva genişliği */ }; }));
    const boy = await k.p.evaluate(() => document.documentElement.scrollHeight);
    await k.ctx.close();
    return { r, boy, hata: k.durum.konsol };
  };
  const genislikler = [[1440, 900, 1], [1280, 800, 1], [1024, 768, 1], [768, 1024, 1], [390, 844, 1], [390, 844, 3], [320, 568, 2]];
  const cesit = {};
  for (const [w, h, dsf] of genislikler) {
    const o = await olcu(w, h, dsf);
    not(`sektör görselleri ${w}px @${dsf}x: ` + o.r.map(x => `${x.ad} ${x.g}×${x.y}${x.dosya ? ' → ' + x.dosya.replace('sektor-' + x.ad + '-', '') : ''}`).join(' · '));
    cesit[w] = new Set(o.r.map(x => x.g + 'x' + x.y)).size;
    ok(`L6 ${w}px @${dsf}x yedi görsel yüklendi; sizes değeri çizim genişliğini doğru bildirir (± %8); seçilen dosya yeterli ve gereğinden büyük değil`, o.r.every(x => x.tamam && x.dw >= Math.min(1200, x.g * dsf) * 0.93 && (x.dw === 480 || x.g * dsf > (x.dw === 800 ? 480 : 800) * 0.93) && Math.abs(x.yuva - x.g) <= x.g * 0.08 + 6) && o.hata.length === 0, JSON.stringify(o.r.map(x => [x.ad, x.g, x.yuva, x.dw, x.tamam])) + o.hata.join('|'));
  }
  ok('L7 asimetrik dizgi: 1440 px’te en az dört farklı görsel ölçüsü; telefonda büyük + ikili düzen (iki ölçü)', cesit[1440] >= 4 && cesit[390] === 2, JSON.stringify(cesit));
  // zemin ritmi
  const zemin = await p.evaluate(() => [...document.querySelectorAll('main > section, main > .trust, footer')].map(e => { const c = getComputedStyle(e).backgroundColor.match(/\d+/g).map(Number); return { ad: e.id || e.className.split(' ')[0], koyu: c[0] + c[1] + c[2] < 200, renk: c.join(',') }; }));
  let ust = 0, enUzun = 0; zemin.forEach(z => { ust = z.koyu ? 0 : ust + 1; enUzun = Math.max(enUzun, ust); });
  ok('L8 zemin ritmi: art arda üç açık bölüm yok; koyu bölümler sektörler, süreç ve “Neden Voltage?”; ayrı koyu söz bandı yok', enUzun <= 2 && zemin.filter(z => z.koyu).map(z => z.ad).join() === 'kapak,sectors,process,yaklasim,footer' && !(await p.evaluate(() => !!document.querySelector('.quotec'))), JSON.stringify(zemin.map(z => z.ad + (z.koyu ? ':KOYU' : ':açık'))));
  not('zemin sırası: ' + zemin.map(z => z.ad + (z.koyu ? ' (lacivert)' : z.renk === '255,255,255' ? ' (beyaz)' : ' (krem)')).join(' → '));
  const soz = await p.evaluate(() => { const e = document.querySelector('#yaklasim .callout-t'); const etiket = [...document.querySelectorAll('.app-tag')]; return { var: !!e, yazi: e ? parseFloat(getComputedStyle(e).fontSize) : 0, metin: e ? e.innerText.trim() : '', etiket: etiket.map(x => x.textContent).join('|'), etiketBoy: Math.max(...etiket.map(x => parseFloat(getComputedStyle(x).fontSize))), govde: parseFloat(getComputedStyle(document.querySelector('.app-x')).fontSize), slogan: /Bir firma kadar köklü/.test(document.body.textContent) || /As established as a firm/.test(document.documentElement.innerHTML) }; });
  ok('L9 şirket cümlesi “Neden Voltage?” bölümünün içinde, sakin (≤ 22 px); üç ilke etiketi duruyor ve gövde metninden küçük; “Bir firma kadar köklü…” satırı kaldırıldı (TR ve EN)', soz.var && soz.yazi <= 22 && /^Enerji bir emtia değil; işinizin nabzıdır\./.test(soz.metin) && soz.etiket === '— Taahhüt üzerine kurulu|— Derinlik üzerine kurulu|— Açıklık üzerine kurulu' && soz.etiketBoy < soz.govde && !soz.slogan, JSON.stringify(soz));
  const kurum = await p.evaluate(() => { const h = document.getElementById('hakkimizda'); const t = h.innerText; const m = h.querySelector('.about-metin').getBoundingClientRect(), k = h.querySelector('.about-kunye').getBoundingClientRect(); return { h2: [...h.querySelectorAll('h2')].length, h3: [...h.querySelectorAll('h3')].map(x => x.innerText.trim()), yan: k.left >= m.right - 1 && Math.abs(k.top - m.top) < 60, fark: Math.round(Math.abs(k.bottom - m.bottom)), olgu: ['ETS/3424-8/2074', 'Voltan Elektrik Toptan Satış İth. ve İhr. A.Ş.', '19 Eylül 2011 · Kurul Kararı 3424-8', '2031 · süre uzatımı EPDK onayına tabi', 'Enerji Piyasası Düzenleme Kurumu', '786882-0 · İstanbul', 'Sabit · Endeksli · Hibrit', 'OSB + endüstriyel tesisler', 'GÖP · GİP · İkili Anlaşmalar', '— Emirhan Tan, Yönetim Kurulu Başkanı', 'YEK-G SERTİFİKALI SATICI', 'EPİAŞ PİYASA KATILIMCISI', 'İTO ÜYESİ', 'KVKK AYDINLATMA METNİ', 'Sözleşme ne diyorsa, o olur.'].filter(x => !t.includes(x)), gorsel: h.querySelectorAll('img, picture, svg').length, lisansBolum: document.querySelectorAll('section.licence').length }; });
  ok('L10 kurumsal blok: EPDK lisansı “Voltage Enerji Hakkında” bölümünde H3 olarak şirket bilgilerinin yanında; ayrı lisans bölümü yok; tüm şirket ve lisans bilgileri, imza ve dört rozet duruyor; fotoğraf yok', kurum.h2 === 1 && JSON.stringify(kurum.h3) === JSON.stringify(['Şirket Bilgileri', 'EPDK Tedarik Lisansı']) && kurum.yan && kurum.olgu.length === 0 && kurum.gorsel === 0 && kurum.lisansBolum === 0, JSON.stringify(kurum));
  ok('L0 1440: betiğin aradığı her id sayfada var (kaldırılmış öğeye bağlı betik yok); konsol hatası yok', (await p.evaluate(() => { const js = [...document.scripts].filter(s => !s.type || s.type === 'text/javascript').map(s => s.textContent).join('\n'); const ids = new Set([...js.matchAll(/getElementById\('([^']+)'\)/g), ...js.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1])); return [...ids].filter(i => !document.getElementById(i)); })).length === 0 && durum.konsol.length === 0, durum.konsol.join(' | '));
  await ctx.close();
  // sayfa boyu
  const boylar = {};
  for (const [w, h] of [[1440, 900], [390, 844]]) { const k = await baglam({ w, h }); await ac(k.p); boylar[w] = await k.p.evaluate(() => document.documentElement.scrollHeight); const o = await baglam({ w, h }); await o.p.goto(ONCEKI, { waitUntil: 'networkidle' }); await o.p.waitForTimeout(400); boylar[w + 'o'] = await o.p.evaluate(() => document.documentElement.scrollHeight); await k.ctx.close(); await o.ctx.close(); }
  not(`sayfa boyu: 1440 px’te ${boylar['1440o']} → ${boylar[1440]} px; 390 px’te ${boylar['390o']} → ${boylar[390]} px (hedef: ≈ 8.000 ve ≈ 10.500)`);
  ok('L11 sayfa önceki hazırlık sürümünden kısa (içerik silinmeden): 1440 px’te en az 1.300 px, 390 px’te en az 3.000 px', boylar['1440o'] - boylar[1440] >= 1300 && boylar['390o'] - boylar[390] >= 3000, JSON.stringify(boylar));
}

// ───────────────────────── M. ilk ekran: önceki hazırlık sürümüyle piksel karşılaştırması ─────────────────────────
{
  const yardimci = await (await b.newContext()).newPage();
  await yardimci.goto('about:blank');
  const karsilastir = (a, c, sinir) => yardimci.evaluate(async ({ a, c, sinir }) => {
    const oku = async (v) => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + v)).blob()); const k = new OffscreenCanvas(bm.width, bm.height); const x = k.getContext('2d'); x.drawImage(bm, 0, 0); return { w: bm.width, h: bm.height, d: x.getImageData(0, 0, bm.width, bm.height).data }; };
    const A = await oku(a), C = await oku(c);
    if (A.w !== C.w || A.h !== C.h) return { boyut: false };
    let ust = 0, alt = 0, ilk = -1, son = -1;
    for (let y = 0; y < A.h; y++) { let f = 0; for (let x = 0; x < A.w; x++) { const i = (y * A.w + x) * 4; if (A.d[i] !== C.d[i] || A.d[i + 1] !== C.d[i + 1] || A.d[i + 2] !== C.d[i + 2]) f++; } if (f) { if (ilk < 0) ilk = y; son = y; if (y < sinir) ust += f; else alt += f; } }
    return { boyut: true, w: A.w, h: A.h, ust, alt, ilk, son };
  }, { a: a.toString('base64'), c: c.toString('base64'), sinir });
  for (const [w, h, dsf] of [[1440, 900, 1], [390, 844, 1], [390, 844, 2]]) {
    const cek = async (url) => {
      const k = await baglam({ w, h, ptf: 'kapali', azalt: true, dsf });
      await k.p.goto(url, { waitUntil: 'networkidle' });
      await k.p.evaluate(() => document.fonts.ready); await k.p.waitForTimeout(700);
      const o = await k.p.evaluate(() => ({ kapak: Math.round(document.querySelector('.hero').getBoundingClientRect().bottom), bilgi: Math.round(document.querySelector('.trust').getBoundingClientRect().bottom), foto: document.querySelector('.hero-photo img').complete && document.querySelector('.hero-photo img').naturalWidth > 0, yazi: [...document.fonts].filter(f => f.status === 'loaded').length, durum: document.getElementById('ptfKart').dataset.state, kutu: JSON.stringify(['#nav', '#kapakBaslik', '.hero-sub', '.hero-actions', '#ptfKart'].map(q => { const r = document.querySelector(q).getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); })) }));
      const png = await k.p.screenshot();
      await k.ctx.close();
      return { o, png };
    };
    const once = await cek(ONCEKI), sonra = await cek(SAYFA);
    const ad = `${w}x${h}${dsf > 1 ? '@' + dsf + 'x' : ''}`;
    writeFileSync(`${CIKTI}/r3/durum/ilk-ekran-${ad}-once.png`, once.png); writeFileSync(`${CIKTI}/r3/durum/ilk-ekran-${ad}-sonra.png`, sonra.png);
    const sinir = Math.min(h, sonra.o.bilgi) * dsf;
    const f = await karsilastir(once.png, sonra.png, sinir);
    if (w >= 1040) {
      ok(`M1 ${ad} ilk ekran (bekleme durumu): üst bant, kapak ve bilgi satırı önceki hazırlık sürümüyle piksel piksel aynı (0 farklı piksel, ilk ${Math.round(sinir / dsf)} px)`, f.boyut && f.ust === 0 && once.o.kapak === sonra.o.kapak && once.o.bilgi === sonra.o.bilgi && once.o.foto && sonra.o.foto && once.o.yazi === sonra.o.yazi && sonra.o.durum === 'waiting', JSON.stringify([f, once.o, sonra.o]));
    } else {
      ok(`M1 ${ad} ilk ekran (bekleme durumu): üst bant, başlık, alt metin, düğmeler ve PTF kartı önceki hazırlık sürümüyle aynı yerde ve ölçüde; kapak yalnız şerit yeri kadar (44 px) uzadı`, once.o.kutu === sonra.o.kutu && sonra.o.kapak - once.o.kapak === 44 && sonra.o.bilgi - once.o.bilgi === 44 && once.o.foto && sonra.o.foto && sonra.o.durum === 'waiting', JSON.stringify([once.o, sonra.o]));
    }
    not(`${ad}: kapak alt kenarı ${sonra.o.kapak} px, bilgi satırı alt kenarı ${sonra.o.bilgi} px; karşılaştırılan ${f.w}×${f.h} piksel; ilk ${Math.round(sinir / dsf)} px içinde farklı piksel ${f.ust}; altında farklı piksel ${f.alt}` + (f.alt ? ` (satır ${Math.round(f.ilk / dsf)}–${Math.round(f.son / dsf)}: yeniden düzenlenen Hizmetler bölümünün başı)` : ' (ekranın tamamı aynı)'));
  }
  await yardimci.context().close();
}

// ───────────────────────── N. PTF üç durum: konsol ve sayfa hatası yok (telefon ve masaüstü) ─────────────────────────
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const { ctx, p, durum } = await baglam({ w, h });
  const hatalar = () => durum.konsol.filter(k => !/ERR_CONNECTION_REFUSED|Failed to load resource|requestfailed: https:\/\/epias-proxy/.test(k));
  await ac(p);
  const canli = await p.evaluate(() => [document.getElementById('ptfKart').dataset.state, document.getElementById('kfStamp').textContent, document.getElementById('lmMode').textContent]);
  const h1 = hatalar().length;
  durum.ptf = 'kapali';
  await ac(p);
  const onb = await p.evaluate(() => [document.getElementById('ptfKart').dataset.state, document.getElementById('kfStamp').textContent, document.getElementById('lmMode').textContent]);
  const h2 = hatalar().length;
  await p.evaluate(() => localStorage.removeItem('voltage-ptf-cache'));
  await ac(p);
  const bek = await p.evaluate(() => [document.getElementById('ptfKart').dataset.state, document.getElementById('kfStamp').textContent, document.getElementById('lmMode').textContent, [...document.querySelectorAll('#saatTablo tbody td')].every(t => t.textContent === '—')]);
  ok(`N1 ${w}px PTF üç durum art arda: canlı → önbellek (“SON SENKRON”) → bekleme; hiçbirinde konsol ya da sayfa hatası yok (yalnız kapalı proxy isteği düşer)`, canli[0] === 'live' && canli[2] === 'CANLI' && onb[0] === 'cached' && /^SON SENKRON \d\d:\d\d$/.test(onb[1]) && onb[2] === 'SON SENKRON' && bek[0] === 'waiting' && bek[1] === 'EPİAŞ VERİSİ BEKLENİYOR' && bek[3] === true && h1 === 0 && h2 === 0 && hatalar().length === 0, JSON.stringify([canli, onb, bek, hatalar()]));
  await ctx.close();
}

await b.close();
writeFileSync(`${CIKTI}/r3/test-sonucu.txt`, 'HAZIRLIK SAYFASI — DAVRANIŞ TESTLERİ (3. tur, 24.11 revizyonu)\nSayfa: ' + SAYFA + '\n\n' + sonuc.join('\n') + `\n\nTOPLAM: ${gecen} geçti, ${kalan} kaldı\n`);
console.log(`\nTOPLAM: ${gecen} geçti, ${kalan} kaldı  (ayrıntı: ${CIKTI}/r3/test-sonucu.txt)`);
process.exit(kalan ? 1 : 0);
