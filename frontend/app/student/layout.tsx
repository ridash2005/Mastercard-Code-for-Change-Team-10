"use client";

import { StudentShell } from "@/components/layout/portal-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
