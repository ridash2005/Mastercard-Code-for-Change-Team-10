"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { EmptyState, SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function ReschedulePage() {
  const store = usePlatform();
  const { t } = useI18n();
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
        <h1 className="font-serif text-3xl">{t.reschedule}</h1>
        <div className="mt-6">
          <EmptyState title={t.noReschedulableSessions} hint={t.reschedulableHint} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">{t.reschedule}</h1>
      <p className="mt-1 text-sm text-muted">{t.rescheduleSubtitle}</p>
      <div className="mt-6 space-y-3">
        <div>
          <Label>{t.sessionLabel}</Label>
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
          <Label>{t.availableSlotLabel}</Label>
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
          {busy ? t.confirming : t.confirmChange}
        </Button>
        {ok ? <SuccessState title={t.slotUpdatedNotice} /> : null}
      </div>
    </div>
  );
}
