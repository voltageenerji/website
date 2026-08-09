// Sansür UX provası: sunucu blocked_name döndüğünde özel mesaj görünmeli, form açık kalmalı.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const server = spawn('python3', ['-m', 'http.server', '5173'], { cwd: '/home/user/website', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.route('**/api/score', async (route) => {
  if (route.request().method() === 'GET') await route.fulfill({ json: { ok: true, board: [] } });
  else await route.fulfill({ status: 400, json: { ok: false, error: 'blocked_name' } });
});
await page.goto('http://localhost:5173/404.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.keyboard.press('Space');
await page.waitForFunction(() => window.__g404?.debug.state === 'over', null, { timeout: 120000 });
await page.waitForTimeout(1000);
const formVisible = await page.evaluate(() => !document.getElementById('gLbForm').hidden);
if (!formVisible) { console.log('SKIP: skor 12 MWh altında, form yok (bot şanssız öldü)'); }
else {
  await page.fill('#gLbName', 'KötüKelime');
  await page.click('#gLbSubmit');
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({
    msg: document.getElementById('gLbMsg').textContent,
    msgVisible: !document.getElementById('gLbMsg').hidden,
    formStillVisible: !document.getElementById('gLbForm').hidden,
    btnEnabled: !document.getElementById('gLbSubmit').disabled,
  }));
  console.log('BLOCKED UX:', JSON.stringify(r));
}
console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
server.kill();
