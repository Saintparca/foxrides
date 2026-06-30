import { Phone, MessageCircle, Share2, ShieldAlert } from "lucide-react";
import { OWNER_WHATSAPP_INTL, waLink } from "@/lib/whatsapp";
import { toast } from "sonner";

function normalizeBwIntl(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("267")) return digits;
  if (digits.length === 8) return "267" + digits;
  return digits;
}

export function DriverActionsBar({
  driverPhone,
  driverName,
  ride,
}: {
  driverPhone?: string | null;
  driverName?: string | null;
  ride: { id: string; pickup_address: string; destination_address: string; driver_lat?: number | null; driver_lng?: number | null };
}) {
  const intl = normalizeBwIntl(driverPhone);

  const share = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/app/history` : "";
    const text = `I'm on a Fox Rides trip from ${ride.pickup_address} to ${ride.destination_address}. Track: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "My Fox Rides trip", text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Trip details copied");
    }
  };

  const sos = () => {
    const loc = ride.driver_lat && ride.driver_lng
      ? `https://maps.google.com/?q=${ride.driver_lat},${ride.driver_lng}`
      : "no live location yet";
    const msg = `🚨 SOS from Fox Rides passenger.\nRide: ${ride.id.slice(0, 8)}\nFrom: ${ride.pickup_address}\nTo: ${ride.destination_address}\nLive: ${loc}`;
    window.open(waLink(msg), "_blank");
    setTimeout(() => { window.location.href = `tel:+${OWNER_WHATSAPP_INTL}`; }, 400);
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      <a href={intl ? `tel:+${intl}` : undefined}
         aria-disabled={!intl}
         className={`flex flex-col items-center gap-1 rounded-xl border border-border bg-card py-2.5 text-[10px] font-bold ${intl ? "" : "opacity-40 pointer-events-none"}`}>
        <Phone className="h-4 w-4" /> Call
      </a>
      <a href={intl ? `https://wa.me/${intl}?text=${encodeURIComponent(`Hi ${driverName ?? ""}, I'm your Fox Rides passenger.`)}` : undefined}
         target="_blank" rel="noreferrer"
         aria-disabled={!intl}
         className={`flex flex-col items-center gap-1 rounded-xl border border-border bg-[#25D366]/10 py-2.5 text-[10px] font-bold text-[#128C7E] ${intl ? "" : "opacity-40 pointer-events-none"}`}>
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
      <button onClick={share}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card py-2.5 text-[10px] font-bold">
        <Share2 className="h-4 w-4" /> Share
      </button>
      <button onClick={sos}
              className="flex flex-col items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 py-2.5 text-[10px] font-bold text-destructive">
        <ShieldAlert className="h-4 w-4" /> SOS
      </button>
    </div>
  );
}
