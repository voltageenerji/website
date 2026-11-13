import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CFG } from './config';

/** Teşhis satırı için motorun ne yaptığına dair özet (hiçbir yere gönderilmez). */
export interface EngineInfo {
  dpr: number;
  bloom: boolean;
  bloomOffReason: string;
  tier: number;
}

// Render çekirdeği: ACES tone mapping + bloom. Uyarlanabilir kalite —
// FPS düşerse önce çözünürlük ölçeği, sonra bloom feda edilir (60 FPS hedefi
// görsel süslemeden önce gelir).
// Dayanıklılık (iOS Safari): bloom/post-processing hattı ya da half-float
// render hedefleri kurulamazsa oyun bloom'suz düz render ile devam eder;
// statik sayfaya ancak WebGL bağlamı hiç kurulamazsa veya kaybolursa düşülür.
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private bloom: UnrealBloomPass | null = null;
  private composer: EffectComposer | null = null;
  private bloomOffReason = '';
  private clock = new THREE.Clock();
  private elapsedAcc = 0; // Clock.start() elapsed'i sıfırladığı için kendi sayacımız
  private raf = 0;
  private running = false;
  private dead = false;
  private cb: ((dt: number, elapsed: number) => void) | null = null;
  private fpsAcc = 0;
  private fpsN = 0;
  private fpsTimer = 0;
  private qualityTier = 0; // 0 tam, 1 düşük çözünürlük, 2 bloom kapalı
  private baseDpr: number;
  private isTouch: boolean;
  private dpr = 1;
  private onResize = (): void => this.resize();

  constructor(canvas: HTMLCanvasElement, isTouch: boolean, private onFatal: (reason: string) => void = () => {}) {
    this.isTouch = isTouch;
    // Masaüstü: önceki ayar aynen (high-performance). Dokunmatik: iOS/Android'de
    // daha az bellek ve ısı için 'default'. failIfMajorPerformanceCaveat
    // verilmez (varsayılan false) — yazılımsal GPU'da da açılsın.
    const opts: THREE.WebGLRendererParameters = { canvas, antialias: false, powerPreference: isTouch ? 'default' : 'high-performance' };
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer(opts);
    } catch {
      // Bazı sürücüler tercih bildirimini reddeder → en yalın özelliklerle bir kez daha.
      renderer = new THREE.WebGLRenderer({ canvas });
    }
    this.renderer = renderer;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.baseDpr = Math.min(window.devicePixelRatio || 1, isTouch ? CFG.dprCapMobile : CFG.dprCap);

    this.camera = new THREE.PerspectiveCamera(CFG.fov, 1, 0.1, 2000);
    this.camera.position.set(0, CFG.cableY + 5, 18);

    this.setupPost();

    // Bağlam kaybı (iOS'ta arka plana alma / bellek baskısı): donmuş tuval
    // bırakmak yerine döngü durur ve sayfa statik yedeğe + yeniden başlat
    // düğmesine döner.
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.fail('webglcontextlost');
    }, false);

    this.resize();
    window.addEventListener('resize', this.onResize);
  }

  /** Bloom hattını kurar; herhangi bir adım başarısızsa düz render'a geçer. */
  private setupPost(): void {
    try {
      if ((window as unknown as { __g404TestBloomFail?: boolean }).__g404TestBloomFail) {
        throw new Error('test: bloom pipeline disabled');
      }
      const gl = this.renderer.getContext();
      const ext = this.renderer.extensions;
      // WebGL2'de RGBA16F'e çizmek için bu uzantılardan biri gerekir.
      if (!ext.has('EXT_color_buffer_float') && !ext.has('EXT_color_buffer_half_float')) {
        throw new Error('half-float render target unsupported');
      }
      // Gerçek sınama: küçük bir half-float hedefi bağla, framebuffer tam mı?
      const probe = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
      this.renderer.setRenderTarget(probe);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      this.renderer.setRenderTarget(null);
      probe.dispose();
      if (status !== gl.FRAMEBUFFER_COMPLETE) throw new Error(`half-float framebuffer incomplete (0x${status.toString(16)})`);

      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.55, 0.82);
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      this.composer = composer;
      this.bloom = bloom;
    } catch (err) {
      this.disableBloom(err);
    }
  }

  private disableBloom(err: unknown): void {
    this.bloomOffReason = String((err as Error)?.message || err).slice(0, 120);
    console.warn('[g404] bloom disabled, plain rendering:', this.bloomOffReason);
    try { this.composer?.dispose(); } catch { /* yut */ }
    this.composer = null;
    this.bloom = null;
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let dpr = this.baseDpr * (this.qualityTier >= 1 ? 0.72 : 1);
    // Dokunmatik büyük ekranlar (tablet) için piksel bütçesi — bellek düşük kalsın.
    if (this.isTouch && w * h * dpr * dpr > CFG.maxPixelsMobile) dpr = Math.max(1, Math.sqrt(CFG.maxPixelsMobile / (w * h)));
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setPixelRatio(dpr);
      this.composer.setSize(w, h);
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setExposure(v: number): void {
    this.renderer.toneMappingExposure = v;
  }

  setBloomStrength(v: number): void {
    if (this.bloom) this.bloom.strength = v;
  }

  get info(): EngineInfo {
    return { dpr: this.dpr, bloom: !!this.composer && this.qualityTier < 2, bloomOffReason: this.bloomOffReason, tier: this.qualityTier };
  }

  start(cb: (dt: number, elapsed: number) => void): void {
    this.cb = cb;
    this.kick();
  }

  private kick(): void {
    if (this.running || !this.cb || this.dead) return;
    this.running = true;
    this.clock.start();
    const loop = (): void => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.elapsedAcc += dt;
      try {
        this.cb?.(dt, this.elapsedAcc);
        this.draw();
      } catch (err) {
        console.error('[g404] frame failed:', err);
        this.fail(String((err as Error)?.message || err));
        return;
      }
      this.trackFps(dt);
    };
    loop();
  }

  private draw(): void {
    if (this.composer && this.qualityTier < 2) {
      try {
        this.composer.render();
        return;
      } catch (err) {
        this.disableBloom(err); // post-processing çöktü → düz render ile devam
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  private fail(reason: string): void {
    if (this.dead) return;
    this.dead = true;
    this.pause();
    window.removeEventListener('resize', this.onResize);
    this.onFatal(reason);
  }

  private trackFps(dt: number): void {
    this.fpsAcc += dt;
    this.fpsN++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 3) {
      const avg = this.fpsN / this.fpsAcc;
      if (avg < 45 && this.qualityTier < 2) {
        this.qualityTier++;
        this.resize();
      }
      this.fpsAcc = 0;
      this.fpsN = 0;
      this.fpsTimer = 0;
    }
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.clock.stop();
  }

  resume(): void {
    this.kick();
  }

  get paused(): boolean {
    return !this.running;
  }
}
