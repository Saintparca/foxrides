import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { OWNER_ORANGE_MONEY, OWNER_WHATSAPP_LOCAL, waLink } from "@/lib/whatsapp";
import { Wallet, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/driver-payment")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("drivers").select("*").eq("id", user!.id).maybeSingle();
      setDriver(data);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!driver) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Complete driver onboarding first.</p>
        <Link to="/driver-onboarding" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Onboarding</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Payments &amp; payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">No fees to drive with Fox Rides.</p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-sm font-bold text-emerald-900">Driving with Fox Rides is free</div>
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
        <p className="mt-2 text-xs text-muted-foreground">Payouts are sent from {OWNER_WHATSAPP_LOCAL}.</p>
        <a
          href={waLink("Hi Fox Rides, I have a question about my payout.")}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white"
        >
          <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
