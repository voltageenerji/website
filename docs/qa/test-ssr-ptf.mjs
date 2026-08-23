// /canli-ptf sunucu render'ı — dürüstlük ve SEO çıktısı testleri.
import { readFileSync } from 'node:fs';
import { inject, pricesFrom, toPrice } from '../../functions/canli-ptf.js';

const SHELL = readFileSync(new URL('../../canli-ptf.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) pass++; else { fail++; console.log(`FAIL ${n} ${extra}`); } };

// --- toPrice: sahte 0 üretmeme kuralı ---
ok('toPrice null', toPrice(null) === null);
ok('toPrice bos string', toPrice('') === null);
ok('toPrice bosluk', toPrice('   ') === null);
ok('toPrice dizi', toPrice([]) === null);
ok('toPrice sayi', toPrice(2445.19) === 2445.19);
ok('toPrice sayisal metin', toPrice('1899.99') === 1899.99);
ok('toPrice sifir korunur', toPrice(0) === 0);

// --- pricesFrom ---
ok('pricesFrom bos', pricesFrom({ items: [] }) === null);
ok('pricesFrom null', pricesFrom(null) === null);
ok('pricesFrom tumu null -> null', pricesFrom({ items: [{ hour: 0, price: null }] }) === null);
const partial = pricesFrom({ items: [{ hour: 3, price: 1500 }, { hour: 4, price: null }] });
ok('pricesFrom 24 uzunluk', partial.length === 24);
ok('pricesFrom eksik saat null kalir', partial[0] === null && partial[4] === null);
ok('pricesFrom gercek deger', partial[3] === 1500);

// --- inject: tam gün ---
const full = Array.from({ length: 24 }, (_, h) => 1800 + h * 50);
const out = inject(SHELL, full, { monthAvg: 2222.22, range: '2026-08-01..23' });

const rows = [...out.matchAll(/<tr[^>]*><td>(\d{2}):00<\/td><td>([^<]+)<\/td><\/tr>/g)];
ok('24 satir basildi', rows.length === 24, `-> ${rows.length}`);
ok('saatler sirali', rows.every((m, i) => Number(m[1]) === i));
ok('tr-TR bicim (binlik nokta, ondalik virgul)', rows[0][2] === '1.800,00', `-> ${rows[0][2]}`);
const tbodyOf = (h) => (h.match(/<tbody id="pTable">([\s\S]*?)<\/tbody>/) || ['', ''])[1];
ok('tbody icinde bekleme satiri kalmadi', !tbodyOf(out).includes('Veri bekleniyor'), `-> ${tbodyOf(out).slice(0, 60)}`);
ok('statik kabukta bekleme satiri VAR (durust yedek)', tbodyOf(SHELL).includes('Veri bekleniyor'));
ok('min basildi', out.includes('id="pMin">1.800,00<'));
ok('maks basildi', out.includes('id="pMax">2.950,00<'));
ok('ortalama basildi', out.includes('id="pAvg">2.375,00<'));
ok('min saati', out.includes('id="pMinH">00:00<'));
ok('maks saati', out.includes('id="pMaxH">23:00<'));
ok('aylik ortalama', out.includes('id="pMo">2.222,22<'));
ok('donem etiketi', out.includes('Aylık Ortalama · 1–23 AĞU'));
ok('mod CANLI', out.includes('class="live-mode" id="pMode">CANLI<'));
ok('damga saatli', /id="pStamp">SAAT \d{2}:00 · EPİAŞ</.test(out));
ok('dateModified bugune cekildi', !out.includes('"dateModified":"2026-08-05"'));
ok('dateModified gecerli bicim', /"dateModified":"\d{4}-\d{2}-\d{2}"/.test(out));
ok('bir tek pNow degeri', (out.match(/id="pNow">/g) || []).length === 1);

// --- inject: eksik saatler (dürüstlük çekirdeği) ---
const gappy = Array.from({ length: 24 }, (_, h) => (h % 2 === 0 ? 2000 + h : null));
const out2 = inject(SHELL, gappy, null);
const rows2 = [...out2.matchAll(/<tr[^>]*><td>(\d{2}):00<\/td><td>([^<]+)<\/td><\/tr>/g)];
ok('eksik saat sayisi 24 kalir', rows2.length === 24);
ok('eksik saat — gosterir', rows2[1][2] === '—', `-> ${rows2[1][2]}`);
ok('eksik saat 0 UYDURMAZ', !rows2.some((m) => m[2] === '0,00'));
ok('aylik ortalama yoksa — kalir', out2.includes('id="pMo">—</div>'));

// --- HTML bütünlüğü ---
ok('tbody tek kez', (out.match(/<tbody id="pTable">/g) || []).length === 1);
ok('tablo kapandi', (out.match(/<\/tbody>/g) || []).length === (SHELL.match(/<\/tbody>/g) || []).length);
ok('uzunluk arttı (veri gomuldu)', out.length > SHELL.length);
ok('script bozulmadi', (out.match(/<\/script>/g) || []).length === (SHELL.match(/<\/script>/g) || []).length);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
