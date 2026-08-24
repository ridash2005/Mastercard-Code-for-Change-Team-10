"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { usePlatform } from "@/lib/data/platform-store";
import { isDone } from "@/lib/admin/insights";

export default function MentorsPage() {
  const store = usePlatform();
  const mentoring = store.activities.filter((a) => a.type === "mentoring");
  const mentors = useMemo(() => {
    const ids = [...new Set(mentoring.map((a) => a.createdBy))];
    return ids.map((id) => {
      const user = store.users.find((u) => u.id === id);
      const acts = mentoring.filter((a) => a.createdBy === id);
      const actIds = new Set(acts.map((a) => a.id));
      const ens = store.enrollments.filter((e) => actIds.has(e.activityId));
      const students = new Set(ens.map((e) => e.studentId));
      const completed = ens.filter((e) => isDone(e.status)).length;
      const reviews = store.feedbackRecords.filter((f) => f.category === "Mentoring" && f.activityId && actIds.has(f.activityId));
      const all = reviews;
      const avg = all.length ? all.reduce((n, r) => n + r.rating, 0) / all.length : null;
      const dist = [1, 2, 3, 4, 5].map((star) => all.filter((r) => r.rating === star).length);
      return {
        id,
        name: user?.name ?? id,
        sessions: ens.length,
        completed,
        students: students.size,
        reviews: all,
        avg,
        dist,
      };
    });
  }, [mentoring, store.enrollments, store.feedbackRecords, store.users]);
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = mentors.find((m) => m.id === openId);

  return (
    <div>
      <h1 className="font-serif text-3xl">Mentor performance</h1>
      <p className="mt-1 text-sm text-muted">
        Mentors are staff who created mentoring activities. Ratings appear only when students submit Mentoring feedback. No scores are invented.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {mentors.map((m) => (
          <button key={m.id} type="button" className="k-card p-5 text-left" onClick={() => setOpenId(m.id)}>
            <p className="font-serif text-xl text-plum">{m.name}</p>
            <p className="mt-1 text-sm text-gold">{m.avg != null ? `${"★".repeat(Math.round(m.avg))} ${m.avg.toFixed(1)}` : "No ratings yet"}</p>
            <p className="mt-2 text-sm text-muted">
              {m.reviews.length} reviews · {m.students} students enrolled · {m.completed}/{m.sessions} sessions completed
            </p>
          </button>
        ))}
      </div>
      <Dialog open={Boolean(selected)} title={selected?.name ?? "Mentor"} onClose={() => setOpenId(null)}>
        {selected ? (
          <div className="space-y-3 text-sm">
            <p>
              Average rating: {selected.avg != null ? selected.avg.toFixed(1) : "n/a"} · {selected.reviews.length} reviews
            </p>
            <ul className="space-y-1">
              {selected.dist.map((count, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-8">{i + 1}★</span>
                  <span className="h-2 flex-1 rounded-full bg-track">
                    <span className="block h-2 rounded-full bg-gold" style={{ width: `${selected.reviews.length ? (count / selected.reviews.length) * 100 : 0}%` }} />
                  </span>
                  <span className="w-6 text-muted">{count}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted">
              Recurring themes are not generated. {selected.reviews.length ? "Open Student Reviews to read the submitted comments." : "There is no Mentoring feedback to summarise."}
            </p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
