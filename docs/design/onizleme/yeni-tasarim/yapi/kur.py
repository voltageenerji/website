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

// 9) Bahar anı (sahip isteği 27.11; 2. tur aynı gün: "daha belirgin"): yeşil enerji kutucuğu İŞARETLENİNCE ≈5,8 sn.
//    Formun iki kenarında sırayla dört çiçek açar (dalın dibinde, onun üstünde, solda iki), gönder düğmesinin altındaki
//    çimde bir-iki çiçek daha; iki kelebek ekranın kenarından gelip birer çiçeğe konar ve uçup gider; birkaç yaprak
//    yavaşça süzülür. Mevcut yeşil görünüme dokunmaz, yalnız ekler. Bütün süs, sayfa genişliğinde taşmayı kesen tek bir
//    mutlak katmandadır: aria-hidden, pointer-events yok, yalnız transform ve opacity değişir; hiçbir öğe formun içerik
//    kutusuna (alanlar, etiketler, düğmeler) ve iki sütunlu düzende sol sütuna girmez. Aynı anda tek gösterim; kutucuk
//    kaldırılınca, form gönderilince ya da formun boyu değişince 0,3 sn'de söner; bitince öğeler DOM'dan silinir.
//    Hareket azaltma tercihinde kelebek, yaprak ve açılma yok: çiçekler açık hâlleriyle yerlerinde belirip söner.
(function(){
  var kutu = document.getElementById('lead-yesil'), form = document.getElementById('leadForm');
  if(!kutu || !form || !form.animate) return;
  var az = window.matchMedia('(prefers-reduced-motion: reduce)'), g = null;
  /* çiçek başı (0,0) merkezli, yarıçap ≈19 birim. tür: k krem yaprak + kehribar göbek, a kehribar yaprak + lacivert göbek, p papatya */
  function bas(t){
    var n = t === 'p' ? 8 : 5, ry = t === 'p' ? 9.4 : 9.6, rx = t === 'p' ? 3.7 : 6.3, s = '<g class="bh-tac">';
    for(var i = 0; i < n; i++) s += '<g transform="rotate(' + (i * 360 / n) + ')"><g class="bh-p' + (t === 'a' ? ' bh-pa' : '') + '" style="--i:' + i + '"><ellipse cy="' + (-ry) + '" rx="' + rx + '" ry="' + ry + '"/><path class="bh-pd" d="M0 -5V' + (-ry * 1.55).toFixed(1) + '"/></g></g>';
    return s + '<circle class="bh-gb' + (t === 'a' ? ' bh-gl' : '') + '" r="' + (t === 'p' ? 4.8 : 4.4) + '"/></g>';
  }
  function yp(x, y, a, j){ return '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ')"><g class="bh-yp" style="--j:' + j + '"><path d="M0 0C3 -3.4 9.4 -3.8 13.5 0C9.4 3.8 3 3.4 0 0Z"/><path class="bh-yd" d="M1.5 0H11"/></g></g>'; }
  /* kenar çiçeği: baş, kısa sap ve iki yaprak (viewBox -20 -20 40 58); çim çiçeği: kısa sap, tek yaprak (viewBox -14 -31 28 33) */
  function kenar(t){ return '<path class="bh-sap" pathLength="1" d="M0 15Q-1.6 26 .4 37"/>' + yp(-.5, 25, 200, 0) + yp(.1, 31, -28, 1) + bas(t); }
  function cim(t){ return '<path class="bh-sap" pathLength="1" d="M0 2Q-1.4 -6 0 -13"/>' + yp(-.4, -5, 205, 0) + '<g transform="translate(0 -18.5) scale(.64)">' + bas(t) + '</g>'; }
  var KANAT = '<path class="bh-ku" d="M-.6 -1.5C-3 -8.5 -9.5 -10.8 -12 -8.2C-13.4 -6.4 -11.2 -2 -6.5 -.4C-4.2 .4 -1.8 0 -.6 -1.5Z"/><path class="bh-kc" d="M-12 -8.2C-11 -9.6 -9.2 -9.9 -7.6 -9.2C-9 -8.2 -10.2 -7 -10.8 -5.4C-11.7 -6.1 -12.4 -7.2 -12 -8.2Z"/><circle class="bh-kb" cx="-10.4" cy="-7.6" r=".55"/><circle class="bh-kb" cx="-9" cy="-8.7" r=".42"/><path class="bh-ka" d="M-.6 .8C-3.5 .6 -8.6 2.4 -8.4 6C-8.2 8.6 -5.2 9 -3.6 6.6C-2.4 4.8 -1.2 2.6 -.6 .8Z"/><path class="bh-kv" d="M-1.3 -1.8Q-5 -4.6 -8.6 -6.4M-1.4 1.2Q-3.8 3.4 -5.2 6.2"/>';
  var KELEBEK = '<g class="bh-ks">' + KANAT + '</g><g transform="scale(-1 1)"><g class="bh-kg">' + KANAT + '</g></g><ellipse class="bh-kc" rx=".9" ry="5.2" cy=".5"/><path class="bh-kn" d="M-.3 -4.5Q-1.5 -8 -3.2 -9.2M.3 -4.5Q1.5 -8 3.2 -9.2"/>';
  function oge(kap, sinif, stil, kutuDeger, ic){
    var d = document.createElement('div'); d.className = sinif; d.setAttribute('aria-hidden', 'true'); d.style.cssText = stil;
    d.innerHTML = '<svg viewBox="' + kutuDeger + '" focusable="false">' + ic + '</svg>'; kap.appendChild(d); return d;
  }
  function sil(b){ b.ogeler.forEach(function(e){ e.remove(); }); if(b.ro) b.ro.disconnect(); window.removeEventListener('resize', b.boyut); if(g === b) g = null; }
  function sondur(hizli){
    var b = g; if(!b || b.son) return; b.son = true; b.zaman.forEach(clearTimeout);
    b.ogeler.forEach(function(e){ e.animate([{ opacity: getComputedStyle(e).opacity }, { opacity: 0 }], { duration: hizli ? 300 : 800, fill: 'forwards' }); });
    setTimeout(function(){ sil(b); }, hizli ? 350 : 850);
  }
  /* Kelebek yolu: [t ms, x, y, konma noktası mı] düğümlerinden 40 ms'lik kareler (Hermite eğrisi). Uçarken hafif inip
     kalkar ve yatay hıza göre en çok 12° eğilir; konunca durur. x her karede, o andaki eğimle dönmüş kutunun yarısı
     hesaba katılarak izinli şeridin içine kıstırılır (sinir). */
  function yol(nk, sinir, bw, bh){
    var son = nk[nk.length - 1][0], kare = [], i = 0, onceki = null, konma = nk.filter(function(n){ return n[3]; }).map(function(n){ return n[0]; });
    function m(j, e){ return (nk[j][3] || j === 0 || j === nk.length - 1) ? 0 : (nk[j + 1][e] - nk[j - 1][e]) / (nk[j + 1][0] - nk[j - 1][0]); }
    for(var t = 0; t <= son; t += 40){
      while(i < nk.length - 2 && t > nk[i + 1][0]) i++;
      var a = nk[i], c = nk[i + 1], d = c[0] - a[0], u = Math.min(1, (t - a[0]) / d), u2 = u * u, u3 = u2 * u;
      var h0 = 2 * u3 - 3 * u2 + 1, h1 = u3 - 2 * u2 + u, h2 = 3 * u2 - 2 * u3, h3 = u3 - u2;
      var x = h0 * a[1] + h1 * d * m(i, 1) + h2 * c[1] + h3 * d * m(i + 1, 1), y = h0 * a[2] + h1 * d * m(i, 2) + h2 * c[2] + h3 * d * m(i + 1, 2);
      var uz = konma.reduce(function(z, k){ return Math.min(z, Math.abs(t - k)); }, 1e9), dur = a[3] && c[3];
      var s = dur ? 0 : Math.min(1, uz / 260);
      y += Math.sin(t / 95) * bw * 0.07 * s;
      var aci = onceki === null ? 0 : Math.max(-12, Math.min(12, (x - onceki) * 0.8)) * s, r = Math.abs(aci) * Math.PI / 180; onceki = x;
      x = sinir(x, (bw * Math.cos(r) + bh * Math.sin(r)) / 2 + 1);
      kare.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + aci.toFixed(1) + 'deg)', opacity: 1, offset: t / son });
    }
    kare[kare.length - 1].offset = 1;
    return kare;
  }
  function basla(){
    var fr = form.getBoundingClientRect(), cs = getComputedStyle(form), dal = form.querySelector('.form-flora-kutu .flora-dal'), gk = form.querySelector('.form-green');
    if(!dal || !gk || !fr.width) return;
    var px = function(p){ return parseFloat(cs[p]) || 0; };
    var cl = fr.left + px('borderLeftWidth') + px('paddingLeft'), cr = fr.right - px('borderRightWidth') - px('paddingRight');
    var R = document.documentElement.clientWidth, sx = window.scrollX, sy = window.scrollY, gr = gk.getBoundingClientRect(), dr = dal.getBoundingClientRect();
    /* İki sütunlu düzende sol sütun (başlık ve künye) yasak bölgedir; tek sütunda form ekranın iki kenarına kadar uzanır */
    var bsl = document.querySelector('.contact-head'), br = bsl && bsl.getBoundingClientRect(), iki = !!(br && br.width && br.right <= fr.left + 1);
    var solSinir = iki ? br.right + 8 : 0, bolum = form.closest('section') || form;
    /* katman: görünen alanın biraz üstünden formun altına; tek sütunda formun üstündeki başlığa girmez */
    var ust = (iki ? bolum.getBoundingClientRect().top : fr.top) + sy, T = Math.max(ust, sy - 200), Y = function(v){ return v + sy - T; };
    var kat = document.createElement('div');
    kat.className = 'bh-kat'; kat.setAttribute('aria-hidden', 'true'); kat.style.cssText = 'top:' + T + 'px;height:' + (fr.bottom + sy - T + 1) + 'px';
    g = { ogeler: [kat], zaman: [], fr: [fr.width, fr.height] };
    var b = g;
    /* çiçek ölçüsü: kenar şeridine sığan en büyük ölçü (masaüstünde 60 px); çiçek form çizgisinin üstünde durur */
    var SR = Math.min(60, R - cr - 2), SL = Math.min(60, cl - solSinir - 2);
    var orta = function(s, kenarX, enAz, enCok){ return Math.max(enAz + s / 2, Math.min(enCok - s / 2, kenarX)); };
    var cicekler = [], yb = dr.top + 10 / 232 * dr.height;
    function ekle(sag, s, yBas, t, bd){
      if(s < 18) return null;
      var x = sag ? orta(s, fr.right - 0.5, cr + 2, R) : orta(s, fr.left + 0.5, solSinir, cl - 2);
      var c = { x: x + sx, y: Y(yBas), s: s, t: t, sag: sag };
      c.e = oge(kat, 'bh-cicek', '--bd:' + bd + 's;left:' + (c.x - s / 2) + 'px;top:' + (c.y - s / 2) + 'px;width:' + s + 'px;height:' + (s * 1.45) + 'px', '-20 -20 40 58', kenar(t));
      cicekler.push(c); return c;
    }
    var s2 = SR * 0.7, s3 = SL * 0.86, s4 = SL * 0.64;
    var f1 = ekle(true, SR, yb, 'k', 0.1);
    var f2 = ekle(true, s2, yb - SR / 2 - 6 - s2 * 0.95, 'a', 0.5);
    var y3 = gr.top + gr.height * 0.42, f3 = ekle(false, s3, y3, 'a', 0.85);
    var f4 = ekle(false, s4, y3 + s3 * 0.95 + 8 + s4 / 2, 'p', 1.2);
    /* çim çiçekleri: gönder düğmesinin altındaki iç boşlukta; yer yoksa çizilmez, geniş formda iki tane */
    var alt = 0;
    for(var i = 0; i < form.children.length; i++){ var ch = form.children[i], rr = ch.getBoundingClientRect(); if(rr.height && !/flora|hp-field/.test(ch.className)) alt = Math.max(alt, rr.bottom); }
    var h = Math.min(40, fr.bottom - px('borderBottomWidth') - alt - 3), gw = cr - cl;
    if(h >= 16) [0.13, 0.6].slice(0, gw >= 460 ? 2 : 1).forEach(function(o, j){
      var w = h * 28 / 33, x = cl + gw * o + sx, y = Y(fr.bottom - px('borderBottomWidth') - h);
      cicekler.push({ e: oge(kat, 'bh-cicek bh-cim', '--bd:' + (1.45 + j * 0.3) + 's;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px', '-14 -31 28 33', cim(j ? 'a' : 'k')) });
    });
    document.body.appendChild(kat);
    cicekler.forEach(function(c){ b.ogeler.push(c.e); });
    /* formun boyu değişirse (dil, hata iletisi, gönderim) süs yerinden kayacağı için hızla söner */
    b.boyut = function(){ sondur(true); };
    window.addEventListener('resize', b.boyut);
    if(window.ResizeObserver){ b.ro = new ResizeObserver(function(){ var r = form.getBoundingClientRect(); if(Math.abs(r.width - b.fr[0]) > 1 || Math.abs(r.height - b.fr[1]) > 1) sondur(true); }); b.ro.observe(form); }
    if(az.matches){
      cicekler.forEach(function(c, j){ c.e.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 3800, delay: j * 120, fill: 'both' }); });
      b.zaman.push(setTimeout(function(){ sil(b); }, 3800 + cicekler.length * 120 + 100));
      return;
    }
    /* kelebekler: masaüstünde 64 px, telefonda 40 px (320 px'te 32; konunca kenar şeridine tam sığar). hx: en çok eğik
       hâldeki yarı genişlik; konma noktası düz duran kelebeğin yarı genişliğiyle hesaplanır */
    var bw = R <= 360 ? 32 : (R <= 640 ? 40 : 64), bh = bw * 22 / 26, hx = bw * 0.59 + 1, hd = bw / 2 + 1;
    function kelebek(gecikme, sure, nk, sinir){
      var k = oge(kat, 'bh-kelebek', 'width:' + bw + 'px;height:' + bh + 'px;margin:' + (-bh / 2) + 'px 0 0 ' + (-bw / 2) + 'px;opacity:0', '-13 -11 26 22', KELEBEK);
      b.ogeler.push(k);
      k.animate(yol(nk, sinir, bw, bh), { duration: nk[nk.length - 1][0], delay: gecikme, fill: 'both' });
      b.zaman.push(setTimeout(function(){ k.classList.add('konar'); }, gecikme + sure[0]), setTimeout(function(){ k.classList.remove('konar'); }, gecikme + sure[1]));
    }
    var vu = Y(Math.max(0, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64)) - bh;
    if(f1){ /* sağdan gelir, iniş-çıkışlarla dalın dibindeki çiçeğe konar, sağ üstten çıkar */
      var xa = cr + hx, xz = Math.max(xa, R - bw * 0.62), lx = Math.max(Math.min(f1.x - sx, R - bw / 2), cr + hd), ly = f1.y - f1.s * 0.3, md = function(o){ return xa + (xz - xa) * o; };
      kelebek(300, [1950, 2900], [[0, R + bw * 1.3, ly - 300], [450, xz, ly - 250], [900, md(0.15), ly - 175], [1300, xz, ly - 105], [1650, md(0.35), ly - 40], [1950, lx, ly, 1],
        [2900, lx, ly, 1], [3250, md(0.55), ly - 70], [3700, xz, ly - 170], [4400, R + bw * 1.4, ly - 320]], function(x, y){ return Math.max(cr + y, Math.min(R + bw * 2, x)); });
    }
    if(f3){ /* soldan (iki sütunda yukarıdan) gelir, soldaki çiçeğe konar, geldiği yöne gider */
      var xb = cl - hx, xs = iki ? solSinir + hx : -bw * 2, xc = Math.min(xb, iki ? xs : bw * 0.62), mx = Math.max(Math.min(f3.x - sx, cl - hd), iki ? solSinir + hd : Math.min(bw / 2, cl - hd)), my = f3.y - f3.s * 0.3, me = function(o){ return xc + (xb - xc) * o; };
      var giris = iki ? [[0, me(0.5), vu - 40], [600, me(0.9), Math.max(vu + 120, my - 300)], [1100, me(0.1), my - 190], [1550, me(0.85), my - 90]]
                      : [[0, -bw * 1.3, my + 210], [600, xc, my + 150], [1100, me(0.8), my + 70], [1550, xc, my - 50]];
      var cikis = iki ? [[3150, me(0.3), my - 80], [3650, me(0.9), my - 220], [4150, me(0.4), vu - 60]]
                      : [[3150, me(0.4), my - 70], [3650, xc, my - 170], [4150, -bw * 1.4, my - 300]];
      kelebek(750, [1950, 2800], giris.concat([[1950, mx, my, 1], [2800, mx, my, 1]], cikis), function(x, y){ return Math.min(cl - y, Math.max(iki ? solSinir + y : -bw * 2, x)); });
    }
    /* yapraklar: çiçeklerden kopup yavaşça süzülür; yalnız kenar şeridinde kalır */
    var pw = R <= 640 ? 8 : 10, ph = pw * 1.6, pd = pw * 0.95;
    [[f1, 1900, 1], [f2, 2350, -1], [f3, 2650, 1], [f1, 3000, -1], [f4, 3300, 1]].forEach(function(p){
      var c = p[0]; if(!c) return;
      var xmin = c.sag ? cr + pd + sx : solSinir + pd + sx, xmax = c.sag ? R - pd + sx : cl - pd + sx, A = Math.min(16, (xmax - xmin) / 2), dy = R <= 640 ? 95 : 140, kf = [];
      for(var i = 0; i <= 16; i++){
        var u = i / 16, x = Math.max(xmin, Math.min(xmax, c.x + p[2] * (Math.sin(u * Math.PI * 2.2) * A + u * 8))), y = c.y + dy * u * (0.4 + 0.6 * u);
        kf.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (p[2] * u * 320).toFixed(0) + 'deg)', opacity: u < 0.1 ? u * 10 : (u > 0.72 ? (1 - u) / 0.28 : 1) });
      }
      var e = oge(kat, 'bh-yaprak' + (c.t === 'a' ? ' bh-ya' : ''), 'width:' + pw + 'px;height:' + ph + 'px;margin:' + (-ph / 2) + 'px 0 0 ' + (-pw / 2) + 'px;opacity:0', '-3 -5 6 10', '<ellipse rx="2.6" ry="4.4"/>');
      b.ogeler.push(e); e.animate(kf, { duration: 2500, delay: p[1], fill: 'both' });
    });
    b.zaman.push(setTimeout(function(){ sondur(false); }, 4950));
  }
  /* Süs, dokunuşun karesi çizildikten sonra kurulur: ölçüm ve öğe üretimi etkileşim gecikmesine (INP) eklenmez (QA-YT-2) */
  var bekleyen = 0;
  kutu.addEventListener('change', function(){
    if(kutu.checked){
      if(!g && !bekleyen) bekleyen = requestAnimationFrame(function(){ setTimeout(function(){ bekleyen = 0; if(kutu.checked && !g) basla(); }, 0); });
    } else { if(bekleyen){ cancelAnimationFrame(bekleyen); bekleyen = 0; } sondur(true); }
  });
  form.addEventListener('submit', function(){ sondur(true); });
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
