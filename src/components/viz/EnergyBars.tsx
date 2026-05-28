"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useMarket } from "@/hooks/useMarket";
import { useNowHour } from "@/hooks/useNowHour";
import { HOUR_LABELS } from "@/lib/constants";

/**
 * Animated hourly energy bars — each bar is a real day-ahead price,
 * normalised to the day's range. The current hour glows.
 */
export default function EnergyBars() {
  const m = useMarket();
  const nowH = Math.min(23, useNowHour());

  const bars = useMemo(() => {
    const min = Math.min(...m.prices);
    const max = Math.max(...m.prices);
    const range = Math.max(1, max - min);
    return m.prices.map((p) => 0.16 + ((p - min) / range) * 0.84);
  }, [m.prices]);

  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist-2">
          Hourly Load · Energy Flow
        </h4>
        <span className="pulse-dot" />
      </div>

      <div className="flex h-[150px] items-end gap-[3px]">
        {bars.map((h, i) => {
          const isNow = i === nowH;
          const past = i <= nowH;
          return (
            <motion.div
              key={i}
              className="relative flex-1 rounded-[2px]"
              style={{
                background: isNow
                  ? "linear-gradient(180deg, var(--color-cyan-soft), var(--color-cyan-deep))"
                  : past
                    ? "linear-gradient(180deg, color-mix(in srgb, var(--color-cyan) 55%, transparent), color-mix(in srgb, var(--color-cyan) 12%, transparent))"
                    : "color-mix(in srgb, var(--color-mist) 9%, transparent)",
                boxShadow: isNow
                  ? "0 0 16px color-mix(in srgb, var(--color-cyan) 70%, transparent)"
                  : "none",
              }}
              initial={{ height: 0 }}
              whileInView={{ height: `${h * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.018, ease: [0.16, 1, 0.3, 1] }}
            >
              {isNow && (
                <motion.span
                  className="absolute inset-0 rounded-[2px]"
                  style={{ background: "var(--color-cyan)" }}
                  animate={{ opacity: [0.35, 0.9, 0.35] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[9px] tracking-[0.1em] text-mist-3">
        <span>00:00</span>
        <span>{HOUR_LABELS[nowH]}:00 NOW</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
