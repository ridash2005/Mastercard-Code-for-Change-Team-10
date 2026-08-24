import { cn } from "@/lib/utils";

export function ProgressBar({ value, className, size = "md" }: { value: number; className?: string; size?: "md" | "lg" }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-track", size === "lg" ? "h-3.5" : "h-2.5", className)}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="xp-fill h-full rounded-full transition-all" style={{ width: `${v}%` }} />
    </div>
  );
}

export function CompletionRing({
  value,
  size = 72,
  showLabel = true,
}: {
  value: number;
  size?: number;
  showLabel?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" className="shrink-0" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--track)" strokeWidth="8" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (v / 100) * c}
        transform="rotate(-90 36 36)"
      />
      {showLabel ? (
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--navy)">
          {v}%
        </text>
      ) : null}
    </svg>
  );
}
