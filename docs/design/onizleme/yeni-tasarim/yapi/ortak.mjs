import { createRequire } from 'module';
const require = createRequire('/opt/node-tools/node_modules/');
export const { chromium } = require('playwright');
export const TABAN = 'http://127.0.0.1:8765';
export const SAYFA = process.env.SAYFA_URL || (TABAN + '/docs/design/onizleme/yeni-tasarim/index.html');
// Önceki hazırlık sürümü (bc826d4) yalnız scratchpad'deki ölçüm kökünden sunulur: python3 -m http.server 8766 (CIKTI/kok içinde)
export const ONCEKI = process.env.ONCEKI_URL || 'http://127.0.0.1:8766/olcum/onceki/index.html';
export const CIKTI = process.env.CIKTI_DIZIN || '/tmp/claude-0/-home-user-website/25c75427-f784-5804-91b7-4539c0d36614/scratchpad/yeni-tasarim';
// Sektör görselleri: gerçek dosya img/ klasöründe yoksa (henüz üretilmemişse) YALNIZ TESTTE aynı ölçüde düz lacivert bir
// görsel döndürülür; dosya varsa isteğe dokunulmaz. Sayfaya ya da klasöre hiçbir şey yazılmaz.
import { existsSync } from 'fs';
const IMG_DIZIN = new URL('../img/', import.meta.url).pathname;
export const SEKTOR_ADLARI = ['demir-celik', 'kimya', 'osb', 'lojistik', 'cam-seramik', 'veri-merkezi', 'tekstil'];
export const eksikGorseller = () => SEKTOR_ADLARI.flatMap(a => [480, 800, 1200].map(n => `sektor-${a}-${n}.webp`)).filter(f => !existsSync(IMG_DIZIN + f));
let notr = null;
export async function sektorYedegi(context) {
  await context.route(/\/img\/sektor-[a-z-]+-(480|800|1200)\.webp$/, async (route) => {
    const ad = new URL(route.request().url()).pathname.split('/').pop();
    if (existsSync(IMG_DIZIN + ad)) return route.fallback();
    if (!notr) {
      const c = await context.browser().newContext(); const y = await c.newPage(); await y.goto('about:blank');
      const veri = await y.evaluate(() => [[480, 320], [800, 533], [1200, 800]].map(([w, h]) => { const k = document.createElement('canvas'); k.width = w; k.height = h; const x = k.getContext('2d'); x.fillStyle = '#131B36'; x.fillRect(0, 0, w, h); return [w, k.toDataURL('image/webp', 0.6).split(',')[1]]; }));
      notr = Object.fromEntries(veri.map(([w, b]) => [w, Buffer.from(b, 'base64')])); await c.close();
    }
    return route.fulfill({ status: 200, contentType: 'image/webp', body: notr[+ad.match(/-(\d+)\.webp$/)[1]] });
  });
}
// 24 saatlik örnek TEST verisi (yalnız taklit yanıt; sayfaya yazılmaz)
export function ornekVeri(eksik = []) {
  const items = [];
  for (let h = 0; h < 24; h++) {
    if (eksik.includes(h)) continue;
    items.push({ hour: h, price: +(2100 + 600 * Math.sin((h - 6) / 24 * Math.PI * 2) + h * 7.31).toFixed(2) });
  }
  return { items, date: new Date().toISOString().slice(0, 10) };
}
// ptf: 'canli' | 'kapali' | {items…}
export async function hazirla(context, { ptf = 'canli', lead = null, eksik = [], dis = true } = {}) {
  await context.route('https://epias-proxy.emirhantan-ku.workers.dev/**', async (route) => {
    const u = route.request().url();
    if (ptf === 'kapali') return route.abort('connectionrefused');
    if (u.endsWith('/ptf/today')) return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(ornekVeri(eksik)) });
    if (u.endsWith('/ptf/stats')) return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ monthAvg: 2345.67, monthRange: '2026-11-01..23' }) });
    return route.fulfill({ status: 404, body: '' });
  });
  await sektorYedegi(context);
  // yazı tipleri: dış ana makineler bu ortamda kapalı olabilir; istekleri hızla sonlandır
  if (dis) await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await context.route('**/api/lead', async (route) => {
    if (lead) return lead(route);
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
}
