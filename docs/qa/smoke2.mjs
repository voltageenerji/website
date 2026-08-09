// İkinci prova: (a) prefers-reduced-motion → statik yedek görünmeli,
// (b) mobil görünüm + dokunuşla oyun başlamalı, (c) sekme gizlenince duraklamalı.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '5173'], { cwd: '/home/user/website', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

// (a) Hareket azaltma
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/404.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => ({
    gOn: document.body.classList.contains('g-on'),
    fallback: getComputedStyle(document.getElementById('gFallback')).display !== 'none',
    links: Array.from(document.querySelectorAll('#gFallback a')).map((a) => a.getAttribute('href')),
  }));
  console.log('REDUCED-MOTION:', JSON.stringify(r));
  await page.screenshot({ path: 'shot-5-fallback.png' });
  await ctx.close();
}

// (b) Mobil + dokunuş
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5173/404.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const boot = await page.evaluate(() => ({ gOn: document.body.classList.contains('g-on'), press: document.getElementById('gPress').textContent }));
  console.log('MOBILE boot:', JSON.stringify(boot));
  await page.touchscreen.tap(195, 500);
  await page.waitForTimeout(4000);
  console.log('MOBILE state:', JSON.stringify(await page.evaluate(() => window.__g404.debug)));
  await page.screenshot({ path: 'shot-6-mobile.png' });
  // Sekme gizlenince duraklama
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(400);
  const paused = await page.evaluate(() => document.getElementById('gPauseOv').classList.contains('show'));
  console.log('AUTO-PAUSE on hidden:', paused);
  console.log('MOBILE errors:', errors.length ? errors.join(' | ') : 'none');
  await ctx.close();
}

await browser.close();
server.kill();
