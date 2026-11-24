/**
 * GET /dengesizlik-maliyeti/veri — sayfadaki tablonun makinece okunur hâli.
 *
 *   ?tarih=YYYY-MM-DD            tek gün (verilmezse bugün, Europe/Istanbul)
 *   ?bas=YYYY-MM-DD&bit=YYYY-MM-DD   tarih aralığı, uçlar dahil, en çok 31 gün
 *   &bicim=json|csv|xlsx         varsayılan json
 *
 * JSON ALANLARI (kararlı; yeniden adlandırılmaz, yalnız ekleme yapılır):
 *   surum, baslik, sayfa, kaynak{ad,rapor,url}, yayinci, birim, saatDilimi,
 *   tarih | bas+bit, cekildi (EPİAŞ'tan alındığı an, ISO-8601 +03:00),
 *   bayat (true ise EPİAŞ'a şu an ulaşılamadı; veri "cekildi" anına aittir),
 *   ozet{toplam,yayimlanan,ptfOrt,smfOrt,pozitifOrt,negatifOrt,maliyetPozitifOrt,maliyetNegatifOrt,yon{acik,fazla,denge}},
 *   kurallar[{bas,bit,V,B,k,l,AFL,asgari,tavanCarpani,kaynak}], atif, alanlar, not,
 *   donemler[{bas,bit,dk,ptf,smf,yon,pozitif,negatif,maliyetPozitif,maliyetNegatif}]
 * Yayımlanmamış değer null'dır (0 değildir).
 *
 * CSV: UTF-8 + BOM, ayırıcı ";", ondalık virgül, CRLF (Türkçe Excel'de doğrudan açılır).
 * XLSX: sayılar sayısal hücre.
 *
 * DÜRÜSTLÜK: veri yoksa 503 döner; boş ama "başarılı" dosya üretilmez.
 * Bilerek /api/ altında DEĞİL: robots.txt /api/ yolunu kapatır, bu uç yapay zekâ
 * ajanlarınca çekilebilir kalmalı. Arama dizinine girmesin diye X-Robots-Tag: noindex.
 * CORS başlığı ve OPTIONS işleyicisi YOK (aynı köken). HEAD yalnız önbellekten
 * yanıtlanır; EPİAŞ'a gitmez.
 */
import {
  kuralBul, KURALLAR, ozet, tarihGecerli, ymdGecerli, istanbulBugun, gunEkle, gunFarki, donemGunu, donemDakikasi,
  YON_ADI, ATIF, SAYFA_URL, AZAMI_ARALIK_GUN, ILK_GUN, OFSET,
} from '../_lib/dengesizlik.js';
import { gunGetir, aralikGetir } from '../_lib/epias.js';
import { xlsxYaz } from '../_lib/xlsx.js';

// CORS başlığı BİLEREK yok: sayfa aynı kökenden çalışır; başka sitelerin bu ucu
// ziyaretçi tarayıcısından çağırması istenmez (Hukuk R7). Sunucudan sunucuya
// (ajanlar, betikler) erişim CORS'a bağlı değildir.
const ORTAK = {
  'X-Robots-Tag': 'noindex',
  'X-Content-Type-Options': 'nosniff',
};

/** Toplam süre sınırı (giriş + rapor): aşılırsa bayat veri ya da 503. */
const SURE_MS = 9000;

const NOT = 'Değerler EPİAŞ Şeffaflık Platformu\'nda yayımlandığı hâliyle aktarılır ve sonradan revize edilebilir. Kesin tutarlar EPİAŞ\'ın nihai uzlaştırma bildirimiyle belirlenir; geçmişe dönük düzeltme yapılabilir. maliyetPozitif ve maliyetNegatif mevzuat terimi değildir; Voltage Enerji\'nin bu veriden türettiği göstergedir. Yayımlanmamış değer null\'dır. Bilgilendirme amaçlıdır; teklif ya da taahhüt değildir.';

const ALANLAR = {
  bas: 'Dönem başlangıcı (ISO-8601, +03:00)',
  bit: 'Dönem bitişi (ISO-8601, +03:00)',
  dk: 'Dönem uzunluğu (dakika)',
  ptf: 'Piyasa Takas Fiyatı (TL/MWh)',
  smf: 'Sistem Marjinal Fiyatı (TL/MWh)',
  yon: 'Sistem yönü: acik (enerji açığı) | fazla (enerji fazlası) | denge (dengede) | null (yayımlanmadı)',
  pozitif: 'EPİAŞ\'ın yayımladığı pozitif dengesizlik fiyatı (TL/MWh)',
  negatif: 'EPİAŞ\'ın yayımladığı negatif dengesizlik fiyatı (TL/MWh)',
  maliyetPozitif: 'PTF − pozitif dengesizlik fiyatı (TL/MWh); türetilmiş gösterge',
  maliyetNegatif: 'Negatif dengesizlik fiyatı − PTF (TL/MWh); türetilmiş gösterge',
};

const CSV_BASLIK = [
  'Tarih', 'Dönem başlangıcı', 'Dönem bitişi', 'Süre (dk)', 'PTF (TL/MWh)', 'SMF (TL/MWh)', 'Sistem yönü',
  'Pozitif dengesizlik fiyatı (TL/MWh)', 'Negatif dengesizlik fiyatı (TL/MWh)',
  'PTF\'ye göre maliyet, pozitif dengesizlik (TL/MWh)', 'PTF\'ye göre maliyet, negatif dengesizlik (TL/MWh)',
];

const NEDEN_MESAJI = {
  'kimlik-yok': 'Veri bağlantısı henüz yapılandırılmadı.',
  bos: 'EPİAŞ bu tarih için henüz veri yayımlamadı.',
  eksik: 'EPİAŞ yanıtı istenen aralığın tamamını kapsamıyor.',
};

function json(govde, durum, ek) {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...ORTAK, 'Content-Type': 'application/json; charset=utf-8', ...ek },
  });
}

function hata(durum, kod, mesaj, ek) {
  return json({ hata: { kod, mesaj } }, durum, { 'Cache-Control': 'no-store', ...ek });
}

const iki = (n) => String(n).padStart(2, '0');
const saat = (dk) => `${iki(Math.floor(dk / 60))}:${iki(dk % 60)}`;

/** Dönem bitişi ISO: gün sonunda ertesi günün 00:00'ı. */
function bitisIso(d) {
  const son = donemDakikasi(d) + d.dk;
  const gun = donemGunu(d);
  return son >= 1440 ? `${gunEkle(gun, 1)}T${saat(son - 1440)}:00${OFSET}` : `${gun}T${saat(son)}:00${OFSET}`;
}

function kurallarAralik(bas, bit) {
  const out = [];
  for (const k of KURALLAR) {
    if (k.bit < bas || k.bas > bit) continue;
    // Aynı kural diliminde tavan değişebilir (4/4/2026): uç günlerin ikisi de bildirilir.
    const uclar = [k.bas > bas ? k.bas : bas, k.bit < bit ? k.bit : bit];
    const gorulen = new Set();
    for (const g of uclar) {
      const r = kuralBul(g);
      const anahtar = `${r.bas}|${r.AFL}`;
      if (gorulen.has(anahtar)) continue;
      gorulen.add(anahtar);
      out.push({ bas: r.bas, bit: r.bit, V: r.V, B: r.B, k: r.k, l: r.l, AFL: r.AFL, asgari: r.asgari, tavanBas: r.tavanBas, tavanCarpani: r.tavanCarpani, kaynak: r.kaynak });
    }
  }
  return out;
}

function csvAlan(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(v).replace('.', ',');
  const s = String(v);
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function satirlar(donemler) {
  return donemler.map((d) => {
    const b = donemDakikasi(d);
    return [
      donemGunu(d), saat(b), saat(b + d.dk), d.dk, d.ptf, d.smf, d.yon ? YON_ADI[d.yon] : null,
      d.pozitif, d.negatif, d.maliyetPozitif, d.maliyetNegatif,
    ];
  });
}

async function yanit(context, govdesiz) {
  try {
    const { request, env } = context;
    const u = new URL(request.url);
    const q = u.searchParams;
    // context.secenek yalnız testlerde vardır (sahte fetch / sabit saat); üretimde tanımsızdır.
    const sec = context.secenek;
    const bugun = istanbulBugun(sec && typeof sec.simdi === 'function' ? sec.simdi() : Date.now());
    // HEAD yalnız önbellekten yanıtlanır: gövdesiz bir istek EPİAŞ'a gitmez.
    const cekim = { sureMs: SURE_MS, ...(sec || {}), yalnizOnbellek: govdesiz };
    const bicim = (q.get('bicim') || 'json').toLowerCase();
    if (!['json', 'csv', 'xlsx'].includes(bicim)) {
      return hata(400, 'gecersiz-bicim', 'Geçersiz biçim. Geçerli değerler: json, csv, xlsx.');
    }

    const aralik = q.has('bas') || q.has('bit');
    let sonuc, dosyaAdi, ust;
    if (aralik) {
      const bas = q.get('bas') || '', bit = q.get('bit') || '';
      if (!ymdGecerli(bas) || !ymdGecerli(bit)) {
        return hata(400, 'gecersiz-tarih', 'Tarih aralığı için bas ve bit birlikte, YYYY-AA-GG biçiminde verilmelidir.');
      }
      if (bas > bit) return hata(400, 'gecersiz-aralik', 'Başlangıç tarihi bitiş tarihinden sonra olamaz.');
      if (!tarihGecerli(bas, bugun) || !tarihGecerli(bit, bugun)) {
        return hata(400, 'tarih-aralik-disi', `Tarihler ${ILK_GUN} ile ${bugun} (bugün) arasında olmalıdır.`);
      }
      if (gunFarki(bas, bit) + 1 > AZAMI_ARALIK_GUN) {
        return hata(400, 'aralik-uzun', `Tek istekte en çok ${AZAMI_ARALIK_GUN} gün indirilebilir.`);
      }
      sonuc = await aralikGetir(env, context, bas, bit, cekim);
      dosyaAdi = `dengesizlik-maliyeti-${bas}_${bit}`;
      ust = { bas, bit };
    } else {
      const tarih = q.has('tarih') ? q.get('tarih') || '' : bugun;
      if (!ymdGecerli(tarih)) return hata(400, 'gecersiz-tarih', 'Geçersiz tarih. Biçim: YYYY-AA-GG (örnek: 2026-11-23).');
      if (!tarihGecerli(tarih, bugun)) {
        return hata(400, 'tarih-aralik-disi', `Tarih ${ILK_GUN} ile ${bugun} (bugün) arasında olmalıdır.`);
      }
      sonuc = await gunGetir(env, context, tarih, cekim);
      dosyaAdi = `dengesizlik-maliyeti-${tarih}`;
      ust = { tarih };
    }

    if (govdesiz && sonuc && sonuc.durum !== 'veri' && sonuc.neden === 'onbellek-yok') {
      // Önbellekte kayıt yok: durum bilinmiyor. EPİAŞ'a gidilmez; asıl sonucu GET verir.
      const tur = { json: 'application/json; charset=utf-8', csv: 'text/csv; charset=utf-8', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }[bicim];
      return new Response(null, { status: 200, headers: { ...ORTAK, 'Content-Type': tur, 'Cache-Control': 'no-store', 'X-Veri-Durum': 'onbellekte-yok' } });
    }
    if (!sonuc || sonuc.durum !== 'veri' || !sonuc.donemler.length) {
      const neden = (sonuc && sonuc.neden) || 'hata';
      const acik = NEDEN_MESAJI[neden] || 'EPİAŞ Şeffaflık Platformu\'na şu anda ulaşılamıyor.';
      return hata(503, 'veri-yok', `${acik} Uydurma ya da boş dosya üretilmez; lütfen daha sonra yeniden deneyin.`, { 'Retry-After': '60' });
    }

    const son = ust.tarih || ust.bit;
    const azami = sonuc.bayat ? 60 : (son >= gunEkle(bugun, -1) ? 300 : 3600);
    const onbellek = { 'Cache-Control': `public, max-age=${azami}` };

    if (bicim === 'csv') {
      const metin = '﻿' + [CSV_BASLIK, ...satirlar(sonuc.donemler)].map((r) => r.map(csvAlan).join(';')).join('\r\n') + '\r\n';
      return new Response(govdesiz ? null : metin, {
        headers: { ...ORTAK, ...onbellek, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${dosyaAdi}.csv"` },
      });
    }
    if (bicim === 'xlsx') {
      const bayt = xlsxYaz({
        sayfaAdi: ust.tarih || `${ust.bas} ${ust.bit}`,
        basliklar: CSV_BASLIK,
        satirlar: satirlar(sonuc.donemler),
        sutunlar: [{ genislik: 12 }, { genislik: 10 }, { genislik: 10 }, { genislik: 9 }, { genislik: 14, ondalik: true }, { genislik: 14, ondalik: true }, { genislik: 16 },
          { genislik: 20, ondalik: true }, { genislik: 20, ondalik: true }, { genislik: 24, ondalik: true }, { genislik: 24, ondalik: true }],
      });
      return new Response(govdesiz ? null : bayt, {
        headers: {
          ...ORTAK, ...onbellek,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${dosyaAdi}.xlsx"`,
        },
      });
    }

    const govde = {
      surum: '1',
      baslik: 'Dengesizlik maliyeti: PTF, SMF, sistem yönü, pozitif ve negatif dengesizlik fiyatı',
      sayfa: SAYFA_URL,
      kaynak: { ad: 'EPİAŞ Şeffaflık Platformu', rapor: 'PTF, SMF ve SDF Listeleme', url: 'https://seffaflik.epias.com.tr/' },
      yayinci: 'Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.)',
      birim: 'TL/MWh',
      saatDilimi: 'Europe/Istanbul (UTC+03:00)',
      ...ust,
      cekildi: sonuc.cekildi,
      bayat: !!sonuc.bayat,
      ozet: ozet(sonuc.donemler),
      kurallar: kurallarAralik(ust.tarih || ust.bas, ust.tarih || ust.bit),
      atif: ATIF,
      alanlar: ALANLAR,
      not: NOT,
      donemler: sonuc.donemler.map((d) => ({
        bas: d.bas, bit: bitisIso(d), dk: d.dk, ptf: d.ptf, smf: d.smf, yon: d.yon,
        pozitif: d.pozitif, negatif: d.negatif, maliyetPozitif: d.maliyetPozitif, maliyetNegatif: d.maliyetNegatif,
      })),
    };
    return new Response(govdesiz ? null : JSON.stringify(govde), {
      headers: { ...ORTAK, ...onbellek, 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `inline; filename="${dosyaAdi}.json"` },
    });
  } catch (e) {
    console.error('dengesizlik veri ucu beklenmeyen hata —', e && e.name);
    return hata(503, 'veri-yok', 'Veri şu anda sunulamıyor. Uydurma ya da boş dosya üretilmez; lütfen daha sonra yeniden deneyin.', { 'Retry-After': '60' });
  }
}

export async function onRequestGet(context) { return yanit(context, false); }
export async function onRequestHead(context) { return yanit(context, true); }
