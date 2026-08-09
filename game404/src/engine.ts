import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CFG } from './config';

// Render çekirdeği: ACES tone mapping + bloom. Uyarlanabilir kalite —
// FPS düşerse önce çözünürlük ölçeği, sonra bloom feda edilir (60 FPS hedefi
// görsel süslemeden önce gelir).
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly bloom: UnrealBloomPass;
  private composer: EffectComposer;
  private clock = new THREE.Clock();
  private elapsedAcc = 0; // Clock.start() elapsed'i sıfırladığı için kendi sayacımız
  private raf = 0;
  private running = false;
  private cb: ((dt: number, elapsed: number) => void) | null = null;
  private fpsAcc = 0;
  private fpsN = 0;
  private fpsTimer = 0;
  private qualityTier = 0; // 0 tam, 1 düşük çözünürlük, 2 bloom kapalı
  private baseDpr: number;

  constructor(canvas: HTMLCanvasElement, isTouch: boolean) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.baseDpr = Math.min(window.devicePixelRatio || 1, isTouch ? CFG.dprCapMobile : CFG.dprCap);

    this.camera = new THREE.PerspectiveCamera(CFG.fov, 1, 0.1, 2000);
    this.camera.position.set(0, CFG.cableY + 5, 18);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.55, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = this.baseDpr * (this.qualityTier >= 1 ? 0.72 : 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setExposure(v: number): void {
    this.renderer.toneMappingExposure = v;
  }

  start(cb: (dt: number, elapsed: number) => void): void {
    this.cb = cb;
    this.kick();
  }

  private kick(): void {
    if (this.running || !this.cb) return;
    this.running = true;
    this.clock.start();
    const loop = (): void => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.elapsedAcc += dt;
      this.cb?.(dt, this.elapsedAcc);
      if (this.qualityTier >= 2) this.renderer.render(this.scene, this.camera);
      else this.composer.render();
      this.trackFps(dt);
    };
    loop();
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
