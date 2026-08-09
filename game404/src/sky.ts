import * as THREE from 'three';
import { pick, range, rng } from './rng';

// Günün saati + hava, oturum başına rastgele seçilir. Her preset; gökyüzü
// degrade renkleri, sis, ışık, bloom ve hava tipini birlikte tanımlar —
// böylece kombinasyonlar her zaman tutarlı ve "pahalı" görünür.
export type WeatherKind = 'clear' | 'rain' | 'heavyrain' | 'fog' | 'wind';

export interface DayPreset {
  name: string;
  skyTop: string; skyMid: string; skyBottom: string;
  fogColor: string; fogDensity: number;
  hemiSky: string; hemiGround: string; hemiInt: number;
  sunColor: string; sunInt: number; sunDir: [number, number, number];
  stars: boolean; moon: boolean;
  exposure: number; bloom: number;
  weather: WeatherKind; lightning: boolean;
  windLevel: number; // 0..1 — ses + yağmur eğimi + kamera salınımı
}

const PRESETS: DayPreset[] = [
  { name: 'night', skyTop: '#02030a', skyMid: '#050a18', skyBottom: '#0a1226', fogColor: '#060b16', fogDensity: 0.0062, hemiSky: '#1a2c4a', hemiGround: '#05070d', hemiInt: 0.5, sunColor: '#a8c6e8', sunInt: 0.25, sunDir: [-40, 60, -30], stars: true, moon: false, exposure: 1.05, bloom: 0.85, weather: 'clear', lightning: false, windLevel: 0.2 },
  { name: 'moonlit', skyTop: '#030614', skyMid: '#081226', skyBottom: '#12203c', fogColor: '#0a1424', fogDensity: 0.0052, hemiSky: '#26405f', hemiGround: '#070a12', hemiInt: 0.65, sunColor: '#cfe0f5', sunInt: 0.5, sunDir: [50, 70, -40], stars: true, moon: true, exposure: 1.1, bloom: 0.75, weather: 'wind', lightning: false, windLevel: 0.45 },
  { name: 'bluehour', skyTop: '#071228', skyMid: '#122a52', skyBottom: '#2c4a80', fogColor: '#16294a', fogDensity: 0.005, hemiSky: '#3a5a8f', hemiGround: '#0a0f1a', hemiInt: 0.8, sunColor: '#9fc0ea', sunInt: 0.4, sunDir: [-60, 25, -50], stars: false, moon: false, exposure: 1.12, bloom: 0.65, weather: 'clear', lightning: false, windLevel: 0.25 },
  { name: 'sunset', skyTop: '#0c1430', skyMid: '#4a3060', skyBottom: '#c96a3a', fogColor: '#3a2c46', fogDensity: 0.0048, hemiSky: '#6a4a70', hemiGround: '#140e14', hemiInt: 0.85, sunColor: '#ffb066', sunInt: 0.9, sunDir: [-80, 12, -70], stars: false, moon: false, exposure: 1.08, bloom: 0.7, weather: 'clear', lightning: false, windLevel: 0.3 },
  { name: 'golden', skyTop: '#12203c', skyMid: '#6a5638', skyBottom: '#d9964a', fogColor: '#4a3c2c', fogDensity: 0.0044, hemiSky: '#8a7350', hemiGround: '#161006', hemiInt: 0.95, sunColor: '#ffcf8a', sunInt: 1.1, sunDir: [70, 15, -60], stars: false, moon: false, exposure: 1.05, bloom: 0.6, weather: 'wind', lightning: false, windLevel: 0.4 },
  { name: 'storm', skyTop: '#04060e', skyMid: '#0c1220', skyBottom: '#1a2334', fogColor: '#0b111d', fogDensity: 0.0085, hemiSky: '#243349', hemiGround: '#05070c', hemiInt: 0.45, sunColor: '#8fa8c8', sunInt: 0.2, sunDir: [30, 55, -40], stars: false, moon: false, exposure: 1.0, bloom: 0.95, weather: 'heavyrain', lightning: true, windLevel: 0.85 },
  { name: 'fog', skyTop: '#0a101e', skyMid: '#141d30', skyBottom: '#222e44', fogColor: '#161f30', fogDensity: 0.016, hemiSky: '#2c3a52', hemiGround: '#0a0d14', hemiInt: 0.6, sunColor: '#a8b8d0', sunInt: 0.3, sunDir: [0, 60, -40], stars: false, moon: false, exposure: 1.06, bloom: 0.55, weather: 'fog', lightning: false, windLevel: 0.1 },
  { name: 'rain', skyTop: '#04070f', skyMid: '#0a1322', skyBottom: '#16233a', fogColor: '#0c1524', fogDensity: 0.0072, hemiSky: '#22344e', hemiGround: '#06080e', hemiInt: 0.55, sunColor: '#9ab4d6', sunInt: 0.3, sunDir: [-30, 65, -35], stars: false, moon: false, exposure: 1.04, bloom: 0.8, weather: 'rain', lightning: false, windLevel: 0.5 },
];

export function pickPreset(): DayPreset {
  return pick(PRESETS);
}

function gradientTexture(top: string, mid: string, bottom: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 4;
  cv.height = 512;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, top);
  g.addColorStop(0.62, mid);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Radyal parlama dokusu — glow sprite'ları ve ay için ortak üretim. */
export function glowTexture(inner: string, outer: string, size = 128): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.4, outer);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Sky {
  readonly group = new THREE.Group();
  readonly hemi: THREE.HemisphereLight;
  readonly sun: THREE.DirectionalLight;
  readonly preset: DayPreset;
  private dome: THREE.Mesh;
  private stars: THREE.Points | null = null;
  private rain: THREE.Points | null = null;
  private rainVel: Float32Array | null = null;

  constructor(scene: THREE.Scene) {
    this.preset = pickPreset();
    const p = this.preset;

    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(900, 24, 16),
      new THREE.MeshBasicMaterial({ map: gradientTexture(p.skyTop, p.skyMid, p.skyBottom), side: THREE.BackSide, fog: false, depthWrite: false }),
    );
    this.group.add(this.dome);

    scene.fog = new THREE.FogExp2(new THREE.Color(p.fogColor), p.fogDensity);
    scene.background = null;

    this.hemi = new THREE.HemisphereLight(new THREE.Color(p.hemiSky), new THREE.Color(p.hemiGround), p.hemiInt);
    this.sun = new THREE.DirectionalLight(new THREE.Color(p.sunColor), p.sunInt);
    this.sun.position.set(...p.sunDir);
    this.group.add(this.hemi, this.sun);

    if (p.stars) this.buildStars();
    if (p.moon) this.buildMoon();
    if (p.weather === 'rain' || p.weather === 'heavyrain') this.buildRain(p.weather === 'heavyrain');

    scene.add(this.group);
  }

  private buildStars(): void {
    const n = 420;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // Kubbe üzerinde, ufkun üstünde
      const az = rng() * Math.PI * 2;
      const el = 0.12 + rng() * 1.35;
      const r = 820;
      pos[i * 3] = r * Math.cos(el) * Math.cos(az);
      pos[i * 3 + 1] = r * Math.sin(el);
      pos[i * 3 + 2] = r * Math.cos(el) * Math.sin(az);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbfd0e8, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false, depthWrite: false }));
    this.group.add(this.stars);
  }

  private buildMoon(): void {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(235,242,255,0.95)', 'rgba(160,190,235,0.25)'), fog: false, depthWrite: false, transparent: true }));
    sp.position.set(180, 420, -650);
    sp.scale.setScalar(140);
    this.group.add(sp);
  }

  private buildRain(heavy: boolean): void {
    const n = heavy ? 1500 : 800;
    const pos = new Float32Array(n * 3);
    this.rainVel = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = range(-35, 35);
      pos[i * 3 + 1] = range(0, 45);
      pos[i * 3 + 2] = range(-90, 12);
      this.rainVel[i] = range(38, 55);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      map: glowTexture('rgba(190,215,240,0.9)', 'rgba(150,180,220,0.2)', 32),
      color: 0x9fbcd8, size: heavy ? 0.16 : 0.12, transparent: true, opacity: heavy ? 0.5 : 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.rain = new THREE.Points(geo, mat);
    this.group.add(this.rain);
  }

  /** Kamera merkezli hava güncellemesi. */
  update(dt: number, camZ: number): void {
    if (this.rain && this.rainVel) {
      const arr = (this.rain.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
      const windX = this.preset.windLevel * 9;
      for (let i = 0; i < this.rainVel.length; i++) {
        arr[i * 3 + 1] -= this.rainVel[i] * dt;
        arr[i * 3] += windX * dt;
        if (arr[i * 3 + 1] < 0) { arr[i * 3 + 1] = 45; arr[i * 3] = range(-35, 35); arr[i * 3 + 2] = camZ + range(-90, 12); }
        if (arr[i * 3] > 38) arr[i * 3] = -38;
      }
      (this.rain.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    }
    this.dome.position.z = camZ;
    if (this.stars) this.stars.position.z = camZ;
  }
}
