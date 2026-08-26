/**
 * Yönetim paneli uçtan uca testi.
 *
 * GERÇEK fonksiyon modülleri (login.js / leads.js / lib/admin-auth.js) bir Node
 * sunucusuna bağlanır ve GERÇEK panel.html onlara karşı sürülür. Böylece
 * kimlik doğrulama kodu ile arayüz birlikte sınanır; yalnız arayüz taklidi değil.
 *
 * Playwright gerekir — bkz. docs/qa/README.md.
 *   node docs/qa/test-panel.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { hashPassword } from '../../lib/admin-auth.js';
import { onRequestPost as loginPost, onRequestDelete as logoutDelete } from '../../functions/api/admin/login.js';
import { onRequestGet as leadsGet } from '../../functions/api/admin/leads.js';

const ROOT = new URL('../../', import.meta.url);
const PANEL_HTML = readFileSync(new URL('panel.html', ROOT), 'utf8');
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const PORT = 5210;
const USER = 'emirhan';
const PASS = 'panel-test-parolasi-2026';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) { pass++; console.log(`  ok  ${n}`); } else { fail++; console.log(`  FAIL ${n} ${extra}`); } };

// --- Sahte KV: gerçek uçların beklediği sözleşme ---
const store = new Map();
const SECTORS = ['Tekstil', 'Demir-Çelik', 'Kimya', 'Veri Merkezi', 'Soğuk Zincir'];
for (let i = 0; i < 128; i++) {
  const ts = Date.now() - i * 3600e3;
  store.set(`lead:${ts}:k${i}`, JSON.stringify({
    ad: `Ad${i}`, soyad: `Soyad${i}`, sirket: i === 0 ? 'Zebra Tekstil A.Ş.' : `Firma ${i}`,
    telefon: `053200000${String(i).padStart(2, '0')}`, eposta: `k${i}@ornek.com`,
    tuketim: '250 MWh', sektor: SECTORS[i % SECTORS.length],
    mesaj: i === 0 ? 'Aciliyeti var, "tırnaklı" ve <etiketli> not'
      : i === 1 ? "=cmd|'/c calc.exe'!A1"
      : i === 2 ? '+HYPERLINK("http://kotu.example","tikla")'
      : i === 3 ? '-2+3+cmd|\' /C calc\'!A0'
      : i === 4 ? '@SUM(1+1)' : `Not ${i}`,
    lang: 'tr', utm: i % 7 === 0 ? { utm_source: 'linkedin' } : {},
    receivedAt: new Date(ts).toISOString(),
  }));
}
const kv = {
  get: async (k) => (store.has(k) ? store.get(k) : null),
  put: async (k, v) => { store.set(k, v); },
  delete: async (k) => { store.delete(k); },
  list: async ({ prefix, cursor }) => {
    const all = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
    const start = cursor ? Number(cursor) : 0;
    const slice = all.slice(start, start + 1000);
    return { keys: slice.map((name) => ({ name })), list_complete: start + slice.length >= all.length, cursor: String(start + slice.length) };
  },
};

const env = {
  ADMIN_USER: USER,
  ADMIN_PASS_HASH: await hashPassword(PASS),
  ADMIN_SESSION_SECRET: 'panel-testi-oturum-anahtari',
  LEADS: kv,
};

// --- Node HTTP → Workers Request/Response köprüsü ---
const server = createServer(async (req, res) => {
  const url = `http://localhost:${PORT}${req.url}`;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const request = new Request(url, { method: req.method, headers: req.headers, body, duplex: 'half' });

  let out;
  try {
    if (req.url.startsWith('/api/admin/login')) {
      out = req.method === 'DELETE' ? await logoutDelete() : await loginPost({ env, request });
    } else if (req.url.startsWith('/api/admin/leads')) {
      out = await leadsGet({ env, request });
    } else if (req.url === '/' || req.url.startsWith('/panel')) {
      out = new Response(PANEL_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    } else {
      out = new Response('not found', { status: 404 });
    }
  } catch (e) {
    out = new Response(`server error: ${e.message}`, { status: 500 });
  }
  res.statusCode = out.status;
  out.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await out.arrayBuffer()));
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));

await page.goto(`http://localhost:${PORT}/panel`, { waitUntil: 'networkidle' });

// 1) Giriş ekranı görünür, panel gizli
ok('giriş ekranı görünür', await page.isVisible('#loginView'));
ok('panel oturumsuz GİZLİ', !(await page.isVisible('#panelView')));
ok('veri DOM\'a sızmamış', !(await page.content()).includes('k0@ornek.com'));

// 2) Yanlış parola
await page.fill('#u', USER);
await page.fill('#p', 'yanlis-parola');
await page.click('#loginBtn');
await page.waitForSelector('#loginMsg:not([hidden])');
ok('yanlış parola mesajı', (await page.textContent('#loginMsg')).includes('hatalı'));
ok('yanlış paroladan sonra panel hâlâ gizli', !(await page.isVisible('#panelView')));

// 3) Doğru giriş
await page.fill('#p', PASS);
await page.click('#loginBtn');
await page.waitForSelector('#panelView:not([hidden])', { timeout: 15000 });
ok('doğru bilgiyle panel açılır', await page.isVisible('#panelView'));
ok('parola alanı temizlenir', (await page.inputValue('#p')) === '');

await page.waitForFunction(() => document.querySelectorAll('#rows tr').length > 1, null, { timeout: 15000 });
const s = await page.evaluate(() => ({
  rows: document.querySelectorAll('#rows tr').length,
  total: document.getElementById('sTotal').textContent,
  more: !document.getElementById('moreBtn').hidden,
  firstCells: [...document.querySelectorAll('#rows tr')[0].children].map((td) => td.textContent.trim()),
}));
ok('ilk sayfa 100 kayıt', s.rows === 100, `-> ${s.rows}`);
ok('toplam sayaç doğru', s.total === '128', `-> ${s.total}`);
ok('daha fazla düğmesi görünür', s.more);
ok('en yeni kayıt en üstte', s.firstCells[1] === 'Ad0 Soyad0', `-> ${s.firstCells[1]}`);
ok('şirket sütunu dolu', s.firstCells[2] === 'Zebra Tekstil A.Ş.');

// 4) XSS: tırnak/etiket içeren not metin olarak basılmalı
const noteHtml = await page.evaluate(() => document.querySelectorAll('#rows tr')[0].querySelector('td.note').innerHTML);
ok('not alanı kaçışlı (enjeksiyon yok)', noteHtml.includes('&lt;etiketli&gt;') && !noteHtml.includes('<etiketli>'), `-> ${noteHtml}`);

// 5) Arama
await page.fill('#q', 'zebra');
await page.waitForTimeout(300);
ok('arama filtreler', (await page.evaluate(() => document.querySelectorAll('#rows tr').length)) === 1);
await page.fill('#q', 'kesinlikle-yok-boyle-bir-sey');
await page.waitForTimeout(300);
ok('sonuç yoksa boş durum', await page.isVisible('#emptyState'));
await page.fill('#q', '');
await page.waitForTimeout(300);

// 6) Sayfalama
await page.click('#moreBtn');
await page.waitForFunction(() => document.querySelectorAll('#rows tr').length > 100, null, { timeout: 15000 });
const after = await page.evaluate(() => ({ rows: document.querySelectorAll('#rows tr').length, more: !document.getElementById('moreBtn').hidden }));
ok('daha fazla yükle tümünü getirir', after.rows === 128, `-> ${after.rows}`);
ok('son sayfada düğme gizlenir', !after.more);
ok('mükerrer kayıt yok', await page.evaluate(() => {
  const names = [...document.querySelectorAll('#rows tr')].map((tr) => tr.children[1].textContent);
  return new Set(names).size === names.length;
}));

// 7) CSV
const dl = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#csvBtn')]).then((x) => x[0]).catch(() => null);
ok('CSV indirilir', !!dl && /voltage-talepler-\d{4}-\d{2}-\d{2}\.csv/.test(dl.suggestedFilename()), dl ? dl.suggestedFilename() : 'indirme yok');

// QA B3: hiçbir hücre formül tetikleyicisiyle BAŞLAMAMALI (Excel onu çalıştırır)
if (dl) {
  const { readFileSync: rf } = await import('node:fs');
  const csv = rf(await dl.path(), 'utf8');
  const cells = csv.match(/"(?:[^"]|"")*"/g) || [];
  const dangerous = cells.filter((c) => /^"[=+\-@\t\r]/.test(c));
  ok('B3: CSV formül enjeksiyonuna kapalı', dangerous.length === 0, `-> ${dangerous.slice(0, 3).join(' | ')}`);
  ok('B3: kaçışlı hâli hâlâ okunur', csv.includes("'=cmd|'/c calc.exe'!A1") || csv.includes("\"'=cmd"), 'değer kaybolmamalı');
  ok('B3: CSV gerçekten veri içeriyor', cells.length > 50, `-> ${cells.length} hücre`);
}

// 8) Çıkış → panel kapanır, veri erişilemez olur
await page.click('#logoutBtn');
await page.waitForSelector('#loginView', { timeout: 15000 });
ok('çıkıştan sonra giriş ekranı', await page.isVisible('#loginView'));
const afterLogout = await page.evaluate(async () => (await (await fetch('/api/admin/leads?limit=1')).json()).error);
ok('çıkıştan sonra veri ucu 401', afterLogout === 'unauthorized', `-> ${afterLogout}`);

ok('sayfa hatası yok', errs.length === 0, errs.join(' | '));

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
