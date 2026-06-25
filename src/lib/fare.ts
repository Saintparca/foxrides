// Simple deterministic fare estimator — no map APIs required.
// Distance is pseudo-derived from string hash so demo flows produce stable numbers.
export const BASE_FARE = 2.5;
export const PER_KM = 1.4;
export const DRIVER_SHARE = 0.8;

export function estimateDistanceKm(pickup: string, destination: string): number {
  const s = (pickup + "|" + destination).toLowerCase().trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  // 2 – 28 km range
  return Math.round(((h % 2600) / 100 + 2) * 10) / 10;
}

export function estimateFare(km: number): number {
  return Math.round((BASE_FARE + km * PER_KM) * 100) / 100;
}

export function fmtMoney(n: number) {
  return `$${n.toFixed(2)}`;
}
