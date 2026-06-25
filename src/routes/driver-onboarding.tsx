import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FoxMark } from "./index";

export const Route = createFileRoute("/driver-onboarding")({
  head: () => ({ meta: [{ title: "Become a driver · Fox Rides" }] }),
  component: Page,
});

function Page() {
  const { user, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [license, setLicense] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    setBusy(true);
    const { error: dErr } = await supabase.from("drivers").upsert({
      id: user.id,
      license_number: license.trim(),
      vehicle_make: make.trim(),
      vehicle_model: model.trim(),
      vehicle_plate: plate.trim().toUpperCase(),
      vehicle_year: year ? Number(year) : null,
    });
    if (dErr) { toast.error(dErr.message); setBusy(false); return; }
    // Ensure driver role is granted
    await supabase.from("user_roles").upsert({ user_id: user.id, role: "driver" }, { onConflict: "user_id,role" });
    await refreshRoles();
    setBusy(false);
    toast.success("Driver profile saved! Pending approval.");
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-10">
        <div className="flex items-center gap-2"><FoxMark /><span className="text-lg font-black">Fox Rides</span></div>
        <h1 className="mt-8 text-3xl font-black tracking-tight">Driver onboarding</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Tell us about you and your vehicle.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Driver's license number"><Input value={license} onChange={e => setLicense(e.target.value)} required maxLength={40} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Make"><Input value={make} onChange={e => setMake(e.target.value)} required maxLength={30} /></Field>
            <Field label="Model"><Input value={model} onChange={e => setModel(e.target.value)} required maxLength={30} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plate"><Input value={plate} onChange={e => setPlate(e.target.value)} required maxLength={15} /></Field>
            <Field label="Year"><Input value={year} onChange={e => setYear(e.target.value)} type="number" min={1990} max={2030} /></Field>
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-bold shadow-[var(--shadow-fox)]">
            {busy ? "Saving…" : "Submit for approval"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
