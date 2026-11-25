/**
 * Bağımlılıksız, en küçük XLSX yazıcı (bir ya da birkaç sayfa).
 *   xlsxYaz({sayfaAdi, basliklar, satirlar, sutunlar?, ekSayfalar?}) → Uint8Array
 * - Sıkıştırmasız (stored) ZIP + CRC-32; Workers çalışma zamanında çalışır.
 * - Sayı → sayısal hücre (Excel'de toplanabilir); metin → satır içi metin
 *   (inlineStr); null / undefined / '' → hücre YOK (boş kalır, 0 yazılmaz).
 * - sutunlar[i] = {genislik?: karakter, ondalik?: true}; ondalik:true olan
 *   sütunun sayıları iki ondalık haneli gösterilir (değer değişmez).
 * - Çıktı belirlenimlidir (ZIP zaman damgası sabit): aynı girdi → aynı baytlar.
 *
 * Bu dosya Pages Function DEĞİLDİR (onRequest* dışa aktarmaz, rota üretmez).
 */

const kodlayici = new TextEncoder();

const CRC_TABLOSU = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bayt) {
  let c = 0xffffffff;
  for (let i = 0; i < bayt.length; i++) c = CRC_TABLOSU[(c ^ bayt[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** XML 1.0'da geçersiz denetim karakterlerini atar, özel karakterleri kaçırır. */
export function xmlKacis(v) {
  return String(v)
    .replace(/[^\u0009\u000A\u000D -퟿-�\u{10000}-\u{10FFFF}]/gu, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 0 → A, 25 → Z, 26 → AA */
export function sutunHarfi(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** Excel sayfa adı: en çok 31 karakter, [ ] : * ? / \ yasak, boş olamaz. */
function sayfaAdiTemizle(ad) {
  const s = String(ad || 'Sayfa1').replace(/[[\]:*?/\\]/g, ' ').replace(/^'+|'+$/g, '').trim().slice(0, 31);
  return s || 'Sayfa1';
}

/** Depolanmış (sıkıştırmasız) ZIP. dosyalar: [{ad, veri: Uint8Array}] */
export function zipYaz(dosyalar) {
  const ZAMAN = 0;                       // 00:00:00
  const TARIH = ((2026 - 1980) << 9) | (1 << 5) | 1; // 2026-01-01 (sabit: belirlenimli çıktı)
  const parcalar = [];
  const merkez = [];
  let ofset = 0;
  for (const d of dosyalar) {
    const ad = kodlayici.encode(d.ad);
    const crc = crc32(d.veri);
    const yerel = new DataView(new ArrayBuffer(30));
    yerel.setUint32(0, 0x04034b50, true);
    yerel.setUint16(4, 20, true);        // gereken sürüm
    yerel.setUint16(6, 0x0800, true);    // UTF-8 dosya adı
    yerel.setUint16(8, 0, true);         // yöntem: stored
    yerel.setUint16(10, ZAMAN, true);
    yerel.setUint16(12, TARIH, true);
    yerel.setUint32(14, crc, true);
    yerel.setUint32(18, d.veri.length, true);
    yerel.setUint32(22, d.veri.length, true);
    yerel.setUint16(26, ad.length, true);
    yerel.setUint16(28, 0, true);
    parcalar.push(new Uint8Array(yerel.buffer), ad, d.veri);

    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true);
    m.setUint16(4, 20, true);
    m.setUint16(6, 20, true);
    m.setUint16(8, 0x0800, true);
    m.setUint16(10, 0, true);
    m.setUint16(12, ZAMAN, true);
    m.setUint16(14, TARIH, true);
    m.setUint32(16, crc, true);
    m.setUint32(20, d.veri.length, true);
    m.setUint32(24, d.veri.length, true);
    m.setUint16(28, ad.length, true);
    m.setUint32(42, ofset, true);
    merkez.push(new Uint8Array(m.buffer), ad);
    ofset += 30 + ad.length + d.veri.length;
  }
  const merkezBoyu = merkez.reduce((a, p) => a + p.length, 0);
  const son = new DataView(new ArrayBuffer(22));
  son.setUint32(0, 0x06054b50, true);
  son.setUint16(8, dosyalar.length, true);
  son.setUint16(10, dosyalar.length, true);
  son.setUint32(12, merkezBoyu, true);
  son.setUint32(16, ofset, true);
  const hepsi = [...parcalar, ...merkez, new Uint8Array(son.buffer)];
  const out = new Uint8Array(hepsi.reduce((a, p) => a + p.length, 0));
  let i = 0;
  for (const p of hepsi) { out.set(p, i); i += p.length; }
  return out;
}

const XML_BAS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/** Tek sayfanın XML'i. Biçemler: 0 genel · 1 başlık (kalın) · 2 iki ondalık (yerleşik biçim 4: #,##0.00) */
function sayfaXml({ basliklar, satirlar, sutunlar }) {
  const bas = Array.isArray(basliklar) ? basliklar : [];
  const sat = Array.isArray(satirlar) ? satirlar : [];
  const sut = Array.isArray(sutunlar) ? sutunlar : [];
  const hucre = (deger, r, c, baslik) => {
    const ref = sutunHarfi(c) + r;
    if (typeof deger === 'number' && Number.isFinite(deger)) {
      return `<c r="${ref}"${sut[c] && sut[c].ondalik ? ' s="2"' : ''}><v>${deger}</v></c>`;
    }
    if (deger === null || deger === undefined || deger === '' || typeof deger === 'number') return '';
    return `<c r="${ref}" t="inlineStr"${baslik ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlKacis(deger)}</t></is></c>`;
  };
  let veri = '';
  let r = 1;
  if (bas.length) veri += `<row r="${r}">${bas.map((b, c) => hucre(String(b), r, c, true)).join('')}</row>`, r++;
  for (const satir of sat) {
    veri += `<row r="${r}">${(Array.isArray(satir) ? satir : []).map((v, c) => hucre(v, r, c, false)).join('')}</row>`;
    r++;
  }
  const genislik = Math.max(bas.length, ...sat.map((x) => (Array.isArray(x) ? x.length : 0)), 1);
  let cols = '';
  for (let c = 0; c < genislik; c++) {
    const g = sut[c] && Number.isFinite(sut[c].genislik) ? sut[c].genislik : Math.min(40, Math.max(10, String(bas[c] || '').length + 2));
    cols += `<col min="${c + 1}" max="${c + 1}" width="${g}" customWidth="1"/>`;
  }
  return `${XML_BAS}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + (bas.length ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '')
    + `<cols>${cols}</cols><sheetData>${veri}</sheetData></worksheet>`;
}

/**
 * xlsxYaz({sayfaAdi, basliklar, satirlar, sutunlar?, ekSayfalar?}) → Uint8Array
 * ekSayfalar: [{sayfaAdi, basliklar, satirlar, sutunlar?}] — ilk sayfadan sonra eklenir.
 */
export function xlsxYaz({ sayfaAdi, basliklar, satirlar, sutunlar, ekSayfalar } = {}) {
  const sayfalar = [{ sayfaAdi, basliklar, satirlar, sutunlar }, ...(Array.isArray(ekSayfalar) ? ekSayfalar : [])];
  // Sayfa adları benzersiz olmalı (Excel aynı adı kabul etmez).
  const adlar = [];
  for (const sf of sayfalar) {
    let ad = sayfaAdiTemizle(sf.sayfaAdi);
    for (let n = 2; adlar.some((x) => x.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr')); n++) ad = `${sayfaAdiTemizle(sf.sayfaAdi).slice(0, 28)} ${n}`;
    adlar.push(ad);
  }

  const bicemler = `${XML_BAS}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
    + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
    + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
    + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + '<cellXfs count="3">'
    + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
    + '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
    + '</cellXfs>'
    + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
    + '</styleSheet>';

  const kitap = `${XML_BAS}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<sheets>${adlar.map((ad, i) => `<sheet name="${xmlKacis(ad)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`;

  const turler = `${XML_BAS}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + adlar.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + '</Types>';

  const kokIliski = `${XML_BAS}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    + '</Relationships>';

  const kitapIliski = `${XML_BAS}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + adlar.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
    + `<Relationship Id="rId${adlar.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
    + '</Relationships>';

  const dosya = (ad, metin) => ({ ad, veri: kodlayici.encode(metin) });
  return zipYaz([
    dosya('[Content_Types].xml', turler),
    dosya('_rels/.rels', kokIliski),
    dosya('xl/workbook.xml', kitap),
    dosya('xl/_rels/workbook.xml.rels', kitapIliski),
    dosya('xl/styles.xml', bicemler),
    ...sayfalar.map((sf, i) => dosya(`xl/worksheets/sheet${i + 1}.xml`, sayfaXml(sf))),
  ]);
}
