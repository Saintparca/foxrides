import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, DRIVER_SHARE } from "@/lib/fare";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: Earnings,
});

function Earnings() {
  const { user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("rides").select("*").eq("driver_id", user!.id).eq("status", "completed").order("completed_at", { ascending: false })
      .then(({ data }) => setRides(data ?? []));
  }, []);

  const totalGross = rides.reduce((s, r) => s + Number(r.fare), 0);
  const totalNet = totalGross * DRIVER_SHARE;
  const today = new Date(); today.setHours(0,0,0,0);
  const todayNet = rides.filter(r => new Date(r.completed_at) >= today).reduce((s, r) => s + Number(r.fare), 0) * DRIVER_SHARE;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
  const weekNet = rides.filter(r => new Date(r.completed_at) >= weekStart).reduce((s, r) => s + Number(r.fare), 0) * DRIVER_SHARE;
  const ratings = rides.filter(r => r.rating).map(r => r.rating);
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "—";

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Earnings</h1>

      <div className="rounded-2xl bg-gradient-ink p-6 text-background shadow-[var(--shadow-card)]">
        <div className="text-xs uppercase tracking-wider text-background/60">Lifetime payout</div>
        <div className="mt-1 text-5xl font-black">{fmtMoney(totalNet)}</div>
        <div className="mt-1 text-xs text-background/60">From {rides.length} trips · {Math.round(DRIVER_SHARE * 100)}% driver share</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Today" value={fmtMoney(todayNet)} />
        <Stat label="This week" value={fmtMoney(weekNet)} />
        <Stat label="Trips" value={String(rides.length)} />
        <Stat label="Rating" value={typeof avg === "string" ? avg : `★ ${avg}`} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent payouts</h2>
        {rides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No completed trips yet.</div>
        ) : (
          <div className="space-y-2">
            {rides.slice(0, 20).map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.destination_address}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.completed_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-black">{fmtMoney(Number(r.fare) * DRIVER_SHARE)}</div>
                  <div className="text-[10px] text-muted-foreground">of {fmtMoney(Number(r.fare))}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}
