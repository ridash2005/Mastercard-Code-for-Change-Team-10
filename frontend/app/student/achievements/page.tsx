"use client";

import { AchievementCard } from "@/components/cards";
import { usePlatform } from "@/lib/data/platform-store";

export default function AchievementsPage() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const unlocked = new Set(store.studentAchievements.filter((a) => a.studentId === sid).map((a) => a.achievementId));
  return (
    <div>
      <h1 className="font-serif text-3xl">Achievements</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {store.achievements.map((a) => (
          <AchievementCard key={a.id} title={a.title} description={a.description} unlocked={unlocked.has(a.id)} />
        ))}
      </div>
    </div>
  );
}
