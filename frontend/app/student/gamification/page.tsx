"use client";

import Link from "next/link";
import { Award, Flag, Trophy } from "lucide-react";
import { StreakCard, XPCard } from "@/components/cards";
import { usePlatform } from "@/lib/data/platform-store";
import { formatDate, levelFromXp } from "@/lib/utils";

export default function GamificationPage() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const profile = store.studentProfiles.find((p) => p.userId === sid);
  const lvl = levelFromXp(profile?.xp ?? 0);
  const txs = store.xpTransactions.filter((t) => t.studentId === sid);
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Gamification</h1>
      <XPCard xp={profile?.xp ?? 0} level={lvl.level} toNext={lvl.xpToNext} progress={lvl.progress} />
      <StreakCard days={profile?.streak ?? 0} />
      <section>
        <h2 className="font-serif text-xl">XP ledger</h2>
        <ul className="k-card mt-3">
          {txs.map((t) => (
            <li key={t.id} className="flex justify-between gap-3 border-b border-line px-4 py-3 text-sm last:border-0">
              <span>
                <span className="block font-medium text-plum">{t.reason}</span>
                <span className="text-xs text-muted">{formatDate(t.createdAt)}</span>
              </span>
              <span className="font-semibold text-gold">+{t.amount} XP</span>
            </li>
          ))}
        </ul>
      </section>
      <nav className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/student/achievements", title: "Achievements", label: "Badges you have earned", icon: Award },
          { href: "/student/missions", title: "Missions", label: "Time-boxed goals", icon: Flag },
          { href: "/student/leaderboard", title: "Leaderboards", label: "See where you rank", icon: Trophy },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="k-card flex items-center gap-3 p-4">
            <span className="k-chip flex h-10 w-10 items-center justify-center rounded-xl text-purple">
              <item.icon className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-plum">{item.title}</span>
              <span className="block text-xs text-muted">{item.label}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
