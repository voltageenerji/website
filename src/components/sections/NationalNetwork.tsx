"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import ChapterHeading from "@/components/ui/ChapterHeading";
import Reveal, { RevealGroup } from "@/components/ui/Reveal";
import { useMarket } from "@/hooks/useMarket";
import { TR_OUTLINE } from "@/lib/constants";

// City nodes positioned roughly to Turkish geography on a 980×420 board.
const NODES = [
  { name: "İstanbul", x: 205, y: 132, hub: true },
  { name: "Kocaeli", x: 258, y: 142 },
  { name: "Trakya", x: 150, y: 122 },
  { name: "Bursa", x: 235, y: 172 },
  { name: "İzmir", x: 118, y: 232 },
  { name: "Aliağa", x: 112, y: 208 },
  { name: "Ankara", x: 418, y: 176 },
  { name: "Konya", x: 432, y: 252 },
  { name: "Kayseri", x: 522, y: 226 },
  { name: "Samsun", x: 558, y: 124 },
  { name: "Adana", x: 578, y: 280 },
  { name: "Gaziantep", x: 662, y: 282 },
  { name: "Erzurum", x: 770, y: 192 },
];

const REGIONS = [
  { k: "Marmara", v: "Steel · Petrochem · OIZ" },
  { k: "Ege", v: "Glass · Chemicals" },
  { k: "İç Anadolu", v: "Manufacturing · Logistics" },
  { k: "Akdeniz", v: "Industry · Cold chain" },
  { k: "Güneydoğu", v: "Textile · Aggregation" },
];

export default function NationalNetwork() {
  const m = useMarket();
  // Flows animate faster as market activity rises.
  const flowDur = useMemo(() => 6.5 - m.volatility * 3, [m.volatility]);
  const hub = NODES.find((n) => n.hub)!;

  return (
    <section id="network" className="relative z-10 px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-[1480px]">
        <ChapterHeading
          index="03"
          label="National Energy Network"
          title={
            <>
              One portfolio, mapped across{" "}
              <span style={{ color: "var(--color-emerald-bright)" }}>
                the grid
              </span>
              .
            </>
          }
          intro="From Trakya to Gaziantep, Voltage aggregates high-consumption facilities into a single coordinated book — a living network of demand balanced in real time against the market."
        />

        <Reveal>
          <div className="panel relative mt-12 overflow-hidden p-4 sm:p-8">
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-50" />
            <svg viewBox="0 0 980 420" className="relative block h-auto w-full">
              <defs>
                <radialGradient id="netGlow">
                  <stop offset="0%" stopColor="var(--color-emerald-bright)" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="var(--color-emerald-bright)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="flowGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0" />
                  <stop offset="50%" stopColor="var(--color-cyan)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* country outline */}
              <path
                d={TR_OUTLINE}
                fill="rgba(47,174,126,0.04)"
                stroke="var(--color-hair)"
                strokeWidth="1"
              />

              {/* flow paths from hub → every node */}
              {NODES.filter((n) => !n.hub).map((n, i) => {
                const mx = (hub.x + n.x) / 2;
                const my = (hub.y + n.y) / 2 - 30;
                const d = `M${hub.x},${hub.y} Q${mx},${my} ${n.x},${n.y}`;
                return (
                  <g key={n.name}>
                    <path d={d} fill="none" stroke="var(--color-hair)" strokeWidth="1" />
                    <path
                      d={d}
                      fill="none"
                      stroke="url(#flowGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="14 120"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="134"
                        to="0"
                        dur={`${flowDur + (i % 4) * 0.5}s`}
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                );
              })}

              {/* nodes */}
              {NODES.map((n) => (
                <g key={n.name}>
                  {n.hub && <circle cx={n.x} cy={n.y} r="26" fill="url(#netGlow)" />}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.hub ? 6 : 4}
                    fill={n.hub ? "var(--color-cyan)" : "var(--color-emerald-bright)"}
                  >
                    {n.hub && (
                      <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
                    )}
                  </circle>
                  <text
                    x={n.x}
                    y={n.y - 10}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="9"
                    fill={n.hub ? "var(--color-cyan)" : "var(--color-mist-2)"}
                    letterSpacing="0.5"
                  >
                    {n.name}
                  </text>
                </g>
              ))}
            </svg>

            <div className="pointer-events-none absolute right-6 top-6 flex items-center gap-2">
              <span className="pulse-dot" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-mist-2">
                LIVE AGGREGATION
              </span>
            </div>
          </div>
        </Reveal>

        <RevealGroup className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {REGIONS.map((r) => (
            <Reveal key={r.k}>
              <div className="panel p-4">
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.16em]"
                  style={{ color: "var(--color-emerald-bright)" }}
                >
                  {r.k}
                </div>
                <div className="mt-1.5 text-[12px] leading-snug text-mist-2">
                  {r.v}
                </div>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
