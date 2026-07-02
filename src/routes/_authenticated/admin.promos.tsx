import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Tag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/promos")({
  component: AdminPromos,
});

type Promo = {
  id: string; code: string; discount_type: "percent" | "flat"; discount_value: number;
  max_uses: number | null; times_used: number; expires_at: string | null; active: boolean;
};

function AdminPromos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState<number>(10);
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setPromos((data ?? []) as Promo[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!code.trim()) { toast.error("Enter a code"); return; }
    if (!value || value <= 0) { toast.error("Discount must be greater than 0"); return; }
    setBusy(true);
    const { error } = await supabase.from("promo_codes").insert({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: value,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Promo created");
    setCode(""); setValue(10); setMaxUses(""); setExpiresAt("");
    load();
  };

  const toggle = async (p: Promo) => {
    const { error } = await supabase.from("promo_codes").update({ active: !p.active }).eq("id", p.id);
    if (error) toast.error(error.message); else load();
  };
  const del = async (p: Promo) => {
    if (!confirm(`Delete promo ${p.code}?`)) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Tag className="h-4 w-4" /> Create promo code
        </h2>
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" className="h-11 rounded-xl uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="percent">Percent off</option>
                <option value="flat">Flat Pula off</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Value ({discountType === "percent" ? "%" : "P"})
              </Label>
              <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Max uses (blank = ∞)</Label>
              <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expires</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
          <Button onClick={create} disabled={busy} className="h-12 w-full rounded-full font-bold">
            {busy ? "Creating…" : "Create promo"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Active codes ({promos.length})</h2>
        <div className="space-y-2">
          {promos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No promos yet.</div>
          ) : promos.map((p) => {
            const expired = p.expires_at && new Date(p.expires_at) < new Date();
            const capped = p.max_uses !== null && p.times_used >= p.max_uses;
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">{p.code}</span>
                      {!p.active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">Off</span>}
                      {expired && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">Expired</span>}
                      {capped && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">Used up</span>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.discount_type === "percent" ? `${p.discount_value}% off` : `P${p.discount_value} off`}
                      {" · "}Used {p.times_used}{p.max_uses ? `/${p.max_uses}` : ""}
                      {p.expires_at ? ` · Expires ${new Date(p.expires_at).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(p)} className={`relative h-6 w-11 rounded-full transition ${p.active ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition ${p.active ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                    <button onClick={() => del(p)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
