"""Süreç ("beş adım") akış animasyonu — index.html yaması.

Tek kaynak: önizleme sayfası da canlıya alma da bu dosyadaki CSS ve JS'i kullanır.
apply(html) -> yamalı html. HTML işaretlemesine dokunmaz; süsleme öğelerini JS ekler.
"""

CSS = r"""
/* ============ SÜREÇ AKIŞI (design-to-motion, website bağlamı) ============
   Hikâye: altın ışık S1'den S5'e akar, geçtiği adım yanar, oklar ileri itilir,
   S5'te bir halka yayılır; her tur tam olarak tasarımın kendisine döner.
   Yalnızca opacity/transform/filter animasyonu. Hareketi azalt → hiç hareket yok. */
.stepflow.sf-on .step { position: relative; isolation: isolate; }
.stepflow.sf-on .step > :not(.sf-glow):not(.sf-ring) { position: relative; z-index: 1; }
.sf-glow { position: absolute; inset: -1px; border: 1px solid var(--accent); background: var(--warm-fill); opacity: 0; pointer-events: none; z-index: 0; }
.sf-ring { position: absolute; inset: -1px; border: 1px solid var(--accent); opacity: 0; pointer-events: none; z-index: 0; }
.sf-arrow { display: inline-block; }
"""

JS = r"""
// 7) Süreç akışı — bölüm göründüğünde adımlar sırayla gelir, ardından ışık
// S1→S5 akar. Ekran dışında durur, hareketi azaltta hiç çalışmaz.
// Her tur tasarımın kendisiyle (dinlenme kare) biter. Ayarlar: SF.
(function(){
  const flow = document.querySelector('.stepflow');
  if(!flow) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(!('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const SF = {
    stepGap: 0.8,      // sn: ışığın bir adımdan diğerine geçişi
    cycle: 10,         // sn: bir turun toplam süresi (hikâye ~4.4 sn + dinlenme)
    repeat: true,      // false → yalnızca ilk görünüşte bir kez
    introStagger: 90   // ms: adımların giriş aralığı
  };
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';     // --ease-out (giriş)
  const IO_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'; // akış/itme

  const steps = Array.prototype.slice.call(flow.querySelectorAll('.step'));
  const arrows = Array.prototype.slice.call(flow.querySelectorAll('.step-a'));
  if(steps.length < 2) return;

  // Süslemeler: her adıma bir ışık katmanı, son adıma bir halka; okun karakteri
  // ayrı bir span'e alınır (mobilde okun kendisi 90° döndürülmüş, iç span
  // itildiğinde ok yönünde — aşağı — hareket eder).
  steps.forEach(function(s, i){
    const g = document.createElement('span'); g.className = 'sf-glow'; g.setAttribute('aria-hidden', 'true');
    s.insertBefore(g, s.firstChild);
    if(i === steps.length - 1){
      const r = document.createElement('span'); r.className = 'sf-ring'; r.setAttribute('aria-hidden', 'true');
      s.insertBefore(r, s.firstChild);
    }
  });
  arrows.forEach(function(a){
    if(a.querySelector('.sf-arrow')) return;
    const t = a.textContent; a.textContent = '';
    const sp = document.createElement('span'); sp.className = 'sf-arrow'; sp.textContent = t;
    a.appendChild(sp);
  });

  // Kapsayıcının toplu soluklaşmasını kendi kademeli girişimizle değiştir.
  flow.classList.remove('reveal');
  flow.classList.add('sf-on');
  const hide = { opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' };
  const show = { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' };
  steps.concat(arrows).forEach(function(el){ el.style.opacity = '0'; });

  let started = false, visible = false;
  const loops = [];

  function intro(){
    // Okuma sırası: S1, ok, S2, ok, ... (DOM sırası)
    const seq = Array.prototype.slice.call(flow.children);
    let last = 0;
    seq.forEach(function(el, i){
      const isArrow = el.classList.contains('step-a');
      const delay = i * SF.introStagger;
      const a = el.animate(isArrow ? [{ opacity: 0 }, { opacity: 1 }] : [hide, show],
        { duration: isArrow ? 600 : 900, delay: delay, easing: EASE, fill: 'both' });
      a.onfinish = function(){ el.style.opacity = ''; a.cancel(); };
      last = Math.max(last, delay + (isArrow ? 600 : 900));
    });
    return last; // ms
  }

  function at(t){ return Math.min(1, Math.max(0, t / SF.cycle)); }

  function buildLoops(startDelayMs){
    const C = SF.cycle * 1000;
    const opts = function(){ return { duration: C, delay: startDelayMs, iterations: SF.repeat ? Infinity : 1, fill: 'none' }; };
    const n = steps.length;
    steps.forEach(function(s, i){
      const t0 = i * SF.stepGap;
      if(i < n - 1){
        // Adım yanar ve sönerken ışık bir sonrakine geçer (örtüşen devir teslim)
        const g = s.querySelector('.sf-glow');
        loops.push(g.animate([
          { offset: 0, opacity: 0 },
          { offset: at(t0), opacity: 0, easing: IO_EASE },
          { offset: at(t0 + 0.3), opacity: 1 },
          { offset: at(t0 + 0.75), opacity: 1, easing: IO_EASE },
          { offset: at(t0 + 1.2), opacity: 0 },
          { offset: 1, opacity: 0 }
        ], opts()));
      } else {
        // S5 zaten vurgulu: halka bir kez yayılır
        const r = s.querySelector('.sf-ring');
        loops.push(r.animate([
          { offset: 0, opacity: 0, transform: 'scale(1)' },
          { offset: at(t0), opacity: 0, transform: 'scale(1)', easing: 'ease-out' },
          { offset: at(t0 + 0.05), opacity: 0.85, transform: 'scale(1)', easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
          { offset: at(t0 + 1.3), opacity: 0, transform: 'scale(1.035)' },
          { offset: 1, opacity: 0, transform: 'scale(1)' }
        ], opts()));
      }
    });
    arrows.forEach(function(a, j){
      const sp = a.querySelector('.sf-arrow');
      const t0 = j * SF.stepGap + 0.45;
      loops.push(sp.animate([
        { offset: 0, transform: 'translateX(0)' },
        { offset: at(t0), transform: 'translateX(0)', easing: IO_EASE },
        { offset: at(t0 + 0.3), transform: 'translateX(5px)', easing: IO_EASE },
        { offset: at(t0 + 0.7), transform: 'translateX(0)' },
        { offset: 1, transform: 'translateX(0)' }
      ], opts()));
    });
  }

  function setPlaying(on){
    loops.forEach(function(a){ if(a.playState === 'finished') return; on ? a.play() : a.pause(); });
  }

  const io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      visible = e.isIntersecting;
      if(visible && !started){
        started = true;
        buildLoops(intro() + 300);
      } else if(started){
        setPlaying(visible);
      }
    });
  }, { threshold: 0.3 });
  io.observe(flow);
  document.addEventListener('visibilitychange', function(){ if(started) setPlaying(visible && !document.hidden); });

  // Test kancası (önizleme ve kayıt): window.__sf
  window.__sf = { flow: flow, loops: loops, SF: SF };
})();
"""

CSS_ANCHOR = ".step-a { display: flex; align-items: center; justify-content: center; color: var(--accent-text); font-size: 13px; }\n"
JS_ANCHOR = "// 5) Teknik çizim — scroll'da bir kez çizilir, sabitlenir"


def apply(html: str) -> str:
    assert html.count(CSS_ANCHOR) == 1, 'CSS çapası bulunamadı'
    assert html.count(JS_ANCHOR) == 1, 'JS çapası bulunamadı'
    assert '.sf-glow' not in html, 'yama zaten uygulanmış'
    html = html.replace(CSS_ANCHOR, CSS_ANCHOR + CSS, 1)
    html = html.replace(JS_ANCHOR, JS.strip('\n') + '\n\n' + JS_ANCHOR, 1)
    return html


if __name__ == '__main__':
    # Onay sonrası: python3 -I surec_patch.py index.html  (yerinde uygular)
    import sys
    path = sys.argv[1]
    src = open(path, encoding='utf-8').read()
    open(path, 'w', encoding='utf-8').write(apply(src))
    print('yama uygulandı:', path)
