import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SEROWE_BOUNDS, inSerowe } from "@/lib/serowe";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
function keys() {
  const a = process.env.LOVABLE_API_KEY, b = process.env.GOOGLE_MAPS_API_KEY;
  if (!a || !b) throw new Error("Maps not configured");
  return { Authorization: `Bearer ${a}`, "X-Connection-Api-Key": b };
}

export const searchSerowePlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { input: string; sessionToken: string }) =>
    z.object({ input: z.string().trim().min(2).max(100), sessionToken: z.string().max(64) }).parse(d))
  .handler(async ({ data }) => {
    const res = await fetch(`${GATEWAY}/places/v1/places:autocomplete`, {
      method: "POST",
      headers: { ...keys(), "Content-Type": "application/json",
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text" },
      body: JSON.stringify({
        input: data.input, sessionToken: data.sessionToken, includedRegionCodes: ["bw"],
        locationRestriction: { rectangle: {
          low: { latitude: SEROWE_BOUNDS.south, longitude: SEROWE_BOUNDS.west },
          high: { latitude: SEROWE_BOUNDS.north, longitude: SEROWE_BOUNDS.east } } },
      }),
    });
    if (!res.ok) throw new Error(`Places ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j: any = await res.json();
    return ((j.suggestions ?? []) as any[]).filter((s) => s.placePrediction).slice(0, 8)
      .map((s) => ({ placeId: String(s.placePrediction.placeId), text: String(s.placePrediction.text?.text ?? "") }));
  });

export const getSerowePlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { placeId: string; sessionToken: string }) =>
    z.object({ placeId: z.string().regex(/^[\w-]{1,300}$/), sessionToken: z.string().max(64) }).parse(d))
  .handler(async ({ data }) => {
    const res = await fetch(`${GATEWAY}/places/v1/places/${data.placeId}?sessionToken=${encodeURIComponent(data.sessionToken)}`, {
      headers: { ...keys(), "X-Goog-FieldMask": "location,formattedAddress,displayName" },
    });
    if (!res.ok) throw new Error(`Places ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const p: any = await res.json();
    const pick = { lat: p.location?.latitude, lng: p.location?.longitude,
      address: p.displayName?.text ? `${p.displayName.text}, Serowe` : p.formattedAddress };
    if (!inSerowe(pick)) throw new Error("Fox Rides only operates in Serowe");
    return pick as { lat: number; lng: number; address: string };
  });
