#!/usr/bin/env python3
"""
/dengesizlik-maliyeti/veri dosyalarını LibreOffice Calc (headless) ile TÜRKÇE (tr-TR) yerel
ayarda açar ve hücre türlerini/değerlerini beklenen JSON ile karşılaştırır.
!!! Girdi dosyaları UYDURMA TEST VERİSİDİR (docs/qa/dengesizlik-dosya-uret.mjs).

  python3 -I docs/qa/dengesizlik-libreoffice-denetle.py <dosya-dizini>

- Yeni, geçici bir LibreOffice profili kurulur; "Yerel ayar" (ooSetupSystemLocale) tr-TR yapılır.
- CSV iki yoldan açılır: (a) dil belirtilmeden (profilin tr-TR ayarı; Türkçe Excel'in çift tıkla
  açması gibi), (b) içe aktarma filtresinde dil 1055 (tr-TR). Ayırıcı ";", UTF-8, özel sayı algılama açık.
- XLSX doğrudan açılır. Her ikisi .fods'a (düz XML) dönüştürülüp hücreler okunur.
- Denetlenen: her fiyat/süre hücresi SAYISAL (float) ve değeri JSON ile birebir; eksi sayılar eksi;
  yayımlanmamış değer BOŞ hücre (0 değil); metin sütunları ve Türkçe karakterler; XLSX'te iki sayfa
  (veri + "Bilgi"), iki ondalıklı sütunların tr-TR görünümü ("2.438,00"), bayat bilgisi.
Çıktı yalnız sayılar ve doğru/yanlış (hücre değeri basılmaz). Başarısızlıkta çıkış 1.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

NS = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
}
A = lambda ns, ad: '{%s}%s' % (NS[ns], ad)

gecti = 0
kaldi = 0


def ok(ad, kosul, ek=''):
    global gecti, kaldi
    if kosul:
        gecti += 1
    else:
        kaldi += 1
        print('  FAIL %s %s' % (ad, ek))


def profil_kur():
    d = tempfile.mkdtemp(prefix='lo-tr-')
    u = os.path.join(d, 'user')
    os.makedirs(u)
    with open(os.path.join(u, 'registrymodifications.xcu'), 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<oor:items xmlns:oor="http://openoffice.org/2001/registry" xmlns:xs="http://www.w3.org/2001/XMLSchema" '
                'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
                '<item oor:path="/org.openoffice.Setup/L10N"><prop oor:name="ooSetupSystemLocale" oor:op="fuse"><value>tr-TR</value></prop></item>\n'
                '<item oor:path="/org.openoffice.Setup/L10N"><prop oor:name="DecimalSeparatorAsLocale" oor:op="fuse"><value>true</value></prop></item>\n'
                '</oor:items>\n')
    return d


def donustur(profil, dosya, cikis, infilter=None):
    soffice = shutil.which('soffice') or shutil.which('libreoffice') or r'C:\Program Files\LibreOffice\program\soffice.exe'
    kom = [soffice, '-env:UserInstallation=file://' + profil.replace('\\', '/'), '--headless', '--norestore']
    if infilter:
        kom.append('--infilter=' + infilter)
    kom += ['--convert-to', 'fods', '--outdir', cikis, dosya]
    subprocess.run(kom, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180, check=False)
    yol = os.path.join(cikis, os.path.splitext(os.path.basename(dosya))[0] + '.fods')
    return yol if os.path.exists(yol) else None


def sayfalar(fods):
    kok = ET.parse(fods).getroot()
    out = []
    for t in kok.iter(A('table', 'table')):
        satirlar = []
        for r in t.iter(A('table', 'table-row')):
            hucreler = []
            for c in r:
                if c.tag not in (A('table', 'table-cell'), A('table', 'covered-table-cell')):
                    continue
                tekrar = int(c.get(A('table', 'number-columns-repeated'), '1'))
                tur = c.get(A('office', 'value-type'))
                deger = c.get(A('office', 'value')) or c.get(A('office', 'date-value')) or c.get(A('office', 'time-value'))
                gorunen = ''.join(''.join(p.itertext()) for p in c.findall(A('text', 'p')))
                for _ in range(min(tekrar, 64)):
                    hucreler.append((tur, deger, gorunen))
            while hucreler and hucreler[-1][0] is None and hucreler[-1][2] == '':
                hucreler.pop()
            satirlar.append(hucreler)
        while satirlar and not satirlar[-1]:
            satirlar.pop()
        out.append((t.get(A('table', 'name')), satirlar))
    return out


SUTUN = [None, None, None, 'dk', 'ptf', 'smf', 'yon', 'pozitif', 'negatif', 'maliyetPozitif', 'maliyetNegatif', None]
YON = {'acik': 'Enerji açığı', 'fazla': 'Enerji fazlası', 'denge': 'Dengede'}


def karsilastir(etiket, satirlar, donemler, xlsx):
    veri = satirlar[1:]
    ok('%s: satır sayısı = dönem sayısı (%d)' % (etiket, len(donemler)), len(veri) == len(donemler), '-> %d' % len(veri))
    ok('%s: başlık satırı metin, Türkçe karakterler bozulmadan' % etiket, satirlar and satirlar[0][0][2] == 'Tarih' and satirlar[0][1][2] == 'Dönem başlangıcı' and satirlar[0][-1][2] == 'Kaynak')
    sayisal = esit = bos = sifir = eksi = 0
    kotu = []
    turler = {'A': set(), 'B': set(), 'C': set()}
    for i, d in enumerate(donemler):
        if i >= len(veri):
            break
        h = veri[i] + [(None, None, '')] * (12 - len(veri[i]))
        for k, harf in ((0, 'A'), (1, 'B'), (2, 'C')):
            turler[harf].add(h[k][0] or 'boş')
        for k, alan in enumerate(SUTUN):
            if alan is None or alan == 'yon':
                continue
            v = d[alan]
            tur, deger, gorunen = h[k]
            if v is None:
                if tur is None and gorunen == '':
                    bos += 1
                else:
                    kotu.append('%d:%d boş değil' % (i, k))
                    if deger in ('0', '0.0'):
                        sifir += 1
                continue
            if tur == 'float':
                sayisal += 1
                if abs(float(deger) - float(v)) < 1e-9:
                    esit += 1
                    if float(v) < 0:
                        eksi += 1
                else:
                    kotu.append('%d:%d değer' % (i, k))
            else:
                kotu.append('%d:%d tür %s' % (i, k, tur))
        yon = h[6][2]
        if (d['yon'] and yon != YON[d['yon']]) or (not d['yon'] and yon != ''):
            kotu.append('%d yön' % i)
        if h[11][2] != 'EPİAŞ Şeffaflık Platformu':
            kotu.append('%d kaynak' % i)
    beklenen_sayi = sum(1 for d in donemler for a in SUTUN if a and a != 'yon' and d[a] is not None)
    ok('%s: %d sayısal hücrenin tümü SAYI ve değeri birebir (%d/%d)' % (etiket, beklenen_sayi, esit, beklenen_sayi), sayisal == esit == beklenen_sayi and not kotu, '-> %s' % kotu[:6])
    ok('%s: yayımlanmamış değer boş hücre, 0 değil (%d boş)' % (etiket, bos), sifir == 0)
    beklenen_eksi = sum(1 for d in donemler for a in ('pozitif', 'maliyetPozitif', 'maliyetNegatif', 'negatif') if d[a] is not None and d[a] < 0)
    ok('%s: eksi sayılar eksi sayı olarak (%d)' % (etiket, eksi), eksi == beklenen_eksi, '-> %d/%d' % (eksi, beklenen_eksi))
    print('  %s: sütun türleri A(tarih)=%s B(başlangıç)=%s C(bitiş)=%s' % (etiket, sorted(turler['A']), sorted(turler['B']), sorted(turler['C'])))
    if xlsx:
        # İki ondalıklı biçim (yerleşik 4: #,##0.00) tr-TR görünümünde binlik nokta, ondalık virgül
        g = [veri[i][4][2] for i in range(min(3, len(veri)))]
        ok('%s: iki ondalıklı sütun tr-TR görünümü (ör. "2.000,00")' % etiket, all(x.count(',') == 1 and len(x.split(',')[1]) == 2 for x in g) and any('.' in x for x in g), '-> %s' % g)
    else:
        g = [veri[i][4][2] for i in range(min(3, len(veri)))]
        print('  %s: CSV görünümü (standart biçim) örnek uzunlukları %s' % (etiket, [len(x) for x in g]))


def main():
    if len(sys.argv) < 2:
        print('Kullanım: python3 -I docs/qa/dengesizlik-libreoffice-denetle.py <dosya-dizini>')
        return 2
    dizin = sys.argv[1]
    with open(os.path.join(dizin, 'TEST-VERISI-beklenen.json'), encoding='utf-8') as f:
        beklenen = json.load(f)
    surum = subprocess.run([shutil.which('soffice') or 'soffice', '--version'], capture_output=True, text=True).stdout.strip()
    print('# LibreOffice: %s · yerel ayar tr-TR (geçici profil)' % surum)
    profil = profil_kur()
    cikis = tempfile.mkdtemp(prefix='lo-cikis-')
    try:
        for ad, j in beklenen.items():
            donemler = j['donemler']
            csv = os.path.join(dizin, 'TEST-VERISI-dengesizlik-%s.csv' % ad)
            xlsx = os.path.join(dizin, 'TEST-VERISI-dengesizlik-%s.xlsx' % ad)
            for yol_ad, filtre in (('profil tr-TR', 'CSV:59,34,76,1,,0,false,true'), ('filtre dili 1055', 'CSV:59,34,76,1,,1055,false,true')):
                alt = os.path.join(cikis, ad + '-' + str(abs(hash(yol_ad)) % 1000))
                os.makedirs(alt, exist_ok=True)
                f = donustur(profil, csv, alt, filtre)
                ok('CSV %s (%s): açıldı' % (ad, yol_ad), f is not None)
                if f:
                    s = sayfalar(f)
                    ok('CSV %s (%s): tek sayfa' % (ad, yol_ad), len(s) == 1)
                    karsilastir('CSV %s (%s)' % (ad, yol_ad), s[0][1], donemler, False)
            alt = os.path.join(cikis, ad + '-xlsx')
            os.makedirs(alt, exist_ok=True)
            f = donustur(profil, xlsx, alt)
            ok('XLSX %s: açıldı' % ad, f is not None)
            if f:
                s = sayfalar(f)
                ok('XLSX %s: iki sayfa (veri + "Bilgi")' % ad, len(s) == 2 and s[1][0] == 'Bilgi', '-> %s' % [x[0] for x in s])
                karsilastir('XLSX %s' % ad, s[0][1], donemler, True)
                if len(s) == 2:
                    bilgi = {r[0][2]: r[1][2] for r in s[1][1][1:] if len(r) >= 2}
                    bayat = bilgi.get('Önceki senkrondan mı (bayat)', '')
                    ok('XLSX %s: Bilgi sayfası kaynak, çekim anı, bayat bilgisi, atıf, not' % ad, bilgi.get('Kaynak') == 'EPİAŞ Şeffaflık Platformu' and bilgi.get("EPİAŞ'tan alındığı an") == j['cekildi'] and ((bayat.startswith('Evet.')) if j['bayat'] else bayat == 'Hayır') and bilgi.get('Atıf', '').startswith('Dayanak') and len(bilgi.get('Not', '')) > 200, '-> %s' % sorted(bilgi.keys()))
    finally:
        shutil.rmtree(profil, ignore_errors=True)
        shutil.rmtree(cikis, ignore_errors=True)
    print('\n%d passed, %d failed' % (gecti, kaldi))
    return 1 if kaldi else 0


if __name__ == '__main__':
    sys.exit(main())
