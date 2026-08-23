// /canli-ptf sunucu render'ı — dürüstlük ve SEO çıktısı testleri.
import { readFileSync } from 'node:fs';
import { inject, pricesFrom, toPrice, onRequestGet } from '../../functions/canli-ptf.js';

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
const out = inject(SHELL, full, { monthAvg: 2222.22, monthRange: '2026-08-01..23' });

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


// --- Sözleşme uyumu: alan adı monthRange (CHANGELOG /ptf/stats) ---
const outLegacy = inject(SHELL, full, { monthAvg: 2222.22, range: '2026-08-01..23' });
ok('yanlis alan adiyla aylik ortalama BASILMAZ', outLegacy.includes('id="pMo">—</div>'));
const outNoRange = inject(SHELL, full, { monthAvg: 2222.22 });
ok('donem etiketi yoksa ATIFSIZ sayi basilmaz', outNoRange.includes('id="pMo">—</div>'));

// --- SSR işareti (istemci ilk boyamada silmesin) ---
ok('body data-ssr isaretli', out.includes('<body data-ssr="1">'));
ok('statik kabukta <body> isaretsiz', !SHELL.includes('<body data-ssr'));

// --- dateModified gerçekten bugüne eşit ---
const bugun = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
ok('dateModified = Istanbul bugun', out.includes(`"dateModified":"${bugun}"`), `-> bekl ${bugun}`);

// --- onRequestGet dayanıklılık matrisi (mock context.next) ---
const REQ = () => new Request('https://voltage.com.tr/canli-ptf');
const ctx = (next) => ({ request: REQ(), next });
const realFetch = globalThis.fetch;
const stubFetch = (todayOk) => { globalThis.fetch = async (u) => {
  if (String(u).includes('/ptf/today')) return todayOk
    ? new Response(JSON.stringify({ items: Array.from({length:24},(_,h)=>({hour:h,price:1800+h*50})) }), {status:200})
    : new Response('boom', { status: 500 });
  return new Response(JSON.stringify({ monthAvg: 2222.22, monthRange: '2026-08-01..23' }), {status:200});
}; };

stubFetch(true);
let r = await onRequestGet(ctx(async () => new Response(SHELL, { status: 200 })));
let body = await r.text();
ok('mutlu yol 200', r.status === 200);
ok('mutlu yol tabloyu basar', (body.match(/<td>[0-9][0-9]:00<\/td>/g) || []).length === 24);

stubFetch(false);
r = await onRequestGet(ctx(async () => new Response(SHELL, { status: 200 })));
body = await r.text();
ok('proxy 500 -> kabuk (durust bekleme)', r.status === 200 && body.includes('Veri bekleniyor'));
ok('proxy 500 -> UYDURMA rakam yok', !/<td>[0-9]{1,3}[.,][0-9]{2}<\/td>/.test(body));

stubFetch(true);
r = await onRequestGet(ctx(async () => new Response('yok', { status: 404 })));
ok('varlik 404 -> 404 aynen doner', r.status === 404);

r = await onRequestGet(ctx(async () => new Response(null, { status: 301, headers: { Location: '/canli-ptf' } })));
ok('301 ASLA yonlendirme dongusu uretmez', r.status === 301 && r.headers.get('Location') === '/canli-ptf');

let calls = 0;
r = await onRequestGet(ctx(async () => { calls++; if (calls === 1) throw new Error('binding gone'); return new Response(SHELL, { status: 200 }); }));
ok('next() firlatirsa sayfa AYAKTA kalir', r.status === 200, `-> ${r.status}`);

r = await onRequestGet(ctx(async () => { throw new Error('kalici hata'); }));
ok('kalici hatada 503 (500 patlamasi degil)', r.status === 503);

r = await onRequestGet({ request: new Request('https://voltage.com.tr/canli-ptf?ptfoff=1'), next: async () => new Response(SHELL, { status: 200 }) });
body = await r.text();
ok('?ptfoff SSR atlar', body.includes('Veri bekleniyor') && !body.includes('<body data-ssr'));
globalThis.fetch = realFetch;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
