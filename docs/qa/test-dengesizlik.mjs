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
import { sahteGun } from './dengesizlik-test-verisi.mjs';

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
