import { useEffect, useRef, useState } from "react";
import { searchSerowePlaces, getSerowePlace } from "@/lib/places.functions";
import { toast } from "sonner";
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
  const [suggs, setSuggs] = useState<{ placeId: string; text: string }[]>([]);
  const [open, setOpen] = useState(false);
  const tokenRef = useRef<string>(crypto.randomUUID());
  const timer = useRef<any>(null);
  const seq = useRef(0);

  useEffect(() => { setInput(value); }, [value]);

  const query = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (text.trim().length < 2) { setSuggs([]); return; }
      const n = ++seq.current;
      try {
        const r = await searchSerowePlaces({ data: { input: text, sessionToken: tokenRef.current } });
        if (n !== seq.current) return;
        setSuggs(r); setOpen(true);
      } catch { setSuggs([]); }
    }, 300);
  };

  const choose = async (s: { placeId: string; text: string }) => {
    try {
      const pick = await getSerowePlace({ data: { placeId: s.placeId, sessionToken: tokenRef.current } });
      tokenRef.current = crypto.randomUUID();
      setInput(pick.address); setOpen(false); setSuggs([]);
      onPick(pick);
    } catch (e: any) { toast.error(e?.message ?? "Could not load that place"); }
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
          {suggs.slice(0, 8).map((s, i) => {
            const t = s.text;
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
