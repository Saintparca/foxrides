import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/fare";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, Car, XCircle, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const [rides, setRides] = useState<any[]>([]);
  const [range, setRange] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();
    supabase.from("rides").select("*").gte("created_at", since).order("created_at", { ascending: true })
      .then(({ data }) => setRides(data ?? []));
  }, [range]);

  const { totals, byDay } = useMemo(() => {
    const days: Record<string, { day: string; revenue: number; trips: number; cancelled: number }> = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const k = d.toISOString().slice(0, 10);
      days[k] = { day: k.slice(5), revenue: 0, trips: 0, cancelled: 0 };
    }
    let revenue = 0, completed = 0, cancelled = 0;
    rides.forEach((r) => {
      const k = new Date(r.created_at).toISOString().slice(0, 10);
      if (!days[k]) return;
      days[k].trips++;
      if (r.status === "completed") { days[k].revenue += Number(r.fare); revenue += Number(r.fare); completed++; }
      if (r.status === "cancelled") { days[k].cancelled++; cancelled++; }
    });
    return { totals: { revenue, completed, cancelled, total: rides.length }, byDay: Object.values(days) };
  }, [rides, range]);

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5">
        {[7, 30, 90].map((n) => (
          <button key={n} onClick={() => setRange(n as any)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${range === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            Last {n} days
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KPI icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={fmtMoney(totals.revenue)} />
        <KPI icon={<Car className="h-4 w-4" />} label="Trips" value={String(totals.total)} />
        <KPI icon={<TrendingUp className="h-4 w-4" />} label="Completed" value={String(totals.completed)} />
        <KPI icon={<XCircle className="h-4 w-4" />} label="Cancelled" value={String(totals.cancelled)} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Revenue by day</h3>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} formatter={(v: any) => fmtMoney(Number(v))} />
              <Bar dataKey="revenue" fill="#f08a3c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Trips vs. cancellations</h3>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="trips" stroke="#000" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
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
