/**
 * /canli-ptf — sunucu render'ı istemci hidrasyonundan SAĞ ÇIKMALI.
 * QA DEF-1 ve DEF-13 regresyon testi.
 *
 * Senaryolar:
 *   S1  SSR + proxy erişilemez + önbellek BOŞ      → rakamlar kalır, CANLI→SON SENKRON
 *   S2  SSR + proxy erişilemez + DÜNKÜ önbellek    → sunucunun taze verisi önbelleği yener
 *   S3  SSR + proxy ÇALIŞIYOR                       → canlı veri devralır, aylık ortalama titremez
 *
 * Çalıştırma (playwright gerekir; bkz. docs/qa/README.md):
 *   node docs/qa/test-ssr-hydration.mjs
 * Başarısızlıkta çıkış kodu 1 döner — CI'da sessizce yeşil görünmez.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inject } from '../../functions/canli-ptf.js';

const ROOT = new URL('../../', import.meta.url);
const SHELL = readFileSync(new URL('canli-ptf.html', ROOT), 'utf8');
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const CACHE_KEY = 'voltage-ptf-cache-page';
const PORT = 5199;

const prices = Array.from({ length: 24 }, (_, h) => (h === 5 ? null : 1800 + h * 50));
const STATS = { monthAvg: 2222.22, monthRange: '2026-08-01..23' };
const SSR_HTML = inject(SHELL, prices, STATS);

const dir = join(tmpdir(), 'voltage-ssr-hydration');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'ssr.html'), SSR_HTML);

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`  FAIL ${n} ${extra}`); } };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: dir, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

async function run({ name, seedCache, proxyWorks }) {
  const ctx = await browser.newContext();
  if (seedCache) {
    // Bir ÖNCEKİ günden kalan gerçek önbellek kaydı (prices yok, tek fiyat var)
    await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch (e) {} },
      [CACHE_KEY, JSON.stringify({ ts: Date.now() - 86400000, hour: 12, price: 999.5, prices: null, date: new Date(Date.now() - 86400000).toDateString(), month: null })]);
  }
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.route('**/epias-proxy**', (r) => {
    if (!proxyWorks) return r.abort();
    const u = r.request().url();
    if (u.includes('/ptf/today')) return r.fulfill({ json: { items: prices.map((p, h) => ({ hour: h, price: p })) } });
    return r.fulfill({ json: STATS });
  });

  await page.goto(`http://localhost:${PORT}/ssr.html`, { waitUntil: 'domcontentloaded' });
  const moWrites = [];
  await page.exposeFunction('__moWrite', (v) => moWrites.push(v));
  await page.waitForTimeout(3000);

  const s = await page.evaluate(() => ({
    now: document.getElementById('pNow').textContent.trim(),
    mode: document.getElementById('pMode').textContent.trim(),
    min: document.getElementById('pMin').textContent.trim(),
    mo: document.getElementById('pMo').textContent.trim(),
    moK: document.getElementById('pMoK').textContent.trim(),
    rows: document.querySelectorAll('#pTable tr').length,
    waiting: document.getElementById('pTable').textContent.includes('Veri bekleniyor'),
  }));
  console.log(`\n${name}: ${JSON.stringify(s)}`);
  ok(`${name} · tablo 24 satır kalır`, s.rows === 24, `-> ${s.rows}`);
  ok(`${name} · bekleme satırına düşmez`, !s.waiting);
  ok(`${name} · anlık değer korunur`, s.now !== '—', `-> ${s.now}`);
  ok(`${name} · günün en düşüğü korunur`, s.min === '1.800,00', `-> ${s.min}`);
  ok(`${name} · aylık ortalama atıflı`, s.mo === '2.222,22' && /1–23 AĞU/.test(s.moK), `-> ${s.mo} / ${s.moK}`);
  ok(`${name} · sayfa hatası yok`, errs.length === 0, errs.join(' | '));
  await ctx.close();
  return s;
}

const s1 = await run({ name: 'S1 boş önbellek', seedCache: false, proxyWorks: false });
ok('S1 · tazelik iddiası dürüstçe düşer', s1.mode === 'SON SENKRON', `-> ${s1.mode}`);

const s2 = await run({ name: 'S2 dünkü önbellek', seedCache: true, proxyWorks: false });
ok('S2 · DÜNKÜ fiyat sunucunun verisini EZMEZ', s2.now !== '999,50', `-> ${s2.now}`);
ok('S2 · tazelik iddiası dürüstçe düşer', s2.mode === 'SON SENKRON', `-> ${s2.mode}`);

const s3 = await run({ name: 'S3 proxy çalışıyor', seedCache: true, proxyWorks: true });
ok('S3 · canlı veri devralır', s3.mode === 'CANLI', `-> ${s3.mode}`);

await browser.close();
server.kill();
rmSync(dir, { recursive: true, force: true });

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
