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

export default function LoginPage() {
  const login = usePlatform((s) => s.login);
  const router = useRouter();
  const [email, setEmail] = useState("ananya@katalyst.edu");
  const [error, setError] = useState<string | null>(null);

  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-stone-600">
          Mock authentication — enter a known email. Passwords are never collected or stored. Auth.js can replace this later.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const res = login(email);
            if (!res.ok) {
              setError(res.error ?? "Unable to sign in");
              return;
            }
            router.push(res.role === "admin" ? "/admin" : "/student");
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Continue</Button>
          {error ? <ErrorState title={error} hint="Try a demo account below." /> : null}
        </form>
        <div className="mt-8 space-y-2 text-sm">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-left"
              onClick={() => {
                const res = login(a.email);
                if (res.ok) router.push(a.role === "admin" ? "/admin" : "/student");
              }}
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
