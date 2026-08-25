"use client";

import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function FeedbackPublicPage() {
  const add = usePlatform((s) => s.addFeedback);
  const sid = usePlatform((s) => s.sessionUserId) ?? "public";
  const { t } = useI18n();
  const [ok, setOk] = useState(false);
  return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-serif text-3xl">{t.feedback}</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            add({
              userId: sid,
              category: String(fd.get("category")),
              rating: Number(fd.get("rating")),
              message: String(fd.get("message")),
            });
            setOk(true);
          }}
        >
          <div>
            <Label>{t.categoryLabel}</Label>
            <Select name="category">
              <option value="Learning design">{t.feedbackCategoryLearningDesign}</option>
              <option value="Platform">{t.feedbackCategoryPlatform}</option>
              <option value="Mentoring">{t.mentoring}</option>
              <option value="Other">{t.feedbackCategoryOther}</option>
            </Select>
          </div>
          <div>
            <Label>{t.ratingLabel}</Label>
            <Input name="rating" type="number" min={1} max={5} defaultValue={5} required />
          </div>
          <div>
            <Label>{t.messageLabel}</Label>
            <Textarea name="message" required rows={4} />
          </div>
          <Button type="submit">{t.submitFeedbackButton}</Button>
          {ok ? <SuccessState title={t.thankYouFeedbackNotice} /> : null}
        </form>
      </div>
    </PublicShell>
  );
}
