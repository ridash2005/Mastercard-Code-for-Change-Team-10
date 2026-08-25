"use client";

// Lands here after a Google/GitHub redirect chain (see app/api/auth/
// {google,github}/route.ts and backend/api's controllers/oauthController.js)
// with a one-time ?code=... in the URL - never the real session token, see
// that controller's docstring for why. Trades it for the real session via
// app/api/auth/oauth-exchange/route.ts, then routes exactly like a normal
// login/register would: admins to /admin, students with onboarding already
// done to /student, brand-new students to /register (its own effect there
// picks up the in-progress onboarding and resumes at the interests step).

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { usePlatform } from "@/lib/data/platform-store";
import { ErrorState, LoadingState } from "@/components/states";
import Link from "next/link";

function OAuthCallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const setSession = usePlatform((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const code = params.get("code");
    if (!code) {
      setError("Missing sign-in code. Please try signing in again.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/oauth-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.success) {
          setError(body.message ?? "Could not complete sign-in.");
          return;
        }

        setSession(body.user);
        if (body.user.role === "admin") {
          router.replace("/admin");
        } else if (body.user.onboardingCompleted) {
          router.replace("/student");
        } else {
          router.replace("/register");
        }
      } catch {
        setError("Could not reach the backend. Please try again.");
      }
    })();
  }, [params, router, setSession]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorState title={error} hint="You can try again from the sign-in page." />
        <Link href="/login" className="mt-6 block text-center text-sm underline text-stone-500">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <LoadingState title="Finishing sign-in…" />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <PublicShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-md px-4 py-16">
            <LoadingState title="Finishing sign-in…" />
          </div>
        }
      >
        <OAuthCallbackInner />
      </Suspense>
    </PublicShell>
  );
}
