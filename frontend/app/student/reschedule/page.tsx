"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { EmptyState, SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";

export default function ReschedulePage() {
  const store = usePlatform();
  const meetings = store.meetings.filter((m) => m.reschedulable !== false);
  // No local "selected" state for the defaults - meetings/slots load
  // asynchronously (see hydrate()), so the selection is derived directly
  // from whatever has arrived rather than synced via an effect. Explicit
  // user picks (below) are the only thing that needs real state.
  const [meetingIdOverride, setMeetingIdOverride] = useState<string | null>(null);
  const meetingId = meetingIdOverride ?? meetings[0]?.id ?? "";
  const meeting = store.meetings.find((m) => m.id === meetingId);
  const candidateSlots = (meeting?.candidateSlots as string[] | undefined) ?? [];
  const [slotOverride, setSlotOverride] = useState<string | null>(null);
  const slot = slotOverride && candidateSlots.includes(slotOverride) ? slotOverride : candidateSlots[0] ?? "";
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!meetings.length) {
    return (
      <div className="max-w-lg">
        <h1 className="font-serif text-3xl">Reschedule</h1>
        <div className="mt-6">
          <EmptyState title="No reschedulable sessions." hint="Sessions your mentor schedules will appear here." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">Reschedule</h1>
      <p className="mt-1 text-sm text-muted">Pick a scheduled session, then an open slot.</p>
      <div className="mt-6 space-y-3">
        <div>
          <Label>Session</Label>
          <Select
            value={meetingId}
            onChange={(e) => {
              setMeetingIdOverride(e.target.value);
              setSlotOverride(null);
              setOk(false);
            }}
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Available slot</Label>
          <Select value={slot} onChange={(e) => setSlotOverride(e.target.value)}>
            {candidateSlots.map((s) => (
              <option key={s} value={s}>
                {new Date(s).toLocaleString("en-IN")}
              </option>
            ))}
          </Select>
        </div>
        <Button
          disabled={!slot || busy}
          onClick={async () => {
            setBusy(true);
            await store.reschedule(meetingId, slot);
            setBusy(false);
            setOk(true);
          }}
        >
          {busy ? "Confirming…" : "Confirm change"}
        </Button>
        {ok ? <SuccessState title="Slot updated. You and staff both received a notification." /> : null}
      </div>
    </div>
  );
}
