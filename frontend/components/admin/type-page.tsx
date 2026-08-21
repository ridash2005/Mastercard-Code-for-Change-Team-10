"use client";

import { useMemo } from "react";
import { ActivityCard, DashboardCard } from "@/components/cards";
import { usePlatform } from "@/lib/data/platform-store";
import type { ActivityType } from "@/lib/types";

export function AdminTypePage({ type, title }: { type: ActivityType; title: string }) {
  const store = usePlatform();
  const list = useMemo(() => store.activities.filter((a) => a.type === type), [store.activities, type]);
  return (
    <div>
      <h1 className="font-serif text-3xl">{title}</h1>
      <div className="mt-4">
        <DashboardCard label="Count" value={list.length} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <ActivityCard key={a.id} activity={a} href="/admin/activities" />
        ))}
      </div>
    </div>
  );
}
