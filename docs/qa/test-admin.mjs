/**
 * Yönetim paneli kimlik doğrulama testleri.
 * Panel gerçek kişisel veri gösterir; bu paket o kapının kilidini sınar.
 *   node docs/qa/test-admin.mjs
 */
import {
  hashPassword, verifyPassword, createSession, verifySession, sessionCookie,
  clearCookie, readCookie, requireSession, timingSafeEqual,
  checkRateLimit, recordFailure, clearFailures, rateLimitKey, ADMIN_CONST,
} from '../../lib/admin-auth.js';
import { onRequestPost as loginPost, onRequestDelete as logoutDelete } from '../../functions/api/admin/login.js';
import { onRequestGet as leadsGet } from '../../functions/api/admin/leads.js';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) pass++; else { fail++; console.log(`FAIL ${n} ${extra}`); } };

// --------------------------------------------------------------------------
// Parola
// --------------------------------------------------------------------------
const PASS = 'dogru-parola-uzun-123';
const HASH = await hashPassword(PASS);
ok('hash biçimi pbkdf2$iter$salt$hash', /^pbkdf2\$\d+\$[\w-]+\$[\w-]+$/.test(HASH), `-> ${HASH.slice(0, 24)}`);
ok('doğru parola doğrulanır', await verifyPassword(PASS, HASH));
ok('yanlış parola reddedilir', !(await verifyPassword('yanlis-parola-1234', HASH)));
ok('boş parola reddedilir', !(await verifyPassword('', HASH)));
ok('tek karakter farkı reddedilir', !(await verifyPassword(PASS + 'x', HASH)));
ok('bozuk hash reddedilir', !(await verifyPassword(PASS, 'pbkdf2$abc$xx$yy')));
ok('yanlış şema reddedilir', !(await verifyPassword(PASS, `md5$1000$aa$bb`)));
ok('null hash reddedilir', !(await verifyPassword(PASS, null)));
ok('düşük iterasyon reddedilir', !(await verifyPassword(PASS, 'pbkdf2$10$YWFh$YmJi')));
ok('aynı parola farklı tuz → farklı hash', (await hashPassword(PASS)) !== HASH);
ok('iterasyon sayısı yeterli', ADMIN_CONST.PBKDF2_ITERATIONS >= 200000, `-> ${ADMIN_CONST.PBKDF2_ITERATIONS}`);

// --------------------------------------------------------------------------
// Oturum
// --------------------------------------------------------------------------
const SECRET = 'test-oturum-anahtari-cok-uzun';
const now = Date.now();
const { token } = await createSession(SECRET, now);
ok('oturum doğrulanır', !!(await verifySession(SECRET, token, now)));
ok('YANLIŞ anahtarla doğrulanmaz', !(await verifySession('baska-anahtar', token, now)));
ok('imza kurcalanırsa reddedilir', !(await verifySession(SECRET, token.slice(0, -4) + 'AAAA', now)));
ok('süre uzatılırsa imza tutmaz', await (async () => {
  const parts = token.split('.');
  const forged = `v1.${Number(parts[1]) + 99999}.${parts[2]}`;
  return !(await verifySession(SECRET, forged, now));
})());
ok('süresi dolmuş oturum reddedilir', !(await verifySession(SECRET, token, now + (ADMIN_CONST.SESSION_TTL_SEC + 5) * 1000)));
ok('boş token reddedilir', !(await verifySession(SECRET, '', now)));
ok('çöp token reddedilir', !(await verifySession(SECRET, 'lorem.ipsum.dolor', now)));
ok('v2 sürümü reddedilir', !(await verifySession(SECRET, token.replace(/^v1/, 'v2'), now)));

// Çerez
const c = sessionCookie(token);
ok('çerez HttpOnly', /HttpOnly/.test(c));
ok('çerez Secure', /Secure/.test(c));
ok('çerez SameSite=Strict', /SameSite=Strict/.test(c));
ok('çıkış çerezi süreyi sıfırlar', /Max-Age=0/.test(clearCookie()));
const reqWithCookie = new Request('https://x/', { headers: { Cookie: `a=1; vsess=${token}; b=2` } });
ok('çerez okunur', readCookie(reqWithCookie) === token);
ok('çerez yoksa null', readCookie(new Request('https://x/')) === null);

ok('timingSafeEqual eşit', await timingSafeEqual('abc', 'abc'));
ok('timingSafeEqual farklı', !(await timingSafeEqual('abc', 'abd')));
ok('timingSafeEqual uzunluk farkı', !(await timingSafeEqual('abc', 'abcdef')));

// --------------------------------------------------------------------------
// Sahte KV + ortam
// --------------------------------------------------------------------------
function makeKV(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    _m: m,
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, v); },
    delete: async (k) => { m.delete(k); },
    list: async ({ prefix, cursor }) => {
      const all = [...m.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const slice = all.slice(start, start + 1000);
      const done = start + slice.length >= all.length;
      return { keys: slice.map((name) => ({ name })), list_complete: done, cursor: String(start + slice.length) };
    },
  };
}
const ENV = (over = {}) => ({
  ADMIN_USER: 'emirhan',
  ADMIN_PASS_HASH: HASH,
  ADMIN_SESSION_SECRET: SECRET,
  LEADS: makeKV(),
  ...over,
});
const post = (body, env, headers = {}) => loginPost({
  env,
  request: new Request('https://voltage.com.tr/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  }),
});

// --------------------------------------------------------------------------
// Giriş ucu
// --------------------------------------------------------------------------
let r = await post({ user: 'emirhan', pass: PASS }, ENV());
let data = await r.json();
ok('doğru bilgiyle giriş 200', r.status === 200 && data.ok === true);
ok('giriş çerez basar', /vsess=/.test(r.headers.get('Set-Cookie') || ''));
ok('giriş no-store', (r.headers.get('Cache-Control') || '').includes('no-store'));

r = await post({ user: 'emirhan', pass: 'yanlis-parola-9999' }, ENV());
ok('yanlış parola 401', r.status === 401 && (await r.json()).error === 'invalid_credentials');

r = await post({ user: 'baskasi', pass: PASS }, ENV());
ok('yanlış kullanıcı 401', r.status === 401 && (await r.json()).error === 'invalid_credentials');

r = await post({ user: 'baskasi', pass: 'yanlis' }, ENV());
ok('ikisi de yanlış AYNI hatayı verir', r.status === 401 && (await r.json()).error === 'invalid_credentials');

r = await post({ user: '', pass: '' }, ENV());
ok('boş alan 401 (yapılandırma sızdırmaz)', r.status === 401);

r = await post({ user: 'emirhan', pass: PASS }, ENV({ ADMIN_PASS_HASH: undefined }));
ok('hash tanımsızsa 503', r.status === 503 && (await r.json()).error === 'not_configured');
r = await post({ user: 'emirhan', pass: PASS }, ENV({ ADMIN_SESSION_SECRET: undefined }));
ok('oturum anahtarı yoksa 503', r.status === 503);

r = await post({ user: 'emirhan', pass: PASS }, ENV(), { Origin: 'https://kotu.example' });
ok('çapraz origin 403', r.status === 403);
r = await post({ user: 'emirhan', pass: PASS }, ENV(), { Origin: 'https://voltage.com.tr' });
ok('aynı origin kabul', r.status === 200);

r = await loginPost({ env: ENV(), request: new Request('https://voltage.com.tr/api/admin/login', { method: 'POST', body: 'bozuk' }) });
ok('bozuk JSON 400', r.status === 400);

r = await logoutDelete();
ok('çıkış çerezi siler', /Max-Age=0/.test(r.headers.get('Set-Cookie') || ''));

// --------------------------------------------------------------------------
// Kaba kuvvet
// --------------------------------------------------------------------------
{
  const env = ENV();
  const req = new Request('https://voltage.com.tr/api/admin/login', { headers: { 'CF-Connecting-IP': '1.2.3.4' } });
  const key = await rateLimitKey(req);
  ok('IP ham saklanmaz', !key.includes('1.2.3.4'), `-> ${key}`);
  for (let i = 0; i < ADMIN_CONST.RL_MAX_ATTEMPTS; i++) await recordFailure(env.LEADS, key);
  ok('sınır aşılınca bloke', (await checkRateLimit(env.LEADS, key)).blocked);
  await clearFailures(env.LEADS, key);
  ok('başarılı girişten sonra sayaç sıfırlanır', !(await checkRateLimit(env.LEADS, key)).blocked);
  ok('KV yoksa ENGELLER (kapalı çöker — QA N2)', (await checkRateLimit(null, key)).blocked);
  ok('pencere dolunca sıfırlanır', await (async () => {
    await recordFailure(env.LEADS, key, 0);
    for (let i = 0; i < 20; i++) await recordFailure(env.LEADS, key, 0);
    return !(await checkRateLimit(env.LEADS, key, (ADMIN_CONST.RL_WINDOW_SEC + 60) * 1000)).blocked;
  })());
}
{
  // Uçtan uca: 8 hatalı denemeden sonra DOĞRU parola bile 429 alır
  const env = ENV();
  const hdr = { 'CF-Connecting-IP': '9.9.9.9' };
  for (let i = 0; i < 8; i++) await post({ user: 'emirhan', pass: 'yanlis' }, env, hdr);
  const blocked = await post({ user: 'emirhan', pass: PASS }, env, hdr);
  ok('kaba kuvvet sonrası 429', blocked.status === 429, `-> ${blocked.status}`);
}

// --------------------------------------------------------------------------
// Veri ucu
// --------------------------------------------------------------------------
const lead = (ts, over = {}) => [`lead:${ts}:aaa${ts}`, JSON.stringify({
  ad: 'Ali', soyad: 'Veli', sirket: `Firma ${ts}`, telefon: '0500', eposta: 'a@b.c',
  tuketim: '100 MWh', sektor: 'Tekstil', mesaj: 'not', lang: 'tr', utm: {}, receivedAt: new Date(ts).toISOString(), ...over,
})];
const seeded = Object.fromEntries([lead(1000), lead(2000), lead(3000), lead(4000)]);

const getLeads = (env, url = 'https://voltage.com.tr/api/admin/leads', cookie = null) => leadsGet({
  env, request: new Request(url, { headers: cookie ? { Cookie: `vsess=${cookie}` } : {} }),
});

r = await getLeads(ENV({ LEADS: makeKV(seeded) }));
ok('oturumsuz veri ucu 401', r.status === 401 && (await r.json()).error === 'unauthorized');

r = await getLeads(ENV({ LEADS: makeKV(seeded) }), undefined, 'v1.9999999999.sahte');
ok('sahte çerez 401', r.status === 401);

const expired = (await createSession(SECRET, now - (ADMIN_CONST.SESSION_TTL_SEC + 60) * 1000)).token;
r = await getLeads(ENV({ LEADS: makeKV(seeded) }), undefined, expired);
ok('süresi dolmuş çerez 401', r.status === 401);

r = await getLeads(ENV({ LEADS: makeKV(seeded) }), undefined, token);
data = await r.json();
ok('geçerli oturum 200', r.status === 200 && data.ok === true);
ok('toplam doğru', data.total === 4, `-> ${data.total}`);
ok('en YENİ önce sıralı', data.records.map((x) => x.ts).join() === '4000,3000,2000,1000', `-> ${data.records.map((x) => x.ts)}`);
ok('kişisel veri döner (panelin amacı)', data.records[0].eposta === 'a@b.c');
ok('veri ucu no-store', (r.headers.get('Cache-Control') || '').includes('no-store'));
ok('veri ucu noindex', (r.headers.get('X-Robots-Tag') || '').includes('noindex'));

r = await getLeads(ENV({ LEADS: makeKV(seeded) }), 'https://voltage.com.tr/api/admin/leads?limit=2', token);
data = await r.json();
ok('limit uygulanır', data.records.length === 2 && data.count === 2);
ok('sonraki sayfa işaretçisi TAM ANAHTAR', data.nextBefore === 'lead:3000:aaa3000', `-> ${data.nextBefore}`);

r = await getLeads(ENV({ LEADS: makeKV(seeded) }), `https://voltage.com.tr/api/admin/leads?limit=2&before=${encodeURIComponent(data.nextBefore)}`, token);
data = await r.json();
ok('ikinci sayfa eskiler', data.records.map((x) => x.ts).join() === '2000,1000');
ok('son sayfada nextBefore null', data.nextBefore === null);

r = await getLeads(ENV({ LEADS: makeKV(seeded) }), 'https://voltage.com.tr/api/admin/leads?limit=99999', token);
data = await r.json();
ok('aşırı limit kırpılır', data.records.length === 4);

r = await getLeads(ENV({ LEADS: undefined }), undefined, token);
ok('KV yoksa 503', r.status === 503);

// Bozuk tek kayıt tüm sayfayı düşürmemeli
const withBroken = makeKV({ ...seeded, 'lead:5000:bozuk': '{bozuk json' });
r = await getLeads(ENV({ LEADS: withBroken }), undefined, token);
data = await r.json();
ok('bozuk kayıt sayfayı düşürmez', r.status === 200 && data.records.length === 4, `-> ${data.records.length}`);
ok('bozuk kayıt sayımda görünür (dürüst toplam)', data.total === 5, `-> ${data.total}`);


// --------------------------------------------------------------------------
// QA B1 REGRESYONU: kırpılmış/bozuk özet HİÇBİR parolayı kabul etmemeli.
// Eski kod `expected.length * 8` = 0 bit türetip 0 baytı 0 baytla kıyaslıyor
// ve HER parolaya true diyordu — tam kimlik doğrulama baypası.
// --------------------------------------------------------------------------
{
  const parts = HASH.split('$');
  const kirik = [
    `pbkdf2$${parts[1]}$${parts[2]}$`,        // son '$' sonrası kayıp (kopyala-yapıştır)
    `pbkdf2$${parts[1]}$$`,                   // tuz da kayıp
    `pbkdf2$${parts[1]}$${parts[2]}$YWJj`,    // 3 baytlık özet
    `pbkdf2$${parts[1]}$${parts[2]}$${parts[3].slice(0, 20)}`, // yarım özet
  ];
  for (const k of kirik) {
    ok(`B1: kırpılmış özet reddedilir (${k.slice(-10)})`, !(await verifyPassword('herhangi-bir-parola', k)));
    ok(`B1: kırpılmış özetle boş parola da reddedilir`, !(await verifyPassword('', k)));
    const r1 = await post({ user: 'emirhan', pass: 'saldirgan-tahmini' }, ENV({ ADMIN_PASS_HASH: k }));
    ok(`B1: uçtan uca giriş reddedilir (${k.slice(-10)})`, r1.status === 401, `-> ${r1.status}`);
  }
  ok('B1: sağlam özet hâlâ çalışıyor', await verifyPassword(PASS, HASH));
}

// --------------------------------------------------------------------------
// QA B4 REGRESYONU: aynı milisaniyeyi paylaşan kayıtlar sayfalamada
// ATLANMAMALI. Eski cursor sadece ms idi; sayfa sınırı bir ms grubunun
// ortasına düştüğünde grubun kalanı hiçbir sayfada görünmüyordu.
// --------------------------------------------------------------------------
{
  const dup = {};
  for (const [k, v] of [
    [`lead:3000:a`, 1], [`lead:2000:a`, 2], [`lead:2000:b`, 3], [`lead:2000:c`, 4], [`lead:1000:a`, 5],
  ]) dup[k] = JSON.stringify({ ad: 'X', soyad: String(v), sirket: k, eposta: 'x@y.z' });

  const seen = [];
  let cur = null, guard = 0;
  do {
    const u = 'https://voltage.com.tr/api/admin/leads?limit=2' + (cur ? '&before=' + encodeURIComponent(cur) : '');
    const rr = await getLeads(ENV({ LEADS: makeKV(dup) }), u, token);
    const dd = await rr.json();
    for (const rec of dd.records) seen.push(rec.id);
    cur = dd.nextBefore;
  } while (cur && ++guard < 10);

  ok('B4: aynı ms\'li kayıtların TAMAMI görünür', seen.length === 5, `-> ${seen.length}: ${seen}`);
  ok('B4: mükerrer kayıt yok', new Set(seen).size === seen.length);
  ok('B4: sıra en yeniden eskiye', seen[0] === 'lead:3000:a' && seen[4] === 'lead:1000:a', `-> ${seen}`);
  ok('B4: aynı ms grubu kendi içinde kararlı', seen.slice(1, 4).join() === 'lead:2000:c,lead:2000:b,lead:2000:a', `-> ${seen.slice(1,4)}`);
}

// --------------------------------------------------------------------------
// QA N2/N3 REGRESYONU: sınırlayıcı KAPALI çöker, XFF ile baypas edilemez
// --------------------------------------------------------------------------
{
  ok('N2: KV yoksa engeller (kapalı çöker)', (await checkRateLimit(null, 'k')).blocked);
  const patlak = { get: async () => { throw new Error('kv down'); }, put: async () => {}, delete: async () => {} };
  ok('N2: KV hata verirse engeller', (await checkRateLimit(patlak, 'k')).blocked);
  const k1 = await rateLimitKey(new Request('https://x/', { headers: { 'X-Forwarded-For': '1.1.1.1' } }));
  const k2 = await rateLimitKey(new Request('https://x/', { headers: { 'X-Forwarded-For': '2.2.2.2' } }));
  ok('N3: XFF kovayı değiştiremez', k1 === k2, 'saldırgan başlık değiştirerek sınırı aşabilirdi');
  const k3 = await rateLimitKey(new Request('https://x/', { headers: { 'CF-Connecting-IP': '3.3.3.3' } }));
  ok('N3: kenar başlığı kova belirler', k3 !== k1);
}


// --------------------------------------------------------------------------
// QA N9/N10 REGRESYONU
// --------------------------------------------------------------------------
{
  // N9: sayaç okunamıyorsa "15 dk bekle" DEĞİL, altyapı hatası bildirilmeli
  const patlak = { get: async () => { throw new Error('kv down'); }, put: async () => {}, delete: async () => {} };
  ok('N9: KV yoksa sebep "unavailable"', (await checkRateLimit(null, 'k')).reason === 'unavailable');
  ok('N9: KV hata verirse sebep "unavailable"', (await checkRateLimit(patlak, 'k')).reason === 'unavailable');
  const rNoKv = await post({ user: 'emirhan', pass: PASS }, ENV({ LEADS: undefined }));
  const dNoKv = await rNoKv.json();
  ok('N9: KV yokken 503 rate_limit_unavailable (429 DEĞİL)',
    rNoKv.status === 503 && dNoKv.error === 'rate_limit_unavailable', `-> ${rNoKv.status} ${dNoKv.error}`);
  // Gerçek sınır aşımı hâlâ 429 olmalı
  const env2 = ENV();
  const hdr = { 'CF-Connecting-IP': '7.7.7.7' };
  for (let i = 0; i < 8; i++) await post({ user: 'emirhan', pass: 'yanlis' }, env2, hdr);
  const rLimit = await post({ user: 'emirhan', pass: PASS }, env2, hdr);
  ok('N9: gerçek sınır aşımı hâlâ 429', rLimit.status === 429 && (await rLimit.json()).error === 'too_many_attempts');
}
{
  // N10: ms alanı FARKLI GENİŞLİKTE anahtarlarda da hiçbir kayıt atlanmamalı
  const karisik = {};
  for (const k of ['lead:9000:a', 'lead:1750000000000:a', 'lead:1750000000000:b', 'lead:900000:z'])
    karisik[k] = JSON.stringify({ ad: 'X', sirket: k, eposta: 'x@y.z' });

  const seen = [];
  let cur = null, guard = 0;
  do {
    const u = 'https://voltage.com.tr/api/admin/leads?limit=1' + (cur ? '&before=' + encodeURIComponent(cur) : '');
    const rr = await getLeads(ENV({ LEADS: makeKV(karisik) }), u, token);
    const dd = await rr.json();
    for (const rec of dd.records) seen.push(rec.id);
    cur = dd.nextBefore;
  } while (cur && ++guard < 20);
  ok('N10: karışık genişlikli anahtarlarda kayıp yok', seen.length === 4, `-> ${seen.length}: ${seen}`);
  ok('N10: mükerrer yok', new Set(seen).size === seen.length);
}


// --------------------------------------------------------------------------
// Yapıştırma kazası: değerin sonundaki boşluk/satır sonu girişi engellememeli
// --------------------------------------------------------------------------
ok('hash sonunda boşluk varsa yine doğrular', await verifyPassword(PASS, HASH + '  '));
ok('hash sonunda satır sonu varsa yine doğrular', await verifyPassword(PASS, HASH + '\n'));
ok('hash başında boşluk varsa yine doğrular', await verifyPassword(PASS, '  ' + HASH));
ok('boşluklu hash ile YANLIŞ parola yine reddedilir', !(await verifyPassword('yanlis-parola-777', HASH + '\n')));
{
  const rSpace = await post({ user: 'emirhan', pass: PASS }, ENV({ ADMIN_USER: 'emirhan ', ADMIN_PASS_HASH: HASH + '\n' }));
  ok('boşluklu ADMIN_USER + boşluklu hash ile giriş çalışır', rSpace.status === 200, `-> ${rSpace.status}`);
  const rWrongUser = await post({ user: 'baskasi', pass: PASS }, ENV({ ADMIN_USER: 'emirhan ' }));
  ok('kırpma yanlış kullanıcıyı kabul ETMEZ', rWrongUser.status === 401);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
