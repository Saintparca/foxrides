import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/fare";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Car, Shield, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  const [stats, setStats] = useState({ users: 0, drivers: 0, rides: 0, revenue: 0 });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);

  const load = async () => {
    const [{ count: users }, { count: dCount }, { data: rideRows }, { data: dRows }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("drivers").select("*", { count: "exact", head: true }),
      supabase.from("rides").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("drivers").select("*, profiles!inner(full_name, phone)").order("created_at", { ascending: false }),
    ]);
    const revenue = (rideRows ?? []).filter((r) => r.status === "completed").reduce((s, r) => s + Number(r.fare), 0);
    setStats({ users: users ?? 0, drivers: dCount ?? 0, rides: rideRows?.length ?? 0, revenue });
    setRides(rideRows ?? []);
    setDrivers(dRows ?? []);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string, approved: boolean) => {
    const { error } = await supabase.from("drivers").update({ is_approved: approved }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(approved ? "Driver approved" : "Approval revoked"); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <KPI icon={<Users className="h-4 w-4" />} label="Users" value={String(stats.users)} />
        <KPI icon={<Car className="h-4 w-4" />} label="Drivers" value={String(stats.drivers)} />
        <KPI icon={<Shield className="h-4 w-4" />} label="Recent rides" value={String(stats.rides)} />
        <KPI icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={fmtMoney(stats.revenue)} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Drivers</h2>
        <div className="space-y-2">
          {drivers.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{d.profiles?.full_name ?? d.id}</div>
                <div className="text-xs text-muted-foreground">{d.vehicle_make} {d.vehicle_model} · {d.vehicle_plate}</div>
              </div>
              <Button size="sm" variant={d.is_approved ? "outline" : "default"} onClick={() => approve(d.id, !d.is_approved)} className="rounded-full">
                {d.is_approved ? "Revoke" : "Approve"}
              </Button>
            </div>
          ))}
          {drivers.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No drivers yet.</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent rides</h2>
        <div className="space-y-2">
          {rides.slice(0, 15).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-semibold">{r.pickup_address} → {r.destination_address}</div>
                <div className="text-xs text-muted-foreground">{r.status} · {new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="font-black">{fmtMoney(Number(r.fare))}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}
