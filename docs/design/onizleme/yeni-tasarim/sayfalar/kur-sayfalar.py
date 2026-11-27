#!/usr/bin/env python3
"""Alt sayfaları yeni tasarım sistemine taşır (1. aşama: ortak kabuk + dört örnek sayfa).

Canlı sayfa dosyaları yalnız OKUNUR, hiçbirine yazılmaz. Çıktı: bu klasördeki cikti/<aynı göreli yol>.

Ne nereden gelir:
- <head>: canlı sayfadan bayt bayt; tek değişiklik <style>…</style> bloğunun yerine yeni stilin gelmesi.
- İçerik: canlı sayfanın <div class="page"> içi, eski alt satır (<footer>) hariç, bayt bayt aynı. Yalnız sarmalayıcılar
  değişir: içerik izi <main> dışında koyu bir şeritte; H1 (+ hemen ardındaki güncelleme satırı ya da giriş paragrafı)
  <main> içindeki koyu sayfa başında; geri kalanı beyaz gövdede. Tek, yalın <main> H1'den "Bu sayfa hakkında"ya kadar sarar
  (dengesizlik-maliyeti.html'deki yapı; o sayfanın kendi <main> / </main> satırları bunun yerine geçer).
- Sayfa betikleri: canlı sayfadan bayt bayt (yerleri de aynı: alt bilginin ardında).
- Üst bant, mobil menü, atlama bağlantısı ve alt bilgi: yeni ana sayfanın gövdesinden (../yapi/govde.html) okunur ve alt
  sayfa için dönüştürülür (bölüm çapaları /#…, dil seçici yok, logo görseli yok, geçerli sayfada aria-current). Etiketler
  ana sayfadaki Türkçe metinlerin aynısıdır (data-tr değeri = görünen metin; denetlenir).
- Mobil menü betiği: canlı index.html'den bayt bayt.
- Stil: (1) yeni ana sayfa stilinden (../yapi/stil.css) süzülen kabuk kuralları, (2) kabuk.css (alt sayfa kabuğu ve ortak
  içerik dizgisi), (3) stil/<sayfa>.css. Üçü satır içi tek <style> bloğuna yazılır (karar: NOTLAR.md).

Kayma olursa (canlı sayfa ya da ana sayfa kaynağı değişirse) doğrulama satırları durur ve neyin değiştiğini söyler.
Kullanım: python3 kur-sayfalar.py [çıktı dizini]
"""
import os
import re
import sys

KOK = '/home/user/website'
BURASI = os.path.dirname(os.path.abspath(__file__))
YAPI = os.path.join(BURASI, '..', 'yapi')
CIKTI = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BURASI, 'cikti')


def oku(yol):
    with open(yol, encoding='utf-8') as f:
        return f.read()


def tek(metin, parca, ad=''):
    assert metin.count(parca) == 1, ('tek değil', ad or parca[:80], metin.count(parca))


def arasi(metin, bas, son, dahil=False):
    tek(metin, bas)
    a = metin.index(bas)
    b = metin.index(son, a + len(bas))
    return metin[a:b + len(son)] if dahil else metin[a + len(bas):b]


def degistir(metin, eski, yeni, kac=1):
    assert metin.count(eski) == kac, ('değiştirme sayısı tutmuyor', eski[:80], metin.count(eski), kac)
    return metin.replace(eski, yeni)


def sikistir(css):
    """kur.py ile aynı (yorumlar kalır; her kural tek satırda, bildirimler arasındaki boşluklar atılır); tek fark: @media
    koşulunun metni olduğu gibi kalır."""
    cikan = []
    for parca in re.split(r'(/\*.*?\*/)', css, flags=re.S):
        if parca.startswith('/*'):
            cikan.append(parca)
            continue
        s = parca
        s = re.sub(r'\n[ \t]+', '\n', s)
        s = re.sub(r'\{\s+', '{', s)
        s = re.sub(r'\s*\}', '}', s)
        s = re.sub(r';\s+', ';', s)
        s = s.replace(';}', '}')
        s = re.sub(r'(@media[^{]*\{)|:[ ]+', lambda m: m.group(1) or ':', s)
        s = re.sub(r',\s+', ',', s)
        s = re.sub(r'[ ]+\{', '{', s)
        s = re.sub(r'(?<![\d.])0\.(\d)', r'.\1', s)
        s = re.sub(r'\n{2,}', '\n', s)
        cikan.append(s)
    return ''.join(cikan).strip('\n')


# ============================================================================
# 1) ANA SAYFA STİLİNDEN KABUK KURALLARI (süzme; bildirimler aynen)
# ============================================================================
IZINLI = (':root', '*', 'html', 'body', 'img', 'svg', 'ul', 'ol', 'a', 'button', 'table', 'main:focus', '.wrap', '.on-dark',
          '.mono', '.skip', '.btn', '.site-header', '.header-in', '.nav-', '.mobile-menu', 'body.menu-open', '.footer',
          '.cl-', '.label')
YASAK = ('.lang', '.btn-ghost', '.arrow', '.more', 'img', 'gorsel-hazir', '.en-only', '.tr-only', '.scrolled', '.sec')
ATLANAN_MEDYA = ('prefers-reduced-motion', 'scripting', 'min-width: 760px')


def secici_uygun(s):
    s = s.strip()
    if s == 'img':
        return True
    if any(y in s for y in YASAK):
        return False
    return any(s.startswith(p) for p in IZINLI)


def kurallar(css):
    """Üst düzey kural ve @media bloklarını sırayla döndürür: ('kural', seçici, gövde) | ('medya', koşul, [kurallar])."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    i, n, cikan = 0, len(css), []
    while i < n:
        a = css.find('{', i)
        if a < 0:
            assert not css[i:].strip(), css[i:i + 80]
            break
        bas = css[i:a].strip()
        if bas.startswith('@'):
            derinlik, j = 1, a + 1
            while derinlik:
                derinlik += {'{': 1, '}': -1}.get(css[j], 0)
                j += 1
            ic = css[a + 1:j - 1]
            cikan.append(('medya', bas, kurallar(ic) if bas.startswith('@media') else ic))
            i = j
        else:
            b = css.index('}', a)
            cikan.append(('kural', bas, css[a + 1:b].strip()))
            i = b + 1
    return cikan


def suz(liste):
    cikan = []
    for tur, bas, ic in liste:
        if tur == 'kural':
            secici = [s.strip() for s in bas.split(',') if secici_uygun(s)]
            if secici:
                cikan.append('%s { %s }' % (', '.join(secici), ic))
        elif bas.startswith('@media') and not any(m in bas for m in ATLANAN_MEDYA):
            ic2 = suz(ic)
            if ic2:
                cikan.append('%s {\n  %s\n}' % (bas, '\n  '.join(ic2)))
    return cikan


ANA_STIL = oku(os.path.join(YAPI, 'stil.css'))
KABUK_ANA = '\n'.join(suz(kurallar(ANA_STIL)))
for gerekli in ('.site-header {', '.mobile-menu {', '.footer {', '.cl-grid {', '--night:', '--cta:', '@media (max-width: 1039px)'):
    assert gerekli in KABUK_ANA, ('ana sayfa stilinden süzülemedi', gerekli)
for istenmeyen in ('.hero', '.form', '.lang-btn', 'animation-duration', '.ptf-'):
    assert istenmeyen not in KABUK_ANA, ('süzmede kalan', istenmeyen)

# ============================================================================
# 2) ANA SAYFA GÖVDESİNDEN KABUK İŞARETLEMESİ
# ============================================================================
GOVDE = oku(os.path.join(YAPI, 'govde.html'))
INDEX = oku(os.path.join(KOK, 'index.html'))

ATLA = arasi(GOVDE, '<a class="skip" href="#icerik"', '</a>', dahil=True)
UST = arasi(GOVDE, '<header class="site-header on-dark" id="nav">', '</header>', dahil=True)
MENU = arasi(GOVDE, '<div class="mobile-menu" id="mobileMenu" hidden>', '\n</div>\n\n<main', dahil=True)[:-len('\n\n<main')]
ALT = arasi(GOVDE, '<footer class="footer on-dark">', '</footer>', dahil=True)
MENU_JS = "(function(){\n  var btn = document.getElementById('mobileMenuBtn');" + arasi(
    INDEX, "<script>\n(function(){\n  var btn = document.getElementById('mobileMenuBtn');", '</script>')
assert MENU_JS.rstrip().endswith('})();'), 'menü betiği beklenen biçimde bitmiyor'

BOLUM_CAPALARI = ('hakkimizda', 'hizmetler', 'yaklasim', 'iletisim')
for c in BOLUM_CAPALARI + ('leadForm',):
    tek(INDEX, 'id="%s"' % c, 'canlı ana sayfada çapa #' + c)
    tek(oku(os.path.join(BURASI, '..', 'index.html')), 'id="%s"' % c, 'yeni ana sayfada çapa #' + c)


def dil_ozniteligi_sil(parca):
    """data-tr / data-en çiftini atar; görünen metnin data-tr değeriyle aynı olduğu denetlenir (yeni metin yok)."""
    def bir(m):
        assert m.group(1) == m.group(3), ('görünen metin data-tr ile aynı değil', m.group(1), m.group(3))
        return m.group(2) + m.group(3)
    parca = re.sub(r' data-tr="([^"]*)" data-en="[^"]*"(>)([^<]*)', bir, parca)
    assert 'data-tr' not in parca and 'data-en' not in parca, 'dil özniteliği kaldı'
    return parca


def dil_seciciyi_sil(parca, girinti):
    blok = re.search(r'\n' + girinti + r'<div class="lang-toggle" role="group" aria-label="Language">\n.*?\n' + girinti + r'</div>', parca, re.S)
    assert blok, 'dil seçici bulunamadı'
    return parca[:blok.start()] + parca[blok.end():]


def capalari_kok(parca):
    for c in BOLUM_CAPALARI:
        parca = parca.replace('href="#%s"' % c, 'href="/#%s"' % c)
    assert not re.search(r'href="#(?!icerik")', parca), re.findall(r'href="#[^"]*"', parca)
    return parca


def gecerli(parca, href, deger):
    if not href:
        return parca
    eski = '<a href="%s"' % href
    assert eski in parca, ('geçerli sayfa bağlantısı yok', href)
    return parca.replace(eski, '%s aria-current="%s"' % (eski, deger))


def kabuk(ayar):
    ust = UST
    ust = degistir(ust, '<a href="#" class="nav-logo">', '<a href="/" class="nav-logo">')
    # Logo: yalnız satır içi çizim (görsel dosyası ana sayfaya özgü; alt sayfada ek istek yok, dengesizlik testi <img> istemez)
    ust = re.sub(r'\n *<img src="/voltage-enerji-logo\.svg"[^>]*>', '', ust, count=1)
    assert '<img' not in ust
    ust = dil_seciciyi_sil(ust, '      ')
    cta = '      <a href="#teklif" class="btn nav-cta" data-tr="Teklif Al" data-en="Get a Quote">Teklif Al</a>\n'
    tek(ust, cta)
    if ayar['kaynak']:
        ust = ust.replace(cta, cta.replace('href="#teklif"', 'href="/?kaynak=%s#leadForm"' % ayar['kaynak']))
    else:
        # Ticari düğmesi olmayan sayfa (dengesizlik-maliyeti: Hukuk/Orkestratör kararı, "teklif al" geçmez): sağ kutu boş kalır
        # ama yerini korur (kabuk.css .nav-right:empty), menü öbür sayfalarla aynı konumda durur
        ust = degistir(ust, '    <div class="nav-right">\n' + cta + '    </div>\n', '    <div class="nav-right" aria-hidden="true"></div>\n')
    ust = capalari_kok(dil_ozniteligi_sil(ust))
    ust = gecerli(ust, ayar['ust_etkin'], ayar['ust_etkin_deger'])
    menu = capalari_kok(dil_ozniteligi_sil(dil_seciciyi_sil(MENU, '  ')))
    menu = gecerli(menu, ayar['ust_etkin'], ayar['ust_etkin_deger'])
    alt = capalari_kok(dil_ozniteligi_sil(ALT))
    alt = degistir(alt, '<footer class="footer on-dark">\n', '<footer>\n<div class="footer on-dark">\n')
    alt = degistir(alt, '\n</footer>', '\n</div>\n</footer>')
    alt = gecerli(alt, ayar['alt_etkin'], 'page')
    atla = dil_ozniteligi_sil(ATLA)
    return atla, ust, menu, alt


# ============================================================================
# 3) SAYFALAR
# ============================================================================
SAYFALAR = [
    dict(yol='rehber/tekstil-elektrik.html', tur='rehber', ust_etkin='/rehber', ust_etkin_deger='true', alt_etkin=None, stil=[]),
    dict(yol='canli-ptf.html', tur='veri', ust_etkin='/canli-ptf', ust_etkin_deger='page', alt_etkin=None, stil=['veri-bandi.css', 'canli-ptf.css']),
    dict(yol='kurumsal.html', tur='kurumsal', ust_etkin=None, ust_etkin_deger=None, alt_etkin='/kurumsal', stil=['kurumsal.css']),
    dict(yol='dengesizlik-maliyeti.html', tur='arac', ust_etkin=None, ust_etkin_deger=None, alt_etkin=None, stil=['veri-bandi.css', 'dengesizlik-maliyeti.css']),
]

KABUK_CSS = oku(os.path.join(BURASI, 'kabuk.css'))


def stil(ayar):
    parcalar = ['/* ===== 1) Ana sayfa kabuğu: yeni ana sayfa stilinden (yapi/stil.css) süzüldü, bildirimler aynen ===== */',
                KABUK_ANA,
                '/* ===== 2) Alt sayfa kabuğu ve ortak içerik dizgisi (sayfalar/kabuk.css) ===== */',
                KABUK_CSS]
    sayfa = ['/* ===== 3) Sayfaya özgü: sayfalar/stil/%s ===== */\n%s' % (d, oku(os.path.join(BURASI, 'stil', d)).rstrip('\n')) for d in ayar['stil']]
    # Kabuk sıkıştırılır (her sayfada aynı); sayfaya özgü stil okunur biçimde kalır: QA testleri bazı kuralları metin
    # olarak arar (test-dengesizlik.mjs R6, R9, R10) ve sayfa düzeltmeleri tek dosyada elle yapılabilir.
    return '\n'.join([sikistir('\n'.join(parcalar))] + sayfa)


def kur(ayar):
    canli = oku(os.path.join(KOK, ayar['yol']))
    assert canli.startswith('<!DOCTYPE html>\n<html lang="tr">\n<head>\n'), 'belge başı beklenen gibi değil'
    # ---- baş: <style> bloğu dışında bayt bayt aynı ----
    tek(canli, '<style>', 'style açılışı')
    tek(canli, '</style>\n', 'style kapanışı')
    tek(canli, '</head>\n<body>\n<div class="page">\n', 'gövde başı')
    bas_bolum = canli[:canli.index('</head>\n') + len('</head>\n')]
    eski_stil = arasi(bas_bolum, '<style>', '</style>\n', dahil=True)
    yeni_bas = bas_bolum.replace(eski_stil, '<style>\n' + stil(ayar) + '\n</style>\n')
    # ---- gövde ----
    govde = canli[canli.index('<body>\n<div class="page">\n') + len('<body>\n<div class="page">\n'):]
    tek(govde, '\n  <footer>', 'eski alt satır')
    icerik, kalan = govde.split('\n  <footer>')
    eski_alt = '  <footer>' + kalan[:kalan.index('</footer>\n') + len('</footer>')]
    kalan = kalan[kalan.index('</footer>\n') + len('</footer>\n'):]
    assert kalan.startswith('</div>\n'), 'sayfa kabı alt satırın hemen ardında kapanmıyor'
    kalan = kalan[len('</div>\n'):]
    assert kalan.endswith('</body>\n</html>\n'), 'belge sonu beklenen gibi değil'
    betikler = kalan[:-len('</body>\n</html>\n')]
    # Üst banttaki "Teklif Al": sayfanın kendi teklif düğmeleriyle aynı kaynak etiketi (yeni etiket yok). Sayfada teklif
    # düğmesi yoksa üst bantta da olmaz.
    kaynaklar = set(re.findall(r'href="/\?kaynak=([a-z0-9-]+)#leadForm"', canli))
    assert len(kaynaklar) <= 1, ('sayfada birden çok kaynak etiketi', kaynaklar)
    ayar = dict(ayar, kaynak=kaynaklar.pop() if kaynaklar else None)
    # dengesizlik: eski <main> sarmalayıcısı (kabuğun <main id="icerik"> öğesi onun yerini alır)
    if '\n  <main>\n' in icerik:
        icerik = degistir(icerik, '\n  <main>\n', '\n')
        icerik = degistir(icerik, '\n  </main>\n', '\n')
        assert icerik.endswith('\n'), icerik[-40:]
    assert '<main' not in icerik and '<footer' not in icerik
    # ---- sayfa başı: içerik izi + H1 (+ hemen ardındaki güncelleme satırı ya da giriş paragrafı) ----
    satirlar = icerik.split('\n')
    assert satirlar[0].startswith('  <nav class="crumbs" aria-label="Breadcrumb">') and satirlar[0].endswith('</nav>'), satirlar[0]
    assert satirlar[1].startswith('  <h1>') and satirlar[1].endswith('</h1>'), satirlar[1]
    k = 2
    if satirlar[2].startswith('  <div class="updated">') or satirlar[2].startswith('  <p class="lede">'):
        assert satirlar[2].endswith('</div>') or satirlar[2].endswith('</p>'), satirlar[2]
        k = 3
    iz = satirlar[0]
    bant = '\n'.join(satirlar[1:k])
    govde_ic = '\n'.join(satirlar[k:]).rstrip('\n')  # baştaki boş satır korunur (bayt karşılaştırması)
    assert icerik.count('<h1') == 1

    atla, ust, menu, alt = kabuk(ayar)
    cikti = (yeni_bas + '<body>\n' + atla + '\n\n<!-- ÜST BANT -->\n' + ust + '\n\n' + menu + '\n\n'
             + '<div class="sayfa-iz on-dark">\n<div class="wrap">\n' + iz + '\n</div>\n</div>\n'
             + '<main>\n'
             + '<div class="sayfa-bas on-dark" id="icerik" tabindex="-1">\n<div class="wrap">\n' + bant + '\n</div>\n</div>\n'
             + '<div class="sayfa-govde sayfa-%s">\n<div class="wrap">\n' % ayar['tur'] + govde_ic + '\n</div>\n</div>\n'
             + '</main>\n\n<!-- KAPANIŞ -->\n' + alt + '\n' + betikler
             + '\n<script>\n' + MENU_JS + '</script>\n</body>\n</html>\n')

    # ---- doğrulamalar (sürüklenme kapısı) ----
    tek(cikti, '<body>', '<body> (SSR çapası)')
    assert cikti.index('<body>') > cikti.index('</head>')
    assert cikti.count('<h1') == 1 and cikti.count('<main') == 1 and cikti.count('<style>') == 1
    assert betikler in cikti and iz in cikti and bant in cikti and govde_ic in cikti
    assert cikti.index(iz) < cikti.index('<main>') < cikti.index('<h1') < cikti.index('</main>') < cikti.index('<footer>')
    assert '216 479' not in cikti and '2164790510' not in cikti, 'yayımlanmayacak numara'
    hedef = os.path.join(CIKTI, ayar['yol'])
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    with open(hedef, 'w', encoding='utf-8') as f:
        f.write(cikti)
    return hedef, len(cikti.encode('utf-8')), len(stil(ayar).encode('utf-8')), eski_alt


if __name__ == '__main__':
    for ayar in SAYFALAR:
        hedef, boy, css, _ = kur(ayar)
        sys.stdout.write('yazıldı: %s  %d bayt (stil %d)\n' % (os.path.relpath(hedef, BURASI), boy, css))
