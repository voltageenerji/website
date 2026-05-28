"use client";

import { useEffect, useState } from "react";
import { useMarket } from "@/hooks/useMarket";
import { fmtPrice } from "@/lib/format";
import { SCENES } from "@/lib/constants";

const CHAPTERS = SCENES.filter((s) => s.id !== "hero");

export default function Nav() {
  const market = useMarket();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const up = market.deltaPct >= 0;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(5,7,11,0.72)" : "transparent",
        backdropFilter: scrolled ? "blur(18px) saturate(140%)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--color-hair)"
          : "1px solid transparent",
      }}
    >
      <nav className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-4 sm:px-8">
        {/* Brand */}
        <a href="#hero" className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center">
            <svg viewBox="0 0 36 36" className="h-full w-full" fill="none">
              <circle cx="18" cy="18" r="16.5" stroke="var(--color-cyan)" strokeOpacity="0.4" />
              <path
                d="M11 10 L18 26 L25 10"
                stroke="var(--color-mist)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="18" cy="18" r="1.6" fill="var(--color-cyan)" />
            </svg>
          </span>
          <span className="flex items-baseline gap-2 leading-none">
            <span className="text-[18px] font-semibold tracking-tight text-mist">
              Voltage
            </span>
            <span className="hidden font-mono text-[9px] tracking-[0.3em] text-mist-3 sm:inline">
              ENERGY
            </span>
          </span>
        </a>

        {/* Chapter links */}
        <div className="hidden items-center gap-7 font-mono text-[11px] tracking-[0.18em] text-mist-2 lg:flex">
          {CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="uppercase transition-colors hover:text-cyan"
            >
              {c.label}
            </a>
          ))}
        </div>

        {/* Live PTF chip */}
        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-2.5 rounded-full border border-hair px-3.5 py-1.5 sm:flex"
            style={{ background: "rgba(231,238,247,0.04)" }}
          >
            <span className="pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-3">
              PTF
            </span>
            <span className="tnum font-mono text-[12px] font-medium text-mist">
              {fmtPrice(market.current)}
            </span>
            <span
              className="tnum font-mono text-[10px]"
              style={{ color: up ? "var(--color-up)" : "var(--color-down)" }}
            >
              {up ? "▲" : "▼"} {Math.abs(market.deltaPct).toFixed(1)}%
            </span>
          </div>
          <a
            href="#contact"
            className="rounded-full px-4 py-2 text-[12px] font-medium tracking-tight text-void transition-transform hover:-translate-y-px"
            style={{
              background:
                "linear-gradient(90deg, var(--color-cyan), var(--color-cyan-soft))",
              boxShadow: "0 0 22px color-mix(in srgb, var(--color-cyan) 40%, transparent)",
            }}
          >
            Talk to us
          </a>
        </div>
      </nav>
    </header>
  );
}
