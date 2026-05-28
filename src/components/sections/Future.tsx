"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import { TR_OUTLINE, COMPANY } from "@/lib/constants";

function useGridDots() {
  return useMemo(() => {
    const dots: { x: number; y: number; d: number }[] = [];
    for (let x = 46; x <= 926; x += 23) {
      for (let y = 108; y <= 302; y += 22) {
        dots.push({ x, y, d: (x / 926) * 2.2 + (Math.random() * 0.4) });
      }
    }
    return dots;
  }, []);
}

export default function Future() {
  const dots = useGridDots();

  return (
    <section id="future" className="relative z-10 px-5 py-32 sm:px-8 sm:py-44">
      <style>{`
        @keyframes illuminate {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.95; }
        }
      `}</style>

      <div className="mx-auto max-w-[1480px]">
        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <span className="eyebrow">05 · The Future</span>
            <h2 className="mt-6 text-[clamp(32px,5.4vw,76px)] font-semibold leading-[1.04] tracking-[-0.035em]">
              The future of energy belongs to{" "}
              <span
                style={{
                  background:
                    "linear-gradient(100deg, var(--color-cyan), var(--color-gold-bright))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                intelligent infrastructure
              </span>
              .
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-[18px] leading-relaxed text-mist-2">
              Not more wires — more intelligence on the wires we have. Voltage is
              building the operating system for a national energy network that
              thinks, balances and scales in real time.
            </p>
          </div>
        </Reveal>

        {/* Illuminating Türkiye */}
        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-16 max-w-5xl">
            <svg viewBox="0 0 980 340" className="block w-full">
              <defs>
                <clipPath id="trClip">
                  <path d={TR_OUTLINE} />
                </clipPath>
                <filter id="dotGlow">
                  <feGaussianBlur stdDeviation="1.1" />
                </filter>
              </defs>

              <path
                d={TR_OUTLINE}
                fill="rgba(47,230,255,0.03)"
                stroke="var(--color-hair)"
                strokeWidth="1"
              />

              <g clipPath="url(#trClip)" filter="url(#dotGlow)">
                {dots.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={1.7}
                    fill="var(--color-cyan)"
                    style={{
                      animation: `illuminate 3.4s ease-in-out ${p.d}s infinite`,
                    }}
                  />
                ))}
              </g>
            </svg>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[10px] tracking-[0.3em] text-mist-3">
              TÜRKİYE · COMING ONLINE
            </div>
          </div>
        </Reveal>

        {/* Closing CTA */}
        <div id="contact" className="mx-auto mt-24 max-w-3xl scroll-mt-24 text-center">
          <Reveal>
            <h3 className="text-[clamp(26px,3.6vw,46px)] font-semibold tracking-[-0.03em]">
              This is not a normal energy company.
            </h3>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-mist-2">
              Share your consumption profile and we&apos;ll model a tailored
              position on the live market. Typical response: one business day.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <motion.a
                whileHover={{ y: -2 }}
                href={`mailto:${COMPANY.email}`}
                className="rounded-full px-7 py-3.5 text-[14px] font-medium text-void"
                style={{
                  background:
                    "linear-gradient(90deg, var(--color-cyan), var(--color-cyan-soft))",
                  boxShadow:
                    "0 0 30px color-mix(in srgb, var(--color-cyan) 45%, transparent)",
                }}
              >
                Request a proposal
              </motion.a>
              <a
                href={COMPANY.phoneHref}
                className="rounded-full border border-hair px-7 py-3.5 text-[14px] font-medium text-mist transition-colors hover:border-cyan hover:text-cyan"
              >
                {COMPANY.phone}
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-6 font-mono text-[11px] tracking-[0.18em] text-mist-3">
              {COMPANY.email.toUpperCase()} · İSTANBUL · TÜRKİYE
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
