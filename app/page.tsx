"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  const { t } = useI18n();
  return (
    <PublicShell>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
        <div>
          <Logo />
          <h1 className="mt-6 font-serif text-4xl leading-tight md:text-5xl">{t.tagline}</h1>
          <p className="mt-4 max-w-md text-stone-600">
            Katalyst turns programme work — courses, training, mentoring, projects — into a path you can
            actually finish. XP, missions and a coach that knows your deadlines. Not a toy.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-md bg-forest px-4 py-2 text-sm text-white">
              {t.getStarted}
            </Link>
            <Link href="/login" className="rounded-md border border-stone-300 px-4 py-2 text-sm">
              {t.signIn}
            </Link>
          </div>
        </div>
        <JourneyVisual />
      </section>
      <section className="border-y border-stone-200 bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
          {[
            ["Training & courses", "Live clinics and certificate studios with due dates that mean something."],
            ["Projects & mentoring", "Team wallets, SQL cases, and 1:1 career stories — not generic badges."],
            ["XP you can explain", "Approved work awards XP. Leaderboards follow the ledger, not vibes."],
          ].map(([h, p]) => (
            <div key={h}>
              <h2 className="font-serif text-2xl">{h}</h2>
              <p className="mt-2 text-sm text-stone-600">{p}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-serif text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {["Create your profile", "Choose interests", "Complete activities", "Earn XP on the path"].map((s, i) => (
            <li key={s} className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs text-stone-500">Step {i + 1}</p>
              <p className="mt-2 font-medium">{s}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="bg-forest py-12 text-sand">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
          <p className="font-serif text-3xl">Start your journey</p>
          <Link href="/register" className="rounded-md bg-sand px-4 py-2 text-sm text-forest">
            Get started
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}

function JourneyVisual() {
  const [active, setActive] = useState(2);
  const points = useMemo(
    () =>
      ["Foundation", "Payments", "DSA clinic", "Team project", "Internship-ready"].map((n, i) => ({
        n,
        x: 24 + i * 18,
        y: i % 2 === 0 ? 28 : 62,
      })),
    [],
  );
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">Learning path</p>
      <svg viewBox="0 0 120 90" className="mt-2 h-56 w-full">
        <path
          d="M20 30 C 40 30, 40 65, 60 65 S 80 30, 100 30"
          fill="none"
          stroke="#3d6b4f"
          strokeWidth="1.4"
        />
        {points.map((p, i) => (
          <g key={p.n}>
            <circle
              cx={p.x}
              cy={p.y}
              r={active === i ? 3.2 : 2.4}
              fill={i < active ? "#1F3D2B" : i === active ? "#B08D3E" : "#d6d3d1"}
            />
            <text x={p.x} y={p.y + 8} textAnchor="middle" fontSize="4" fill="#44403c">
              {p.n}
            </text>
          </g>
        ))}
      </svg>
      <Button variant="outline" onClick={() => setActive((a) => (a + 1) % points.length)}>
        Walk the path
      </Button>
    </div>
  );
}
