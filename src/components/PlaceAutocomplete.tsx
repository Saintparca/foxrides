import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps";
import { Input } from "@/components/ui/input";

export interface PlacePick {
  address: string;
  lat: number;
  lng: number;
}

export function PlaceAutocomplete({
  value,
  placeholder,
  onPick,
  onTextChange,
}: {
  value: string;
  placeholder?: string;
  onPick: (p: PlacePick) => void;
  onTextChange?: (s: string) => void;
}) {
  const [input, setInput] = useState(value);
  const [suggs, setSuggs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const tokenRef = useRef<any>(null);
  const placesRef = useRef<any>(null);
  const timer = useRef<any>(null);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    let alive = true;
    loadGoogleMaps()
      .then((g) => g.maps.importLibrary("places"))
      .then((places: any) => {
        if (!alive) return;
        placesRef.current = places;
        tokenRef.current = new places.AutocompleteSessionToken();
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const query = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const places = placesRef.current;
      if (!places || text.trim().length < 2) { setSuggs([]); return; }
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: text,
          sessionToken: tokenRef.current,
          includedRegionCodes: ["bw"],
        });
        setSuggs(suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggs([]);
      }
    }, 220);
  };

  const choose = async (s: any) => {
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress", "displayName"] });
      const loc = place.location;
      const addr = place.formattedAddress || s.placePrediction.text.text;
      const pick = { address: addr, lat: loc.lat(), lng: loc.lng() };
      setInput(addr);
      setOpen(false);
      setSuggs([]);
      // Fresh token after a selection
      tokenRef.current = new placesRef.current.AutocompleteSessionToken();
      onPick(pick);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="relative">
      <Input
        value={input}
        placeholder={placeholder}
        onChange={(e) => {
          setInput(e.target.value);
          onTextChange?.(e.target.value);
          query(e.target.value);
        }}
        onFocus={() => suggs.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-9 border-0 px-0 text-base focus-visible:ring-0"
        maxLength={200}
      />
      {open && suggs.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {suggs.slice(0, 6).map((s, i) => {
            const t = s.placePrediction?.text?.text ?? "";
            return (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
