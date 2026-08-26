/**
 * Rapor dönem pencereleri — haftalık / aylık / 3 aylık / 6 aylık / yıllık.
 * Kritik değişmez: ardışık dönemler BİTİŞİK olmalı; ne boşluk ne çakışma
 * (çakışma aynı talebi iki kez raporlar, boşluk talebi kaybeder).
 *   node docs/qa/test-report-windows.mjs
 */
import { computeWindow, PERIODS } from '../../functions/api/report.js';

const IST = 3 * 3600e3;
const at = (y, m, d) => Date.UTC(y, m - 1, d, 9, 0, 0) - IST; // İstanbul 09:00
const iso = (ms) => new Date(ms + IST).toISOString().slice(0, 10);

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log(`FAIL ${n} ${x}`); } };

ok('dönem listesi eksiksiz', Object.keys(PERIODS).join() === 'weekly,monthly,quarterly,semiannual,yearly');

let w = computeWindow('quarterly', at(2026, 4, 1));
ok('3 aylık: 1 Nisan → Ocak-Mart', iso(w.from) === '2026-01-01' && iso(w.to) === '2026-04-01', w.label);
w = computeWindow('quarterly', at(2027, 1, 1));
ok('3 aylık: 1 Ocak → önceki yılın Ekim-Aralık', iso(w.from) === '2026-10-01' && iso(w.to) === '2027-01-01', w.label);

w = computeWindow('semiannual', at(2026, 7, 1));
ok('6 aylık: 1 Temmuz → Ocak-Haziran', iso(w.from) === '2026-01-01' && iso(w.to) === '2026-07-01', w.label);
w = computeWindow('semiannual', at(2027, 1, 1));
ok('6 aylık: 1 Ocak → önceki yılın Temmuz-Aralık', iso(w.from) === '2026-07-01' && iso(w.to) === '2027-01-01', w.label);

w = computeWindow('yearly', at(2027, 1, 1));
ok('yıllık: önceki takvim yılı', iso(w.from) === '2026-01-01' && iso(w.to) === '2027-01-01' && w.label === '2026', w.label);

w = computeWindow('monthly', at(2026, 9, 1));
ok('aylık bozulmadı', iso(w.from) === '2026-08-01' && iso(w.to) === '2026-09-01', w.label);
w = computeWindow('weekly', at(2026, 8, 24));
ok('haftalık bozulmadı', iso(w.from) === '2026-08-17' && iso(w.to) === '2026-08-24', w.label);
ok('bilinmeyen dönem haftalığa düşer',
  computeWindow('uydurma', at(2026, 8, 24)).from === computeWindow('weekly', at(2026, 8, 24)).from);

// Bitişiklik: yıl boyunca hiçbir gün iki kez veya sıfır kez raporlanmamalı
for (const [period, months] of [['quarterly', [1, 4, 7, 10]], ['semiannual', [1, 7]]]) {
  for (let i = 0; i < months.length; i++) {
    const cur = computeWindow(period, at(2027, months[i], 1));
    const next = computeWindow(period, at(months[i] === months[months.length - 1] ? 2028 : 2027, months[(i + 1) % months.length], 1));
    ok(`${period}: ${months[i]}. ay dönemi bir sonrakiyle bitişik`, cur.to === next.from,
      `${iso(cur.to)} vs ${iso(next.from)}`);
  }
}
// Yıllık dönemler de bitişik
ok('yıllık dönemler bitişik',
  computeWindow('yearly', at(2027, 1, 1)).to === computeWindow('yearly', at(2028, 1, 1)).from);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
