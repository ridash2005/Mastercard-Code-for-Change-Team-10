"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useI18n } from "@/lib/i18n/provider";

const studentNav = [
  { href: "/student", key: "dashboard" as const },
  { href: "/student/learning", key: "myLearning" as const },
  { href: "/student/explore", key: "explore" as const },
  { href: "/student/gamification", key: "gamification" as const },
  { href: "/student/achievements", key: "achievements" as const },
  { href: "/student/missions", key: "missions" as const },
  { href: "/student/leaderboard", key: "leaderboard" as const },
  { href: "/student/teams", key: "teams" as const },
  { href: "/student/ai-coach", key: "aiCoach" as const },
  { href: "/student/chatbot", key: "chatbot" as const },
  { href: "/student/notifications", key: "notifications" as const },
  { href: "/student/extracurricular", key: "extracurricular" as const },
  { href: "/student/reschedule", key: "reschedule" as const },
  { href: "/student/profile", key: "profile" as const },
  { href: "/student/settings", key: "settings" as const },
  { href: "/student/feedback", key: "feedback" as const },
  { href: "/student/complaints", key: "complaints" as const },
  { href: "/student/contact", key: "contact" as const },
  { href: "/student/emergency", key: "emergency" as const },
];

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/activities", label: "Activities" },
  { href: "/admin/activities/create", label: "Create activity" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/training", label: "Training" },
  { href: "/admin/mentoring", label: "Mentoring" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/assignments", label: "Assignments" },
  { href: "/admin/milestones", label: "Milestones" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/leaderboards", label: "Leaderboards" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/escalations", label: "Escalations" },
  { href: "/admin/settings", label: "Settings" },
];

export function Sidebar({ variant }: { variant: "student" | "admin" }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const items =
    variant === "student"
      ? studentNav.map((i) => ({ href: i.href, label: t[i.key] }))
      : adminNav;
  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-stone-200 bg-white md:block">
      <div className="sticky top-0 border-b border-stone-100 px-4 py-4">
        <Link href={variant === "student" ? "/student" : "/admin"}>
          <Logo />
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-wide text-stone-500">{variant} portal</p>
      </div>
      <nav className="flex flex-col p-2 text-sm">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("rounded-md px-3 py-1.5", active ? "bg-sand font-medium" : "text-stone-600 hover:bg-stone-50")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
