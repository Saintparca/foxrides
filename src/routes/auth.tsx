import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FoxMark } from "./index";

const search = z.object({
  tab: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["customer", "driver"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Sign in · Fox Rides" }] }),
  component: AuthPage,
});

function AuthPage() {
  const sp = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(sp.tab ?? "signin");
  const [role, setRole] = useState<"customer" | "driver">(sp.role ?? "customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        const parse = z.object({
          name: z.string().trim().min(2).max(80),
          phone: z.string().trim().max(30).optional(),
          email: z.string().trim().email().max(255),
          password: z.string().min(6).max(72),
        }).safeParse({ name, phone, email, password });
        if (!parse.success) { toast.error(parse.error.issues[0].message); return; }

        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: name, phone, role },
          },
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Account created. Welcome to Fox Rides!");
        if (role === "driver") navigate({ to: "/driver-onboarding" });
        else navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        toast.success("Signed in");
        navigate({ to: "/app" });
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <Link to="/" className="flex items-center gap-2 self-start">
          <FoxMark /><span className="text-lg font-black">Fox Rides</span>
        </Link>

        <div className="mt-10">
          <h1 className="text-3xl font-black tracking-tight">
            {tab === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {tab === "signin" ? "Sign in to book or drive." : `Sign up as ${role === "driver" ? "a driver" : "a rider"}.`}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {(["signin", "signup"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`rounded-full py-2 text-sm font-semibold transition ${tab === t ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {tab === "signup" && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["customer", "driver"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`rounded-xl border p-3 text-left transition ${role === r ? "border-primary bg-accent shadow-[var(--shadow-fox)]" : "border-border hover:bg-accent"}`}>
                <div className="text-sm font-bold capitalize">{r === "customer" ? "Rider" : "Driver"}</div>
                <div className="text-xs text-muted-foreground">{r === "customer" ? "Book rides" : "Earn driving"}</div>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {tab === "signup" && (
            <>
              <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></Field>
              <Field label="Phone (optional)"><Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} /></Field>
            </>
          )}
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></Field>

          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-bold">
            {busy ? "Please wait…" : tab === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
          By continuing you agree to Fox Rides' terms.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
