// CPU tahmini (node V8, process.cpuUsage): Workers ölçümü DEĞİLDİR, yalnız büyüklük mertebesi.
// Sahte EPİAŞ yanıtları önceden üretilir (üretim maliyeti ölçüme girmez); KV taklidinde JSON.parse
// ölçüme girer (Workers'ta da get(..., 'json') ayrıştırması süreç CPU'sudur).
// Çalıştırma: node docs/epias-proxy/piyasa-modulu/olcum/cpu.mjs
import { piyasaIstegi, piyasaZamanli, _bellekTemizle } from '../piyasa.js';
import { sahteEpias, SAHTE_ENV, ANAHTAR_1 } from '../test-verisi.mjs';

console.error = () => {};
const istAn = (g, h, m = 0) => Date.parse(`${g}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+03:00`);
const cpuMs = async (is) => { const t = process.cpuUsage(); await is(); const d = process.cpuUsage(t); return (d.user + d.system) / 1000; };
const ctx = { bekleyen: [], waitUntil(p) { this.bekleyen.push(p); } };
const bitir = async () => { while (ctx.bekleyen.length) await Promise.allSettled(ctx.bekleyen.splice(0)); };
const ozet = (d) => { const s = [...d].sort((a, b) => a - b); return `medyan ${s[Math.floor(s.length / 2)].toFixed(2)} ms, p90 ${s[Math.floor(s.length * 0.9)].toFixed(2)} ms, en çok ${s.at(-1).toFixed(2)} ms (n=${s.length})`; };

const uretici = sahteEpias();
const hazir = new Map();
const fetchHazir = async (u, i) => {
  if (u.includes('/cas/v1/tickets')) return new Response('TGT-123456-sahteBilet', { status: 201 });
  if (!hazir.has(i.body)) hazir.set(i.body, await (await uretici.fetch(u, i)).text());
  return new Response(hazir.get(i.body), { status: 200 });
};
const yeniKv = () => {
  const depo = new Map();
  return {
    depo,
    get: async (k) => (Array.isArray(k) ? new Map(k.map((x) => [x, depo.has(x) ? JSON.parse(depo.get(x)) : null])) : depo.has(k) ? JSON.parse(depo.get(k)) : null),
    put: async (k, v) => { depo.set(k, v); },
  };
};
const ortam = (ek) => { const kv = yeniKv(); return { kv, env: { ...SAHTE_ENV, PIYASA_ETKIN: '1', PIYASA_OKUMA_ANAHTARI: ANAHTAR_1, PIYASA_KV: kv, PIYASA_CRON_ASGARI_SN: '0', ...ek } }; };
const tur = (env, an) => piyasaZamanli({ cron: '*/10 * * * *' }, env, ctx, { fetch: fetchHazir, simdi: () => an, cache: null });
const istek = (env, an, q) => piyasaIstegi(new Request('https://h.invalid/piyasa/v1/dengesizlik?' + q, { headers: { Authorization: 'Bearer ' + ANAHTAR_1 } }), env, ctx, { fetch: fetchHazir, simdi: () => an, cache: null });

const sonuc = { 'gece turu: dün+bugün + 8 günlük dilim doldurma (varsayılan)': [], 'gece turu: dün+bugün + 31 günlük ay doldurma (PIYASA_DILIM_GUN=31)': [], 'gündüz turu: yalnız dün+bugün': [], 'istek: 31 günlük aralık, süreç belleği boş, KV dolu (toplu okuma)': [], 'istek: tek gün, bellekten': [] };
const [A, B, C, D, E] = Object.keys(sonuc);
for (let i = 0; i < 25; i++) {
  _bellekTemizle();
  let o = ortam({});
  const t1 = await cpuMs(async () => { await tur(o.env, istAn('2026-11-24', 3, 5)); await bitir(); });
  _bellekTemizle();
  o = ortam({ PIYASA_DILIM_GUN: '31' });
  const t2 = await cpuMs(async () => { await tur(o.env, istAn('2026-11-24', 3, 5)); await bitir(); }); // Ocak'ı doldurur
  const t3 = await cpuMs(async () => { await tur(o.env, istAn('2026-11-24', 14, 0)); await bitir(); });
  _bellekTemizle();
  const t4 = await cpuMs(async () => { const r = await istek(o.env, istAn('2026-11-24', 14, 1), 'bas=2026-01-01&bit=2026-01-31'); if (r.status !== 200) throw new Error('beklenmeyen ' + r.status); await r.text(); await bitir(); });
  const t5 = await cpuMs(async () => { const r = await istek(o.env, istAn('2026-11-24', 14, 1), 'tarih=2026-01-15'); await r.text(); });
  if (i < 5) continue; // ısınma (JIT); ilk soğuk çağrı ayrıca aşağıda
  sonuc[A].push(t1); sonuc[B].push(t2); sonuc[C].push(t3); sonuc[D].push(t4); sonuc[E].push(t5);
}
for (const [ad, d] of Object.entries(sonuc)) console.log(`${ad}: ${ozet(d)}`);
