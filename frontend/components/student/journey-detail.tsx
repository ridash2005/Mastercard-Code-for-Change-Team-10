"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Activity, ActivityType, Enrollment, EnrollmentStatus, Submission, XPTransaction } from "@/lib/types";
import { formatDate } from "@/lib/utils";
const TYPE_LABEL: Record<ActivityType, string> = {
  course: "Course",
  training: "Training",
  mentoring: "Mentorship",
  project: "Project",
  assignment: "Assignment",
  milestone: "Milestone",
};

function isDone(status: EnrollmentStatus) {
  return status === "completed" || status === "approved";
}

function cta(activity: Activity, status: EnrollmentStatus) {
  const href = `/student/activities/${activity.id}`;
  if (isDone(status)) return { href, label: "View course" };
  if (activity.type === "assignment") return { href, label: status === "not_started" ? "View assignment" : "Continue assignment" };
  if (activity.type === "milestone") return { href, label: "Complete milestone" };
  if (status === "not_started") return { href, label: "Start course" };
  return { href, label: "Continue course" };
}

function nextStep(activity: Activity, status: EnrollmentStatus) {
  if (isDone(status)) return "This activity is complete. Open it any time to review your work.";
  if (status === "submitted" || status === "under_review") return "Your submission is in review. Check back for feedback.";
  if (status === "needs_resubmission") return "Revise and resubmit using the notes on the activity page.";
  if (status === "in_progress") return `Continue ${activity.title} and work toward ${activity.xpReward} XP.`;
  return `Start ${activity.title} to begin this step.`;
}

export function JourneyDetailDialog({
  open,
  onClose,
  activity,
  enrollment,
  transactions,
  submission,
  certificateTitle,
}: {
  open: boolean;
  onClose: () => void;
  activity: Activity;
  enrollment: Enrollment;
  transactions: XPTransaction[];
  submission?: Submission;
  certificateTitle?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const action = cta(activity, enrollment.status);
  const earned = transactions.reduce((n, t) => n + t.amount, 0);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button type="button" className="absolute inset-0 bg-navy/40" aria-label="Close activity details" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="journey-detail-title"
        className="relative z-10 max-h-[min(32rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-5 shadow-[0_16px_40px_-20px_rgba(26,22,48,0.45)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-purple">{TYPE_LABEL[activity.type]}</p>
            <h3 id="journey-detail-title" className="font-serif text-2xl text-plum">
              {activity.title}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-muted hover:bg-ivory"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">{activity.description}</p>
        <p className="mt-3 text-sm text-plum">
          Status: <span className="font-semibold capitalize">{enrollment.status.replaceAll("_", " ")}</span>
          {" · "}
          {enrollment.progress}% complete
        </p>
        {enrollment.startedAt ? <p className="text-xs text-muted">Started {formatDate(enrollment.startedAt)}</p> : null}
        {enrollment.completedAt ? <p className="text-xs text-muted">Completed {formatDate(enrollment.completedAt)}</p> : null}

        <h4 className="mt-4 text-sm font-semibold text-plum">How you earned your XP</h4>
        {transactions.length ? (
          <ul className="mt-2 divide-y divide-line text-sm">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex justify-between gap-3 py-1.5">
                <span className="text-plum">{tx.reason}</span>
                <span className="shrink-0 font-semibold text-gold">+{tx.amount} XP</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 py-1.5 font-semibold">
              <span>Total earned</span>
              <span className="text-gold">{earned} XP</span>
            </li>
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">
            No XP has been recorded for this activity yet.
            {enrollment.status !== "completed" && enrollment.status !== "approved"
              ? ` ${activity.xpReward} XP is listed as the reward if it is approved.`
              : null}
          </p>
        )}

        <h4 className="mt-4 text-sm font-semibold text-plum">Activity history</h4>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted">
          {enrollment.startedAt ? <li>Started on {formatDate(enrollment.startedAt)}</li> : <li>Not started yet.</li>}
          {submission?.attempts.map((attempt) => (
            <li key={attempt.id}>
              Submission on {formatDate(attempt.submittedAt)}
              {attempt.fileName ? ` · ${attempt.fileName}` : ""}
            </li>
          ))}
          {submission?.feedback ? <li>Reviewer note: {submission.feedback}</li> : null}
          {enrollment.completedAt ? <li>Marked complete on {formatDate(enrollment.completedAt)}</li> : null}
          {!submission && enrollment.status === "in_progress" ? <li>In progress — no submission recorded yet.</li> : null}
        </ul>

        <h4 className="mt-4 text-sm font-semibold text-plum">Rewards</h4>
        <p className="mt-1 text-sm text-muted">
          {earned ? `${earned} XP on record` : "No XP on record yet"}
          {certificateTitle ? ` · Certificate: ${certificateTitle}` : ""}
        </p>

        <h4 className="mt-4 text-sm font-semibold text-plum">Next step</h4>
        <p className="mt-1 text-sm text-muted">{nextStep(activity, enrollment.status)}</p>
        <div className="mt-4">
          <Link
            href={action.href}
            className="inline-flex items-center justify-center rounded-full bg-barbie px-3.5 py-2 text-sm font-medium text-white hover:bg-moss"
          >
            {action.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
