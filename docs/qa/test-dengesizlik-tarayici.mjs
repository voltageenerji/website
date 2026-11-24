/**
 * /dengesizlik-maliyeti — tarayıcı testleri (Playwright).
 *
 * Sayfa, GERÇEK fonksiyon modülleriyle (functions/dengesizlik-maliyeti.js ve
 * functions/dengesizlik-maliyeti/veri.js) küçük bir node http sunucusundan
 * sunulur; EPİAŞ sahtedir (ağ yok). wrangler gerekmez.
 * !!! Buradaki tüm fiyatlar UYDURMA TEST VERİSİDİR.
 *
 * Kapsam: hesaplayıcının iki modu (klavyeyle), formül sürüklenmesi (istemci =
 * kütüphane), indirme bağlantıları, 320/390/768/1440'ta yatay taşma, tablo
 * kaydırma kabı, konsol hataları, dürüst bekleme, tazelik merdiveni, istemci
 * çizimi = sunucu çizimi, kontrast, JS'siz kullanım, 2027 kapanışı.
 *
 * Çalıştırma: node docs/qa/test-dengesizlik-tarayici.mjs
 * Başarısızlıkta çıkış kodu 1 döner.
 */
import { createRequire } from 'node:module';
import { sunucuBaslat } from './dengesizlik-test-sunucu.mjs';
import { sahteGun, SABIT_AN } from './dengesizlik-test-verisi.mjs';
import { birimFiyat, kuralBul } from '../../functions/_lib/dengesizlik.js';
import { bicim } from '../../functions/dengesizlik-maliyeti.js';

const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) { pass++; } else { fail++; console.log(`  FAIL ${n} ${extra}`); } };
const bolum = (ad) => console.log(`# ${ad}`);

// Bugün (24.11.2026) 11 dönem yayımlanmış; 04:00–05:00 eşik altı (eksi pozitif fiyat). Diğer günler tam.
const OZEL = { ptf: 450, smf: 60, positiveImbalance: -106, negativeImbalance: 463.5, systemStatus: 'Enerji Fazlası' };
const gunVerisi = (n) => (g) => sahteGun(g, g === '2026-11-24' ? n : 24).map((o, i) => (i === 4 ? { ...o, ...OZEL } : o));
const S = await sunucuBaslat({ gun: gunVerisi(11) });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

/** Yeni sayfa: sabit saat (24.11.2026 14:30 İstanbul), yazı tipleri boş CSS, EPİAŞ hostlarına istek = hata. */
async function ac(yol, { w = 1280, h = 900, js = true, an = SABIT_AN, depo = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: js, locale: 'tr-TR', acceptDownloads: true });
  const page = await ctx.newPage();
  const kayit = { konsol: [], hata: [], epias: 0, veriIstek: 0 };
  page.on('console', (m) => { if (m.type() === 'error') kayit.konsol.push(m.text()); });
  page.on('pageerror', (e) => kayit.hata.push(e.message));
  page.on('request', (r) => { if (r.url().includes('/dengesizlik-maliyeti/veri')) kayit.veriIstek++; });
  await ctx.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route(/fonts\.gstatic\.com/, (r) => r.fulfill({ status: 200, body: '' }));
  // Tarayıcı EPİAŞ'a ASLA doğrudan gitmemeli (kimlik sunucuda); giderse sayılır ve kesilir.
  await ctx.route(/(giris|seffaflik)\.epias\.com\.tr|epias-proxy/, (r) => { kayit.epias++; return r.abort(); });
  if (js) {
    await page.clock.install({ time: new Date(an) });
    await page.addInitScript(() => {
      window.__cls = 0;
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    });
    if (depo) await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch (e) {} }, depo);
  }
  await page.goto(S.url + yol, { waitUntil: 'load' });
  if (js) await page.waitForTimeout(150);
  return { page, ctx, kayit, kapat: () => ctx.close() };
}
const metin = (page, sec) => page.locator(sec).first().textContent().then((t) => (t || '').replace(/\s+/g, ' ').trim());
const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth && document.body.scrollWidth <= document.documentElement.clientWidth);
const tabloOzeti = (page) => page.evaluate(() => [...document.querySelectorAll('#dTablo tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim()).join('|')));

/** Görünen her metin düğümü için WCAG kontrast oranı; 4.5'in altındakileri döndürür. */
const kontrastSorunlari = (page) => page.evaluate(() => {
  const ayir = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const kar = (u, a) => ({ r: u.r * u.a + a.r * (1 - u.a), g: u.g * u.a + a.g * (1 - u.a), b: u.b * u.a + a.b * (1 - u.a), a: 1 });
  const zemin = (el) => { const k = []; for (let e = el; e; e = e.parentElement) { const c = ayir(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { k.push(c); if (c.a === 1) break; } } let t = { r: 255, g: 255, b: 255, a: 1 }; for (let i = k.length - 1; i >= 0; i--) t = kar(k[i], t); return t; };
  const isik = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const kotu = [];
  const gez = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = gez.nextNode(); n; n = gez.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('script,style,noscript,option,.sr-only')) continue;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || !el.getClientRects().length) continue;
    const z = zemin(el), on = kar(ayir(st.color), z);
    const a = isik(on), b = isik(z), oran = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (oran < 4.5) kotu.push(`${oran.toFixed(2)} ${el.tagName}.${el.className} "${n.nodeValue.trim().slice(0, 30)}"`);
  }
  return [...new Set(kotu)];
});

// ============================================================================
bolum('S1 sunucu render’ı (bugün, 11/24 dönem) — temel durum');
{
  const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti');
  ok('S1 24 satir', (await page.locator('#dTablo tr[data-bas]').count()) === 24);
  ok('S1 ozet 11 / 24', (await metin(page, '#dYayim')) === '11 / 24');
  ok('S1 mod + damga', (await metin(page, '#dMod')) === 'EPİAŞ VERİSİ' && (await metin(page, '#dDamga')) === "EPİAŞ'TAN ALINDI 24.11 14:30");
  ok('S1 yayimlanmamis hucre "—"', (await tabloOzeti(page))[20] === '20:00–21:00|2.200,00|—|—|—|—|—|—');
  ok('S1 eksi fiyat gercek eksi isaretiyle', (await tabloOzeti(page))[4] === '04:00–05:00|450,00|60,00|Enerji fazlası|−106,00|463,50|556,00|13,50');
  ok('S1 icinde bulunulan donem isaretli (14:00–15:00), tek satir', (await page.locator('#dTablo tr.simdi').count()) === 1 && (await page.locator('#dTablo tr.simdi').getAttribute('data-bas')) === '2026-11-24T14:00:00+03:00');
  ok('S1 SSR sonrasi istemci veri ucunu HEMEN cagirmaz', kayit.veriIstek === 0);
  ok('S1 konsol/JS hatasi yok', kayit.konsol.length === 0 && kayit.hata.length === 0, `-> ${JSON.stringify(kayit)}`);
  ok('S1 tarayici EPİAŞ\'a dogrudan gitmez', kayit.epias === 0);
  ok('S1 CLS 0 (gec yerlesim kaymasi yok)', (await page.evaluate(() => window.__cls)) < 0.005, `-> ${await page.evaluate(() => window.__cls)}`);
  // Araç çubuğu
  ok('S1 tarih alani: deger + min + max', await page.evaluate(() => { const e = document.getElementById('dTarih'); return e.value === '2026-11-24' && e.min === '2026-01-01' && e.max === '2026-11-24'; }));
  ok('S1 onceki gun baglantisi, sonraki gun kapali', (await page.getAttribute('#dOnceki', 'href')) === '/dengesizlik-maliyeti?tarih=2026-11-23' && (await page.getAttribute('#dSonraki', 'href')) === null && (await page.getAttribute('#dSonraki', 'aria-disabled')) === 'true');
  // İndirme bağlantıları: var, doğru adres, gerçekten dosya veriyor
  for (const [id, b, tur] of [['dCsv', 'csv', 'text/csv; charset=utf-8'], ['dXlsx', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], ['dJson', 'json', 'application/json; charset=utf-8']]) {
    const href = await page.getAttribute('#' + id, 'href');
    ok(`S1 indirme baglantisi ${b}`, href === `/dengesizlik-maliyeti/veri?tarih=2026-11-24&bicim=${b}` && (await page.getAttribute('#' + id, 'download')) !== null && (await page.locator('#' + id).isVisible()));
    const r = await page.request.get(S.url + href);
    ok(`S1 ${b} dosyasi 200 + dogru tur`, r.status() === 200 && r.headers()['content-type'] === tur && (await r.body()).length > 200);
  }
  const [indirilen] = await Promise.all([page.waitForEvent('download'), page.click('#dCsv')]);
  ok('S1 CSV tiklaninca dosya iner, ad dogru', indirilen.suggestedFilename() === 'dengesizlik-maliyeti-2026-11-24.csv');
  // Görünür odak
  // Tarih alanından başlayıp Tab ile gezilen HER durakta odak görünür olmalı
  // (tarih alanının iç takvim düğmesi kendi odak halkasını çizer; o durak hariç).
  await page.focus('#dTarih');
  const duraklar = [];
  for (let i = 0; i < 22; i++) {
    await page.keyboard.press('Tab');
    duraklar.push(await page.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { id: e.id || e.tagName, fv: e.matches(':focus-visible'), stil: s.outlineStyle, en: parseFloat(s.outlineWidth), tarih: e.type === 'date' }; }));
  }
  const gorunmez = duraklar.filter((d) => !(d.stil === 'solid' && d.en >= 2) && !(d.tarih && !d.fv));
  ok('S1 klavye odagi her durakta gorunur (outline >= 2px)', gorunmez.length === 0 && new Set(duraklar.map((d) => d.id)).size >= 10, `-> ${JSON.stringify(gorunmez)}`);
  ok('S1 Tab sirasi: gun formu -> gezinme -> indirme -> aralik -> tablo', ['dOnceki', 'dBugun', 'dCsv', 'dXlsx', 'dJson', 'dBas', 'dBit', 'dBicim', 'dTabloSar'].every((id, i, a) => i === 0 || duraklar.findIndex((d) => d.id === id) > duraklar.findIndex((d) => d.id === a[i - 1])), `-> ${duraklar.map((d) => d.id).join(' ')}`);
  const kontrast = await kontrastSorunlari(page);
  ok('S1 kontrast >= 4.5:1 (tum gorunen metin)', kontrast.length === 0, `-> ${kontrast.slice(0, 6).join(' ; ')}`);
  await kapat();
}

// ============================================================================
bolum('S2 yatay taşma ve tablo kaydırma kabı (320 / 390 / 768 / 1440)');
for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1440, 900]]) {
  for (const yol of ['/dengesizlik-maliyeti', '/dengesizlik-maliyeti?veriyok']) {
    const { page, kapat } = await ac(yol, { w, h });
    ok(`S2 ${w}px ${yol.includes('veriyok') ? 'bekleme' : 'veri'}: sayfa duzeyinde yatay tasma yok`, await tasmaYok(page), `-> ${await page.evaluate(() => document.documentElement.scrollWidth)}`);
    if (!yol.includes('veriyok')) {
      const kap = await page.evaluate(() => { const e = document.getElementById('dTabloSar'); const r = e.getBoundingClientRect(); return { sw: e.scrollWidth, cw: e.clientWidth, sol: r.left, sag: r.right, vw: document.documentElement.clientWidth, of: getComputedStyle(e).overflowX }; });
      if (w < 1000) {
        ok(`S2 ${w}px tablo kendi kabinda yatay kayar`, kap.sw > kap.cw === (w < 840) && kap.of === 'auto' && kap.sag <= kap.vw + 0.5, `-> ${JSON.stringify(kap)}`);
        if (kap.sw > kap.cw) {
          const once = await page.evaluate(() => document.getElementById('dTabloSar').scrollLeft);
          await page.focus('#dTabloSar');
          for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(250);
          const sonra = await page.evaluate(() => document.getElementById('dTabloSar').scrollLeft);
          ok(`S2 ${w}px kap klavyeyle kayar (ok tuslari)`, sonra > once, `-> ${once} -> ${sonra}`);
          // Sabit ilk sütun ve sabit başlık
          await page.evaluate(() => { const e = document.getElementById('dTabloSar'); e.scrollLeft = 300; e.scrollTop = 200; });
          await page.waitForTimeout(100);
          const sabit = await page.evaluate(() => {
            const kab = document.getElementById('dTabloSar').getBoundingClientRect();
            const bas = document.querySelector('.dm-tablo thead th:nth-child(2)').getBoundingClientRect();
            const ilk = document.querySelector('.dm-tablo tbody tr:nth-child(12) th').getBoundingClientRect();
            return { basUstte: Math.abs(bas.top - kab.top) < 3, ilkSolda: Math.abs(ilk.left - kab.left) < 3 };
          });
          ok(`S2 ${w}px baslik satiri ve donem sutunu sabit`, sabit.basUstte && sabit.ilkSolda, `-> ${JSON.stringify(sabit)}`);
          ok(`S2 ${w}px kap kayinca sayfa tasmaz`, await tasmaYok(page));
        }
      } else {
        ok(`S2 ${w}px tablo kaba sigar (kirpilmaz)`, kap.sw <= kap.cw + 1 && kap.sol >= 0 && kap.sag <= kap.vw, `-> ${JSON.stringify(kap)}`);
        // Geniş ekranda başlık sayfa kaydırmasında üstte kalır
        await page.evaluate(() => { const t = document.querySelector('.dm-tablo tbody tr:nth-child(14)'); window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 100); });
        await page.waitForTimeout(100);
        const ust = await page.evaluate(() => document.querySelector('.dm-tablo thead th:nth-child(2)').getBoundingClientRect().top);
        ok(`S2 ${w}px baslik satiri sayfa kayarken sabit`, Math.abs(ust) < 3, `-> ${ust}`);
      }
    }
    await kapat();
  }
}
{ // 96 dönem (15 dk): telefon genişliğinde de taşma yok
  S.ayarla({ gun: (g) => sahteGun(g, 60, 15) });
  const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti?tarih=2026-11-23', { w: 320, h: 640 });
  ok('S2 96 donem: 96 satir, tasma yok', (await page.locator('#dTablo tr[data-bas]').count()) === 96 && (await tasmaYok(page)));
  ok('S2 96 donem: hesaplayicida 96 secenek', (await page.locator('#hDonem option').count()) === 96 && (await metin(page, '#dYayim')) === '60 / 96');
  ok('S2 96 donem: hata yok', kayit.konsol.length === 0 && kayit.hata.length === 0);
  await kapat();
  S.ayarla({ gun: gunVerisi(11) });
}

// ============================================================================
bolum('S3 hesaplayıcı — “Seçili günün verisiyle” (klavye)');
{
  const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti');
  ok('S3 varsayilan donem: son yayimlanan (10:00–11:00)', (await page.inputValue('#hDonem')) === '2026-11-24T10:00:00+03:00');
  ok('S3 secenek etiketi yayimlanmamis donemi belirtir', (await page.locator('#hDonem option').nth(20).textContent()) === '20:00–21:00 (yayımlanmadı)');
  ok('S3 sonuc alani canli bolge', (await page.getAttribute('#hSonuc', 'aria-live')) === 'polite' && (await page.getAttribute('#hSonuc', 'role')) === 'status');
  // Klavye: Dönem → Tab → miktar yaz → Enter
  await page.focus('#hDonem');
  await page.keyboard.press('Tab');
  ok('S3 Tab ile miktar alanina gecilir', (await page.evaluate(() => document.activeElement.id)) === 'hMiktar');
  await page.keyboard.type('5');
  await page.keyboard.press('Enter');
  ok('S3 negatif: fiyat EPİAŞ degeri', (await metin(page, '#gFiyat')) === '2.163,00 TL/MWh' && (await metin(page, '#gPtf')) === '2.100,00 TL/MWh');
  ok('S3 negatif: tutar (borc)', (await metin(page, '#gTutar')) === '10.815,00 TL' && (await metin(page, '#hSonuc')).includes('Dengesizlik tutarı (borç)'));
  ok('S3 negatif: ayni miktarin PTF degeri', (await metin(page, '#gPtfDeger')) === '10.500,00 TL');
  ok('S3 negatif: PTF\'ye gore maliyet', (await metin(page, '#gFark')) === '315,00 TL (63,00 TL/MWh)');
  ok('S3 sonuc basligi gun + donem', (await metin(page, '#hSonuc h3')) === '24.11.2026 · 10:00–11:00');
  // Yön: radyo grubunda ok tuşu → pozitif; Tab → Hesapla → Enter
  await page.focus('input[name="hYon"][value="negatif"]');
  await page.keyboard.press('ArrowDown');
  ok('S3 ok tusuyla pozitif secilir', await page.isChecked('input[name="hYon"][value="pozitif"]'));
  await page.keyboard.press('Tab');
  ok('S3 Tab ile Hesapla dugmesine gecilir', (await page.evaluate(() => document.activeElement.textContent)) === 'Hesapla');
  await page.keyboard.press('Enter');
  ok('S3 pozitif: fiyat, tutar (alacak), fark', (await metin(page, '#gFiyat')) === '1.598,00 TL/MWh' && (await metin(page, '#gTutar')) === '7.990,00 TL' && (await metin(page, '#hSonuc')).includes('Dengesizlik tutarı (alacak)') && (await metin(page, '#gFark')) === '2.510,00 TL (502,00 TL/MWh)');
  // Ondalık virgül
  await page.fill('#hMiktar', '2,5');
  await page.press('#hMiktar', 'Enter');
  ok('S3 ondalik virgul kabul edilir', (await metin(page, '#gMiktar')) === '2,5 MWh (pozitif)' && (await metin(page, '#gTutar')) === '3.995,00 TL');
  // Eksi pozitif fiyat (eşik altı dönemi): borç
  await page.selectOption('#hDonem', '2026-11-24T04:00:00+03:00');
  await page.fill('#hMiktar', '10');
  await page.press('#hMiktar', 'Enter');
  ok('S3 eksi pozitif fiyat: borc olarak gosterilir', (await metin(page, '#gFiyat')) === '−106,00 TL/MWh' && (await metin(page, '#gTutar')) === '1.060,00 TL' && (await metin(page, '#hSonuc')).includes('Dengesizlik tutarı (borç)') && (await metin(page, '#gFark')) === '5.560,00 TL (556,00 TL/MWh)');
  // Yayımlanmamış dönem: rakam yok (klavyeyle: End → son seçenek)
  await page.focus('#hDonem');
  await page.keyboard.press('End');
  ok('S3 End tusuyla son donem secilir', (await page.inputValue('#hDonem')) === '2026-11-24T23:00:00+03:00');
  await page.press('#hMiktar', 'Enter');
  ok('S3 yayimlanmamis donem: aciklama var, RAKAM YOK', (await metin(page, '#gYok')) === 'Bu dönemin dengesizlik fiyatı EPİAŞ tarafından henüz yayımlanmadı. Hesap yapılmadı.' && (await page.locator('#gTutar').count()) === 0 && !/\d,\d\d/.test(await metin(page, '#hSonuc')));
  // Doğrulama
  await page.selectOption('#hDonem', '2026-11-24T10:00:00+03:00');
  for (const [girdi, mesaj] of [['abc', 'sayıyla girin'], ['', 'sayıyla girin'], ['0', 'sıfırdan büyük'], ['-3', 'sıfırdan büyük'], ['1,2,3', 'sayıyla girin'], ['5000000', 'en çok']]) {
    await page.fill('#hMiktar', girdi);
    await page.press('#hMiktar', 'Enter');
    ok(`S3 gecersiz miktar "${girdi}": hata mesaji, sonuc yok, aria-invalid`, (await metin(page, '#hMiktarHata')).includes(mesaj) && (await page.locator('#hSonuc').innerHTML()) === '' && (await page.getAttribute('#hMiktar', 'aria-invalid')) === 'true' && (await page.evaluate(() => document.activeElement.id)) === 'hMiktar');
  }
  await page.fill('#hMiktar', '1.250,5');
  await page.press('#hMiktar', 'Enter');
  ok('S3 binlik nokta + ondalik virgul', (await metin(page, '#gMiktar')) === '1.250,5 MWh (pozitif)' && (await page.getAttribute('#hMiktar', 'aria-invalid')) === null && (await metin(page, '#hMiktarHata')) === '');
  ok('S3 hesaplayici uyarisi gorunur', (await metin(page, '#dHesap')).includes('Sonuç tahminidir. Bilgilendirme amaçlıdır; kesin tutar EPİAŞ uzlaştırma bildirimiyle belirlenir. Teklif ya da taahhüt değildir.'));
  ok('S3 hata yok', kayit.konsol.length === 0 && kayit.hata.length === 0, `-> ${JSON.stringify(kayit)}`);
  await kapat();
}

// ============================================================================
bolum('S4 hesaplayıcı — “Kendi senaryom” (klavye + formül sürüklenmesi)');
{
  const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti');
  ok('S4 baslangicta senaryo formu gizli', (await page.isHidden('#hSenaryo')) && (await page.isVisible('#hGun')));
  await page.focus('#hModGun');
  await page.keyboard.press('ArrowDown');
  ok('S4 ok tusuyla "Kendi senaryom" secilir, form degisir', (await page.isChecked('#hModSenaryo')) && (await page.isVisible('#hSenaryo')) && (await page.isHidden('#hGun')));
  ok('S4 kural notu (gun + sabitler)', (await metin(page, '#hKural')) === 'Kural: 01.11.2026 – 31.12.2026 teslim günleri (seçili gün 24.11.2026). V = 100,00 TL/MWh, B = 100,00 TL/MWh, AFL = 4.500,00 TL/MWh.');
  // Klavyeyle doldur: Tab sırası PTF → SMF → yön → miktar → Hesapla
  await page.keyboard.press('Tab');
  ok('S4 Tab ile PTF alanina gecilir', (await page.evaluate(() => document.activeElement.id)) === 'sPtf');
  await page.keyboard.type('2800');
  await page.keyboard.press('Tab'); await page.keyboard.type('3400');
  await page.keyboard.press('Tab');
  ok('S4 Tab ile sistem yonune gecilir (varsayilan: enerji acigi)', (await page.evaluate(() => document.activeElement.id)) === 'sYon' && (await page.inputValue('#sYon')) === 'acik');
  await page.keyboard.press('Tab'); await page.keyboard.type('10');
  await page.keyboard.press('Enter');
  ok('S4 A: negatif 3.604,00 / pozitif 2.716,00', (await metin(page, '#sNegFiyat')) === '3.604,00 TL/MWh' && (await metin(page, '#sPozFiyat')) === '2.716,00 TL/MWh');
  ok('S4 A: uygulanan dal ve katsayilar', (await metin(page, '#sNegDal')) === 'Genel: max(V; PTF; SMF) × (1 + k); V = 100,00, k = 0,06' && (await metin(page, '#sPozDal')) === 'Genel: min(PTF; SMF) × (1 − l); V = 100,00, l = 0,03');
  ok('S4 A: tutarlar ve PTF\'ye gore maliyet', (await metin(page, '#sNegTutar')) === '36.040,00 TL' && (await metin(page, '#sNegPtfDeger')) === '28.000,00 TL' && (await metin(page, '#sNegFark')) === '8.040,00 TL (804,00 TL/MWh)' && (await metin(page, '#sPozTutar')) === '27.160,00 TL' && (await metin(page, '#sPozFark')) === '840,00 TL (84,00 TL/MWh)');

  /** Formu DOM üzerinden doldurup gönderir; çıktıları okur. */
  const senaryo = (ptf, smf, yon) => page.evaluate(([p, s, y]) => {
    const yaz = (id, v) => { document.getElementById(id).value = v; };
    yaz('sPtf', p); yaz('sSmf', s); yaz('sMiktar', '1'); document.getElementById('sYon').value = y;
    document.getElementById('hSenaryo').dispatchEvent(new Event('submit', { cancelable: true }));
    const al = (id) => { const e = document.getElementById(id); return e ? e.textContent.trim() : null; };
    return { neg: al('sNegFiyat'), poz: al('sPozFiyat'), negDal: al('sNegDal'), pozDal: al('sPozDal'), ptfHata: al('sPtfHata'), smfHata: al('sSmfHata'), sonuc: document.getElementById('hSonuc').innerHTML };
  }, [ptf, smf, yon]);
  const tr = (n) => String(n).replace('.', ',');
  const K = kuralBul('2026-11-24');
  // Föydeki altı örnek
  for (const [ad, ptf, smf, yon, neg, poz, negDal, pozDal] of [
    ['B esik alti', 450, 60, 'fazla', '463,50', '−106,00', 'Genel', 'Eşik altı'], ['C', 2000, 1200, 'fazla', '2.060,00', '1.128,00', 'Genel', 'Genel'],
    ['D sinir (min = V)', 450, 100, 'fazla', '463,50', '94,00', 'Genel', 'Genel'], ['E tavan', 4500, 4500, 'acik', '5.008,50', '4.365,00', 'Tavan', 'Genel'],
    ['F denge', 2000, 2000, 'denge', '2.060,00', '1.940,00', 'Genel', 'Genel'],
  ]) {
    const x = await senaryo(tr(ptf), tr(smf), yon);
    ok(`S4 ${ad}: ${neg} / ${poz}`, x.neg === `${neg} TL/MWh` && x.poz === `${poz} TL/MWh` && x.negDal.startsWith(negDal) && x.pozDal.startsWith(pozDal), `-> ${JSON.stringify(x).slice(0, 200)}`);
  }
  let x = await senaryo('450', '60', 'fazla');
  ok('S4 esik alti dal metni: katsayi ve sabitler', x.pozDal === 'Eşik altı: min(PTF; SMF) < V olduğu için (−1) × B × (1 + l); V = 100,00, B = 100,00, l = 0,06' && x.sonuc.includes('pozitif dengesizlik tutarı borçtur'));
  x = await senaryo('4500', '4500', 'acik');
  ok('S4 tavan dal metni', x.negDal === 'Tavan: max(PTF; SMF) = AFL olduğu için AFL × 1,05 × (1 + k); AFL = 4.500,00, k = 0,06');
  // Sürüklenme kapısı: istemci formülü = functions/_lib/dengesizlik.js (rastgele + sınır değerleri)
  let tohum = 20261124;
  const rnd = () => { tohum = (tohum * 1664525 + 1013904223) % 4294967296; return tohum / 4294967296; };
  const ozel = [0, 99.99, 100, 100.01, 4499.99, 4500];
  let uyusmayan = 0, denenen = 0, ilkFark = '';
  for (let i = 0; i < 80; i++) {
    const sec = () => (rnd() < 0.3 ? ozel[Math.floor(rnd() * ozel.length)] : Math.round(rnd() * 450000) / 100);
    const ptf = sec(), smf = sec(), yon = ['acik', 'fazla', 'denge'][Math.floor(rnd() * 3)];
    const b = birimFiyat({ ptf, smfN: smf, smfP: smf, yon }, K);
    const c = await senaryo(tr(ptf), tr(smf), yon);
    denenen++;
    if (c.neg !== `${bicim(b.negatif)} TL/MWh` || c.poz !== `${bicim(b.pozitif)} TL/MWh` || !c.negDal.startsWith({ genel: 'Genel', tavan: 'Tavan' }[b.dalNegatif]) || !c.pozDal.startsWith({ genel: 'Genel', esikAlti: 'Eşik altı' }[b.dalPozitif])) {
      uyusmayan++; if (!ilkFark) ilkFark = `${ptf}/${smf}/${yon}: istemci ${c.neg} ${c.poz} · kutuphane ${bicim(b.negatif)} ${bicim(b.pozitif)}`;
    }
  }
  ok(`S4 istemci formulu = kutuphane (${denenen} rastgele/sinir girdi)`, uyusmayan === 0, `-> ${uyusmayan} fark; ${ilkFark}`);
  // Doğrulama: 0…4500 dışı ve boş
  x = await senaryo('5000', '100', 'acik');
  ok('S4 PTF tavan ustu: hata, sonuc yok', x.ptfHata.includes('azami fiyat limitini (4.500,00 TL/MWh) aşamaz') && x.sonuc === '');
  x = await senaryo('2000', '4500,01', 'acik');
  ok('S4 SMF tavan ustu: hata, sonuc yok', x.smfHata.includes('azami fiyat limitini') && x.sonuc === '');
  x = await senaryo('-1', '100', 'acik');
  ok('S4 eksi PTF: hata', x.ptfHata.includes('sıfırdan küçük olamaz') && x.sonuc === '');
  x = await senaryo('2000', '', 'acik');
  ok('S4 bos SMF: hata', x.smfHata.includes('sayıyla girin') && x.sonuc === '');
  x = await senaryo('2.800', '3.400,00', 'acik');
  ok('S4 binlik noktali giris', x.neg === '3.604,00 TL/MWh' && x.poz === '2.716,00 TL/MWh');
  x = await senaryo('0', '0', 'denge');
  ok('S4 sifir fiyat gecerli', x.neg === '103,00 TL/MWh' && x.poz === '−103,00 TL/MWh');
  // Mod değişince eski sonuç silinir
  await page.focus('#hModSenaryo');
  await page.keyboard.press('ArrowUp');
  ok('S4 mod degisince sonuc temizlenir', (await page.isChecked('#hModGun')) && (await page.locator('#hSonuc').innerHTML()) === '' && (await page.isVisible('#hGun')));
  ok('S4 hata yok', kayit.konsol.length === 0 && kayit.hata.length === 0, `-> ${JSON.stringify(kayit)}`);
  await kapat();
}
{ // Ocak–Ekim kuralı: V = 150, tavan doğrulanmamış
  const { page, kapat } = await ac('/dengesizlik-maliyeti?tarih=2026-03-10');
  await page.check('#hModSenaryo');
  ok('S4 eski gun kural notu: V = 150, tavan dogrulanmadi', (await metin(page, '#hKural')) === 'Kural: 01.01.2026 – 31.10.2026 teslim günleri (seçili gün 10.03.2026). V = 150,00 TL/MWh, B = 100,00 TL/MWh, azami fiyat limiti bu tarih için doğrulanmadı; tavan koşulu uygulanmaz.');
  await page.fill('#sPtf', '450'); await page.fill('#sSmf', '120'); await page.selectOption('#sYon', 'fazla'); await page.fill('#sMiktar', '1');
  await page.press('#sMiktar', 'Enter');
  ok('S4 eski gun: 120 < 150 -> esik alti', (await metin(page, '#sPozFiyat')) === '−106,00 TL/MWh' && (await metin(page, '#sPozDal')).startsWith('Eşik altı') && (await metin(page, '#sPozDal')).includes('V = 150,00'));
  await page.fill('#sPtf', '4500'); await page.fill('#sSmf', '4500'); await page.selectOption('#sYon', 'acik');
  await page.press('#sMiktar', 'Enter');
  ok('S4 eski gun: tavan dali UYGULANMAZ', (await metin(page, '#sNegFiyat')) === '4.770,00 TL/MWh' && (await metin(page, '#sNegDal')).startsWith('Genel'));
  await kapat();
}

// ============================================================================
bolum('S5 gezinme: tarih formu, önceki/sonraki gün, aralık formu');
{
  const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti');
  await page.fill('#dTarih', '2026-11-20');
  await Promise.all([page.waitForURL(/tarih=2026-11-20/), page.press('#dTarih', 'Enter')]);
  ok('S5 tarih formu duz GET ile gider', page.url().endsWith('/dengesizlik-maliyeti?tarih=2026-11-20') && (await metin(page, '#dGun')) === '20.11.2026' && (await metin(page, '#dYayim')) === '24 / 24');
  ok('S5 tarihli gorunum: noindex + kendine canonical', (await page.getAttribute('meta[name="robots"]', 'content')) === 'noindex, follow' && (await page.getAttribute('link[rel="canonical"]', 'href')) === 'https://voltage.com.tr/dengesizlik-maliyeti?tarih=2026-11-20');
  ok('S5 gecmis gunde "simdi" satiri yok', (await page.locator('#dTablo tr.simdi').count()) === 0);
  await Promise.all([page.waitForURL(/tarih=2026-11-19/), page.click('#dOnceki')]);
  ok('S5 onceki gun', (await metin(page, '#dGun')) === '19.11.2026');
  await Promise.all([page.waitForURL(/tarih=2026-11-20/), page.click('#dSonraki')]);
  ok('S5 sonraki gun', (await metin(page, '#dGun')) === '20.11.2026');
  await Promise.all([page.waitForURL((u) => !u.search), page.click('#dBugun')]);
  ok('S5 Bugun baglantisi tarihsiz sayfaya doner', (await metin(page, '#dGun')) === '24.11.2026' && (await page.getAttribute('meta[name="robots"]', 'content')).startsWith('index, follow'));
  // Aralık formu
  ok('S5 aralik varsayilani: son 7 gun', (await page.inputValue('#dBas')) === '2026-11-18' && (await page.inputValue('#dBit')) === '2026-11-24');
  await page.fill('#dBas', '2026-10-01'); await page.fill('#dBit', '2026-11-10');
  await page.click('#dAralikForm button[type="submit"]');
  ok('S5 31 gunu asan aralik: mesaj, gezinme yok', (await metin(page, '#dAralikHata')) === 'Tek dosyada en çok 31 gün indirilebilir. Seçilen aralık 41 gün.' && !page.url().includes('/veri'));
  await page.fill('#dBas', '2026-11-12'); await page.fill('#dBit', '2026-11-10');
  await page.click('#dAralikForm button[type="submit"]');
  ok('S5 ters aralik: mesaj', (await metin(page, '#dAralikHata')) === 'Başlangıç tarihi bitiş tarihinden sonra olamaz.');
  await page.fill('#dBas', '2026-11-10'); await page.fill('#dBit', '2026-11-12'); await page.selectOption('#dBicim', 'xlsx');
  const [dosya] = await Promise.all([page.waitForEvent('download'), page.click('#dAralikForm button[type="submit"]')]);
  ok('S5 gecerli aralik: dosya iner', dosya.suggestedFilename() === 'dengesizlik-maliyeti-2026-11-10_2026-11-12.xlsx' && (await metin(page, '#dAralikHata')) === '');
  ok('S5 hata yok', kayit.konsol.length === 0 && kayit.hata.length === 0, `-> ${JSON.stringify(kayit)}`);
  await kapat();
  const g = await ac('/dengesizlik-maliyeti?tarih=2026-13-45');
  ok('S5 gecersiz tarih: gorunur uyari, bugunun verisi', (await g.page.locator('#dUyari').isVisible()) && (await metin(g.page, '#dUyari')).startsWith('Adresteki tarih geçerli değil') && (await metin(g.page, '#dGun')) === '24.11.2026' && (await g.page.locator('#dTablo tr[data-bas]').count()) === 24);
  await g.kapat();
}

// ============================================================================
bolum('S6 dürüst bekleme hâli');
{ // ?veriyok: SSR yok, istemci de çekmez
  const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti?veriyok');
  ok('S6 ?veriyok: tablo bekliyor, rakam yok', (await tabloOzeti(page)).join() === 'Veri bekleniyor…');
  ok('S6 ?veriyok: ozet "—"', (await Promise.all(['dYayim', 'dPtfOrt', 'dSmfOrt', 'dMalPoz', 'dMalNeg', 'dYonAcik', 'dYonFazla', 'dYonDenge'].map((id) => metin(page, '#' + id)))).every((t) => t === '—'));
  ok('S6 ?veriyok: EPİAŞ VERİSİ BEKLENİYOR', (await metin(page, '#dDamga')) === 'EPİAŞ VERİSİ BEKLENİYOR' && (await metin(page, '#dMod')) === 'VERİ BEKLENİYOR' && (await page.getAttribute('#dDamga', 'class')) === 'live-stamp waiting');
  ok('S6 ?veriyok: istemci veri ucunu CAGIRMAZ', kayit.veriIstek === 0);
  ok('S6 ?veriyok: ozet cumlesi ve ornek gorunmez', (await page.isHidden('#dOzet')) && (await page.isHidden('#dOrnek')));
  ok('S6 ?veriyok: veri bolumunde fiyat bicimli rakam yok', !/\d,\d\d/.test(await page.evaluate(() => [...document.querySelectorAll('.live, #dOzet, #dTablo')].map((e) => e.textContent).join(' '))));
  ok('S6 ?veriyok: gun etiketi ve tarih alani yine dolu', (await metin(page, '#dGun')) === '24.11.2026' && (await page.inputValue('#dTarih')) === '2026-11-24');
  await page.fill('#hMiktar', '5'); await page.press('#hMiktar', 'Enter');
  ok('S6 ?veriyok: gun verisiyle hesap RAKAM uretmez', (await metin(page, '#gYok')) === 'Seçili gün için EPİAŞ verisi alınamadı. Hesap yapılmadı.' && (await page.locator('#gTutar').count()) === 0);
  await page.check('#hModSenaryo');
  await page.fill('#sPtf', '2800'); await page.fill('#sSmf', '3400'); await page.fill('#sMiktar', '1'); await page.press('#sMiktar', 'Enter');
  ok('S6 ?veriyok: "Kendi senaryom" veri olmadan da calisir (gomulu kural)', (await metin(page, '#sNegFiyat')) === '3.604,00 TL/MWh');
  ok('S6 ?veriyok: konsol/JS hatasi yok', kayit.konsol.length === 0 && kayit.hata.length === 0, `-> ${JSON.stringify(kayit)}`);
  const kontrast = await kontrastSorunlari(page);
  ok('S6 bekleme halinde kontrast >= 4.5:1', kontrast.length === 0, `-> ${kontrast.slice(0, 6).join(' ; ')}`);
  await kapat();
}
{ // kimlik tanımlı değil: SSR kabuk döner, istemci dener (503), dürüstçe bekler
  S.ayarla({ env: {} });
  const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti');
  await page.waitForTimeout(300);
  ok('S6 kimlik yok: tablo bekliyor, damga bekliyor', (await tabloOzeti(page)).join() === 'Veri bekleniyor…' && (await metin(page, '#dDamga')) === 'EPİAŞ VERİSİ BEKLENİYOR' && (await metin(page, '#dYayim')) === '—');
  ok('S6 kimlik yok: istemci bir kez dener, 503 alir', kayit.veriIstek === 1);
  ok('S6 kimlik yok: JS hatasi yok (yalniz beklenen 503 ag kaydi)', kayit.hata.length === 0 && kayit.konsol.every((k) => /503/.test(k)), `-> ${JSON.stringify(kayit)}`);
  ok('S6 kimlik yok: tasma yok', await tasmaYok(page));
  await kapat();
  S.ayarla({ gun: gunVerisi(11) });
}

// ============================================================================
bolum('S7 istemci çizimi = sunucu çizimi; tazelik merdiveni');
{
  // Aynı veri: sunucu render'ı ile SSR'sız kabuk + istemci çizimi birebir aynı olmalı
  const a = await ac('/dengesizlik-maliyeti');
  const b = await ac('/kabuk');
  await b.page.waitForFunction(() => document.querySelectorAll('#dTablo tr[data-bas]').length > 0);
  const parcalar = (page) => page.evaluate(() => ({
    tablo: document.getElementById('dTablo').innerHTML,
    ozet: ['dYayim', 'dPtfOrt', 'dSmfOrt', 'dMalPoz', 'dMalNeg', 'dYonAcik', 'dYonFazla', 'dYonDenge', 'dGun', 'dBantGun', 'dTabloBaslik', 'dOzet', 'dMod', 'dDamga'].map((id) => document.getElementById(id).textContent),
    siniflar: [document.getElementById('dMod').className, document.getElementById('dDamga').className],
    araclar: ['dOnceki', 'dSonraki', 'dCsv', 'dXlsx', 'dJson'].map((id) => document.getElementById(id).getAttribute('href')),
    tarihler: ['dTarih', 'dBas', 'dBit'].map((id) => { const e = document.getElementById(id); return [e.value, e.min, e.max].join(); }),
  }));
  const pa = await parcalar(a.page), pb = await parcalar(b.page);
  ok('S7 tablo HTML\'i: istemci = sunucu (birebir)', pa.tablo === pb.tablo, `-> ${pa.tablo.length} / ${pb.tablo.length}`);
  ok('S7 ozet, tarihli cumle, damga: istemci = sunucu', JSON.stringify(pa.ozet) === JSON.stringify(pb.ozet) && JSON.stringify(pa.siniflar) === JSON.stringify(pb.siniflar), `-> ${JSON.stringify(pa.ozet.filter((x, i) => x !== pb.ozet[i]))} / ${JSON.stringify(pb.ozet.filter((x, i) => x !== pa.ozet[i]))}`);
  ok('S7 arac cubugu: istemci = sunucu', JSON.stringify(pa.araclar) === JSON.stringify(pb.araclar) && JSON.stringify(pa.tarihler) === JSON.stringify(pb.tarihler), `-> ${JSON.stringify(pa.araclar)} ${JSON.stringify(pb.araclar)} ${JSON.stringify(pa.tarihler)} ${JSON.stringify(pb.tarihler)}`);
  ok('S7 kabuk yolunda hata yok', b.kayit.konsol.length === 0 && b.kayit.hata.length === 0 && b.kayit.veriIstek === 1, `-> ${JSON.stringify(b.kayit)}`);
  await b.kapat();

  // SSR + 5 dk sonra yenileme başarılı: yeni dönemler gelir
  S.ayarla({ gun: gunVerisi(12) });
  await a.page.clock.fastForward(5 * 60 * 1000 + 500);
  await a.page.waitForFunction(() => document.getElementById('dYayim').textContent === '12 / 24', null, { timeout: 5000 }).catch(() => {});
  ok('S7 yenileme: yeni yayimlanan donem tabloya gelir', (await metin(a.page, '#dYayim')) === '12 / 24' && (await tabloOzeti(a.page))[11].startsWith('11:00–12:00|2.110,00|2.110,00|Dengede|'));
  ok('S7 yenileme: hesaplayici secenekleri guncellenir', (await a.page.locator('#hDonem option').nth(11).textContent()) === '11:00–12:00');
  // Sonraki yenileme başarısız: rakamlar kalır, tazelik iddiası düşer
  S.ayarla({ env: {} });
  const onceki = await tabloOzeti(a.page);
  await a.page.clock.fastForward(5 * 60 * 1000 + 500);
  await a.page.waitForFunction(() => document.getElementById('dMod').textContent === 'SON SENKRON', null, { timeout: 5000 }).catch(() => {});
  ok('S7 yenileme basarisiz: SON SENKRON, rakamlar silinmez', (await metin(a.page, '#dMod')) === 'SON SENKRON' && (await a.page.getAttribute('#dDamga', 'class')) === 'live-stamp stale' && (await metin(a.page, '#dDamga')).startsWith('SON SENKRON 24.11') && JSON.stringify(await tabloOzeti(a.page)) === JSON.stringify(onceki));
  ok('S7 JS hatasi yok', a.kayit.hata.length === 0, `-> ${a.kayit.hata}`);
  await a.kapat();

  // Sunucu veri veremiyor + bu tarayıcıda önceki gerçek veri saklı → SON SENKRON
  const onbellek = JSON.stringify({ tarih: '2026-11-24', cekildi: '2026-11-24T13:05:00+03:00', donemler: [{ bas: '2026-11-24T00:00:00+03:00', dk: 60, ptf: 2000, smf: 2300, yon: 'acik', pozitif: 1940, negatif: 2438 }, { bas: '2026-11-24T01:00:00+03:00', dk: 60, ptf: 2010, smf: null, yon: null, pozitif: null, negatif: null }] });
  const c = await ac('/dengesizlik-maliyeti', { depo: ['voltage-dengesizlik-onbellek', onbellek] });
  await c.page.waitForTimeout(300);
  ok('S7 onbellek: SON SENKRON + saklanan cekim zamani', (await metin(c.page, '#dMod')) === 'SON SENKRON' && (await metin(c.page, '#dDamga')) === 'SON SENKRON 24.11 13:05');
  ok('S7 onbellek: saklanan gercek satirlar, eksik deger "—"', JSON.stringify(await tabloOzeti(c.page)) === JSON.stringify(['00:00–01:00|2.000,00|2.300,00|Enerji açığı|1.940,00|2.438,00|60,00|438,00', '01:00–02:00|2.010,00|—|—|—|—|—|—']));
  await c.kapat();
  // Başka günün önbelleği KULLANILMAZ
  const d = await ac('/dengesizlik-maliyeti', { depo: ['voltage-dengesizlik-onbellek', onbellek.replace(/2026-11-24/g, '2026-11-22')] });
  await d.page.waitForTimeout(300);
  ok('S7 baska gunun onbellegi kullanilmaz: durust bekleme', (await tabloOzeti(d.page)).join() === 'Veri bekleniyor…' && (await metin(d.page, '#dDamga')) === 'EPİAŞ VERİSİ BEKLENİYOR');
  await d.kapat();
  // Bozuk önbellek sayfayı kırmaz
  const f = await ac('/dengesizlik-maliyeti', { depo: ['voltage-dengesizlik-onbellek', '{bozuk json'] });
  await f.page.waitForTimeout(200);
  ok('S7 bozuk onbellek: sayfa calisir, bekler', (await tabloOzeti(f.page)).join() === 'Veri bekleniyor…' && f.kayit.hata.length === 0);
  await f.kapat();
  S.ayarla({ gun: gunVerisi(11) });
}

// ============================================================================
bolum('S8 31/12/2026 sonrası: formül hesabı kendini kapatır');
{
  const OCAK = Date.UTC(2027, 0, 5, 9, 0, 0);
  S.ayarla({ gun: (g) => sahteGun(g, 6) });
  S.epias.an = OCAK;
  const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti', { an: OCAK });
  ok('S8 2027: tablo EPİAŞ verisiyle calisir', (await metin(page, '#dGun')) === '05.01.2027' && (await page.locator('#dTablo tr[data-bas]').count()) === 24);
  ok('S8 2027: "Kendi senaryom" kapali + durust not', (await page.isDisabled('#hModSenaryo')) && (await page.isVisible('#hKapali')) && (await metin(page, '#hKapali')).startsWith('Seçili tarih için doğrulanmış bir dengesizlik fiyatı kuralı bulunmadığından'));
  ok('S8 2027: senaryo formu gizli, gun modu acik', (await page.isHidden('#hSenaryo')) && (await page.isVisible('#hGun')) && (await page.isChecked('#hModGun')));
  await page.fill('#hMiktar', '2'); await page.press('#hMiktar', 'Enter');
  ok('S8 2027: gun verisiyle hesap (EPİAŞ fiyati) calisir', /TL\/MWh/.test(await metin(page, '#gFiyat')));
  ok('S8 2027: ornek hesap bolumu gorunmez', await page.isHidden('#dOrnek'));
  ok('S8 2027: hata yok', kayit.konsol.length === 0 && kayit.hata.length === 0, `-> ${JSON.stringify(kayit)}`);
  await kapat();
  // 2026 içinde bir güne dönülürse (kural var) yeniden açılır
  const g = await ac('/dengesizlik-maliyeti?tarih=2026-12-31', { an: OCAK });
  ok('S8 2027\'den 31.12.2026\'ya bakinca senaryo acik', !(await g.page.isDisabled('#hModSenaryo')) && (await g.page.isHidden('#hKapali')));
  await g.kapat();
  S.ayarla({ gun: gunVerisi(11) });
}

// ============================================================================
bolum('S9 JavaScript kapalı: veri, yöntem ve formlar okunur/çalışır');
{
  const { page, kapat } = await ac('/dengesizlik-maliyeti', { js: false });
  ok('S9 tablo sunucudan gelir', (await page.locator('#dTablo tr[data-bas]').count()) === 24 && (await metin(page, '#dYayim')) === '11 / 24');
  ok('S9 ozet cumlesi, formul, SSS, kaynak HTML\'de', (await metin(page, '#dOzet')).startsWith('24.11.2026 dengesizlik özeti') && (await page.locator('.formul').count()) === 3 && (await page.locator('#dSss h3').count()) === 7 && (await metin(page, '#dAtif')).startsWith('Dayanak:'));
  ok('S9 ornek hesap HTML\'de', (await metin(page, '#dOrnek h3')) === 'Örnek hesap: 24.11.2026, 10:00–11:00');
  ok('S9 noscript notu gorunur', (await page.locator('noscript').count()) === 1);
  ok('S9 indirme baglantilari calisir durumda', (await page.getAttribute('#dCsv', 'href')) === '/dengesizlik-maliyeti/veri?tarih=2026-11-24&bicim=csv');
  await page.fill('#dTarih', '2026-11-21');
  await Promise.all([page.waitForURL(/tarih=2026-11-21/), page.click('#dTarihForm button[type="submit"]')]);
  ok('S9 tarih formu JS\'siz calisir', (await metin(page, '#dGun')) === '21.11.2026' && (await page.locator('#dTablo tr[data-bas]').count()) === 24);
  ok('S9 tasma yok', await tasmaYok(page));
  await kapat();
}

await browser.close();
await S.kapat();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
