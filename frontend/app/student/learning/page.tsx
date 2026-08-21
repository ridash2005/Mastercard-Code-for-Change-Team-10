"use client";

import Link from "next/link";

const items = [
  ["/student/learning/courses", "Online courses"],
  ["/student/learning/training", "Training sessions"],
  ["/student/learning/mentoring", "Mentoring"],
  ["/student/learning/projects", "Projects"],
  ["/student/learning/assignments", "Assignments"],
  ["/student/learning/milestones", "Milestones"],
  ["/student/extracurricular", "Extra-curricular"],
];

export default function LearningHub() {
  return (
    <div>
      <h1 className="font-serif text-3xl">My Learning</h1>
      <p className="mt-1 text-sm text-stone-600">
        Certificate courses, clinics, coaching, projects, assignments, milestones and extra-curricular tracks.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block rounded-xl border bg-white p-4 hover:border-forest">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
