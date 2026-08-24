"use client";

import { I18nProvider } from "@/lib/i18n/provider";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { usePlatform } from "@/lib/data/platform-store";

function Hydrate() {
  const setHydrated = usePlatform((s) => s.setHydrated);
  const sessionUserId = usePlatform((s) => s.sessionUserId);
  const hydrate = usePlatform((s) => s.hydrate);

  useEffect(() => {
    void Promise.resolve(usePlatform.persist.rehydrate()).then(() => setHydrated(true));
  }, [setHydrated]);

  // Refetches real data from backend/api whenever the session appears (page
  // load with an existing cookie, or right after login/register) or changes
  // (switching accounts without a full reload).
  useEffect(() => {
    if (sessionUserId) void hydrate();
  }, [sessionUserId, hydrate]);

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
