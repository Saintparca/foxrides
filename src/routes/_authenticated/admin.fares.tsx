import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fmtMoney, estimateFare } from "@/lib/fare";

export const Route = createFileRoute("/_authenticated/admin/fares")({
  component: AdminFares,
});

type Settings = {
  base_fare: number; per_km: number; per_min: number; min_fare: number;
  cancel_fee: number; driver_share: number; activation_fee: number; weekly_fee: number;
};

const DEFAULTS: Settings = {
  base_fare: 10, per_km: 2.5, per_min: 0.4, min_fare: 15,
  cancel_fee: 10, driver_share: 0.85, activation_fee: 100, weekly_fee: 50,
};

function AdminFares() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("id", true).maybeSingle();
    if (data) setS({
      base_fare: Number(data.base_fare), per_km: Number(data.per_km), per_min: Number(data.per_min),
      min_fare: Number(data.min_fare), cancel_fee: Number(data.cancel_fee), driver_share: Number(data.driver_share),
      activation_fee: Number(data.activation_fee), weekly_fee: Number(data.weekly_fee),
    });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("app_settings").update({ ...s, updated_at: new Date().toISOString() }).eq("id", true);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Fare settings saved");
  };

  // Preview: 5km / 10min based on saved constants (approx)
  const preview = estimateFare(5, 10);

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS({ ...s, [k]: Number(e.target.value) });

  if (loading) return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-ink p-5 text-background">
        <div className="text-xs uppercase tracking-wider text-background/60">5 km · 10 min preview (defaults)</div>
        <div className="mt-1 text-4xl font-black">{fmtMoney(preview)}</div>
        <div className="mt-1 text-xs text-background/60">Restart app after saving to apply everywhere.</div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Trip pricing (Pula)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base fare (flag-fall)" value={s.base_fare} onChange={set("base_fare")} step="0.5" />
          <Field label="Per km" value={s.per_km} onChange={set("per_km")} step="0.1" />
          <Field label="Per minute" value={s.per_min} onChange={set("per_min")} step="0.1" />
          <Field label="Minimum fare" value={s.min_fare} onChange={set("min_fare")} step="1" />
          <Field label="Cancellation fee" value={s.cancel_fee} onChange={set("cancel_fee")} step="1" />
          <Field label="Driver share (0–1)" value={s.driver_share} onChange={set("driver_share")} step="0.01" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Driver fees (Pula)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Activation fee" value={s.activation_fee} onChange={set("activation_fee")} step="10" />
          <Field label="Weekly fee" value={s.weekly_fee} onChange={set("weekly_fee")} step="10" />
        </div>
      </div>

      <Button onClick={save} disabled={busy} className="h-12 w-full rounded-full text-base font-bold">
        {busy ? "Saving…" : "Save fare settings"}
      </Button>
    </div>
  );
}

function Field({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: string }) {
  return (
    <div>
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type="number" step={step} value={value} onChange={onChange} className="h-10 rounded-xl" />
    </div>
  );
}
