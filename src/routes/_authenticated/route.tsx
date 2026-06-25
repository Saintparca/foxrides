import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { FoxMark } from "../index";
import { Home, History, DollarSign, Shield, LogOut, UserCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

function Layout() {
  const { roles, signOut, user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isDriver = roles.includes("driver");
  const isAdmin = roles.includes("admin");

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link to="/app" className="flex items-center gap-2">
            <FoxMark /><span className="text-lg font-black">Fox Rides</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">{user?.email}</span>
            <button onClick={signOut} aria-label="Sign out" className="ml-2 rounded-full p-2 hover:bg-accent">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6"><Outlet /></main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          <NavItem to="/app" icon={<Home className="h-5 w-5" />} label="Home" active={path === "/app"} />
          <NavItem to="/app/history" icon={<History className="h-5 w-5" />} label="Trips" active={path.startsWith("/app/history")} />
          {isDriver && <NavItem to="/app/earnings" icon={<DollarSign className="h-5 w-5" />} label="Earnings" active={path.startsWith("/app/earnings")} />}
          {isAdmin && <NavItem to="/app/admin" icon={<Shield className="h-5 w-5" />} label="Admin" active={path.startsWith("/app/admin")} />}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, active }: any) {
  return (
    <Link to={to} className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
      {icon}<span>{label}</span>
    </Link>
  );
}
