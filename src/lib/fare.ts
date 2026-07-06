// Botswana Pula fare model (Fox Rides production)
export const BASE_FARE = 10;        // P10 flag-fall
export const PER_KM = 2.5;          // P2.50 per km
export const PER_MIN = 0.4;         // P0.40 per minute
export const MIN_FARE = 15;         // P15 minimum
export const BOOKING_FEE = 0;
export const CANCEL_FEE = 10;       // P10 after driver arrives
export const DRIVER_SHARE = 0.90;   // 10% commission — driver keeps 90%
export const DAILY_PAYOUT_FEE = 15; // P15 optional daily payout fee (P10–P20 range)
export const WEEKLY_PAYOUT_FEE = 0; // Free weekly payout

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

// Old single-arg signature (km only) — kept for backwards compat.
// New signature: estimateFare(km, minutes)
export function estimateFare(km: number, minutes: number = Math.max(3, km * 2)): number {
  const raw = BASE_FARE + km * PER_KM + minutes * PER_MIN + BOOKING_FEE;
  return Math.round(Math.max(MIN_FARE, raw) * 100) / 100;
}

export function fmtMoney(n: number) {
  return `P ${n.toFixed(2)}`;
}

// Decode Google encoded polyline → [{lat,lng}, ...]
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }
  return points;
}
