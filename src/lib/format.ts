export const fmtPrice = (v: number) =>
  v.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtInt = (v: number) => Math.round(v).toLocaleString("tr-TR");

export const fmtPct = (v: number) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
