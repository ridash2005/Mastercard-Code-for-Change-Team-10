"use client";

import { useState } from "react";
import { coachPrompts, coachReplyLive } from "@/lib/ai/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceAssist } from "@/components/voice/voice-assist";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function CoachPage() {
  const store = usePlatform();
  const { t } = useI18n();
  const sid = store.sessionUserId ?? "";
  const user = store.users.find((u) => u.id === sid);
  const profile = store.studentProfiles.find((p) => p.userId === sid);
  const rank = store.leaderboard.find((r) => r.userId === sid)?.rank ?? 0;
  const pending = store.enrollments
    .filter((e) => e.studentId === sid && !["completed", "approved"].includes(e.status))
    .map((e) => store.activities.find((a) => a.id === e.activityId)?.title ?? "")
    .filter(Boolean);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>([]);

  async function ask(q: string) {
    if (!profile || !user) return;
    const mine = store.enrollments.filter((e) => e.studentId === sid);
    const completed = mine.filter((e) => e.status === "completed" || e.status === "approved").length;
    const { reply, source } = await coachReplyLive(
      q,
      {
        name: user.name,
        xp: profile.xp,
        streak: profile.streak,
        rank,
        completion: mine.length ? Math.round((completed / mine.length) * 100) : 0,
        pendingTitles: pending,
        overdueTitles: [],
        completedCount: completed,
        interests: profile.interests,
        atRisk: profile.atRisk || profile.inactive,
      },
      { email: user.email, role: "student" },
    );
    const tag = source === "live" ? "" : source === "guardrail_blocked" ? " (blocked)" : " (offline)";
    setLog((l) => [...l, `You: ${q}`, `Coach${tag}: ${reply}`]);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl">{t.aiCoachHeading}</h1>
      <p className="mt-1 text-sm text-muted">{t.aiCoachPageSubtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {coachPrompts.map((p) => (
          <button key={p} className="rounded-full border border-line bg-card px-3 py-1 text-xs text-plum" onClick={() => ask(p)}>
            {p}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-40 space-y-2 k-card p-4 text-sm">
        {log.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
          setInput("");
        }}
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} />
        <Button type="submit">{t.askButton}</Button>
      </form>
      <div className="mt-2">
        <VoiceAssist onTranscript={setInput} />
      </div>
    </div>
  );
}
