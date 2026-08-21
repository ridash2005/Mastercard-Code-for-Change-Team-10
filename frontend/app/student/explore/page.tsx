"use client";

import { useMemo, useState } from "react";
import { ActivityCard } from "@/components/cards";
import { EmptyState } from "@/components/states";
import { FilterPanel, defaultFilters, type FilterValues } from "@/components/activities/filters";
import { filterActivities, usePlatform } from "@/lib/data/platform-store";

export default function ExplorePage() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const domains = [...new Set(store.activities.map((a) => a.domain))];
  const problems = [...new Set(store.activities.map((a) => a.problemDomain))];
  const list = useMemo(() => {
    const filtered = filterActivities(store.activities, {
      ...filters,
      enrollments: store.enrollments,
      studentId: sid,
    });
    return [...filtered].sort((a, b) => {
      if (filters.sort === "xp") return b.xpReward - a.xpReward;
      if (filters.sort === "title") return a.title.localeCompare(b.title);
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [store.activities, store.enrollments, filters, sid]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Explore</h1>
      <p className="mt-1 text-sm text-stone-600">Filters change the catalogue. Nothing here is decorative.</p>
      <div className="mt-6">
        <FilterPanel value={filters} onChange={setFilters} domains={domains} problems={problems} />
      </div>
      <p className="mt-4 text-sm text-stone-500">{list.length} activities</p>
      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No activities match." hint="Widen filters." />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
