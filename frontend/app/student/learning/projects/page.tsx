"use client";

import { LearningTypePage } from "@/components/student/learning-type-page";
import { useI18n } from "@/lib/i18n/provider";

export default function Page() {
  const { t } = useI18n();
  return <LearningTypePage type="project" title={t.projects} blurb={t.projectsTypeBlurb} />;
}
