"use client";

import { I18nProvider } from "@/lib/i18n/provider";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { usePlatform } from "@/lib/data/platform-store";

function Hydrate() {
  const setHydrated = usePlatform((s) => s.setHydrated);
  useEffect(() => {
    void usePlatform.persist.rehydrate();
    setHydrated(true);
  }, [setHydrated]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Hydrate />
      {children}
      <Toaster richColors position="top-right" />
    </I18nProvider>
  );
}
