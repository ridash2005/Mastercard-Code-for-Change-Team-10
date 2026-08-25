"use client";

import { LearningTypePage } from "@/components/student/learning-type-page";
import { useI18n } from "@/lib/i18n/provider";

export default function Page() {
  const { t } = useI18n();
  return <LearningTypePage type="assignment" title={t.assignments} blurb={t.assignmentsTypeBlurb} />;
}
