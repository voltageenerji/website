#!/usr/bin/env node
/**
 * /dengesizlik-maliyeti — GERÇEK VERİ KABUL DENETİMİ (21 madde).
 *
 * Çalıştırma (çalışma dizini bir scratch klasörü olmalı; repo köküne hiçbir şey yazılmaz):
 *   KABUL_TABAN=https://<onizleme>.pages.dev node docs/qa/kabul-dengesizlik.mjs
 *   KABUL_TABAN=… KABUL_PROXY_URL=https://<proxy> KABUL_PROXY_ANAHTAR=<okuma belirteci> node docs/qa/kabul-dengesizlik.mjs
 *   … --yerel     insan denetimi gereken maddeler için TAM DEĞERLİ kontrol listesi basar
 *   KABUL_BULTEN_CSV=<yol>   EPİAŞ'ın herkese açık günlük bülteninden çıkarılmış saatlik CSV
 *                  (gun,saat,ptf,smf,yon A/F/D,poz_dengesizlik_fiyati,neg_dengesizlik_fiyati,…);
 *                  verilirse madde 17 koşar. Dosya repoya konmaz.
 *   KABUL_TOHUM=<sayı>        madde 17 gün örneklemesinin tohumu (varsayılan 20261125; tekrarlanabilir)
 *
 * ÇIKTI GÜVENLİĞİ (repo herkese açık; CI günlüğü herkese açık):
 *   - Varsayılan çıktı YALNIZ geçti/kaldı/atlandı ve toplamlardır (sayılar, en büyük fark, durum
 *     kodları). Ham satır, fiyat, yanıt gövdesi, belirteç, proxy adresi BASILMAZ.
 *   - Kesin değerli kontrol listesi (Şeffaflık ekranıyla elle karşılaştırma, Excel'de açma)
 *     yalnız --yerel ile basılır; --yerel CI'da kullanılmaz.
 *   - KABUL_PROXY_ANAHTAR yalnız proxy isteğinin Authorization başlığına girer; hiçbir çıktıda,
 *     hata metninde ya da dosyada yer almaz. Görülen her yanıtta belirtecin GEÇMEDİĞİ denetlenir.
 *
 * MADDELER (QA 2. tur "gerçek veri kabul denetimleri"; 1 ve 9–11 proxy mimarisine uyarlandı):
 *   1  İlk istek 200; X-Veri-Cekildi (ISO +03:00), X-Veri-Bayat, X-Veri-Uretildi var
 *   2  Bir tam gün (dün): dönem sayısı veriden, dönemler bitişik, hepsi yayımlanmış; proxy varsa birebir
 *   3  Bugün: yayımlanmamış dönemler null (0 değil), yayımlananlar başta; proxy varsa null'lar eşleşir
 *   4  Null/0 dürüstlüğü ve türetilmiş alanlar (maliyet = fark; tek işlenen yoksa null)
 *   5  Eşik altı dönemlerde (min(PTF; SMF) < V) yayımlanan pozitif fiyatın işareti
 *   6  Formül ile yayımlanan fiyat (yalnız kuralı doğrulanmış günler): en büyük fark ≤ 0,01
 *   7  Aylık aralık (30 gün) JSON/CSV/XLSX tek dosya, satır sayıları tutarlı; 32 gün → 400
 *   8  CSV/XLSX biçimi: BOM, 12 sütun, Kaynak, XLSX 2 sayfa; üç biçimde X-Veri-* başlıkları
 *   9  Önbellek penceresinde iki istemci aynı proxy yanıtını paylaşır (aynı X-Veri-Uretildi)
 *   10 Ziyaretçi trafiği bütçeyi aşan proxy çağrısı doğurmaz (farklı X-Veri-Uretildi ≤ 12/dk;
 *      aşan istekler dürüst 503 + Retry-After); HEAD proxy'ye gitmez
 *   11 Sitede EPİAŞ kimliği yok: repo taraması (functions/, sayfa) + canlı yanıt taraması
 *   12 SSR kanıtı: JS'siz (düz fetch ve Googlebot) sunucu HTML'inde 3 yayımlanmış dönemin
 *      sayıları tabloda, özet cümlesinde ortalamalar, JSON-LD'de çekim anı / kapsam
 *   13 Damga ve dizin: damga = cekildi (SON SENKRON iff bayat); önizleme hostunda
 *      X-Robots-Tag + meta "noindex, nofollow", üretimde tarihsiz sayfa dizine açık
 *   14 Yayımlanmış HER dönemin sistem yönü var: yönü null olan yayımlanmış dönem sayısı 0
 *      (dün, bugün, 30 günlük aralık ve 2026-11-01)
 *   15 2026-11-01 (üst akışta çift satır bildirildi): dönem başına TEK satır, çelişki yok (çelişen
 *      kopya "—" olurdu: tüm dönemler yayımlanmış), sayfada da aynı satır sayısı; proxy varsa ham
 *      kopya sayısı ve birebir karşılaştırma
 *   16 Geçmiş derinliği: 2026-01-01 veri döner (tam gün); Kasım öncesi bir gün (2026-10-15) sayfası sunucuda
 *      çizilir ve /veri kurallar[] o gün için V = 150 bildirir (R8: V sayfada gösterilmez)
 *   17 EPİAŞ günlük bülteniyle çapraz denetim (KABUL_BULTEN_CSV): ay başına 3 rastgele tamamlanmış gün
 *      + 2026-11-01 + 2026-01-26 + sabit günler; PTF, SMF, yön, pozitif ve negatif dengesizlik fiyatı; site
 *      (/veri) ve proxy (varsa). BİLİNEN BÜLTEN FARKI: EPİAŞ günlük bülten PDF'lerinde 1–25 Ocak 2026 ve
 *      2026-11-03 12:00 fiyatları eski kurala göre; Şeffaflık API değerleri formülle uyumlu (26.11.2026 kabul
 *      denetimi). Bu dönemlerde pozitif/negatif fiyat farkı, API değeri formüle eşitse ayrı sayılır ve
 *      maddeyi düşürmez; başka her fark (ve bu dönemlerde formüle eşit olmayan API değeri) düşürür.
 *      Yalnız sayılar ve en büyük mutlak fark basılır.
 *   18 1–25 Ocak 2026: sayfada yayım notu YOK ve API = formül. 01-01, 01-13, 01-25 için sayfanın tablo
 *      üstü notunda ve /veri yayimNotlari'nda yayım farkı notu olmamalı; site /veri (proxy varsa o da)
 *      değerleri her saatlik dönemde formülle ≤ 0,01. Not varken API = formül ise KALDI (not kaldırılmalı);
 *      API ≠ formül ise KALDI (Hukuk/Enerji Piyasası incelemeli). Bülten gerektirmez.
 *   19 Üç tam Kasım günü (2026-11-05, -12, -19): sayfada hiç "†" yok (R8: hiç basılmaz), fark notu yok; /veri değerleri
 *      formülle her dönemde ≤ 0,01 (sunucunun "dengesizlik-formul-farki" günlüğünü doğuracak fark
 *      yok; günlük dışarıdan okunamaz, koşulu bu yoldan denetlenir)
 *   20 Tam takvim ayı aralığı (bugünden önceki son tam ay): JSON/CSV/XLSX 200, ayın her günü var,
 *      satır sayıları üç biçimde ve gün başına dönem toplamıyla tutarlı
 *   21 İki aya yayılan 31 günlük aralık: aynı denetimler
 *
 * Çıkış kodu: kalan madde varsa 1. Proxy bilgisi verilmezse proxy karşılaştırmaları "atlandı".
 */
import { readFileSync, readdirSync } from 'node:fs';
import { birimFiyat } from '../../functions/_lib/dengesizlik.js';
import { bicim } from '../../functions/dengesizlik-maliyeti.js';

const YEREL = process.argv.includes('--yerel');
const TABAN = (process.env.KABUL_TABAN || '').replace(/\/+$/, '');
const PROXY = (process.env.KABUL_PROXY_URL || '').replace(/\/+$/, '');
const ANAHTAR = process.env.KABUL_PROXY_ANAHTAR || '';
const ZAMAN_ASIMI_MS = Number(process.env.KABUL_ZAMAN_ASIMI_MS) || 20000;
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const KOK = new URL('../../', import.meta.url);

if (!/^https?:\/\/[^/]+$/.test(TABAN)) {
  console.log('KABUL_TABAN gerekli (örnek: https://<dal>.<proje>.pages.dev). Çıkılıyor.');
  process.exit(2);
}
const proxyVar = !!(PROXY && ANAHTAR);

// ------------------------------------------------------------------ yardımcılar --
const sonuclar = [];
const kontrolListesi = [];
const gorulen = []; // canlı yanıtlar (yalnız tarama için; BASILMAZ)
function madde(no, ad, durum, ozet) { sonuclar.push({ no, ad, durum, ozet }); }
const GECTI = 'GEÇTİ', KALDI = 'KALDI', ATLANDI = 'ATLANDI';
const CEKILDI_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+03:00$/;
const gunEkle = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const tarihTR = (ymd) => `${ymd.slice(8, 10)}.${ymd.slice(5, 7)}.${ymd.slice(0, 4)}`;
const yayimlandi = (d) => d.pozitif !== null && d.negatif !== null;
const coz = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

async function al(yol, { yontem = 'GET', accept = 'application/json', ua = null, proxy = false } = {}) {
  const url = proxy ? `${PROXY}${yol}` : `${TABAN}${yol}`;
  const headers = { Accept: accept };
  if (ua) headers['User-Agent'] = ua;
  if (proxy) headers.Authorization = `Bearer ${ANAHTAR}`;
  try {
    const r = await fetch(url, { method: yontem, headers, redirect: 'manual', signal: AbortSignal.timeout(ZAMAN_ASIMI_MS) });
    const bayt = yontem === 'HEAD' ? new Uint8Array() : new Uint8Array(await r.arrayBuffer());
    const basliklar = {};
    r.headers.forEach((v, k) => { basliklar[k] = v; });
    const metin = new TextDecoder().decode(bayt);
    if (!proxy) gorulen.push(Object.entries(basliklar).map(([k, v]) => `${k}: ${v}`).join('\n') + '\n' + metin);
    return { durum: r.status, basliklar, bayt, metin, json: () => JSON.parse(metin) };
  } catch (e) {
    // Hata metni adres ya da belirteç taşıyabilir: yalnız türü döner.
    return { durum: 0, basliklar: {}, bayt: new Uint8Array(), metin: '', hata: e && e.name, json: () => null };
  }
}
const jsonAl = async (yol, sec) => { const r = await al(yol, sec); let j = null; try { j = r.durum === 200 ? r.json() : null; } catch (e) { j = null; } return { ...r, j }; };

const proxyGun = async (tarih) => {
  if (!proxyVar) return null;
  const r = await jsonAl(`/piyasa/v1/dengesizlik?tarih=${tarih}`, { proxy: true });
  const g = r.j && Array.isArray(r.j.gunler) ? r.j.gunler.find((x) => x && x.tarih === tarih) : null;
  return g ? g.donemler : null;
};

/** Sitedeki dönemleri proxy'nin dönemleriyle karşılaştırır → {karsilastirilan, uyusmayan, azamiFark, nullUyusmaz}. */
function karsilastir(site, proxyDonemleri) {
  const harita = new Map();
  for (const d of proxyDonemleri || []) if (!harita.has(d.bas)) harita.set(d.bas, d);
  let karsilastirilan = 0, uyusmayan = 0, azamiFark = 0, nullUyusmaz = 0, sifirUydurma = 0;
  for (const d of site) {
    const p = harita.get(d.bas);
    for (const a of ['ptf', 'smf', 'pozitif', 'negatif']) {
      const sv = d[a], pv = p ? p[a] : null;
      karsilastirilan++;
      if ((sv === null) !== (pv === null || pv === undefined)) { nullUyusmaz++; if (sv === 0) sifirUydurma++; continue; }
      if (sv === null) continue;
      const f = Math.abs(sv - pv);
      if (f > azamiFark) azamiFark = f;
      if (f > 1e-9) uyusmayan++;
    }
    if ((d.yon || null) !== ((p && p.yon) || null)) uyusmayan++;
  }
  return { karsilastirilan, uyusmayan, azamiFark, nullUyusmaz, sifirUydurma };
}

/** Bülten CSV'si → Map<gun, Map<saat, {ptf, smf, yon, poz, neg}>>. Boş alan null; yön A/F/D → acik/fazla/denge. */
function bultenOku(metin) {
  const satirlar = metin.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const alanlar = (s) => { const out = []; let a = '', t = false; for (let i = 0; i < s.length; i++) { const c = s[i]; if (t) { if (c === '"' && s[i + 1] === '"') { a += '"'; i++; } else if (c === '"') t = false; else a += c; } else if (c === '"') t = true; else if (c === ',') { out.push(a); a = ''; } else a += c; } out.push(a); return out; };
  const bas = alanlar(satirlar[0]);
  const i = (ad) => bas.indexOf(ad);
  const [iG, iS, iP, iM, iY, iPoz, iNeg] = ['gun', 'saat', 'ptf', 'smf', 'yon', 'poz_dengesizlik_fiyati', 'neg_dengesizlik_fiyati'].map(i);
  if ([iG, iS, iP, iM, iY, iPoz, iNeg].some((x) => x < 0)) return null;
  const sayi = (v) => (v === undefined || v.trim() === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);
  const YONB = { A: 'acik', F: 'fazla', D: 'denge' };
  const m = new Map();
  for (const s of satirlar.slice(1)) {
    const a = alanlar(s);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a[iG] || '')) continue;
    if (!m.has(a[iG])) m.set(a[iG], new Map());
    m.get(a[iG]).set(Number(a[iS]), { ptf: sayi(a[iP]), smf: sayi(a[iM]), yon: YONB[(a[iY] || '').trim()] || null, poz: sayi(a[iPoz]), neg: sayi(a[iNeg]) });
  }
  return m;
}

const kuralFor = (kurallar, ymd) => (Array.isArray(kurallar) ? kurallar.find((k) => ymd >= k.bas && ymd <= k.bit) : null) || null;

// ----------------------------------------------------------------------- akış --
console.log(`Dengesizlik maliyeti kabul denetimi · proxy karşılaştırması: ${proxyVar ? 'açık' : 'kapalı (KABUL_PROXY_URL/ANAHTAR yok)'}${YEREL ? ' · --yerel' : ''}`);

// 1 — ilk istek
const ilk = await jsonAl('/dengesizlik-maliyeti/veri?bicim=json');
const BUGUN = ilk.j && typeof ilk.j.tarih === 'string' ? ilk.j.tarih : null;
{
  const h = ilk.basliklar;
  const iyi = ilk.durum === 200 && !!ilk.j && CEKILDI_RE.test(h['x-veri-cekildi'] || '') && /^(true|false)$/.test(h['x-veri-bayat'] || '') && CEKILDI_RE.test(h['x-veri-uretildi'] || '') && Array.isArray(ilk.j.donemler) && ilk.j.donemler.length > 0;
  madde(1, 'İlk istek 200 + X-Veri-Cekildi/Bayat/Uretildi', iyi ? GECTI : KALDI, `durum ${ilk.durum}, dönem ${ilk.j && ilk.j.donemler ? ilk.j.donemler.length : 0}, bayat ${h['x-veri-bayat'] || '-'}`);
}
if (!BUGUN) {
  for (let no = 2; no <= 18; no++) madde(no, '(ilk istek başarısız; sonraki maddeler koşulamadı)', KALDI, `durum ${ilk.durum}`);
  bitir();
}
const DUN = gunEkle(BUGUN, -1);

// 2 — tam gün (dün)
const dun = await jsonAl(`/dengesizlik-maliyeti/veri?tarih=${DUN}&bicim=json`);
{
  const d = dun.j ? dun.j.donemler : [];
  const dk = d.length ? d[0].dk : null;
  const bitisik = d.every((x, i) => x.dk === dk && (i === 0 || Date.parse(x.bas) - Date.parse(d[i - 1].bas) === dk * 60000));
  const beklenenSayi = dk ? 1440 / dk : 0;
  const yayim = d.filter(yayimlandi).length;
  let ek = '', iyi = dun.durum === 200 && d.length === beklenenSayi && bitisik && yayim === d.length;
  if (proxyVar) {
    const k = karsilastir(d, await proxyGun(DUN));
    ek = `; proxy: ${k.karsilastirilan} değer, uyuşmayan ${k.uyusmayan}, null uyuşmazlığı ${k.nullUyusmaz}, en büyük fark ${k.azamiFark}`;
    iyi = iyi && k.uyusmayan === 0 && k.nullUyusmaz === 0;
  } else ek = '; proxy karşılaştırması atlandı';
  madde(2, `Tam gün (${DUN}): dönem sayısı veriden, bitişik, tamamı yayımlanmış`, iyi ? GECTI : KALDI, `dönem ${d.length} (${dk} dk), yayımlanan ${yayim}, bitişik ${bitisik}${ek}`);
  if (YEREL && d.length) {
    const sec = [d[0], d[Math.floor(d.length / 2)], d[d.length - 1]];
    kontrolListesi.push(`Şeffaflık ekranı (PTF, SMF ve SDF Listeleme) · ${tarihTR(DUN)} · şu dönemleri elle karşılaştırın:`);
    for (const x of sec) kontrolListesi.push(`  ${x.bas.slice(11, 16)}  PTF ${bicim(x.ptf)} · SMF ${bicim(x.smf)} · yön ${x.yon || '—'} · pozitif ${bicim(x.pozitif)} · negatif ${bicim(x.negatif)}`);
  }
}

// 3 + 4 — bugün kısmi, null/0 dürüstlüğü
const bugun = await jsonAl(`/dengesizlik-maliyeti/veri?tarih=${BUGUN}&bicim=json`);
{
  const d = bugun.j ? bugun.j.donemler : [];
  const yayim = d.filter(yayimlandi).length;
  const ilkBos = d.findIndex((x) => !yayimlandi(x));
  const sonrasiBos = ilkBos === -1 || d.slice(ilkBos).every((x) => !yayimlandi(x));
  const bosSifir = d.filter((x) => !yayimlandi(x) && [x.smf, x.pozitif, x.negatif, x.maliyetPozitif, x.maliyetNegatif].some((v) => v === 0)).length;
  let ek = '', iyi = bugun.durum === 200 && d.length > 0 && sonrasiBos && bosSifir === 0;
  if (proxyVar) {
    const k = karsilastir(d, await proxyGun(BUGUN));
    ek = `; proxy: null uyuşmazlığı ${k.nullUyusmaz}, uyuşmayan ${k.uyusmayan} (canlı günde yeni dönem yayımlanmış olabilir)`;
    iyi = iyi && k.sifirUydurma === 0;
  }
  madde(3, `Bugün (${BUGUN}): yayımlanmamış dönemler boş, sırayla yayımlanıyor`, iyi ? GECTI : KALDI, `dönem ${d.length}, yayımlanan ${yayim}, yayımlanmamışta 0 değeri ${bosSifir}${ek}`);
  if (YEREL && d.length) kontrolListesi.push(`Bugün ${tarihTR(BUGUN)}: tabloda ${yayim}/${d.length} dönem yayımlanmış görünmeli; ilk boş dönem ${ilkBos === -1 ? 'yok' : d[ilkBos].bas.slice(11, 16)} ("—" olmalı, 0 değil).`);
}
{
  const hepsi = [...(dun.j ? dun.j.donemler : []), ...(bugun.j ? bugun.j.donemler : [])];
  let tutarsiz = 0, turHatasi = 0;
  for (const x of hepsi) {
    for (const a of ['ptf', 'smf', 'pozitif', 'negatif', 'maliyetPozitif', 'maliyetNegatif']) if (!(x[a] === null || (typeof x[a] === 'number' && Number.isFinite(x[a])))) turHatasi++;
    const mN = x.negatif !== null && x.ptf !== null ? Math.round((x.negatif - x.ptf) * 1e6) / 1e6 : null;
    const mP = x.pozitif !== null && x.ptf !== null ? Math.round((x.ptf - x.pozitif) * 1e6) / 1e6 : null;
    if ((mN === null) !== (x.maliyetNegatif === null) || (mN !== null && Math.abs(mN - x.maliyetNegatif) > 1e-6)) tutarsiz++;
    if ((mP === null) !== (x.maliyetPozitif === null) || (mP !== null && Math.abs(mP - x.maliyetPozitif) > 1e-6)) tutarsiz++;
    if (x.yon !== null && !['acik', 'fazla', 'denge'].includes(x.yon)) turHatasi++;
  }
  madde(4, 'Null/0 dürüstlüğü ve türetilmiş maliyet alanları', hepsi.length && !tutarsiz && !turHatasi ? GECTI : KALDI, `dönem ${hepsi.length}, tür hatası ${turHatasi}, maliyet tutarsızlığı ${tutarsiz}`);
}

// 7 — aylık aralık (5 ve 6 bu veriden)
const AR_BAS = gunEkle(DUN, -29);
const aralik = await jsonAl(`/dengesizlik-maliyeti/veri?bas=${AR_BAS}&bit=${DUN}&bicim=json`);
const arCsv = await al(`/dengesizlik-maliyeti/veri?bas=${AR_BAS}&bit=${DUN}&bicim=csv`, { accept: '*/*' });
const arXlsx = await al(`/dengesizlik-maliyeti/veri?bas=${AR_BAS}&bit=${DUN}&bicim=xlsx`, { accept: '*/*' });
const uzun = await al(`/dengesizlik-maliyeti/veri?bas=${gunEkle(DUN, -31)}&bit=${DUN}&bicim=json`);
const xlsxSatir = (bayt) => {
  const m = new TextDecoder('latin1').decode(bayt);
  const a = m.indexOf('<sheetData>'), b = m.indexOf('</sheetData>');
  return a === -1 || b === -1 ? -1 : (m.slice(a, b).match(/<row /g) || []).length;
};
{
  const d = aralik.j ? aralik.j.donemler : [];
  const gunler = new Set(d.map((x) => x.bas.slice(0, 10)));
  const csvSatir = arCsv.durum === 200 ? arCsv.metin.replace(/^﻿/, '').split('\r\n').filter(Boolean).length - 1 : -1;
  const xs = arXlsx.durum === 200 ? xlsxSatir(arXlsx.bayt) - 1 : -1;
  const iyi = aralik.durum === 200 && gunler.size === 30 && csvSatir === d.length && xs === d.length && uzun.durum === 400;
  madde(7, `Aylık aralık (${AR_BAS} – ${DUN}) tek dosya, satırlar tutarlı; 32 gün → 400`, iyi ? GECTI : KALDI, `JSON ${aralik.durum} (${gunler.size} gün, ${d.length} dönem), CSV ${arCsv.durum} (${csvSatir} satır), XLSX ${arXlsx.durum} (${xs} satır), 32 gün ${uzun.durum}`);
  if (YEREL && d.length) {
    kontrolListesi.push(`Excel: /dengesizlik-maliyeti/veri?bas=${AR_BAS}&bit=${DUN}&bicim=xlsx ve &bicim=csv dosyalarını Excel'de açın:`);
    kontrolListesi.push(`  ${d.length} veri satırı, sayılar sayısal hücre (sağa yaslı), ondalık virgül; "Bilgi" sayfası var; ilk satır ${d[0].bas.slice(0, 16)} PTF ${bicim(d[0].ptf)}, son satır ${d[d.length - 1].bas.slice(0, 16)} PTF ${bicim(d[d.length - 1].ptf)}.`);
  }
}
// 5 + 6 — eşik altı ve formül karşılaştırması (yalnız kuralı doğrulanmış günler)
{
  const d = aralik.j ? aralik.j.donemler : [];
  const kurallar = aralik.j ? aralik.j.kurallar : [];
  let esikAlti = 0, eksiFiyat = 0, dogrulanmamisGun = 0, karsilastirilan = 0, farkli = 0, azamiFark = 0;
  const gorulenGun = new Set();
  for (const x of d) {
    const g = x.bas.slice(0, 10);
    const k = kuralFor(kurallar, g);
    if (!k || k.dogrulandi !== true) { if (!gorulenGun.has(g)) { gorulenGun.add(g); dogrulanmamisGun++; } continue; }
    if (x.dk !== 60 || !yayimlandi(x) || x.ptf === null || x.smf === null || !x.yon) continue;
    if (Math.min(x.ptf, x.smf) < k.V) { esikAlti++; if (x.pozitif < 0) eksiFiyat++; }
    const r = birimFiyat({ ptf: x.ptf, smfN: x.smf, smfP: x.smf, yon: x.yon }, k);
    if (!r) continue;
    karsilastirilan++;
    const f = Math.max(Math.abs(r.negatif - x.negatif), Math.abs(r.pozitif - x.pozitif));
    if (f > azamiFark) azamiFark = f;
    if (f > 0.01 + 1e-9) farkli++;
  }
  if (esikAlti === 0) madde(5, 'Eşik altı dönemlerde pozitif fiyatın işareti', ATLANDI, `aralıkta kuralı doğrulanmış eşik altı dönem yok (doğrulanmamış gün ${dogrulanmamisGun})`);
  else madde(5, 'Eşik altı dönemlerde pozitif fiyatın işareti', eksiFiyat === esikAlti ? GECTI : KALDI, `eşik altı ${esikAlti} dönem, eksi pozitif fiyat ${eksiFiyat}`);
  if (!karsilastirilan) madde(6, 'Formül ile yayımlanan fiyat (doğrulanmış günler)', ATLANDI, `karşılaştırılabilir dönem yok (doğrulanmamış gün ${dogrulanmamisGun})`);
  else madde(6, 'Formül ile yayımlanan fiyat (doğrulanmış günler): en büyük fark ≤ 0,01', farkli === 0 ? GECTI : KALDI, `karşılaştırılan ${karsilastirilan}, 0,01'den büyük fark ${farkli}, en büyük fark ${Math.round(azamiFark * 100) / 100}`);
}

// 8 — biçimler
{
  const tek = await al(`/dengesizlik-maliyeti/veri?tarih=${DUN}&bicim=csv`, { accept: '*/*' });
  const tx = await al(`/dengesizlik-maliyeti/veri?tarih=${DUN}&bicim=xlsx`, { accept: '*/*' });
  const satirlar = tek.metin.split('\r\n').filter(Boolean);
  const bom = tek.bayt[0] === 0xef && tek.bayt[1] === 0xbb && tek.bayt[2] === 0xbf;
  const sutun = satirlar.length ? satirlar[0].replace(/^﻿/, '').split(';').length : 0;
  const kaynak = satirlar.slice(1).every((s) => s.endsWith(';EPİAŞ Şeffaflık Platformu'));
  const virgul = satirlar.slice(1).some((s) => /;\d+,\d+;/.test(s)) && !satirlar.slice(1).some((s) => /;\d+\.\d+;/.test(s));
  const xm = new TextDecoder('latin1').decode(tx.bayt);
  const xlsxIyi = tx.bayt[0] === 0x50 && tx.bayt[1] === 0x4b && xm.includes('xl/worksheets/sheet2.xml') && xm.includes('name="Bilgi"');
  const basliklar = [tek, tx, dun].every((r) => CEKILDI_RE.test(r.basliklar['x-veri-cekildi'] || '') && /^(true|false)$/.test(r.basliklar['x-veri-bayat'] || ''));
  const iyi = tek.durum === 200 && bom && sutun === 12 && kaynak && virgul && tx.durum === 200 && xlsxIyi && basliklar;
  madde(8, 'CSV/XLSX biçimi ve X-Veri-* başlıkları', iyi ? GECTI : KALDI, `CSV ${tek.durum} BOM ${bom} sütun ${sutun} kaynak ${kaynak} ondalık virgül ${virgul}; XLSX ${tx.durum} 2 sayfa ${xlsxIyi}; başlıklar ${basliklar}`);
}

// 9 — önbellek paylaşımı
{
  const [a, b] = await Promise.all([al(`/dengesizlik-maliyeti/veri?tarih=${DUN}&bicim=json`), al(`/dengesizlik-maliyeti/veri?tarih=${DUN}&bicim=json`)]);
  const c = await al(`/dengesizlik-maliyeti/veri?tarih=${DUN}&bicim=csv`, { accept: '*/*' });
  const u = [a, b, c, dun].map((r) => r.basliklar['x-veri-uretildi'] || '');
  const iyi = [a, b, c].every((r) => r.durum === 200) && u.every((x) => x && x === u[0]);
  madde(9, 'Önbellek penceresinde istemciler tek proxy yanıtını paylaşır', iyi ? GECTI : KALDI, `4 istek (iki eşzamanlı + farklı biçim + önceki), farklı X-Veri-Uretildi ${new Set(u).size}`);
}

// 12 — SSR kanıtı (JS'siz; düz fetch ve Googlebot)
{
  const jsonLd = (h) => { try { const m = /<script type="application\/ld\+json" id="dJsonLd">([\s\S]*?)<\/script>/.exec(h); return m ? JSON.parse(m[1])['@graph'] : []; } catch (e) { return []; } };
  const satirHucre = (h, bas) => { const m = new RegExp(`<tr[^>]*data-bas="${bas.replace(/[+]/g, '\\+')}"[^>]*>([\\s\\S]*?)</tr>`).exec(h); return m ? [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => coz(c[1])) : null; };
  const kanit = async (tarih, tarihli, ua) => {
    for (let deneme = 0; deneme < 3; deneme++) {
      const s = await al(`/dengesizlik-maliyeti${tarihli ? `?tarih=${tarih}` : ''}`, { accept: 'text/html', ua });
      const j = await jsonAl(`/dengesizlik-maliyeti/veri?tarih=${tarih}&bicim=json`);
      const sc = (/data-cekildi="([^"]+)"/.exec(s.metin) || [])[1];
      if (!j.j || sc !== j.j.cekildi) { await new Promise((r) => setTimeout(r, 2000)); continue; }
      const yay = j.j.donemler.filter(yayimlandi);
      if (yay.length < 3) return { gecerli: false, neden: `yayımlanmış dönem ${yay.length}` };
      const sec = [yay[0], yay[Math.floor(yay.length / 2)], yay[yay.length - 1]];
      let hucre = 0, hucreTam = 0;
      for (const d of sec) {
        const c = satirHucre(s.metin, d.bas) || [];
        for (const [i, v] of [[1, d.ptf], [2, d.smf], [4, d.pozitif], [5, d.negatif], [6, d.maliyetPozitif], [7, d.maliyetNegatif]]) { hucre++; if (c[i] === bicim(v)) hucreTam++; }
      }
      const ozetMetni = coz((/<p class="day-sum" id="dOzet">([\s\S]*?)<\/p>/.exec(s.metin) || [])[1] || '');
      const o = j.j.ozet;
      const ozetIyi = ozetMetni.startsWith(`${tarihTR(tarih)} dengesizlik özeti`) && [o.pozitifOrt, o.negatifOrt, o.ptfOrt, o.smfOrt, o.maliyetPozitifOrt, o.maliyetNegatifOrt].every((v) => ozetMetni.includes(`${bicim(v)} TL/MWh`))
        && (o.yayimlanan === o.toplam || ozetMetni.includes(`pozitif dengesizlik fiyatı ${bicim(sec[2].pozitif)} TL/MWh`));
      const graf = jsonLd(s.metin);
      const ds = graf.find((n) => n['@type'] === 'Dataset') || {};
      const wp = graf.find((n) => n['@type'] === 'WebPage') || {};
      const ldIyi = tarihli ? ds.temporalCoverage === tarih && /tarih=/.test(wp.url || '') : ds.dateModified === j.j.cekildi && wp.dateModified === j.j.cekildi && ds.temporalCoverage === '2026-01-01/..';
      const ldFiyatsiz = !/\d{1,3}(\.\d{3})*,\d{2}/.test(JSON.stringify(graf.filter((n) => n['@type'] !== 'FAQPage')));
      return { gecerli: s.durum === 200 && /data-ssr="1"/.test(s.metin) && hucreTam === hucre && ozetIyi && ldIyi && ldFiyatsiz, hucre, hucreTam, ozetIyi, ldIyi, sec, durum: s.durum };
    }
    return { gecerli: false, neden: 'sayfa ile JSON aynı çekime ait değil (3 deneme)' };
  };
  const kosular = [];
  for (const [tarih, tarihli] of [[BUGUN, false], [DUN, true]]) for (const ua of [null, GOOGLEBOT]) kosular.push({ tarih, tarihli, ua, k: await kanit(tarih, tarihli, ua) });
  const hepsi = kosular.every((x) => x.k.gecerli);
  const ozet = kosular.map((x) => `${x.tarihli ? 'tarihli' : 'tarihsiz'}/${x.ua ? 'Googlebot' : 'düz'}: ${x.k.neden ? x.k.neden : `hücre ${x.k.hucreTam}/${x.k.hucre}, özet ${x.k.ozetIyi}, JSON-LD ${x.k.ldIyi}`}`).join('; ');
  madde(12, 'SSR kanıtı: JS\'siz HTML\'de 3 yayımlanmış dönem, özet cümlesi, JSON-LD', hepsi ? GECTI : KALDI, ozet);
  if (YEREL) {
    const b = kosular[0].k;
    if (b.sec) {
      kontrolListesi.push(`SSR (JS kapalı tarayıcıda ${TABAN.replace(/^https?:\/\//, '')}/dengesizlik-maliyeti): şu satırlar görünmeli:`);
      for (const d of b.sec) kontrolListesi.push(`  ${d.bas.slice(11, 16)}  PTF ${bicim(d.ptf)} · SMF ${bicim(d.smf)} · pozitif ${bicim(d.pozitif)} · negatif ${bicim(d.negatif)}`);
    }
  }
}

// 13 — damga ve dizin
{
  const s = await al('/dengesizlik-maliyeti', { accept: 'text/html' });
  const j = await jsonAl(`/dengesizlik-maliyeti/veri?tarih=${BUGUN}&bicim=json`);
  const host = new URL(TABAN).hostname.toLowerCase();
  const uretim = host === 'voltage.com.tr' || host === 'www.voltage.com.tr';
  const robots = [...s.metin.matchAll(/<meta\s+name="robots"\s+content="([^"]*)"/gi)].map((m) => m[1]);
  const dizin = uretim
    ? s.basliklar['x-robots-tag'] === undefined && robots.length === 1 && robots[0].startsWith('index')
    : s.basliklar['x-robots-tag'] === 'noindex, nofollow' && JSON.stringify(robots) === '["noindex, nofollow"]';
  const veriBasligi = uretim ? dun.basliklar['x-robots-tag'] === 'noindex' : dun.basliklar['x-robots-tag'] === 'noindex, nofollow';
  const canonical = /<link rel="canonical" href="https:\/\/voltage\.com\.tr\/dengesizlik-maliyeti">/.test(s.metin);
  const zaman = (/<span class="live-stamp[^"]*" id="dDamga">[^<]*<time datetime="([^"]+)">/.exec(s.metin) || [])[1];
  const mod = coz((/<span class="live-mode[^"]*" id="dMod">([\s\S]*?)<\/span>/.exec(s.metin) || [])[1] || '');
  const damga = !!j.j && zaman === j.j.cekildi && (mod === 'SON SENKRON') === !!j.j.bayat;
  madde(13, `Damga = cekildi; ${uretim ? 'üretim: dizine açık' : 'önizleme: noindex, nofollow'}; canonical voltage.com.tr`, dizin && veriBasligi && canonical && damga ? GECTI : KALDI, `dizin ${dizin}, veri ucu başlığı ${veriBasligi}, canonical ${canonical}, damga ${damga} (mod ${mod || '-'})`);
}

// 14–17 için: 503 + Retry-After gelirse (site bütçesi) bir kez bekleyip yeniden dene
const BEKLE_AZAMI_MS = process.env.KABUL_YENIDEN_BEKLE_AZAMI_MS !== undefined ? Number(process.env.KABUL_YENIDEN_BEKLE_AZAMI_MS) : 65000;
async function jsonAlSabirli(yol, sec) {
  let r = await jsonAl(yol, sec);
  if (r.durum === 503 && r.basliklar['retry-after']) {
    await new Promise((coz) => setTimeout(coz, Math.min(BEKLE_AZAMI_MS, (Number(r.basliklar['retry-after']) || 60) * 1000 + 2000)));
    r = await jsonAl(yol, sec);
  }
  return r;
}
const KASIM1 = '2026-11-01';
const OCAK_NOTU = ['2026-01-01', '2026-01-13', '2026-01-25']; // 1–25 Ocak: yayım notu yok ve API = formül (madde 18)
// EPİAŞ günlük bülten PDF'lerinde eski kurala göre; Şeffaflık API değerleri formülle uyumlu (26.11.2026 kabul denetimi)
const bilinenBultenFarki = (g, h) => (g >= '2026-01-01' && g <= '2026-01-25') || (g === '2026-11-03' && h === 12);
const kasim1 = KASIM1 < BUGUN ? await jsonAlSabirli(`/dengesizlik-maliyeti/veri?tarih=${KASIM1}&bicim=json`) : null;

// 14 — her yayımlanmış dönemin yönü var
{
  const kaynaklar = [dun, bugun, aralik, kasim1].filter((r) => r && r.j && Array.isArray(r.j.donemler));
  const gorulenBas = new Set();
  let yayim = 0, yonsuz = 0, yonsuzYayimsiz = 0;
  for (const r of kaynaklar) for (const x of r.j.donemler) {
    if (gorulenBas.has(x.bas)) continue;
    gorulenBas.add(x.bas);
    if (yayimlandi(x)) { yayim++; if (x.yon === null || x.yon === undefined) yonsuz++; } else if (x.yon !== null) yonsuzYayimsiz++;
  }
  madde(14, 'Yayımlanmış her dönemin sistem yönü var (null sayımı)', yayim > 0 && yonsuz === 0 ? GECTI : KALDI, `yayımlanmış dönem ${yayim}, yönü null ${yonsuz}; yayımlanmamış ama yönü dolu ${yonsuzYayimsiz}`);
  if (YEREL && yonsuz) {
    kontrolListesi.push('Yönü null olan yayımlanmış dönemler:');
    for (const r of kaynaklar) for (const x of r.j.donemler) if (yayimlandi(x) && x.yon == null) kontrolListesi.push(`  ${x.bas}`);
  }
}

// 15 — 2026-11-01: dönem başına tek satır, çelişki yok
if (!kasim1) madde(15, `${KASIM1}: dönem başına tek satır`, ATLANDI, 'bugün 2026-11-01 ya da öncesi');
else {
  const d = kasim1.j ? kasim1.j.donemler : [];
  const dk = d.length ? d[0].dk : null;
  const tekil = new Set(d.map((x) => x.bas)).size;
  const bitisik = d.every((x, i) => x.dk === dk && (i === 0 || Date.parse(x.bas) - Date.parse(d[i - 1].bas) === dk * 60000));
  const yay = d.filter(yayimlandi).length;
  const s15 = await al(`/dengesizlik-maliyeti?tarih=${KASIM1}`, { accept: 'text/html' });
  const govde15 = (/<tbody id="dTablo">([\s\S]*?)<\/tbody>/.exec(s15.metin) || [])[1] || '';
  const sayfaSatir = (govde15.match(/<tr[^>]*data-bas="/g) || []).length;
  const tumuBos = [...govde15.matchAll(/<tr[^>]*data-bas="[^"]*"[^>]*>([\s\S]*?)<\/tr>/g)].filter((m) => (m[1].match(/<td class="(yon )?bos">—<\/td>/g) || []).length === 7).length;
  let ek = '', iyi = kasim1.durum === 200 && dk && d.length === 1440 / dk && tekil === d.length && bitisik && yay === d.length && sayfaSatir === d.length && tumuBos === 0;
  if (proxyVar) {
    const pr = await jsonAl(`/piyasa/v1/dengesizlik?tarih=${KASIM1}`, { proxy: true });
    const g = pr.j && Array.isArray(pr.j.gunler) ? pr.j.gunler.find((x) => x && x.tarih === KASIM1) : null;
    const ham = g && Array.isArray(g.donemler) ? g.donemler : [];
    const k = karsilastir(d, ham);
    ek = `; proxy: ham satır ${ham.length}, tekil ${new Set(ham.map((x) => x.bas)).size}, uyuşmayan ${k.uyusmayan}, null uyuşmazlığı ${k.nullUyusmaz}`;
    iyi = iyi && ham.length > 0 && k.uyusmayan === 0 && k.nullUyusmaz === 0;
  } else ek = '; proxy karşılaştırması atlandı';
  madde(15, `${KASIM1}: dönem başına tek satır, çelişki yok (sayfa ve /veri)`, iyi ? GECTI : KALDI, `durum ${kasim1.durum}, dönem ${d.length} (${dk} dk), tekil ${tekil}, bitişik ${bitisik}, yayımlanan ${yay}; sayfa ${s15.durum} satır ${sayfaSatir}, tümü "—" satır ${tumuBos}${ek}`);
}

// 16 — geçmiş derinliği (R8: sade sayfa; V artık yalnız /veri kurallar[] verisinde, sayfada gösterilmez)
{
  const ILK = '2026-01-01', ONCE = '2026-10-15';
  const o = await jsonAlSabirli(`/dengesizlik-maliyeti/veri?tarih=${ILK}&bicim=json`);
  const d = o.j ? o.j.donemler : [];
  const dk = d.length ? d[0].dk : null;
  const yay = d.filter(yayimlandi).length;
  const j16 = await jsonAlSabirli(`/dengesizlik-maliyeti/veri?tarih=${ONCE}&bicim=json`);
  const k16 = kuralFor(j16.j ? j16.j.kurallar : [], ONCE);
  const s16 = await al(`/dengesizlik-maliyeti?tarih=${ONCE}`, { accept: 'text/html' });
  const satir16 = ((/<tbody id="dTablo">([\s\S]*?)<\/tbody>/.exec(s16.metin) || [])[1] || '').match(/<tr[^>]*data-bas=/g) || [];
  const v150 = !!k16 && k16.V === 150;
  const iyi = o.durum === 200 && dk && d.length === 1440 / dk && yay === d.length && s16.durum === 200 && /data-ssr="1"/.test(s16.metin) && satir16.length > 0 && v150;
  madde(16, `Geçmiş derinliği: ${ILK} veri; Kasım öncesi gün (${ONCE}) sunucuda çizilir, /veri kuralı V = 150`, iyi ? GECTI : KALDI, `${ILK}: durum ${o.durum}, dönem ${d.length}, yayımlanan ${yay}; ${ONCE}: sayfa ${s16.durum}, sunucu verisi ${/data-ssr="1"/.test(s16.metin)}, tablo satırı ${satir16.length}, /veri kuralı V = 150 ${v150}`);
}

// 17 — EPİAŞ günlük bülteniyle çapraz denetim (isteğe bağlı)
{
  const yol = process.env.KABUL_BULTEN_CSV || '';
  if (!yol) madde(17, 'EPİAŞ günlük bülteniyle çapraz denetim', ATLANDI, 'KABUL_BULTEN_CSV verilmedi');
  else {
    let bulten = null;
    try { bulten = bultenOku(readFileSync(yol, 'utf8')); } catch (e) { bulten = null; }
    if (!bulten || !bulten.size) madde(17, 'EPİAŞ günlük bülteniyle çapraz denetim', KALDI, 'bülten dosyası okunamadı ya da boş');
    else {
      // Örneklem: ay başına 3 rastgele tamamlanmış gün (tohumlu) + sabit günler
      let tohum = Number(process.env.KABUL_TOHUM) || 20261125;
      const rnd = () => { tohum = (tohum * 1664525 + 1013904223) % 4294967296; return tohum / 4294967296; };
      const adaylar = [...bulten.keys()].filter((g) => g >= '2026-01-01' && g <= DUN).sort();
      const aylar = new Map();
      for (const g of adaylar) { const a = g.slice(0, 7); if (!aylar.has(a)) aylar.set(a, []); aylar.get(a).push(g); }
      const ornek = new Set([...OCAK_NOTU, '2026-01-26', '2026-11-01'].filter((g) => bulten.has(g) && g <= DUN));
      for (const [, gunler] of aylar) { const kopya = [...gunler]; for (let i = 0; i < 3 && kopya.length; i++) ornek.add(kopya.splice(Math.floor(rnd() * kopya.length), 1)[0]); }
      const secilen = [...ornek].sort();
      // Ay başına tek aralık isteği (en çok 31 gün): site bütçesini korur
      const ayGrup = new Map();
      for (const g of secilen) { const a = g.slice(0, 7); if (!ayGrup.has(a)) ayGrup.set(a, []); ayGrup.get(a).push(g); }
      const site = new Map(), prx = new Map(), kuralGun = new Map();
      let istek = 0, basarisiz = 0;
      for (const [, gunler] of ayGrup) {
        const b = gunler[0], s = gunler[gunler.length - 1];
        const r = await jsonAlSabirli(`/dengesizlik-maliyeti/veri?bas=${b}&bit=${s}&bicim=json`);
        istek++;
        if (!r.j) { basarisiz++; continue; }
        for (const x of r.j.donemler) { const g = x.bas.slice(0, 10); if (gunler.includes(g)) { if (!site.has(g)) site.set(g, []); site.get(g).push(x); } }
        for (const g of gunler) kuralGun.set(g, kuralFor(r.j.kurallar, g));
        if (proxyVar) {
          const p = await jsonAl(`/piyasa/v1/dengesizlik?bas=${b}&bit=${s}`, { proxy: true });
          for (const gun of (p.j && Array.isArray(p.j.gunler) ? p.j.gunler : [])) if (gunler.includes(gun.tarih)) prx.set(gun.tarih, gun.donemler || []);
        }
      }
      const kiyas = (kaynak, gunListesi = secilen) => {
        let gun = 0, saat = 0, deger = 0, esit = 0, uyusmayan = 0, nullUyusmaz = 0, yonUyusmaz = 0, azami = 0, saatlikDegil = 0, bilinen = 0;
        const ornekler = [];
        for (const g of gunListesi) {
          const satirlar = kaynak.get(g);
          if (!satirlar || !satirlar.length) continue;
          gun++;
          const b = bulten.get(g);
          const gorulen = new Set();
          for (const x of satirlar) {
            if (x.dk !== 60) { saatlikDegil++; continue; }
            const h = Number(x.bas.slice(11, 13));
            if (gorulen.has(h)) continue;
            gorulen.add(h);
            const y = b.get(h);
            if (!y) continue;
            saat++;
            for (const [a, ba] of [['ptf', 'ptf'], ['smf', 'smf'], ['pozitif', 'poz'], ['negatif', 'neg']]) {
              deger++;
              const sv = x[a], bv = y[ba];
              if ((sv === null || sv === undefined) !== (bv === null)) { nullUyusmaz++; if (ornekler.length < 10) ornekler.push(`${g} ${String(h).padStart(2, '0')}:00 ${a} site ${sv} bülten ${bv}`); continue; }
              if (sv === null || sv === undefined) { esit++; continue; }
              const f = Math.abs(sv - bv);
              if (f <= 0.005 + 1e-9) { esit++; continue; }
              // Bilinen bülten farkı: API değeri formüle eşitse ayrı sayılır (madde düşmez)
              if ((a === 'pozitif' || a === 'negatif') && bilinenBultenFarki(g, h)) {
                const k = kuralGun.get(g);
                const r = k && x.ptf !== null && x.smf !== null && x.yon ? birimFiyat({ ptf: x.ptf, smfN: x.smf, smfP: x.smf, yon: x.yon }, k) : null;
                if (r && Math.abs(r[a] - sv) <= 0.01 + 1e-9) { bilinen++; continue; }
              }
              if (f > azami) azami = f;
              { uyusmayan++; if (ornekler.length < 10) ornekler.push(`${g} ${String(h).padStart(2, '0')}:00 ${a} site ${sv} bülten ${bv}`); }
            }
            deger++;
            if ((x.yon || null) === y.yon) esit++; else { yonUyusmaz++; if (ornekler.length < 10) ornekler.push(`${g} ${String(h).padStart(2, '0')}:00 yön site ${x.yon} bülten ${y.yon}`); }
          }
        }
        return { gun, saat, deger, esit, uyusmayan, nullUyusmaz, yonUyusmaz, azami: Math.round(azami * 1000) / 1000, saatlikDegil, bilinen, ornekler };
      };
      const ks = kiyas(site);
      const kp = proxyVar ? kiyas(prx) : null;
      const iyiK = (k) => k.gun > 0 && k.uyusmayan === 0 && k.nullUyusmaz === 0 && k.yonUyusmaz === 0;
      const iyi = basarisiz === 0 && ks.gun === secilen.length && iyiK(ks) && (!kp || (kp.gun === secilen.length && iyiK(kp)));
      const yaz = (k) => `${k.gun} gün, ${k.saat} saat, ${k.deger} değer: eşleşen ${k.esit}, bilinen bülten farkı ${k.bilinen}, uyuşmayan ${k.uyusmayan}, null uyuşmazlığı ${k.nullUyusmaz}, yön uyuşmazlığı ${k.yonUyusmaz}, en büyük fark ${k.azami}${k.saatlikDegil ? `, saatlik olmayan ${k.saatlikDegil}` : ''}`;
      madde(17, 'EPİAŞ günlük bülteniyle çapraz denetim (PTF, SMF, yön, pozitif, negatif)', iyi ? GECTI : KALDI, `örneklem ${secilen.length} gün (${ayGrup.size} ay; bültende ${bulten.size} gün), ${istek} aralık isteği, başarısız ${basarisiz}; site: ${yaz(ks)}${kp ? `; proxy: ${yaz(kp)}` : '; proxy karşılaştırması atlandı'}`);
      if (YEREL) {
        kontrolListesi.push(`Bülten çapraz denetimi örneklemi: ${secilen.join(', ')}`);
        for (const x of [...ks.ornekler, ...(kp ? kp.ornekler.map((o) => 'proxy ' + o) : [])]) kontrolListesi.push(`  uyuşmazlık: ${x}`);
      }
    }
  }
}

// 18 — 1–25 Ocak 2026: sayfada yayım notu yok VE API = formül (bülten gerektirmez)
{
  const NOT_RE = /yayımladığı dengesizlik fiyatları|1–25 Ocak/;
  const r = await jsonAlSabirli(`/dengesizlik-maliyeti/veri?bas=${OCAK_NOTU[0]}&bit=${OCAK_NOTU[OCAK_NOTU.length - 1]}&bicim=json`);
  const jsonNot = r.j && Array.isArray(r.j.yayimNotlari) ? r.j.yayimNotlari.length : -1;
  let sayfaNot = 0, sayfaHata = 0, karsilastirilan = 0, farkli = 0, azami = 0, kuralsiz = 0;
  const formulKiyas = (donemler, g, kurallar) => {
    const k = kuralFor(kurallar, g);
    if (!k || k.dogrulandi !== true) { kuralsiz++; return; }
    for (const x of donemler) {
      if (x.dk !== 60 || !yayimlandi(x) || x.ptf === null || x.smf === null || !x.yon) continue;
      const b = birimFiyat({ ptf: x.ptf, smfN: x.smf, smfP: x.smf, yon: x.yon }, k);
      if (!b) continue;
      karsilastirilan++;
      const f = Math.max(Math.abs(b.negatif - x.negatif), Math.abs(b.pozitif - x.pozitif));
      if (f > azami) azami = f;
      if (f > 0.01 + 1e-9) farkli++;
    }
  };
  for (const g of OCAK_NOTU) {
    const s = await al(`/dengesizlik-maliyeti?tarih=${g}`, { accept: 'text/html' });
    if (s.durum !== 200 || !/data-ssr="1"/.test(s.metin)) sayfaHata++;
    if (NOT_RE.test(coz((/<p class="uyari" id="dKuralUyari"[^>]*>([\s\S]*?)<\/p>/.exec(s.metin) || [])[1] || ''))) sayfaNot++;
    formulKiyas(r.j ? r.j.donemler.filter((x) => x.bas.startsWith(g)) : [], g, r.j ? r.j.kurallar : []);
  }
  let proxyFarkli = null;
  if (proxyVar) {
    const p = await jsonAl(`/piyasa/v1/dengesizlik?bas=${OCAK_NOTU[0]}&bit=${OCAK_NOTU[OCAK_NOTU.length - 1]}`, { proxy: true });
    const once = farkli;
    for (const gun of (p.j && Array.isArray(p.j.gunler) ? p.j.gunler : [])) if (OCAK_NOTU.includes(gun.tarih)) formulKiyas(gun.donemler || [], gun.tarih, r.j ? r.j.kurallar : []);
    proxyFarkli = farkli - once;
  }
  const notVar = sayfaNot > 0 || jsonNot > 0;
  const apiFormul = karsilastirilan > 0 && farkli === 0 && kuralsiz === 0;
  const hukum = notVar && apiFormul ? 'NOT KALDIRILMALI (API = formül)' : !apiFormul ? 'API ≠ formül: Hukuk ve Enerji Piyasası incelemeli' : 'not yok, API = formül';
  madde(18, `1–25 Ocak 2026 (${OCAK_NOTU.join(', ')}): sayfada yayım notu yok ve API = formül`, r.durum === 200 && !sayfaHata && !notVar && apiFormul ? GECTI : KALDI,
    `${hukum}; sayfa notu ${sayfaNot}/${OCAK_NOTU.length}, JSON yayimNotlari ${jsonNot}, sunucu verisiz sayfa ${sayfaHata}; karşılaştırılan ${karsilastirilan}, 0,01'den büyük fark ${farkli}${proxyFarkli === null ? '' : ` (proxy ${proxyFarkli})`}, en büyük fark ${Math.round(azami * 100) / 100}, kuralsız gün ${kuralsiz}`);
}

// 19 — üç tam Kasım günü: "†" yok, formül farkı yok
{
  const GUNLER19 = ['2026-11-05', '2026-11-12', '2026-11-19'];
  if (GUNLER19.some((g) => g >= BUGUN)) madde(19, 'Üç tam Kasım günü: "†" ve formül farkı yok', ATLANDI, 'günlerden biri henüz tamamlanmadı');
  else {
    let hancer = 0, notDolu = 0, ssrsiz = 0, karsilastirilan = 0, farkli = 0, azami = 0, eksik = 0, kuralsiz = 0;
    // Tek aralık isteği: site aralık yanıtının günlerini tek gün önbelleğine de yazar (proxy'ye 3 yerine 1 çağrı).
    await jsonAlSabirli(`/dengesizlik-maliyeti/veri?bas=${GUNLER19[0]}&bit=${GUNLER19[GUNLER19.length - 1]}&bicim=json`);
    for (const g of GUNLER19) {
      const j = await jsonAlSabirli(`/dengesizlik-maliyeti/veri?tarih=${g}&bicim=json`); // önce veri: sayfa önbellekten çizilir
      const s = await al(`/dengesizlik-maliyeti?tarih=${g}`, { accept: 'text/html' });
      if (!/data-ssr="1"/.test(s.metin)) ssrsiz++;
      hancer += (((/<tbody id="dTablo">([\s\S]*?)<\/tbody>/.exec(s.metin) || [])[1] || '').match(/<span class="fark"/g) || []).length; // yalnız tablo gövdesi (sayfa betiğinde de aynı dizgi var)
      if (coz((/<p class="note fark-not" id="dFarkNot">([\s\S]*?)<\/p>/.exec(s.metin) || [])[1] || '') !== '') notDolu++;
      const d = j.j ? j.j.donemler : [];
      if (!d.length || d.some((x) => !yayimlandi(x))) eksik++;
      const k = kuralFor(j.j ? j.j.kurallar : [], g);
      if (!k || k.dogrulandi !== true) { kuralsiz++; continue; }
      for (const x of d) {
        if (x.dk !== 60 || !yayimlandi(x) || x.ptf === null || x.smf === null || !x.yon) continue;
        const r = birimFiyat({ ptf: x.ptf, smfN: x.smf, smfP: x.smf, yon: x.yon }, k);
        if (!r) continue;
        karsilastirilan++;
        const f = Math.max(Math.abs(r.negatif - x.negatif), Math.abs(r.pozitif - x.pozitif));
        if (f > azami) azami = f;
        if (f > 0.01 + 1e-9) farkli++;
      }
    }
    const iyi = !hancer && !notDolu && !ssrsiz && !eksik && !kuralsiz && karsilastirilan > 0 && !farkli;
    madde(19, `Üç tam Kasım günü (${GUNLER19.join(', ')}): "†" yok, formül farkı yok`, iyi ? GECTI : KALDI, `"†" ${hancer}, dolu fark notu ${notDolu}, sunucu verisiz sayfa ${ssrsiz}, eksik gün ${eksik}, kuralsız gün ${kuralsiz}; karşılaştırılan ${karsilastirilan}, 0,01'den büyük fark ${farkli}, en büyük fark ${Math.round(azami * 100) / 100}`);
  }
}

// 20 + 21 — tam takvim ayı ve iki aya yayılan 31 gün: üç biçim, her gün, tutarlı satır sayıları
async function aralikDenetimi(no, ad, bas, bit) {
  if (bit >= BUGUN) { madde(no, ad, ATLANDI, 'aralık henüz tamamlanmadı'); return; }
  const yol = `/dengesizlik-maliyeti/veri?bas=${bas}&bit=${bit}`;
  const j = await jsonAlSabirli(`${yol}&bicim=json`);
  const c = await al(`${yol}&bicim=csv`, { accept: '*/*' });
  const x = await al(`${yol}&bicim=xlsx`, { accept: '*/*' });
  const d = j.j ? j.j.donemler : [];
  const gunSayisi = Math.round((Date.parse(bit) - Date.parse(bas)) / 86400000) + 1;
  const gunler = new Map();
  for (const p of d) { const g = p.bas.slice(0, 10); gunler.set(g, (gunler.get(g) || 0) + 1); }
  const gunBasi = [...gunler.entries()].every(([g, n]) => { const dk = (d.find((p) => p.bas.startsWith(g)) || {}).dk; return dk && n === 1440 / dk; });
  const csvSatir = c.durum === 200 ? c.metin.replace(/^﻿/, '').split('\r\n').filter(Boolean).length - 1 : -1;
  const xs = x.durum === 200 ? xlsxSatir(x.bayt) - 1 : -1;
  const iyi = j.durum === 200 && c.durum === 200 && x.durum === 200 && gunler.size === gunSayisi && gunBasi && csvSatir === d.length && xs === d.length;
  madde(no, `${ad} (${bas} – ${bit}, ${gunSayisi} gün)`, iyi ? GECTI : KALDI, `JSON ${j.durum} (${gunler.size}/${gunSayisi} gün, ${d.length} dönem, gün başına tam ${gunBasi}), CSV ${c.durum} (${csvSatir} satır), XLSX ${x.durum} (${xs} satır)`);
}
{
  const buAy = `${BUGUN.slice(0, 7)}-01`;
  const oncekiAySon = gunEkle(buAy, -1);
  await aralikDenetimi(20, 'Tam takvim ayı aralığı', `${oncekiAySon.slice(0, 7)}-01`, oncekiAySon);
  // İki aya yayılan 31 gün: önceki ayın 16'sından 30 gün sonrasına; tamamlanmamışsa bir ay geri
  let bas21 = `${oncekiAySon.slice(0, 7)}-16`;
  if (gunEkle(bas21, 30) >= BUGUN) bas21 = `${gunEkle(`${oncekiAySon.slice(0, 7)}-01`, -1).slice(0, 7)}-16`;
  await aralikDenetimi(21, 'İki aya yayılan 31 günlük aralık', bas21, gunEkle(bas21, 30));
}

// 10 — bütçe (en sonda: eski gün bütçesini bilerek tüketir)
{
  const gunler = Array.from({ length: 16 }, (_, i) => gunEkle(DUN, -(40 + i * 9)));
  const head = await Promise.all(gunler.slice(0, 4).map((g) => al(`/dengesizlik-maliyeti/veri?tarih=${g}&bicim=json`, { yontem: 'HEAD' })));
  const yanit = await Promise.all(gunler.map((g) => al(`/dengesizlik-maliyeti/veri?tarih=${g}&bicim=json`)));
  const uretildi = new Set(yanit.filter((r) => r.durum === 200).map((r) => r.basliklar['x-veri-uretildi']).filter(Boolean));
  const durust = yanit.every((r) => r.durum === 200 || (r.durum === 503 && !!r.basliklar['retry-after']));
  const headIyi = head.every((r) => r.durum === 200 && (r.basliklar['x-veri-durum'] === 'onbellekte-yok' || CEKILDI_RE.test(r.basliklar['x-veri-cekildi'] || '')));
  const iyi = uretildi.size <= 12 && durust && headIyi;
  madde(10, 'Ziyaretçi trafiği bütçeyi aşan proxy çağrısı doğurmaz; HEAD önbellekten', iyi ? GECTI : KALDI, `16 eşzamanlı eski gün: 200 ${yanit.filter((r) => r.durum === 200).length}, 503 ${yanit.filter((r) => r.durum === 503).length}, diğer ${yanit.filter((r) => r.durum !== 200 && r.durum !== 503).length}; farklı proxy yanıtı ${uretildi.size} (≤ 12); HEAD ${head.length} istek uygun ${headIyi}`);
}

// 11 — EPİAŞ kimliği yok (repo + canlı)
{
  const YASAK = [/giris\.epias/i, /cas\/v1/i, /reporting-service/i, /EPIAS_USERNAME/, /EPIAS_PASSWORD/, /\bTGT\b/];
  const atifsiz = (m) => m.replace(/<a href="https:\/\/seffaflik\.epias\.com\.tr\/[^"]*"[^>]*>/g, '<a>');
  let dosya = 0, repoBulgu = 0;
  const gez = (yol) => { for (const ad of readdirSync(new URL(yol, KOK), { withFileTypes: true })) { const y = yol + ad.name; if (ad.isDirectory()) gez(y + '/'); else { dosya++; const m = readFileSync(new URL(y, KOK), 'utf8'); if (YASAK.some((r) => r.test(m))) repoBulgu++; } } };
  try { gez('functions/'); } catch (e) { repoBulgu++; }
  const sayfa = readFileSync(new URL('dengesizlik-maliyeti.html', KOK), 'utf8');
  if (YASAK.some((r) => r.test(atifsiz(sayfa)))) repoBulgu++;
  const hataSayfasi = await al('/dengesizlik-maliyeti/veri?tarih=abc', { accept: 'text/html' });
  void hataSayfasi;
  let canliBulgu = 0;
  for (const g of gorulen) {
    const m = atifsiz(g);
    if (YASAK.some((r) => r.test(m)) || /authorization:|bearer\s/i.test(m) || (ANAHTAR && m.includes(ANAHTAR)) || (PROXY && m.includes(PROXY.replace(/^https?:\/\//, '')))) canliBulgu++;
  }
  madde(11, 'Sitede EPİAŞ kimliği ya da proxy belirteci yok (repo + canlı yanıtlar)', !repoBulgu && !canliBulgu && dosya > 0 ? GECTI : KALDI, `repo: ${dosya + 1} dosya, bulgu ${repoBulgu}; canlı: ${gorulen.length} yanıt, bulgu ${canliBulgu}`);
}

bitir();

function bitir() {
  sonuclar.sort((a, b) => a.no - b.no);
  for (const s of sonuclar) console.log(`[${s.durum}] ${String(s.no).padStart(2)} ${s.ad} — ${s.ozet}`);
  const say = (d) => sonuclar.filter((s) => s.durum === d).length;
  console.log(`\n${say(GECTI)} geçti, ${say(KALDI)} kaldı, ${say(ATLANDI)} atlandı (${sonuclar.length} madde)`);
  if (YEREL && kontrolListesi.length) {
    console.log('\n--- İNSAN DENETİMİ KONTROL LİSTESİ (yalnız --yerel; CI günlüğüne koymayın) ---');
    for (const k of kontrolListesi) console.log(k);
  }
  process.exit(say(KALDI) ? 1 : 0);
}
