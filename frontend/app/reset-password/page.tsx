"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ErrorState, SuccessState } from "@/components/states";
import { useI18n } from "@/lib/i18n/provider";

function ResetPasswordForm() {
  const { t } = useI18n();
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
      setError(t.passwordsDontMatch);
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
        setError(body.message ?? t.couldNotResetPassword);
        return;
      }
      setOk(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError(t.couldNotReachBackend);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return <ErrorState title={t.missingOrInvalidResetLink} hint={t.requestNewResetLinkHint} />;
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div>
        <Label htmlFor="password">{t.newPasswordLabel}</Label>
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
        <Label htmlFor="confirm">{t.confirmPasswordLabel}</Label>
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
        {busy ? t.savingLabel : t.resetPasswordButton}
      </Button>
      {error ? <ErrorState title={error} /> : null}
      {ok ? <SuccessState title={t.passwordResetRedirectingNotice} /> : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl">{t.resetPasswordTitle}</h1>
        <p className="mt-2 text-sm text-stone-600">{t.resetPasswordSubtitle}</p>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-6 text-sm">
          <Link className="underline" href="/login">
            {t.backToSignIn}
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}
