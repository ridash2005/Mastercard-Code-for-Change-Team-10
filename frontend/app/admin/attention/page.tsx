"use client";

import Link from "next/link";
import { usePlatform } from "@/lib/data/platform-store";
import { attentionRows } from "@/lib/admin/insights";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export default function AttentionPage() {
  const store = usePlatform();
  const { t } = useI18n();
  const rows = attentionRows(store.studentProfiles, store.users, store.enrollments, store.activities);
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.attentionStudents}</h1>
      <p className="mt-1 text-sm text-muted">{t.attentionSubtitle}</p>
      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.userId} className="k-card p-4">
            <p className="font-medium text-plum">{row.name}</p>
            <p className="text-sm text-muted">
              {row.reason} · {row.metric} · {t.lastActiveLabel} {formatDate(row.lastActive)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={row.href} className="inline-flex rounded-full bg-barbie px-3.5 py-2 text-sm font-medium text-white">
                {t.viewStudentButton}
              </Link>
              <Link href="/admin/escalations" className="inline-flex rounded-full border border-plum/20 bg-ivory px-3.5 py-2 text-sm font-medium text-plum">
                {t.takeActionButton}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
