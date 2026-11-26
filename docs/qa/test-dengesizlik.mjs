// /dengesizlik-maliyeti — saf mantık, piyasa verisi istemcisi (proxy), veri ucu ve sunucu render'ı testleri.
// Çalıştırma: node docs/qa/test-dengesizlik.mjs   (ağ gerekmez; proxy taklit edilir)
//
// !!! BU DOSYADAKİ TÜM FİYATLAR UYDURMA TEST VERİSİDİR. Gerçek piyasa değeri
// değildir, sayfada ya da herhangi bir yayında KULLANILMAZ.
import {
  KURALLAR, TAVANLAR, kuralBul, tavanBul, sayi, temiz, yonCoz, birimFiyat, piyasaCoz, anCoz,
  ozet, tarihGecerli, ymdGecerli, gunEkle, gunFarki, gunIzgarasi,
  yayimlandi, veriVar, donemEtiketi, istanbulBugun, istanbulDakika, ATIF, NOT_ORTALAMA, KURAL_DOGRULAMA, kuralDilimleri, formulFarki, dogrulanmisAraliklar, DOGRULAMA, YAYIM_ISTISNALARI, YAYIM_NOTLARI, yayimIstisnasi, _yayimIstisnaTablosu,
} from '../../functions/_lib/dengesizlik.js';
import { sahteGun, sahteProxy, sahteBaglama, sahteCache, isoTR, SABIT_AN, SAHTE_ENV } from './dengesizlik-test-verisi.mjs';
import { gunGetir, aralikGetir, _bellekTemizle, BUTCE, sayaclar, baglantiBul, _ANAHTAR_KOKU } from '../../functions/_lib/piyasa-istemci.js';
import { xlsxYaz, crc32, sutunHarfi } from '../../functions/_lib/xlsx.js';
import * as veriUcu from '../../functions/dengesizlik-maliyeti/veri.js';
import * as sayfa from '../../functions/dengesizlik-maliyeti.js';
import { uretimMi, robotsMetaOnizleme } from '../../functions/_lib/onizleme.js';
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
ok('tavan 2026-04-03 -> 3400 / 0 (Karar 13423)', tavanBul('2026-04-03').azami === 3400 && kuralBul('2026-04-03').AFL === 3400 && kuralBul('2026-04-03').asgari === 0 && /13423 sayılı Kurul Kararı \(RG 5\/4\/2025-32861\)/.test(tavanBul('2026-04-03').kaynak));
ok('tavan 2026-01-01 -> 3400 (tablonun basi)', kuralBul('2026-01-01').AFL === 3400 && tavanBul('2025-12-31') === null);
ok('tavan 2026-04-04 -> 4500 / 0', kuralBul('2026-04-04').AFL === 4500 && kuralBul('2026-04-04').asgari === 0);
ok('tavan kaynagi 14459 (4 Nisan 2026 ve sonrasi)', /14459/.test(tavanBul('2026-04-04').kaynak) && /14459/.test(tavanBul('2026-11-01').kaynak));
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
// Eski dönem: V = 150; 4/4/2026 öncesi AFL = 3.400 (Karar 13423) — tavan dalı uygulanır
const K_OCAK = kuralBul('2026-02-10');
ok('Ocak-Ekim V=150: 120 esik alti', bf(450, 120, 'fazla', K_OCAK).dalPozitif === 'esikAlti' && bf(450, 120, 'fazla').dalPozitif === 'genel');
ok('R4 2026-02-10 PTF = 3.400 (AFL): tavan dali 3.400 x 1,05 x (1 + 0,06) = 3.784,20', bf(3400, 3000, 'acik', K_OCAK).dalNegatif === 'tavan' && iki(bf(3400, 3000, 'acik', K_OCAK).negatif) === '3784.20');
ok('R4 2026-02-10 SMF = 3.400 fazla yonde: 3.400 x 1,05 x 1,03 = 3.677,10', bf(2000, 3400, 'fazla', K_OCAK).dalNegatif === 'tavan' && iki(bf(2000, 3400, 'fazla', K_OCAK).negatif) === '3677.10');
ok('R4 2026-02-10 3.399,99 genel dal', bf(3399.99, 3000, 'acik', K_OCAK).dalNegatif === 'genel');
ok('R4 2026-02-10 AFL ustu girdi (3.400,01) -> null', bf(3400.01, 100, 'acik', K_OCAK) === null && bf(4500, 4500, 'acik', K_OCAK) === null);
ok('R4 2026-04-04 AFL 4.500: 3.400 artik genel dal', bf(3400, 3000, 'acik', kuralBul('2026-04-04')).dalNegatif === 'genel' && bf(4500, 3000, 'acik', kuralBul('2026-04-04')).dalNegatif === 'tavan');

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
// --- piyasaCoz: piyasa/v1 sözleşmesi yeniden doğrulanır (üst-akışa güvenilmez) ---
const CEK = '2026-11-24T14:30:00+03:00';
const zarf = (gunler, ek = {}) => ({ surum: 1, kaynak: 'x', uretildi: CEK, gunler, ...ek });
const gunZ = (tarih, liste, ek = {}) => ({ tarih, cekildi: CEK, bayat: false, tam: false, donemler: liste, ...ek });
/** Tek günün dönemleri piyasaCoz'dan geçirilir; sözleşme ihlalinde null. */
const donemler = (liste, tarih) => {
  const t = tarih || (Array.isArray(liste) && liste[0] && typeof liste[0].bas === 'string' ? liste[0].bas.slice(0, 10) : '2026-11-23');
  const p = piyasaCoz(zarf([gunZ(t, liste)]), t, t, SABIT_AN);
  return p.hata ? null : p.gunler.get(t).donemler;
};
const coz1 = (j, bas = '2026-11-23', bit = bas) => piyasaCoz(j, bas, bit, SABIT_AN);
const P = (bas, o = {}) => ({ bas, dk: 60, ptf: null, smf: null, pozitif: null, negatif: null, yon: null, ...o });

let d = donemler(sahteGun('2026-11-23'));
ok('donemler 24 donem', d.length === 24);
ok('donemler sirali', d.every((x, i) => i === 0 || d[i - 1].bas < x.bas));
ok('donemler bas ISO +03:00', d[0].bas === '2026-11-23T00:00:00+03:00' && d[23].bas === '2026-11-23T23:00:00+03:00');
ok('donemler dk = 60', d.every((x) => x.dk === 60));
ok('donemler alanlar', d[0].ptf === 2000 && d[0].smf === 2300 && d[0].yon === 'acik' && iki(d[0].negatif) === '2438.00' && iki(d[0].pozitif) === '1940.00');
ok('maliyetNegatif = negatif - PTF', iki(d[0].maliyetNegatif) === '438.00');
ok('maliyetPozitif = PTF - pozitif', iki(d[0].maliyetPozitif) === '60.00');
ok('donemEtiketi', donemEtiketi(d[0]) === '00:00–01:00' && donemEtiketi(d[23]) === '23:00–24:00');
ok('proxy alanlari (yonHam, tam) disari tasinmaz', !('yonHam' in d[0]) && Object.keys(d[0]).sort().join() === 'bas,dk,maliyetNegatif,maliyetPozitif,negatif,pozitif,ptf,smf,yon');

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

// değerler: gerçek 0 ve eksi korunur; tek işlenen varsa maliyet null
d = donemler([P('2026-11-23T00:00:00+03:00'), P('2026-11-23T01:00:00+03:00', { ptf: 1500.5, smf: 0, pozitif: -106, negatif: 1545.52, yon: 'fazla' })]);
ok('null alanlar null', d[0].ptf === null && d[0].smf === null && d[0].pozitif === null && d[0].negatif === null && d[0].yon === null);
ok('gercek 0 korunur', d[1].ptf === 1500.5 && d[1].smf === 0);
ok('eksi pozitif-fiyat korunur', d[1].pozitif === -106 && iki(d[1].maliyetPozitif) === '1606.50');
ok('tek islenen varsa maliyet null', donemler([P('2026-11-23T00:00:00+03:00', { pozitif: 10, negatif: 20 })])[0].maliyetNegatif === null);

// tekilleştirme ve çelişen kopyalar
d = donemler([...sahteGun('2026-11-01'), ...sahteGun('2026-11-01')]);
ok('kopya donemler tekillesir (48 -> 24)', d.length === 24, `-> ${d && d.length}`);
ok('tekillesmede deger bozulmaz', d[5].ptf === 2050 && d.every((x) => x.dk === 60));
d = donemler([P('2026-11-23T05:00:00+03:00', { ptf: 2100 }), P('2026-11-23T05:00:00+03:00', { ptf: 2100, smf: 2500, pozitif: 2037, negatif: 2650, yon: 'acik' })]);
ok('kopyada bos alan dolu kopyadan tamamlanir', d.length === 1 && d[0].smf === 2500 && d[0].yon === 'acik' && d[0].negatif === 2650);
{
  const T = '2026-11-23';
  const a = coz1(zarf([gunZ(T, [
    P(`${T}T05:00:00+03:00`, { ptf: 2100, smf: 2500, pozitif: 2037, negatif: 2650, yon: 'acik' }),
    P(`${T}T05:00:00+03:00`, { ptf: 2100, smf: 2600, pozitif: 2037, negatif: 2756, yon: 'acik' }),
    P(`${T}T06:00:00+03:00`, { ptf: 2200, smf: 2200, pozitif: 2134, negatif: 2266, yon: 'denge' }),
    P(`${T}T06:00:00+03:00`, { ptf: 2200, smf: 2200, pozitif: 2134, negatif: 2266, yon: 'denge' }),
  ])]));
  const x = a.gunler.get(T).donemler;
  ok('celisen kopya: donem tumuyle null (ilk kopya sessizce KAZANMAZ)', x[0].ptf === null && x[0].smf === null && x[0].pozitif === null && x[0].negatif === null && x[0].yon === null && x[0].maliyetNegatif === null);
  ok('celisen kopya: sayac 1', a.cakisma === 1);
  ok('ayni degerli kopya celiski sayilmaz', x[1].ptf === 2200 && x[1].negatif === 2266);
  ok('yon celiskisi de celiskidir', coz1(zarf([gunZ(T, [P(`${T}T05:00:00+03:00`, { ptf: 1, yon: 'acik' }), P(`${T}T05:00:00+03:00`, { ptf: 1, yon: 'fazla' })])])).cakisma === 1);
  ok('celiskisiz veri: sayac 0', coz1(zarf([gunZ(T, [...sahteGun(T), ...sahteGun(T)])])).cakisma === 0);
}

// sözleşme ihlali → 'bicim' (veri gösterilmez)
{
  const T = '2026-11-23';
  const iyi = () => zarf([gunZ(T, sahteGun(T))]);
  const ihlaller = {
    'govde dizi': [],
    'govde null': null,
    'surum 2': { ...iyi(), surum: 2 },
    'surum "1" (metin)': { ...iyi(), surum: '1' },
    'surum yok': (() => { const j = iyi(); delete j.surum; return j; })(),
    'uretildi yok': (() => { const j = iyi(); delete j.uretildi; return j; })(),
    'uretildi bozuk': { ...iyi(), uretildi: 'dun' },
    'uretildi gelecekte': { ...iyi(), uretildi: '2026-11-25T14:30:00+03:00' },
    'gunler yok': { surum: 1, uretildi: CEK },
    'gunler nesne': { surum: 1, uretildi: CEK, gunler: {} },
    '32 gun': zarf(Array.from({ length: 32 }, (_, i) => gunZ(gunEkle('2026-10-01', i), []))),
    'gun tarihi gecersiz': zarf([gunZ('2026-02-30', [])]),
    'cekildi yok': zarf([(() => { const g = gunZ(T, sahteGun(T)); delete g.cekildi; return g; })()]),
    'cekildi ofsetsiz': zarf([gunZ(T, sahteGun(T), { cekildi: '2026-11-24T14:30:00' })]),
    'bayat yok': zarf([(() => { const g = gunZ(T, sahteGun(T)); delete g.bayat; return g; })()]),
    'bayat metin': zarf([gunZ(T, sahteGun(T), { bayat: 'false' })]),
    'donemler yok': zarf([(() => { const g = gunZ(T, []); delete g.donemler; return g; })()]),
    'ayni gun iki kez': zarf([gunZ(T, sahteGun(T)), gunZ(T, sahteGun(T))]),
    'bas ofsetsiz': zarf([gunZ(T, [P(`${T}T05:00:00`)])]),
    'bas Z': zarf([gunZ(T, [P(`${T}T02:00:00Z`)])]),
    'bas baska gunde': zarf([gunZ(T, [P('2026-11-22T05:00:00+03:00')])]),
    'bas saniyeli': zarf([gunZ(T, [P(`${T}T05:00:30+03:00`)])]),
    'bas 24:00': zarf([gunZ(T, [P(`${T}T24:00:00+03:00`)])]),
    'dk 45': zarf([gunZ(T, [P(`${T}T00:00:00+03:00`, { dk: 45 })])]),
    'dk metin': zarf([gunZ(T, [P(`${T}T00:00:00+03:00`, { dk: '60' })])]),
    'dk gun icinde karisik': zarf([gunZ(T, [P(`${T}T00:00:00+03:00`), P(`${T}T01:00:00+03:00`, { dk: 15 })])]),
    'bas dk ya bolunmuyor': zarf([gunZ(T, [P(`${T}T00:30:00+03:00`)])]),
    'ptf alani yok': zarf([gunZ(T, [(() => { const x = P(`${T}T00:00:00+03:00`); delete x.ptf; return x; })()])]),
    'yon alani yok': zarf([gunZ(T, [(() => { const x = P(`${T}T00:00:00+03:00`); delete x.yon; return x; })()])]),
    'fiyat metin': zarf([gunZ(T, [P(`${T}T00:00:00+03:00`, { ptf: '2000' })])]),
    'fiyat bos metin': zarf([gunZ(T, [P(`${T}T00:00:00+03:00`, { smf: '' })])]),
    'fiyat boolean': zarf([gunZ(T, [P(`${T}T00:00:00+03:00`, { pozitif: false })])]),
    'fiyat dizi': zarf([gunZ(T, [P(`${T}T00:00:00+03:00`, { negatif: [] })])]),
    'yon taninmiyor': zarf([gunZ(T, [P(`${T}T00:00:00+03:00`, { yon: 'Enerji Açığı' })])]),
    'donem null': zarf([gunZ(T, [null])]),
  };
  for (const [ad, j] of Object.entries(ihlaller)) ok(`sozlesme ihlali "${ad}" -> bicim`, coz1(j, T).hata === 'bicim', `-> ${JSON.stringify(coz1(j, T)).slice(0, 80)}`);
  // NaN / Infinity JSON'da yazılamaz; JSON dışı nesneyle de denenir
  ok('sozlesme ihlali fiyat NaN -> bicim', coz1(zarf([gunZ(T, [P(`${T}T00:00:00+03:00`, { ptf: NaN })])]), T).hata === 'bicim');
  const ok1 = coz1(iyi(), T);
  ok('gecerli yanit: hata yok, uretildi +03:00', ok1.hata === null && ok1.uretildi === CEK && ok1.gunler.size === 1);
  ok('cekildi Z ofsetli -> Istanbul saatine cevrilir', coz1(zarf([gunZ(T, sahteGun(T), { cekildi: '2026-11-24T11:30:00Z' })]), T).gunler.get(T).cekildi === CEK);
  ok('cekildi milisaniyeli kabul', coz1(zarf([gunZ(T, sahteGun(T), { cekildi: '2026-11-24T11:30:00.123Z' })]), T).gunler.get(T).cekildi === CEK);
  ok('istenen aralik disindaki gun yok sayilir', (() => { const x = coz1(zarf([gunZ('2026-11-22', sahteGun('2026-11-22')), gunZ(T, sahteGun(T))]), T); return x.gunler.size === 1 && x.gunler.has(T); })());
  ok('aralik disi gun de dogrulanir (bozuk ise bicim)', coz1(zarf([gunZ('2026-11-22', [P('2026-11-22T05:00:30+03:00')]), gunZ(T, sahteGun(T))]), T).hata === 'bicim');
  ok('tam alani okunmaz (yanlis "tam" sayaci etkilemez)', coz1(zarf([gunZ(T, sahteGun(T, 3), { tam: true })]), T).gunler.get(T).donemler.filter(yayimlandi).length === 3);
  ok('bayat bayragi korunur', coz1(zarf([gunZ(T, sahteGun(T), { bayat: true })]), T).gunler.get(T).bayat === true);
  ok('bos donem listesi gecerli (gun var, donem yok)', coz1(zarf([gunZ(T, [])]), T).gunler.get(T).donemler.length === 0);
  ok('anCoz gelecek payi 5 dk', anCoz('2026-11-24T14:34:00+03:00', SABIT_AN) === '2026-11-24T14:34:00+03:00' && anCoz('2026-11-24T14:36:00+03:00', SABIT_AN) === null);
}

// 15 dakikalık seri: 96 dönem aynı koddan geçer
d = donemler(sahteGun('2026-11-23', 96, 15));
ok('96 donem (15 dk)', d.length === 96);
ok('15 dk: dk = 15', d.every((x) => x.dk === 15));
ok('15 dk etiket', donemEtiketi(d[1]) === '00:15–00:30' && donemEtiketi(d[95]) === '23:45–24:00');
ok('15 dk ozet 96/96', ozet(d).toplam === 96 && ozet(d).yayimlanan === 96);
ok('15 dk izgara 96', gunIzgarasi('2026-11-23', d).length === 96);
ok('iki gun karisik cozunurluk gun bazinda', (() => { const p = piyasaCoz(zarf([gunZ('2026-11-22', sahteGun('2026-11-22')), gunZ('2026-11-23', sahteGun('2026-11-23', 96, 15))]), '2026-11-22', '2026-11-23', SABIT_AN); return p.gunler.get('2026-11-22')[ 'donemler'].length === 24 && p.gunler.get('2026-11-23').donemler[0].dk === 15; })());
ok('donem sayisi veriden: 15 dk gunde seyrek donemler izgarada 96', gunIzgarasi('2026-11-23', donemler(sahteGun('2026-11-23', 96, 15).filter((_, i) => i % 7)))[7].ptf === null && gunIzgarasi('2026-11-23', donemler(sahteGun('2026-11-23', 96, 15).filter((_, i) => i % 7))).length === 96);

// --- gunIzgarasi: eksik satır "—" olarak eklenir, değer üretilmez ---
const seyrek = donemler(sahteGun('2026-11-23').filter((_, i) => i !== 3 && i !== 20));
const iz = gunIzgarasi('2026-11-23', seyrek);
ok('izgara 24 satira tamamlar', iz.length === 24);
ok('izgarada eklenen satir tumu null', iz[3].ptf === null && iz[3].smf === null && iz[3].pozitif === null && iz[3].negatif === null && iz[3].yon === null && iz[3].maliyetNegatif === null);
ok('izgara gercek satirlari degistirmez', iz[4].ptf === 2040 && iz[4] === seyrek[3]);
ok('izgara baska gunu disarida birakir', gunIzgarasi('2026-11-23', [...donemler(sahteGun('2026-11-22')), ...donemler(sahteGun('2026-11-23'))]).length === 24);
ok('izgara veri yoksa bos', gunIzgarasi('2026-11-23', []).length === 0 && gunIzgarasi('2026-11-23', donemler(sahteGun('2026-11-22'))).length === 0);
ok('veriVar', veriVar(donemler(sahteGun('2026-11-23', 0))) && !veriVar([]) && !veriVar(donemler([P('2026-11-23T00:00:00+03:00')])));

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
// REVİZYON 3 / A — PİYASA VERİSİ İSTEMCİSİ (sahte proxy, piyasa/v1 sözleşmesi; ağ yok)
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
const BELIRTEC = SAHTE_ENV.PIYASA_VERI_ANAHTAR;
/** Her senaryo temiz süreç belleğiyle başlar. */
const bosalt = () => new Promise((r) => setTimeout(r, 5));
const yeni = (ayar = {}) => { _bellekTemizle(); const e = sahteProxy(ayar); return { e, sec: { fetch: e.fetch, simdi: e.simdi, cache: ayar.cache === undefined ? null : ayar.cache, zamanAsimiMs: ayar.zamanAsimiMs } }; };
const TUM_GUNLER = []; for (let g = '2026-01-01'; g <= BUGUN; g = gunEkle(g, 1)) TUM_GUNLER.push(g);
ok('secilebilir gun sayisi 328', TUM_GUNLER.length === 328);
ok('butce sabitleri: dakikada 12 proxy istegi (eski gunler en cok 8; 4 bugun/dun icin ayrili)', BUTCE.istek === 12 && BUTCE.istekEski === 8);

{ // bağlantı yok → dürüst bekleme, HİÇ istek yok
  const { e, sec } = yeni();
  for (const env of [{}, null, undefined, { PIYASA_VERI_URL: SAHTE_ENV.PIYASA_VERI_URL }, { PIYASA_VERI_ANAHTAR: BELIRTEC }, { PIYASA_VERI_URL: '', PIYASA_VERI_ANAHTAR: '' },
    { ...SAHTE_ENV, PIYASA_VERI_ANAHTAR: '   ' }, { ...SAHTE_ENV, PIYASA_VERI_URL: 'http://piyasa-veri.ornek.invalid' }, { ...SAHTE_ENV, PIYASA_VERI_URL: 'https://kullanici:parola@piyasa-veri.ornek.invalid' },
    { ...SAHTE_ENV, PIYASA_VERI_URL: 'https://piyasa-veri.ornek.invalid/?token=x' }, { ...SAHTE_ENV, PIYASA_VERI_URL: 'bu bir adres degil' }, { ...SAHTE_ENV, PIYASA_VERI_URL: 42 },
    { PIYASA_VERI: { fetch: 'fonksiyon degil' } }, { EPIAS_USERNAME: 'x', EPIAS_PASSWORD: 'y' }]) {
    const x = await gunGetir(env, null, DUN, sec);
    ok(`baglanti yok (${JSON.stringify(env)}) -> yok/baglanti-yok`, x.durum === 'yok' && x.neden === 'baglanti-yok' && x.donemler.length === 0, `-> ${x.neden}`);
  }
  const y = await aralikGetir({}, null, '2026-11-03', '2026-11-09', sec);
  ok('aralik baglanti yok', y.durum === 'yok' && y.neden === 'baglanti-yok');
  ok('baglanti yokken proxy\'ye HIC istek atilmaz', e.sayac.istek === 0 && e.istekler.length === 0);
  ok('baglantiBul: https koku ve sondaki / temizlenir', baglantiBul({ ...SAHTE_ENV, PIYASA_VERI_URL: 'https://piyasa-veri.ornek.invalid/kok/' }).kok === 'https://piyasa-veri.ornek.invalid/kok');
}
{ // HTTPS yolu: istek biçimi
  const { e, sec } = yeni();
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('mutlu yol veri', x.durum === 'veri' && x.tarih === DUN && x.donemler.length === 24);
  ok('mutlu yol cekildi = proxy cekildi (+03:00)', x.cekildi === '2026-11-24T14:30:00+03:00', `-> ${x.cekildi}`);
  ok('mutlu yol uretildi = proxy uretildi', x.uretildi === '2026-11-24T14:30:00+03:00');
  ok('mutlu yol bayat degil', x.bayat === undefined);
  const i = e.istekler[0];
  ok('istek: GET + dogru adres + tarih sorgusu', e.istekler.length === 1 && i.method === 'GET' && i.url === `${SAHTE_ENV.PIYASA_VERI_URL}/piyasa/v1/dengesizlik?tarih=${DUN}`, `-> ${i.url}`);
  ok('istek: Authorization Bearer <belirtec>, Accept JSON', i.headers.authorization === `Bearer ${BELIRTEC}` && i.headers.accept === 'application/json');
  ok('istek: yonlendirme izlenmez (redirect manual)', i.redirect === 'manual');
  ok('istek: EPİAŞ kimlik basligi yok', !('tgt' in i.headers) && !Object.keys(i.headers).some((k) => /epias|tgt/i.test(k)));
}
{ // servis bağlaması tercih edilir
  _bellekTemizle();
  const p = sahteProxy();
  const env = { PIYASA_VERI: sahteBaglama(p), PIYASA_VERI_URL: 'https://baska-adres.ornek.invalid', PIYASA_VERI_ANAHTAR: BELIRTEC };
  const x = await gunGetir(env, null, DUN, { simdi: p.simdi, cache: null, fetch: () => { throw new Error('genel fetch kullanilmamali'); } });
  ok('servis baglamasi: veri, genel fetch kullanilmaz', x.durum === 'veri' && p.sayac.istek === 1);
  ok('servis baglamasi: ayni Authorization basligi, PIYASA_VERI_URL kullanilmaz', p.istekler[0].headers.authorization === `Bearer ${BELIRTEC}` && p.istekler[0].host !== 'baska-adres.ornek.invalid' && p.istekler[0].yol === '/piyasa/v1/dengesizlik');
  _bellekTemizle();
  const p2 = sahteProxy();
  const y = await gunGetir({ PIYASA_VERI: sahteBaglama(p2) }, null, DUN, { simdi: p2.simdi, cache: null });
  ok('belirtecsiz baglama: istek atilir, proxy 401 -> yok/yetki', y.durum === 'yok' && y.neden === 'yetki' && p2.istekler[0].headers.authorization === undefined);
}
{ // proxy 401: yalnız neden kodu, bekleme hâli, yeniden deneme fırtınası YOK
  const { e, sec } = yeni({ anahtar: 'baska-belirtec' });
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('proxy 401 -> yok/yetki', x.durum === 'yok' && x.neden === 'yetki' && x.donemler.length === 0);
  for (const g of TUM_GUNLER) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('401: 328 gunluk supurmede tek istek (paylasilan engel)', e.sayac.istek === 1, `-> ${e.sayac.istek}`);
  const es = await Promise.all(TUM_GUNLER.slice(0, 50).map((g) => gunGetir(SAHTE_ENV, null, g, sec)));
  ok('401: engel suresince tum tarihler kisa devre (yetki)', es.every((y) => y.durum === 'yok' && y.neden === 'yetki') && e.sayac.istek === 1);
  ok('401: aralik da kisa devre', (await aralikGetir(SAHTE_ENV, null, '2026-11-01', '2026-11-05', sec)).neden === 'yetki' && e.sayac.istek === 1);
  const dene = async () => { await gunGetir(SAHTE_ENV, null, TUM_GUNLER[Math.floor(e.simdi() / 60000) % 300], sec); return e.sayac.istek; };
  e.ilerlet(4 * 60 * 1000); ok('401: 4 dk sonra yeni istek yok', (await dene()) === 1);
  e.ilerlet(61 * 1000); ok('401: 5 dk dolunca 2. deneme', (await dene()) === 2);
  e.ilerlet(5 * 60 * 1000 + 1000); ok('401: 2. retten 5 dk sonra istek YOK (30 dk)', (await dene()) === 2);
  e.ilerlet(25 * 60 * 1000); ok('401: 30 dk dolunca 3. deneme', (await dene()) === 3);
  e.ilerlet(30 * 60 * 1000 + 1000); ok('401: 3. retten 30 dk sonra istek YOK (2 sa)', (await dene()) === 3);
  e.ilerlet(90 * 60 * 1000); ok('401: 2 sa dolunca 4. deneme', (await dene()) === 4);
  e.ilerlet(2 * 60 * 60 * 1000 + 1000); ok('401: ust sinir 2 sa', (await dene()) === 5);
  // Sahibi belirteci yeniledi: parmak izi değişir → engel beklenmez
  e.ayar.anahtar = 'yeni-okuma-belirteci';
  const y = await gunGetir({ ...SAHTE_ENV, PIYASA_VERI_ANAHTAR: 'yeni-okuma-belirteci' }, null, DUN, sec);
  ok('401: belirtec degisince engel beklenmez, veri gelir', y.durum === 'veri' && e.sayac.istek === 6, `-> ${y.durum} ${y.neden || ''} ${e.sayac.istek}`);
  ok('401: log yalniz neden kodu', loglar.some((l) => l === 'dengesizlik: piyasa verisi alınamadı — yetki'));
}
{ // 401 engeli Cache API üzerinden süreçler arasında paylaşılır; kayıtta belirteç yok
  const cache = sahteCache();
  const { e, sec } = yeni({ anahtar: 'baska-belirtec', cache });
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  await bosalt();
  _bellekTemizle();
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[7], sec);
  ok('401 engeli yeni surecte de gecerli (Cache API)', e.sayac.istek === 1, `-> ${e.sayac.istek}`);
  const engel = cache.depo.get(_ANAHTAR_KOKU + 'engel');
  ok('engel kaydinda belirtec yok, parmak izi var', !!engel && !engel.includes(BELIRTEC) && /"parmak":"[A-Za-z0-9+/=]{8,}"/.test(engel));
}
{ // 404: modül kapalı → paylaşılan 5 dk engel
  const { e, sec } = yeni({ durum: 404 });
  const x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  for (const g of TUM_GUNLER.slice(0, 40)) await gunGetir(SAHTE_ENV, null, g, sec);
  ok('proxy 404 -> yok/kapali, 40 gunde tek istek', x.neden === 'kapali' && e.sayac.istek === 1);
  e.ilerlet(5 * 60 * 1000 + 1000);
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[90], sec);
  ok('404 engeli 5 dk sonra kalkar', e.sayac.istek === 2);
}
{ // 503 kodları
  let { e, sec } = yeni({ durum: 503, hataKod: 'butce', retryAfter: 120 });
  let x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('503 butce -> yok/vekil-butce', x.durum === 'yok' && x.neden === 'vekil-butce');
  e.ilerlet(61 * 1000); await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('503 Retry-After 120: 61 sn sonra yeniden denenmez', e.sayac.istek === 1);
  e.ilerlet(60 * 1000); await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('503 Retry-After 120: 121 sn sonra yeniden denenir', e.sayac.istek === 2);
  ({ e, sec } = yeni({ durum: 503, hataKod: 'butce', retryAfter: 99999 }));
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[20], sec);
  e.ilerlet(30 * 60 * 1000 + 1000); await gunGetir(SAHTE_ENV, null, TUM_GUNLER[20], sec);
  ok('Retry-After en cok 30 dk dikkate alinir', e.sayac.istek === 2);
  ({ e, sec } = yeni({ durum: 503, hataKod: 'veri-yok' }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('503 veri-yok -> yok/veri-yok', x.durum === 'yok' && x.neden === 'veri-yok' && x.donemler.length === 0);
  ({ sec } = yeni({ durum: 503, hataKod: 'gecici' }));
  ok('503 gecici -> yok/gecici', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'gecici');
  ({ sec } = yeni({ durum: 503, govde: 'x' }));
  ok('503 kodsuz -> gecici', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'gecici');
  ({ sec } = yeni({ durum: 500 }));
  ok('500 -> vekil-hata', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'vekil-hata');
  ({ sec } = yeni({ durum: 302 }));
  ok('302 (yonlendirme izlenmez) -> vekil-hata', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'vekil-hata');
  ({ sec } = yeni({ durum: 400 }));
  ok('400 -> parametre', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'parametre');
}
{ // zaman aşımı, ağ hatası, bozuk JSON, sözleşme ihlali
  let { sec } = yeni({ asili: true, zamanAsimiMs: 40 });
  const t0 = Date.now();
  let x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('zaman asimi -> yok/zaman-asimi', x.durum === 'yok' && x.neden === 'zaman-asimi' && Date.now() - t0 < 1500, `-> ${x.neden}`);
  ({ sec } = yeni({ govdeAsili: true, zamanAsimiMs: 40 }));
  ok('govde okuma asili kalirsa da zaman asimi', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'zaman-asimi');
  ({ sec } = yeni({ firlat: true }));
  ok('ag hatasi -> yok/ag', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'ag');
  ({ sec } = yeni({ govde: 'bu json degil' }));
  ok('bozuk JSON -> bicim', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'bicim');
  ({ sec } = yeni({ duzenle: (j) => ({ ...j, surum: 2 }) }));
  ok('yanlis surum -> bicim', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'bicim');
  ({ sec } = yeni({ duzenle: (j) => { delete j.gunler[0].cekildi; return j; } }));
  ok('eksik alan (cekildi) -> bicim', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'bicim');
  ({ sec } = yeni({ duzenle: (j) => { j.gunler[0].donemler[3].ptf = '2030'; return j; } }));
  ok('fiyat metin -> bicim (veri gosterilmez)', (await gunGetir(SAHTE_ENV, null, DUN, sec)).durum === 'yok');
  ({ sec } = yeni({ duzenle: (j) => { j.gunler[0].donemler[3].bas = `${DUN}T03:00:00Z`; return j; } }));
  ok('bas gecersiz -> bicim', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'bicim');
  ({ sec } = yeni({ gun: () => null }));
  ok('200 ama istenen gun yanitta yok -> eksik', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'eksik');
  ({ sec } = yeni({ gun: () => [] }));
  ok('gun var ama donem yok -> bos', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'bos');
  ({ sec } = yeni({ gun: (g) => sahteGun(g).map((o) => ({ ...o, ptf: null, smf: null, pozitif: null, negatif: null, yon: null })) }));
  ok('tum degerler null -> bos (uydurma satir yok)', (await gunGetir(SAHTE_ENV, null, DUN, sec)).neden === 'bos');
}
{ // kısmi gün, eksik dönem, 96 dönem, kopyalar
  let { sec } = yeni({ gun: (g) => sahteGun(g, 14) });
  let x = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('kismi gun: 24 donem, 14 yayim, kalan null (0 degil)', x.durum === 'veri' && x.donemler.length === 24 && x.donemler.filter(yayimlandi).length === 14 && x.donemler.slice(14).every((d) => d.smf === null && d.pozitif === null && d.negatif === null && d.ptf !== null));
  ({ sec } = yeni({ gun: (g) => sahteGun(g).slice(0, 9) }));
  x = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('proxy yalniz 9 donem dondururse izgara null ile 24e tamamlanir', x.donemler.length === 24 && x.donemler[9].ptf === null && x.donemler[23].negatif === null);
  ({ sec } = yeni({ gun: (g) => sahteGun(g, 96, 15) }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('96 donem uctan uca (donem sayisi veriden)', x.donemler.length === 96 && x.donemler[0].dk === 15);
  ({ sec } = yeni({ gun: (g) => [...sahteGun(g), ...sahteGun(g)] }));
  ok('ayni kopyalar tekillesir', (await gunGetir(SAHTE_ENV, null, DUN, sec)).donemler.length === 24);
  ({ sec } = yeni({ gun: (g) => [...sahteGun(g), { ...sahteGun(g)[7], negatif: 9999.99 }] }));
  x = await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('celisen kopya: o donem tumuyle null, digerleri saglam', x.durum === 'veri' && x.donemler[7].ptf === null && x.donemler[7].negatif === null && x.donemler[6].negatif !== null && x.donemler.filter(yayimlandi).length === 23);
  ok('celisen kopya: ic sayac; log yalniz sayac ve tarih', sayaclar.cakisma === 1 && loglar.some((l) => /çakışan yinelenen dönem — 1 dönem 2026-11-23 2026-11-23$/.test(l)) && !loglar.some((l) => l.includes('9999')));
}
{ // proxy bayat:true → SON SENKRON (proxy'nin cekildi'si); bugün için eskimiş cekildi de bayattır
  const ESKI = '2026-11-24T11:10:00+03:00';
  let { sec } = yeni({ bayat: () => true, cekildi: () => ESKI });
  let x = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('proxy bayat:true -> veri + bayat + proxy cekildi', x.durum === 'veri' && x.bayat === true && x.neden === 'vekil-bayat' && x.cekildi === ESKI, `-> ${x.bayat} ${x.cekildi}`);
  ({ sec } = yeni({ cekildi: () => '2026-11-24T13:50:00+03:00' }));
  x = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('bugun cekildi 40 dk eski (proxy bayat:false) -> bayat isaretlenir', x.bayat === true && x.cekildi === '2026-11-24T13:50:00+03:00');
  ({ sec } = yeni({ cekildi: () => '2026-11-24T14:10:00+03:00' }));
  ok('bugun cekildi 20 dk eski -> taze', (await gunGetir(SAHTE_ENV, null, BUGUN, sec)).bayat === undefined);
  ({ sec } = yeni({ cekildi: () => '2026-03-02T03:00:00+03:00' }));
  ok('gecmis gunun eski cekildi si bayat DEGIL (gun kesinlesmis)', (await gunGetir(SAHTE_ENV, null, '2026-03-01', sec)).bayat === undefined);
  // elimizdeki daha yeni kopya, proxy'nin daha eski bayat verisiyle EZİLMEZ
  const h = yeni();
  await gunGetir(SAHTE_ENV, null, BUGUN, h.sec);
  h.e.ilerlet(3 * 60 * 1000); h.e.ayar.bayat = () => true; h.e.ayar.cekildi = () => ESKI;
  x = await gunGetir(SAHTE_ENV, null, BUGUN, h.sec);
  ok('proxy bayat + bizde daha yeni kopya: yeni kopya (bayat isaretli) gosterilir', x.bayat === true && x.cekildi === '2026-11-24T14:30:00+03:00');
}
{ // önbellek pencereleri: bugün/dün 2 dk, geçmiş 6 sa
  const { e, sec } = yeni();
  await gunGetir(SAHTE_ENV, null, DUN, sec); await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('ayni gun ikinci kez: proxy\'ye gidilmez', e.sayac.istek === 1);
  await gunGetir(SAHTE_ENV, null, '2026-11-10', sec);
  e.ilerlet(110 * 1000); await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('dun 110 sn sonra hala taze', e.sayac.istek === 2);
  e.ilerlet(20 * 1000); await gunGetir(SAHTE_ENV, null, DUN, sec);
  ok('dun 2 dk sonra yenilenir', e.sayac.istek === 3);
  await gunGetir(SAHTE_ENV, null, '2026-11-10', sec);
  ok('eski gun 2 dk sonra hala taze', e.sayac.istek === 3);
  e.ilerlet(6 * 60 * 60 * 1000); await gunGetir(SAHTE_ENV, null, '2026-11-10', sec);
  ok('eski gun 6 saat sonra yenilenir', e.sayac.istek === 4, `-> ${e.sayac.istek}`);
}
{ // tek uçuş: eşzamanlı istekler tek çağrıya iner
  const { e, sec } = yeni({ gecikmeMs: 20 });
  const r3 = await Promise.all(Array.from({ length: 50 }, () => gunGetir(SAHTE_ENV, null, DUN, sec)));
  ok('ayni gun 50 eszamanli -> 1 proxy istegi', e.sayac.istek === 1 && r3.every((x) => x.durum === 'veri'));
}
{ // 100 eşzamanlı ziyaretçi, karışık tarihler → sınırlı proxy çağrısı
  const { e, sec } = yeni({ gecikmeMs: 5 });
  const tarihler = Array.from({ length: 100 }, (_, i) => (i % 4 === 0 ? BUGUN : i % 4 === 1 ? DUN : TUM_GUNLER[(i * 7) % 300]));
  const sonuc = await Promise.all(tarihler.map((g) => gunGetir(SAHTE_ENV, null, g, sec)));
  ok('100 eszamanli karisik ziyaretci: proxy istegi <= 12 (dakikalik butce)', e.sayac.istek <= BUTCE.istek, `-> ${e.sayac.istek}`);
  ok('100 eszamanli: bugun ve dun hepsi veri alir (ayrilmis pay + tek ucus)', sonuc.filter((_, i) => i % 4 < 2).every((x) => x.durum === 'veri'));
  ok('100 eszamanli: butceye takilanlar durust bekleme (uydurma yok)', sonuc.every((x) => x.durum === 'veri' || (x.durum === 'yok' && x.neden === 'butce' && x.donemler.length === 0)));
  const once = e.sayac.istek;
  await Promise.all(tarihler.map((g) => gunGetir(SAHTE_ENV, null, g, sec)));
  ok('ayni dakikada ikinci dalga: yeni proxy istegi yok', e.sayac.istek === once);
  e.ilerlet(60 * 1000);
  const x = await gunGetir(SAHTE_ENV, null, TUM_GUNLER[(99 * 7) % 300], sec);
  ok('sonraki dakikada butce yenilenir', x.durum === 'veri' && e.sayac.istek === once + 1);
}
{ // eski gün taraması bugünü aç bırakamaz (ayrılmış pay); aralık öncelikli değildir
  const { e, sec } = yeni();
  const sonuc = await Promise.all(TUM_GUNLER.slice(-50).map((g) => gunGetir(SAHTE_ENV, null, g, sec)));
  ok('50 eszamanli farkli gun: 8 eski + bugun + dun = 10 istek', e.sayac.istek === BUTCE.istekEski + 2, `-> ${e.sayac.istek}`);
  ok('taramada bugun ve dun veri alir', sonuc.at(-1).durum === 'veri' && sonuc.at(-2).durum === 'veri');
  const h = yeni();
  for (const g of TUM_GUNLER.slice(0, 8)) await gunGetir(SAHTE_ENV, null, g, h.sec);
  const ar = await aralikGetir(SAHTE_ENV, null, '2026-11-20', BUGUN, h.sec);
  ok('aralik istegi ayrilmis payi KULLANAMAZ', ar.durum === 'yok' && ar.neden === 'butce' && h.e.sayac.istek === 8);
  ok('ayni anda bugunun tek gun istegi calisir', (await gunGetir(SAHTE_ENV, null, BUGUN, h.sec)).durum === 'veri' && h.e.sayac.istek === 9);
}
{ // bütçe Cache API sayacıyla süreçler arasında paylaşılır; bütçe doluyken bayat veri korunur
  const cache = sahteCache();
  const { e, sec } = yeni({ cache });
  for (const g of TUM_GUNLER.slice(0, 8)) await gunGetir(SAHTE_ENV, null, g, sec);
  await bosalt();
  _bellekTemizle();
  const x = await gunGetir(SAHTE_ENV, null, TUM_GUNLER[40], sec);
  ok('eski gun butcesi yeni surecte de dolu (Cache API sayaci)', x.durum === 'yok' && x.neden === 'butce' && e.sayac.istek === 8, `-> ${x.neden} ${e.sayac.istek}`);
  ok('butce asimi sayaci', sayaclar.butceAsimi >= 1);
  e.ilerlet(60 * 1000);
  await gunGetir(SAHTE_ENV, null, TUM_GUNLER[100], sec);
  e.ilerlet(6 * 60 * 60 * 1000 + 60 * 1000);
  for (const g of TUM_GUNLER.slice(60, 68)) await gunGetir(SAHTE_ENV, null, g, sec);
  const once = e.sayac.istek;
  const y = await gunGetir(SAHTE_ENV, null, TUM_GUNLER[100], sec);
  ok('butce doluyken eskimis veri BAYAT sunulur, proxy\'ye gidilmez', y.durum === 'veri' && y.bayat === true && y.neden === 'butce' && e.sayac.istek === once);
}
{ // anahtar bazında büyüyen bekleme: 60 sn → 5 dk → 30 dk; bugün/dün en çok 5 dk
  const { e, sec } = yeni({ durum: 500 });
  const G = TUM_GUNLER[50];
  const dene = async () => { await gunGetir(SAHTE_ENV, null, G, sec); return e.sayac.istek; };
  ok('ilk hata: 1 istek', (await dene()) === 1);
  e.ilerlet(30 * 1000); ok('30 sn: istek yok', (await dene()) === 1);
  e.ilerlet(31 * 1000); ok('61 sn: 2. deneme', (await dene()) === 2);
  e.ilerlet(61 * 1000); ok('2. hatadan 61 sn sonra istek YOK (5 dk)', (await dene()) === 2);
  e.ilerlet(4 * 60 * 1000); ok('5 dk dolunca 3. deneme', (await dene()) === 3);
  e.ilerlet(5 * 60 * 1000 + 1000); ok('3. hatadan 5 dk sonra istek YOK (30 dk)', (await dene()) === 3);
  e.ilerlet(25 * 60 * 1000); ok('30 dk dolunca 4. deneme', (await dene()) === 4);
  e.ayar.durum = 200; e.ilerlet(30 * 60 * 1000 + 1000);
  ok('servis duzelince veri gelir', (await gunGetir(SAHTE_ENV, null, G, sec)).durum === 'veri');
  for (const G2 of [BUGUN, DUN]) {
    const o = yeni({ durum: 500 });
    const d2 = async () => { await gunGetir(SAHTE_ENV, null, G2, o.sec); return o.e.sayac.istek; };
    await d2(); o.e.ilerlet(61 * 1000);
    ok(`${G2}: 61 sn sonra 2. deneme`, (await d2()) === 2);
    o.e.ilerlet(5 * 60 * 1000 + 1000); ok(`${G2}: 5 dk dolunca 3. deneme`, (await d2()) === 3);
    o.e.ilerlet(5 * 60 * 1000 + 1000); ok(`${G2}: 3. hatadan 5 dk sonra YINE denenir (ust sinir 5 dk)`, (await d2()) === 4);
  }
}
{ // dürüstlük merdiveni: proxy düşerse önceki gerçek veri (bayat, kendi cekildi'siyle), 24 saate kadar
  const { e, sec } = yeni({ gun: (g) => sahteGun(g, 10) });
  const ilk = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  e.ilerlet(3 * 60 * 1000);
  e.ayar.durum = 503;
  const x = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('kesintide onceki gercek veri doner (bayat)', x.durum === 'veri' && x.bayat === true && x.neden === 'gecici');
  ok('bayat veride cekildi ILK cekimin (proxy) zamani', x.cekildi === ilk.cekildi);
  ok('bayat veri degismez', JSON.stringify(x.donemler) === JSON.stringify(ilk.donemler));
  await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('bayat sunum da 60 sn boyunca proxy\'yi dovmez', e.sayac.istek === 2);
  e.ilerlet(61 * 1000); e.ayar.durum = 200; e.ayar.gun = (g) => sahteGun(g, 11);
  const y = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('proxy donunce taze veri (bayat isareti kalkar)', y.durum === 'veri' && y.bayat === undefined && y.donemler.filter(yayimlandi).length === 11);
  e.ilerlet(25 * 60 * 60 * 1000); e.ayar.durum = 503;
  const z = await gunGetir(SAHTE_ENV, null, BUGUN, sec);
  ok('24 saati asan kopya SUNULMAZ', z.durum === 'yok', `-> ${z.durum}`);
}
{ // Cache API katmanı: sentetik anahtar; yeni süreç proxy'ye gitmeden okur; anahtar ve değerde belirteç yok
  const cache = sahteCache();
  const { sec } = yeni({ cache });
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  await bosalt();
  ok('Cache API\'ye sentetik anahtarla yazilir', [...cache.depo.keys()].every((k) => k.startsWith('https://dengesizlik-onbellek.invalid/v2/')) && cache.depo.has(_ANAHTAR_KOKU + 'gun/' + DUN), `-> ${[...cache.depo.keys()]}`);
  ok('onbellek anahtarinda ve degerinde belirtec yok', ![...cache.depo.keys(), ...cache.depo.values()].some((v) => v.includes(BELIRTEC) || /Bearer/i.test(v)));
  _bellekTemizle();
  const e2 = sahteProxy();
  const x = await gunGetir(SAHTE_ENV, null, DUN, { fetch: e2.fetch, simdi: e2.simdi, cache });
  ok('yeni surec: veri Cache API\'den, proxy\'ye istek yok', x.durum === 'veri' && e2.sayac.istek === 0);
}
{ // HEAD yolu: yalnız önbellek
  const { e, sec } = yeni();
  let x = await gunGetir(SAHTE_ENV, null, DUN, { ...sec, yalnizOnbellek: true });
  ok('yalnizOnbellek (soguk): yok/onbellek-yok, istek yok', x.durum === 'yok' && x.neden === 'onbellek-yok' && e.sayac.istek === 0);
  await gunGetir(SAHTE_ENV, null, DUN, sec);
  x = await gunGetir(SAHTE_ENV, null, DUN, { ...sec, yalnizOnbellek: true });
  ok('yalnizOnbellek (sicak): veri, yeni istek yok', x.durum === 'veri' && e.sayac.istek === 1);
  e.ilerlet(10 * 60 * 1000);
  x = await gunGetir(SAHTE_ENV, null, DUN, { ...sec, yalnizOnbellek: true });
  ok('yalnizOnbellek (eskimis): bayat isaretli veri, yeni istek yok', x.durum === 'veri' && x.bayat === true && e.sayac.istek === 1);
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-01', '2026-11-05', { ...sec, yalnizOnbellek: true });
  ok('aralik yalnizOnbellek: istek yok', x.durum === 'yok' && e.sayac.istek === 1);
}
{ // toplam süre sınırı: aşılırsa bekleme/bayat döner, çekim waitUntil ile tamamlanır
  const { e, sec } = yeni({ gecikmeMs: 250 });
  const bekleyen = [];
  const ctx = { waitUntil: (p) => bekleyen.push(p) };
  let t0 = Date.now();
  let x = await gunGetir(SAHTE_ENV, ctx, BUGUN, { ...sec, sureMs: 40 });
  ok('sure asimi: hemen doner (yok/sure)', x.durum === 'yok' && x.neden === 'sure' && Date.now() - t0 < 200, `-> ${x.neden} ${Date.now() - t0} ms`);
  ok('cekim waitUntil ile arka plana verilir', bekleyen.length >= 1);
  await Promise.all(bekleyen); await bosalt();
  x = await gunGetir(SAHTE_ENV, ctx, BUGUN, { ...sec, sureMs: 40 });
  ok('arka plandaki cekim onbellege yazildi: sonraki istek veri, yeni istek yok', x.durum === 'veri' && e.sayac.istek === 1);
  e.ilerlet(3 * 60 * 1000);
  t0 = Date.now();
  x = await gunGetir(SAHTE_ENV, ctx, BUGUN, { ...sec, sureMs: 40 });
  ok('sure asimi + eski veri: BAYAT doner (rakam silinmez)', x.durum === 'veri' && x.bayat === true && x.neden === 'sure' && Date.now() - t0 < 200);
  await Promise.all(bekleyen); await bosalt();
  x = await gunGetir(SAHTE_ENV, ctx, BUGUN, { ...sec, sureMs: 40 });
  ok('yenileme tamamlaninca taze veri', x.durum === 'veri' && x.bayat === undefined && e.sayac.istek === 2);
}
{ // tarih doğrulama; asla fırlatmaz
  const { e, sec } = yeni();
  for (const t of ['2026-11-25', '2025-12-31', 'abc', '', null, undefined, '2026-02-30', 20261123]) {
    const x = await gunGetir(SAHTE_ENV, null, t, sec);
    ok(`gecersiz tarih ${JSON.stringify(t)} -> yok/gecersiz-tarih`, x.durum === 'yok' && x.neden === 'gecersiz-tarih');
  }
  ok('gecersiz tarihte istek atilmaz', e.sayac.istek === 0);
  _bellekTemizle();
  let x = await gunGetir(SAHTE_ENV, null, DUN, { fetch: () => { throw new Error('senkron patlama'); }, simdi: () => SABIT_AN, cache: null });
  ok('fetch senkron firlatirsa bile donus yapar', x.durum === 'yok' && x.neden === 'ag');
  _bellekTemizle();
  x = await gunGetir(SAHTE_ENV, { waitUntil() { throw new Error('ctx bozuk'); } }, DUN, yeni().sec);
  ok('bozuk ctx.waitUntil veriyi engellemez', x.durum === 'veri');
  _bellekTemizle();
  x = await gunGetir(SAHTE_ENV, null, DUN, { ...yeni().sec, cache: { match: async () => { throw new Error('c'); }, put: async () => { throw new Error('c'); } } });
  ok('bozuk Cache API veriyi engellemez', x.durum === 'veri');
}

// --- aralikGetir: aralık başına TEK proxy isteği ---
{
  let { e, sec } = yeni();
  let x = await aralikGetir(SAHTE_ENV, null, '2026-11-03', '2026-11-09', sec);
  ok('aralik 7 gun x 24 donem', x.durum === 'veri' && x.donemler.length === 7 * 24 && x.bas === '2026-11-03' && x.bit === '2026-11-09');
  ok('aralik sinirlari dahil', x.donemler[0].bas.startsWith('2026-11-03T00:00') && x.donemler.at(-1).bas.startsWith('2026-11-09T23:00'));
  ok('aralik: proxy\'ye bas/bit ile TEK istek', e.sayac.istek === 1 && e.istekler[0].sorgu === '?bas=2026-11-03&bit=2026-11-09');
  ok('aralik cekildi = gunlerin en eskisi; uretildi var', x.cekildi === '2026-11-24T14:30:00+03:00' && x.uretildi === '2026-11-24T14:30:00+03:00');
  await aralikGetir(SAHTE_ENV, null, '2026-11-03', '2026-11-09', sec);
  ok('ayni aralik ikinci kez: istek yok', e.sayac.istek === 1);
  const g = await gunGetir(SAHTE_ENV, null, '2026-11-05', sec);
  ok('aralik yanitinin gunleri tek gun onbellegine yazilir (istek yok)', g.durum === 'veri' && e.sayac.istek === 1);
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-04', '2026-11-08', sec);
  ok('tum gunleri onbellekte taze alt aralik: istek yok', x.durum === 'veri' && x.donemler.length === 5 * 24 && e.sayac.istek === 1);
  x = await aralikGetir(SAHTE_ENV, null, '2026-10-25', '2026-11-24', sec);
  ok('31 gun (iki aya yayilan): tek istek', x.durum === 'veri' && x.donemler.length === 31 * 24 && e.sayac.istek === 2);
  x = await aralikGetir(SAHTE_ENV, null, '2026-10-24', '2026-11-24', sec);
  ok('32 gun -> yok/aralik-uzun (istek yok)', x.durum === 'yok' && x.neden === 'aralik-uzun' && e.sayac.istek === 2);
  ok('ters aralik -> gecersiz-tarih', (await aralikGetir(SAHTE_ENV, null, '2026-11-09', '2026-11-03', sec)).neden === 'gecersiz-tarih');
  ok('yarini iceren aralik -> gecersiz-tarih', (await aralikGetir(SAHTE_ENV, null, '2026-11-20', '2026-11-25', sec)).neden === 'gecersiz-tarih');
  ({ e, sec } = yeni({ gun: (gg) => (gg === '2026-11-05' ? null : sahteGun(gg)) }));
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-03', '2026-11-09', sec);
  ok('bir gunu eksik yanit -> yok/eksik (yarim dosya yok)', x.durum === 'yok' && x.neden === 'eksik');
  ({ e, sec } = yeni({ gun: (gg) => (gg === '2026-11-05' ? [] : sahteGun(gg)) }));
  ok('bir gunu bos yanit -> yok/eksik', (await aralikGetir(SAHTE_ENV, null, '2026-11-03', '2026-11-09', sec)).neden === 'eksik');
  ({ e, sec } = yeni({ durum: 503, hataKod: 'veri-yok' }));
  x = await aralikGetir(SAHTE_ENV, null, '2026-10-25', '2026-11-10', sec);
  ok('aralikta proxy 503 veri-yok -> yok', x.durum === 'yok' && x.neden === 'veri-yok');
  ({ e, sec } = yeni({ gun: (gg) => [...sahteGun(gg, gg === BUGUN ? 10 : 24), ...sahteGun(gg, gg === BUGUN ? 10 : 24)] }));
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-22', '2026-11-24', sec);
  ok('aralikta kopya + kismi gun', x.donemler.length === 72 && x.donemler.filter(yayimlandi).length === 58);
  ({ e, sec } = yeni({ bayat: (gg) => gg === '2026-11-21', cekildi: (gg, an) => (gg === '2026-11-21' ? '2026-11-22T09:00:00+03:00' : isoTR(an)) }));
  x = await aralikGetir(SAHTE_ENV, null, '2026-11-20', '2026-11-22', sec);
  ok('aralikta bir gun proxy-bayat: aralik bayat, cekildi en eskisi', x.bayat === true && x.cekildi === '2026-11-22T09:00:00+03:00');
  const h = yeni({ durum: 500 });
  for (let dk = 0; dk < 40; dk++) { for (let i = 0; i < 5; i++) await aralikGetir(SAHTE_ENV, null, '2026-11-03', '2026-11-09', h.sec); h.e.ilerlet(60 * 1000); }
  ok('surekli hata veren aralik: 40 dk x 5 istek -> 4 proxy istegi (0, 1, 6, 36. dk)', h.e.sayac.istek === 4, `-> ${h.e.sayac.istek}`);
}

// --- sır sızıntısı yok ---
ok('loglarda belirtec yok', !loglar.some((l) => l.includes(BELIRTEC) || l.includes('yeni-okuma-belirteci') || /Bearer/i.test(l)));
ok('loglarda proxy adresi yok', !loglar.some((l) => l.includes('piyasa-veri.ornek.invalid')));
ok('loglarda yanit govdesi yok', !loglar.some((l) => /"ptf"|"donemler"|surum/.test(l)));
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
  ok('R4 uc eski gun (2026-03-10) kurali V=150, AFL 3.400 (Karar 13423), yayim notu yok', j.kurallar[0].V === 150 && j.kurallar[0].AFL === 3400 && /13423/.test(j.kurallar[0].kaynak.tavan) && j.kurallar[0].dogrulandi === true && Array.isArray(j.yayimNotlari) && j.yayimNotlari.length === 0);
}
{ // CSV
  const { ctx } = ucCtx('?tarih=2026-11-24&bicim=csv', { gun: (g) => sahteGun(g, 2).map((o, i) => (i === 1 ? { ...o, pozitif: -106, smf: 60.5 } : o)) });
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
  ok('uc aralik tek proxy istegi', e.sayac.istek === 1);
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
  ok('uc aralik tavan degisimi (4/4/2026) ayri ve AYIRT EDILIR girdiler', j4.kurallar.length === 2 && j4.kurallar[0].AFL === 3400 && j4.kurallar[1].AFL === 4500 && j4.kurallar[0].bas === '2026-01-01' && j4.kurallar[0].bit === '2026-04-03' && j4.kurallar[1].bas === '2026-04-04' && j4.kurallar[1].bit === '2026-10-31' && j4.kurallar[1].tavanBas === '2026-04-04' && j4.kurallar[0].tavanBas === '2026-01-01' && /13423/.test(j4.kurallar[0].kaynak.tavan) && j4.kurallar.every((k) => k.dogrulandi === true));
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
  ok(`uc 400 ${sorgu} -> ${kod}`, r2.status === 400 && j.hata.kod === kod && j.hata.mesaj.length > 10 && e.sayac.istek === 0, `-> ${r2.status} ${j.hata && j.hata.kod}`);
  ok(`uc 400 ${sorgu} no-store + JSON, CORS yok`, r2.headers.get('Cache-Control') === 'no-store' && r2.headers.get('Content-Type').startsWith('application/json') && r2.headers.get('Access-Control-Allow-Origin') === null);
}
ok('uc 400 mesaji Turkce', /Geçersiz tarih/.test((await (await veriUcu.onRequestGet(ucCtx('?tarih=abc').ctx)).json()).hata.mesaj));
// 503 yolları: boş ama "başarılı" dosya YOK
for (const [ad, ayar, env, sorgu] of [
  ['baglanti yok', {}, {}, '?tarih=2026-11-23&bicim=csv'], ['proxy 401', { anahtar: 'baska-belirtec' }, SAHTE_ENV, '?tarih=2026-11-23&bicim=xlsx'],
  ['proxy 500', { durum: 500 }, SAHTE_ENV, '?tarih=2026-11-23'], ['bos liste', { gun: () => [] }, SAHTE_ENV, '?tarih=2026-11-23&bicim=csv'],
  ['proxy 503 butce', { durum: 503, hataKod: 'butce' }, SAHTE_ENV, '?tarih=2026-11-23'], ['proxy 503 veri-yok', { durum: 503, hataKod: 'veri-yok' }, SAHTE_ENV, '?bas=2026-11-20&bit=2026-11-22&bicim=csv'],
  ['sozlesme ihlali', { duzenle: (j) => ({ ...j, surum: 2 }) }, SAHTE_ENV, '?tarih=2026-11-23&bicim=csv'],
  ['aralik eksik', { gun: (g) => (g === '2026-11-21' ? null : sahteGun(g)) }, SAHTE_ENV, '?bas=2026-11-20&bit=2026-11-22&bicim=xlsx'],
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
  e.ilerlet(6 * 60 * 1000); e.ayar.durum = 500;
  const r2 = await veriUcu.onRequestGet({ ...ctx, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-24') });
  const j = await r2.json();
  ok('uc bayat veri: 200, bayat:true, ilk cekim zamani, 60 sn onbellek, X-Veri-Bayat', r2.status === 200 && j.bayat === true && j.cekildi === '2026-11-24T14:30:00+03:00' && r2.headers.get('Cache-Control') === 'public, max-age=60' && r2.headers.get('X-Veri-Bayat') === 'true' && r2.headers.get('X-Veri-Cekildi') === '2026-11-24T14:30:00+03:00');
  for (const b of ['csv', 'xlsx']) {
    const rb = await veriUcu.onRequestGet({ ...ctx, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-24&bicim=' + b) });
    ok(`uc bayat ${b}: X-Veri-Bayat true + ilk cekim zamani (dosyada da isaret var)`, rb.status === 200 && rb.headers.get('X-Veri-Bayat') === 'true' && rb.headers.get('X-Veri-Cekildi') === '2026-11-24T14:30:00+03:00');
    if (b === 'xlsx') ok('uc bayat xlsx: Bilgi sayfasi notr ifade (N5)', xlsxOku(new Uint8Array(await rb.arrayBuffer())).rows2.some((r) => r[0] === 'Önceki senkrondan mı (bayat)' && r[1] === "Evet. Bu dosya en son 24.11.2026 14:30 tarihinde EPİAŞ'tan alınan veriyi içerir; güncel veri şu an alınamadı."));
  }
}
{ // HEAD yalnız önbellekten; OPTIONS/CORS yok
  const { ctx, e } = ucCtx('?tarih=2026-11-23&bicim=csv', {}, SAHTE_ENV, 'HEAD');
  let r2 = await veriUcu.onRequestHead(ctx);
  ok('uc HEAD (soguk): 200 govdesiz, proxy\'ye HIC istek yok', r2.status === 200 && (await r2.text()) === '' && e.sayac.istek === 0 && r2.headers.get('Content-Type') === 'text/csv; charset=utf-8' && r2.headers.get('X-Veri-Durum') === 'onbellekte-yok' && r2.headers.get('Cache-Control') === 'no-store');
  await veriUcu.onRequestGet({ ...ctx, request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri?tarih=2026-11-23&bicim=csv') });
  const once = e.sayac.istek;
  r2 = await veriUcu.onRequestHead(ctx);
  ok('uc HEAD (onbellekte): GET basliklari, yeni istek yok', r2.status === 200 && (await r2.text()) === '' && r2.headers.get('Content-Disposition') === 'attachment; filename="dengesizlik-maliyeti-2026-11-23.csv"' && r2.headers.get('Cache-Control') === 'public, max-age=300' && e.sayac.istek === once && once === 1);
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
  ok('kabuk indirme baglantilari bekleme halinde PASIF, odaklanabilir, nedene bagli (N8)', ['dCsv', 'dXlsx', 'dJson'].every((id) => KABUK.includes(`<a class="btn-ikincil" id="${id}" rel="nofollow" role="link" tabindex="0" aria-disabled="true" aria-describedby="dIndirNot">`)) && !/id="d(Csv|Xlsx|Json)"[^>]*href=/.test(KABUK) && KABUK.includes('<span class="indir-not" id="dIndirNot">Veri alınamadığı için indirme şu an kapalı</span>'));
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
  ok('gomulu kural tablosu KURALLAR ile ayni', JSON.stringify(gomulu.kurallar) === JSON.stringify(KURALLAR.map((k) => ({ bas: k.bas, bit: k.bit, dogrulama: k.dogrulama, dogrulamaTarihi: k.dogrulamaTarihi, V: k.V, B: k.B, tavanCarpani: k.tavanCarpani, k: k.k, l: k.l, kaynak: k.kaynak }))) && gomulu.dogrulama === KURAL_DOGRULAMA && KURAL_DOGRULAMA === '2026-11-24');
  ok('gomulu tavan tablosu TAVANLAR ile ayni', JSON.stringify(gomulu.tavanlar) === JSON.stringify(TAVANLAR.map((t) => ({ bas: t.bas, bit: t.bit, dogrulama: t.dogrulama, dogrulamaTarihi: t.dogrulamaTarihi, azami: t.azami, asgari: t.asgari, kaynak: t.kaynak }))) && JSON.stringify(gomulu.dogrulanmis) === JSON.stringify(dogrulanmisAraliklar()));
  // Görünen katsayı ve sabit tabloları = kütüphane
  const katsayiTablo = coz(/<table class="kucuk" id="dKatsayi">([\s\S]*?)<\/table>/.exec(KABUK)[1]);
  const tr2 = (n) => String(n).replace('.', ',');
  const guncel = KURALLAR[1];
  ok('gorunen k/l tablosu kural tablosuyla ayni', katsayiTablo.includes(`Enerji açığı${tr2(guncel.k.acik)}${tr2(guncel.l.acik)}`) && katsayiTablo.includes(`Enerji fazlası${tr2(guncel.k.fazla)}${tr2(guncel.l.fazla)}`) && katsayiTablo.includes(`Dengede${tr2(guncel.k.denge)}${tr2(guncel.l.denge)}`), `-> ${katsayiTablo}`);
  const sabitTablo = coz(/<table class="kucuk" id="dSabit">([\s\S]*?)<\/table>/.exec(KABUK)[1]);
  ok('gorunen sabitler kural tablosuyla ayni', sabitTablo.includes(`V${guncel.V} TL/MWh1 Kasım 2026`) && sabitTablo.includes(`V${KURALLAR[0].V} TL/MWh1 Ocak 2026 – 31 Ekim 2026`) && sabitTablo.includes(`B${guncel.B} TL/MWh`) && sabitTablo.includes('AFL4.500 TL/MWh4 Nisan 2026') && sabitTablo.includes("AFL3.400 TL/MWh1 Ocak 2026 – 3 Nisan 2026 (asgari fiyat limiti 0 TL/MWh)27/3/2025 tarihli ve 13423 sayılı Kurul Kararı (RG 5/4/2025-32861)") && TAVANLAR[0].azami === 3400 && TAVANLAR[0].bit === '2026-04-03' && TAVANLAR[1].azami === 4500 && TAVANLAR[1].bas === '2026-04-04' && !KABUK.includes('azami fiyat limiti bu sayfada doğrulanmamıştır') && sabitTablo.includes(`Tavan çarpanı${tr2(guncel.tavanCarpani)}`), `-> ${sabitTablo}`);
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
  ok('SSR veri yok: proxy\'ye istek yok', e.sayac.istek === 0);
  ok('SSR veri yok: HTML butun', butunluk(h));
}
for (const [ad, ayar] of [['proxy 401', { anahtar: 'baska-belirtec' }], ['proxy 500', { durum: 500 }], ['proxy 503 butce', { durum: 503, hataKod: 'butce' }], ['proxy 503 veri-yok', { durum: 503, hataKod: 'veri-yok' }], ['bos liste', { gun: () => [] }], ['bozuk JSON', { govde: '<html>' }], ['sozlesme ihlali', { duzenle: (j) => { delete j.uretildi; return j; } }], ['zaman asimi', { asili: true, zamanAsimiMs: 30 }]]) {
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
  const tek = (o) => ({ gun: (g) => [{ bas: `${g}T05:00:00+03:00`, dk: 60, ptf: null, smf: null, pozitif: null, negatif: null, yon: null, ...o }] });
  let { h } = await al('?tarih=2026-11-23', tek({ ptf: 450, smf: 60, pozitif: -106, negatif: 463.5, yon: 'fazla' }));
  let orn = ornekOf(h);
  ok('SSR ornek: esik alti dali', orn.includes('Pozitif: min(450,00; 60,00) = 60,00 < V (100) olduğu için (−1) × 100 × (1 + 0,06) = −106,00 TL/MWh') && orn.includes('Negatif: max(100; 450,00; 60,00) × (1 + 0,03) = 463,50 TL/MWh'), `-> ${orn}`);
  ok('SSR ornek: birim dengesizlik maliyeti satiri', orn.includes("Birim dengesizlik maliyeti (PTF'ye göre, EPİAŞ fiyatlarıyla): negatif 463,50 − 450,00 = 13,50 TL/MWh; pozitif 450,00 − (−106,00) = 556,00 TL/MWh"), `-> ${orn}`);
  ok('SSR tablo: eksi fiyat gercek eksi isaretiyle', satirlar(h)[5][4] === '−106,00' && satirlar(h)[5][6] === '556,00');
  ok('SSR seyrek veri: 24 satira tamamlanir, digerleri "—"', satirlar(h).length === 24 && satirlar(h)[4].slice(1).every((c) => c === '—'));
  ({ h } = await al('?tarih=2026-11-23', tek({ ptf: 4500, smf: 4500, pozitif: 4365, negatif: 5008.5, yon: 'acik' })));
  orn = ornekOf(h);
  ok('SSR ornek: tavan dali', orn.includes('Negatif: max(PTF; SMF) = AFL olduğu için 4.500 × 1,05 × (1 + 0,06) = 5.008,50 TL/MWh'), `-> ${orn}`);
  ({ h } = await al('?tarih=2026-11-23', tek({ ptf: 2800, smf: 3400, pozitif: 2716, negatif: 3610.25, yon: 'acik' })));
  orn = ornekOf(h);
  ok('SSR ornek: EPİAŞ degeri formulden farkliysa ACIKCA yazilir', orn.includes("Formül sonucu ile yayımlanan değer arasında fark vardır (negatif 6,25 TL/MWh, pozitif 0,00 TL/MWh). Tabloda EPİAŞ'ın yayımladığı değer gösterilir.") && satirlar(h)[5][5] === '3.610,25', `-> ${orn}`);
  ({ h } = await al('?tarih=2026-11-23', tek({ ptf: 2800, smf: 3400, pozitif: 2716, negatif: 3604, yon: null })));
  ok('SSR ornek: sistem yonu yoksa ornek YOK (yon tahmin edilmez)', h.includes('<div class="ornek" id="dOrnek"></div>') && satirlar(h)[5][3] === '—');
}
{ // eski tarih: uzun önbellek; V = 150 kuralı örnekte
  const { y, h } = await al('?tarih=2026-03-10');
  ok('SSR eski gun: onbellek 300/3600', y.headers.get('Cache-Control') === 'public, max-age=300, s-maxage=3600, must-revalidate');
  ok('R4 SSR eski gun (Mart): formule dayali icerik VAR (2026 kurali dogrulandi), V = 150 ve AFL 3.400 ile', !h.includes('<div class="ornek" id="dOrnek"></div>') && ornekOf(h).includes('V = 150 TL/MWh, B = 100 TL/MWh, AFL = 3.400 TL/MWh.') && satirlar(h).length === 24);
  ok('R4 SSR eski gun: V = 150 ve AFL 3.400 notu', idMetni(h, 'dKuralUyari') === 'Bu teslim gününde V değeri 150 TL/MWh, azami fiyat limiti 3.400 TL/MWh idi; aşağıdaki yöntem bölümü 1 Kasım 2026 teslim gününden itibaren uygulanan değerleri anlatır.');
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
  e.ilerlet(7 * 60 * 1000); e.ayar.durum = 500;
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
  ok('?veriyok: kabuk aynen, SSR yok, proxy\'ye istek yok', h === KABUK && e.sayac.istek === 0 && y.status === 200);
  const v2 = await al('?tarih=2026-11-23&veriyok=1');
  ok('?veriyok tarihle birlikte de SSR atlar', v2.h === KABUK);
}
{ // 2027: tablo çalışır, doğrulanmamış kural gösterilmez
  const OCAK = Date.UTC(2027, 0, 5, 9, 0, 0);
  _bellekTemizle();
  const e = sahteProxy();
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
  ok('bozuk istek -> kabuk (cokme yok); host cozulemedigi icin onizleme sayilir (noindex, nofollow)', y.status === 200 && (await y.text()) === robotsMetaOnizleme(KABUK) && y.headers.get('X-Robots-Tag') === 'noindex, nofollow');
  y = await sayfa.onRequestHead({ ...temel, next: async () => new Response(null, { status: 200, headers: { 'X-Kaynak': 'varlik' } }) });
  ok('HEAD varlik hattindan gecer (SSR yok)', y.status === 200 && y.headers.get('X-Kaynak') === 'varlik');
}
// ============================================================================
// REVİZYON 3 / B — önizleme hostları dizine girmez (Function yanıtları; _headers bunlara uygulanmaz)
// ============================================================================
{
  const ONIZ = ['claude-voltan-orchestrator-a.website-dh5.pages.dev', 'website-dh5.pages.dev', '06f702c0.website-dh5.pages.dev', 'localhost:8788', '127.0.0.1:5173', 'voltage.com.tr.ornek.invalid', 'xvoltage.com.tr'];
  const URETIM = ['voltage.com.tr', 'www.voltage.com.tr', 'VOLTAGE.COM.TR'];
  const robotsMetalari = (h) => [...h.matchAll(/<meta\s+name="robots"\s+content="([^"]*)"/gi)].map((m) => m[1]);
  const sCtx = (host, sorgu, ayar = {}, yontem = 'GET', env = SAHTE_ENV) => {
    const { e, sec } = yeni(ayar);
    return { e, ctx: { request: new Request(`https://${host}/dengesizlik-maliyeti${sorgu}`, { method: yontem }), env, secenek: sec, waitUntil() {}, next: async () => new Response(yontem === 'HEAD' ? null : KABUK, { status: 200, headers: KABUK_BASLIK }) } };
  };
  const vCtx = (host, sorgu, ayar = {}, yontem = 'GET', basliklar = {}) => {
    const { e, sec } = yeni(ayar);
    return { e, ctx: { request: new Request(`https://${host}/dengesizlik-maliyeti/veri${sorgu}`, { method: yontem, headers: basliklar }), env: SAHTE_ENV, secenek: sec, waitUntil() {} } };
  };
  for (const host of ONIZ) {
    for (const [ad, sorgu, ayar, env] of [['veri var', '', {}, SAHTE_ENV], ['tarihli', '?tarih=2026-11-20', {}, SAHTE_ENV], ['veri yok', '', {}, {}], ['gecersiz tarih', '?tarih=abc', {}, SAHTE_ENV], ['?veriyok', '?veriyok', {}, SAHTE_ENV]]) {
      const { ctx } = sCtx(host, sorgu, ayar, 'GET', env);
      const y = await sayfa.onRequestGet(ctx);
      const h = await y.text();
      ok(`B onizleme ${host} sayfa (${ad}): X-Robots-Tag noindex, nofollow`, y.status === 200 && y.headers.get('X-Robots-Tag') === 'noindex, nofollow', `-> ${y.headers.get('X-Robots-Tag')}`);
      ok(`B onizleme ${host} sayfa (${ad}): tek robots meta = noindex, nofollow; canonical voltage.com.tr`, JSON.stringify(robotsMetalari(h)) === '["noindex, nofollow"]' && /<link rel="canonical" href="https:\/\/voltage\.com\.tr\/dengesizlik-maliyeti(\?tarih=2026-11-20)?">/.test(h), `-> ${robotsMetalari(h)}`);
    }
    for (const sorgu of ['', '?tarih=2026-11-20']) {
      const y = await sayfa.onRequestHead(sCtx(host, sorgu, {}, 'HEAD').ctx);
      ok(`B onizleme ${host} HEAD sayfa ${sorgu || '(tarihsiz)'}: noindex, nofollow`, y.status === 200 && y.headers.get('X-Robots-Tag') === 'noindex, nofollow');
    }
    for (const sorgu of ['?tarih=2026-11-23', '?tarih=2026-11-23&bicim=csv', '?tarih=2026-11-23&bicim=xlsx', '?tarih=abc', '?bas=2026-11-01&bit=2026-12-31']) {
      const y = await veriUcu.onRequestGet(vCtx(host, sorgu).ctx);
      ok(`B onizleme ${host} veri ${sorgu}: noindex, nofollow`, y.headers.get('X-Robots-Tag') === 'noindex, nofollow', `-> ${y.status} ${y.headers.get('X-Robots-Tag')}`);
    }
    const yh = await veriUcu.onRequestGet(vCtx(host, '?tarih=abc', {}, 'GET', { Accept: 'text/html' }).ctx);
    const hh = await yh.text();
    ok(`B onizleme ${host} veri HTML hata sayfasi: baslik + meta noindex, nofollow`, yh.status === 400 && yh.headers.get('X-Robots-Tag') === 'noindex, nofollow' && JSON.stringify(robotsMetalari(hh)) === '["noindex, nofollow"]');
    const y503 = await veriUcu.onRequestGet(vCtx(host, '?tarih=2026-11-23', { durum: 503, hataKod: 'veri-yok' }, 'GET', { Accept: 'text/html' }).ctx);
    ok(`B onizleme ${host} veri 503 HTML: noindex, nofollow`, y503.status === 503 && y503.headers.get('X-Robots-Tag') === 'noindex, nofollow' && robotsMetalari(await y503.text())[0] === 'noindex, nofollow');
    const vh = await veriUcu.onRequestHead(vCtx(host, '?tarih=2026-11-23&bicim=csv', {}, 'HEAD').ctx);
    ok(`B onizleme ${host} HEAD veri: noindex, nofollow`, vh.status === 200 && vh.headers.get('X-Robots-Tag') === 'noindex, nofollow');
  }
  for (const host of URETIM) {
    let y = await sayfa.onRequestGet(sCtx(host, '').ctx);
    let h = await y.text();
    ok(`B uretim ${host} sayfa: dizine acik (robots index, X-Robots-Tag yok)`, y.headers.get('X-Robots-Tag') === null && JSON.stringify(robotsMetalari(h)) === '["index, follow, max-snippet:-1, max-image-preview:large"]' && h.includes('data-ssr="1"'));
    y = await sayfa.onRequestGet(sCtx(host, '?tarih=2026-11-20').ctx);
    h = await y.text();
    ok(`B uretim ${host} tarihli: noindex, follow (degismedi)`, y.headers.get('X-Robots-Tag') === 'noindex, follow' && JSON.stringify(robotsMetalari(h)) === '["noindex, follow"]');
    y = await veriUcu.onRequestGet(vCtx(host, '?tarih=2026-11-23').ctx);
    ok(`B uretim ${host} veri: X-Robots-Tag noindex (degismedi)`, y.headers.get('X-Robots-Tag') === 'noindex');
    y = await sayfa.onRequestHead(sCtx(host, '', {}, 'HEAD').ctx);
    ok(`B uretim ${host} HEAD sayfa: X-Robots-Tag yok`, y.headers.get('X-Robots-Tag') === null);
  }
  ok('B uretimMi: cozumlenemeyen adres onizleme sayilir', uretimMi({ url: 'https://voltage.com.tr/x' }) && !uretimMi({ url: 'gecersiz' }) && !uretimMi(null) && !uretimMi({ url: 'https://voltage.com.tr.evil.invalid/' }));
  ok('B robotsMetaOnizleme: meta yoksa head basina eklenir', robotsMetaOnizleme('<html><head><title>x</title></head></html>').includes('<head>\n<meta name="robots" content="noindex, nofollow">'));
  // _headers: Cloudflare'in belgelediği pages.dev kalıpları, yalnız pages.dev'i etkiler
  const bas = readFileSync(new URL('../../_headers', import.meta.url), 'utf8');
  ok('B _headers: https://:project.pages.dev/* -> X-Robots-Tag: noindex', /\nhttps:\/\/:project\.pages\.dev\/\*\n  X-Robots-Tag: noindex\n/.test(bas));
  ok('B _headers: https://:version.:project.pages.dev/* -> X-Robots-Tag: noindex', /\nhttps:\/\/:version\.:project\.pages\.dev\/\*\n  X-Robots-Tag: noindex\n/.test(bas));
  ok('B _headers: yorum yalniz pages.dev ve uretime yayinla ulasma', /YALNIZ \*\.pages\.dev/.test(bas) && /voltage\.com\.tr ETKİLENMEZ/.test(bas) && /yayınla \(main\)/.test(bas));
  ok('B _headers: voltage.com.tr icin X-Robots-Tag kurali YOK', !/^https:\/\/(www\.)?voltage\.com\.tr/m.test(bas) && (bas.match(/^https:\/\//gm) || []).length === 2);
}
{ // R3-A: belirteç hiçbir yanıtta (gövde, başlık), hata metninde görünmez
  const kontrol = [];
  for (const ayar of [{}, { anahtar: 'baska-belirtec' }, { durum: 503, hataKod: 'butce' }, { durum: 500 }, { govde: 'x' }, { asili: true, zamanAsimiMs: 20 }, { duzenle: (j) => ({ ...j, surum: 9 }) }]) {
    for (const sorgu of ['?tarih=2026-11-23', '?tarih=2026-11-23&bicim=csv', '?bas=2026-11-01&bit=2026-11-05&bicim=xlsx', '?tarih=x']) {
      for (const accept of ['application/json', 'text/html']) {
        const { e, sec } = yeni(ayar);
        const y = await veriUcu.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti/veri' + sorgu, { headers: { Accept: accept } }), env: SAHTE_ENV, secenek: sec, waitUntil() {} });
        let b = ''; y.headers.forEach((v, k) => { b += `${k}: ${v}\n`; });
        kontrol.push(b + new TextDecoder().decode(await y.arrayBuffer()));
      }
    }
    const { sec } = yeni(ayar);
    const y = await sayfa.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti'), env: SAHTE_ENV, secenek: sec, waitUntil() {}, next: async () => new Response(KABUK, { status: 200, headers: KABUK_BASLIK }) });
    kontrol.push(await y.text());
  }
  ok(`belirtec ${kontrol.length} yanitin hicbirinde yok (govde + baslik)`, kontrol.length === 63 && !kontrol.some((k) => k.includes(BELIRTEC) || /Bearer/i.test(k) || k.includes('piyasa-veri.ornek.invalid')));
}
ok('M3 loglarinda sir yok', !loglar.some((l) => l.includes(SAHTE_ENV.PIYASA_VERI_ANAHTAR) || /Bearer/i.test(l)));


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
  for (const f of readdirSync(new URL('functions/_lib/', kok))) ok(`functions/_lib/${f} rota uretmez`, !/export\s+(async\s+)?function\s+onRequest|export\s+const\s+onRequest/.test(oku('functions/_lib/' + f)));
  // Sunulan dosyalarda uydurma veri / sır yok
  for (const f of ['dengesizlik-maliyeti.html', 'functions/dengesizlik-maliyeti.js', 'functions/dengesizlik-maliyeti/veri.js', 'functions/_lib/dengesizlik.js', 'functions/_lib/piyasa-istemci.js', 'functions/_lib/xlsx.js']) {
    const m = oku(f);
    ok(`${f}: test verisi / sahte belirtec / telefon yok`, !m.includes('sahteGun') && !m.includes('sahteProxy') && !m.includes(SAHTE_ENV.PIYASA_VERI_ANAHTAR) && !m.includes('ornek.invalid') && !/479\s*05\s*10/.test(m));
  }
  const ist = oku('functions/_lib/piyasa-istemci.js');
  ok('belirtec yalniz env\'den okunur, yalniz Authorization basligina girer', (ist.match(/PIYASA_VERI_ANAHTAR/g) || []).length >= 1 && !/PIYASA_VERI_ANAHTAR\s*[:=]\s*['"]/.test(ist) && /headers\.Authorization = `Bearer \$\{bag\.anahtar\}`/.test(ist));
  ok('istemci loglari belirtec/adres/govde tasimaz', !/console\.(log|error|warn)\([^)]*(anahtar|kok|url|json|govde|headers)/i.test(ist));
}
{ // R3-A1: sitede EPİAŞ kimlik yolu YOK (functions/ ve sayfa). Şeffaflık'a atıf bağlantıları serbest.
  const kok = new URL('../../', import.meta.url);
  const YASAK = [/giris\.epias/i, /cas\/v1/i, /reporting-service/i, /EPIAS_USERNAME/, /EPIAS_PASSWORD/, /\bTGT\b/];
  const dosyalar = [];
  const gez = (yol) => { for (const ad of readdirSync(new URL(yol, kok), { withFileTypes: true })) { const y = yol + ad.name; if (ad.isDirectory()) gez(y + '/'); else dosyalar.push(y); } };
  gez('functions/');
  ok('functions/ altinda dosyalar tarandi', dosyalar.length >= 8 && dosyalar.includes('functions/_lib/piyasa-istemci.js') && !dosyalar.includes('functions/_lib/epias.js'), `-> ${dosyalar.length}`);
  for (const f of dosyalar) {
    const m = readFileSync(new URL(f, kok), 'utf8');
    const bulunan = YASAK.filter((r) => r.test(m)).map(String);
    ok(`EPİAŞ kimlik yolu yok: ${f}`, bulunan.length === 0, `-> ${bulunan}`);
  }
  // Sayfa: <a href="https://seffaflik.epias.com.tr/..."> atıf bağlantıları çıkarıldıktan sonra taranır.
  const atifsiz = KABUK.replace(/<a href="https:\/\/seffaflik\.epias\.com\.tr\/[^"]*"[^>]*>/g, '<a>');
  ok('sayfada Seffaflik atif baglantisi var (taramada serbest)', atifsiz !== KABUK);
  const sayfadaBulunan = YASAK.filter((r) => r.test(atifsiz)).map(String);
  ok('EPİAŞ kimlik yolu yok: dengesizlik-maliyeti.html (atif baglantilari haric)', sayfadaBulunan.length === 0, `-> ${sayfadaBulunan}`);
  // Tarayıcı betiği proxy'ye ya da EPİAŞ'a doğrudan gitmez (yalnız aynı kökenli /veri ucu)
  const betik = KABUK.slice(KABUK.indexOf('<script>'), KABUK.lastIndexOf('</script>'));
  ok('istemci betigi yalniz /dengesizlik-maliyeti/veri ucunu cagirir', !/epias|piyasa\/v1|workers\.dev/i.test(betik) && /var VERI = '\/dengesizlik-maliyeti\/veri';/.test(betik));
  // Taramanın kendisi çalışıyor mu: yasak dizgiler yakalanır
  ok('tarama yasak dizgileri yakalar', ['https://giris.epias.com.tr/cas/v1/tickets', 'env.EPIAS_PASSWORD', "headers: { TGT: t }", '/reporting-service/v1/'].every((x) => YASAK.some((r) => r.test(x))) && !YASAK.some((r) => r.test('PIYASA_VERI_ANAHTAR tgtx')));
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
  ok('katsayi tablosu basligi (revizyon)', coz(/<table class="kucuk" id="dKatsayi">\s*<caption id="dKatsayiBaslik">([\s\S]*?)<\/caption>/.exec(KABUK)[1]) === 'k ve l katsayıları · 14030 sayılı Kurul Kararı · 1 Ocak 2026 teslim gününden itibaren · 24.11.2026 itibarıyla');
  const par = coz(/<table class="kucuk" id="dSabit">([\s\S]*?)<\/table>/.exec(KABUK)[1]);
  ok('parametre tablosu: "Parametre", B gecerliligi, 14459 RG sayisi', par.startsWith('Parametreler:') && par.includes('ParametreDeğerGeçerlilikDayanak') && par.includes("B100 TL/MWh1 Ocak 2026'dan itibaren") && par.includes('14459 sayılı Kurul Kararı (RG 3/4/2026-33213)') && !/Sabit/.test(par));
  ok('parametre aciklamasi (revizyon metni)', yontem.includes("<p>V ve B, Kurul Kararıyla belirlenen birim fiyatlardır (DUY m.110(2)). V, negatif dengesizlik fiyatında alt sınır girdisidir; pozitif dengesizlikte eşiktir. B, min(PTF; SMF) V'nin altına indiğinde pozitif dengesizlik fiyatını belirler. AFL, azami fiyat limitidir.</p>"));
  ok('ATIF ve gorunen atif 14459 RG sayisini tasir', ATIF.includes('14459 sayılı Kurul Kararı (RG 3/4/2026-33213)') && ATIF.includes('azami fiyat limiti: 27/3/2025 tarihli ve 13423 sayılı Kurul Kararı (RG 5/4/2025-32861) ve 2/4/2026 tarihli ve 14459') && TAVANLAR[1].kaynak.endsWith('(RG 3/4/2026-33213)') && KABUK.split(ATIF).length === 3);
  // E hukuk metinleri
  ok('R1(a) yontem girisi', yontem.includes("<p>Enerji dengesizlik tutarı, Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği'nin (DUY) 110. maddesindeki formüllerle hesaplanır; aşağıdaki birim fiyatlar bu formüllerden okunur. Formüller ve değerler <strong>1 Kasım 2026 teslim gününden itibaren uygulanan ve 24 Kasım 2026 tarihinde yürürlükte olan</strong> metne göredir. Katsayılar ve sabitler Kurul kararıyla değiştirilebilir; değişiklik olduğunda bu sayfa güncellenir.</p>"));
  ok('D13 PTF rehberi baglantisi; ticari sayfaya baglanti yok', yontem.includes(`<p>SMF'nin ne olduğunu ve PTF'den farkını <a href="/rehber/ptf-nedir">PTF nedir rehberinde</a> anlattık.</p>`) && !/href="\/(sanayi-elektrik-tedariki|\?kaynak|#leadForm|#iletisim)/.test(KABUK));
  ok('R1(e) 2027 metni dogrulanmadi cumlesi', yontem.includes("31 Aralık 2026'dan sonraki teslim günleri için bu sayfada kural gösterilmez. 110. maddenin 1 Ocak 2027'den itibaren uygulanacak metni bu sayfada henüz doğrulanmamıştır."));
  ok('A2 "24 Kasim 2026 itibariyla saat basina tek SMF"', yontem.includes("24 Kasım 2026 itibarıyla saat başına tek SMF bulunduğu için ikisi de o saatin SMF'sine eşittir.") && !yontem.includes('Bugün saat başına'));
  const kapsam = [.../<h2 id="kapsam">[\s\S]*?<\/ul>/.exec(KABUK)[0].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => coz(m[1]));
  ok('R5 kapsam ilk madde', kapsam[0] === "Bu sayfa, piyasa katılımcıları ve piyasayı izleyen profesyoneller için hazırlanmış bir bilgi aracıdır. Dengesizlik tutarı, piyasa işletmecisi ile dengeden sorumlu taraf arasında uzlaştırılır (DUY m.110(1)); son tüketicinin faturasına yansıyıp yansımayacağı tedarik sözleşmesine bağlıdır. Bu sayfa, Voltage Enerji'nin müşterilerine uyguladığı ya da uygulayacağı bir fiyatı, bedeli veya sözleşme koşulunu göstermez.");
  ok('kapsam: R5 ile yinelenen eski madde kaldirildi (7 madde)', kapsam.length === 7 && !kapsam.some((x) => x.startsWith('Dengesizlik tutarı, dengeden sorumlu taraf için')));
  ok('sitemap: iki yasal sayfanin lastmod\'u = gorunen tarih (25.11.2026)', ['cerez-politikasi', 'kullanim-kosullari'].every((ad) => new RegExp(`<loc>https://voltage\\.com\\.tr/${ad}</loc>\\s*<lastmod>2026-11-25</lastmod>`).test(readFileSync(new URL('../../sitemap.xml', import.meta.url), 'utf8')) && readFileSync(new URL(`../../${ad}.html`, import.meta.url), 'utf8').includes('Son güncelleme: 25 Kasım 2026')));
  ok('tutarlilik: "en gec dort saat icinde" (giris, kapsam, SSS, JSON-LD)', (KABUK.match(/en geç dört saat içinde/g) || []).length === 4 && !/izleyen dört saat içinde/.test(KABUK) && tur(KABUK, 'FAQPage').mainEntity.some((q) => q.acceptedAnswer.text.startsWith('Sistem marjinal fiyatı, ilgili uzlaştırma dönemini izleyen en geç dört saat içinde duyurulur (DUY m.68(1)(e)).')));
  ok('istemci miktar yankisi: en az 3, en cok 6 ondalik; cok kucuk miktar reddi', KABUK.includes("return binlik(s[0]) + ',' + s[1].replace(/0{1,3}$/, '');") && KABUK.includes("'Miktar en az 0,000001 MWh olmalıdır.'"));
  ok('istemci: indirme yalniz SSR ya da basarili uc yanitindan sonra acilir (N1)', KABUK.includes('var indir = !!state.donemler && state.indirAcik;') && (KABUK.match(/state\.indirAcik = true;/g) || []).length === 2);
  ok('istemci sayi okuyucu alana gore (fiyat / miktar)', KABUK.includes('function sayiOku(v, fiyat){') && KABUK.includes("sayiOku($(girdiId).value, false)") && KABUK.includes("sayiOku($(girdiId).value, true)"));
  ok('R3 grup ici degerlendirme', kapsam.includes('Dengeden sorumlu gruplarda grup üyesinin dengesizliği, Kurulun belirlediği dengesizlik oranı sınırı içinde grup içinde değerlendirilir; sınırı aşan kısım için tutar, üyenin bireysel dengesizliği üzerinden ayrıca hesaplanır (DUY m.111(5)). Bu sayfadaki tablo ve hesaplayıcı grup içi değerlendirmeyi içermez.'));
  ok('R4 KÜPST', kapsam.includes("Kesinleşmiş günlük üretim/tüketim programından sapma tutarı (KÜPST) ayrı bir kalemdir (DUY m.110(3)) ve bu sayfadaki fiyatlara dahil değildir. 14907 sayılı Kurul Kararı (RG 19/10/2026-33405), tüketim kapsamında oluşturulan uzlaştırmaya esas veriş-çekiş birimleri için belirlediği katsayı ve toleransların 1 Ocak 2027'den itibaren uygulanmasını öngörür; bu tutarın muhatabı ilgili piyasa katılımcısıdır."));
  ok('"plan sapma bedeli" ve "netlestirme" ifadesi kalmadi', !/plan(ından)? sapma bedeli/i.test(KABUK) && !/netleştirme/i.test(KABUK));
  ok('R6(a) kaynak paragrafi', KABUK.includes(`<p>Bu sayfadaki verinin kaynağı <a href="https://seffaflik.epias.com.tr/" rel="noopener">EPİAŞ Şeffaflık Platformu</a>'dur. Tablo düzeni, özet, türetilmiş "birim dengesizlik maliyeti (PTF'ye göre)" göstergesi ve hesaplayıcı Voltage Enerji tarafından hazırlanmıştır. EPİAŞ Şeffaflık Platformu, sunduğu içerik ve verilerin kaynak gösterilmek suretiyle çoğaltılabileceğini ve kullanılabileceğini, bu verilerden doğabilecek kayıp ve zararlardan sorumluluk kabul etmediğini belirtir (24 Kasım 2026 itibarıyla). Bu veriyi kullanırken kaynağı "EPİAŞ Şeffaflık Platformu" olarak gösterin; bu sayfaya da kaynak göstererek atıfta bulunabilirsiniz. Atıf için:</p>`) && !KABUK.includes('sorumluluk kullanan tarafa aittir'));
  ok('R9 hata bildirimi', KABUK.includes('Veride ya da metinde hata olduğunu düşünüyorsanız <a href="mailto:info@voltage.com.tr">info@voltage.com.tr</a> adresine bildirin; düzeltmeler bu sayfada tarihiyle belirtilir.'));
  const sssR = [.../<div id="dSss">([\s\S]*?)<\/div>/.exec(KABUK)[1].matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [coz(m[1]), coz(m[2])]);
  const yanit = (soru) => sssR.find((x) => x[0] === soru)[1];
  ok('R1(b) SSS formul yaniti basi ve sonu', yanit('Pozitif ve negatif dengesizlik fiyatı nasıl hesaplanır?').startsWith('24 Kasım 2026 tarihinde yürürlükte olan kurallara göre, 1 Kasım 2026 teslim gününden itibaren negatif dengesizlik birim fiyatı') && yanit('Pozitif ve negatif dengesizlik fiyatı nasıl hesaplanır?').endsWith("AFL 4.500 TL/MWh'tir; bu değerler Kurul kararıyla değiştirilebilir. Yönetmelik metnine göre formül 2026'nın önceki teslim günlerinde de aynıdır; V 31 Ekim 2026'ya kadar 150 TL/MWh, AFL 3 Nisan 2026'ya kadar 3.400 TL/MWh idi. Bu sayfa 31 Aralık 2026'dan sonraki teslim günleri için kural göstermez."));
  ok('SSS sistem yonu yaniti (revizyon)', yanit('Sistem yönü neyi değiştirir?').includes('Sistem yönü k ve l katsayılarını belirler. 24 Kasım 2026 itibarıyla, sistem enerji açığı yönündeyken') && yanit('Sistem yönü neyi değiştirir?').includes("Enerji fazlası yönündeyken k 0,03, l 0,06'dır (14030 sayılı Kurul Kararı)."));
  ok('SSS k/l yaniti (revizyon metni)', yanit('k ve l katsayıları kaçtır?') === "24 Kasım 2026 itibarıyla yürürlükteki değerler şöyledir: sistem enerji açığı yönündeyse k 0,06 ve l 0,03; enerji fazlası yönündeyse k 0,03 ve l 0,06; sistem dengedeyse ikisi de 0,03'tür. k negatif dengesizlikte, l pozitif dengesizlikte kullanılır. Dayanak 11/12/2025 tarihli ve 14030 sayılı Kurul Kararı'dır; Karara göre değerler 1 Ocak 2026 teslim gününden itibaren uygulanır ve Kurul kararıyla değiştirilebilir. Bu sayfa 31 Aralık 2026 teslim gününe kadar olan dönemi kapsar.");
  ok('SSS kesinlik yaniti son cumle', yanit('Bu rakamlar kesin mi?').endsWith('Hesaplayıcının sonuçları tahminidir; yatırım, ticari karar ya da hukuki tavsiye, teklif ya da taahhüt değildir.'));
  // B hesaplayıcı işaretlemesi
  ok('B6 hesaplayici girisi (KÜPST)', KABUK.includes('dengeden sorumlu grup içi değerlendirmeyi ve kesinleşmiş günlük üretim/tüketim programından sapma tutarını (KÜPST) içermez.</p>'));
  ok('B9 yon secenekleri tek kalip', KABUK.includes('<span>Negatif (eksik verdim ya da fazla çektim)</span>') && KABUK.includes('<span>Pozitif (fazla verdim ya da az çektim)</span>'));
  ok('B10 Hesapla dugmeleri JS yokken pasif + noscript notu', (KABUK.match(/<button type="submit" class="btn" disabled>Hesapla<\/button>/g) || []).length === 2 && /<noscript><p[^>]*>Hesaplayıcı JavaScript gerektirir; JavaScript kapalıyken "Hesapla" düğmeleri kapalıdır\./.test(KABUK));
  ok('C2 eski "Bugun icin ... kapalidir" notu kaldirildi (teslim gunu secilir)', !KABUK.includes('hKapali') && !KABUK.includes('hesabı kapalıdır'));
  ok('F "Tarih araligini indir"', KABUK.includes('>Tarih aralığını indir</span>') && !KABUK.includes('Tarih aralığı indir'));
  ok('istemci: localStorage/uc kaydi dogrulanmadan innerHTML\'e girmez', KABUK.includes('function donemKur(o){') && KABUK.includes("if(!o || typeof o.bas !== 'string' || !BAS_RE.test(o.bas)") && KABUK.includes('function dogrula(donemler, tarih){'));

  // Kütüphane: kural dilimleri, formül farkı
  const dl = kuralDilimleri();
  ok('kuralDilimleri: 3 dilim, bitisik, ayirt edilir', dl.length === 3 && dl.map((x) => `${x.bas}|${x.bit}|${x.V}|${x.AFL}`).join(' ') === '2026-01-01|2026-04-03|150|3400 2026-04-04|2026-10-31|150|4500 2026-11-01|2026-12-31|100|4500' && dl.every((x, i) => i === 0 || gunEkle(dl[i - 1].bit, 1) === x.bas));
  ok('R4 formulGoster 2026 boyunca, 2027de yok', ['2026-01-01', '2026-04-03', '2026-04-04', '2026-10-31', '2026-11-01', '2026-12-31'].every((g) => kuralBul(g).formulGoster === true) && kuralBul('2027-01-01') === null);
  const dA = { dk: 60, ptf: 2800, smf: 3400, yon: 'acik', pozitif: 2716, negatif: 3604 };
  ok('formulFarki: ayni deger -> false; 0,01 icinde -> false; ustunde -> true', formulFarki(dA, K) === false && formulFarki({ ...dA, negatif: 3604.01 }, K) === false && formulFarki({ ...dA, negatif: 3604.02 }, K) === true && formulFarki({ ...dA, pozitif: 2715.9 }, K) === true);
  ok('formulFarki: R7 Ocak karsilastirilir; 2027, 15 dk, eksik veri -> false (iddia yok)', formulFarki({ ...dA, negatif: 9999 }, kuralBul('2026-01-20')) === true && formulFarki({ ...dA, negatif: 9999 }, K_OCAK) === true && formulFarki({ ...dA, negatif: 9999 }, null) === false && formulFarki({ ...dA, dk: 15, negatif: 9999 }, K) === false && formulFarki({ ...dA, yon: null, negatif: 9999 }, K) === false && formulFarki({ ...dA, smf: null, negatif: 9999 }, K) === false);
}
{ // C: dönem bazında tutarlılık (†) — sunucu render'ı
  uyarilar.length = 0;
  const fark = (g) => sahteGun(g).map((o, i) => (i === 5 || i === 9 ? { ...o, negatif: o.negatif + 6.25 } : o));
  let { h } = await al('?tarih=2026-11-23', { gun: fark });
  ok('† formulden farkli satirlar isaretli (2 donem)', (govdeOf(h).match(/<span class="fark" aria-hidden="true"> †<\/span><span class="sr-only"> \(yayımlanan fiyat formül sonucundan farklı\)<\/span>/g) || []).length === 2 && /data-bas="2026-11-23T05:00:00\+03:00"[^>]*><th scope="row">05:00–06:00<span class="fark"/.test(h) && !/data-bas="2026-11-23T06:00:00\+03:00"[^>]*><th scope="row">06:00–07:00<span class="fark"/.test(h));
  ok('† tablo alti notu (revizyon metni)', idMetni(h, 'dFarkNot') === "† 2 dönemde EPİAŞ'ın yayımladığı fiyat, bu sayfadaki formül sonucundan farklıdır; tabloda EPİAŞ değeri gösterilir.");
  ok('† tabloda EPİAŞ degeri gosterilir (formul sonucu degil)', satirlar(h)[5][5] === sayfa.bicim(sahteGun('2026-11-23')[5].negatif + 6.25));
  ok('† yapilandirilmis tek satir gunluk: yalniz sayac ve tarih', uyarilar.length === 1 && uyarilar[0] === '{"olay":"dengesizlik-formul-farki","tarih":"2026-11-23","donem":2}');
  uyarilar.length = 0;
  ({ h } = await al('?tarih=2026-03-10', { gun: fark }));
  ok('R4 † Mart gununde de karsilastirilir (2026 kurali dogrulandi)', idMetni(h, 'dFarkNot').startsWith('† 2 dönemde') && uyarilar.length === 1);
  uyarilar.length = 0;
  ({ h } = await al('?tarih=2026-11-23', { gun: (g) => sahteGun(g, 96, 15).map((o) => ({ ...o, negatif: o.negatif === null ? null : o.negatif + 50 })) }));
  ok('15 dk veride † ve ornek hesap YOK; not gosterilir (SMF_N/SMF_P varsayimi yok)', !govdeOf(h).includes('†') && ornekOf(h) === 'Bu günün verisi 15 dakikalık dönemlerle yayımlanmış; örnek hesap yalnızca saatlik dönemli günlerde gösterilir.' && uyarilar.length === 0);
  // geçersiz tarih + veri yok: "Bugünün verisi gösteriliyor" DENMEZ
  const g2 = await al('?tarih=abc', {}, {});
  ok('gecersiz tarih + veri yok: uyari "Bugunun verisi gosteriliyor" demez', idMetni(g2.h, 'dUyari') === 'Adresteki tarih geçerli değil ya da seçilebilir aralığın dışında. Seçilebilir aralık: 01.01.2026 – 24.11.2026.' && g2.h.includes('<meta name="robots" content="noindex, follow">'));
  // bekleme hâlinde indirme pasif, dönem seçici bekliyor
  const b2 = await al('', {}, {});
  ok('bekleme: indirme pasif + neden gorunur; donem secici "Veri bekleniyor"', b2.h.includes('<a class="btn-ikincil" id="dCsv" rel="nofollow" role="link" tabindex="0" aria-disabled="true" aria-describedby="dIndirNot">CSV</a>') && b2.h.includes('<span class="indir-not" id="dIndirNot">Veri alınamadığı için indirme şu an kapalı</span>') && b2.h.includes('<select id="hDonem"><option value="">Veri bekleniyor</option></select>'));
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
  ok('D12 llms.txt eki (revizyon metni)', llms.includes("24 Kasım 2026 itibarıyla: k/l enerji açığında 0,06/0,03, enerji fazlasında 0,03/0,06, dengede 0,03/0,03 (Kurul Kararı 14030); V 100 TL/MWh (1 Kasım 2026'dan itibaren, Kurul Kararı 14911), B 100 TL/MWh, azami fiyat limiti 4.500 TL/MWh (Kurul Kararı 14459). Bu değerler Kurul kararıyla değiştirilebilir. 2026'nın önceki teslim günlerinde (yönetmelik metnine göre formül aynı): V 150 TL/MWh (31 Ekim 2026'ya kadar), azami fiyat limiti 3.400 TL/MWh (3 Nisan 2026'ya kadar, Kurul Kararı 13423). Günün ortalama pozitif ve negatif dengesizlik fiyatı sayfadaki tarihli özet cümlesinde ve JSON'da `ozet.pozitifOrt`, `ozet.negatifOrt` alanlarındadır."));
  ok('D12 llms.txt: CORS ifadesi yok, yeni gosterge adi', !/CORS|Access-Control/i.test(llms) && llms.includes("birim dengesizlik maliyeti (PTF'ye göre)") && !llms.includes("PTF'ye göre maliyet ("));
}


// ============================================================================
// REVİZYON 3 / C — tarihsel hesap o günün kuralıyla; formüle dayalı içerik yalnız 'birincil' dönemde
// ============================================================================
{
  ok('C1 her kural ve tavan girdisinde dogrulama durumu var', [...KURALLAR, ...TAVANLAR].every((x) => x.dogrulama === DOGRULAMA.BIRINCIL || x.dogrulama === DOGRULAMA.BEKLIYOR) && [...KURALLAR, ...TAVANLAR].every((x) => (x.dogrulama === 'birincil') === ymdGecerli(x.dogrulamaTarihi)));
  ok('R4 durumlar: 2026 tum kural ve tavan girdileri birincil', KURALLAR.map((k) => `${k.bas}|${k.bit}|${k.dogrulama}|${k.dogrulamaTarihi}`).join(' ') === '2026-01-01|2026-10-31|birincil|2026-11-25 2026-11-01|2026-12-31|birincil|2026-11-24' && TAVANLAR.map((x) => `${x.bas}|${x.bit}|${x.azami}|${x.asgari}|${x.dogrulama}`).join(' ') === '2026-01-01|2026-04-03|3400|0|birincil 2026-04-04|2026-10-31|4500|0|birincil 2026-11-01|null|4500|0|birincil');
  ok('R4 dogrulanmis araliklar: 01.01.2026 - 31.12.2026', JSON.stringify(dogrulanmisAraliklar()) === '[{"bas":"2026-01-01","bit":"2026-12-31"}]');
  // Her kural dönemi için bir tarih + sınırlar
  const durumlar = {
    '2026-02-10': [true, true, 150, 3400], '2026-04-03': [true, true, 150, 3400], '2026-04-04': [true, true, 150, 4500], '2026-07-15': [true, true, 150, 4500],
    '2026-10-31': [true, true, 150, 4500], '2026-11-01': [true, true, 100, 4500], '2026-11-24': [true, true, 100, 4500], '2026-12-31': [true, true, 100, 4500], '2027-01-01': [false, false, null, null],
  };
  for (const [g, [var_, goster, V, AFL]] of Object.entries(durumlar)) {
    const k = kuralBul(g);
    ok(`C1 ${g}: kural ${var_ ? 'var' : 'yok'}, formul ${goster ? 'gosterilir' : 'gosterilmez'}, V ${V}, AFL ${AFL}`, var_ ? (k.formulGoster === goster && k.V === V && k.AFL === AFL) : k === null, `-> ${JSON.stringify(k && { f: k.formulGoster, V: k.V, AFL: k.AFL })}`);
  }
  ok('C1 kuralBul: kural ve tavan durumlari ayri, dogrulama tarihi yalniz dogrulanmissa', kuralBul('2026-11-01').dogrulama === 'birincil' && kuralBul('2026-11-01').tavanDogrulama === 'birincil' && kuralBul('2026-11-01').dogrulamaTarihi === '2026-11-24' && kuralBul('2026-04-03').tavanDogrulama === 'birincil' && kuralBul('2026-04-04').tavanDogrulama === 'birincil' && kuralBul('2026-10-31').dogrulamaTarihi === '2026-11-25');
  ok('C1 formulFarki yalniz dogrulanmis gunde karsilastirir', formulFarki({ dk: 60, ptf: 2800, smf: 3400, yon: 'acik', pozitif: 1, negatif: 1 }, kuralBul('2026-11-01')) === true && formulFarki({ dk: 60, ptf: 2800, smf: 3400, yon: 'acik', pozitif: 1, negatif: 1 }, kuralBul('2026-10-31')) === true && formulFarki({ dk: 60, ptf: 2800, smf: 3400, yon: 'acik', pozitif: 1, negatif: 1 }, kuralBul('2026-01-25')) === true && formulFarki({ dk: 60, ptf: 2800, smf: 3400, yon: 'acik', pozitif: 1, negatif: 1 }, kuralBul('2026-01-26')) === true);
  const dl = kuralDilimleri();
  ok('C1 kuralDilimleri dogrulama alanlari', dl.map((x) => `${x.dogrulama}|${x.tavanDogrulama}|${x.dogrulandi}`).join(' ') === 'birincil|birincil|true birincil|birincil|true birincil|birincil|true');
  // Sayfa: formüle dayalı içerik (örnek, †) yalnız birincil günlerde; sınırlar
  const fark = (g) => sahteGun(g).map((o, i) => (i === 5 ? { ...o, negatif: o.negatif + 6.25 } : o));
  const OCAK = Date.UTC(2027, 0, 1, 9, 0, 0);
  for (const [g, beklenen] of [['2026-02-10', true], ['2026-04-03', true], ['2026-04-04', true], ['2026-10-31', true], ['2026-11-01', true], ['2026-12-31', true], ['2027-01-01', false]]) {
    const { e, sec } = yeni({ gun: fark });
    if (g > BUGUN) e.an = OCAK;
    const y = await sayfa.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti?tarih=' + g), env: SAHTE_ENV, secenek: sec, waitUntil() {}, next: async () => new Response(KABUK, { status: 200, headers: KABUK_BASLIK }) });
    const h = await y.text();
    const ornekVar = !h.includes('<div class="ornek" id="dOrnek"></div>'), hancer = /† \d+ dönemde/.test(idMetni(h, 'dFarkNot'));
    ok(`C1 sayfa ${g}: ornek hesap ve † ${beklenen ? 'VAR' : 'YOK'}`, ornekVar === beklenen && hancer === beklenen && satirlar(h).length === 24, `-> ornek ${ornekVar} † ${hancer}`);
  }
  // Kendi senaryom: teslim günü kuralı, doğrulanmamış günde ret
  ok('C2 senaryoNotu 2026-11-24: uygulanan kural + karar atiflari', sayfa.senaryoNotu('2026-11-24').acik === true && sayfa.senaryoNotu('2026-11-24').metin === "Hesapta kullanılan değerler (24.11.2026 teslim günü; 01.11.2026 – 31.12.2026 teslim günleri için geçerli; 24.11.2026 itibarıyla birincil kaynaklardan doğrulandı): V = 100 TL/MWh, B = 100 TL/MWh, AFL = 4.500 TL/MWh. Dayanak: formül DUY m.110(1) (RG 29/12/2025-33122 ve RG 19/10/2026-33405 ile değişik); k ve l 11/12/2025 tarihli ve 14030 sayılı Kurul Kararı (RG 29/12/2025-33122); V 24/9/2026 tarihli ve 14911 sayılı Kurul Kararı (RG 19/10/2026-33405); B DUY m.110(2): başlangıç değeri; AFL 2/4/2026 tarihli ve 14459 sayılı Kurul Kararı (RG 3/4/2026-33213).", `-> ${sayfa.senaryoNotu('2026-11-24').metin}`);
  // R5: geçerlilik aralığı V VE AFL'nin birlikte sabit kaldığı dilim (kuralDilimleri)
  for (const [g, aralik, V, afl, kaynak, dt] of [
    ['2026-02-10', '01.01.2026 – 03.04.2026', 150, '3.400', '27/3/2025 tarihli ve 13423 sayılı Kurul Kararı (RG 5/4/2025-32861)', '25.11.2026'],
    ['2026-04-03', '01.01.2026 – 03.04.2026', 150, '3.400', '27/3/2025 tarihli ve 13423', '25.11.2026'],
    ['2026-04-04', '04.04.2026 – 31.10.2026', 150, '4.500', '2/4/2026 tarihli ve 14459', '25.11.2026'],
    ['2026-07-15', '04.04.2026 – 31.10.2026', 150, '4.500', '2/4/2026 tarihli ve 14459', '25.11.2026'],
    ['2026-10-31', '04.04.2026 – 31.10.2026', 150, '4.500', '2/4/2026 tarihli ve 14459', '25.11.2026'],
    ['2026-11-15', '01.11.2026 – 31.12.2026', 100, '4.500', '2/4/2026 tarihli ve 14459', '24.11.2026'],
  ]) {
    const n = sayfa.senaryoNotu(g);
    ok(`R5 senaryoNotu ${g}: aralik ${aralik}, V ${V}, AFL ${afl}`, n.acik === true && n.metin.startsWith(`Hesapta kullanılan değerler (${g.slice(8, 10)}.${g.slice(5, 7)}.2026 teslim günü; ${aralik} teslim günleri için geçerli; ${dt} itibarıyla birincil kaynaklardan doğrulandı): V = ${V} TL/MWh, B = 100 TL/MWh, AFL = ${afl} TL/MWh. Dayanak: formül DUY m.110(1) (RG 29/12/2025-33122`) && n.metin.includes(`AFL ${kaynak}`) && !n.metin.includes('1–25 Ocak'), `-> ${n.metin}`);
  }
  ok('R7 senaryoNotu 1-25 Ocak: ek not yok (2026-01-25 ve 2026-01-26 ayni bicim)', sayfa.senaryoNotu('2026-01-25').metin.endsWith('(RG 5/4/2025-32861).') && sayfa.senaryoNotu('2026-01-25').metin.startsWith('Hesapta kullanılan değerler (25.01.2026 teslim günü; 01.01.2026 – 03.04.2026 teslim günleri için geçerli;') && !sayfa.senaryoNotu('2026-01-26').metin.includes('1–25 Ocak'));
  // Doğrulanmamış bir dönem yeniden eklenirse ret yolu çalışmalı (2027 ve sonrası bugün bunun örneği)
  ok('C2 senaryoNotu 2026-11-01 ve 2026-12-31 acik', sayfa.senaryoNotu('2026-11-01').acik && sayfa.senaryoNotu('2026-12-31').acik);
  ok('C2 senaryoNotu 2027-01-01: kural yok -> ret', sayfa.senaryoNotu('2027-01-01').acik === false && sayfa.senaryoNotu('2027-01-01').metin === '01.01.2027 teslim günü için bu sayfada doğrulanmış bir dengesizlik fiyatı kuralı yok; bu tarih için hesap yapılmaz. Doğrulanmış teslim günleri: 01.01.2026 – 31.12.2026.');
  ok('C2 senaryo notunda tasarruf / teklif dili yok', !/tasarruf|en ucuz|garanti|teklif ediyoruz/i.test(['2026-11-24', '2026-02-10', '2027-01-01'].map((g) => sayfa.senaryoNotu(g).metin).join(' ')));
  // SSR: teslim günü alanı ve kural notu sunucuda yazılır (JS'siz de doğru)
  const { h: hs } = await al('');
  ok('C2 SSR: Teslim gunu alani (min 2026-01-01, max ve deger bugun)', hs.includes(`<input type="date" id="sGun" name="teslim" min="2026-01-01" max="${BUGUN}" value="${BUGUN}" aria-describedby="hKural">`) && hs.includes('<label class="etiket" for="sGun">Teslim günü</label>'));
  ok('C2 SSR: kural notu bugunun kuraliyla', idMetni(hs, 'hKural') === sayfa.senaryoNotu(BUGUN).metin);
  const { h: hv } = await al('', {}, {});
  ok('C2 SSR veri yokken de teslim gunu ve kural notu yazilir', hv.includes(`max="${BUGUN}" value="${BUGUN}" aria-describedby="hKural"`) && idMetni(hv, 'hKural') === sayfa.senaryoNotu(BUGUN).metin);
  {
    const { e, sec } = yeni();
    e.an = OCAK;
    const h27 = await (await sayfa.onRequestGet({ request: new Request('https://voltage.com.tr/dengesizlik-maliyeti'), env: SAHTE_ENV, secenek: sec, waitUntil() {}, next: async () => new Response(KABUK, { status: 200 }) })).text();
    ok('C2 SSR 2027: teslim gunu bugun, not durust ret', h27.includes('max="2027-01-01" value="2027-01-01"') && idMetni(h27, 'hKural').startsWith('01.01.2027 teslim günü için bu sayfada doğrulanmış bir dengesizlik fiyatı kuralı yok;'));
  }
  ok('C2 kabukta teslim gunu capasi tam bir kez', KABUK.split(sayfa.CAPA.senaryoGun).length === 2 && KABUK.split(sayfa.CAPA.senaryoNot).length === 2);
  // veri ucu: kurallar[] doğrulama alanları
  const j = await (await veriUcu.onRequestGet(ucCtx('?bas=2026-10-25&bit=2026-11-05').ctx)).json();
  ok('C1 veri ucu kurallar: dogrulama alanlari ve belgeleri', j.kurallar.length === 2 && j.kurallar[0].dogrulama === 'birincil' && j.kurallar[0].dogrulandi === true && j.kurallar[1].dogrulama === 'birincil' && j.kurallar[1].dogrulandi === true && ['dogrulama', 'tavanDogrulama', 'dogrulandi'].every((a) => typeof j.kuralAlanlari[a] === 'string'));
}



// ============================================================================
// REVİZYON 4/7 — 2026 kural geçmişi doğrulandı; yayım istisnası mekanizması (veri güdümlü). R7: yayımlanan
// tablo BOŞ (Şeffaflık API değerleri 1–25 Ocak 2026'da da formülle uyumlu); mekanizma UYDURMA bir istisnayla sınanır.
// ============================================================================
{
  ok('R7 yayimlanan istisna tablosu bos, not tablosu bos', YAYIM_ISTISNALARI.length === 0 && Object.keys(YAYIM_NOTLARI).length === 0 && Object.isFrozen(YAYIM_ISTISNALARI));
  ok('R7 Ocak istisnasi yok: 2026-01-01..01-25 karsilastirilir', ['2026-01-01', '2026-01-13', '2026-01-25'].every((g) => yayimIstisnasi(g) === null && kuralBul(g).karsilastir === true));
  // !!! UYDURMA TEST İSTİSNASI — yalnız mekanizmayı sınar; sayfada, veride ya da bir yayında KULLANILMAZ.
  const SAHTE_NOT = 'UYDURMA TEST NOTU: bu teslim günlerinde yayımlanan fiyatlar formülden farklıdır.';
  _yayimIstisnaTablosu([{ bas: '2026-03-02', bit: '2026-03-04', not: 'test-notu' }], { 'test-notu': SAHTE_NOT });
  const OCAK_NOTU = SAHTE_NOT; // aşağıdaki denetimler mekanizmayı bu UYDURMA notla sınar
  ok('R4 fikstur: istisna sinirlari', yayimIstisnasi('2026-03-02') && yayimIstisnasi('2026-03-04') && yayimIstisnasi('2026-03-05') === null && yayimIstisnasi('2026-03-01') === null);
  ok('R4 fikstur: istisna gunu formul gosterilir ama karsilastirilmaz', kuralBul('2026-03-03').formulGoster === true && kuralBul('2026-03-03').karsilastir === false && kuralBul('2026-03-05').karsilastir === true);
  const hepsiFarkli = (g) => sahteGun(g).map((o) => ({ ...o, negatif: o.negatif + 10, pozitif: o.pozitif - 10 }));
  for (const [g, istisna] of [['2026-03-02', true], ['2026-03-04', true], ['2026-03-05', false]]) {
    uyarilar.length = 0;
    const { h } = await al('?tarih=' + g, { gun: hepsiFarkli });
    const hancer = (govdeOf(h).match(/<span class="fark"/g) || []).length;
    if (istisna) {
      ok(`R4 fikstur SSR ${g}: tablo ustunde gun notu, satir basina † YOK, fark notu bos, gunluk yok`, idMetni(h, 'dKuralUyari').endsWith(OCAK_NOTU) && hancer === 0 && idMetni(h, 'dFarkNot') === '' && uyarilar.length === 0, `-> ${hancer}`);
      ok(`R4 fikstur SSR ${g}: ornek hesap karsilastirmasi bastirilir (gun notu ile); R7 baslik degismez`, ornekOf(h).includes(`Örnek hesap: ${g.slice(8, 10)}.03.2026,`) && !ornekOf(h).includes('yönetmelik metnine göre') && !ornekOf(h).includes('Formül sonucu') && ornekOf(h).includes(OCAK_NOTU));
      ok(`R4 fikstur SSR ${g}: notta V/AFL farki da var (V 150, AFL 3.400)`, idMetni(h, 'dKuralUyari') === `Bu teslim gününde V değeri 150 TL/MWh, azami fiyat limiti 3.400 TL/MWh idi; aşağıdaki yöntem bölümü 1 Kasım 2026 teslim gününden itibaren uygulanan değerleri anlatır. ${OCAK_NOTU}`);
      ok(`R7 fikstur ${g}: senaryo notuna istisna notu EKLENMEZ`, !sayfa.senaryoNotu(g).metin.includes(OCAK_NOTU) && sayfa.senaryoNotu(g).metin.endsWith('(RG 5/4/2025-32861).'));
    } else {
      ok(`R4 fikstur SSR ${g}: istisna yok -> her satir †, olagan fark notu`, !idMetni(h, 'dKuralUyari').includes(OCAK_NOTU) && hancer === 24 && idMetni(h, 'dFarkNot').startsWith('† 24 dönemde'), `-> ${hancer}`);
      ok(`R4 fikstur SSR ${g}: ornek hesapta olagan karsilastirma ve olagan baslik`, ornekOf(h).includes('Formül sonucu ile yayımlanan değer arasında fark vardır') && ornekOf(h).includes(`Örnek hesap: ${g.slice(8, 10)}.03.2026,`));
    }
  }
  // Veri ucu ve XLSX "Bilgi" (fikstür)
  const jo = await (await veriUcu.onRequestGet(ucCtx('?bas=2026-02-25&bit=2026-03-10').ctx)).json();
  ok('R4 fikstur veri ucu yayimNotlari: kesisen aralikta', JSON.stringify(jo.yayimNotlari) === JSON.stringify([{ bas: '2026-03-02', bit: '2026-03-04', not: OCAK_NOTU }]));
  const bilgiF = async (sorgu) => xlsxOku(new Uint8Array(await (await veriUcu.onRequestGet(ucCtx(sorgu).ctx)).arrayBuffer())).rows2;
  ok('R5 fikstur XLSX Bilgi: kesisen aralikta "Yayım notu", digerinde yok', (await bilgiF('?bas=2026-02-25&bit=2026-03-10&bicim=xlsx')).some((r) => r[0] === 'Yayım notu' && r[1] === OCAK_NOTU) && !(await bilgiF('?tarih=2026-03-05&bicim=xlsx')).some((r) => r[0] === 'Yayım notu'));
  _yayimIstisnaTablosu(); // yayımlanan (boş) tabloya dön
  ok('R7 fikstur kaldirildi: istisna yok', yayimIstisnasi('2026-03-03') === null && kuralBul('2026-03-03').karsilastir === true);
  // Ocak 1–25: yayımlanan tabloyla not YOK, † olağan
  for (const g of ['2026-01-01', '2026-01-13', '2026-01-25']) {
    uyarilar.length = 0;
    const { h } = await al('?tarih=' + g, { gun: hepsiFarkli });
    ok(`R7 SSR ${g}: Ocak notu yok, satir basina † olagan, ornek baslik olagan`, !/1–25 Ocak|yayımladığı dengesizlik fiyatları/.test(idMetni(h, 'dKuralUyari')) && (govdeOf(h).match(/<span class="fark"/g) || []).length === 24 && !h.includes('yönetmelik metnine göre)'));
  }
  const jOcak = await (await veriUcu.onRequestGet(ucCtx('?bas=2026-01-01&bit=2026-01-25').ctx)).json();
  ok('R7 veri ucu: yayimNotlari alani var ve bos (1-25 Ocak)', Array.isArray(jOcak.yayimNotlari) && jOcak.yayimNotlari.length === 0);
  const bOcak = xlsxOku(new Uint8Array(await (await veriUcu.onRequestGet(ucCtx('?bas=2026-01-01&bit=2026-01-25&bicim=xlsx').ctx)).arrayBuffer())).rows2;
  ok('R7 XLSX Bilgi: 1-25 Ocak araliginda "Yayım notu" yok', !bOcak.some((r) => r[0] === 'Yayım notu'));
  ok('R7 senaryo notu 2026-01-13: ek not yok', sayfa.senaryoNotu('2026-01-13').metin.endsWith('(RG 5/4/2025-32861).'));
  ok('R7 servis edilen dosyalarda Ocak notu ve "(yonetmelik metnine gore)" yok', ['dengesizlik-maliyeti.html', 'llms.txt', 'functions/_lib/dengesizlik.js', 'functions/dengesizlik-maliyeti.js', 'functions/dengesizlik-maliyeti/veri.js'].every((f) => { const m = readFileSync(new URL('../../' + f, import.meta.url), 'utf8'); return !m.includes('saatlerin çoğunda, 1 Ocak 2026') && !m.includes('(yönetmelik metnine göre)') && !m.includes('tablonun üstündeki nota bakın') && !m.includes('saatlerin çoğunda bu formülün sonucundan farklıdır'); }));
  // Tek dönemlik fark (ör. 2026-11-03 12:00–13:00): olağan † davranışı
  const tekFark = (g) => sahteGun(g).map((o, i) => (i === 12 ? { ...o, negatif: o.negatif + 6.25 } : o));
  const { h: h3 } = await al('?tarih=2026-11-03', { gun: tekFark });
  ok('R4 2026-11-03 12:00–13:00 tek fark: o satirda †, gun notu yok', (govdeOf(h3).match(/<span class="fark"/g) || []).length === 1 && /data-bas="2026-11-03T12:00:00\+03:00"[^>]*><th scope="row">12:00–13:00<span class="fark"/.test(h3) && idMetni(h3, 'dKuralUyari') === '');
  // Nisan öncesi tavan dalı örnek hesapta (AFL 3.400)
  const tek = (o) => ({ gun: (g) => [{ bas: `${g}T05:00:00+03:00`, dk: 60, ptf: null, smf: null, pozitif: null, negatif: null, yon: null, ...o }] });
  const { h: h4 } = await al('?tarih=2026-02-10', tek({ ptf: 3400, smf: 3000, pozitif: 2910, negatif: 3784.2, yon: 'acik' }));
  ok('R4 SSR 2026-02-10 tavan dali ornekte: 3.400 × 1,05 × (1 + 0,06) = 3.784,20, formulle ayni', ornekOf(h4).includes('Negatif: max(PTF; SMF) = AFL olduğu için 3.400 × 1,05 × (1 + 0,06) = 3.784,20 TL/MWh') && ornekOf(h4).includes('Formül sonucu yayımlanan değerlerle aynıdır.'), `-> ${ornekOf(h4)}`);
  // Sınırlar: 04-03/04 (AFL), 10-31/11-01 (V)
  ok('R4 sinir 2026-04-03/04: AFL 3.400 -> 4.500', kuralBul('2026-04-03').AFL === 3400 && kuralBul('2026-04-04').AFL === 4500 && kuralBul('2026-04-03').tavanBas === '2026-01-01' && kuralBul('2026-04-04').tavanBas === '2026-04-04');
  ok('R4 sinir 2026-10-31/11-01: V 150 -> 100', kuralBul('2026-10-31').V === 150 && kuralBul('2026-11-01').V === 100 && sayfa.kuralUyarisi('2026-10-31') === 'Bu teslim gününde V değeri 150 TL/MWh idi; aşağıdaki yöntem bölümü 1 Kasım 2026 teslim gününden itibaren uygulanan değerleri anlatır.' && sayfa.kuralUyarisi('2026-11-01') === '');
  ok('R4 sinir 2026-12-31/2027-01-01: kural var / yok', kuralBul('2026-12-31') !== null && kuralBul('2027-01-01') === null);
  const csvO = await (await veriUcu.onRequestGet(ucCtx('?tarih=2026-01-20&bicim=csv').ctx)).text();
  ok('R5 CSV bicimi degismez (not satiri yok)', !csvO.includes('1–25 Ocak') && csvO.split('\r\n').filter(Boolean).length === 25);
  // Gömülü tablo: istisna ve notlar sunucuyla aynı
  const gom = JSON.parse(/<script type="application\/json" id="dKurallar">([\s\S]*?)<\/script>/.exec(KABUK)[1]);
  ok('R4 gomulu istisna ve not tablolari = sunucu', JSON.stringify(gom.istisnalar) === JSON.stringify(YAYIM_ISTISNALARI) && JSON.stringify(gom.notlar) === JSON.stringify(YAYIM_NOTLARI));
}


// ============================================================================
// REVİZYON 6 — erişilebilirlik ve iOS (QA tarayıcı turu D-A1, D-A2, D-A3, D-M1)
// ============================================================================
{
  const govdeK = KABUK.slice(KABUK.indexOf('<body'), KABUK.indexOf('<script type="application/json"'));
  ok('R6 D-A2: tek <main>, H1 ile "Bu sayfa hakkinda" arasini sarar; nav ve footer disarida', (govdeK.match(/<main>/g) || []).length === 1 && (govdeK.match(/<\/main>/g) || []).length === 1 && govdeK.indexOf('<main>') < govdeK.indexOf('<h1>') && govdeK.indexOf('<nav class="crumbs"') < govdeK.indexOf('<main>') && govdeK.indexOf('<div class="about">') < govdeK.indexOf('</main>') && govdeK.indexOf('</main>') < govdeK.indexOf('<footer>'));
  ok('R6 D-A3: dort alan hatasi role="alert"', ['hMiktarHata', 'sPtfHata', 'sSmfHata', 'sMiktarHata'].every((id) => KABUK.includes(`<p class="hata" id="${id}" role="alert"></p>`)));
  ok('R6 D-A1: 640 px altinda formul satirlari sarar, ifadeler bolunmez', KABUK.includes('@media (max-width: 640px) { .formul p { white-space: normal; } }') && (KABUK.match(/<span class="nw">/g) || []).length === 6);
  ok('R6 D-A1: kucuk tablolar tasinca bolge + klavye duragi (istemci), basliklari kimlikli', KABUK.includes('<caption id="dKatsayiBaslik">') && KABUK.includes('<caption id="dSabitBaslik">') && /querySelectorAll\('\.kucuk-sar'\)/.test(KABUK) && !/<div class="kucuk-sar"[^>]*(role|tabindex|aria-labelledby)=/.test(KABUK));
  ok('R6 D-M1: 640 px altinda girdi ve secimler 16 px', KABUK.includes('@media (max-width: 640px) { input[type="date"], input[type="text"], select { font-size: 16px; } }'));
  const diger = readFileSync(new URL('../../canli-ptf.html', import.meta.url), 'utf8');
  ok('R6 D-A2: diger sayfalara dokunulmadi (canli-ptf main yok)', !diger.includes('<main'));
}

// ============================================================================
// REVİZYON 3 / D — kabul denetimi betiği (docs/qa/kabul-dengesizlik.mjs) yerel sahte ortamda
// ============================================================================
{
  const { sunucuBaslat } = await import('./dengesizlik-test-sunucu.mjs');
  const { createServer } = await import('node:http');
  const { execFile } = await import('node:child_process');
  // Bugün 11/24 yayımlanmış; her gün 04:00 eşik altı (eksi pozitif fiyat) — UYDURMA test verisi
  const OZEL = { ptf: 450, smf: 60, pozitif: -106, negatif: 463.5, yon: 'fazla', yonHam: 'Enerji Fazlası' };
  const gunK = (g) => sahteGun(g, g === BUGUN ? 11 : 24).map((o, i) => (i === 4 ? { ...o, ...OZEL } : o));
  const ONIZ = 'claude-voltan-orchestrator-a.website-dh5.pages.dev';
  const S = await sunucuBaslat({ host: ONIZ, gun: gunK });
  const P = createServer(async (req, res) => {
    try {
      const r = await S.proxy.fetch(SAHTE_ENV.PIYASA_VERI_URL + req.url, { method: 'GET', headers: { Authorization: req.headers.authorization || '', Accept: 'application/json' } });
      res.writeHead(r.status, { 'Content-Type': 'application/json' }); res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) { res.writeHead(500); res.end(); }
  });
  await new Promise((coz) => P.listen(0, '127.0.0.1', coz));
  // Ön sunucu: sahte sitenin saati sabittir, dakikalık bütçe kendiliğinden dolmaz. Site 503 + Retry-After
  // verdiğinde (bütçe) sahte saat bir dakika ilerletilir; kabul betiğinin "bekleyip yeniden dene" yolu
  // gerçekteki gibi bir sonraki dakikaya düşer. Saat başka hiçbir durumda ilerlemez (eşleşen istek çiftleri kararlı).
  const ON = createServer(async (req, res) => {
    try {
      const r = await fetch(S.url + req.url, { method: req.method, headers: { Accept: req.headers.accept || '*/*', ...(req.headers['user-agent'] ? { 'User-Agent': req.headers['user-agent'] } : {}) }, redirect: 'manual' });
      if (r.status === 503 && r.headers.get('retry-after')) S.proxy.an += 61000;
      const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
      res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) { res.writeHead(502); res.end(); }
  });
  await new Promise((coz) => ON.listen(0, '127.0.0.1', coz));
  const ON_URL = `http://127.0.0.1:${ON.address().port}`;
  const kos = (ek = [], env = {}) => new Promise((coz) => execFile(process.execPath, [new URL('./kabul-dengesizlik.mjs', import.meta.url).pathname, ...ek], { cwd: gecici, env: { PATH: process.env.PATH, KABUL_TABAN: ON_URL, KABUL_ZAMAN_ASIMI_MS: '8000', KABUL_YENIDEN_BEKLE_AZAMI_MS: '200', ...env }, timeout: 120000 }, (hata, cikti) => coz({ kod: hata ? hata.code : 0, cikti: String(cikti) })));
  const proxyEnv = { KABUL_PROXY_URL: `http://127.0.0.1:${P.address().port}`, KABUL_PROXY_ANAHTAR: SAHTE_ENV.PIYASA_VERI_ANAHTAR };
  const a = await kos([], proxyEnv);
  const satir = (no) => a.cikti.split('\n').find((l) => new RegExp(`^\\[[^\\]]+\\] +${no} `).test(l)) || '';
  ok('D kabul (proxy ile): cikis 0, 21 madde, kalan yok (17 bulten verilmedi: atlandi; R7 18 bulten gerektirmez: gecti)', a.kod === 0 && /\n\d+ geçti, 0 kaldı, \d+ atlandı \(21 madde\)/.test(a.cikti) && satir(17).startsWith('[ATLANDI]') && satir(18).startsWith('[GEÇTİ]') && satir(18).includes('not yok, API = formül; sayfa notu 0/3, JSON yayimNotlari 0, sunucu verisiz sayfa 0; karşılaştırılan 144, 0,01\'den büyük fark 0 (proxy 0)'), `-> ${a.kod}\n${satir(18)}`);
  ok('D kabul: her madde tek satir', [...Array(21)].every((_, i) => satir(i + 1) !== ''));
  ok('R6 kabul 19: uc tam Kasim gunu, † 0, formul farki 0', satir(19).startsWith('[GEÇTİ]') && /"†" 0, dolu fark notu 0, sunucu verisiz sayfa 0, eksik gün 0, kuralsız gün 0; karşılaştırılan 72, 0,01'den büyük fark 0/.test(satir(19)), `-> ${satir(19)}`);
  ok('R6 kabul 20: tam ay (2026-10-01 – 2026-10-31) uc bicim tutarli', satir(20).startsWith('[GEÇTİ]') && satir(20).includes('(2026-10-01 – 2026-10-31, 31 gün)') && /31\/31 gün, 744 dönem, gün başına tam true\), CSV 200 \(744 satır\), XLSX 200 \(744 satır\)/.test(satir(20)), `-> ${satir(20)}`);
  ok('R6 kabul 21: iki aya yayilan 31 gun (2026-10-16 – 2026-11-15)', satir(21).startsWith('[GEÇTİ]') && satir(21).includes('(2026-10-16 – 2026-11-15, 31 gün)') && /31\/31 gün, 744 dönem/.test(satir(21)), `-> ${satir(21)}`);
  ok('D kabul 14: yayimlanmis her donemin yonu var (null sayimi 0)', satir(14).startsWith('[GEÇTİ]') && /yönü null 0;/.test(satir(14)), `-> ${satir(14)}`);
  ok('D kabul 15: 2026-11-01 donem basina tek satir, proxy ham satir sayisi basilir', satir(15).startsWith('[GEÇTİ]') && /dönem 24 \(60 dk\), tekil 24/.test(satir(15)) && /proxy: ham satır 24, tekil 24, uyuşmayan 0/.test(satir(15)), `-> ${satir(15)}`);
  ok('D kabul 16: 2026-01-01 veri + Kasim oncesi gunde V = 150', satir(16).startsWith('[GEÇTİ]') && /2026-01-01: durum 200, dönem 24, yayımlanan 24/.test(satir(16)) && /V = 150 görünür true/.test(satir(16)), `-> ${satir(16)}`);
  ok('D kabul: proxy karsilastirmasi yapildi (dun birebir)', /proxy: \d+ değer, uyuşmayan 0, null uyuşmazlığı 0, en büyük fark 0/.test(satir(2)));
  ok('D kabul: esik alti isaret ve formul maddesi gecti', satir(5).startsWith('[GEÇTİ]') && /eksi pozitif fiyat \d+/.test(satir(5)) && satir(6).startsWith('[GEÇTİ]'));
  ok('D kabul: SSR kaniti 4 kosu (tarihsiz/tarihli x duz/Googlebot)', satir(12).startsWith('[GEÇTİ]') && (satir(12).match(/hücre 18\/18/g) || []).length === 4);
  ok('D kabul: onizleme hostunda noindex, nofollow denetlendi', satir(13).startsWith('[GEÇTİ]') && satir(13).includes('önizleme'));
  ok('D kabul: butce maddesi (farkli proxy yaniti <= 12, durust 503)', satir(10).startsWith('[GEÇTİ]') && /503 \d+, diğer 0/.test(satir(10)));
  ok('D kabul ciktisi CI-guvenli: fiyat, belirtec, proxy adresi, ham satir yok', !/\d{1,3}(\.\d{3})*,\d{2}/.test(a.cikti.replace(/0,01/g, '')) /* esik metni "0,01" fiyat degil */ && !a.cikti.includes(SAHTE_ENV.PIYASA_VERI_ANAHTAR) && !a.cikti.includes('127.0.0.1') && !a.cikti.includes('ornek.invalid') && !/"ptf"|"donemler"|KONTROL LİSTESİ/.test(a.cikti), `-> ${a.cikti}`);
  const b = await kos([]);
  ok('D kabul (proxy yok): proxy karsilastirmalari atlanir, yine kalan yok', b.kod === 0 && b.cikti.includes('proxy karşılaştırması: kapalı') && b.cikti.includes('proxy karşılaştırması atlandı'), `-> ${b.kod}\n${b.cikti.slice(-600)}`);
  const c = await kos(['--yerel'], proxyEnv);
  ok('D kabul --yerel: insan denetimi listesi kesin degerlerle (Seffaflik ekrani, Excel, SSR)', c.cikti.includes('KONTROL LİSTESİ') && c.cikti.includes('Şeffaflık ekranı') && c.cikti.includes("Excel'de açın") && /PTF \d{1,3}(\.\d{3})*,\d{2}/.test(c.cikti) && !c.cikti.includes(SAHTE_ENV.PIYASA_VERI_ANAHTAR));
  const d = await kos([], { KABUL_TABAN: '' });
  ok('D kabul: KABUL_TABAN yoksa cikis 2', d.kod === 2);
  const e = await kos([], { ...proxyEnv, KABUL_PROXY_ANAHTAR: 'yanlis-belirtec' });
  ok('D kabul: yanlis proxy belirteci -> proxy karsilastirmasi KALIR (sessiz gecmez), belirtec basilmaz', e.kod === 1 && /\[KALDI\] +2 /.test(e.cikti) && !e.cikti.includes('yanlis-belirtec'));
  // Madde 17: EPİAŞ bülteni çapraz denetimi — sahte bülten (UYDURMA; aynı üreticiden) ile
  // mod: false (bülten = API) | true (bozuk: tek gerçek fark + Ocak'ta tek fark) | 'eski' (R7: bülten 1–25 Ocak'ta
  // eski kurala göre, her saat farklı; 2026-11-03 12:00 farklı — API formülle uyumlu → "bilinen bülten farkı")
  const bultenYaz = (ad, bozuk) => {
    const satirlar = ['gun,saat,ptf,smf,yon,poz_dengesizlik_fiyati,neg_dengesizlik_fiyati,formul_poz,formul_neg,poz_eslesir,neg_eslesir,kaynak'];
    for (const g of ['2026-01-01', '2026-01-13', '2026-01-25', '2026-01-26', '2026-03-10', '2026-03-11', '2026-03-12', '2026-11-01', '2026-11-02', '2026-11-05', ...(bozuk === 'eski' ? ['2026-11-03'] : [])]) {
      for (const d of gunK(g)) {
        const h = Number(d.bas.slice(11, 13));
        let neg = d.negatif, poz = d.pozitif;
        if (bozuk === 'eski' && g <= '2026-01-25') { neg = Math.round((neg + 10) * 100) / 100; poz = Math.round((poz - 10) * 100) / 100; }
        if (bozuk === 'eski' && g === '2026-11-03' && h === 12) neg = Math.round((neg + 6.25) * 100) / 100;
        if (bozuk === true && g === '2026-03-11' && h === 7) neg = Math.round((neg + 12.34) * 100) / 100;
        if (bozuk === true && g === '2026-01-13' && h === 3) neg = Math.round((neg + 0.5) * 100) / 100; // Ocak'ta bülten farkı (API formüle eşit → bilinen)
        satirlar.push([g, h, d.ptf, d.smf, { acik: 'A', fazla: 'F', denge: 'D' }[d.yon], poz, neg, '', '', 1, 1, '"https://ornek.invalid/bulten.pdf s.5, s.10"'].join(','));
      }
    }
    const y = join(gecici, ad);
    writeFileSync(y, satirlar.join('\n') + '\n');
    return y;
  };
  S.ayarla({ host: ONIZ, gun: gunK });
  const bt = await kos([], { ...proxyEnv, KABUL_BULTEN_CSV: bultenYaz('bulten.csv', false), KABUL_YENIDEN_BEKLE_AZAMI_MS: '200' });
  const satirB = (no) => bt.cikti.split('\n').find((l) => new RegExp(`^\\[[^\\]]+\\] +${no} `).test(l)) || '';
  ok('D kabul 17 (bulten ile): GECTI; site ve proxy, ay basina tek aralik istegi, uyusmayan 0', bt.kod === 0 && satirB(17).startsWith('[GEÇTİ]') && /örneklem 10 gün \(3 ay; bültende 10 gün\), 3 aralık isteği, başarısız 0/.test(satirB(17)) && /site: 10 gün, 240 saat, 1200 değer: eşleşen 1200, bilinen bülten farkı 0, uyuşmayan 0, null uyuşmazlığı 0, yön uyuşmazlığı 0/.test(satirB(17)) && /proxy: 10 gün, 240 saat, 1200 değer: eşleşen 1200, bilinen bülten farkı 0, uyuşmayan 0/.test(satirB(17)), `-> ${bt.kod} ${satirB(17)}`);
  ok('R7 kabul 18 (bulten ile de): not yok, API = formul -> GECTI', satirB(18).startsWith('[GEÇTİ]') && satirB(18).includes('not yok, API = formül'), `-> ${satirB(18)}`);
  S.ayarla({ host: ONIZ, gun: gunK });
  const bk = await kos([], { KABUL_BULTEN_CSV: bultenYaz('bulten-bozuk.csv', true), KABUL_YENIDEN_BEKLE_AZAMI_MS: '200', KABUL_TOHUM: '7' });
  const satirK = (no) => bk.cikti.split('\n').find((l) => new RegExp(`^\\[[^\\]]+\\] +${no} `).test(l)) || '';
  ok('R7 kabul 17 (bozuk bulten): 03-11 gercek fark KALIR (uyusmayan 1); 01-13 farki API = formul -> bilinen bulten farki 1; ham deger basilmaz', bk.kod === 1 && satirK(17).startsWith('[KALDI]') && /bilinen bülten farkı 1, uyuşmayan 1, null uyuşmazlığı 0, yön uyuşmazlığı 0, en büyük fark 12\.34/.test(satirK(17)) && satirK(18).startsWith('[GEÇTİ]') && !/\d{1,3}(\.\d{3})*,\d{2}/.test(bk.cikti.replace(/0,01/g, '')) && !bk.cikti.includes('ornek.invalid'), `-> ${satirK(17)} | ${satirK(18)}`);
  // R7: bülten 1–25 Ocak'ta eski kurala göre (her saat) + 2026-11-03 12:00 → bilinen bülten farkı; madde 17 GEÇER
  S.ayarla({ host: ONIZ, gun: gunK });
  const be = await kos([], { ...proxyEnv, KABUL_BULTEN_CSV: bultenYaz('bulten-eski.csv', 'eski'), KABUL_YENIDEN_BEKLE_AZAMI_MS: '200' });
  const satirE = (no) => be.cikti.split('\n').find((l) => new RegExp(`^\\[[^\\]]+\\] +${no} `).test(l)) || '';
  const bil = (k) => Number((new RegExp(`${k}: [^;]*?bilinen bülten farkı (\\d+), uyuşmayan 0,`).exec(satirE(17)) || [])[1]);
  ok('R7 kabul 17 (bulten Ocakta eski kural): GECTI; site ve proxyde bilinen bulten farki >= 144, uyusmayan 0', be.kod === 0 && satirE(17).startsWith('[GEÇTİ]') && bil('site') >= 144 && bil('proxy') >= 144, `-> ${be.kod} ${satirE(17)}`);
  // R7 madde 18: sunucuda (UYDURMA) Ocak notu varken API = formül → KALDI "NOT KALDIRILMALI"
  S.ayarla({ host: ONIZ, gun: gunK });
  _yayimIstisnaTablosu([{ bas: '2026-01-01', bit: '2026-01-25', not: 't' }], { t: 'UYDURMA TEST NOTU: 1–25 Ocak 2026 teslim günlerinde EPİAŞ\'ın yayımladığı dengesizlik fiyatları formülden farklıdır.' });
  const n18 = await kos([], { KABUL_YENIDEN_BEKLE_AZAMI_MS: '200' });
  _yayimIstisnaTablosu();
  const s18 = (c) => c.cikti.split('\n').find((l) => /^\[[^\]]+\] +18 /.test(l)) || '';
  ok('R7 kabul 18: not gosterilirken API = formul -> KALDI "NOT KALDIRILMALI"', n18.kod === 1 && s18(n18).startsWith('[KALDI]') && s18(n18).includes('NOT KALDIRILMALI (API = formül); sayfa notu 3/3, JSON yayimNotlari 1'), `-> ${s18(n18)}`);
  // R7 madde 18: API formülden farklı (not yok) → KALDI, inceleme
  S.ayarla({ host: ONIZ, gun: (g) => gunK(g).map((o) => (g <= '2026-01-25' && o.negatif !== null ? { ...o, negatif: o.negatif + 10 } : o)) });
  const f18 = await kos([], { KABUL_YENIDEN_BEKLE_AZAMI_MS: '200' });
  ok('R7 kabul 18: API != formul -> KALDI (Hukuk ve Enerji Piyasasi incelemeli)', f18.kod === 1 && s18(f18).startsWith('[KALDI]') && s18(f18).includes('API ≠ formül: Hukuk ve Enerji Piyasası incelemeli') && /0,01'den büyük fark 72/.test(s18(f18)), `-> ${s18(f18)}`);
  // 2026-11-01 üst akışta çift satır: özdeş kopya → tek satır (GEÇTİ); çelişen kopya → "—" (KALDI)
  const ciftle = (celiski) => (j) => { for (const g of j.gunler) if (g.tarih === '2026-11-01') g.donemler = [...g.donemler, ...g.donemler.map((d, i) => (celiski && i === 9 ? { ...d, ptf: d.ptf + 1 } : { ...d }))]; return j; };
  S.ayarla({ host: ONIZ, gun: gunK, duzenle: ciftle(false) });
  const c1 = await kos([], { ...proxyEnv, KABUL_YENIDEN_BEKLE_AZAMI_MS: '200' });
  const s15 = (c) => c.cikti.split('\n').find((l) => /^\[[^\]]+\] +15 /.test(l)) || '';
  ok('D kabul 15: ust akista ozdes cift satir -> tek satir, GECTI (proxy ham satir 48)', s15(c1).startsWith('[GEÇTİ]') && /proxy: ham satır 48, tekil 24/.test(s15(c1)), `-> ${s15(c1)}`);
  S.ayarla({ host: ONIZ, gun: gunK, duzenle: ciftle(true) });
  const c2 = await kos([], { KABUL_YENIDEN_BEKLE_AZAMI_MS: '200' });
  ok('D kabul 15: celisen kopya -> o donem "—", madde KALIR', s15(c2).startsWith('[KALDI]') && /yayımlanan 23;/.test(s15(c2)) && /tümü "—" satır 1/.test(s15(c2)), `-> ${s15(c2)}`);
  // R6 madde 19: 2026-11-12 tek dönem formülden farklı -> "†" yakalanır, madde KALIR
  S.ayarla({ host: ONIZ, gun: (g) => gunK(g).map((o, i) => (g === '2026-11-12' && i === 12 ? { ...o, negatif: o.negatif + 6.25 } : o)) });
  const c19 = await kos([]);
  const s19 = c19.cikti.split('\n').find((l) => /^\[[^\]]+\] +19 /.test(l)) || '';
  ok('R6 kabul 19: tek fark -> "†" 1, fark notu 1, 0,01 ustu fark 1, KALIR', c19.kod === 1 && s19.startsWith('[KALDI]') && /"†" 1, dolu fark notu 1,/.test(s19) && /0,01'den büyük fark 1,/.test(s19), `-> ${s19}`);
  S.ayarla({});
  S.ayarla({ env: {}, host: ONIZ });
  const f = await kos([]);
  ok('D kabul: baglanti yokken madde 1 KALIR, cikis 1', f.kod === 1 && /\[KALDI\] +1 /.test(f.cikti));
  await S.kapat();
  await new Promise((coz) => P.close(coz));
  await new Promise((coz) => ON.close(coz));
}

console.error = gercekHata;
console.warn = gercekUyari;
rmSync(gecici, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
