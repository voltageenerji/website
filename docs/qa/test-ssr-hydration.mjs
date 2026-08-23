// SSR çıktısı istemci ilk boyamasından SAĞ ÇIKMALI (QA DEF-1 regresyon testi).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { inject } from '/home/user/website/functions/canli-ptf.js';

const SHELL = readFileSync('/home/user/website/canli-ptf.html', 'utf8');
const prices = Array.from({ length: 24 }, (_, h) => (h === 5 ? null : 1800 + h * 50));
mkdirSync('/tmp/ssrtmp', { recursive: true });
writeFileSync('/tmp/ssrtmp/ssr.html', inject(SHELL, prices, { monthAvg: 2222.22, monthRange: '2026-08-01..23' }));

const server = spawn('python3', ['-m', 'http.server', '5199'], { cwd: '/tmp/ssrtmp', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
// Proxy erişilemez: gerçek dünyada worker çökmüş senaryosu
await page.route('**/epias-proxy**', r => r.abort());
await page.goto('http://localhost:5199/ssr.html', { waitUntil: 'domcontentloaded' });

const t0 = await page.evaluate(() => ({ now: pNow.textContent, rows: document.querySelectorAll('#pTable tr').length }));
await page.waitForTimeout(3000);
const t1 = await page.evaluate(() => ({
  now: document.getElementById('pNow').textContent.trim(),
  mode: document.getElementById('pMode').textContent.trim(),
  min: document.getElementById('pMin').textContent.trim(),
  mo: document.getElementById('pMo').textContent.trim(),
  rows: document.querySelectorAll('#pTable tr').length,
  waiting: document.getElementById('pTable').textContent.includes('Veri bekleniyor'),
}));
console.log('ILK :', JSON.stringify(t0));
console.log('SONRA:', JSON.stringify(t1));
console.log('SONUC:', (t1.rows === 24 && !t1.waiting && t1.now !== '—' && t1.mode === 'SON SENKRON') ? 'GECTI — SSR verisi korundu, tazelik iddiasi dustu' : 'KALDI');
console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
await browser.close(); server.kill();
