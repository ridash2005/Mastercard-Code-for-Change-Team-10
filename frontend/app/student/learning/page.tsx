"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import type { en } from "@/lib/i18n/dictionaries";

export default function LearningHub() {
  const { t } = useI18n();
  const items: { href: string; key: keyof typeof en }[] = [
    { href: "/student/learning/courses", key: "onlineCourses" },
    { href: "/student/learning/training", key: "trainingSessions" },
    { href: "/student/learning/mentoring", key: "mentoring" },
    { href: "/student/learning/projects", key: "projects" },
    { href: "/student/learning/assignments", key: "assignments" },
    { href: "/student/learning/milestones", key: "milestones" },
    { href: "/student/extracurricular", key: "extracurricular" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">{t.myLearning}</h1>
      <p className="mt-1 text-sm text-muted">{t.learningHubSubtitle}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map(({ href, key }) => (
          <li key={href}>
            <Link href={href} className="k-card block p-4">
              {t[key]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
