#!/usr/bin/env node
/**
 * GERÇEK Safari (macOS, safaridriver + WebDriver) duman testi — /dengesizlik-maliyeti.
 * Önkoşul: `sudo safaridriver --enable`; docs/qa/dengesizlik-ci-sunucu.mjs çalışıyor (QA_TABAN).
 * !!! Sayfadaki fiyatlar UYDURMA TEST VERİSİDİR.
 *
 *   SELENIUM_MODUL=<node_modules> QA_TABAN=http://127.0.0.1:8787 node docs/qa/safari-smoke.mjs
 *
 * Denetlenen: SSR tablosu (24 satır), tarihli özet, damga, yatay taşma yok, JS hatası / CSP ihlali
 * yok (sayfaya ilk betikten önce eklenen yakalayıcı), hesaplayıcının iki modu (değerler beklenen
 * formül sonucu), alan hatası (Enter), teslim günü alanı, aralık formu satır içi hata, bekleme hâli,
 * tarih formunun gönderimi. Çıktı yalnız denetim adları ve sayılar.
 */
import { createRequire } from 'node:module';

const req = createRequire((process.env.SELENIUM_MODUL || process.cwd() + '/node_modules').replace(/\/?$/, '/'));
const { Builder, By, Key, until } = req('selenium-webdriver');
const TABAN = process.env.QA_TABAN || 'http://127.0.0.1:8787';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log(`  FAIL ${n}`); } };

const d = await new Builder().forBrowser('safari').build();
try {
  const cap = await d.getCapabilities();
  console.log(`# Safari ${cap.get('browserVersion')} · ${cap.get('platformName')}`);
  await d.manage().window().setRect({ width: 1280, height: 900 });
  const js = (f, ...a) => d.executeScript(f, ...a);
  const metin = (id) => js(`var e=document.getElementById(arguments[0]);return e?e.textContent.replace(/\\s+/g,' ').trim():null`, id);
  const hatalar = () => js('return (window.__qaHata||["yakalayici-yok"]).length');

  // 1) Geçmiş gün: SSR verisi
  await d.get(`${TABAN}/dengesizlik-maliyeti?tarih=2026-11-23`);
  await d.wait(until.elementLocated(By.css('#dTablo tr[data-bas]')), 10000);
  await d.sleep(800);
  ok('SSR tablo 24 satır', (await js("return document.querySelectorAll('#dTablo tr[data-bas]').length")) === 24);
  ok('tarihli özet cümlesi', (await metin('dOzet')).startsWith('23.11.2026 dengesizlik özeti (24 dönemin tamamı)'));
  ok('damga <time> ve EPİAŞ VERİSİ', (await metin('dMod')) === 'EPİAŞ VERİSİ' && (await js("return !!document.querySelector('#dDamga time')")));
  ok('1280 px yatay taşma yok', await js('return document.documentElement.scrollWidth <= document.documentElement.clientWidth'));
  ok('indirme bağlantıları açık', (await js("return document.getElementById('dCsv').getAttribute('href')")) === '/dengesizlik-maliyeti/veri?tarih=2026-11-23&bicim=csv');
  // Gün modu: son yayımlanan dönem (23:00, dengede: negatif 2.296,90)
  const miktar = await d.findElement(By.id('hMiktar'));
  await miktar.clear(); await miktar.sendKeys('5', Key.ENTER);
  await d.sleep(300);
  ok('gün modu: fiyat ve tutar', (await metin('gFiyat')) === '2.296,90 TL/MWh' && (await metin('gTutar')) === '11.484,50 TL');
  await miktar.clear(); await miktar.sendKeys('0.125', Key.ENTER);
  await d.sleep(300);
  ok('gün modu: belirsiz nokta reddedilir, aria-invalid', (await metin('hMiktarHata')).startsWith('Bu giriş belirsiz.') && (await js("return document.getElementById('hMiktar').getAttribute('aria-invalid')")) === 'true' && (await js("return document.getElementById('hSonuc').innerHTML")) === '');
  // Senaryo modu (teslim günü varsayılanı Safari'nin bugünü)
  await d.findElement(By.id('hModSenaryo')).click();
  await d.sleep(200);
  ok('senaryo formu görünür, teslim günü dolu', await d.findElement(By.id('hSenaryo')).isDisplayed() && /^\d{4}-\d{2}-\d{2}$/.test(await js("return document.getElementById('sGun').value")));
  for (const [id, v] of [['sPtf', '2800'], ['sSmf', '3400'], ['sMiktar', '10']]) { const e = await d.findElement(By.id(id)); await e.clear(); await e.sendKeys(v); }
  await d.findElement(By.css('#hSenaryo button[type="submit"]')).click();
  await d.sleep(300);
  ok('senaryo: 3.604,00 / 2.716,00 / 36.040,00', (await metin('sNegFiyat')) === '3.604,00 TL/MWh' && (await metin('sPozFiyat')) === '2.716,00 TL/MWh' && (await metin('sNegTutar')) === '36.040,00 TL');
  await js("var e=document.getElementById('sGun');e.value='';e.dispatchEvent(new Event('input'))");
  await d.findElement(By.css('#hSenaryo button[type="submit"]')).click();
  await d.sleep(300);
  ok('senaryo: boş teslim günü reddedilir, rakam yok', (await metin('sRet') || '').startsWith('Teslim gününü 01.01.2026 ile') && !(await js("return /TL\\/MWh/.test(document.getElementById('hSonuc').textContent)")));
  // Aralık formu: 41 gün → satır içi hata
  await js("document.getElementById('dBas').value='2026-10-01';document.getElementById('dBit').value='2026-11-10'");
  await d.findElement(By.css('#dAralikForm button[type="submit"]')).click();
  await d.sleep(300);
  ok('aralık formu: satır içi hata (role=alert)', (await metin('dAralikHata')) === 'Tek dosyada en çok 31 gün indirilebilir. Seçilen aralık 41 gün.');
  ok('geçmiş gün: JS hatası / CSP ihlali yok', (await hatalar()) === 0);
  // Tarih formu (GET)
  await js("document.getElementById('dTarih').value='2026-11-20'");
  await d.findElement(By.css('#dTarihForm button[type="submit"]')).click();
  await d.wait(until.urlContains('tarih=2026-11-20'), 10000);
  await d.sleep(500);
  ok('tarih formu gider', (await metin('dGun')) === '20.11.2026' && (await hatalar()) === 0);

  // 2) Dar pencere (Safari'nin izin verdiği en dar genişlik)
  await d.manage().window().setRect({ width: 400, height: 900 });
  await d.sleep(500);
  const g = await js('return document.documentElement.clientWidth');
  ok(`dar pencere (${g} px): yatay taşma yok, tablo kendi kabında kayar`, await js("var d=document.documentElement,k=document.getElementById('dTabloSar');return d.scrollWidth<=d.clientWidth && (d.clientWidth>=1000 || k.scrollWidth>k.clientWidth)"));
  console.log(`  dar pencere istemci genişliği: ${g}`);

  // 3) Bekleme hâli
  await d.manage().window().setRect({ width: 1280, height: 900 });
  await d.get(`${TABAN}/dengesizlik-maliyeti?veriyok`);
  await d.sleep(1000);
  ok('bekleme: tablo bekliyor, damga BEKLENİYOR, indirme pasif', (await metin('dDamga')) === 'EPİAŞ VERİSİ BEKLENİYOR' && (await js("return document.getElementById('dCsv').getAttribute('aria-disabled')")) === 'true');
  ok('bekleme: JS hatası yok', (await hatalar()) === 0);

  // 4) Bugün (sunucunun sahte "bugün"ü 24.11.2026; 11/24 yayımlanmış)
  await d.get(`${TABAN}/dengesizlik-maliyeti?tarih=2026-11-24`);
  await d.sleep(1000);
  ok('kısmi gün: 11 / 24, yayımlanmamış hücre "—"', (await metin('dYayim')) === '11 / 24' && (await js("return document.querySelectorAll('#dTablo td.bos').length")) === 13 * 6);
  ok('kısmi gün: JS hatası yok', (await hatalar()) === 0);
} catch (e) {
  fail++;
  console.log(`  FAIL beklenmeyen hata: ${e && e.name}`);
} finally {
  await d.quit();
}
console.log(`\n${pass} passed, ${fail} failed (Safari)`);
process.exit(fail ? 1 : 0);
