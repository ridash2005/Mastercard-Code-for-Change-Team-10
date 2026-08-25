"use client";

import { CodePlayground } from "@/components/playground/code-playground";
import { useI18n } from "@/lib/i18n/provider";

export default function PlaygroundPage() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.playgroundTitle}</h1>
      <p className="mt-1 text-sm text-muted">{t.playgroundSubtitle}</p>
      <div className="mt-6">
        <CodePlayground />
      </div>
    </div>
  );
}
