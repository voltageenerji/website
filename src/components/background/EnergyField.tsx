"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { live, marketStore } from "@/lib/store";
import { SCENES } from "@/lib/constants";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uRes;
  uniform vec2  uPointer;     // smoothed, -1..1
  uniform float uVol;         // 0..1 market volatility (smoothed)
  uniform float uIntensity;   // 0..1 load intensity
  uniform float uScroll;      // 0..1 page progress
  uniform float uFlash;       // 0..1 API-activity pulse (decaying)
  uniform vec3  uColTop;
  uniform vec3  uColBottom;
  uniform vec3  uAccent;

  // --- value noise + fbm ----------------------------------------------------
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p = rot * p * 2.02;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    // aspect-correct coordinates
    vec2 uv = vUv;
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (uv - 0.5);
    p.x *= aspect;

    float t = uTime * (0.04 + uVol * 0.10);

    // cursor-reactive warp: energy is pulled toward the pointer
    vec2 ptr = uPointer * 0.5;
    ptr.x *= aspect;
    float pd = length(p - ptr);
    float pull = exp(-pd * 3.2) * (0.18 + uVol * 0.22);
    vec2 warp = normalize(p - ptr + 1e-4) * pull;

    // domain-warped flow field — "painted energy topology"
    vec2 q = p * 1.6 + warp;
    float flow = fbm(q + vec2(t * 1.2, -t));
    float field = fbm(q + flow * (0.9 + uVol * 0.8) + vec2(-t * 0.6, t * 0.8));

    // transmission-line contours that drift like current
    float lines = abs(fract(field * (6.0 + uIntensity * 4.0) - uTime * (0.10 + uVol * 0.25)) * 2.0 - 1.0);
    float current = smoothstep(0.06 + uVol * 0.05, 0.0, lines);

    // ambient nebulous body
    float body = smoothstep(0.15, 0.95, field);

    // vertical atmosphere gradient (scene color journey)
    vec3 base = mix(uColBottom, uColTop, smoothstep(-0.55, 0.55, p.y + (field - 0.5) * 0.4));

    // accent energy along the currents + load-driven brightness
    float energy = current * (0.45 + uIntensity * 0.9) + body * 0.10;
    vec3 col = base + uAccent * energy;

    // cursor bloom (volumetric-ish soft light)
    col += uAccent * exp(-pd * 4.5) * (0.12 + uVol * 0.30);

    // API-activity flash — a brief ripple of accent across the field
    col += uAccent * uFlash * (0.06 + current * 0.5);

    // soft depth fog toward edges
    float vig = smoothstep(1.25, 0.25, length(p));
    col *= 0.55 + 0.45 * vig;

    // fine grain to avoid banding
    float g = (hash(uv * uRes + uTime) - 0.5) * 0.018;
    col += g;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function lerpStops(colors: THREE.Color[], x: number, out: THREE.Color) {
  const n = colors.length - 1;
  const f = Math.min(0.99999, Math.max(0, x)) * n;
  const i = Math.floor(f);
  out.copy(colors[i]).lerp(colors[Math.min(n, i + 1)], f - i);
  return out;
}

export default function EnergyField() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  // Pre-built color ramps from the scene palette.
  const ramps = useMemo(() => {
    const top = SCENES.map((s) => new THREE.Color(s.fog));
    const bottom = SCENES.map((s) => new THREE.Color(s.bg));
    const accent = SCENES.map((s) => new THREE.Color(s.accent));
    return { top, bottom, accent };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uVol: { value: 0.3 },
      uIntensity: { value: 0.5 },
      uScroll: { value: 0 },
      uFlash: { value: 0 },
      uColTop: { value: new THREE.Color(SCENES[0].fog) },
      uColBottom: { value: new THREE.Color(SCENES[0].bg) },
      uAccent: { value: new THREE.Color(SCENES[0].accent) },
    }),
    [],
  );

  // smoothed pointer (kept local to avoid jitter)
  const sp = useRef({ x: 0, y: 0 });
  const tmp = useRef(new THREE.Color());

  useFrame((_, delta) => {
    const m = matRef.current;
    if (!m) return;
    const u = m.uniforms;
    const snap = marketStore.getSnapshot();

    u.uTime.value += delta;

    // ease the live values toward their targets
    live.volatility += (snap.volatility - live.volatility) * 0.04;
    live.intensity += (snap.intensity - live.intensity) * 0.04;
    live.apiFlash *= 0.94;

    sp.current.x += (live.pointerX - sp.current.x) * 0.06;
    sp.current.y += (live.pointerY - sp.current.y) * 0.06;

    u.uVol.value = live.volatility;
    u.uIntensity.value = live.intensity;
    u.uFlash.value = live.apiFlash;
    u.uScroll.value = live.scroll;
    (u.uPointer.value as THREE.Vector2).set(sp.current.x, sp.current.y);
    (u.uRes.value as THREE.Vector2).set(
      size.width * viewport.dpr,
      size.height * viewport.dpr,
    );

    // color journey driven by scroll progress
    (u.uColTop.value as THREE.Color).copy(
      lerpStops(ramps.top, live.scroll, tmp.current),
    );
    (u.uColBottom.value as THREE.Color).copy(
      lerpStops(ramps.bottom, live.scroll, tmp.current),
    );
    (u.uAccent.value as THREE.Color).copy(
      lerpStops(ramps.accent, live.scroll, tmp.current),
    );
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
