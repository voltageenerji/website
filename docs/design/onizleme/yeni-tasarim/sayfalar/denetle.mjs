// Görsel ve erişilebilirlik denetimi + önce/sonra ekran görüntüleri (Playwright, Chromium).
// Depoya yalnız sonuclar/denetim.txt yazılır; ekran görüntüleri GORUNTU dizinine (depo dışı) gider.
//   ONCE=<canlı sayfaların olduğu depo kopyası>  SONRA=<cikti/ sayfaları yerine konmuş kopya (testleri-kos.sh KOPYA)>
//   GORUNTU=<ekran görüntüsü dizini>  [PLAYWRIGHT_MODUL=/opt/node-tools/node_modules/]  node denetle.mjs
// Sunucu: her kopya için küçük bir statik sunucu (temiz adresler); /dengesizlik-maliyeti kopyanın kendi QA test sunucusundan
// (gerçek fonksiyon modülleri + SAHTE veri). /canli-ptf?ornek → functions/canli-ptf.js inject() ile SAHTE 24 saat.
// !!! "-test-verisi" adlı ekran görüntülerindeki rakamlar UYDURMA TEST VERİSİDİR; gerçek piyasa verisi değildir.
// Piyasa proxy'sine giden her istek kesilir: canlı veri yok → sayfa dürüst bekleme ya da SON SENKRON durumunda kalır.
import http from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
    if (!existsSync(dosya)) { res.writeHead(404); return res.end('yok'); }
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

const SAYFALAR = [
  ['rehber-tekstil-elektrik', '/rehber/tekstil-elektrik'],
  ['canli-ptf', '/canli-ptf'],
  ['canli-ptf', '/canli-ptf?ornek', '-test-verisi'],
  ['kurumsal', '/kurumsal'],
  ['dengesizlik-maliyeti', '/dengesizlik-maliyeti', '-test-verisi'],
  ['dengesizlik-maliyeti', '/dengesizlik-maliyeti?veriyok', '-bekleme'],
];
const GENISLIK = [[320, 640], [390, 844], [768, 1024], [1440, 900]];

const satir = [];
let kalan = 0;
const yaz = (s = '') => { satir.push(s); console.log(s); };
const ok = (ad, kosul, ek = '') => { if (!kosul) kalan++; yaz(`  ${kosul ? 'GEÇTİ' : 'KALDI'}  ${ad}${ek ? ' — ' + ek : ''}`); };

const browser = await pw.chromium.launch({ args: ['--no-sandbox'] });
async function ac(taban, yol, { w = 1440, h = 900, js = true, azalt = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, javaScriptEnabled: js, locale: 'tr-TR', reducedMotion: azalt ? 'reduce' : 'no-preference' });
  await ctx.route(/epias-proxy|cloudflareinsights/, (r) => r.abort());
  const page = await ctx.newPage();
  // Dengesizlik test sunucusunun sahte saati (24.11.2026 14:30 İstanbul) istemciye de verilir
  if (js && yol.startsWith('/dengesizlik')) await page.clock.install({ time: new Date(SABIT_AN) });
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) hatalar.push(m.text()); });
  await page.goto(taban + yol, { waitUntil: 'load' });
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
  // SVG metinleri: dolgu rengi, en yakın opak zemine karşı
  for (const t of document.querySelectorAll('svg text')) {
    if (!t.getClientRects().length) continue;
    const f = ayir(getComputedStyle(t).fill); if (!f) continue;
    const z = zemin(t.closest('svg').parentElement), o = oran(kar(f, z), z);
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
yaz(`# Alt sayfa 1. aşama — görsel ve erişilebilirlik denetimi (Chromium ${browser.version()}, ${new Date().toISOString().slice(0, 16)}Z)`);
yaz('# Piyasa proxy istekleri kesildi (canlı veri yok). "-test-verisi" görünümlerindeki rakamlar UYDURMA TEST VERİSİDİR.');

for (const [ad, yol, ek = ''] of SAYFALAR) {
  yaz(`\n=== ${yol}${ek ? ` (${ek.slice(1)})` : ''}`);
  // Ekran görüntüleri: önce / sonra, 1440 ve 390, tam sayfa, deviceScaleFactor 1
  const boylar = {};
  for (const hal of ['once', 'sonra']) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { page, kapat } = await ac(SUNUCU[hal].url, yol, { w, h });
      boylar[`${hal}-${w}`] = (await tasma(page)).boy;
      await page.screenshot({ path: join(GORUNTU, `${ad}-${hal}-${w}${ek}.png`), fullPage: true });
      await kapat();
    }
  }
  yaz(`  bilgi  sayfa boyu (px) 1440: ${boylar['once-1440']} → ${boylar['sonra-1440']} · 390: ${boylar['once-390']} → ${boylar['sonra-390']}`);
  // Denetimler (yalnız yeni sayfa)
  for (const [w, h] of GENISLIK) {
    const { page, hatalar, kapat } = await ac(SUNUCU.sonra.url, yol, { w, h });
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
    const r = await page.evaluate(() => ({ h1: !!document.querySelector('h1') && document.querySelector('h1').getBoundingClientRect().height > 0, metin: document.querySelector('main').innerText.length, menuDugme: getComputedStyle(document.getElementById('mobileMenuBtn')).display, alt: document.querySelectorAll('footer a').length }));
    const t = await tasma(page);
    ok(`JS kapalı ${w}px: başlık ve içerik okunur, taşma yok, işlevsiz menü düğmesi gizli, alt bilgi bağlantıları var`, r.h1 && r.metin > 1500 && !t.yatay && r.menuDugme === 'none' && r.alt >= 10, JSON.stringify(r));
    await kapat();
  }
  // Hareket azaltma
  {
    const { page, kapat } = await ac(SUNUCU.sonra.url, yol, { azalt: true });
    await page.hover('.sayfa-govde a, .crumbs a');
    const r = await page.evaluate(() => ({ kaydirma: getComputedStyle(document.documentElement).scrollBehavior, gecis: [...document.querySelectorAll('a, button')].map((e) => getComputedStyle(e).transitionDuration).filter((d) => !/^0s(, 0s)*$/.test(d)).length, anim: document.getAnimations().length }));
    ok('hareket azaltma: kaydırma auto, geçiş 0 sn, çalışan animasyon yok', r.kaydirma === 'auto' && r.gecis === 0 && r.anim === 0, JSON.stringify(r));
    await kapat();
    const b = await ac(SUNUCU.sonra.url, yol);
    const anim = await b.page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).animationName !== 'none').length);
    ok('normal modda da otomatik animasyon yok', anim === 0, String(anim));
    await b.kapat();
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
writeFileSync(new URL('sonuclar/denetim.txt', BURASI), satir.join('\n') + '\n');
process.exit(kalan ? 1 : 0);
