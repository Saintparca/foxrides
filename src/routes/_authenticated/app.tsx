import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { estimateFare, fmtMoney, haversineKm, CANCEL_FEE } from "@/lib/fare";
import { computeRoute } from "@/lib/routes.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Navigation, Car, Star, Clock, MessageCircle, Home, Briefcase, Plus, X } from "lucide-react";
import { PlaceAutocomplete, type PlacePick } from "@/components/PlaceAutocomplete";
import { RouteMap } from "@/components/RouteMap";
import { OWNER_WHATSAPP_LOCAL, waLink } from "@/lib/whatsapp";
import { DriverActionsBar } from "@/components/DriverActionsBar";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppHome,
});

function AppHome() {
  const { user, roles } = useAuth();
  const isDriver = roles.includes("driver");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {isDriver ? "Ready to drive" : "Where to?"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDriver ? "Toggle availability and pick up nearby rides." : "Real road routes · live fare in Pula."}
          </p>
        </div>
        <a href={waLink("Hi Fox Rides, I need help.")} target="_blank" rel="noreferrer"
           className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-bold text-white">
          <MessageCircle className="h-3.5 w-3.5" /> {OWNER_WHATSAPP_LOCAL}
        </a>
      </div>

      {isDriver ? <DriverPanel userId={user!.id} /> : <CustomerPanel userId={user!.id} />}
    </div>
  );
}

function CustomerPanel({ userId }: { userId: string }) {
  const [activeRide, setActiveRide] = useState<any>(null);

  const loadActive = async () => {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("customer_id", userId)
      .in("status", ["requested", "accepted", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveRide(data);
  };

  useEffect(() => {
    loadActive();
    const ch = supabase
      .channel(`cust-rides-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rides", filter: `customer_id=eq.${userId}` },
        () => loadActive())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  if (activeRide) return <ActiveRideCard ride={activeRide} onChange={loadActive} />;
  return <BookingPanel userId={userId} />;
}

function ActiveRideCard({ ride, onChange }: { ride: any; onChange: () => void }) {
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ride.driver_id) { setDriverInfo(null); return; }
    Promise.all([
      supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", ride.driver_id).maybeSingle(),
      supabase.from("drivers").select("vehicle_make, vehicle_model, vehicle_plate, profile_pic_url").eq("id", ride.driver_id).maybeSingle(),
    ]).then(([p, d]) => setDriverInfo({ ...(p.data ?? {}), ...(d.data ?? {}) }));
  }, [ride.driver_id]);

  const cancel = async () => {
    setBusy(true);
    const fee = ride.status === "accepted" || ride.status === "in_progress" ? CANCEL_FEE : 0;
    const { error } = await supabase.from("rides").update({
      status: "cancelled", cancelled_by: "customer", cancellation_fee: fee,
    }).eq("id", ride.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(fee ? `Ride cancelled · P${fee} fee applies` : "Ride cancelled");
    onChange();
  };

  const statusText = ride.status === "requested" ? "Finding a driver…"
    : ride.status === "accepted" ? "Driver is on the way"
    : "Trip in progress";

  return (
    <div className="space-y-4">
      <RouteMap
        pickup={ride.pickup_lat ? { lat: Number(ride.pickup_lat), lng: Number(ride.pickup_lng) } : null}
        destination={ride.dest_lat ? { lat: Number(ride.dest_lat), lng: Number(ride.dest_lng) } : null}
        polyline={ride.route_polyline ?? null}
        height={220}
      />

      <div className="rounded-2xl bg-gradient-ink p-5 text-background">
        <div className="text-xs uppercase tracking-wider text-background/60">Status</div>
        <div className="mt-1 text-2xl font-black">{statusText}</div>
        {ride.eta_at && ride.status !== "requested" && (
          <div className="mt-1 text-xs text-background/70">ETA: {new Date(ride.eta_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        )}
      </div>

      {driverInfo ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
              {driverInfo.profile_pic_url
                ? <img src={driverInfo.profile_pic_url} className="h-full w-full object-cover" alt="" />
                : <div className="grid h-full w-full place-items-center text-lg font-black">{(driverInfo.full_name?.[0] ?? "?").toUpperCase()}</div>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{driverInfo.full_name ?? "Driver"}</div>
              <div className="truncate text-xs text-muted-foreground">
                {driverInfo.vehicle_make} {driverInfo.vehicle_model} · <span className="font-bold">{driverInfo.vehicle_plate}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black">{fmtMoney(Number(ride.fare))}</div>
              <div className="text-[10px] text-muted-foreground">{ride.distance_km} km</div>
            </div>
          </div>
          <div className="mt-3">
            <DriverActionsBar
              driverPhone={driverInfo.phone}
              driverName={driverInfo.full_name}
              ride={ride}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Waiting for a driver to accept…
        </div>
      )}

      {(ride.status === "requested" || ride.status === "accepted") && (
        <Button variant="outline" onClick={cancel} disabled={busy} className="w-full rounded-full">
          <X className="mr-1.5 h-4 w-4" />
          Cancel ride{ride.status === "accepted" ? ` (P${CANCEL_FEE} fee)` : ""}
        </Button>
      )}
    </div>
  );
}

function BookingPanel({ userId }: { userId: string }) {
  const [pickup, setPickup] = useState<PlacePick | null>(null);
  const [dest, setDest] = useState<PlacePick | null>(null);
  const [pickupText, setPickupText] = useState("");
  const [destText, setDestText] = useState("");
  const [busy, setBusy] = useState(false);
  const [route, setRoute] = useState<{ km: number; min: number; polyline: string } | null>(null);
  const [routing, setRouting] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);
  const compute = useServerFn(computeRoute);
  const seq = useRef(0);

  useEffect(() => {
    supabase.from("saved_places").select("*").eq("user_id", userId).order("created_at")
      .then(({ data }) => setSaved(data ?? []));
  }, [userId]);

  useEffect(() => {
    if (pickup || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { address: "Current location", lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPickup(p); setPickupText(p.address);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!pickup || !dest) { setRoute(null); return; }
    const n = ++seq.current;
    setRouting(true);
    compute({ data: { origin: { lat: pickup.lat, lng: pickup.lng }, destination: { lat: dest.lat, lng: dest.lng } } })
      .then((r) => {
        if (n !== seq.current) return;
        if (r.ok) setRoute({ km: r.distanceKm, min: r.durationMin, polyline: r.polyline });
        else {
          const km = haversineKm(pickup, dest);
          setRoute({ km, min: Math.max(3, Math.round(km * 2)), polyline: "" });
        }
      })
      .catch(() => {
        const km = haversineKm(pickup, dest);
        setRoute({ km, min: Math.max(3, Math.round(km * 2)), polyline: "" });
      })
      .finally(() => { if (n === seq.current) setRouting(false); });
  }, [pickup?.lat, pickup?.lng, dest?.lat, dest?.lng]);

  const km = route?.km ?? 0;
  const min = route?.min ?? 0;
  const fare = km ? estimateFare(km, min) : 0;

  const pickSaved = (p: any) => {
    setDest({ address: p.address, lat: Number(p.lat), lng: Number(p.lng) });
    setDestText(p.address);
  };

  const book = async () => {
    if (!pickup || !dest || !route) { toast.error("Pick both pickup and destination"); return; }
    setBusy(true);
    const eta = new Date(Date.now() + min * 60 * 1000).toISOString();
    const { error } = await supabase.from("rides").insert({
      customer_id: userId,
      pickup_address: pickup.address,
      destination_address: dest.address,
      pickup_lat: pickup.lat, pickup_lng: pickup.lng,
      dest_lat: dest.lat, dest_lng: dest.lng,
      distance_km: km, fare, status: "requested",
      route_polyline: route.polyline || null,
      duration_min: min, eta_at: eta,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Ride requested! A driver will accept shortly.");
  };

  const home = saved.find(s => s.kind === "home");
  const work = saved.find(s => s.kind === "work");
  const favs = saved.filter(s => s.kind === "favourite").slice(0, 3);

  return (
    <div className="space-y-5">
      <RouteMap pickup={pickup} destination={dest} polyline={route?.polyline ?? null} />

      <div className="flex flex-wrap items-center gap-2">
        {home ? (
          <button onClick={() => pickSaved(home)} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold">
            <Home className="h-3.5 w-3.5" /> Home
          </button>
        ) : null}
        {work ? (
          <button onClick={() => pickSaved(work)} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold">
            <Briefcase className="h-3.5 w-3.5" /> Work
          </button>
        ) : null}
        {favs.map(f => (
          <button key={f.id} onClick={() => pickSaved(f)} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold">
            <Star className="h-3.5 w-3.5" /> {f.label}
          </button>
        ))}
        <Link to="/app/saved-places" className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-bold text-muted-foreground">
          <Plus className="h-3.5 w-3.5" /> Manage
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fox text-fox-foreground"><MapPin className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pickup</Label>
              <PlaceAutocomplete value={pickupText} placeholder="Current location"
                onTextChange={setPickupText}
                onPick={(p) => { setPickup(p); setPickupText(p.address); }} />
            </div>
          </div>
          <div className="ml-4 h-4 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Navigation className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Destination</Label>
              <PlaceAutocomplete value={destText} placeholder="Where to?"
                onTextChange={setDestText}
                onPick={(p) => { setDest(p); setDestText(p.address); }} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-ink p-5 text-background">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-background/60">Estimated fare</div>
            <div className="mt-1 text-4xl font-black">{fare ? fmtMoney(fare) : "—"}</div>
            <div className="mt-1 text-xs text-background/60">
              {routing ? "Calculating route…" : km ? `${km} km · ${min} min` : "Pick a destination to estimate"}
            </div>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-full bg-fox text-fox-foreground shadow-[var(--shadow-fox)]"><Car className="h-6 w-6" /></div>
        </div>
      </div>

      <Button onClick={book} disabled={busy || !pickup || !dest || !route} className="h-14 w-full rounded-full text-base font-bold shadow-[var(--shadow-fox)]">
        {busy ? "Requesting…" : "Request Fox"}
      </Button>

      <Link to="/app/history" className="block text-center text-sm font-semibold text-primary hover:underline">View ride history →</Link>
    </div>
  );
}

function DriverPanel({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<{ polyline: string } | null>(null);
  const compute = useServerFn(computeRoute);
  const watchRef = useRef<number | null>(null);

  const load = async () => {
    const { data: d } = await supabase.from("drivers").select("*").eq("id", userId).maybeSingle();
    if (!d) { setHasProfile(false); return; }
    setHasProfile(true); setDriver(d);
    const { data: rides } = await supabase.from("rides").select("*").eq("status", "requested").order("created_at", { ascending: false }).limit(20);
    setPending(rides ?? []);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    setSelectedRoute(null);
    if (!selected?.pickup_lat || !selected?.dest_lat) return;
    compute({ data: {
      origin: { lat: Number(selected.pickup_lat), lng: Number(selected.pickup_lng) },
      destination: { lat: Number(selected.dest_lat), lng: Number(selected.dest_lng) },
    } }).then((r) => { if (r.ok) setSelectedRoute({ polyline: r.polyline }); }).catch(() => {});
  }, [selected?.id]);

  useEffect(() => {
    if (!driver?.is_available) {
      if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      return;
    }
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        await supabase.from("driver_locations").upsert({
          driver_id: userId, lat: pos.coords.latitude, lng: pos.coords.longitude,
          heading: pos.coords.heading ?? null, updated_at: new Date().toISOString(),
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    };
  }, [driver?.is_available, userId]);

  const weeklyDue = (() => {
    if (!driver?.last_weekly_payment_at) return true;
    return Date.now() - new Date(driver.last_weekly_payment_at).getTime() > 7 * 24 * 60 * 60 * 1000;
  })();
  const approvalStatus = driver?.approval_status ?? (driver?.is_approved ? "approved" : "pending");
  const isApproved = approvalStatus === "approved";
  const canGoOnline = isApproved && driver?.activation_paid && !weeklyDue;

  const toggleAvail = async (next: boolean) => {
    if (next && !isApproved) { toast.error("Your account isn't approved yet."); return; }
    if (next && !canGoOnline) { navigate({ to: "/driver-payment" as any }); return; }
    setBusy(true);
    const { error } = await supabase.from("drivers").update({ is_available: next }).eq("id", userId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDriver({ ...driver, is_available: next });
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
      {approvalStatus === "pending" && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="text-sm font-bold">Approval pending</div>
          <div className="mt-1 text-xs">Upload your documents and we'll review within 24h.</div>
          <Link to="/driver-onboarding" className="mt-3 inline-block rounded-full bg-amber-900 px-4 py-2 text-xs font-bold text-white">
            Upload documents
          </Link>
        </div>
      )}
      {approvalStatus === "rejected" && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <div className="text-sm font-bold">Application rejected</div>
          {driver?.rejection_reason && <div className="mt-1 text-xs">{driver.rejection_reason}</div>}
        </div>
      )}
      {approvalStatus === "suspended" && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <div className="text-sm font-bold">Account suspended</div>
          <div className="mt-1 text-xs">Contact support via WhatsApp.</div>
        </div>
      )}

      {isApproved && !canGoOnline && (
        <div className="rounded-2xl border border-fox/40 bg-fox/10 p-4">
          <div className="text-sm font-bold">Payment required</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {!driver?.activation_paid ? "Pay P100 activation fee" : "Weekly P50 fee is due"} to go online.
          </div>
          <Link to="/driver-payment" className="mt-3 inline-block rounded-full bg-fox px-4 py-2 text-xs font-bold text-fox-foreground">
            Pay now
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div>
          <div className="text-sm font-bold">{driver?.is_available ? "You're online" : "You're offline"}</div>
          <div className="text-xs text-muted-foreground">{driver?.is_available ? "Sharing live location · receiving requests" : "Tap to go online"}</div>
        </div>
        <button onClick={() => toggleAvail(!driver?.is_available)} disabled={busy || !isApproved}
          className={`relative h-7 w-12 rounded-full transition ${driver?.is_available ? "bg-primary" : "bg-muted"} ${!isApproved ? "opacity-40" : ""}`}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition ${driver?.is_available ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      {selected && (
        <RouteMap
          pickup={selected.pickup_lat ? { lat: Number(selected.pickup_lat), lng: Number(selected.pickup_lng) } : null}
          destination={selected.dest_lat ? { lat: Number(selected.dest_lat), lng: Number(selected.dest_lng) } : null}
          polyline={selectedRoute?.polyline ?? selected.route_polyline ?? null}
          height={200}
        />
      )}

      <div>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Open requests</h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No pending rides nearby.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} onClick={() => setSelected(r)}
                className={`cursor-pointer rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] ${selected?.id === r.id ? "border-primary" : "border-border"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-fox" /><span className="truncate">{r.pickup_address}</span></div>
                    <div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-primary" /><span className="truncate">{r.destination_address}</span></div>
                    <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.distance_km} km{r.duration_min ? ` · ${r.duration_min} min` : ""}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" />{fmtMoney(Number(r.fare))}</span>
                    </div>
                  </div>
                  <Button onClick={(e) => { e.stopPropagation(); accept(r.id); }} disabled={!canGoOnline}
                          className="rounded-full text-xs font-bold">Accept</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
