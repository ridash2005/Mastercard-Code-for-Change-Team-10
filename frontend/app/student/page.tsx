"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityCard, DashboardCard, MissionCard, XPCard } from "@/components/cards";
import { usePlatform } from "@/lib/data/platform-store";
import { coachReply } from "@/lib/ai/coach";
import { levelFromXp } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { globalRanks } from "@/lib/services/repository";

export default function StudentHome() {
  const store = usePlatform();
  const { t } = useI18n();
  const sid = store.sessionUserId ?? "";
  const user = store.users.find((u) => u.id === sid);
  const profile = store.studentProfiles.find((p) => p.userId === sid);
  const lvl = levelFromXp(profile?.xp ?? 0);
  const ranks = globalRanks(store.studentProfiles);
  const rank = ranks.find((r) => r.userId === sid)?.rank ?? "—";
  const mine = store.enrollments.filter((e) => e.studentId === sid);
  const completed = mine.filter((e) => e.status === "completed" || e.status === "approved").length;
  const pending = mine.filter((e) => !["completed", "approved"].includes(e.status)).length;
  const completion = mine.length ? Math.round((completed / mine.length) * 100) : 0;
  const continueItems = mine.filter((e) => e.status === "in_progress" || e.status === "needs_resubmission");
  const deadlines = store.activities
    .filter((a) => mine.some((e) => e.activityId === a.id && !["completed", "approved"].includes(e.status)))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  const rec = store.activities.filter((a) => !mine.some((e) => e.activityId === a.id)).slice(0, 3);
  const team = store.teams.find((tm) => tm.id === profile?.teamId);
  const unlocked = store.studentAchievements.filter((a) => a.studentId === sid);
  const [nudge, setNudge] = useState<string | null>(null);

  const board = useMemo(
    () =>
      ranks.slice(0, 5).map((r) => ({
        name: store.users.find((u) => u.id === r.userId)?.name ?? r.userId,
        xp: r.xp,
        rank: r.rank,
      })),
    [ranks, store.users],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">
          Hello, {user?.name?.split(" ")[0] ?? "fellow"}
        </h1>
        <p className="mt-1 text-stone-600">
          You are {completion}% through enrolled work. Next: finish {deadlines[0]?.title ?? "an open activity"} to stay on
          the path.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <XPCard xp={profile?.xp ?? 0} level={lvl.level} toNext={lvl.xpToNext} progress={lvl.progress} />
        <DashboardCard label={t.streak} value={`${profile?.streak ?? 0} days`} />
        <DashboardCard label={t.rank} value={`#${rank}`} hint="Global XP" />
        <DashboardCard label="Completion" value={`${completion}%`} hint={`${completed} done · ${pending} open`} />
      </div>
      <section>
        <h2 className="font-serif text-2xl">{t.continueLearning}</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {continueItems.map((e) => {
            const a = store.activities.find((x) => x.id === e.activityId);
            return a ? <ActivityCard key={e.id} activity={a} href={`/student/activities/${a.id}`} status={e.status} /> : null;
          })}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-2xl">{t.upcomingDeadlines}</h2>
        <ul className="mt-3 divide-y rounded-xl border border-stone-200 bg-white">
          {deadlines.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <Link href={`/student/activities/${a.id}`} className="underline">
                {a.title}
              </Link>
              <span className="text-stone-500">{a.dueDate}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-serif text-2xl">{t.recommended}</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {rec.map((a) => (
            <ActivityCard key={a.id} activity={a} href={`/student/activities/${a.id}`} />
          ))}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <h2 className="font-serif text-2xl">{t.achievements}</h2>
          <ul className="mt-3 text-sm">
            {unlocked.map((u) => (
              <li key={u.achievementId}>{store.achievements.find((a) => a.id === u.achievementId)?.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-2xl">{t.currentMission}</h2>
          <div className="mt-3">
            <MissionCard
              title={store.missions[0].title}
              description={store.missions[0].description}
              current={completed % 3}
              target={store.missions[0].target}
            />
          </div>
        </div>
        <div>
          <h2 className="font-serif text-2xl">{t.teamProgress}</h2>
          <p className="mt-3 text-sm">
            {team?.name} · rank {team?.rank} · {team?.projectTitle}
          </p>
          <Link href="/student/teams" className="text-sm underline">
            Open teams
          </Link>
        </div>
      </div>
      <section>
        <h2 className="font-serif text-2xl">{t.leaderboard}</h2>
        <ol className="mt-3 rounded-xl border border-stone-200 bg-white">
          {board.map((b) => (
            <li key={b.rank} className="flex justify-between px-4 py-2 text-sm">
              <span>
                #{b.rank} {b.name}
              </span>
              <span>{b.xp} XP</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-serif text-2xl">AI Coach</h2>
        <p className="mt-1 text-sm text-stone-600">Personalised — not the general chatbot.</p>
        <button
          className="mt-3 text-sm underline"
          onClick={async () => {
            if (!profile || !user) return;
            setNudge(
              await coachReply("What should I do next?", {
                name: user.name,
                xp: profile.xp,
                streak: profile.streak,
                rank: typeof rank === "number" ? rank : 0,
                completion,
                pendingTitles: deadlines.map((d) => d.title),
                overdueTitles: [],
                completedCount: completed,
                interests: profile.interests,
                atRisk: profile.atRisk,
              }),
            );
          }}
        >
          Ask for this week’s move
        </button>
        {nudge ? <p className="mt-3 text-sm">{nudge}</p> : null}
        <p className="mt-3 text-sm">
          <Link className="underline" href="/student/ai-coach">
            Open AI Coach
          </Link>
        </p>
      </section>
    </div>
  );
}
