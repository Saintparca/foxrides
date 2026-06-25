import { useEffect, useRef } from "react";
import { BW_CENTER, loadGoogleMaps } from "@/lib/maps";

interface Pt { lat: number; lng: number }

export function RouteMap({
  pickup,
  destination,
  height = 220,
}: {
  pickup?: Pt | null;
  destination?: Pt | null;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lineRef = useRef<any>(null);

  useEffect(() => {
    let alive = true;
    loadGoogleMaps().then((g) => {
      if (!alive || !ref.current) return;
      mapRef.current = new g.maps.Map(ref.current, {
        center: pickup || destination || BW_CENTER,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ],
      });
      draw();
    }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { draw(); }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  const draw = () => {
    const g = (window as any).google;
    const map = mapRef.current;
    if (!g || !map) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (lineRef.current) { lineRef.current.setMap(null); lineRef.current = null; }

    const pts: Pt[] = [];
    if (pickup) {
      pts.push(pickup);
      markersRef.current.push(new g.maps.Marker({
        position: pickup, map,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#f08a3c", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      }));
    }
    if (destination) {
      pts.push(destination);
      markersRef.current.push(new g.maps.Marker({
        position: destination, map,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#1e3a8a", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      }));
    }
    if (pts.length === 2) {
      lineRef.current = new g.maps.Polyline({
        path: pts, map, strokeColor: "#1e3a8a", strokeOpacity: 0.85, strokeWeight: 4,
      });
      const b = new g.maps.LatLngBounds();
      pts.forEach((p) => b.extend(p));
      map.fitBounds(b, 60);
    } else if (pts.length === 1) {
      map.setCenter(pts[0]);
      map.setZoom(14);
    }
  };

  return (
    <div
      ref={ref}
      style={{ height }}
      className="w-full overflow-hidden rounded-2xl border border-border bg-muted"
    />
  );
}
