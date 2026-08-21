"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { demoAccounts } from "@/lib/auth/session";
import { usePlatform } from "@/lib/data/platform-store";
import { ErrorState } from "@/components/states";
import Link from "next/link";

// Matches backend/api/scripts/seed.js's seeded demo accounts.
const DEMO_PASSWORD = "password123";
const DEMO_EMAILS = new Set(demoAccounts.map((a) => a.email.toLowerCase()));

async function postJson(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json().catch(() => ({})) };
}

export default function LoginPage() {
  const store = usePlatform();
  const router = useRouter();
  const [email, setEmail] = useState("ananya@katalyst.edu");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(signInEmail: string, signInPassword: string) {
    setBusy(true);
    setError(null);
    try {
      let { res, body } = await postJson("/api/auth/login", { email: signInEmail, password: signInPassword });

      // Auto-provision only the curated demo accounts if backend/api hasn't
      // been seeded yet (scripts/seed.js) - never for an arbitrary email, so
      // a real user's typo/wrong password still surfaces as a real error
      // instead of silently creating a new account.
      if (!body.success && DEMO_EMAILS.has(signInEmail.toLowerCase()) && signInPassword === DEMO_PASSWORD) {
        const demo = demoAccounts.find((a) => a.email.toLowerCase() === signInEmail.toLowerCase())!;
        await postJson("/api/auth/register", {
          name: demo.name,
          email: demo.email,
          password: DEMO_PASSWORD,
          role: demo.role,
        });
        ({ res, body } = await postJson("/api/auth/login", { email: signInEmail, password: signInPassword }));
      }

      if (!res.ok || !body.success) {
        setError(body.message ?? "Unable to sign in");
        return;
      }
      // Real credentials are now checked against backend/api. Sync the mock
      // store (still what most pages read from, pending later migration
      // phases) so this session keeps working across the rest of the app -
      // matching by email for existing demo/mock users, or creating a
      // mirror entry for a real account backend/api knows but the mock
      // store doesn't yet.
      const local = store.login(signInEmail);
      if (!local.ok) {
        store.register({
          name: body.user.name,
          email: body.user.email,
          college: body.user.college ?? "",
          programme: body.user.programme ?? "",
          role: body.user.role,
        });
      }
      router.push(body.user.role === "admin" ? "/admin" : "/student");
    } catch {
      setError("Could not reach the backend. Is it running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-stone-600">
          Real authentication against backend/api (bcrypt-checked password, JWT session). Demo accounts below share
          the password <code>{DEMO_PASSWORD}</code> and are auto-provisioned on first use if not already seeded.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void signIn(email, password);
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Continue"}
          </Button>
          {error ? <ErrorState title={error} hint="Try a demo account below." /> : null}
        </form>
        <div className="mt-8 space-y-2 text-sm">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-left"
              onClick={() => void signIn(a.email, DEMO_PASSWORD)}
              disabled={busy}
            >
              <span>
                {a.name}
                <span className="block text-xs text-stone-500">{a.email}</span>
              </span>
              <span className="text-xs uppercase">{a.role}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-sm">
          New here? <Link className="underline" href="/register">Register with OCR assist</Link>
        </p>
      </div>
    </PublicShell>
  );
}
