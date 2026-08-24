"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ErrorState, SuccessState } from "@/components/states";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setError(body.message ?? "Could not process that request.");
        return;
      }
      setMessage(body.message);
      if (body.devResetUrl) setDevResetUrl(body.devResetUrl);
    } catch {
      setError("Could not reach the backend. Is it running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl">Forgot password</h1>
        <p className="mt-2 text-sm text-stone-600">
          Enter your account email and we&apos;ll send a link to reset your password.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
          {error ? <ErrorState title={error} /> : null}
          {message ? <SuccessState title={message} /> : null}
          {devResetUrl ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              Dev mode (no email provider configured):{" "}
              <Link className="underline" href={devResetUrl}>
                {devResetUrl}
              </Link>
            </p>
          ) : null}
        </form>
        <p className="mt-6 text-sm">
          <Link className="underline" href="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}
