import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { OWNER_ORANGE_MONEY, OWNER_WHATSAPP_LOCAL, waLink } from "@/lib/whatsapp";
import { CheckCircle2, MessageCircle, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/driver-payment")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("drivers").select("*").eq("id", user!.id).maybeSingle();
    setDriver(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markPaid = async (kind: "activation" | "weekly") => {
    const patch: any =
      kind === "activation"
        ? { activation_paid: true, last_weekly_payment_at: new Date().toISOString() }
        : { last_weekly_payment_at: new Date().toISOString() };
    const { error } = await supabase.from("drivers").update(patch).eq("id", user!.id);
    if (error) toast.error(error.message);
    else { toast.success("Marked as paid — pending admin verification."); load(); }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!driver) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Complete driver onboarding first.</p>
        <Link to="/driver-onboarding" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Onboarding</Link>
      </div>
    );
  }

  const lastPaid = driver.last_weekly_payment_at ? new Date(driver.last_weekly_payment_at) : null;
  const weeklyDue = !lastPaid || (Date.now() - lastPaid.getTime()) > 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Driver fees</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pay via Orange Money, then confirm on WhatsApp.</p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-sm font-bold text-emerald-900">Good news — driving with Fox Rides is free</div>
        <ul className="mt-2 space-y-1 text-xs text-emerald-900/90">
          <li>• Registration: <b>Free</b></li>
          <li>• Monthly subscription: <b>P0</b></li>
          <li>• Commission: <b>10% per completed trip</b> (you keep 90%)</li>
          <li>• Weekly payout: <b>Free</b></li>
          <li>• Optional daily payout: <b>P10–P20 fee</b></li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 text-sm font-bold"><Wallet className="h-4 w-4 text-fox" /> Orange Money number</div>
        <div className="mt-2 text-2xl font-black tracking-wider">{OWNER_ORANGE_MONEY}</div>
        <p className="mt-2 text-xs text-muted-foreground">Payouts are sent from {OWNER_WHATSAPP_LOCAL}. Reach out on WhatsApp for any payment questions.</p>
      </div>

    </div>
  );
}

function PayCard({
  title, amount, subtitle, paid, message, onMark, extra,
}: {
  title: string; amount: string; subtitle: string; paid: boolean;
  message: string; onMark: () => void; extra?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
          {extra && <div className="mt-1 text-[11px] text-muted-foreground">{extra}</div>}
        </div>
        <div className="text-2xl font-black text-fox">{amount}</div>
      </div>
      {paid ? (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Paid
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={waLink(message)} target="_blank" rel="noreferrer"
             className="flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white">
            <MessageCircle className="h-4 w-4" /> Send proof
          </a>
          <Button onClick={onMark} className="rounded-full text-xs font-bold">I've paid</Button>
        </div>
      )}
    </div>
  );
}
