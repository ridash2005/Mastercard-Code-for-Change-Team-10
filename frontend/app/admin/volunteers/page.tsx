"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { formatDate } from "@/lib/utils";
import type { VolunteerApplication } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

function VolunteerBoard({ filter }: { filter?: VolunteerApplication["status"] }) {
  const store = usePlatform();
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useMemo(() => {
    const all = store.volunteerApplications ?? [];
    return filter ? all.filter((v) => v.status === filter) : all;
  }, [store.volunteerApplications, filter]);
  const selected = list.find((v) => v.id === openId) ?? (store.volunteerApplications ?? []).find((v) => v.id === openId);

  return (
    <div>
      <ul className="mt-6 space-y-3">
        {list.map((v) => (
          <li key={v.id} className="k-card p-4">
            <p className="font-medium text-plum">{v.name}</p>
            <p className="text-sm text-muted">{t.interestedInLabel}: {v.interests.join(" · ")}</p>
            <p className="text-sm text-muted">{t.skillsColonLabel}: {v.skills.join(" · ") || t.notProvided}</p>
            <p className="text-sm text-muted">{t.credentialsLabel}: {t.notProvided}{v.college ? ` · ${v.college}` : ""}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-purple">
              <StatusBadge status={v.status} /> · {formatDate(v.createdAt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenId(v.id)}>
                {t.viewProfileButton}
              </Button>
              {v.status === "pending" ? (
                <>
                  <Button type="button" onClick={() => store.reviewVolunteer(v.id, "approved")}>
                    {t.approveButton}
                  </Button>
                  <Button type="button" variant="danger" onClick={() => store.reviewVolunteer(v.id, "rejected")}>
                    {t.rejectButton}
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {!list.length ? <p className="mt-6 text-sm text-muted">{t.noVolunteerRecordsNote}</p> : null}
      <Dialog open={Boolean(selected)} title={selected?.name ?? t.volunteerFallback} onClose={() => setOpenId(null)}>
        {selected ? (
          <div className="space-y-2 text-sm">
            <p>{selected.email}</p>
            <p>{t.interestsColonLabel}: {selected.interests.join(" · ")}</p>
            <p>{t.skillsColonLabel}: {selected.skills.join(" · ")}</p>
            <p>{t.collegeColonLabel}: {selected.college ?? t.notProvided}</p>
            <p>{t.experienceColonLabel}: {t.notProvided}</p>
            <p>{t.availabilityColonLabel}: {t.notProvided}</p>
            <p>{t.appliedLabel} {formatDate(selected.createdAt)}</p>
            <p>
              {t.statusColonLabel}: <StatusBadge status={selected.status} />
            </p>
            {selected.message ? <p>{selected.message}</p> : null}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

export default function VolunteersPage() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.volunteers}</h1>
      <p className="mt-1 text-sm text-muted">{t.volunteersSubtitle}</p>
      <VolunteerBoard filter="approved" />
    </div>
  );
}

export function VolunteerApplicationsView() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.volunteerApplicationsTitle}</h1>
      <p className="mt-1 text-sm text-muted">{t.volunteerApplicationsSubtitle}</p>
      <VolunteerBoard />
    </div>
  );
}
