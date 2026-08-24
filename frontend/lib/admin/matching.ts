import type { StudentProfile } from "@/lib/types";

const BUCKETS: Record<string, string[]> = {
  Frontend: ["React", "Figma", "Communication", "Writing"],
  Backend: ["Java", "Git", "DSA", "System Design", "Python"],
  Data: ["SQL", "Python", "Excel", "Research"],
  Quality: ["Testing"],
  Product: ["Leadership", "Storytelling", "Research", "Figma"],
};

export function skillBuckets(skills: string[]) {
  return Object.entries(BUCKETS)
    .filter(([, tags]) => tags.some((tag) => skills.includes(tag)))
    .map(([name]) => name);
}

export function complementaryPair(a: StudentProfile, b: StudentProfile) {
  const left = skillBuckets(a.skills);
  const right = skillBuckets(b.skills);
  const uniqueLeft = left.filter((x) => !right.includes(x));
  const uniqueRight = right.filter((x) => !left.includes(x));
  if (!uniqueLeft.length || !uniqueRight.length) return null;
  return {
    label: `${uniqueLeft[0]} ↔ ${uniqueRight[0]}`,
    left: uniqueLeft,
    right: uniqueRight,
  };
}

export function suggestPairs(profiles: StudentProfile[]) {
  const out: { a: string; b: string; label: string }[] = [];
  for (let i = 0; i < profiles.length; i += 1) {
    for (let j = i + 1; j < profiles.length; j += 1) {
      const left = profiles[i];
      const right = profiles[j];
      if (!left || !right) continue;
      const match = complementaryPair(left, right);
      if (match) out.push({ a: left.userId, b: right.userId, label: match.label });
    }
  }
  return out.slice(0, 12);
}
