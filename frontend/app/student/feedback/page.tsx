"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function StudentFeedback() {
  const store = usePlatform();
  const { t } = useI18n();
  const [ok, setOk] = useState(false);
  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">{t.feedback}</h1>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          store.addFeedback({
            userId: store.sessionUserId ?? "",
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
          </Select>
        </div>
        <div>
          <Label>{t.ratingLabel}</Label>
          <Input name="rating" type="number" min={1} max={5} defaultValue={4} />
        </div>
        <div>
          <Label>{t.messageLabel}</Label>
          <Textarea name="message" required rows={4} />
        </div>
        <Button type="submit">{t.send}</Button>
        {ok ? <SuccessState title={t.feedbackSaved} /> : null}
      </form>
    </div>
  );
}
