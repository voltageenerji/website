"use client";

import { useEffect, useRef } from "react";
import {
  PTF_ENDPOINT,
  PTF_FALLBACK,
  PTF_REFRESH_MS,
} from "@/lib/constants";
import { deriveSnapshot, marketStore } from "@/lib/store";
import type { PtfPayload } from "@/lib/types";

/**
 * Headless component (rendered once near the root) that pulls the REAL
 * EPİAŞ day-ahead clearing price from the Voltage worker proxy, derives
 * market intelligence and publishes it to the global store. Adds a gentle
 * intra-tick so the figures feel alive between 15-minute upstream syncs.
 */
export default function MarketFeed() {
  const pricesRef = useRef<number[]>([...PTF_FALLBACK]);
  const dateRef = useRef<string | null>(null);
  const isLiveRef = useRef(false);
  const pulseRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    function publish(loading = false) {
      marketStore.set(
        deriveSnapshot(pricesRef.current, {
          isLive: isLiveRef.current,
          loading,
          date: dateRef.current,
          pulse: pulseRef.current,
        }),
      );
    }

    async function sync() {
      try {
        const res = await fetch(PTF_ENDPOINT, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: PtfPayload = await res.json();
        if (!json.items || !json.items.length) throw new Error("empty payload");

        const next = [...PTF_FALLBACK];
        for (let h = 0; h < 24; h++) {
          const it = json.items.find((x) => x.hour === h);
          if (it && Number.isFinite(it.price)) next[h] = it.price;
        }
        if (cancelled) return;
        pricesRef.current = next;
        dateRef.current = json.date ?? null;
        isLiveRef.current = true;
        pulseRef.current += 1;
        publish(false);
      } catch (err) {
        // Keep the fallback curve; the experience must never break.
        if (!cancelled) {
          console.warn("[Voltage] PTF feed unavailable:", (err as Error).message);
          publish(false);
        }
      }
    }

    // Initial publish (fallback) immediately so visuals render, then sync.
    publish(true);
    sync();

    const syncTimer = setInterval(sync, PTF_REFRESH_MS);

    // Gentle live micro-tick around the current hour value.
    const tickTimer = setInterval(() => {
      if (cancelled) return;
      const hour = Math.min(23, new Date().getHours());
      const base = pricesRef.current[hour];
      if (!Number.isFinite(base)) return;
      const jitter = (Math.random() - 0.5) * base * 0.006;
      const next = [...pricesRef.current];
      next[hour] = base + jitter;
      pricesRef.current = next;
      publish(false);
    }, 2200);

    return () => {
      cancelled = true;
      clearInterval(syncTimer);
      clearInterval(tickTimer);
    };
  }, []);

  return null;
}
