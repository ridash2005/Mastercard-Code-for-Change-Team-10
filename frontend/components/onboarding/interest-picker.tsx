"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  Briefcase,
  ClipboardList,
  Compass,
  CreditCard,
  FlaskConical,
  HeartHandshake,
  Landmark,
  Layers,
  Megaphone,
  Palette,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { INTEREST_OPTIONS, type InterestId, interestLabel } from "@/lib/data/interests";
import { cn } from "@/lib/utils";

const ICONS: Record<InterestId, LucideIcon> = {
  finance: CreditCard,
  business: Briefcase,
  technology: Sparkles,
  data: BarChart3,
  "ai-ml": Brain,
  cybersecurity: Shield,
  product: Layers,
  marketing: Megaphone,
  design: Palette,
  consulting: Compass,
  leadership: Users,
  "social-impact": HeartHandshake,
  economics: Landmark,
  research: FlaskConical,
  operations: ClipboardList,
};

export function InterestPicker({
  selected,
  onChange,
  labelledBy,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  labelledBy?: string;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  const extras = selected.filter((id) => !INTEREST_OPTIONS.some((o) => o.id === id));

  return (
    <div role="group" aria-labelledby={labelledBy} className="grid gap-2 sm:grid-cols-2">
      {INTEREST_OPTIONS.map((opt) => {
        const on = selected.includes(opt.id);
        const Icon = ICONS[opt.id];
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(opt.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm motion-safe:transition",
              on
                ? "border-barbie bg-ivory text-plum"
                : "border-line bg-card text-plum hover:border-plum/25",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                on ? "bg-barbie text-white" : "bg-ivory text-purple",
              )}
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-medium leading-snug">{opt.label}</span>
              <span className="sr-only">{on ? "selected" : "not selected"}</span>
            </span>
          </button>
        );
      })}
      {extras.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed
          onClick={() => toggle(id)}
          className="flex items-start gap-3 rounded-xl border border-barbie bg-ivory px-3 py-3 text-left text-sm text-plum"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum text-[11px] font-semibold text-white" aria-hidden>
            +
          </span>
          <span className="font-medium leading-snug">{interestLabel(id)}</span>
        </button>
      ))}
    </div>
  );
}
