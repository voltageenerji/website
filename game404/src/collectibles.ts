import * as THREE from 'three';
import { CFG, LaneIndex } from './config';
import { cableHeightAt } from './world';
import { glowTexture } from './sky';
import { pick, range, rng } from './rng';
import type { Player } from './player';
import type { Obstacles } from './obstacles';

// Toplanabilirler: kablo üzerinde süzülen enerji paketleri (küçük kristaller).
// Düz sıra ya da zıplamaya davet eden kavis (ark) düzeninde doğarlar.
interface Packet {
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  active: boolean;
  lane: LaneIndex;
  z: number;
  yOff: number;
  phase: number;
}

export class Collectibles {
  private pool: Packet[] = [];
  private geo = new THREE.OctahedronGeometry(0.26);
  private mat = new THREE.MeshBasicMaterial({ color: 0x8fdcff });
  private glowTex = glowTexture('rgba(140,220,255,0.8)', 'rgba(50,140,240,0.15)', 64);
  private nextIn = 18;
  spawnedTotal = 0;

  constructor(private scene: THREE.Scene) {
    for (let i = 0; i < 48; i++) {
      const mesh = new THREE.Mesh(this.geo, this.mat);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
      glow.scale.setScalar(1.5);
      mesh.add(glow);
      mesh.visible = false;
      this.scene.add(mesh);
      this.pool.push({ mesh, glow, active: false, lane: 1, z: -999, yOff: 0.9, phase: rng() * 6 });
    }
  }

  private lastOffset = 0;

  update(dt: number, dz: number, elapsed: number, obstacles: Obstacles, timeStopped: boolean, corridorOffset: number): void {
    this.lastOffset = corridorOffset;
    if (!timeStopped) {
      this.nextIn -= dz;
      if (this.nextIn <= 0) {
        this.placeGroup(obstacles);
        this.nextIn = range(11, 20);
      }
    }
    for (const p of this.pool) {
      if (!p.active) continue;
      p.z += dz;
      const cable = cableHeightAt(p.z - corridorOffset);
      p.mesh.position.set(CFG.laneX[p.lane], cable + p.yOff + Math.sin(elapsed * 2.4 + p.phase) * 0.12, p.z);
      p.mesh.rotation.y += dt * 2.2;
      p.mesh.rotation.x += dt * 0.8;
      if (p.z > 12) this.release(p);
    }
  }

  private placeGroup(obstacles: Obstacles): void {
    const spawnZ = -CFG.towerSpacing * (CFG.spanCount - 3);
    const lane = pick([0, 1, 2] as const);
    const n = 4 + Math.floor(rng() * 3);
    const arc = rng() < 0.35; // kavisli dizilim → zıplama ödülü
    const gap = 3;
    if (!obstacles.isZoneFree(spawnZ - (n * gap) / 2, (n * gap) / 2 + 3)) return;
    for (let i = 0; i < n; i++) {
      const p = this.pool.find((q) => !q.active);
      if (!p) return;
      p.active = true;
      p.lane = lane;
      p.z = spawnZ - i * gap;
      const t = n < 2 ? 0 : i / (n - 1);
      p.yOff = arc ? 0.9 + Math.sin(t * Math.PI) * 1.9 : 0.9;
      p.mesh.visible = true;
      this.spawnedTotal++;
    }
  }

  private release(p: Packet): void {
    p.active = false;
    p.mesh.visible = false;
    p.z = -999;
  }

  /** Oyuncuyla kesişen paketi toplar; toplandıysa true döner. */
  collect(player: Player): number {
    let got = 0;
    for (const p of this.pool) {
      if (!p.active || Math.abs(p.z) > 1.3) continue;
      if (p.lane !== player.occupiedLane) continue;
      const py = cableHeightAt(p.z - this.lastOffset) + p.yOff;
      if (Math.abs(player.y - py) > 1.35) continue;
      this.release(p);
      got++;
    }
    return got;
  }

  reset(): void {
    for (const p of this.pool) this.release(p);
    this.nextIn = 18;
    this.spawnedTotal = 0;
  }
}
