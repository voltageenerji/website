/**
 * /dengesizlik-maliyeti — erişilebilirlik ve motorlar arası denetim (Playwright + axe-core).
 *
 * Sayfa GERÇEK fonksiyon modülleriyle, SAHTE proxy'yle sunulur (docs/qa/dengesizlik-test-sunucu.mjs).
 * !!! Buradaki tüm fiyatlar UYDURMA TEST VERİSİDİR.
 *
 * Kapsam (her motorda): axe-core (WCAG 2.0/2.1/2.2 A+AA + best-practice) veri dolu, geçmiş gün,
 * bekleme, senaryo sonucu, alan hatası ve aralık hatası hâllerinde, 1280 ve 390 px; klavye sırası
 * ve görünür odak (sayfanın tamamı), yalnız klavyeyle tarih formu; aria-live sonuç bölgesi ve alan
 * hatalarının duyurulması; tablo semantiği (caption, scope, sr-only birimler); 200 % / 400 %
 * yakınlaştırmaya denk görünüm alanında yeniden akış (yatay sayfa kaydırması yok, kırpılan metin
 * yok); metin kontrastı ≥ 4,5:1 ve form denetimi kenarlığı ≥ 3:1; prefers-reduced-motion; konsol.
 * CIHAZ="iPhone 15" (yalnız webkit): mobil Safari tanımlayıcısıyla DOM denetimleri.
 *
 * Çalıştırma:
 *   TARAYICI=chromium|firefox|webkit PLAYWRIGHT_MODUL=<node_modules> AXE_MODUL=<node_modules> \
 *     node docs/qa/test-dengesizlik-erisilebilirlik.mjs
 *   QA_CI_GUNLUK=1 → yalnız denetim adları ve sayılar (herkese açık CI günlüğü).
 * Başarısızlıkta çıkış kodu 1.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { sunucuBaslat } from './dengesizlik-test-sunucu.mjs';
import { sahteGun, SABIT_AN } from './dengesizlik-test-verisi.mjs';

const PW_DIZIN = process.env.PLAYWRIGHT_MODUL || '/opt/node-tools/node_modules/';
const pw = createRequire(PW_DIZIN.replace(/\/?$/, '/'))('playwright');
const axeYolu = createRequire((process.env.AXE_MODUL || PW_DIZIN).replace(/\/?$/, '/')).resolve('axe-core/axe.min.js');
const AXE = readFileSync(axeYolu, 'utf8');
const AXE_SURUM = JSON.parse(readFileSync(axeYolu.replace(/axe\.min\.js$/, 'package.json'), 'utf8')).version;
const MOTOR = process.env.TARAYICI || 'chromium';
const CIHAZ = process.env.CIHAZ || '';
const CHROME = process.env.CHROMIUM_PATH || (process.env.PLAYWRIGHT_MODUL ? null : '/opt/pw-browsers/chromium');
const CI = process.env.QA_CI_GUNLUK === '1';

let pass = 0, fail = 0;
const bilgi = [];
const ok = (n, c, extra = '') => { if (c) pass++; else { fail++; console.log(`  FAIL ${n}${CI ? '' : ' ' + extra}`); } };
const not = (s) => { bilgi.push(s); console.log(`  NOT ${s}`); }; // yalnız kural kimliği ve sayılar
const bolum = (ad) => console.log(`# ${ad}`);

const OZEL = { ptf: 450, smf: 60, pozitif: -106, negatif: 463.5, yon: 'fazla', yonHam: 'Enerji Fazlası' };
const S = await sunucuBaslat({ gun: (g) => sahteGun(g, g === '2026-11-24' ? 11 : 24).map((o, i) => (i === 4 ? { ...o, ...OZEL } : o)) });
const browser = await pw[MOTOR].launch(MOTOR === 'chromium' ? { ...(CHROME ? { executablePath: CHROME } : {}), args: ['--no-sandbox'] } : {});
console.log(`# motor: ${MOTOR} ${browser.version()} · axe-core ${AXE_SURUM}${CIHAZ ? ` · cihaz: ${CIHAZ}` : ''}`);

async function ac(yol, { w = 1280, h = 900, js = true, azalt = false, dsf = 1, cihaz = null } = {}) {
  const tanim = cihaz ? pw.devices[cihaz] : { viewport: { width: w, height: h }, deviceScaleFactor: dsf };
  const ctx = await browser.newContext({ ...tanim, javaScriptEnabled: js, locale: 'tr-TR', acceptDownloads: true, reducedMotion: azalt ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const kayit = { konsol: [], hata: [] };
  page.on('console', (m) => { if (m.type() === 'error') kayit.konsol.push(m.text()); });
  page.on('pageerror', (e) => kayit.hata.push(e.message));
  await ctx.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route(/fonts\.gstatic\.com/, (r) => r.fulfill({ status: 200, body: '' }));
  if (js) await page.clock.install({ time: new Date(SABIT_AN) });
  await page.goto(S.url + yol, { waitUntil: 'load' });
  if (js) await page.waitForTimeout(150);
  return { page, ctx, kayit, kapat: () => ctx.close() };
}
const metin = (page, sec) => page.locator(sec).first().textContent().then((t) => (t || '').replace(/\s+/g, ' ').trim());

/** axe-core çalıştırır; ihlalleri {id, etki, dugum, hedef} olarak döndürür (sayfa metni değil, seçici). */
async function axeKos(page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] });
    const ozet = (l) => l.map((v) => ({ id: v.id, etki: v.impact, dugum: v.nodes.length, wcag: v.tags.some((t) => /^wcag\d/.test(t)), hedef: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
    const ihlal = ozet(r.violations);
    return { ihlal, wcag: ihlal.filter((v) => v.wcag), iyiUygulama: ihlal.filter((v) => !v.wcag), eksik: ozet(r.incomplete) };
  });
}

/** Görünen metin için WCAG kontrastı (test-dengesizlik-tarayici.mjs ile aynı yöntem) + form denetimi kenarlığı (1.4.11). */
const kontrast = (page) => page.evaluate(() => {
  const ayir = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const kar = (u, a) => ({ r: u.r * u.a + a.r * (1 - u.a), g: u.g * u.a + a.g * (1 - u.a), b: u.b * u.a + a.b * (1 - u.a), a: 1 });
  const zemin = (el) => { const k = []; for (let e = el; e; e = e.parentElement) { const c = ayir(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { k.push(c); if (c.a === 1) break; } } let t = { r: 255, g: 255, b: 255, a: 1 }; for (let i = k.length - 1; i >= 0; i--) t = kar(k[i], t); return t; };
  const isik = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const oran = (a, b) => { const x = isik(a), y = isik(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const metinKotu = [], kenarKotu = [];
  let enDusuk = 99;
  const gez = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = gez.nextNode(); n; n = gez.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('script,style,noscript,option,.sr-only')) continue;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || !el.getClientRects().length) continue;
    const z = zemin(el), o = oran(kar(ayir(st.color), z), z);
    enDusuk = Math.min(enDusuk, o);
    if (o < 4.5) metinKotu.push(`${o.toFixed(2)} ${el.tagName}#${el.id}.${el.className}`);
  }
  for (const el of document.querySelectorAll('input[type="text"], input[type="date"], select')) {
    if (!el.getClientRects().length) continue;
    const st = getComputedStyle(el);
    const o = oran(kar(ayir(st.borderTopColor), zemin(el.parentElement)), zemin(el.parentElement));
    if (o < 3) kenarKotu.push(`${o.toFixed(2)} ${el.id}`);
  }
  return { metinKotu: [...new Set(metinKotu)], kenarKotu, enDusuk: Math.round(enDusuk * 100) / 100 };
});

/** Sayfa düzeyinde yatay kaydırma ve kırpılan metin (tablo kabı hariç: veri tablosu kendi kabında kayar). */
const yenidenAkis = (page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const yatay = document.documentElement.scrollWidth > vw || document.body.scrollWidth > vw;
  const disari = [], kirpik = [];
  for (const el of document.querySelectorAll('input, select, button, a.btn-ikincil, h1, h2, h3, p, li, label, dt, dd, legend, blockquote')) {
    if (!el.getClientRects().length || el.closest('.tablo-sar, .sr-only, .formul, .kucuk-sar')) continue;
    const r = el.getBoundingClientRect();
    if (r.width && (r.left < -0.5 || r.right > vw + 0.5)) disari.push(el.id || el.tagName);
    const st = getComputedStyle(el);
    if ((st.overflowX === 'hidden' || st.overflowX === 'clip') && el.scrollWidth > el.clientWidth + 1) kirpik.push(el.id || el.tagName);
  }
  // .formul ve küçük tablolar kendi kaplarında kayar (overflow-x:auto): kap sayfayı taşırmamalı
  const kaplar = [...document.querySelectorAll('.formul, .kucuk-sar, .tablo-sar')].filter((k) => k.getBoundingClientRect().right > vw + 0.5).map((k) => k.className);
  return { yatay, disari: [...new Set(disari)].slice(0, 8), kirpik: kirpik.slice(0, 8), kaplar };
});

// ============================================================================
if (!CIHAZ) {
  bolum('E1 axe-core (WCAG 2.0/2.1/2.2 A+AA + best-practice)');
  const durumlar = [
    ['veri (bugün, 11/24)', '/dengesizlik-maliyeti', null],
    ['geçmiş gün (24/24)', '/dengesizlik-maliyeti?tarih=2026-11-23', null],
    ['bekleme', '/dengesizlik-maliyeti?veriyok', null],
    ['alan hatası', '/dengesizlik-maliyeti', async (p) => { await p.fill('#hMiktar', 'abc'); await p.click('#hGun button[type="submit"]'); }],
    ['gün sonucu', '/dengesizlik-maliyeti', async (p) => { await p.fill('#hMiktar', '5'); await p.click('#hGun button[type="submit"]'); }],
    ['senaryo sonucu', '/dengesizlik-maliyeti', async (p) => { await p.check('#hModSenaryo'); await p.fill('#sPtf', '2800'); await p.fill('#sSmf', '3400'); await p.fill('#sMiktar', '10'); await p.click('#hSenaryo button[type="submit"]'); }],
    ['senaryo ret (boş teslim günü)', '/dengesizlik-maliyeti', async (p) => { await p.check('#hModSenaryo'); await p.fill('#sGun', ''); await p.fill('#sPtf', '2800'); await p.fill('#sSmf', '3400'); await p.fill('#sMiktar', '10'); await p.click('#hSenaryo button[type="submit"]'); }],
    ['aralık hatası', '/dengesizlik-maliyeti', async (p) => { await p.fill('#dBas', '2026-10-01'); await p.fill('#dBit', '2026-11-10'); await p.click('#dAralikForm button[type="submit"]'); }],
  ];
  for (const w of [1280, 390]) {
    for (const [ad, yol, eylem] of durumlar) {
      const { page, kayit, kapat } = await ac(yol, { w, h: w === 390 ? 844 : 900 });
      if (eylem) { await eylem(page); await page.waitForTimeout(100); }
      const r = await axeKos(page);
      ok(`E1 ${w}px ${ad}: axe WCAG A/AA ihlali yok`, r.wcag.length === 0, `-> ${JSON.stringify(r.wcag)}`);
      ok(`E1 ${w}px ${ad}: axe best-practice ihlali yok`, r.iyiUygulama.length === 0, `-> ${JSON.stringify(r.iyiUygulama)}`);
      if (r.ihlal.length) not(`E1 ${w}px ${ad}: axe ihlal kuralları: ${r.ihlal.map((x) => `${x.id}${x.wcag ? '(wcag)' : '(bp)'}×${x.dugum}`).join(', ')}`);
      if (r.eksik.length) not(`E1 ${w}px ${ad}: axe "incomplete" (elle bakılacak): ${r.eksik.map((x) => `${x.id}×${x.dugum}`).join(', ')}`);
      ok(`E1 ${w}px ${ad}: JS hatası yok`, kayit.hata.length === 0, `-> ${kayit.hata}`);
      await kapat();
    }
  }

  // ==========================================================================
  bolum('E2 klavye: sayfanın tamamında sekme sırası ve görünür odak');
  {
    const { page, kayit, kapat } = await ac('/dengesizlik-maliyeti?tarih=2026-11-23', { w: 1280, h: 900 });
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
    const duraklar = [];
    for (let i = 0; i < 160; i++) {
      await page.keyboard.press('Tab');
      const d = await page.evaluate(() => {
        const e = document.activeElement;
        if (!e || e === document.body) return null;
        const st = getComputedStyle(e), r = e.getBoundingClientRect();
        const merkez = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1));
        const sira = [...document.querySelectorAll('a[href], a[tabindex], button, input, select, textarea, [tabindex]')].indexOf(e);
        return {
          ad: e.id || `${e.tagName}${e.getAttribute('href') ? `[${e.getAttribute('href')}]` : ''}${e.type === 'radio' ? `[${e.value}]` : ''}`,
          tur: e.type || e.tagName, sira,
          cerceve: (st.outlineStyle === 'solid' && parseFloat(st.outlineWidth) >= 2) || (st.boxShadow && st.boxShadow !== 'none'),
          fv: e.matches(':focus-visible'),
          gorunur: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
          ortulu: !!merkez && merkez !== e && !e.contains(merkez) && !merkez.contains(e),
          tabindexPozitif: e.tabIndex > 0,
        };
      });
      if (!d) break;
      if (duraklar.length && d.ad === duraklar[0].ad && d.sira === duraklar[0].sira) break;
      duraklar.push(d);
    }
    const adlar = duraklar.map((d) => d.ad);
    // Tarih alanının iç bölümleri (gün/ay/yıl) motorun kendi odak çizimini kullanır; ana öğe :focus-visible değildir.
    const cercevesiz = duraklar.filter((d) => !d.cerceve && !(d.tur === 'date' && !d.fv));
    ok('E2 her durakta görünür odak (outline >= 2px)', cercevesiz.length === 0, `-> ${JSON.stringify(cercevesiz.slice(0, 5))}`);
    ok('E2 odaklanan öğe görünüm alanında (kaydırılır)', duraklar.every((d) => d.gorunur), `-> ${JSON.stringify(duraklar.filter((d) => !d.gorunur).slice(0, 5))}`);
    ok('E2 odaklanan öğe başka öğenin altında kalmıyor (WCAG 2.4.11)', duraklar.every((d) => !d.ortulu), `-> ${JSON.stringify(duraklar.filter((d) => d.ortulu).slice(0, 5))}`);
    ok('E2 pozitif tabindex yok; sıra DOM sırası', duraklar.every((d) => !d.tabindexPozitif) && duraklar.every((d, i) => i === 0 || d.sira >= duraklar[i - 1].sira), `-> ${adlar.join(' ')}`);
    const gerekli = ['dTarih', 'BUTTON', 'dOnceki', 'dSonraki', 'dBugun', 'dCsv', 'dXlsx', 'dJson', 'dBas', 'dBit', 'dBicim', 'hModGun', 'hDonem', 'hMiktar', 'INPUT[negatif]'];
    const eksik = gerekli.filter((g) => !adlar.some((a) => a === g || a.startsWith(g)));
    const baglantilar = adlar.filter((a) => a.startsWith('A[')).length;
    if (MOTOR === 'webkit' && baglantilar === 0) {
      // Safari'nin varsayılanı: Tab yalnız form denetimlerine gider; bağlantılar Option+Tab ile (sayfa kusuru değil).
      const formEksik = gerekli.filter((g) => !/^d(Onceki|Sonraki|Bugun|Csv|Xlsx|Json)$/.test(g)).filter((g) => !adlar.some((a) => a === g || a.startsWith(g)));
      ok('E2 (webkit, Tab yalnız form denetimleri) form denetimlerinin tümü sırada', formEksik.length === 0, `-> eksik ${formEksik} ; ${adlar.join(' ')}`);
      not(`E2 webkit: Tab bağlantılara gitmiyor (Safari varsayılanı "Tab ile her öğeyi vurgula" kapalı); ${duraklar.length} durak`);
    } else {
      ok('E2 gerekli tüm duraklar sırada (gün formu, gezinme, indirme, aralık, hesaplayıcı)', eksik.length === 0, `-> eksik ${eksik} ; ${adlar.join(' ')}`);
      ok('E2 içerik ve altbilgi bağlantıları erişilebilir (>= 15 bağlantı durağı)', baglantilar >= 15, `-> ${baglantilar}`);
    }
    not(`E2 ${MOTOR}: ${duraklar.length} sekme durağı, ${baglantilar} bağlantı`);
    // Yalnız klavyeyle tarih formu: önceki öğeden (içerik izi bağlantısı) Tab ile gün alanının ilk bölümüne gel,
    // tarihi klavyeyle yaz (bölüm sırası motorun yerel ayarına bağlı: gün.ay.yıl ya da ay/gün/yıl), Göster'e Tab, Enter.
    const yazDene = async (dizi) => {
      await page.focus('nav.crumbs a');
      let n = 0;
      while (n++ < 4 && (await page.evaluate(() => document.activeElement.id)) !== 'dTarih') await page.keyboard.press('Tab');
      if ((await page.evaluate(() => document.activeElement.id)) !== 'dTarih') return null;
      await page.keyboard.type(dizi, { delay: 30 });
      return page.inputValue('#dTarih');
    };
    let sira = 'gün.ay.yıl', deger = await yazDene('20112026');
    if (deger !== '2026-11-20') { sira = 'ay/gün/yıl'; deger = await yazDene('11202026'); }
    if (deger !== '2026-11-20') { sira = 'yıl-ay-gün'; deger = await yazDene('20261120'); }
    ok('E2 Tab ile gün alanına gelinir, tarih yalnız klavyeyle yazılır', deger === '2026-11-20', `-> "${deger}"`);
    not(`E2 ${MOTOR}: tarih alanı bölüm sırası ${deger === '2026-11-20' ? sira : 'çözülemedi'}`);
    if (deger === '2026-11-20') {
      let m = 0;
      while (m++ < 8 && (await page.evaluate(() => document.activeElement.tagName + document.activeElement.textContent)) !== 'BUTTONGöster') await page.keyboard.press('Tab');
      await Promise.all([page.waitForURL(/tarih=2026-11-20/, { timeout: 5000 }).catch(() => {}), page.keyboard.press('Enter')]);
      ok('E2 Göster + Enter ile gün değişir (GET formu)', page.url().endsWith('?tarih=2026-11-20') && (await metin(page, '#dGun')) === '20.11.2026');
      // Önceki gün bağlantısı klavyeyle (webkit'te Tab bağlantıya gitmeyebilir: odak doğrudan verilir)
      await page.focus('#dOnceki');
      await Promise.all([page.waitForURL(/tarih=2026-11-19/, { timeout: 5000 }).catch(() => {}), page.keyboard.press('Enter')]);
      ok('E2 "Önceki gün" Enter ile', page.url().endsWith('?tarih=2026-11-19'));
    }
    ok('E2 JS hatası yok', kayit.hata.length === 0, `-> ${kayit.hata}`);
    await kapat();
  }

  // ==========================================================================
  bolum('E3 canlı bölge, form etiketleri ve hata mesajları');
  {
    const { page, kapat } = await ac('/dengesizlik-maliyeti');
    const a = await page.evaluate(() => {
      const ad = (el) => { const l = el.labels && el.labels[0]; return l ? l.textContent.trim() : (el.getAttribute('aria-label') || ''); };
      return {
        sonuc: [document.getElementById('hSonuc').getAttribute('role'), document.getElementById('hSonuc').getAttribute('aria-live')].join(),
        aralik: document.getElementById('dAralikHata').getAttribute('role'),
        etiketsiz: [...document.querySelectorAll('input, select')].filter((e) => e.type !== 'hidden' && !ad(e)).map((e) => e.id || e.name),
        radyoGrup: [...document.querySelectorAll('input[type=radio]')].every((r) => r.closest('fieldset') && r.closest('fieldset').querySelector('legend')),
      };
    });
    ok('E3 sonuç bölgesi role=status + aria-live=polite', a.sonuc === 'status,polite');
    ok('E3 aralık hatası role=alert', a.aralik === 'alert');
    ok('E3 her denetimin görünür etiketi var', a.etiketsiz.length === 0, `-> ${a.etiketsiz}`);
    ok('E3 radyo grupları fieldset + legend içinde', a.radyoGrup);
    // Alan hatası: Hesapla düğmesiyle gönderim → odak alana döner, hata alanın açıklaması
    await page.fill('#hMiktar', 'abc');
    await page.focus('#hGun button[type="submit"]');
    await page.keyboard.press('Enter');
    const h1 = await page.evaluate(() => { const g = document.getElementById('hMiktar'); const d = (g.getAttribute('aria-describedby') || '').split(/\s+/).map((i) => document.getElementById(i)).filter(Boolean).map((e) => e.textContent.trim()).join(' '); return { odak: document.activeElement.id, gecersiz: g.getAttribute('aria-invalid'), aciklama: d }; });
    ok('E3 düğmeyle gönderimde: odak hatalı alana taşınır, aria-invalid, hata açıklamada', h1.odak === 'hMiktar' && h1.gecersiz === 'true' && /sayıyla girin/.test(h1.aciklama), `-> ${JSON.stringify(h1)}`);
    // Alanın içindeyken Enter: odak zaten alanda; hata ancak canlı bölgeyse duyurulur (WCAG 4.1.3)
    const canli = await page.evaluate(() => ['hMiktarHata', 'sPtfHata', 'sSmfHata', 'sMiktarHata'].map((id) => { let e = document.getElementById(id); for (; e; e = e.parentElement) { const r = e.getAttribute('role'); if (r === 'alert' || r === 'status' || (e.getAttribute('aria-live') || 'off') !== 'off') return true; } return false; }));
    ok('E3 alan hata metinleri canlı bölgede (alan içinde Enter ile gönderimde de duyurulur)', canli.every(Boolean), `-> hMiktarHata/sPtfHata/sSmfHata/sMiktarHata canlı mı: ${canli}`);
    // Senaryo: ret metni canlı sonuç bölgesine yazılır, odak teslim gününe
    await page.check('#hModSenaryo');
    // Boş teslim günü: kural tablosundan bağımsız olarak her zaman reddedilir
    await page.fill('#sGun', ''); await page.fill('#sPtf', '1'); await page.fill('#sSmf', '1'); await page.fill('#sMiktar', '1');
    await page.click('#hSenaryo button[type="submit"]');
    ok('E3 senaryo reddi canlı bölgede, odak teslim gününde', (await page.locator('#hSonuc #sRet').count()) === 1 && (await page.evaluate(() => document.activeElement.id)) === 'sGun');
    ok('E3 teslim günü alanı kural notuna bağlı (aria-describedby=hKural)', (await page.getAttribute('#sGun', 'aria-describedby')) === 'hKural');
    await kapat();
  }

  // ==========================================================================
  bolum('E4 tablo semantiği');
  {
    const { page, kapat } = await ac('/dengesizlik-maliyeti');
    const t = await page.evaluate(() => {
      const tab = document.querySelector('.dm-tablo');
      const bas = [...tab.querySelectorAll('thead th')];
      const satir = [...tab.querySelectorAll('tbody tr')];
      const sr = [...tab.querySelectorAll('thead .sr-only')];
      const srGizli = sr.every((s) => { const r = s.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; });
      const bolge = document.getElementById('dTabloSar');
      return {
        caption: (tab.caption && tab.caption.textContent.trim()) || '',
        basSayi: bas.length, basScope: bas.every((h) => h.getAttribute('scope') === 'col'),
        satirTh: satir.every((r) => r.firstElementChild.tagName === 'TH' && r.firstElementChild.getAttribute('scope') === 'row'),
        srBirim: sr.filter((s) => s.textContent.trim() === '(TL/MWh)').length, srGizli,
        bolge: [bolge.getAttribute('role'), bolge.getAttribute('aria-labelledby') === tab.caption.id].join(),
        kucuk: [...document.querySelectorAll('table.kucuk')].every((k) => k.caption && k.caption.textContent.trim() && [...k.querySelectorAll('th')].every((h) => ['col', 'row'].includes(h.getAttribute('scope')))),
        simdiSr: !!tab.querySelector('tr.simdi th .sr-only'),
      };
    });
    ok('E4 caption tarihli ve birimli', /^24\.11\.2026 · dönem bazında .* tüm değerler TL\/MWh$/.test(t.caption), `-> ${t.caption}`);
    ok('E4 8 sütun başlığı, hepsi scope=col', t.basSayi === 8 && t.basScope);
    ok('E4 her satırın ilk hücresi th scope=row', t.satirTh);
    ok('E4 6 fiyat sütununda sr-only "(TL/MWh)", görsel olarak gizli', t.srBirim === 6 && t.srGizli, `-> ${t.srBirim} ${t.srGizli}`);
    ok('E4 kaydırma kabı role=region, adı caption', t.bolge === 'region,true');
    ok('E4 yöntem tabloları caption + scope', t.kucuk);
    ok('E4 içinde bulunulan dönem ekran okuyucuya söylenir', t.simdiSr);
    ok('E4 erişilebilir ad: "PTF (TL/MWh)" sütun başlığı', (await page.getByRole('columnheader', { name: 'PTF (TL/MWh)', exact: true }).count()) === 1);
    ok('E4 erişilebilir ad: tablo caption ile adlandırılır', (await page.getByRole('table', { name: /dönem bazında PTF, SMF, sistem yönü/ }).count()) === 1);
    await kapat();
  }

  // ==========================================================================
  bolum('E5 yeniden akış: 200 % (640 px) ve 400 % (320 px) yakınlaştırmaya denk görünüm alanı');
  for (const [ad, w, h, dsf] of [['200 % (1280→640)', 640, 450, 2], ['400 % (1280→320)', 320, 256, 4], ['390 px telefon', 390, 844, 3]]) {
    for (const [durum, yol, eylem] of [
      ['veri', '/dengesizlik-maliyeti', async (p) => { await p.fill('#hMiktar', '1.250,5'); await p.click('#hGun button[type="submit"]'); }],
      ['senaryo', '/dengesizlik-maliyeti', async (p) => { await p.check('#hModSenaryo'); await p.fill('#sPtf', '4500'); await p.fill('#sSmf', '4500'); await p.fill('#sMiktar', '1000000'); await p.click('#hSenaryo button[type="submit"]'); }],
      ['hata + bekleme', '/dengesizlik-maliyeti?veriyok', async (p) => { await p.fill('#hMiktar', '0.125'); await p.click('#hGun button[type="submit"]'); await p.fill('#dBas', '2026-10-01'); await p.fill('#dBit', '2026-11-10'); await p.click('#dAralikForm button[type="submit"]'); }],
    ]) {
      const { page, kapat } = await ac(yol, { w, h, dsf });
      await eylem(page); await page.waitForTimeout(100);
      const r = await yenidenAkis(page);
      ok(`E5 ${ad} ${durum}: yatay sayfa kaydırması yok`, !r.yatay, `-> ${JSON.stringify(r)}`);
      ok(`E5 ${ad} ${durum}: öğe görünüm alanı dışına taşmıyor, metin kırpılmıyor`, !r.disari.length && !r.kirpik.length && !r.kaplar.length, `-> ${JSON.stringify(r)}`);
      await kapat();
    }
  }

  // ==========================================================================
  bolum('E6 kontrast (metin >= 4,5:1; form denetimi kenarlığı >= 3:1)');
  for (const [ad, yol, eylem] of [
    ['veri', '/dengesizlik-maliyeti', null],
    ['bekleme', '/dengesizlik-maliyeti?veriyok', null],
    ['hata', '/dengesizlik-maliyeti', async (p) => { await p.fill('#hMiktar', 'abc'); await p.click('#hGun button[type="submit"]'); await p.fill('#dBas', '2026-10-01'); await p.fill('#dBit', '2026-11-10'); await p.click('#dAralikForm button[type="submit"]'); }],
    ['senaryo', '/dengesizlik-maliyeti', async (p) => { await p.check('#hModSenaryo'); await p.fill('#sPtf', '450'); await p.fill('#sSmf', '60'); await p.selectOption('#sYon', 'fazla'); await p.fill('#sMiktar', '1'); await p.click('#hSenaryo button[type="submit"]'); }],
  ]) {
    const { page, kapat } = await ac(yol);
    if (eylem) { await eylem(page); await page.waitForTimeout(100); }
    const k = await kontrast(page);
    ok(`E6 ${ad}: metin kontrastı >= 4,5:1 (en düşük ${k.enDusuk})`, k.metinKotu.length === 0, `-> ${k.metinKotu.slice(0, 5)}`);
    ok(`E6 ${ad}: form denetimi kenarlığı >= 3:1`, k.kenarKotu.length === 0, `-> ${k.kenarKotu}`);
    await kapat();
  }

  // ==========================================================================
  bolum('E7 prefers-reduced-motion');
  {
    const { page, kapat } = await ac('/dengesizlik-maliyeti', { azalt: true });
    await page.hover('#dTarihForm button[type="submit"]');
    await page.waitForTimeout(50);
    const r = await page.evaluate(() => ({
      medya: matchMedia('(prefers-reduced-motion: reduce)').matches,
      gecis: getComputedStyle(document.querySelector('#dTarihForm button[type="submit"]')).transitionDuration,
      kaydirma: getComputedStyle(document.documentElement).scrollBehavior,
      animasyon: document.getAnimations ? document.getAnimations().length : 0,
    }));
    ok('E7 azaltılmış hareket: geçiş 0 sn, kaydırma auto, çalışan animasyon yok', r.medya && /^0s(, 0s)*$/.test(r.gecis) && r.kaydirma === 'auto' && r.animasyon === 0, `-> ${JSON.stringify(r)}`);
    await kapat();
    const b = await ac('/dengesizlik-maliyeti');
    const anim = await b.page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return s.animationName && s.animationName !== 'none'; }).length);
    ok('E7 normal modda da otomatik animasyon yok', anim === 0, `-> ${anim}`);
    await b.kapat();
  }
}

// ============================================================================
if (CIHAZ) {
  bolum(`M mobil tanımlayıcı: ${CIHAZ} (${MOTOR})`);
  for (const yol of ['/dengesizlik-maliyeti?tarih=2026-11-23', '/dengesizlik-maliyeti', '/dengesizlik-maliyeti?veriyok']) {
    const { page, kayit, kapat } = await ac(yol, { cihaz: CIHAZ });
    const ad = yol.includes('veriyok') ? 'bekleme' : yol.includes('tarih') ? 'geçmiş gün' : 'bugün';
    const r = await yenidenAkis(page);
    ok(`M ${ad}: yatay sayfa kaydırması yok`, !r.yatay && !r.disari.length, `-> ${JSON.stringify(r)}`);
    if (!yol.includes('veriyok')) {
      const kap = await page.evaluate(() => { const e = document.getElementById('dTabloSar'); return { sw: e.scrollWidth, cw: e.clientWidth, of: getComputedStyle(e).overflowX, ti: e.getAttribute('tabindex') }; });
      ok(`M ${ad}: tablo kendi kabında yatay kayar`, kap.sw > kap.cw && kap.of === 'auto' && kap.ti === '0', `-> ${JSON.stringify(kap)}`);
      await page.evaluate(() => { const e = document.getElementById('dTabloSar'); e.scrollLeft = 300; });
      await page.waitForTimeout(100);
      const sabit = await page.evaluate(() => Math.abs(document.querySelector('.dm-tablo tbody tr:nth-child(3) th').getBoundingClientRect().left - document.getElementById('dTabloSar').getBoundingClientRect().left) < 3);
      ok(`M ${ad}: dönem sütunu kayarken sabit (sticky)`, sabit);
      ok(`M ${ad}: SSR tablo satırları`, (await page.locator('#dTablo tr[data-bas]').count()) === 24);
    }
    // Dokunma ile hesap (gün modu + senaryo)
    await page.tap('#hMiktar'); await page.fill('#hMiktar', '5'); await page.tap('#hGun button[type="submit"]');
    ok(`M ${ad}: dokunarak gün hesabı`, yol.includes('veriyok') ? (await metin(page, '#gYok')).startsWith('Seçili gün için EPİAŞ verisi alınamadı') : /TL$/.test(await metin(page, '#gTutar')));
    await page.tap('label:has(#hModSenaryo)');
    await page.fill('#sPtf', '2800'); await page.fill('#sSmf', '3400'); await page.fill('#sMiktar', '10');
    await page.tap('#hSenaryo button[type="submit"]');
    ok(`M ${ad}: dokunarak senaryo hesabı (3.604,00)`, (await metin(page, '#sNegFiyat')) === '3.604,00 TL/MWh');
    const r2 = await yenidenAkis(page);
    ok(`M ${ad}: sonuç açıkken yatay kaydırma yok`, !r2.yatay && !r2.disari.length, `-> ${JSON.stringify(r2)}`);
    const girdi = await page.evaluate(() => ['hMiktar', 'sPtf', 'sGun', 'hDonem'].map((id) => ({ id, px: parseFloat(getComputedStyle(document.getElementById(id)).fontSize), im: document.getElementById(id).getAttribute('inputmode') })));
    ok(`M ${ad}: sayı alanlarında inputmode=decimal (sayısal klavye)`, girdi.filter((g) => ['hMiktar', 'sPtf'].includes(g.id)).every((g) => g.im === 'decimal'));
    // iOS Safari, yazı boyutu 16 px'ten küçük alana odaklanınca sayfayı yakınlaştırır.
    ok(`M ${ad}: form denetimi yazı boyutu >= 16 px (iOS odakta yakınlaştırmaz)`, girdi.every((g) => g.px >= 16), `-> ${JSON.stringify(girdi)}`);
    const hedef = await page.evaluate(() => [...document.querySelectorAll('button, a.btn-ikincil, input, select')].filter((e) => e.getClientRects().length && e.type !== 'radio').map((e) => { const r = e.getBoundingClientRect(); return [e.id || e.tagName, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 24 || x[2] < 24));
    ok(`M ${ad}: dokunma hedefleri >= 24x24 (WCAG 2.5.8)`, hedef.length === 0, `-> ${JSON.stringify(hedef)}`);
    const a = await axeKos(page);
    ok(`M ${ad}: axe WCAG A/AA ihlali yok`, a.wcag.length === 0, `-> ${JSON.stringify(a.wcag)}`);
    if (a.ihlal.length) not(`M ${ad}: axe ihlal kuralları: ${a.ihlal.map((x) => `${x.id}${x.wcag ? '(wcag)' : '(bp)'}×${x.dugum}`).join(', ')}`);
    ok(`M ${ad}: JS hatası yok`, kayit.hata.length === 0, `-> ${kayit.hata}`);
    await kapat();
  }
}

await browser.close();
await S.kapat();
console.log(`\n${pass} passed, ${fail} failed (${MOTOR}${CIHAZ ? ' / ' + CIHAZ : ''}; ${bilgi.length} not)`);
process.exit(fail ? 1 : 0);
