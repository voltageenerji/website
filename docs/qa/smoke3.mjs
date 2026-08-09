// Lider tablosu uçtan uca provası — /api/score Playwright route ile taklit edilir
// (python http.server Pages Functions çalıştıramaz; sözleşme unit testte doğrulandı).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '5173'], { cwd: '/home/user/website', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

let postedBody = null;
const board = [{ n: 'Ayşe', m: 480, d: 2000, t: 1 }, { n: 'Mehmet', m: 120, d: 700, t: 2 }];
await page.route('**/api/score', async (route) => {
  const req = route.request();
  if (req.method() === 'GET') {
    await route.fulfill({ json: { ok: true, board } });
  } else if (req.method() === 'POST') {
    postedBody = req.postDataJSON();
    const merged = [...board, { n: postedBody.name, m: postedBody.mwh, d: postedBody.dist, t: 3 }]
      .sort((a, b) => b.m - a.m);
    await route.fulfill({ json: { ok: true, board: merged, you: merged.findIndex((e) => e.n === postedBody.name) } });
  }
});

await page.goto('http://localhost:5173/404.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.keyboard.press('Space');
// Ölüme kadar bekle
const died = await page.waitForFunction(() => window.__g404?.debug.state === 'over', null, { timeout: 120000 }).then(() => true).catch(() => false);
console.log('DIED:', died, JSON.stringify(await page.evaluate(() => window.__g404.debug)));
await page.waitForTimeout(1200);

const lbState = await page.evaluate(() => ({
  lbVisible: !document.getElementById('gLb').hidden,
  rows: Array.from(document.querySelectorAll('#gLbList li')).map((li) => li.textContent),
  formVisible: !document.getElementById('gLbForm').hidden,
}));
console.log('LB after over:', JSON.stringify(lbState));

if (lbState.formVisible) {
  await page.fill('#gLbName', '');
  await page.click('#gLbName');
  await page.keyboard.type('Deniz Yılmaz'); // boşluklu isim — SPACE guard testi
  const typed = await page.inputValue('#gLbName');
  console.log('TYPED (space must survive):', JSON.stringify(typed));
  await page.click('#gLbSubmit');
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    rows: Array.from(document.querySelectorAll('#gLbList li')).map((li) => ({ t: li.textContent, me: li.classList.contains('me') })),
    formVisible: !document.getElementById('gLbForm').hidden,
    savedName: localStorage.getItem('voltage-404-name'),
  }));
  console.log('POSTED:', JSON.stringify(postedBody));
  console.log('AFTER SUBMIT:', JSON.stringify(after));
  await page.screenshot({ path: 'shot-7-leaderboard.png' });
} else {
  console.log('SKOR 12 MWh altında kaldı — form gizli (beklenen davranış), yeniden koşup paket toplattırmak gerek.');
}

// Backend kapalıyken tablo gizlenmeli
await page.unroute('**/api/score');
await page.route('**/api/score', (route) => route.fulfill({ status: 503, json: { ok: false, error: 'no_persistence' } }));
await page.click('#gAgain');
await page.waitForFunction(() => window.__g404.debug.state === 'over', null, { timeout: 120000 }).catch(() => {});
await page.waitForTimeout(900);
console.log('LB hidden on 503:', await page.evaluate(() => document.getElementById('gLb').hidden));

console.log('PAGE ERRORS:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
server.kill();
