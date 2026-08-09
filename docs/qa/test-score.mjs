// /api/score birim testleri — sahte KV + Request ile fonksiyon sözleşmesi.
import { onRequestGet, onRequestPost, onRequestDelete } from '/home/user/website/functions/api/score.js';

const kv = new Map();
const env = {
  LEADS: {
    get: async (k) => kv.get(k) ?? null,
    put: async (k, v) => { kv.set(k, v); },
  },
  REPORT_TOKEN: 'sekret-token',
};
const URL_ = 'https://voltage.com.tr/api/score';
const post = (body, origin = 'https://voltage.com.tr') =>
  onRequestPost({ env, request: new Request(URL_, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
const del = (auth) => onRequestDelete({ env, request: new Request(URL_, { method: 'DELETE', headers: auth ? { Authorization: auth } : {} }) });

let pass = 0, fail = 0;
const eq = (name, got, want) => { if (JSON.stringify(got) === JSON.stringify(want)) { pass++; } else { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); } };

// 1. Boş tablo
let r = await (await onRequestGet({ env, request: new Request(URL_) })).json();
eq('empty-get', r, { ok: true, board: [] });

// 2. Geçerli kayıt
r = await (await post({ name: '  Emirhan  Usta ', mwh: 240, dist: 1200.7 })).json();
eq('post-ok', [r.ok, r.you, r.board[0].n, r.board[0].m, r.board[0].d], [true, 0, 'Emirhan Usta', 240, 1201]);

// 3. Sıralama + aynı isim yalnız daha iyi skorla güncellenir
await post({ name: 'Ayşe', mwh: 480, dist: 2000 });
await post({ name: 'Mehmet', mwh: 120, dist: 700 });
r = await (await post({ name: 'ayşe', mwh: 100, dist: 500 })).json(); // düşük skor → korunur
eq('dedupe-keep', [r.kept, r.board[0].n, r.board[0].m], [true, 'Ayşe', 480]);
r = await (await post({ name: 'AYŞE', mwh: 600, dist: 2500 })).json(); // yüksek → değişir
eq('dedupe-upgrade', [r.board[0].n, r.board[0].m, r.board.length], ['AYŞE', 600, 3]);

// 4. Geçersizler
eq('bad-name', (await (await post({ name: 'A', mwh: 240, dist: 10 })).json()).error, 'invalid_name');
eq('bad-mwh-mod', (await (await post({ name: 'Hile', mwh: 241, dist: 10 })).json()).error, 'invalid_score');
eq('bad-mwh-max', (await (await post({ name: 'Hile', mwh: 60000, dist: 10 })).json()).error, 'invalid_score');
eq('bad-mwh-min', (await (await post({ name: 'Hile', mwh: 8, dist: 10 })).json()).error, 'invalid_score');
eq('bad-dist', (await (await post({ name: 'Hile', mwh: 240, dist: -5 })).json()).error, 'invalid_score');
eq('xss-name', (await (await post({ name: '<script>alert(1)</script>', mwh: 240, dist: 10 })).json()).board.some((e) => e.n.includes('<')), false);
eq('cross-origin', (await post({ name: 'Dış', mwh: 240, dist: 10 }, 'https://evil.example')).status, 403);

// 5. Reset yetkisi
eq('del-noauth', (await del(null)).status, 401);
eq('del-badauth', (await del('Bearer yanlis')).status, 401);
r = await del('Bearer sekret-token');
eq('del-ok', [(r.status), (await r.json()).reset], [200, true]);
r = await (await onRequestGet({ env, request: new Request(URL_) })).json();
eq('post-reset-empty', r.board.length, 0);

// 6. Kalıcılık yoksa 503
const bare = { env: {}, request: new Request(URL_) };
eq('no-kv', (await onRequestGet(bare)).status, 503);

// 7. 50 kayıt sınırı
for (let i = 0; i < 60; i++) await post({ name: `Oyuncu ${i}`, mwh: 12 + i * 4, dist: 100 });
const raw = JSON.parse(kv.get('lb:board'));
eq('cap-50', [raw.entries.length, raw.entries[0].m], [50, 12 + 59 * 4]);

// 8. QA D1: KV okuma hatası → 503, tablo ASLA ezilmez
const before = kv.get('lb:board');
const failingEnv = {
  LEADS: { get: async () => { throw new Error('kv unavailable'); }, put: env.LEADS.put },
  REPORT_TOKEN: 'sekret-token',
};
let fr = await onRequestGet({ env: failingEnv, request: new Request(URL_) });
eq('read-fail-get-503', fr.status, 503);
fr = await onRequestPost({ env: failingEnv, request: new Request(URL_, { method: 'POST', headers: { Origin: 'https://voltage.com.tr', 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Kurban', mwh: 240, dist: 100 }) }) });
eq('read-fail-post-503', fr.status, 503);
eq('read-fail-board-intact', kv.get('lb:board'), before);

// 9. QA D1: bozuk JSON → 503 (sessiz silme yok); DELETE onarır
kv.set('lb:board', '{bozuk json!!');
fr = await onRequestGet({ env, request: new Request(URL_) });
eq('corrupt-get-503', fr.status, 503);
fr = await (await del('Bearer sekret-token')).json();
eq('corrupt-reset', fr.reset, true);
fr = await (await onRequestGet({ env, request: new Request(URL_) })).json();
eq('corrupt-healed', fr, { ok: true, board: [] });

// 10. QA N1: 21-50 bandındaki oyuncuya you=-1 (dilim dışı index sızmaz)
for (let i = 0; i < 30; i++) await post({ name: `Dolgu ${i}`, mwh: 400 + i * 4, dist: 100 });
fr = await (await post({ name: 'Sondaki', mwh: 12, dist: 50 })).json();
eq('you-out-of-slice', [fr.ok, fr.you, fr.board.length], [true, -1, 20]);

// 11. İsim sansürü — küfür/hakaret engellenir, masum adlar geçer
const blockedNames = [
  'Orospu Çocuğu',      // düz küfür
  '0r0spu',             // leetspeak
  'S1ktir Git',         // leetspeak + birleşim
  'yarrrak',            // harf tekrarı
  'Amk Reis',           // kısaltma (token)
  'Şerefsiz61',         // hakaret + sayı
  'fuck99',             // İngilizce
  'B1tch',              // İngilizce leetspeak
  'Ali mal',            // hakaret token'ı
  'a m c ı k',          // boşlukla kaçış
];
for (const n of blockedNames) {
  const res = await (await post({ name: n, mwh: 240, dist: 100 })).json();
  eq(`censor-block: ${n}`, res.error, 'blocked_name');
}
const allowedNames = [
  'Klasik',             // "sik" alt dizgi DEĞİL, token — geçmeli
  'Gotik Metal',        // "got" yalnız token — geçmeli
  'Malik',              // "mal" token bütünlüğü — geçmeli
  'Fiziksel Güç',       // içinde s-i-k geçse de token değil
  'Deniz Yılmaz 34',
];
for (const n of allowedNames) {
  const res = await (await post({ name: n, mwh: 240, dist: 100 })).json();
  eq(`censor-allow: ${n}`, res.ok, true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
