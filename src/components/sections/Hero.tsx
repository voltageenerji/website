"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useMarket } from "@/hooks/useMarket";
import { fmtPrice, fmtInt } from "@/lib/format";

const EASE = [0.16, 1, 0.3, 1] as const;

const titleWords = ["Electricity", "Markets,", "Reengineered."];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const m = useMarket();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative z-10 flex min-h-[100svh] flex-col justify-center px-5 pt-28 pb-20 sm:px-8"
    >
      <motion.div style={{ y, opacity }} className="mx-auto w-full max-w-[1480px]">
        {/* eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <span className="pulse-dot" />
          <span className="eyebrow">
            Live national energy intelligence · Türkiye
          </span>
        </motion.div>

        {/* headline */}
        <h1 className="mt-7 text-[clamp(44px,9vw,140px)] font-semibold leading-[0.95] tracking-[-0.045em]">
          {titleWords.map((w, i) => (
            <span key={w} className="block overflow-hidden">
              <motion.span
                className="inline-block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1, ease: EASE, delay: 0.25 + i * 0.12 }}
                style={
                  i === 2
                    ? {
                        background:
                          "linear-gradient(100deg, var(--color-cyan), var(--color-cyan-soft) 55%, var(--color-gold-bright))",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                    : undefined
                }
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* sub + live readout */}
        <div className="mt-10 grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.7 }}
            className="max-w-xl text-[18px] leading-relaxed text-mist-2"
          >
            Voltage runs real-time electricity-market operations on EPİAŞ —
            prepaid purchasing, deferred sales and aggregation engineered into
            a single living infrastructure. This page is wired to the live
            market.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.85 }}
            className="panel grid grid-cols-2 gap-px overflow-hidden p-0"
          >
            <Readout
              k="Day-Ahead PTF"
              v={`${fmtPrice(m.current)} ₺`}
              sub={m.isLive ? "live · ₺/MWh" : "syncing · ₺/MWh"}
              live
            />
            <Readout
              k="Intraday Spread"
              v={`${fmtInt(m.spread)} ₺`}
              sub="24h high − low"
            />
            <Readout
              k="Volatility"
              v={`${(m.volatility * 100).toFixed(0)}/100`}
              sub="intraday dispersion"
            />
            <Readout
              k="Load Intensity"
              v={`${(m.intensity * 100).toFixed(0)}%`}
              sub="of daily range"
            />
          </motion.div>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href="#market"
            className="rounded-full px-6 py-3.5 text-[14px] font-medium text-void transition-transform hover:-translate-y-0.5"
            style={{
              background:
                "linear-gradient(90deg, var(--color-cyan), var(--color-cyan-soft))",
              boxShadow:
                "0 0 28px color-mix(in srgb, var(--color-cyan) 45%, transparent)",
            }}
          >
            Enter the command center →
          </a>
          <a
            href="#model"
            className="rounded-full border border-hair px-6 py-3.5 text-[14px] font-medium text-mist transition-colors hover:border-cyan hover:text-cyan"
          >
            How Voltage works
          </a>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-mist-3"
      >
        SCROLL
      </motion.div>
    </section>
  );
}

function Readout({
  k,
  v,
  sub,
  live,
}: {
  k: string;
  v: string;
  sub: string;
  live?: boolean;
}) {
  return (
    <div className="bg-[rgba(231,238,247,0.015)] p-4">
      <div className="flex items-center gap-1.5">
        {live && <span className="pulse-dot scale-75" />}
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-3">
          {k}
        </span>
      </div>
      <div className="tnum mt-1.5 text-[22px] font-medium leading-none text-mist">
        {v}
      </div>
      <div className="mt-1 font-mono text-[9px] tracking-[0.1em] text-mist-3">
        {sub}
      </div>
    </div>
  );
}
