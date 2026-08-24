"use client";

import type { ActivityType, Difficulty, EnrollmentStatus, Participation, Requirement } from "@/lib/types";
import { Input, Label, Select } from "@/components/ui/input";

export type FilterValues = {
  search: string;
  type: ActivityType | "all";
  domain: string;
  problemDomain: string;
  difficulty: Difficulty | "all";
  xpMin: number;
  requirement: Requirement | "all";
  certificate: "all" | "yes" | "no";
  participation: Participation | "all";
  due: "all" | "week" | "month" | "overdue";
  status: EnrollmentStatus | "all";
  sort: "due" | "xp" | "title";
};

export const defaultFilters: FilterValues = {
  search: "",
  type: "all",
  domain: "all",
  problemDomain: "all",
  difficulty: "all",
  xpMin: 0,
  requirement: "all",
  certificate: "all",
  participation: "all",
  due: "all",
  status: "all",
  sort: "due",
};

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input
      aria-label="Search activities"
      placeholder="Search title or description"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FilterPanel({
  value,
  onChange,
  domains,
  problems,
}: {
  value: FilterValues;
  onChange: (v: FilterValues) => void;
  domains: string[];
  problems: string[];
}) {
  const set = <K extends keyof FilterValues>(k: K, v: FilterValues[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="k-card grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
      <div className="md:col-span-2 lg:col-span-4">
        <SearchBar value={value.search} onChange={(s) => set("search", s)} />
      </div>
      <Field label="Type">
        <Select value={value.type} onChange={(e) => set("type", e.target.value as FilterValues["type"])}>
          <option value="all">All</option>
          {["course", "training", "mentoring", "project", "assignment", "milestone"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Domain">
        <Select value={value.domain} onChange={(e) => set("domain", e.target.value)}>
          <option value="all">All</option>
          {domains.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
      </Field>
      <Field label="Problem domain">
        <Select value={value.problemDomain} onChange={(e) => set("problemDomain", e.target.value)}>
          <option value="all">All</option>
          {problems.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
      </Field>
      <Field label="Difficulty">
        <Select value={value.difficulty} onChange={(e) => set("difficulty", e.target.value as FilterValues["difficulty"])}>
          <option value="all">All</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
      </Field>
      <Field label="Min XP">
        <Input type="number" min={0} value={value.xpMin} onChange={(e) => set("xpMin", Number(e.target.value))} />
      </Field>
      <Field label="Mandatory">
        <Select value={value.requirement} onChange={(e) => set("requirement", e.target.value as FilterValues["requirement"])}>
          <option value="all">All</option>
          <option value="mandatory">Mandatory</option>
          <option value="optional">Optional</option>
        </Select>
      </Field>
      <Field label="Certificate">
        <Select value={value.certificate} onChange={(e) => set("certificate", e.target.value as FilterValues["certificate"])}>
          <option value="all">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </Select>
      </Field>
      <Field label="Participation">
        <Select
          value={value.participation}
          onChange={(e) => set("participation", e.target.value as FilterValues["participation"])}
        >
          <option value="all">All</option>
          <option value="individual">Individual</option>
          <option value="team">Team</option>
        </Select>
      </Field>
      <Field label="Due">
        <Select value={value.due} onChange={(e) => set("due", e.target.value as FilterValues["due"])}>
          <option value="all">All</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="overdue">Overdue</option>
        </Select>
      </Field>
      <Field label="Status">
        <Select value={value.status} onChange={(e) => set("status", e.target.value as FilterValues["status"])}>
          <option value="all">All</option>
          {[
            "not_started",
            "in_progress",
            "submitted",
            "under_review",
            "approved",
            "needs_resubmission",
            "completed",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Sort">
        <Select value={value.sort} onChange={(e) => set("sort", e.target.value as FilterValues["sort"])}>
          <option value="due">Due date</option>
          <option value="xp">XP</option>
          <option value="title">Title</option>
        </Select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
