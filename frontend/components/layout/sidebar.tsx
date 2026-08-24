"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  BookOpen,
  Bot,
  CalendarClock,
  ChevronDown,
  Compass,
  Flag,
  LayoutDashboard,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Settings,
  Sparkles,
  Trophy,
  User,
  Users,
  AlertTriangle,
  CalendarHeart,
  Handshake,
  HeartHandshake,
  ClipboardCheck,
  BarChart3,
  FileText,
  Star,
  UserRoundSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useI18n } from "@/lib/i18n/provider";
import type { en } from "@/lib/i18n/dictionaries";
import { StreakCalendar } from "@/components/layout/streak-calendar";
import { usePlatform } from "@/lib/data/platform-store";

type StudentNavKey = keyof typeof en;

export const studentGroups: { id: string; heading: string; items: { href: string; key?: StudentNavKey; label?: string; icon: LucideIcon }[] }[] = [
  {
    id: "main",
    heading: "MAIN",
    items: [
      { href: "/student", key: "dashboard", icon: LayoutDashboard },
      { href: "/student/learning", key: "myLearning", icon: BookOpen },
      { href: "/student/explore", key: "explore", icon: Compass },
    ],
  },
  {
    id: "progress",
    heading: "PROGRESS",
    items: [
      { href: "/student/achievements", key: "achievements", icon: Award },
      { href: "/student/missions", key: "missions", icon: Flag },
      { href: "/student/leaderboard", key: "leaderboard", icon: Trophy },
    ],
  },
  {
    id: "community",
    heading: "COMMUNITY",
    items: [
      { href: "/student/teams", key: "teams", icon: Users },
      { href: "/student/ai-coach", key: "aiCoach", icon: Bot },
      { href: "/student/chatbot", key: "chatbot", icon: MessageCircle },
    ],
  },
  {
    id: "activity",
    heading: "ACTIVITY",
    items: [
      { href: "/student/notifications", key: "notifications", icon: Bell },
      { href: "/student/extracurricular", key: "extracurricular", icon: CalendarHeart },
      { href: "/student/reschedule", key: "reschedule", icon: CalendarClock },
    ],
  },
  {
    id: "account",
    heading: "ACCOUNT",
    items: [
      { href: "/student/profile", key: "profile", icon: User },
      { href: "/student/settings", key: "settings", icon: Settings },
    ],
  },
  {
    id: "support",
    heading: "SUPPORT",
    items: [
      { href: "/student/feedback", key: "feedback", icon: MessageSquare },
      { href: "/student/complaints", key: "complaints", icon: AlertTriangle },
      { href: "/student/contact", key: "contact", icon: Phone },
      { href: "/student/emergency", key: "emergency", icon: LifeBuoy },
    ],
  },
];

const adminGroups: { id: string; heading: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    id: "main",
    heading: "MAIN",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/activities", label: "Activities", icon: BookOpen },
      { href: "/admin/activities/create", label: "Create activity", icon: Sparkles },
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
    ],
  },
  {
    id: "programme",
    heading: "PROGRAMME",
    items: [
      { href: "/admin/training", label: "Training", icon: Flag },
      { href: "/admin/mentoring", label: "Mentoring", icon: Users },
      { href: "/admin/projects", label: "Projects", icon: Compass },
      { href: "/admin/assignments", label: "Assignments", icon: Award },
      { href: "/admin/milestones", label: "Milestones", icon: Trophy },
    ],
  },
  {
    id: "students",
    heading: "STUDENTS",
    items: [
      { href: "/admin/students", label: "Students", icon: User },
      { href: "/admin/teams", label: "Teams", icon: Users },
      { href: "/admin/leaderboards", label: "Leaderboards", icon: Trophy },
      { href: "/admin/matching", label: "Compatibility / Collaborators", icon: Handshake },
      { href: "/admin/attention", label: "Students Requiring Attention", icon: UserRoundSearch },
    ],
  },
  {
    id: "insights",
    heading: "INSIGHTS",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/reports", label: "Reports", icon: FileText },
      { href: "/admin/completion", label: "Activity Completion", icon: ClipboardCheck },
      { href: "/admin/reviews", label: "Student Reviews", icon: MessageSquare },
      { href: "/admin/mentors", label: "Mentor Reviews", icon: Star },
    ],
  },
  {
    id: "community",
    heading: "COMMUNITY",
    items: [
      { href: "/admin/volunteers", label: "Volunteers", icon: HeartHandshake },
      { href: "/admin/volunteer-applications", label: "Volunteer Applications", icon: ClipboardCheck },
    ],
  },
  {
    id: "activity",
    heading: "ACTIVITY",
    items: [
      { href: "/admin/submissions", label: "Submissions", icon: MessageSquare },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/escalations", label: "Escalations", icon: AlertTriangle },
    ],
  },
  {
    id: "account",
    heading: "ACCOUNT",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

function isRouteActive(pathname: string, href: string) {
  if (href === "/student" || href === "/admin") return pathname === href;
  if (href === "/admin/activities") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupForPath(pathname: string, variant: "student" | "admin") {
  const groups = variant === "student" ? studentGroups : adminGroups;
  return groups.find((g) => g.items.some((i) => isRouteActive(pathname, i.href)))?.id ?? "main";
}

function StudentNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const activeGroup = groupForPath(pathname, "student");
  const [open, setOpen] = useState<Record<string, boolean>>({ main: true });

  return (
    <nav className={cn("flex flex-col gap-0.5 p-3", collapsed && "px-1.5")}>
      {studentGroups.map((group) => {
        // Falls back to "is this the group containing the active route" so the
        // active group auto-expands on navigation, while an explicit manual
        // toggle (stored in `open`) always wins.
        const expanded = collapsed || (open[group.id] ?? group.id === activeGroup);
        return (
          <div key={group.id}>
            {collapsed ? null : (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left"
              >
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-purple">{group.heading}</span>
                <ChevronDown className={cn("h-4 w-4 text-purple transition-transform", expanded ? "rotate-0" : "-rotate-90")} aria-hidden />
              </button>
            )}
            <div className={cn("grid transition-[grid-template-rows] duration-200", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <div className="flex flex-col gap-px pb-1 pt-0.5">
                  {group.items.map((item) => (
                    <SideLink
                      key={item.href}
                      href={item.href}
                      label={item.label ?? t[item.key!]}
                      icon={item.icon}
                      active={isRouteActive(pathname, item.href)}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function AdminNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeGroup = groupForPath(pathname, "admin");
  const [open, setOpen] = useState<Record<string, boolean>>({ main: true });

  return (
    <nav className={cn("flex flex-col gap-0.5 p-3 pb-8", collapsed && "px-1.5")}>
      {adminGroups.map((group) => {
        const expanded = collapsed || (open[group.id] ?? group.id === activeGroup);
        return (
          <div key={group.id}>
            {collapsed ? null : (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left"
              >
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-purple">{group.heading}</span>
                <ChevronDown className={cn("h-4 w-4 text-purple transition-transform", expanded ? "rotate-0" : "-rotate-90")} aria-hidden />
              </button>
            )}
            <div className={cn("grid transition-[grid-template-rows] duration-200", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <div className="flex flex-col gap-px pb-1 pt-0.5">
                  {group.items.map((item) => (
                    <SideLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isRouteActive(pathname, item.href)}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  variant,
  collapsed = false,
  onToggleCollapsed,
}: {
  variant: "student" | "admin";
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const profile = usePlatform((s) => s.studentProfiles.find((p) => p.userId === s.sessionUserId));

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-line bg-card md:flex",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[4.25rem]" : "w-64",
      )}
    >
      <div className={cn("sticky top-0 z-10 bg-card py-5", collapsed ? "px-2" : "px-4")}>
        <Link href={variant === "student" ? "/student" : "/admin"} className="block">
          {collapsed ? <span className="block text-center font-serif text-xl font-semibold text-plum">K</span> : <Logo />}
        </Link>
        {collapsed ? null : (
          <p className="mt-1.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-purple">{variant} portal</p>
        )}
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-sm text-purple hover:bg-ivory"
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {collapsed ? null : <span>Collapse</span>}
          </button>
        ) : null}
      </div>
      {variant === "student" ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <StudentNav collapsed={collapsed} />
          </div>
          <div className="shrink-0 border-t border-line bg-card">
            <StreakCalendar streak={profile?.streak ?? 0} lastActiveAt={profile?.lastActiveAt} compact={collapsed} />
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNav collapsed={collapsed} />
        </div>
      )}
    </aside>
  );
}

export function StudentMobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = usePlatform((s) => s.studentProfiles.find((p) => p.userId === s.sessionUserId));
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button type="button" className="absolute inset-0 bg-navy/40" aria-label="Close menu" onClick={onClose} />
      <div className="relative flex h-full w-[min(19rem,90vw)] flex-col overflow-hidden bg-card shadow-xl" role="dialog" aria-modal="true" aria-label="Student navigation">
        <div className="shrink-0 px-4 py-5">
          <Logo />
          <button type="button" onClick={onClose} className="mt-3 text-sm font-medium text-barbie">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <StudentNav collapsed={false} onNavigate={onClose} />
        </div>
        <div className="shrink-0 border-t border-line bg-card">
          <StreakCalendar streak={profile?.streak ?? 0} lastActiveAt={profile?.lastActiveAt} />
        </div>
      </div>
    </div>
  );
}

export function AdminMobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button type="button" className="absolute inset-0 bg-navy/40" aria-label="Close menu" onClick={onClose} />
      <div className="relative flex h-full w-[min(19rem,90vw)] flex-col overflow-y-auto bg-card shadow-xl" role="dialog" aria-modal="true" aria-label="Admin navigation">
        <div className="px-4 py-5">
          <Logo />
          <button type="button" onClick={onClose} className="mt-3 text-sm font-medium text-barbie">
            Close
          </button>
        </div>
        <AdminNav collapsed={false} onNavigate={onClose} />
      </div>
    </div>
  );
}

function SideLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-2 rounded-xl py-1.5 text-[15px] transition",
        collapsed ? "justify-center px-2" : "px-3",
        active
          ? "bg-barbie font-semibold text-white shadow-[0_10px_20px_-8px_rgba(236,25,117,0.7)]"
          : "font-medium text-plum hover:bg-ivory",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-purple")} aria-hidden />
      {collapsed ? (
        <>
          <span className="sr-only">{label}</span>
          <span className="pointer-events-none absolute left-full z-30 ml-2 hidden whitespace-nowrap rounded-md bg-plum px-2 py-1 text-xs text-white group-hover:block group-focus-visible:block">
            {label}
          </span>
        </>
      ) : (
        label
      )}
    </Link>
  );
}
