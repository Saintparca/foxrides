import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Clock, Wallet, ArrowRight } from "lucide-react";
import foxMark from "@/assets/fox-mark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fox Rides — Your Ride. Your Way." },
      { name: "description", content: "Safe, reliable and affordable rides anytime, anywhere in Botswana." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* Decorative dot patterns */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 8%, rgba(255,109,26,0.25) 1px, transparent 1.5px), radial-gradient(circle at 92% 92%, rgba(255,109,26,0.22) 1px, transparent 1.5px)",
          backgroundSize: "18px 18px, 16px 16px",
          backgroundPosition: "top left, bottom right",
          backgroundRepeat: "no-repeat",
          maskImage:
            "radial-gradient(60% 40% at 10% 8%, black 40%, transparent 70%), radial-gradient(50% 40% at 92% 92%, black 40%, transparent 70%)",
          WebkitMaskComposite: "source-over",
        }}
      />
      {/* Subtle orange arc top-left */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full border border-[#ff6d1a]/25" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[360px] w-[360px] rounded-full border border-[#ff6d1a]/15" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 pt-14">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img
            src={foxMark}
            alt="Fox Rides"
            className="h-40 w-40 select-none drop-shadow-[0_10px_30px_rgba(255,109,26,0.35)]"
            draggable={false}
          />
          <h1 className="mt-4 text-5xl font-black tracking-tight">
            <span className="text-[#ff6d1a]">FOX</span> <span className="text-white">RIDES</span>
          </h1>
          <p className="mt-3 text-[13px] font-semibold tracking-[0.28em] text-white/80">
            YOUR RIDE. <span className="text-[#ff6d1a]">YOUR WAY.</span>
          </p>
        </div>

        {/* Welcome copy */}
        <div className="mt-14 text-center">
          <h2 className="text-2xl font-bold">Welcome to Fox Rides</h2>
          <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-white/60">
            Safe, reliable and affordable rides anytime, anywhere in Botswana.
          </p>
        </div>

        {/* Feature row */}
        <div className="mt-10 grid grid-cols-[1fr_1px_1fr_1px_1fr] items-center gap-0">
          <Feature icon={<Shield className="h-8 w-8" strokeWidth={1.75} />} label={<>SAFE &<br/>SECURE</>} />
          <div className="h-14 w-px bg-white/15" />
          <Feature icon={<Clock className="h-8 w-8" strokeWidth={1.75} />} label={<>FAST &<br/>RELIABLE</>} />
          <div className="h-14 w-px bg-white/15" />
          <Feature icon={<Wallet className="h-8 w-8" strokeWidth={1.75} />} label={<>AFFORDABLE<br/>FARES</>} />
        </div>


        {/* CTAs */}
        <div className="mt-auto space-y-4 pt-12">
          <Link
            to="/auth"
            search={{ role: "customer" }}
            className="flex h-14 w-full items-center justify-center rounded-full bg-[#ff6d1a] text-base font-bold tracking-[0.18em] text-white shadow-[0_12px_30px_-8px_rgba(255,109,26,0.55)] transition active:scale-[0.98]"
          >
            GET STARTED
          </Link>
          <Link
            to="/auth"
            className="flex h-14 w-full items-center justify-center rounded-full border-2 border-[#ff6d1a] text-base font-bold tracking-[0.18em] text-[#ff6d1a] transition hover:bg-[#ff6d1a]/10"
          >
            LOGIN
          </Link>
          <p className="pt-2 text-center text-sm text-white/60">
            New here?{" "}
            <Link
              to="/auth"
              search={{ role: "customer" }}
              className="inline-flex items-center gap-1 font-semibold text-[#ff6d1a]"
            >
              Create an account <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  label,
  noDivider: _noDivider,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  noDivider?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center text-[#ff6d1a]">
      {icon}
      <div className="text-[11px] font-bold leading-tight tracking-[0.15em] text-white">
        {label}
      </div>
    </div>
  );
}

// Kept for backwards compatibility with other routes importing FoxMark.
export function FoxMark({ small = false }: { small?: boolean }) {
  const size = small ? "h-6 w-6" : "h-8 w-8";
  return (
    <img
      src={foxMark}
      alt="Fox Rides"
      className={`${size} select-none`}
      draggable={false}
    />
  );
}
