#!/usr/bin/env node
/**
 * Google Search Console verisini resmî API ile dışa aktarır.
 *
 *   node tools/gsc-export.mjs                 # son 28 gün + önceki 28 gün + 90 gün
 *   node tools/gsc-export.mjs --inspect       # + site haritasındaki URL'lerin dizin durumu
 *   node tools/gsc-export.mjs --out DIR       # çıktı klasörü (varsayılan: gsc-data/, git'e girmez)
 *
 * Kimlik: servis hesabı anahtarı, ortam değişkeninde (kurulum: docs/seo/GSC-API-KURULUM.md)
 *   GSC_SA_KEY_B64   JSON anahtar dosyasının base64 hâli (önerilen, tek satır)
 *   GSC_SA_KEY       JSON anahtarın kendisi
 *   GSC_SA_KEY_FILE  JSON anahtar dosyasının yolu (repo DIŞINDA olmalı)
 *   GSC_SITE         mülk (varsayılan: sc-domain:voltage.com.tr)
 *
 * Kurallar (CLAUDE.md 5 ve 6): anahtar hiçbir zaman ekrana veya dosyaya yazılmaz; çıktı
 * repoya girmez; repo herkese açık olduğu için GitHub Actions içinde çalışmayı reddeder.
 * Bağımlılık yok: Node 18+ (fetch, crypto).
 */
import { createSign } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));

const TOKEN_URL = process.env.GSC_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const API = process.env.GSC_API_BASE || 'https://searchconsole.googleapis.com';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const SITE = process.env.GSC_SITE || 'sc-domain:voltage.com.tr';
const ROW_LIMIT = Number(process.env.GSC_ROW_LIMIT) || 25000;
const LAG_DAYS = 3; // Search Console verisi 2–3 gün geriden gelir

const args = process.argv.slice(2);
const OUT = resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : join(REPO, 'gsc-data'));
const INSPECT = args.includes('--inspect');

function fail(msg, code = 1) { console.error('HATA: ' + msg); process.exit(code); }

if (process.env.GITHUB_ACTIONS === 'true') {
  fail('Repo herkese açık: Search Console verisi CI günlüğüne veya artefaktına konmaz. Aracı Claude oturumunda çalıştırın.');
}

/** p repo içinde mi? (repo kökünün kendisi dâhil) */
function insideRepo(p) {
  const rel = relative(REPO, resolve(p));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}
// Çıktı repoya girmez: repo içindeyse yalnızca git'e girmeyen gsc-data/ altına izin var
const relData = relative(join(REPO, 'gsc-data'), OUT);
const underData = relData === '' || (!relData.startsWith('..') && !isAbsolute(relData));
if (insideRepo(OUT) && !underData) {
  fail(`Çıktı klasörü repo içinde (${relative(REPO, OUT) || '.'}). Repo herkese açık: gsc-data/ veya repo dışı bir klasör kullanın.`);
}

function loadKey() {
  let raw = null;
  try {
    if (process.env.GSC_SA_KEY_B64) raw = Buffer.from(process.env.GSC_SA_KEY_B64.trim(), 'base64').toString('utf8');
    else if (process.env.GSC_SA_KEY) raw = process.env.GSC_SA_KEY;
    else if (process.env.GSC_SA_KEY_FILE) {
      if (insideRepo(process.env.GSC_SA_KEY_FILE)) fail('Anahtar dosyası repo içinde. Repo herkese açık: dosyayı repo dışına taşıyın veya GSC_SA_KEY_B64 kullanın.');
      raw = readFileSync(process.env.GSC_SA_KEY_FILE, 'utf8');
    }
  } catch (e) { fail('Anahtar okunamadı (' + e.code + ').'); }
  if (!raw) fail('GSC_SA_KEY_B64 tanımlı değil. Kurulum: docs/seo/GSC-API-KURULUM.md');
  let k;
  try { k = JSON.parse(raw); } catch (e) { fail('Anahtar geçerli bir JSON değil (base64 doğru mu?).'); }
  if (!k.client_email || !k.private_key) fail('Anahtarda client_email veya private_key yok: servis hesabı JSON anahtarı mı?');
  return { email: k.client_email, pem: k.private_key };
}

const b64url = (b) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: key.email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  let sig;
  try { sig = b64url(createSign('RSA-SHA256').update(`${head}.${claim}`).sign(key.pem)); }
  catch (e) { fail('Anahtar imzalanamadı: private_key bozuk olabilir.'); }
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    fail(`Google erişim belirteci alınamadı (HTTP ${r.status}, ${j.error || 'bilinmiyor'}). ` +
      'Anahtar iptal edilmiş, saat kaymış veya proje silinmiş olabilir.');
  }
  return j.access_token;
}

async function api(token, method, path, body, { soft = false } = {}) {
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  const gmsg = (j.error && j.error.message) || '';
  if (!r.ok && soft) return { __status: r.status, __message: gmsg };
  if (r.status === 403) {
    fail(`Erişim reddedildi (403): servis hesabı (${process.env.__GSC_EMAIL}) ${SITE} mülküne erişemiyor. ` +
      'Kurulum adımı 1.3 (API etkin mi) ve 3 (mülke kullanıcı olarak ekli mi). ' + (gmsg ? `Google: ${gmsg}` : ''));
  }
  if (!r.ok) fail(`API hatası (HTTP ${r.status}) ${path.split('?')[0]}: ${gmsg}`.trim());
  return j;
}

const SITE_PATH = `/webmasters/v3/sites/${encodeURIComponent(SITE)}`;

async function query(token, startDate, endDate, dimensions = []) {
  const rows = [];
  for (let startRow = 0; ; startRow += ROW_LIMIT) {
    const j = await api(token, 'POST', `${SITE_PATH}/searchAnalytics/query`,
      { startDate, endDate, dimensions, rowLimit: ROW_LIMIT, startRow, dataState: 'final' });
    const page = j.rows || [];
    rows.push(...page);
    if (page.length < ROW_LIMIT) break;
  }
  return rows.map((r) => {
    const o = {};
    dimensions.forEach((d, i) => { o[d] = r.keys[i]; });
    return Object.assign(o, { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
  });
}

function day(offset) {
  const d = new Date(Date.now() - offset * 86400000);
  return d.toISOString().slice(0, 10);
}

function csv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  // CSV formül enjeksiyonuna karşı (= + - @ ile başlayan hücreler) ve tırnaklama
  const cell = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [cols.join(',')].concat(rows.map((r) => cols.map((c) => cell(r[c])).join(','))).join('\n') + '\n';
}

const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';
const num = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');

function summary(w, t, tp, q, qPrev, pages, band) {
  const delta = (a, b) => (b ? ((a - b) / b * 100).toFixed(0) + '%' : 'yok');
  const prevMap = new Map(qPrev.map((r) => [r.query, r]));
  const L = [];
  L.push(`# Search Console özeti — ${SITE}`, '');
  L.push(`Dönem: **${w.cur[0]} – ${w.cur[1]}** · önceki dönem: ${w.prev[0]} – ${w.prev[1]} · veri durumu: final`, '');
  L.push('| Metrik | Bu dönem | Önceki dönem | Değişim |', '|---|---:|---:|---:|');
  L.push(`| Tıklama | ${t.clicks} | ${tp.clicks} | ${delta(t.clicks, tp.clicks)} |`);
  L.push(`| Gösterim | ${t.impressions} | ${tp.impressions} | ${delta(t.impressions, tp.impressions)} |`);
  L.push(`| CTR | ${pct(t.ctr)} | ${pct(tp.ctr)} | |`);
  L.push(`| Ort. pozisyon | ${num(t.position)} | ${num(tp.position)} | |`);
  L.push(`| Sorgu sayısı | ${q.length} | ${qPrev.length} | |`, '');
  L.push('## Gösterime göre ilk 20 sorgu', '', '| Sorgu | Tık | Gösterim | CTR | Poz. | Önceki poz. |', '|---|---:|---:|---:|---:|---:|');
  for (const r of q.slice(0, 20)) {
    const p = prevMap.get(r.query);
    L.push(`| ${r.query.replace(/\|/g, '/')} | ${r.clicks} | ${r.impressions} | ${pct(r.ctr)} | ${num(r.position)} | ${p ? num(p.position) : 'yok'} |`);
  }
  L.push('', `## 8–20 bandı (${band.length} sorgu)`, '', '| Sorgu | Gösterim | Poz. | Sayfa |', '|---|---:|---:|---|');
  for (const r of band.slice(0, 40)) L.push(`| ${r.query.replace(/\|/g, '/')} | ${r.impressions} | ${num(r.position)} | ${r.page.replace('https://voltage.com.tr', '')} |`);
  L.push('', '## Sayfalar', '', '| Sayfa | Tık | Gösterim | CTR | Poz. |', '|---|---:|---:|---:|---:|');
  for (const r of pages.slice(0, 25)) L.push(`| ${r.page.replace('https://voltage.com.tr', '') || '/'} | ${r.clicks} | ${r.impressions} | ${pct(r.ctr)} | ${num(r.position)} |`);
  return L.join('\n') + '\n';
}

async function main() {
  const key = loadKey();
  process.env.__GSC_EMAIL = key.email;
  const token = await accessToken(key);
  const end = day(LAG_DAYS);
  const w = { cur: [day(LAG_DAYS + 27), end], prev: [day(LAG_DAYS + 55), day(LAG_DAYS + 28)], q90: [day(LAG_DAYS + 89), end] };

  const byImpr = (a, b) => b.impressions - a.impressions;
  const [tot] = (await query(token, ...w.cur)).concat([{ clicks: 0, impressions: 0, ctr: 0, position: 0 }]);
  const [totPrev] = (await query(token, ...w.prev)).concat([{ clicks: 0, impressions: 0, ctr: 0, position: 0 }]);
  const data = {
    queries_28d: (await query(token, ...w.cur, ['query'])).sort(byImpr),
    queries_prev28d: (await query(token, ...w.prev, ['query'])).sort(byImpr),
    pages_28d: (await query(token, ...w.cur, ['page'])).sort(byImpr),
    pages_prev28d: (await query(token, ...w.prev, ['page'])).sort(byImpr),
    query_page_28d: (await query(token, ...w.cur, ['query', 'page'])).sort(byImpr),
    devices_28d: await query(token, ...w.cur, ['device']),
    countries_28d: (await query(token, ...w.cur, ['country'])).sort(byImpr),
    queries_90d: (await query(token, ...w.q90, ['query'])).sort(byImpr),
    pages_90d: (await query(token, ...w.q90, ['page'])).sort(byImpr),
    daily_90d: await query(token, ...w.q90, ['date']),
  };
  const band = data.query_page_28d.filter((r) => r.position >= 8 && r.position <= 20);

  // Önce performans verisi diske yazılır: URL denetimi sonradan hata verse de kaybolmaz
  mkdirSync(OUT, { recursive: true });
  const meta = { site: SITE, generatedAt: new Date().toISOString(), windows: w, dataState: 'final' };
  writeFileSync(join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
  writeFileSync(join(OUT, 'totals.json'), JSON.stringify({ windows: w, current: tot, previous: totPrev }, null, 1));
  for (const [name, rows] of Object.entries(data)) writeFileSync(join(OUT, name + '.csv'), csv(rows));
  writeFileSync(join(OUT, 'band_8_20.csv'), csv(band));
  const md = summary(w, tot, totPrev, data.queries_28d, data.queries_prev28d, data.pages_28d, band);
  writeFileSync(join(OUT, 'OZET.md'), md);
  let files = Object.keys(data).length + 4;

  const sm = await api(token, 'GET', `${SITE_PATH}/sitemaps`, null, { soft: true });
  writeFileSync(join(OUT, 'sitemaps.json'), JSON.stringify(sm.__status ? { error: sm.__status, message: sm.__message } : (sm.sitemap || []), null, 1));
  files++;

  let inspections = null;
  if (INSPECT) {
    const SM = join(REPO, 'sitemap.xml');
    const locs = existsSync(SM) ? [...readFileSync(SM, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]) : [];
    inspections = [];
    for (const url of locs) {
      const j = await api(token, 'POST', '/v1/urlInspection/index:inspect', { inspectionUrl: url, siteUrl: SITE, languageCode: 'tr-TR' }, { soft: true });
      if (j.__status) {
        inspections.push({ url, verdict: 'ERROR', coverageState: `HTTP ${j.__status} ${j.__message}`.trim() });
        if (j.__status === 429) { console.error('URL denetimi kotası doldu (429); kalan URL\'ler atlandı.'); break; }
        if (j.__status === 403) { console.error('URL denetimi 403: servis hesabının iznini Search Console\'da "Tam" yapın (kurulum adımı 3). Kalan URL\'ler atlandı.'); break; }
        continue;
      }
      const s = (j.inspectionResult && j.inspectionResult.indexStatusResult) || {};
      inspections.push({ url, verdict: s.verdict, coverageState: s.coverageState, indexingState: s.indexingState,
        pageFetchState: s.pageFetchState, robotsTxtState: s.robotsTxtState, lastCrawlTime: s.lastCrawlTime,
        googleCanonical: s.googleCanonical, userCanonical: s.userCanonical });
    }
    writeFileSync(join(OUT, 'url_inspection.csv'), csv(inspections));
    files++;
  }

  console.log(md);
  console.log(`Dosyalar: ${OUT}/ (${files} dosya). Bu klasör git'e girmez; repoya kopyalamayın.`);
  if (inspections) {
    const notIndexed = inspections.filter((i) => i.verdict !== 'PASS');
    console.log(`URL denetimi: ${inspections.length} URL, ${notIndexed.length} tanesi dizinde değil, sorunlu veya denetlenemedi.`);
    for (const i of notIndexed) console.log(`  ${i.url}  ${i.verdict}  ${i.coverageState || ''}`);
  }
}

main().catch((e) => fail(e && e.message ? e.message : String(e)));
