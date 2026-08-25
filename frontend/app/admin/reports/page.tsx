"use client";

import { useMemo, useState } from "react";
import { DashboardCard } from "@/components/cards";
import { Label, Select } from "@/components/ui/input";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function ReportsPage() {
  const store = usePlatform();
  const { t } = useI18n();
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
      <h1 className="font-serif text-3xl">{t.reports}</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <Label>{t.domainLabel}</Label>
          <Select value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="all">{t.chipAll}</option>
            {domains.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t.teamLabel}</Label>
          <Select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="all">{t.chipAll}</option>
            {store.teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard label={t.participationLabel} value={students.filter((s) => !s.inactive).length} />
        <DashboardCard label={t.completionRateLabel} value={`${rate}%`} />
        <DashboardCard label={t.averageXpLabel} value={avgXp} />
        <DashboardCard label={t.courseCertificatesLabel} value={courseDone} />
        <DashboardCard label={t.overdueActivitiesLabel} value={overdue} />
        <DashboardCard label={t.lowScoresLabel} value={lowScores} />
        <DashboardCard label={t.flagAtRisk} value={students.filter((s) => s.atRisk).length} />
        <DashboardCard label={t.lowParticipationLabel} value={students.filter((s) => s.inactive).length} />
        <DashboardCard
          label={t.teamPerformanceLabel}
          value={store.teams.find((tm) => tm.id === team)?.name ?? t.allSquadsLabel}
        />
      </div>
    </div>
  );
}
