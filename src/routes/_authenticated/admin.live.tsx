import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadGoogleMaps, BW_CENTER } from "@/lib/maps";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/live")({
  component: AdminLive,
});

type DriverLoc = {
  driver_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  updated_at: string;
  name?: string;
  plate?: string;
};

function AdminLive() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});
  const [locs, setLocs] = useState<DriverLoc[]>([]);

  const load = async () => {
    const { data: locations } = await supabase
      .from("driver_locations")
      .select("*")
      .gte("updated_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
    if (!locations?.length) { setLocs([]); return; }
    const ids = locations.map((l) => l.driver_id);
    const { data: drivers } = await supabase
      .from("drivers")
      .select("id, vehicle_plate, profiles:id(full_name)")
      .in("id", ids);
    const map = new Map((drivers ?? []).map((d: any) => [d.id, d]));
    setLocs(locations.map((l) => {
      const d: any = map.get(l.driver_id);
      return {
        driver_id: l.driver_id,
        lat: Number(l.lat),
        lng: Number(l.lng),
        heading: l.heading,
        updated_at: l.updated_at,
        name: d?.profiles?.full_name,
        plate: d?.vehicle_plate,
      };
    }));
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-live-drivers")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations" }, () => load())
      .subscribe();
    const t = setInterval(load, 15000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  useEffect(() => {
    let alive = true;
    loadGoogleMaps().then((g) => {
      if (!alive || !mapEl.current) return;
      mapRef.current = new g.maps.Map(mapEl.current, {
        center: BW_CENTER, zoom: 12, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy",
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const g = (window as any).google;
    const map = mapRef.current;
    if (!g || !map) return;
    const alive = new Set(locs.map((l) => l.driver_id));
    // remove stale
    Object.keys(markers.current).forEach((id) => {
      if (!alive.has(id)) { markers.current[id].setMap(null); delete markers.current[id]; }
    });
    // upsert
    const bounds = new g.maps.LatLngBounds();
    locs.forEach((l) => {
      const pos = { lat: l.lat, lng: l.lng };
      if (!markers.current[l.driver_id]) {
        markers.current[l.driver_id] = new g.maps.Marker({
          position: pos, map,
          title: `${l.name ?? "Driver"} · ${l.plate ?? ""}`,
          icon: { path: "M-8,-4 L8,-4 L10,0 L8,4 L-8,4 L-10,0 Z", scale: 1.4, fillColor: "#f08a3c", fillOpacity: 1, strokeColor: "#000", strokeWeight: 2 },
        });
      } else {
        markers.current[l.driver_id].setPosition(pos);
      }
      bounds.extend(pos);
    });
    if (locs.length) map.fitBounds(bounds, 60);
  }, [locs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm">
        <Radio className="h-4 w-4 text-primary" />
        <span className="font-bold">{locs.length}</span>
        <span className="text-muted-foreground">drivers online (last 10 min)</span>
      </div>
      <div ref={mapEl} style={{ height: 380 }} className="w-full overflow-hidden rounded-2xl border border-border bg-muted" />
      <div className="space-y-2">
        {locs.map((l) => (
          <div key={l.driver_id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
            <div className="min-w-0">
              <div className="truncate font-bold">{l.name ?? l.driver_id.slice(0, 8)}</div>
              <div className="text-xs text-muted-foreground">{l.plate ?? "—"} · updated {new Date(l.updated_at).toLocaleTimeString()}</div>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Online</span>
          </div>
        ))}
        {locs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No drivers online right now.
          </div>
        )}
      </div>
    </div>
  );
}
