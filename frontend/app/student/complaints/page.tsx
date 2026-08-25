"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { StatusBadge, SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import type { ComplaintPriority } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

export default function StudentComplaints() {
  const store = usePlatform();
  const { t } = useI18n();
  const sid = store.sessionUserId ?? "";
  const [ok, setOk] = useState(false);
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.complaints}</h1>
      <form
        className="mt-6 max-w-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          store.addComplaint({
            userId: sid,
            category: String(fd.get("category")),
            subject: String(fd.get("subject")),
            description: String(fd.get("description")),
            priority: String(fd.get("priority")) as ComplaintPriority,
            attachmentName: "note.pdf",
          });
          setOk(true);
        }}
      >
        <div>
          <Label>{t.categoryLabel}</Label>
          <Select name="category">
            <option value="Session access">{t.complaintCategorySessionAccess}</option>
            <option value="Grading">{t.complaintCategoryGrading}</option>
            <option value="Conduct">{t.complaintCategoryConduct}</option>
          </Select>
        </div>
        <div>
          <Label>{t.subjectLabel}</Label>
          <Input name="subject" required />
        </div>
        <div>
          <Label>{t.descriptionLabel}</Label>
          <Textarea name="description" required />
        </div>
        <div>
          <Label>{t.priorityLabel}</Label>
          <Select name="priority">
            <option value="low">{t.status_low}</option>
            <option value="medium">{t.status_medium}</option>
            <option value="high">{t.status_high}</option>
          </Select>
        </div>
        <Button type="submit">{t.submit}</Button>
        {ok ? <SuccessState title={t.filedAsSubmitted} /> : null}
      </form>
      <ul className="mt-8 space-y-2">
        {store.complaints
          .filter((c) => c.userId === sid)
          .map((c) => (
            <li key={c.id} className="flex justify-between k-card p-3 text-sm">
              {c.subject} <StatusBadge status={c.status} />
            </li>
          ))}
      </ul>
    </div>
  );
}
