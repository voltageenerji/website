import { createRequire } from 'module';
const require = createRequire('/opt/node-tools/node_modules/');
export const { chromium } = require('playwright');
export const TABAN = 'http://127.0.0.1:8765';
export const SAYFA = process.env.SAYFA_URL || (TABAN + '/docs/design/onizleme/yeni-tasarim/index.html');
export const CIKTI = process.env.CIKTI_DIZIN || '/tmp/claude-0/-home-user-website/25c75427-f784-5804-91b7-4539c0d36614/scratchpad/yeni-tasarim';
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
  // yazı tipleri: dış ana makineler bu ortamda kapalı olabilir; istekleri hızla sonlandır
  if (dis) await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await context.route('**/api/lead', async (route) => {
    if (lead) return lead(route);
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
}
