"use client";

import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "@/components/logo";
import { LearningJourney } from "@/components/landing/learning-journey";

export default function LandingPage() {
  const { t } = useI18n();
  return (
    <PublicShell>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
        <div>
          <Logo />
          <h1 className="mt-6 font-serif text-4xl leading-tight md:text-5xl">{t.tagline}</h1>
          <p className="mt-4 max-w-md text-muted">
            Katalyst turns programme work — courses, training, mentoring, projects — into a path you can
            actually finish. XP, missions and a coach that knows your deadlines. Not a toy.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-md bg-forest px-4 py-2 text-sm text-white">
              {t.getStarted}
            </Link>
            <Link href="/login" className="rounded-md border border-line px-4 py-2 text-sm">
              {t.signIn}
            </Link>
          </div>
        </div>
        <LearningJourney />
      </section>
      <section className="border-y border-line bg-card py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
          {[
            ["Training & courses", "Live clinics and certificate studios with due dates that mean something."],
            ["Projects & mentoring", "Team wallets, SQL cases, and 1:1 career stories — not generic badges."],
            ["XP you can explain", "Approved work awards XP. Leaderboards follow the ledger, not vibes."],
          ].map(([h, p]) => (
            <div key={h}>
              <h2 className="font-serif text-2xl">{h}</h2>
              <p className="mt-2 text-sm text-muted">{p}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-serif text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {["Create your profile", "Choose interests", "Complete activities", "Earn XP on the path"].map((s, i) => (
            <li key={s} className="rounded-xl border border-line bg-card p-4">
              <p className="text-xs text-muted">Step {i + 1}</p>
              <p className="mt-2 font-medium">{s}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="bg-plum py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
          <p className="font-serif text-3xl text-white">Start your journey</p>
          <Link href="/register" className="rounded-full bg-barbie px-4 py-2 text-sm text-white">
            Get started
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
