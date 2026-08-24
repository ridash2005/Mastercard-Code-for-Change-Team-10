"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { mentoringSlots, trainingSlots } from "@/lib/data/seed";
import { usePlatform } from "@/lib/data/platform-store";

export default function ReschedulePage() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const sessions = store.activities.filter((a) => a.type === "mentoring" || a.type === "training");
  const [activityId, setActivityId] = useState(sessions[0]?.id ?? "");
  const activity = store.activities.find((a) => a.id === activityId);
  const slots = activity?.type === "mentoring" ? mentoringSlots : trainingSlots;
  const [slot, setSlot] = useState(slots[0] ?? "");
  const [ok, setOk] = useState(false);

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">Reschedule</h1>
      <p className="mt-1 text-sm text-muted">Pick an enrolled mentoring or training session, then an open slot.</p>
      <div className="mt-6 space-y-3">
        <div>
          <Label>Session</Label>
          <Select
            value={activityId}
            onChange={(e) => {
              setActivityId(e.target.value);
              setOk(false);
            }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Available slot</Label>
          <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
            {slots.map((s) => (
              <option key={s} value={s}>
                {new Date(s).toLocaleString("en-IN")}
              </option>
            ))}
          </Select>
        </div>
        <Button
          onClick={() => {
            store.reschedule(activityId, sid, slot);
            setOk(true);
          }}
        >
          Confirm change
        </Button>
        {ok ? <SuccessState title="Slot updated. You and staff both received a notification." /> : null}
      </div>
    </div>
  );
}
