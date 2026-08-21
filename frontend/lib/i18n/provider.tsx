"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (typeof dictionaries)["en"];
} | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const value = useMemo(() => ({ locale, setLocale, t: dictionaries[locale] }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
