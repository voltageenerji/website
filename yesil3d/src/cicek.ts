// Teklif formu — "yeşil enerji teklifi istiyorum" kutucuğu işaretlenince formun çevresinde
// üç boyutlu sarmaşık büyür, yapraklar açılır, çiçekler açar. Yalnız süsleme: form verisine dokunmaz.
// Sayfa bu dosyayı ilk form etkileşiminde yükler; WebGL yoksa SVG süsleme (index.html) yerinde kalır.
import {
  BufferGeometry, CatmullRomCurve3, Color, DirectionalLight, DoubleSide, DynamicDrawUsage, Euler,
  Float32BufferAttribute, Group, HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  NoToneMapping, PerspectiveCamera, Points, Quaternion, SRGBColorSpace, Scene, ShaderMaterial,
  SphereGeometry, TubeGeometry, Vector3, WebGLRenderer,
} from 'three';

const BUYUME_SN = 7; // tam açılma süresi
const CEKILME_SN = 1.4; // kutucuk kaldırılınca geri çekilme
const FOV = 34;

const sinirla = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const yumusak = (x: number): number => 1 - Math.pow(1 - x, 3);
const yayli = (x: number): number => {
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const rastgele = (tohum: number): (() => number) => {
  let s = tohum >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

interface YuzeyAyar { tepe: number; sivri: number; canak: number; kat: number; kivrim: number; dip: string; uc: string }

// Yaprak / taç yaprağı yüzeyi: +Y boyunca uzanır, tabanı orijinde, yüzü +Z'ye bakar. Boy = 1 birim.
function yuzey(en: number, a: YuzeyAyar): BufferGeometry {
  const nu = 10;
  const nv = 6;
  const pos: number[] = [];
  const renk: number[] = [];
  const idx: number[] = [];
  const dip = new Color(a.dip);
  const uc = new Color(a.uc);
  const c = new Color();
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const w = en * Math.pow(Math.sin(Math.PI * Math.pow(u, a.tepe)), a.sivri);
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1;
      pos.push(v * w, u, a.canak * v * v * w + a.kat * Math.abs(v) * w + a.kivrim * u * u);
      c.copy(dip).lerp(uc, Math.min(1, u * 0.9 + Math.abs(v) * 0.22));
      renk.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const p = i * (nv + 1) + j;
      const q = p + nv + 1;
      idx.push(p, p + 1, q + 1, p, q + 1, q);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(renk, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

type Tur = 'pembe' | 'beyaz' | 'altin';

interface TacYapragi { mil: Group; acik: number; kapali: number; gecikme: number; boy: number }
interface Cicek { g: Group; tac: TacYapragi[]; goz: Group; basla: number; sure: number; bx: number; by: number; faz: number }
interface Yaprak { g: Group; ic: Mesh; basla: number; boy: number; aci: number; egim: number; faz: number }
interface Dal { g: Group; egri: CatmullRomCurve3; boru: TubeGeometry; dilim: number; g0: number; g1: number; salinim: number; faz: number }

export interface Sahne { ayarla(acik: boolean, kaynak?: Element | null): void; kapat(): void }

export function kur(form: HTMLElement, duragan = false): Sahne | null {
  const tuval = document.createElement('canvas');
  tuval.className = 'flora-3d';
  tuval.setAttribute('aria-hidden', 'true');
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
  const kamera = new PerspectiveCamera(FOV, 1, 10, 8000);
  sahne.add(new HemisphereLight('#ffffff', '#a9c99a', 2.3));
  const gunes = new DirectionalLight('#fff1dc', 2.1);
  gunes.position.set(-0.55, 0.8, 1);
  sahne.add(gunes);

  const boya = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.66, metalness: 0 });
  const gozBoya = new MeshStandardMaterial({ color: '#d9a233', roughness: 0.5 });
  const tozBoya = new MeshStandardMaterial({ color: '#f6df9a', roughness: 0.5 });
  const kure = new SphereGeometry(1, 12, 8);

  const tacGeo: Record<Tur, BufferGeometry> = {
    pembe: yuzey(0.36, { tepe: 1.5, sivri: 0.8, canak: 0.42, kat: 0, kivrim: -0.16, dip: '#d95f8b', uc: '#fbdde6' }),
    beyaz: yuzey(0.37, { tepe: 1.5, sivri: 0.8, canak: 0.42, kat: 0, kivrim: -0.16, dip: '#eea3b8', uc: '#fffaf6' }),
    altin: yuzey(0.33, { tepe: 1.4, sivri: 0.85, canak: 0.4, kat: 0, kivrim: -0.14, dip: '#d18f1f', uc: '#f8e08f' }),
  };
  const yaprakGeo = [
    yuzey(0.3, { tepe: 0.75, sivri: 1.1, canak: 0, kat: 0.5, kivrim: -0.22, dip: '#2c6639', uc: '#84bd6d' }),
    yuzey(0.27, { tepe: 0.8, sivri: 1.15, canak: 0, kat: 0.55, kivrim: -0.26, dip: '#24552f', uc: '#5c9c5a' }),
  ];
  const ucanGeo = yuzey(0.36, { tepe: 1.5, sivri: 0.8, canak: 0.42, kat: 0, kivrim: -0.16, dip: '#f1f1f1', uc: '#ffffff' });
  const TURLER: Tur[] = ['beyaz', 'altin', 'pembe'];

  const dallar: Dal[] = [];
  const yapraklar: Yaprak[] = [];
  const cicekler: Cicek[] = [];
  let kurulan: Group[] = [];
  let rnd = rastgele(20261111);

  function dalKur(ust: Group, kok: Vector3, noktalar: number[][], r0: number, r1: number, g0: number, g1: number, salinim: number): Dal {
    const g = new Group();
    g.position.copy(kok);
    ust.add(g);
    const egri = new CatmullRomCurve3([new Vector3(0, 0, 0)].concat(noktalar.map((p) => new Vector3(p[0], p[1], p[2]))));
    const dilim = Math.max(12, Math.ceil(egri.getLength() / 5));
    const cevre = 6;
    const boru = new TubeGeometry(egri, dilim, 1, cevre, false);
    const pos = boru.getAttribute('position');
    const renk: number[] = [];
    const dip = new Color('#3a6541');
    const uc = new Color('#74aa69');
    const c = new Color();
    const m = new Vector3();
    for (let i = 0; i <= dilim; i++) {
      const t = i / dilim;
      egri.getPointAt(t, m);
      const r = r0 + (r1 - r0) * t;
      c.copy(dip).lerp(uc, t);
      for (let j = 0; j <= cevre; j++) {
        const k = i * (cevre + 1) + j;
        pos.setXYZ(k, m.x + (pos.getX(k) - m.x) * r, m.y + (pos.getY(k) - m.y) * r, m.z + (pos.getZ(k) - m.z) * r);
        renk.push(c.r, c.g, c.b);
      }
    }
    boru.setAttribute('color', new Float32BufferAttribute(renk, 3));
    boru.setDrawRange(0, 0);
    const ag = new Mesh(boru, boya);
    ag.frustumCulled = false;
    g.add(ag);
    const d: Dal = { g, egri, boru, dilim, g0, g1, salinim, faz: rnd() * 6.28 };
    dallar.push(d);
    return d;
  }

  // Dal üzerinde t noktasına büyümenin ulaştığı an (g biriminde)
  const varis = (d: Dal, t: number): number => d.g0 + (1 - Math.cbrt(1 - sinirla(t))) * (d.g1 - d.g0);

  function yaprakEkle(d: Dal, t: number, yan: number, boy: number): void {
    const p = d.egri.getPointAt(t);
    const tg = d.egri.getTangentAt(t);
    const g = new Group();
    g.position.copy(p);
    const aci = Math.atan2(tg.y, tg.x) + yan * (0.75 + rnd() * 0.45) - Math.PI / 2;
    g.rotation.z = aci;
    const ic = new Mesh(yaprakGeo[rnd() < 0.45 ? 1 : 0], boya);
    ic.rotation.y = yan * (0.25 + rnd() * 0.35);
    g.add(ic);
    g.scale.setScalar(0);
    d.g.add(g);
    yapraklar.push({ g, ic, basla: varis(d, t), boy, aci, egim: -0.45 + rnd() * 0.5, faz: rnd() * 6.28 });
  }

  // r0 tasarım birimi, k ölçek: iç taç ve tozluk kararı ölçekten bağımsız kalır
  function cicekEkle(ust: Group, p: Vector3, r0: number, tur: Tur, basla: number, k: number, tomurcuk = false): void {
    const r = r0 * k;
    const g = new Group();
    g.position.set(p.x, p.y, p.z + 7 * k);
    const tac: TacYapragi[] = [];
    const adet = 5;
    const don = rnd() * 6.28;
    const kat = (boy: number, acik: number, kay: number, ek: number): void => {
      for (let i = 0; i < adet; i++) {
        const mil = new Group();
        mil.rotation.z = don + kay + (i / adet) * Math.PI * 2;
        const ag = new Mesh(tacGeo[tur], boya);
        ag.rotation.x = 1.5;
        mil.add(ag);
        g.add(mil);
        tac.push({ mil, acik: acik + (rnd() - 0.5) * 0.12, kapali: 1.5, gecikme: ek + i * 0.07 + rnd() * 0.05, boy });
      }
    };
    kat(r, tomurcuk ? 1.05 : 0.34, 0, 0);
    if (r0 >= 15 && !tomurcuk) kat(r * 0.62, 0.8, Math.PI / adet, 0.18);
    const goz = new Group();
    const orta = new Mesh(kure, gozBoya);
    orta.scale.set(r * 0.17, r * 0.17, r * 0.11);
    orta.position.z = r * 0.06;
    goz.add(orta);
    if (r0 >= 13 && !tomurcuk) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + don;
        const toz = new Mesh(kure, tozBoya);
        toz.scale.setScalar(r * 0.04);
        toz.position.set(Math.cos(a) * r * 0.27, Math.sin(a) * r * 0.27, r * 0.14);
        goz.add(toz);
      }
    }
    goz.scale.setScalar(0);
    g.visible = false;
    g.add(goz);
    ust.add(g);
    cicekler.push({ g, tac, goz, basla, sure: 0.26, bx: (rnd() - 0.5) * 0.5, by: (rnd() - 0.5) * 0.6, faz: rnd() * 6.28 });
  }

  const cicekDalda = (d: Dal, t: number, r: number, tur: Tur, k: number, tomurcuk = false): void =>
    cicekEkle(d.g, d.egri.getPointAt(t), r, tur, varis(d, t) + 0.01, k, tomurcuk);

  // Bir kenar boyunca dalgalanarak ilerleyen dal; "donus" verilirse köşeyi dönüp öbür kenarda sürer
  function kenarDal(ust: Group, kok: Vector3, yon: number[], uzunluk: number, k: number, g0: number, g1: number, salinim: number, donus?: { yon: number[]; uzunluk: number }): Dal {
    const adim = 64 * k;
    const n = Math.max(2, Math.round(uzunluk / adim));
    const nokta: number[][] = [];
    for (let i = 1; i <= n; i++) {
      const d = (i * uzunluk) / n;
      const sap = (i % 2 ? 1 : -1) * (3.5 + rnd() * 4) * k * (i === n && !donus ? 0.4 : 1);
      nokta.push([yon[0] * d - yon[1] * sap, yon[1] * d + yon[0] * sap, 3 + rnd() * 6]);
    }
    if (donus) {
      const son = nokta[nokta.length - 1];
      son[0] = yon[0] * uzunluk + donus.yon[0] * 4 * k;
      son[1] = yon[1] * uzunluk + donus.yon[1] * 4 * k;
      const kx = yon[0] * (uzunluk + 24 * k);
      const ky = yon[1] * (uzunluk + 24 * k);
      const m = Math.max(2, Math.round(donus.uzunluk / adim));
      for (let j = 1; j <= m; j++) {
        const d = 22 * k + (j * donus.uzunluk) / m;
        const sap = (j % 2 ? 1 : -1) * (3.5 + rnd() * 4) * k * (j === m ? 0.4 : 1);
        nokta.push([kx + donus.yon[0] * d - donus.yon[1] * sap, ky + donus.yon[1] * d + donus.yon[0] * sap, 3 + rnd() * 6]);
      }
    }
    return dalKur(ust, kok, nokta, 2.4 * k, 0.7 * k, g0, g1, salinim);
  }

  // Dal boyunca yapraklar, ara çiçekler ve uçta büyük çiçek
  function susle(d: Dal, k: number, ucR: number, ucTur: Tur): void {
    const boy = d.egri.getLength();
    let yan = rnd() < 0.5 ? 1 : -1;
    for (let x = (30 + rnd() * 14) * k; x < boy - 18 * k; x += (40 + rnd() * 22) * k) {
      yaprakEkle(d, x / boy, yan, (17 + rnd() * 7) * k);
      yan = -yan;
    }
    let i = Math.floor(rnd() * 3);
    for (let x = (120 + rnd() * 40) * k; x < boy - 70 * k; x += (130 + rnd() * 50) * k) {
      cicekDalda(d, x / boy, 10 + rnd() * 4, TURLER[i++ % 3], k, rnd() < 0.22);
    }
    cicekDalda(d, 1, ucR, ucTur, k);
  }

  function duzenKur(w: number, h: number, yk: number | null, k: number): void {
    for (const eski of kurulan) sahne.remove(eski);
    for (const d of dallar) d.boru.dispose();
    kurulan = [];
    dallar.length = 0;
    yapraklar.length = 0;
    cicekler.length = 0;
    rnd = rastgele(20261111);

    // Sağ üst köşe: üst kenar boyunca ana dal + sağ kenardan sarkan dal (tasarım birimi; grup ölçeklenir)
    const ust = new Group();
    ust.position.set(w / 2, h / 2, 0);
    ust.scale.setScalar(k);
    const ustAna = dalKur(ust, new Vector3(0, 0, 0), [[-60, 9, 6], [-130, -6, 10], [-200, 8, 4], [-262, -4, 8], [-318, 6, 2]], 2.4, 0.7, 0.04, 0.58, 0.006);
    const ustSarkan = dalKur(ust, new Vector3(0, 0, 0), [[5, -50, 5], [-5, -108, 8], [5, -162, 3], [-3, -214, 6]], 2.2, 0.7, 0.08, 0.62, 0.012);
    const filizAn = varis(ustAna, 0.52);
    const ustFiliz = dalKur(ustAna.g, ustAna.egri.getPointAt(0.52), [[-14, -16, 4], [-32, -24, 6]], 1.2, 0.5, filizAn, filizAn + 0.14, 0.02);
    [[0.09, 1, 22], [0.22, -1, 20], [0.33, 1, 24], [0.47, -1, 19], [0.6, 1, 22], [0.79, -1, 20], [0.9, 1, 17]].forEach((y) => yaprakEkle(ustAna, y[0], y[1], y[2]));
    [[0.2, 1, 21], [0.36, -1, 19], [0.62, 1, 22], [0.86, -1, 17]].forEach((y) => yaprakEkle(ustSarkan, y[0], y[1], y[2]));
    yaprakEkle(ustFiliz, 0.5, 1, 15);
    cicekEkle(ust, new Vector3(0, 0, 4), 22, 'pembe', 0.02, 1);
    cicekDalda(ustAna, 1, 19, 'pembe', 1);
    cicekDalda(ustAna, 0.4, 14, 'beyaz', 1);
    cicekDalda(ustAna, 0.7, 11, 'altin', 1);
    cicekDalda(ustFiliz, 1, 12, 'beyaz', 1);
    cicekDalda(ustSarkan, 1, 18, 'beyaz', 1);
    cicekDalda(ustSarkan, 0.5, 13, 'pembe', 1);
    cicekDalda(ustSarkan, 0.76, 9, 'altin', 1, true);
    sahne.add(ust);
    kurulan.push(ust);

    // Kutucuğun hizasından iki kenara: kullanıcının baktığı yerde filizlenir, yukarı ve aşağı yürür;
    // soldaki dal alt köşeyi dönüp alt kenar boyunca sürer
    const govde = new Group();
    const xl = -w / 2;
    const xr = w / 2;
    const yb = -h / 2;
    const y0 = yk === null ? yb + 340 : yk;
    const asagi = Math.max(60, y0 - yb - 26 * k);
    const yukari = Math.max(60, h / 2 - y0 - 40);
    const sol = new Vector3(xl, y0, 0);
    const sag = new Vector3(xr, y0, 0);
    susle(kenarDal(govde, sol, [0, 1], Math.min(250 * k, yukari), k, 0.02, 0.5, 0.006), k, 18, 'pembe');
    susle(kenarDal(govde, sol, [0, -1], asagi, k, 0.02, 0.74, 0.003, { yon: [1, 0], uzunluk: Math.min(210 * k, w * 0.62) }), k, 16, 'pembe');
    susle(kenarDal(govde, sag, [0, 1], Math.min(330 * k, yukari), k, 0.05, 0.64, 0.005), k, 19, 'beyaz');
    susle(kenarDal(govde, sag, [0, -1], Math.min(170 * k, asagi), k, 0.05, 0.44, 0.008), k, 15, 'altin');
    cicekEkle(govde, new Vector3(xl, y0, 4), 19, 'beyaz', 0.0, k);
    cicekEkle(govde, new Vector3(xr, y0, 4), 21, 'pembe', 0.03, k);
    sahne.add(govde);
    kurulan.push(govde);
  }

  // Uçuşan taç yaprakları: kutucuktan çıkan demet + sonra ara ara çiçeklerden dökülenler
  const UCAN = 46;
  const ucan = new InstancedMesh(ucanGeo, boya, UCAN);
  ucan.instanceMatrix.setUsage(DynamicDrawUsage);
  ucan.frustumCulled = false;
  const ucanRenk = [new Color('#f4a9c0'), new Color('#fdeef2'), new Color('#f3d27a'), new Color('#ef8fae')];
  interface Parca { p: Vector3; v: Vector3; e: Euler; w: Vector3; yas: number; omur: number; boy: number; tohum: number }
  const parcalar: Parca[] = [];
  const sifir = new Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < UCAN; i++) {
    parcalar.push({ p: new Vector3(), v: new Vector3(), e: new Euler(), w: new Vector3(), yas: 1, omur: 0, boy: 8, tohum: i * 1.7 });
    ucan.setMatrixAt(i, sifir);
    ucan.setColorAt(i, ucanRenk[i % ucanRenk.length]);
  }
  sahne.add(ucan);
  let sira = 0;
  function sal(x: number, y: number, z: number, vx: number, vy: number, omur: number, boy: number): void {
    const q = parcalar[sira];
    sira = (sira + 1) % UCAN;
    q.p.set(x, y, z);
    q.v.set(vx, vy, (Math.random() - 0.5) * 40);
    q.e.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
    q.w.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3);
    q.yas = 0;
    q.omur = omur;
    q.boy = boy;
  }

  // Polen: dalların çevresinde ağır ağır yükselen ışık zerreleri
  const POLEN = 50;
  const polenPos: number[] = [];
  const polenTohum: number[] = [];
  const polenGeo = new BufferGeometry();
  const polenBoya = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uZaman: { value: 0 }, uPiksel: { value: 1 }, uGuc: { value: 0 }, uRenk: { value: new Color('#e2b64f') } },
    vertexShader:
      'attribute float aTohum; uniform float uZaman; uniform float uPiksel; varying float vA;' +
      'void main(){ vec3 p = position; float h = fract(uZaman * (0.035 + aTohum * 0.05) + aTohum * 7.31);' +
      'p.y += (h - 0.5) * 150.0; p.x += sin(uZaman * 0.6 + aTohum * 40.0) * 12.0;' +
      'vA = sin(h * 3.14159) * (0.55 + 0.45 * sin(uZaman * 2.2 + aTohum * 90.0));' +
      'gl_PointSize = (3.0 + aTohum * 4.0) * uPiksel; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader:
      'uniform vec3 uRenk; uniform float uGuc; varying float vA;' +
      'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d);' +
      'gl_FragColor = vec4(uRenk, a * vA * uGuc * 0.85); \n#include <colorspace_fragment>\n }',
  });
  const polen = new Points(polenGeo, polenBoya);
  polen.frustumCulled = false;
  sahne.add(polen);

  let W = 0;
  let H = 0;
  let pay = 0;
  let olcek = 1;
  let piksel = 1;
  let butce = 2600000; // tuvalin cihaz pikseli bütçesi (uzun formda telefon belleğini korur)
  let duzenIzi = '';

  function boyutla(): void {
    const w = form.offsetWidth;
    const h = form.offsetHeight;
    if (!w || !h) return;
    W = w;
    H = h;
    pay = w < 440 ? 24 : 40;
    olcek = Math.max(0.74, Math.min(1.06, w / 520));
    const tw = w + pay * 2;
    const th = h + pay * 2;
    piksel = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(butce / (tw * th)));
    tuval.style.left = -pay + 'px';
    tuval.style.top = -pay + 'px';
    tuval.style.width = tw + 'px';
    tuval.style.height = th + 'px';
    cizer.setPixelRatio(piksel);
    cizer.setSize(tw, th, false);
    kamera.aspect = tw / th;
    kamera.position.set(0, 0, th / 2 / Math.tan((FOV * Math.PI) / 360));
    kamera.far = kamera.position.z * 2;
    kamera.updateProjectionMatrix();
    const kart = form.querySelector('.form-green') as HTMLElement | null;
    const yk = kart ? h / 2 - (kart.offsetTop + kart.offsetHeight / 2) : null;
    const iz = [w, h, yk, olcek].join('/');
    if (iz !== duzenIzi) {
      duzenIzi = iz;
      duzenKur(w, h, yk, olcek);
      // Polen: sağ üst köşe, kutucuk hizasındaki iki kenar ve alt kenar çevresinde
      const r = rastgele(7);
      const y0 = yk === null ? -h / 2 + 340 : yk;
      polenPos.length = 0;
      polenTohum.length = 0;
      for (let i = 0; i < POLEN; i++) {
        const b = i % 5;
        let x = 0;
        let y = 0;
        if (b === 0) { x = w / 2 - r() * Math.min(w, 330 * olcek); y = h / 2 - r() * 70; }
        else if (b === 1) { x = w / 2 - r() * 60; y = y0 + (r() - 0.35) * 420 * olcek; }
        else if (b === 2) { x = -w / 2 + r() * 60; y = y0 + (r() - 0.5) * 460 * olcek; }
        else if (b === 3) { x = -w / 2 + r() * Math.min(w, 260 * olcek); y = -h / 2 + r() * 70; }
        else { x = (r() - 0.5) * w; y = y0 + (r() - 0.5) * 300; }
        polenPos.push(x, y, 20 + r() * 30);
        polenTohum.push(r());
      }
      polenGeo.setAttribute('position', new Float32BufferAttribute(polenPos, 3));
      polenGeo.setAttribute('aTohum', new Float32BufferAttribute(polenTohum, 1));
    }
    polenBoya.uniforms.uPiksel.value = piksel;
  }

  let g = 0;
  let hedef = 0;
  let zaman = 0;
  let son = 0;
  let raf = 0;
  let gorunur = true;
  let kapali = false;
  let sayac = 0;
  let yavasTop = 0;
  let yavasAdet = 0;
  let dokum = 2;
  let bakX = 0;
  let bakY = 0;
  let imX = 0;
  let imY = 0;
  const mt = new Matrix4();
  const qt = new Quaternion();
  const st = new Vector3();
  const dunya = new Vector3();

  function guncelle(dt: number): number {
    const canlilik = Math.min(1, g * 2.5);
    for (const d of dallar) {
      const p = yumusak(sinirla((g - d.g0) / (d.g1 - d.g0)));
      d.boru.setDrawRange(0, Math.floor(p * d.dilim) * 36);
      d.g.rotation.z = Math.sin(zaman * 0.9 + d.faz) * d.salinim * canlilik;
    }
    for (const y of yapraklar) {
      const q = sinirla((g - y.basla) / 0.16);
      y.g.scale.setScalar(q <= 0 ? 0 : yayli(q) * y.boy);
      y.g.rotation.z = y.aci + Math.sin(zaman * 1.25 + y.faz) * 0.075 * q;
      y.ic.rotation.x = y.egim + (1 - yumusak(q)) * 1.25 + Math.sin(zaman * 1.6 + y.faz * 2) * 0.05 * q;
    }
    const rect = form.getBoundingClientRect();
    const kay = sinirla((rect.top + rect.height / 2) / (window.innerHeight || 1)) - 0.5;
    bakX += (imX - bakX) * Math.min(1, dt * 3.5);
    bakY += (imY + kay * 0.9 - bakY) * Math.min(1, dt * 3.5);
    for (const c of cicekler) {
      const b = sinirla((g - c.basla) / c.sure);
      c.g.visible = b > 0;
      if (!c.g.visible) continue;
      c.g.scale.setScalar(0.25 + 0.75 * yumusak(Math.min(1, b * 1.6)));
      c.g.rotation.set(c.bx - bakY * 0.42 + Math.sin(zaman * 0.8 + c.faz) * 0.05, c.by + bakX * 0.48, Math.sin(zaman * 0.6 + c.faz * 1.7) * 0.06);
      for (const t of c.tac) {
        const q = sinirla((b - t.gecikme) / (1 - t.gecikme - 0.05));
        const ag = t.mil.children[0];
        ag.rotation.x = t.kapali + (t.acik - t.kapali) * yayli(q) + Math.sin(zaman * 0.9 + c.faz + t.gecikme * 9) * 0.035 * q;
        const s = t.boy * (0.3 + 0.7 * yumusak(Math.min(1, b * 1.4)));
        ag.scale.set(s * (0.55 + 0.45 * yumusak(q)), s, s);
      }
      c.goz.scale.setScalar(yumusak(sinirla((b - 0.35) / 0.5)));
    }
    // Ara ara bir çiçekten yaprak dökülür
    if (hedef === 1 && g >= 1 && cicekler.length) {
      dokum -= dt;
      if (dokum <= 0) {
        dokum = 2.2 + Math.random() * 2.6;
        const c = cicekler[Math.floor(Math.random() * cicekler.length)];
        c.g.getWorldPosition(dunya);
        sal(dunya.x, dunya.y, dunya.z + 10, (Math.random() - 0.5) * 30, 10, 5 + Math.random() * 2.5, 7 * olcek);
      }
    }
    let canli = 0;
    for (let i = 0; i < UCAN; i++) {
      const q = parcalar[i];
      if (q.yas >= q.omur) continue;
      q.yas += hedef === 0 ? dt * 4 : dt;
      if (q.yas >= q.omur) { ucan.setMatrixAt(i, sifir); continue; }
      canli++;
      q.v.y -= 62 * dt;
      q.v.x += (Math.sin(zaman * 1.7 + q.tohum) * 46 + 6) * dt;
      q.v.multiplyScalar(1 - Math.min(1, 1.5 * dt));
      q.p.addScaledVector(q.v, dt);
      q.e.x += q.w.x * dt;
      q.e.y += q.w.y * dt;
      q.e.z += q.w.z * dt;
      const kalan = q.omur - q.yas;
      const k = Math.min(1, q.yas / 0.12) * (kalan < 0.9 ? kalan / 0.9 : 1) * q.boy;
      qt.setFromEuler(q.e);
      st.set(k, k, k);
      mt.compose(q.p, qt, st);
      ucan.setMatrixAt(i, mt);
    }
    ucan.instanceMatrix.needsUpdate = true;
    polenBoya.uniforms.uZaman.value = zaman;
    polenBoya.uniforms.uGuc.value = sinirla((g - 0.35) / 0.5);
    return canli;
  }

  function kare(simdi: number): void {
    raf = 0;
    if (kapali || !tuval.isConnected) return;
    const durgun = g >= 1 && hedef === 1;
    // Açılma bittikten sonra yarı hızda çiz (salınım için yeterli, telefonda daha hafif)
    if (durgun && (sayac++ & 1) === 1) { raf = requestAnimationFrame(kare); return; }
    const ham = (simdi - son) / 1000;
    const dt = Math.min(0.05, Math.max(0, ham));
    son = simdi;
    // Yavaş cihaz: açılma sırasında kareler uzuyorsa çözünürlüğü düşür
    if (!durgun && hedef === 1 && ham < 0.5) {
      yavasTop += ham;
      if (++yavasAdet === 45) {
        if (yavasTop / 45 > 0.042 && butce > 900000) { butce *= 0.55; boyutla(); }
        yavasTop = 0;
        yavasAdet = 0;
      }
    }
    zaman += dt;
    if (hedef > g) g = Math.min(1, g + dt / BUYUME_SN);
    else if (hedef < g) g = Math.max(0, g - dt / CEKILME_SN);
    const canli = guncelle(dt);
    cizer.render(sahne, kamera);
    if (g <= 0 && hedef === 0 && canli === 0) { tuval.style.visibility = 'hidden'; return; }
    if (!gorunur || duragan) return;
    raf = requestAnimationFrame(kare);
  }
  function calistir(): void {
    if (raf || kapali) return;
    son = performance.now();
    raf = requestAnimationFrame(kare);
  }

  const imlec = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    const r = form.getBoundingClientRect();
    imX = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
    imY = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
  };
  window.addEventListener('pointermove', imlec, { passive: true });
  const boyutGozcu = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { if (tuval.isConnected) { boyutla(); if (g > 0) calistir(); } }) : null;
  if (boyutGozcu) boyutGozcu.observe(form);
  const gorunurGozcu = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((k) => { gorunur = k[k.length - 1].isIntersecting; if (gorunur && (g > 0 || hedef === 1)) calistir(); }, { rootMargin: '80px' })
    : null;
  if (gorunurGozcu) gorunurGozcu.observe(form);

  const api: Sahne = {
    ayarla(acik: boolean, kaynak?: Element | null): void {
      if (kapali) return;
      hedef = acik ? 1 : 0;
      if (acik) {
        if (!tuval.isConnected) form.appendChild(tuval);
        boyutla();
        tuval.style.visibility = 'visible';
        if (kaynak && W && !duragan) {
          // Kutucuğun olduğu yerden taç yaprakları saçılır
          const f = form.getBoundingClientRect();
          const k = kaynak.getBoundingClientRect();
          const x = k.left + k.width / 2 - f.left - W / 2;
          const y = H / 2 - (k.top + k.height / 2 - f.top);
          for (let i = 0; i < 26; i++) {
            const a = Math.PI * (0.08 + Math.random() * 0.84);
            const hiz = 170 + Math.random() * 330;
            sal(x, y, 30 + Math.random() * 30, Math.cos(a) * hiz * 1.25, Math.sin(a) * hiz, 2.6 + Math.random() * 2.2, (6 + Math.random() * 4.5) * olcek);
          }
        }
        dokum = 3.5;
      }
      if (duragan) g = hedef;
      calistir();
    },
    kapat(): void {
      kapali = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', imlec);
      if (boyutGozcu) boyutGozcu.disconnect();
      if (gorunurGozcu) gorunurGozcu.disconnect();
      tuval.remove();
      cizer.dispose();
    },
  };
  // Bağlam kaybolursa sayfa SVG süslemeye geri döner
  tuval.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    api.kapat();
    form.classList.remove('yesil-3d');
    form.dispatchEvent(new CustomEvent('yesil3d-kayip'));
  });
  return api;
}
