#!/usr/bin/env node
/**
 * /dengesizlik-maliyeti/veri — doğrulama için CSV ve XLSX dosyaları üretir (GERÇEK veri ucu modülü,
 * SAHTE proxy). !!! İçerik UYDURMA TEST VERİSİDİR; dosya adları "TEST-VERISI" ile başlar.
 * Dosyalar kimseye gönderilmez; yalnız biçim denetimi (Open XML SDK, LibreOffice) içindir.
 *
 *   node docs/qa/dengesizlik-dosya-uret.mjs <çıkış-dizini>
 *
 * Üretilen: bugün (11/24 yayımlanmış; 04:00 eksi pozitif fiyat; boş hücreler), 3 günlük aralık,
 * bayat gün (Bilgi sayfasında "Evet …"), 15 dakikalık gün (96 dönem) — CSV ve XLSX; ayrıca
 * beklenen.json (aynı isteklerin JSON yanıtları; denetleyiciler değerleri bununla karşılaştırır).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sunucuBaslat } from './dengesizlik-test-sunucu.mjs';
import { sahteGun } from './dengesizlik-test-verisi.mjs';

const cikis = process.argv[2];
if (!cikis) { console.log('Kullanım: node docs/qa/dengesizlik-dosya-uret.mjs <çıkış-dizini>'); process.exit(2); }
mkdirSync(cikis, { recursive: true });

const OZEL = { ptf: 450, smf: 60, pozitif: -106, negatif: 463.5, yon: 'fazla', yonHam: 'Enerji Fazlası' };
const S = await sunucuBaslat({
  gun: (g) => (g === '2026-11-22' ? sahteGun(g, 96, 15) : sahteGun(g, g === '2026-11-24' ? 11 : 24).map((o, i) => (i === 4 ? { ...o, ...OZEL } : o))),
  bayat: (g) => g === '2026-11-23',
  cekildi: (g, an) => (g === '2026-11-23' ? '2026-11-23T21:05:00+03:00' : undefined) || new Date(an + 3 * 3600 * 1000).toISOString().slice(0, 19) + '+03:00',
});
const isler = [
  ['gun-2026-11-24', 'tarih=2026-11-24'],
  ['aralik-2026-11-10_2026-11-12', 'bas=2026-11-10&bit=2026-11-12'],
  ['bayat-2026-11-23', 'tarih=2026-11-23'],
  ['15dk-2026-11-22', 'tarih=2026-11-22'],
];
const beklenen = {};
let n = 0;
for (const [ad, q] of isler) {
  for (const b of ['csv', 'xlsx', 'json']) {
    const r = await fetch(`${S.url}/dengesizlik-maliyeti/veri?${q}&bicim=${b}`, { headers: { Accept: '*/*' } });
    if (r.status !== 200) { console.log(`HATA ${ad} ${b}: ${r.status}`); process.exitCode = 1; continue; }
    const bayt = Buffer.from(await r.arrayBuffer());
    if (b === 'json') { beklenen[ad] = JSON.parse(bayt.toString('utf8')); continue; }
    writeFileSync(join(cikis, `TEST-VERISI-dengesizlik-${ad}.${b}`), bayt);
    n++;
  }
}
writeFileSync(join(cikis, 'TEST-VERISI-beklenen.json'), JSON.stringify(beklenen));
await S.kapat();
console.log(`${n} dosya üretildi (TEST VERİSİ) + beklenen.json`);
