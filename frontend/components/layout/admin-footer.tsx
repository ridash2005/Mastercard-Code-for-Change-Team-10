import Link from "next/link";

const columns = [
  {
    heading: "Programme",
    links: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/activities", label: "Activities" },
      { href: "/admin/students", label: "Students" },
    ],
  },
  {
    heading: "Insights",
    links: [
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/completion", label: "Activity Completion" },
      { href: "/admin/reviews", label: "Student Reviews" },
    ],
  },
  {
    heading: "Operations",
    links: [
      { href: "/admin/submissions", label: "Submissions" },
      { href: "/admin/escalations", label: "Escalations" },
      { href: "/admin/matching", label: "Collaborator Matching" },
      { href: "/admin/volunteers", label: "Volunteers" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/admin/notifications", label: "Notifications" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

export function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-card px-4 py-8 md:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.heading}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{col.heading}</p>
            <ul className="mt-2 space-y-1.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-plum hover:text-barbie">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
