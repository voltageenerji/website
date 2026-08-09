import * as THREE from 'three';
import { CFG } from './config';
import { Engine } from './engine';
import { Sky } from './sky';
import { World } from './world';
import { Player } from './player';
import { Obstacles } from './obstacles';
import { Collectibles } from './collectibles';
import { Hud } from './hud';
import { AudioEngine } from './audio';
import { Input } from './input';
import { t } from './i18n';
import { range } from './rng';

// Durum makinesi:
//  attract → (ilk jest) → powerup → run ↔ egg(60. sn kamera yükselişi)
//  run → dying(yavaş çekim) → over → (Tekrar Oyna) → run
type State = 'attract' | 'powerup' | 'run' | 'egg' | 'dying' | 'over';

const PROGRESS_KEY = 'voltage-404-progress';
const NAME_KEY = 'voltage-404-name';
const ACH_MWH = [100, 500, 1000, 5000, 10000];
const RANK_MWH = [60, 150, 300, 600, 1200];
const LB_TIMEOUT_MS = 6000;

interface Progress { mwh: number; ach: number[]; bestD: number; bestM: number }

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Progress;
      if (typeof p.mwh === 'number' && Array.isArray(p.ach)) return p;
    }
  } catch { /* bozuk kayıt → sıfırla */ }
  return { mwh: 0, ach: [], bestD: 0, bestM: 0 };
}

export class Game {
  private engine: Engine;
  private sky: Sky;
  private world: World;
  private player: Player;
  private obstacles: Obstacles;
  private collectibles: Collectibles;
  private hud: Hud;
  private audio = new AudioEngine();
  private input: Input;

  private state: State = 'attract';
  private paused = false;
  private distance = 0;
  private runTime = 0;
  private collected = 0;
  private mwh = 0;
  private energy = 0;
  private boostHeld = false;
  private boosting = false;
  private powerT = 0;
  private eggDone = false;
  private eggT = 0;
  private dieT = 0;
  private lightningIn = 5;
  private sunSpike = 0;
  private progress = loadProgress();
  private camPos = new THREE.Vector3(0, CFG.cableY + 7, 20);
  private camLook = new THREE.Vector3(0, CFG.cableY, -40);
  /** Skor gönderimi için biten koşunun donmuş istatistikleri */
  private lastRun = { mwh: 0, dist: 0 };
  private lbSubmitting = false;

  constructor(canvas: HTMLCanvasElement) {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    this.engine = new Engine(canvas, isTouch);
    this.sky = new Sky(this.engine.scene);
    this.world = new World(this.engine.scene);
    this.player = new Player(this.engine.scene);
    this.obstacles = new Obstacles(this.engine.scene);
    this.collectibles = new Collectibles(this.engine.scene);

    this.engine.bloom.strength = this.sky.preset.bloom * 0.45;
    this.engine.setExposure(this.sky.preset.exposure * 0.85);

    this.hud = new Hud(isTouch, {
      onPause: () => this.togglePause(),
      onResume: () => this.togglePause(),
      onSound: (on) => { this.audio.setEnabled(on); return on; },
      onAgain: () => this.restart(),
      onLbSubmit: (name) => { void this.submitScore(name); },
    });
    try { this.hud.lbPrefill(localStorage.getItem(NAME_KEY) || ''); } catch { /* private mode */ }
    this.hud.setSoundState(this.audio.enabled);
    this.hud.setGridPct(0.18);

    this.input = new Input({
      onJump: () => this.handleJump(),
      onLane: (d) => { if (this.state === 'run' || this.state === 'egg') this.player.setLane(d); },
      onBoost: (on) => { this.boostHeld = on; },
      onPause: () => this.togglePause(),
      onAnyGesture: () => {
        this.audio.ensure();
        if (this.state === 'attract') this.startPowerup();
      },
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && (this.state === 'run' || this.state === 'egg') && !this.paused) this.togglePause();
    });

    this.engine.start((dt, elapsed) => this.frame(dt, elapsed));
  }

  private handleJump(): void {
    if (this.state === 'attract') { this.startPowerup(); return; }
    if (this.state !== 'run' && this.state !== 'egg') return;
    if (this.player.jump()) this.audio.jump();
  }

  private startPowerup(): void {
    if (this.state !== 'attract') return;
    this.state = 'powerup';
    this.powerT = 0;
    this.hud.showRestoring();
    this.audio.ensure();
    this.audio.powerUp();
    this.audio.startAmbient(this.sky.preset.windLevel);
  }

  private togglePause(): void {
    if (this.state !== 'run' && this.state !== 'egg') return;
    this.paused = !this.paused;
    this.hud.setPaused(this.paused);
    if (this.paused) { this.engine.pause(); this.audio.suspend(); }
    else { this.audio.resume(); this.engine.resume(); }
  }

  private frame(dt: number, elapsed: number): void {
    const p = this.sky.preset;
    let dz = 0;
    let timeScale = 1;

    switch (this.state) {
      case 'attract': {
        this.world.power = 0.18;
        dz = 2.2 * dt; // hafif süzülme — sahne ölü durmasın
        break;
      }
      case 'powerup': {
        this.powerT = Math.min(1, this.powerT + dt / CFG.powerUpSec);
        const e = this.powerT * this.powerT * (3 - 2 * this.powerT); // smoothstep
        this.world.power = 0.18 + 0.82 * e;
        this.hud.setGridPct(0.18 + 0.82 * e);
        this.engine.bloom.strength = p.bloom * (0.45 + 0.55 * e);
        this.engine.setExposure(p.exposure * (0.85 + 0.15 * e));
        dz = (2.2 + CFG.baseSpeed * e) * dt;
        if (this.powerT >= 1) {
          this.state = 'run';
          this.runTime = 0;
          this.hud.hideIntro();
        }
        break;
      }
      case 'run':
      case 'egg': {
        this.runTime += dt;
        // Boost — enerji bütçesiyle
        const wantBoost = this.boostHeld && this.state === 'run';
        if (wantBoost && !this.boosting && this.energy > CFG.boostMinEnergy) { this.boosting = true; this.audio.setBoost(true); }
        if (this.boosting && (!wantBoost || this.energy <= 0)) { this.boosting = false; this.audio.setBoost(false); }
        if (this.boosting) this.energy = Math.max(0, this.energy - CFG.boostDrainPerSec * dt);

        // Enerji sayacı yalnız paketlerden dolar; mesafe MWh üretmez (dürüst sayaç).
        const speed = Math.min(CFG.baseSpeed + (this.distance / 100) * CFG.speedRampPer100m, CFG.maxSpeed) + (this.boosting ? CFG.boostBonus : 0);
        dz = speed * dt;
        this.distance += dz;

        // Toplama
        const got = this.collectibles.collect(this.player);
        if (got > 0) {
          this.collected += got;
          this.mwh += got * CFG.packetMWh;
          if (this.player.overcharge <= 0) this.energy = Math.min(CFG.overchargeAt, this.energy + got * CFG.packetEnergy);
          this.audio.collect(this.collected % 6);
          this.checkAchievements();
        }

        // Aşırı yük tetiği
        if (this.energy >= CFG.overchargeAt && this.player.overcharge <= 0) {
          this.player.startOvercharge();
          this.audio.overcharge();
        }
        if (this.player.overcharge > 0) this.energy = CFG.overchargeAt * (this.player.overcharge / CFG.overchargeSec);

        // Çarpışma (yumurta sahnesinde dokunulmazlık)
        if (this.state === 'run') {
          const res = this.obstacles.check(this.player);
          if (res?.kind === 'destroyed') {
            this.mwh += CFG.destroyBonusMWh;
            this.audio.spark();
            this.hud.flash(0.22);
          } else if (res?.kind === 'hit') {
            this.die();
          }
        }

        // 60. saniye — kamera yükselir, ülke aydınlanır
        if (this.state === 'run' && !this.eggDone && this.runTime >= CFG.easterEggAtSec) {
          this.state = 'egg';
          this.eggT = 0;
          this.hud.showEgg(true);
        }
        if (this.state === 'egg') {
          this.eggT += dt;
          if (this.eggT >= 8.5) {
            this.state = 'run';
            this.eggDone = true;
            this.hud.showEgg(false);
          }
        }
        this.hud.setStats(this.distance, this.mwh, this.efficiency());
        this.hud.setEnergy(this.energy / CFG.overchargeAt, this.player.overcharge > 0);
        break;
      }
      case 'dying': {
        timeScale = 0.25;
        this.dieT += dt;
        dz = CFG.baseSpeed * dt * timeScale;
        if (this.dieT >= 0.9) {
          this.state = 'over';
          this.showOver();
        }
        break;
      }
      case 'over': {
        dz = 1.2 * dt;
        break;
      }
    }

    // Dünya + varlıklar
    const noSpawn = this.state !== 'run';
    this.world.update(dt, dz, elapsed);
    const off = this.world.corridorOffset;
    this.obstacles.update(dt * timeScale, dz, this.distance, p.lightning, noSpawn, off);
    this.collectibles.update(dt, dz, elapsed, this.obstacles, noSpawn, off);
    if (this.state === 'run' || this.state === 'egg' || this.state === 'dying') {
      this.player.update(dt * timeScale, dz, off, () => this.audio.land());
    }
    this.sky.update(dt, 0);

    // Yıldırım ambiyansı (fırtına)
    if (p.lightning && this.state !== 'attract') {
      this.lightningIn -= dt;
      if (this.lightningIn <= 0) {
        this.lightningIn = range(4, 11);
        this.hud.flash(0.45);
        this.sunSpike = 1;
        this.audio.thunder();
      }
    }
    if (this.sunSpike > 0) {
      this.sunSpike = Math.max(0, this.sunSpike - dt * 3);
      this.sky.sun.intensity = p.sunInt * (1 + this.sunSpike * 6);
    }

    this.updateCamera(dt, elapsed);
  }

  private efficiency(): number {
    // Payda: oyuncunun gerçekten karşılaştığı paketler (toplanan + kaçırılan).
    // İleride hâlâ yolda olanlar sayılmaz — verim haksız yere düşük görünmez.
    const seen = this.collected + this.collectibles.missedTotal;
    return seen > 0 ? Math.round((this.collected / seen) * 100) : 100;
  }

  private updateCamera(dt: number, elapsed: number): void {
    const cam = this.engine.camera;
    const pl = this.player;
    const wind = this.sky.preset.windLevel;
    let tx: number, ty: number, tz: number;
    let lx: number, ly: number, lz: number;

    if (this.state === 'attract') {
      tx = Math.sin(elapsed * 0.12) * 4;
      ty = CFG.cableY + 6.5;
      tz = 19;
      lx = 0; ly = CFG.cableY - 1; lz = -60;
    } else if (this.state === 'egg') {
      // Yükseliş eğrisi: çık (2.5s) → tut (3.5s) → in (2.5s)
      const e = this.eggT < 2.5 ? this.eggT / 2.5 : this.eggT < 6 ? 1 : Math.max(0, 1 - (this.eggT - 6) / 2.5);
      const s = e * e * (3 - 2 * e);
      tx = pl.x * 0.4;
      ty = pl.y + 3.3 + 38 * s;
      tz = 9.2 + 8 * s;
      lx = 0; ly = CFG.cableY - 6 * s; lz = -80;
    } else {
      tx = pl.x * 0.55 + this.input.mouseX * 1.3 + Math.sin(elapsed * 0.6) * 0.22 * (0.4 + wind);
      ty = pl.y + 3.3 - this.input.mouseY * 0.7 + Math.sin(elapsed * 0.83) * 0.12;
      tz = 9.2;
      lx = pl.x * 0.7; ly = pl.y + 0.6; lz = -16;
      if (this.state === 'dying') {
        tx += range(-0.3, 0.3);
        ty += range(-0.3, 0.3);
      }
    }

    const k = 1 - Math.exp(-4.2 * dt);
    this.camPos.x += (tx - this.camPos.x) * k;
    this.camPos.y += (ty - this.camPos.y) * k;
    this.camPos.z += (tz - this.camPos.z) * k;
    this.camLook.x += (lx - this.camLook.x) * k;
    this.camLook.y += (ly - this.camLook.y) * k;
    this.camLook.z += (lz - this.camLook.z) * k;
    cam.position.copy(this.camPos);
    cam.lookAt(this.camLook);

    const targetFov = this.boosting ? CFG.fovBoost : CFG.fov;
    if (Math.abs(cam.fov - targetFov) > 0.1) {
      cam.fov += (targetFov - cam.fov) * Math.min(1, 5 * dt);
      cam.updateProjectionMatrix();
    }
  }

  private die(): void {
    this.state = 'dying';
    this.dieT = 0;
    this.boosting = false;
    this.audio.setBoost(false);
    this.audio.crash();
    this.hud.flash(0.7);
  }

  private checkAchievements(): void {
    const total = this.progress.mwh + this.mwh;
    for (let i = 0; i < ACH_MWH.length; i++) {
      if (total >= ACH_MWH[i] && !this.progress.ach.includes(i)) {
        this.progress.ach.push(i);
        this.saveProgress(false);
        this.hud.toast(t('achievements')[i]);
        this.audio.achievement();
      }
    }
  }

  private rank(): string {
    let idx = 0;
    for (const th of RANK_MWH) { if (this.mwh >= th) idx++; }
    return t('ranks')[idx];
  }

  private showOver(): void {
    const newAch: string[] = [];
    const before = new Set(this.progress.ach);
    this.progress.mwh += this.mwh;
    this.progress.bestD = Math.max(this.progress.bestD, Math.round(this.distance));
    this.progress.bestM = Math.max(this.progress.bestM, Math.round(this.mwh));
    for (let i = 0; i < ACH_MWH.length; i++) {
      if (this.progress.mwh >= ACH_MWH[i] && !this.progress.ach.includes(i)) this.progress.ach.push(i);
      if (this.progress.ach.includes(i) && !before.has(i)) newAch.push(t('achievements')[i]);
    }
    this.saveProgress(true);
    this.lastRun = { mwh: Math.round(this.mwh), dist: Math.round(this.distance) };
    this.hud.showOver({
      distanceM: this.distance,
      mwh: Math.round(this.mwh),
      eff: this.efficiency(),
      rank: this.rank(),
      newAchievements: newAch,
    });
    // Lider tablosu: skoru olan forma davet edilir; tablo her koşulda çekilir.
    this.hud.lbFormShow(this.lastRun.mwh >= 12);
    void this.refreshBoard();
  }

  // ---- Lider tablosu (backend: /api/score) ----

  private lbSignal(): AbortSignal | undefined {
    return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(LB_TIMEOUT_MS) : undefined;
  }

  private async refreshBoard(): Promise<void> {
    try {
      const r = await fetch('/api/score', { signal: this.lbSignal() });
      const data = (await r.json()) as { ok: boolean; board?: { n: string; m: number; d: number }[] };
      if (data.ok && data.board) this.hud.lbRender(data.board, -1);
      else this.hud.lbHide(); // backend yoksa sahte tablo gösterilmez
    } catch {
      this.hud.lbHide();
    }
  }

  private async submitScore(name: string): Promise<void> {
    if (this.lbSubmitting || this.lastRun.mwh < 12) return;
    this.lbSubmitting = true;
    this.hud.lbBusy(true);
    try {
      const r = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mwh: this.lastRun.mwh, dist: this.lastRun.dist }),
        signal: this.lbSignal(),
      });
      const data = (await r.json()) as { ok: boolean; board?: { n: string; m: number; d: number }[]; you?: number };
      if (data.ok && data.board) {
        try { localStorage.setItem(NAME_KEY, name); } catch { /* private mode */ }
        this.hud.lbRender(data.board, data.you ?? -1);
        this.hud.lbFormShow(false);
      } else {
        this.hud.lbError();
      }
    } catch {
      this.hud.lbError();
    } finally {
      this.lbSubmitting = false;
      this.hud.lbBusy(false);
    }
  }

  private saveProgress(full: boolean): void {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progress)); } catch { /* private mode */ }
    void full;
  }

  restart(): void {
    this.distance = 0;
    this.runTime = 0;
    this.collected = 0;
    this.mwh = 0;
    this.energy = 0;
    this.boosting = false;
    this.boostHeld = false;
    this.eggDone = false;
    this.player.reset();
    this.obstacles.reset();
    this.collectibles.reset();
    this.hud.hideOver();
    this.hud.lbHide();
    this.lastRun = { mwh: 0, dist: 0 };
    this.hud.setStats(0, 0, 100);
    this.hud.setEnergy(0, false);
    this.state = 'run';
  }

  /** QA kancaları — üretimde zararsız, teşhis için okunur. */
  get debug(): { state: State; distance: number; mwh: number; fps: boolean } {
    return { state: this.state, distance: this.distance, mwh: this.mwh, fps: !this.engine.paused };
  }
}
