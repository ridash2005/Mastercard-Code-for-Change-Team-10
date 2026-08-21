"use client";

import { useState } from "react";
import { coachPrompts, coachReply } from "@/lib/ai/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceAssist } from "@/components/voice/voice-assist";
import { usePlatform } from "@/lib/data/platform-store";
import { globalRanks } from "@/lib/services/repository";

export default function CoachPage() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const user = store.users.find((u) => u.id === sid);
  const profile = store.studentProfiles.find((p) => p.userId === sid);
  const rank = globalRanks(store.studentProfiles).find((r) => r.userId === sid)?.rank ?? 0;
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
    const reply = await coachReply(q, {
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
    });
    setLog((l) => [...l, `You: ${q}`, `Coach: ${reply}`]);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl">AI Coach</h1>
      <p className="mt-1 text-sm text-stone-600">
        Personalised learning, scoring hints and nudges. The floating Chatbot answers catalogue questions instead.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {coachPrompts.map((p) => (
          <button key={p} className="rounded-full border px-3 py-1 text-xs" onClick={() => ask(p)}>
            {p}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-40 space-y-2 rounded-xl border bg-white p-4 text-sm">
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
        <Button type="submit">Ask</Button>
      </form>
      <div className="mt-2">
        <VoiceAssist onTranscript={setInput} />
      </div>
    </div>
  );
}
