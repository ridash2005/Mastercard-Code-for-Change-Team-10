"use client";

import { useMemo, useState } from "react";
import { DashboardCard } from "@/components/cards";
import { Label, Select } from "@/components/ui/input";
import { usePlatform } from "@/lib/data/platform-store";

export default function ReportsPage() {
  const store = usePlatform();
  const [domain, setDomain] = useState("all");
  const [team, setTeam] = useState("all");
  const activities = store.activities.filter((a) => domain === "all" || a.domain === domain);
  const students = store.studentProfiles.filter((p) => team === "all" || p.teamId === team);
  const done = store.enrollments.filter((e) => e.status === "completed" || e.status === "approved").length;
  const rate = store.enrollments.length ? Math.round((done / store.enrollments.length) * 100) : 0;
  const lowScores = store.submissions.filter((s) => (s.score ?? 100) < 60).length;
  const overdue = activities.filter((a) => a.dueDate < "2026-08-21").length;
  const avgXp = students.length ? Math.round(students.reduce((a, s) => a + s.xp, 0) / students.length) : 0;
  const courseDone = store.certificates.length;
  const domains = useMemo(() => [...new Set(store.activities.map((a) => a.domain))], [store.activities]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Reports</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <Label>Domain</Label>
          <Select value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="all">All</option>
            {domains.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Team</Label>
          <Select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="all">All</option>
            {store.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard label="Participation (enrolled students in filter)" value={students.filter((s) => !s.inactive).length} />
        <DashboardCard label="Completion rate" value={`${rate}%`} />
        <DashboardCard label="Average XP" value={avgXp} />
        <DashboardCard label="Course certificates" value={courseDone} />
        <DashboardCard label="Overdue activities" value={overdue} />
        <DashboardCard label="Low scores" value={lowScores} />
        <DashboardCard label="At-risk" value={students.filter((s) => s.atRisk).length} />
        <DashboardCard label="Low participation" value={students.filter((s) => s.inactive).length} />
        <DashboardCard
          label="Team performance"
          value={store.teams.find((t) => t.id === team)?.name ?? "All squads"}
        />
      </div>
    </div>
  );
}
