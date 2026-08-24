"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePlatform } from "@/lib/data/platform-store";

export function CollaborationRequests() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const mine = (store.collaborations ?? []).filter((c) => c.studentIds.includes(sid));
  if (!mine.length) return null;

  return (
    <section className="space-y-3">
      {mine.map((c) => {
        const mineRes = c.responses.find((r) => r.studentId === sid);
        const allAccepted = c.responses.every((r) => r.status === "accepted");
        const pending = mineRes?.status === "pending";
        return (
          <div key={c.id} className="k-card p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">New collaborator request</p>
            <p className="mt-1 text-plum">You have a new project collaboration request.</p>
            <p className="mt-2 text-sm">
              Project: <strong>{c.projectTitle}</strong>
            </p>
            {pending ? (
              <>
                <p className="mt-1 text-sm text-muted">Status: Awaiting your response</p>
                <p className="mt-1 text-sm text-muted">Why this collaboration: {c.studentMessage}</p>
                <div className="mt-3 flex gap-2">
                  <Button type="button" onClick={() => store.respondCollaboration(c.id, sid, "accepted")}>
                    Accept
                  </Button>
                  <Button type="button" variant="outline" onClick={() => store.respondCollaboration(c.id, sid, "declined")}>
                    Decline
                  </Button>
                </div>
              </>
            ) : mineRes?.status === "declined" ? (
              <p className="mt-2 text-sm text-muted">You declined this request.</p>
            ) : allAccepted ? (
              <div className="mt-2 text-sm">
                <p className="font-medium text-plum">Collaboration accepted</p>
                <ul className="mt-1 text-muted">
                  {c.studentIds
                    .filter((id) => id !== sid)
                    .map((id) => {
                      const p = store.studentProfiles.find((x) => x.userId === id);
                      return (
                        <li key={id}>
                          {store.users.find((u) => u.id === id)?.name}
                          {p?.skills.length ? ` · ${p.skills.join(", ")}` : ""}
                        </li>
                      );
                    })}
                </ul>
                <Link href="/student/teams" className="mt-2 inline-block font-medium text-barbie">
                  Open teams
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">You accepted. Collaborator details appear when everyone accepts.</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
