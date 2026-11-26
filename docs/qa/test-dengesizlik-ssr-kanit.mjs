/**
 * /dengesizlik-maliyeti — SSR / tarayıcı-dışı okuyucu (arama motoru, GEO, LLM ajanı) kanıtı.
 *
 * A) Sahte proxy'li yerel sunucu (GERÇEK fonksiyon modülleri; !!! fiyatlar UYDURMA TEST VERİSİDİR):
 *    JavaScript ÇALIŞTIRMADAN alınan HTML'de (düz fetch; Googlebot, Bingbot, GPTBot, ClaudeBot,
 *    PerplexityBot kullanıcı ajanları; Playwright javaScriptEnabled:false) şunların bulunduğu kanıtlanır:
 *    tablonun TÜM hücreleri (veri ucundaki değerlerle birebir), tarihli özet cümlesi ve ortalamalar,
 *    özet bandı, damga (<time>), yöntem bölümü (formüller, k/l katsayıları, V/B/AFL), örnek hesap,
 *    SSS, JSON-LD (Dataset, FAQPage = görünen SSS metni birebir). Kullanıcı ajanına göre farklı
 *    içerik (cloaking) yoktur: gövdeler bayt bayt aynıdır.
 * B) --canli <taban> (önizleme): sayfa, tarihli sayfa ve /veri için GET ve HEAD'de
 *    X-Robots-Tag "noindex, nofollow", GET HTML'de tek robots meta "noindex, nofollow",
 *    canonical https://voltage.com.tr/…; bekleme hâlinde fiyat biçimli rakam yok. Çıktı yalnız
 *    durum kodu ve doğru/yanlış (yanıt gövdesi basılmaz).
 *
 * Çalıştırma: node docs/qa/test-dengesizlik-ssr-kanit.mjs [--canli https://<önizleme>.pages.dev]
 *   TARAYICI / PLAYWRIGHT_MODUL: JS'siz tarayıcı denetimi için (varsayılan yerel Chromium).
 * Başarısızlıkta çıkış kodu 1.
 */
import { createRequire } from 'node:module';
import { sunucuBaslat } from './dengesizlik-test-sunucu.mjs';
import { sahteGun } from './dengesizlik-test-verisi.mjs';
import { bicim } from '../../functions/dengesizlik-maliyeti.js';
import { kuralBul, birimFiyat } from '../../functions/_lib/dengesizlik.js';

const CI = process.env.QA_CI_GUNLUK === '1';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) pass++; else { fail++; console.log(`  FAIL ${n}${CI ? '' : ' ' + extra}`); } };
const bolum = (ad) => console.log(`# ${ad}`);

const UA = {
  'düz fetch': null,
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Googlebot Smartphone': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
};
const coz = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
/** Etiketleri boşlukla değiştirir (tarayıcısız metin çıkaran okuyucuların davranışı). */
const cozB = (s) => coz(s.replace(/<(\/?(td|th|tr|p|li|h\d|div|caption|br)\b[^>]*)>/gi, ' <$1>'));
const ilk = (re, s) => { const m = re.exec(s); return m ? m[1] : null; };
const jsonLd = (h) => { try { return JSON.parse(ilk(/<script type="application\/ld\+json" id="dJsonLd">([\s\S]*?)<\/script>/, h))['@graph']; } catch (e) { return null; } };
const YON = { acik: 'Enerji açığı', fazla: 'Enerji fazlası', denge: 'Dengede' };
const tarihTR = (g) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;

async function al(url, { yontem = 'GET', ua = null, accept = 'text/html' } = {}) {
  const headers = { Accept: accept };
  if (ua) headers['User-Agent'] = ua;
  const r = await fetch(url, { method: yontem, headers, redirect: 'manual' });
  const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
  return { durum: r.status, h, metin: yontem === 'HEAD' ? '' : await r.text() };
}

const ci = process.argv.indexOf('--canli');
const CANLI = ci !== -1 ? (process.argv[ci + 1] || '').replace(/\/+$/, '') : '';

// ============================================================================
bolum('A sahte proxy, JavaScript yok: sunucu HTML’i');
const OZEL = { ptf: 450, smf: 60, pozitif: -106, negatif: 463.5, yon: 'fazla', yonHam: 'Enerji Fazlası' };
const S = await sunucuBaslat({ gun: (g) => sahteGun(g, g === '2026-11-24' ? 11 : 24).map((o, i) => (i === 4 ? { ...o, ...OZEL } : o)) });
for (const [ad, sorgu, tarih] of [['bugün (11/24, tarihsiz)', '', '2026-11-24'], ['geçmiş gün (tarihli)', '?tarih=2026-11-23', '2026-11-23']]) {
  const j = JSON.parse((await al(`${S.url}/dengesizlik-maliyeti/veri?tarih=${tarih}&bicim=json`, { accept: 'application/json' })).metin);
  const govdeler = {};
  for (const [uaAd, ua] of Object.entries(UA)) {
    const s = await al(`${S.url}/dengesizlik-maliyeti${sorgu}`, { ua });
    govdeler[uaAd] = s.metin;
  }
  const h = govdeler['düz fetch'];
  const farkli = Object.entries(govdeler).filter(([, g]) => g !== h).map(([k]) => k);
  ok(`A ${ad}: ${Object.keys(UA).length} kullanıcı ajanına bayt bayt aynı HTML (cloaking yok)`, farkli.length === 0, `-> ${farkli}`);
  ok(`A ${ad}: sunucu render işareti`, /<body data-ssr="1"/.test(h) && h.includes(`data-tarih="${tarih}"`));
  // Tablo: her hücre veri ucundaki değerle birebir
  let hucre = 0, dogru = 0, sifirUydurma = 0;
  const kotu = [];
  for (const d of j.donemler) {
    const m = new RegExp(`<tr[^>]*data-bas="${d.bas.replace('+', '\\+')}"[^>]*>([\\s\\S]*?)</tr>`).exec(h);
    const c = m ? [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((x) => coz(x[1])) : [];
    const bek = [d.bas.slice(11, 16) + '–' + (d.bit.slice(11, 16) === '00:00' ? '24:00' : d.bit.slice(11, 16)), bicim(d.ptf), bicim(d.smf), d.yon ? YON[d.yon] : '—', bicim(d.pozitif), bicim(d.negatif), bicim(d.maliyetPozitif), bicim(d.maliyetNegatif)];
    bek.forEach((b, i) => { hucre++; const v = (c[i] || '').replace(/ \(içinde bulunulan dönem\)$/, '').replace(/ † \(yayımlanan fiyat formül sonucundan farklı\)$/, ''); if (v === b) dogru++; else kotu.push(`${d.bas.slice(11, 16)}#${i}`); if (b === '—' && v === '0,00') sifirUydurma++; });
  }
  ok(`A ${ad}: tablonun ${j.donemler.length} satırı × 8 hücresi veri ucuyla birebir (${dogru}/${hucre})`, hucre === j.donemler.length * 8 && dogru === hucre, `-> ${kotu.slice(0, 6)}`);
  const bosHucre = ((ilk(/(<tbody id="dTablo">[\s\S]*?<\/tbody>)/, h) || '').match(/<td class="(yon )?bos">—<\/td>/g) || []).length;
  ok(`A ${ad}: yayımlanmamış hücre "—", 0 değil (${bosHucre} boş hücre)`, sifirUydurma === 0 && bosHucre === (tarih === '2026-11-24' ? 13 * 6 : 0), `-> ${bosHucre}`);
  // Tarihli özet cümlesi
  const o = j.ozet;
  const oz = coz(ilk(/<p class="day-sum" id="dOzet">([\s\S]*?)<\/p>/, h) || '');
  const kapsam = o.yayimlanan === o.toplam ? `${o.toplam} dönemin tamamı` : `${o.yayimlanan}/${o.toplam} dönem`;
  ok(`A ${ad}: tarihli özet cümlesi + ortalamalar + yön sayıları + atıf ve çekim anı`, oz.startsWith(`${tarihTR(tarih)} dengesizlik özeti (${kapsam}): ortalama pozitif dengesizlik fiyatı ${bicim(o.pozitifOrt)} TL/MWh; ortalama negatif dengesizlik fiyatı ${bicim(o.negatifOrt)} TL/MWh; ortalama PTF ${bicim(o.ptfOrt)} TL/MWh; ortalama SMF ${bicim(o.smfOrt)} TL/MWh.`)
    && oz.includes(`${bicim(o.maliyetPozitifOrt)} TL/MWh`) && oz.includes(`${bicim(o.maliyetNegatifOrt)} TL/MWh`)
    && oz.includes(`Sistem yönü: ${o.yon.acik} dönem enerji açığı, ${o.yon.fazla} dönem enerji fazlası, ${o.yon.denge} dönem dengede.`)
    && oz.includes(`Veri: EPİAŞ Şeffaflık Platformu, ${tarihTR(j.cekildi.slice(0, 10))} ${j.cekildi.slice(11, 16)} (Türkiye saati) itibarıyla`), `-> ${oz.slice(0, 160)}`);
  ok(`A ${ad}: özet bandı (yayımlanan/toplam, 4 ortalama, yön sayıları) ve damga <time>`, h.includes(`<span id="dYayim">${o.yayimlanan} / ${o.toplam}</span>`) && h.includes(`<div class="cv" id="dPtfOrt">${bicim(o.ptfOrt)}</div>`) && h.includes(`<div class="cv" id="dMalNeg">${bicim(o.maliyetNegatifOrt)}</div>`) && h.includes(`<b id="dYonAcik">${o.yon.acik}</b>`) && h.includes(`<time datetime="${j.cekildi}">`));
  // Yöntem bölümü
  const yontem = cozB(h.slice(h.indexOf('<h2 id="yontem">'), h.indexOf('<h2 id="kapsam">')));
  ok(`A ${ad}: yöntem bölümü (R8): çarpan kuralı + iki formül + ek kurallar + dayanak`, ["Sistem enerji fazlasındaysa (arz fazlası) pozitif dengesizlikte çarpan %6, negatif dengesizlikte %3'tür.", "Sistem enerji açığındaysa (talep fazlası) negatif dengesizlikte çarpan %6, pozitif dengesizlikte %3'tür.", "Sistem dengedeyse ikisi de %3'tür.", 'Pozitif dengesizlik fiyatı = min(PTF; SMF) × (1 − çarpan)', 'Negatif dengesizlik fiyatı = max(PTF; SMF) × (1 + çarpan)', "Çok düşük fiyatlı saatlerde ve azami fiyat limitinde yönetmelikteki ek kurallar uygulanır; tabloda EPİAŞ'ın yayımladığı değer gösterilir.", 'Dayanak: Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği m.110; katsayılar 11/12/2025 tarihli ve 14030 sayılı Kurul Kararı.'].every((x) => yontem.includes(x)), `-> ${yontem.slice(0, 200)}`);
  ok(`A ${ad}: (R8) V/B/AFL parametre tablosu ve katsayı tablosu yok`, !h.includes('id="dSabit"') && !h.includes('id="dKatsayi"') && !/Tavan çarpanı|14911|14459/.test(yontem));
  // Örnek hesap: SSR'da, kodla hesaplanan değer kütüphaneyle aynı
  const ornek = coz(ilk(/<div class="ornek" id="dOrnek">([\s\S]*?)<\/div>/, h) || '');
  const son = [...j.donemler].reverse().find((d) => d.pozitif !== null && d.yon);
  const r = birimFiyat({ ptf: son.ptf, smfN: son.smf, smfP: son.smf, yon: son.yon }, kuralBul(tarih));
  ok(`A ${ad}: (R8) örnek hesap bölümü yok; formül kütüphanesi yine çalışır`, !h.includes('id="dOrnek"') && r !== null && Number.isFinite(r.negatif) && Number.isFinite(r.pozitif), `-> ${ornek.slice(0, 120)}`);
  // SSS ve JSON-LD
  const sssHtml = ilk(/<div id="dSss">([\s\S]*?)<\/div>/, h) || '';
  const sss = [...sssHtml.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [coz(m[1]), coz(m[2])]);
  const graf = jsonLd(h) || [];
  const faq = graf.find((n) => n['@type'] === 'FAQPage');
  const faqCift = faq ? faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]) : [];
  ok(`A ${ad}: JSON-LD ayrıştırılır; Organization, BreadcrumbList, WebPage, Dataset, WebApplication, FAQPage`, ['Organization', 'BreadcrumbList', 'WebPage', 'Dataset', 'WebApplication', 'FAQPage'].every((t) => graf.some((n) => n['@type'] === t)));
  ok(`A ${ad}: SSS 4 soru (R8), FAQPage soru ve cevapları görünen SSS metniyle birebir`, sss.length === 4 && JSON.stringify(sss) === JSON.stringify(faqCift), `-> ${sss.length}/${faqCift.length} ${sss.findIndex((x, i) => JSON.stringify(x) !== JSON.stringify(faqCift[i]))}`);
  const ds = graf.find((n) => n['@type'] === 'Dataset') || {};
  const wp = graf.find((n) => n['@type'] === 'WebPage') || {};
  ok(`A ${ad}: Dataset dateModified = çekim anı, kapsam ve indirme adresleri`, ds.dateModified === j.cekildi && wp.dateModified === j.cekildi && (sorgu ? ds.temporalCoverage === tarih && ds.distribution.every((d) => d.contentUrl.includes(`tarih=${tarih}`)) : ds.temporalCoverage === '2026-01-01/..' && ds.distribution.length === 3), `-> ${ds.dateModified} ${ds.temporalCoverage}`);
  ok(`A ${ad}: JSON-LD'de (SSS dışında) fiyat rakamı yok`, !/\d{1,3}(\.\d{3})*,\d{2}/.test(JSON.stringify(graf.filter((n) => n['@type'] !== 'FAQPage'))));
  ok(`A ${ad}: robots ve canonical`, sorgu ? h.includes('<meta name="robots" content="noindex, follow">') && h.includes(`<link rel="canonical" href="https://voltage.com.tr/dengesizlik-maliyeti?tarih=${tarih}">`) : h.includes('<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">') && h.includes('<link rel="canonical" href="https://voltage.com.tr/dengesizlik-maliyeti">'));
  // Düz metin okuyucu (etiketleri atan LLM/RAG hattı): değerler metinde görünür
  const duz = cozB(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' '));
  const ornekSatir = j.donemler[0];
  ok(`A ${ad}: etiketsiz düz metinde tablo satırı ve özet okunur`, duz.includes(`00:00–01:00 ${bicim(ornekSatir.ptf)} ${bicim(ornekSatir.smf)} ${YON[ornekSatir.yon]} ${bicim(ornekSatir.pozitif)} ${bicim(ornekSatir.negatif)}`) && duz.includes(`${tarihTR(tarih)} dengesizlik özeti`));
}

// JS'siz tarayıcı (seçili motor)
{
  const PW_DIZIN = process.env.PLAYWRIGHT_MODUL || '/opt/node-tools/node_modules/';
  const pw = createRequire(PW_DIZIN.replace(/\/?$/, '/'))('playwright');
  const MOTOR = process.env.TARAYICI || 'chromium';
  const CHROME = process.env.CHROMIUM_PATH || (process.env.PLAYWRIGHT_MODUL ? null : '/opt/pw-browsers/chromium');
  const browser = await pw[MOTOR].launch(MOTOR === 'chromium' ? { ...(CHROME ? { executablePath: CHROME } : {}), args: ['--no-sandbox'] } : {});
  const ctx = await browser.newContext({ javaScriptEnabled: false, userAgent: UA.Googlebot, viewport: { width: 412, height: 900 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));
  const page = await ctx.newPage();
  await page.goto(`${S.url}/dengesizlik-maliyeti?tarih=2026-11-23`);
  const v = await page.evaluate(() => ({
    satir: document.querySelectorAll('#dTablo tr[data-bas]').length,
    ilkSatir: document.querySelector('#dTablo tr').innerText.replace(/\s+/g, ' ').trim(),
    ozet: document.getElementById('dOzet').innerText.slice(0, 40),
    sss: document.querySelectorAll('#dSss h3').length,
    formul: document.querySelectorAll('.formul').length,
    gorunurMetin: document.body.innerText.length,
  }));
  ok(`A ${MOTOR} ${browser.version()} JS kapalı (Googlebot UA, 412 px): 24 satır, özet, 1 formül kutusu, 4 SSS görünür (R8)`, v.satir === 24 && v.ozet.startsWith('23.11.2026 dengesizlik özeti') && v.formul === 1 && v.sss === 4 && /^00:00–01:00 2\.000,00 /.test(v.ilkSatir), `-> ${JSON.stringify(v)}`);
  await browser.close();
}
await S.kapat();

// ============================================================================
if (CANLI) {
  bolum('B canlı önizleme: dizin dışı başlıklar, meta, canonical (yalnız durum ve doğru/yanlış)');
  const yollar = [['sayfa', '/dengesizlik-maliyeti', true], ['tarihli sayfa', '/dengesizlik-maliyeti?tarih=2026-11-23', true], ['veri json', '/dengesizlik-maliyeti/veri?tarih=2026-11-23&bicim=json', false], ['veri csv', '/dengesizlik-maliyeti/veri?tarih=2026-11-23&bicim=csv', false], ['veri (tarayıcı)', '/dengesizlik-maliyeti/veri', false]];
  for (const [ad, yol, html] of yollar) {
    for (const ua of [null, UA.Googlebot]) {
      const acc = ad === 'veri (tarayıcı)' || html ? 'text/html' : 'application/json';
      const g = await al(CANLI + yol, { ua, accept: acc });
      const hd = await al(CANLI + yol, { ua, yontem: 'HEAD', accept: acc });
      const etiket = `B ${ad}${ua ? ' (Googlebot)' : ''}`;
      console.log(`  ${etiket}: GET ${g.durum} · HEAD ${hd.durum}`);
      ok(`${etiket}: GET ve HEAD X-Robots-Tag "noindex, nofollow"`, g.h['x-robots-tag'] === 'noindex, nofollow' && hd.h['x-robots-tag'] === 'noindex, nofollow', `-> ${g.h['x-robots-tag']} / ${hd.h['x-robots-tag']}`);
      if (/^text\/html/.test(g.h['content-type'] || '')) {
        const robots = [...g.metin.matchAll(/<meta\s+name="robots"\s+content="([^"]*)"/gi)].map((m) => m[1]);
        ok(`${etiket}: HTML'de tek robots meta "noindex, nofollow"`, JSON.stringify(robots) === '["noindex, nofollow"]', `-> ${JSON.stringify(robots)}`);
      }
      if (html) {
        const can = ilk(/<link rel="canonical" href="([^"]+)">/, g.metin);
        ok(`${etiket}: canonical voltage.com.tr`, can === `https://voltage.com.tr${yol}`, `-> ${can}`);
        ok(`${etiket}: og:url voltage.com.tr`, ilk(/<meta property="og:url" content="([^"]+)">/, g.metin) === `https://voltage.com.tr${yol}`);
        const graf = jsonLd(g.metin);
        ok(`${etiket}: JSON-LD ayrıştırılır, FAQPage = görünen SSS`, !!graf && (() => { const f = graf.find((n) => n['@type'] === 'FAQPage'); const sss = [...(ilk(/<div id="dSss">([\s\S]*?)<\/div>/, g.metin) || '').matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [coz(m[1]), coz(m[2])]); return f && sss.length === 8 && JSON.stringify(sss) === JSON.stringify(f.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])); })());
        const veriVar = /<body data-ssr="1"/.test(g.metin);
        const bant = coz((ilk(/(<section class="live"[\s\S]*?<\/section>)/, g.metin) || '') + (ilk(/(<tbody id="dTablo">[\s\S]*?<\/tbody>)/, g.metin) || '') + (ilk(/(<p class="day-sum" id="dOzet">[\s\S]*?<\/p>)/, g.metin) || ''));
        console.log(`  ${etiket}: sunucu verisi ${veriVar ? 'VAR' : 'yok (dürüst bekleme)'}`);
        if (!veriVar) ok(`${etiket}: bekleme hâlinde bant/tablo/özette fiyat biçimli rakam yok`, !/\d,\d\d/.test(bant) && bant.includes('Veri bekleniyor'));
      }
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
