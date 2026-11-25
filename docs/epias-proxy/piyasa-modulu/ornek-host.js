/**
 * ÖRNEK HOST — mevcut epias-proxy'nin YERİNE GEÇEN, onu taklit eden asgari bir Worker.
 *
 * !!! Bu dosya gerçek proxy kodu DEĞİLDİR (gerçek kod henüz elimizde yok). Amaç: piyasa.js'in
 * README'de tarif edilen iki kanca satırıyla bağlandığında mevcut uçların yanıtını (durum kodu,
 * başlıklar, gövde) BAYT BAYT değiştirmediğini kanıtlamak. Uç adları ve gövde biçimleri
 * website'ın bugün okuduğu alanlardan alındı (functions/canli-ptf.js: /ptf/today {items[{hour,price}]};
 * CHANGELOG: /ptf/stats {dayAvg, monthAvg, monthRange, publishedAt}). Fiyatlar UYDURMADIR.
 *
 * mevcutFetch / mevcutScheduled = "kancasız" proxy (karşılaştırma tabanı).
 * default = aynı proxy + iki kanca satırı (aşağıda "KANCA" işaretli).
 */
import { piyasaIstegi, piyasaZamanli } from './piyasa.js';

const IZINLI_KOKEN = 'https://voltage.com.tr';
const UCLAR = ['/health', '/ptf/today', '/ptf/stats', '/ptf/range'];

function corsBasliklari(request) {
  const koken = request.headers.get('Origin');
  return koken === IZINLI_KOKEN ? { 'Access-Control-Allow-Origin': IZINLI_KOKEN, Vary: 'Origin' } : { Vary: 'Origin' };
}
function json(govde, durum, basliklar) {
  return new Response(JSON.stringify(govde), { status: durum, headers: { 'Content-Type': 'application/json; charset=utf-8', ...basliklar } });
}
function an(env) {
  const sabit = env && typeof env.ORNEK_SABIT_AN === 'string' ? Date.parse(env.ORNEK_SABIT_AN) : NaN;
  return Number.isFinite(sabit) ? sabit : Date.now();
}
const istanbulGun = (ms) => new Date(ms + 3 * 3600 * 1000).toISOString().slice(0, 10);
/** UYDURMA saatlik PTF (test verisi; gerçek piyasa değeri değildir). */
const sahteSaatlik = (gun) => Array.from({ length: 24 }, (_, h) => ({ hour: h, price: 2000 + h * 10 + (+gun.slice(8, 10)) }));

/** Kancasız (mevcut) yönlendirici. */
export async function mevcutFetch(request, env, ctx) {
  const url = new URL(request.url);
  const cors = corsBasliklari(request);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' } });
  }
  const simdi = an(env);
  const bugun = istanbulGun(simdi);
  switch (url.pathname) {
    case '/health':
      return json({ ok: true, service: 'epias-proxy', time: new Date(simdi).toISOString() }, 200, cors);
    case '/ptf/today':
      return json({ date: bugun, items: sahteSaatlik(bugun), updatedAt: new Date(simdi).toISOString() }, 200, { ...cors, 'Cache-Control': 'public, max-age=300' });
    case '/ptf/stats': {
      const gunluk = sahteSaatlik(bugun).map((x) => x.price);
      const ort = gunluk.reduce((a, b) => a + b, 0) / gunluk.length;
      return json({ dayAvg: ort, monthAvg: ort - 5, monthRange: `${bugun.slice(0, 8)}01..${+bugun.slice(8, 10)}`, publishedAt: new Date(simdi).toISOString() }, 200, { ...cors, 'Cache-Control': 'public, max-age=1800' });
    }
    case '/ptf/range': {
      const from = url.searchParams.get('from'), to = url.searchParams.get('to');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || from > to) {
        return json({ error: 'bad_request', message: 'from/to YYYY-MM-DD' }, 400, cors);
      }
      const items = [];
      for (let g = from, i = 0; g <= to && i < 31; i++) {
        for (const x of sahteSaatlik(g)) items.push({ date: g, ...x });
        g = new Date(Date.parse(g + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
      }
      return json({ from, to, items }, 200, { ...cors, 'Cache-Control': 'public, max-age=1800' });
    }
    default:
      return json({ error: 'not_found', endpoints: UCLAR }, 404, cors);
  }
}

/** Kancasız zamanlanmış görev (mevcut proxy'de olup olmadığı bilinmiyor; burada sayaç). */
export const mevcutZamanliSayaci = { n: 0 };
export async function mevcutScheduled(controller, env, ctx) { mevcutZamanliSayaci.n++; }

export default {
  async fetch(request, env, ctx) {
    const piyasaYaniti = await piyasaIstegi(request, env, ctx); if (piyasaYaniti) return piyasaYaniti; // KANCA 1
    return mevcutFetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(piyasaZamanli(controller, env, ctx)); // KANCA 2
    return mevcutScheduled(controller, env, ctx);
  },
};
