// Görsel ve erişilebilirlik denetimi + önce/sonra ekran görüntüleri (Playwright, Chromium).
// Depoya yalnız sonuclar/denetim.txt yazılır; ekran görüntüleri GORUNTU dizinine (depo dışı) gider.
//   ONCE=<canlı sayfaların olduğu depo kopyası>  SONRA=<cikti/ sayfaları yerine konmuş kopya (testleri-kos.sh KOPYA)>
//   GORUNTU=<ekran görüntüsü dizini>  [PLAYWRIGHT_MODUL=/opt/node-tools/node_modules/]  node denetle.mjs
// Sunucu: her kopya için küçük bir statik sunucu (temiz adresler); /dengesizlik-maliyeti kopyanın kendi QA test sunucusundan
// (gerçek fonksiyon modülleri + SAHTE veri). /canli-ptf?ornek → functions/canli-ptf.js inject() ile SAHTE 24 saat.
// !!! "-test-verisi" adlı ekran görüntülerindeki rakamlar UYDURMA TEST VERİSİDİR; gerçek piyasa verisi değildir.
// Piyasa proxy'sine giden her istek kesilir: canlı veri yok → sayfa dürüst bekleme ya da SON SENKRON durumunda kalır.
// 2. aşama: cikti/ altındaki bütün sayfalar (29). 404: Pages gibi bilinmeyen adres 404.html'i 404 durumuyla döner; denetimler
// yedek yolunda (hareket azaltma; ayrıca JS kapalı) yapılır, ek olarak oyun açılınca (WebGL, SwiftShader) kabuğun gizlendiği
// denetlenir. Ekran görüntülerinde 404 yedek hâlindedir (hareket azaltma).
import http from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const ONCE = process.env.ONCE, SONRA = process.env.SONRA, GORUNTU = process.env.GORUNTU;
if (!ONCE || !SONRA || !GORUNTU) { console.error('ONCE, SONRA ve GORUNTU verin'); process.exit(2); }
const pw = createRequire(process.env.PLAYWRIGHT_MODUL || '/opt/node-tools/node_modules/')('playwright');
mkdirSync(GORUNTU, { recursive: true });
const BURASI = new URL('./', import.meta.url);
const { SABIT_AN } = await import(join(SONRA, 'docs/qa/dengesizlik-test-verisi.mjs'));

const TUR = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css', '.js': 'text/javascript' };
async function sunucu(kok) {
  const { sunucuBaslat } = await import(join(kok, 'docs/qa/dengesizlik-test-sunucu.mjs'));
  const { sahteGun } = await import(join(kok, 'docs/qa/dengesizlik-test-verisi.mjs'));
  const { inject } = await import(join(kok, 'functions/canli-ptf.js'));
  const dm = await sunucuBaslat({ gun: (g) => sahteGun(g, g === '2026-11-24' ? 11 : 24) });
  const s = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://yerel');
    if (u.pathname.startsWith('/dengesizlik-maliyeti')) {
      const r = await fetch(dm.url + req.url);
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'text/html' });
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    let yol = decodeURIComponent(u.pathname);
    if (yol === '/') yol = '/index.html';
    let dosya = join(kok, yol);
    if (!extname(dosya) && existsSync(dosya + '.html')) dosya += '.html';
    if (!existsSync(dosya)) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(readFileSync(join(kok, '404.html'))); }
    let govde = readFileSync(dosya);
    if (yol === '/canli-ptf' && u.searchParams.has('ornek')) {
      // !!! UYDURMA TEST VERİSİ (yerleşim incelemesi için); 05:00 eksik saat
      const fiyat = Array.from({ length: 24 }, (_, h) => (h === 5 ? null : 2100 + Math.round(900 * Math.sin((h - 4) / 3.8)) + h * 12));
      govde = Buffer.from(inject(govde.toString('utf8'), fiyat, { monthAvg: 2456.78, monthRange: '2026-11-01..26' }, null));
    }
    res.writeHead(200, { 'Content-Type': TUR[extname(dosya)] || 'application/octet-stream' });
    res.end(govde);
  });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${s.address().port}`, kapat: async () => { s.close(); await dm.kapat(); } };
}

const tumu = [...readdirSync(new URL('cikti/', BURASI)).filter((f) => f.endsWith('.html')), ...readdirSync(new URL('cikti/rehber/', BURASI)).map((f) => 'rehber/' + f)].sort();
const SAYFALAR = [];
for (const f of tumu) {
  const yol = '/' + f.replace(/\.html$/, '');
  const ad = f.replace(/\.html$/, '').replace('/', '-');
  if (f === '404.html') SAYFALAR.push([ad, '/olmayan-bir-adres']);
  else if (f === 'canli-ptf.html') SAYFALAR.push([ad, yol], [ad, yol + '?ornek', '-test-verisi']);
  else if (f === 'dengesizlik-maliyeti.html') SAYFALAR.push([ad, yol, '-test-verisi'], [ad, yol + '?veriyok', '-bekleme']);
  else SAYFALAR.push([ad, yol]);
}
if (process.env.YALNIZ) SAYFALAR.splice(0, SAYFALAR.length, ...SAYFALAR.filter(([ad]) => process.env.YALNIZ.split(',').includes(ad)));
const GENISLIK = [[320, 640], [390, 844], [768, 1024], [1440, 900]];

const satir = [];
let kalan = 0;
const yaz = (s = '') => { satir.push(s); console.log(s); };
const ok = (ad, kosul, ek = '') => { if (!kosul) kalan++; yaz(`  ${kosul ? 'GEÇTİ' : 'KALDI'}  ${ad}${ek ? ' — ' + ek : ''}`); };

const browser = await pw.chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function ac(taban, yol, { w = 1440, h = 900, js = true, azalt = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, javaScriptEnabled: js, locale: 'tr-TR', reducedMotion: azalt ? 'reduce' : 'no-preference' });
  await ctx.route(/epias-proxy|cloudflareinsights/, (r) => r.abort());
  const page = await ctx.newPage();
  // Dengesizlik test sunucusunun sahte saati (24.11.2026 14:30 İstanbul) istemciye de verilir
  if (js && yol.startsWith('/dengesizlik')) await page.clock.install({ time: new Date(SABIT_AN) });
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  // 404 sayfasının kendi belgesi bilerek 404 durumuyla gelir; Chromium bunu konsola yazar: yalnız o satır sayılmaz
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text()) && !(m.location().url === taban + yol && / 404 /.test(m.text()))) hatalar.push(m.text()); });
  const yanit = await page.goto(taban + yol, { waitUntil: 'load' });
  page.durum = yanit.status();
  if (js) { await page.evaluate(() => document.fonts && document.fonts.ready); await page.waitForTimeout(250); }
  else await page.waitForTimeout(400);
  return { page, ctx, hatalar, kapat: () => ctx.close() };
}

// Görünen her metin düğümü için WCAG karşıtlığı (docs/qa/test-dengesizlik-tarayici.mjs ile aynı yöntem); SVG metni ayrı
const karsitlik = (page) => page.evaluate(() => {
  const ayir = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const kar = (u, a) => ({ r: u.r * u.a + a.r * (1 - u.a), g: u.g * u.a + a.g * (1 - u.a), b: u.b * u.a + a.b * (1 - u.a), a: 1 });
  const zemin = (el) => { const k = []; for (let e = el; e; e = e.parentElement) { const c = ayir(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { k.push(c); if (c.a === 1) break; } } let t = { r: 255, g: 255, b: 255, a: 1 }; for (let i = k.length - 1; i >= 0; i--) t = kar(k[i], t); return t; };
  const isik = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const oran = (a, b) => { const x = isik(a), y = isik(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const kotu = []; let enDusuk = 99, sayi = 0;
  const gez = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = gez.nextNode(); n; n = gez.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('script,style,noscript,option,.sr-only,svg')) continue;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || !el.getClientRects().length) continue;
    const z = zemin(el), o = oran(kar(ayir(st.color), z), z);
    sayi++; enDusuk = Math.min(enDusuk, o);
    if (o < 4.5) kotu.push(`${o.toFixed(2)} ${el.tagName}.${el.className} "${n.nodeValue.trim().slice(0, 24)}"`);
  }
  // SVG metinleri: dolgu rengi; zemin, metnin ortasının altında kalan en üstteki dolgulu SVG şekli (ör. adım şemasındaki
  // koyu kod çipi), yoksa SVG'nin arkasındaki en yakın opak zemin
  for (const t of document.querySelectorAll('svg text')) {
    if (!t.getClientRects().length) continue;
    const f = ayir(getComputedStyle(t).fill); if (!f) continue;
    const tr = t.getBoundingClientRect(), cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
    let z = zemin(t.closest('svg').parentElement);
    for (const s of t.closest('svg').querySelectorAll('rect, path, circle, polygon')) {
      if (!(s.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      const sf = ayir(getComputedStyle(s).fill), sr = s.getBoundingClientRect();
      if (sf && sf.a > 0 && cx >= sr.left && cx <= sr.right && cy >= sr.top && cy <= sr.bottom) z = kar(sf, z);
    }
    const o = oran(kar(f, z), z);
    sayi++; enDusuk = Math.min(enDusuk, o);
    if (o < 4.5) kotu.push(`${o.toFixed(2)} svg text "${t.textContent.slice(0, 20)}"`);
  }
  return { kotu: [...new Set(kotu)], enDusuk: Math.round(enDusuk * 100) / 100, sayi };
});

const tasma = (page) => page.evaluate(() => ({ yatay: document.documentElement.scrollWidth > document.documentElement.clientWidth || document.body.scrollWidth > document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, boy: document.documentElement.scrollHeight }));

async function odakGez(page) {
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  const duraklar = [];
  for (let i = 0; i < 260; i++) {
    await page.keyboard.press('Tab');
    const d = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      const st = getComputedStyle(e), r = e.getBoundingClientRect();
      const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
      const m = document.elementFromPoint(x, y);
      return { ad: e.id || e.tagName + (e.getAttribute('href') ? `[${e.getAttribute('href')}]` : ''), tur: e.type || '',
        cerceve: (st.outlineStyle === 'solid' && parseFloat(st.outlineWidth) >= 2) || (st.boxShadow && st.boxShadow !== 'none'), fv: e.matches(':focus-visible'),
        gorunur: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth, ortulu: !!m && m !== e && !e.contains(m) && !m.contains(e) };
    });
    if (!d) break;
    if (duraklar.length && d.ad === duraklar[0].ad) break;
    duraklar.push(d);
  }
  return duraklar;
}

const SUNUCU = { once: await sunucu(ONCE), sonra: await sunucu(SONRA) };
yaz(`# Alt sayfalar (1. + 2. aşama, ${tumu.length} sayfa) — görsel ve erişilebilirlik denetimi (Chromium ${browser.version()}, ${new Date().toISOString().slice(0, 16)}Z)`);
yaz('# Piyasa proxy istekleri kesildi (canlı veri yok). "-test-verisi" görünümlerindeki rakamlar UYDURMA TEST VERİSİDİR.');

for (const [ad, yol, ek = ''] of SAYFALAR) {
  const d404 = ad === '404';
  yaz(`\n=== ${yol}${ek ? ` (${ek.slice(1)})` : ''}${d404 ? ' (404.html; denetimler yedek yolunda: hareket azaltma)' : ''}`);
  // Ekran görüntüleri: önce / sonra, 1440 ve 390, tam sayfa, deviceScaleFactor 1
  const boylar = {};
  for (const hal of ['once', 'sonra']) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { page, kapat } = await ac(SUNUCU[hal].url, yol, { w, h, azalt: d404 });
      boylar[`${hal}-${w}`] = (await tasma(page)).boy;
      await page.screenshot({ path: join(GORUNTU, `${ad}-${hal}-${w}${ek}.png`), fullPage: true });
      await kapat();
    }
  }
  yaz(`  bilgi  sayfa boyu (px) 1440: ${boylar['once-1440']} → ${boylar['sonra-1440']} · 390: ${boylar['once-390']} → ${boylar['sonra-390']}`);
  // Denetimler (yalnız yeni sayfa)
  for (const [w, h] of GENISLIK) {
    const { page, hatalar, kapat } = await ac(SUNUCU.sonra.url, yol, { w, h, azalt: d404 });
    if (w === 1440) ok(`HTTP durumu ${d404 ? '404 (bilinmeyen adres → 404.html)' : '200'}`, page.durum === (d404 ? 404 : 200), String(page.durum));
    const t = await tasma(page);
    const k = await karsitlik(page);
    ok(`${w}px yatay taşma yok`, !t.yatay, t.yatay ? `scrollWidth ${t.sw}` : '');
    ok(`${w}px karşıtlık ≥ 4,5:1 (${k.sayi} metin, en düşük ${k.enDusuk})`, k.kotu.length === 0, k.kotu.slice(0, 5).join(' ; '));
    ok(`${w}px sayfa/konsol hatası yok`, hatalar.length === 0, hatalar.slice(0, 3).join(' | '));
    if (w === 390 || w === 1440) {
      const d = await odakGez(page);
      const cercevesiz = d.filter((x) => !x.cerceve && !(x.tur === 'date' && !x.fv));
      ok(`${w}px odak: ${d.length} durağın hepsinde görünür çerçeve (≥ 2 px)`, cercevesiz.length === 0, JSON.stringify(cercevesiz.slice(0, 3)));
      ok(`${w}px odak: odaklanan öğe görünüm alanında ve örtülmüyor`, d.every((x) => x.gorunur && !x.ortulu), JSON.stringify(d.filter((x) => !x.gorunur || x.ortulu).slice(0, 3)));
      ok(`${w}px odak sırası atlama bağlantısıyla başlar, logo ve menü/teklif ardından gelir`, d[0] && d[0].ad === 'A[#icerik]' && d[1] && d[1].ad === 'A[/]', d.slice(0, 4).map((x) => x.ad).join(' '));
    }
    if (w === 390) {
      const m = await page.evaluate(() => { const b = document.getElementById('mobileMenuBtn'); b.click(); const mm = document.getElementById('mobileMenu'); return { acik: !mm.hidden && getComputedStyle(mm).display !== 'none', aria: b.getAttribute('aria-expanded'), bant: getComputedStyle(document.getElementById('nav')).position, baglanti: mm.querySelectorAll('a').length, gecerli: [...mm.querySelectorAll('a[aria-current]')].map((a) => a.getAttribute('href')) }; });
      await page.keyboard.press('Escape');
      const kapali = await page.evaluate(() => document.getElementById('mobileMenu').hidden && document.getElementById('mobileMenuBtn').getAttribute('aria-expanded') === 'false');
      ok('390px mobil menü: açılır (bant ekrana sabit), Esc ile kapanır', m.acik && m.aria === 'true' && m.bant === 'fixed' && m.baglanti === 6 && kapali, JSON.stringify(m));
    }
    await kapat();
  }
  // Betik kapalı
  for (const w of [390, 1440]) {
    const { page, kapat } = await ac(SUNUCU.sonra.url, yol, { w, h: 900, js: false });
    const r = await page.evaluate(() => { const b = document.querySelector('h1') || document.querySelector('.f-sub'); return { h1: !!b && b.getBoundingClientRect().height > 0, metin: document.querySelector('main').innerText.length, menuDugme: getComputedStyle(document.getElementById('mobileMenuBtn')).display, alt: [...document.querySelectorAll('footer a')].filter((a) => a.getClientRects().length).length, ust: getComputedStyle(document.getElementById('nav')).display }; });
    const t = await tasma(page);
    ok(`JS kapalı ${w}px: ${d404 ? 'yedek (404, Sayfa Bulunamadı, bağlantılar)' : 'başlık ve içerik'} okunur, taşma yok, işlevsiz menü düğmesi gizli, üst bant ve alt bilgi bağlantıları var`, r.h1 && r.metin > (d404 ? 250 : 1500) && !t.yatay && r.menuDugme === 'none' && r.alt >= 10 && r.ust !== 'none', JSON.stringify(r));
    await kapat();
  }
  // Hareket azaltma
  {
    const { page, kapat } = await ac(SUNUCU.sonra.url, yol, { azalt: true });
    await page.hover('.sayfa-govde a, .sayfa-iz a, #gFallback a');
    const r = await page.evaluate(() => ({ kaydirma: getComputedStyle(document.documentElement).scrollBehavior, gecis: [...document.querySelectorAll('a, button')].map((e) => getComputedStyle(e).transitionDuration).filter((d) => !/^0s(, 0s)*$/.test(d)).length, anim: document.getAnimations().length }));
    ok('hareket azaltma: kaydırma auto, geçiş 0 sn, çalışan animasyon yok', r.kaydirma === 'auto' && r.gecis === 0 && r.anim === 0, JSON.stringify(r));
    await kapat();
    if (d404) {
      // Oyun sahnesi önce ↔ sonra: sahnedeki her öğenin konumu, ölçüsü ve görünüşü (hesaplanmış stil) aynı mı
      const sahneOlc = async (hal) => {
        const b = await ac(SUNUCU[hal].url, yol, { w: 1440, h: 900 });
        await b.page.waitForFunction(() => document.body.classList.contains('g-on'), null, { timeout: 15000 }).catch(() => {});
        await b.page.waitForTimeout(400);
        const v = await b.page.evaluate(() => [...document.querySelectorAll('#gStage, #gStage *')].map((e) => { const s = getComputedStyle(e), r = e.getBoundingClientRect();
          return [e.id || e.className.baseVal || e.className || e.tagName, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), s.display, s.color, s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight, s.letterSpacing, s.textDecorationLine, s.backgroundColor, s.backgroundImage, s.borderTopColor, s.borderTopWidth, e.getAnimations().length ? 'canlandırma' : s.opacity].join(' | '); }));
        await b.kapat(); return v;
      };
      const so = await sahneOlc('once'), ss = await sahneOlc('sonra');
      const farkli = so.map((x, i) => (x === ss[i] ? null : `${x}  ≠  ${ss[i]}`)).filter(Boolean);
      ok(`1440px oyun sahnesi önce ↔ sonra: ${so.length} öğenin konumu, ölçüsü, rengi, yazısı, zemini ve çizgisi aynı`, so.length === ss.length && farkli.length === 0, farkli.slice(0, 3).join(' ;; '));
      // Oyun yolu: WebGL ile oyun açılır (body.g-on), kabuk ve yedek gizlenir, sahne tam ekran (canlıdaki gibi)
      for (const [w, h] of [[1440, 900], [390, 844]]) {
        const b = await ac(SUNUCU.sonra.url, yol, { w, h });
        await b.page.waitForFunction(() => document.body.classList.contains('g-on'), null, { timeout: 15000 }).catch(() => {});
        const g = await b.page.evaluate(() => { const gor = (s) => [...document.querySelectorAll(s)].some((e) => e.getClientRects().length && getComputedStyle(e).display !== 'none'); return { gOn: document.body.classList.contains('g-on'), kabuk: ['.skip', '#nav', '#mobileMenu', 'body > footer', '.sayfa-404', '#gFallback'].filter(gor), sahne: getComputedStyle(document.getElementById('gStage')).display, intro: getComputedStyle(document.getElementById('gIntro')).color, kaydir: document.documentElement.scrollHeight <= innerHeight + 1 }; });
        if (w === 1440) await b.page.screenshot({ path: join(GORUNTU, `404-sonra-${w}-oyun.png`) });
        ok(`${w}px oyun açılınca (g-on) kabuk ve yedek gizli, sahne görünür, intro yazısı canlıdaki açık renk, sayfa kaymaz`, g.gOn && g.kabuk.length === 0 && g.sahne === 'block' && g.intro === 'rgb(232, 238, 248)' && g.kaydir, JSON.stringify(g));
        await b.kapat();
      }
    } else {
      const b = await ac(SUNUCU.sonra.url, yol);
      const anim = await b.page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).animationName !== 'none').length);
      ok('normal modda da otomatik animasyon yok', anim === 0, String(anim));
      await b.kapat();
    }
  }
}

// Üst bant: ana sayfanın kaydırılmış üst bandıyla aynı yükseklik, zemin ve düğme rengi
{
  yaz('\n=== Üst bant: yeni ana sayfa (kaydırılmış) ↔ alt sayfa');
  const anaKok = new URL('../index.html', BURASI);
  for (const w of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    await ctx.route(/epias-proxy|cloudflareinsights/, (r) => r.abort());
    const p = await ctx.newPage();
    await p.setContent(readFileSync(anaKok, 'utf8').replace('<head>', '<head><base href="' + SUNUCU.sonra.url + '/">'), { waitUntil: 'load' });
    await p.evaluate(() => { window.scrollTo(0, 400); window.dispatchEvent(new Event('scroll')); });
    await p.waitForTimeout(500);
    const olc = (pg) => pg.evaluate(() => { const h = document.getElementById('nav'), c = h.querySelector('.nav-cta'), l = h.querySelector('.nav-logo'); const r = h.getBoundingClientRect(); return { yukseklik: Math.round(r.height), zemin: getComputedStyle(h).backgroundColor, cta: c ? getComputedStyle(c).backgroundColor : null, logoSol: Math.round(l.getBoundingClientRect().left), menu: [...h.querySelectorAll('.nav-links a')].map((a) => a.textContent).join('|') }; });
    const ana = await olc(p);
    const { page, kapat } = await ac(SUNUCU.sonra.url, '/kurumsal', { w });
    const alt = await olc(page);
    ok(`${w}px üst bant yüksekliği, zemini, "Teklif Al" rengi, logo hizası ve menü etiketleri aynı`, JSON.stringify(ana) === JSON.stringify(alt), `ana ${JSON.stringify(ana)} · alt ${JSON.stringify(alt)}`);
    await kapat(); await ctx.close();
  }
}

await browser.close();
await SUNUCU.once.kapat(); await SUNUCU.sonra.kapat();
yaz(`\nSONUÇ: ${kalan === 0 ? 'hepsi geçti' : kalan + ' denetim kaldı'}`);
if (!process.env.YALNIZ) writeFileSync(new URL('sonuclar/denetim.txt', BURASI), satir.join('\n') + '\n');
process.exit(kalan ? 1 : 0);
