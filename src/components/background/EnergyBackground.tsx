"use client";

import { Canvas } from "@react-three/fiber";
import EnergyField from "./EnergyField";

/**
 * Fixed, full-viewport living atmosphere. Sits behind all content and reacts
 * to scroll, cursor, market volatility and live API activity. Pointer events
 * pass straight through to the UI.
 */
export default function EnergyBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        // graceful base color if WebGL is unavailable
        background:
          "radial-gradient(ellipse at 70% 20%, #0e2747 0%, #05070b 60%)",
      }}
    >
      <Canvas
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.6]}
        orthographic
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <EnergyField />
      </Canvas>
    </div>
  );
}
