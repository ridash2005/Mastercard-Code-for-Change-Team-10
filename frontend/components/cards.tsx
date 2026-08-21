import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress";
import { StatusBadge } from "@/components/states";
import { formatDate } from "@/lib/utils";
import type { Activity } from "@/lib/types";

export function DashboardCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

export function XPCard({ xp, level, toNext, progress }: { xp: number; level: number; toNext: number; progress: number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">Experience</p>
      <p className="mt-1 font-serif text-2xl">{xp.toLocaleString()} XP</p>
      <p className="mt-1 text-sm text-stone-600">
        Level {level} · {toNext} XP to next
      </p>
      <ProgressBar value={progress} className="mt-3" />
    </div>
  );
}

export function AchievementCard({ title, description, unlocked }: { title: string; description: string; unlocked: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${unlocked ? "border-gold/40 bg-white" : "border-stone-200 bg-stone-50 opacity-70"}`}>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-stone-500">{unlocked ? "Unlocked" : "Locked"}</p>
    </div>
  );
}

export function MissionCard({
  title,
  description,
  current,
  target,
}: {
  title: string;
  description: string;
  current: number;
  target: number;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
      <ProgressBar value={(current / target) * 100} className="mt-3" />
      <p className="mt-1 text-xs text-stone-500">
        {current} / {target}
      </p>
    </div>
  );
}

export function ActivityCard({
  activity,
  href,
  status,
}: {
  activity: Activity;
  href: string;
  status?: string;
}) {
  return (
    <Link href={href} className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-forest">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">{activity.type}</p>
          <h3 className="mt-1 font-medium">{activity.title}</h3>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-stone-600">{activity.description}</p>
      <p className="mt-3 text-xs text-stone-500">
        {activity.xpReward} XP · due {formatDate(activity.dueDate)} · {activity.difficulty}
      </p>
    </Link>
  );
}

export function SubmissionCard({
  title,
  student,
  status,
  href,
}: {
  title: string;
  student: string;
  status: string;
  href: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-stone-600">{student}</p>
      </div>
      <StatusBadge status={status} />
    </Link>
  );
}
