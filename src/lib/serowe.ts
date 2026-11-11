// Fox Rides operates in Serowe, Botswana only.
export const SEROWE_CENTER = { lat: -22.3875, lng: 26.7108 };
export const SEROWE_BOUNDS = { south: -22.47, west: 26.62, north: -22.31, east: 26.8 };
export function inSerowe(p: { lat: number; lng: number } | null | undefined) {
  return !!p && p.lat >= SEROWE_BOUNDS.south && p.lat <= SEROWE_BOUNDS.north &&
    p.lng >= SEROWE_BOUNDS.west && p.lng <= SEROWE_BOUNDS.east;
}
