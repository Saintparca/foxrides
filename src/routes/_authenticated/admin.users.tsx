import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, UserCheck, UserX, ShieldCheck, ShieldOff, Car, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { listAllUsers, setUserRole, setUserActive } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

type Row = Awaited<ReturnType<typeof listAllUsers>>[number];

function AdminUsersPage() {
  const { user } = useAuth();
  const fetchAll = useServerFn(listAllUsers);
  const mutateRole = useServerFn(setUserRole);
  const mutateActive = useServerFn(setUserActive);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "customer" | "driver" | "admin" | "inactive">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAll();
      setRows(data);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "inactive" && r.is_active && !r.banned) return false;
      if (filter !== "all" && filter !== "inactive" && !r.roles.includes(filter)) return false;
      if (!needle) return true;
      return (
        r.full_name?.toLowerCase().includes(needle) ||
        r.email?.toLowerCase().includes(needle) ||
        r.phone?.toLowerCase().includes(needle) ||
        r.driver?.vehicle_plate?.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, filter]);

  const toggleRole = async (row: Row, role: "customer" | "driver" | "admin") => {
    const grant = !row.roles.includes(role);
    setBusy(row.id + role);
    try {
      await mutateRole({ data: { userId: row.id, role, grant } });
      toast.success(`${grant ? "Granted" : "Removed"} ${role}`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (row: Row) => {
    const active = !(row.is_active && !row.banned);
    setBusy(row.id + "active");
    try {
      await mutateActive({ data: { userId: row.id, active } });
      toast.success(active ? "Account activated" : "Account deactivated");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, phone, plate…"
          className="h-11 rounded-full pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["all", "customer", "driver", "admin", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} of {rows.length} {rows.length === 1 ? "user" : "users"}</div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No users match.</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => {
            const inactive = !r.is_active || r.banned;
            const isSelf = r.id === user?.id;
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-bold">{r.full_name || "Unnamed"}</div>
                      {isSelf && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">You</span>}
                      {inactive && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">Inactive</span>}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{r.email || "—"}</div>
                    {r.phone && <div className="truncate text-xs text-muted-foreground">{r.phone}</div>}
                    {r.driver && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Car className="h-3 w-3" />
                        {r.driver.vehicle_make} {r.driver.vehicle_model} · {r.driver.vehicle_plate}
                        {r.driver.is_approved ? <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Approved</span> : <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">Pending</span>}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={inactive ? "default" : "outline"}
                    disabled={isSelf || busy === r.id + "active"}
                    onClick={() => toggleActive(r)}
                    className="rounded-full"
                  >
                    {inactive ? <><UserCheck className="mr-1 h-3.5 w-3.5" />Activate</> : <><UserX className="mr-1 h-3.5 w-3.5" />Deactivate</>}
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(["customer", "driver", "admin"] as const).map((role) => {
                    const has = r.roles.includes(role);
                    const disabled = busy === r.id + role || (role === "admin" && isSelf && has);
                    return (
                      <button
                        key={role}
                        disabled={disabled}
                        onClick={() => toggleRole(r, role)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                          has ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {role === "admin" ? (has ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />) : role === "driver" ? <Car className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                        <span className="capitalize">{role}</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
