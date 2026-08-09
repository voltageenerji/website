import * as THREE from 'three';
import { CFG, LaneIndex } from './config';
import { cableHeightAt } from './world';
import { glowTexture } from './sky';
import { range, rng } from './rng';

// Oyuncu: insan değil, bir enerji darbesi. Beyaz çekirdek + camgöbeği hale,
// dinamik elektrik arkları, parçacık izi. Zıplamada squash&stretch,
// inişte enerji halkası.
export class Player {
  readonly group = new THREE.Group();
  laneIdx: LaneIndex = 1;
  x = 0;
  y: number = CFG.cableY;
  vy = 0;
  grounded = true;
  overcharge = 0; // kalan süre (sn)
  private core: THREE.Mesh;
  private inner: THREE.Sprite;
  private outer: THREE.Sprite;
  private light: THREE.PointLight;
  private arcs: THREE.LineSegments;
  private arcTimer = 0;
  private trail: THREE.Points;
  private trailPos: Float32Array;
  private trailCol: Float32Array;
  private trailHead = 0;
  private scaleY = 1;
  private scaleTargetY = 1;
  private ripples: { mesh: THREE.Mesh; t: number }[] = [];
  private cyan = new THREE.Color(0x66d9ff);
  private white = new THREE.Color(0xffffff);

  constructor(scene: THREE.Scene) {
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.inner = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(230,250,255,0.95)', 'rgba(110,200,255,0.5)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.inner.scale.setScalar(2.6);
    this.outer = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(120,205,255,0.55)', 'rgba(40,120,220,0.12)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.outer.scale.setScalar(6.5);
    this.light = new THREE.PointLight(0x7ecbff, 60, 40, 1.8);
    this.group.add(this.core, this.inner, this.outer, this.light);

    // Elektrik arkları — kısa ömürlü, sürekli yeniden örülen kırık çizgiler
    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 2 * 24), 3));
    this.arcs = new THREE.LineSegments(arcGeo, new THREE.LineBasicMaterial({ color: 0xaee4ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
    this.group.add(this.arcs);

    // İz — halka tampon, renkler kararıp yok olur (additive → siyah = görünmez)
    const N = 80;
    this.trailPos = new Float32Array(N * 3);
    this.trailCol = new Float32Array(N * 3);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
    tg.setAttribute('color', new THREE.BufferAttribute(this.trailCol, 3));
    this.trail = new THREE.Points(tg, new THREE.PointsMaterial({ map: glowTexture('rgba(160,220,255,0.9)', 'rgba(60,140,240,0.25)', 32), size: 0.55, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(this.trail);

    this.group.position.set(0, this.y, 0);
    scene.add(this.group);
  }

  jump(): boolean {
    if (!this.grounded) return false;
    this.grounded = false;
    this.vy = CFG.jumpVel;
    this.scaleY = 1.28; // stretch
    return true;
  }

  setLane(dir: -1 | 1): boolean {
    const next = this.laneIdx + dir;
    if (next < 0 || next > 2) return false;
    this.laneIdx = next as LaneIndex;
    return true;
  }

  startOvercharge(): void {
    this.overcharge = CFG.overchargeSec;
  }

  /** dz: dünya kayması. corridorOffset: kablo sarkması referansı. onLand: iniş anında çağrılır. */
  update(dt: number, dz: number, corridorOffset: number, onLand: () => void): void {
    // Hat değişimi
    const targetX = CFG.laneX[this.laneIdx];
    this.x += (targetX - this.x) * Math.min(1, CFG.laneLerp * dt);

    // Dikey fizik — kablo yüksekliği sarkmayla değişir (oyuncu z=0'dadır)
    const cable = cableHeightAt(-corridorOffset);
    if (!this.grounded) {
      this.vy += CFG.gravity * dt;
      this.y += this.vy * dt;
      if (this.vy < 0 && this.y <= cable) {
        this.y = cable;
        this.grounded = true;
        this.vy = 0;
        this.scaleY = 0.72; // squash
        this.spawnRipple();
        onLand();
      }
    } else {
      this.y = cable;
    }

    // Squash & stretch yumuşaması
    this.scaleTargetY = 1;
    this.scaleY += (this.scaleTargetY - this.scaleY) * Math.min(1, 10 * dt);
    const inv = 1 / Math.sqrt(this.scaleY);
    this.core.scale.set(inv, this.scaleY, inv);

    if (this.overcharge > 0) this.overcharge = Math.max(0, this.overcharge - dt);
    const oc = this.overcharge > 0;
    (this.core.material as THREE.MeshBasicMaterial).color.copy(oc ? this.white : this.white);
    this.inner.scale.setScalar(oc ? 3.8 : 2.6);
    this.outer.scale.setScalar(oc ? 10.5 : 6.5);
    this.light.intensity = oc ? 140 : 60;
    (this.arcs.material as THREE.LineBasicMaterial).opacity = oc ? 1.0 : 0.75;

    this.group.position.set(this.x, this.y, 0);

    // Arklar — periyodik yeniden örme
    this.arcTimer -= dt;
    if (this.arcTimer <= 0) {
      this.arcTimer = oc ? 0.04 : 0.08;
      this.weaveArcs(oc ? 1.9 : 1.0);
    }

    // İz — halka tamponda bir nokta bırak, tüm izi dünya ile kaydır
    for (let i = 0; i < this.trailPos.length / 3; i++) {
      this.trailPos[i * 3 + 2] += dz;
      // Kararma
      this.trailCol[i * 3] *= 0.965;
      this.trailCol[i * 3 + 1] *= 0.965;
      this.trailCol[i * 3 + 2] *= 0.965;
    }
    this.trailPos[this.trailHead * 3] = this.x + range(-0.12, 0.12);
    this.trailPos[this.trailHead * 3 + 1] = this.y + range(-0.12, 0.12);
    this.trailPos[this.trailHead * 3 + 2] = 0;
    const c = oc ? this.white : this.cyan;
    this.trailCol[this.trailHead * 3] = c.r;
    this.trailCol[this.trailHead * 3 + 1] = c.g;
    this.trailCol[this.trailHead * 3 + 2] = c.b;
    this.trailHead = (this.trailHead + 1) % (this.trailPos.length / 3);
    (this.trail.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.trail.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

    // Halkalar
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.t += dt;
      const s = 0.4 + r.t * 6;
      r.mesh.scale.set(s, s, s);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.6 - r.t * 1.5);
      r.mesh.position.z += dz;
      if (r.t > 0.5) {
        this.group.parent?.remove(r.mesh);
        (r.mesh.material as THREE.MeshBasicMaterial).dispose();
        r.mesh.geometry.dispose();
        this.ripples.splice(i, 1);
      }
    }
  }

  private weaveArcs(spread: number): void {
    const arr = (this.arcs.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    let k = 0;
    const segs = 24;
    for (let a = 0; a < 3; a++) {
      // Küre yüzeyinden dışarı kıvrılan kırık yol
      let px = range(-0.3, 0.3), py = range(-0.3, 0.3), pz = range(-0.3, 0.3);
      for (let s = 0; s < segs / 3; s++) {
        const nx = px + range(-0.35, 0.35) * spread;
        const ny = py + range(-0.35, 0.35) * spread;
        const nz = pz + range(-0.35, 0.35) * spread;
        arr[k++] = px; arr[k++] = py; arr[k++] = pz;
        arr[k++] = nx; arr[k++] = ny; arr[k++] = nz;
        px = nx; py = ny; pz = nz;
      }
    }
    (this.arcs.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }

  private spawnRipple(): void {
    if (!this.group.parent) return;
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.62, 26),
      new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(this.x, this.y - 0.15, 0);
    this.group.parent.add(m);
    this.ripples.push({ mesh: m, t: 0 });
  }

  /** Çarpışma için: hangi hattın üzerinde sayılır (geçiş sırasında en yakın). */
  get occupiedLane(): LaneIndex {
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < 3; i++) {
      const d = Math.abs(this.x - CFG.laneX[i]);
      if (d < bd) { bd = d; best = i; }
    }
    return best as LaneIndex;
  }

  reset(): void {
    this.laneIdx = 1;
    this.x = 0;
    this.y = CFG.cableY;
    this.vy = 0;
    this.grounded = true;
    this.overcharge = 0;
    this.trailCol.fill(0);
  }
}
