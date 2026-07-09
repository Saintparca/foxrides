// Botswana Pula fare model (Fox Rides) — tuned to reference network, P1 cheaper.
export const BASE_FARE = 3;         // P3 flag-fall
export const PER_KM = 1.4;          // P1.40 per km
export const PER_MIN = 0.3;         // P0.30 per minute
export const MIN_FARE = 12;         // P12 minimum
export const BOOKING_FEE = 0;
export const CANCEL_FEE = 10;
export const DRIVER_SHARE = 0.90;
export const DAILY_PAYOUT_FEE = 15;
export const WEEKLY_PAYOUT_FEE = 0;

export type RideClass = "fastest" | "economy" | "comfort";
export const CLASS_MULT: Record<RideClass, number> = {
  fastest: 1,
  economy: 1,
  comfort: 1.15,
};

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

export function estimateFare(km: number, minutes: number = Math.max(3, Math.round((km / 30) * 60)), cls: RideClass = "economy"): number {
  const raw = BASE_FARE + km * PER_KM + minutes * PER_MIN + BOOKING_FEE;
  const withFloor = Math.max(MIN_FARE, raw);
  return Math.round(withFloor * CLASS_MULT[cls] * 100) / 100;
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
