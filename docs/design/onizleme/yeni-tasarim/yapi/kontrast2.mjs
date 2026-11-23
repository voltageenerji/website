// Karşıtlık denetimi (2. tur): sayfadaki HER metin kutusu, metin gizlenmiş ekran görüntüsündeki gerçek piksellere
// karşı ölçülür; en kötü piksel raporlanır. Eşik: normal metin 4,5:1; büyük metin (≥24 px ya da ≥18,66 px kalın) 3:1.
import { chromium, SAYFA, CIKTI, hazirla } from './ortak.mjs';
import { writeFileSync } from 'fs';
const b = await chromium.launch();
const yardimci = await (await b.newContext()).newPage();
await yardimci.goto('about:blank');
async function olc(png, kutular) {
  return yardimci.evaluate(async ({ veri, kutular }) => {
    const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + veri)).blob());
    const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bm, 0, 0);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = (r, g, bb) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bb);
    return kutular.map((k) => {
      const x0 = Math.max(0, Math.floor(k.x)), y0 = Math.max(0, Math.floor(k.y)), w = Math.min(bm.width - x0, Math.ceil(k.w)), h = Math.min(bm.height - y0, Math.ceil(k.h));
      if (w <= 0 || h <= 0) return null;
      const d = x.getImageData(x0, y0, w, h).data; let enk = 99;
      for (let i = 0; i < d.length; i += 4) {
        const a = k.renk[3];
        const r = k.renk[0] * a + d[i] * (1 - a), g = k.renk[1] * a + d[i + 1] * (1 - a), bl = k.renk[2] * a + d[i + 2] * (1 - a);
        const l1 = L(r, g, bl), l2 = L(d[i], d[i + 1], d[i + 2]);
        const o = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        if (o < enk) enk = o;
      }
      return enk;
    });
  }, { veri: png.toString('base64'), kutular });
}
const YK = !!process.env.YALNIZ_KAPAK;
const satir = []; let kotu = 0, toplam = 0; const enDusuk = []; const kapak = [];
const EK = YK ? [[2560, 1300, 'tr', 'canli'], [2560, 1300, 'en', 'canli'], [1680, 1000, 'en', 'canli'], [1536, 864, 'tr', 'canli'], [1536, 864, 'en', 'canli'], [1366, 768, 'tr', 'canli'], [1366, 768, 'en', 'canli'], [1200, 800, 'en', 'canli'], [1100, 800, 'tr', 'canli'], [1100, 800, 'en', 'canli'], [1040, 800, 'en', 'canli'], [1024, 768, 'tr', 'canli'], [1024, 768, 'en', 'canli'], [900, 800, 'en', 'canli'], [700, 900, 'tr', 'canli'], [701, 900, 'en', 'canli'], [600, 900, 'en', 'canli'], [480, 800, 'en', 'canli'], [360, 640, 'en', 'canli']] : [];
for (const [w, h, dil, durum] of [...EK, [1920, 1000, 'tr', 'canli'], [1440, 900, 'tr', 'canli'], [1440, 900, 'en', 'kapali'], [1280, 800, 'tr', 'canli'], [1280, 800, 'en', 'canli'], [1040, 800, 'tr', 'canli'], [768, 900, 'tr', 'canli'], [768, 900, 'en', 'kapali'], [430, 932, 'tr', 'canli'], [390, 844, 'tr', 'canli'], [390, 844, 'en', 'canli'], [375, 667, 'tr', 'canli'], [375, 667, 'en', 'kapali'], [320, 568, 'tr', 'canli'], [320, 568, 'en', 'canli']]) {
  for (const menu of (w < 1040 && dil === 'tr' && !YK ? [false, true] : [false])) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await hazirla(ctx, { dis: false, ptf: durum });
    const p = await ctx.newPage();
    await p.goto(SAYFA + '?lang=' + dil, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    if (menu) await p.click('#mobileMenuBtn');
    const kutular = await p.evaluate((menu) => {
      const out = [];
      const kok = menu ? [document.getElementById('mobileMenu'), document.getElementById('nav')] : [document.body];
      for (const k of kok) {
        const tw = document.createTreeWalker(k, NodeFilter.SHOW_TEXT);
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          if (!n.textContent.trim()) continue;
          const el = n.parentElement; if (el.closest('script,style,svg,noscript,.hp-field,.skip,option')) continue;
          if (!menu && el.closest('#mobileMenu')) continue;
          const cs = getComputedStyle(el);
          let gor = true; for (let a = el; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) { gor = false; break; } }
          if (!gor) continue;
          const m = cs.color.match(/[\d.]+/g).map(Number); const renk = [m[0], m[1], m[2], m[3] === undefined ? 1 : m[3]];
          const boy = parseFloat(cs.fontSize), kalin = +cs.fontWeight >= 600;
          const buyuk = boy >= 24 || (boy >= 18.66 && kalin);
          const r = document.createRange(); r.selectNodeContents(n);
          for (const q of r.getClientRects()) { if (q.width < 2 || q.height < 2) continue; out.push({ x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height, renk, buyuk, kapak: !!el.closest('.hero, #nav') && scrollY === 0, yazi: n.textContent.trim().slice(0, 40), sinif: (el.className || el.tagName).toString().slice(0, 22), boy }); }
        }
      }
      return out;
    }, menu);
    await p.addStyleTag({ content: '*, *::before, *::after { color: transparent !important; text-shadow: none !important; text-decoration: none !important; -webkit-text-fill-color: transparent !important; caret-color: transparent !important; } ::placeholder { color: transparent !important; } ::file-selector-button { color: transparent !important; } .kf-stamp::before, .h1-ust::before { visibility: hidden !important; } .arrow { visibility: hidden !important; }' });
    await p.waitForTimeout(150);
    const png = await p.screenshot({ fullPage: !menu && !YK });
    if (YK) { const vh = h; for (let i = kutular.length - 1; i >= 0; i--) if (!kutular[i].kapak || kutular[i].y + kutular[i].h > vh) kutular.splice(i, 1); }
    const s = await olc(png, kutular);
    const ad = `${w}px ${dil.toUpperCase()}${durum === 'kapali' ? ' veri-yok' : ''}${menu ? ' menü' : ''}`;
    let enk = 99, n = 0, k = 0;
    kutular.forEach((kt, i) => {
      if (s[i] == null) return; toplam++; n++;
      const esik = kt.buyuk ? 3 : 4.5;
      if (s[i] < enk) enk = s[i];
      enDusuk.push([s[i], `${ad} .${kt.sinif} "${kt.yazi}" ${kt.boy}px`]);
      if (kt.kapak) kapak.push([s[i], ad, kt.sinif, kt.yazi, kt.boy, kt.buyuk]);
      if (s[i] < esik) { kotu++; k++; satir.push(`DÜŞÜK ${ad}: ${s[i].toFixed(2)} (eşik ${esik})  .${kt.sinif}  "${kt.yazi}"  ${kt.boy}px`); console.log(satir[satir.length - 1]); }
    });
    satir.push(`${ad}: ${n} metin kutusu, en düşük ${enk.toFixed(2)}:1, eşik altı ${k}`);
    await ctx.close();
  }
}
enDusuk.sort((a, c) => a[0] - c[0]);
const kapakOzet = {};
for (const [o, ad, sinif, yazi, boy, buyuk] of kapak) { const anahtar = ad + ' · ' + sinif; if (!(anahtar in kapakOzet) || o < kapakOzet[anahtar][0]) kapakOzet[anahtar] = [o, yazi, boy, buyuk]; }
const cikti = ['KARŞITLIK DENETİMİ (2. tur) — her metin kutusunun altındaki gerçek piksellere karşı, en kötü piksel', 'Eşik: normal metin 4,5:1; büyük metin (≥24 px ya da ≥18,66 px kalın) 3:1', '',
  `Toplam metin kutusu: ${toplam}; eşik altında kalan: ${kotu}`, 'En düşük sekiz: ', ...enDusuk.slice(0, 8).map(e => '  ' + e[0].toFixed(2) + ':1  ' + e[1]), '', 'GÖRÜNÜM BAŞINA:', ...satir.filter(s => !s.startsWith('DÜŞÜK')).map(s => '  ' + s), '',
  'EŞİK ALTI:', ...(satir.filter(s => s.startsWith('DÜŞÜK')).length ? satir.filter(s => s.startsWith('DÜŞÜK')).map(s => '  ' + s) : ['  yok']), '',
  'KAPAK VE ÜST BANT (fotoğraf üstü) — öğe başına en kötü piksel:', ...Object.entries(kapakOzet).sort().map(([k, v]) => `  ${v[0].toFixed(2).padStart(6)}:1  ${v[3] ? '(büyük) ' : ''}${k}  "${v[1]}" ${v[2]}px`)];
if (!YK) writeFileSync(`${CIKTI}/r2/karsitlik.txt`, cikti.join('\n') + '\n');
else console.log(Object.entries(kapakOzet).filter(([k]) => /h1-ana|hero-sub|h1-ust|· A$|lang-btn$|nav-logo-sub|btn-ghost/.test(k)).sort().map(([k, v]) => `${v[0].toFixed(2).padStart(6)}  ${k}`).join('\n'));
console.log(`\nToplam metin kutusu: ${toplam}; eşik altında kalan: ${kotu}`);
console.log('En düşük beş: ' + enDusuk.slice(0, 5).map(e => e[0].toFixed(2) + ' ' + e[1]).join(' | '));
await b.close();
