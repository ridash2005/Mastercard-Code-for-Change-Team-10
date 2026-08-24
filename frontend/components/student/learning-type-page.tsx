"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityCard } from "@/components/cards";
import { EmptyState } from "@/components/states";
import { SearchBar } from "@/components/activities/filters";
import { usePlatform } from "@/lib/data/platform-store";
import type { ActivityType } from "@/lib/types";

export function LearningTypePage({ type, title, blurb }: { type: ActivityType; title: string; blurb: string }) {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    return store.activities.filter((a) => a.type === type && a.title.toLowerCase().includes(q.toLowerCase()));
  }, [store.activities, type, q]);
  return (
    <div>
      <h1 className="font-serif text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-muted">{blurb}</p>
      <div className="mt-4 max-w-md">
        <SearchBar value={q} onChange={setQ} />
      </div>
      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing matches." hint="Clear search or open Explore." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {list.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              href={`/student/activities/${a.id}`}
              status={store.enrollments.find((e) => e.activityId === a.id && e.studentId === sid)?.status}
            />
          ))}
        </div>
      )}
      <p className="mt-6 text-sm">
        <Link className="font-semibold text-barbie" href="/student/explore">
          Browse all in Explore
        </Link>
      </p>
    </div>
  );
}
