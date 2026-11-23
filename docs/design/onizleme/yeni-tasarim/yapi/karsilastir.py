#!/usr/bin/env python3
"""Önce/sonra karşılaştırması: canlı ana sayfa (kök index.html) ile hazırlık sayfası.
Kaynak HTML üzerinden çalışır (betik çalıştırmaz): baş bölümü, JSON-LD, başlık ağacı, iç bağlantılar ve
çapa metinleri, görünür TR ve EN metin (blok düzeyinde), kelime sayıları, id değerleri.
Kullanım: karsilastir.py [canlı.html] [hazırlık.html]"""
import re, sys
from html.parser import HTMLParser

CANLI = sys.argv[1] if len(sys.argv) > 1 else '/home/user/website/index.html'
YENI = sys.argv[2] if len(sys.argv) > 2 else '/home/user/website/docs/design/onizleme/yeni-tasarim/index.html'
BOS = {'meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'path', 'circle', 'rect', 'line', 'stop', 'use', 'ellipse', 'animate', 'col', 'wbr'}
SATIR_ICI = {'a', 'span', 'strong', 'em', 'b', 'i', 'small', 'br', 'abbr', 'sup', 'sub', 'label'}
ATLA = {'script', 'style', 'svg', 'noscript', 'template'}


def duz(s):
    return re.sub(r'\s+', ' ', s).strip()


class Dugum:
    def __init__(self, etiket, nit, ust):
        self.etiket, self.nit, self.ust, self.cocuk = etiket, nit, ust, []


class Agac(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.kok = Dugum('kok', {}, None)
        self.simdi = self.kok

    def handle_starttag(self, tag, attrs):
        d = Dugum(tag, dict(attrs), self.simdi)
        self.simdi.cocuk.append(d)
        if tag not in BOS:
            self.simdi = d

    def handle_startendtag(self, tag, attrs):
        self.simdi.cocuk.append(Dugum(tag, dict(attrs), self.simdi))

    def handle_endtag(self, tag):
        if tag in BOS:
            return
        d = self.simdi
        while d is not None and d.etiket != tag:
            d = d.ust
        if d is not None and d.ust is not None:
            self.simdi = d.ust

    def handle_data(self, data):
        self.simdi.cocuk.append(data)


def oku(yol):
    ham = open(yol, encoding='utf-8').read()
    a = Agac()
    a.feed(ham)
    return ham, a.kok


def sinif(d):
    return (d.nit.get('class') or '').split()


def gizli(d, dil):
    s = sinif(d)
    if d.etiket in ATLA or 'hp-field' in s:
        return True
    if dil == 'tr' and 'en-only' in s:
        return True
    if dil == 'en' and 'tr-only' in s:
        return True
    if d.nit.get('hidden') is not None and d.nit.get('id') != 'mobileMenu':
        return True
    if 'display:none' in (d.nit.get('style') or '').replace(' ', ''):
        return True
    return False


def metin(d, dil):
    """Bir düğümün o dildeki görünür metni (satır içi alt öğeler dahil)."""
    if isinstance(d, str):
        return d
    if gizli(d, dil):
        return ''
    if d.etiket == 'br':
        return ' '
    if 'data-tr' in d.nit and 'data-en' in d.nit and not any(isinstance(c, Dugum) for c in d.cocuk):
        return d.nit['data-' + dil]
    if 'data-tr' in d.nit and 'data-en' in d.nit and dil == 'en' and d.nit.get('data-en-strong'):
        return d.nit['data-en']
    return ''.join(metin(c, dil) for c in d.cocuk)


def bloklar(d, dil, cikti):
    """Blok düzeyinde metin parçaları: bir blok, doğrudan satır içi içeriği olan en içteki blok öğesidir."""
    if isinstance(d, str) or gizli(d, dil):
        return
    if d.etiket in ('select',):
        for c in d.cocuk:
            if isinstance(c, Dugum):
                t = duz(metin(c, dil))
                if t:
                    cikti.append(t)
        return
    blok_cocuk = [c for c in d.cocuk if isinstance(c, Dugum) and c.etiket not in SATIR_ICI and c.etiket not in BOS and not gizli(c, dil)]
    # satır içi çocuklar blok içeriyorsa (ör. <a> içinde <div>) onları da blok say
    def blok_var(x):
        return isinstance(x, Dugum) and any(isinstance(c, Dugum) and (c.etiket not in SATIR_ICI and c.etiket not in BOS or blok_var(c)) for c in x.cocuk)
    karisik = [c for c in d.cocuk if isinstance(c, Dugum) and c.etiket in SATIR_ICI and blok_var(c)]
    if not blok_cocuk and not karisik:
        t = duz(metin(d, dil))
        if t:
            cikti.append(t)
        return
    tampon = []
    for c in d.cocuk:
        if isinstance(c, str) or (c.etiket in SATIR_ICI and c not in karisik) or c.etiket in BOS:
            tampon.append(metin(c, dil))
        else:
            t = duz(''.join(tampon)); tampon = []
            if t:
                cikti.append(t)
            bloklar(c, dil, cikti)
    t = duz(''.join(tampon))
    if t:
        cikti.append(t)


def gez(d):
    if isinstance(d, Dugum):
        yield d
        for c in d.cocuk:
            yield from gez(c)


def govde(kok):
    for d in gez(kok):
        if d.etiket == 'body':
            return d
    return kok


def basliklar(kok, dil):
    return [(d.etiket.upper(), duz(metin(d, dil))) for d in gez(govde(kok)) if re.fullmatch(r'h[1-6]', d.etiket) and not any(gizli(u, dil) for u in ustler(d))]


def ustler(d):
    while d is not None:
        yield d
        d = d.ust


def baglar(kok, dil):
    out = []
    for d in gez(govde(kok)):
        if d.etiket == 'a' and d.nit.get('href') and not any(gizli(u, dil) for u in ustler(d)):
            out.append((d.nit['href'], duz(metin(d, dil)) or '[' + (d.nit.get('aria-label') or '') + ']'))
    return out


def kelime(parcalar):
    return sum(len(re.findall(r"[^\W\d_]+(?:['’][^\W\d_]+)?|\d[\d.,/:-]*", p)) for p in parcalar)


ham_c, c = oku(CANLI)
ham_y, y = oku(YENI)
print('ÖNCE/SONRA KARŞILAŞTIRMASI')
print('önce : %s (%d bayt)' % (CANLI, len(ham_c.encode())))
print('sonra: %s (%d bayt)' % (YENI, len(ham_y.encode())))

print('\n== 1. BAŞ BÖLÜMÜ ==')
FONT = 'display=swap" rel="stylesheet">\n'
ba, bb = ham_c[:ham_c.index(FONT) + len(FONT)], ham_y[:ham_y.index(FONT) + len(FONT)]
print('  <!DOCTYPE> … yazı tipi bağlantısı bayt bayt aynı: %s (%d bayt)' % (ba == bb, len(ba.encode())))
for ad, desen in [('title', r'<title>.*?</title>'), ('meta description', r'<meta name="description"[^>]*>'), ('canonical', r'<link rel="canonical"[^>]*>'),
                  ('hreflang (alternate)', r'<link rel="alternate"[^>]*>'), ('robots', r'<meta name="robots"[^>]*>'), ('og:*', r'<meta property="og:[^>]*>'),
                  ('twitter:*', r'<meta name="twitter:[^>]*>'), ('favicon', r'<link rel="(?:icon|apple-touch-icon)"[^>]*>'), ('JSON-LD blokları', r'<script type="application/ld\+json">.*?</script>')]:
    x, z = re.findall(desen, ham_c, re.S), re.findall(desen, ham_y, re.S)
    print('  %-22s aynı: %-5s (önce %d, sonra %d öğe)' % (ad, x == z, len(x), len(z)))
print('  robots değeri:', re.findall(r'<meta name="robots" content="([^"]*)"', ham_y))
fa = ham_c[ham_c.index('<form class="form reveal"'):ham_c.index('</form>') + 7]
fb = ham_y[ham_y.index('<form class="form reveal"'):ham_y.index('</form>') + 7]
print('  teklif formu (<form>…</form>) bayt bayt aynı: %s (%d bayt)' % (fa == fb, len(fa.encode())))

print('\n== 2. BAŞLIK AĞACI (TR) ==')
for ad, kok in (('ÖNCE', c), ('SONRA', y)):
    b = basliklar(kok, 'tr')
    print('  %s: %d başlık (H1 %d, H2 %d, H3 %d)' % (ad, len(b), sum(e == 'H1' for e, _ in b), sum(e == 'H2' for e, _ in b), sum(e == 'H3' for e, _ in b)))
    onceki = 0
    for e, t in b:
        n = int(e[1])
        print('    %s%s %s%s' % ('  ' * (n - 1), e, t, '   <-- ATLANAN DÜZEY' if n > onceki + 1 else ''))
        onceki = n
print('  SONRA (EN):')
for e, t in basliklar(y, 'en'):
    print('    %s%s %s' % ('  ' * (int(e[1]) - 1), e, t))

print('\n== 3. İÇ BAĞLANTILAR VE ÇAPA METİNLERİ (TR) ==')
bc, by = baglar(c, 'tr'), baglar(y, 'tr')
print('  önce %d bağlantı (%d farklı hedef), sonra %d bağlantı (%d farklı hedef)' % (len(bc), len({h for h, _ in bc}), len(by), len({h for h, _ in by})))
kc, ky = set(bc), set(by)
print('  KALDIRILAN (hedef, çapa metni): %d' % len(kc - ky))
for h, t in sorted(kc - ky):
    print('    - %-38s "%s"%s' % (h, t, '' if h in {x for x, _ in by} else '   <-- HEDEF ARTIK YOK'))
print('  EKLENEN: %d' % len(ky - kc))
for h, t in sorted(ky - kc):
    print('    + %-38s "%s"' % (h, t))
print('  hedef başına adet (önce → sonra):')
for h in sorted({h for h, _ in bc} | {h for h, _ in by}):
    a, b2 = sum(1 for x, _ in bc if x == h), sum(1 for x, _ in by if x == h)
    print('    %-38s %d → %d%s' % (h, a, b2, '' if a == b2 else '  *'))
ec, ey = baglar(c, 'en'), baglar(y, 'en')
print('  EN çapa metinleri — kaldırılan: %s' % sorted(set(ec) - set(ey)))
print('  EN çapa metinleri — eklenen: %s' % sorted(set(ey) - set(ec)))

def birimler(d, dil, cikti):
    """Metin birimleri: çeviri çiftinin o dildeki değeri, dile özel (tr-only/en-only) öğenin tüm metni,
    bunların dışında kalan düz metin düğümleri. Görünmeyenler (öbür dil, gizli alan, betik, çizim) atlanır."""
    if isinstance(d, str):
        t = duz(d)
        if t:
            cikti.append(t)
        return
    if gizli(d, dil):
        return
    s = sinif(d)
    if 'data-tr' in d.nit and 'data-en' in d.nit and (not any(isinstance(c, Dugum) for c in d.cocuk) or d.nit.get('data-' + dil + '-strong')):
        t = duz(d.nit['data-' + dil])
        if t:
            cikti.append(t)
        return
    if (dil + '-only') in s:
        t = duz(metin(d, dil))
        if t:
            cikti.append(t)
        return
    for c in d.cocuk:
        birimler(c, dil, cikti)


SUS = re.compile(r'^(?:[—·/◆▸®]|\d\d|S[1-5]|[ABC]|\d\d:00|(?:\d\d / \d\d))$')
for dil in ('tr', 'en'):
    print('\n== 4. GÖRÜNÜR METİN (%s) — metin birimi düzeyinde ==' % dil.upper())
    pc, py = [], []
    birimler(govde(c), dil, pc)
    birimler(govde(y), dil, py)
    sc, sy = set(pc), set(py)
    print('  birim sayısı: önce %d (farklı %d), sonra %d (farklı %d) · kelime sayısı: önce %d, sonra %d' % (len(pc), len(sc), len(py), len(sy), kelime(pc), kelime(py)))
    kal = [p for p in dict.fromkeys(pc) if p not in sy]
    print('  KALDIRILAN: %d (süs ve numara işaretleri: %s)' % (len(kal), ' '.join(k for k in kal if SUS.match(k)) or 'yok'))
    for t in kal:
        if not SUS.match(t):
            print('    - ' + t)
    ek = [p for p in dict.fromkeys(py) if p not in sc]
    print('  EKLENEN: %d (saat etiketleri vb.: %d)' % (len(ek), sum(1 for k in ek if SUS.match(k))))
    for t in ek:
        if not SUS.match(t):
            print('    + ' + t)

print('\n== 5. data-tr / data-en ÇİFTLERİ ==')
def ciftler(kok):
    return {(duz(d.nit['data-tr']), duz(d.nit['data-en'])) for d in gez(kok) if 'data-tr' in d.nit and 'data-en' in d.nit}
cc, cy = ciftler(c), ciftler(y)
print('  önce %d, sonra %d · kaldırılan %d · eklenen %d' % (len(cc), len(cy), len(cc - cy), len(cy - cc)))
for t in sorted(cc - cy):
    print('    - %s | %s' % t)
for t in sorted(cy - cc):
    print('    + %s | %s' % t)

print('\n== 6. id DEĞERLERİ ==')
ic = {d.nit['id'] for d in gez(c) if d.nit.get('id')}
iy = {d.nit['id'] for d in gez(y) if d.nit.get('id')}
print('  önce %d, sonra %d' % (len(ic), len(iy)))
print('  kaldırılan:', sorted(ic - iy))
print('  eklenen   :', sorted(iy - ic))
KRITIK = ['leadForm', 'teklif', 'iletisim', 'hakkimizda', 'yaklasim', 'hizmetler', 'kapak', 'canli-piyasa']
print('  gelen bağlantıların kullandığı çapalar duruyor: %s  %s' % (all(k in iy for k in KRITIK), KRITIK))
js = '\n'.join(re.findall(r'<script>(.*?)</script>', ham_y, re.S))
kullanilan = set(re.findall(r"getElementById\('([^']+)'\)", js)) | set(re.findall(r"\$\('([^']+)'\)", js)) | set(re.findall(r"querySelector(?:All)?\('#([A-Za-z0-9_-]+)", js))
print('  sayfadaki betiğin aradığı ama sayfada OLMAYAN id:', sorted(k for k in kullanilan if k not in iy))

print('\n== 7. KİMLİK VE LİSANS BİLGİLERİ (kaynakta geçme sayısı: önce → sonra) ==')
for s in ['ETS/3424-8/2074', '786882-0', 'Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.', 'info@voltage.com.tr', 'Acıbadem Mah. Elysium Elit', '34718 Kadıköy', '19 Eylül 2011 · Kurul Kararı 3424-8', 'YEK-G SERTİFİKALI SATICI', 'İTO ÜYESİ', 'Emirhan Tan, Yönetim Kurulu Başkanı']:
    gc, gy = ham_c[ham_c.index('<body'):].count(s), ham_y[ham_y.index('<body'):].count(s)
    print('  %-55s %d → %d%s' % (s, gc, gy, '' if gy else '   <-- YOK'))

print('\n== 8. BETİK ==')
bc_, by_ = '\n'.join(re.findall(r'<script>(.*?)</script>', ham_c, re.S)), js
print('  satır içi betik: önce %d bayt, sonra %d bayt' % (len(bc_.encode()), len(by_.encode())))
css_c, css_y = '\n'.join(re.findall(r'<style>(.*?)</style>', ham_c, re.S)), '\n'.join(re.findall(r'<style>(.*?)</style>', ham_y, re.S))
print('  satır içi stil : önce %d bayt, sonra %d bayt' % (len(css_c.encode()), len(css_y.encode())))

import difflib
fark = [l for l in difflib.unified_diff(bc_.split('\n'), by_.split('\n'), lineterm='', n=0) if not l.startswith(('---', '+++', '@@'))]
print('  betik satır farkı: -%d +%d' % (sum(l.startswith('-') for l in fark), sum(l.startswith('+') for l in fark)))
print('  çıkarılan bloklar (sayfada öğesi kalmayanlar): SMIL temizliği, kaydırınca belirme (IntersectionObserver), saatlik ray, folyo, tek hat şeması')
print('  eklenen satırlar:')
for l in fark:
    if l.startswith('+') and l[1:].strip():
        print('    ' + l[:200])
kalan = [l for l in fark if l.startswith('-') and re.search(r'fetch\(|localStorage|CACHE_KEY|PTF_PROXY|/api/lead|kaynakBul|utmParams', l)]
print('  çıkarılan satırlar içinde veri/önbellek/form mantığına dokunan: %d' % len([l for l in kalan if 'mcpRail' not in l and 'fetchPtfLive' not in l]))
print('  form betiği (// 6) Teklif formu … init) bayt bayt aynı: %s' % (bc_[bc_.index('// 6) Teklif formu'):bc_.index('// Initialize from URL param')] == by_[by_.index('// 6) Teklif formu'):by_.index('// Initialize from URL param')]))

print('\n== 9. BETİKSİZ GÖRÜNÜM İÇİN EK METİN (<noscript>) ==')
for m in re.findall(r'<noscript>(.*?)</noscript>', ham_y, re.S):
    print('  ' + duz(re.sub(r'<[^>]+>', '', m)))
