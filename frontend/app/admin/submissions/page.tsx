"use client";

import { useMemo, useState } from "react";
import { SubmissionCard } from "@/components/cards";
import { SearchBar } from "@/components/activities/filters";
import { Select } from "@/components/ui/input";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function SubmissionsPage() {
  const store = usePlatform();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const list = useMemo(() => {
    return store.submissions.filter((s) => {
      const student = store.users.find((u) => u.id === s.studentId)?.name ?? "";
      const title = store.activities.find((a) => a.id === s.activityId)?.title ?? "";
      if (q && !`${student} ${title}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (status !== "all" && s.status !== status) return false;
      return true;
    });
  }, [store.submissions, store.users, store.activities, q, status]);

  return (
    <div>
      <h1 className="font-serif text-3xl">{t.submissions}</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="w-full max-w-sm">
          <SearchBar value={q} onChange={setQ} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{t.allStatusesLabel}</option>
          <option value="submitted">{t.status_submitted}</option>
          <option value="under_review">{t.status_under_review}</option>
          <option value="approved">{t.status_approved}</option>
          <option value="needs_resubmission">{t.status_needs_resubmission}</option>
        </Select>
      </div>
      <div className="mt-6 space-y-3">
        {list.map((s) => (
          <SubmissionCard
            key={s.id}
            href={`/admin/submissions/${s.id}`}
            title={store.activities.find((a) => a.id === s.activityId)?.title ?? ""}
            student={store.users.find((u) => u.id === s.studentId)?.name ?? ""}
            status={s.status}
          />
        ))}
      </div>
    </div>
  );
}
