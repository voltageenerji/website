// Deterministik, hızlı PRNG (mulberry32). Oturum başına tohumlanır;
// dünya üretimi ve hava seçimi bunun üzerinden yürür.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rng = mulberry32(Date.now() % 2147483647);

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function range(min: number, max: number): number {
  return min + rng() * (max - min);
}
