"use client";

import { useMemo, useState } from "react";
import { SubmissionCard } from "@/components/cards";
import { SearchBar } from "@/components/activities/filters";
import { Select } from "@/components/ui/input";
import { usePlatform } from "@/lib/data/platform-store";

export default function SubmissionsPage() {
  const store = usePlatform();
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
      <h1 className="font-serif text-3xl">Submissions</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="w-full max-w-sm">
          <SearchBar value={q} onChange={setQ} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="approved">Approved</option>
          <option value="needs_resubmission">Needs resubmission</option>
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
