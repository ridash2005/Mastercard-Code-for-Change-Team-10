"use client";

import { useI18n } from "@/lib/i18n/provider";
import { localeMeta, type Locale } from "@/lib/i18n/dictionaries";

const LOCALES = Object.keys(localeMeta) as Locale[];

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="flex items-center gap-1 text-xs text-muted">
      <span className="sr-only">{t.language}</span>
      <select
        aria-label={t.language}
        className="rounded-md border border-line bg-card px-2 py-1 text-xs"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {localeMeta[l].nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
