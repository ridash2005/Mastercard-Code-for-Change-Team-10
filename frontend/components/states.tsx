import { cn } from "@/lib/utils";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="k-card border-dashed px-6 py-10 text-center">
      <p className="font-medium text-plum">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function LoadingState({ title = "Loading…" }: { title?: string }) {
  return (
    <div className="k-card animate-pulse px-6 py-10 text-center text-sm text-muted">{title}</div>
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

export function StatusBadge({ status }: { status: string }) {
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
  const label = status.replaceAll("_", " ");
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
