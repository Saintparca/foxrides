// Botswana Pula fare model
export const BASE_FARE = 10; // P10 flag
export const PER_KM = 5;     // P5 per km
export const DRIVER_SHARE = 0.8;

// Haversine distance in km between two lat/lng pairs
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

// Fallback: pseudo distance from strings when no coords yet
export function estimateDistanceKm(pickup: string, destination: string): number {
  const s = (pickup + "|" + destination).toLowerCase().trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return Math.round(((h % 2600) / 100 + 2) * 10) / 10;
}

export function estimateFare(km: number): number {
  return Math.round((BASE_FARE + km * PER_KM) * 100) / 100;
}

export function fmtMoney(n: number) {
  return `P ${n.toFixed(2)}`;
}
