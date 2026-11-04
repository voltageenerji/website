// tools/gsc-export.mjs — sahte Google sunucusuyla uçtan uca test.
// Kullanım: node docs/qa/test-gsc-export.mjs
// Gerçek Google'a bağlanmaz. Anahtar çalışma anında üretilir; dosyaya yazılmaz.
import { createServer } from 'node:http';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL = fileURLToPath(new URL('../../tools/gsc-export.mjs', import.meta.url));
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, x); } };

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });
const EMAIL = 'gsc-okuyucu@voltage-test.iam.gserviceaccount.com';
const KEY_B64 = Buffer.from(JSON.stringify({ type: 'service_account', client_email: EMAIL, private_key: PEM })).toString('base64');
const PEM_BODY = PEM.split('\n')[5]; // anahtarın ortasından bir satır: çıktıda asla görünmemeli

let mode = 'ok';
const seen = { jwtValid: false, scope: null, aud: null, pages: 0, inspected: 0, auth: true };
const QUERIES = ['elektrik tedarikçi değiştirme', 'ptf', 'serbest tüketici limiti 2026', '=HYPERLINK("http://x")', 'sktt nedir', '\t+SUM(1)'];

const server = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (req.url === '/token') {
      const assertion = new URLSearchParams(body).get('assertion') || '';
      const [h, p, s] = assertion.split('.');
      const v = createVerify('RSA-SHA256'); v.update(`${h}.${p}`);
      seen.jwtValid = v.verify(publicKey, Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
      const claims = JSON.parse(Buffer.from(p, 'base64').toString());
      seen.scope = claims.scope; seen.aud = claims.aud; seen.iss = claims.iss;
      return send(200, { access_token: 'sahte-belirtec', expires_in: 3600 });
    }
    if (req.headers.authorization !== 'Bearer sahte-belirtec') seen.auth = false;
    if (mode === 'forbidden') return send(403, { error: { message: 'User does not have sufficient permission' } });
    if (mode === 'inspect403' && req.url === '/v1/urlInspection/index:inspect') { seen.inspected++; return send(403, { error: { message: 'Insufficient permission for URL inspection' } }); }
    if (req.url.endsWith('/searchAnalytics/query')) {
      seen.pages++;
      const q = JSON.parse(body);
      const dims = q.dimensions || [];
      let rows;
      if (!dims.length) rows = [{ keys: [], clicks: 42, impressions: 1300, ctr: 0.0323, position: 11.2 }];
      else if (dims[0] === 'query') rows = QUERIES.map((k, i) => ({ keys: dims.length > 1 ? [k, 'https://voltage.com.tr/rehber/sktt'] : [k], clicks: i, impressions: 100 - i * 10, ctr: 0.01 * i, position: 6 + i * 3 }));
      else if (dims[0] === 'page') rows = [{ keys: ['https://voltage.com.tr/canli-ptf'], clicks: 5, impressions: 300, ctr: 0.016, position: 13 }];
      else rows = [{ keys: [dims[0] === 'date' ? '2026-10-30' : 'x'], clicks: 1, impressions: 10, ctr: 0.1, position: 9 }];
      return send(200, { rows: rows.slice(q.startRow, q.startRow + q.rowLimit) });
    }
    if (req.url.endsWith('/sitemaps')) return send(200, { sitemap: [{ path: 'https://voltage.com.tr/sitemap.xml', isPending: false }] });
    if (req.url === '/v1/urlInspection/index:inspect') {
      seen.inspected++;
      const u = JSON.parse(body).inspectionUrl;
      return send(200, { inspectionResult: { indexStatusResult: { verdict: u.endsWith('/rehber/sktt') ? 'NEUTRAL' : 'PASS', coverageState: 'Submitted and indexed' } } });
    }
    send(404, { error: { message: 'yok' } });
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

function runTool(extraEnv, args) {
  const env = { PATH: process.env.PATH, GSC_TOKEN_URL: BASE + '/token', GSC_API_BASE: BASE, GSC_ROW_LIMIT: '2', ...extraEnv };
  return new Promise((resolve) => {
    // Sunucu bu süreçte çalıştığı için aracı alt süreçte, olay döngüsünü kilitlemeden çalıştır
    import('node:child_process').then(({ spawn }) => {
      const p = spawn(process.execPath, [TOOL, ...args], { env });
      let out = '', err = '';
      p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { err += d; });
      p.on('close', (code) => resolve({ code, out, err }));
    });
  });
}

// 1) Başarılı akış
const dir = mkdtempSync(join(tmpdir(), 'gsc-test-'));
const r = await runTool({ GSC_SA_KEY_B64: KEY_B64 }, ['--out', dir, '--inspect']);
ok('çıkış kodu 0', r.code === 0, r.err);
ok('JWT imzası anahtarla doğrulanıyor', seen.jwtValid);
ok('kapsam salt okunur', seen.scope === 'https://www.googleapis.com/auth/webmasters.readonly');
ok('JWT aud = token adresi, iss = servis hesabı', seen.aud === BASE + '/token' && seen.iss === EMAIL);
ok('her API çağrısında belirteç', seen.auth);
for (const f of ['meta.json', 'totals.json', 'queries_28d.csv', 'queries_prev28d.csv', 'pages_28d.csv', 'query_page_28d.csv',
  'devices_28d.csv', 'countries_28d.csv', 'queries_90d.csv', 'pages_90d.csv', 'daily_90d.csv', 'band_8_20.csv', 'sitemaps.json', 'url_inspection.csv', 'OZET.md']) {
  ok(`dosya: ${f}`, existsSync(join(dir, f)));
}
const qcsv = readFileSync(join(dir, 'queries_28d.csv'), 'utf8').trim().split('\n');
ok('sayfalama: 6 sorgunun hepsi alındı (sayfa boyu 2)', qcsv.length === 7, String(qcsv.length));
ok('CSV formül enjeksiyonu engelli', qcsv.some((l) => l.startsWith('"\'=HYPERLINK') || l.startsWith("'=HYPERLINK")));
ok('CSV: sekmeyle başlayan hücre de korunuyor', qcsv.some((l) => l.startsWith("'\t+SUM")));
const band = readFileSync(join(dir, 'band_8_20.csv'), 'utf8');
ok('8–20 bandı yalnızca 8 ≤ poz ≤ 20', band.includes('ptf') && band.includes('serbest') && !band.includes('tedarikçi değiştirme,0'));
const ozet = readFileSync(join(dir, 'OZET.md'), 'utf8');
ok('özet toplamları içeriyor', ozet.includes('| Tıklama | 42 | 42 |') && ozet.includes('Dönem: **'));
const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
const lag = (Date.now() - Date.parse(meta.windows.cur[1])) / 86400000;
ok('dönem sonu 3 gün geride (veri gecikmesi)', lag >= 3 && lag < 4.1, String(lag));
ok('28 günlük dönem', (Date.parse(meta.windows.cur[1]) - Date.parse(meta.windows.cur[0])) / 86400000 === 27);
const nSitemap = (readFileSync(fileURLToPath(new URL('../../sitemap.xml', import.meta.url)), 'utf8').match(/<loc>/g) || []).length;
ok(`URL denetimi site haritasındaki ${nSitemap} URL'nin hepsini kapsıyor`, seen.inspected === nSitemap);
ok('sorunlu URL listeleniyor', r.out.includes('/rehber/sktt  NEUTRAL'));
ok('anahtar çıktıda yok', !r.out.includes(PEM_BODY) && !r.err.includes(PEM_BODY) && !r.out.includes(KEY_B64.slice(40, 80)));
for (const f of ['totals.json', 'meta.json', 'OZET.md']) ok(`anahtar ${f} içinde yok`, !readFileSync(join(dir, f), 'utf8').includes(PEM_BODY));
rmSync(dir, { recursive: true, force: true });

// 2) Servis hesabı mülke eklenmemiş (403)
mode = 'forbidden';
const r403 = await runTool({ GSC_SA_KEY_B64: KEY_B64 }, ['--out', mkdtempSync(join(tmpdir(), 'gsc-test-'))]);
ok('403: çıkış kodu 1', r403.code === 1);
ok('403: Türkçe yol gösterici mesaj ve servis hesabı adı', r403.err.includes('Erişim reddedildi') && r403.err.includes(EMAIL));
ok('403: anahtar mesajda yok', !r403.err.includes(PEM_BODY));
mode = 'ok';

// 2b) URL denetimi 403 (Kısıtlı izin): performans verisi kaybolmaz, denetim ERROR olarak kaydedilir
mode = 'inspect403'; seen.inspected = 0;
const dir2 = mkdtempSync(join(tmpdir(), 'gsc-test-'));
const rI = await runTool({ GSC_SA_KEY_B64: KEY_B64 }, ['--out', dir2, '--inspect']);
ok('denetim 403: çıkış kodu 0', rI.code === 0, rI.err);
ok('denetim 403: performans dosyaları yazıldı', existsSync(join(dir2, 'OZET.md')) && existsSync(join(dir2, 'queries_28d.csv')));
ok('denetim 403: ERROR kaydı ve "Tam" izin önerisi', readFileSync(join(dir2, 'url_inspection.csv'), 'utf8').includes('ERROR') && rI.err.includes('Tam'));
ok('denetim 403: ilk 403\'te duruyor (kota israfı yok)', seen.inspected === 1, String(seen.inspected));
rmSync(dir2, { recursive: true, force: true });
mode = 'ok';

// 2c) Repo herkese açık: çıktı ve anahtar dosyası repo içine konamaz
const REPO_DIR = fileURLToPath(new URL('../..', import.meta.url));
const badOut = join(REPO_DIR, 'docs', 'seo', 'gsc-test-cikti');
const rOut = await runTool({ GSC_SA_KEY_B64: KEY_B64 }, ['--out', badOut]);
ok('repo içi --out reddediliyor', rOut.code === 1 && rOut.err.includes('repo içinde') && !existsSync(badOut));
const rKf = await runTool({ GSC_SA_KEY_FILE: join(REPO_DIR, 'docs', 'yok-anahtar.json') }, []);
ok('repo içi anahtar dosyası reddediliyor', rKf.code === 1 && rKf.err.includes('repo içinde'));

// 3) Anahtar yok / bozuk / CI
const rNo = await runTool({}, []);
ok('anahtar yok: kurulum rehberine yönlendiriyor', rNo.code === 1 && rNo.err.includes('GSC-API-KURULUM.md'));
const rBad = await runTool({ GSC_SA_KEY_B64: Buffer.from('bozuk').toString('base64') }, []);
ok('bozuk anahtar: anlaşılır hata', rBad.code === 1 && rBad.err.includes('geçerli bir JSON değil'));
const rCi = await runTool({ GSC_SA_KEY_B64: KEY_B64, GITHUB_ACTIONS: 'true' }, []);
ok('GitHub Actions içinde çalışmayı reddediyor', rCi.code === 1 && rCi.err.includes('herkese açık'));
const rCi2 = await runTool({ GSC_SA_KEY_B64: KEY_B64, GITHUB_ACTIONS: 'true', GSC_ALLOW_CI: '1' }, []);
ok('CI atlama yolu yok (GSC_ALLOW_CI etkisiz)', rCi2.code === 1 && rCi2.err.includes('herkese açık'));

server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
