"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import ChapterHeading from "@/components/ui/ChapterHeading";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    t: "Prepaid Purchasing",
    d: "Voltage purchases electricity ahead of demand on the day-ahead market, locking volume at disciplined prices and absorbing volatility onto its own balance sheet.",
    tag: "GÖP · forward position",
  },
  {
    t: "Aggregation",
    d: "Hundreds of corporate and industrial loads are aggregated into a single managed portfolio — turning fragmented demand into a coordinated, optimisable book.",
    tag: "162+ facilities",
  },
  {
    t: "Optimization",
    d: "A real-time optimisation layer continuously rebalances the portfolio across day-ahead, intra-day and balancing markets to hold deviation below one percent.",
    tag: "GÖP · GİP · balancing",
  },
  {
    t: "Deferred Sales",
    d: "Energy is sold forward into contracted demand on Voltage's schedule — not the market's — converting price risk into predictable, recurring margin.",
    tag: "contracted offtake",
  },
  {
    t: "Residential Scaling",
    d: "The same engine extends from heavy industry to residential aggregation — scaling a proven operating model across the entire national demand curve.",
    tag: "next horizon",
  },
];

export default function VoltageModel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { isDesktop, reduce } = ctx.conditions as {
          isDesktop: boolean;
          reduce: boolean;
        };
        if (!isDesktop || reduce) return;
        const st = ScrollTrigger.create({
          trigger: wrapRef.current,
          start: "top top",
          end: "+=320%",
          pin: pinRef.current,
          scrub: true,
          onUpdate: (self) => {
            const idx = Math.min(
              STEPS.length - 1,
              Math.floor(self.progress * STEPS.length),
            );
            setActive(idx);
          },
        });
        return () => st.kill();
      },
    );
    return () => mm.revert();
  }, []);

  return (
    <section id="model" ref={wrapRef} className="relative z-10">
      <div
        ref={pinRef}
        className="flex min-h-[100svh] flex-col justify-center px-5 py-24 sm:px-8"
      >
        <div className="mx-auto w-full max-w-[1480px]">
          <ChapterHeading
            index="02"
            label="The Voltage Model"
            title={
              <>
                Buy energy early. Sell it{" "}
                <span style={{ color: "var(--color-emerald-bright)" }}>
                  on our terms
                </span>
                .
              </>
            }
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            {/* Steps */}
            <ol className="flex flex-col gap-2">
              {STEPS.map((s, i) => {
                const on = i === active;
                return (
                  <li
                    key={s.t}
                    className="cursor-default rounded-2xl border p-4 transition-all duration-500"
                    style={{
                      borderColor: on ? "var(--color-emerald-bright)" : "var(--color-hair)",
                      background: on ? "rgba(47,174,126,0.07)" : "transparent",
                    }}
                    onMouseEnter={() => setActive(i)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="tnum grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] transition-colors"
                        style={{
                          background: on ? "var(--color-emerald-bright)" : "rgba(231,238,247,0.06)",
                          color: on ? "var(--color-void)" : "var(--color-mist-2)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="text-[18px] font-medium tracking-tight transition-colors"
                        style={{ color: on ? "var(--color-mist)" : "var(--color-mist-3)" }}
                      >
                        {s.t}
                      </span>
                    </div>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="overflow-hidden"
                        >
                          <p className="pt-3 pl-10 text-[14px] leading-relaxed text-mist-2">
                            {s.d}
                          </p>
                          <div className="mt-2 pl-10 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-bright">
                            {s.tag}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>

            {/* Diagram */}
            <ModelDiagram active={active} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ModelDiagram({ active }: { active: number }) {
  // 5 nodes on a ring; flow energizes up to the active node.
  const nodes = [
    { x: 90, y: 70 },
    { x: 300, y: 50 },
    { x: 410, y: 200 },
    { x: 250, y: 330 },
    { x: 70, y: 250 },
  ];
  return (
    <div className="panel relative aspect-square w-full overflow-hidden p-4 sm:p-6">
      <svg viewBox="0 0 480 380" className="h-full w-full">
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="var(--color-emerald-bright)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-emerald-bright)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* connections */}
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length];
          const energized = i < active;
          return (
            <line
              key={i}
              x1={n.x}
              y1={n.y}
              x2={next.x}
              y2={next.y}
              stroke={energized ? "var(--color-emerald-bright)" : "var(--color-hair)"}
              strokeWidth={energized ? 1.6 : 1}
              strokeDasharray={energized ? "none" : "3 5"}
              style={{ transition: "stroke 0.6s ease" }}
            />
          );
        })}

        {/* nodes */}
        {nodes.map((n, i) => {
          const on = i <= active;
          const cur = i === active;
          return (
            <g key={i}>
              {cur && <circle cx={n.x} cy={n.y} r="34" fill="url(#nodeGlow)" />}
              <circle
                cx={n.x}
                cy={n.y}
                r={cur ? 12 : 8}
                fill={on ? "var(--color-emerald-bright)" : "var(--color-graphite-3)"}
                stroke={on ? "var(--color-emerald-bright)" : "var(--color-hair)"}
                style={{ transition: "all 0.5s ease" }}
              />
              <text
                x={n.x}
                y={n.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize="9"
                fill={on ? "var(--color-void)" : "var(--color-mist-3)"}
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        <text
          x="240"
          y="195"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="3"
          fill="var(--color-mist-2)"
        >
          VOLTAGE ENGINE
        </text>
      </svg>
      <div className="pointer-events-none absolute bottom-4 left-6 font-mono text-[9px] tracking-[0.18em] text-mist-3">
        STEP {active + 1} / {STEPS.length}
      </div>
    </div>
  );
}
