"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, localeMeta, type Locale } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "katalyst-locale";

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (typeof dictionaries)["en"];
} | null>(null);

function isLocale(value: string | null): value is Locale {
  return !!value && value in dictionaries;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Starts "en" for a deterministic server render, then swaps to whatever
  // was saved (if anything) right after mount - see the effect below.
  // React hydrates client-rendered text without complaint even if it
  // differs from the server-rendered pass, so this doesn't need the
  // suppressHydrationWarning dance a mismatched DOM attribute would.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external source (localStorage) on mount, not derivable as render-time state
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      // localStorage can throw (private browsing, blocked site data) -
      // just stay on the default locale.
    }
  }, []);

  useEffect(() => {
    const meta = localeMeta[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.rtl ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Same as above - a failed write just means it won't persist across reloads.
    }
  };

  const value = useMemo(() => ({ locale, setLocale, t: dictionaries[locale] }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
