import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { roles, user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (!roles.includes("admin")) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-bold">Admin access required</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your account does not have admin privileges.</p>
        <p className="mt-4 text-xs text-muted-foreground">User ID: <code className="rounded bg-muted px-1 py-0.5">{user?.id}</code></p>
      </div>
    );
  }

  const tabs = [
    { to: "/app/admin", label: "Dashboard", active: path === "/app/admin" },
    { to: "/app/admin/users", label: "Users", active: path.startsWith("/app/admin/users") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Admin</h1>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={`rounded-full py-2 text-center text-sm font-semibold transition ${
              t.active ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
