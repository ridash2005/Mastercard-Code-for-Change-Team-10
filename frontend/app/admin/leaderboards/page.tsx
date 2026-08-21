"use client";

import LeaderboardPage from "@/app/student/leaderboard/page";

export default function AdminLeaderboards() {
  return (
    <div>
      <p className="mb-4 text-sm text-stone-600">Same XP ledger students see — programme view.</p>
      <LeaderboardPage />
    </div>
  );
}
