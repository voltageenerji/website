"use client";

import { motion } from "framer-motion";
import ChapterHeading from "@/components/ui/ChapterHeading";
import Reveal, { RevealGroup } from "@/components/ui/Reveal";
import PtfChart from "@/components/viz/PtfChart";
import EnergyBars from "@/components/viz/EnergyBars";
import VolatilityCurve from "@/components/viz/VolatilityCurve";
import SpreadHeatmap from "@/components/viz/SpreadHeatmap";
import { useMarket } from "@/hooks/useMarket";
import { fmtPct } from "@/lib/format";

const PORTFOLIO = [
  { k: "Day-Ahead (GÖP)", v: 62 },
  { k: "Bilateral (OTC)", v: 31 },
  { k: "Intra-Day (GİP)", v: 7 },
];

export default function LiveMarket() {
  const m = useMarket();
  // Balancing activity proxy: blends volatility + trend energy.
  const activity = Math.min(1, m.volatility * 0.7 + Math.abs(m.trend) * 0.5);

  return (
    <section id="market" className="relative z-10 px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-[1480px]">
        <ChapterHeading
          index="01"
          label="Live Energy Market"
          title={
            <>
              A live command center,
              <br />
              wired to the{" "}
              <span className="text-glow-cyan">national market</span>.
            </>
          }
          intro="Every figure below is pulled in real time from EPİAŞ Şeffaflık — the Turkish energy exchange's transparency platform. No mockups. This is the market as it clears, right now."
        />

        {/* Main grid */}
        <div className="mt-14 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          <Reveal>
            <PtfChart />
          </Reveal>
          <div className="flex flex-col gap-5">
            <Reveal delay={0.05}>
              <EnergyBars />
            </Reveal>
            <Reveal delay={0.1}>
              <VolatilityCurve />
            </Reveal>
          </div>
        </div>

        {/* Secondary grid */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <Reveal>
            <SpreadHeatmap />
          </Reveal>

          {/* Balancing activity */}
          <Reveal delay={0.05}>
            <div className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist-2">
                  Balancing Activity
                </h4>
                <span
                  className="tnum font-mono text-[12px]"
                  style={{ color: "var(--color-emerald-bright)" }}
                >
                  {(activity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex h-[92px] items-end gap-1.5">
                {Array.from({ length: 16 }).map((_, i) => {
                  const phase = (i / 16) * Math.PI * 2;
                  const base = 0.25 + (Math.sin(phase) * 0.5 + 0.5) * activity;
                  return (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-[2px]"
                      style={{
                        background:
                          "linear-gradient(180deg, var(--color-emerald-bright), color-mix(in srgb, var(--color-emerald-bright) 20%, transparent))",
                      }}
                      animate={{ height: [`${base * 60}%`, `${base * 100}%`, `${base * 60}%`] }}
                      transition={{
                        duration: 1.6 + (i % 4) * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  );
                })}
              </div>
              <p className="mt-3 font-mono text-[9px] leading-relaxed tracking-[0.08em] text-mist-3">
                REAL-TIME POSITION MANAGEMENT ACROSS GÖP / GİP · DEVIATION HELD &lt; 1%
              </p>
            </div>
          </Reveal>

          {/* Portfolio movement */}
          <Reveal delay={0.1}>
            <div className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-mist-2">
                  Portfolio Mix
                </h4>
                <span
                  className="tnum font-mono text-[11px]"
                  style={{
                    color: m.trend >= 0 ? "var(--color-up)" : "var(--color-down)",
                  }}
                >
                  {fmtPct(m.trend * 8)}
                </span>
              </div>
              <div className="flex flex-col gap-3.5">
                {PORTFOLIO.map((p, i) => (
                  <div key={p.k}>
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-mist-2">
                      <span>{p.k}</span>
                      <span className="tnum text-mist">{p.v}%</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[rgba(231,238,247,0.06)]">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, var(--color-cyan-deep), var(--color-cyan))",
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${p.v}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Aggregation metrics */}
        <RevealGroup className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            { k: "Connected Facilities", v: "160+", sub: "corporate + industrial" },
            { k: "Markets Operated", v: "GÖP · GİP · OTC", sub: "since 2011" },
            { k: "Contract Deviation", v: "< 1%", sub: "14+ yr track record" },
            { k: "Supply Continuity", v: "24 / 7", sub: "operational uptime" },
          ].map((s) => (
            <Reveal key={s.k}>
              <div className="panel p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-3">
                  {s.k}
                </div>
                <div className="tnum mt-2 text-[24px] font-semibold leading-none text-mist">
                  {s.v}
                </div>
                <div className="mt-1.5 text-[11px] text-mist-3">{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
