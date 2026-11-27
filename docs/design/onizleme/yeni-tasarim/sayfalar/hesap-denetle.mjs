// /elektrik-faturasi-hesaplama davranış denetimi: canlı sayfa (önce) ↔ üretilen sayfa (sonra). Sayfanın kendi tarayıcı testi
// yok; bu betik yeni kabuğun ve stilin üç aracın davranışını değiştirmediğini gösterir. Depoya yalnız
// sonuclar/hesap-denetim.txt yazılır. Sitenin gerçek CSP başlığı (_headers, /*) her yanıta eklenir. Ağ yok.
//   H  aynı girdiler → aynı çıktı: 26 senaryo (boş, geçerli, geçersiz, sıfır, kalem dağılımı, geçersiz kalem, toplam farkı,
//      1. araçtan aktarma ve geri alma, olağandışı yüksek birim, 2026 eşikleri: 500 / 501, 4.000 / 4.001, 15.000 / 15.001,
//      binlik ayraç, ondalık virgül); her sonuç kutusunun sınıfı ve HTML'i ile 2. aracın birim alanı bayt bayt aynı
//   Y  yalnız klavye: Tab sırası (form denetimleri) önce ve sonra aynı; açılır alan Enter ile açılır; abone grubu ok
//      tuşuyla değişir; klavyeyle girilen değerler fareyle girilenle aynı sonucu verir; her durakta görünür odak (≥ 2 px)
//   T  320 / 390 / 768 / 1440 px, bütün sonuçlar dolu ve açılır alan açıkken yatay taşma yok
//   Kullanım (depo dışındaki bir dizinden): [PLAYWRIGHT_MODUL=/opt/node-tools/node_modules/] node <bu dosya>
import http from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';

const KOK = new URL('../../../../../', import.meta.url);
const BURASI = new URL('./', import.meta.url);
const pw = createRequire(process.env.PLAYWRIGHT_MODUL || '/opt/node-tools/node_modules/')('playwright');
const SAYFA = 'elektrik-faturasi-hesaplama.html';
const HTML = { once: readFileSync(new URL(SAYFA, KOK)), sonra: readFileSync(new URL('cikti/' + SAYFA, BURASI)) };
const CSP = /\n\/\*\n(?:  .*\n)*?  Content-Security-Policy: (.*)\n/.exec(readFileSync(new URL('_headers', KOK), 'utf8'))[1];

const sunucu = http.createServer((q, r) => {
  const hal = q.url.split('/')[1];
  if (!HTML[hal]) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': CSP });
  r.end(HTML[hal]);
});
await new Promise((r) => sunucu.listen(0, '127.0.0.1', r));
const TABAN = `http://127.0.0.1:${sunucu.address().port}`;

const satir = [];
let kalan = 0, gecen = 0;
const yaz = (s = '') => { satir.push(s); console.log(s); };
const ok = (ad, kosul, ek = '') => { if (kosul) gecen++; else kalan++; yaz(`  ${kosul ? 'GEÇTİ' : 'KALDI'}  ${ad}${ek ? ' — ' + ek : ''}`); };

const browser = await pw.chromium.launch({ args: ['--no-sandbox'] });
async function ac(hal, w = 1280, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: 'tr-TR' });
  await ctx.route(/fonts\.g|cloudflareinsights/, (r) => r.abort());
  const page = await ctx.newPage();
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) hatalar.push(m.text()); });
  await page.goto(`${TABAN}/${hal}/`, { waitUntil: 'load' });
  return { page, hatalar, kapat: () => ctx.close() };
}
const durum = (page) => page.evaluate(() => Object.fromEntries([['t1Out', 'out'], ['t2Out', 'out'], ['t3Out', 'out']].map(([id]) => {
  const e = document.getElementById(id); return [id, `${e.className} | ${e.innerHTML}`];
}).concat([['t2Birim', document.getElementById('t2Birim').value], ['detay', String(document.querySelector('#t1 details').open)]])));
const bekle = (page) => page.waitForTimeout(400); // betiğin 250 ms gecikmesi

// ---- H: senaryolar (her biri temiz sayfada; adımlar sırayla) ----
const S = (ad, ...adim) => ({ ad, adim });
const SENARYO = [
  S('boş sayfa (ilk hâl)'),
  S('1. araç: 2.450,80 TL / 520 kWh → 2. araca aktarma', ['t1Tutar', '2.450,80'], ['t1Kwh', '520']),
  S('1. araç: noktalı ondalık 2450.80', ['t1Tutar', '2450.80'], ['t1Kwh', '520']),
  S('1. araç: binlik ayraç 1.000 TL / 250 kWh', ['t1Tutar', '1.000'], ['t1Kwh', '250']),
  S('1. araç: sıfır kWh → uyarı', ['t1Tutar', '500'], ['t1Kwh', '0']),
  S('1. araç: geçersiz tutar → uyarı', ['t1Tutar', 'abc'], ['t1Kwh', '100']),
  S('1. araç: kalem dağılımı (dört kalem, toplam farkı notu)', ['t1Tutar', '2.450,80'], ['t1Kwh', '520'], ['ac'], ['t1Enerji', '1200'], ['t1Dagitim', '600'], ['t1Etv', '60'], ['t1Kdv', '400']),
  S('1. araç: kalemler toplamı tutar', ['t1Tutar', '2.260'], ['t1Kwh', '520'], ['ac'], ['t1Enerji', '1200'], ['t1Dagitim', '600'], ['t1Etv', '60'], ['t1Kdv', '400']),
  S('1. araç: geçersiz kalem', ['t1Tutar', '900'], ['t1Kwh', '300'], ['ac'], ['t1Enerji', 'x1'], ['t1Kdv', '150']),
  S('1. araç: aktarılan değer, kWh silinince 2. araçtan geri alınır', ['t1Tutar', '2.450,80'], ['t1Kwh', '520'], ['t1Kwh', '']),
  S('1. araç: olağandışı yüksek birim (1. araçtan) → 2. araçta uyarı', ['t1Tutar', '1000'], ['t1Kwh', '5']),
  S('2. araç: elle 4,71 TL/kWh ve 1000 kWh', ['t2Birim', '4,71'], ['t2Kwh', '1000']),
  S('2. araç: elle 471 → ondalık virgül uyarısı', ['t2Birim', '471']),
  S('2. araç: sıfır birim → uyarı', ['t2Birim', '0']),
  S('2. araç: geçersiz tüketim yok sayılır', ['t2Birim', '3,2'], ['t2Kwh', 'abc']),
  S('3. araç: mesken 300 kWh', ['t3Kwh', '300']),
  S('3. araç: mesken 500 kWh (eşik dahil değil)', ['t3Kwh', '500']),
  S('3. araç: mesken 501 kWh', ['t3Kwh', '501']),
  S('3. araç: mesken 4.000 kWh', ['t3Kwh', '4.000']),
  S('3. araç: mesken 4.001 kWh', ['t3Kwh', '4001']),
  S('3. araç: diğer 15.000 kWh', ['grup', 'diger'], ['t3Kwh', '15000']),
  S('3. araç: diğer 15.001 kWh', ['grup', 'diger'], ['t3Kwh', '15.001']),
  S('3. araç: diğer 1.000.000 kWh', ['grup', 'diger'], ['t3Kwh', '1.000.000']),
  S('3. araç: ondalık 450,5 kWh', ['t3Kwh', '450,5']),
  S('3. araç: geçersiz → uyarı, sonra silinir', ['t3Kwh', 'abc'], ['t3Kwh', '']),
  S('3. araç: grup sonradan değişir (5.000 kWh mesken → diğer)', ['t3Kwh', '5000'], ['grup', 'diger']),
];
async function uygula(page, adim) {
  for (const [id, deger] of adim) {
    if (id === 'ac') await page.click('#t1 summary');
    else if (id === 'grup') await page.selectOption('#t3Grup', deger);
    else await page.fill('#' + id, deger);
    await bekle(page);
  }
}
yaz(`# /elektrik-faturasi-hesaplama — önce/sonra davranış denetimi (Chromium ${browser.version()}, ${new Date().toISOString().slice(0, 16)}Z)`);
yaz(`# önce: canlı ${SAYFA} · sonra: cikti/${SAYFA} · CSP: _headers (/*)`);
yaz('\n=== H aynı girdi → aynı çıktı (sonuç kutularının sınıfı ve HTML\'i, 2. aracın birim alanı)');
const beklenen = {};
for (const s of SENARYO) {
  const cik = {};
  for (const hal of ['once', 'sonra']) {
    const { page, hatalar, kapat } = await ac(hal);
    await uygula(page, s.adim);
    cik[hal] = { ...(await durum(page)), hata: hatalar.join(' | ') };
    await kapat();
  }
  beklenen[s.ad] = cik.sonra;
  const ozet = cik.sonra.t1Out.split(' | ')[0] + ' / ' + cik.sonra.t2Out.split(' | ')[0] + ' / ' + cik.sonra.t3Out.split(' | ')[0];
  ok(`H ${s.ad}`, JSON.stringify(cik.once) === JSON.stringify(cik.sonra) && !cik.sonra.hata, `sınıflar: ${ozet}${cik.sonra.hata ? ' · HATA ' + cik.sonra.hata : ''}`);
}
// Yükümlülük metinleri sonuçta aynen (tahmini / teklif veya taahhüt değildir)
ok('H 2. aracın sonucunda "doğrusal bir hesaptır … fiyat teklifi veya taahhüdü değildir" notu', beklenen['2. araç: elle 4,71 TL/kWh ve 1000 kWh'].t2Out.includes('fiyat teklifi veya taahhüdü değildir'));

// ---- Y: yalnız klavye ----
yaz('\n=== Y yalnız klavye (1280 px)');
const SIRA = {};
for (const hal of ['once', 'sonra']) {
  const { page, kapat } = await ac(hal);
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  const duraklar = [];
  const kayit = async () => page.evaluate(() => {
    const e = document.activeElement; const st = getComputedStyle(e); const r = e.getBoundingClientRect();
    return { ad: e.id || (e.tagName === 'SUMMARY' ? 'summary' : e.tagName + (e.getAttribute('href') ? `[${e.getAttribute('href')}]` : '')),
      cerceve: (st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 2) || (st.boxShadow && st.boxShadow !== 'none'), gorunur: r.bottom > 0 && r.top < innerHeight };
  });
  // Tab ile 1. araca kadar
  for (let i = 0; i < 120; i++) { await page.keyboard.press('Tab'); const d = await kayit(); duraklar.push(d); if (d.ad === 't1Tutar') break; }
  const yaz1 = async (metin) => { await page.keyboard.type(metin); };
  await yaz1('2.450,80'); await page.keyboard.press('Tab'); duraklar.push(await kayit());
  await yaz1('520'); await page.keyboard.press('Tab'); duraklar.push(await kayit());
  await page.keyboard.press('Enter'); // açılır alan
  for (const v of ['1200', '600', '60', '400']) { await page.keyboard.press('Tab'); duraklar.push(await kayit()); await yaz1(v); }
  // 2. araca: aradaki teklif bağlantısını geçerek
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); const d = await kayit(); duraklar.push(d); if (d.ad === 't2Birim') break; }
  await page.keyboard.press('Tab'); duraklar.push(await kayit()); await yaz1('1000');
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); const d = await kayit(); duraklar.push(d); if (d.ad === 't3Grup') break; }
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab'); duraklar.push(await kayit()); await yaz1('15001');
  await page.waitForTimeout(500);
  SIRA[hal] = { duraklar, durum: await durum(page) };
  await kapat();
}
const denetimler = (d) => d.filter((x) => /^t\d/.test(x.ad) || x.ad === 'summary').map((x) => x.ad);
ok('Y Tab sırası (form denetimleri ve açılır alan) önce ve sonra aynı', JSON.stringify(denetimler(SIRA.once.duraklar)) === JSON.stringify(denetimler(SIRA.sonra.duraklar)), denetimler(SIRA.sonra.duraklar).join(' → '));
ok('Y klavyeyle: açılır alan Enter ile açıldı, abone grubu ok tuşuyla "diğer" oldu', SIRA.sonra.durum.detay === 'true' && SIRA.sonra.durum.t3Out.includes('Bu abone grubu'));
ok('Y klavyeyle girilen değerlerin sonucu önce ve sonra aynı', JSON.stringify(SIRA.once.durum) === JSON.stringify(SIRA.sonra.durum));
{
  // Fareyle aynı girdiler: klavye sonucu = fare sonucu
  const { page, kapat } = await ac('sonra');
  await uygula(page, [['t1Tutar', '2.450,80'], ['t1Kwh', '520'], ['ac'], ['t1Enerji', '1200'], ['t1Dagitim', '600'], ['t1Etv', '60'], ['t1Kdv', '400'], ['t2Kwh', '1000'], ['grup', 'diger'], ['t3Kwh', '15001']]);
  const fare = await durum(page); await kapat();
  ok('Y klavye sonucu = fare (fill) sonucu', JSON.stringify(fare) === JSON.stringify(SIRA.sonra.durum));
}
const cercevesiz = SIRA.sonra.duraklar.filter((x) => !x.cerceve || !x.gorunur);
ok(`Y sonra: ${SIRA.sonra.duraklar.length} odak durağının hepsinde görünür çerçeve (≥ 2 px) ve öğe ekranda`, cercevesiz.length === 0, JSON.stringify(cercevesiz.slice(0, 4)));

// ---- T: taşma ----
yaz('\n=== T yatay taşma (bütün sonuçlar dolu, açılır alan açık)');
for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1440, 900]]) {
  const r = {};
  for (const hal of ['once', 'sonra']) {
    const { page, kapat } = await ac(hal, w, h);
    await uygula(page, [['t1Tutar', '12.345.678,90'], ['t1Kwh', '1.234.567'], ['ac'], ['t1Enerji', '6.000.000'], ['t1Dagitim', '3.000.000'], ['t1Etv', '300.000'], ['t1Kdv', '2.000.000'], ['t2Kwh', '1000000'], ['grup', 'diger'], ['t3Kwh', '20000']]);
    r[hal] = await page.evaluate(() => ({ sayfa: document.documentElement.scrollWidth > document.documentElement.clientWidth, sw: document.documentElement.scrollWidth,
      kutu: [...document.querySelectorAll('.out')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => `${e.id} ${e.scrollWidth}/${e.clientWidth}`) }));
    await kapat();
  }
  ok(`T ${w}px sonra: sayfada yatay taşma yok`, !r.sonra.sayfa, `scrollWidth ${r.sonra.sw}; sonuç kutusu içinde kayma: ${r.sonra.kutu.join(', ') || 'yok'} · önce: sayfa taşması ${r.once.sayfa ? 'VAR (' + r.once.sw + ')' : 'yok'}`);
}

await browser.close();
sunucu.close();
yaz(`\nSONUÇ: ${kalan === 0 ? `hepsi geçti (${gecen})` : kalan + ' denetim kaldı'}`);
writeFileSync(new URL('sonuclar/hesap-denetim.txt', BURASI), satir.join('\n') + '\n');
process.exit(kalan ? 1 : 0);
