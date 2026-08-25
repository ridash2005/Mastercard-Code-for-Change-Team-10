"use client";

import { AdminTypePage } from "@/components/admin/type-page";
import { useI18n } from "@/lib/i18n/provider";

export default function Page() {
  const { t } = useI18n();
  return <AdminTypePage type="mentoring" title={t.mentoring} />;
}
