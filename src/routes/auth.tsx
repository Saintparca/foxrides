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

// Normalize BW phone to E.164 (+267XXXXXXXX). Accepts local 8-digit or 267 prefixed.
function normalizePhoneE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("267") ? digits.slice(3) : digits;
  if (local.length < 7 || local.length > 12) return null;
  return `+267${local}`;
}

function AuthPage() {
  const sp = Route.useSearch();
  const navigate = useNavigate();
  const [role, setRole] = useState<"customer" | "driver">(sp.role ?? "customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [phoneE164, setPhoneE164] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const parse = z.object({
        name: z.string().trim().min(2, "Enter your full name").max(80),
        phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
      }).safeParse({ name, phone });
      if (!parse.success) { toast.error(parse.error.issues[0].message); return; }

      const e164 = normalizePhoneE164(parse.data.phone);
      if (!e164) { toast.error("Enter a valid Botswana phone number"); return; }

      const { error } = await supabase.auth.signInWithOtp({
        phone: e164,
        options: {
          channel: "sms",
          data: { full_name: parse.data.name, phone: e164.replace("+267", ""), role },
        },
      });
      if (error) {
        toast.error(
          error.message.includes("provider")
            ? "SMS provider not configured. Ask the admin to enable phone auth."
            : error.message
        );
        return;
      }
      setPhoneE164(e164);
      setStep("otp");
      toast.success("We sent you a 6-digit code by SMS");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const parse = z.object({ otp: z.string().trim().regex(/^\d{4,8}$/, "Enter the code from your SMS") })
        .safeParse({ otp });
      if (!parse.success) { toast.error(parse.error.issues[0].message); return; }

      const { error } = await supabase.auth.verifyOtp({
        phone: phoneE164,
        token: parse.data.otp,
        type: "sms",
      });
      if (error) { toast.error(error.message); return; }

      toast.success(`Welcome, ${name.split(" ")[0]}!`);
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
            {step === "details"
              ? "We'll text you a code to confirm your number."
              : `Enter the 6-digit code sent to ${phoneE164}.`}
          </p>
        </div>

        {step === "details" && (
          <>
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

            <form onSubmit={sendOtp} className="mt-6 space-y-4">
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
                {busy ? "Sending code…" : "Send SMS code"}
              </Button>
            </form>
          </>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <Field label="6-digit code">
              <Input type="text" inputMode="numeric" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="123456" required autoFocus />
            </Field>
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-bold">
              {busy ? "Verifying…" : "Verify & continue"}
            </Button>
            <button type="button" onClick={() => { setStep("details"); setOtp(""); }}
              className="w-full text-center text-xs font-semibold text-muted-foreground underline">
              Use a different number
            </button>
          </form>
        )}

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
