// Test sunucusu: /dengesizlik-maliyeti ve /dengesizlik-maliyeti/veri rotalarını GERÇEK
// fonksiyon modülleriyle, SAHTE EPİAŞ'la (ağ yok) sunar. wrangler gerekmez.
// !!! Sunulan fiyatlar UYDURMA TEST VERİSİDİR (docs/qa/dengesizlik-test-verisi.mjs).
import http from 'node:http';
import { readFileSync } from 'node:fs';
import * as sayfa from '../../functions/dengesizlik-maliyeti.js';
import * as veriUcu from '../../functions/dengesizlik-maliyeti/veri.js';
import { _bellekTemizle } from '../../functions/_lib/epias.js';
import { sahteEpias, SAHTE_ENV } from './dengesizlik-test-verisi.mjs';

const KABUK = new URL('../../dengesizlik-maliyeti.html', import.meta.url);
// Sitenin GERÇEK içerik güvenlik politikası (_headers, "/*" kuralı): HTML yanıtlarına eklenir,
// böylece tarayıcı testleri (satır içi betik, fetch, blob indirme) üretimdeki CSP altında koşar.
const CSP = (/^\/\*\n(?:[^\n]*\n)*?\s+Content-Security-Policy: ([^\n]+)/m.exec(readFileSync(new URL('../../_headers', import.meta.url), 'utf8')) || [])[1];

/**
 * ayar: sahteEpias ayarları + { env } (varsayılan SAHTE_ENV; {} → kimlik yok).
 * Dönen nesne: { url, port, epias, kapat(), ayarla(yeni) }
 */
export async function sunucuBaslat(ayar = {}) {
  _bellekTemizle();
  const durum = { epias: sahteEpias(ayar), env: ayar.env || SAHTE_ENV };
  const sunucu = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://yerel');
      // Accept başlığı iletilir: uç, tarayıcıdan doğrudan açılınca HTML hata sayfası döner.
      const istek = new Request('https://voltage.com.tr' + req.url, { method: req.method, headers: req.headers.accept ? { Accept: req.headers.accept } : {} });
      const ctx = {
        request: istek,
        env: durum.env,
        secenek: { fetch: durum.epias.fetch, simdi: durum.epias.simdi, cache: null },
        waitUntil() {},
        next: async () => new Response(readFileSync(KABUK, 'utf8'), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ETag: '"kabuk"' },
        }),
      };
      let r;
      if (u.pathname === '/dengesizlik-maliyeti') r = await (req.method === 'HEAD' ? sayfa.onRequestHead(ctx) : sayfa.onRequestGet(ctx));
      else if (u.pathname === '/dengesizlik-maliyeti/veri') r = await (req.method === 'HEAD' ? veriUcu.onRequestHead(ctx) : veriUcu.onRequestGet(ctx));
      else if (u.pathname === '/kabuk') r = await ctx.next(); // SSR'sız statik kabuk (istemci çizimi testleri)
      else if (/^\/(favicon\.(svg|ico)|apple-touch-icon\.png)$/.test(u.pathname)) r = new Response(null, { status: 204 });
      else r = new Response('yok', { status: 404 });
      const basliklar = {};
      r.headers.forEach((v, k) => { basliklar[k] = v; });
      if (CSP && (basliklar['content-type'] || '').startsWith('text/html')) basliklar['content-security-policy'] = CSP;
      res.writeHead(r.status, basliklar);
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      res.writeHead(500); res.end('test sunucusu hatasi: ' + (e && e.message));
    }
  });
  await new Promise((coz) => sunucu.listen(0, '127.0.0.1', coz));
  const port = sunucu.address().port;
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    get epias() { return durum.epias; },
    /** EPİAŞ davranışını değiştirir (süreç belleği de sıfırlanır). */
    ayarla(yeni = {}) { _bellekTemizle(); durum.epias = sahteEpias(yeni); durum.env = yeni.env || SAHTE_ENV; },
    kapat: () => new Promise((coz) => sunucu.close(coz)),
  };
}
