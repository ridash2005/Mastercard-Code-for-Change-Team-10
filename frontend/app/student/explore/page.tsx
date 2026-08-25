"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CourseGrid } from "@/components/student/explore-course-card";
import { EmptyState } from "@/components/states";
import {
  EXPLORE_CHIPS,
  activityMatchesQuery,
  matchesExploreChip,
  recommendedActivities,
  type ExploreChip,
} from "@/lib/data/explore";
import { normalizeInterestIds } from "@/lib/data/interests";
import { usePlatform } from "@/lib/data/platform-store";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export default function ExplorePage() {
  const store = usePlatform();
  const { t } = useI18n();
  const sid = store.sessionUserId ?? "";
  const profile = store.studentProfiles.find((p) => p.userId === sid);
  const interests = normalizeInterestIds(profile?.interests ?? []);
  const hasInterests = interests.length > 0;
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<ExploreChip>("all");

  const recommended = useMemo(
    () => recommendedActivities(store.activities, profile?.interests ?? [], 4).filter((a) => activityMatchesQuery(a, query)),
    [store.activities, profile?.interests, query],
  );
  const recommendedIds = useMemo(() => new Set(recommended.map((a) => a.id)), [recommended]);

  const catalogue = useMemo(() => {
    return store.activities.filter((activity) => {
      if (!activityMatchesQuery(activity, query)) return false;
      if (chip === "recommended") return recommendedIds.has(activity.id);
      return matchesExploreChip(activity, chip);
    });
  }, [store.activities, query, chip, recommendedIds]);

  const showRecommendedBand = hasInterests && recommended.length > 0 && chip === "all";
  const chips = EXPLORE_CHIPS.filter((c) => c.id !== "recommended" || hasInterests);
  const chipLabels: Record<ExploreChip, string> = {
    all: t.chipAll,
    recommended: t.chipRecommended,
    finance: t.chipFinance,
    technology: t.chipTechnology,
    business: t.chipBusiness,
    design: t.chipDesign,
    "ai-data": t.chipAiData,
  };
  const gridItems =
    chip === "all" && showRecommendedBand ? catalogue.filter((a) => !recommendedIds.has(a.id)) : catalogue;
  const heading =
    chip === "recommended"
      ? t.recommended
      : chip === "all"
        ? t.allCourses
        : (chipLabels[chip] ?? t.coursesFallback);

  return (
    <div>
      <h1 className="font-serif text-3xl text-plum">{t.exploreTitle}</h1>
      <p className="mt-1 text-sm text-muted">{t.exploreSubtitle}</p>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchCoursesPlaceholder}
          aria-label={t.searchCoursesLabel}
          className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-sm text-plum placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Course categories">
        {chips.map((item) => {
          const selected = chip === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setChip(item.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie",
                selected ? "bg-barbie text-white" : "border border-line bg-card text-plum hover:bg-ivory",
              )}
            >
              {chipLabels[item.id]}
            </button>
          );
        })}
      </div>

      {showRecommendedBand && chip === "all" ? (
        <section className="mt-8">
          <h2 className="font-serif text-2xl text-plum">{t.recommended}</h2>
          <p className="mt-1 text-sm text-muted">{t.basedOnInterests}</p>
          <div className="mt-4">
            <CourseGrid items={recommended} studentId={sid} recommendedIds={recommendedIds} />
          </div>
        </section>
      ) : null}

      {chip === "recommended" && gridItems.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t.noRecommendedCourses} hint={t.tryAllOrUpdateInterests} />
        </div>
      ) : chip !== "all" || gridItems.length > 0 || !showRecommendedBand ? (
        <section className="mt-8">
          <h2 className="font-serif text-2xl text-plum">{heading}</h2>
          {chip === "recommended" && hasInterests ? (
            <p className="mt-1 text-sm text-muted">{t.basedOnInterests}</p>
          ) : null}
          {gridItems.length === 0 ? (
            <div className="mt-4">
              <EmptyState title={t.noCoursesMatch} hint={t.tryAnotherSearch} />
            </div>
          ) : (
            <div className="mt-4">
              <CourseGrid
                items={gridItems}
                studentId={sid}
                recommendedIds={chip === "recommended" ? recommendedIds : undefined}
              />
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
