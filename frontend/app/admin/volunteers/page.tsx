"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { usePlatform } from "@/lib/data/platform-store";
import { formatDate } from "@/lib/utils";
import type { VolunteerApplication } from "@/lib/types";

function VolunteerBoard({ filter }: { filter?: VolunteerApplication["status"] }) {
  const store = usePlatform();
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
            <p className="text-sm text-muted">Interested in: {v.interests.join(" · ")}</p>
            <p className="text-sm text-muted">Skills: {v.skills.join(" · ") || "Not provided"}</p>
            <p className="text-sm text-muted">Credentials: Not provided{v.college ? ` · ${v.college}` : ""}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-purple">{v.status.replace("_", " ")} · {formatDate(v.createdAt)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenId(v.id)}>
                View Profile
              </Button>
              {v.status === "pending" ? (
                <>
                  <Button type="button" onClick={() => store.reviewVolunteer(v.id, "approved")}>
                    Approve
                  </Button>
                  <Button type="button" variant="danger" onClick={() => store.reviewVolunteer(v.id, "rejected")}>
                    Reject
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {!list.length ? <p className="mt-6 text-sm text-muted">No volunteer records in this view.</p> : null}
      <Dialog open={Boolean(selected)} title={selected?.name ?? "Volunteer"} onClose={() => setOpenId(null)}>
        {selected ? (
          <div className="space-y-2 text-sm">
            <p>{selected.email}</p>
            <p>Interests: {selected.interests.join(" · ")}</p>
            <p>Skills: {selected.skills.join(" · ")}</p>
            <p>College: {selected.college ?? "Not provided"}</p>
            <p>Experience: Not provided</p>
            <p>Availability: Not provided</p>
            <p>Applied {formatDate(selected.createdAt)}</p>
            <p>Status: {selected.status}</p>
            {selected.message ? <p>{selected.message}</p> : null}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

export default function VolunteersPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Volunteers</h1>
      <p className="mt-1 text-sm text-muted">Approved volunteers. Applications are reviewed separately. Credentials are shown only when submitted.</p>
      <VolunteerBoard filter="approved" />
    </div>
  );
}

export function VolunteerApplicationsView() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Volunteer Applications</h1>
      <p className="mt-1 text-sm text-muted">Pending and historical applications. Missing fields stay “Not provided”.</p>
      <VolunteerBoard />
    </div>
  );
}
