import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, DRIVER_SHARE } from "@/lib/fare";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { OWNER_WHATSAPP_LOCAL, waLink } from "@/lib/whatsapp";
import { Wallet, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: Earnings,
});

function Earnings() {
  const { user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const loadWithdrawals = () =>
    supabase.from("withdrawals").select("*").eq("driver_id", user!.id).order("created_at", { ascending: false })
      .then(({ data }) => setWithdrawals(data ?? []));

  useEffect(() => {
    supabase.from("rides").select("*").eq("driver_id", user!.id).eq("status", "completed").order("completed_at", { ascending: false })
      .then(({ data }) => setRides(data ?? []));
    loadWithdrawals();
  }, []);

  const totalGross = rides.reduce((s, r) => s + Number(r.fare), 0);
  const totalNet = totalGross * DRIVER_SHARE;
  const paidOut = withdrawals.filter(w => w.status === "paid").reduce((s, w) => s + Number(w.amount), 0);
  const pendingOut = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);
  const available = Math.max(0, totalNet - paidOut - pendingOut);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayNet = rides.filter(r => new Date(r.completed_at) >= today).reduce((s, r) => s + Number(r.fare), 0) * DRIVER_SHARE;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
  const weekNet = rides.filter(r => new Date(r.completed_at) >= weekStart).reduce((s, r) => s + Number(r.fare), 0) * DRIVER_SHARE;
  const monthStart = new Date(); monthStart.setDate(monthStart.getDate() - 30);
  const monthNet = rides.filter(r => new Date(r.completed_at) >= monthStart).reduce((s, r) => s + Number(r.fare), 0) * DRIVER_SHARE;
  const ratings = rides.filter(r => r.rating).map(r => r.rating);
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "—";

  const request = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > available) { toast.error(`Max available: ${fmtMoney(available)}`); return; }
    setBusy(true);
    const { error } = await supabase.from("withdrawals").insert({
      driver_id: user!.id, amount: amt, note: note.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal requested");
    setAmount(""); setNote("");
    loadWithdrawals();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Earnings</h1>

      <div className="rounded-2xl bg-gradient-ink p-6 text-background shadow-[var(--shadow-card)]">
        <div className="text-xs uppercase tracking-wider text-background/60">Available to withdraw</div>
        <div className="mt-1 text-5xl font-black">{fmtMoney(available)}</div>
        <div className="mt-1 text-xs text-background/60">Lifetime {fmtMoney(totalNet)} · Paid out {fmtMoney(paidOut)} · Pending {fmtMoney(pendingOut)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Today" value={fmtMoney(todayNet)} />
        <Stat label="This week" value={fmtMoney(weekNet)} />
        <Stat label="This month" value={fmtMoney(monthNet)} />
        <Stat label="Rating" value={typeof avg === "string" ? avg : `★ ${avg}`} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <div className="text-sm font-bold">Request withdrawal</div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Paid to your registered phone via Orange Money. Available: {fmtMoney(available)}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount (P)</Label>
            <Input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="flex items-end">
            <Button onClick={() => setAmount(String(Math.floor(available)))} variant="outline" className="w-full rounded-full text-xs" type="button">Max</Button>
          </div>
        </div>
        <div className="mt-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} />
        </div>
        <Button onClick={request} disabled={busy || available <= 0} className="mt-3 w-full rounded-full">
          {busy ? "Requesting…" : "Request payout"}
        </Button>
        <a href={waLink("Hi Fox Rides, I have a question about my earnings.")} target="_blank" rel="noreferrer"
           className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#128C7E]">
          <MessageCircle className="h-3.5 w-3.5" /> Chat WhatsApp {OWNER_WHATSAPP_LOCAL}
        </a>
      </div>

      {withdrawals.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Withdrawals</h2>
          <div className="space-y-2">
            {withdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                <div>
                  <div className="font-bold">{fmtMoney(Number(w.amount))}</div>
                  <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</div>
                </div>
                <StatusPill status={w.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent trips</h2>
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900",
    paid: "bg-emerald-100 text-emerald-900",
    rejected: "bg-destructive/10 text-destructive",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
