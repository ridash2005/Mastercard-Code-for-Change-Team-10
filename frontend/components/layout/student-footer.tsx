import Link from "next/link";

const columns = [
  {
    heading: "Platform",
    links: [
      { href: "/student", label: "Dashboard" },
      { href: "/student/learning", label: "My Learning" },
      { href: "/student/explore", label: "Explore" },
    ],
  },
  {
    heading: "Learning",
    links: [
      { href: "/student/learning/courses", label: "Courses" },
      { href: "/student/achievements", label: "Achievements" },
      { href: "/student/missions", label: "Missions" },
      { href: "/student/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/student/ai-coach", label: "AI Coach" },
      { href: "/student/contact", label: "Help / Support" },
      { href: "/student/feedback", label: "Feedback" },
      { href: "/student/contact", label: "Contact" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/student/profile", label: "Profile" },
      { href: "/student/settings", label: "Settings" },
      { href: "/student/notifications", label: "Notifications" },
    ],
  },
];

export function StudentFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-card px-4 py-8 md:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.heading}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-purple">{col.heading}</p>
            <ul className="mt-2 space-y-1.5">
              {col.links.map((link) => (
                <li key={`${col.heading}-${link.label}`}>
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
