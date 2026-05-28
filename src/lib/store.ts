"use client";

import type { MarketSnapshot } from "./types";
import { PTF_FALLBACK } from "./constants";

/**
 * A tiny framework-agnostic store. Two channels:
 *
 *  1. `snapshot` — React-facing market intelligence (useSyncExternalStore).
 *     Changes rarely (on each live sync), so re-renders are cheap.
 *
 *  2. `live` — high-frequency values (scroll progress, pointer, smoothed
 *     volatility / API pulse) read imperatively inside the Three.js
 *     render loop WITHOUT triggering React renders.
 */

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

export function deriveSnapshot(
  prices: number[],
  opts: {
    isLive: boolean;
    loading: boolean;
    date: string | null;
    pulse: number;
    /** Override the "current hour" — deterministic value used for the
     *  initial/server snapshot to avoid hydration mismatches. */
    hour?: number;
  },
): MarketSnapshot {
  const n = prices.length || 1;
  const avg = prices.reduce((a, b) => a + b, 0) / n;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spread = max - min;

  // Standard deviation → normalised volatility.
  const variance = prices.reduce((a, b) => a + (b - avg) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const volatility = clamp(std / avg / 0.22);

  const hourSrc = opts.hour ?? new Date().getHours();
  const nowHour = Math.min(prices.length - 1, hourSrc);
  const current = prices[nowHour] ?? avg;
  const intensity = spread > 0 ? clamp((current - min) / spread) : 0.5;

  // Trend = slope of the last 6 hours, normalised by avg.
  const tailStart = Math.max(0, nowHour - 5);
  const tail = prices.slice(tailStart, nowHour + 1);
  const slope = tail.length > 1 ? (tail[tail.length - 1] - tail[0]) / tail[0] : 0;
  const trend = clamp(slope * 6, -1, 1);

  const deltaPct = avg > 0 ? ((current - avg) / avg) * 100 : 0;

  return {
    prices,
    current,
    avg,
    min,
    max,
    spread,
    volatility,
    intensity,
    trend,
    deltaPct,
    isLive: opts.isLive,
    loading: opts.loading,
    date: opts.date,
    pulse: opts.pulse,
  };
}

// Deterministic hour (12:00) so server prerender and the first client render
// produce identical markup — real "now" is applied client-side after mount.
const initialSnapshot: MarketSnapshot = deriveSnapshot(PTF_FALLBACK, {
  isLive: false,
  loading: true,
  date: null,
  pulse: 0,
  hour: 12,
});

let snapshot: MarketSnapshot = initialSnapshot;
const listeners = new Set<() => void>();

/** Mutable, render-loop-only values (never cause React re-render). */
export const live = {
  scroll: 0, // 0..1 page progress
  velocity: 0, // scroll velocity (smoothed)
  pointerX: 0, // -1..1
  pointerY: 0, // -1..1
  volatility: initialSnapshot.volatility, // smoothed toward snapshot.volatility
  intensity: initialSnapshot.intensity,
  apiFlash: 0, // decays 1→0 after each successful sync
};

export const marketStore = {
  getSnapshot(): MarketSnapshot {
    return snapshot;
  },
  getServerSnapshot(): MarketSnapshot {
    return initialSnapshot;
  },
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  set(next: MarketSnapshot) {
    snapshot = next;
    // Nudge the render-loop targets.
    live.apiFlash = 1;
    listeners.forEach((l) => l());
  },
};
