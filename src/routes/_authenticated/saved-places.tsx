import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlaceAutocomplete, type PlacePick } from "@/components/PlaceAutocomplete";
import { Home, Briefcase, Star, Trash2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/saved-places")({
  component: SavedPlaces,
});

function SavedPlaces() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"home" | "work" | "favourite">("favourite");
  const [pick, setPick] = useState<PlacePick | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("saved_places").select("*").eq("user_id", user!.id).order("created_at");
    setPlaces(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!pick) { toast.error("Pick a location"); return; }
    setBusy(true);
    const finalLabel = label.trim() || (kind === "home" ? "Home" : kind === "work" ? "Work" : pick.address.split(",")[0]);
    const { error } = await supabase.from("saved_places").insert({
      user_id: user!.id, label: finalLabel, address: pick.address, lat: pick.lat, lng: pick.lng, kind,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setLabel(""); setPick(null); setText(""); setKind("favourite");
    toast.success("Saved");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_places").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const iconFor = (k: string) => k === "home" ? <Home className="h-4 w-4" /> : k === "work" ? <Briefcase className="h-4 w-4" /> : <Star className="h-4 w-4" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/app" className="rounded-full border border-border p-2"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-3xl font-black tracking-tight">Saved places</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {(["home","work","favourite"] as const).map(k => (
            <button key={k} onClick={() => setKind(k)}
              className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${kind===k?"bg-primary text-primary-foreground":"bg-muted"}`}>
              {iconFor(k)} {k[0].toUpperCase()+k.slice(1)}
            </button>
          ))}
        </div>
        {kind === "favourite" && (
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Mom's house" maxLength={40} />
          </div>
        )}
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Address</Label>
          <PlaceAutocomplete value={text} placeholder="Search address" onTextChange={setText} onPick={(p) => { setPick(p); setText(p.address); }} />
        </div>
        <Button onClick={add} disabled={busy || !pick} className="w-full rounded-full">Save place</Button>
      </div>

      <div className="space-y-2">
        {places.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No saved places yet.</div>
        ) : places.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted">{iconFor(p.kind)}</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{p.label}</div>
                <div className="truncate text-xs text-muted-foreground">{p.address}</div>
              </div>
            </div>
            <button onClick={() => remove(p.id)} className="rounded-full p-2 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
