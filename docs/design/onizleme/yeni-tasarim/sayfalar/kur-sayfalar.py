#!/usr/bin/env python3
"""Alt sayfaları yeni tasarım sistemine taşır (1. aşama: ortak kabuk + dört örnek sayfa; 2. aşama: kalan bütün herkese açık
sayfalar — 19 rehber daha, rehber dizini, sanayi, fatura hesaplama, üç hukuki metin, 404; panel.html kapsam dışı).

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

Kayma olursa (canlı sayfa ya da ana sayfa kaynağı değişirse) doğrulama satırları durur ve neyin değiştiğini söyler:
- yapı (belge başı, tek <style>, <div class="page">, içerik izi / geri bağlantısı, tek H1, eski alt satır, sayfa kabı);
- sınıf kapısı: içerikte ve sayfa betiklerinde geçen her sınıfın yeni stilde bir kuralı olmalı (ya da SINIFSIZ listesinde
  gerekçeli olmalı) — canlı sayfaya kabukta karşılığı olmayan yeni bir bileşen eklenirse üretim durur;
- dondurulmuş üç rehberin (SEO ölçümü 10.12) canlı dosyası bayt bayt bilinen hâlinde olmalı (sha256);
- 404: oyun sahnesinin stil kuralları canlıdan aynen alınır; değiştirilen her parça tam bir kez bulunmalı.
404 (yalnız yedek içeriğe kabuk): bkz. kur_404().
Kullanım: python3 kur-sayfalar.py [çıktı dizini]
"""
import hashlib
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
    for parca in (atla, ust, menu, alt):
        # Kabukta yeni sayfaya bağlantı yok (test-dengesizlik: mevcut sayfalardan /dengesizlik-maliyeti'ne bağlantı yok);
        # tasarruf ifadesi ve yayımlanmayacak numara yok
        assert 'dengesizlik-maliyeti' not in parca and 'tasarruf' not in parca.lower() and '216 479' not in parca
    return atla, ust, menu, alt


# ============================================================================
# 3) SAYFALAR
# ============================================================================
# tur: gövde sütunu (kabuk.css .sayfa-<tur>). ust_etkin: menüde geçerli bağlantı (içerik izi Rehber'den geçen sayfalarda
# "Rehber" aria-current="true"; dizinin kendisinde "page"). alt_etkin: menüde olmayıp alt bilgide olan sayfa ("page").
# kaynak: sayfada birden çok teklif etiketi varsa üst banttaki düğmenin kullanacağı, sayfanın KENDİ etiketi (yeni etiket yok).
def rehber(ad, stil=(), **k):
    return dict(yol='rehber/%s.html' % ad, tur='rehber', ust_etkin='/rehber', ust_etkin_deger='true', alt_etkin=None, stil=list(stil), **k)


SAYFALAR = [
    # ---- 1. aşama ----
    rehber('tekstil-elektrik'),
    dict(yol='canli-ptf.html', tur='veri', ust_etkin='/canli-ptf', ust_etkin_deger='page', alt_etkin=None, stil=['veri-bandi.css', 'sema.css', 'canli-ptf.css']),
    dict(yol='kurumsal.html', tur='kurumsal', ust_etkin=None, ust_etkin_deger=None, alt_etkin='/kurumsal', stil=['sutunlar.css', 'kurumsal.css']),
    dict(yol='dengesizlik-maliyeti.html', tur='arac', ust_etkin=None, ust_etkin_deger=None, alt_etkin=None, stil=['veri-bandi.css', 'dengesizlik-maliyeti.css']),
    # ---- 2. aşama: rehberler ----
    rehber('15-dakikalik-uzlastirma', ['icerik.css']),
    rehber('cam-seramik-elektrik'),
    rehber('demir-celik-elektrik'),
    rehber('elektrik-faturasi-neden-yuksek'),
    rehber('elektrik-tedarikcisi-nasil-secilir', ['icerik.css']),
    rehber('i-rec-nedir'),
    rehber('kapsam-2-elektrik-emisyonu', ['icerik.css']),
    rehber('kimya-elektrik'),
    rehber('osb-elektrik-tedariki'),
    rehber('ptf-nedir', ['icerik.css', 'sema.css'], dondurulmus='857fd2a8bca818075a6e25b92cbedbeb5996399b8971c47c81180d0c0a4af5e0'),
    rehber('serbest-tuketici', ['icerik.css'], dondurulmus='398a5c06b7c6ea485d6a2c2637f290e77980301d3e181a11102e3c860dc7c2a4'),
    rehber('skdm-elektrik-sertifika', ['icerik.css']),
    rehber('sktt', ['icerik.css']),
    rehber('soguk-zincir-elektrik'),
    rehber('tedarikci-degistirme', ['sema.css', 'tedarikci-degistirme.css'], dondurulmus='cafe6fbfa1e36cc6ec3f4e3d80af99edc8713dad542eda03c5b507e205c35b95'),
    rehber('veri-merkezi-elektrik'),
    rehber('yek-g-i-rec-farki', ['icerik.css']),
    rehber('yek-g-nedir'),
    # ---- 2. aşama: dizin, hizmet, araç, hukuki metinler, 404 ----
    dict(yol='rehber.html', tur='dizin', ust_etkin='/rehber', ust_etkin_deger='page', alt_etkin=None, stil=['rehber-dizin.css']),
    dict(yol='sanayi-elektrik-tedariki.html', tur='hizmet', ust_etkin=None, ust_etkin_deger=None, alt_etkin=None, stil=['icerik.css', 'sutunlar.css']),
    dict(yol='elektrik-faturasi-hesaplama.html', tur='hesap', ust_etkin=None, ust_etkin_deger=None, alt_etkin=None, kaynak='elektrik-faturasi-hesaplama',
         stil=['icerik.css', 'elektrik-faturasi-hesaplama.css'], betik_siniflari=['ok', 'warn']),
    dict(yol='kvkk.html', tur='yasal', ust_etkin=None, ust_etkin_deger=None, alt_etkin='/kvkk', stil=['yasal.css']),
    dict(yol='cerez-politikasi.html', tur='yasal', ust_etkin=None, ust_etkin_deger=None, alt_etkin='/cerez-politikasi', stil=['yasal.css']),
    dict(yol='kullanim-kosullari.html', tur='yasal', ust_etkin=None, ust_etkin_deger=None, alt_etkin='/kullanim-kosullari', stil=['yasal.css']),
    dict(yol='404.html', tur='404', ust_etkin=None, ust_etkin_deger=None, alt_etkin=None, stil=['404.css']),
]
assert len({s['yol'] for s in SAYFALAR}) == len(SAYFALAR) == 29  # 19 rehber + 10 sayfa
# Kapsam: kökteki ve rehber/ altındaki her herkese açık HTML sayfası listede; panel.html (iç araç) ve index.html (ana sayfa
# hazırlığı ayrı) hariç. Canlıya yeni sayfa eklenirse üretim durur.
_canli = sorted([f for f in os.listdir(KOK) if f.endswith('.html')] + ['rehber/' + f for f in os.listdir(os.path.join(KOK, 'rehber')) if f.endswith('.html')])
assert sorted(s['yol'] for s in SAYFALAR) == sorted(set(_canli) - {'index.html', 'panel.html'}), set(_canli) ^ {s['yol'] for s in SAYFALAR}

KABUK_CSS = oku(os.path.join(BURASI, 'kabuk.css'))

# Sınıf kapısı istisnaları: içerikte geçip bilerek stil kuralı olmayan sınıflar (gerekçeli). Başka her sınıfın stilde kuralı olmalı.
SINIFSIZ = {
    # şu an boş: 29 sayfadaki her sınıfın stilde kuralı var
}


def stil(ayar, ek=None):
    parcalar = ['/* ===== 1) Ana sayfa kabuğu: yeni ana sayfa stilinden (yapi/stil.css) süzüldü, bildirimler aynen ===== */',
                KABUK_ANA,
                '/* ===== 2) Alt sayfa kabuğu ve ortak içerik dizgisi (sayfalar/kabuk.css) ===== */',
                KABUK_CSS]
    sayfa = ([ek] if ek else []) + ['/* ===== 3) Sayfaya özgü: sayfalar/stil/%s ===== */\n%s' % (d, oku(os.path.join(BURASI, 'stil', d)).rstrip('\n')) for d in ayar['stil']]
    # Kabuk sıkıştırılır (her sayfada aynı); sayfaya özgü stil okunur biçimde kalır: QA testleri bazı kuralları metin
    # olarak arar (test-dengesizlik.mjs R6, R9, R10) ve sayfa düzeltmeleri tek dosyada elle yapılabilir.
    return '\n'.join([sikistir('\n'.join(parcalar))] + sayfa)


def sinif_kapisi(ayar, parcalar, css):
    """İçerikte (ve sayfa betiklerinin yazdığı işaretlemede) geçen her sınıf için yeni stilde bir seçici olmalı."""
    siniflar = set()
    for p in parcalar:
        for m in re.finditer(r'class="([^"]*)"', p):
            # betiklerdeki birleştirilmiş dizgilerden yalnız geçerli sınıf adları (ör. 'yon-' + d.yon parçaları atlanır)
            siniflar.update(s for s in m.group(1).split() if re.fullmatch(r'-?[A-Za-z_][\w-]*', s) and not s.endswith('-'))
        for m in re.finditer(r"classList\.(?:add|toggle|remove)\('([\w-]+)'", p):
            siniflar.add(m.group(1))
    for s in ayar.get('betik_siniflari', []):
        assert any("'%s'" % s in p for p in parcalar), ('betik sınıfı betikte yok', s)
        siniflar.add(s)
    css_temiz = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    eksik = sorted(s for s in siniflar if s not in SINIFSIZ and not re.search(r'\.%s(?![\w-])' % re.escape(s), css_temiz))
    assert not eksik, ('stilde karşılığı olmayan sınıf (yeni bileşen? stil/ altına kural yazın)', ayar['yol'], eksik)
    return len(siniflar)


def bas_ve_stil(canli, ayar, ek=None):
    """Belge başı: <style> bloğu dışında bayt bayt aynı. cerez-politikasi'nde <!DOCTYPE> ile <html> arasında TASLAK yorumu var."""
    assert canli.startswith('<!DOCTYPE html>\n'), 'belge başı beklenen gibi değil'
    tek(canli, '<html lang="tr">\n<head>\n', 'html/head açılışı')
    assert re.fullmatch(r'<!DOCTYPE html>\n(<!--.*?-->\n)?', canli[:canli.index('<html lang="tr">\n<head>\n')], re.S), 'doctype ile <html> arası'
    tek(canli, '<style>', 'style açılışı')
    tek(canli, '</style>\n', 'style kapanışı')
    tek(canli, '</head>\n', 'head kapanışı')
    bas_bolum = canli[:canli.index('</head>\n') + len('</head>\n')]
    eski_stil = arasi(bas_bolum, '<style>', '</style>\n', dahil=True)
    yeni_css = stil(ayar, ek)
    return bas_bolum.replace(eski_stil, '<style>\n' + yeni_css + '\n</style>\n'), yeni_css


def dondurulmus_mu(ayar, canli):
    if ayar.get('dondurulmus'):
        ozet = hashlib.sha256(canli.encode('utf-8')).hexdigest()
        assert ozet == ayar['dondurulmus'], ('DONDURULMUŞ rehberin canlı dosyası değişmiş (SEO ölçümü 10.12) — '
                                             'değişikliği inceleyip özeti güncelleyin', ayar['yol'], ozet)


def kaynak_sec(ayar, canli):
    """Üst banttaki "Teklif Al": sayfanın kendi teklif düğmeleriyle aynı kaynak etiketi (yeni etiket yok). Sayfada teklif
    düğmesi yoksa üst bantta da olmaz. Birden çok etiket varsa sayfanın kendi etiketi açıkça verilir ve sayfada olmalıdır."""
    kaynaklar = set(re.findall(r'href="/\?kaynak=([a-z0-9-]+)#leadForm"', canli))
    if ayar.get('kaynak'):
        assert ayar['kaynak'] in kaynaklar, ('verilen kaynak etiketi sayfada yok', ayar['kaynak'], kaynaklar)
        return ayar['kaynak']
    assert len(kaynaklar) <= 1, ('sayfada birden çok kaynak etiketi; ayarda kaynak verin', kaynaklar)
    return kaynaklar.pop() if kaynaklar else None


def yaz(ayar, cikti):
    tek(cikti, '<body>', '<body> (SSR çapası)')
    assert cikti.index('<body>') > cikti.index('</head>')
    assert cikti.count('<style>') == 1 and cikti.count('<main') == 1
    assert '216 479' not in cikti and '2164790510' not in cikti and '479 05 10' not in cikti, 'yayımlanmayacak numara'
    hedef = os.path.join(CIKTI, ayar['yol'])
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    with open(hedef, 'w', encoding='utf-8') as f:
        f.write(cikti)
    return hedef


def kur(ayar):
    if ayar['yol'] == '404.html':
        return kur_404(ayar)
    canli = oku(os.path.join(KOK, ayar['yol']))
    dondurulmus_mu(ayar, canli)
    # ---- baş: <style> bloğu dışında bayt bayt aynı ----
    tek(canli, '</head>\n<body>\n<div class="page">\n', 'gövde başı')
    yeni_bas, yeni_css = bas_ve_stil(canli, ayar)
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
    assert not betikler.strip() or (betikler.lstrip('\n').startswith('<script') and betikler.rstrip().endswith('</script>')), betikler[:80]
    ayar = dict(ayar, kaynak=kaynak_sec(ayar, canli))
    # dengesizlik: eski <main> sarmalayıcısı (kabuğun <main> öğesi onun yerini alır)
    if '\n  <main>\n' in icerik:
        icerik = degistir(icerik, '\n  <main>\n', '\n')
        icerik = degistir(icerik, '\n  </main>\n', '\n')
        assert icerik.endswith('\n'), icerik[-40:]
    assert '<main' not in icerik and '<footer' not in icerik and '<header' not in icerik
    # ---- sayfa başı: içerik izi (hukuki metinlerde "← ana sayfa" bağlantısı) + H1 (+ güncelleme satırı ya da giriş) ----
    satirlar = icerik.split('\n')
    iz_crumbs = satirlar[0].startswith('  <nav class="crumbs" aria-label="Breadcrumb">') and satirlar[0].endswith('</nav>')
    iz_geri = satirlar[0] == '  <a class="back" href="/">← voltage.com.tr ana sayfa</a>'
    assert iz_crumbs or (iz_geri and ayar['tur'] == 'yasal'), satirlar[0]
    if ayar['ust_etkin'] == '/rehber' and ayar['ust_etkin_deger'] == 'true':
        assert '<a href="/rehber">Rehber</a>' in satirlar[0], ('rehber sayfasının içerik izi Rehber\'den geçmiyor', satirlar[0])
    assert satirlar[1].startswith('  <h1>') and satirlar[1].endswith('</h1>'), satirlar[1]
    k = 2
    if satirlar[2].startswith('  <div class="updated">') or satirlar[2].startswith('  <p class="lede">'):
        assert satirlar[2].endswith('</div>') or satirlar[2].endswith('</p>'), satirlar[2]
        k = 3
    assert ayar['tur'] not in ('rehber', 'yasal', 'dizin', 'hizmet', 'hesap') or k == 3, 'güncelleme satırı yok'
    iz = satirlar[0]
    bant = '\n'.join(satirlar[1:k])
    govde_ic = '\n'.join(satirlar[k:]).rstrip('\n')  # baştaki boş satır korunur (bayt karşılaştırması)
    assert icerik.count('<h1') == 1
    sinif_kapisi(ayar, [iz, bant, govde_ic, betikler], yeni_css)

    atla, ust, menu, alt = kabuk(ayar)
    cikti = (yeni_bas + '<body>\n' + atla + '\n\n<!-- ÜST BANT -->\n' + ust + '\n\n' + menu + '\n\n'
             + '<div class="sayfa-iz on-dark">\n<div class="wrap">\n' + iz + '\n</div>\n</div>\n'
             + '<main>\n'
             + '<div class="sayfa-bas on-dark" id="icerik" tabindex="-1">\n<div class="wrap">\n' + bant + '\n</div>\n</div>\n'
             + '<div class="sayfa-govde sayfa-%s">\n<div class="wrap">\n' % ayar['tur'] + govde_ic + '\n</div>\n</div>\n'
             + '</main>\n\n<!-- KAPANIŞ -->\n' + alt + '\n' + betikler
             + '\n<script>\n' + MENU_JS + '</script>\n</body>\n</html>\n')

    # ---- doğrulamalar (sürüklenme kapısı) ----
    assert cikti.count('<h1') == 1 and cikti.count('<main>') == 1
    assert betikler in cikti and iz in cikti and bant in cikti and govde_ic in cikti
    assert cikti.index(iz) < cikti.index('<main>') < cikti.index('<h1') < cikti.index('</main>') < cikti.index('<footer>')
    hedef = yaz(ayar, cikti)
    return hedef, len(cikti.encode('utf-8')), len(yeni_css.encode('utf-8')), eski_alt


# ============================================================================
# 4) 404: oyun sayfası. Oyun (body.g-on) canlıdaki gibi tam ekran; kabuk (üst bant, mobil menü, alt bilgi) yalnız statik
#    yedeğin (JS kapalı, WebGL yok, hareket azaltma, bağlam kaybı) çevresinde. İşaretleme: yedek <main id="gFallback"> içi
#    (eski alt satır hariç), teşhis satırı, oyun sahnesi ve betik canlıdan bayt bayt. Oyun stili canlıdan aynen; yalnız
#    sahnenin renk belirteçleri :root'tan sahneye taşınır (kabuğun --ink/--line belirteçleriyle çakışmasın) ve yedeğin
#    kuralları stil/404.css ile yeni belirteçlerle yazılır.
# ============================================================================
OYUN_BAS = '/* ---- Oyun sahnesi ---- */'
OYUN_YEDEK = '/* ---- Statik yedek (JS/WebGL yoksa veya hareket azaltılmışsa) ---- */'
OYUN_TESHIS = '/* ---- Teşhis satırı (?tani=1) — yalnız ekranda, hiçbir yere gönderilmez ---- */'
OYUN_DOKUN = '/* ---- Dokunmatik: kaydırma/çift dokunma yakınlaştırma/uzun basma menüsü oyunu bölmesin ---- */'


def oyun_stili(eski, sayfa_css):
    ic = eski[len('<style>\n'):-len('</style>\n')]
    for isaret in (OYUN_BAS, OYUN_YEDEK, OYUN_TESHIS, OYUN_DOKUN):
        tek(ic, isaret, '404 stil bölümü')
    a, b, c, d = (ic.index(x) for x in (OYUN_BAS, OYUN_YEDEK, OYUN_TESHIS, OYUN_DOKUN))
    assert a < b < c < d
    bas, oyun, yedek, teshis, dokun = ic[:a], ic[a:b], ic[b:c], ic[c:d], ic[d:]
    # Baş: :root belirteçleri stil/404.css'te sahneye sınırlı ve AYNI değerlerle; sıfırlama, gövde, bağlantı, .mono karşılanır
    kok = arasi(bas, ':root {', '}')
    belirtec = dict(re.findall(r'(--[\w-]+):\s*([^;]+);', kok))
    assert set(belirtec) == {'--bg', '--ink', '--dim', '--cyan', '--cyan-deep', '--amber', '--line', '--glass'}, belirtec
    sahne = arasi(sayfa_css, '#gStage, body.g-on #gDiag {', '}')
    for ad, deger in belirtec.items():
        assert '%s: %s;' % (ad, deger.strip()) in sahne, ('404 sahne belirteci stil/404.css ile aynı değil', ad, deger)
    for parca in ('* { box-sizing: border-box; margin: 0; padding: 0; }', 'html, body { height: 100%; }',
                  'a { color: var(--cyan); text-underline-offset: 3px; }', ".mono { font-family: 'IBM Plex Mono', Consolas, monospace; }",
                  'background: radial-gradient(120% 90% at 50% 0%, #0a1226 0%, var(--bg) 55%, #020409 100%);', 'overflow-x: hidden;'):
        tek(bas, parca, '404 baş kuralı')
    assert 'body.g-on { background: radial-gradient(120% 90% at 50% 0%, #0a1226 0%, #04060e 55%, #020409 100%);' in sayfa_css
    # Yedek bölümü bütünüyle stil/404.css'e geçer; oyun açıkken yedeği gizleyen kural orada da aynen olmalı
    tek(yedek, 'body.g-on #gFallback { display: none; }', 'yedeği gizleyen kural')
    tek(sayfa_css, 'body.g-on #gFallback { display: none; }', 'yedeği gizleyen kural (404.css)')
    # Teşhis: oyun açıkkenki kural aynen kalır; kapalıyken stil/404.css
    oyun_teshis = arasi(teshis, 'body.g-on #gDiag {', '}', dahil=True)
    tek(teshis, '#gDiag { max-width: 720px; margin: -48px auto 40px;', 'teşhis satırı (yedek hâli)')
    for secici in ('#gCanvas', '#gIntro', '#gHud', '.g-panel', '.g-card', '.g-cta', '#gLb', '#gToast', '#gEgg', 'body.g-on #gStage'):
        assert secici in oyun, ('oyun stili beklenen kuralı taşımıyor', secici)
    return ('/* ===== 3) Oyun sahnesi: canlı 404.html stilinden AYNEN (yalnız :root belirteçleri, sıfırlama, gövde ve yedek '
            'kuralları çıkarıldı; bunlar kabukta ve sayfalar/stil/404.css içinde) ===== */\n'
            + oyun.rstrip('\n') + '\n' + OYUN_TESHIS + '\n' + oyun_teshis + '\n\n' + dokun.rstrip('\n'))


def kur_404(ayar):
    canli = oku(os.path.join(KOK, ayar['yol']))
    tek(canli, '<meta name="robots" content="noindex, follow">', '404 noindex')
    tek(canli, '</head>\n<body>\n', '404 gövde başı')
    sayfa_css = oku(os.path.join(BURASI, 'stil', '404.css'))
    eski_stil = arasi(canli, '<style>', '</style>\n', dahil=True)
    yeni_bas, yeni_css = bas_ve_stil(canli, ayar, oyun_stili(eski_stil, sayfa_css))
    govde = canli[canli.index('</head>\n<body>\n') + len('</head>\n<body>\n'):]
    yorum = arasi(govde, '\n<!-- Statik yedek:', '-->\n', dahil=True)[1:]
    assert govde.startswith('\n' + yorum), govde[:80]
    govde = govde[1 + len(yorum):]
    ana = arasi(govde, '<main id="gFallback">\n', '\n</main>\n', dahil=True)
    assert govde.startswith(ana), govde[:80]
    kalan = govde[len(ana):]
    teshis = '<p id="gDiag" role="status" hidden></p>\n'
    assert kalan.startswith(teshis), kalan[:80]
    kalan = kalan[len(teshis):]
    assert kalan.startswith('\n<!-- Oyun sahnesi -->\n<div id="gStage">\n'), kalan[:80]
    assert kalan.endswith('</div>\n\n<script src="/g404/game.js" defer></script>\n</body>\n</html>\n'), kalan[-120:]
    sahne = kalan[1:-len('</body>\n</html>\n')]
    # Eski alt satır (yedeğin içindeki <footer> satırı) kabuğun alt bilgisine yer bırakır
    alt_satir = re.search(r'\n  <footer>.*?</footer>', ana)
    assert alt_satir and ana.count('<footer>') == 1, 'yedekte eski alt satır'
    eski_alt = alt_satir.group(0)[1:]
    ana = ana.replace(alt_satir.group(0), '')
    assert '<h1' not in ana and '<main id="gFallback">' in ana and 'id="icerik"' not in canli
    ayar = dict(ayar, kaynak=kaynak_sec(ayar, canli))
    assert ayar['kaynak'] == '404'
    sinif_kapisi(ayar, [ana, teshis, sahne], yeni_css)

    atla, ust, menu, alt = kabuk(ayar)
    cikti = (yeni_bas + '<body>\n' + atla + '\n\n<!-- ÜST BANT -->\n' + ust + '\n\n' + menu + '\n\n'
             + yorum
             + '<div class="sayfa-404 on-dark" id="icerik" tabindex="-1">\n<div class="wrap">\n' + ana + '</div>\n</div>\n'
             + teshis + '\n<!-- KAPANIŞ -->\n' + alt + '\n\n' + sahne
             + '\n<script>\n' + MENU_JS + '</script>\n</body>\n</html>\n')
    assert cikti.count('<h1') == 0 and cikti.count('<main id="gFallback">') == 1
    assert cikti.index('<main id="gFallback">') < cikti.index('<p id="gDiag"') < cikti.index('<footer>') < cikti.index('<div id="gStage">')
    hedef = yaz(ayar, cikti)
    return hedef, len(cikti.encode('utf-8')), len(yeni_css.encode('utf-8')), eski_alt


if __name__ == '__main__':
    for ayar in SAYFALAR:
        hedef, boy, css, _ = kur(ayar)
        sys.stdout.write('yazıldı: %s  %d bayt (stil %d)%s\n' % (os.path.relpath(hedef, BURASI), boy, css,
                                                                 '  [DONDURULMUŞ: yayın 10.12 ölçümü ve sahip onayından sonra]' if ayar.get('dondurulmus') else ''))
