import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Pt = { lat: number; lng: number };

export const computeRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { origin: Pt; destination: Pt; intermediates?: Pt[] }) => {
    const ok = (p: any) =>
      p && typeof p.lat === "number" && typeof p.lng === "number" &&
      p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180;
    if (!ok(d?.origin) || !ok(d?.destination)) throw new Error("Invalid coordinates");
    if (d.intermediates && d.intermediates.some((p) => !ok(p))) throw new Error("Invalid stop coordinates");
    return d;
  })
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GMAPS = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GMAPS) {
      return { ok: false as const, error: "Maps not configured", distanceKm: 0, durationMin: 0, polyline: "" };
    }
    try {
      const body: any = {
        origin: { location: { latLng: { latitude: data.origin.lat, longitude: data.origin.lng } } },
        destination: { location: { latLng: { latitude: data.destination.lat, longitude: data.destination.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      };
      if (data.intermediates?.length) {
        body.intermediates = data.intermediates.map((p) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } }));
      }
      const res = await fetch(
        "https://connector-gateway.lovable.dev/google_maps/routes/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GMAPS,
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        return { ok: false as const, error: `Routes ${res.status}: ${txt.slice(0, 200)}`, distanceKm: 0, durationMin: 0, polyline: "" };
      }
      const j: any = await res.json();
      const r = j?.routes?.[0];
      if (!r) return { ok: false as const, error: "No route", distanceKm: 0, durationMin: 0, polyline: "" };
      const durSec = parseInt(String(r.duration ?? "0s").replace("s", ""), 10) || 0;
      return {
        ok: true as const,
        distanceKm: Math.round((r.distanceMeters / 1000) * 10) / 10,
        durationMin: Math.round(durSec / 60),
        polyline: r.polyline?.encodedPolyline ?? "",
      };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Route error", distanceKm: 0, durationMin: 0, polyline: "" };
    }
  });
