"use client";

import { motion } from "framer-motion";
import ChapterHeading from "@/components/ui/ChapterHeading";
import Reveal, { RevealGroup } from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";

// Illustrative recurring-cashflow trajectory (normalised heights).
const CASHFLOW = [18, 24, 29, 33, 40, 46, 52, 61, 68, 77, 86, 100];

const W = 760;
const H = 240;

export default function InvestmentScale() {
  const pts = CASHFLOW.map((v, i) => {
    const x = (i / (CASHFLOW.length - 1)) * W;
    const y = H - (v / 100) * (H - 20) - 10;
    return [+x.toFixed(1), +y.toFixed(1)] as [number, number];
  });
  const line = "M" + pts.map((p) => p.join(",")).join(" L");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <section id="investment" className="relative z-10 px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-[1480px]">
        <ChapterHeading
          index="04"
          label="Investment & Scale"
          title={
            <>
              Energy, structured like{" "}
              <span style={{ color: "var(--color-gold-bright)" }}>
                financial infrastructure
              </span>
              .
            </>
          }
          intro="Aggregated demand, prepaid positions and deferred sales compound into predictable, recurring cashflow — a platform built to scale across Türkiye's national demand curve."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* Cashflow growth */}
          <Reveal>
            <div className="panel p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-[18px] font-medium tracking-tight">
                  Recurring Cashflow · trajectory
                </h3>
                <span
                  className="tnum font-mono text-[12px]"
                  style={{ color: "var(--color-gold-bright)" }}
                >
                  compounding
                </span>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[220px] w-full">
                <defs>
                  <linearGradient id="cashFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="var(--color-hair-2)" strokeWidth="1">
                  {[0.33, 0.66].map((f) => (
                    <line key={f} x1="0" x2={W} y1={f * H} y2={f * H} />
                  ))}
                </g>
                <motion.path
                  d={area}
                  fill="url(#cashFill)"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
                <motion.path
                  d={line}
                  fill="none"
                  stroke="var(--color-gold-bright)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <div className="mt-3 flex justify-between font-mono text-[9px] tracking-[0.12em] text-mist-3">
                <span>YEAR 1</span>
                <span>SCALE PHASE</span>
                <span>NATIONAL</span>
              </div>
            </div>
          </Reveal>

          {/* KPI stack */}
          <div className="flex flex-col gap-5">
            <Reveal>
              <Kpi
                label="Track record"
                value={<CountUp to={14} suffix="+ yrs" />}
                sub="active on EPİAŞ since 2011"
              />
            </Reveal>
            <Reveal delay={0.06}>
              <Kpi
                label="Aggregated facilities"
                value={<CountUp to={160} suffix="+" />}
                sub="corporate + industrial loads"
              />
            </Reveal>
            <Reveal delay={0.12}>
              <Kpi
                label="Contract deviation"
                value={<CountUp to={1} prefix="< " suffix="%" />}
                sub="volatility absorbed by Voltage"
              />
            </Reveal>
          </div>
        </div>

        <RevealGroup className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              t: "Asset-light by design",
              d: "Voltage owns the operating model, not the generation — a software-and-strategy layer over the physical grid.",
            },
            {
              t: "Recurring by structure",
              d: "Contracted offtake plus prepaid positions turn spot volatility into durable, predictable margin.",
            },
            {
              t: "Scalable by repetition",
              d: "The same engine that serves heavy industry today extends to residential aggregation tomorrow.",
            },
          ].map((c) => (
            <Reveal key={c.t}>
              <div className="panel h-full p-6">
                <div
                  className="h-px w-10"
                  style={{ background: "var(--color-gold-bright)" }}
                />
                <h4 className="mt-4 text-[18px] font-medium tracking-tight">
                  {c.t}
                </h4>
                <p className="mt-2 text-[14px] leading-relaxed text-mist-2">
                  {c.d}
                </p>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="panel p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-3">
        {label}
      </div>
      <div className="mt-2 text-[40px] font-semibold leading-none text-mist">
        {value}
      </div>
      <div className="mt-2 text-[13px] text-mist-2">{sub}</div>
    </div>
  );
}
