"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useMarket } from "@/hooks/useMarket";

const W = 300;
const H = 70;

/** Intraday dispersion curve — |price − day avg| per hour. */
export default function VolatilityCurve() {
  const m = useMarket();

  const { line, area } = useMemo(() => {
    const disp = m.prices.map((p) => Math.abs(p - m.avg));
    const max = Math.max(1, ...disp);
    const pts = disp.map((d, i) => {
      const x = (i / 23) * W;
      const y = H - (d / max) * (H - 6) - 2;
      return [+x.toFixed(1), +y.toFixed(1)] as [number, number];
    });
    const line = "M" + pts.map((p) => p.join(",")).join(" L");
    return { line, area: `${line} L${W},${H} L0,${H} Z` };
  }, [m.prices, m.avg]);

  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist-2">
          Volatility
        </h4>
        <span className="tnum font-mono text-[13px] text-gold-bright">
          {(m.volatility * 100).toFixed(0)}
          <span className="text-mist-3">/100</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[64px] w-full">
        <defs>
          <linearGradient id="volFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#volFill)" />
        <motion.path
          key={line}
          d={line}
          fill="none"
          stroke="var(--color-gold-bright)"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </div>
  );
}
