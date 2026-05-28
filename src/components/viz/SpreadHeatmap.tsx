"use client";

import { motion } from "framer-motion";
import { useMarket } from "@/hooks/useMarket";
import { fmtInt } from "@/lib/format";

/** 24-cell price heatmap: cool cyan (cheap) → warm gold (expensive). */
export default function SpreadHeatmap() {
  const m = useMarket();
  const min = Math.min(...m.prices);
  const max = Math.max(...m.prices);
  const range = Math.max(1, max - min);

  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist-2">
          Price Spread · ₺/MWh
        </h4>
        <span className="tnum font-mono text-[12px] text-mist-2">
          Δ {fmtInt(m.spread)}
        </span>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {m.prices.map((p, i) => {
          const t = (p - min) / range; // 0 cheap → 1 expensive
          return (
            <motion.div
              key={i}
              className="h-5 rounded-[3px]"
              title={`${String(i).padStart(2, "0")}:00 · ${fmtInt(p)} ₺`}
              style={{
                background: `color-mix(in srgb, var(--color-gold) ${Math.round(
                  t * 100,
                )}%, var(--color-cyan-deep))`,
                opacity: 0.35 + t * 0.65,
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 0.35 + t * 0.65 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.015 }}
            />
          );
        })}
      </div>
      <div className="mt-2.5 flex justify-between font-mono text-[9px] tracking-[0.1em] text-mist-3">
        <span>CHEAP</span>
        <span>EXPENSIVE</span>
      </div>
    </div>
  );
}
