"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { FileInput, Input, Label, Select } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { extractFromDocument } from "@/lib/ocr/service";
import { usePlatform } from "@/lib/data/platform-store";
import { ErrorState, LoadingState, SuccessState } from "@/components/states";
import { InterestPicker } from "@/components/onboarding/interest-picker";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { useI18n } from "@/lib/i18n/provider";
import Link from "next/link";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const { t } = useI18n();
  const setSession = usePlatform((s) => s.setSession);
  const sessionUserId = usePlatform((s) => s.sessionUserId);
  const studentProfiles = usePlatform((s) => s.studentProfiles);
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [ocr, setOcr] = useState<"idle" | "processing" | "ready">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [programme, setProgramme] = useState("Katalyst Fellows 2026");
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"details" | "interests">("details");
  const [interests, setInterests] = useState<string[]>([]);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  const userId = newUserId ?? sessionUserId;
  const pendingOnboarding = studentProfiles.find((p) => p.userId === userId)?.onboarded === false;

  useEffect(() => {
    // The Zustand store hydrates asynchronously after mount, so
    // pendingOnboarding/sessionUserId aren't known during the initial
    // render — this can't be computed as derived state, it has to react
    // once hydration reveals an in-progress onboarding.
    if (pendingOnboarding && sessionUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewUserId(sessionUserId);
      setStep("interests");
      setRole("student");
    }
  }, [pendingOnboarding, sessionUserId]);

  /**
   * Creates the real backend/api account (bcrypt + JWT, sets the httpOnly
   * session cookie via app/api/auth/register), then sets the client-side
   * session (lib/data/platform-store.ts's setSession) so the rest of the UI
   * hydrates from that real account. Students then go to the interest step;
   * admins land straight in the admin portal.
   */
  async function createAccount() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, college, programme }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setError(body.message ?? "Could not register");
        return;
      }

      setSession(body.user);

      if (role === "admin") {
        setOk(true);
        router.push("/admin");
        return;
      }
      setNewUserId(body.user.id);
      setStep("interests");
    } catch {
      setError("Could not reach the backend. Is it running?");
    } finally {
      setBusy(false);
    }
  }

  /** Persists the chosen interests to backend/api and marks onboarding done. */
  async function finish(selected: string[]) {
    if (!userId) return;
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selected }),
      });
    } catch {
      // Interests are a personalisation nicety - a backend hiccup here must
      // not strand a student who already has a real account.
    }
    void usePlatform.getState().hydrate();
    setOk(true);
    router.push("/student");
  }

  const interestStep = step === "interests" && role === "student";

  return (
    <PublicShell>
      <div className={interestStep ? "mx-auto max-w-3xl px-4 py-12" : "mx-auto max-w-lg px-4 py-12"}>
        {interestStep ? (
          <InterestStep
            selected={interests}
            onChange={setInterests}
            onContinue={() => void finish(interests)}
            onSkip={() => void finish([])}
          />
        ) : (
          <>
            <h1 className="font-serif text-3xl">{t.registerTitle}</h1>
            <p className="mt-2 text-sm text-stone-600">{t.registerSubtitle}</p>
            <div className="mt-6">
              <OAuthButtons label={t.orSignUpWithEmail} />
            </div>
            <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
              <div>
                <Label htmlFor="role">{t.roleLabel}</Label>
                <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="student">{t.roleStudent}</option>
                  <option value="admin">{t.roleAdmin}</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="doc">Document (OCR — auto-fills the fields below)</Label>
                <FileInput
                  id="doc"
                  accept="image/*,.pdf"
                  buttonLabel="Choose document"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setOcr("processing");
                    const data = await extractFromDocument(file);
                    setName(data.name);
                    setEmail(data.email);
                    setCollege(data.college);
                    setProgramme(data.programme);
                    setOcr("ready");
                    setVerified(false);
                  }}
                />
                {ocr === "processing" ? <div className="mt-2"><LoadingState title="Reading document…" /></div> : null}
                {ocr === "ready" ? <p className="mt-2 text-xs text-stone-500">Extracted. Edit anything that looks wrong.</p> : null}
              </div>
              <Field label={t.fullNameLabel} value={name} onChange={setName} />
              <Field label={t.emailLabel} value={email} onChange={setEmail} type="email" />
              <Field label={t.collegeLabel} value={college} onChange={setCollege} />
              <Field label={t.programmeLabel} value={programme} onChange={setProgramme} />
              <Field label={t.passwordLabel} value={password} onChange={setPassword} type="password" />
              <p className="text-xs text-stone-500">At least 6 characters.</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
                I have verified the details above
              </label>
              <Button disabled={!verified || busy || password.length < 6} onClick={() => void createAccount()}>
                {busy ? t.creatingAccount : t.createAccountButton}
              </Button>
              {error ? <ErrorState title={error} /> : null}
              {ok ? <SuccessState title="Welcome to Katalyst." /> : null}
            </div>
            <p className="mt-6 text-sm">
              {t.alreadyHaveAccountQuestion} <Link className="underline" href="/login">{t.signIn2}</Link>
            </p>
          </>
        )}
      </div>
    </PublicShell>
  );
}

function InterestStep({
  selected,
  onChange,
  onContinue,
  onSkip,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const count = selected.length;
  const headingId = "interest-heading";
  const canContinue = count >= 1;
  const progressHint = useMemo(() => (canContinue ? 100 : 55), [canContinue]);

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-purple">Personalize your journey</p>
      <p className="mt-1 text-sm text-muted">Step 2 of 2</p>
      <ProgressBar value={progressHint} className="mt-3 max-w-xs" />
      <h1 id={headingId} className="mt-6 font-serif text-3xl">
        What are you interested in?
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Choose the areas you&apos;d like to explore. We&apos;ll personalize your learning journey, recommendations and
        missions around your interests.
      </p>
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <InterestPicker selected={selected} onChange={onChange} labelledBy={headingId} />
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {count === 0 ? "Select at least one area to continue." : `${count} selected`}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!canContinue} onClick={onContinue}>
            Continue
          </Button>
          <Button type="button" variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
