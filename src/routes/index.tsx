import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Clock, Shield, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fox Rides — Book rides in seconds" },
      { name: "description", content: "Fox Rides connects you with nearby drivers. Transparent fares, real ratings, instant booking." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <FoxMark />
            <span className="text-lg font-black tracking-tight">Fox Rides</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground">
              Sign in
            </Link>
            <Link to="/auth" search={{ tab: "signup" }} className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background hover:bg-foreground/90">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--fox)_18%,transparent),transparent_70%)]" />
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-12 sm:pt-20">
          <div className="grid gap-10 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Now in your city
              </span>
              <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                Rides that<br />
                <span className="text-primary">move with you.</span>
              </h1>
              <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
                Book a Fox in seconds. Clean cars, vetted drivers, and prices you can see before you tap.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/auth" search={{ tab: "signup", role: "customer" }} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-fox)] hover:bg-primary/90">
                  Book a ride
                </Link>
                <Link to="/auth" search={{ tab: "signup", role: "driver" }} className="rounded-full border border-foreground/15 bg-card px-6 py-3 text-sm font-semibold hover:bg-accent">
                  Drive with Fox
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                <Stat icon={<Shield className="h-4 w-4" />} label="Verified drivers" />
                <Stat icon={<Clock className="h-4 w-4" />} label="Avg 4 min pickup" />
                <Stat icon={<Star className="h-4 w-4" />} label="4.9 rating" />
              </div>
            </div>

            {/* Phone mock */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="relative aspect-[9/16] rounded-[2.5rem] border-[10px] border-foreground bg-gradient-ink p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
                <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-foreground/40" />
                <div className="rounded-2xl bg-background p-4 text-foreground">
                  <div className="flex items-center gap-2"><FoxMark small /><span className="text-sm font-bold">Fox Rides</span></div>
                  <div className="mt-4 space-y-2 rounded-xl bg-muted p-3">
                    <Row dot="bg-primary" text="Pickup · Main St & 4th" />
                    <div className="ml-1.5 h-3 w-px bg-border" />
                    <Row dot="bg-foreground" text="Drop · Airport Terminal 2" />
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Estimated fare</div>
                      <div className="text-2xl font-black">$18.40</div>
                    </div>
                    <div className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Confirm</div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent p-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background"><Car className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">Maya · Tesla Model 3</div>
                      <div className="text-xs text-muted-foreground">★ 4.97 · 3 min away</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © Fox Rides · <Link to="/admin-info" className="underline-offset-2 hover:underline">Admin</Link>
      </footer>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex items-center gap-1.5">{icon}<span>{label}</span></div>;
}
function Row({ dot, text }: { dot: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className="truncate">{text}</span>
    </div>
  );
}

export function FoxMark({ small = false }: { small?: boolean }) {
  const size = small ? "h-6 w-6" : "h-8 w-8";
  return (
    <div className={`${size} grid place-items-center rounded-lg bg-gradient-fox text-primary-foreground shadow-[var(--shadow-fox)]`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4l3 5-3 3 4 1 3 6 3-6 4-1-3-3 3-5-5 2-2-2-2 2z" />
      </svg>
    </div>
  );
}
