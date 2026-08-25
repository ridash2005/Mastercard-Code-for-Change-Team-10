"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileInput, Input, Label, Textarea } from "@/components/ui/input";
import { StatusBadge, SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = usePlatform();
  const { t } = useI18n();
  const sid = store.sessionUserId ?? "";
  const activity = store.activities.find((a) => a.id === id);
  const enrollment = store.enrollments.find((e) => e.activityId === id && e.studentId === sid);
  const submission = store.submissions.find((s) => s.activityId === id && s.studentId === sid);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState<string>();
  const [done, setDone] = useState(false);

  if (!activity) return <p>{t.activityNotFound}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <p className="text-xs uppercase text-muted">{activity.type}</p>
        <h1 className="font-serif text-3xl">{activity.title}</h1>
        <p className="text-muted">{activity.description}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>{t.domainLabel} · {activity.domain}</div>
          <div>{t.problemLabel} · {activity.problemDomain}</div>
          <div>{t.difficultyLabel} · {activity.difficulty}</div>
          <div>{activity.xpReward} XP</div>
          <div>
            {activity.startDate} → {formatDate(activity.dueDate)}
          </div>
          <div>{activity.durationHours}h</div>
          <div>{activity.requirement}</div>
          <div>{activity.certificate ? t.certificateYes : t.certificateNo}</div>
          <div>{activity.participation}</div>
        </dl>
        <p className="text-sm">{activity.instructions}</p>
        <p className="text-xs text-muted">
          {t.instructionsAttachments}: {activity.attachments.map((a) => a.name).join(", ") || t.noneYet}
        </p>
        <div className="flex flex-wrap gap-2">
          {!enrollment ? (
            <Button onClick={() => store.enroll(activity.id, sid)}>{t.enrolButton}</Button>
          ) : enrollment.status === "not_started" ? (
            <Button onClick={() => store.startActivity(activity.id, sid)}>{t.startButton}</Button>
          ) : null}
          {enrollment ? <StatusBadge status={enrollment.status} /> : <StatusBadge status="not_started" />}
        </div>
        {enrollment && !["completed", "approved"].includes(enrollment.status) ? (
          <form
            className="space-y-3 k-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              store.submitWork({ activityId: activity.id, studentId: sid, text, link, notes, fileName });
              setDone(true);
            }}
          >
            <h2 className="font-serif text-xl">{t.submitWorkHeading}</h2>
            <div>
              <Label>{t.writtenWorkLabel}</Label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} required />
            </div>
            <div>
              <Label>{t.linkLabel}</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
            </div>
            <div>
              <Label>{t.fileNameOnlyLabel}</Label>
              <FileInput onChange={(e) => setFileName(e.target.files?.[0]?.name)} />
            </div>
            <div>
              <Label>{t.notesForReviewerLabel}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <Button type="submit">{t.submit}</Button>
            {done ? <SuccessState title={t.submittedUntilReviewNotice} /> : null}
          </form>
        ) : null}
      </div>
      <aside className="space-y-3 k-card p-4 text-sm">
        <h2 className="font-serif text-xl">{t.historyHeading}</h2>
        {submission?.attempts.map((a) => (
          <div key={a.id} className="border-t pt-2">
            <p>{new Date(a.submittedAt).toLocaleString("en-IN")}</p>
            <p className="text-muted">{a.text}</p>
            {a.fileName ? <p>{t.fileWordLabel}: {a.fileName}</p> : null}
            {a.link ? <p>{t.linkLabel}: {a.link}</p> : null}
          </div>
        )) ?? <p>{t.noAttemptsYet}</p>}
        {submission?.score != null ? (
          <p>
            {t.scoreLabel} {submission.score} · {submission.feedback}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
