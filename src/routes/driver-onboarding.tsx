import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FoxMark } from "./index";
import { Camera, FileText, CheckCircle2, Upload } from "lucide-react";

export const Route = createFileRoute("/driver-onboarding")({
  head: () => ({ meta: [{ title: "Become a driver · Fox Rides" }] }),
  component: Page,
});

type DocKey = "omang_url" | "license_url" | "vehicle_reg_url" | "insurance_url";
const DOCS: { key: DocKey; label: string; hint: string }[] = [
  { key: "omang_url", label: "Omang (ID)", hint: "National ID, front" },
  { key: "license_url", label: "Driver's licence", hint: "Photo of valid licence" },
  { key: "vehicle_reg_url", label: "Vehicle registration", hint: "Blue book / registration" },
  { key: "insurance_url", label: "Insurance certificate", hint: "Active cover" },
];

function Page() {
  const { user, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [license, setLicense] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [year, setYear] = useState("");
  const [picUrl, setPicUrl] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<DocKey, string | null>>({
    omang_url: null, license_url: null, vehicle_reg_url: null, insurance_url: null,
  });
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) { setFullName(data.full_name ?? ""); setPhone(data.phone ?? ""); } });
    supabase.from("drivers").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setLicense(data.license_number ?? "");
        setMake(data.vehicle_make ?? "");
        setModel(data.vehicle_model ?? "");
        setPlate(data.vehicle_plate ?? "");
        setYear(data.vehicle_year ? String(data.vehicle_year) : "");
        setPicUrl(data.profile_pic_url ?? null);
        setDocs({
          omang_url: data.omang_url ?? null,
          license_url: data.license_url ?? null,
          vehicle_reg_url: data.vehicle_reg_url ?? null,
          insurance_url: data.insurance_url ?? null,
        });
      });
  }, [user]);

  const uploadPic = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/profile-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("driver-pics").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("driver-pics").getPublicUrl(path);
    setPicUrl(data.publicUrl);
    setUploading(false);
  };

  const uploadDoc = async (file: File, key: DocKey) => {
    if (!user) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${key}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("driver-docs").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    setDocs((d) => ({ ...d, [key]: path }));
    toast.success("Document uploaded");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    setBusy(true);
    await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() }).eq("id", user.id);
    const { error: dErr } = await supabase.from("drivers").upsert({
      id: user.id,
      license_number: license.trim(),
      vehicle_make: make.trim(),
      vehicle_model: model.trim(),
      vehicle_plate: plate.trim().toUpperCase(),
      vehicle_year: year ? Number(year) : null,
      profile_pic_url: picUrl,
      country: "Botswana",
      ...docs,
    });
    if (dErr) { toast.error(dErr.message); setBusy(false); return; }
    await supabase.from("user_roles").upsert({ user_id: user.id, role: "driver" }, { onConflict: "user_id,role" });
    await refreshRoles();
    setBusy(false);
    toast.success("Driver profile saved!");
    navigate({ to: "/driver-payment" as any });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-10">
        <div className="flex items-center gap-2"><FoxMark /><span className="text-lg font-black">Fox Rides</span></div>
        <h1 className="mt-8 text-3xl font-black tracking-tight">Driver profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Botswana · Tell us about you and your vehicle.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border border-border bg-muted">
              {picUrl ? <img src={picUrl} alt="Profile" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7 text-muted-foreground" />}
            </div>
            <label className="cursor-pointer rounded-full border border-border bg-card px-4 py-2 text-xs font-bold hover:bg-accent">
              {uploading ? "Uploading…" : picUrl ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" className="hidden"
                     onChange={(e) => e.target.files?.[0] && uploadPic(e.target.files[0])} />
            </label>
          </div>

          <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={80} /></Field>
          <Field label="Phone number"><Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="75 123 456" maxLength={20} /></Field>
          <Field label="Driver's license number"><Input value={license} onChange={(e) => setLicense(e.target.value)} required maxLength={40} /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle make"><Input value={make} onChange={(e) => setMake(e.target.value)} required maxLength={30} /></Field>
            <Field label="Vehicle model"><Input value={model} onChange={(e) => setModel(e.target.value)} required maxLength={30} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Car registration"><Input value={plate} onChange={(e) => setPlate(e.target.value)} required placeholder="B 123 ABC" maxLength={15} /></Field>
            <Field label="Year"><Input value={year} onChange={(e) => setYear(e.target.value)} type="number" min={1990} max={2030} /></Field>
          </div>

          <Field label="Country"><Input value="Botswana" disabled /></Field>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification documents</div>
            <p className="mt-1 text-xs text-muted-foreground">Required for approval. Stored privately — only admins can view.</p>
            <div className="mt-3 space-y-2">
              {DOCS.map((d) => {
                const uploaded = !!docs[d.key];
                return (
                  <label key={d.key}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${uploaded ? "border-primary/40 bg-primary/5" : "border-dashed border-border"}`}>
                    <div className={`grid h-9 w-9 place-items-center rounded-full ${uploaded ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {uploaded ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{d.label}</div>
                      <div className="text-[11px] text-muted-foreground">{uploaded ? "Uploaded · tap to replace" : d.hint}</div>
                    </div>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <input type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], d.key)} />
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-bold shadow-[var(--shadow-fox)]">
            {busy ? "Saving…" : "Save & continue to payment"}
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
