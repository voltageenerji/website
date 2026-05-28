"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useMarket } from "@/hooks/useMarket";
import { useNowHour } from "@/hooks/useNowHour";
import { fmtPrice } from "@/lib/format";

const W = 800;
const H = 300;
const PAD_T = 24;
const PAD_B = 46;

/** Real EPİAŞ day-ahead clearing-price curve, 24h. */
export default function PtfChart() {
  const m = useMarket();
  const nowH = useNowHour();

  const { line, area, nowX, nowY } = useMemo(() => {
    const prices = m.prices;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = Math.max(1, max - min);
    const usable = H - PAD_T - PAD_B;
    const pts = prices.map((p, i) => {
      const x = (i / 23) * W;
      const y = PAD_T + (1 - (p - min) / range) * usable;
      return [+x.toFixed(1), +y.toFixed(1)] as [number, number];
    });
    const line = "M" + pts.map((p) => p.join(",")).join(" L");
    const area = `${line} L${W},${H} L0,${H} Z`;
    const idx = Math.min(23, nowH);
    return { line, area, nowX: pts[idx][0], nowY: pts[idx][1] };
  }, [m.prices, nowH]);

  const up = m.deltaPct >= 0;

  return (
    <div className="panel relative overflow-hidden p-5 sm:p-7">
      {/* head */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[19px] font-medium tracking-tight">
            Day-Ahead Clearing Price · 24h
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="font-mono text-[10px] tracking-[0.22em] text-cyan">
              {m.isLive ? "LIVE · EPİAŞ ŞEFFAFLIK" : "SYNCING · EPİAŞ"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-3">
            Now
          </div>
          <div className="tnum flex items-baseline justify-end gap-1 text-[34px] font-medium leading-none">
            {fmtPrice(m.current)}
            <span className="text-[15px] text-cyan">₺</span>
          </div>
          <div
            className="tnum mt-1 font-mono text-[11px]"
            style={{ color: up ? "var(--color-up)" : "var(--color-down)" }}
          >
            {up ? "▲" : "▼"} {Math.abs(m.deltaPct).toFixed(1)}% · vs day avg
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-[260px] w-full sm:h-[300px]"
      >
        <defs>
          <linearGradient id="ptfFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0" />
          </linearGradient>
          <filter id="ptfGlow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grid */}
        <g stroke="var(--color-hair-2)" strokeWidth="1">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={PAD_T + f * (H - PAD_T - PAD_B)} y2={PAD_T + f * (H - PAD_T - PAD_B)} />
          ))}
        </g>

        <path d={area} fill="url(#ptfFill)" />
        <motion.path
          key={line}
          d={line}
          fill="none"
          stroke="var(--color-cyan)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          filter="url(#ptfGlow)"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* now marker */}
        <circle cx={nowX} cy={nowY} r="4" fill="var(--color-cyan)">
          <animate attributeName="r" values="3.5;7;3.5" dur="1.8s" repeatCount="indefinite" />
        </circle>

        {/* x labels */}
        <g fill="var(--color-mist-3)" fontFamily="var(--font-mono)" fontSize="10">
          {["00:00", "06:00", "12:00", "18:00", "24:00"].map((t, i) => (
            <text key={t} x={Math.min(W - 28, (i / 4) * W + 2)} y={H - 8}>
              {t}
            </text>
          ))}
        </g>
      </svg>

      <div className="mt-4 flex flex-wrap gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-3">
        <span className="flex items-center gap-2">
          <i className="inline-block h-0.5 w-4 align-middle" style={{ background: "var(--color-cyan)" }} />
          PTF ₺/MWh
        </span>
        <span>LOW {fmtPrice(m.min)}</span>
        <span>HIGH {fmtPrice(m.max)}</span>
        <span>AVG {fmtPrice(m.avg)}</span>
      </div>
    </div>
  );
}
