import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const roleEnum = z.enum(["customer", "driver", "admin"]);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Paginate through all auth users (listUsers caps at ~1000 per page)
    const perPage = 1000;
    const emailById = new Map<string, string>();
    const bannedById = new Map<string, boolean>();
    for (let page = 1; page <= 50; page++) {
      const { data: authPage, error: aErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (aErr) throw new Error(aErr.message);
      const users = authPage?.users ?? [];
      for (const u of users) {
        emailById.set(u.id, u.email ?? "");
        const until = (u as any).banned_until;
        bannedById.set(u.id, !!until && new Date(until).getTime() > Date.now());
      }
      if (users.length < perPage) break;
    }

    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }, { data: drivers, error: dErr }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name, phone, is_active, created_at"),
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("drivers").select("id, vehicle_make, vehicle_model, vehicle_plate, is_approved, activation_paid"),
      ]);
    if (pErr) throw new Error(pErr.message);
    if (rErr) throw new Error(rErr.message);
    if (dErr) throw new Error(dErr.message);

    const rolesById = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesById.get(r.user_id) ?? [];
      list.push(r.role as string);
      rolesById.set(r.user_id, list);
    }

    const driverById = new Map<string, any>();
    for (const d of drivers ?? []) driverById.set(d.id, d);

    return (profiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      email: emailById.get(p.id) ?? "",
      is_active: p.is_active,
      banned: bannedById.get(p.id) ?? false,
      created_at: p.created_at,
      roles: rolesById.get(p.id) ?? [],
      driver: driverById.get(p.id) ?? null,
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "customer" | "driver" | "admin"; grant: boolean }) =>
    z.object({ userId: z.string().uuid(), role: roleEnum, grant: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      if (data.role === "admin" && data.userId === context.userId) {
        throw new Error("You cannot remove your own admin role");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; active: boolean }) =>
    z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.active && data.userId === context.userId) {
      throw new Error("You cannot deactivate yourself");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: data.active })
      .eq("id", data.userId);
    if (pErr) throw new Error(pErr.message);

    const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.active ? "none" : "876000h",
    });
    if (aErr) throw new Error(aErr.message);

    return { ok: true };
  });
