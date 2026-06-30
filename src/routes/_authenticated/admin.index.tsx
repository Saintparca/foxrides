import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/fare";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, Car, Shield, DollarSign, FileText, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  const [stats, setStats] = useState({ users: 0, drivers: 0, rides: 0, revenue: 0 });
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [approvedDrivers, setApprovedDrivers] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const load = async () => {
    const [{ count: users }, { count: dCount }, { data: rideRows }, { data: dRows }, { data: wRows }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("drivers").select("*", { count: "exact", head: true }),
      supabase.from("rides").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("drivers").select("*, profiles!inner(full_name, phone)").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*, profiles:driver_id(full_name, phone)").order("created_at", { ascending: false }).limit(30),
    ]);
    const revenue = (rideRows ?? []).filter((r) => r.status === "completed").reduce((s, r) => s + Number(r.fare), 0);
    setStats({ users: users ?? 0, drivers: dCount ?? 0, rides: rideRows?.length ?? 0, revenue });
    setRides(rideRows ?? []);
    const all = dRows ?? [];
    setPendingDrivers(all.filter((d: any) => (d.approval_status ?? (d.is_approved ? "approved" : "pending")) !== "approved"));
    setApprovedDrivers(all.filter((d: any) => (d.approval_status ?? (d.is_approved ? "approved" : "pending")) === "approved"));
    setWithdrawals(wRows ?? []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, approval_status: "approved" | "rejected" | "suspended" | "pending", rejection_reason: string | null = null) => {
    const { error } = await supabase.from("drivers").update({
      approval_status, is_approved: approval_status === "approved", rejection_reason,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Driver ${approval_status}`); load(); }
  };

  const settleWithdrawal = async (id: string, status: "paid" | "rejected") => {
    const { error } = await supabase.from("withdrawals").update({ status, processed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Withdrawal ${status}`); load(); }
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
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Approval queue ({pendingDrivers.length})</h2>
        <div className="space-y-3">
          {pendingDrivers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No pending applications.</div>
          ) : pendingDrivers.map((d: any) => <DriverApprovalCard key={d.id} d={d} onSet={setStatus} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Approved drivers ({approvedDrivers.length})</h2>
        <div className="space-y-2">
          {approvedDrivers.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{d.profiles?.full_name ?? d.id}</div>
                <div className="text-xs text-muted-foreground">{d.vehicle_make} {d.vehicle_model} · {d.vehicle_plate}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setStatus(d.id, "suspended")} className="rounded-full text-xs">Suspend</Button>
              </div>
            </div>
          ))}
          {approvedDrivers.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No approved drivers yet.</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Withdrawal requests</h2>
        <div className="space-y-2">
          {withdrawals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No withdrawal requests.</div>
          ) : withdrawals.map((w: any) => (
            <div key={w.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{fmtMoney(Number(w.amount))} · {w.profiles?.full_name ?? w.driver_id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">{w.profiles?.phone ?? ""} · {new Date(w.created_at).toLocaleString()}</div>
                {w.note && <div className="mt-1 text-xs italic text-muted-foreground">"{w.note}"</div>}
              </div>
              {w.status === "pending" ? (
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => settleWithdrawal(w.id, "paid")} className="rounded-full text-xs">Mark paid</Button>
                  <Button size="sm" variant="outline" onClick={() => settleWithdrawal(w.id, "rejected")} className="rounded-full text-xs">Reject</Button>
                </div>
              ) : (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${w.status === "paid" ? "bg-emerald-100 text-emerald-900" : "bg-destructive/10 text-destructive"}`}>{w.status}</span>
              )}
            </div>
          ))}
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

function DriverApprovalCard({ d, onSet }: { d: any; onSet: (id: string, s: "approved" | "rejected" | "suspended" | "pending", r?: string | null) => void }) {
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const docKeys: { key: string; label: string }[] = [
    { key: "omang_url", label: "Omang" },
    { key: "license_url", label: "Licence" },
    { key: "vehicle_reg_url", label: "Vehicle reg." },
    { key: "insurance_url", label: "Insurance" },
  ];

  const view = async (path: string) => {
    const { data, error } = await supabase.storage.from("driver-docs").createSignedUrl(path, 300);
    if (error || !data) { toast.error(error?.message ?? "Failed"); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
          {d.profile_pic_url ? <img src={d.profile_pic_url} className="h-full w-full object-cover" alt="" /> :
            <div className="grid h-full w-full place-items-center text-sm font-black">{(d.profiles?.full_name?.[0] ?? "?").toUpperCase()}</div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{d.profiles?.full_name ?? d.id}</div>
          <div className="text-xs text-muted-foreground">{d.profiles?.phone} · Lic {d.license_number}</div>
          <div className="text-xs text-muted-foreground">{d.vehicle_year ?? ""} {d.vehicle_make} {d.vehicle_model} · <b>{d.vehicle_plate}</b></div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${d.approval_status === "rejected" ? "bg-destructive/10 text-destructive" : d.approval_status === "suspended" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-900"}`}>
          {d.approval_status ?? "pending"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {docKeys.map(({ key, label }) => {
          const path = d[key];
          return (
            <button key={key} disabled={!path} onClick={() => view(path)}
              className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs ${path ? "border-border bg-background hover:bg-accent" : "border-dashed border-border opacity-50"}`}>
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold">{label}</div>
                <div className="truncate text-[10px] text-muted-foreground">{path ? "View document" : "Missing"}</div>
              </div>
            </button>
          );
        })}
      </div>

      {showReject ? (
        <div className="mt-3 space-y-2">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" className="min-h-[60px] text-sm" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowReject(false)} className="flex-1 rounded-full">Cancel</Button>
            <Button size="sm" onClick={() => { onSet(d.id, "rejected", reason.trim() || "Not approved"); setShowReject(false); }} className="flex-1 rounded-full">Confirm reject</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => onSet(d.id, "approved", null)} className="flex-1 rounded-full">Approve</Button>
          <Button size="sm" variant="outline" onClick={() => setShowReject(true)} className="flex-1 rounded-full">Reject</Button>
        </div>
      )}
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
