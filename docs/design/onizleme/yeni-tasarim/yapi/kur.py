#!/usr/bin/env python3
"""Hazırlık sayfasını kurar (3. tur). Canlı ana sayfadan (yalnız OKUNUR) baş bölümü, teklif formu ve betikler
birebir alınır; betikte yalnız aşağıda tek tek yazılı değişiklikler, formda yalnız dosya seçici dönüşümü yapılır. Gövde ve stil bu klasördeki
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

# ---- teklif formu: bayt bayt aynı; TEK değişiklik dosya seçici dönüşümüdür (aşağıda) ----
form = '      ' + arasi(CANLI, '<form class="form reveal" id="leadForm"', '</form>', dahil=True)


def dosya_secici(form):
    """Dosya seçici dönüşümü (sahip talimatı 24.11): tarayıcının kendi "Choose Files" yazısı yerine TR/EN düğme ve durum metni.
    <input type="file"> etiketi bayt bayt aynı kalır (id, name, accept, multiple); yalnız bir sarmalayıcıya alınır ve ardına
    bir <label> (düğme) ile bir durum satırı eklenir. Betik çalışmazsa sarmalayıcı "hazir" sınıfını almaz: yerli girdi görünür
    ve kullanılır. Yükleme mantığı (sınırlar, küçültme, hata iletileri) form betiğindedir ve ona dokunulmaz."""
    m = re.search(r'^( *)(<input type="file" class="form-input" id="lead-fatura" name="fatura" accept="[^"]*" multiple>)\n', form, re.M)
    assert m and form.count('id="lead-fatura"') == 1, 'dosya girdisi bulunamadı ya da tek değil'
    g, girdi = m.group(1), m.group(2)
    yeni = (g + '<div class="dosya" id="leadFaturaKutu">\n'
            + g + '  ' + girdi + '\n'
            + g + '  <label class="dosya-dugme" for="lead-fatura" data-tr="Dosya Seç" data-en="Choose Files">Dosya Seç</label>\n'
            + g + '  <span class="dosya-durum" id="leadFaturaDurum" aria-live="polite" data-tr="Dosya seçilmedi" data-en="No file chosen">Dosya seçilmedi</span>\n'
            + g + '</div>\n')
    return form[:m.start()] + yeni + form[m.end():]


FORM_CANLI = form
form = dosya_secici(form)

# ---- betikler ----
js = arasi(CANLI, '<script>\n// Reduced motion', '</script>\n\n<script>\n(function(){\n  var btn = document.getElementById(\'mobileMenuBtn\');')
js = '// Reduced motion' + js
menu_js = arasi(CANLI, "<script>\n(function(){\n  var btn = document.getElementById('mobileMenuBtn');", '</script>')
menu_js = "(function(){\n  var btn = document.getElementById('mobileMenuBtn');" + menu_js
analitik = arasi(CANLI, '<!-- Cloudflare Web Analytics', '-->', dahil=True)

# A) Sayfada karşılığı kalmayan bloklar çıkarıldı (öğeleri yok): SMIL temizliği, kaydırınca belirme,
#    folyo, tek hat şeması.
js = cikar(js, '// Reduced motion: strip SMIL animations', '// Navigation scroll effect')
js = cikar(js, '// Reveal on scroll', '// Smooth scroll')
# saatlik ray 24.11'de sahibin isteğiyle geri geldi: betiği canlıdakiyle aynı kalır (çıkarılmaz)
js = cikar(js, '// 4) Running header folio', '// 6) Teklif formu')
assert 'IntersectionObserver' not in js and 'rhSec' not in js and 'tline' not in js
assert js.count("getElementById('mcpRail')") == 1
# A2) Ölü aramalar: KPI bandı (kpiNow, kpiMin, kpiMax, kpiStamp) sayfada yok. Yalnız bu öğelere YAZAN satırlar çıkarılır;
#     hesap (min, max, ortalama), önbellek ve veri çağrıları aynı kalır. Her satır tek tek ve sayısı doğrulanarak silinir.
for satir, kac in [("  const kpiNow = $('kpiNow'), kpiMin = $('kpiMin'), kpiMax = $('kpiMax'), kpiStamp = $('kpiStamp');\n", 1),
                   ("    if(kpiStamp){ kpiStamp.textContent = stampText(); kpiStamp.className = 'kpi-stamp' + cls; }\n", 1),
                   ("        if(kpiNow) kpiNow.textContent = Number.isFinite(ps[nowH]) ? fmt(ps[nowH]) : DASH;\n", 1),
                   ("        if(kpiMin) kpiMin.textContent = fmt(min);\n", 1),
                   ("        if(kpiMax) kpiMax.textContent = fmt(max);\n", 1),
                   ("        if(kpiNow) kpiNow.textContent = DASH;\n", 1),
                   ("        if(kpiMin) kpiMin.textContent = DASH;\n", 1),
                   ("        if(kpiMax) kpiMax.textContent = DASH;\n", 1)]:
    js = degistir(js, satir, '', kac)
js = degistir(js, "  if(!kfPtf && !kpiNow) return;\n", "  if(!kfPtf) return;\n")
assert 'kpi' not in js, 'KPI bandından kalan satır var'

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
# 2b) dil değişince görsellerin alt metni de değişir (data-alt-tr / data-alt-en); setLanguage yalnız metin düğümlerini çeviriyordu
js = degistir(js, "  // Update textarea placeholders specifically\n",
              "  // Görsellerin alt metni (sektör fotoğrafları)\n"
              "  document.querySelectorAll('img[data-alt-tr][data-alt-en]').forEach(el => { el.alt = el.getAttribute('data-alt-' + lang); });\n"
              "  document.querySelectorAll('[data-aria-tr][data-aria-en]').forEach(el => { el.setAttribute('aria-label', el.getAttribute('data-aria-' + lang)); });\n\n"
              "  // Update textarea placeholders specifically\n")
# 2c) saatlik şerit: ilk saatte fark yazılmaması 24.11'de canlıya da işlendi (betik oradan gelir). Burada kalan iki küçük fark:
#     fark sıfırsa ok yazılmaz; fark binlik ayraçla yazılır. Veri çağrısı ve fiyat kapısı aynıdır.
js = degistir(js, "(diff === null ? '' : ' <span class=\"' + cls + '\">' + arr + ' ' + Math.abs(diff) + '</span>')",
              "(diff === null || diff === 0 ? '' : ' <span class=\"' + cls + '\">' + arr + ' ' + Math.abs(diff).toLocaleString('tr-TR') + '</span>')")
# 3) canlı veri denetleyicisi: kapak kartı, kartın gün grafiği ve saatlik tablo (yalnız DOM hedefleri; veri mantığı aynı)
js = degistir(js, "// 2) Canlı veri denetleyicisi — kapak key-facts + KPI bandı + cetvel + grafik.",
              "// 2) Canlı veri denetleyicisi — kapak PTF kartı (değer, damga, gün grafiği) + cetvel + grafik + saatlik tablo.")
js = degistir(js, "  const lmLine = $('lmLine'), lmArea = $('lmArea'), lmDot = $('lmDot'), lmMode = $('lmMode');\n",
              "  const lmLine = $('lmLine'), lmArea = $('lmArea'), lmDot = $('lmDot'), lmMode = $('lmMode');\n"
              "  const ptfKart = $('ptfKart'), heroLine = $('heroLine'), heroArea = $('heroArea'), heroDot = $('heroDot');\n"
              "  const saatHucre = document.querySelectorAll('#saatTablo tbody td'); /* dört kısa tablo; belge sırası = saat sırası (00–23) */\n")
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

# 4) açılır alanlar (<details class="acilir">): HTML'de açık gelir; dar ekranda her birinin hemen ardındaki tek satırlık betik
#    "open" niteliğini boyamadan önce kaldırır. Buradaki denetleyici geniş ekranı yönetir: alan hep açıktır, başlık düğme
#    gibi davranmaz (sekme sırasında değildir, tıklama kapatmaz); ekran daralıp genişlerse kapalı kalan alan yeniden açılır.
js += """
// 7) Açılır alanlar: telefonda kapalı başlar (satır içi betik), geniş ekranda hep açık
(function(){
  var dar = window.matchMedia('(max-width: 759px)');
  var alanlar = document.querySelectorAll('details.acilir');
  function uygula(){
    alanlar.forEach(function(d){
      var s = d.querySelector('summary');
      if(dar.matches){ if(s) s.removeAttribute('tabindex'); }
      else { d.open = true; if(s) s.setAttribute('tabindex', '-1'); }
    });
  }
  alanlar.forEach(function(d){
    var s = d.querySelector('summary');
    if(s) s.addEventListener('click', function(e){ if(!dar.matches) e.preventDefault(); });
  });
  uygula();
  if(dar.addEventListener) dar.addEventListener('change', uygula); else if(dar.addListener) dar.addListener(uygula);
})();

// 8) Dosya seçici: yerelleştirilmiş düğme ve durum metni. Girdi (#lead-fatura) aynıdır; yükleme mantığına dokunulmaz.
(function(){
  var girdi = document.getElementById('lead-fatura'), kutu = document.getElementById('leadFaturaKutu'), durum = document.getElementById('leadFaturaDurum');
  if(!girdi || !kutu || !durum) return;
  function yaz(){
    var n = girdi.files ? girdi.files.length : 0, en = document.documentElement.lang === 'en';
    durum.textContent = n === 0 ? durum.getAttribute(en ? 'data-en' : 'data-tr') : (n === 1 ? girdi.files[0].name : (en ? n + ' files selected' : n + ' dosya seçildi'));
    kutu.classList.toggle('dolu', n > 0);
  }
  girdi.addEventListener('change', yaz);
  window.addEventListener('languagechange', yaz);
  kutu.classList.add('hazir');
  yaz();
})();
"""

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
# Saatlik tablo: 24 alt alta satır yerine dört kısa gerçek tablo (00–05, 06–11, 12–17, 18–23). Hücreler "—" ile başlar;
# sayıları yalnız betik, EPİAŞ verisinden yazar. Eksik saat "—" kalır.
BASLIK = ('<thead><tr><th scope="col" class="label" data-tr="Saat" data-en="Hour">Saat</th>'
          '<th scope="col" class="label" data-tr="PTF" data-en="MCP">PTF</th></tr></thead>')
saatler = '\n'.join(
    '            <table aria-labelledby="saatBaslik">' + BASLIK + '<tbody>\n'
    + '\n'.join('              <tr><th scope="row">%02d:00</th><td>—</td></tr>' % h for h in range(b, b + 6))
    + '\n            </tbody></table>' for b in (0, 6, 12, 18))
govde = degistir(govde, '@@SAATLER@@', saatler)
govde = degistir(govde, '@@BLOK:form@@', form)
assert '@@' not in govde, re.findall(r'@@[^@]+@@', govde)

cikti = (bas + '\n<style>\n' + css + '\n</style>\n</head>\n' + govde.rstrip('\n') + '\n\n<script>\n' + js + '</script>\n\n<script>\n'
         + menu_js + '</script>\n\n' + analitik + '\n</body>\n</html>\n')
open(HEDEF, 'w', encoding='utf-8').write(cikti)
sys.stdout.write('yazıldı: %s %d bayt\n  baş %d · stil %d · gövde %d · betik %d\n' % (
    HEDEF, len(cikti.encode('utf-8')), len(bas.encode()), len(css.encode()), len(govde.encode()), len(js.encode()) + len(menu_js.encode())))
