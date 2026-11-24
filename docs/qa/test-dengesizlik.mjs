// /dengesizlik-maliyeti — saf mantık, EPİAŞ istemcisi, veri ucu ve sunucu render'ı testleri.
// Çalıştırma: node docs/qa/test-dengesizlik.mjs   (ağ gerekmez; fetch taklit edilir)
//
// !!! BU DOSYADAKİ TÜM FİYATLAR UYDURMA TEST VERİSİDİR. Gerçek piyasa değeri
// değildir, sayfada ya da herhangi bir yayında KULLANILMAZ.
import {
  KURALLAR, TAVANLAR, kuralBul, tavanBul, sayi, temiz, yonCoz, birimFiyat, ogelerCikar, donemler,
  ozet, gunSinirlari, aralikSinirlari, tarihGecerli, ymdGecerli, gunEkle, gunFarki, gunIzgarasi,
  yayimlandi, veriVar, donemEtiketi, istanbulBugun, istanbulDakika,
} from '../../functions/_lib/dengesizlik.js';
import { sahteGun, sahteEpias, sahteCache, sahteKv, SABIT_AN, SAHTE_ENV } from './dengesizlik-test-verisi.mjs';
import { gunGetir, aralikGetir, _bellekTemizle } from '../../functions/_lib/epias.js';
import { xlsxYaz, crc32, sutunHarfi } from '../../functions/_lib/xlsx.js';
import * as veriUcu from '../../functions/dengesizlik-maliyeti/veri.js';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) pass++; else { fail++; console.log(`FAIL ${n} ${extra}`); } };
const iki = (x) => (x === null || x === undefined ? String(x) : x.toFixed(2));

// ============================================================================
// M1 — SAF MANTIK
// ============================================================================

// --- sayi: sahte 0 üretmeme kuralı (canli-ptf toPrice ile aynı anlam) ---
ok('sayi null', sayi(null) === null);
ok('sayi undefined', sayi(undefined) === null);
ok('sayi bos metin', sayi('') === null);
ok('sayi bosluk', sayi('   ') === null);
ok('sayi dizi', sayi([]) === null);
ok('sayi nesne', sayi({}) === null);
ok('sayi NaN', sayi(NaN) === null);
ok('sayi Infinity', sayi(Infinity) === null);
ok('sayi true', sayi(true) === null);
ok('sayi sayi', sayi(2445.19) === 2445.19);
ok('sayi sayisal metin', sayi('1899.99') === 1899.99);
ok('sayi sifir korunur', sayi(0) === 0);
ok('sayi negatif korunur', sayi(-106) === -106);
ok('sayi TR bicimli metin uydurulmaz', sayi('2.445,19') === null);
ok('temiz kayan nokta gurultusu', temiz(3400 * 1.06) === 3604);
ok('temiz -0 -> 0', Object.is(temiz(-0), 0));

// --- yonCoz ---
for (const [g, b] of [
  ['Enerji Açığı', 'acik'], ['ENERJİ AÇIĞI', 'acik'], ['enerji açığı', 'acik'], ['Enerji Acigi', 'acik'], ['Açık', 'acik'],
  ['Energy Deficit', 'acik'], ['Enerji Fazlası', 'fazla'], ['ENERJİ FAZLASI', 'fazla'], ['enerji fazlasi', 'fazla'], ['Fazla', 'fazla'],
  ['Energy Surplus', 'fazla'], ['Dengede', 'denge'], ['DENGEDE', 'denge'], ['  dengede ', 'denge'], ['Sistem Dengede', 'denge'],
  ['Balanced', 'denge'], ['In Balance', 'denge'],
  ['', null], ['   ', null], [null, null], [undefined, null], [0, null], ['Açıklanmadı', null], ['bilinmiyor', null], ['-', null],
]) ok(`yonCoz ${JSON.stringify(g)} -> ${b}`, yonCoz(g) === b, `-> ${yonCoz(g)}`);

// --- kural tablosu ---
ok('kuralBul 2025-12-31 -> null', kuralBul('2025-12-31') === null);
ok('kuralBul 2026-01-01 V=150', kuralBul('2026-01-01')?.V === 150);
ok('kuralBul 2026-10-31 V=150', kuralBul('2026-10-31')?.V === 150);
ok('kuralBul 2026-11-01 V=100', kuralBul('2026-11-01')?.V === 100);
ok('kuralBul 2026-12-31 V=100', kuralBul('2026-12-31')?.V === 100);
ok('kuralBul 2027-01-01 -> null (dogrulanmis kural yok)', kuralBul('2027-01-01') === null);
ok('kuralBul 2027-06-15 -> null', kuralBul('2027-06-15') === null);
ok('kuralBul gecersiz -> null', kuralBul('2026-13-01') === null && kuralBul('abc') === null && kuralBul(null) === null);
ok('B = 100 iki donemde de', KURALLAR.every((k) => k.B === 100));
ok('k/l acik 0,06 / 0,03', KURALLAR.every((k) => k.k.acik === 0.06 && k.l.acik === 0.03));
ok('k/l fazla 0,03 / 0,06', KURALLAR.every((k) => k.k.fazla === 0.03 && k.l.fazla === 0.06));
ok('k/l denge 0,03 / 0,03', KURALLAR.every((k) => k.k.denge === 0.03 && k.l.denge === 0.03));
ok('kural araliklari bitisik (bosluk/cakisma yok)', gunEkle(KURALLAR[0].bit, 1) === KURALLAR[1].bas);
ok('her kuralin kaynak atfi var', KURALLAR.every((k) => k.kaynak.formul && k.kaynak.katsayi && k.kaynak.V && k.kaynak.B));
ok('tavan 2026-04-03 -> yok (dogrulanmadi)', tavanBul('2026-04-03') === null && kuralBul('2026-04-03').AFL === null);
ok('tavan 2026-04-04 -> 4500 / 0', kuralBul('2026-04-04').AFL === 4500 && kuralBul('2026-04-04').asgari === 0);
ok('tavan kaynagi 14459', /14459/.test(TAVANLAR[0].kaynak));
ok('kural tablosu donuk (degistirilemez)', Object.isFrozen(KURALLAR) && Object.isFrozen(KURALLAR[0]) && Object.isFrozen(KURALLAR[0].k));

// --- birimFiyat: föydeki altı test örneği (UYDURMA girdiler) ---
const K = kuralBul('2026-11-23');
const bf = (ptf, smf, yon, kural = K) => birimFiyat({ ptf, smfN: smf, smfP: smf, yon }, kural);
let r = bf(2800, 3400, 'acik');
ok('A acik 2800/3400 neg 3604,00', iki(r.negatif) === '3604.00', `-> ${iki(r.negatif)}`);
ok('A poz 2716,00', iki(r.pozitif) === '2716.00', `-> ${iki(r.pozitif)}`);
ok('A dallar genel/genel', r.dalNegatif === 'genel' && r.dalPozitif === 'genel');
ok('A katsayilar k=0,06 l=0,03', r.k === 0.06 && r.l === 0.03);
r = bf(450, 60, 'fazla');
ok('B fazla 450/60 neg 463,50', iki(r.negatif) === '463.50', `-> ${iki(r.negatif)}`);
ok('B poz -106,00 (esik alti: katilimci oder)', iki(r.pozitif) === '-106.00', `-> ${iki(r.pozitif)}`);
ok('B dal esikAlti', r.dalPozitif === 'esikAlti' && r.dalNegatif === 'genel');
r = bf(2000, 1200, 'fazla');
ok('C fazla 2000/1200 neg 2060,00', iki(r.negatif) === '2060.00');
ok('C poz 1128,00', iki(r.pozitif) === '1128.00');
r = bf(450, 100, 'fazla');
ok('D sinir fazla 450/100 neg 463,50', iki(r.negatif) === '463.50');
ok('D poz 94,00 (min = V -> genel dal, kesin "<")', iki(r.pozitif) === '94.00' && r.dalPozitif === 'genel', `-> ${iki(r.pozitif)} ${r.dalPozitif}`);
r = bf(4500, 4500, 'acik');
ok('E tavan acik 4500/4500 neg 5008,50', iki(r.negatif) === '5008.50', `-> ${iki(r.negatif)}`);
ok('E poz 4365,00', iki(r.pozitif) === '4365.00');
ok('E dal tavan', r.dalNegatif === 'tavan' && r.dalPozitif === 'genel');
r = bf(2000, 2000, 'denge');
ok('F denge 2000/2000 neg 2060,00', iki(r.negatif) === '2060.00');
ok('F poz 1940,00', iki(r.pozitif) === '1940.00');

// --- birimFiyat: sınırlar ve eksik girdi ---
ok('esigin hemen alti (99,99) esikAlti', bf(450, 99.99, 'fazla').dalPozitif === 'esikAlti');
ok('PTF esik altinda da esikAlti (min PTF)', bf(80, 300, 'acik').dalPozitif === 'esikAlti' && iki(bf(80, 300, 'acik').pozitif) === '-103.00');
ok('V tabani: PTF ve SMF V altinda -> neg = V x (1+k)', iki(bf(40, 20, 'fazla').negatif) === '103.00');
ok('tavan yalniz PTF tavandayken de', bf(4500, 3000, 'fazla').dalNegatif === 'tavan' && iki(bf(4500, 3000, 'fazla').negatif) === '4866.75');
ok('tavanin hemen alti genel dal', bf(4499.99, 4000, 'acik').dalNegatif === 'genel');
ok('sifir fiyat gecerli girdi', bf(0, 0, 'denge') !== null && iki(bf(0, 0, 'denge').negatif) === '103.00');
ok('sayisal metin kabul', iki(birimFiyat({ ptf: '2800', smfN: '3400', smfP: '3400', yon: 'acik' }, K).negatif) === '3604.00');
ok('SMF_N / SMF_P ayri (15 dk hazirligi)', (() => { const x = birimFiyat({ ptf: 2000, smfN: 2600, smfP: 1500, yon: 'acik' }, K); return iki(x.negatif) === '2756.00' && iki(x.pozitif) === '1455.00'; })());
for (const [ad, g] of [
  ['ptf null', { ptf: null, smfN: 1, smfP: 1, yon: 'acik' }], ['smfN bos', { ptf: 1, smfN: '', smfP: 1, yon: 'acik' }],
  ['smfP dizi', { ptf: 1, smfN: 1, smfP: [], yon: 'acik' }], ['yon null', { ptf: 1, smfN: 1, smfP: 1, yon: null }],
  ['yon taninmiyor', { ptf: 1, smfN: 1, smfP: 1, yon: 'yukari' }], ['tavan ustu', { ptf: 4500.01, smfN: 1, smfP: 1, yon: 'acik' }],
  ['negatif fiyat (asgari 0)', { ptf: -1, smfN: 1, smfP: 1, yon: 'acik' }],
]) ok(`birimFiyat ${ad} -> null`, birimFiyat(g, K) === null);
ok('birimFiyat kural yok -> null', birimFiyat({ ptf: 1, smfN: 1, smfP: 1, yon: 'acik' }, null) === null);
ok('birimFiyat 2027 kurali yok -> null', birimFiyat({ ptf: 2000, smfN: 2000, smfP: 2000, yon: 'denge' }, kuralBul('2027-01-01')) === null);
ok('birimFiyat girdi yok -> null', birimFiyat(null, K) === null);
// Eski dönem: V = 150, tavan doğrulanmamış
const K_OCAK = kuralBul('2026-02-10');
ok('Ocak-Ekim V=150: 120 esik alti', bf(450, 120, 'fazla', K_OCAK).dalPozitif === 'esikAlti' && bf(450, 120, 'fazla').dalPozitif === 'genel');
ok('4/4/2026 oncesi tavan dali YOK', bf(4500, 4500, 'acik', K_OCAK).dalNegatif === 'genel' && iki(bf(4500, 4500, 'acik', K_OCAK).negatif) === '4770.00');
ok('4/4/2026 oncesi ust sinir denetimi yok', bf(5000, 100, 'acik', K_OCAK) !== null);

// --- tarih yardımcıları ---
ok('ymdGecerli gercek gun', ymdGecerli('2026-02-28') && !ymdGecerli('2026-02-30') && !ymdGecerli('2026-2-3') && !ymdGecerli('20260203') && !ymdGecerli(20260203));
ok('gunEkle ay sonu', gunEkle('2026-10-31', 1) === '2026-11-01' && gunEkle('2026-03-01', -1) === '2026-02-28');
ok('gunFarki', gunFarki('2026-11-01', '2026-11-24') === 23 && gunFarki('2026-11-24', '2026-11-24') === 0);
ok('tarihGecerli alt sinir', tarihGecerli('2026-01-01', '2026-11-24') && !tarihGecerli('2025-12-31', '2026-11-24'));
ok('tarihGecerli bugun dahil, yarin haric', tarihGecerli('2026-11-24', '2026-11-24') && !tarihGecerli('2026-11-25', '2026-11-24'));
ok('tarihGecerli bozuk girdi', !tarihGecerli('abc', '2026-11-24') && !tarihGecerli('', '2026-11-24') && !tarihGecerli(null, '2026-11-24') && !tarihGecerli('2026-02-30', '2026-11-24'));
ok('istanbulBugun UTC 21:30 -> ertesi gun', istanbulBugun(Date.UTC(2026, 10, 23, 21, 30)) === '2026-11-24');
ok('istanbulBugun UTC 20:59 -> ayni gun', istanbulBugun(Date.UTC(2026, 10, 23, 20, 59)) === '2026-11-23');
ok('istanbulDakika', istanbulDakika(Date.UTC(2026, 10, 23, 21, 30)) === 30 && istanbulDakika(Date.UTC(2026, 10, 23, 11, 5)) === 14 * 60 + 5);
const gs = gunSinirlari('2026-11-23');
ok('gunSinirlari ISO +03:00', gs.startDate === '2026-11-23T00:00:00+03:00' && gs.endDate === '2026-11-23T23:00:00+03:00');
ok('aralikSinirlari', aralikSinirlari('2026-11-01', '2026-11-23').endDate === '2026-11-23T23:00:00+03:00');

// --- ogelerCikar: zarf biçimleri (gerçek zarf DOĞRULANMADI; hepsi kabul) ---
const K1 = [{ date: '2026-11-23T00:00:00+03:00', time: '00:00', ptf: 1 }];
ok('zarf body.content', ogelerCikar({ body: { content: K1 } }) === K1);
ok('zarf body.items', ogelerCikar({ body: { items: K1 } }) === K1);
ok('zarf items', ogelerCikar({ items: K1, page: null }) === K1);
ok('zarf content', ogelerCikar({ content: K1 }) === K1);
ok('zarf ciplak dizi', ogelerCikar(K1) === K1);
ok('zarf body dizi', ogelerCikar({ body: K1 }) === K1);
ok('zarf bos liste [] kalir', Array.isArray(ogelerCikar({ items: [] })) && ogelerCikar({ items: [] }).length === 0);
ok('zarf taninmiyor -> null', ogelerCikar({ data: K1 }) === null && ogelerCikar(null) === null && ogelerCikar('x') === null && ogelerCikar({ body: 'x' }) === null);

// --- donemler: normalleştirme ---
let d = donemler(sahteGun('2026-11-23'));
ok('donemler 24 donem', d.length === 24);
ok('donemler sirali', d.every((x, i) => i === 0 || d[i - 1].bas < x.bas));
ok('donemler bas ISO +03:00', d[0].bas === '2026-11-23T00:00:00+03:00' && d[23].bas === '2026-11-23T23:00:00+03:00');
ok('donemler dk = 60', d.every((x) => x.dk === 60));
ok('donemler alanlar', d[0].ptf === 2000 && d[0].smf === 2300 && d[0].yon === 'acik' && iki(d[0].negatif) === '2438.00' && iki(d[0].pozitif) === '1940.00');
ok('maliyetNegatif = negatif - PTF', iki(d[0].maliyetNegatif) === '438.00');
ok('maliyetPozitif = PTF - pozitif', iki(d[0].maliyetPozitif) === '60.00');
ok('donemEtiketi', donemEtiketi(d[0]) === '00:00–01:00' && donemEtiketi(d[23]) === '23:00–24:00');

// kısmi gün: yayımlanmamış dönemler null kalır (0 değil, taşıma yok)
d = donemler(sahteGun('2026-11-24', 14));
ok('kismi gun 24 donem doner', d.length === 24);
ok('kismi gun yayimlanan 14', d.filter(yayimlandi).length === 14);
ok('yayimlanmamis SMF null', d[14].smf === null && d[23].smf === null);
ok('yayimlanmamis fiyat null (0 DEGIL)', d[14].pozitif === null && d[14].negatif === null);
ok('yayimlanmamis yon null', d[14].yon === null);
ok('yayimlanmamis maliyet null', d[14].maliyetNegatif === null && d[14].maliyetPozitif === null);
ok('yayimlanmamis PTF korunur', d[14].ptf === 2140);
ok('tasima yok: 15. donem 14.yu kopyalamaz', d[14].smf !== d[13].smf);

// boş/bozuk değer biçimleri
d = donemler([
  { date: '2026-11-23T00:00:00+03:00', time: '00:00', ptf: '', smf: [], positiveImbalance: undefined, negativeImbalance: '  ', systemStatus: null },
  { date: '2026-11-23T01:00:00+03:00', time: '01:00', ptf: '1500.5', smf: 0, positiveImbalance: -106, negativeImbalance: 1545.52, systemStatus: 'ENERJİ FAZLASI' },
]);
ok('bos alanlar null', d[0].ptf === null && d[0].smf === null && d[0].pozitif === null && d[0].negatif === null && d[0].yon === null);
ok('sayisal metin ve gercek 0 korunur', d[1].ptf === 1500.5 && d[1].smf === 0);
ok('negatif pozitif-fiyat korunur', d[1].pozitif === -106 && iki(d[1].maliyetPozitif) === '1606.50');
ok('tek islenen varsa maliyet null', donemler([{ date: '2026-11-23T00:00:00+03:00', ptf: null, positiveImbalance: 10, negativeImbalance: 20 }])[0].maliyetNegatif === null);

// tekilleştirme: EPİAŞ bir günün her saatini iki kez döndürmüştü
const cift = [...sahteGun('2026-11-01'), ...sahteGun('2026-11-01')];
d = donemler(cift);
ok('kopya satirlar tekillesir (48 -> 24)', d.length === 24, `-> ${d.length}`);
ok('tekillesmede deger bozulmaz', d[5].ptf === 2050 && d.every((x) => x.dk === 60));
d = donemler([
  { date: '2026-11-23T05:00:00+03:00', time: '05:00', ptf: 2100, smf: null, systemStatus: '' },
  { date: '2026-11-23T05:00:00+03:00', time: '05:00', ptf: 2100, smf: 2500, positiveImbalance: 2037, negativeImbalance: 2650, systemStatus: 'Enerji Açığı' },
]);
ok('kopyada bos alan dolu kopyadan tamamlanir', d.length === 1 && d[0].smf === 2500 && d[0].yon === 'acik' && d[0].negatif === 2650);
ok('kopyada ilk dolu deger kalir', donemler([{ date: '2026-11-23T05:00:00+03:00', ptf: 1 }, { date: '2026-11-23T05:00:00+03:00', ptf: 2 }])[0].ptf === 1);

// sırasız girdi, farklı zaman alanı biçimleri
d = donemler([
  { date: '2026-11-23T00:00:00+03:00', time: '02:00', ptf: 3 },
  { date: '2026-11-23T00:00:00+03:00', time: '00:00', ptf: 1 },
  { date: '2026-11-23T00:00:00+03:00', time: '2026-11-23T01:00:00+03:00', ptf: 2 },
]);
ok('gun date alanindan, saat time alanindan', d.map((x) => x.bas.slice(11, 16)).join() === '00:00,01:00,02:00' && d.map((x) => x.ptf).join() === '1,2,3');
d = donemler([{ date: '2026-11-23T10:00:00Z', ptf: 7 }]);
ok('UTC ofsetli tarih Istanbul saatine cevrilir', d[0].bas === '2026-11-23T13:00:00+03:00');
d = donemler([{ date: '2026-11-23T22:30:00Z', ptf: 7 }]);
ok('UTC gece yarisi asimi dogru gune duser', d[0].bas === '2026-11-24T01:30:00+03:00');
d = donemler([{ date: '2026-11-23', hour: '07:00', ptf: 7 }]);
ok('hour alani da kabul', d[0].bas === '2026-11-23T07:00:00+03:00');
ok('tarihsiz/bozuk kalem atlanir', donemler([{ ptf: 1 }, null, 'x', { date: 'dun', ptf: 2 }, { date: '2026-02-30T00:00:00+03:00', ptf: 3 }]).length === 0);
ok('dizi degilse bos', donemler(null).length === 0 && donemler({}).length === 0);

// 15 dakikalık seri: 96 dönem aynı koddan geçer
d = donemler(sahteGun('2026-11-23', 96, 15));
ok('96 donem (15 dk)', d.length === 96);
ok('15 dk: dk = 15', d.every((x) => x.dk === 15));
ok('15 dk etiket', donemEtiketi(d[1]) === '00:15–00:30' && donemEtiketi(d[95]) === '23:45–24:00');
ok('15 dk ozet 96/96', ozet(d).toplam === 96 && ozet(d).yayimlanan === 96);
ok('15 dk izgara 96', gunIzgarasi('2026-11-23', d).length === 96);
ok('iki gun karisik cozunurluk gun bazinda', (() => { const x = donemler([...sahteGun('2026-11-22'), ...sahteGun('2026-11-23', 96, 15)]); return x.length === 120 && x[0].dk === 60 && x[119].dk === 15; })());
ok('tek kalem -> dk varsayilan 60', donemler([{ date: '2026-11-23T05:00:00+03:00', ptf: 1 }])[0].dk === 60);
ok('seyrek satirlar (3 saat ara) -> dk 60', donemler([{ date: '2026-11-23T00:00:00+03:00', ptf: 1 }, { date: '2026-11-23T03:00:00+03:00', ptf: 1 }])[0].dk === 60);

// --- gunIzgarasi: eksik satır "—" olarak eklenir, değer üretilmez ---
const seyrek = donemler(sahteGun('2026-11-23').filter((_, i) => i !== 3 && i !== 20));
const iz = gunIzgarasi('2026-11-23', seyrek);
ok('izgara 24 satira tamamlar', iz.length === 24);
ok('izgarada eklenen satir tumu null', iz[3].ptf === null && iz[3].smf === null && iz[3].pozitif === null && iz[3].negatif === null && iz[3].yon === null && iz[3].maliyetNegatif === null);
ok('izgara gercek satirlari degistirmez', iz[4].ptf === 2040 && iz[4] === seyrek[3]);
ok('izgara baska gunu disarida birakir', gunIzgarasi('2026-11-23', donemler([...sahteGun('2026-11-22'), ...sahteGun('2026-11-23')])).length === 24);
ok('izgara veri yoksa bos', gunIzgarasi('2026-11-23', []).length === 0 && gunIzgarasi('2026-11-23', donemler(sahteGun('2026-11-22'))).length === 0);
ok('veriVar', veriVar(donemler(sahteGun('2026-11-23', 0))) && !veriVar([]) && !veriVar(donemler([{ date: '2026-11-23T00:00:00+03:00', ptf: '' }])));

// --- ozet: yalnız yayımlanmış dönemler ---
let o = ozet(donemler(sahteGun('2026-11-24', 3)));
ok('ozet sayilar 3/24', o.toplam === 24 && o.yayimlanan === 3);
ok('ozet PTF ortalamasi YALNIZ yayimlanan donemler', iki(o.ptfOrt) === '2010.00', `-> ${iki(o.ptfOrt)}`);
ok('ozet SMF ortalamasi', iki(o.smfOrt) === ((2300 + 1610 + 2020) / 3).toFixed(2), `-> ${iki(o.smfOrt)}`);
ok('ozet maliyet ortalamalari', iki(o.maliyetNegatifOrt) === ((438 + 60.3 + 60.6) / 3).toFixed(2) && iki(o.maliyetPozitifOrt) === ((60 + 496.6 + 60.6) / 3).toFixed(2), `-> ${iki(o.maliyetNegatifOrt)} ${iki(o.maliyetPozitifOrt)}`);
ok('ozet yon sayilari', o.yon.acik === 1 && o.yon.fazla === 1 && o.yon.denge === 1);
o = ozet(donemler(sahteGun('2026-11-24', 0)));
ok('ozet hic yayim yoksa ortalamalar null (0 DEGIL)', o.yayimlanan === 0 && o.ptfOrt === null && o.smfOrt === null && o.maliyetNegatifOrt === null && o.maliyetPozitifOrt === null);
o = ozet([]);
ok('ozet bos', o.toplam === 0 && o.yayimlanan === 0 && o.ptfOrt === null);
ok('ozet dizi degil', ozet(null).toplam === 0);


// ============================================================================
// M2 — EPİAŞ İSTEMCİSİ (sahte fetch; ağ yok)
// ============================================================================
// Loglar yakalanır: hem gürültü olmasın hem de sır sızmadığı doğrulansın.
const loglar = [];
const gercekHata = console.error;
console.error = (...a) => { loglar.push(a.map(String).join(' ')); };

const BUGUN = '2026-11-24';   // SABIT_AN'ın İstanbul günü
const DUN = '2026-11-23';
/** Her senaryo temiz süreç belleğiyle başlar. */
const bosalt = () => new Promise((r) => setTimeout(r, 5));
const yeni = (ayar = {}) => { _bellekTemizle(); const e = sahteEpias(ayar); return { e, sec: { fetch: e.fetch, simdi: e.simdi, cache: ayar.cache === undefined ? null : ayar.cache, zamanAsimiMs: ayar.zamanAsimiMs } }; };

{ // kimlik yok
  const { e, sec } = yeni();
  for (const env of [{}, null, undefined, { EPIAS_USERNAME: 'x' }, { EPIAS_PASSWORD: 'y' }, { EPIAS_USERNAME: '', EPIAS_PASSWORD: '' }]) {
    const x = await gunGetir(env, null, DUN, sec);
    ok(`kimlik yok (${JSON.stringify(env)}) -> yok/kimlik-yok`, x.durum === 'yok' && x.neden === 'kimlik-yok' && x.donemler.length === 0);
  }
  ok('kimlik yokken EPİAŞ\'a HIC istek atilmaz', e.sayac.giris === 0 && e.sayac.rapor === 0);
}
{ // mutlu yol + istek biçimi
  const { e, sec } = yeni();
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('mutlu yol veri', x.durum === 'veri' && x.tarih === DUN && x.donemler.length === 24);
  ok('mutlu yol cekildi ISO +03:00', x.cekildi === '2026-11-24T14:30:00+03:00', `-> ${x.cekildi}`);
  ok('mutlu yol bayat degil', x.bayat === undefined);
  const g = e.istekler.find((i) => i.url.includes('/cas/v1/tickets'));
  ok('giris: POST + form + Accept text/plain', g.method === 'POST' && g.headers['content-type'] === 'application/x-www-form-urlencoded' && g.headers.accept === 'text/plain');
  ok('giris: username/password alanlari', new URLSearchParams(g.body).get('username') === SAHTE_ENV.EPIAS_USERNAME && new URLSearchParams(g.body).get('password') === SAHTE_ENV.EPIAS_PASSWORD);
  const rp = e.istekler.find((i) => i.url.includes('ptf-smf-sdf'));
  ok('rapor: dogru adres', rp.url === 'https://seffaflik.epias.com.tr/reporting-service/v1/data/ptf-smf-sdf' && rp.method === 'POST');
  ok('rapor: TGT basligi', /^TGT-/.test(rp.headers.tgt));
  ok('rapor: JSON govde startDate/endDate', JSON.parse(rp.body).startDate === `${DUN}T00:00:00+03:00` && JSON.parse(rp.body).endDate === `${DUN}T23:00:00+03:00`);
}
{ // giriş 401
  const { e, sec } = yeni({ girisDurum: 401 });
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('giris 401 -> yok/giris-reddedildi', x.durum === 'yok' && x.neden === 'giris-reddedildi' && x.donemler.length === 0);
  ok('giris 401 -> rapor istegi atilmaz', e.sayac.rapor === 0);
}
{ // giriş 500 / bozuk bilet
  let { sec } = yeni({ girisDurum: 500 });
  ok('giris 500 -> giris-hata', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'giris-hata');
  ({ sec } = yeni({ girisGovde: '<html>hata</html>' }));
  ok('bilet metni bozuk -> giris-bicim', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'giris-bicim');
  ({ sec } = yeni({ girisGovde: '<form action="https://giris/cas/v1/tickets/TGT-123456-abcdefghij-cas01">' }));
  ok('HTML icindeki bilet de ayiklanir', (await gunGetir(SAHTE_ENV, null, DUN, sec)).durum === 'veri');
}
{ // servis 500
  const { sec } = yeni({ raporDurum: 500 });
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('servis 500 -> yok/servis-hata', x.durum === 'yok' && x.neden === 'servis-hata');
}
{ // zaman aşımı (fetch hiç dönmez; sinyali de yok sayar)
  let { sec } = yeni({ raporAsili: true, zamanAsimiMs: 40 });
  let t0 = Date.now();
  let x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('rapor zaman asimi -> yok/zaman-asimi', x.durum === 'yok' && x.neden === 'zaman-asimi', `-> ${x.neden}`);
  ok('zaman asimi sureye uyar', Date.now() - t0 < 1500);
  ({ sec } = yeni({ girisAsili: true, zamanAsimiMs: 40 }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('giris zaman asimi -> giris-zaman-asimi', x.durum === 'yok' && x.neden === 'giris-zaman-asimi');
  ({ sec } = yeni({ govdeAsili: true, zamanAsimiMs: 40 }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('govde okuma asili kalirsa da zaman asimi', x.durum === 'yok' && x.neden === 'zaman-asimi', `-> ${x.neden}`);
}
{ // ağ hatası, bozuk JSON, tanınmayan zarf
  let { sec } = yeni({ raporFirlat: true });
  ok('ag hatasi -> yok/ag', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'ag');
  ({ sec } = yeni({ raporGovde: 'bu json degil' }));
  ok('bozuk JSON -> bicim', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'bicim');
  ({ sec } = yeni({ raporGovde: JSON.stringify({ sonuc: [] }) }));
  ok('taninmayan zarf -> bicim', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'bicim');
}
{ // boş liste / tümü boş
  let { sec } = yeni({ gun: () => [] });
  let x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('bos liste -> yok/bos (uydurma satir yok)', x.durum === 'yok' && x.neden === 'bos' && x.donemler.length === 0);
  ({ sec } = yeni({ gun: (g) => sahteGun(g).map((o) => ({ date: o.date, time: o.time, ptf: null, smf: '', systemStatus: '' })) }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('tum alanlari bos satirlar -> yok/bos', x.durum === 'yok' && x.neden === 'bos');
  ({ sec } = yeni({ gun: () => sahteGun('2026-11-10') }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('baska gunun satirlari istenen gune SAYILMAZ', x.durum === 'yok' && x.neden === 'bos');
}
{ // kısmi gün
  const { sec } = yeni({ gun: (g) => sahteGun(g, 14) });
  const x = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('kismi gun veri', x.durum === 'veri' && x.donemler.length === 24);
  ok('kismi gun 14 yayim', x.donemler.filter(yayimlandi).length === 14);
  ok('kismi gun kalan null', x.donemler.slice(14).every((d) => d.smf === null && d.pozitif === null && d.negatif === null && d.maliyetNegatif === null && d.ptf !== null));
}
{ // EPİAŞ yalnız yayımlanmış satırları döndürürse ızgara tamamlanır
  const { sec } = yeni({ gun: (g) => sahteGun(g, 24).slice(0, 9) });
  const x = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('eksik satirlar null izgarayla tamamlanir', x.donemler.length === 24 && x.donemler[9].ptf === null && x.donemler[23].negatif === null);
}
{ // kopya satırlar
  const { sec } = yeni({ gun: (g) => [...sahteGun(g), ...sahteGun(g)] });
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('kopya satirlar tekillesir', x.durum === 'veri' && x.donemler.length === 24);
}
for (const zarf of ['body.content', 'body.items', 'items', 'content', 'dizi', 'body']) {
  const { sec } = yeni({ zarf });
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok(`zarf ${zarf} uctan uca`, x.durum === 'veri' && x.donemler.length === 24 && x.donemler[0].ptf === 2000);
}
{ // 15 dakikalık seri uçtan uca
  const { sec } = yeni({ gun: (g) => sahteGun(g, 96, 15) });
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('96 donem uctan uca', x.donemler.length === 96 && x.donemler[0].dk === 15);
}
{ // tarih doğrulama
  const { e, sec } = yeni();
  for (const t of ['2026-11-25', '2025-12-31', 'abc', '', null, undefined, '2026-02-30', 20261123]) {
    const x = await gunGetir(SAHTE_ENV, null, t, sec);
    ok(`gecersiz tarih ${JSON.stringify(t)} -> yok/gecersiz-tarih`, x.durum === 'yok' && x.neden === 'gecersiz-tarih');
  }
  ok('gecersiz tarihte istek atilmaz', e.sayac.giris === 0);
}
{ // asla fırlatmaz
  _bellekTemizle();
  const patlak = { fetch: () => { throw new Error('senkron patlama'); }, simdi: () => SABIT_AN, cache: null };
  let x = await gunGetir(SAHTE_ENV, null, DUN, patlak);
  ok('fetch senkron firlatirsa bile donus yapar', x.durum === 'yok');
  _bellekTemizle();
  x = await gunGetir(SAHTE_ENV, { waitUntil() { throw new Error('ctx bozuk'); } }, DUN, { ...yeni().sec });
  ok('bozuk ctx.waitUntil veriyi engellemez', x.durum === 'veri');
  _bellekTemizle();
  const kotuCache = { match: async () => { throw new Error('cache yok'); }, put: async () => { throw new Error('cache yok'); } };
  x = await gunGetir(SAHTE_ENV, null, DUN, { ...yeni().sec, cache: kotuCache });
  ok('bozuk Cache API veriyi engellemez', x.durum === 'veri');
  _bellekTemizle();
  x = await gunGetir({ ...SAHTE_ENV, PIYASA: { get: async () => { throw new Error('kv'); }, put: async () => { throw new Error('kv'); } } }, null, DUN, yeni().sec);
  ok('bozuk KV veriyi engellemez', x.durum === 'veri');
}
{ // önbellek: bilet ve veri
  const { e, sec } = yeni();
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('ayni gun ikinci kez: EPİAŞ\'a gidilmez', e.sayac.rapor === 1 && e.sayac.giris === 1);
  await gunGetir(SAHTE_ENV, null, '2026-11-10', sec);
  ok('baska gun: bilet onbellekten, tek rapor istegi', e.sayac.giris === 1 && e.sayac.rapor === 2);
  e.ilerlet(4 * 60 * 1000);
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('dun 4 dk sonra hala taze', e.sayac.rapor === 2);
  e.ilerlet(2 * 60 * 1000);
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('dun 6 dk sonra yenilenir (kisa TTL)', e.sayac.rapor === 3);
  await gunGetir(SAHTE_ENV, null, '2026-11-10', sec);
  ok('eski gun 6 dk sonra hala taze (uzun TTL)', e.sayac.rapor === 3);
  e.ilerlet(6 * 60 * 60 * 1000);
  await gunGetir(SAHTE_ENV, null, '2026-11-10', sec);
  ok('eski gun 6 saat sonra yenilenir', e.sayac.rapor === 4);
  ok('bilet 100 dk sonra yenilenir', e.sayac.giris === 2, `-> ${e.sayac.giris}`);
}
{ // eşzamanlı istekler tek çekime iner
  const { e, sec } = yeni();
  const [a, b, c] = await Promise.all([gunGetir(SAHTE_ENV, null, DUN, sec), gunGetir(SAHTE_ENV, null, DUN, sec), gunGetir(SAHTE_ENV, null, DUN, sec)]);
  ok('eszamanli 3 istek -> 1 rapor istegi', e.sayac.rapor === 1 && a.durum === 'veri' && b.durum === 'veri' && c.durum === 'veri');
}
{ // başarısızlık önbelleği
  const { e, sec } = yeni({ raporDurum: 500 });
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('hata 60 sn onbellekte: EPİAŞ dovulmez', e.sayac.rapor === 1);
  e.ilerlet(61 * 1000);
  e.ayar.raporDurum = 200;
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('60 sn sonra yeniden denenir ve duzelir', e.sayac.rapor === 2 && x.durum === 'veri');
}
{ // bayat: EPİAŞ düşerse daha önce alınmış gerçek veri, kendi zamanıyla
  const { e, sec } = yeni({ gun: (g) => sahteGun(g, 10) });
  const ilk = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  e.ilerlet(6 * 60 * 1000);
  e.ayar.raporDurum = 503;
  const x = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('kesintide onceki gercek veri doner (bayat)', x.durum === 'veri' && x.bayat === true && x.neden === 'servis-hata');
  ok('bayat veride cekildi ILK cekimin zamani', x.cekildi === ilk.cekildi);
  ok('bayat veri degismez', JSON.stringify(x.donemler) === JSON.stringify(ilk.donemler));
  await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('bayat sunum da 60 sn boyunca EPİAŞ\'i dovmez', e.sayac.rapor === 2);
  e.ilerlet(61 * 1000);
  e.ayar.raporDurum = 200;
  e.ayar.gun = (g) => sahteGun(g, 11);
  const y = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('servis donunce taze veri (bayat isareti kalkar)', y.durum === 'veri' && y.bayat === undefined && y.donemler.filter(yayimlandi).length === 11);
  e.ilerlet(25 * 60 * 60 * 1000);
  e.ayar.raporDurum = 503;
  const z = await gunGetir(SAHTE_ENV, null, '2026-11-24', sec);
  ok('24 saati asan kopya SUNULMAZ', z.durum === 'yok', `-> ${z.durum}`);
}
{ // bilet geçersizleşmişse bir kez yenilenir
  const { e, sec } = yeni();
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  e.ayar.biletGecersiz = e.sonBilet;
  const x = await gunGetir(SAHTE_ENV, null, '2026-11-11', sec);
  ok('rapor 401 -> bilet yenilenir, veri gelir', x.durum === 'veri' && e.sayac.giris === 2 && e.sayac.rapor === 3, `-> ${x.durum} ${e.sayac.giris} ${e.sayac.rapor}`);
  const { e: e2, sec: sec2 } = yeni({ raporDurum: 401 });
  const y = await gunGetir(SAHTE_ENV, null, DUN, sec2);
  ok('kalici 401 -> yok/servis-yetki, en cok 2 giris', y.durum === 'yok' && y.neden === 'servis-yetki' && e2.sayac.giris === 2 && e2.sayac.rapor === 2);
}
{ // Cache API ve KV katmanları (süreç belleği sıfırlanınca)
  const cache = sahteCache();
  let { e, sec } = yeni({ cache });
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  await bosalt(); // önbellek yazımı arka planda (ctx.waitUntil) yapılır
  ok('Cache API\'ye sentetik anahtarla yazilir', [...cache.depo.keys()].every((k) => k.startsWith('https://dengesizlik-onbellek.invalid/')) && cache.depo.size === 2, `-> ${[...cache.depo.keys()]}`);
  _bellekTemizle();
  const e2 = sahteEpias();
  const x = await gunGetir(SAHTE_ENV, null, DUN, { fetch: e2.fetch, simdi: e2.simdi, cache });
  ok('yeni surec: veri ve bilet Cache API\'den, EPİAŞ\'a istek yok', x.durum === 'veri' && e2.sayac.giris === 0 && e2.sayac.rapor === 0);

  const kv = sahteKv();
  ({ e, sec } = yeni());
  await gunGetir({ ...SAHTE_ENV, PIYASA: kv }, null, DUN, sec);
  await bosalt();
  ok('KV varsa oraya da yazilir', kv.depo.has('dengesizlik:gun/' + DUN) && kv.depo.has('dengesizlik:tgt'));
  ok('KV kaydi TTL ile yazilir', kv.ttl.get('dengesizlik:gun/' + DUN) === 86400 && kv.ttl.get('dengesizlik:tgt') === 6000);
  _bellekTemizle();
  const e3 = sahteEpias();
  const y = await gunGetir({ ...SAHTE_ENV, PIYASA: kv }, null, DUN, { fetch: e3.fetch, simdi: e3.simdi, cache: null });
  ok('yeni surec: KV\'den okunur, EPİAŞ\'a istek yok', y.durum === 'veri' && e3.sayac.rapor === 0 && e3.sayac.giris === 0);
  // KV yazma kotası: içerik değişmediyse yeniden yazılmaz
  ({ e, sec } = yeni());
  const kv2 = sahteKv();
  const env2 = { ...SAHTE_ENV, PIYASA: kv2 };
  await gunGetir(env2, null, BUGUN, sec);
  await bosalt();
  const ilkYazim = kv2.yazim;
  e.ilerlet(6 * 60 * 1000);
  await gunGetir(env2, null, BUGUN, sec);
  await bosalt();
  ok('icerik ayniysa KV\'ye yeniden yazilmaz', e.sayac.rapor === 2 && kv2.yazim === ilkYazim, `-> ${kv2.yazim} / ${ilkYazim}`);
  e.ilerlet(6 * 60 * 1000);
  e.ayar.gun = (g) => sahteGun(g, 5);
  await gunGetir(env2, null, BUGUN, sec);
  await bosalt();
  ok('icerik degisince KV guncellenir', kv2.yazim === ilkYazim + 1);
}

// --- aralikGetir ---
{
  let { e, sec } = yeni();
  let x = await aralikGetir(SAHTE_ENV, null, '2026-11-03', '2026-11-09', sec);
  ok('aralik 7 gun x 24 donem', x.durum === 'veri' && x.donemler.length === 7 * 24 && x.bas === '2026-11-03' && x.bit === '2026-11-09');
  ok('aralik sinirlari dahil', x.donemler[0].bas.startsWith('2026-11-03T00:00') && x.donemler.at(-1).bas.startsWith('2026-11-09T23:00'));
  ok('aralik: EPİAŞ\'a AY dilimiyle tek istek', e.sayac.rapor === 1 && JSON.parse(e.istekler.at(-1).body).startDate.startsWith('2026-11-01') && JSON.parse(e.istekler.at(-1).body).endDate.startsWith(BUGUN));
  await aralikGetir(SAHTE_ENV, null, '2026-11-10', '2026-11-20', sec);
  ok('ayni aydan baska aralik: yeni istek YOK', e.sayac.rapor === 1);
  x = await aralikGetir(SAHTE_ENV, null, '2026-10-25', '2026-11-24', sec);
  ok('iki aya yayilan 31 gun', x.durum === 'veri' && x.donemler.length === 31 * 24 && e.sayac.rapor === 2);
  ok('gecmis ay dilimi ay sonunda biter', e.istekler.some((i) => i.body && i.body.includes('2026-10-31T23:00:00+03:00')));
  x = await aralikGetir(SAHTE_ENV, null, '2026-10-24', '2026-11-24', sec);
  ok('32 gun -> yok/aralik-uzun', x.durum === 'yok' && x.neden === 'aralik-uzun');
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-09', '2026-11-03', sec);
  ok('ters aralik -> gecersiz-tarih', x.durum === 'yok' && x.neden === 'gecersiz-tarih');
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-20', '2026-11-25', sec);
  ok('yarini iceren aralik -> gecersiz-tarih', x.durum === 'yok' && x.neden === 'gecersiz-tarih');
  x = await aralikGetir({}, null, '2026-11-03', '2026-11-09', sec);
  ok('aralik kimlik yok', x.neden === 'kimlik-yok');
  ({ e, sec } = yeni({ gun: (g) => (g === '2026-11-05' ? [] : sahteGun(g)) }));
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-03', '2026-11-09', sec);
  ok('bir gunu eksik yanit -> yok/eksik (yarim dosya yok)', x.durum === 'yok' && x.neden === 'eksik');
  ({ e, sec } = yeni({ raporDurum: 500 }));
  x = await aralikGetir(SAHTE_ENV, null, '2026-10-25', '2026-11-10', sec);
  ok('aralikta servis hatasi -> yok', x.durum === 'yok' && x.neden === 'servis-hata');
  ({ e, sec } = yeni({ gun: (g) => [...sahteGun(g, g === BUGUN ? 10 : 24), ...sahteGun(g, g === BUGUN ? 10 : 24)] }));
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-22', '2026-11-24', sec);
  ok('aralikta kopya + kismi gun', x.donemler.length === 72 && x.donemler.filter(yayimlandi).length === 58);
}

// --- sır sızıntısı yok ---
ok('loglarda parola yok', !loglar.some((l) => l.includes(SAHTE_ENV.EPIAS_PASSWORD)));
ok('loglarda kullanici adi yok', !loglar.some((l) => l.includes(SAHTE_ENV.EPIAS_USERNAME)));
ok('loglarda bilet yok', !loglar.some((l) => /TGT-/.test(l)));
ok('loglarda yanit govdesi yok', !loglar.some((l) => /positiveImbalance|"ptf"/.test(l)));
ok('hata yollari loglandi (yalniz neden kodu)', loglar.length > 5 && loglar.every((l) => l.length < 120));

// ============================================================================
// M2 — XLSX YAZICI
// ============================================================================
ok('crc32 bilinen deger', crc32(new TextEncoder().encode('123456789')) === 0xcbf43926);
ok('sutunHarfi', sutunHarfi(0) === 'A' && sutunHarfi(25) === 'Z' && sutunHarfi(26) === 'AA' && sutunHarfi(701) === 'ZZ' && sutunHarfi(702) === 'AAA');
const gecici = mkdtempSync(join(tmpdir(), 'dengesizlik-test-'));
const PY_XLSX = `
import sys, json, zipfile, xml.etree.ElementTree as ET
z = zipfile.ZipFile(sys.argv[1])
bad = z.testzip()
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
names = z.namelist()
for n in names: ET.fromstring(z.read(n))
sh = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
wb = ET.fromstring(z.read('xl/workbook.xml'))
rows = []
for r in sh.find('m:sheetData', ns):
    row = []
    for c in r:
        t = c.get('t')
        if t == 'inlineStr': row.append([c.get('r'), 's', ''.join(x.text or '' for x in c.iter('{%s}t' % ns['m']))])
        else: row.append([c.get('r'), 'n', c.find('m:v', ns).text, c.get('s')])
    rows.append(row)
print(json.dumps({'bad': bad, 'names': names, 'rows': rows, 'sheet': wb.find('m:sheets', ns)[0].get('name'), 'stored': all(i.compress_type == 0 for i in z.infolist())}))
`;
const xlsxOku = (bayt) => {
  const yol = join(gecici, 'x.xlsx');
  writeFileSync(yol, bayt);
  return JSON.parse(execFileSync('python3', ['-I', '-c', PY_XLSX, yol], { encoding: 'utf8' }));
};
{
  const bayt = xlsxYaz({
    sayfaAdi: 'Test [1]: a/b*c?',
    basliklar: ['Dönem', 'PTF (TL/MWh)', 'Not & <işaret>'],
    satirlar: [['00:00', 2800.5, 'açığı "ğüşiöç" & <x>'], ['01:00', null, ''], ['02:00', -106, undefined], ['03:00', 0, 'son\u0001satır']],
    sutunlar: [{}, { ondalik: true }, {}],
  });
  ok('xlsxYaz Uint8Array', bayt instanceof Uint8Array && bayt[0] === 0x50 && bayt[1] === 0x4b);
  const x = xlsxOku(bayt);
  ok('xlsx: zipfile CRC denetimi temiz', x.bad === null);
  ok('xlsx: sikistirmasiz (stored)', x.stored === true);
  ok('xlsx: gerekli parcalar', ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml'].every((n) => x.names.includes(n)));
  ok('xlsx: sayfa adi temizlendi', x.sheet === 'Test  1   a b c', `-> ${JSON.stringify(x.sheet)}`);
  ok('xlsx: baslik satiri metin', x.rows[0].length === 3 && x.rows[0][0][1] === 's' && x.rows[0][0][2] === 'Dönem' && x.rows[0][2][2] === 'Not & <işaret>');
  ok('xlsx: sayi SAYISAL hucre', x.rows[1][1][0] === 'B2' && x.rows[1][1][1] === 'n' && x.rows[1][1][2] === '2800.5' && x.rows[1][1][3] === '2');
  ok('xlsx: Turkce ve ozel karakter korunur', x.rows[1][2][2] === 'açığı "ğüşiöç" & <x>');
  ok('xlsx: null/bos hucre YAZILMAZ (0 degil)', x.rows[2].length === 1 && x.rows[2][0][0] === 'A3');
  ok('xlsx: negatif sayi', x.rows[3][1][2] === '-106' && x.rows[3].length === 2);
  ok('xlsx: gercek 0 yazilir', x.rows[4][1][2] === '0');
  ok('xlsx: gecersiz XML karakteri atilir', x.rows[4][2][2] === 'sonsatır');
  ok('xlsx: belirlenimli cikti', Buffer.from(bayt).equals(Buffer.from(xlsxYaz({
    sayfaAdi: 'Test [1]: a/b*c?', basliklar: ['Dönem', 'PTF (TL/MWh)', 'Not & <işaret>'],
    satirlar: [['00:00', 2800.5, 'açığı "ğüşiöç" & <x>'], ['01:00', null, ''], ['02:00', -106, undefined], ['03:00', 0, 'son\u0001satır']], sutunlar: [{}, { ondalik: true }, {}],
  }))));
  ok('xlsx: bos girdi de gecerli dosya', xlsxOku(xlsxYaz({})).bad === null);
}

// ============================================================================
// M2 — VERİ UCU  GET /dengesizlik-maliyeti/veri
// ============================================================================
const ucCtx = (sorgu, ayar = {}, env = SAHTE_ENV, yontem = 'GET') => {
  const { e, sec } = yeni(ayar);
  return { e, ctx: { request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri' + sorgu, { method: yontem }), env, secenek: sec, waitUntil() {} } };
};
{ // JSON, tek gün
  const { ctx } = ucCtx('?tarih=2026-11-23');
  const r2 = await veriUcu.onRequestGet(ctx);
  const j = await r2.json();
  ok('uc JSON 200', r2.status === 200 && r2.headers.get('Content-Type') === 'application/json; charset=utf-8');
  ok('uc basliklar: noindex + CORS + nosniff', r2.headers.get('X-Robots-Tag') === 'noindex' && r2.headers.get('Access-Control-Allow-Origin') === '*' && r2.headers.get('X-Content-Type-Options') === 'nosniff');
  ok('uc Cache-Control dun 300 sn', r2.headers.get('Cache-Control') === 'public, max-age=300');
  ok('uc JSON dosya adi', r2.headers.get('Content-Disposition') === 'inline; filename="dengesizlik-maliyeti-2026-11-23.json"');
  ok('uc JSON ust alanlar', j.surum === '1' && j.tarih === '2026-11-23' && j.birim === 'TL/MWh' && j.sayfa === 'https://voltage.com.tr/dengesizlik-maliyeti' && j.bayat === false);
  ok('uc JSON kaynak EPİAŞ', j.kaynak.ad === 'EPİAŞ Şeffaflık Platformu' && j.kaynak.rapor === 'PTF, SMF ve SDF Listeleme');
  ok('uc JSON cekildi', j.cekildi === '2026-11-24T14:30:00+03:00');
  ok('uc JSON kural atfi', j.kurallar.length === 1 && j.kurallar[0].V === 100 && j.kurallar[0].AFL === 4500 && /14911/.test(j.kurallar[0].kaynak.V) && /14030/.test(j.kurallar[0].kaynak.katsayi) && /14459/.test(j.kurallar[0].kaynak.tavan));
  ok('uc JSON atif satiri', j.atif.startsWith('Dayanak: Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği') && j.atif.endsWith('24 Kasım 2026 itibarıyla.'));
  ok('uc JSON not: yayimlandigi haliyle + revize edilebilir', /yayımlandığı hâliyle/.test(j.not) && /revize edilebilir/.test(j.not) && /teklif ya da taahhüt değildir/.test(j.not));
  ok('uc JSON alan belgeleri donem alanlariyla ayni', JSON.stringify(Object.keys(j.alanlar)) === JSON.stringify(Object.keys(j.donemler[0])));
  ok('uc JSON 24 donem', j.donemler.length === 24 && j.ozet.toplam === 24 && j.ozet.yayimlanan === 24);
  ok('uc JSON donem alanlari', j.donemler[0].bas === '2026-11-23T00:00:00+03:00' && j.donemler[0].bit === '2026-11-23T01:00:00+03:00' && j.donemler[0].dk === 60 && j.donemler[0].ptf === 2000 && j.donemler[0].yon === 'acik');
  ok('uc JSON son donem bitisi ertesi gun 00:00', j.donemler[23].bit === '2026-11-24T00:00:00+03:00');
}
{ // JSON, kısmi gün (bugün; tarih parametresiz)
  const { ctx } = ucCtx('', { gun: (g) => sahteGun(g, 6) });
  const r2 = await veriUcu.onRequestGet(ctx);
  const j = await r2.json();
  ok('uc tarih verilmezse bugun (Istanbul)', j.tarih === BUGUN);
  ok('uc kismi gun: yayimlanmamis deger null (0 degil)', j.donemler[6].smf === null && j.donemler[6].pozitif === null && j.donemler[6].maliyetNegatif === null && j.donemler[6].ptf === 2060);
  ok('uc kismi gun ozet 6/24', j.ozet.yayimlanan === 6 && j.ozet.toplam === 24);
}
{ // eski tarih: uzun önbellek, eski kural (V=150), tavan yok
  const { ctx } = ucCtx('?tarih=2026-03-10');
  const r2 = await veriUcu.onRequestGet(ctx);
  const j = await r2.json();
  ok('uc eski gun Cache-Control 3600', r2.headers.get('Cache-Control') === 'public, max-age=3600');
  ok('uc eski gun kurali V=150, tavan dogrulanmadi', j.kurallar[0].V === 150 && j.kurallar[0].AFL === null && j.kurallar[0].kaynak.tavan === null);
}
{ // CSV
  const { ctx } = ucCtx('?tarih=2026-11-24&bicim=csv', { gun: (g) => sahteGun(g, 2).map((o, i) => (i === 1 ? { ...o, positiveImbalance: -106, smf: 60.5 } : o)) });
  const r2 = await veriUcu.onRequestGet(ctx);
  const bayt = new Uint8Array(await r2.arrayBuffer());
  const metin = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bayt);
  ok('uc CSV tur + dosya adi', r2.headers.get('Content-Type') === 'text/csv; charset=utf-8' && r2.headers.get('Content-Disposition') === 'attachment; filename="dengesizlik-maliyeti-2026-11-24.csv"');
  ok('uc CSV UTF-8 BOM', bayt[0] === 0xef && bayt[1] === 0xbb && bayt[2] === 0xbf);
  const sat = metin.replace(/^﻿/, '').split('\r\n');
  ok('uc CSV CRLF, 1 baslik + 24 satir', sat.length === 26 && sat[25] === '');
  ok('uc CSV Turkce baslik, ; ayirici', sat[0].split(';').length === 11 && sat[0].startsWith('Tarih;Dönem başlangıcı;Dönem bitişi;Süre (dk);PTF (TL/MWh);SMF (TL/MWh);Sistem yönü;Pozitif dengesizlik fiyatı (TL/MWh);Negatif dengesizlik fiyatı (TL/MWh);'));
  ok('uc CSV ilk satir', sat[1] === '2026-11-24;00:00;01:00;60;2000;2300;Enerji açığı;1940;2438;60;438', `-> ${sat[1]}`);
  ok('uc CSV ondalik VIRGUL, eksi isareti ASCII', sat[2] === '2026-11-24;01:00;02:00;60;2010;60,5;Enerji fazlası;-106;2070,3;2116;60,3', `-> ${sat[2]}`);
  ok('uc CSV yayimlanmamis hucre BOS (0 degil)', sat[3] === '2026-11-24;02:00;03:00;60;2020;;;;;;', `-> ${sat[3]}`);
  ok('uc CSV son donem 23:00-24:00', sat[24].startsWith('2026-11-24;23:00;24:00;60;2230;'));
  ok('uc CSV nokta ondalik YOK', !/\d\.\d/.test(sat.slice(1).join('\n').replace(/2026-11-24/g, '')));
}
{ // XLSX
  const { ctx } = ucCtx('?tarih=2026-11-23&bicim=xlsx');
  const r2 = await veriUcu.onRequestGet(ctx);
  ok('uc XLSX tur + dosya adi', r2.headers.get('Content-Type') === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && r2.headers.get('Content-Disposition') === 'attachment; filename="dengesizlik-maliyeti-2026-11-23.xlsx"');
  const bayt = new Uint8Array(await r2.arrayBuffer());
  writeFileSync(join(gecici, 'gun.xlsx'), bayt);
  const x = xlsxOku(bayt);
  ok('uc XLSX gecerli ZIP + XML', x.bad === null && x.sheet === '2026-11-23');
  ok('uc XLSX 1 baslik + 24 satir, 11 sutun', x.rows.length === 25 && x.rows[0].length === 11 && x.rows[1].length === 11);
  ok('uc XLSX baslik = CSV basligi', x.rows[0][4][2] === 'PTF (TL/MWh)' && x.rows[0][10][2] === "PTF'ye göre maliyet, negatif dengesizlik (TL/MWh)");
  ok('uc XLSX fiyatlar SAYISAL hucre', x.rows[1][4][1] === 'n' && x.rows[1][4][2] === '2000' && x.rows[1][8][1] === 'n' && x.rows[1][8][2] === '2438' && x.rows[1][10][2] === '438');
  ok('uc XLSX sure tam sayi, yon metin', x.rows[1][3][1] === 'n' && x.rows[1][3][2] === '60' && x.rows[1][6][1] === 's' && x.rows[1][6][2] === 'Enerji açığı');
}
{ // aralık
  const { ctx, e } = ucCtx('?bas=2026-11-20&bit=2026-11-24&bicim=json', { gun: (g) => sahteGun(g, g === BUGUN ? 8 : 24) });
  const r2 = await veriUcu.onRequestGet(ctx);
  const j = await r2.json();
  ok('uc aralik JSON', r2.status === 200 && j.bas === '2026-11-20' && j.bit === '2026-11-24' && j.tarih === undefined && j.donemler.length === 120);
  ok('uc aralik ozet', j.ozet.toplam === 120 && j.ozet.yayimlanan === 104);
  ok('uc aralik dosya adi', r2.headers.get('Content-Disposition') === 'inline; filename="dengesizlik-maliyeti-2026-11-20_2026-11-24.json"');
  ok('uc aralik tek EPİAŞ istegi', e.sayac.rapor === 1);
  const c2 = ucCtx('?bas=2026-10-28&bit=2026-11-03&bicim=csv');
  const r3 = await veriUcu.onRequestGet(c2.ctx);
  const sat = (await r3.text()).split('\r\n');
  ok('uc aralik CSV iki ay, 7 gun', r3.status === 200 && sat.length === 1 + 7 * 24 + 1 && sat[1].startsWith('2026-10-28;00:00') && sat[168].startsWith('2026-11-03;23:00'));
  ok('uc aralik CSV dosya adi', r3.headers.get('Content-Disposition') === 'attachment; filename="dengesizlik-maliyeti-2026-10-28_2026-11-03.csv"');
  const c3 = ucCtx('?bas=2026-10-25&bit=2026-11-05');
  const j3 = await (await veriUcu.onRequestGet(c3.ctx)).json();
  ok('uc aralik iki kural dilimi bildirir (V 150 ve 100)', j3.kurallar.length === 2 && j3.kurallar[0].V === 150 && j3.kurallar[1].V === 100);
  const c4 = ucCtx('?bas=2026-03-25&bit=2026-04-10');
  const j4 = await (await veriUcu.onRequestGet(c4.ctx)).json();
  ok('uc aralik tavan degisimi (4/4/2026) ayri bildirilir', j4.kurallar.length === 2 && j4.kurallar[0].AFL === null && j4.kurallar[1].AFL === 4500);
}
// 400 yolları
for (const [sorgu, kod] of [
  ['?tarih=abc', 'gecersiz-tarih'], ['?tarih=', 'gecersiz-tarih'], ['?tarih=2026-02-30', 'gecersiz-tarih'], ['?tarih=23.11.2026', 'gecersiz-tarih'],
  ['?tarih=2026-11-25', 'tarih-aralik-disi'], ['?tarih=2025-12-31', 'tarih-aralik-disi'], ['?tarih=2027-01-01', 'tarih-aralik-disi'],
  ['?tarih=2026-11-23&bicim=pdf', 'gecersiz-bicim'], ['?bas=2026-11-01', 'gecersiz-tarih'], ['?bit=2026-11-01', 'gecersiz-tarih'],
  ['?bas=2026-11-10&bit=2026-11-01', 'gecersiz-aralik'], ['?bas=2026-10-01&bit=2026-11-24', 'aralik-uzun'], ['?bas=2026-10-24&bit=2026-11-24', 'aralik-uzun'],
  ['?bas=2026-11-20&bit=2026-11-30', 'tarih-aralik-disi'], ['?bas=2025-12-20&bit=2026-01-05', 'tarih-aralik-disi'],
]) {
  const { ctx, e } = ucCtx(sorgu);
  const r2 = await veriUcu.onRequestGet(ctx);
  const j = await r2.json();
  ok(`uc 400 ${sorgu} -> ${kod}`, r2.status === 400 && j.hata.kod === kod && j.hata.mesaj.length > 10 && e.sayac.giris === 0, `-> ${r2.status} ${j.hata && j.hata.kod}`);
  ok(`uc 400 ${sorgu} no-store + JSON + CORS`, r2.headers.get('Cache-Control') === 'no-store' && r2.headers.get('Content-Type').startsWith('application/json') && r2.headers.get('Access-Control-Allow-Origin') === '*');
}
ok('uc 400 mesaji Turkce', /Geçersiz tarih/.test((await (await veriUcu.onRequestGet(ucCtx('?tarih=abc').ctx)).json()).hata.mesaj));
// 503 yolları: boş ama "başarılı" dosya YOK
for (const [ad, ayar, env, sorgu] of [
  ['kimlik yok', {}, {}, '?tarih=2026-11-23&bicim=csv'], ['giris 401', { girisDurum: 401 }, SAHTE_ENV, '?tarih=2026-11-23&bicim=xlsx'],
  ['servis 500', { raporDurum: 500 }, SAHTE_ENV, '?tarih=2026-11-23'], ['bos liste', { gun: () => [] }, SAHTE_ENV, '?tarih=2026-11-23&bicim=csv'],
  ['aralik eksik', { gun: (g) => (g === '2026-11-21' ? [] : sahteGun(g)) }, SAHTE_ENV, '?bas=2026-11-20&bit=2026-11-22&bicim=xlsx'],
  ['env tanimsiz', {}, null, '?tarih=2026-11-23'],
]) {
  const { ctx } = ucCtx(sorgu, ayar, env);
  const r2 = await veriUcu.onRequestGet(ctx);
  const j = await r2.json();
  ok(`uc 503 ${ad}`, r2.status === 503 && j.hata.kod === 'veri-yok' && /Uydurma ya da boş dosya üretilmez/.test(j.hata.mesaj), `-> ${r2.status}`);
  ok(`uc 503 ${ad}: no-store, Retry-After, dosya eki YOK`, r2.headers.get('Cache-Control') === 'no-store' && r2.headers.get('Retry-After') === '60' && r2.headers.get('Content-Disposition') === null && r2.headers.get('X-Robots-Tag') === 'noindex');
}
{ // bayat veri kısa önbellek + bayat:true
  const { ctx, e } = ucCtx('?tarih=2026-11-24', { gun: (g) => sahteGun(g, 4) });
  await veriUcu.onRequestGet(ctx);
  e.ilerlet(6 * 60 * 1000); e.ayar.raporDurum = 500;
  const r2 = await veriUcu.onRequestGet({ ...ctx, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-24') });
  const j = await r2.json();
  ok('uc bayat veri: 200, bayat:true, ilk cekim zamani, 60 sn onbellek', r2.status === 200 && j.bayat === true && j.cekildi === '2026-11-24T14:30:00+03:00' && r2.headers.get('Cache-Control') === 'public, max-age=60');
}
{ // HEAD / OPTIONS
  const { ctx } = ucCtx('?tarih=2026-11-23&bicim=csv', {}, SAHTE_ENV, 'HEAD');
  const r2 = await veriUcu.onRequestHead(ctx);
  ok('uc HEAD 200 govdesiz, basliklar tam', r2.status === 200 && (await r2.text()) === '' && r2.headers.get('Content-Type') === 'text/csv; charset=utf-8');
  const r3 = await veriUcu.onRequestOptions();
  ok('uc OPTIONS 204 CORS', r3.status === 204 && r3.headers.get('Access-Control-Allow-Origin') === '*');
}
{ // beklenmeyen hata da 503 (500 patlaması değil)
  const r2 = await veriUcu.onRequestGet({ request: { url: 'bu bir url degil' }, env: SAHTE_ENV });
  ok('uc beklenmeyen hata -> 503 JSON', r2.status === 503 && (await r2.json()).hata.kod === 'veri-yok');
}

console.error = gercekHata;
rmSync(gecici, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
