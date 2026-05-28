export interface PtfPoint {
  hour: number;
  price: number;
}

export interface PtfStats {
  current: number;
  min: number;
  max: number;
  avg: number;
}

export interface PtfPayload {
  items: PtfPoint[];
  stats?: PtfStats;
  date?: string;
}

/** Derived market intelligence shared across UI + the Three.js field. */
export interface MarketSnapshot {
  /** 24 hourly ₺/MWh values (real or fallback). */
  prices: number[];
  current: number;
  avg: number;
  min: number;
  max: number;
  spread: number;
  /** Normalised 0..1 volatility (intraday dispersion). */
  volatility: number;
  /** 0..1 position of `current` inside the day's range — "load intensity". */
  intensity: number;
  /** -1..1 short-term trend (last hours slope). */
  trend: number;
  /** % change of current hour vs day average. */
  deltaPct: number;
  isLive: boolean;
  loading: boolean;
  date: string | null;
  /** Increments on each successful upstream sync (drives API-activity pulses). */
  pulse: number;
}
