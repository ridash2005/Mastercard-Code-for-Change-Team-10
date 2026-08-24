"use client";

import { useState } from "react";
import { inferredStreakDays, isoDay } from "@/lib/streak";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakCalendar({
  streak,
  lastActiveAt,
  compact,
}: {
  streak: number;
  lastActiveAt?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const fires = inferredStreakDays(streak, lastActiveAt);
  const today = isoDay(now);
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Cheap to recompute every render (a month has at most ~42 cells) — no
  // need for useMemo here, and the React Compiler auto-memoizes this
  // component's render output anyway.
  const cells: { key: string; day?: number; iso?: string }[] = [];
  for (let i = 0; i < startPad; i += 1) cells.push({ key: `p-${i}` });
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = isoDay(new Date(year, month, d));
    cells.push({ key: iso, day: d, iso });
  }

  const grid = (
    <div>
      <p className={cn("text-center font-semibold uppercase tracking-[0.12em] text-purple", compact ? "text-[10px]" : "text-[11px]")}>
        {monthLabel}
      </p>
      <div className="mt-1 grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold text-muted">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          if (!cell.iso || cell.day == null) return <span key={cell.key} />;
          const isToday = cell.iso === today;
          const future = cell.iso > today;
          const fired = fires.has(cell.iso);
          return (
            <span
              key={cell.key}
              className={cn(
                "flex h-6 items-center justify-center rounded text-[10px]",
                isToday && "ring-1 ring-barbie",
                future && "text-muted/50",
                !future && !fired && "text-plum",
              )}
              aria-label={
                fired
                  ? `${cell.iso}, streak day${isToday ? ", today" : ""}`
                  : isToday
                    ? `${cell.iso}, today`
                    : future
                      ? `${cell.iso}, upcoming`
                      : cell.iso
              }
            >
              {fired ? <span aria-hidden>🔥</span> : cell.day}
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] leading-snug text-muted">
        {streak > 0 ? `${streak}-day streak from last activity` : "No active streak yet"}
      </p>
    </div>
  );

  if (compact) {
    return (
      <div className="relative px-1 py-2">
        <button
          type="button"
          className="flex w-full flex-col items-center rounded-xl py-2 text-gold hover:bg-ivory"
          aria-expanded={open}
          aria-label={`${streak}-day streak. ${open ? "Hide" : "Show"} calendar.`}
          title={`${streak}-day streak`}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden>🔥</span>
          <span className="text-[10px] font-semibold text-plum">{streak}</span>
        </button>
        {open ? (
          <div className="absolute bottom-full left-full z-20 mb-1 ml-2 w-52 rounded-xl border border-line bg-card p-2 shadow-md">{grid}</div>
        ) : null}
      </div>
    );
  }

  return <div className="mx-2 my-2 rounded-xl border border-line bg-ivory/60 p-2">{grid}</div>;
}
