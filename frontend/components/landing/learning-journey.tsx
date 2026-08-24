"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DESKTOP_JOURNEY_PATH,
  JOURNEY_MILESTONES,
  JOURNEY_STATS,
  MOBILE_JOURNEY_PATH,
  type JourneyMilestone,
  type JourneyState,
} from "@/lib/data/learning-journey";
import { cn } from "@/lib/utils";

const DESKTOP_VB = { w: 520, h: 420 };
const MOBILE_VB = { w: 360, h: 640 };

function labelClass(anchor: JourneyMilestone["desktopAnchor"] | JourneyMilestone["mobileAnchor"]) {
  switch (anchor) {
    case "left":
      return "right-full mr-3 top-1/2 -translate-y-1/2 text-right";
    case "right":
      return "left-full ml-3 top-1/2 -translate-y-1/2 text-left";
    case "top":
      return "bottom-full mb-2.5 left-1/2 -translate-x-1/2 text-center";
    case "bottom":
      return "top-full mt-2.5 left-1/2 -translate-x-1/2 text-center";
    default:
      return "left-full ml-3 top-1/2 -translate-y-1/2";
  }
}

function StateMark({ state }: { state: JourneyState }) {
  if (state === "completed") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path d="M3.5 8.2 6.4 11l6.1-7" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "locked") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <rect x="4" y="7.5" width="8" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 7.5V5.8a2 2 0 0 1 4 0v1.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />;
}

function JourneyCanvas({
  variant,
  currentIndex,
  onSelect,
}: {
  variant: "desktop" | "mobile";
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  const uid = useId();
  const vb = variant === "desktop" ? DESKTOP_VB : MOBILE_VB;
  const d = variant === "desktop" ? DESKTOP_JOURNEY_PATH : MOBILE_JOURNEY_PATH;
  const progress = currentIndex / (JOURNEY_MILESTONES.length - 1);

  return (
    <div className="relative overflow-visible">
      <svg
        viewBox={`0 0 ${vb.w} ${vb.h}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby={`${uid}-title ${uid}-desc`}
      >
        <title id={`${uid}-title`}>Katalyst learning journey</title>
        <desc id={`${uid}-desc`}>
          An S-shaped path with seven milestones from Discover Interests to Career Ready. Completed steps show a check,
          the current step is highlighted, and later steps are locked.
        </desc>
        <defs>
          <linearGradient id={`${uid}-ink`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--blue)" />
            <stop offset="55%" stopColor="var(--pink)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="var(--line)" strokeWidth="6" strokeLinecap="round" />
        <path
          d={d}
          fill="none"
          stroke={`url(#${uid}-ink)`}
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - progress}
          className="journey-progress"
        />
      </svg>
      {JOURNEY_MILESTONES.map((m, i) => {
        const pt = variant === "desktop" ? m.desktop : m.mobile;
        const state: JourneyState = i < currentIndex ? "completed" : i === currentIndex ? "current" : "locked";
        const anchor = variant === "desktop" ? m.desktopAnchor : m.mobileAnchor;
        return (
          <div
            key={m.id}
            className="absolute"
            style={{ left: `${(pt.x / vb.w) * 100}%`, top: `${(pt.y / vb.h) * 100}%` }}
          >
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={state === "current" ? "step" : undefined}
              aria-label={`${m.name}, ${state === "completed" ? "completed" : state === "current" ? "current" : "locked"}`}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition motion-safe:hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbie",
                state === "completed" && "h-8 w-8 border-blue bg-blue text-white",
                state === "current" &&
                  "journey-pulse z-[1] h-10 w-10 border-barbie bg-barbie text-white shadow-[0_0_0_6px_rgba(236,25,117,0.18)]",
                state === "locked" && "h-8 w-8 border-line bg-card text-purple",
              )}
            >
              <span className="flex items-center justify-center">
                <StateMark state={state} />
              </span>
            </button>
            <p
              className={cn(
                "pointer-events-none absolute w-[7.25rem] text-[12px] font-semibold leading-snug text-plum sm:w-36 sm:text-[13px]",
                labelClass(anchor),
              )}
            >
              {m.name}
              {i === 0 ? (
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-blue">Start</span>
              ) : null}
              {i === JOURNEY_MILESTONES.length - 1 ? (
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-gold">Finish</span>
              ) : null}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function LearningJourney() {
  const [currentIndex, setCurrentIndex] = useState(2);
  const current = JOURNEY_MILESTONES[currentIndex];

  return (
    <div className="k-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-purple">Learning path</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ivory px-2.5 py-1 text-[12px] font-semibold text-gold">{JOURNEY_STATS.xp}</span>
          <span className="rounded-full bg-plum px-2.5 py-1 text-[12px] font-semibold text-white">{JOURNEY_STATS.levelLabel}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Next: <span className="font-semibold text-barbie">{current.name}</span>
      </p>
      <div className="mt-2 hidden md:block">
        <JourneyCanvas variant="desktop" currentIndex={currentIndex} onSelect={setCurrentIndex} />
      </div>
      <div className="mt-2 md:hidden">
        <JourneyCanvas variant="mobile" currentIndex={currentIndex} onSelect={setCurrentIndex} />
      </div>
      <Button variant="outline" className="mt-3" onClick={() => setCurrentIndex((i) => (i + 1) % JOURNEY_MILESTONES.length)}>
        Walk the path
      </Button>
    </div>
  );
}
