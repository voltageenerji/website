// /dengesizlik-maliyeti — saf mantık, EPİAŞ istemcisi, veri ucu ve sunucu render'ı testleri.
// Çalıştırma: node docs/qa/test-dengesizlik.mjs   (ağ gerekmez; fetch taklit edilir)
//
// !!! BU DOSYADAKİ TÜM FİYATLAR UYDURMA TEST VERİSİDİR. Gerçek piyasa değeri
// değildir, sayfada ya da herhangi bir yayında KULLANILMAZ.
import {
  KURALLAR, TAVANLAR, kuralBul, tavanBul, sayi, temiz, yonCoz, birimFiyat, ogelerCikar, donemler,
  ozet, donemlerAyrintili, sayfaBilgisi, gunSinirlari, aralikSinirlari, tarihGecerli, ymdGecerli, gunEkle, gunFarki, gunIzgarasi,
  yayimlandi, veriVar, donemEtiketi, istanbulBugun, istanbulDakika, ATIF, NOT_ORTALAMA, KURAL_DOGRULAMA, kuralDilimleri, formulFarki,
} from '../../functions/_lib/dengesizlik.js';
import { sahteGun, sahteEpias, sahteCache, sahteKv, SABIT_AN, SAHTE_ENV } from './dengesizlik-test-verisi.mjs';
import { gunGetir, aralikGetir, _bellekTemizle, BUTCE, sayaclar } from '../../functions/_lib/epias.js';
import { xlsxYaz, crc32, sutunHarfi } from '../../functions/_lib/xlsx.js';
import * as veriUcu from '../../functions/dengesizlik-maliyeti/veri.js';
import * as sayfa from '../../functions/dengesizlik-maliyeti.js';
import { readFileSync, readdirSync } from 'node:fs';
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
// çelişen kopyalar: hangisi doğru bilinemez → o dönem tümüyle null ("—"), sayaç artar
{
  const a = donemlerAyrintili([
    { date: '2026-11-23T05:00:00+03:00', ptf: 2100, smf: 2500, positiveImbalance: 2037, negativeImbalance: 2650, systemStatus: 'Enerji Açığı' },
    { date: '2026-11-23T05:00:00+03:00', ptf: 2100, smf: 2600, positiveImbalance: 2037, negativeImbalance: 2756, systemStatus: 'Enerji Açığı' },
    { date: '2026-11-23T06:00:00+03:00', ptf: 2200, smf: 2200, positiveImbalance: 2134, negativeImbalance: 2266, systemStatus: 'Dengede' },
    { date: '2026-11-23T06:00:00+03:00', ptf: 2200, smf: 2200, positiveImbalance: 2134, negativeImbalance: 2266, systemStatus: 'Dengede' },
  ]);
  ok('celisen kopya: donem tumuyle null (ilk kopya sessizce KAZANMAZ)', a.donemler[0].ptf === null && a.donemler[0].smf === null && a.donemler[0].pozitif === null && a.donemler[0].negatif === null && a.donemler[0].yon === null && a.donemler[0].maliyetNegatif === null);
  ok('celisen kopya: sayac 1, cokme degil', a.cakisma === 1 && a.cokme === false);
  ok('ayni degerli kopya celiski sayilmaz', a.donemler[1].ptf === 2200 && a.donemler[1].negatif === 2266);
  ok('yon celiskisi de celiskidir', donemlerAyrintili([{ date: '2026-11-23T05:00:00+03:00', ptf: 1, systemStatus: 'Enerji Açığı' }, { date: '2026-11-23T05:00:00+03:00', ptf: 1, systemStatus: 'Enerji Fazlası' }]).cakisma === 1);
  ok('celiskisiz veri: sayac 0', donemlerAyrintili(sahteGun('2026-11-23')).cakisma === 0 && donemlerAyrintili([...sahteGun('2026-11-23'), ...sahteGun('2026-11-23')]).cakisma === 0);
  ok('donemlerAyrintili dizi degilse bos', donemlerAyrintili(null).donemler.length === 0 && donemlerAyrintili(null).cokme === false);
}
// dönem başlangıcı: gün içinde SAATİ DEĞİŞEN alan seçilir
{
  const saatISO = (g, h) => `${g}T${String(h).padStart(2, '0')}:00:00+03:00`;
  const G = '2026-11-23';
  const bicimler = {
    'date=gun, time=saat ISO': (h) => ({ date: saatISO(G, 0), time: saatISO(G, h) }),
    'date=saat, time=gunun 00:00 ISO': (h) => ({ date: saatISO(G, h), time: saatISO(G, 0) }),
    'date=saat, time=HH:MM': (h) => ({ date: saatISO(G, h), time: `${String(h).padStart(2, '0')}:00` }),
    'date=saat, time=1970 00:00': (h) => ({ date: saatISO(G, h), time: '1970-01-01T00:00:00+03:00' }),
    'date=gun, time=1970 saat': (h) => ({ date: saatISO(G, 0), time: saatISO('1970-01-01', h) }),
    'date=saat, time yok': (h) => ({ date: saatISO(G, h) }),
    'date=gun (saatsiz), hour=HH:MM': (h) => ({ date: G, hour: `${String(h).padStart(2, '0')}:00` }),
    'date=saat UTC, time=00:00': (h) => ({ date: new Date(Date.UTC(2026, 10, 22, 21 + h)).toISOString(), time: '00:00' }),
  };
  for (const [ad, f] of Object.entries(bicimler)) {
    const a = donemlerAyrintili(Array.from({ length: 24 }, (_, h) => ({ ...f(h), ptf: 1000 + h })));
    ok(`zaman bicimi "${ad}": 24 donem, dogru saat`, a.donemler.length === 24 && a.cokme === false && a.cakisma === 0 && a.donemler.every((d, h) => d.bas === saatISO(G, h) && d.ptf === 1000 + h), `-> ${a.donemler.length} donem, cokme ${a.cokme}`);
  }
  const cok = donemlerAyrintili(Array.from({ length: 24 }, (_, h) => ({ date: saatISO(G, 0), time: saatISO(G, 0), ptf: 1000 + h })));
  ok('iki alan da sabitse: 24 satir tek doneme coker -> cokme = true', cok.cokme === true && cok.donemler.length === 1 && cok.donemler[0].ptf === null);
  ok('uclu ayni kopya cokme DEGIL', donemlerAyrintili(Array.from({ length: 5 }, () => ({ date: saatISO(G, 3), ptf: 7 }))).cokme === false);
  ok('tek satir: 00:00 olmayan alan secilir', donemler([{ date: saatISO(G, 5), time: saatISO(G, 0), ptf: 1 }])[0].bas === saatISO(G, 5) && donemler([{ date: saatISO(G, 0), time: '05:00', ptf: 1 }])[0].bas === saatISO(G, 5));
}
// sayfaBilgisi
ok('sayfaBilgisi ust duzey', JSON.stringify(sayfaBilgisi({ items: [], page: { number: 1, size: 20, sort: null, total: 24 } })) === '{"number":1,"size":20,"total":24}');
ok('sayfaBilgisi body icinde', sayfaBilgisi({ body: { content: [], page: { number: 2, size: 10, total: 30 } } }).number === 2);
ok('sayfaBilgisi yok / bozuk -> null', sayfaBilgisi({ items: [] }) === null && sayfaBilgisi({ items: [], page: null }) === null && sayfaBilgisi([]) === null && sayfaBilgisi(null) === null && sayfaBilgisi({ page: { total: 'cok' } }) === null);

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
d = donemler([{ date: '2026-11-23T00:00:00+03:00', time: '1970-01-01T13:00:00+03:00', ptf: 7 }, { date: '2026-11-23T00:00:00+03:00', time: '0001-01-01T14:00:00+03:00', ptf: 8 }]);
ok('time alani tarihsiz an ise gun date alanindan, saat time alanindan', d.length === 2 && d[0].bas === '2026-11-23T13:00:00+03:00' && d[1].bas === '2026-11-23T14:00:00+03:00', `-> ${d.map((x) => x.bas)}`);
d = donemler([{ date: '2026-11-23T00:00:00+03:00', time: '1970-01-01T10:00:00Z', ptf: 7 }, { date: '2026-11-23T00:00:00+03:00', time: '1970-01-01T22:30:00+0200', ptf: 8 }]);
ok('tarihsiz time baska ofsetteyse Istanbul saatine cevrilir', d[0].bas === '2026-11-23T13:00:00+03:00' && d[1].bas === '2026-11-23T23:30:00+03:00', `-> ${d.map((x) => x.bas)}`);
d = donemler([{ time: '2026-11-23T09:00:00+03:00', ptf: 7 }]);
ok('date yoksa gun de ISO time alanindan', d.length === 1 && d[0].bas === '2026-11-23T09:00:00+03:00');
d = donemler([{ date: '2026-11-22T21:00:00Z', time: '00:00', ptf: 7 }]);
ok('UTC date + HH:MM time: gun Istanbul gunu', d[0].bas === '2026-11-23T00:00:00+03:00');
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
const uyarilar = [];
const gercekUyari = console.warn;
console.warn = (...a) => { uyarilar.push(a.map(String).join(' ')); };

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
  ok('Cache API\'ye sentetik anahtarla yazilir', [...cache.depo.keys()].every((k) => k.startsWith('https://dengesizlik-onbellek.invalid/v1/')) && ['tgt', 'gun/' + DUN].every((a) => cache.depo.has('https://dengesizlik-onbellek.invalid/v1/' + a)), `-> ${[...cache.depo.keys()]}`);
  ok('Cache API\'de bilet DUZ METIN degil (AES-GCM)', ![...cache.depo.values()].some((v) => /TGT-/.test(v)) && /"sifreli":\{"iv":"[A-Za-z0-9+/=]+","veri":"[A-Za-z0-9+/=]+"\}/.test(cache.depo.get('https://dengesizlik-onbellek.invalid/v1/tgt')));
  ok('onbellek anahtarinda bilet/kimlik yok', ![...cache.depo.keys()].some((k) => /TGT-|kullanici|parola/.test(k)));
  _bellekTemizle();
  const e2 = sahteEpias();
  const x = await gunGetir(SAHTE_ENV, null, DUN, { fetch: e2.fetch, simdi: e2.simdi, cache });
  ok('yeni surec: veri ve bilet Cache API\'den, EPİAŞ\'a istek yok', x.durum === 'veri' && e2.sayac.giris === 0 && e2.sayac.rapor === 0);

  const kv = sahteKv();
  ({ e, sec } = yeni());
  await gunGetir({ ...SAHTE_ENV, PIYASA: kv }, null, DUN, sec);
  await bosalt();
  ok('KV varsa oraya da yazilir', kv.depo.has('dengesizlik:gun/' + DUN) && kv.depo.has('dengesizlik:tgt'));
  ok('KV\'de bilet DUZ METIN degil', ![...kv.depo.values()].some((v) => /TGT-/.test(v)));
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

// ============================================================================
// REVİZYON 1 / A — ÜST-AKIŞ KORUMASI (QA B1 ölçüm senaryoları)
// ============================================================================
const TUM_GUNLER = []; for (let g = '2026-01-01'; g <= BUGUN; g = gunEkle(g, 1)) TUM_GUNLER.push(g);
ok('secilebilir gun sayisi 328', TUM_GUNLER.length === 328);
ok('butce sabitleri: dakikada 12 rapor + 2 giris', BUTCE.rapor === 12 && BUTCE.giris === 2);

{ // A1 tek-uçuş: 50 eşzamanlı FARKLI gün (soğuk) → 1 giriş
  const { e, sec } = yeni();
  const sonuc = await Promise.all(TUM_GUNLER.slice(-50).map((g) => gunGetir(SAHTE_ENV, null, g, sec)));
  ok('A1 50 eszamanli farkli gun -> 1 GIRIS (tek-ucus)', e.sayac.giris === 1, `-> ${e.sayac.giris}`);
  ok('A3 ayni dakikada en cok 12 rapor istegi', e.sayac.rapor === BUTCE.rapor, `-> ${e.sayac.rapor}`);
  ok('A3 butce asilinca: veri yok / neden butce (uydurma yok)', sonuc.filter((x) => x.durum === 'veri').length === 12 && sonuc.filter((x) => x.durum === 'yok' && x.neden === 'butce').length === 38);
  e.ilerlet(60 * 1000);
  const x = await gunGetir(SAHTE_ENV, null, TUM_GUNLER[5], sec);
  ok('A3 sonraki dakikada butce yenilenir', x.durum === 'veri' && e.sayac.rapor === 13 && e.sayac.giris === 1);
}
{ // A1 aynı gün 50 eşzamanlı → 1 giriş + 1 rapor
  const { e, sec } = yeni();
  await Promise.all(Array.from({ length: 50 }, () => gunGetir(SAHTE_ENV, null, DUN, sec)));
  ok('A1 ayni gun 50 eszamanli -> 1 giris + 1 rapor', e.sayac.giris === 1 && e.sayac.rapor === 1);
}
{ // A2 reddedilen giriş: süpürme başına 1 deneme, 5 dk paylaşılan engel
  const { e, sec } = yeni({ girisDurum: 401 });
  for (const g of TUM_GUNLER) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A2 giris 401: 328 gunluk supurmede 1 GIRIS denemesi', e.sayac.giris === 1 && e.sayac.rapor === 0, `-> ${e.sayac.giris}`);
  e.ilerlet(61 * 1000);
  for (const g of TUM_GUNLER) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A2 61 sn sonra supurme: yeni giris YOK (5 dk engel)', e.sayac.giris === 1, `-> ${e.sayac.giris}`);
  const es = await Promise.all(TUM_GUNLER.slice(0, 50).map((g) => gunGetir(SAHTE_ENV, null, g, sec)));
  ok('A2 engel suresince tum tarihler kisa devre (giris-reddedildi)', es.every((x) => x.durum === 'yok' && x.neden === 'giris-reddedildi') && e.sayac.giris === 1);
  e.ilerlet(5 * 60 * 1000);
  for (const g of TUM_GUNLER) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A2 5 dk sonra supurme: yine yalniz 1 deneme', e.sayac.giris === 2, `-> ${e.sayac.giris}`);
  e.ayar.girisDurum = 201; e.ilerlet(5 * 60 * 1000 + 1000);
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A2 parola duzelince engel suresi dolunca veri gelir', x.durum === 'veri' && e.sayac.giris === 3);
}
{ // A2 ağ hatası / zaman aşımı: 60 sn paylaşılan engel
  let { e, sec } = yeni({ girisFirlat: true });
  for (const g of TUM_GUNLER.slice(0, 40)) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A2 giris ag hatasi: 40 gunde 1 deneme', e.sayac.giris === 1);
  e.ilerlet(30 * 1000);
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[100], sec);
  ok('A2 ag hatasi engeli 30 sn\'de surer', e.sayac.giris === 1);
  e.ilerlet(31 * 1000);
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[101], sec);
  ok('A2 ag hatasi engeli 60 sn\'de kalkar (1 yeni deneme)', e.sayac.giris === 2);
  ({ e, sec } = yeni({ girisAsili: true, zamanAsimiMs: 30 }));
  await Promise.all(TUM_GUNLER.slice(0, 30).map((g) => gunGetir(SAHTE_ENV, null, g, sec)));
  for (const g of TUM_GUNLER.slice(30, 60)) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A2 asili giris: 60 istekte 1 deneme', e.sayac.giris === 1, `-> ${e.sayac.giris}`);
  ({ e, sec } = yeni({ girisDurum: 500 }));
  for (const g of TUM_GUNLER.slice(0, 20)) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A2 giris 500: 20 gunde 1 deneme', e.sayac.giris === 1);
}
{ // A2 engel Cache API üzerinden süreçler arasında paylaşılır
  const cache = sahteCache();
  const { e, sec } = yeni({ girisDurum: 401, cache });
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  await bosalt();
  _bellekTemizle(); // yeni süreç, aynı Cache API
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[7], sec);
  ok('A2 giris engeli yeni surecte de gecerli (Cache API)', e.sayac.giris === 1, `-> ${e.sayac.giris}`);
}
{ // A6 rapor 401: bilet bir kez yenilenir; yine 401 ise paylaşılan engel
  const { e, sec } = yeni({ raporDurum: 401 });
  for (const g of TUM_GUNLER) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A6 kalici rapor 401: 328 gunde 2 giris + 2 rapor (dongu yok)', e.sayac.giris === 2 && e.sayac.rapor === 2, `-> ${e.sayac.giris} giris, ${e.sayac.rapor} rapor`);
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A6 engel suresince neden servis-yetki', x.durum === 'yok' && x.neden === 'servis-yetki');
  e.ilerlet(5 * 60 * 1000 + 1000);
  for (const g of TUM_GUNLER.slice(0, 50)) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A6 5 dk sonra: en cok 2 giris + 2 rapor daha', e.sayac.giris <= 4 && e.sayac.rapor <= 4, `-> ${e.sayac.giris} / ${e.sayac.rapor}`);
}
{ // A6 eskimiş bilet: 50 eşzamanlı 401 → 1 yenileme
  const { e, sec } = yeni();
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  e.ayar.biletGecersiz = e.sonBilet;
  e.ilerlet(60 * 1000);
  const r3 = await Promise.all(TUM_GUNLER.slice(0, 6).map((g) => gunGetir(SAHTE_ENV, null, g, sec)));
  ok('A6 eskimis bilet + 6 eszamanli istek: 1 yenileme, hepsi veri', e.sayac.giris === 2 && r3.every((x) => x.durum === 'veri'), `-> ${e.sayac.giris} giris`);
}
{ // A3 bütçe Cache API sayacıyla süreçler arasında paylaşılır; bayat veri korunur
  const cache = sahteCache();
  const { e, sec } = yeni({ cache });
  for (const g of TUM_GUNLER.slice(0, 12)) await gunGetir(SAHTE_ENV, null, g, sec);
  await bosalt();
  _bellekTemizle();
  const x = await gunGetir(SAHTE_ENV, null, TUM_GUNLER[40], sec);
  ok('A3 butce yeni surecte de dolu (Cache API sayaci)', x.durum === 'yok' && x.neden === 'butce' && e.sayac.rapor === 12, `-> ${x.neden} ${e.sayac.rapor}`);
  ok('A3 butce asimi sayaci', sayaclar.butceAsimi >= 1);
  // bugünün verisi var, tazeliği doldu, bütçe dolu → bayat sunulur
  e.ilerlet(60 * 1000);
  await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  e.ilerlet(6 * 60 * 1000);
  for (const g of TUM_GUNLER.slice(60, 72)) await gunGetir(SAHTE_ENV, null, g, sec);
  const once = e.sayac.rapor;
  const y = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('A3 butce doluyken eskimis veri BAYAT olarak sunulur, EPİAŞ\'a gidilmez', y.durum === 'veri' && y.bayat === true && y.neden === 'butce' && e.sayac.rapor === once);
}
{ // A4 önbelleksiz mod: süreç belleği 328 günü tutar; ikinci tarama 0 rapor
  const { e, sec } = yeni();
  for (let i = 0; i < TUM_GUNLER.length; i++) { if (i && i % 12 === 0) e.ilerlet(60 * 1000); await gunGetir(SAHTE_ENV, null, TUM_GUNLER[i], sec); }
  const ilk = e.sayac.rapor;
  ok('A4 onbelleksiz ilk tarama: gun basina 1 rapor, 1 giris', ilk === 328 && e.sayac.giris === 1, `-> ${ilk} / ${e.sayac.giris}`);
  e.ilerlet(60 * 1000);
  let veri = 0;
  for (const g of TUM_GUNLER.slice(0, 326)) { const x = await gunGetir(SAHTE_ENV, null, g, sec); if (x.durum === 'veri') veri++; }
  ok('A4 onbelleksiz ikinci tarama: 0 yeni rapor (bellek siniri >= 512)', e.sayac.rapor === ilk && veri === 326, `-> ${e.sayac.rapor - ilk} yeni rapor, ${veri} veri`);
  // sınırsız tarama: dakikada en çok 12
  const { e: e2, sec: sec2 } = yeni();
  for (let tur2 = 0; tur2 < 3; tur2++) for (const g of TUM_GUNLER) await gunGetir(SAHTE_ENV, null, g, sec2);
  ok('A3 onbelleksiz 3 x 328 tarama ayni dakikada: en cok 12 rapor + 1 giris', e2.sayac.rapor === 12 && e2.sayac.giris === 1, `-> ${e2.sayac.rapor} / ${e2.sayac.giris}`);
}
{ // A7 bilet şifreli saklanır; yeni süreç çözer; parola değişirse çözülemez → yeniden giriş
  const cache = sahteCache();
  const { e, sec } = yeni({ cache });
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  await bosalt();
  const kayit = cache.depo.get('https://dengesizlik-onbellek.invalid/v1/tgt');
  ok('A7 Cache API bilet kaydi sifreli', !!kayit && !kayit.includes(e.sonBilet) && !/TGT-/.test(kayit));
  _bellekTemizle();
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[3], sec);
  ok('A7 yeni surec sifreli bileti cozer: yeni giris yok', e.sayac.giris === 1 && e.istekler.at(-1).headers.tgt === e.sonBilet);
  _bellekTemizle();
  await gunGetir({ ...SAHTE_ENV, EPIAS_PASSWORD: 'baska-test-parolasi' }, null, TUM_GUNLER[4], sec);
  ok('A7 parola degisince kayit cozulemez -> yeniden giris', e.sayac.giris === 2);
  await bosalt();
  _bellekTemizle();
  e.ilerlet(61 * 1000); // giriş bütçesi dakikada 2
  const bozuk = JSON.parse(cache.depo.get('https://dengesizlik-onbellek.invalid/v1/tgt'));
  bozuk.kayit.sifreli.veri = bozuk.kayit.sifreli.veri.slice(0, -4) + 'AAAA';
  cache.depo.set('https://dengesizlik-onbellek.invalid/v1/tgt', JSON.stringify(bozuk));
  const x = await gunGetir({ ...SAHTE_ENV, EPIAS_PASSWORD: 'baska-test-parolasi' }, null, TUM_GUNLER[5], sec);
  ok('A7 kurcalanmis kayit reddedilir -> yeniden giris, veri gelir', x.durum === 'veri' && e.sayac.giris === 3, `-> ${x.durum} ${x.neden || ''} ${e.sayac.giris}`);
  await bosalt();
  _bellekTemizle();
  e.ilerlet(61 * 1000);
  cache.depo.set('https://dengesizlik-onbellek.invalid/v1/tgt', JSON.stringify({ son: e.simdi() + 1e6, kayit: { tgt: 'TGT-9999-duzMetinEskiKayit', taze: e.simdi() + 1e6 } }));
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[6], sec);
  ok('A7 duz metin (eski bicim) kayit KULLANILMAZ', e.istekler.at(-1).headers.tgt !== 'TGT-9999-duzMetinEskiKayit' && e.sayac.giris === 4, `-> ${e.sayac.giris}`);
  // giriş bütçesi: aynı dakikada 3. giriş denenmez
  const { e: e3, sec: sec3 } = yeni();
  await gunGetir(SAHTE_ENV, null, DUN, sec3);
  for (const g of TUM_GUNLER.slice(0, 3)) { e3.ayar.biletGecersiz = e3.sonBilet; await gunGetir(SAHTE_ENV, null, g, sec3); }
  ok('A3 giris butcesi: ayni dakikada en cok 2 giris', e3.sayac.giris === BUTCE.giris, `-> ${e3.sayac.giris}`);
}
{ // A5 yalnız önbellek (HEAD yolu): üst-akışa gidilmez
  const { e, sec } = yeni();
  let x = await gunGetir(SAHTE_ENV, null, DUN, { ...sec, yalnizOnbellek: true });
  ok('A5 yalnizOnbellek (soguk): yok/onbellek-yok, istek yok', x.durum === 'yok' && x.neden === 'onbellek-yok' && e.sayac.giris === 0 && e.sayac.rapor === 0);
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  x = await gunGetir(SAHTE_ENV, null, DUN, { ...sec, yalnizOnbellek: true });
  ok('A5 yalnizOnbellek (sicak): veri, yeni istek yok', x.durum === 'veri' && e.sayac.rapor === 1);
  e.ilerlet(10 * 60 * 1000);
  x = await gunGetir(SAHTE_ENV, null, DUN, { ...sec, yalnizOnbellek: true });
  ok('A5 yalnizOnbellek (eskimis): bayat isaretli veri, yeni istek yok', x.durum === 'veri' && x.bayat === true && e.sayac.rapor === 1);
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-01', '2026-11-05', { ...sec, yalnizOnbellek: true });
  ok('A5 aralik yalnizOnbellek: istek yok', x.durum === 'yok' && e.sayac.rapor === 1);
}
{ // A8 toplam süre sınırı: aşılırsa bekleme/bayat döner, çekim arka planda tamamlanır
  const { e, sec } = yeni({ raporGecikmeMs: 250 });
  const bekleyen = [];
  const ctx = { waitUntil: (p) => bekleyen.push(p) };
  let t0 = Date.now();
  let x = await gunGetir(SAHTE_ENV, ctx, BUGUN, { ...sec, sureMs: 40 });
  ok('A8 sure asimi: hemen doner (yok/sure)', x.durum === 'yok' && x.neden === 'sure' && Date.now() - t0 < 200, `-> ${x.neden} ${Date.now() - t0} ms`);
  ok('A8 cekim waitUntil ile arka plana verilir', bekleyen.length >= 1);
  await Promise.all(bekleyen);
  await bosalt();
  x = await gunGetir(SAHTE_ENV, ctx, BUGUN, { ...sec, sureMs: 40 });
  ok('A8 arka plandaki cekim onbellege yazildi: sonraki istek veri, yeni istek yok', x.durum === 'veri' && e.sayac.rapor === 1);
  e.ilerlet(6 * 60 * 1000);
  t0 = Date.now();
  x = await gunGetir(SAHTE_ENV, ctx, BUGUN, { ...sec, sureMs: 40 });
  ok('A8 sure asimi + eski veri: BAYAT doner (rakam silinmez)', x.durum === 'veri' && x.bayat === true && x.neden === 'sure' && Date.now() - t0 < 200);
  await Promise.all(bekleyen); await bosalt();
  x = await gunGetir(SAHTE_ENV, ctx, BUGUN, { ...sec, sureMs: 40 });
  ok('A8 yenileme tamamlaninca taze veri', x.durum === 'veri' && x.bayat === undefined && e.sayac.rapor === 2);
  // sınır aşılmıyorsa normal yol
  const h = yeni({ raporGecikmeMs: 10 });
  x = await gunGetir(SAHTE_ENV, null, BUGUN, { ...h.sec, sureMs: 2000 });
  ok('A8 sure yeterliyse veri dogrudan doner', x.durum === 'veri');
}
{ // A9 sayfalama
  let { e, sec } = yeni({ sayfaBoyu: 10 });
  let x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  const govdeler = e.istekler.filter((i) => i.url.includes('ptf-smf-sdf')).map((i) => JSON.parse(i.body));
  ok('A9 sayfali yanit: kalan sayfalar cekilir (3 istek), 24 donem tam', x.durum === 'veri' && x.donemler.length === 24 && x.donemler.filter(yayimlandi).length === 24 && e.sayac.rapor === 3, `-> ${x.durum} ${e.sayac.rapor}`);
  ok('A9 ilk istekte page yok; sonrakilerde {number,size}', govdeler[0].page === undefined && JSON.stringify(govdeler[1].page) === '{"number":2,"size":10}' && JSON.stringify(govdeler[2].page) === '{"number":3,"size":10}');
  ({ e, sec } = yeni({ sayfaBoyu: 20, sayfaHata: 2 }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A9 kalan sayfa alinamazsa: yok/eksik (20/24 "yayimlanmadi" diye SUNULMAZ)', x.durum === 'yok' && x.neden === 'eksik' && x.donemler.length === 0);
  ({ e, sec } = yeni({ sayfaBoyu: 20, sayfaBos: 2 }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A9 kalan sayfa bos donerse: yok/eksik', x.durum === 'yok' && x.neden === 'eksik');
  ({ e, sec } = yeni({ raporGovde: JSON.stringify({ items: sahteGun(DUN).slice(0, 20), page: { number: 1, size: 0, total: 24 } }) }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A9 total > gelen ama sayfa boyu bilinmiyor: yok/eksik', x.durum === 'yok' && x.neden === 'eksik');
  // Sunucu page parametresini YOK SAYIP hep aynı ilk 20 kalemi döndürürse (QA t9): tam sayılmaz
  ({ e, sec } = yeni({ raporGovde: JSON.stringify({ items: sahteGun(DUN).slice(0, 20), page: { number: 1, size: 20, total: 24 } }) }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A9 page parametresi yok sayilirsa (ayni sayfa yinelenir): yok/eksik, "20 / 24" gosterilmez', x.durum === 'yok' && x.neden === 'eksik' && e.sayac.rapor === 2, `-> ${x.durum} ${x.neden || ''} ${e.sayac.rapor}`);
  ({ e, sec } = yeni({ raporGovde: JSON.stringify({ items: sahteGun(DUN).slice(0, 20), page: { number: 1, size: 20, total: 24 } }) }));
  const ySayfa = await sayfa.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti?tarih=' + DUN), env: SAHTE_ENV, secenek: sec, next: async () => new Response(readFileSync(new URL('../../dengesizlik-maliyeti.html', import.meta.url), 'utf8'), { status: 200 }) });
  const hSayfa = await ySayfa.text();
  ok('A9 kesik yanitta sayfa bekleme halinde kalir (yayim sayaci "—")', hSayfa.includes('<span id="dYayim">—</span>') && hSayfa.includes('Veri bekleniyor'));
  ({ e, sec } = yeni({ sayfaBoyu: 1 }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A9 asiri sayfa sayisi: yok/eksik, tek istek', x.durum === 'yok' && x.neden === 'eksik' && e.sayac.rapor === 1);
  ({ e, sec } = yeni({ sayfaBoyu: 3 }));
  for (const g of TUM_GUNLER.slice(0, 8)) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('A9 sayfalar da butceden duser (dakikada 12)', e.sayac.rapor === 12, `-> ${e.sayac.rapor}`);
  ({ e, sec } = yeni({ raporGovde: JSON.stringify({ items: sahteGun(DUN), page: { number: 1, size: 24, total: 24 } }) }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A9 total = gelen: tek istek, veri', x.durum === 'veri' && e.sayac.rapor === 1);
  ({ e, sec } = yeni({ sayfaBoyu: 100 }));
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-20', '2026-11-22', sec);
  ok('A9 ay dilimi sayfali (576 kalem / 100): 6 istek, aralik tam', x.durum === 'veri' && x.donemler.length === 72 && e.sayac.rapor === 6, `-> ${x.durum} ${x.neden || ''} ${e.sayac.rapor}`);
}
{ // A10 / A11 uçtan uca
  const saatISO = (g, h) => `${g}T${String(h).padStart(2, '0')}:00:00+03:00`;
  let { sec } = yeni({ gun: (g) => sahteGun(g).map((o, h) => ({ ...o, date: saatISO(g, h), time: saatISO(g, 0) })) });
  let x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A10 date saati tasir, time gunun 00:00\'i: 24 donem dogru', x.durum === 'veri' && x.donemler.filter(yayimlandi).length === 24 && x.donemler[13].ptf === 2130);
  ({ sec } = yeni({ gun: (g) => sahteGun(g).map((o) => ({ ...o, date: saatISO(g, 0), time: saatISO(g, 0) })) }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('A10 24 satir tek doneme cokerse: yok/bicim (veri gosterilmez)', x.durum === 'yok' && x.neden === 'bicim' && x.donemler.length === 0);
  const h = yeni({ gun: (g) => [...sahteGun(g), { ...sahteGun(g)[7], negativeImbalance: 9999.99 }] });
  x = await gunGetir(SAHTE_ENV, null, DUN, h.sec);
  ok('A11 celisen kopya: o donem tumuyle null, digerleri saglam', x.durum === 'veri' && x.donemler[7].ptf === null && x.donemler[7].negatif === null && x.donemler[7].pozitif === null && x.donemler[6].negatif !== null && x.donemler.filter(yayimlandi).length === 23);
  ok('A11 ic sayac artar; log yalniz sayac ve tarih', sayaclar.cakisma === 1 && loglar.some((l) => /çakışan yinelenen satır — 1 dönem 2026-11-23 2026-11-23$/.test(l)) && !loglar.some((l) => l.includes('9999')));
}
{ // A5 / A8 sayfa ve uç düzeyinde
  const { e, sec } = yeni({ raporGecikmeMs: 250 });
  const bekleyen = [];
  const ctxS = { request: new Request('https://voltage.com.tr/dengesizlik-maliyeti'), env: SAHTE_ENV, secenek: { ...sec, sureMs: 40 }, waitUntil: (p) => bekleyen.push(p), next: async () => new Response(readFileSync(new URL('../../dengesizlik-maliyeti.html', import.meta.url), 'utf8'), { status: 200 }) };
  const t0 = Date.now();
  let y = await sayfa.onRequestGet(ctxS);
  let hS = await y.text();
  ok('A8 SSR: ust-akis yavassa sure dolunca bekleme kabugu doner', y.status === 200 && Date.now() - t0 < 220 && hS.includes('Veri bekleniyor') && !hS.includes('data-ssr="1"') && y.headers.get('Cache-Control') === 'public, max-age=30, s-maxage=60, must-revalidate', `-> ${Date.now() - t0} ms`);
  await Promise.all(bekleyen); await bosalt();
  y = await sayfa.onRequestGet({ ...ctxS, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti') });
  hS = await y.text();
  ok('A8 SSR: arka plan cekimi bitince sonraki istek verili, yeni rapor yok', hS.includes('data-ssr="1"') && e.sayac.rapor === 1);
  ok('A8 SSR varsayilan toplam sure siniri 3,5 sn', readFileSync(new URL('../../functions/dengesizlik-maliyeti.js', import.meta.url), 'utf8').includes('const SSR_SURE_MS = 3500;'));
  // HEAD sayfa: üst-akış yok; tarihli HEAD noindex
  const h2 = yeni();
  const kabukYanit = async () => new Response(null, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  let hd = await sayfa.onRequestHead({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti?tarih=2026-11-20', { method: 'HEAD' }), env: SAHTE_ENV, secenek: h2.sec, next: kabukYanit });
  ok('A5 HEAD sayfa (tarihli): X-Robots-Tag noindex, follow; ust-akis yok', hd.status === 200 && hd.headers.get('X-Robots-Tag') === 'noindex, follow' && h2.e.sayac.giris === 0 && h2.e.sayac.rapor === 0);
  hd = await sayfa.onRequestHead({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti', { method: 'HEAD' }), env: SAHTE_ENV, secenek: h2.sec, next: kabukYanit });
  ok('A5 HEAD sayfa (tarihsiz): X-Robots-Tag yok', hd.status === 200 && hd.headers.get('X-Robots-Tag') === null && h2.e.sayac.giris === 0);
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
sheets = [x.get('name') for x in wb.find('m:sheets', ns)]
rows2 = []
if 'xl/worksheets/sheet2.xml' in names:
    for r in ET.fromstring(z.read('xl/worksheets/sheet2.xml')).find('m:sheetData', ns):
        rows2.append([''.join(x.text or '' for x in c.iter('{%s}t' % ns['m'])) for c in r])
print(json.dumps({'bad': bad, 'names': names, 'rows': rows, 'rows2': rows2, 'sheets': sheets, 'sheet': sheets[0], 'stored': all(i.compress_type == 0 for i in z.infolist())}))
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
  ok('uc basliklar: noindex + nosniff, CORS basligi YOK', r2.headers.get('X-Robots-Tag') === 'noindex' && r2.headers.get('Access-Control-Allow-Origin') === null && r2.headers.get('X-Content-Type-Options') === 'nosniff');
  ok('uc Cache-Control dun 300 sn', r2.headers.get('Cache-Control') === 'public, max-age=300');
  ok('uc JSON dosya adi', r2.headers.get('Content-Disposition') === 'inline; filename="dengesizlik-maliyeti-2026-11-23.json"');
  ok('uc JSON ust alanlar', j.surum === '1' && j.tarih === '2026-11-23' && j.birim === 'TL/MWh' && j.sayfa === 'https://voltage.com.tr/dengesizlik-maliyeti' && j.bayat === false);
  ok('uc JSON kaynak EPİAŞ', j.kaynak.ad === 'EPİAŞ Şeffaflık Platformu' && j.kaynak.rapor === 'PTF, SMF ve SDF Listeleme');
  ok('uc JSON cekildi', j.cekildi === '2026-11-24T14:30:00+03:00');
  ok('uc JSON kural atfi', j.kurallar.length === 1 && j.kurallar[0].V === 100 && j.kurallar[0].AFL === 4500 && /14911/.test(j.kurallar[0].kaynak.V) && /14030/.test(j.kurallar[0].kaynak.katsayi) && /14459/.test(j.kurallar[0].kaynak.tavan));
  ok('uc JSON atif satiri', j.atif.startsWith('Dayanak: Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği') && j.atif.endsWith('24 Kasım 2026 itibarıyla.'));
  ok('uc JSON not: yayimlandigi haliyle + revize + agirliksiz ortalama + tavsiye degil', /yayımlandığı hâliyle/.test(j.not) && /revize edilebilir/.test(j.not) && j.not.includes(NOT_ORTALAMA) && j.not.endsWith('yatırım, ticari karar ya da hukuki tavsiye, teklif ya da taahhüt değildir.') && j.not.includes('mevzuatta tanımlı bir terim değildir') && j.not.includes('kaynağı "EPİAŞ Şeffaflık Platformu" olarak gösterin'));
  ok('uc JSON basliklari: X-Veri-Cekildi + X-Veri-Bayat', r2.headers.get('X-Veri-Cekildi') === j.cekildi && r2.headers.get('X-Veri-Bayat') === 'false');
  ok('uc JSON alan aciklamalari yeni adlarla, ANAHTARLAR ayni', /^Pozitif dengesizlik maliyeti \(PTF'ye göre\)/.test(j.alanlar.maliyetPozitif) && /^Negatif dengesizlik maliyeti \(PTF'ye göre\)/.test(j.alanlar.maliyetNegatif) && j.alanlar.maliyetNegatif.endsWith('Voltage Enerji türetimi') && 'maliyetPozitif' in j.donemler[0] && 'maliyetNegatifOrt' in j.ozet && 'pozitifOrt' in j.ozet && 'negatifOrt' in j.ozet);
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
  ok('uc CSV Turkce baslik, ; ayirici, 12 sutun', sat[0].split(';').length === 12 && sat[0] === "Tarih;Dönem başlangıcı;Dönem bitişi;Süre (dk);PTF (TL/MWh);SMF (TL/MWh);Sistem yönü;Pozitif dengesizlik fiyatı (TL/MWh);Negatif dengesizlik fiyatı (TL/MWh);Pozitif dengesizlik maliyeti (PTF'ye göre) (TL/MWh) — Voltage Enerji türetimi;Negatif dengesizlik maliyeti (PTF'ye göre) (TL/MWh) — Voltage Enerji türetimi;Kaynak", `-> ${sat[0]}`);
  ok('uc CSV ilk satir (son sutun Kaynak)', sat[1] === '2026-11-24;00:00;01:00;60;2000;2300;Enerji açığı;1940;2438;60;438;EPİAŞ Şeffaflık Platformu', `-> ${sat[1]}`);
  ok('uc CSV ondalik VIRGUL, eksi isareti ASCII', sat[2] === '2026-11-24;01:00;02:00;60;2010;60,5;Enerji fazlası;-106;2070,3;2116;60,3;EPİAŞ Şeffaflık Platformu', `-> ${sat[2]}`);
  ok('uc CSV yayimlanmamis hucre BOS (0 degil)', sat[3] === '2026-11-24;02:00;03:00;60;2020;;;;;;;EPİAŞ Şeffaflık Platformu', `-> ${sat[3]}`);
  ok('uc CSV basliklari: X-Veri-Cekildi + X-Veri-Bayat', r2.headers.get('X-Veri-Cekildi') === '2026-11-24T14:30:00+03:00' && r2.headers.get('X-Veri-Bayat') === 'false');
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
  ok('uc XLSX 1 baslik + 24 satir, 12 sutun', x.rows.length === 25 && x.rows[0].length === 12 && x.rows[1].length === 12);
  ok('uc XLSX baslik = CSV basligi', x.rows[0][4][2] === 'PTF (TL/MWh)' && x.rows[0][10][2] === "Negatif dengesizlik maliyeti (PTF'ye göre) (TL/MWh) — Voltage Enerji türetimi" && x.rows[0][9][2] === "Pozitif dengesizlik maliyeti (PTF'ye göre) (TL/MWh) — Voltage Enerji türetimi" && x.rows[0][11][2] === 'Kaynak' && x.rows[1][11][2] === 'EPİAŞ Şeffaflık Platformu');
  ok('uc XLSX ikinci sayfa "Bilgi": atif, not, cekilme zamani, bayat', JSON.stringify(x.sheets) === '["2026-11-23","Bilgi"]' && x.rows2[0].join('|') === 'Alan|Değer' && x.rows2.some((r) => r[0] === 'Atıf' && r[1] === ATIF) && x.rows2.some((r) => r[0] === 'Not' && r[1].includes(NOT_ORTALAMA)) && x.rows2.some((r) => r[0] === "EPİAŞ'tan alındığı an" && r[1] === '2026-11-24T14:30:00+03:00') && x.rows2.some((r) => r[0] === 'Önceki senkrondan mı (bayat)' && r[1] === 'Hayır') && x.rows2.some((r) => r[0] === 'Kaynak' && r[1] === 'EPİAŞ Şeffaflık Platformu'), `-> ${JSON.stringify(x.sheets)} ${JSON.stringify(x.rows2.map((r) => r[0]))}`);
  ok('uc XLSX basliklari: X-Veri-Cekildi + X-Veri-Bayat', r2.headers.get('X-Veri-Cekildi') === '2026-11-24T14:30:00+03:00' && r2.headers.get('X-Veri-Bayat') === 'false');
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
  ok('uc aralik tavan degisimi (4/4/2026) ayri ve AYIRT EDILIR girdiler', j4.kurallar.length === 2 && j4.kurallar[0].AFL === null && j4.kurallar[1].AFL === 4500 && j4.kurallar[0].bas === '2026-01-01' && j4.kurallar[0].bit === '2026-04-03' && j4.kurallar[1].bas === '2026-04-04' && j4.kurallar[1].bit === '2026-10-31' && j4.kurallar[1].tavanBas === '2026-04-04' && j4.kurallar[0].tavanBas === null);
  ok('uc JSON kuralAlanlari tavanBas dahil her alani belgeler', JSON.stringify(Object.keys(j4.kuralAlanlari)) === JSON.stringify(Object.keys(j4.kurallar[0])) && /yürürlüğe girdiği gün/.test(j4.kuralAlanlari.tavanBas));
}
// 400 yolları
for (const [sorgu, kod] of [
  ['?tarih=abc', 'gecersiz-tarih'], ['?tarih=', 'gecersiz-tarih'], ['?tarih=2026-02-30', 'gecersiz-tarih'], ['?tarih=23.11.2026', 'gecersiz-tarih'],
  ['?tarih=2026-11-25', 'tarih-aralik-disi'], ['?tarih=2025-12-31', 'tarih-aralik-disi'], ['?tarih=2027-01-01', 'tarih-aralik-disi'],
  ['?tarih=2026-11-23&bicim=pdf', 'gecersiz-bicim'], ['?bas=2026-11-01', 'gecersiz-tarih'], ['?bit=2026-11-01', 'gecersiz-tarih'],
  ['?bas=2026-11-10&bit=2026-11-01', 'gecersiz-aralik'], ['?bas=2026-10-01&bit=2026-11-24', 'aralik-uzun'], ['?bas=2026-10-24&bit=2026-11-24', 'aralik-uzun'],
  ['?bas=2026-11-20&bit=2026-11-30', 'tarih-aralik-disi'], ['?bas=2025-12-20&bit=2026-01-05', 'tarih-aralik-disi'],
  ['?tarih=2026-11-23&bas=2026-11-01&bit=2026-11-05', 'celisen-parametre'], ['?tarih=2026-11-23&bit=2026-11-05', 'celisen-parametre'],
]) {
  const { ctx, e } = ucCtx(sorgu);
  const r2 = await veriUcu.onRequestGet(ctx);
  const j = await r2.json();
  ok(`uc 400 ${sorgu} -> ${kod}`, r2.status === 400 && j.hata.kod === kod && j.hata.mesaj.length > 10 && e.sayac.giris === 0, `-> ${r2.status} ${j.hata && j.hata.kod}`);
  ok(`uc 400 ${sorgu} no-store + JSON, CORS yok`, r2.headers.get('Cache-Control') === 'no-store' && r2.headers.get('Content-Type').startsWith('application/json') && r2.headers.get('Access-Control-Allow-Origin') === null);
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
  ok('uc bayat veri: 200, bayat:true, ilk cekim zamani, 60 sn onbellek, X-Veri-Bayat', r2.status === 200 && j.bayat === true && j.cekildi === '2026-11-24T14:30:00+03:00' && r2.headers.get('Cache-Control') === 'public, max-age=60' && r2.headers.get('X-Veri-Bayat') === 'true' && r2.headers.get('X-Veri-Cekildi') === '2026-11-24T14:30:00+03:00');
  for (const b of ['csv', 'xlsx']) {
    const rb = await veriUcu.onRequestGet({ ...ctx, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-24&bicim=' + b) });
    ok(`uc bayat ${b}: X-Veri-Bayat true + ilk cekim zamani (dosyada da isaret var)`, rb.status === 200 && rb.headers.get('X-Veri-Bayat') === 'true' && rb.headers.get('X-Veri-Cekildi') === '2026-11-24T14:30:00+03:00');
    if (b === 'xlsx') ok('uc bayat xlsx: Bilgi sayfasi "Evet"', xlsxOku(new Uint8Array(await rb.arrayBuffer())).rows2.some((r) => r[0] === 'Önceki senkrondan mı (bayat)' && r[1].startsWith('Evet')));
  }
}
{ // HEAD yalnız önbellekten; OPTIONS/CORS yok
  const { ctx, e } = ucCtx('?tarih=2026-11-23&bicim=csv', {}, SAHTE_ENV, 'HEAD');
  let r2 = await veriUcu.onRequestHead(ctx);
  ok('uc HEAD (soguk): 200 govdesiz, EPİAŞ\'a HIC istek yok', r2.status === 200 && (await r2.text()) === '' && e.sayac.giris === 0 && e.sayac.rapor === 0 && r2.headers.get('Content-Type') === 'text/csv; charset=utf-8' && r2.headers.get('X-Veri-Durum') === 'onbellekte-yok' && r2.headers.get('Cache-Control') === 'no-store');
  await veriUcu.onRequestGet({ ...ctx, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-23&bicim=csv') });
  const once = e.sayac.rapor;
  r2 = await veriUcu.onRequestHead(ctx);
  ok('uc HEAD (onbellekte): GET basliklari, yeni istek yok', r2.status === 200 && (await r2.text()) === '' && r2.headers.get('Content-Disposition') === 'attachment; filename="dengesizlik-maliyeti-2026-11-23.csv"' && r2.headers.get('Cache-Control') === 'public, max-age=300' && e.sayac.rapor === once && once === 1);
  r2 = await veriUcu.onRequestHead({ ...ctx, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=abc', { method: 'HEAD' }) });
  ok('uc HEAD gecersiz tarih -> 400', r2.status === 400);
  ok('uc OPTIONS isleyicisi YOK (CORS kaldirildi)', veriUcu.onRequestOptions === undefined && veriUcu.onRequest === undefined);
}
{ // beklenmeyen hata da 503 (500 patlaması değil)
  const r2 = await veriUcu.onRequestGet({ request: { url: 'bu bir url degil' }, env: SAHTE_ENV });
  ok('uc beklenmeyen hata -> 503 JSON', r2.status === 503 && (await r2.json()).hata.kod === 'veri-yok');
}

// ============================================================================
// M3 — SAYFA KABUĞU  dengesizlik-maliyeti.html
// ============================================================================
const KABUK = readFileSync(new URL('../../dengesizlik-maliyeti.html', import.meta.url), 'utf8');
const coz = (x) => x.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const govdeOf = (h) => (h.match(/<tbody id="dTablo">([\s\S]*?)<\/tbody>/) || ['', ''])[1];
const idMetni = (h, id) => { const m = new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)</`).exec(h); return m ? coz(m[1]) : null; };
const jsonLd = (h) => JSON.parse(/<script type="application\/ld\+json" id="dJsonLd">([\s\S]*?)<\/script>/.exec(h)[1]);
const tur = (h, t) => jsonLd(h)['@graph'].find((n) => n['@type'] === t);
const ornekOf = (h) => coz(/<div class="ornek" id="dOrnek">([\s\S]*?)<\/div>/.exec(h)[1]);
{
  const baslik = /<title>([^<]*)<\/title>/.exec(KABUK)[1];
  const aciklama = /<meta name="description" content="([^"]*)">/.exec(KABUK)[1];
  ok('kabuk title <= 60', baslik.length <= 60 && baslik.length > 20, `-> ${baslik.length}`);
  ok('kabuk description <= 155', aciklama.length <= 155 && aciklama.length > 70, `-> ${aciklama.length}`);
  ok('kabuk tek H1', (KABUK.match(/<h1[\s>]/g) || []).length === 1);
  ok('kabuk title = og:title; H1 ayri ve sabit', baslik === 'Dengesizlik Maliyeti Hesaplama: Dengesizlik Fiyatı ve SMF' && KABUK.includes(`<meta property="og:title" content="${baslik}">`) && coz(/<h1>([\s\S]*?)<\/h1>/.exec(KABUK)[1]) === 'Dengesizlik Maliyeti: Pozitif ve Negatif Dengesizlik Fiyatı');
  ok('kabuk description = og:description (revizyon metni)', aciklama === 'Bugünün pozitif ve negatif dengesizlik fiyatı, SMF, PTF ve sistem yönü EPİAŞ verisiyle tek tabloda. Formül, k ve l katsayıları, hesaplayıcı, CSV ve Excel.' && KABUK.includes(`<meta property="og:description" content="${aciklama}">`));
  ok('kabuk lang tr', KABUK.includes('<html lang="tr">'));
  ok('kabuk robots index, follow', KABUK.includes('<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">'));
  ok('kabuk canonical', KABUK.includes('<link rel="canonical" href="https://voltage.com.tr/dengesizlik-maliyeti">'));
  ok('kabuk alternate JSON + CSV', KABUK.includes('<link rel="alternate" type="application/json" href="https://voltage.com.tr/dengesizlik-maliyeti/veri?bicim=json"') && KABUK.includes('<link rel="alternate" type="text/csv" href="https://voltage.com.tr/dengesizlik-maliyeti/veri?bicim=csv"'));
  ok('kabuk og/twitter', ['og:type', 'og:url', 'og:description', 'og:image', 'og:site_name', 'og:locale'].every((x) => KABUK.includes(`property="${x}"`)) && KABUK.includes('name="twitter:card"'));
  // Dürüst bekleme hâli
  ok('kabuk tablo: bekleme satiri', govdeOf(KABUK).includes('Veri bekleniyor'));
  ok('kabuk tablo govdesinde HIC rakam yok', !/\d/.test(coz(govdeOf(KABUK))));
  ok('kabuk tablo basliginda rakam yok', !/\d/.test(coz(/<thead>([\s\S]*?)<\/thead>/.exec(KABUK)[1])));
  ok('kabuk ozet alanlari "—"', ['dYayim', 'dPtfOrt', 'dSmfOrt', 'dMalPoz', 'dMalNeg', 'dYonAcik', 'dYonFazla', 'dYonDenge', 'dGun', 'dBantGun'].every((id) => idMetni(KABUK, id) === '—'));
  ok('kabuk damga: EPİAŞ VERİSİ BEKLENİYOR', idMetni(KABUK, 'dDamga') === 'EPİAŞ VERİSİ BEKLENİYOR' && idMetni(KABUK, 'dMod') === 'VERİ BEKLENİYOR');
  ok('kabuk ozet cumlesi ve ornek bos', KABUK.includes('<p class="day-sum" id="dOzet"></p>') && KABUK.includes('<div class="ornek" id="dOrnek"></div>'));
  ok('kabuk <body> isaretsiz', KABUK.includes('<body>') && !KABUK.includes('<body data-ssr'));
  // Tablo anlamı
  ok('kabuk tablo: caption + scope=col x8', /<caption id="dTabloBaslik">/.test(KABUK) && (/<thead>([\s\S]*?)<\/thead>/.exec(KABUK)[1].match(/<th scope="col"/g) || []).length === 8);
  ok('kabuk tablo kapsayicisi: region + tabindex + etiket', /<div class="tablo-sar" id="dTabloSar" role="region" aria-labelledby="dTabloBaslik" tabindex="0">/.test(KABUK));
  ok('kabuk sutun basliklari (yeni adlar + sr-only birim)', coz(/<thead>([\s\S]*?)<\/thead>/.exec(KABUK)[1]) === "Dönem PTF (TL/MWh) SMF (TL/MWh) Sistem yönü Pozitif dengesizlik fiyatı (TL/MWh) Negatif dengesizlik fiyatı (TL/MWh) Pozitif dengesizlik maliyeti (PTF'ye göre) (TL/MWh) Negatif dengesizlik maliyeti (PTF'ye göre) (TL/MWh)" && (/<thead>([\s\S]*?)<\/thead>/.exec(KABUK)[1].match(/<span class="sr-only"> \(TL\/MWh\)<\/span>/g) || []).length === 6, `-> ${coz(/<thead>([\s\S]*?)<\/thead>/.exec(KABUK)[1])}`);
  // Formlar JS'siz çalışır
  ok('kabuk tarih formu duz GET', /<form method="get" action="\/dengesizlik-maliyeti" id="dTarihForm">/.test(KABUK) && /<input type="date" id="dTarih" name="tarih" min="2026-01-01" required>/.test(KABUK));
  ok('kabuk aralik formu duz GET', /<form method="get" action="\/dengesizlik-maliyeti\/veri" id="dAralikForm">/.test(KABUK) && /name="bas"/.test(KABUK) && /name="bit"/.test(KABUK) && /<select id="dBicim" name="bicim">/.test(KABUK));
  ok('kabuk indirme baglantilari bekleme halinde PASIF + gorunur neden', ['dCsv', 'dXlsx', 'dJson'].every((id) => new RegExp(`<a class="btn-ikincil" id="${id}" rel="nofollow" aria-disabled="true">`).test(KABUK)) && !/id="d(Csv|Xlsx|Json)"[^>]*href=/.test(KABUK) && KABUK.includes('<span class="indir-not" id="dIndirNot">Veri alınamadığı için indirme şu an kapalı</span>'));
  ok('kabuk onceki/sonraki gun rel=nofollow', /id="dOnceki" rel="nofollow"/.test(KABUK) && /id="dSonraki" rel="nofollow"/.test(KABUK));
  ok('kabuk her girdinin etiketi var', [...KABUK.matchAll(/<(?:input|select)[^>]*\bid="([^"]+)"/g)].every((m) => m[0].includes('type="radio"') || KABUK.includes(`for="${m[1]}"`)));
  ok('kabuk radyo dugmeleri label icinde', (KABUK.match(/<label class="secenek"><input type="radio"/g) || []).length === (KABUK.match(/type="radio"/g) || []).length);
  ok('kabuk sonuc alani aria-live', /<div class="sonuc" id="hSonuc" role="status" aria-live="polite"><\/div>/.test(KABUK));
  ok('kabuk hareket azaltma + gorunur odak', KABUK.includes('prefers-reduced-motion: reduce') && KABUK.includes(':focus-visible'));
  // İçerik kuralları
  ok('kabuk hesaplayici uyarisi (Hukuk R5)', KABUK.includes(`Sonuç tahminidir ve yalnızca bilgilendirme amaçlıdır; yatırım, ticari karar ya da hukuki tavsiye değildir. Kesin tutar EPİAŞ uzlaştırma bildirimiyle belirlenir. Teklif ya da taahhüt değildir. Sitenin kullanımı <a href="/kullanim-kosullari">Kullanım Koşulları</a>'na tabidir.`));
  ok('kabuk turetilmis gosterge etiketi', (KABUK.match(/mevzuatta tanımlı bir terim değildir/gi) || []).length >= 4 && KABUK.includes("Birim dengesizlik maliyeti mevzuatta tanımlı bir terim değildir; bu sayfada EPİAŞ'ın yayımladığı fiyatlardan Voltage Enerji tarafından hesaplanır."));
  ok('kabuk SMF dort saat + kesinlesme (Hukuk R2)', KABUK.includes('dört saat içinde duyurulur (DUY m.68(1)(e))') && KABUK.includes("Ön uzlaştırma bildirimi en geç fatura dönemini izleyen ayın 11'inde, nihai uzlaştırma bildirimi 15'inde (hafta sonuna ya da resmî tatile denk gelirse izleyen ilk iş gününde) duyurulur (DUY m.132/A(1)). Kesin tutar nihai uzlaştırma bildirimiyle belirlenir; itiraz üzerine sonradan geçmişe dönük düzeltme yapılabilir (DUY m.134(1))."));
  ok('kabuk atif satiri föyle birebir', coz(/<blockquote id="dAtif">([\s\S]*?)<\/blockquote>/.exec(KABUK)[1]) === ATIF);
  ok('kabuk resmi kaynak baglantilari', ['https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.12985.pdf', 'https://www.resmigazete.gov.tr/eskiler/2025/12/20251229-1.htm', 'https://www.resmigazete.gov.tr/eskiler/2025/12/20251229-19.pdf', 'https://www.resmigazete.gov.tr/eskiler/2026/10/20261019-2.pdf', 'https://www.resmigazete.gov.tr/eskiler/2026/10/20261019-9.pdf', 'https://www.resmigazete.gov.tr/eskiler/2026/04/20260403-12.pdf', 'https://seffaflik.epias.com.tr/reporting-service/technical/en/index.html', 'https://seffaflik.epias.com.tr/electricity-service/technical/tr/index.html'].every((u) => KABUK.includes(`href="${u}"`)));
  const gorunen = coz(KABUK.slice(KABUK.indexOf('<body'), KABUK.indexOf('<script type="application/json" id="dKurallar">'))).toLocaleLowerCase('tr');
  ok('kabuk yasak ifade yok', !/en ucuz|tasarruf|garanti|kesintisiz|indirim|kampanya|teklif al|fırsat/.test(gorunen));
  ok('kabuk yayinlanmayacak telefon yok', !/216\s*479\s*05\s*10|2164790510/.test(KABUK));
  ok('kabuk netlestirme orani (acik madde) verilmiyor', !/yüzde on|%\s?10\b|%\s?5\b/.test(coz(/<h2 id="kapsam">[\s\S]*?<h2 id="kaynak">/.exec(KABUK)[0])));
  ok('kabuk 31/12/2026 sonrasi icin kural hukmu yok', /31 Aralık 2026'dan sonraki teslim günleri için bu sayfada kural gösterilmez\./.test(KABUK));
  // Dış istek yok: yalnız canli-ptf'nin kullandığı yazı tipleri
  const kaynaklar = [...KABUK.matchAll(/<(?:link|script|img|iframe|source)[^>]*\b(?:href|src)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('https://voltage.com.tr/'));
  ok('kabuk dis istek yalniz Google Fonts', kaynaklar.length === 3 && kaynaklar.every((u) => /^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(u)), `-> ${kaynaklar}`);
  ok('kabuk gorsel/iframe yok, betik satir ici', !/<img|<iframe/.test(KABUK) && !/<script[^>]*\bsrc=/.test(KABUK));
  ok('kabuk istemci veri ucunu ayni kokenden cagirir', KABUK.includes("var VERI = '/dengesizlik-maliyeti/veri';") && !/fetch\(['"]https?:/.test(KABUK));

  // Gömülü kural tablosu = kütüphane (sürüklenme kapısı)
  const gomulu = JSON.parse(/<script type="application\/json" id="dKurallar">([\s\S]*?)<\/script>/.exec(KABUK)[1]);
  ok('gomulu kural tablosu KURALLAR ile ayni', JSON.stringify(gomulu.kurallar) === JSON.stringify(KURALLAR.map((k) => ({ bas: k.bas, bit: k.bit, formulGoster: k.formulGoster, V: k.V, B: k.B, tavanCarpani: k.tavanCarpani, k: k.k, l: k.l }))) && gomulu.dogrulama === KURAL_DOGRULAMA && KURAL_DOGRULAMA === '2026-11-24');
  ok('gomulu tavan tablosu TAVANLAR ile ayni', JSON.stringify(gomulu.tavanlar) === JSON.stringify(TAVANLAR.map((t) => ({ bas: t.bas, bit: t.bit, azami: t.azami, asgari: t.asgari }))));
  // Görünen katsayı ve sabit tabloları = kütüphane
  const katsayiTablo = coz(/<table class="kucuk" id="dKatsayi">([\s\S]*?)<\/table>/.exec(KABUK)[1]);
  const tr2 = (n) => String(n).replace('.', ',');
  const guncel = KURALLAR[1];
  ok('gorunen k/l tablosu kural tablosuyla ayni', katsayiTablo.includes(`Enerji açığı${tr2(guncel.k.acik)}${tr2(guncel.l.acik)}`) && katsayiTablo.includes(`Enerji fazlası${tr2(guncel.k.fazla)}${tr2(guncel.l.fazla)}`) && katsayiTablo.includes(`Dengede${tr2(guncel.k.denge)}${tr2(guncel.l.denge)}`), `-> ${katsayiTablo}`);
  const sabitTablo = coz(/<table class="kucuk" id="dSabit">([\s\S]*?)<\/table>/.exec(KABUK)[1]);
  ok('gorunen sabitler kural tablosuyla ayni', sabitTablo.includes(`V${guncel.V} TL/MWh1 Kasım 2026`) && sabitTablo.includes(`V${KURALLAR[0].V} TL/MWh1 Ocak 2026 – 31 Ekim 2026`) && sabitTablo.includes(`B${guncel.B} TL/MWh`) && sabitTablo.includes('AFL4.500 TL/MWh4 Nisan 2026') && TAVANLAR[0].azami === 4500 && TAVANLAR[0].bas === '2026-04-04' && sabitTablo.includes(`Tavan çarpanı${tr2(guncel.tavanCarpani)}`), `-> ${sabitTablo}`);
  ok('gorunen sabitlerde karar numaralari', /14911/.test(sabitTablo) && /14459/.test(sabitTablo) && /14030/.test(katsayiTablo));

  // JSON-LD
  const ld = jsonLd(KABUK);
  ok('JSON-LD ayristirilir, @graph 6 dugum', ld['@context'] === 'https://schema.org' && ld['@graph'].length === 6);
  const org = tur(KABUK, 'Organization');
  const orgPtf = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(readFileSync(new URL('../../canli-ptf.html', import.meta.url), 'utf8'))[1])['@graph'].find((n) => n['@type'] === 'Organization');
  ok('JSON-LD Organization canli-ptf ile birebir', org['@id'] === 'https://voltage.com.tr/#organization' && JSON.stringify(org) === JSON.stringify(orgPtf));
  const wp = tur(KABUK, 'WebPage');
  ok('JSON-LD WebPage', wp.url === 'https://voltage.com.tr/dengesizlik-maliyeti' && wp.name === baslik && wp.description === aciklama && wp.publisher['@id'] === org['@id'] && /^\d{4}-\d{2}-\d{2}$/.test(wp.dateModified) && wp.inLanguage === 'tr-TR');
  const bc = tur(KABUK, 'BreadcrumbList');
  ok('JSON-LD BreadcrumbList gorunen kirintiyla ayni', bc.itemListElement.length === 2 && bc.itemListElement[1].name === 'Dengesizlik Maliyeti' && /› Dengesizlik Maliyeti<\/nav>/.test(KABUK));
  const ds = tur(KABUK, 'Dataset');
  ok('JSON-LD Dataset: creator EPİAŞ, publisher Voltage, isBasedOn rapor', !!ds.name && ds.creator.name === 'Enerji Piyasaları İşletme A.Ş. (EPİAŞ)' && ds.creator.url === 'https://www.epias.com.tr/' && !('@id' in ds.creator) && ds.publisher['@id'] === org['@id'] && ds.isBasedOn['@type'] === 'CreativeWork' && ds.isBasedOn.name === 'EPİAŞ Şeffaflık Platformu: PTF, SMF ve SDF Listeleme raporu' && ds.isBasedOn.publisher.name === ds.creator.name);
  ok('JSON-LD Dataset ekleri', ds['@id'] === 'https://voltage.com.tr/dengesizlik-maliyeti#dataset' && ds.identifier === ds['@id'] && JSON.stringify(ds.alternateName) === '["PTF, SMF ve dengesizlik fiyatları","Pozitif ve negatif dengesizlik fiyatı serisi"]' && JSON.stringify(ds.keywords) === '["dengesizlik fiyatı","pozitif dengesizlik fiyatı","negatif dengesizlik fiyatı","sistem marjinal fiyatı","SMF","PTF","sistem yönü","dengeleme güç piyasası","EPİAŞ"]' && ds.datePublished === '2026-11-24' && ds.citation === ATIF && !!ds.measurementTechnique && ds.temporalCoverage === '2026-01-01/..');
  ok('JSON-LD Dataset description basi ve sonu', ds.description.startsWith("1 Ocak 2026'dan bugüne her uzlaştırma dönemi için ") && ds.description.endsWith('Dosyalar parametresiz istendiğinde içinde bulunulan günü verir; başka bir gün için tarih, aralık için bas ve bit parametreleri kullanılır (tek istekte en çok 31 gün).'));
  ok('JSON-LD @id leri ve baglar', wp['@id'] === 'https://voltage.com.tr/dengesizlik-maliyeti#webpage' && bc['@id'] === 'https://voltage.com.tr/dengesizlik-maliyeti#breadcrumb' && tur(KABUK, 'FAQPage')['@id'] === 'https://voltage.com.tr/dengesizlik-maliyeti#sss' && tur(KABUK, 'WebApplication')['@id'] === 'https://voltage.com.tr/dengesizlik-maliyeti#hesaplayici' && wp.isPartOf['@id'] === 'https://voltage.com.tr/#website' && wp.breadcrumb['@id'] === bc['@id'] && wp.mainEntity['@id'] === ds['@id'] && JSON.stringify(wp.hasPart) === '[{"@id":"https://voltage.com.tr/dengesizlik-maliyeti#hesaplayici"},{"@id":"https://voltage.com.tr/dengesizlik-maliyeti#sss"}]');
  ok('JSON-LD isPartOf hedefi (#website) ana sayfada gercekten tanimli', /"@id":\s*"https:\/\/voltage\.com\.tr\/#website"/.test(readFileSync(new URL('../../index.html', import.meta.url), 'utf8')) && /"@type":\s*"WebSite"/.test(readFileSync(new URL('../../index.html', import.meta.url), 'utf8')));
  ok('JSON-LD Dataset variableMeasured 7 degisken', ds.variableMeasured.length === 7);
  ok('JSON-LD Dataset distribution CSV/XLSX/JSON', ds.distribution.length === 3 && ['csv', 'xlsx', 'json'].every((b) => ds.distribution.some((x) => x.contentUrl === `https://voltage.com.tr/dengesizlik-maliyeti/veri?bicim=${b}`)));
  ok('JSON-LD Dataset license YOK (dogrulanmadi)', !('license' in ds));
  const wa = tur(KABUK, 'WebApplication');
  ok('JSON-LD WebApplication ucretsiz, Offer/puan iddiasi yok', wa.isAccessibleForFree === true && !('offers' in wa) && !('aggregateRating' in wa) && wa.provider['@id'] === org['@id']);
  // SSS: JSON-LD = görünen metin, kelimesi kelimesine
  const sss = [.../<div id="dSss">([\s\S]*?)<\/div>/.exec(KABUK)[1].matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [coz(m[1]), coz(m[2])]);
  const faq = tur(KABUK, 'FAQPage').mainEntity;
  ok('SSS 8 soru', sss.length === 8 && faq.length === 8, `-> ${sss.length}`);
  ok('SSS 1 yaniti = giris paragrafi', sss[0][0] === 'Dengesizlik maliyeti nedir?' && sss[0][1] === coz(/<p class="lede">([\s\S]*?)<\/p>/.exec(KABUK)[1]));
  ok('SSS SDF sorusu (revizyon metni)', sss[1][0] === 'Sistem dengesizlik fiyatı (SDF) nedir?' && sss[1][1] === 'Sistem dengesizlik fiyatı, uzlaştırma dönemi bazında belirlenen ve piyasa katılımcılarının denge sorumluluklarından kaynaklanan enerji dengesizliklerine uygulanan fiyattır (Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği m.4). EPİAŞ Şeffaflık Platformu pozitif ve negatif dengesizlik fiyatını "PTF, SMF ve SDF Listeleme" raporunda yayımlar; bu sayfadaki tablo o rapordaki değerleri gösterir.');
  ok('SSS "pozitif ve negatif dengesizlik ne demek" sorusu YOK (teyitsiz)', !sss.some((x) => /ne demek/i.test(x[0])));
  ok('SSS JSON-LD = gorunen metin (soru)', faq.every((q, i) => q.name === sss[i][0]));
  ok('SSS JSON-LD = gorunen metin (yanit)', faq.every((q, i) => q.acceptedAnswer.text === sss[i][1]));
  ok('JSON-LD yasak ifade / telefon yok', !/en ucuz|tasarruf|garanti|479\s*05\s*10/.test(JSON.stringify(ld).toLocaleLowerCase('tr')));
}

// ============================================================================
// M3 — SUNUCU RENDER'I  functions/dengesizlik-maliyeti.js
// ============================================================================
ok('bicim tr-TR', sayfa.bicim(2800) === '2.800,00' && sayfa.bicim(1234567.891) === '1.234.567,89' && sayfa.bicim(0) === '0,00' && sayfa.bicim(60.3) === '60,30');
ok('bicim gercek eksi isareti (U+2212)', sayfa.bicim(-106) === '−106,00' && sayfa.bicim(-0.001) === '0,00');
ok('bicim sayi degilse "—" (0 DEGIL)', sayfa.bicim(null) === '—' && sayfa.bicim(undefined) === '—' && sayfa.bicim(NaN) === '—' && sayfa.bicim('12') === '—');
ok('bicim yarim kurus yuvarlama', sayfa.bicim(2070.305) === '2.070,31' && sayfa.bicim(1.005) === '1,01');
ok('tarihTR', sayfa.tarihTR('2026-11-23') === '23.11.2026');

const KABUK_BASLIK = { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'", ETag: '"kabuk-etag"', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' };
const sayfaCtx = (sorgu, ayar = {}, env = SAHTE_ENV) => {
  const { e, sec } = yeni(ayar);
  return { e, ctx: { request: new Request('https://voltage.com.tr/dengesizlik-maliyeti' + sorgu), env, secenek: sec, waitUntil() {}, next: async () => new Response(KABUK, { status: 200, headers: KABUK_BASLIK }) } };
};
const al = async (sorgu, ayar, env) => { const { e, ctx } = sayfaCtx(sorgu, ayar, env); const y = await sayfa.onRequestGet(ctx); return { e, y, h: await y.text() }; };
const satirlar = (h) => [...govdeOf(h).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => coz(c[1])));
const butunluk = (h) => (h.match(/<\/script>/g) || []).length === (KABUK.match(/<\/script>/g) || []).length && (h.match(/<tbody id="dTablo">/g) || []).length === 1 && (h.match(/<\/table>/g) || []).length === (KABUK.match(/<\/table>/g) || []).length && h.trimEnd().endsWith('</html>');
const FIYAT = /\d{1,3}(\.\d{3})*,\d{2}/;

{ // veri yok (kimlik tanımlı değil): dürüst bekleme
  const { y, h, e } = await al('', {}, {});
  ok('SSR veri yok: 200 HTML', y.status === 200 && y.headers.get('Content-Type') === 'text/html; charset=utf-8');
  ok('SSR veri yok: bekleme satiri', govdeOf(h).includes('Veri bekleniyor') && !h.includes('data-ssr="1"'));
  ok('SSR veri yok: tabloda rakam YOK', !/\d/.test(coz(govdeOf(h))));
  ok('SSR veri yok: ozet "—", damga bekliyor', ['dYayim', 'dPtfOrt', 'dSmfOrt', 'dMalPoz', 'dMalNeg', 'dYonAcik'].every((id) => idMetni(h, id) === '—') && idMetni(h, 'dDamga') === 'EPİAŞ VERİSİ BEKLENİYOR');
  ok('SSR veri yok: veri bolumunde fiyat bicimli tek rakam yok', !FIYAT.test(coz(h.slice(h.indexOf('<body'), h.indexOf('<h2 id="hesaplayici">')))));
  ok('SSR veri yok: tarih alanlari yine dolu', h.includes(`<input type="date" id="dTarih" name="tarih" min="2026-01-01" max="${BUGUN}" value="${BUGUN}" required>`) && idMetni(h, 'dGun') === '24.11.2026');
  ok('SSR veri yok: kisa onbellek 30/60', y.headers.get('Cache-Control') === 'public, max-age=30, s-maxage=60, must-revalidate');
  ok('SSR veri yok: JSON-LD veri gunu iddia etmez', tur(h, 'Dataset').temporalCoverage === tur(KABUK, 'Dataset').temporalCoverage && tur(h, 'WebPage').dateModified === tur(KABUK, 'WebPage').dateModified);
  ok('SSR veri yok: EPİAŞ\'a istek yok', e.sayac.giris === 0);
  ok('SSR veri yok: HTML butun', butunluk(h));
}
for (const [ad, ayar] of [['giris 401', { girisDurum: 401 }], ['servis 500', { raporDurum: 500 }], ['bos liste', { gun: () => [] }], ['bozuk JSON', { raporGovde: '<html>' }], ['zaman asimi', { raporAsili: true, zamanAsimiMs: 30 }]]) {
  const { y, h } = await al('', ayar);
  ok(`SSR ${ad} -> durust bekleme, rakamsiz`, y.status === 200 && govdeOf(h).includes('Veri bekleniyor') && !/\d/.test(coz(govdeOf(h))) && idMetni(h, 'dPtfOrt') === '—' && !h.includes('data-ssr="1"'));
}
{ // tam gün (dün; tarihli görünüm)
  const { y, h } = await al('?tarih=2026-11-23');
  const s = satirlar(h);
  ok('SSR tam gun: 24 satir, 8 hucre', s.length === 24 && s.every((x) => x.length === 8), `-> ${s.length}`);
  ok('SSR tam gun: donem etiketleri', s[0][0] === '00:00–01:00' && s[23][0] === '23:00–24:00');
  ok('SSR tam gun: ilk satir degerleri', s[0].join('|') === '00:00–01:00|2.000,00|2.300,00|Enerji açığı|1.940,00|2.438,00|60,00|438,00', `-> ${s[0].join('|')}`);
  ok('SSR tam gun: bekleme satiri kalmadi, "—" yok', !govdeOf(h).includes('Veri bekleniyor') && !govdeOf(h).includes('—'));
  ok('SSR tam gun: satir basligi th scope=row + veri oznitelikleri', /<tr data-bas="2026-11-23T00:00:00\+03:00" data-dk="60" data-ptf="2000" data-smf="2300" data-yon="acik" data-poz="1940" data-neg="2438"><th scope="row">00:00–01:00<\/th>/.test(h));
  ok('SSR tam gun: gecmis gunde "simdi" satiri yok', !govdeOf(h).includes('class="simdi"'));
  const oz = ozet(donemler(sahteGun('2026-11-23')));
  ok('SSR tam gun: ozet bandi', idMetni(h, 'dYayim') === '24 / 24' && idMetni(h, 'dPtfOrt') === sayfa.bicim(oz.ptfOrt) && idMetni(h, 'dSmfOrt') === sayfa.bicim(oz.smfOrt) && idMetni(h, 'dMalPoz') === sayfa.bicim(oz.maliyetPozitifOrt) && idMetni(h, 'dMalNeg') === sayfa.bicim(oz.maliyetNegatifOrt));
  ok('SSR tam gun: yon sayilari', idMetni(h, 'dYonAcik') === '8' && idMetni(h, 'dYonFazla') === '8' && idMetni(h, 'dYonDenge') === '8');
  ok('SSR tam gun: damga yilli ve <time> icinde', idMetni(h, 'dMod') === 'EPİAŞ VERİSİ' && h.includes(`<span class="live-stamp" id="dDamga">EPİAŞ'TAN ALINDI <time datetime="2026-11-24T14:30:00+03:00">24.11.2026 14:30</time></span>`));
  ok('SSR tam gun: tarihli ozet cumlesi (yeni kalip)', idMetni(h, 'dOzet') === `23.11.2026 dengesizlik özeti (24 dönemin tamamı): ortalama pozitif dengesizlik fiyatı ${sayfa.bicim(oz.pozitifOrt)} TL/MWh; ortalama negatif dengesizlik fiyatı ${sayfa.bicim(oz.negatifOrt)} TL/MWh; ortalama PTF 2.115,00 TL/MWh; ortalama SMF ${sayfa.bicim(oz.smfOrt)} TL/MWh. Ortalama pozitif dengesizlik maliyeti (PTF'ye göre) ${sayfa.bicim(oz.maliyetPozitifOrt)} TL/MWh, ortalama negatif dengesizlik maliyeti (PTF'ye göre) ${sayfa.bicim(oz.maliyetNegatifOrt)} TL/MWh. Sistem yönü: 8 dönem enerji açığı, 8 dönem enerji fazlası, 8 dönem dengede. Veri: EPİAŞ Şeffaflık Platformu, 24.11.2026 14:30 (Türkiye saati) itibarıyla; ortalamalar Voltage Enerji tarafından bu veriden, yalnızca dengesizlik fiyatı yayımlanan dönemler üzerinden hesaplanmıştır. ${NOT_ORTALAMA}`, `-> ${idMetni(h, 'dOzet')}`);
  ok('SSR tam gun: "Son yayimlanan donem" YOK (gun tamam)', !idMetni(h, 'dOzet').includes('Son yayımlanan dönem'));
  ok('SSR tam gun: gun etiketleri ve caption', idMetni(h, 'dGun') === '23.11.2026' && idMetni(h, 'dBantGun') === '23.11.2026' && idMetni(h, 'dTabloBaslik').startsWith('23.11.2026 · dönem bazında'));
  ok('SSR tam gun: body isaretleri', h.includes('<body data-ssr="1" data-cekildi="2026-11-24T14:30:00+03:00" data-tarih="2026-11-23" data-bugun="2026-11-24">'));
  // Tarihli görünüm: noindex + kendine canonical
  ok('SSR tarihli: robots noindex, follow (meta + baslik)', h.includes('<meta name="robots" content="noindex, follow">') && !h.includes('content="index, follow') && y.headers.get('X-Robots-Tag') === 'noindex, follow');
  ok('SSR tarihli: canonical kendisi', h.includes('<link rel="canonical" href="https://voltage.com.tr/dengesizlik-maliyeti?tarih=2026-11-23">') && h.includes('<meta property="og:url" content="https://voltage.com.tr/dengesizlik-maliyeti?tarih=2026-11-23">'));
  ok('SSR tarihli: title = og:title gunlu', h.includes('<title>Dengesizlik Maliyeti 23.11.2026: Dönem Bazında Fiyatlar</title>') && h.includes('<meta property="og:title" content="Dengesizlik Maliyeti 23.11.2026: Dönem Bazında Fiyatlar">'));
  ok('SSR tarihli: aciklama gunlu', h.includes('<meta name="description" content="23.11.2026 için dönem bazında PTF, SMF, sistem yönü, pozitif ve negatif dengesizlik fiyatı. Veri: EPİAŞ Şeffaflık Platformu. CSV, Excel ve JSON indirme.">') && h.includes('<meta property="og:description" content="23.11.2026 için dönem bazında PTF, SMF, sistem yönü, pozitif ve negatif dengesizlik fiyatı. Veri: EPİAŞ Şeffaflık Platformu. CSV, Excel ve JSON indirme.">'));
  ok('SSR tarihli: H1 sonunda gun', h.includes('<h1>Dengesizlik Maliyeti: Pozitif ve Negatif Dengesizlik Fiyatı · 23.11.2026</h1>') && (h.match(/<h1[\s>]/g) || []).length === 1);
  ok('SSR tarihli: alternate baglantilari gunlu', h.includes('href="https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-23&amp;bicim=json"') && h.includes('href="https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-23&amp;bicim=csv"'));
  ok('SSR tarihli: indirme baglantilari acik, gunlu, nofollow', ['Csv|csv', 'Xlsx|xlsx', 'Json|json'].every((x) => h.includes(`<a class="btn-ikincil" id="d${x.split('|')[0]}" rel="nofollow" href="/dengesizlik-maliyeti/veri?tarih=2026-11-23&amp;bicim=${x.split('|')[1]}" download>`)) && h.includes('<span class="indir-not" id="dIndirNot" hidden>'));
  ok('SSR tarihli: onceki/sonraki gun', h.includes('id="dOnceki" rel="nofollow" href="/dengesizlik-maliyeti?tarih=2026-11-22">') && h.includes('id="dSonraki" rel="nofollow" href="/dengesizlik-maliyeti?tarih=2026-11-24">'));
  ok('SSR tarihli: tarih alanlari', h.includes('id="dTarih" name="tarih" min="2026-01-01" max="2026-11-24" value="2026-11-23" required>') && h.includes('id="dBas" name="bas" min="2026-01-01" max="2026-11-24" value="2026-11-17" required>') && h.includes('id="dBit" name="bit" min="2026-01-01" max="2026-11-24" value="2026-11-23" required>'));
  ok('SSR tarihli (dun): onbellek 60/300', y.headers.get('Cache-Control') === 'public, max-age=60, s-maxage=300, must-revalidate');
  // JSON-LD
  const ds = tur(h, 'Dataset'), wp = tur(h, 'WebPage');
  ok('SSR JSON-LD ayristirilir, SSS degismedi', JSON.stringify(tur(h, 'FAQPage')) === JSON.stringify(tur(KABUK, 'FAQPage')) && jsonLd(h)['@graph'].length === 6);
  ok('SSR JSON-LD temporalCoverage = gun', ds.temporalCoverage === '2026-11-23');
  ok('SSR JSON-LD distribution gunun adresleri', ['csv', 'xlsx', 'json'].every((b) => ds.distribution.some((x) => x.contentUrl === `https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-23&bicim=${b}`)));
  ok('SSR JSON-LD WebPage url/ad/aciklama tarihli; dateModified = cekim ani', wp.url === 'https://voltage.com.tr/dengesizlik-maliyeti?tarih=2026-11-23' && wp.dateModified === '2026-11-24T14:30:00+03:00' && wp.name === 'Dengesizlik Maliyeti 23.11.2026: Dönem Bazında Fiyatlar' && wp.description.startsWith('23.11.2026 için') && ds.dateModified === '2026-11-24T14:30:00+03:00');
  // Başlıklar: kabuğunkiler korunur, gövdeye bağlı olanlar atılır
  ok('SSR kabuk guvenlik basliklari korunur', y.headers.get('X-Content-Type-Options') === 'nosniff' && y.headers.get('Content-Security-Policy') === "default-src 'self'");
  ok('SSR ETag tasinmaz', y.headers.get('ETag') === null);
  ok('SSR yaniti platformun varsayilan CORS basligini TASIMAZ (R7)', y.headers.get('Access-Control-Allow-Origin') === null);
  ok('SSR tam gun: HTML butun', butunluk(h));
  // Örnek hesap: son tam yayımlanmış dönemden, kodla
  const son = donemler(sahteGun('2026-11-23'))[23];
  const bfSon = birimFiyat({ ptf: son.ptf, smfN: son.smf, smfP: son.smf, yon: son.yon }, kuralBul('2026-11-23'));
  const orn = ornekOf(h);
  ok('SSR ornek hesap: son yayimlanan donem', orn.startsWith('Örnek hesap: 23.11.2026, 23:00–24:00'), `-> ${orn.slice(0, 60)}`);
  ok('SSR ornek hesap: girdiler veriden', orn.includes(`PTF ${sayfa.bicim(son.ptf)} TL/MWh; SMF ${sayfa.bicim(son.smf)} TL/MWh; sistem yönü ${{ acik: 'enerji açığı', fazla: 'enerji fazlası', denge: 'dengede' }[son.yon]}`) && orn.includes('V = 100 TL/MWh, B = 100 TL/MWh, AFL = 4.500 TL/MWh.'), `-> ${orn}`);
  ok('SSR tam gun: fark yoksa † yok, not bos, gunluk yok', !govdeOf(h).includes('†') && h.includes('<p class="note fark-not" id="dFarkNot"></p>') && !uyarilar.some((u) => u.includes('"tarih":"2026-11-23"')));
  ok('SSR hesaplayici donem secenekleri sunucudan (son yayimlanan secili)', h.includes('<select id="hDonem"><option value="2026-11-23T00:00:00+03:00">00:00–01:00</option>') && h.includes('<option value="2026-11-23T23:00:00+03:00" selected>23:00–24:00</option></select>') && !/<select id="hDonem">[^<]*<option value="">Veri bekleniyor/.test(h));
  ok('SSR Kasim gunu: tarih uyarisi yok', h.includes('<p class="uyari" id="dKuralUyari" role="status"></p>'));
  ok('SSR ornek hesap: sonuc birimFiyat ile ayni', orn.includes(`= ${sayfa.bicim(bfSon.negatif)} TL/MWh`) && orn.includes(`= ${sayfa.bicim(bfSon.pozitif)} TL/MWh`) && orn.includes(`Negatif: max(100; ${sayfa.bicim(son.ptf)}; ${sayfa.bicim(son.smf)})`) && orn.includes(`Pozitif: min(${sayfa.bicim(son.ptf)}; ${sayfa.bicim(son.smf)})`));
  ok('SSR ornek hesap: EPİAŞ degeriyle yan yana + uyum', orn.includes(`yayımladığı değerler: negatif ${sayfa.bicim(son.negatif)} TL/MWh, pozitif ${sayfa.bicim(son.pozitif)} TL/MWh. Formül sonucu yayımlanan değerlerle aynıdır.`));
}
{ // bugün, kısmi gün (tarihsiz, indekslenebilir sayfa)
  const { y, h } = await al('', { gun: (g) => sahteGun(g, 11) });
  const s = satirlar(h);
  ok('SSR kismi: 24 satir', s.length === 24);
  ok('SSR kismi: yayimlanan satir dolu', s[10].join('|') === '10:00–11:00|2.100,00|1.700,00|Enerji fazlası|1.598,00|2.163,00|502,00|63,00', `-> ${s[10].join('|')}`);
  ok('SSR kismi: yayimlanmamis hucreler "—", PTF korunur', s.slice(11).every((x) => x[1] !== '—' && x.slice(2).every((c) => c === '—')));
  ok('SSR kismi: uydurma 0,00 YOK', !s.some((x) => x.includes('0,00')));
  ok('SSR kismi: yayimlanmamis satirda veri ozniteligi de yok', /<tr data-bas="2026-11-24T20:00:00\+03:00" data-dk="60" data-ptf="2200"><th/.test(h));
  ok('SSR kismi: ozet 11 / 24, ortalamalar yalniz yayimlananlardan', idMetni(h, 'dYayim') === '11 / 24' && idMetni(h, 'dPtfOrt') === '2.050,00' && idMetni(h, 'dOzet').startsWith('24.11.2026 dengesizlik özeti (11/24 dönem): ortalama pozitif dengesizlik fiyatı ') && idMetni(h, 'dOzet').includes('ortalama PTF 2.050,00 TL/MWh;'));
  ok('SSR kismi: ozette "Son yayimlanan donem" (gun tamamlanmadi)', idMetni(h, 'dOzet').includes('Son yayımlanan dönem 10:00–11:00: pozitif dengesizlik fiyatı 1.598,00 TL/MWh, negatif dengesizlik fiyatı 2.163,00 TL/MWh, PTF 2.100,00 TL/MWh, SMF 1.700,00 TL/MWh, sistem yönü enerji fazlası. Veri: EPİAŞ Şeffaflık Platformu, 24.11.2026 14:30 (Türkiye saati) itibarıyla;') && idMetni(h, 'dOzet').endsWith(NOT_ORTALAMA));
  ok('SSR kismi: secenekler yayimlanmamis donemi belirtir, son yayimlanan secili', h.includes('<option value="2026-11-24T10:00:00+03:00" selected>10:00–11:00</option>') && h.includes('<option value="2026-11-24T20:00:00+03:00">20:00–21:00 (yayımlanmadı)</option>'));
  ok('SSR kismi: icinde bulunulan donem isaretli (14:00–15:00)', /<tr class="simdi" data-bas="2026-11-24T14:00:00\+03:00"/.test(h) && (govdeOf(h).match(/class="simdi"/g) || []).length === 1 && h.includes('<span class="sr-only"> (içinde bulunulan dönem)</span>'));
  ok('SSR tarihsiz: robots index, canonical tarihsiz, X-Robots-Tag yok', h.includes('<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">') && h.includes('<link rel="canonical" href="https://voltage.com.tr/dengesizlik-maliyeti">') && y.headers.get('X-Robots-Tag') === null);
  ok('SSR tarihsiz: title, aciklama, H1 degismez', h.includes('<title>Dengesizlik Maliyeti Hesaplama: Dengesizlik Fiyatı ve SMF</title>') && h.includes('<h1>Dengesizlik Maliyeti: Pozitif ve Negatif Dengesizlik Fiyatı</h1>') && h.includes(`<meta name="description" content="${/<meta name="description" content="([^"]*)">/.exec(KABUK)[1]}">`));
  ok('SSR bugun: sonraki gun baglantisi kapali', h.includes('<a class="btn-ikincil" id="dSonraki" rel="nofollow" aria-disabled="true">') && h.includes('id="dOnceki" rel="nofollow" href="/dengesizlik-maliyeti?tarih=2026-11-23">'));
  ok('SSR bugun: onbellek 60/300', y.headers.get('Cache-Control') === 'public, max-age=60, s-maxage=300, must-revalidate');
  ok('SSR tarihsiz JSON-LD: yalniz dateModified degisir (= cekim ani); kapsam ve adresler SABIT', tur(h, 'WebPage').dateModified === '2026-11-24T14:30:00+03:00' && tur(h, 'Dataset').dateModified === '2026-11-24T14:30:00+03:00' && tur(h, 'Dataset').temporalCoverage === '2026-01-01/..' && JSON.stringify(tur(h, 'Dataset').distribution) === JSON.stringify(tur(KABUK, 'Dataset').distribution) && tur(h, 'WebPage').url === 'https://voltage.com.tr/dengesizlik-maliyeti' && tur(h, 'WebPage').name === tur(KABUK, 'WebPage').name);
  ok('SSR kismi: ornek hesap son YAYIMLANAN donemden (10:00–11:00)', ornekOf(h).startsWith('Örnek hesap: 24.11.2026, 10:00–11:00'));
  ok('SSR kismi: HTML butun', butunluk(h));
}
{ // hiç dönem yayımlanmamış (gece yarısından hemen sonra): yalnız PTF
  const { h } = await al('', { gun: (g) => sahteGun(g, 0) });
  ok('SSR 0 yayim: tablo PTF ile basilir, gerisi "—"', satirlar(h).length === 24 && satirlar(h).every((x) => x[1] !== '—' && x.slice(2).every((c) => c === '—')));
  ok('SSR 0 yayim: ortalamalar "—" (0 DEGIL), sayac 0 / 24', idMetni(h, 'dYayim') === '0 / 24' && ['dPtfOrt', 'dSmfOrt', 'dMalPoz', 'dMalNeg', 'dYonAcik'].every((id) => idMetni(h, id) === '—'));
  ok('SSR 0 yayim: durust ozet cumlesi, ornek yok', idMetni(h, 'dOzet').startsWith('24.11.2026 için EPİAŞ henüz dengesizlik fiyatı yayımlamadı.') && h.includes('<div class="ornek" id="dOrnek"></div>'));
}
{ // eşik altı ve tavan dalları örnek hesapta; EPİAŞ değeri farklıysa gizlenmez
  const tek = (o) => ({ gun: (g) => [{ date: `${g}T05:00:00+03:00`, time: '05:00', ...o }] });
  let { h } = await al('?tarih=2026-11-23', tek({ ptf: 450, smf: 60, positiveImbalance: -106, negativeImbalance: 463.5, systemStatus: 'Enerji Fazlası' }));
  let orn = ornekOf(h);
  ok('SSR ornek: esik alti dali', orn.includes('Pozitif: min(450,00; 60,00) = 60,00 < V (100) olduğu için (−1) × 100 × (1 + 0,06) = −106,00 TL/MWh') && orn.includes('Negatif: max(100; 450,00; 60,00) × (1 + 0,03) = 463,50 TL/MWh'), `-> ${orn}`);
  ok('SSR ornek: birim dengesizlik maliyeti satiri', orn.includes("Birim dengesizlik maliyeti (PTF'ye göre, EPİAŞ fiyatlarıyla): negatif 463,50 − 450,00 = 13,50 TL/MWh; pozitif 450,00 − (−106,00) = 556,00 TL/MWh"), `-> ${orn}`);
  ok('SSR tablo: eksi fiyat gercek eksi isaretiyle', satirlar(h)[5][4] === '−106,00' && satirlar(h)[5][6] === '556,00');
  ok('SSR seyrek veri: 24 satira tamamlanir, digerleri "—"', satirlar(h).length === 24 && satirlar(h)[4].slice(1).every((c) => c === '—'));
  ({ h } = await al('?tarih=2026-11-23', tek({ ptf: 4500, smf: 4500, positiveImbalance: 4365, negativeImbalance: 5008.5, systemStatus: 'Enerji Açığı' })));
  orn = ornekOf(h);
  ok('SSR ornek: tavan dali', orn.includes('Negatif: max(PTF; SMF) = AFL olduğu için 4.500 × 1,05 × (1 + 0,06) = 5.008,50 TL/MWh'), `-> ${orn}`);
  ({ h } = await al('?tarih=2026-11-23', tek({ ptf: 2800, smf: 3400, positiveImbalance: 2716, negativeImbalance: 3610.25, systemStatus: 'Enerji Açığı' })));
  orn = ornekOf(h);
  ok('SSR ornek: EPİAŞ degeri formulden farkliysa ACIKCA yazilir', orn.includes("Formül sonucu ile yayımlanan değer arasında fark vardır (negatif 6,25 TL/MWh, pozitif 0,00 TL/MWh). Tabloda EPİAŞ'ın yayımladığı değer gösterilir.") && satirlar(h)[5][5] === '3.610,25', `-> ${orn}`);
  ({ h } = await al('?tarih=2026-11-23', tek({ ptf: 2800, smf: 3400, positiveImbalance: 2716, negativeImbalance: 3604, systemStatus: '' })));
  ok('SSR ornek: sistem yonu yoksa ornek YOK (yon tahmin edilmez)', h.includes('<div class="ornek" id="dOrnek"></div>') && satirlar(h)[5][3] === '—');
}
{ // eski tarih: uzun önbellek; V = 150 kuralı örnekte
  const { y, h } = await al('?tarih=2026-03-10');
  ok('SSR eski gun: onbellek 300/3600', y.headers.get('Cache-Control') === 'public, max-age=300, s-maxage=3600, must-revalidate');
  ok('SSR eski gun (Ocak-Ekim): formule dayali icerik YOK, tablo EPİAŞ degerleriyle', h.includes('<div class="ornek" id="dOrnek"></div>') && satirlar(h).length === 24 && !govdeOf(h).includes('†') && h.includes('<p class="note fark-not" id="dFarkNot"></p>'));
  ok('SSR eski gun: V = 150 notu', idMetni(h, 'dKuralUyari') === 'Bu tarihte V değeri 150 TL/MWh idi; aşağıdaki yöntem bölümü 1 Kasım 2026 ve sonrasında uygulanan değerleri anlatır.');
  const ilk = await al('?tarih=2026-01-01');
  ok('SSR ilk gun: onceki gun baglantisi kapali', ilk.h.includes('<a class="btn-ikincil" id="dOnceki" rel="nofollow" aria-disabled="true">') && ilk.h.includes('id="dBas" name="bas" min="2026-01-01" max="2026-11-24" value="2026-01-01" required>'));
}
{ // 15 dakikalık seri: 96 satır
  const { h } = await al('?tarih=2026-11-23', { gun: (g) => sahteGun(g, 60, 15) });
  const s = satirlar(h);
  ok('SSR 96 donem: 96 satir', s.length === 96 && s[1][0] === '00:15–00:30' && s[95][0] === '23:45–24:00');
  ok('SSR 96 donem: ozet 60 / 96', idMetni(h, 'dYayim') === '60 / 96' && /data-dk="15"/.test(h));
}
{ // bayat veri: SON SENKRON
  const { ctx, e } = sayfaCtx('', { gun: (g) => sahteGun(g, 9) });
  await sayfa.onRequestGet(ctx);
  e.ilerlet(7 * 60 * 1000); e.ayar.raporDurum = 500;
  const y = await sayfa.onRequestGet({ ...ctx, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti') });
  const h = await y.text();
  ok('SSR bayat: SON SENKRON + ilk cekim zamani', idMetni(h, 'dMod') === 'SON SENKRON' && h.includes('<span class="live-stamp stale" id="dDamga">SON SENKRON <time datetime="2026-11-24T14:30:00+03:00">24.11.2026 14:30</time></span>') && h.includes('data-bayat="1"'));
  ok('SSR bayat: veri duruyor, kisa onbellek', satirlar(h).length === 24 && idMetni(h, 'dYayim') === '9 / 24' && y.headers.get('Cache-Control') === 'public, max-age=30, s-maxage=60, must-revalidate');
}
// geçersiz tarih: bugünün sayfası + görünür uyarı (HTTP 200), girdi sayfaya yansımaz
for (const kotu of ['abc', '2026-11-25', '2025-12-31', '2026-02-30', '', '%3Cscript%3Ealert(1)%3C/script%3E', '%22%3E%3Cimg%20src=x%3E', '2027-01-01']) {
  const { y, h } = await al('?tarih=' + kotu, { gun: (g) => sahteGun(g, 5) });
  ok(`SSR gecersiz tarih (${kotu}): 200 + uyari + bugun`, y.status === 200 && idMetni(h, 'dUyari') === 'Adresteki tarih geçerli değil ya da seçilebilir aralığın dışında. Bugünün verisi gösteriliyor. Seçilebilir aralık: 01.01.2026 – 24.11.2026.' && idMetni(h, 'dGun') === '24.11.2026' && satirlar(h).length === 24);
  ok(`SSR gecersiz tarih (${kotu}): noindex, canonical tarihsiz, girdi yansimaz`, h.includes('<meta name="robots" content="noindex, follow">') && y.headers.get('X-Robots-Tag') === 'noindex, follow' && h.includes('<link rel="canonical" href="https://voltage.com.tr/dengesizlik-maliyeti">') && !h.includes('alert(1)') && !h.includes('<img') && !h.includes('src=x'));
}
{ // ?veriyok: SSR atlanır
  const { y, h, e } = await al('?veriyok');
  ok('?veriyok: kabuk aynen, SSR yok, EPİAŞ\'a istek yok', h === KABUK && e.sayac.giris === 0 && y.status === 200);
  const v2 = await al('?tarih=2026-11-23&veriyok=1');
  ok('?veriyok tarihle birlikte de SSR atlar', v2.h === KABUK);
}
{ // 2027: tablo çalışır, doğrulanmamış kural gösterilmez
  const OCAK = Date.UTC(2027, 0, 5, 9, 0, 0);
  _bellekTemizle();
  const e = sahteEpias();
  e.an = OCAK;
  const sec = { fetch: e.fetch, simdi: e.simdi, cache: null };
  const h = await (await sayfa.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti'), env: SAHTE_ENV, secenek: sec, next: async () => new Response(KABUK, { status: 200 }) })).text();
  ok('2027: tablo EPİAŞ verisiyle basilir', satirlar(h).length === 24 && idMetni(h, 'dGun') === '05.01.2027');
  ok('2027: ornek hesap YOK (dogrulanmis kural yok)', h.includes('<div class="ornek" id="dOrnek"></div>') && !govdeOf(h).includes('†'));
  ok('2027: tablonun yaninda gorunur uyari', idMetni(h, 'dKuralUyari') === "Bu tarih için bu sayfada doğrulanmış bir dengesizlik fiyatı kuralı yok; tablo EPİAŞ'ın yayımladığı değerleri gösterir. 110. maddenin 1 Ocak 2027'den itibaren uygulanacak metni bu sayfada henüz doğrulanmamıştır.");
  const j = await (await veriUcu.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2027-01-05'), env: SAHTE_ENV, secenek: sec })).json();
  ok('2027: veri ucu kural bildirmez (kurallar: [])', Array.isArray(j.kurallar) && j.kurallar.length === 0 && j.donemler.length === 24);
}
{ // dayanıklılık matrisi (canli-ptf ile aynı)
  const temel = sayfaCtx('').ctx;
  let y = await sayfa.onRequestGet({ ...temel, next: async () => new Response('yok', { status: 404 }) });
  ok('varlik 404 -> 404 aynen doner', y.status === 404);
  y = await sayfa.onRequestGet({ ...temel, next: async () => new Response(null, { status: 301, headers: { Location: '/dengesizlik-maliyeti' } }) });
  ok('301 aynen doner (yonlendirme dongusu uretmez)', y.status === 301 && y.headers.get('Location') === '/dengesizlik-maliyeti');
  let n = 0;
  y = await sayfa.onRequestGet({ ...temel, next: async () => { n++; if (n === 1) throw new Error('binding gone'); return new Response(KABUK, { status: 200 }); } });
  ok('next() firlatirsa sayfa AYAKTA kalir', y.status === 200 && (await y.text()) === KABUK);
  y = await sayfa.onRequestGet({ ...temel, next: async () => { throw new Error('kalici'); } });
  ok('kalici hatada 503 (500 patlamasi degil)', y.status === 503);
  y = await sayfa.onRequestGet({ ...temel, next: async () => null });
  ok('next() null donerse 503', y.status === 503);
  y = await sayfa.onRequestGet({ ...temel, next: async () => new Response('<html><body>bambaska kabuk</body></html>', { status: 200 }) });
  ok('capalar yoksa HTML bozulmaz', y.status === 200 && (await y.text()).includes('bambaska kabuk'));
  y = await sayfa.onRequestGet({ ...temel, request: { url: 'gecersiz url' } });
  ok('bozuk istek -> kabuk (cokme yok)', y.status === 200 && (await y.text()) === KABUK);
  y = await sayfa.onRequestHead({ ...temel, next: async () => new Response(null, { status: 200, headers: { 'X-Kaynak': 'varlik' } }) });
  ok('HEAD varlik hattindan gecer (SSR yok)', y.status === 200 && y.headers.get('X-Kaynak') === 'varlik');
}
ok('M3 loglarinda sir yok', !loglar.some((l) => l.includes(SAHTE_ENV.EPIAS_PASSWORD) || /TGT-/.test(l)));


// ============================================================================
// M5 — SEO DOSYALARI VE KAPSAM SINIRLARI
// ============================================================================
{
  const kok = new URL('../../', import.meta.url);
  const oku = (ad) => readFileSync(new URL(ad, kok), 'utf8');
  const harita = oku('sitemap.xml');
  const giris = /<url>\s*<loc>https:\/\/voltage\.com\.tr\/dengesizlik-maliyeti<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>\s*<changefreq>(\w+)<\/changefreq>\s*<priority>[\d.]+<\/priority>\s*<\/url>/.exec(harita);
  ok('sitemap: /dengesizlik-maliyeti tek kayit', !!giris && (harita.match(/dengesizlik-maliyeti/g) || []).length === 1);
  ok('sitemap: lastmod = sayfa dateModified = gorunen tarih', !!giris && giris[1] === tur(KABUK, 'WebPage').dateModified && KABUK.includes(`Sayfa metni: ${giris[1].split('-').reverse().join('.')}`));
  ok('sitemap: changefreq hourly/daily', !!giris && ['hourly', 'daily'].includes(giris[2]));
  ok('sitemap: tarihli gorunum ya da veri ucu YOK', !/dengesizlik-maliyeti\?|dengesizlik-maliyeti\/veri/.test(harita));
  const llms = oku('llms.txt');
  const canli = llms.slice(llms.indexOf('## Canlı Veri'), llms.indexOf('## Kurallar'));
  ok('llms.txt: "Canlı Veri" altinda sayfa ve veri ucu', canli.includes('[Dengesizlik Maliyeti](https://voltage.com.tr/dengesizlik-maliyeti)') && canli.includes('`https://voltage.com.tr/dengesizlik-maliyeti/veri`'));
  ok('llms.txt: parametreler ve alanlar belgeli', ['tarih=YYYY-AA-GG', 'bas=YYYY-AA-GG&bit=YYYY-AA-GG', 'bicim=json', '`csv`', '`xlsx`', '`ptf`', '`smf`', '`yon`', '`pozitif`', '`negatif`', '`maliyetPozitif`', '`maliyetNegatif`', '`cekildi`'].every((x) => canli.includes(x)));
  ok('llms.txt: durustluk kurali + kaynak', canli.includes('Yayımlanmamış değer `null`') && canli.includes('boş dosya üretilmez') && canli.includes('EPİAŞ') && canli.includes('mevzuatta tanımlı bir terim değildir'));
  ok('llms.txt: yasak ifade yok', !/en ucuz|tasarruf %|garanti/.test(canli.toLocaleLowerCase('tr')));
  // llms.txt'te belgelenen alanlar gerçekten uçta var
  const ornekJson = await (await veriUcu.onRequestGet(ucCtx('?tarih=2026-11-23').ctx)).json();
  ok('llms.txt alan adlari = uc alan adlari', ['bas', 'bit', 'dk', 'ptf', 'smf', 'yon', 'pozitif', 'negatif', 'maliyetPozitif', 'maliyetNegatif'].every((a) => a in ornekJson.donemler[0] && canli.includes('`' + a + '`')) && ['birim', 'cekildi', 'bayat', 'ozet', 'kurallar', 'atif', 'not'].every((a) => a in ornekJson && canli.includes('`' + a + '`')));
  // _headers: sayfa ve uç için kural YOK (fonksiyon kendi önbellek penceresini seçer)
  const basliklar = oku('_headers').split('\n').filter((l) => !l.startsWith('#'));
  ok('_headers: /dengesizlik-maliyeti icin kural yok (yalniz yorum)', !basliklar.some((l) => l.includes('dengesizlik')) && oku('_headers').includes('# Dengesizlik Maliyeti'));
  ok('_headers: kok guvenlik kurali duruyor', basliklar.some((l) => l.startsWith('  Content-Security-Policy:') && l.includes("connect-src 'self'")));
  // robots / yönlendirmeler: sayfa ve uç taranabilir, iç dosyalar kapalı
  const robots = oku('robots.txt');
  ok('robots: sayfa ve veri ucu engelli degil', !/Disallow:\s*\/dengesizlik/.test(robots) && robots.includes('Disallow: /api/'));
  const yonlendirme = oku('_redirects');
  ok('_redirects: ic dosya kurallari duruyor, yeni yol yonlenmiyor', ['/docs/* / 302', '/lib/* / 302', '/tools/* / 302', '/.claude/* / 302'].every((k) => yonlendirme.includes(k)) && !yonlendirme.includes('dengesizlik'));
  // Kapsam: mevcut sayfalardan yeni sayfaya henüz bağlantı YOK (SEO deneyleri 10 Aralık'a kadar)
  const sayfalar = [...readdirSync(kok).filter((f) => f.endsWith('.html')), ...readdirSync(new URL('rehber/', kok)).map((f) => 'rehber/' + f)].filter((f) => f !== 'dengesizlik-maliyeti.html');
  const baglayan = sayfalar.filter((f) => oku(f).includes('dengesizlik-maliyeti'));
  ok('mevcut sayfalardan yeni sayfaya baglanti yok', sayfalar.length > 20 && baglayan.length === 0, `-> ${baglayan}`);
  // Fonksiyon kütüphaneleri rota üretmez (onRequest* dışa aktarmaz)
  for (const f of ['dengesizlik.js', 'epias.js', 'xlsx.js']) ok(`functions/_lib/${f} rota uretmez`, !/export\s+(async\s+)?function\s+onRequest|export\s+const\s+onRequest/.test(oku('functions/_lib/' + f)));
  // Sunulan dosyalarda uydurma veri / sır yok
  for (const f of ['dengesizlik-maliyeti.html', 'functions/dengesizlik-maliyeti.js', 'functions/dengesizlik-maliyeti/veri.js', 'functions/_lib/dengesizlik.js', 'functions/_lib/epias.js', 'functions/_lib/xlsx.js']) {
    const m = oku(f);
    ok(`${f}: test verisi / sahte kimlik / telefon yok`, !m.includes('sahteGun') && !m.includes('test-parola') && !/TGT-\d/.test(m) && !/479\s*05\s*10/.test(m));
  }
  ok('kimlik yalniz env\'den okunur', (oku('functions/_lib/epias.js').match(/EPIAS_PASSWORD/g) || []).length >= 2 && !/EPIAS_(USERNAME|PASSWORD)\s*[:=]\s*['"]/.test(oku('functions/_lib/epias.js')) && !/console\.(log|error)\([^)]*(tgt|EPIAS_|govde|metin)/i.test(oku('functions/_lib/epias.js')));
}

// ============================================================================
// REVİZYON 1 / B–F — hesaplayıcı işaretlemesi, gösterge adı, SEO, hukuk metinleri
// ============================================================================
{
  // Çapalar: sunucu render'ının aradığı HER dizgi kabukta tam bir kez olmalı (sessiz geçiş yok)
  for (const [ad, capa] of Object.entries(sayfa.CAPA)) ok(`capa "${ad}" kabukta tam bir kez`, KABUK.split(capa).length - 1 === 1, `-> ${KABUK.split(capa).length - 1} kez`);
  ok('capa sayisi (yeni capa eklenince bu test de genisler)', Object.keys(sayfa.CAPA).length >= 38);

  // D4 başlıklar
  const h2 = [...KABUK.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => coz(m[1]));
  ok('H2 basliklari (revizyon)', JSON.stringify(h2) === JSON.stringify(['Dönem bazında PTF, SMF, pozitif ve negatif dengesizlik fiyatı', 'Dengesizlik maliyeti hesaplama', 'Dengesizlik fiyatı formülü ve hesaplama yöntemi', 'Kapsam ve sınırlar', 'Kaynak ve dayanak', 'Sık sorulan sorular', 'İlgili sayfalar']), `-> ${JSON.stringify(h2)}`);
  const yontem = /<h2 id="yontem">[\s\S]*?<h2 id="kapsam">/.exec(KABUK)[0];
  const h3 = [...yontem.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((m) => coz(m[1]));
  ok('yontem H3 basliklari (revizyon)', JSON.stringify(h3) === JSON.stringify(['Negatif dengesizlik fiyatı formülü', 'Pozitif dengesizlik fiyatı formülü', 'k ve l katsayıları (2026)', 'V, B ve azami fiyat limiti (AFL)', "Birim dengesizlik maliyeti (PTF'ye göre)"]), `-> ${JSON.stringify(h3)}`);
  ok('"SMF nedir" basligi ACILMADI', !/<h[23][^>]*>[^<]*SMF nedir/i.test(KABUK));
  // D2 giriş
  ok('giris: iki paragraf (revizyon metni)', KABUK.includes("<p class=\"lede\"><strong>Dengesizlik maliyeti</strong>, dengesizliğe düşen 1 MWh enerjinin PTF'ye göre ne kadar farklı fiyatlandığını TL/MWh olarak gösteren bir göstergedir.") && KABUK.includes("SMF, ilgili dönemi izleyen en geç dört saat içinde piyasa katılımcılarına duyurulduğu için henüz yayımlanmamış dönemler boş kalır. Saatler Türkiye saatiyledir (UTC+03:00); tüm fiyatlar TL/MWh'tir.</p>") && KABUK.includes("Piyasa Takas Fiyatı'nı (PTF), Sistem Marjinal Fiyatı'nı (SMF)"));
  // C bant
  const bant = coz(/<section class="live"[\s\S]*?<\/section>/.exec(KABUK)[0]);
  ok('bant etiketleri (revizyon)', ['Ort. PTF · yayımlanan dönemler', 'Ort. SMF · yayımlanan dönemler', "Ort. pozitif dengesizlik maliyeti · PTF'ye göre", "Ort. negatif dengesizlik maliyeti · PTF'ye göre", 'Kaynak: EPİAŞ Şeffaflık Platformu · Aritmetik (ağırlıksız) ortalama, yalnız yayımlanan dönemler'].every((x) => bant.includes(x)));
  // C tanımlar
  ok('birim dengesizlik maliyeti tanimlari (revizyon metni)', yontem.includes("<p>Negatif dengesizlik maliyeti = negatif dengesizlik fiyatı − PTF. Eksik kalan 1 MWh'in, gün öncesi piyasasında PTF'den alınmış olmasına göre ek maliyetidir (TL/MWh).</p>") && yontem.includes("<p>Pozitif dengesizlik maliyeti = PTF − pozitif dengesizlik fiyatı. Fazla kalan 1 MWh'in, PTF'den satılmış olmasına göre gelir kaybıdır (TL/MWh).</p>") && yontem.includes(NOT_ORTALAMA));
  ok('eski gosterge adi kalmadi', !/PTF'ye göre maliyet \((pozitif|negatif)\)/.test(KABUK) && !KABUK.includes("\"PTF'ye göre maliyet\""));
  // D5 / D6
  ok('katsayi tablosu basligi (revizyon)', coz(/<table class="kucuk" id="dKatsayi">\s*<caption>([\s\S]*?)<\/caption>/.exec(KABUK)[1]) === 'k ve l katsayıları · 14030 sayılı Kurul Kararı · 1 Ocak 2026 teslim gününden itibaren · 24.11.2026 itibarıyla');
  const par = coz(/<table class="kucuk" id="dSabit">([\s\S]*?)<\/table>/.exec(KABUK)[1]);
  ok('parametre tablosu: "Parametre", B gecerliligi, 14459 RG sayisi', par.startsWith('Parametreler:') && par.includes('ParametreDeğerGeçerlilikDayanak') && par.includes("B100 TL/MWh1 Ocak 2026'dan itibaren") && par.includes('14459 sayılı Kurul Kararı (RG 3/4/2026-33213)') && !/Sabit/.test(par));
  ok('parametre aciklamasi (revizyon metni)', yontem.includes("<p>V ve B, Kurul Kararıyla belirlenen birim fiyatlardır (DUY m.110(2)). V, negatif dengesizlik fiyatında alt sınır girdisidir; pozitif dengesizlikte eşiktir. B, min(PTF; SMF) V'nin altına indiğinde pozitif dengesizlik fiyatını belirler. AFL, azami fiyat limitidir.</p>"));
  ok('ATIF ve gorunen atif 14459 RG sayisini tasir', ATIF.includes('14459 sayılı Kurul Kararı (RG 3/4/2026-33213)') && TAVANLAR[0].kaynak.endsWith('(RG 3/4/2026-33213)'));
  // E hukuk metinleri
  ok('R1(a) yontem girisi', yontem.includes("<p>Enerji dengesizlik tutarı, Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği'nin (DUY) 110. maddesindeki formüllerle hesaplanır; aşağıdaki birim fiyatlar bu formüllerden okunur. Formüller ve değerler <strong>1 Kasım 2026 teslim gününden itibaren uygulanan ve 24 Kasım 2026 tarihinde yürürlükte olan</strong> metne göredir. Katsayılar ve sabitler Kurul kararıyla değiştirilebilir; değişiklik olduğunda bu sayfa güncellenir.</p>"));
  ok('D13 PTF rehberi baglantisi; ticari sayfaya baglanti yok', yontem.includes(`<p>SMF'nin ne olduğunu ve PTF'den farkını <a href="/rehber/ptf-nedir">PTF nedir rehberinde</a> anlattık.</p>`) && !/href="\/(sanayi-elektrik-tedariki|\?kaynak|#leadForm|#iletisim)/.test(KABUK));
  ok('R1(e) 2027 metni dogrulanmadi cumlesi', yontem.includes("31 Aralık 2026'dan sonraki teslim günleri için bu sayfada kural gösterilmez. 110. maddenin 1 Ocak 2027'den itibaren uygulanacak metni bu sayfada henüz doğrulanmamıştır."));
  ok('A2 "24 Kasim 2026 itibariyla saat basina tek SMF"', yontem.includes("24 Kasım 2026 itibarıyla saat başına tek SMF bulunduğu için ikisi de o saatin SMF'sine eşittir.") && !yontem.includes('Bugün saat başına'));
  const kapsam = [.../<h2 id="kapsam">[\s\S]*?<\/ul>/.exec(KABUK)[0].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => coz(m[1]));
  ok('R5 kapsam ilk madde', kapsam[0] === "Bu sayfa, piyasa katılımcıları ve piyasayı izleyen profesyoneller için hazırlanmış bir bilgi aracıdır. Dengesizlik tutarı, piyasa işletmecisi ile dengeden sorumlu taraf arasında uzlaştırılır (DUY m.110(1)); son tüketicinin faturasına yansıyıp yansımayacağı tedarik sözleşmesine bağlıdır. Bu sayfa, Voltage Enerji'nin müşterilerine uyguladığı ya da uygulayacağı bir fiyatı, bedeli veya sözleşme koşulunu göstermez.");
  ok('kapsam: R5 ile yinelenen eski madde kaldirildi (7 madde)', kapsam.length === 7 && !kapsam.some((x) => x.startsWith('Dengesizlik tutarı, dengeden sorumlu taraf için')));
  ok('sitemap: cerez-politikasi lastmod = gorunen tarih; kullanim-kosullari degismedi', /<loc>https:\/\/voltage\.com\.tr\/cerez-politikasi<\/loc>\s*<lastmod>2026-11-25<\/lastmod>/.test(readFileSync(new URL('../../sitemap.xml', import.meta.url), 'utf8')) && /<loc>https:\/\/voltage\.com\.tr\/kullanim-kosullari<\/loc>\s*<lastmod>2026-11-13<\/lastmod>/.test(readFileSync(new URL('../../sitemap.xml', import.meta.url), 'utf8')) && readFileSync(new URL('../../cerez-politikasi.html', import.meta.url), 'utf8').includes('Son güncelleme: 25 Kasım 2026'));
  ok('istemci sayi okuyucu alana gore (fiyat / miktar)', KABUK.includes('function sayiOku(v, fiyat){') && KABUK.includes("sayiOku($(girdiId).value, false)") && KABUK.includes("sayiOku($(girdiId).value, true)"));
  ok('R3 grup ici degerlendirme', kapsam.includes('Dengeden sorumlu gruplarda grup üyesinin dengesizliği, Kurulun belirlediği dengesizlik oranı sınırı içinde grup içinde değerlendirilir; sınırı aşan kısım için tutar, üyenin bireysel dengesizliği üzerinden ayrıca hesaplanır (DUY m.111(5)). Bu sayfadaki tablo ve hesaplayıcı grup içi değerlendirmeyi içermez.'));
  ok('R4 KÜPST', kapsam.includes("Kesinleşmiş günlük üretim/tüketim programından sapma tutarı (KÜPST) ayrı bir kalemdir (DUY m.110(3)) ve bu sayfadaki fiyatlara dahil değildir. 14907 sayılı Kurul Kararı (RG 19/10/2026-33405), tüketim kapsamında oluşturulan uzlaştırmaya esas veriş-çekiş birimleri için belirlediği katsayı ve toleransların 1 Ocak 2027'den itibaren uygulanmasını öngörür; bu tutarın muhatabı ilgili piyasa katılımcısıdır."));
  ok('"plan sapma bedeli" ve "netlestirme" ifadesi kalmadi', !/plan(ından)? sapma bedeli/i.test(KABUK) && !/netleştirme/i.test(KABUK));
  ok('R6(a) kaynak paragrafi', KABUK.includes(`<p>Bu sayfadaki verinin kaynağı <a href="https://seffaflik.epias.com.tr/" rel="noopener">EPİAŞ Şeffaflık Platformu</a>'dur. Tablo düzeni, özet, türetilmiş "birim dengesizlik maliyeti (PTF'ye göre)" göstergesi ve hesaplayıcı Voltage Enerji tarafından hazırlanmıştır. EPİAŞ Şeffaflık Platformu, sunduğu içerik ve verilerin kaynak gösterilmek suretiyle çoğaltılabileceğini ve kullanılabileceğini, bu verilerden doğabilecek kayıp ve zararlardan sorumluluk kabul etmediğini belirtir (24 Kasım 2026 itibarıyla). Bu veriyi kullanırken kaynağı "EPİAŞ Şeffaflık Platformu" olarak gösterin; bu sayfaya da kaynak göstererek atıfta bulunabilirsiniz. Atıf için:</p>`) && !KABUK.includes('sorumluluk kullanan tarafa aittir'));
  ok('R9 hata bildirimi', KABUK.includes('Veride ya da metinde hata olduğunu düşünüyorsanız <a href="mailto:info@voltage.com.tr">info@voltage.com.tr</a> adresine bildirin; düzeltmeler bu sayfada tarihiyle belirtilir.'));
  const sssR = [.../<div id="dSss">([\s\S]*?)<\/div>/.exec(KABUK)[1].matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [coz(m[1]), coz(m[2])]);
  const yanit = (soru) => sssR.find((x) => x[0] === soru)[1];
  ok('R1(b) SSS formul yaniti basi ve sonu', yanit('Pozitif ve negatif dengesizlik fiyatı nasıl hesaplanır?').startsWith('24 Kasım 2026 tarihinde yürürlükte olan kurallara göre, 1 Kasım 2026 teslim gününden itibaren negatif dengesizlik birim fiyatı') && yanit('Pozitif ve negatif dengesizlik fiyatı nasıl hesaplanır?').endsWith("AFL 4.500 TL/MWh'tir; bu değerler Kurul kararıyla değiştirilebilir. Bu sayfa 31 Aralık 2026'dan sonraki teslim günleri için kural göstermez."));
  ok('SSS sistem yonu yaniti (revizyon)', yanit('Sistem yönü neyi değiştirir?').includes('Sistem yönü k ve l katsayılarını belirler. 24 Kasım 2026 itibarıyla, sistem enerji açığı yönündeyken') && yanit('Sistem yönü neyi değiştirir?').includes("Enerji fazlası yönündeyken k 0,03, l 0,06'dır (14030 sayılı Kurul Kararı)."));
  ok('SSS k/l yaniti (revizyon metni)', yanit('k ve l katsayıları kaçtır?') === "24 Kasım 2026 itibarıyla yürürlükteki değerler şöyledir: sistem enerji açığı yönündeyse k 0,06 ve l 0,03; enerji fazlası yönündeyse k 0,03 ve l 0,06; sistem dengedeyse ikisi de 0,03'tür. k negatif dengesizlikte, l pozitif dengesizlikte kullanılır. Dayanak 11/12/2025 tarihli ve 14030 sayılı Kurul Kararı'dır; değerler 1 Ocak 2026 teslim gününden itibaren uygulanır ve Kurul kararıyla değiştirilebilir. Bu sayfa 31 Aralık 2026 teslim gününe kadar olan dönemi kapsar.");
  ok('SSS kesinlik yaniti son cumle', yanit('Bu rakamlar kesin mi?').endsWith('Hesaplayıcının sonuçları tahminidir; yatırım, ticari karar ya da hukuki tavsiye, teklif ya da taahhüt değildir.'));
  // B hesaplayıcı işaretlemesi
  ok('B6 hesaplayici girisi (KÜPST)', KABUK.includes('dengeden sorumlu grup içi değerlendirmeyi ve kesinleşmiş günlük üretim/tüketim programından sapma tutarını (KÜPST) içermez.</p>'));
  ok('B9 yon secenekleri tek kalip', KABUK.includes('<span>Negatif (eksik verdim ya da fazla çektim)</span>') && KABUK.includes('<span>Pozitif (fazla verdim ya da az çektim)</span>'));
  ok('B10 Hesapla dugmeleri JS yokken pasif + noscript notu', (KABUK.match(/<button type="submit" class="btn" disabled>Hesapla<\/button>/g) || []).length === 2 && /<noscript><p[^>]*>Hesaplayıcı JavaScript gerektirir; JavaScript kapalıyken "Hesapla" düğmeleri kapalıdır\./.test(KABUK));
  ok('B2 kapali notu "Bugun icin"', KABUK.includes('Bugün için doğrulanmış bir dengesizlik fiyatı kuralı bulunmadığından "Kendi senaryom" hesabı kapalıdır.'));
  ok('F "Tarih araligini indir"', KABUK.includes('>Tarih aralığını indir</span>') && !KABUK.includes('Tarih aralığı indir'));
  ok('istemci: localStorage/uc kaydi dogrulanmadan innerHTML\'e girmez', KABUK.includes('function donemKur(o){') && KABUK.includes("if(!o || typeof o.bas !== 'string' || !BAS_RE.test(o.bas)") && KABUK.includes('function dogrula(donemler, tarih){'));

  // Kütüphane: kural dilimleri, formül farkı
  const dl = kuralDilimleri();
  ok('kuralDilimleri: 3 dilim, bitisik, ayirt edilir', dl.length === 3 && dl.map((x) => `${x.bas}|${x.bit}|${x.V}|${x.AFL}`).join(' ') === '2026-01-01|2026-04-03|150|null 2026-04-04|2026-10-31|150|4500 2026-11-01|2026-12-31|100|4500' && dl.every((x, i) => i === 0 || gunEkle(dl[i - 1].bit, 1) === x.bas));
  ok('formulGoster yalniz 1 Kasim 2026+ diliminde', kuralBul('2026-10-31').formulGoster === false && kuralBul('2026-11-01').formulGoster === true && kuralBul('2026-12-31').formulGoster === true);
  const dA = { dk: 60, ptf: 2800, smf: 3400, yon: 'acik', pozitif: 2716, negatif: 3604 };
  ok('formulFarki: ayni deger -> false; 0,01 icinde -> false; ustunde -> true', formulFarki(dA, K) === false && formulFarki({ ...dA, negatif: 3604.01 }, K) === false && formulFarki({ ...dA, negatif: 3604.02 }, K) === true && formulFarki({ ...dA, pozitif: 2715.9 }, K) === true);
  ok('formulFarki: Ocak-Ekim, 2027, 15 dk, eksik veri -> false (iddia yok)', formulFarki({ ...dA, negatif: 9999 }, K_OCAK) === false && formulFarki({ ...dA, negatif: 9999 }, null) === false && formulFarki({ ...dA, dk: 15, negatif: 9999 }, K) === false && formulFarki({ ...dA, yon: null, negatif: 9999 }, K) === false && formulFarki({ ...dA, smf: null, negatif: 9999 }, K) === false);
}
{ // C: dönem bazında tutarlılık (†) — sunucu render'ı
  uyarilar.length = 0;
  const fark = (g) => sahteGun(g).map((o, i) => (i === 5 || i === 9 ? { ...o, negativeImbalance: o.negativeImbalance + 6.25 } : o));
  let { h } = await al('?tarih=2026-11-23', { gun: fark });
  ok('† formulden farkli satirlar isaretli (2 donem)', (govdeOf(h).match(/<span class="fark" aria-hidden="true"> †<\/span><span class="sr-only"> \(yayımlanan fiyat formül sonucundan farklı\)<\/span>/g) || []).length === 2 && /data-bas="2026-11-23T05:00:00\+03:00"[^>]*><th scope="row">05:00–06:00<span class="fark"/.test(h) && !/data-bas="2026-11-23T06:00:00\+03:00"[^>]*><th scope="row">06:00–07:00<span class="fark"/.test(h));
  ok('† tablo alti notu (revizyon metni)', idMetni(h, 'dFarkNot') === "† 2 dönemde EPİAŞ'ın yayımladığı fiyat, bu sayfadaki formül sonucundan farklıdır; tabloda EPİAŞ değeri gösterilir.");
  ok('† tabloda EPİAŞ degeri gosterilir (formul sonucu degil)', satirlar(h)[5][5] === sayfa.bicim(sahteGun('2026-11-23')[5].negativeImbalance + 6.25));
  ok('† yapilandirilmis tek satir gunluk: yalniz sayac ve tarih', uyarilar.length === 1 && uyarilar[0] === '{"olay":"dengesizlik-formul-farki","tarih":"2026-11-23","donem":2}');
  uyarilar.length = 0;
  ({ h } = await al('?tarih=2026-03-10', { gun: fark }));
  ok('† Ocak-Ekim gununde karsilastirma YOK', !govdeOf(h).includes('†') && idMetni(h, 'dFarkNot') === '' && uyarilar.length === 0);
  ({ h } = await al('?tarih=2026-11-23', { gun: (g) => sahteGun(g, 96, 15).map((o) => ({ ...o, negativeImbalance: o.negativeImbalance === null ? null : o.negativeImbalance + 50 })) }));
  ok('15 dk veride † ve ornek hesap YOK; not gosterilir (SMF_N/SMF_P varsayimi yok)', !govdeOf(h).includes('†') && ornekOf(h) === 'Bu günün verisi 15 dakikalık dönemlerle yayımlanmış; örnek hesap yalnızca saatlik dönemli günlerde gösterilir.' && uyarilar.length === 0);
  // geçersiz tarih + veri yok: "Bugünün verisi gösteriliyor" DENMEZ
  const g2 = await al('?tarih=abc', {}, {});
  ok('gecersiz tarih + veri yok: uyari "Bugunun verisi gosteriliyor" demez', idMetni(g2.h, 'dUyari') === 'Adresteki tarih geçerli değil ya da seçilebilir aralığın dışında. Seçilebilir aralık: 01.01.2026 – 24.11.2026.' && g2.h.includes('<meta name="robots" content="noindex, follow">'));
  // bekleme hâlinde indirme pasif, dönem seçici bekliyor
  const b2 = await al('', {}, {});
  ok('bekleme: indirme pasif + neden gorunur; donem secici "Veri bekleniyor"', b2.h.includes('<a class="btn-ikincil" id="dCsv" rel="nofollow" aria-disabled="true">CSV</a>') && b2.h.includes('<span class="indir-not" id="dIndirNot">Veri alınamadığı için indirme şu an kapalı</span>') && b2.h.includes('<select id="hDonem"><option value="">Veri bekleniyor</option></select>'));
}
{ // D11: uç, tarayıcıdan doğrudan açılırsa küçük HTML hata sayfası döner
  const htmlIstek = (sorgu, env = SAHTE_ENV, ayar = {}) => { const { sec } = yeni(ayar); return veriUcu.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri' + sorgu, { headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } }), env, secenek: sec }); };
  let r5 = await htmlIstek('?bas=2026-10-01&bit=2026-11-24&bicim=csv');
  let t5 = await r5.text();
  ok('uc HTML hata sayfasi (400): durum ayni, Turkce mesaj, geri baglanti', r5.status === 400 && r5.headers.get('Content-Type') === 'text/html; charset=utf-8' && t5.includes('<h1>Veri indirilemedi</h1>') && t5.includes('Tek istekte en çok 31 gün indirilebilir.') && t5.includes('<a href="/dengesizlik-maliyeti">') && t5.includes('<html lang="tr">') && r5.headers.get('Cache-Control') === 'no-store' && r5.headers.get('X-Robots-Tag') === 'noindex');
  r5 = await htmlIstek('?tarih=2026-11-23&bicim=xlsx', {});
  t5 = await r5.text();
  ok('uc HTML hata sayfasi (503): ham JSON govdesi gosterilmez', r5.status === 503 && t5.includes('Veri bağlantısı henüz yapılandırılmadı.') && !t5.includes('{"hata"') && r5.headers.get('Retry-After') === '60' && r5.headers.get('Content-Disposition') === null);
  r5 = await htmlIstek('?tarih=%3Cscript%3Ealert(1)%3C/script%3E');
  t5 = await r5.text();
  ok('uc HTML hata sayfasi: girdi yansimaz', r5.status === 400 && !t5.includes('alert(1)') && !t5.includes('<script'));
  r5 = await htmlIstek('?tarih=2026-11-23&bicim=csv');
  ok('uc Accept text/html + veri var: dosya normal doner', r5.status === 200 && r5.headers.get('Content-Type') === 'text/csv; charset=utf-8');
  const { sec } = yeni();
  r5 = await veriUcu.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=abc', { headers: { Accept: '*/*' } }), env: SAHTE_ENV, secenek: sec });
  ok('uc Accept */* (ajan, curl): hata JSON kalir', r5.status === 400 && r5.headers.get('Content-Type').startsWith('application/json'));
}
{ // E / R8: mevcut yasal metinlerde YALNIZ istenen değişiklikler
  const kok = new URL('../../', import.meta.url);
  const cerez = readFileSync(new URL('cerez-politikasi.html', kok), 'utf8');
  const kosul = readFileSync(new URL('kullanim-kosullari.html', kok), 'utf8');
  ok('R8 cerez politikasi: onbellek anahtari listede', cerez.includes('(<code>voltage-ptf-cache</code>, <code>voltage-ptf-cache-page</code>, <code>voltage-dengesizlik-onbellek</code>)') && cerez.includes('EPİAŞ piyasa verisi (PTF, SMF, sistem yönü, dengesizlik fiyatı)') && !cerez.includes('voltage-serit-durdu'));
  ok('R8 cerez politikasindaki anahtar = istemcideki anahtar', KABUK.includes("var ONBELLEK = 'voltage-dengesizlik-onbellek';"));
  ok('R8 kullanim kosullari cumlesi (revizyon metni)', kosul.includes("<li>Sitede gösterilen piyasa verileri (PTF, SMF, sistem yönü, pozitif ve negatif dengesizlik fiyatı) EPİAŞ Şeffaflık Platformu kaynaklıdır ve bilgilendirme amaçlıdır; gecikmeli, eksik veya hatalı olabilir. Sitedeki hesaplayıcıların sonuçları tahminidir. İşlem kararları için EPİAŞ'ın resmî yayınları ve uzlaştırma bildirimleri esas alınmalıdır.</li>"));
  ok('R8 yasal sayfalardan yeni sayfaya baglanti yok', !cerez.includes('dengesizlik-maliyeti') && !kosul.includes('dengesizlik-maliyeti'));
  // D12 llms.txt
  const llms = readFileSync(new URL('llms.txt', kok), 'utf8');
  ok('D12 llms.txt eki (revizyon metni)', llms.includes("24 Kasım 2026 itibarıyla: k/l enerji açığında 0,06/0,03, enerji fazlasında 0,03/0,06, dengede 0,03/0,03 (Kurul Kararı 14030); V 100 TL/MWh (1 Kasım 2026'dan itibaren, Kurul Kararı 14911), B 100 TL/MWh, azami fiyat limiti 4.500 TL/MWh (Kurul Kararı 14459). Bu değerler Kurul kararıyla değiştirilebilir. Günün ortalama pozitif ve negatif dengesizlik fiyatı sayfadaki tarihli özet cümlesinde ve JSON'da `ozet.pozitifOrt`, `ozet.negatifOrt` alanlarındadır."));
  ok('D12 llms.txt: CORS ifadesi yok, yeni gosterge adi', !/CORS|Access-Control/i.test(llms) && llms.includes("birim dengesizlik maliyeti (PTF'ye göre)") && !llms.includes("PTF'ye göre maliyet ("));
}

console.error = gercekHata;
console.warn = gercekUyari;
rmSync(gecici, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
