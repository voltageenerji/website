#!/usr/bin/env python3
"""Hazırlık sayfasını kurar (2. tur). Canlı ana sayfadan (yalnız OKUNUR) baş bölümü, teklif formu ve betikler
birebir alınır; betikte yalnız aşağıda tek tek yazılı değişiklikler yapılır. Gövde ve stil bu klasördeki
govde.html ve stil.css dosyalarından gelir. Çıktı: docs/design/onizleme/yeni-tasarim/ altındaki sayfa
(ya da 1. bağımsız değişkende verilen yol)."""
import os, re, sys

KOK = '/home/user/website'
BURASI = os.path.dirname(os.path.abspath(__file__))
CANLI = open(os.path.join(KOK, 'index.html'), encoding='utf-8').read()
HEDEF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(KOK, 'docs/design/onizleme/yeni-tasarim', 'index.html')


def arasi(metin, bas, son, dahil=False):
    assert metin.count(bas) == 1, ('baş işareti tek değil', bas[:70], metin.count(bas))
    a = metin.index(bas)
    b = metin.index(son, a + len(bas))
    return metin[a:b + len(son)] if dahil else metin[a + len(bas):b]


def degistir(metin, eski, yeni, kac=1):
    assert metin.count(eski) == kac, ('değiştirme sayısı tutmuyor', eski[:80], metin.count(eski))
    return metin.replace(eski, yeni)


def cikar(metin, bas, son):
    """bas ile başlayıp son'dan hemen önce biten parçayı atar (son kalır)."""
    assert metin.count(bas) == 1, ('baş işareti tek değil', bas[:70], metin.count(bas))
    a = metin.index(bas)
    b = metin.index(son, a + len(bas))
    return metin[:a] + metin[b:]


# ---- baş bölümü: yazı tipi bağlantısına kadar bayt bayt aynı ----
FONT = '&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n'
bas = CANLI[:CANLI.index(FONT) + len(FONT)]

# ---- teklif formu: bayt bayt aynı ----
form = '      ' + arasi(CANLI, '<form class="form reveal" id="leadForm"', '</form>', dahil=True)

# ---- betikler ----
js = arasi(CANLI, '<script>\n// Reduced motion', '</script>\n\n<script>\n(function(){\n  var btn = document.getElementById(\'mobileMenuBtn\');')
js = '// Reduced motion' + js
menu_js = arasi(CANLI, "<script>\n(function(){\n  var btn = document.getElementById('mobileMenuBtn');", '</script>')
menu_js = "(function(){\n  var btn = document.getElementById('mobileMenuBtn');" + menu_js
analitik = arasi(CANLI, '<!-- Cloudflare Web Analytics', '-->', dahil=True)

# A) Sayfada karşılığı kalmayan bloklar çıkarıldı (öğeleri yok): SMIL temizliği, kaydırınca belirme,
#    saatlik ray (yerine tablo), folyo, tek hat şeması.
js = cikar(js, '// Reduced motion: strip SMIL animations', '// Navigation scroll effect')
js = cikar(js, '// Reveal on scroll', '// Smooth scroll')
js = cikar(js, '// 1) MCP rail ticker', '// 2) Canlı veri denetleyicisi')
js = cikar(js, '// 4) Running header folio', '// 6) Teklif formu')
assert 'IntersectionObserver' not in js and 'mcpRail' not in js and 'rhSec' not in js and 'tline' not in js

# B) Küçük ekler
# 1) atlama bağlantısı yumuşak kaydırma işleyicisinin dışında kalır (odak <main>'e geçsin)
js = degistir(js, "    if (href === '#') return;\n",
              "    if (href === '#' || href === '#icerik') return; // atlama bağlantısı: odağı tarayıcı taşır\n")
# 1b) bağlantıyla gelişte yeniden hizalama öbür bölüm çapalarını da kapsar (#hakkimizda, #yaklasim, #hizmetler, #canli-piyasa):
#     yeni bölüm boşlukları daha dar olduğu için geç yüklenen yazı tipi başlığı sabit bandın altına itebiliyordu
js = degistir(js, "  if (h !== '#leadForm' && h !== '#teklif' && h !== '#iletisim') return;\n",
              "  if (['#leadForm', '#teklif', '#iletisim', '#hakkimizda', '#yaklasim', '#hizmetler', '#canli-piyasa'].indexOf(h) < 0) return;\n")
js = degistir(js, "  const hedef = document.getElementById(h === '#iletisim' ? 'iletisim' : 'leadForm');\n",
              "  const hedef = document.getElementById(h === '#leadForm' || h === '#teklif' ? 'leadForm' : h.slice(1));\n")
# 2) dil düğmeleri: basılı durumu ekran okuyucuya da bildirilir
js = degistir(js, "    btn.classList.toggle('active', btn.dataset.lang === lang);\n",
              "    btn.classList.toggle('active', btn.dataset.lang === lang);\n"
              "    btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');\n")
# 3) canlı veri denetleyicisi: kapak kartı, kartın gün grafiği ve saatlik tablo (yalnız DOM hedefleri; veri mantığı aynı)
js = degistir(js, "// 2) Canlı veri denetleyicisi — kapak key-facts + KPI bandı + cetvel + grafik.",
              "// 2) Canlı veri denetleyicisi — kapak PTF kartı (değer, damga, gün grafiği) + cetvel + grafik + saatlik tablo.")
js = degistir(js, "  const lmLine = $('lmLine'), lmArea = $('lmArea'), lmDot = $('lmDot'), lmMode = $('lmMode');\n",
              "  const lmLine = $('lmLine'), lmArea = $('lmArea'), lmDot = $('lmDot'), lmMode = $('lmMode');\n"
              "  const ptfKart = $('ptfKart'), heroLine = $('heroLine'), heroArea = $('heroArea'), heroDot = $('heroDot');\n"
              "  const saatHucre = document.querySelectorAll('#saatTablo tbody td');\n")
js = degistir(js, "  function drawChart(prices){\n    if(!lmLine || !lmArea) return;\n    const W = 800, H = 260, padTop = 24, padBottom = 24;\n",
              "  /* Aynı çizim iki hedefe gider: bölümdeki büyük grafik ve kapak kartındaki gün grafiği */\n"
              "  function drawChart(prices){\n"
              "    drawOne(prices, lmLine, lmArea, lmDot, 800, 260, 24, 24);\n"
              "    drawOne(prices, heroLine, heroArea, heroDot, 360, 94, 10, 10);\n"
              "    if(ptfKart) ptfKart.classList.toggle('cizildi', !!(heroLine && heroLine.getAttribute('d')));\n"
              "  }\n"
              "  function drawOne(prices, lmLine, lmArea, lmDot, W, H, padTop, padBottom){\n"
              "    if(!lmLine || !lmArea) return;\n")
js = degistir(js, "    const cls = state.mode === 'live' ? '' : (state.mode === 'stale' ? ' stale' : ' waiting');\n",
              "    const cls = state.mode === 'live' ? '' : (state.mode === 'stale' ? ' stale' : ' waiting');\n"
              "    if(ptfKart) ptfKart.setAttribute('data-state', state.mode === 'live' ? 'live' : (state.mode === 'stale' ? 'cached' : 'waiting'));\n")
js = degistir(js, "    const DASH = '\\u2014';\n",
              "    const DASH = '\\u2014';\n"
              "    /* Saatlik tablo: yalnız gerçek saatler yazılır; eksik saat ve veri yokken \"—\" kalır (0 yazılmaz) */\n"
              "    const simdiH = Math.min(23, istanbulHourHome());\n"
              "    for(let i = 0; i < saatHucre.length; i++){\n"
              "      saatHucre[i].textContent = (state.prices && Number.isFinite(state.prices[i])) ? fmt(state.prices[i]) : DASH;\n"
              "      saatHucre[i].parentNode.classList.toggle('simdi', state.mode === 'live' && i === simdiH);\n"
              "    }\n")

# ---- stil ----
css = open(os.path.join(BURASI, 'stil.css'), encoding='utf-8').read().rstrip('\n')


def sikistir(css):
    """Yorumlar kalır; her kural tek satırda, bildirimler arasındaki boşluklar atılır."""
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
        s = re.sub(r':[ ]+', ':', s)
        s = re.sub(r',\s+', ',', s)
        s = re.sub(r'[ ]+\{', '{', s)
        s = re.sub(r'(?<![\d.])0\.(\d)', r'.\1', s)
        cikan.append(s)
    return ''.join(cikan)


css = sikistir(css)

# ---- gövde ----
govde = open(os.path.join(BURASI, 'govde.html'), encoding='utf-8').read()
saatler = '\n'.join('          <tr><th scope="row">%02d:00</th><td>—</td></tr>' % h for h in range(24))
govde = degistir(govde, '@@SAATLER@@', saatler)
govde = degistir(govde, '@@BLOK:form@@', form)
assert '@@' not in govde, re.findall(r'@@[^@]+@@', govde)

cikti = (bas + '\n<style>\n' + css + '\n</style>\n</head>\n' + govde.rstrip('\n') + '\n\n<script>\n' + js + '</script>\n\n<script>\n'
         + menu_js + '</script>\n\n' + analitik + '\n</body>\n</html>\n')
open(HEDEF, 'w', encoding='utf-8').write(cikti)
sys.stdout.write('yazıldı: %s %d bayt\n  baş %d · stil %d · gövde %d · betik %d\n' % (
    HEDEF, len(cikti.encode('utf-8')), len(bas.encode()), len(css.encode()), len(govde.encode()), len(js.encode()) + len(menu_js.encode())))
