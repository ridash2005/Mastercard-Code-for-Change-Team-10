"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { StatusBadge, SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatT } from "@/lib/i18n/format";

export default function SubmissionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const store = usePlatform();
  const { t } = useI18n();
  const sub = store.submissions.find((s) => s.id === id);
  const hasAiResult = Boolean(sub?.aiSuggestion);

  // The AI Judge is a backend job (see submissionService.js's
  // triggerAiJudge) that may still be running when this page loads -
  // poll briefly for its result instead of leaving "Scoring…" stuck.
  useEffect(() => {
    if (hasAiResult) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      void store.hydrate();
      if (attempts >= 6) clearInterval(interval);
    }, 4000);
    return () => clearInterval(interval);
  }, [hasAiResult, store]);

  const activity = store.activities.find((a) => a.id === sub?.activityId);
  const student = store.users.find((u) => u.id === sub?.studentId);
  const profile = store.studentProfiles.find((p) => p.userId === sub?.studentId);
  const latest = sub?.attempts.at(-1);
  const ai = sub?.aiSuggestion;
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ok, setOk] = useState<string | null>(null);

  // The AI suggestion loads asynchronously (it's a backend job kicked off
  // by the student's submit, not something this page waits on) - seed the
  // score/feedback fields once it's arrived rather than defaulting to 0.
  const [seeded, setSeeded] = useState(false);
  if (!seeded && ai?.suggestedScore != null) {
    setSeeded(true);
    setScore(ai.suggestedScore);
    setFeedback(ai.suggestedFeedback ?? "");
  }

  if (!sub || !activity) return <p>{t.notFoundLabel}</p>;

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
          <h2 className="font-medium">{t.latestAttemptHeading}</h2>
          <p className="mt-2">{latest?.text}</p>
          {latest?.link ? <p className="mt-2">{t.linkLabel}: {latest.link}</p> : null}
          {latest?.fileName ? <p>{t.fileWordLabel}: {latest.fileName}</p> : null}
          {latest?.notes ? <p className="text-stone-600">{t.notesForReviewerLabel}: {latest.notes}</p> : null}
        </article>
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div>
            <Label>{t.scoreLabel}</Label>
            <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} />
          </div>
          <div>
            <Label>{t.feedback}</Label>
            <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => act("approve")}>{t.approveAwardXpButton}</Button>
            <Button variant="outline" onClick={() => act("resubmit")}>
              {t.requestResubmissionButton}
            </Button>
            <Button variant="danger" onClick={() => act("reject")}>
              {t.rejectButton}
            </Button>
          </div>
          {ok ? <SuccessState title={formatT(t.recordedAsNotice, { action: ok })} /> : null}
        </div>
      </div>
      <aside className="rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-serif text-xl">{t.aiJudgeSuggestionHeading}</h2>
        {!ai ? (
          <p className="mt-2 text-stone-600">{t.aiScoringInProgress}</p>
        ) : ai.error ? (
          <p className="mt-2 text-stone-600">{formatT(t.aiCouldNotScore, { error: ai.error })}</p>
        ) : (
          <>
            <p className="mt-2 font-medium">{t.rubricLabel}</p>
            <ul className="space-y-2">
              {ai.criteriaLevels?.map((c) => (
                <li key={c.criterionKey} className="border-t pt-2">
                  <p className="flex justify-between font-medium">
                    <span>{c.criterionName}</span>
                    <span className="capitalize text-stone-600">{c.levelKey.replace("_", " ")}</span>
                  </p>
                  <p className="text-stone-600">{c.justification}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              {formatT(t.suggestedScoreConfidence, { score: ai.suggestedScore ?? 0, confidence: Math.round((ai.confidence ?? 0) * 100) })}
            </p>
            {ai.flags && ai.flags.length && !ai.flags.includes("none") ? (
              <p className="mt-1 text-amber-700">{t.flagsColonLabel}: {ai.flags.join(", ")}</p>
            ) : null}
            <p className="mt-1 text-stone-600">{ai.suggestedFeedback}</p>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => {
                if (ai.suggestedScore != null) setScore(ai.suggestedScore);
                if (ai.suggestedFeedback) setFeedback(ai.suggestedFeedback);
              }}
            >
              {t.useSuggestionButton}
            </Button>
          </>
        )}
      </aside>
    </div>
  );
}
