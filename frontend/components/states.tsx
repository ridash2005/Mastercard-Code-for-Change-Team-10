import { cn } from "@/lib/utils";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-sm text-stone-600">{hint}</p> : null}
    </div>
  );
}

export function LoadingState({ title = "Loading…" }: { title?: string }) {
  return (
    <div className="animate-pulse rounded-xl border border-stone-200 bg-white px-6 py-10 text-center text-sm text-stone-500">
      {title}
    </div>
  );
}

export function ErrorState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-red-800/80">{hint}</p> : null}
    </div>
  );
}

export function SuccessState({ title }: { title: string }) {
  return (
    <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {title}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    not_started: "bg-stone-100 text-stone-700",
    in_progress: "bg-amber-100 text-amber-900",
    submitted: "bg-sky-100 text-sky-900",
    under_review: "bg-indigo-100 text-indigo-900",
    approved: "bg-emerald-100 text-emerald-900",
    needs_resubmission: "bg-orange-100 text-orange-900",
    completed: "bg-teal-100 text-teal-900",
    resolved: "bg-emerald-100 text-emerald-900",
    high: "bg-red-100 text-red-900",
    medium: "bg-amber-100 text-amber-900",
    low: "bg-stone-100 text-stone-700",
  };
  const label = status.replaceAll("_", " ");
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs capitalize", map[status] ?? "bg-stone-100")}>
      {label}
    </span>
  );
}
