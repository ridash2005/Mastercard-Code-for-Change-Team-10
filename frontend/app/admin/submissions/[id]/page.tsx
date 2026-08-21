"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { StatusBadge, SuccessState } from "@/components/states";
import { reviewSubmissionDraft } from "@/lib/ai/review";
import { usePlatform } from "@/lib/data/platform-store";

export default function SubmissionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const store = usePlatform();
  const sub = store.submissions.find((s) => s.id === id);
  const activity = store.activities.find((a) => a.id === sub?.activityId);
  const student = store.users.find((u) => u.id === sub?.studentId);
  const profile = store.studentProfiles.find((p) => p.userId === sub?.studentId);
  const latest = sub?.attempts.at(-1);
  const ai = reviewSubmissionDraft(latest?.text ?? "", activity?.title ?? "Activity");
  const [score, setScore] = useState(ai.suggestedScore);
  const [feedback, setFeedback] = useState(ai.suggestedFeedback);
  const [ok, setOk] = useState<string | null>(null);

  if (!sub || !activity) return <p>Not found.</p>;

  function act(action: "approve" | "reject" | "resubmit") {
    if (!sub) return;
    store.reviewSubmission({
      submissionId: sub.id,
      reviewerId: store.sessionUserId ?? "u-priya",
      action,
      score,
      feedback,
    });
    setOk(action);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="font-serif text-3xl">{activity.title}</h1>
        <StatusBadge status={sub.status} />
        <p className="text-sm">
          {student?.name} · {student?.programme} · {profile?.xp} XP
        </p>
        <article className="rounded-xl border bg-white p-4 text-sm">
          <h2 className="font-medium">Latest attempt</h2>
          <p className="mt-2">{latest?.text}</p>
          {latest?.link ? <p className="mt-2">Link: {latest.link}</p> : null}
          {latest?.fileName ? <p>File: {latest.fileName}</p> : null}
          {latest?.notes ? <p className="text-stone-600">Notes: {latest.notes}</p> : null}
        </article>
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div>
            <Label>Score</Label>
            <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} />
          </div>
          <div>
            <Label>Feedback</Label>
            <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => act("approve")}>Approve & award XP</Button>
            <Button variant="outline" onClick={() => act("resubmit")}>
              Request resubmission
            </Button>
            <Button variant="danger" onClick={() => act("reject")}>
              Reject
            </Button>
          </div>
          {ok ? <SuccessState title={`Recorded as ${ok}. Student XP and notifications update in this demo.`} /> : null}
        </div>
      </div>
      <aside className="rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-serif text-xl">AI review (mock)</h2>
        <p className="mt-2 font-medium">Strengths</p>
        <ul className="list-disc pl-4">
          {ai.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-2 font-medium">Weaknesses</p>
        <ul className="list-disc pl-4">
          {ai.weaknesses.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-3">Suggested score {ai.suggestedScore}</p>
        <p className="mt-1 text-stone-600">{ai.suggestedFeedback}</p>
        <Button
          variant="ghost"
          className="mt-2"
          onClick={() => {
            setScore(ai.suggestedScore);
            setFeedback(ai.suggestedFeedback);
          }}
        >
          Use suggestion
        </Button>
      </aside>
    </div>
  );
}
