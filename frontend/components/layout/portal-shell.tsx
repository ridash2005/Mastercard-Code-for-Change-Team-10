"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { FloatingChatbot } from "@/components/ai/chatbot";
import { LoadingState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";

export function StudentShell({ children }: { children: React.ReactNode }) {
  const hydrated = usePlatform((s) => s.hydrated);
  return (
    <div className="flex min-h-screen">
      <Sidebar variant="student" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar variant="student" />
        <main className="flex-1 px-4 py-6 md:px-8">{hydrated ? children : <LoadingState />}</main>
      </div>
      <FloatingChatbot />
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const hydrated = usePlatform((s) => s.hydrated);
  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar variant="admin" />
        <main className="flex-1 px-4 py-6 md:px-8">{hydrated ? children : <LoadingState />}</main>
      </div>
    </div>
  );
}
