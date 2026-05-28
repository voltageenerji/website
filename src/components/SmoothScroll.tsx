"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { live } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

/**
 * Buttery, physically-natural scrolling (Lenis) wired into GSAP's ticker so
 * ScrollTrigger scenes stay perfectly in sync. Also streams scroll progress,
 * velocity and pointer position into the render-loop store that drives the
 * living Three.js atmosphere.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3.2), // expo-ish, cinematic deceleration
      smoothWheel: !reduce,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      lerp: reduce ? 1 : 0.085,
    });

    lenis.on(
      "scroll",
      (e: { progress: number; velocity: number }) => {
        live.scroll = e.progress || 0;
        live.velocity = e.velocity || 0;
        ScrollTrigger.update();
      },
    );

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Pointer → normalised (-1..1) for the cursor-reactive energy surface.
    const onPointer = (ev: PointerEvent) => {
      live.pointerX = (ev.clientX / window.innerWidth) * 2 - 1;
      live.pointerY = -((ev.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Anchor links route through Lenis for the cinematic glide.
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (el) {
        ev.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -10, duration: 1.6 });
      }
    };
    document.addEventListener("click", onClick);

    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
