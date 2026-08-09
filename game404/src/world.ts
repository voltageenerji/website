import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CFG } from './config';
import { glowTexture } from './sky';
import { range, rng } from './rng';

// Sonsuz iletim koridoru. İki kaydırma hilesi kullanılır:
//  - Kule + kablo grubu her direk aralığında (towerSpacing) periyodiktir;
//    grubun z ofseti "scroll % spacing" ile kaydırılır → dikişsiz sonsuzluk.
//  - Uzak saha nesneleri (türbin, trafo merkezi) tek tek geri sarılır.
const CORRIDOR_LEN = CFG.towerSpacing * CFG.spanCount;
const SAG = 1.1; // kablo sarkması (span ortasında)

/** Span içi kablo yüksekliği — oyuncu ve akım darbeleri de aynı formülü kullanır. */
export function cableHeightAt(z: number): number {
  const t = ((z % CFG.towerSpacing) + CFG.towerSpacing) % CFG.towerSpacing / CFG.towerSpacing;
  return CFG.cableY - SAG * 4 * t * (1 - t);
}

function boxAt(w: number, h: number, d: number, x: number, y: number, z: number, rz = 0, rx = 0): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Matrix4()
    .makeTranslation(x, y, z)
    .multiply(new THREE.Matrix4().makeRotationZ(rz))
    .multiply(new THREE.Matrix4().makeRotationX(rx));
  g.applyMatrix4(m);
  return g;
}

/** Çelik kafes direk — kutulardan birleştirilmiş tek geometri, InstancedMesh ile çoğaltılır. */
function buildTowerGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const H = 16;
  const baseHalf = 2.0;
  const topHalf = 0.55;
  // 4 bacak: içe eğimli
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const bx = sx * baseHalf;
      const tx = sx * topHalf;
      const bz = sz * baseHalf * 0.7;
      const tz = sz * topHalf * 0.7;
      const midX = (bx + tx) / 2;
      const midZ = (bz + tz) / 2;
      const len = Math.hypot(H, bx - tx);
      const ang = Math.atan2(bx - tx, H);
      const g = new THREE.BoxGeometry(0.14, len, 0.14);
      g.applyMatrix4(new THREE.Matrix4().makeRotationZ(sx > 0 ? -ang : ang));
      g.applyMatrix4(new THREE.Matrix4().makeTranslation(midX, H / 2, midZ));
      parts.push(g);
    }
  }
  // Yatay kuşaklar + X çaprazlar
  for (let y = 2.5; y < H; y += 3.4) {
    const half = baseHalf - (baseHalf - topHalf) * (y / H);
    parts.push(boxAt(half * 2, 0.1, 0.1, 0, y, half * 0.7));
    parts.push(boxAt(half * 2, 0.1, 0.1, 0, y, -half * 0.7));
    parts.push(boxAt(half * 2 * 1.35, 0.08, 0.08, 0, y + 1.6, half * 0.7 * 0.9, Math.PI / 5));
    parts.push(boxAt(half * 2 * 1.35, 0.08, 0.08, 0, y + 1.6, -half * 0.7 * 0.9, -Math.PI / 5));
  }
  // Konsol kolu (traves) — 3 iletken için
  parts.push(boxAt(7.4, 0.22, 0.5, 0, CFG.cableY + 0.9, 0));
  parts.push(boxAt(7.0, 0.12, 0.12, 0, CFG.cableY + 1.7, 0));
  // İzolatör zincirleri
  for (const lx of CFG.laneX) {
    parts.push(boxAt(0.09, 0.9, 0.09, lx, CFG.cableY + 0.45, 0));
  }
  // Tepe (toprak teli) piramidi
  parts.push(boxAt(0.12, 2.2, 0.12, 0, H + 1.1, 0));
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged!;
}

export class World {
  readonly group = new THREE.Group();
  /** 0..1 — şebekenin "güçlenmişlik" seviyesi (intro power-up bununla sahneyi uyandırır) */
  power = 0.18;
  private corridor = new THREE.Group();
  private towers: THREE.InstancedMesh;
  private cableMat: THREE.LineBasicMaterial;
  private pulses: THREE.Sprite[] = [];
  private pulseLane: number[] = [];
  private turbines: { root: THREE.Group; rotor: THREE.Group; speed: number }[] = [];
  private cityMat: THREE.PointsMaterial;
  private substations: { root: THREE.Group; lamp: THREE.Sprite }[] = [];
  private scroll = 0;
  private towerMatrix = new THREE.Matrix4();
  // Kare başı ayırma yapmamak için önceden oluşturulan renkler (QA notu 3)
  private cableBase = new THREE.Color(0x39435a);
  private cableHot = new THREE.Color(0x4a7a9a);

  constructor(scene: THREE.Scene) {
    // Zemin
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2400, 2400),
      new THREE.MeshLambertMaterial({ color: 0x0a0f18 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    this.group.add(ground);

    // Dağ silüetleri (iki katman, sabit — atmosferik derinlik)
    for (const [dist, h, c] of [[-620, 90, 0x0b1220], [-780, 140, 0x070d18]] as const) {
      const m = new THREE.Mesh(this.ridgeGeometry(1800, h), new THREE.MeshBasicMaterial({ color: c, fog: false }));
      m.position.set(0, 0, dist);
      this.group.add(m);
    }

    // Kuleler
    const towerGeo = buildTowerGeometry();
    const towerMat = new THREE.MeshLambertMaterial({ color: 0x2a3242 });
    this.towers = new THREE.InstancedMesh(towerGeo, towerMat, CFG.spanCount + 2);
    this.corridor.add(this.towers);

    // Kablolar — 3 iletken + sarkma eğrisi
    this.cableMat = new THREE.LineBasicMaterial({ color: 0x39435a, transparent: true, opacity: 0.9 });
    const ptsPerSpan = 10;
    for (const lx of CFG.laneX) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= (CFG.spanCount + 1) * ptsPerSpan; i++) {
        const z = -i * (CFG.towerSpacing / ptsPerSpan);
        pts.push(new THREE.Vector3(lx, cableHeightAt(z), z));
      }
      this.corridor.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.cableMat));
    }
    // Toprak teli (tepe)
    const gw: THREE.Vector3[] = [];
    for (let i = 0; i <= (CFG.spanCount + 1) * 2; i++) gw.push(new THREE.Vector3(0, 17.1 - 0.4 * (i % 2), -i * (CFG.towerSpacing / 2)));
    this.corridor.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(gw), new THREE.LineBasicMaterial({ color: 0x2a3242, transparent: true, opacity: 0.7 })));
    this.group.add(this.corridor);

    // Akım darbeleri — güç geldiğinde kablolar boyunca akan ışık zerreleri
    const pulseTex = glowTexture('rgba(210,240,255,1)', 'rgba(80,180,255,0.35)', 64);
    for (let i = 0; i < 10; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pulseTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
      sp.scale.setScalar(0.9);
      const lane = Math.floor(rng() * 3);
      sp.position.set(CFG.laneX[lane], CFG.cableY, -rng() * CORRIDOR_LEN);
      this.pulses.push(sp);
      this.pulseLane.push(lane);
      this.group.add(sp);
    }

    // Şehir ışıkları — ufukta iki yakada nokta bulutu
    const cn = 380;
    const cpos = new Float32Array(cn * 3);
    const ccol = new Float32Array(cn * 3);
    const warm = new THREE.Color(0xffc37a);
    const cool = new THREE.Color(0x9fc4ee);
    for (let i = 0; i < cn; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      cpos[i * 3] = side * range(70, 420);
      cpos[i * 3 + 1] = range(0.5, 4);
      cpos[i * 3 + 2] = -range(80, 780);
      const c = rng() > 0.35 ? warm : cool;
      ccol[i * 3] = c.r; ccol[i * 3 + 1] = c.g; ccol[i * 3 + 2] = c.b;
    }
    const cgeo = new THREE.BufferGeometry();
    cgeo.setAttribute('position', new THREE.BufferAttribute(cpos, 3));
    cgeo.setAttribute('color', new THREE.BufferAttribute(ccol, 3));
    this.cityMat = new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.0, fog: false, depthWrite: false });
    this.group.add(new THREE.Points(cgeo, this.cityMat));

    // Rüzgâr türbinleri — uzak yamaçlarda
    for (let i = 0; i < 6; i++) this.buildTurbine(-i * (CORRIDOR_LEN / 6) - range(0, 40));
    // Trafo merkezleri
    for (let i = 0; i < 2; i++) this.buildSubstation(-i * (CORRIDOR_LEN / 2) - range(60, 200));

    scene.add(this.group);
  }

  private ridgeGeometry(width: number, height: number): THREE.BufferGeometry {
    // Basit sırt çizgisi silüeti — ShapeGeometry
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const x = -width / 2 + (i / n) * width;
      const y = Math.max(0, Math.sin(i * 1.7) * 0.5 + Math.sin(i * 0.61 + 2) * 0.5) * height + rng() * height * 0.15;
      shape.lineTo(x, y);
    }
    shape.lineTo(width / 2, 0);
    return new THREE.ShapeGeometry(shape);
  }

  private buildTurbine(z: number): void {
    const root = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x3a4356 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 26, 6), mat);
    pole.position.y = 13;
    const rotor = new THREE.Group();
    rotor.position.set(0, 26, 0.8);
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 11, 0.12), mat);
      blade.position.y = 5.5;
      const holder = new THREE.Group();
      holder.rotation.z = (b * Math.PI * 2) / 3;
      holder.add(blade);
      rotor.add(holder);
    }
    root.add(pole, rotor);
    const side = rng() > 0.5 ? 1 : -1;
    root.position.set(side * range(45, 95), 0, z);
    this.turbines.push({ root, rotor, speed: range(0.5, 1.1) });
    this.group.add(root);
  }

  private buildSubstation(z: number): void {
    const root = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x232b3a });
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(range(3, 7), range(2, 5), range(3, 6)), mat);
      b.position.set(range(-8, 8), b.geometry.parameters.height / 2, range(-6, 6));
      root.add(b);
    }
    // Amber uyarı ışığı
    const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,190,90,0.95)', 'rgba(200,120,40,0.2)', 64), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.0 }));
    lamp.position.set(0, 6.5, 0);
    lamp.scale.setScalar(2.2);
    root.add(lamp);
    const side = rng() > 0.5 ? 1 : -1;
    root.position.set(side * range(28, 46), 0, z);
    this.substations.push({ root, lamp });
    this.group.add(root);
  }

  /** Koridorun anlık kayma ofseti — kablo yüksekliği hesapları bunu referans alır. */
  get corridorOffset(): number {
    return this.scroll % CFG.towerSpacing;
  }

  /** dz: bu karede dünyanın oyuncuya doğru kaydığı mesafe. */
  update(dt: number, dz: number, elapsed: number): void {
    this.scroll += dz;
    // Koridor: periyodik kaydırma
    const slide = this.scroll % CFG.towerSpacing;
    this.corridor.position.z = slide;
    for (let i = 0; i < CFG.spanCount + 2; i++) {
      this.towerMatrix.makeTranslation(0, 0, -i * CFG.towerSpacing);
      this.towers.setMatrixAt(i, this.towerMatrix);
    }
    this.towers.instanceMatrix.needsUpdate = true;

    // Güç seviyesi görselleri
    const powered = this.power;
    this.cityMat.opacity = powered * 0.9;
    this.cableMat.color.copy(this.cableBase).lerp(this.cableHot, powered * 0.6);
    for (const s of this.substations) {
      (s.lamp.material as THREE.SpriteMaterial).opacity = powered * (0.55 + 0.45 * Math.sin(elapsed * 2.2 + s.root.position.z));
      s.root.position.z += dz;
      if (s.root.position.z > 60) { s.root.position.z -= CORRIDOR_LEN; s.root.position.x = (rng() > 0.5 ? 1 : -1) * range(28, 46); }
    }
    for (const t of this.turbines) {
      t.rotor.rotation.z += t.speed * dt * (0.4 + powered);
      t.root.position.z += dz;
      if (t.root.position.z > 60) { t.root.position.z -= CORRIDOR_LEN; t.root.position.x = (rng() > 0.5 ? 1 : -1) * range(45, 95); }
    }

    // Akım darbeleri — kablo boyunca akar, güç yoksa görünmez
    for (let i = 0; i < this.pulses.length; i++) {
      const sp = this.pulses[i];
      sp.position.z -= (34 + i * 2) * dt;
      if (sp.position.z < -CORRIDOR_LEN) {
        sp.position.z = 20;
        this.pulseLane[i] = Math.floor(rng() * 3);
      }
      sp.position.x = CFG.laneX[this.pulseLane[i]];
      sp.position.y = cableHeightAt(sp.position.z - this.corridor.position.z);
      (sp.material as THREE.SpriteMaterial).opacity = powered > 0.4 ? (powered - 0.4) * 1.2 : 0;
    }
  }
}
