"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ErrorState, SuccessState } from "@/components/states";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setError(body.message ?? "Could not reset your password.");
        return;
      }
      setOk(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Could not reach the backend. Is it running?");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <ErrorState
        title="Missing or invalid reset link."
        hint="Request a new one from the forgot-password page."
      />
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Saving…" : "Reset password"}
      </Button>
      {error ? <ErrorState title={error} /> : null}
      {ok ? <SuccessState title="Password reset. Redirecting to sign in…" /> : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl">Reset password</h1>
        <p className="mt-2 text-sm text-stone-600">Choose a new password for your account.</p>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-6 text-sm">
          <Link className="underline" href="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}
