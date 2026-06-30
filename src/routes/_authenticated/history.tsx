import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, CANCEL_FEE } from "@/lib/fare";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, MapPin, Navigation, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  component: History,
});

function History() {
  const { user, roles } = useAuth();
  const isDriver = roles.includes("driver");
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const col = isDriver ? "driver_id" : "customer_id";
    const { data } = await supabase.from("rides").select("*").eq(col, user!.id).order("created_at", { ascending: false });
    setRides(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [isDriver]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Trips</h1>
      {loading ? <div className="text-sm text-muted-foreground">Loading…</div> :
        rides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No trips yet.</div>
        ) : (
          <div className="space-y-3">
            {rides.map((r) => <RideCard key={r.id} ride={r} isDriver={isDriver} reload={load} />)}
          </div>
        )}
    </div>
  );
}

function RideCard({ ride, isDriver, reload }: { ride: any; isDriver: boolean; reload: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const advance = async (status: string) => {
    setBusy(true);
    const patch: any = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    if (status === "cancelled") {
      patch.cancelled_by = isDriver ? "driver" : "customer";
      patch.cancellation_fee = ride.status === "accepted" || ride.status === "in_progress" ? CANCEL_FEE : 0;
    }
    const { error } = await supabase.from("rides").update(patch).eq("id", ride.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      if (status === "cancelled" && patch.cancellation_fee) toast.success(`Cancelled · P${patch.cancellation_fee} fee`);
      else toast.success(`Marked ${status}`);
      reload();
    }
  };

  const rate = async () => {
    if (!rating) return;
    const { error } = await supabase.from("rides").update({ rating, rating_comment: comment.trim() || null }).eq("id", ride.id);
    if (error) toast.error(error.message); else { toast.success("Thanks for rating!"); reload(); }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <StatusBadge status={ride.status} />
        <span className="text-xs text-muted-foreground">{new Date(ride.created_at).toLocaleDateString()}</span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /><span className="truncate">{ride.pickup_address}</span></div>
        <div className="flex items-center gap-2"><Navigation className="h-3.5 w-3.5" /><span className="truncate">{ride.destination_address}</span></div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="text-xs text-muted-foreground">{ride.distance_km} km</div>
        <div className="text-lg font-black">{fmtMoney(Number(ride.fare))}</div>
      </div>

      {/* Actions */}
      {isDriver && ride.status === "accepted" && (
        <Button onClick={() => advance("in_progress")} disabled={busy} className="mt-3 w-full rounded-full">Start trip</Button>
      )}
      {isDriver && ride.status === "in_progress" && (
        <Button onClick={() => advance("completed")} disabled={busy} className="mt-3 w-full rounded-full">Complete trip</Button>
      )}
      {!isDriver && (ride.status === "requested" || ride.status === "accepted") && (
        <Button variant="outline" onClick={() => advance("cancelled")} disabled={busy} className="mt-3 w-full rounded-full">Cancel</Button>
      )}
      {!isDriver && ride.status === "completed" && !ride.rating && (
        <div className="mt-3 space-y-2 rounded-xl bg-accent p-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rate your driver</div>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className="p-1">
                <Star className={`h-6 w-6 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional feedback" maxLength={280} className="min-h-[60px] text-sm" />
          <Button onClick={rate} disabled={!rating} size="sm" className="w-full rounded-full">Submit rating</Button>
        </div>
      )}
      {ride.rating && (
        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Rated {ride.rating}/5
        </div>
      )}
      {ride.cancellation_fee > 0 && (
        <div className="mt-2 text-xs text-destructive">Cancellation fee: P{ride.cancellation_fee}</div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    requested: "bg-accent text-accent-foreground",
    accepted: "bg-foreground text-background",
    in_progress: "bg-primary text-primary-foreground",
    completed: "bg-emerald-100 text-emerald-900",
    cancelled: "bg-muted text-muted-foreground line-through",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status] ?? ""}`}>{status.replace("_", " ")}</span>;
}
