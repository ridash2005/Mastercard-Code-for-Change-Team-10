"use client";

import { AdminShell } from "@/components/layout/portal-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
