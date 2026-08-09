import * as THREE from 'three';
import { CFG, LaneIndex } from './config';
import { cableHeightAt } from './world';
import { glowTexture } from './sky';
import { pick, range, rng } from './rng';
import type { Player } from './player';

// Engeller — yalnızca gerçekçi iletim hattı tehlikeleri:
//  insulator  : kırık izolatör (kablo üstünde) → ZIPLA
//  platform   : bakım platformu (kablo hizasında) → ZIPLA
//  crane      : bakım vinci (tam yükseklik) → HAT DEĞİŞTİR
//  flock      : kuş sürüsü (kablonun üstünde) → ALÇAKTA KAL (zıplama!)
//  strike     : yıldırım (yalnız fırtınada; uyarı + düşüş) → HATTAN KAÇ
export type ObstacleType = 'insulator' | 'platform' | 'crane' | 'flock' | 'strike';

interface Obstacle {
  type: ObstacleType;
  root: THREE.Group;
  active: boolean;
  lane: LaneIndex;
  z: number;
  depth: number; // çarpışma penceresi derinliği
  timer: number; // strike/flock animasyon sayacı
  birds?: THREE.Mesh[];
  bolt?: THREE.Line;
  warn?: THREE.Sprite;
}

const JUMP_CLEAR = 1.7; // kablo + bu değerin altındaki gövde zıplayarak aşılır
const FLOCK_LOW = 1.9; // sürü bu yüksekliğin ÜSTÜNÜ kapatır
const STRIKE_ARM_Z = -9; // yıldırım bu z'den itibaren düşer (uyarı biter)
const STRIKE_END_Z = 6; // bu z'den sonra söner

export interface CollisionResult {
  kind: 'hit' | 'destroyed';
  type: ObstacleType;
}

export class Obstacles {
  private pool: Obstacle[] = [];
  private nextIn = 40; // ilk engel için mesafe tamponu
  private steel = new THREE.MeshLambertMaterial({ color: 0x39404e });
  private dark = new THREE.MeshLambertMaterial({ color: 0x1c212c });
  private amber = new THREE.MeshBasicMaterial({ color: 0xd99a4e });
  private boltMat = new THREE.LineBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
  private warnTex = glowTexture('rgba(255,200,110,0.9)', 'rgba(255,150,40,0.15)', 64);
  spawnedCount = 0;

  constructor(private scene: THREE.Scene) {}

  private build(type: ObstacleType): Obstacle {
    const root = new THREE.Group();
    const o: Obstacle = { type, root, active: false, lane: 1, z: -999, depth: 2, timer: 0 };
    if (type === 'insulator') {
      for (let i = 0; i < 3; i++) {
        const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.34 - i * 0.05, 0.38 - i * 0.05, 0.14, 10), this.dark);
        disk.position.y = 0.25 + i * 0.32;
        root.add(disk);
      }
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), this.steel);
      rod.position.y = 0.9;
      rod.rotation.z = 0.5;
      root.add(rod);
      o.depth = 1.6;
    } else if (type === 'platform') {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.24, 2.4), this.steel);
      deck.position.y = 0.5;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.08), this.steel);
      rail.position.set(0, 1.15, 1.1);
      const rail2 = rail.clone();
      rail2.position.z = -1.1;
      const lampGeo = new THREE.SphereGeometry(0.09, 8, 6);
      const lamp = new THREE.Mesh(lampGeo, this.amber);
      lamp.position.set(0.9, 1.2, 1.1);
      root.add(deck, rail, rail2, lamp);
      o.depth = 2.4;
    } else if (type === 'crane') {
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.6, 22, 0.6), this.steel);
      mast.position.y = -CFG.cableY + 11; // yerden kabloya
      const arm = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 0.4), this.steel);
      arm.position.y = 2.6;
      const cage = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.4), this.dark);
      cage.position.y = 0.6;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), this.amber);
      lamp.position.y = 3.0;
      root.add(mast, arm, cage, lamp);
      o.depth = 2.2;
    } else if (type === 'flock') {
      o.birds = [];
      const bmat = new THREE.MeshLambertMaterial({ color: 0x151a24 });
      for (let i = 0; i < 9; i++) {
        const b = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 5), bmat);
        b.rotation.x = Math.PI / 2;
        b.position.set(range(-2.6, 2.6), FLOCK_LOW + 0.6 + range(0, 1.8), range(-2.5, 2.5));
        o.birds.push(b);
        root.add(b);
      }
      o.depth = 6;
    } else {
      // strike — uyarı halkası + yıldırım çizgisi
      o.warn = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.warnTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
      o.warn.scale.setScalar(2.4);
      o.warn.position.y = 0.4;
      const pts: THREE.Vector3[] = [];
      let x = 0;
      for (let y = 26; y >= 0; y -= 2.4) {
        pts.push(new THREE.Vector3(x, y, 0));
        x += range(-0.9, 0.9);
      }
      o.bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.boltMat.clone());
      root.add(o.warn, o.bolt);
      o.depth = 1.8;
    }
    root.visible = false;
    this.scene.add(root);
    this.pool.push(o);
    return o;
  }

  private acquire(type: ObstacleType): Obstacle {
    const free = this.pool.find((o) => !o.active && o.type === type);
    return free ?? this.build(type);
  }

  private spawn(type: ObstacleType, lane: LaneIndex, z: number): void {
    const o = this.acquire(type);
    o.active = true;
    o.lane = lane;
    o.z = z;
    o.timer = 0;
    o.root.visible = true;
    this.spawnedCount++;
  }

  /** Bir z penceresinde aktif engel var mı? (toplanabilir yerleşimi çakışmasın diye) */
  isZoneFree(z: number, halfDepth: number): boolean {
    return !this.pool.some((o) => o.active && Math.abs(o.z - z) < halfDepth + o.depth);
  }

  private lastOffset = 0;

  /**
   * dz kadar dünya kaydı. distance: toplam mesafe (zorluk). stormy: yıldırım açık mı.
   * corridorOffset: kablo sarkması referansı (dünya ile aynı).
   */
  update(dt: number, dz: number, distance: number, stormy: boolean, timeStopped: boolean, corridorOffset: number): void {
    this.lastOffset = corridorOffset;
    // Yerleşim
    if (!timeStopped) {
      this.nextIn -= dz;
      if (this.nextIn <= 0) {
        this.place(distance, stormy);
        const difficulty = Math.min(distance / 3000, 1);
        this.nextIn = range(26, 44) * (1.12 - difficulty * 0.5);
      }
    }

    for (const o of this.pool) {
      if (!o.active) continue;
      o.z += dz;
      o.timer += dt;
      // Konum: kablo sarkmasını izleyen tipler
      const cable = cableHeightAt(o.z - corridorOffset);
      if (o.type === 'insulator' || o.type === 'platform') o.root.position.set(CFG.laneX[o.lane], cable - 0.1, o.z);
      else if (o.type === 'crane') o.root.position.set(CFG.laneX[o.lane], cable - 2.6, o.z);
      else if (o.type === 'flock') {
        o.root.position.set(CFG.laneX[o.lane] * 0.4, cable, o.z);
        if (o.birds) {
          for (let i = 0; i < o.birds.length; i++) {
            const b = o.birds[i];
            b.position.y += Math.sin(o.timer * 7 + i * 1.7) * dt * 1.2;
            b.scale.x = 1 + Math.sin(o.timer * 13 + i) * 0.35; // kanat çırpma hissi
          }
        }
      } else if (o.type === 'strike') {
        o.root.position.set(CFG.laneX[o.lane], cable, o.z);
        // Fazlar KONUMA bağlıdır (QA-1): uyarı yaklaşırken yanıp söner,
        // yıldırım oyuncu penceresinden geçerken aktiftir — hız ne olursa olsun.
        const warn = o.warn!.material as THREE.SpriteMaterial;
        const bolt = o.bolt!.material as THREE.LineBasicMaterial;
        if (o.z < STRIKE_ARM_Z) {
          warn.opacity = 0.45 + 0.4 * Math.sin(o.timer * 14);
          bolt.opacity = 0;
        } else if (o.z <= STRIKE_END_Z) {
          warn.opacity = 0;
          bolt.opacity = range(0.6, 1);
        } else {
          bolt.opacity = 0;
          this.release(o);
          continue;
        }
      }
      if (o.z > 16) this.release(o);
    }
  }

  private release(o: Obstacle): void {
    o.active = false;
    o.root.visible = false;
    o.z = -999;
  }

  private place(distance: number, stormy: boolean): void {
    const spawnZ = -CFG.towerSpacing * (CFG.spanCount - 2);
    const lanes: LaneIndex[] = [0, 1, 2];
    const l = (): LaneIndex => pick(lanes);
    const pattern = rng();
    if (stormy && pattern < 0.18) {
      // Yıldırım yakında doğar: nominal hızda ~2 sn uyarı süresi kalacak mesafede.
      const nomSpeed = Math.min(CFG.baseSpeed + (distance / 100) * CFG.speedRampPer100m, CFG.maxSpeed);
      this.spawn('strike', l(), STRIKE_ARM_Z - nomSpeed * 2.0);
    } else if (pattern < 0.3) {
      this.spawn('flock', 1, spawnZ);
    } else if (pattern < 0.5) {
      this.spawn('insulator', l(), spawnZ);
    } else if (pattern < 0.66) {
      // İki hatta zıplamalık engel — biri boş kalır
      const a = l();
      const b = ((a + 1) % 3) as LaneIndex;
      this.spawn('insulator', a, spawnZ);
      this.spawn('platform', b, spawnZ);
    } else if (pattern < 0.84) {
      this.spawn('crane', l(), spawnZ);
    } else {
      // Vinç + zıplanabilir engel: en az bir hat tamamen serbest kalır
      const a = l();
      const b = ((a + 1) % 3) as LaneIndex;
      this.spawn('crane', a, spawnZ);
      this.spawn('insulator', b, spawnZ);
    }
  }

  /** Çarpışma denetimi. Overcharge'da engel yok edilir. */
  check(player: Player): CollisionResult | null {
    const lane = player.occupiedLane;
    const relY = player.y - cableHeightAt(-this.lastOffset);
    for (const o of this.pool) {
      if (!o.active || Math.abs(o.z) > o.depth) continue;
      let blocked = false;
      if (o.type === 'flock') blocked = relY > FLOCK_LOW; // alçakta kal
      else if (o.type === 'crane') blocked = o.lane === lane; // her yükseklik
      else if (o.type === 'strike') blocked = o.lane === lane && o.z >= STRIKE_ARM_Z; // aktif yıldırım her yüksekliği kapatır
      else blocked = o.lane === lane && relY < JUMP_CLEAR; // zıplayarak aşılır
      if (!blocked) continue;
      if (player.overcharge > 0 && o.type !== 'strike') {
        this.release(o);
        return { kind: 'destroyed', type: o.type };
      }
      return { kind: 'hit', type: o.type };
    }
    return null;
  }

  reset(): void {
    for (const o of this.pool) this.release(o);
    this.nextIn = 40;
    this.spawnedCount = 0;
  }
}
