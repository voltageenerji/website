// EPİAŞ Şeffaflık PTF (Day-Ahead Market Clearing Price) via the existing
// Cloudflare Worker proxy. This is REAL operational data — do not replace.
export const PTF_PROXY = "https://epias-proxy.emirhantan-ku.workers.dev";
export const PTF_ENDPOINT = `${PTF_PROXY}/ptf/today`;

// Re-sync cadence with the upstream market.
export const PTF_REFRESH_MS = 15 * 60 * 1000;

// Graceful fallback curve (₺/MWh by hour) so visuals never look broken
// before/if the live feed is unavailable. Mirrors the legacy site.
export const PTF_FALLBACK: number[] = [
  2010, 1890, 1820, 1780, 1790, 1850, 1980, 2180, 2340, 2420, 2380, 2290,
  2250, 2190, 2160, 2120, 2180, 2350, 2620, 2780, 2680, 2490, 2280, 2120,
];

export const HOUR_LABELS = Array.from({ length: 24 }, (_, h) =>
  String(h).padStart(2, "0"),
);

// Brand / company facts (real).
export const COMPANY = {
  brand: "Voltage",
  legal: "Voltan Elektrik Toptan Satış İthalat ve İhracat A.Ş.",
  founded: 2011,
  phone: "+90 216 479 0510",
  phoneHref: "tel:+902164790510",
  email: "info@voltage.com.tr",
  address: "Acıbadem Mah. Elysium Elit, Koşuyolu B-18 · Kadıköy · İstanbul",
  domain: "voltage.com.tr",
} as const;

// Cinematic chapter palette — drives the fade-through-color scroll system.
// Each section owns an atmosphere; transitions interpolate between them.
export type SceneId =
  | "hero"
  | "market"
  | "model"
  | "network"
  | "investment"
  | "future";

export interface Scene {
  id: SceneId;
  label: string;
  index: string;
  /** Base atmosphere color (graphite→midnight→emerald journey). */
  bg: string;
  /** Accent fog color for the Three.js field in this chapter. */
  fog: string;
  /** Dominant accent (cyan / gold / emerald). */
  accent: string;
}

// Stylised Türkiye outline (approximate — evokes the landmass, not survey-grade).
export const TR_OUTLINE =
  "M52,150 L150,118 L235,116 Q270,116 300,138 L362,150 L520,116 L612,108 L726,120 L862,150 L928,184 L902,232 L820,252 L702,250 L642,292 L560,302 L470,292 L380,300 L300,300 L232,282 L160,252 L108,222 L70,190 Z";

export const SCENES: Scene[] = [
  { id: "hero", label: "Voltage", index: "00", bg: "#05070b", fog: "#0a1830", accent: "#2fe6ff" },
  { id: "market", label: "Live Market", index: "01", bg: "#070b13", fog: "#0e2747", accent: "#2fe6ff" },
  { id: "model", label: "The Model", index: "02", bg: "#06121a", fog: "#0f3a30", accent: "#2fae7e" },
  { id: "network", label: "National Network", index: "03", bg: "#06140f", fog: "#0f3a30", accent: "#2fae7e" },
  { id: "investment", label: "Investment & Scale", index: "04", bg: "#0a0c10", fog: "#14365f", accent: "#c9a961" },
  { id: "future", label: "The Future", index: "05", bg: "#04060a", fog: "#0a1830", accent: "#e4c77e" },
];
