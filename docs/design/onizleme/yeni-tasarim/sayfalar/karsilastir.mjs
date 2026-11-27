// Önce/sonra karşılaştırması: canlı sayfa (önce) ↔ cikti/ (sonra), cikti/ altındaki bütün sayfalar (1. + 2. aşama, 29).
// Depoya yalnız sonuclar/karsilastirma.txt yazılır.
// Ne denetlenir (her sayfa için):
//  B  <head>: <style>…</style> bloğu çıkarılınca bayt bayt aynı mı
//  I  içerik: canlı <div class="page"> içi (eski alt satır hariç) ile yeni sayfanın içerik izi + sayfa başı + gövdesi
//     bayt bayt aynı mı (tek izinli fark: dengesizlik sayfasının kendi <main>/</main> satırları; kabuk <main> olur)
//  S  betikler: canlıdaki her <script> bloğu aynı sırayla bayt bayt var mı; eklenen tek betik ana sayfanın menü betiği mi
//  K  kimlikler (id), bağlantılar (href), form denetimleri: kaybolan yok; eklenenler yalnız kabuktan
//  M  SSR çapaları: functions/canli-ptf.js ve functions/dengesizlik-maliyeti.js'nin aradığı her çapa yeni kabukta tam bir kez
//  R  SSR çıktısı: iki fonksiyon önce ve sonra kabuğuyla gerçekten çalıştırılır (sahte veri; ağ yok); üretilen içerik
//     bölgesi bayt bayt aynı mı
//  T  kabuk metinleri: üst bant, menü, alt bilgi ve atlama bağlantısındaki her görünür metin yeni ana sayfa gövdesinde var mı
//  A  menü / alt bilgi aria-current: rehberler "Rehber" (true), dizin "Rehber" (page), canlı PTF (page), kurumsal ve hukuki
//     metinler alt bilgide (page); başka sayfada yok
//  Q  üst banttaki "Teklif Al": sayfanın kendi kaynak etiketi (sayfada zaten geçen; yeni etiket yok); teklif düğmesi
//     olmayan sayfada düğme yok
//  O  404: oyun sahnesinin stil kuralları canlıdan aynen; yedek, teşhis satırı ve oyun sahnesi işaretlemesi bayt bayt
// Kullanım (depo dışındaki bir dizinden): node <bu dosya>
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const KOK = new URL('../../../../../', import.meta.url);
const BURASI = new URL('./', import.meta.url);
const oku = (u) => readFileSync(u, 'utf8');
const { CAPA, onRequestGet } = await import(new URL('functions/dengesizlik-maliyeti.js', KOK));
const { inject } = await import(new URL('functions/canli-ptf.js', KOK));
const { sahteProxy, SAHTE_ENV, sahteGun } = await import(new URL('docs/qa/dengesizlik-test-verisi.mjs', KOK));

const SAYFALAR = [...readdirSync(new URL('cikti/', BURASI)).filter((f) => f.endsWith('.html')), ...readdirSync(new URL('cikti/rehber/', BURASI)).map((f) => 'rehber/' + f)].sort();
const GECERLI = (yol) => (yol.startsWith('rehber/') ? [['/rehber', 'true'], ['/rehber', 'true']] : { 'rehber.html': [['/rehber', 'page'], ['/rehber', 'page']], 'canli-ptf.html': [['/canli-ptf', 'page'], ['/canli-ptf', 'page']], 'kurumsal.html': [['/kurumsal', 'page']], 'kvkk.html': [['/kvkk', 'page']], 'cerez-politikasi.html': [['/cerez-politikasi', 'page']], 'kullanim-kosullari.html': [['/kullanim-kosullari', 'page']] }[yol] || []);
const DONDURULMUS = ['rehber/ptf-nedir.html', 'rehber/serbest-tuketici.html', 'rehber/tedarikci-degistirme.html'];
const GOVDE_ANA = oku(new URL('../yapi/govde.html', BURASI));
const INDEX = oku(new URL('index.html', KOK));
const cikti = [];
let hata = 0;
const yaz = (s = '') => cikti.push(s);
const ok = (ad, kosul, ek = '') => { if (!kosul) hata++; yaz(`  ${kosul ? 'GEÇTİ' : 'KALDI'}  ${ad}${ek ? ' — ' + ek : ''}`); };

const stilsiz = (h) => h.replace(/<style>[\s\S]*?<\/style>\n/, '');
const bas = (h) => stilsiz(h.slice(0, h.indexOf('</head>\n') + 8));
const betikler = (h) => [...h.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]);
const say = (h, re) => { const s = new Map(); for (const m of h.matchAll(re)) s.set(m[1], (s.get(m[1]) || 0) + 1); return s; };
const farkMulti = (a, b) => [...a].filter(([k, n]) => (b.get(k) || 0) < n).map(([k, n]) => `${k}×${n - (b.get(k) || 0)}`);
function arasi(h, a, b) { const i = h.indexOf(a); if (i < 0) return null; const j = h.indexOf(b, i + a.length); return j < 0 ? null : h.slice(i + a.length, j); }

/** 404: yedek (<main id="gFallback"> içi, eski alt satır hariç) + teşhis satırı + oyun sahnesi. */
function eski404(h) {
  const ana = h.slice(h.indexOf('<main id="gFallback">'), h.indexOf('\n</main>\n') + 8);
  const alt = /\n  <footer>.*?<\/footer>/.exec(ana)[0];
  return { ic: ana.replace(alt, '') + '\n' + h.slice(h.indexOf('<p id="gDiag"'), h.indexOf('</p>', h.indexOf('<p id="gDiag"')) + 4) + '\n' + h.slice(h.indexOf('<div id="gStage">'), h.indexOf('\n\n<script src="/g404/game.js"')), mainVar: false, altSatir: alt.slice(1) };
}
function yeni404(h) {
  const a = h.indexOf('<div class="sayfa-404 on-dark" id="icerik" tabindex="-1">\n<div class="wrap">\n');
  if (a < 0) return null;
  const ana = h.slice(h.indexOf('<main id="gFallback">'), h.indexOf('\n</main>\n') + 8);
  return ana + '\n' + h.slice(h.indexOf('<p id="gDiag"'), h.indexOf('</p>', h.indexOf('<p id="gDiag"')) + 4) + '\n' + h.slice(h.indexOf('<div id="gStage">'), h.indexOf('\n\n<script src="/g404/game.js"'));
}
/** Canlı biçim: <div class="page"> içi, eski alt satıra kadar; dengesizlikte kendi <main> satırları çıkar. */
function eskiIcerik(h) {
  const g = h.slice(h.search(/<body[^>]*>\n<div class="page">\n/));
  let ic = g.slice(g.indexOf('<div class="page">\n') + 19, g.indexOf('\n  <footer>'));
  const mainVar = ic.includes('\n  <main>\n');
  ic = ic.replace('\n  <main>\n', '\n').replace('\n  </main>\n', '\n');
  return { ic: ic.replace(/\n+$/, ''), mainVar, altSatir: g.slice(g.indexOf('\n  <footer>') + 1, g.indexOf('</footer>') + 9) };
}
/** Yeni biçim: içerik izi + sayfa başı + gövde (sarmalayıcıları çıkarılmış). */
function yeniIcerik(h) {
  const iz = arasi(h, '<div class="sayfa-iz on-dark">\n<div class="wrap">\n', '\n</div>\n</div>\n<main>');
  const bant = arasi(h, '<div class="sayfa-bas on-dark" id="icerik" tabindex="-1">\n<div class="wrap">\n', '\n</div>\n</div>\n<div class="sayfa-govde');
  const g0 = h.indexOf('<div class="sayfa-govde ');
  const govde = arasi(h.slice(g0), '<div class="wrap">\n', '\n</div>\n</div>\n</main>');
  return [iz, bant, govde].every((x) => x !== null) ? [iz, bant, govde].join('\n') : null;
}
const metinler = (parca) => parca.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ').split(/<[^>]+>/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);

for (const yol of SAYFALAR) {
  const once = oku(new URL(yol, KOK));
  const sonra = oku(new URL('cikti/' + yol, BURASI));
  yaz(`\n=== ${yol} (önce ${Buffer.byteLength(once)} B → sonra ${Buffer.byteLength(sonra)} B; stil ${Buffer.byteLength(arasi(once, '<style>', '</style>'))} → ${Buffer.byteLength(arasi(sonra, '<style>', '</style>'))} B)`);
  ok('B <head> (stil bloğu hariç) bayt bayt aynı', bas(once) === bas(sonra));
  const basOnek = (h) => h.slice(0, h.indexOf('<head>\n') + 7);
  ok('B tek <style> bloğu; <html lang="tr"> ve belge başı (doctype, varsa TASLAK yorumu) aynı', (sonra.match(/<style>/g) || []).length === 1 && basOnek(sonra) === basOnek(once) && basOnek(sonra).includes('<html lang="tr">'));
  const d404 = yol === '404.html';
  const e = d404 ? eski404(once) : eskiIcerik(once), y = d404 ? yeni404(sonra) : yeniIcerik(sonra);
  ok(d404 ? 'I yedek içerik (eski alt satır hariç), teşhis satırı ve oyun sahnesi bayt bayt aynı' : 'I içerik (içerik izi, H1, metin, tablolar, formlar, SSS, "Bu sayfa hakkında") bayt bayt aynı', y !== null && e.ic === y, e.mainVar ? 'izinli tek fark: sayfanın kendi <main>/</main> satırları kabuğun yalın <main> öğesine taşındı' : '');
  if (d404) ok('I 404: tek <main id="gFallback">, H1 yok (canlıdaki gibi); yedek → teşhis → alt bilgi → oyun sahnesi; noindex korunuyor', (sonra.match(/<main[\s>]/g) || []).length === 1 && !/<h1[\s>]/.test(sonra)
    && sonra.indexOf('<main id="gFallback">') < sonra.indexOf('<p id="gDiag"') && sonra.indexOf('<p id="gDiag"') < sonra.indexOf('<footer>') && sonra.indexOf('<footer>') < sonra.indexOf('<div id="gStage">') && sonra.includes('<meta name="robots" content="noindex, follow">'));
  else ok('I tek <h1>, tek yalın <main>; içerik izi <main> dışında, alt bilgi <main> sonrasında', (sonra.match(/<h1[\s>]/g) || []).length === 1 && (sonra.match(/<main>/g) || []).length === 1 && !/<main\s/.test(sonra)
    && sonra.indexOf('<div class="sayfa-iz on-dark">') < sonra.indexOf('<main>') && sonra.indexOf('</main>') < sonra.indexOf('<footer>'));
  const bo = betikler(once), bs = betikler(sonra);
  const menu = '<script>\n' + "(function(){\n  var btn = document.getElementById('mobileMenuBtn');" + arasi(INDEX, "<script>\n(function(){\n  var btn = document.getElementById('mobileMenuBtn');", '</script>') + '</script>';
  ok(`S ${bo.length} betik bloğu aynı sırayla bayt bayt; eklenen tek blok ana sayfanın menü betiği`, bs.length === bo.length + 1 && bo.every((b, i) => bs[i] === b) && bs[bs.length - 1] === menu);
  const io = say(once, /\bid="([^"]+)"/g), is = say(sonra, /\bid="([^"]+)"/g);
  const yeniId = farkMulti(is, io);
  ok('K kaybolan id yok; her id sayısı canlıdakiyle aynı; kabukla eklenenler tek', farkMulti(io, is).length === 0 && [...is].every(([k, n]) => n === (io.get(k) || 1)), `eklenen (kabuk): ${yeniId.join(', ')}`);
  const ho = say(once, /\bhref="([^"]+)"/g), hs = say(sonra, /\bhref="([^"]+)"/g);
  const kayip = farkMulti(ho, hs).filter((k) => !e.altSatir.includes(`href="${k.split('×')[0]}"`));
  const yalnizAlt = [...say(e.altSatir, /\bhref="([^"]+)"/g).keys()].filter((k) => !hs.has(k));
  ok('K içerikteki bağlantı hedeflerinin hepsi duruyor; eski alt satırın hedefleri kabukta var', kayip.length === 0 && yalnizAlt.length === 0, `eski alt satır: ${[...say(e.altSatir, /\bhref="([^"]+)"/g).keys()].join(' ')} · kabukla eklenen hedefler: ${[...hs.keys()].filter((k) => !ho.has(k)).join(' ')}`);
  const denetim = (h) => [...h.matchAll(/<(?:input|select|textarea|button|form|option|label)\b[^>]*>/g)].map((m) => m[0]).filter((t) => !/mobileMenuBtn/.test(t));
  ok(`K form denetimleri (${denetim(once).length} etiket) bayt bayt ve aynı sırada`, JSON.stringify(denetim(once)) === JSON.stringify(denetim(sonra)));
  // Kabuk metinleri yeni ana sayfa gövdesinde (yeni metin yok)
  const kabuk = sonra.slice(sonra.indexOf('<body>'), sonra.indexOf(d404 ? '<!-- Statik yedek' : '<div class="sayfa-iz')) + sonra.slice(sonra.indexOf('<footer>'), sonra.indexOf('</footer>'));
  const anaMetin = new Set(metinler(GOVDE_ANA));
  const yabanci = metinler(kabuk).filter((t) => !anaMetin.has(t));
  ok(`T kabuktaki ${metinler(kabuk).length} görünür metnin hepsi yeni ana sayfada var`, yabanci.length === 0, yabanci.join(' | '));
  // A: aria-current (yalnız kabukta; içerikte yok)
  const gecerli = [...kabuk.matchAll(/<a href="([^"]+)"[^>]*? aria-current="([^"]+)"/g)].map((m) => [m[1], m[2]]);
  ok(`A geçerli sayfa işareti: ${JSON.stringify(GECERLI(yol))}`, JSON.stringify(gecerli) === JSON.stringify(GECERLI(yol)) && !/aria-current/.test(once) && (sonra.slice(sonra.indexOf('</head>')).match(/aria-current=/g) || []).length === gecerli.length, JSON.stringify(gecerli));
  // Q: üst bant teklif düğmesi
  const etiketler = new Set([...once.matchAll(/href="\/\?kaynak=([a-z0-9-]+)#leadForm"/g)].map((m) => m[1]));
  const cta = /<a href="([^"]*)" class="btn nav-cta">Teklif Al<\/a>/.exec(kabuk);
  const ctaEtiket = cta && /^\/\?kaynak=([a-z0-9-]+)#leadForm$/.exec(cta[1]);
  const beklenen = etiketler.size === 0 ? null : etiketler.size === 1 ? [...etiketler][0] : yol.replace(/\.html$/, '');
  ok(`Q üst bant "Teklif Al": ${beklenen ? `kaynak=${beklenen} (sayfada geçen etiketler: ${[...etiketler].join(', ')})` : 'sayfada teklif düğmesi yok → bantta da yok, yeri boş korunur'}`,
    beklenen ? !!ctaEtiket && ctaEtiket[1] === beklenen && etiketler.has(beklenen) : !cta && kabuk.includes('<div class="nav-right" aria-hidden="true"></div>'));
  if (DONDURULMUS.includes(yol)) yaz('  bilgi  DONDURULMUŞ rehber (SEO ölçümü 10.12): canlı dosyaya dokunulmadı; yalnız bu üretilmiş kopya var. Yayın 10.12 ölçümü ve sahip onayından sonra.');
  const eskiAltMetin = metinler(e.altSatir).join(' ');
  yaz(`  bilgi  kaldırılan eski alt satır metni: "${eskiAltMetin}"`);
  yaz(`  bilgi  yasak numara (CLAUDE.md kural 11) yok: ${!/216\s*479\s*05\s*10|2164790510/.test(sonra)}`);
}

// ---- O: 404 oyun stili ----
yaz('\n=== 404 oyun sahnesi stili (canlıdan aynen)');
{
  const o = oku(new URL('404.html', KOK)), s = oku(new URL('cikti/404.html', BURASI));
  const stilO = arasi(o, '<style>', '</style>'), stilS = arasi(s, '<style>', '</style>');
  const oyun = stilO.slice(stilO.indexOf('/* ---- Oyun sahnesi ---- */'), stilO.indexOf('/* ---- Statik yedek'));
  const dokun = stilO.slice(stilO.indexOf('/* ---- Dokunmatik'));
  const gdiag = /body\.g-on #gDiag \{[^}]*\}/.exec(stilO)[0];
  ok('O oyun sahnesi kuralları (intro, HUD, paneller, lider tablosu, bildirim), oyun açıkken teşhis satırı ve dokunmatik kuralları bayt bayt yeni stilde', stilS.includes(oyun.trimEnd()) && stilS.includes(dokun.trimEnd()) && stilS.includes(gdiag), `${Buffer.byteLength(oyun)} B oyun + ${Buffer.byteLength(dokun)} B dokunmatik`);
  const kok = /:root \{([^}]*)\}/.exec(stilO)[1];
  const sahne = /#gStage, body\.g-on #gDiag \{([^}]*)\}/.exec(stilS)[1];
  const belirtec = [...kok.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => `${m[1]}: ${m[2].trim()};`);
  ok(`O sahne belirteçleri (${belirtec.length}) canlı :root ile aynı değerlerde, yalnız sahneye sınırlı`, belirtec.length === 8 && belirtec.every((b) => sahne.includes(b)) && !/:root\s*\{[^}]*--cyan/.test(stilS));
  ok('O oyun açıkken kabuk gizli, yedek gizli (canlıdaki kural)', stilS.includes('body.g-on .skip, body.g-on .site-header, body.g-on .mobile-menu, body.g-on .sayfa-404, body.g-on > footer { display: none; }') && stilS.includes('body.g-on #gFallback { display: none; }'));
  ok('O betik: /g404/game.js aynen ve yerinde (oyun sahnesinin ardında, defer)', /<\/div>\n\n<script src="\/g404\/game\.js" defer><\/script>\n\n<script>\n\(function\(\)\{\n  var btn = document\.getElementById\('mobileMenuBtn'\);/.test(s));
}

// ---- M: SSR çapaları ----
yaz('\n=== SSR çapaları (fonksiyonların aradığı birebir metin; yeni kabukta tam bir kez)');
{
  const kaynak = oku(new URL('functions/canli-ptf.js', KOK));
  const capalar = [...kaynak.matchAll(/swap\(html, '([^']+)'/g)].map((m) => m[1]);
  const o = oku(new URL('canli-ptf.html', KOK)), s = oku(new URL('cikti/canli-ptf.html', BURASI));
  const sayi = (h, c) => h.split(c).length - 1;
  const kotu = capalar.filter((c) => sayi(s, c) !== 1 || sayi(o, c) !== 1);
  ok(`M canli-ptf.js: ${capalar.length} swap çapası + <tbody id="pTable"> + "dateModified"`, kotu.length === 0 && /<tbody id="pTable">[\s\S]*?<\/tbody>/.test(s) && (s.match(/"dateModified":"\d{4}-\d{2}-\d{2}"/g) || []).length === 1, kotu.join(' | '));
  const d = oku(new URL('cikti/dengesizlik-maliyeti.html', BURASI)), d0 = oku(new URL('dengesizlik-maliyeti.html', KOK));
  const kotu2 = Object.entries(CAPA).filter(([, c]) => sayi(d, c) !== 1 || sayi(d0, c) !== 1).map(([k]) => k);
  ok(`M dengesizlik-maliyeti.js: CAPA nesnesindeki ${Object.keys(CAPA).length} çapanın her biri tam bir kez`, kotu2.length === 0, kotu2.join(', '));
  ok('M istemci betiklerinin aradığı sınıflar (live-mode, live-stamp, dm-js, satir-ac, simdi) stil ve işaretlemede', ['live-mode', 'live-stamp'].every((c) => s.includes(`class="${c} waiting"`) && d.includes(`class="${c} waiting"`)) && d.includes("classList.add('dm-js')") && d.includes('.satir-ac {') && d.includes('tr.simdi'));
}

// ---- R: SSR çıktıları önce ↔ sonra ----
yaz('\n=== SSR çıktısı (fonksiyonlar iki kabukla çalıştırıldı; sahte veri, ağ yok)');
{
  const o = oku(new URL('canli-ptf.html', KOK)), s = oku(new URL('cikti/canli-ptf.html', BURASI));
  const fiyat = Array.from({ length: 24 }, (_, h) => (h === 5 ? null : 1800 + h * 50));
  const io = inject(o, fiyat, { monthAvg: 2222.22, monthRange: '2026-11-01..26' }, null);
  const is = inject(s, fiyat, { monthAvg: 2222.22, monthRange: '2026-11-01..26' }, null);
  ok('R canli-ptf inject(): baş bölümü (stil hariç) ve içerik bölgesi bayt bayt aynı; <body data-ssr="1">', bas(io) === bas(is) && eskiIcerik(io).ic === yeniIcerik(is) && is.includes('<body data-ssr="1">'), `24 satır: ${(yeniIcerik(is).match(/<tr[^>]*><td>\d\d:00<\/td>/g) || []).length}, eksik saat "—": ${yeniIcerik(is).includes('<td>05:00</td><td>—</td>')}`);
  const ss = inject(s, [null, ...Array(23).fill(null)].map((v, i) => (i === 3 ? 1500 : v)), null, null);
  ok('R canli-ptf tek saat verisinde diğer 23 saat "—", 0 yok', (ss.match(/<td>—<\/td>/g) || []).length === 23 && !/<td>0,00<\/td>/.test(ss));
}
for (const [ad, yol] of [['bugün (11/24 dönem yayımlanmış)', '/dengesizlik-maliyeti'], ['geçmiş gün', '/dengesizlik-maliyeti?tarih=2026-11-20'], ['veri yok', '/dengesizlik-maliyeti?veriyok']]) {
  const kos = async (kabukYolu) => {
    const proxy = sahteProxy({ gun: (g) => sahteGun(g, g === '2026-11-24' ? 11 : 24), ...(yol.includes('veriyok') ? { durum: 503 } : {}) });
    const ctx = { request: new Request('https://voltage.com.tr' + yol), env: SAHTE_ENV, secenek: { fetch: proxy.fetch, simdi: proxy.simdi, cache: null }, waitUntil() {},
      next: async () => new Response(oku(kabukYolu), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }) };
    return (await onRequestGet(ctx)).text();
  };
  const ho = await kos(new URL('dengesizlik-maliyeti.html', KOK));
  const hs = await kos(new URL('cikti/dengesizlik-maliyeti.html', BURASI));
  const govdeEtiket = (h) => (/<body[^>]*>/.exec(h) || [''])[0];
  ok(`R dengesizlik onRequestGet ${ad}: baş (stil hariç), <body …> öznitelikleri ve içerik bölgesi bayt bayt aynı`, bas(ho) === bas(hs) && govdeEtiket(ho) === govdeEtiket(hs) && eskiIcerik(ho).ic === yeniIcerik(hs), `${govdeEtiket(hs)} · satır: ${(hs.match(/<tr[^>]*data-bas=/g) || []).length}`);
}

yaz(`\nSONUÇ: ${hata === 0 ? 'hepsi geçti' : hata + ' denetim kaldı'}`);
const metin = `# Alt sayfalar (1. + 2. aşama, ${SAYFALAR.length} sayfa) — önce/sonra karşılaştırması (node ${process.version}, ${new Date().toISOString().slice(0, 16)}Z)\n` + cikti.join('\n') + '\n';
writeFileSync(new URL('sonuclar/karsilastirma.txt', BURASI), metin);
process.stdout.write(metin);
process.exit(hata ? 1 : 0);
