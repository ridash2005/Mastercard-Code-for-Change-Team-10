import Link from "next/link";
import type { ReactNode } from "react";
import { CompletionRing, ProgressBar } from "@/components/ui/progress";
import { StatusBadge } from "@/components/states";
import { formatDate } from "@/lib/utils";
import type { Activity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DashboardCard({
  label,
  value,
  hint,
  icon,
  iconClass,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  iconClass?: string;
  children?: ReactNode;
}) {
  return (
    <div className="k-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
        {icon ? (
          <span className={cn("text-lg leading-none", iconClass)} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-serif text-3xl text-plum">{value}</p>
      {hint ? <p className="mt-1 text-[15px] text-muted">{hint}</p> : null}
      {children}
    </div>
  );
}

export function XPCard({ xp, level, toNext, progress }: { xp: number; level: number; toNext: number; progress: number }) {
  return (
    <DashboardCard
      label="Experience"
      icon="⭐"
      iconClass="text-gold"
      value={
        <>
          {xp.toLocaleString()} <span className="text-lg text-gold">XP</span>
        </>
      }
      hint={`Level ${level} · ${toNext} XP to next`}
    >
      <ProgressBar value={progress} className="mt-4" />
    </DashboardCard>
  );
}

export function StreakCard({ days }: { days: number }) {
  return <DashboardCard label="Streak" value={`${days} days`} hint="Keep it up!" icon="🔥" iconClass="text-coral" />;
}

export function RankCard({ rank }: { rank: string | number }) {
  return <DashboardCard label="Rank" value={`#${rank}`} hint="Global XP" icon="👑" iconClass="text-purple" />;
}

export function CompletionCard({ value, hint }: { value: number; hint: string }) {
  return (
    <DashboardCard
      label="Completion"
      value={`${value}%`}
      hint={hint}
      icon={<CompletionRing value={value} size={40} showLabel={false} />}
    />
  );
}

export function AchievementCard({ title, description, unlocked }: { title: string; description: string; unlocked: boolean }) {
  return (
    <div className="k-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-plum">{title}</p>
        <span className={cn("k-chip flex h-8 w-8 items-center justify-center rounded-lg text-sm", unlocked ? "text-gold" : "text-purple")} aria-hidden>
          {unlocked ? "★" : "○"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <p className={cn("mt-2 text-xs font-semibold uppercase tracking-wide", unlocked ? "text-gold" : "text-purple")}>
        {unlocked ? "Unlocked" : "Locked"}
      </p>
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
    <div className="k-card p-5">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-purple">Mission</p>
      <p className="mt-1 font-medium text-plum">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <ProgressBar value={(current / target) * 100} className="mt-3" />
      <p className="mt-1 text-sm text-muted">
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
    <Link href={href} className="k-card block p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-barbie">{activity.type}</p>
          <h3 className="mt-1 font-serif text-xl text-plum">{activity.title}</h3>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{activity.description}</p>
      <p className="mt-3 text-sm text-muted">
        <span className="font-semibold text-gold">{activity.xpReward} XP</span>
        {" · due "}
        {formatDate(activity.dueDate)} · {activity.difficulty}
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
    <Link href={href} className="k-card flex items-center justify-between gap-3 p-4">
      <div>
        <p className="font-medium text-plum">{title}</p>
        <p className="text-sm text-muted">{student}</p>
      </div>
      <StatusBadge status={status} />
    </Link>
  );
}
