#!/usr/bin/env node
/**
 * VoiceOver (macOS) + gerçek Safari: ekran okuyucunun söylediklerinden duyuru kanıtı.
 * Önkoşul (CI): `npx @guidepup/setup --ci`, `sudo safaridriver --enable`, dengesizlik-ci-sunucu.mjs.
 * !!! Sayfadaki fiyatlar UYDURMA TEST VERİSİDİR.
 *
 *   QA_MODUL=<node_modules: @guidepup/guidepup + selenium-webdriver> QA_TABAN=http://127.0.0.1:8787 \
 *     [QA_KONUSMA_DOSYASI=<yol>] node docs/qa/voiceover-smoke.mjs
 *
 * Senaryolar (Safari WebDriver sayfayı sürer, VoiceOver dinler):
 *   V1 tablo: VO "sonraki tablo" komutu → tablonun adı (caption) okunur
 *   V2 sonuç bölgesi: miktar yazılıp alan içinde Enter → sonuç (aria-live=polite) okunur mu
 *   V3 alan hatası, alan içinde Enter (odak değişmez) → hata metni okunur mu (WCAG 4.1.3)
 *   V4 alan hatası, Hesapla düğmesiyle → odak alana döner; hata (açıklama) okunur mu
 * Günlüğe yalnız doğru/yanlış ve sayılar basılır; tam konuşma dökümü yalnız QA_KONUSMA_DOSYASI'na.
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const req = createRequire((process.env.QA_MODUL || process.cwd() + '/node_modules').replace(/\/?$/, '/'));
const { voiceOver } = req('@guidepup/guidepup');
const { Builder, By, Key } = req('selenium-webdriver');
const TABAN = process.env.QA_TABAN || 'http://127.0.0.1:8787';
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const sonuc = [];
const kayit = (ad, deger) => { sonuc.push([ad, deger]); console.log(`  ${ad}: ${deger}`); };
const dokum = [];

const d = await new Builder().forBrowser('safari').build();
let vo = false;
try {
  await d.manage().window().setRect({ width: 1280, height: 900 });
  await d.get(`${TABAN}/dengesizlik-maliyeti?tarih=2026-11-23`);
  await bekle(2500);
  await voiceOver.start();
  vo = true;
  await bekle(3000);
  const temizle = async () => { try { await voiceOver.clearSpokenPhraseLog(); } catch (e) { /* eski sürüm */ } };
  const log = async () => { const l = await voiceOver.spokenPhraseLog(); return l.join(' | '); };

  // V1 tablo
  await temizle();
  const K = voiceOver.keyboardCommands || {};
  if (K.findNextTable) {
    await voiceOver.perform(K.findNextTable);
    await bekle(2500);
    const l = await log(); dokum.push(['V1', l]);
    kayit('V1 sonraki tablo: caption okundu', /dönem bazında PTF, SMF, sistem yönü/i.test(l));
  } else kayit('V1 sonraki tablo', 'komut yok');

  // V2 sonuç bölgesi
  await d.executeScript("document.getElementById('hMiktar').scrollIntoView({block:'center'});document.getElementById('hMiktar').focus()");
  await bekle(1500);
  await temizle();
  await d.findElement(By.id('hMiktar')).sendKeys('5', Key.ENTER);
  await bekle(5000);
  let l = await log(); dokum.push(['V2', l]);
  kayit('V2 alan içinde Enter → sonuç bölgesi okundu (aria-live)', /11\.?484|Dengesizlik tutarı|borç/i.test(l));

  // V3 hata, alan içinde Enter
  const e = await d.findElement(By.id('hMiktar'));
  await e.clear(); await bekle(800);
  await temizle();
  await e.sendKeys('abc', Key.ENTER);
  await bekle(5000);
  l = await log(); dokum.push(['V3', l]);
  kayit('V3 alan içinde Enter → hata metni okundu', /sayıyla girin/i.test(l));

  // V4 hata, düğmeyle
  await d.executeScript("document.querySelector('#hGun button[type=submit]').focus()");
  await bekle(1500);
  await temizle();
  await d.executeScript("document.querySelector('#hGun button[type=submit]').click()");
  await bekle(5000);
  l = await log(); dokum.push(['V4', l]);
  kayit('V4 Hesapla düğmesiyle → odak alana, hata okundu', /sayıyla girin/i.test(l));
  kayit('konuşma öbeği sayısı', dokum.map(([, x]) => (x ? x.split(' | ').length : 0)).join('/'));
} catch (err) {
  kayit('HATA', err && err.name);
  process.exitCode = 1;
} finally {
  if (vo) { try { await voiceOver.stop(); } catch (e) { /* */ } }
  await d.quit();
  if (process.env.QA_KONUSMA_DOSYASI) writeFileSync(process.env.QA_KONUSMA_DOSYASI, JSON.stringify(dokum, null, 1));
}
// Bulgu raporudur: V3'ün yanlış çıkması bilinen kusuru (alan hatası canlı bölge değil) kanıtlar; çıkış kodunu değiştirmez.
console.log(`\nVoiceOver: ${sonuc.filter(([, v]) => v === true).length} doğru, ${sonuc.filter(([, v]) => v === false).length} yanlış`);
