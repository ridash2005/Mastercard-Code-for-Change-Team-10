"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { demoAccounts } from "@/lib/auth/session";
import { usePlatform } from "@/lib/data/platform-store";
import { ErrorState } from "@/components/states";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { useI18n } from "@/lib/i18n/provider";
import Link from "next/link";

// Matches backend/api/scripts/seed.js's default demo account password
// (itself matching root .env.example's BACKEND_DEMO_PASSWORD default).
const DEMO_PASSWORD = "katalyst-demo-bridge-2026";
const DEMO_EMAILS = new Set(demoAccounts.map((a) => a.email.toLowerCase()));

async function postJson(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json().catch(() => ({})) };
}

function LoginForm() {
  const store = usePlatform();
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Read straight from the URL instead of next/navigation's useSearchParams
  // - that hook forces this whole tree behind a Suspense boundary, and this
  // page is statically prerendered (no per-request server render to
  // resolve it against), so the boundary's fallback is what actually ships
  // in the static HTML until client JS hydrates - a real, visible blank
  // flash on every load, not just when ?oauthError is actually present.
  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get("oauthError");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external source (the URL) on mount, not derivable as render-time state
    if (oauthError) setError(oauthError);
  }, []);

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
      // Real credentials are now checked against backend/api - this is the
      // real user record (real Mongo id), not a mock/demo lookup.
      store.setSession(body.user);
      router.push(body.user.role === "admin" ? "/admin" : "/student");
    } catch {
      setError(t.couldNotReachBackend);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl">{t.signInButton}</h1>
      <p className="mt-2 text-sm text-stone-600">{t.welcomeBack}</p>

      {error ? (
        <div className="mt-4">
          <ErrorState title={error} />
        </div>
      ) : null}

      <div className="mt-6">
        <OAuthButtons label={t.orContinueWithEmail} />
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn(email, password);
        }}
      >
        <div>
          <Label htmlFor="email">{t.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t.passwordLabel}</Label>
            <Link href="/forgot-password" className="text-xs underline text-stone-500">
              {t.forgotPasswordLink}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t.signingIn : t.signInButton}
        </Button>
      </form>

      <p className="mt-6 text-sm">
        {t.newHereQuestion} <Link className="underline" href="/register">{t.createAccountLink}</Link>
      </p>

      <div className="mt-10 border-t border-stone-200 pt-4">
        <button
          type="button"
          onClick={() => setShowDemo((v) => !v)}
          className="text-xs text-stone-400 underline"
        >
          {showDemo ? t.hideDemoAccounts : t.tryDemoAccount}
        </button>
        {showDemo ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-xs text-stone-500">
              Demo accounts share the password <code>{DEMO_PASSWORD}</code> and are auto-provisioned on first use if
              not already seeded.
            </p>
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
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
        ) : null}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PublicShell>
      <LoginForm />
    </PublicShell>
  );
}
