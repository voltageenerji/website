// Teklif formu — "yeşil enerji teklifi istiyorum" kutucuğu işaretlenince formun arka planında
// yavaşça beliren sade süsleme. Üç tema (sahip tasarımları 2026-11-11):
//   1 Zarif Yaprak  — ince çizgiyle çizilen yaprak dalı
//   2 Modern Enerji — akan ince çizgilerden kurdele
//   3 Doğal Doku    — ton üstü ton kabartma yapraklar
//   4 Çiçekli       — üç boyutlu sarmaşık ve çiçekler (cicek.ts)
// Yalnız süsleme: içeriğin arkasında durur, form verisine dokunmaz. WebGL yoksa yalnız renk geçişi kalır.
import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, DirectionalLight, DoubleSide, Float32BufferAttribute, Group,
  HemisphereLight, Line, LineBasicMaterial, Mesh, MeshStandardMaterial, NoToneMapping, PerspectiveCamera,
  SRGBColorSpace, Scene, Vector3, WebGLRenderer,
} from 'three';
import { kur as cicekKur } from './cicek';

const BELIRME_SN = 6; // yavaş belirme
const CEKILME_SN = 1.6;
const FOV = 30;

const sinirla = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const yumusak = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

interface Oge { guncelle(g: number, zaman: number): void }

export interface Sahne { ayarla(acik: boolean): void; kapat(): void }

// duragan: hareket azaltma tercihi açıkken canlandırma yapılmaz, son hâl tek karede çizilir
export function kur(form: HTMLElement, tema: number, duragan = false): Sahne | null {
  // 4 · Çiçekli sarmaşık (cicek.ts): kutucuk hizasından iki kenara büyür, çiçek açar
  if (tema === 4) {
    const c = cicekKur(form, duragan);
    if (!c) return null;
    return { ayarla: (acik: boolean): void => c.ayarla(acik, acik ? form.querySelector('#lead-yesil') : null), kapat: (): void => c.kapat() };
  }
  const katman = form.querySelector('.form-flora') as HTMLElement | null;
  if (!katman) return null;
  const tuval = document.createElement('canvas');
  tuval.className = 'flora-3d';
  let cizer: WebGLRenderer;
  try {
    cizer = new WebGLRenderer({ canvas: tuval, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    return null;
  }
  cizer.outputColorSpace = SRGBColorSpace;
  cizer.toneMapping = NoToneMapping;
  cizer.setClearColor(0x000000, 0);

  const sahne = new Scene();
  const kamera = new PerspectiveCamera(FOV, 1, 10, 9000);
  if (tema === 3) {
    sahne.add(new HemisphereLight('#ffffff', '#c9d6b8', 1.7));
    const isik = new DirectionalLight('#ffffff', 2.6);
    isik.position.set(-1, 0.35, 0.3);
    sahne.add(isik);
  }

  let ogeler: Oge[] = [];
  let gruplar: Group[] = [];

  // ── 1 · Zarif Yaprak: dal ve yaprak çevreleri tek çizgiyle, uçtan uca yavaşça çizilir
  function yaprakDali(kok: Group, k: number, faz: number): void {
    const boya = new LineBasicMaterial({ color: '#3f7f4c', transparent: true, opacity: 0.78, depthWrite: false });
    const egri = new CatmullRomCurve3([
      new Vector3(8, -4, 0), new Vector3(-40, -30, 4), new Vector3(-84, -72, 2), new Vector3(-108, -128, 5), new Vector3(-116, -180, 0),
    ].map((p) => p.multiplyScalar(k)));
    const sapN = 70;
    const sap = new Line(new BufferGeometry().setFromPoints(egri.getPoints(sapN)), boya);
    kok.add(sap);
    const yapraklar: { g: Group; cizgi: Line; n: number; t: number; aci: number; f: number }[] = [];
    const ekle = (t: number, yan: number, boy: number): void => {
      const p = egri.getPointAt(t);
      const tg = egri.getTangentAt(t);
      const n = 18;
      const nokta: Vector3[] = [];
      const en = (u: number): number => 0.25 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.82)), 1.15);
      for (let i = 0; i <= n; i++) nokta.push(new Vector3(-en(i / n), i / n, 0));
      for (let i = n - 1; i >= 0; i--) nokta.push(new Vector3(en(i / n), i / n, 0));
      for (let i = 1; i <= n; i++) nokta.push(new Vector3(Math.sin((i / n) * 3) * 0.02, (i / n) * 0.9, 0));
      const cizgi = new Line(new BufferGeometry().setFromPoints(nokta), boya);
      cizgi.geometry.setDrawRange(0, 0);
      const g = new Group();
      g.position.copy(p);
      const aci = Math.atan2(tg.y, tg.x) + yan * 0.85 - Math.PI / 2;
      g.rotation.set(-0.25, yan * 0.3, aci);
      g.scale.setScalar(boy * k);
      g.add(cizgi);
      kok.add(g);
      yapraklar.push({ g, cizgi, n: nokta.length, t, aci, f: faz + t * 9 });
    };
    [[0.2, 1, 40], [0.34, -1, 44], [0.48, 1, 42], [0.62, -1, 40], [0.76, 1, 36], [0.89, -1, 32], [1, 0, 34]].forEach((y) => ekle(y[0], y[1], y[2]));
    ogeler.push({
      guncelle(g: number, zaman: number): void {
        const p = yumusak(sinirla(g / 0.7));
        sap.geometry.setDrawRange(0, Math.ceil(p * (sapN + 1)));
        kok.rotation.z = Math.sin(zaman * 0.5 + faz) * 0.012 * g;
        for (const y of yapraklar) {
          const q = yumusak(sinirla((g - 0.12 - y.t * 0.5) / 0.38));
          y.cizgi.geometry.setDrawRange(0, Math.ceil(q * y.n));
          y.g.rotation.z = y.aci + Math.sin(zaman * 0.7 + y.f) * 0.045 * q;
          y.g.rotation.x = -0.25 + Math.sin(zaman * 0.55 + y.f * 1.3) * 0.12 * q;
        }
      },
    });
  }

  // ── 2 · Modern Enerji: sağ kenardan sola akan, kendi üstüne dönen ince çizgi kurdelesi
  function kurdele(kok: Group, k: number, uzunluk: number, faz: number): void {
    const N = 30;
    const P = 84;
    const boya = new LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false });
    const koyu = new Color('#3f8f52');
    const acik = new Color('#9fd0a0');
    const c = new Color();
    const cizgiler: { geo: BufferGeometry; pos: Float32Array; s: number }[] = [];
    for (let i = 0; i < N; i++) {
      const s = (i / (N - 1)) * 2 - 1;
      const pos = new Float32Array(P * 3);
      const renk = new Float32Array(P * 4);
      c.copy(koyu).lerp(acik, Math.abs(s));
      for (let j = 0; j < P; j++) {
        const u = j / (P - 1);
        renk[j * 4] = c.r;
        renk[j * 4 + 1] = c.g;
        renk[j * 4 + 2] = c.b;
        renk[j * 4 + 3] = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.04)), 0.7) * (0.2 + 0.5 * (1 - Math.abs(s)));
      }
      const geo = new BufferGeometry();
      geo.setAttribute('position', new BufferAttribute(pos, 3));
      geo.setAttribute('color', new BufferAttribute(renk, 4));
      geo.setDrawRange(0, 0);
      const cizgi = new Line(geo, boya);
      cizgi.frustumCulled = false;
      kok.add(cizgi);
      cizgiler.push({ geo, pos, s });
    }
    ogeler.push({
      guncelle(g: number, zaman: number): void {
        const t = zaman * 0.22 + faz;
        const acilan = Math.ceil(yumusak(g) * P);
        boya.opacity = sinirla(g * 1.6);
        for (const l of cizgiler) {
          for (let j = 0; j < P; j++) {
            const u = j / (P - 1);
            const orta = -30 * k - 34 * k * u + 24 * k * Math.sin(u * 4.6 + t * 1.3);
            const yari = 30 * k * Math.sin(Math.PI * Math.pow(u, 0.7)) * Math.cos(u * 6.2 - t);
            const yz = 30 * k * Math.sin(Math.PI * Math.pow(u, 0.7)) * Math.sin(u * 6.2 - t);
            l.pos[j * 3] = 12 - u * uzunluk;
            l.pos[j * 3 + 1] = orta + l.s * yari + 5 * k * u * Math.sin(u * 9 + l.s * 3 + t * 2);
            l.pos[j * 3 + 2] = l.s * yz;
          }
          l.geo.getAttribute('position').needsUpdate = true;
          l.geo.setDrawRange(0, acilan);
        }
      },
    });
  }

  // ── 3 · Doğal Doku: zemin tonunda, ışıkla kabaran iri yapraklar
  function kabartma(kok: Group, k: number, faz: number): void {
    const nu = 16;
    const nv = 8;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const w = 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 1.1);
      for (let j = 0; j <= nv; j++) {
        const v = (j / nv) * 2 - 1;
        // orta damar çukur, yanlar kabarık; ince yan damar dalgası
        pos.push(v * w, u, (0.16 * Math.abs(v) - 0.05 * v * v) * w * 3 + Math.sin(u * 26 - Math.abs(v) * 5) * 0.004 * (1 - Math.abs(v)));
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const p = i * (nv + 1) + j;
      const q = p + nv + 1;
      idx.push(p, p + 1, q + 1, p, q + 1, q);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const boya = new MeshStandardMaterial({ color: '#cfdcbd', roughness: 0.95, side: DoubleSide, transparent: true, opacity: 0, depthWrite: false });
    const yapraklar: { m: Mesh; aci: number; f: number; boy: number }[] = [];
    [[24, -214, 0.5, 190], [34, -138, 1.02, 150], [4, -250, 0.12, 132]].forEach((y, i) => {
      const m = new Mesh(geo, boya);
      m.position.set(y[0] * k, y[1] * k, i * 2);
      m.rotation.set(-0.12, 0.1, y[2]);
      kok.add(m);
      yapraklar.push({ m, aci: y[2], f: faz + i * 2.1, boy: y[3] * k });
    });
    ogeler.push({
      guncelle(g: number, zaman: number): void {
        boya.opacity = yumusak(g) * 0.95;
        for (const y of yapraklar) {
          y.m.scale.setScalar(y.boy * (0.94 + 0.06 * yumusak(g)));
          y.m.rotation.z = y.aci + Math.sin(zaman * 0.35 + y.f) * 0.014;
          y.m.rotation.y = 0.1 + Math.sin(zaman * 0.3 + y.f * 1.4) * 0.05;
        }
      },
    });
  }

  let W = 0;
  let H = 0;
  let butce = 2400000; // tuvalin cihaz pikseli bütçesi (uzun formda telefon belleğini korur)
  let iz = '';

  function boyutla(): void {
    const w = form.offsetWidth;
    const h = form.offsetHeight;
    if (!w || !h) return;
    W = w;
    H = h;
    const piksel = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(butce / (w * h)));
    cizer.setPixelRatio(piksel);
    cizer.setSize(w, h, false);
    kamera.aspect = w / h;
    kamera.position.set(0, 0, h / 2 / Math.tan((FOV * Math.PI) / 360));
    kamera.far = kamera.position.z * 2;
    kamera.updateProjectionMatrix();
    const kart = form.querySelector('.form-green') as HTMLElement | null;
    const altY = kart ? h / 2 - (kart.offsetTop + kart.offsetHeight) : null;
    const k = Math.max(0.8, Math.min(1.15, w / 440));
    const yeni = [w, h, altY, k].join('/');
    if (yeni === iz) return;
    iz = yeni;
    for (const g of gruplar) sahne.remove(g);
    gruplar = [];
    ogeler = [];
    // Biri başlığın yanında (sağ üst köşe), öbürü kutucuğun hemen altında: işaretleyen kişi onu görür
    const yerler: number[][] = [[w / 2, h / 2, 1, 0]];
    if (altY !== null) yerler.push([w / 2, altY + (tema === 2 ? 40 * k : 8 * k), 0.86, 2.4]);
    for (const y of yerler) {
      const g = new Group();
      g.position.set(y[0], y[1], 0);
      if (tema === 1) yaprakDali(g, k * y[2], y[3]);
      else if (tema === 3) kabartma(g, k * y[2], y[3]);
      else kurdele(g, k * y[2], Math.min(w * 1.02, 470 * k), y[3]);
      sahne.add(g);
      gruplar.push(g);
    }
  }

  let g = 0;
  let hedef = 0;
  let zaman = 0;
  let son = 0;
  let raf = 0;
  let gorunur = true;
  let kapali = false;
  let sayac = 0;

  function kare(simdi: number): void {
    raf = 0;
    if (kapali || !tuval.isConnected) return;
    // Belirme bittikten sonra yarı hızda çiz (ağır salınım için yeterli, telefonda daha hafif)
    if (g >= 1 && hedef === 1 && (sayac++ & 1) === 1) { raf = requestAnimationFrame(kare); return; }
    const dt = Math.min(0.05, Math.max(0, (simdi - son) / 1000));
    son = simdi;
    zaman += dt;
    if (hedef > g) g = Math.min(1, g + dt / BELIRME_SN);
    else if (hedef < g) g = Math.max(0, g - dt / CEKILME_SN);
    for (const o of ogeler) o.guncelle(g, zaman);
    cizer.render(sahne, kamera);
    if (g <= 0 && hedef === 0) { tuval.style.visibility = 'hidden'; return; }
    if (!gorunur || duragan) return;
    raf = requestAnimationFrame(kare);
  }
  function calistir(): void {
    if (raf || kapali) return;
    son = performance.now();
    raf = requestAnimationFrame(kare);
  }

  const boyutGozcu = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { if (tuval.isConnected) { boyutla(); if (g > 0) calistir(); } }) : null;
  if (boyutGozcu) boyutGozcu.observe(form);
  const gorunurGozcu = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((k) => { gorunur = k[k.length - 1].isIntersecting; if (gorunur && (g > 0 || hedef === 1)) calistir(); }, { rootMargin: '80px' })
    : null;
  if (gorunurGozcu) gorunurGozcu.observe(form);

  const api: Sahne = {
    ayarla(acik: boolean): void {
      if (kapali) return;
      hedef = acik ? 1 : 0;
      if (acik) {
        if (!tuval.isConnected) katman.appendChild(tuval);
        boyutla();
        tuval.style.visibility = 'visible';
      }
      if (duragan) g = hedef;
      if (W && H) calistir();
    },
    kapat(): void {
      kapali = true;
      if (raf) cancelAnimationFrame(raf);
      if (boyutGozcu) boyutGozcu.disconnect();
      if (gorunurGozcu) gorunurGozcu.disconnect();
      tuval.remove();
      cizer.dispose();
    },
  };
  tuval.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    api.kapat();
    form.dispatchEvent(new CustomEvent('yesil3d-kayip'));
  });
  return api;
}
