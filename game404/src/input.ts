// Klavye + dokunmatik girişleri tek arayüzde toplar.
// Masaüstü: SPACE zıpla, SHIFT boost, ok/A-D hat, ESC/P duraklat, fare hafif bakış.
// Mobil: dokun zıpla, basılı tut boost, yatay kaydır hat değiştir.
export interface InputHandlers {
  onJump: () => void;
  onLane: (dir: -1 | 1) => void;
  onBoost: (on: boolean) => void;
  onPause: () => void;
  onAnyGesture: () => void; // AudioContext açmak + intro başlatmak için
}

const HOLD_BOOST_MS = 260;
const SWIPE_PX = 42;

export class Input {
  mouseX = 0; // -1..1 — kamera bakış sapması
  mouseY = 0;
  readonly isTouch: boolean;
  private boostKey = false;
  private touchId: number | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartT = 0;
  private holdTimer = 0;
  private holdBoosting = false;
  private swiped = false;

  constructor(private h: InputHandlers) {
    this.isTouch = window.matchMedia('(pointer: coarse)').matches;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.h.onAnyGesture();
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); this.h.onJump(); }
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.h.onLane(-1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.h.onLane(1);
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { this.boostKey = true; this.h.onBoost(true); }
      else if (e.code === 'Escape' || e.code === 'KeyP') this.h.onPause();
    });
    window.addEventListener('keyup', (e) => {
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && this.boostKey) { this.boostKey = false; this.h.onBoost(false); }
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // Dokunmatik: UI butonlarına gelen dokunuşlara karışma (closest ile ayıklanır).
    window.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a')) return;
      this.h.onAnyGesture();
      if (this.touchId !== null) return;
      const tch = e.changedTouches[0];
      this.touchId = tch.identifier;
      this.touchStartX = tch.clientX;
      this.touchStartY = tch.clientY;
      this.touchStartT = performance.now();
      this.swiped = false;
      this.holdBoosting = false;
      this.holdTimer = window.setTimeout(() => {
        this.holdBoosting = true;
        this.h.onBoost(true);
      }, HOLD_BOOST_MS);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.touchId === null || this.swiped) return;
      for (const tch of Array.from(e.changedTouches)) {
        if (tch.identifier !== this.touchId) continue;
        const dx = tch.clientX - this.touchStartX;
        const dy = tch.clientY - this.touchStartY;
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.4) {
          this.swiped = true;
          window.clearTimeout(this.holdTimer);
          if (this.holdBoosting) { this.holdBoosting = false; this.h.onBoost(false); }
          this.h.onLane(dx > 0 ? 1 : -1);
        }
      }
    }, { passive: true });

    const endTouch = (e: TouchEvent): void => {
      for (const tch of Array.from(e.changedTouches)) {
        if (tch.identifier !== this.touchId) continue;
        window.clearTimeout(this.holdTimer);
        const quick = performance.now() - this.touchStartT < HOLD_BOOST_MS;
        if (this.holdBoosting) { this.holdBoosting = false; this.h.onBoost(false); }
        else if (!this.swiped && quick) this.h.onJump();
        this.touchId = null;
      }
    };
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });

    // Masaüstünde tıkla-zıpla (canvas üstünde)
    window.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, .panel')) return;
      this.h.onAnyGesture();
      if (!this.isTouch) this.h.onJump();
    });
  }
}
