// piyasa/v1 modülü — çevrimdışı testler (ağ yok; EPİAŞ, KV ve Cache API taklit edilir).
// Çalıştırma: node docs/epias-proxy/piyasa-modulu/test.mjs
// !!! Tüm fiyatlar UYDURMA test verisidir (test-verisi.mjs).
import {
  piyasaIstegi, piyasaZamanli, _bellekTemizle, sayaclar, BUTCE, PENCERE, AZAMI_ALT_ISTEK, KV_DURUM, kvGunAnahtari,
  donemlerAyrintili, ogelerCikar, sayfaBilgisi, gunIzgarasi, veriVar, sayi, yonCoz, belirtecEsit, bakimSec, dilimBul, ILK_GUN, _ic,
} from './piyasa.js';
import host, { mevcutFetch, mevcutZamanliSayaci } from './ornek-host.js';
import { SABIT_AN, ANAHTAR_1, ANAHTAR_2, SAHTE_ENV, sahteGun, sahteEpias, sahteCache, sahteKv, gunEkle } from './test-verisi.mjs';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) pass++; else { fail++; console.log(`FAIL ${n} ${extra}`); } };

// Loglar yakalanır: sır sızmadığı doğrulanır.
const loglar = [];
const gercekHata = console.error, gercekUyari = console.warn, gercekLog = console.log;
console.error = (...a) => { loglar.push(a.map(String).join(' ')); };
console.warn = (...a) => { loglar.push(a.map(String).join(' ')); };

const BUGUN = '2026-11-24', DUN = '2026-11-23';
const DK = 60 * 1000, SA = 60 * DK, GUN = 24 * SA;
const govdeler = [];        // tüm piyasa yanıt gövdeleri (sonda taranır)
const tumKvler = [];        // tüm sahte KV'ler (sonda taranır)
const tumCacheler = [];
const bekleyen = [];
const ctx = { waitUntil: (p) => bekleyen.push(p) };
const bosalt = async () => { for (let i = 0; i < 5; i++) { while (bekleyen.length) await Promise.allSettled(bekleyen.splice(0)); await new Promise((r) => setTimeout(r, 1)); } };

function ortam(ayar = {}) {
  _bellekTemizle();
  const olc = { n: 0 };
  const e = sahteEpias(ayar);
  const kv = ayar.kvNesnesi || sahteKv({ toplu: ayar.toplu !== false, olcum: olc });
  const cache = ayar.cache === false ? null : (ayar.cacheNesnesi || sahteCache(olc));
  if (!ayar.kvNesnesi) tumKvler.push(kv);
  if (cache && !ayar.cacheNesnesi) tumCacheler.push(cache);
  const env = { ...SAHTE_ENV, PIYASA_ETKIN: '1', PIYASA_OKUMA_ANAHTARI: ANAHTAR_1, PIYASA_KV: kv, ...(ayar.env || {}) };
  const sec = { fetch: (u, i) => { olc.n++; return e.fetch(u, i); }, simdi: e.simdi, cache, zamanAsimiMs: ayar.zamanAsimiMs, ...(ayar.sec || {}) };
  const o = { e, kv, cache, env, sec, olc };
  o.iste = async (yol, s = {}) => {
    const h = new Headers(s.basliklar || {});
    if (s.anahtar !== null) h.set('Authorization', s.ham !== undefined ? s.ham : 'Bearer ' + (s.anahtar || ANAHTAR_1));
    const r = await piyasaIstegi(new Request('https://epias-proxy.ornek.invalid' + yol, { method: s.yontem || 'GET', headers: h }), s.env || o.env, ctx, o.sec);
    if (!r) return null;
    const metin = await r.text();
    govdeler.push(metin);
    let j = null; try { j = JSON.parse(metin); } catch (e2) { /* boş */ }
    return { r, j, metin, durum: r.status };
  };
  o.gun = (g, s) => o.iste('/piyasa/v1/dengesizlik?tarih=' + g, s);
  o.aralik = (a, b, s) => o.iste(`/piyasa/v1/dengesizlik?bas=${a}&bit=${b}`, s);
  o.cron = async (cron = '*/10 * * * *') => { await piyasaZamanli({ cron, scheduledTime: o.e.an }, o.env, ctx, o.sec); await bosalt(); };
  o.yeniSurec = () => { _bellekTemizle(); };
  return o;
}
/** İstanbul saatiyle o günün hh:mm anı. */
const istAn = (ymd, hh, mm = 0) => Date.parse(`${ymd}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+03:00`);
const kvGunleri = (kv) => [...kv.depo.keys()].filter((k) => k.startsWith('piyasa:v1:gun:')).map((k) => k.slice(14)).sort();

// ============================================================================
// 1 — SAF MANTIK (website testlerinden aktarılan niyet)
// ============================================================================
for (const [g, b] of [[null, null], [undefined, null], ['', null], ['  ', null], [[], null], [{}, null], [NaN, null], [Infinity, null], [true, null], [2445.19, 2445.19], ['1899.99', 1899.99], [0, 0], [-106, -106], ['2.445,19', null]]) {
  ok(`sayi ${JSON.stringify(g)} -> ${b}`, Object.is(sayi(g), b));
}
for (const [g, b] of [
  ['Enerji Açığı', 'acik'], ['ENERJİ AÇIĞI', 'acik'], ['Enerji Acigi', 'acik'], ['Energy Deficit', 'acik'], ['Enerji Fazlası', 'fazla'], ['ENERJİ FAZLASI', 'fazla'],
  ['Energy Surplus', 'fazla'], ['Dengede', 'denge'], ['  dengede ', 'denge'], ['Sistem Dengede', 'denge'], ['Balanced', 'denge'],
  ['', null], ['   ', null], [null, null], [0, null], ['Açıklanmadı', null], ['bilinmiyor', null], ['-', null],
]) ok(`yonCoz ${JSON.stringify(g)} -> ${b}`, yonCoz(g) === b);

const K1 = [{ date: '2026-11-23T00:00:00+03:00', ptf: 1 }];
ok('zarf body.content/body.items/items/content/dizi/body', ogelerCikar({ body: { content: K1 } }) === K1 && ogelerCikar({ body: { items: K1 } }) === K1 && ogelerCikar({ items: K1 }) === K1 && ogelerCikar({ content: K1 }) === K1 && ogelerCikar(K1) === K1 && ogelerCikar({ body: K1 }) === K1);
ok('zarf taninmiyor -> null', ogelerCikar({ data: K1 }) === null && ogelerCikar(null) === null && ogelerCikar('x') === null);
ok('sayfaBilgisi', JSON.stringify(sayfaBilgisi({ items: [], page: { number: 1, size: 20, total: 24 } })) === '{"number":1,"size":20,"total":24}' && sayfaBilgisi({ body: { page: { number: 2, size: 10, total: 30 } } }).number === 2 && sayfaBilgisi({ page: { total: 'cok' } }) === null);

let a = donemlerAyrintili(sahteGun(DUN));
ok('24 donem, sirali, dk 60, +03:00', a.donemler.length === 24 && a.donemler[0].bas === `${DUN}T00:00:00+03:00` && a.donemler[23].bas === `${DUN}T23:00:00+03:00` && a.donemler.every((d) => d.dk === 60));
ok('alanlar + yonHam', a.donemler[0].ptf === 2000 && a.donemler[0].smf === 2300 && a.donemler[0].yon === 'acik' && a.donemler[0].yonHam === 'Enerji Açığı' && a.donemler[1].yonHam === 'Enerji Fazlası');
a = donemlerAyrintili(sahteGun(BUGUN, 14));
ok('kismi gun: yayimlanmamis null (0 DEGIL), PTF korunur, tasima yok', a.donemler[14].smf === null && a.donemler[14].pozitif === null && a.donemler[14].negatif === null && a.donemler[14].yon === null && a.donemler[14].yonHam === null && a.donemler[14].ptf === 2140 && a.donemler[14].smf !== a.donemler[13].smf);
a = donemlerAyrintili([{ date: `${DUN}T00:00:00+03:00`, ptf: '', smf: [], positiveImbalance: undefined, negativeImbalance: '  ', systemStatus: null }, { date: `${DUN}T01:00:00+03:00`, ptf: '1500.5', smf: 0, positiveImbalance: -106, systemStatus: 'X' }]);
ok('bos alanlar null; gercek 0 ve negatif korunur; taninmayan yon: yon null, yonHam ham', a.donemler[0].ptf === null && a.donemler[0].smf === null && a.donemler[0].negatif === null && a.donemler[1].ptf === 1500.5 && a.donemler[1].smf === 0 && a.donemler[1].pozitif === -106 && a.donemler[1].yon === null && a.donemler[1].yonHam === 'X');
a = donemlerAyrintili([...sahteGun('2026-11-01'), ...sahteGun('2026-11-01')]);
ok('kopya satirlar tekillesir (48 -> 24), cakisma 0', a.donemler.length === 24 && a.cakisma === 0);
a = donemlerAyrintili([{ date: `${DUN}T05:00:00+03:00`, ptf: 2100, smf: null, systemStatus: '' }, { date: `${DUN}T05:00:00+03:00`, ptf: 2100, smf: 2500, positiveImbalance: 2037, negativeImbalance: 2650, systemStatus: 'Enerji Açığı' }]);
ok('kopyada bos alan dolu kopyadan tamamlanir', a.donemler.length === 1 && a.donemler[0].smf === 2500 && a.donemler[0].yon === 'acik' && a.donemler[0].yonHam === 'Enerji Açığı');
a = donemlerAyrintili([
  { date: `${DUN}T05:00:00+03:00`, ptf: 2100, smf: 2500, positiveImbalance: 2037, negativeImbalance: 2650, systemStatus: 'Enerji Açığı' },
  { date: `${DUN}T05:00:00+03:00`, ptf: 2100, smf: 2600, positiveImbalance: 2037, negativeImbalance: 2756, systemStatus: 'Enerji Açığı' },
  { date: `${DUN}T06:00:00+03:00`, ptf: 2200, smf: 2200, systemStatus: 'Dengede' }, { date: `${DUN}T06:00:00+03:00`, ptf: 2200, smf: 2200, systemStatus: 'Dengede' },
]);
ok('celisen kopya: donem tumuyle null + sayac; ayni degerli kopya celiski degil', a.cakisma === 1 && a.donemler[0].ptf === null && a.donemler[0].smf === null && a.donemler[0].pozitif === null && a.donemler[0].negatif === null && a.donemler[0].yon === null && a.donemler[0].yonHam === null && a.donemler[1].ptf === 2200 && a.cokme === false);
ok('yon celiskisi de celiskidir', donemlerAyrintili([{ date: `${DUN}T05:00:00+03:00`, ptf: 1, systemStatus: 'Enerji Açığı' }, { date: `${DUN}T05:00:00+03:00`, ptf: 1, systemStatus: 'Enerji Fazlası' }]).cakisma === 1);
{ // alan tespiti: dönem başlangıcı, gün içinde saati DEĞİŞEN alandan (sekiz biçim)
  const sISO = (g, h) => `${g}T${String(h).padStart(2, '0')}:00:00+03:00`;
  const G = DUN;
  const bicimler = {
    'date=gun, time=saat ISO': (h) => ({ date: sISO(G, 0), time: sISO(G, h) }),
    'date=saat, time=gunun 00:00 ISO': (h) => ({ date: sISO(G, h), time: sISO(G, 0) }),
    'date=saat, time=HH:MM': (h) => ({ date: sISO(G, h), time: `${String(h).padStart(2, '0')}:00` }),
    'date=saat, time=1970 00:00': (h) => ({ date: sISO(G, h), time: '1970-01-01T00:00:00+03:00' }),
    'date=gun, time=1970 saat': (h) => ({ date: sISO(G, 0), time: sISO('1970-01-01', h) }),
    'date=saat, time yok': (h) => ({ date: sISO(G, h) }),
    'date=gun (saatsiz), hour=HH:MM': (h) => ({ date: G, hour: `${String(h).padStart(2, '0')}:00` }),
    'date=saat UTC, time=00:00': (h) => ({ date: new Date(Date.UTC(2026, 10, 22, 21 + h)).toISOString(), time: '00:00' }),
  };
  for (const [ad, f] of Object.entries(bicimler)) {
    const x = donemlerAyrintili(Array.from({ length: 24 }, (_, h) => ({ ...f(h), ptf: 1000 + h })));
    ok(`zaman bicimi "${ad}": 24 donem, dogru saat`, x.donemler.length === 24 && !x.cokme && x.donemler.every((d, h) => d.bas === sISO(G, h) && d.ptf === 1000 + h));
  }
  const cok = donemlerAyrintili(Array.from({ length: 24 }, (_, h) => ({ date: sISO(G, 0), time: sISO(G, 0), ptf: 1000 + h })));
  ok('iki alan da sabit: tek doneme coker -> cokme', cok.cokme === true);
  ok('UTC gece yarisi asimi dogru gune', donemlerAyrintili([{ date: '2026-11-23T22:30:00Z', ptf: 7 }]).donemler[0].bas === '2026-11-24T01:30:00+03:00');
  ok('tarihsiz/bozuk kalem atlanir', donemlerAyrintili([{ ptf: 1 }, null, 'x', { date: 'dun', ptf: 2 }, { date: '2026-02-30T00:00:00+03:00', ptf: 3 }]).donemler.length === 0);
}
a = donemlerAyrintili(sahteGun(DUN, 1e9, 15));
ok('96 donem (15 dk) aynı koddan', a.donemler.length === 96 && a.donemler.every((d) => d.dk === 15) && gunIzgarasi(DUN, a.donemler).length === 96);
{
  const seyrek = donemlerAyrintili(sahteGun(DUN).filter((_, i) => i !== 3 && i !== 20)).donemler;
  const iz = gunIzgarasi(DUN, seyrek);
  ok('izgara eksik donemi tumu null ekler', iz.length === 24 && iz[3].ptf === null && iz[3].smf === null && iz[3].pozitif === null && iz[3].negatif === null && iz[3].yon === null && iz[3].yonHam === null && iz[4].ptf === 2040);
  ok('veriVar', veriVar(iz) && !veriVar([]) && !veriVar(donemlerAyrintili([{ date: `${DUN}T00:00:00+03:00`, ptf: '' }]).donemler));
}

// ============================================================================
// 2 — YÖNLENDİRME, ETKİNLİK BAYRAĞI, YÖNTEM, KİMLİK
// ============================================================================
{
  const o = ortam();
  for (const yol of ['/', '/health', '/ptf/today', '/ptf/stats?x=1', '/piyasax', '/piyasa-v1', '/api/piyasa/v1/dengesizlik', '/PIYASA/v1/dengesizlik']) {
    const r = await piyasaIstegi(new Request('https://h.ornek.invalid' + yol), o.env, ctx, o.sec);
    ok(`piyasa disi yol ${yol} -> null`, r === null);
  }
  const govdeli = new Request('https://h.ornek.invalid/ptf/today', { method: 'POST', body: 'govde' });
  await piyasaIstegi(govdeli, o.env, ctx, o.sec);
  ok('piyasa disi istekte govde OKUNMAZ', govdeli.bodyUsed === false);
  ok('piyasa disi yollarda hic G/C yok', o.olc.n === 0 && o.kv.okuma === 0);
}
{ // PIYASA_ETKIN tam olarak "1" değilse her şey 404, G/Ç yok, cron işlemsiz
  for (const deger of [undefined, '', '0', 'true', '1 ', ' 1', 1, true, 'yes', 'TRUE']) {
    const o = ortam({ env: { PIYASA_ETKIN: deger } });
    const r1 = await o.gun(DUN);
    const r2 = await o.iste('/piyasa');
    const r3 = await o.iste('/piyasa/v1/durum', { yontem: 'OPTIONS' });
    const r4 = await o.iste('/piyasa/v1/dengesizlik?tarih=bozuk', { anahtar: null });
    await o.cron();
    ok(`PIYASA_ETKIN=${JSON.stringify(deger)}: 404 + G/C yok + cron islemsiz`, [r1, r2, r3, r4].every((x) => x.durum === 404) && o.olc.n === 0 && o.e.sayac.rapor === 0 && o.kv.yazim === 0 && r1.j.hata.kod === 'bulunamadi');
  }
}
{
  const o = ortam();
  const op = await o.iste('/piyasa/v1/dengesizlik?tarih=' + DUN, { yontem: 'OPTIONS', anahtar: null, basliklar: { Origin: 'https://voltage.com.tr', 'Access-Control-Request-Method': 'GET' } });
  ok('OPTIONS -> 405 Allow GET, CORS yok', op.durum === 405 && op.r.headers.get('Allow') === 'GET' && ![...op.r.headers.keys()].some((k) => k.startsWith('access-control')));
  for (const y of ['POST', 'PUT', 'DELETE', 'HEAD', 'PATCH']) ok(`${y} -> 405`, (await o.iste('/piyasa/v1/dengesizlik?tarih=' + DUN, { yontem: y })).durum === 405);
  ok('405 oncesi G/C yok', o.olc.n === 0);
}
{ // kimlik
  const o = ortam();
  const yok = await o.gun(DUN, { anahtar: null });
  ok('baslik yok -> 401 {hata:{kod:yetki}} + WWW-Authenticate', yok.durum === 401 && yok.metin === '{"hata":{"kod":"yetki"}}' && yok.r.headers.get('WWW-Authenticate') === 'Bearer');
  ok('yanlis belirtec -> 401', (await o.gun(DUN, { anahtar: ANAHTAR_1 + 'x' })).durum === 401);
  ok('onek eksik belirtec -> 401', (await o.gun(DUN, { anahtar: ANAHTAR_1.slice(0, -1) })).durum === 401);
  ok('Basic sema -> 401', (await o.gun(DUN, { ham: 'Basic ' + ANAHTAR_1 })).durum === 401);
  ok('belirtec bosluklu ek -> 401', (await o.gun(DUN, { ham: `Bearer ${ANAHTAR_1} ek` })).durum === 401);
  ok('bos Bearer -> 401', (await o.gun(DUN, { ham: 'Bearer ' })).durum === 401);
  ok('401 yollarinda EPİAŞ/KV G/C yok', o.olc.n === 0);
  ok('kucuk harf bearer kabul', (await o.gun(DUN, { ham: 'bearer ' + ANAHTAR_1 })).durum === 200);
  ok('ikinci yuva tanimsizken ANAHTAR_2 -> 401', (await o.gun(DUN, { anahtar: ANAHTAR_2 })).durum === 401);
  // döndürme: iki yuva
  const env2 = { ...o.env, PIYASA_OKUMA_ANAHTARI_2: ANAHTAR_2 };
  ok('dondurme: iki yuva doluyken ikisi de gecer', (await o.gun(DUN, { env: env2 })).durum === 200 && (await o.gun(DUN, { env: env2, anahtar: ANAHTAR_2 })).durum === 200);
  const env3 = { ...o.env, PIYASA_OKUMA_ANAHTARI: undefined, PIYASA_OKUMA_ANAHTARI_2: ANAHTAR_2 };
  ok('dondurme: yalniz 2. yuva -> eski belirtec 401, yeni 200', (await o.gun(DUN, { env: env3 })).durum === 401 && (await o.gun(DUN, { env: env3, anahtar: ANAHTAR_2 })).durum === 200);
  const kisa = 'kisa-belirtec-31-karakter-uzunl';
  ok('32 karakterden kisa yapilandirilmis belirtec yok sayilir (kapali basarisizlik)', kisa.length === 31 && (await o.gun(DUN, { env: { ...o.env, PIYASA_OKUMA_ANAHTARI: kisa }, anahtar: kisa })).durum === 401);
  ok('hic belirtec yapilandirilmamis -> 401', (await o.gun(DUN, { env: { ...o.env, PIYASA_OKUMA_ANAHTARI: undefined } })).durum === 401);
  ok('belirtecEsit dogru', (await belirtecEsit('abc', 'abc')) === true && (await belirtecEsit('abc', 'abd')) === false && (await belirtecEsit('', 'abc')) === false && (await belirtecEsit('a', 'a'.repeat(1000))) === false);
  // Sabit süre: her doğrulamada iki yuva da özetlenir; eşleşen/eşleşmeyen/eksik başlık aynı iş yükü.
  const subtle = globalThis.crypto.subtle;
  const asil = subtle.digest.bind(subtle);
  let ozet = 0;
  try {
    subtle.digest = (...x) => { ozet++; return asil(...x); };
    const say = async (s) => { ozet = 0; await o.iste('/piyasa/v1/bilinmeyen', s); return ozet; };
    const sonuc = [await say({}), await say({ anahtar: ANAHTAR_1 + 'x' }), await say({ anahtar: 'a' }), await say({ anahtar: null }), await say({ env: env2, anahtar: ANAHTAR_2 }), await say({ env: env2 })];
    ok('zamanlama: her durumda 4 SHA-256 ozeti (kisa devre yok)', sonuc.every((n) => n === 4), `-> ${sonuc}`);
  } finally { delete subtle.digest; }
  const kaynak = readFileSync(new URL('./piyasa.js', import.meta.url), 'utf8');
  const yetki = kaynak.slice(kaynak.indexOf('async function yetkili'), kaynak.indexOf('// ================================================================ istek yolu'));
  ok('kaynak: belirtec metin karsilastirmasi (=== / includes) yok', !/verilen\s*===\s*k|k1\s*===|k2\s*===|includes\(verilen/.test(yetki) && /fark \|= x\[i\] \^ y\[i\]/.test(kaynak));
}
{ // parametreler → 400
  const o = ortam();
  const durumlar = {
    'parametresiz': '', 'tarih+bas': `tarih=${DUN}&bas=${DUN}`, 'yalniz bas': `bas=${DUN}`, 'yalniz bit': `bit=${DUN}`, 'bozuk bicim': 'tarih=23-11-2026',
    'olmayan gun': 'tarih=2026-02-30', '2026 oncesi': 'tarih=2025-12-31', 'yarin': 'tarih=2026-11-25', 'bas>bit': 'bas=2026-11-10&bit=2026-11-09',
    '32 gun': 'bas=2026-10-24&bit=2026-11-24', 'bilinmeyen parametre': `tarih=${DUN}&x=1`, 'yinelenen': `tarih=${DUN}&tarih=${DUN}`, 'bos tarih': 'tarih=', 'saatli tarih': 'tarih=2026-11-23T00:00',
  };
  for (const [ad, q] of Object.entries(durumlar)) {
    const x = await o.iste('/piyasa/v1/dengesizlik?' + q);
    ok(`400 ${ad}`, x.durum === 400 && x.j.hata.kod === 'parametre' && typeof x.j.hata.mesaj === 'string' && x.r.headers.get('Cache-Control') === 'no-store');
  }
  ok('400 yollarinda EPİAŞ istegi yok', o.e.sayac.rapor === 0 && o.e.sayac.giris === 0);
  let otuzbir = null;
  for (let i = 0; i < 4 && (!otuzbir || otuzbir.durum !== 200); i++) otuzbir = await o.aralik('2026-10-25', '2026-11-24');
  ok('31 gun kabul (eksik dilimler en cok 2 istekte tamamlanir)', otuzbir.durum === 200 && otuzbir.j.gunler.length === 31);
  ok('ILK_GUN kabul', (await o.gun(ILK_GUN)).durum === 200);
  ok('bilinmeyen yol -> 404 (kimlikli)', (await o.iste('/piyasa/v1/yok')).durum === 404 && (await o.iste('/piyasa/v2/dengesizlik?tarih=' + DUN)).durum === 404 && (await o.iste('/piyasa/v1/dengesizlik/')).durum === 404);
}

// ============================================================================
// 3 — SÖZLEŞME BİÇİMİ
// ============================================================================
{
  const o = ortam({ gun: (g) => sahteGun(g, g === BUGUN ? 14 : 1e9) });
  const x = await o.aralik(DUN, BUGUN);
  ok('200 + basliklar (JSON, no-store, noindex, CORS yok)', x.durum === 200 && x.r.headers.get('Content-Type') === 'application/json; charset=utf-8' && x.r.headers.get('Cache-Control') === 'no-store' && x.r.headers.get('X-Robots-Tag') === 'noindex' && ![...x.r.headers.keys()].some((k) => k.startsWith('access-control')));
  ok('ust duzey anahtarlar tam olarak surum,kaynak,uretildi,gunler', Object.keys(x.j).join() === 'surum,kaynak,uretildi,gunler' && x.j.surum === 1 && x.j.kaynak === 'EPİAŞ Şeffaflık Platformu — PTF, SMF ve SDF Listeleme' && x.j.uretildi === '2026-11-24T14:30:00+03:00');
  ok('gun anahtarlari tam olarak tarih,cekildi,bayat,tam,donemler', x.j.gunler.every((g) => Object.keys(g).join() === 'tarih,cekildi,bayat,tam,donemler') && x.j.gunler.map((g) => g.tarih).join() === `${DUN},${BUGUN}`);
  ok('donem anahtarlari tam olarak bas,dk,ptf,smf,pozitif,negatif,yon,yonHam', x.j.gunler.every((g) => g.donemler.every((d) => Object.keys(d).join() === 'bas,dk,ptf,smf,pozitif,negatif,yon,yonHam')));
  ok('tipler: yon kumesi, sayi|null, ISO +03:00', x.j.gunler.every((g) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+03:00$/.test(g.cekildi) && typeof g.bayat === 'boolean' && typeof g.tam === 'boolean' && g.donemler.every((d) => ['acik', 'fazla', 'denge', null].includes(d.yon) && ['ptf', 'smf', 'pozitif', 'negatif'].every((k) => d[k] === null || Number.isFinite(d[k])) && (d.yonHam === null || typeof d.yonHam === 'string'))));
  ok('tam: dun true, bugun (14/24 yayim) false', x.j.gunler[0].tam === true && x.j.gunler[1].tam === false);
  ok('bugun yayimlanmamis donemler null, PTF var', x.j.gunler[1].donemler.slice(14).every((d) => d.smf === null && d.pozitif === null && d.negatif === null && d.yon === null && d.yonHam === null && d.ptf !== null));
  ok('bayat false, cekildi simdi', x.j.gunler.every((g) => g.bayat === false && g.cekildi === '2026-11-24T14:30:00+03:00'));
  ok('ic alanlar (maliyet, s, ozet) sizmaz', !/maliyet|"s":|ozet/.test(x.metin));
  const t = await o.gun(DUN);
  ok('tek gun: gunler uzunlugu 1', t.durum === 200 && t.j.gunler.length === 1);
}
{ // 503 biçimleri
  const o = ortam({ gun: (g) => (g === '2026-11-05' ? [] : sahteGun(g)) });
  const x = await o.aralik('2026-11-03', '2026-11-09');
  ok('aralikta EPİAŞ verisi olmayan gun -> 503 veri-yok + Retry-After (yarim dosya yok)', x.durum === 503 && x.j.hata.kod === 'veri-yok' && typeof x.j.hata.mesaj === 'string' && +x.r.headers.get('Retry-After') > 0 && !x.metin.includes('donemler'));
  ok('veri olan komsu gunler yine de KV\'ye yazildi', o.kv.depo.has(kvGunAnahtari('2026-11-04')) && !o.kv.depo.has(kvGunAnahtari('2026-11-05')));
  const o2 = ortam({ raporDurum: 500 });
  const y = await o2.gun('2026-10-10');
  ok('EPİAŞ 500 -> 503 gecici + Retry-After', y.durum === 503 && y.j.hata.kod === 'gecici' && +y.r.headers.get('Retry-After') >= 1);
  const o3 = ortam({ env: { EPIAS_USERNAME: undefined } });
  const z = await o3.gun('2026-10-10');
  ok('kimlik yok -> 503 gecici, EPİAŞ\'a istek yok', z.durum === 503 && z.j.hata.kod === 'gecici' && o3.e.sayac.giris === 0 && o3.e.sayac.rapor === 0);
  const o4 = ortam({ env: { PIYASA_KV: undefined } });
  const w = await o4.gun('2026-10-10');
  ok('KV baglamasi yok -> 503 gecici, EPİAŞ\'a istek yok', w.durum === 503 && w.j.hata.kod === 'gecici' && o4.e.sayac.rapor === 0);
}

{ // aynı istekte iki paralel çekim (bugün+dün ve eski dilim): durum kaydında hiçbir günün özeti kaybolmaz
  const o = ortam();
  const x = await o.aralik('2026-11-20', BUGUN);
  await bosalt();
  const d = JSON.parse(o.kv.depo.get(KV_DURUM));
  ok('paralel cekimler: durum kaydinda istenen tum gunlerin ozeti var', x.durum === 200 && o.e.sayac.rapor === 2 && ['2026-11-20', '2026-11-21', '2026-11-22', DUN, BUGUN].every((g) => Array.isArray(d.g[g])), `-> ${Object.keys(d.g)}`);
}

// ============================================================================
// 4 — KV ÖNCE
// ============================================================================
{
  const o = ortam({ env: { PIYASA_GECE: '0-24', PIYASA_CRON_ASGARI_SN: '0' } });
  for (let i = 0; i < 50; i++) { await o.cron(); o.e.ilerlet(10 * DK); }
  const dolu = kvGunleri(o.kv);
  ok('gece bakimi 2026-01-01 … bugun tum gunleri KV\'ye doldurdu', dolu.length === 328 && dolu[0] === ILK_GUN && dolu.at(-1) === BUGUN, `-> ${dolu.length}`);
  const once = { r: o.e.sayac.rapor, g: o.e.sayac.giris };
  o.yeniSurec();
  const gunler = [BUGUN, DUN, '2026-01-01', '2026-03-15', '2026-07-31', '2026-10-01', '2026-11-10'];
  const istekler = Array.from({ length: 100 }, (_, i) => (i % 4 === 3 ? o.aralik('2026-10-20', '2026-11-19') : o.gun(gunler[i % gunler.length])));
  const s = await Promise.all(istekler);
  ok('KV sicak: yeni surecte 100 eszamanli karisik istek -> 0 EPİAŞ istegi, hepsi 200', o.e.sayac.rapor === once.r && o.e.sayac.giris === once.g && s.every((x) => x.durum === 200), `-> ${o.e.sayac.rapor - once.r} rapor`);
  ok('KV sicak: tum gunler bayat degil', s.every((x) => x.j.gunler.every((g) => g.bayat === false)));
  o.yeniSurec();
  o.kv.bozuk = true;
  const b = await o.gun('2026-05-05');
  ok('KV okunamiyorsa 503 gecici, EPİAŞ\'a GIDILMEZ', b.durum === 503 && b.j.hata.kod === 'gecici' && o.e.sayac.rapor === once.r);
  o.kv.bozuk = false;
  // toplu okuma yoksa tek tek okunur (31 gün + durum ≤ 45)
  const o2 = ortam({ toplu: false, kvNesnesi: undefined });
  for (const [k, v] of o.kv.depo) o2.kv.depo.set(k, v);
  o2.olc.n = 0;
  const t = await o2.aralik('2026-10-20', '2026-11-19');
  ok('toplu okuma yok: 31 gunluk aralik tek tek okunur, G/C <= 45, EPİAŞ yok', t.durum === 200 && o2.e.sayac.rapor === 0 && o2.olc.n <= AZAMI_ALT_ISTEK && o2.kv.okuma === 32, `-> io ${o2.olc.n}, okuma ${o2.kv.okuma}`);
  const o3 = ortam({});
  for (const [k, v] of o.kv.depo) o3.kv.depo.set(k, v);
  o3.olc.n = 0;
  await o3.aralik('2026-10-20', '2026-11-19');
  ok('toplu okuma var: 31 gun tek KV islemi', o3.kv.topluOkuma === 1 && o3.olc.n === 2, `-> io ${o3.olc.n}`);
  o3.olc.n = 0;
  await o3.aralik('2026-10-20', '2026-11-19');
  ok('ayni surecte ikinci istek: bellekten, G/C 0', o3.olc.n === 0);
}

// ============================================================================
// 5 — ZAMANLANMIŞ GÖREV: TEK İSTEKTE İKİ GÜN, YALNIZ DEĞİŞİNCE YAZMA
// ============================================================================
{
  const o = ortam({ gun: (g) => sahteGun(g, g === BUGUN ? 14 : 1e9) });
  await o.cron();
  const rp = o.e.istekler.filter((i) => i.url.includes('ptf-smf-sdf'));
  ok('cron: tek rapor istegi dun+bugunu kapsar', rp.length === 1 && JSON.parse(rp[0].body).startDate === `${DUN}T00:00:00+03:00` && JSON.parse(rp[0].body).endDate === `${BUGUN}T23:00:00+03:00`);
  ok('cron: iki gun kaydi + durum + bilet yazildi', o.kv.depo.has(kvGunAnahtari(DUN)) && o.kv.depo.has(kvGunAnahtari(BUGUN)) && o.kv.depo.has(KV_DURUM) && o.kv.depo.has('piyasa:v1:tgt'));
  ok('cron: gun kaydi kalici (TTL yok)', o.kv.ttl.get(kvGunAnahtari(DUN)) === undefined && o.kv.ttl.get(KV_DURUM) === undefined);
  ok('cron: gunduz bakim yok (yalniz 2 gun)', kvGunleri(o.kv).length === 2);
  const y0 = o.kv.yazim;
  o.e.ilerlet(10 * DK);
  await o.cron();
  ok('icerik ayni: yalniz durum kaydi yazilir (gun kaydi YOK)', o.kv.yazim === y0 + 1 && o.kv.yazilanlar.at(-1) === KV_DURUM, `-> ${o.kv.yazilanlar.slice(y0)}`);
  o.e.ayar.gun = (g) => sahteGun(g, g === BUGUN ? 15 : 1e9);
  o.e.ilerlet(10 * DK);
  await o.cron();
  ok('bugun degisti: yalniz bugun + durum yazilir', o.kv.yazilanlar.slice(y0 + 1).join() === `${kvGunAnahtari(BUGUN)},${KV_DURUM}`, `-> ${o.kv.yazilanlar.slice(y0 + 1)}`);
  const sayi0 = o.e.sayac.rapor;
  o.e.ilerlet(2 * DK);
  await o.cron();
  ok('5 dk icinde ikinci tetikleme: islem yok (cift tetikleme korumasi)', o.e.sayac.rapor === sayi0);
  o.e.ilerlet(8 * DK);
  await o.cron('0 * * * *');
  ok('PIYASA_CRON tanimsiz: her cron ifadesi islenir', o.e.sayac.rapor === sayi0 + 1);
  o.env.PIYASA_CRON = '*/10 * * * *';
  o.e.ilerlet(10 * DK);
  await o.cron('0 3 * * *');
  ok('PIYASA_CRON tanimli: baska cron ifadesi yok sayilir', o.e.sayac.rapor === sayi0 + 1);
  await o.cron('*/10 * * * *');
  ok('PIYASA_CRON tanimli: kendi ifadesi islenir', o.e.sayac.rapor === sayi0 + 2);
  const d = JSON.parse(o.kv.depo.get(KV_DURUM));
  ok('durum kaydi: son tur, sonuc, ust-akis kodu (deger yok)', d.cron.sonuc === 'tamam' && d.cron.ustAkis === 200 && Number.isFinite(d.cron.son) && !/donemler|ptf|smf|pozitif|negatif/.test(JSON.stringify(d)) && Object.keys(d).join() === 's,g,dl,yok,cron');
}

// ============================================================================
// 6 — GECE BAKIMI: PARÇALI DOLDURMA, ALT İSTEK SINIRI, UZLAŞTIRMA, DOĞRULAMA
// ============================================================================
async function geceSimulasyonu(ayar, gece) {
  const o = ortam({ an: istAn(BUGUN, 0, 3), ...ayar });
  let enCokIo = 0, enCokFetch = 0, tur = 0;
  const hedefSon = gunEkle(BUGUN, gece);
  while (o.e.an < istAn(hedefSon, 6, 0)) {
    o.yeniSurec(); // en kötü durum: her tur soğuk süreç (bilet KV'den, bütçe sıfır)
    o.olc.n = 0;
    const f0 = o.e.sayac.rapor + o.e.sayac.giris;
    await o.cron();
    enCokIo = Math.max(enCokIo, o.olc.n);
    enCokFetch = Math.max(enCokFetch, o.e.sayac.rapor + o.e.sayac.giris - f0);
    o.e.ilerlet(10 * DK);
    tur++;
  }
  return { o, enCokIo, enCokFetch, tur };
}
ok('dilimBul: 10 gun, artan gunler son parcaya (Subat 3 parca)', JSON.stringify(dilimBul('2026-01-25', 10)) === '{"bas":"2026-01-21","bit":"2026-01-31","son":"2026-01-31"}' && dilimBul('2026-01-10', 10).bas === '2026-01-01' && dilimBul('2026-01-11', 10).bas === '2026-01-11' && dilimBul('2026-02-28', 10).bas === '2026-02-21' && dilimBul('2026-02-28', 10).bit === '2026-02-28');
ok('dilimBul: 31 gun = takvim ayi; sinir ile kirpilir', JSON.stringify(dilimBul('2026-11-05', 31, '2026-11-22')) === '{"bas":"2026-11-01","bit":"2026-11-22","son":"2026-11-30"}' && dilimBul('2026-02-14', 31).bit === '2026-02-28');
{ // ay ay (PIYASA_DILIM_GUN=31; ücretli plan ayarı): tek gecede, ay başına tek istek
  const { o, enCokIo, tur } = await geceSimulasyonu({ env: { PIYASA_DILIM_GUN: '31' } }, 0);
  const d = JSON.parse(o.kv.depo.get(KV_DURUM));
  const dolu = kvGunleri(o.kv);
  ok('ilk gece (31 gunluk dilim): 02:00–05:59 penceresinde tum 2026 gunleri doldu', dolu.length === 328, `-> ${dolu.length}`);
  ok('her turda olculen G/C (fetch+KV+Cache) <= 45 (ucretsiz plan 50)', enCokIo <= AZAMI_ALT_ISTEK, `-> ${enCokIo}`);
  const gece = o.e.istekler.filter((i) => i.url.includes('ptf-smf-sdf') && istAn(BUGUN, 2) <= i.an && i.an < istAn(BUGUN, 6) && JSON.parse(i.body).startDate.slice(0, 10) !== DUN);
  ok('doldurma ay ay: 11 ay istegi, takvim ayi sinirinda', gece.slice(0, 11).every((i) => JSON.parse(i.body).startDate.slice(8, 10) === '01') && gece.slice(0, 11).map((i) => JSON.parse(i.body).startDate.slice(0, 7)).join() === '2026-01,2026-02,2026-03,2026-04,2026-05,2026-06,2026-07,2026-08,2026-09,2026-10,2026-11', `-> ${gece.map((i) => JSON.parse(i.body).startDate.slice(0, 10))}`);
  ok('durum: tum gunlerin ozeti var, dilimler denetlenmis', Object.keys(d.g).length === 328 && Object.keys(d.dl).length >= 10 && Object.keys(d).join() === 's,g,dl,yok,cron');
  gercekLog(`  bilgi: ilk gece (31 gun) ${tur} tur, en cok G/C/tur ${enCokIo}, KV yazma ${o.kv.yazim}`);
}
ok('dilimBul: 8 gun (varsayilan) -> ay 4 parca, en cok 8 gun', ['2026-01-01', '2026-01-09', '2026-01-17', '2026-01-25'].every((g) => dilimBul(g, 8).bas === g) && dilimBul('2026-01-31', 8).bas === '2026-01-25' && dilimBul('2026-02-28', 8).bas === '2026-02-25' && dilimBul('2026-04-30', 8).bas === '2026-04-25');
{ // varsayılan 8 günlük dilim (ücretsiz plan CPU varsayımı): iki gecede tamamlanır, her istek <= 8 gün
  const { o, enCokIo } = await geceSimulasyonu({}, 1);
  const dolu = kvGunleri(o.kv);
  const bakimIstekleri = o.e.istekler.filter((i) => i.url.includes('ptf-smf-sdf')).map((i) => JSON.parse(i.body)).filter((b) => b.startDate.slice(0, 10) < '2026-11-23');
  ok('8 gunluk dilim: iki gecede 2026-01-01 … bugun tum gunler doldu', dolu.length === 329 && dolu[0] === ILK_GUN, `-> ${dolu.length}`);
  ok('8 gunluk dilim: her bakim istegi en cok 8 gun, ay sinirini asmaz', bakimIstekleri.length > 40 && bakimIstekleri.every((b) => { const g1 = b.startDate.slice(0, 10), g2 = b.endDate.slice(0, 10); return g1.slice(0, 7) === g2.slice(0, 7) && (Date.parse(g2) - Date.parse(g1)) / GUN + 1 <= 8; }));
  ok('8 gunluk dilim: her turda G/C <= 45', enCokIo <= AZAMI_ALT_ISTEK, `-> ${enCokIo}`);
  const ilkGece = o.e.istekler.filter((i) => i.url.includes('ptf-smf-sdf') && i.an < istAn(BUGUN, 6)).length;
  gercekLog(`  bilgi: 8 gunluk dilimle ilk gece ${ilkGece} rapor istegi (dun+bugun dahil), en cok G/C/tur ${enCokIo}`);
}
{ // sayfalı yanıt (100 kalem/sayfa → ay başına 8 sayfa): sınır içinde kalır, birkaç gecede tamamlanır
  const { o, enCokIo, enCokFetch } = await geceSimulasyonu({ sayfaBoyu: 100 }, 3);
  const dolu = kvGunleri(o.kv);
  ok('sayfali yanit: her turda G/C <= 45', enCokIo <= AZAMI_ALT_ISTEK, `-> ${enCokIo}`);
  ok('sayfali yanit: tur basina ust-akis <= dakikalik butce (10 rapor + 1 giris)', enCokFetch <= BUTCE.rapor + BUTCE.giris, `-> ${enCokFetch}`);
  const sonGun = istanbulBugunT(o.e.an - 10 * DK);
  const beklenen = []; for (let g = ILK_GUN; g <= sonGun; g = gunEkle(g, 1)) beklenen.push(g);
  ok('sayfali yanit: 4 gecede 2026-01-01 … bugun arasi HIC eksik gun yok (sigmayan gunler sonraki tura)', JSON.stringify(dolu) === JSON.stringify(beklenen), `-> ${dolu.length}/${beklenen.length}`);
  gercekLog(`  bilgi: sayfali doldurma en cok G/C/tur ${enCokIo}, en cok ust-akis/tur ${enCokFetch}`);
}
{ // ikinci gece: uzlaştırma penceresi yeniden denetlenir; yalnız değişen gün yazılır; eski aylar haftada bir
  const { o } = await geceSimulasyonu({ env: { PIYASA_DILIM_GUN: '31' } }, 0);
  const degisen = '2026-10-28';
  o.e.ayar.gun = (g) => sahteGun(g, 1e9, 60, g === degisen ? 1 : 0);
  // ertesi gün (25.11) gündüz, sonra gece
  const yazilanOnce = o.kv.yazilanlar.length;
  const raporOnce = o.e.istekler.length;
  while (o.e.an < istAn('2026-11-25', 6, 0)) { await o.cron(); o.e.ilerlet(10 * DK); }
  const gunYazimlari = o.kv.yazilanlar.slice(yazilanOnce).filter((k) => k.startsWith('piyasa:v1:gun:'));
  const ikinciGece = o.e.istekler.slice(raporOnce).filter((i) => i.url.includes('ptf-smf-sdf') && JSON.parse(i.body).startDate.slice(0, 10) !== '2026-11-24' && JSON.parse(i.body).startDate.slice(0, 10) !== '2026-11-23');
  ok('2. gece: uzlastirma penceresi (bugun-45 … bugun-2) ay dilimleriyle denetlendi (Ekim + Kasim)', ikinciGece.map((i) => JSON.parse(i.body).startDate.slice(0, 7)).join() === '2026-10,2026-11', `-> ${ikinciGece.map((i) => i.body.slice(14, 24))}`);
  ok('2. gece: yalniz degisen gun (ve gun donumundeki bugun) yazildi', gunYazimlari.includes(kvGunAnahtari(degisen)) && gunYazimlari.every((k) => [kvGunAnahtari(degisen), kvGunAnahtari('2026-11-25'), kvGunAnahtari('2026-11-24')].includes(k)), `-> ${gunYazimlari}`);
  // 8 gün sonra eski aylar doğrulanır
  o.e.an = istAn('2026-12-02', 2, 55);
  const r2 = o.e.istekler.length;
  while (o.e.an < istAn('2026-12-02', 6, 0)) { await o.cron(); o.e.ilerlet(10 * DK); }
  const dogrulama = o.e.istekler.slice(r2).filter((i) => i.url.includes('ptf-smf-sdf')).map((i) => JSON.parse(i.body).startDate.slice(0, 7));
  ok('haftalik dogrulama: 45 gunden eski aylar yeniden cekildi', ['2026-01', '2026-05', '2026-09'].every((m) => dogrulama.includes(m)), `-> ${dogrulama}`);
}
{ // EPİAŞ'ın veri döndürmediği gün: işaretlenir, 7 gün yeniden denenmez, diğer işleri aç bırakmaz
  const { o } = await geceSimulasyonu({ gun: (g) => (g === '2026-02-14' ? [] : sahteGun(g)), env: { PIYASA_DILIM_GUN: '31' } }, 0);
  const d = JSON.parse(o.kv.depo.get(KV_DURUM));
  ok('veri olmayan gun: yok isaretli, digerleri dolu', Number.isFinite(d.yok['2026-02-14']) && kvGunleri(o.kv).length === 327);
  const dd = { g: {}, dl: {}, yok: { '2026-02-14': istAn(BUGUN, 3) } };
  for (let g = ILK_GUN; g <= '2026-11-22'; g = gunEkle(g, 1)) if (g !== '2026-02-14') dd.g[g] = ['x', 0, 24];
  ok('bakimSec: yok isaretli gun doldurmayi tikamaz (uzlastirmaya gecer)', bakimSec(dd, BUGUN, istAn(BUGUN, 4)).tur === 'uzlastirma');
  ok('bakimSec: 7 gun sonra yeniden doldurma denenir', bakimSec(dd, '2026-12-02', istAn('2026-12-02', 4)).tur === 'doldurma');
}

// ============================================================================
// 7 — BÜTÇE VE AYRILMIŞ PAY
// ============================================================================
ok('butce sabitleri: dakikada 10 rapor (4 zamanli icin ayrili) + 1 giris', BUTCE.rapor === 10 && BUTCE.zamanliAyrilan === 4 && BUTCE.giris === 1);
{
  const o = ortam();
  const aylar = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
  const s = await Promise.all(aylar.map((m) => o.gun(`2026-${m}-15`)));
  ok('istek yolu: 10 eksik ay ayni dakikada -> en cok 6 rapor, 1 giris', o.e.sayac.rapor === BUTCE.rapor - BUTCE.zamanliAyrilan && o.e.sayac.giris === 1, `-> ${o.e.sayac.rapor} / ${o.e.sayac.giris}`);
  ok('butce asilinca 503 butce + Retry-After <= 60 (uydurma yok)', s.filter((x) => x.durum === 200).length === 6 && s.filter((x) => x.durum === 503 && x.j.hata.kod === 'butce' && +x.r.headers.get('Retry-After') <= 60).length === 4);
  await o.cron();
  ok('ayrilmis pay: ayni dakikada zamanlanmis gorev yine calisir', o.e.sayac.rapor === 7 && o.kv.depo.has(kvGunAnahtari(BUGUN)));
  o.e.ilerlet(DK);
  const s2 = await Promise.all(['08', '09', '10'].map((m) => o.gun(`2026-${m}-15`)));
  ok('sonraki dakika butce yenilenir', s2.every((x) => x.durum === 200));
}
{ // bütçe Cache API sayacıyla süreçler arasında paylaşılır
  const o = ortam();
  await Promise.all(['01', '02', '03', '04', '05', '06'].map((m) => o.gun(`2026-${m}-15`)));
  await bosalt();
  o.yeniSurec();
  const x = await o.gun('2026-07-15');
  ok('yeni surec ayni dakikada: paylasilan sayac dolu -> 503 butce', x.durum === 503 && x.j.hata.kod === 'butce' && o.e.sayac.rapor === 6);
}

{ // istek başına en çok 2 eksik dilim: kalanı sonraki isteğe
  const o = ortam();
  const x = await o.aralik('2026-10-05', '2026-11-04');
  ok('31 gun, 5 eksik dilim: ilk istek 2 dilim tamamlar, 503 butce Retry-After 2', x.durum === 503 && x.j.hata.kod === 'butce' && x.r.headers.get('Retry-After') === '2' && o.e.sayac.rapor === 2, `-> ${x.durum} ${o.e.sayac.rapor}`);
  const y = await o.aralik('2026-10-05', '2026-11-04');
  ok('ikinci istek 2 dilim daha: hala 503', y.durum === 503 && o.e.sayac.rapor === 4);
  const y2 = await o.aralik('2026-10-05', '2026-11-04');
  ok('ucuncu istek son dilimi tamamlar: 200, 31 gun', y2.durum === 200 && y2.j.gunler.length === 31 && o.e.sayac.rapor === 5);
  const z = await o.aralik('2026-10-05', '2026-11-04');
  ok('dorduncu istek: KV/bellekten, EPİAŞ yok', z.durum === 200 && o.e.sayac.rapor === 5);
  const istenen = o.e.istekler.filter((i) => i.url.includes('ptf-smf-sdf')).map((i) => JSON.parse(i.body).startDate.slice(0, 10) + '..' + JSON.parse(i.body).endDate.slice(0, 10));
  ok('istek yolu dilimleri: 8 gunluk sabit parcalar', istenen.join() === '2026-10-01..2026-10-08,2026-10-09..2026-10-16,2026-10-17..2026-10-24,2026-10-25..2026-10-31,2026-11-01..2026-11-08', `-> ${istenen}`);
}

// ============================================================================
// 8 — TEK-UÇUŞ, GİRİŞ ENGELİ, BİLET ŞİFRELEME
// ============================================================================
{
  const o = ortam({ gecikmeMs: 20 });
  const s = await Promise.all(Array.from({ length: 50 }, () => o.gun('2026-06-10')));
  ok('ayni gun 50 eszamanli soguk istek -> 1 giris + 1 rapor (tek-ucus), hepsi 200', o.e.sayac.giris === 1 && o.e.sayac.rapor === 1 && s.every((x) => x.durum === 200));
  ok('tek-ucus: KV\'ye gun basina tek yazim', o.kv.yazilanlar.filter((k) => k === kvGunAnahtari('2026-06-10')).length === 1);
  const o2 = ortam({ gecikmeMs: 20 });
  await Promise.all(['01', '02', '03', '04', '05'].map((m) => o2.gun(`2026-${m}-10`)));
  ok('farkli aylar eszamanli soguk -> 1 giris (bilet tek-ucus)', o2.e.sayac.giris === 1 && o2.e.sayac.rapor === 5);
}
{ // reddedilen giriş: büyüyen engel 5 dk → 30 dk → 2 sa; kimlik değişince hemen
  const o = ortam({ girisDurum: 401, env: { PIYASA_CRON_ASGARI_SN: '0' } });
  const dene = async () => { await o.cron(); await o.gun('2026-03-03'); await o.gun('2026-04-04'); return o.e.sayac.giris; };
  ok('1. ret: tek deneme, rapor yok', (await dene()) === 1 && o.e.sayac.rapor === 0);
  o.e.ilerlet(61 * 1000); ok('61 sn: deneme yok (5 dk engel)', (await dene()) === 1);
  o.e.ilerlet(4 * DK); ok('5 dk: 2. deneme', (await dene()) === 2);
  o.e.ilerlet(5 * DK + 1000); ok('2. retten 5 dk sonra: yok (30 dk)', (await dene()) === 2);
  o.e.ilerlet(25 * DK); ok('30 dk: 3. deneme', (await dene()) === 3);
  o.e.ilerlet(31 * DK); ok('3. retten 31 dk sonra: yok (2 sa)', (await dene()) === 3);
  o.e.ilerlet(90 * DK); ok('2 sa: 4. deneme', (await dene()) === 4);
  o.e.ilerlet(2 * SA + 1000); ok('ust sinir 2 sa: 5. deneme', (await dene()) === 5);
  const kvEngel = o.kv.depo.get('piyasa:v1:engel');
  ok('kalici engel KV\'de (tum veri merkezleri gorur), parola duz metin yok', !!kvEngel && !kvEngel.includes(SAHTE_ENV.EPIAS_PASSWORD) && !kvEngel.includes(SAHTE_ENV.EPIAS_USERNAME) && /"parmak":"[A-Za-z0-9+/=]+"/.test(kvEngel));
  o.yeniSurec();
  o.e.ilerlet(10 * DK); ok('yeni surec (bellek bos): KV engeli gecerli, giris yok', (await dene()) === 5);
  o.env.EPIAS_PASSWORD = 'duzeltilmis-parola';
  o.e.ayar.girisDurum = 201;
  const x = await o.gun('2026-05-05');
  ok('parola duzeltilince engel beklenmez: hemen giris, veri gelir', x.durum === 200 && o.e.sayac.giris === 6);
}
{ // geçici giriş hatası: 60 sn, KV'ye YAZILMAZ (yazma kotası)
  const o = ortam({ girisDurum: 500, env: { PIYASA_CRON_ASGARI_SN: '0' } });
  for (const m of ['01', '02', '03', '04']) await o.gun(`2026-${m}-02`);
  ok('giris 500: 4 istekte 1 deneme', o.e.sayac.giris === 1);
  ok('gecici engel KV\'ye yazilmaz', !o.kv.depo.has('piyasa:v1:engel'));
  o.e.ilerlet(61 * 1000); await o.gun('2026-05-02');
  ok('60 sn sonra yeniden denenir', o.e.sayac.giris === 2);
}
{ // rapor 401: bilet bir kez yenilenir; yine 401 → servis-yetki engeli (döngü yok)
  const o = ortam({ raporDurum: 401 });
  for (const m of ['01', '02', '03', '04', '05']) await o.gun(`2026-${m}-02`);
  ok('taze girisle alinan biletle 401: 1 giris + 1 rapor, sonra servis-yetki engeli (dongu yok)', o.e.sayac.giris === 1 && o.e.sayac.rapor === 1 && JSON.parse(o.kv.depo.get('piyasa:v1:engel')).kayit.deger.neden === 'servis-yetki', `-> ${o.e.sayac.giris}/${o.e.sayac.rapor}`);
  o.e.ilerlet(6 * DK);
  for (const m of ['06', '07']) await o.gun(`2026-${m}-02`);
  ok('servis-yetki engeli 5 dk sonra: bir deneme daha, sonra 30 dk engel', o.e.sayac.giris === 2 && o.e.sayac.rapor === 2, `-> ${o.e.sayac.giris}/${o.e.sayac.rapor}`);
  const o2 = ortam();
  await o2.gun('2026-01-02');
  o2.e.ayar.biletGecersiz = o2.e.sonBilet;
  const y0 = await o2.gun('2026-02-02');
  ok('eskimis bilet ayni dakikada: yenileme giris butcesine takilir -> 503 butce', y0.durum === 503 && y0.j.hata.kod === 'butce' && o2.e.sayac.giris === 1 && o2.e.sayac.rapor === 2);
  const r0 = o2.e.sayac.rapor;
  await o2.gun('2026-03-02');
  ok('reddedilen bilet onbellek/KV\'den yeniden KULLANILMAZ (bosa rapor yok)', o2.e.sayac.rapor === r0, `-> ${o2.e.sayac.rapor - r0}`);
  o2.e.ilerlet(DK);
  const y = await o2.gun('2026-02-02');
  ok('sonraki dakika: yeni giris, veri gelir', y.durum === 200 && o2.e.sayac.giris === 2);
}
{ // bilet şifreli saklanır
  const o = ortam();
  await o.cron();
  await bosalt();
  const kvT = o.kv.depo.get('piyasa:v1:tgt');
  const cT = o.cache.depo.get(_ic.CACHE_KOK + 'tgt');
  ok('KV ve Cache API\'de bilet DUZ METIN degil (AES-GCM)', !kvT.includes('TGT-') && !cT.includes('TGT-') && /"sifreli":\{"iv":"[A-Za-z0-9+/=]+","veri":"[A-Za-z0-9+/=]+"\}/.test(kvT));
  ok('bilet KV TTL 6000 sn', o.kv.ttl.get('piyasa:v1:tgt') === 6000);
  o.yeniSurec();
  o.e.ilerlet(10 * DK);
  await o.cron();
  ok('yeni surec sifreli bileti cozer: yeni giris yok, ayni bilet', o.e.sayac.giris === 1 && o.e.istekler.at(-1).headers.tgt === o.e.sonBilet);
  o.yeniSurec();
  o.env.EPIAS_PASSWORD = 'baska-parola';
  o.e.ilerlet(10 * DK);
  await o.cron();
  ok('parola degisince kayit cozulemez -> yeniden giris', o.e.sayac.giris === 2);
  o.yeniSurec();
  const k = JSON.parse(o.kv.depo.get('piyasa:v1:tgt'));
  k.kayit.sifreli.veri = 'A' + k.kayit.sifreli.veri.slice(1);
  o.kv.depo.set('piyasa:v1:tgt', JSON.stringify(k));
  o.cache.depo.clear();
  o.e.ilerlet(10 * DK);
  await o.cron();
  ok('kurcalanmis kayit reddedilir -> yeniden giris', o.e.sayac.giris === 3);
  o.e.ilerlet(101 * DK);
  await o.cron();
  ok('bilet 100 dk sonra yenilenir', o.e.sayac.giris === 4);
}

// ============================================================================
// 9 — SAYFALAMA (kaldığı yerden sürme)
// ============================================================================
{
  const o = ortam({ sayfaBoyu: 100, env: { PIYASA_DILIM_GUN: '31' } });
  const sayfalar = () => o.e.istekler.filter((i) => i.url.includes('ptf-smf-sdf')).map((i) => (JSON.parse(i.body).page || { number: 1 }).number);
  const x = await o.gun('2026-03-10');
  ok('31 gunluk ay / 100 kalem: 6 sayfa sonra istek butcesi biter -> 503 butce', x.durum === 503 && x.j.hata.kod === 'butce' && JSON.stringify(sayfalar()) === '[1,2,3,4,5,6]', `-> ${x.durum} ${JSON.stringify(sayfalar())}`);
  o.e.ilerlet(DK);
  const y = await o.gun('2026-03-10');
  ok('sonraki dakika BASTAN BASLAMAZ: 7-8. sayfalarla tamamlanir', y.durum === 200 && JSON.stringify(sayfalar()) === '[1,2,3,4,5,6,7,8]' && y.j.gunler[0].donemler.length === 24, `-> ${JSON.stringify(sayfalar())}`);
  ok('ilk istekte page yok; sonrakilerde {number,size}', JSON.parse(o.e.istekler.find((i) => i.url.includes('ptf-smf-sdf')).body).page === undefined && JSON.stringify(JSON.parse(o.e.istekler.filter((i) => i.url.includes('ptf-smf-sdf'))[1].body).page) === '{"number":2,"size":100}');
  const o2 = ortam({ sayfaBoyu: 10, sayfaHata: 3 });
  const z = await o2.gun(DUN);
  ok('kalan sayfa alinamazsa 503 (kesik liste "yayimlanmadi" diye sunulmaz), KV\'ye yazilmaz', z.durum === 503 && !o2.kv.depo.has(kvGunAnahtari(DUN)) && !o2.kv.depo.has(kvGunAnahtari(BUGUN)));
  const o3 = ortam({ raporGovde: JSON.stringify({ items: sahteGun(DUN).slice(0, 10), page: { number: 1, size: 10, total: 48 } }) });
  const w = await o3.gun(DUN);
  ok('page parametresi yok sayilirsa (ayni sayfa): 503, KV\'ye yazilmaz', w.durum === 503 && !o3.kv.depo.has(kvGunAnahtari(DUN)));
}

// ============================================================================
// 10 — UÇTAN UCA NORMALLEŞTİRME (zarf, alan biçimi, çakışma, 96 dönem)
// ============================================================================
for (const zarf of ['body.content', 'body.items', 'items', 'content', 'dizi', 'body']) {
  const o = ortam({ zarf });
  const x = await o.gun(DUN);
  ok(`zarf ${zarf} uctan uca`, x.durum === 200 && x.j.gunler[0].donemler.length === 24 && x.j.gunler[0].donemler[0].ptf === 2000);
}
{
  const o = ortam({ gun: (g) => sahteGun(g).map((r, h) => ({ ...r, date: `${g}T${String(h).padStart(2, '0')}:00:00+03:00`, time: `${g}T00:00:00+03:00` })) });
  const x = await o.gun(DUN);
  ok('date saati tasir, time gunun 00:00\'i: 24 donem dogru', x.durum === 200 && x.j.gunler[0].donemler[13].ptf === 2130 && x.j.gunler[0].tam === true);
  const o2 = ortam({ gun: (g) => sahteGun(g).map((r) => ({ ...r, date: `${g}T00:00:00+03:00`, time: `${g}T00:00:00+03:00` })) });
  const y = await o2.gun(DUN);
  ok('24 satir tek doneme cokerse: 503 (veri gosterilmez), KV\'ye yazilmaz', y.durum === 503 && !o2.kv.depo.has(kvGunAnahtari(DUN)));
  const kopya = (g) => { const l = sahteGun(g); const c2 = sahteGun(g); c2[7] = { ...c2[7], smf: c2[7].smf + 50 }; return [...l, ...c2]; };
  const o3 = ortam({ gun: kopya });
  const z = await o3.gun(DUN);
  const d7 = z.j.gunler[0].donemler[7];
  ok('celisen kopya uctan uca: o donem tumuyle null, digerleri saglam, tam=false', d7.ptf === null && d7.smf === null && d7.pozitif === null && d7.negatif === null && d7.yon === null && z.j.gunler[0].donemler[8].ptf === 2080 && z.j.gunler[0].tam === false);
  ok('celiski sayaci + log yalniz sayi ve tarih', sayaclar.cakisma === 2 && loglar.some((l) => /^piyasa: cakisan-yinelenen-satir 2 2026-11-23 2026-11-24$/.test(l)), `-> ${loglar.filter((l) => l.includes('cakisan'))}`);
  const o4 = ortam({ gun: (g) => sahteGun(g, 1e9, 15) });
  const w = await o4.gun(DUN);
  ok('96 donemli gun: dk 15, 96 donem, tam', w.durum === 200 && w.j.gunler[0].donemler.length === 96 && w.j.gunler[0].donemler.every((d) => d.dk === 15) && w.j.gunler[0].tam === true && w.j.gunler[0].donemler[95].bas === `${DUN}T23:45:00+03:00`);
  const o5 = ortam({ gun: (g) => sahteGun(g).slice(0, 9) });
  const v = await o5.gun(DUN);
  ok('EPİAŞ yalniz 9 satir dondururse izgara 24, kalan tumu null, tam=false', v.j.gunler[0].donemler.length === 24 && v.j.gunler[0].donemler[9].ptf === null && v.j.gunler[0].tam === false);
}

// ============================================================================
// 11 — BAYAT VE İSTEK YOLU TAZELEMESİ (sağlıklı cron'da ziyaretçi EPİAŞ çağrısı 0)
// ============================================================================
{
  const o = ortam({ env: { PIYASA_CRON_ASGARI_SN: '0' } });
  await o.cron();
  const r0 = o.e.sayac.rapor;
  let cronSayisi = 1, hepsiTaze = true;
  for (let dk = 1; dk <= 120; dk++) {
    o.e.ilerlet(DK);
    if (dk % 10 === 0) { await o.cron(); cronSayisi++; }
    if (dk % 3 === 0) o.yeniSurec();
    const x = await o.aralik(DUN, BUGUN);
    if (x.durum !== 200 || x.j.gunler.some((g) => g.bayat)) hepsiTaze = false;
  }
  ok('saglikli cron: 2 saat x dakikada 1 istek -> EPİAŞ istegi yalniz cron kadar', o.e.sayac.rapor - r0 === cronSayisi - 1, `-> ${o.e.sayac.rapor - r0} / ${cronSayisi - 1}`);
  ok('saglikli cron: hicbir yanit bayat degil', hepsiTaze);
  // cron durur: 15 dk sonra istek yolu tek tazeleme yapar
  const r1 = o.e.sayac.rapor;
  o.e.ilerlet(14 * DK);
  await o.gun(BUGUN);
  ok('cron durdu, 14 dk: istek yolu EPİAŞ\'a gitmez', o.e.sayac.rapor === r1);
  o.e.ilerlet(2 * DK);
  const s = await Promise.all(Array.from({ length: 30 }, () => o.gun(BUGUN)));
  ok('cron durdu, 16 dk: 30 eszamanli istek -> 1 tazeleme, bayat degil', o.e.sayac.rapor === r1 + 1 && s.every((x) => x.durum === 200 && x.j.gunler[0].bayat === false));
  // EPİAŞ düşer: eski veri bayat:true ile, kendi zamanıyla
  o.e.ayar.raporDurum = 503;
  o.e.ilerlet(16 * DK);
  const b = await o.gun(BUGUN);
  ok('tazeleme basarisiz + pencere asildi: 200, bayat true, cekildi eski', b.durum === 200 && b.j.gunler[0].bayat === true && b.j.gunler[0].cekildi === s[0].j.gunler[0].cekildi);
  const r2 = o.e.sayac.rapor;
  await o.gun(BUGUN); await o.gun(DUN);
  ok('basarisiz tazeleme sonrasi anahtar beklemesi: EPİAŞ dovulmez', o.e.sayac.rapor === r2);
}
{
  ok('pencere: dun 15 dk, 2-45 gun 26 sa, eski 8 gun', _ic.pencere(DUN, BUGUN) === PENCERE.son2Ms && _ic.pencere('2026-11-01', BUGUN) === PENCERE.uzlastirmaMs && _ic.pencere('2026-09-01', BUGUN) === PENCERE.eskiMs);
  const o = ortam();
  await o.gun('2026-11-01');
  o.e.ilerlet(25 * SA); o.yeniSurec();
  ok('uzlastirma penceresindeki gun 25 sa sonra bayat degil', (await o.gun('2026-11-01')).j.gunler[0].bayat === false);
  o.e.ilerlet(2 * SA); o.yeniSurec();
  ok('uzlastirma penceresindeki gun 27 sa denetlenmezse bayat', (await o.gun('2026-11-01')).j.gunler[0].bayat === true);
  ok('bayat gun icin istek yolu EPİAŞ\'a gitmez (yalniz eksik gun)', o.e.sayac.rapor === 1);
}
{ // bellek kopyası, durumdaki daha yeni içerikten eskiyse KV'den okunur (yanlış "bayat" yok)
  const o = ortam({ env: { PIYASA_CRON_ASGARI_SN: '0' }, gun: (g) => sahteGun(g, g === BUGUN ? 10 : 1e9) });
  await o.cron();
  for (let i = 0; i < 3; i++) { o.e.ilerlet(10 * DK); await o.cron(); }
  o.yeniSurec();
  await o.gun(BUGUN); // bellek: içerik A
  o.e.ayar.gun = (g) => sahteGun(g, g === BUGUN ? 11 : 1e9);
  o.e.ilerlet(10 * DK);
  await o.cron(); // içerik B (başka süreç gibi)
  _ic.durumNormal; // durum belleği 30 sn
  o.e.ilerlet(31 * 1000);
  const x = await o.gun(BUGUN);
  ok('durum yeni ozet gosteriyor: eski bellek kopyasi atlanir, yeni icerik, bayat degil', x.j.gunler[0].bayat === false && x.j.gunler[0].donemler[10].pozitif !== null);
}

// ============================================================================
// 12 — YÜK: 100 EŞZAMANLI ZİYARETÇİ (soğuk ve sıcak)
// ============================================================================
{
  const o = ortam({ gecikmeMs: 5 });
  const karisik = (i) => {
    const g = gunEkle(ILK_GUN, (i * 37) % 328);
    return i % 5 === 0 ? o.aralik(gunEkle(g, -10) < ILK_GUN ? ILK_GUN : gunEkle(g, -10), g) : i % 7 === 0 ? o.gun(BUGUN) : o.gun(g);
  };
  const s = await Promise.all(Array.from({ length: 100 }, (_, i) => karisik(i)));
  const rp = o.e.sayac.rapor, gr = o.e.sayac.giris;
  ok('soguk: 100 eszamanli karisik istek -> ust-akis <= dakikalik istek payi (6 rapor + 1 giris)', rp <= BUTCE.rapor - BUTCE.zamanliAyrilan && gr <= BUTCE.giris, `-> ${rp} rapor, ${gr} giris`);
  ok('soguk: karsilanamayanlar 503 (butce/gecici) + Retry-After; 200 olanlar tam veri', s.every((x) => x.durum === 200 || (x.durum === 503 && ['butce', 'gecici'].includes(x.j.hata.kod) && x.r.headers.get('Retry-After'))));
  gercekLog(`  bilgi: soguk 100 istek -> ${s.filter((x) => x.durum === 200).length} x 200, ${s.filter((x) => x.durum === 503).length} x 503, ust-akis ${rp} rapor + ${gr} giris`);
}

// ============================================================================
// 13 — DURUM UCU, ENJEKTE EPİAŞ YARDIMCISI, ASLA FIRLATMAZ
// ============================================================================
{
  const o = ortam();
  await o.cron();
  const yetkisiz = await o.iste('/piyasa/v1/durum', { anahtar: null });
  ok('durum: belirtecsiz 401', yetkisiz.durum === 401);
  const x = await o.iste('/piyasa/v1/durum');
  ok('durum: 200, yalniz sayac/kod (deger yok)', x.durum === 200 && x.j.kv.gunSayisi === 2 && x.j.kv.eksikGun === 326 && x.j.zamanli.sonuc === 'tamam' && x.j.zamanli.ustAkisDurum === 200 && x.j.kimlik === 'yerlesik' && x.j.girisEngeli === null);
  ok('durum: fiyat, donem, belirtec, kimlik yok', !/donemler|ptf|smf|pozitif|negatif|2000|TGT-/.test(x.metin) && !x.metin.includes(SAHTE_ENV.EPIAS_USERNAME) && !x.metin.includes(ANAHTAR_1));
  ok('durum: no-store + noindex', x.r.headers.get('Cache-Control') === 'no-store' && x.r.headers.get('X-Robots-Tag') === 'noindex');
}
{
  const cagrilar = [];
  const epiasPost = async (url, govde) => { cagrilar.push({ url, govde }); const g = govde.startDate.slice(0, 10), b = govde.endDate.slice(0, 10); let l = []; for (let d = g; d <= b; d = gunEkle(d, 1)) l = l.concat(sahteGun(d)); return new Response(JSON.stringify({ items: l }), { status: 200 }); };
  const o = ortam({ env: { EPIAS_USERNAME: undefined, EPIAS_PASSWORD: undefined }, sec: { epiasPost } });
  const x = await o.gun('2026-08-08');
  ok('epiasPost enjekte: CAS girisi yok, yardimci cagrildi (url + govde nesnesi)', x.durum === 200 && o.e.sayac.giris === 0 && cagrilar.length === 1 && cagrilar[0].url === 'https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf' && cagrilar[0].govde.startDate === '2026-08-01T00:00:00+03:00');
  ok('epiasPost enjekte: KV\'de bilet yok', !o.kv.depo.has('piyasa:v1:tgt'));
  const o2 = ortam({ env: { EPIAS_USERNAME: undefined }, sec: { epiasPost: async () => new Response('x', { status: 401 }) } });
  await o2.gun('2026-08-08'); await o2.gun('2026-09-08');
  ok('epiasPost 401 -> servis-yetki engeli (dongu yok)', !!o2.kv.depo.get('piyasa:v1:engel') && JSON.parse(o2.kv.depo.get('piyasa:v1:engel')).kayit.deger.neden === 'servis-yetki');
  const o3 = ortam({ env: { EPIAS_USERNAME: undefined, EPIAS_PASSWORD: undefined, ORTAK_KULLANICI: SAHTE_ENV.EPIAS_USERNAME, ORTAK_PAROLA: SAHTE_ENV.EPIAS_PASSWORD }, sec: { kullaniciDegiskeni: 'ORTAK_KULLANICI', parolaDegiskeni: 'ORTAK_PAROLA' } });
  ok('kullaniciDegiskeni/parolaDegiskeni ile farkli env adlari', (await o3.gun('2026-08-08')).durum === 200 && new URLSearchParams(o3.e.istekler[0].body).get('username') === SAHTE_ENV.EPIAS_USERNAME);
}
{
  const o = ortam({ sec: { fetch: () => { throw new Error('senkron'); } } });
  const x = await o.gun('2026-08-08');
  ok('fetch senkron firlatsa da yanit (503)', x.durum === 503);
  const o2 = ortam();
  const r = await piyasaIstegi(new Request('https://h.ornek.invalid/piyasa/v1/dengesizlik?tarih=' + DUN, { headers: { Authorization: 'Bearer ' + ANAHTAR_1 } }), o2.env, { waitUntil() { throw new Error('ctx'); } }, o2.sec);
  ok('bozuk ctx.waitUntil veriyi engellemez', r.status === 200);
  const o3 = ortam({ cacheNesnesi: { match: async () => { throw new Error('c'); }, put: async () => { throw new Error('c'); } } });
  ok('bozuk Cache API veriyi engellemez', (await o3.gun(DUN)).durum === 200);
  let atti = false;
  try { await piyasaZamanli(null, { PIYASA_ETKIN: '1', PIYASA_KV: { get: () => { throw new Error('x'); } } }, null, {}); } catch (e) { atti = true; }
  ok('piyasaZamanli asla firlatmaz', !atti);
  ok('piyasaIstegi bozuk istekte null/yanit, firlatmaz', (await piyasaIstegi({ url: 5 }, {}, null)) === null);
}

// ============================================================================
// 14 — GÜNLÜK KV YAZMA/OKUMA VE EPİAŞ İSTEK TAHMİNİ (24 saat benzetimi)
// ============================================================================
{
  // Gerçekçi yayın: SMF ve dengesizlik fiyatı dönemden ~4 saat sonra (DUY m.68(1)(e)); bugünün PTF'si önceden yayımlı.
  const yayimli = (g, an) => { const bas = Date.parse(`${g}T00:00:00+03:00`); return Math.max(0, Math.min(24, Math.floor((an - bas) / SA) - 4)); };
  let e0 = null;
  const o = ortam({ an: istAn('2026-11-24', 0, 0) });
  o.e.ayar.gun = (g) => sahteGun(g, yayimli(g, o.e.an));
  // Önce ilk gece (doldurma) — sonra kararlı bir gün ölçülür.
  while (o.e.an < istAn('2026-11-25', 0, 0)) { await o.cron(); o.e.ilerlet(10 * DK); }
  const ilkGunYazma = o.kv.yazim, ilkGunRapor = o.e.sayac.rapor, ilkGunGiris = o.e.sayac.giris;
  while (o.e.an < istAn('2026-11-26', 0, 0)) { await o.cron(); o.e.ilerlet(10 * DK); }
  const ikinciGunYazma = o.kv.yazim - ilkGunYazma;
  ok('ikinci gun (10 gunluk dilimle doldurmanin kalani) KV yazma < 1000', ikinciGunYazma < 1000, `-> ${ikinciGunYazma}`);
  ok('ikinci gun sonunda tum gunler KV\'de', kvGunleri(o.kv).length === 329 && kvGunleri(o.kv).at(-1) === '2026-11-25', `-> ${kvGunleri(o.kv).length}`);
  e0 = { y: o.kv.yazim, r: o.e.sayac.rapor, g: o.e.sayac.giris, ok: o.kv.okuma + o.kv.topluOkuma };
  while (o.e.an < istAn('2026-11-27', 0, 0)) {
    await o.cron();
    for (let i = 0; i < 10; i++) { o.e.ilerlet(DK); await o.aralik('2026-11-20', istanbulBugunT(o.e.an)); if (i % 2 === 0) o.yeniSurec(); }
  }
  const gunlukYazma = o.kv.yazim - e0.y, gunlukRapor = o.e.sayac.rapor - e0.r, gunlukGiris = o.e.sayac.giris - e0.g, gunlukOkuma = o.kv.okuma + o.kv.topluOkuma - e0.ok;
  ok('ilk gun (doldurma dahil) KV yazma < 1000', ilkGunYazma < 1000, `-> ${ilkGunYazma}`);
  ok('kararli gun KV yazma < 1000 (ucretsiz kota)', gunlukYazma < 1000, `-> ${gunlukYazma}`);
  ok('kararli gun EPİAŞ istegi ~144 + gece denetimi', gunlukRapor >= 144 && gunlukRapor <= 144 + 12, `-> ${gunlukRapor}`);
  gercekLog(`  bilgi: ilk gun KV yazma ${ilkGunYazma}, rapor ${ilkGunRapor}, giris ${ilkGunGiris}; ikinci gun KV yazma ${ikinciGunYazma}`);
  gercekLog(`  bilgi: kararli gun KV yazma ${gunlukYazma}, rapor ${gunlukRapor}, giris ${gunlukGiris}, KV okuma ${gunlukOkuma} (dakikada 1 ziyaretci istegi, isteklerin yarisi soguk surec)`);
}
function istanbulBugunT(ms) { return new Date(ms + 3 * SA).toISOString().slice(0, 10); }

// ============================================================================
// 15 — MEVCUT UÇLAR DEĞİŞMEZ (ornek-host.js, kanca satırlarıyla)
// ============================================================================
{
  const gercekFetch = globalThis.fetch;
  const sahte = sahteEpias({ an: Date.now() });
  globalThis.fetch = sahte.fetch;
  try {
    const ozetle = async (r) => ({ status: r.status, statusText: r.statusText, headers: [...r.headers].sort().map((x) => x.join(': ')), body: Buffer.from(await r.arrayBuffer()).toString('base64') });
    const temel = { ORNEK_SABIT_AN: '2026-11-24T11:30:00Z' };
    const kv = sahteKv({ toplu: true });
    const ortamlar = {
      'kapali (PIYASA_ETKIN yok)': { ...temel },
      'kapali (PIYASA_ETKIN=0)': { ...temel, PIYASA_ETKIN: '0' },
      'acik (KV + belirtec + kimlik)': { ...temel, ...SAHTE_ENV, PIYASA_ETKIN: '1', PIYASA_OKUMA_ANAHTARI: ANAHTAR_1, PIYASA_KV: kv },
    };
    const istekler = [
      ['GET', '/health', {}], ['GET', '/ptf/today', { Origin: 'https://voltage.com.tr' }], ['GET', '/ptf/today', { Origin: 'https://kotu.ornek' }], ['GET', '/ptf/today', {}],
      ['GET', '/ptf/stats', { Origin: 'https://voltage.com.tr' }], ['GET', '/ptf/range?from=2026-11-01&to=2026-11-03', {}], ['GET', '/ptf/range?from=x', {}],
      ['GET', '/yok', {}], ['GET', '/piyasax', {}], ['GET', '/api/piyasa/v1/dengesizlik', {}], ['GET', '/ptf/today?piyasa=1', {}],
      ['OPTIONS', '/ptf/today', { Origin: 'https://voltage.com.tr', 'Access-Control-Request-Method': 'GET' }], ['POST', '/ptf/today', {}, 'govde'], ['HEAD', '/health', {}],
      ['GET', '/ptf/stats', { Authorization: 'Bearer ' + ANAHTAR_1 }],
    ];
    const yap = (m, y, h, b) => new Request('https://epias-proxy.ornek.invalid' + y, { method: m, headers: h, body: b });
    for (const [ad, env] of Object.entries(ortamlar)) {
      let ayni = true; const farklar = [];
      for (const [m, y, h, b] of istekler) {
        const t = await ozetle(await mevcutFetch(yap(m, y, h, b), temel, ctx));
        const k = await ozetle(await host.fetch(yap(m, y, h, b), env, ctx));
        if (JSON.stringify(t) !== JSON.stringify(k)) { ayni = false; farklar.push(`${m} ${y}`); }
      }
      ok(`ornek-host ${ad}: mevcut ${istekler.length} istek bayt bayt ayni (durum, basliklar, govde)`, ayni, `-> ${farklar}`);
    }
    ok('ornek-host: ust-akisa hic gidilmedi, KV\'ye dokunulmadi', sahte.sayac.giris === 0 && sahte.sayac.rapor === 0 && kv.yazim === 0 && kv.okuma === 0);
    const k1 = await host.fetch(yap('GET', '/piyasa/v1/dengesizlik?tarih=' + DUN, {}), ortamlar['kapali (PIYASA_ETKIN yok)'], ctx);
    const k2 = await host.fetch(yap('OPTIONS', '/piyasa/v1/dengesizlik', { Origin: 'https://voltage.com.tr' }), ortamlar['kapali (PIYASA_ETKIN yok)'], ctx);
    ok('ornek-host kapali: /piyasa/* 404 (OPTIONS dahil), CORS yok', k1.status === 404 && k2.status === 404 && !k1.headers.has('Access-Control-Allow-Origin'));
    const a1 = await host.fetch(yap('GET', '/piyasa/v1/dengesizlik?tarih=' + DUN, { Origin: 'https://voltage.com.tr' }), ortamlar['acik (KV + belirtec + kimlik)'], ctx);
    ok('ornek-host acik: belirtecsiz 401, CORS yok', a1.status === 401 && !a1.headers.has('Access-Control-Allow-Origin'));
    _bellekTemizle();
    const a2 = await host.fetch(yap('GET', '/piyasa/v1/dengesizlik?tarih=' + DUN, { Authorization: 'Bearer ' + ANAHTAR_1 }), ortamlar['acik (KV + belirtec + kimlik)'], ctx);
    ok('ornek-host acik: belirtecle 200 (varsayilan fetch/saat/KV ile)', a2.status === 200 && (await a2.json()).gunler[0].tarih === DUN);
    // zamanlanmış kanca: mevcut zamanlanmış görev her durumda çalışır; kapalıyken modül KV'ye dokunmaz
    const kv2 = sahteKv({ toplu: true });
    const once = mevcutZamanliSayaci.n;
    const bek = [];
    await host.scheduled({ cron: '*/10 * * * *' }, { ...temel, PIYASA_KV: kv2 }, { waitUntil: (p) => bek.push(p) });
    await Promise.all(bek);
    ok('scheduled kancasi kapali: mevcut gorev calisti, KV islemi yok', mevcutZamanliSayaci.n === once + 1 && kv2.okuma === 0 && kv2.yazim === 0);
    await host.scheduled({ cron: '*/10 * * * *' }, { ...temel, ...SAHTE_ENV, PIYASA_ETKIN: '1', PIYASA_KV: kv2 }, { waitUntil: (p) => bek.push(p) });
    await Promise.all(bek);
    ok('scheduled kancasi acik: mevcut gorev calisti + modul turu yazdi', mevcutZamanliSayaci.n === once + 2 && kv2.depo.has(KV_DURUM));
    const kaynak = readFileSync(new URL('./ornek-host.js', import.meta.url), 'utf8');
    const kanca = kaynak.split('\n').filter((l) => /piyasaIstegi|piyasaZamanli/.test(l) && !l.trim().startsWith('*'));
    ok('ornek-host: modul yalniz import + iki kanca satiri ile bagli', kanca.length === 3 && /^import \{ piyasaIstegi, piyasaZamanli \} from '\.\/piyasa\.js';$/.test(kanca[0]) && kanca[1].includes('KANCA 1') && kanca[2].includes('KANCA 2'));
  } finally { globalThis.fetch = gercekFetch; }
}

// ============================================================================
// 16 — TARAMALAR: SIFIR YOK, SIR YOK
// ============================================================================
{
  let sifir = 0, donem = 0, sayiDisi = 0;
  for (const m of govdeler) {
    if (/NaN|Infinity/.test(m)) sayiDisi++;
    let j; try { j = JSON.parse(m); } catch (e) { continue; }
    for (const g of (j && j.gunler) || []) for (const d of g.donemler) { donem++; for (const k of ['ptf', 'smf', 'pozitif', 'negatif']) if (d[k] === 0) sifir++; }
  }
  ok(`sifir taramasi: ${govdeler.length} yanit / ${donem} donemde hic 0 yok (uydurma veride 0 yok; null asla 0 olmaz)`, sifir === 0 && donem > 10000 && sayiDisi === 0, `-> ${sifir}`);
  // Gerçek 0 ise korunur (taramadan sonra)
  const o = ortam({ gun: (g) => sahteGun(g).map((r, i) => (i === 3 ? { ...r, ptf: 0 } : r)) });
  ok('EPİAŞ gercekten 0 yayimlarsa 0 korunur', (await o.gun(DUN)).j.gunler[0].donemler[3].ptf === 0);
  const yasak = [SAHTE_ENV.EPIAS_PASSWORD, SAHTE_ENV.EPIAS_USERNAME, ANAHTAR_1, ANAHTAR_2, 'duzeltilmis-parola', 'baska-parola', 'sahteBiletDegeri'];
  const tara = (metinler) => metinler.filter((t) => yasak.some((y) => t.includes(y)) || /TGT-/.test(t));
  ok('loglarda kimlik/belirtec/bilet yok', tara(loglar).length === 0, `-> ${tara(loglar).slice(0, 2)}`);
  ok('loglarda yanit govdesi yok', !loglar.some((l) => /positiveImbalance|"ptf"|"items"|donemler/.test(l)));
  ok('loglar kisa ve yalniz piyasa: oneki (neden kodu + sayi)', loglar.length > 10 && loglar.every((l) => l.startsWith('piyasa: ') && l.length < 100), `-> ${loglar.find((l) => !l.startsWith('piyasa: ') || l.length >= 100)}`);
  ok('yanit govdelerinde kimlik/belirtec/bilet yok', tara(govdeler).length === 0);
  const kvMetin = tumKvler.flatMap((k) => [...k.depo.keys(), ...k.depo.values()]);
  ok('KV anahtar ve degerlerinde kimlik/belirtec/duz bilet yok', tara(kvMetin).length === 0);
  ok('KV anahtarlari yalniz piyasa:v1: alaninda', tumKvler.every((k) => [...k.depo.keys()].every((x) => /^piyasa:v1:(gun:\d{4}-\d{2}-\d{2}|durum|tgt|engel)$/.test(x))));
  const cMetin = tumCacheler.flatMap((c) => [...c.depo.keys(), ...c.depo.values()]);
  ok('Cache API anahtar/degerlerinde kimlik/belirtec/duz bilet yok; anahtarlar .invalid', tara(cMetin).length === 0 && tumCacheler.every((c) => [...c.depo.keys()].every((x) => x.startsWith('https://piyasa-modulu.invalid/v1/'))));
}

console.error = gercekHata; console.warn = gercekUyari;
console.log(`\n${pass} gecti, ${fail} kaldi`);
process.exit(fail ? 1 : 0);
