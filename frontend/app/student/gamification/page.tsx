"use client";

import Link from "next/link";
import { XPCard } from "@/components/cards";
import { ProgressBar } from "@/components/ui/progress";
import { usePlatform } from "@/lib/data/platform-store";
import { levelFromXp } from "@/lib/utils";

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
      <p className="text-sm">Streak {profile?.streak} days</p>
      <ProgressBar value={Math.min(100, (profile?.streak ?? 0) * 10)} />
      <h2 className="font-serif text-xl">XP ledger</h2>
      <ul className="divide-y rounded-xl border bg-white text-sm">
        {txs.map((t) => (
          <li key={t.id} className="flex justify-between px-4 py-2">
            <span>{t.reason}</span>
            <span>+{t.amount}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-4 text-sm">
        <Link className="underline" href="/student/achievements">
          Achievements
        </Link>
        <Link className="underline" href="/student/missions">
          Missions
        </Link>
        <Link className="underline" href="/student/leaderboard">
          Leaderboards
        </Link>
      </div>
    </div>
  );
}
