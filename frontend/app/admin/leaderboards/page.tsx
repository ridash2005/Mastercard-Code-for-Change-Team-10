"use client";

import LeaderboardPage from "@/app/student/leaderboard/page";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminLeaderboards() {
  const { t } = useI18n();
  return (
    <div>
      <p className="mb-4 text-sm text-stone-600">{t.adminLeaderboardNote}</p>
      <LeaderboardPage />
    </div>
  );
}
