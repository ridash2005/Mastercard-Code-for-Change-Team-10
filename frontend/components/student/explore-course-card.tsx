"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Activity, EnrollmentStatus } from "@/lib/types";
import { formatDurationHours } from "@/lib/data/explore";
import { usePlatform } from "@/lib/data/platform-store";
import { Button } from "@/components/ui/button";

const TYPE_LABEL: Record<Activity["type"], string> = {
  course: "Course",
  training: "Training",
  mentoring: "Mentorship",
  project: "Project",
  assignment: "Assignment",
  milestone: "Milestone",
};

function isDone(status?: EnrollmentStatus) {
  return status === "completed" || status === "approved";
}

function isActive(status?: EnrollmentStatus) {
  return status === "in_progress" || status === "submitted" || status === "under_review" || status === "needs_resubmission";
}

export function ExploreCourseCard({
  activity,
  status,
  studentId,
  recommended,
}: {
  activity: Activity;
  status?: EnrollmentStatus;
  studentId: string;
  recommended?: boolean;
}) {
  const store = usePlatform();
  const router = useRouter();
  const href = `/student/activities/${activity.id}`;
  const difficulty = activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1);

  const start = () => {
    if (!studentId) return;
    if (!status) store.enroll(activity.id, studentId);
    store.startActivity(activity.id, studentId);
    router.push(href);
  };

  return (
    <article className="k-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-purple">{TYPE_LABEL[activity.type]}</p>
        {recommended ? (
          <span className="rounded-full bg-ivory px-2 py-0.5 text-[11px] font-semibold text-barbie">Recommended</span>
        ) : null}
      </div>
      <h3 className="mt-1 font-serif text-xl text-plum">
        <Link
          href={href}
          className="rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie"
        >
          {activity.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{activity.description}</p>
      <p className="mt-3 text-sm text-plum">
        {difficulty}
        <span className="text-muted"> · </span>
        <span className="font-semibold text-gold">{activity.xpReward} XP</span>
        <span className="text-muted"> · {formatDurationHours(activity.durationHours)}</span>
      </p>
      <div className="mt-4">
        {isDone(status) ? (
          <Link
            href={href}
            className="inline-flex items-center rounded-full border border-line bg-ivory px-3.5 py-2 text-sm font-medium text-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie"
            aria-label={`${activity.title}, completed. Open activity.`}
          >
            Completed ✓
          </Link>
        ) : isActive(status) ? (
          <Button type="button" onClick={() => router.push(href)} aria-label={`Continue ${activity.title}`}>
            Continue
          </Button>
        ) : (
          <Button type="button" onClick={start} aria-label={`Start ${activity.title}`}>
            Start Course
          </Button>
        )}
        {status && !isDone(status) ? (
          <p className="mt-2 text-xs font-medium capitalize text-purple">{status.replaceAll("_", " ")}</p>
        ) : null}
      </div>
    </article>
  );
}

export function CourseGrid({
  items,
  studentId,
  recommendedIds,
}: {
  items: Activity[];
  studentId: string;
  recommendedIds?: Set<string>;
}) {
  const store = usePlatform();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((activity) => (
        <ExploreCourseCard
          key={activity.id}
          activity={activity}
          studentId={studentId}
          recommended={recommendedIds?.has(activity.id)}
          status={store.enrollments.find((e) => e.activityId === activity.id && e.studentId === studentId)?.status}
        />
      ))}
    </div>
  );
}
