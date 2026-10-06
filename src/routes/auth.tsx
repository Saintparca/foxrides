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
  role: z.enum(["customer", "driver"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Sign in · Fox Rides" }] }),
  component: AuthPage,
});

// Normalize BW phone to local 8+ digits (strip 267 prefix).
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("267") ? digits.slice(3) : digits;
  if (local.length < 7 || local.length > 12) return null;
  return local;
}

// Phone-based credentials: no SMS or email verification required.
const emailFor = (local: string) => `${local}@foxrides.app`;
const passwordFor = (local: string) => `fxr-${local}-rides`;

function AuthPage() {
  const sp = Route.useSearch();
  const navigate = useNavigate();
  const [role, setRole] = useState<"customer" | "driver">(sp.role ?? "customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const continueWithPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const parse = z.object({
        name: z.string().trim().min(2, "Enter your full name").max(80),
        phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
      }).safeParse({ name, phone });
      if (!parse.success) { toast.error(parse.error.issues[0].message); return; }

      const local = normalizePhone(parse.data.phone);
      if (!local) { toast.error("Enter a valid Botswana phone number"); return; }

      const email = emailFor(local);
      const password = passwordFor(local);

      // Try sign-in first; if the account doesn't exist yet, create it.
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (signIn.error) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: parse.data.name, phone: local, role },
          },
        });
        if (signUpError) {
          toast.error(
            signUpError.message.includes("already registered")
              ? "This number is already registered. Please use the name you signed up with."
              : signUpError.message
          );
          return;
        }
        toast.success(`Welcome to Fox Rides, ${parse.data.name.split(" ")[0]}!`);
      } else {
        toast.success(`Welcome back, ${parse.data.name.split(" ")[0]}!`);
      }

      if (role === "driver") navigate({ to: "/driver-onboarding" });
      else navigate({ to: "/app" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <Link to="/" className="flex items-center gap-2 self-start">
          <FoxMark /><span className="text-lg font-black">Fox Rides</span>
        </Link>

        <div className="mt-10">
          <h1 className="text-3xl font-black tracking-tight">Welcome to Fox Rides</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Just your name and phone number — no codes, no waiting.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {(["customer", "driver"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border p-3 text-left transition ${
                role === r
                  ? "border-primary bg-accent shadow-[var(--shadow-fox)]"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="text-sm font-bold capitalize">
                {r === "customer" ? "Rider" : "Driver"}
              </div>
              <div className="text-xs text-muted-foreground">
                {r === "customer" ? "Book rides" : "Earn driving"}
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={continueWithPhone} className="mt-6 space-y-4">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kabo Mokoena" required maxLength={80} />
          </Field>
          <Field label="Phone number">
            <Input type="tel" inputMode="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="75 123 456" required maxLength={20} />
          </Field>
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-bold">
            {busy ? "Please wait…" : "Continue"}
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
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
