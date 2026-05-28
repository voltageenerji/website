"use client";

import { useEffect, useState } from "react";

/**
 * Returns a stable hour (12) during SSR / first client render to keep
 * hydration deterministic, then the real local hour after mount (refreshed
 * every minute). Use anywhere a "current hour" marker is rendered.
 */
export function useNowHour(): number {
  const [hour, setHour] = useState(12);
  useEffect(() => {
    const update = () => setHour(new Date().getHours());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  return hour;
}
