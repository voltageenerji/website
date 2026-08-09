// Transmission Dash duman testi: sayfayı aç, oyunu başlat, hataları topla,
// FPS ölç, ekran görüntüleri al, çarpışma/skor akışını doğrula.
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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://localhost:5173/404.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const bootState = await page.evaluate(() => ({
  gOn: document.body.classList.contains('g-on'),
  fallbackVisible: getComputedStyle(document.getElementById('gFallback')).display !== 'none',
  hasGame: typeof window.__g404 !== 'undefined',
  webgl: (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })(),
}));
console.log('BOOT:', JSON.stringify(bootState));
await page.screenshot({ path: 'shot-1-intro.png' });

if (bootState.gOn) {
  // Oyunu başlat
  await page.keyboard.press('Space');
  await page.waitForTimeout(3500); // power-up biter
  console.log('STATE after powerup:', JSON.stringify(await page.evaluate(() => window.__g404.debug)));
  await page.screenshot({ path: 'shot-2-run.png' });

  // FPS ölçümü (2 sn)
  const fps = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(n / 2); };
    requestAnimationFrame(tick);
  }));
  console.log('FPS:', fps);

  // Girdi provaları: zıpla, hat değiştir, boost
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.down('Shift');
  await page.waitForTimeout(700);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(4000);
  console.log('STATE after inputs:', JSON.stringify(await page.evaluate(() => window.__g404.debug)));
  await page.screenshot({ path: 'shot-3-play.png' });

  // Pause / resume
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const pausedShown = await page.evaluate(() => document.getElementById('gPauseOv').classList.contains('show'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  console.log('PAUSE overlay worked:', pausedShown);

  // Ölüme kadar bekle (engele çarpana dek, en fazla 90 sn)
  const died = await page.waitForFunction(() => window.__g404.debug.state === 'over', null, { timeout: 90000 }).then(() => true).catch(() => false);
  console.log('DIED:', died, JSON.stringify(await page.evaluate(() => window.__g404.debug)));
  if (died) {
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'shot-4-over.png' });
    const overVisible = await page.evaluate(() => document.getElementById('gOver').classList.contains('show'));
    const stats = await page.evaluate(() => ({
      d: document.getElementById('gStatD').textContent,
      e: document.getElementById('gStatE').textContent,
      eff: document.getElementById('gStatEff').textContent,
      rank: document.getElementById('gRank').textContent,
    }));
    console.log('OVER panel:', overVisible, JSON.stringify(stats));
    // Tekrar oyna
    await page.click('#gAgain');
    await page.waitForTimeout(1200);
    console.log('RESTART:', JSON.stringify(await page.evaluate(() => window.__g404.debug)));
  }
}

console.log('CONSOLE ERRORS:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
server.kill();
