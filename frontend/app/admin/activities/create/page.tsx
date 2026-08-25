"use client";

import { CreateActivityForm } from "@/components/forms/create-activity-form";
import { useI18n } from "@/lib/i18n/provider";

export default function CreateActivityPage() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.createActivity}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.createActivitySubtitle}</p>
      <div className="mt-6 rounded-xl border bg-white p-5">
        <CreateActivityForm />
      </div>
    </div>
  );
}
