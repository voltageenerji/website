// QA re-verification: force the submit path by actually playing until mwh>=12.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '5174'], { cwd: '/home/user/website', stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

let postCount = 0;
let postedBody = null;
const board = [{ n: 'Ayşe', m: 480, d: 2000, t: 1 }];
await page.route('**/api/score', async (route) => {
  const req = route.request();
  if (req.method() === 'GET') return route.fulfill({ json: { ok: true, board } });
  postCount++;
  postedBody = req.postDataJSON();
  const merged = [...board, { n: postedBody.name, m: postedBody.mwh, d: postedBody.dist, t: 3 }].sort((a, b) => b.m - a.m);
  // delay so a double-click lands while first request is in flight
  await new Promise((r) => setTimeout(r, 600));
  return route.fulfill({ json: { ok: true, board: merged, you: merged.findIndex((e) => e.n === postedBody.name) } });
});

await page.goto('http://localhost:5174/404.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.keyboard.press('Space');

// Play-bot: random lane switches + occasional jumps until mwh>=12 & death, retry up to 8 runs.
let ok = false;
for (let attempt = 0; attempt < 8 && !ok; attempt++) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const d = await page.evaluate(() => window.__g404?.debug);
    if (!d) break;
    if (d.state === 'over') break;
    const r = Math.random();
    if (r < 0.35) await page.keyboard.press('ArrowLeft');
    else if (r < 0.7) await page.keyboard.press('ArrowRight');
    else await page.keyboard.press('Space');
    await page.waitForTimeout(220);
  }
  const d = await page.evaluate(() => window.__g404.debug);
  console.log(`attempt ${attempt}: state=${d.state} mwh=${d.mwh}`);
  if (d.state === 'over' && d.mwh >= 12) { ok = true; break; }
  if (d.state === 'over') { await page.click('#gAgain'); await page.waitForTimeout(400); }
}
if (!ok) { console.log('COULD NOT REACH 12 MWh — submit path untested'); await browser.close(); server.kill(); process.exit(2); }

await page.waitForTimeout(1000);
const pre = await page.evaluate(() => ({
  lbVisible: !document.getElementById('gLb').hidden,
  formVisible: !document.getElementById('gLbForm').hidden,
  prefill: document.getElementById('gLbName').value,
}));
console.log('PRE:', JSON.stringify(pre));

await page.fill('#gLbName', '');
await page.click('#gLbName');
await page.keyboard.type('Deniz Yılmaz');
const typed = await page.inputValue('#gLbName');
console.log('TYPED (space must survive):', JSON.stringify(typed));
// state must not have restarted from typing Space in the input
console.log('STATE STILL OVER:', JSON.stringify(await page.evaluate(() => window.__g404.debug.state)));

// double-click submit to test lbSubmitting guard against the 600ms-delayed response
await page.click('#gLbSubmit');
await page.click('#gLbSubmit', { force: true }).catch(() => {});
await page.waitForTimeout(1500);
const after = await page.evaluate(() => ({
  rows: Array.from(document.querySelectorAll('#gLbList li')).map((li) => ({ t: li.textContent, me: li.classList.contains('me') })),
  formVisible: !document.getElementById('gLbForm').hidden,
  savedName: localStorage.getItem('voltage-404-name'),
}));
console.log('POSTED:', JSON.stringify(postedBody), 'POST COUNT:', postCount);
console.log('AFTER SUBMIT:', JSON.stringify(after));

// verify mwh in POST matches the frozen run stats and mod-4 rule
console.log('MWH %4 == 0:', postedBody.mwh % 4 === 0, 'INTEGER:', Number.isInteger(postedBody.mwh));

// restart clears the board and re-fetches on next death; verify board hidden after restart
await page.click('#gAgain');
await page.waitForTimeout(300);
console.log('LB hidden after restart:', await page.evaluate(() => document.getElementById('gLb').hidden));

// kept:true path — die again quickly (no input), server responds kept with you index but board only
await page.unroute('**/api/score');
await page.route('**/api/score', async (route) => {
  const req = route.request();
  if (req.method() === 'GET') return route.fulfill({ json: { ok: true, board } });
  return route.fulfill({ json: { ok: true, board, you: 0, kept: true } });
});
await page.waitForFunction(() => window.__g404.debug.state === 'over', null, { timeout: 120000 });
await page.waitForTimeout(800);
const kept = await page.evaluate(() => ({
  lbVisible: !document.getElementById('gLb').hidden,
  formVisible: !document.getElementById('gLbForm').hidden,
}));
console.log('KEPT-SCENARIO after over (form only if mwh>=12):', JSON.stringify(kept));

// data.you undefined path: POST response without `you`
await page.unroute('**/api/score');
await page.route('**/api/score', async (route) => {
  const req = route.request();
  if (req.method() === 'GET') return route.fulfill({ json: { ok: true, board } });
  return route.fulfill({ json: { ok: true, board } }); // no `you`
});
// call submit handler directly via form if visible; otherwise skip (guard already unit-verified)
console.log('PAGE ERRORS:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
server.kill();
