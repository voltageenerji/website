// Laboratuvar ölçümü: önceki hazırlık (f467ddc) ile revize sayfa. Chromium + CDP; yerel statik sunucu (sıkıştırma yok).
// Telefon: 375×667 @2x, işlemci 4× yavaş, ağ 1,6 Mbit/sn indirme, 750 kbit/sn yükleme, 150 ms gecikme. Masaüstü: 1440×900, kısıtlama yok.
// Google Fonts istekleri iki sayfada da kapalı (dış ağın oynaklığı ölçüme karışmasın); PTF yanıtı yerel taklit.
import { chromium, CIKTI, ornekVeri } from './ortak.mjs';
import { writeFileSync, readFileSync } from 'fs';
import { gzipSync } from 'zlib';
const KOK = 'http://127.0.0.1:8766/olcum/';
const TEKRAR = 5;
const ort = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const b = await chromium.launch();
async function olc(surum, profil) {
  const mobil = profil === 'telefon';
  const ctx = await b.newContext({ viewport: mobil ? { width: 375, height: 667 } : { width: 1440, height: 900 }, deviceScaleFactor: mobil ? 2 : 1, isMobile: mobil, hasTouch: mobil });
  await ctx.route('https://epias-proxy.emirhantan-ku.workers.dev/**', (route) => { const u = route.request().url(); const bas = { 'access-control-allow-origin': '*' }; return u.endsWith('/ptf/today') ? route.fulfill({ status: 200, contentType: 'application/json', headers: bas, body: JSON.stringify(ornekVeri()) }) : route.fulfill({ status: 200, contentType: 'application/json', headers: bas, body: JSON.stringify({ monthAvg: 2345.67, monthRange: '2026-11-01..23' }) }); });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (mobil) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  }
  let aktarim = 0; const istek = {};
  cdp.on('Network.responseReceived', (e) => { istek[e.requestId] = e.response.url; });
  cdp.on('Network.loadingFinished', (e) => { const u = istek[e.requestId] || ''; if (/^http:\/\/127\.0\.0\.1/.test(u)) aktarim += e.encodedDataLength; });
  await p.addInitScript(() => {
    window.__m = { lcp: 0, lcpEl: '', cls: 0, fcp: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.lcpEl = (e.element ? e.element.tagName + '.' + String(e.element.className).slice(0, 20) : '') + (e.url ? ' ' + e.url.split('/').pop() : ''); } }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
  });
  await p.goto(KOK + surum + '/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(mobil ? 3500 : 2000);
  const m = await p.evaluate(() => ({ ...window.__m, kapak: (performance.getEntriesByType('resource').find(r => /kapak-/.test(r.name)) || {}).responseEnd || 0, kapakAd: ((performance.getEntriesByType('resource').find(r => /kapak-/.test(r.name)) || {}).name || '').split('/').pop(), dom: document.querySelectorAll('*').length, yuk: document.documentElement.scrollHeight, nav: performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd, load: performance.getEntriesByType('navigation')[0].loadEventEnd }));
  // etkileşim gecikmesi: olaydan sonraki ilk kareye kadar geçen süre
  const etki = (kod) => p.evaluate(async (k) => { const f = new Function('return (async () => {' + k + '})()'); const t0 = performance.now(); await f(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; }, kod);
  const e = {};
  if (mobil) {
    e.menu = await etki("document.getElementById('mobileMenuBtn').click();");
    await p.waitForTimeout(200);
    e.dil = await etki("(document.querySelector('#mobileMenu .lang-btn[data-lang=\"en\"]') || document.querySelector('.lang-btn[data-lang=\"en\"]')).click();");
    await p.evaluate(() => { document.querySelector('.lang-btn[data-lang="tr"]').click(); const bt = document.getElementById('mobileMenuBtn'); if (bt.getAttribute('aria-expanded') === 'true') bt.click(); });
  } else {
    e.dil = await etki("document.querySelector('.lang-btn[data-lang=\"en\"]').click();");
    await p.evaluate(() => document.querySelector('.lang-btn[data-lang="tr"]').click());
  }
  await p.waitForTimeout(200);
  e.secim = await etki("const s = document.getElementById('lead-tarife'); s.value = 'mesken'; s.dispatchEvent(new Event('change', { bubbles: true }));");
  await ctx.close();
  return { ...m, aktarim, ...e };
}
const satir = ['LABORATUVAR ÖLÇÜMÜ — önceki hazırlık (f467ddc) ile revize sayfa', 'Chromium (Playwright) + CDP; yerel statik sunucu, sıkıştırma YOK (üretimde Cloudflare sıkıştırır; gzip boyutu ayrıca verildi).',
  'Telefon: 375×667 @2x, işlemci 4× yavaş, ağ 1,6 Mbit/sn ↓ · 750 kbit/sn ↑ · 150 ms. Masaüstü: 1440×900, kısıtlama yok.',
  'Google Fonts istekleri iki sayfada da kapalı; PTF yanıtı yerel taklit. Her değer ' + TEKRAR + ' ölçümün ortancası. Gerçek kullanıcı ölçümü değildir.', ''];
const sonuc = {};
for (const profil of ['telefon', 'masaustu']) for (const surum of ['onceki', 'yeni']) {
  const d = []; for (let i = 0; i < TEKRAR; i++) d.push(await olc(surum, profil));
  const o = {}; for (const k of ['lcp', 'kapak', 'fcp', 'cls', 'aktarim', 'dom', 'yuk', 'nav', 'load', 'menu', 'dil', 'secim']) if (d[0][k] !== undefined) o[k] = ort(d.map(x => x[k]));
  o.kapakAd = d[0].kapakAd; o.lcpEl = d[0].lcpEl; o.lcpTum = d.map(x => Math.round(x.lcp)).join('/'); o.clsEnBuyuk = Math.max(...d.map(x => x.cls));
  sonuc[profil + ':' + surum] = o;
  console.log(profil, surum, JSON.stringify(o));
}
const html = { onceki: readFileSync(CIKTI + '/kok/olcum/onceki/index.html'), yeni: readFileSync(CIKTI + '/kok/olcum/yeni/index.html') };
const parca = (h, r) => (h.toString('utf8').match(r) || []).map(x => Buffer.byteLength(x)).reduce((a, c) => a + c, 0);
const fmt = (v, ek = '') => (typeof v === 'number' ? (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(v < 1 ? 4 : 1)) : v) + ek;
function tablo(profil, baslik) {
  const a = sonuc[profil + ':onceki'], y = sonuc[profil + ':yeni'];
  satir.push(baslik, '  ölçü                               önceki        revize');
  const r = (ad, k, ek = '') => { if (a[k] === undefined) return; satir.push('  ' + ad.padEnd(34) + String(fmt(a[k], ek)).padEnd(14) + fmt(y[k], ek)); };
  r('LCP (ms)', 'lcp'); satir.push('  ' + 'LCP öğesi'.padEnd(34) + String(a.lcpEl).padEnd(22) + y.lcpEl, '  ' + 'LCP, beş ölçüm (ms)'.padEnd(34) + a.lcpTum.padEnd(28) + y.lcpTum);
  r('kapak görseli indi (ms)', 'kapak'); satir.push('  ' + 'kapak görseli dosyası'.padEnd(34) + String(a.kapakAd).padEnd(14) + y.kapakAd);
  r('FCP (ms)', 'fcp'); r('CLS (ortanca)', 'cls'); r('CLS (beş ölçümün en büyüğü)', 'clsEnBuyuk'); r('DOMContentLoaded (ms)', 'nav'); r('load (ms)', 'load');
  r('toplam aktarım, yerel (bayt)', 'aktarim'); r('DOM öğe sayısı', 'dom'); r('sayfa yüksekliği (px)', 'yuk');
  r('etkileşim: menü aç → kare (ms)', 'menu'); r('etkileşim: dil değiştir → kare (ms)', 'dil'); r('etkileşim: tarife seç → kare (ms)', 'secim'); satir.push('');
}
tablo('telefon', 'TELEFON (375×667, 4× işlemci, yavaş 4G)'); tablo('masaustu', 'MASAÜSTÜ (1440×900)');
satir.push('HTML', '  ölçü                               önceki        revize',
  '  ' + 'HTML (bayt)'.padEnd(34) + String(html.onceki.length).padEnd(14) + html.yeni.length,
  '  ' + 'HTML gzip -9 (bayt)'.padEnd(34) + String(gzipSync(html.onceki, { level: 9 }).length).padEnd(14) + gzipSync(html.yeni, { level: 9 }).length,
  '  ' + 'satır içi stil (bayt)'.padEnd(34) + String(parca(html.onceki, /<style>[\s\S]*?<\/style>/g)).padEnd(14) + parca(html.yeni, /<style>[\s\S]*?<\/style>/g),
  '  ' + 'satır içi betik (bayt)'.padEnd(34) + String(parca(html.onceki, /<script>[\s\S]*?<\/script>/g)).padEnd(14) + parca(html.yeni, /<script>[\s\S]*?<\/script>/g), '',
  'Notlar', '  - Etkileşim süresi: olayın tetiklenmesinden sonraki ikinci animasyon karesine kadar; 60 Hz ekranda en az ~17–33 ms çıkar.',
  '  - Toplam aktarım yalnız yerel sunucudan gelenleri sayar (HTML + kapak görseli + logo); yazı tipleri dahil değildir.',
  '  - Telefonda Chromium, ekranı tümüyle kaplayan kapak görselini LCP adayı saymıyor; LCP metin öğesidir. Görselin indiği an ayrı satırda verildi.',
  '  - Önceki sürümde telefon LCP değerini kapaktaki giriş animasyonu geciktiriyordu (metin 0,7 sn içinde beliriyordu); revizede animasyon yok.',
  '  - Telefon LCP değeri sıkıştırmasız HTML ile ölçüldü; üretimde HTML sıkıştırılmış gelir, değer bundan düşük olur. Ölçülmedi.');
writeFileSync(CIKTI + '/r2/performans.txt', satir.join('\n') + '\n');
console.log('\n' + satir.join('\n'));
await b.close();
