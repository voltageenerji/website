"use client";

import dynamic from "next/dynamic";

// WebGL is client-only — never render the Canvas during static export SSR.
const EnergyBackground = dynamic(() => import("./EnergyBackground"), {
  ssr: false,
});

export default function BackgroundMount() {
  return <EnergyBackground />;
}
