"use client";

import { useEffect, useState } from "react";
import { Sidebar, StudentMobileDrawer, AdminMobileDrawer } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { StudentFooter } from "@/components/layout/student-footer";
import { AdminFooter } from "@/components/layout/admin-footer";
import { FloatingChatbot } from "@/components/ai/chatbot";
import { LoadingState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";

const ADMIN_COLLAPSE_KEY = "katalyst-admin-nav-collapsed";

export function StudentShell({ children }: { children: React.ReactNode }) {
  const hydrated = usePlatform((s) => s.hydrated);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    // Deliberately deferred to an effect: reading localStorage during the
    // initial (lazy-init) render would return a different value on the
    // server than the client and cause a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(window.localStorage.getItem("katalyst-nav-collapsed") === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("katalyst-nav-collapsed", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="student" collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <StudentMobileDrawer open={drawer} onClose={() => setDrawer(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar variant="student" onOpenMenu={() => setDrawer(true)} />
        <main className="flex-1 px-4 py-6 md:px-8">{hydrated ? children : <LoadingState />}</main>
        <StudentFooter />
      </div>
      <FloatingChatbot />
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const hydrated = usePlatform((s) => s.hydrated);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    // Same rationale as StudentShell above: kept in an effect to avoid an
    // SSR/client hydration mismatch on the initial render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(window.localStorage.getItem(ADMIN_COLLAPSE_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(ADMIN_COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <AdminMobileDrawer open={drawer} onClose={() => setDrawer(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar variant="admin" onOpenMenu={() => setDrawer(true)} />
        <main className="flex-1 px-4 py-6 md:px-8">{hydrated ? children : <LoadingState />}</main>
        <AdminFooter />
      </div>
    </div>
  );
}
