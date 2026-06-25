import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { estimateDistanceKm, estimateFare, fmtMoney } from "@/lib/fare";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Navigation, Car, Star, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppHome,
});

function AppHome() {
  const { user, roles } = useAuth();
  const isDriver = roles.includes("driver");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          {isDriver ? "Ready to drive" : "Where to?"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isDriver ? "Toggle availability and pick up nearby rides." : "Book in seconds — fare estimated upfront."}
        </p>
      </div>

      {isDriver ? <DriverPanel userId={user!.id} /> : <BookingPanel userId={user!.id} />}
    </div>
  );
}

function BookingPanel({ userId }: { userId: string }) {
  const [pickup, setPickup] = useState("");
  const [dest, setDest] = useState("");
  const [busy, setBusy] = useState(false);

  const km = useMemo(() => (pickup && dest ? estimateDistanceKm(pickup, dest) : 0), [pickup, dest]);
  const fare = useMemo(() => (km ? estimateFare(km) : 0), [km]);

  const book = async () => {
    if (!pickup.trim() || !dest.trim()) { toast.error("Enter pickup and destination"); return; }
    setBusy(true);
    const { error } = await supabase.from("rides").insert({
      customer_id: userId, pickup_address: pickup.trim(), destination_address: dest.trim(),
      distance_km: km, fare, status: "requested",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Ride requested! A driver will accept shortly.");
    setPickup(""); setDest("");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><MapPin className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pickup</Label>
              <Input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Current location" className="h-9 border-0 px-0 text-base focus-visible:ring-0" maxLength={200} />
            </div>
          </div>
          <div className="ml-4 h-4 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-background"><Navigation className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Destination</Label>
              <Input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Where to?" className="h-9 border-0 px-0 text-base focus-visible:ring-0" maxLength={200} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-ink p-5 text-background">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-background/60">Estimated fare</div>
            <div className="mt-1 text-4xl font-black">{fare ? fmtMoney(fare) : "—"}</div>
            <div className="mt-1 text-xs text-background/60">{km ? `${km} km · ${Math.max(3, Math.round(km * 2))} min` : "Enter route to estimate"}</div>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fox)]"><Car className="h-6 w-6" /></div>
        </div>
      </div>

      <Button onClick={book} disabled={busy || !pickup || !dest} className="h-14 w-full rounded-full text-base font-bold shadow-[var(--shadow-fox)]">
        {busy ? "Requesting…" : "Request Fox"}
      </Button>

      <Link to="/app/history" className="block text-center text-sm font-semibold text-primary hover:underline">View ride history →</Link>
    </div>
  );
}

function DriverPanel({ userId }: { userId: string }) {
  const [available, setAvailable] = useState(false);
  const [pending, setPending] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const load = async () => {
    const { data: d } = await supabase.from("drivers").select("is_available, is_approved").eq("id", userId).maybeSingle();
    if (!d) { setHasProfile(false); return; }
    setHasProfile(true);
    setAvailable(d.is_available);
    const { data: rides } = await supabase.from("rides").select("*").eq("status", "requested").order("created_at", { ascending: false }).limit(20);
    setPending(rides ?? []);
  };
  useEffect(() => { load(); }, []);

  const toggleAvail = async (next: boolean) => {
    setBusy(true);
    const { error } = await supabase.from("drivers").update({ is_available: next }).eq("id", userId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setAvailable(next);
    toast.success(next ? "You're online" : "You're offline");
  };

  const accept = async (rideId: string) => {
    const { error } = await supabase.from("rides").update({ driver_id: userId, status: "accepted" }).eq("id", rideId).eq("status", "requested");
    if (error) { toast.error(error.message); return; }
    toast.success("Ride accepted");
    load();
  };

  if (hasProfile === false) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Finish your driver profile to start accepting rides.</p>
        <Link to="/driver-onboarding" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Complete onboarding</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div>
          <div className="text-sm font-bold">{available ? "You're online" : "You're offline"}</div>
          <div className="text-xs text-muted-foreground">{available ? "Receiving ride requests" : "Tap to go online"}</div>
        </div>
        <button onClick={() => toggleAvail(!available)} disabled={busy}
          className={`relative h-7 w-12 rounded-full transition ${available ? "bg-primary" : "bg-muted"}`}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition ${available ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Open requests</h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No pending rides nearby.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-primary" /><span className="truncate">{r.pickup_address}</span></div>
                    <div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-foreground" /><span className="truncate">{r.destination_address}</span></div>
                    <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.distance_km} km</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" />{fmtMoney(Number(r.fare))}</span>
                    </div>
                  </div>
                  <Button onClick={() => accept(r.id)} className="rounded-full text-xs font-bold">Accept</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
