import { useEffect, useRef } from "react";
import { BW_CENTER, loadGoogleMaps } from "@/lib/maps";
import { decodePolyline } from "@/lib/fare";

interface Pt { lat: number; lng: number }

export function RouteMap({
  pickup,
  destination,
  driver,
  polyline,
  height = 220,
}: {
  pickup?: Pt | null;
  destination?: Pt | null;
  driver?: Pt | null;
  polyline?: string | null;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lineRef = useRef<any>(null);
  const driverRef = useRef<any>(null);

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
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
      draw();
    }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { draw(); }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, polyline]);
  useEffect(() => { drawDriver(); }, [driver?.lat, driver?.lng]);

  const draw = () => {
    const g = (window as any).google;
    const map = mapRef.current;
    if (!g || !map) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (lineRef.current) { lineRef.current.setMap(null); lineRef.current = null; }

    if (pickup) {
      markersRef.current.push(new g.maps.Marker({
        position: pickup, map,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#f08a3c", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      }));
    }
    if (destination) {
      markersRef.current.push(new g.maps.Marker({
        position: destination, map,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#000", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      }));
    }

    const path = polyline ? decodePolyline(polyline) : (pickup && destination ? [pickup, destination] : []);
    if (path.length >= 2) {
      lineRef.current = new g.maps.Polyline({
        path, map, strokeColor: "#f08a3c", strokeOpacity: 0.95, strokeWeight: 5,
      });
      const b = new g.maps.LatLngBounds();
      path.forEach((p) => b.extend(p));
      map.fitBounds(b, 60);
    } else if (pickup || destination) {
      map.setCenter((pickup || destination)!);
      map.setZoom(14);
    }
  };

  const drawDriver = () => {
    const g = (window as any).google;
    const map = mapRef.current;
    if (!g || !map) return;
    if (!driver) { if (driverRef.current) { driverRef.current.setMap(null); driverRef.current = null; } return; }
    if (!driverRef.current) {
      driverRef.current = new g.maps.Marker({
        position: driver, map,
        icon: { path: "M-8,-4 L8,-4 L10,0 L8,4 L-8,4 L-10,0 Z", scale: 1.4, fillColor: "#f08a3c", fillOpacity: 1, strokeColor: "#000", strokeWeight: 2, rotation: 0 },
      });
    } else {
      driverRef.current.setPosition(driver);
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
