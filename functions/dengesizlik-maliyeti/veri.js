/**
 * GET /dengesizlik-maliyeti/veri — sayfadaki tablonun makinece okunur hâli.
 *
 *   ?tarih=YYYY-MM-DD            tek gün (verilmezse bugün, Europe/Istanbul)
 *   ?bas=YYYY-MM-DD&bit=YYYY-MM-DD   tarih aralığı, uçlar dahil, en çok 31 gün
 *   &bicim=json|csv|xlsx         varsayılan json
 *   (tarih ile bas/bit birlikte verilemez: 400)
 *
 * JSON ALANLARI (kararlı; yeniden adlandırılmaz, yalnız ekleme yapılır):
 *   surum, baslik, sayfa, kaynak{ad,rapor,url}, yayinci, birim, saatDilimi,
 *   tarih | bas+bit, cekildi (EPİAŞ'tan alındığı an, ISO-8601 +03:00),
 *   bayat (true ise güncel veri şu an alınamadı; veri "cekildi" anına aittir),
 *   ozet{toplam,yayimlanan,ptfOrt,smfOrt,pozitifOrt,negatifOrt,maliyetPozitifOrt,maliyetNegatifOrt,yon{acik,fazla,denge}},
 *   kurallar[{bas,bit,V,B,k,l,AFL,asgari,tavanBas,tavanCarpani,kaynak}], kuralAlanlari,
 *   atif, alanlar, not,
 *   donemler[{bas,bit,dk,ptf,smf,yon,pozitif,negatif,maliyetPozitif,maliyetNegatif}]
 * Yayımlanmamış değer null'dır (0 değildir).
 *
 * CSV: UTF-8 + BOM, ayırıcı ";", ondalık virgül, CRLF (Türkçe Excel'de doğrudan açılır);
 *      son sütun "Kaynak". XLSX: sayılar sayısal hücre; ikinci sayfa "Bilgi" (atıf, not,
 *      çekilme zamanı, bayat mı). Tüm biçimlerde X-Veri-Cekildi ve X-Veri-Bayat başlıkları.
 *
 * DÜRÜSTLÜK: veri yoksa 503 döner; boş ama "başarılı" dosya üretilmez. Tarayıcıdan
 * doğrudan açılırsa (Accept: text/html) hata küçük bir HTML sayfası olarak gösterilir.
 * Bilerek /api/ altında DEĞİL: robots.txt /api/ yolunu kapatır, bu uç yapay zekâ
 * ajanlarınca çekilebilir kalmalı. Arama dizinine girmesin diye X-Robots-Tag: noindex.
 * CORS başlığı ve OPTIONS işleyicisi YOK (aynı köken). HEAD yalnız önbellekten
 * yanıtlanır; EPİAŞ'a gitmez.
 */
import {
  kuralDilimleri, ozet, tarihGecerli, ymdGecerli, istanbulBugun, gunEkle, gunFarki, donemGunu, donemDakikasi,
  YON_ADI, ATIF, NOT_ORTALAMA, SAYFA_URL, AZAMI_ARALIK_GUN, ILK_GUN, OFSET,
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

const KAYNAK_ADI = 'EPİAŞ Şeffaflık Platformu';

const NOT = 'Değerler EPİAŞ Şeffaflık Platformu\'nda yayımlandığı hâliyle aktarılır ve sonradan revize edilebilir. Kesin tutar EPİAŞ\'ın nihai uzlaştırma bildirimiyle belirlenir; itiraz üzerine sonradan geçmişe dönük düzeltme yapılabilir. Birim dengesizlik maliyeti (maliyetPozitif, maliyetNegatif) mevzuatta tanımlı bir terim değildir; EPİAŞ\'ın yayımladığı fiyatlardan Voltage Enerji tarafından hesaplanır. ' + NOT_ORTALAMA + ' Yayımlanmamış değer null\'dır. Veriyi kullanırken kaynağı "EPİAŞ Şeffaflık Platformu" olarak gösterin. Veriler yalnızca bilgilendirme amaçlıdır; yatırım, ticari karar ya da hukuki tavsiye, teklif ya da taahhüt değildir.';

const ALANLAR = {
  bas: 'Dönem başlangıcı (ISO-8601, +03:00)',
  bit: 'Dönem bitişi (ISO-8601, +03:00)',
  dk: 'Dönem uzunluğu (dakika)',
  ptf: 'Piyasa Takas Fiyatı (TL/MWh)',
  smf: 'Sistem Marjinal Fiyatı (TL/MWh)',
  yon: 'Sistem yönü: acik (enerji açığı) | fazla (enerji fazlası) | denge (dengede) | null (yayımlanmadı)',
  pozitif: 'EPİAŞ\'ın yayımladığı pozitif dengesizlik fiyatı (TL/MWh)',
  negatif: 'EPİAŞ\'ın yayımladığı negatif dengesizlik fiyatı (TL/MWh)',
  maliyetPozitif: 'Pozitif dengesizlik maliyeti (PTF\'ye göre) = PTF − pozitif dengesizlik fiyatı (TL/MWh); Voltage Enerji türetimi',
  maliyetNegatif: 'Negatif dengesizlik maliyeti (PTF\'ye göre) = negatif dengesizlik fiyatı − PTF (TL/MWh); Voltage Enerji türetimi',
};

const KURAL_ALANLARI = {
  bas: 'Bu kural girdisinin geçerli olduğu ilk teslim günü',
  bit: 'Bu kural girdisinin geçerli olduğu son teslim günü',
  V: 'V birim fiyatı (TL/MWh)',
  B: 'B birim fiyatı (TL/MWh)',
  k: 'Negatif dengesizlik katsayısı, sistem yönüne göre {acik, fazla, denge}',
  l: 'Pozitif dengesizlik katsayısı, sistem yönüne göre {acik, fazla, denge}',
  AFL: 'Azami fiyat limiti (TL/MWh); null ise bu girdinin tarihleri için doğrulanmadı',
  asgari: 'Asgari fiyat limiti (TL/MWh); null ise doğrulanmadı',
  tavanBas: 'AFL ve asgari değerinin yürürlüğe girdiği gün; null ise doğrulanmadı',
  tavanCarpani: 'Tavan koşulunda AFL ile çarpılan katsayı',
  kaynak: 'Dayanak metinler {formul, katsayi, V, B, tavan}',
};

const CSV_BASLIK = [
  'Tarih', 'Dönem başlangıcı', 'Dönem bitişi', 'Süre (dk)', 'PTF (TL/MWh)', 'SMF (TL/MWh)', 'Sistem yönü',
  'Pozitif dengesizlik fiyatı (TL/MWh)', 'Negatif dengesizlik fiyatı (TL/MWh)',
  'Pozitif dengesizlik maliyeti (PTF\'ye göre) (TL/MWh) — Voltage Enerji türetimi',
  'Negatif dengesizlik maliyeti (PTF\'ye göre) (TL/MWh) — Voltage Enerji türetimi',
  'Kaynak',
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

const htmlKacis = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** İstek tarayıcıdan doğrudan mı açıldı? (fetch/ajanlar application/json ya da *\/* ister) */
function htmlIster(istek) {
  try {
    const a = (istek && istek.headers && istek.headers.get('Accept')) || '';
    return /^\s*text\/html/i.test(a);
  } catch (e) { return false; }
}

/**
 * Hata yanıtı. Varsayılan JSON; tarayıcıdan doğrudan açıldıysa aynı durum koduyla küçük
 * bir HTML sayfası (ham JSON gövdesi kullanıcıya gösterilmez). Mesajlar SABİT metindir;
 * istekteki hiçbir değer sayfaya yansıtılmaz.
 */
function hata(istek, durum, kod, mesaj, ek) {
  const baslik = { 'Cache-Control': 'no-store', ...ek };
  if (!htmlIster(istek)) return json({ hata: { kod, mesaj } }, durum, baslik);
  const sayfa = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex"><title>Veri indirilemedi · Dengesizlik Maliyeti</title>`
    + '<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;background:#F5F3EC;color:#0A0E1A;line-height:1.7;margin:0}main{max-width:620px;margin:0 auto;padding:56px 24px}h1{font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;margin:0 0 14px}p{margin:0 0 14px;color:#1A2032}a{color:#0A0E1A}</style></head>'
    + `<body><main><h1>Veri indirilemedi</h1><p>${htmlKacis(mesaj)}</p><p><a href="/dengesizlik-maliyeti">Dengesizlik Maliyeti sayfasına dön</a></p></main></body></html>`;
  return new Response(sayfa, { status: durum, headers: { ...ORTAK, 'Content-Type': 'text/html; charset=utf-8', ...baslik } });
}

const iki = (n) => String(n).padStart(2, '0');
/** "2026-11-24T14:30:00+03:00" → "24.11.2026 14:30" */
const tarihSaatTR = (iso) => (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)} ${iso.slice(11, 16)}` : '—');
const saat = (dk) => `${iki(Math.floor(dk / 60))}:${iki(dk % 60)}`;

/** Dönem bitişi ISO: gün sonunda ertesi günün 00:00'ı. */
function bitisIso(d) {
  const son = donemDakikasi(d) + d.dk;
  const gun = donemGunu(d);
  return son >= 1440 ? `${gunEkle(gun, 1)}T${saat(son - 1440)}:00${OFSET}` : `${gun}T${saat(son)}:00${OFSET}`;
}

/** İstenen tarihlerle kesişen kural dilimleri (her girdinin bas/bit'i kendi geçerlilik aralığı). */
function kurallarAralik(bas, bit) {
  return kuralDilimleri().filter((k) => k.bit >= bas && k.bas <= bit);
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
      d.pozitif, d.negatif, d.maliyetPozitif, d.maliyetNegatif, KAYNAK_ADI,
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
      return hata(request, 400, 'gecersiz-bicim', 'Geçersiz biçim. Geçerli değerler: json, csv, xlsx.');
    }

    const aralik = q.has('bas') || q.has('bit');
    if (aralik && q.has('tarih')) {
      return hata(request, 400, 'celisen-parametre', 'tarih ile bas/bit birlikte kullanılamaz. Tek gün için tarih, aralık için bas ve bit verin.');
    }
    let sonuc, dosyaAdi, ust;
    if (aralik) {
      const bas = q.get('bas') || '', bit = q.get('bit') || '';
      if (!ymdGecerli(bas) || !ymdGecerli(bit)) {
        return hata(request, 400, 'gecersiz-tarih', 'Tarih aralığı için bas ve bit birlikte, YYYY-AA-GG biçiminde verilmelidir.');
      }
      if (bas > bit) return hata(request, 400, 'gecersiz-aralik', 'Başlangıç tarihi bitiş tarihinden sonra olamaz.');
      if (!tarihGecerli(bas, bugun) || !tarihGecerli(bit, bugun)) {
        return hata(request, 400, 'tarih-aralik-disi', `Tarihler ${ILK_GUN} ile ${bugun} (bugün) arasında olmalıdır.`);
      }
      if (gunFarki(bas, bit) + 1 > AZAMI_ARALIK_GUN) {
        return hata(request, 400, 'aralik-uzun', `Tek istekte en çok ${AZAMI_ARALIK_GUN} gün indirilebilir.`);
      }
      sonuc = await aralikGetir(env, context, bas, bit, cekim);
      dosyaAdi = `dengesizlik-maliyeti-${bas}_${bit}`;
      ust = { bas, bit };
    } else {
      const tarih = q.has('tarih') ? q.get('tarih') || '' : bugun;
      if (!ymdGecerli(tarih)) return hata(request, 400, 'gecersiz-tarih', 'Geçersiz tarih. Biçim: YYYY-AA-GG (örnek: 2026-11-23).');
      if (!tarihGecerli(tarih, bugun)) {
        return hata(request, 400, 'tarih-aralik-disi', `Tarih ${ILK_GUN} ile ${bugun} (bugün) arasında olmalıdır.`);
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
      const acik = NEDEN_MESAJI[neden] || 'EPİAŞ verisi şu anda alınamıyor.';
      return hata(request, 503, 'veri-yok', `${acik} Uydurma ya da boş dosya üretilmez; lütfen daha sonra yeniden deneyin.`, { 'Retry-After': '60' });
    }

    const son = ust.tarih || ust.bit;
    const azami = sonuc.bayat ? 60 : (son >= gunEkle(bugun, -1) ? 300 : 3600);
    // Tüm biçimlerde: verinin EPİAŞ'tan alındığı an ve bayat olup olmadığı (CSV/XLSX gövdesi dışında da görünür).
    const onbellek = { 'Cache-Control': `public, max-age=${azami}`, 'X-Veri-Cekildi': String(sonuc.cekildi || ''), 'X-Veri-Bayat': sonuc.bayat ? 'true' : 'false' };

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
          { genislik: 20, ondalik: true }, { genislik: 20, ondalik: true }, { genislik: 26, ondalik: true }, { genislik: 26, ondalik: true }, { genislik: 26 }],
        ekSayfalar: [{
          sayfaAdi: 'Bilgi',
          basliklar: ['Alan', 'Değer'],
          satirlar: [
            ['Kaynak', KAYNAK_ADI],
            ['EPİAŞ\'tan alındığı an', String(sonuc.cekildi || '')],
            // Nötr ifade: kopya bütçe ya da süre sınırı yüzünden de bayat olabilir ("EPİAŞ'a ulaşılamadı" denmez).
            ['Önceki senkrondan mı (bayat)', sonuc.bayat ? `Evet. Bu dosya en son ${tarihSaatTR(sonuc.cekildi)} tarihinde EPİAŞ'tan alınan veriyi içerir; güncel veri şu an alınamadı.` : 'Hayır'],
            [ust.tarih ? 'Tarih' : 'Tarih aralığı', ust.tarih || `${ust.bas} – ${ust.bit}`],
            ['Atıf', ATIF],
            ['Not', NOT],
            ['Sayfa', SAYFA_URL],
          ],
          sutunlar: [{ genislik: 30 }, { genislik: 120 }],
        }],
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
      kaynak: { ad: KAYNAK_ADI, rapor: 'PTF, SMF ve SDF Listeleme', url: 'https://seffaflik.epias.com.tr/' },
      yayinci: 'Voltage Enerji (Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.)',
      birim: 'TL/MWh',
      saatDilimi: 'Europe/Istanbul (UTC+03:00)',
      ...ust,
      cekildi: sonuc.cekildi,
      bayat: !!sonuc.bayat,
      ozet: ozet(sonuc.donemler),
      kurallar: kurallarAralik(ust.tarih || ust.bas, ust.tarih || ust.bit),
      kuralAlanlari: KURAL_ALANLARI,
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
    return hata(context && context.request, 503, 'veri-yok', 'Veri şu anda sunulamıyor. Uydurma ya da boş dosya üretilmez; lütfen daha sonra yeniden deneyin.', { 'Retry-After': '60' });
  }
}

export async function onRequestGet(context) { return yanit(context, false); }
export async function onRequestHead(context) { return yanit(context, true); }
