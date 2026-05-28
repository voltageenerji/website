"use client";

import { useSyncExternalStore } from "react";
import { marketStore } from "@/lib/store";
import type { MarketSnapshot } from "@/lib/types";

/** Subscribe a component to live market intelligence. */
export function useMarket(): MarketSnapshot {
  return useSyncExternalStore(
    marketStore.subscribe,
    marketStore.getSnapshot,
    marketStore.getServerSnapshot,
  );
}
