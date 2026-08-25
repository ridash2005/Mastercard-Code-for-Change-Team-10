"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchBar } from "@/components/activities/filters";
import { Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { levelFromXp } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export default function StudentsPage() {
  const store = usePlatform();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const list = useMemo(() => {
    return store.studentProfiles.filter((p) => {
      const u = store.users.find((x) => x.id === p.userId);
      if (q && !`${u?.name} ${u?.college}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (risk === "risk" && !p.atRisk) return false;
      if (risk === "inactive" && !p.inactive) return false;
      return true;
    });
  }, [store.studentProfiles, store.users, q, risk]);

  return (
    <div>
      <h1 className="font-serif text-3xl">{t.studentsNav}</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="w-full max-w-sm">
          <SearchBar value={q} onChange={setQ} />
        </div>
        <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="all">{t.chipAll}</option>
          <option value="risk">{t.flagAtRisk}</option>
          <option value="inactive">{t.flagInactive}</option>
        </Select>
      </div>
      <ul className="mt-6 divide-y rounded-xl border bg-white">
        {list.map((p) => {
          const u = store.users.find((x) => x.id === p.userId);
          const team = store.teams.find((tm) => tm.id === p.teamId);
          return (
            <li key={p.userId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <Link href={`/admin/students/${p.userId}`} className="underline">
                {u?.name}
              </Link>
              <span>{p.xp} XP · L{levelFromXp(p.xp).level}</span>
              <span>{team?.name ?? t.noTeamLabel}</span>
              {p.atRisk ? <StatusBadge status="high" /> : p.inactive ? <StatusBadge status="medium" /> : <StatusBadge status="approved" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
