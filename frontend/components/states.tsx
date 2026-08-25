"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="k-card border-dashed px-6 py-10 text-center">
      <p className="font-medium text-plum">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function LoadingState({ title }: { title?: string }) {
  const { t } = useI18n();
  return (
    <div className="k-card animate-pulse px-6 py-10 text-center text-sm text-muted">{title ?? t.loadingDefault}</div>
  );
}

export function ErrorState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-red-800/80">{hint}</p> : null}
    </div>
  );
}

export function SuccessState({ title }: { title: string }) {
  return (
    <div role="status" className="k-card px-4 py-3 text-sm text-blue">
      {title}
    </div>
  );
}

const STATUS_KEYS = {
  not_started: "status_not_started",
  in_progress: "status_in_progress",
  submitted: "status_submitted",
  under_review: "status_under_review",
  approved: "status_approved",
  needs_resubmission: "status_needs_resubmission",
  completed: "status_completed",
  resolved: "status_resolved",
  pending: "status_pending",
  accepted: "status_accepted",
  rejected: "status_rejected",
  cancelled: "status_cancelled",
  active: "status_active",
  inactive: "status_inactive",
  open: "status_open",
  closed: "status_closed",
  low: "status_low",
  medium: "status_medium",
  high: "status_high",
  draft: "status_draft",
} as const;

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, string> = {
    not_started: "text-purple",
    in_progress: "text-barbie",
    submitted: "text-blue",
    under_review: "text-purple",
    approved: "text-blue",
    needs_resubmission: "text-barbie",
    completed: "text-blue",
    resolved: "text-blue",
    high: "text-barbie",
    medium: "text-purple",
    low: "text-muted",
  };
  const translationKey = STATUS_KEYS[status as keyof typeof STATUS_KEYS];
  const label = translationKey ? t[translationKey] : status.replaceAll("_", " ");
  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-line bg-ivory px-2.5 py-0.5 text-xs font-medium capitalize",
        map[status] ?? "text-plum",
      )}
    >
      {label}
    </span>
  );
}
