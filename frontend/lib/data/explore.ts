import type { Activity } from "@/lib/types";
import { normalizeInterestIds } from "@/lib/data/interests";

export type ExploreChip = "all" | "recommended" | "finance" | "technology" | "business" | "design" | "ai-data";

export const EXPLORE_CHIPS: { id: ExploreChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "recommended", label: "Recommended for You" },
  { id: "finance", label: "Finance" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "design", label: "Design" },
  { id: "ai-data", label: "AI & Data" },
];

/** Maps discovery chips to existing activity domain / problem-domain fields. */
export function matchesExploreChip(activity: Activity, chip: ExploreChip) {
  if (chip === "all" || chip === "recommended") return true;
  if (chip === "finance") {
    return (
      activity.domain === "Payments & Trust" ||
      activity.problemDomain === "Digital Payments" ||
      activity.problemDomain === "Financial Inclusion"
    );
  }
  if (chip === "technology") {
    return activity.domain === "Software Engineering" || activity.problemDomain === "Cybersecurity";
  }
  if (chip === "business") {
    return activity.domain === "Product" || activity.domain === "Leadership";
  }
  if (chip === "design") {
    return activity.domain === "Communication";
  }
  return activity.domain === "Data & AI";
}

export function matchesStudentInterest(activity: Activity, interestId: string) {
  switch (interestId) {
    case "finance":
    case "economics":
      return matchesExploreChip(activity, "finance");
    case "technology":
      return activity.domain === "Software Engineering";
    case "cybersecurity":
      return activity.problemDomain === "Cybersecurity" || activity.domain === "Software Engineering";
    case "business":
    case "consulting":
    case "operations":
    case "leadership":
      return activity.domain === "Leadership" || activity.domain === "Product";
    case "product":
      return activity.domain === "Product";
    case "design":
    case "marketing":
      return activity.domain === "Communication";
    case "data":
    case "ai-ml":
    case "research":
      return activity.domain === "Data & AI";
    case "social-impact":
      return (
        activity.problemDomain === "Women in STEM" ||
        activity.problemDomain === "Climate & Cities" ||
        activity.problemDomain === "Financial Inclusion"
      );
    default:
      return false;
  }
}

export function recommendedActivities(activities: Activity[], interests: string[], limit = 4) {
  const ids = normalizeInterestIds(interests);
  if (!ids.length) return [];
  return [...activities]
    .map((activity) => ({
      activity,
      score: ids.reduce((n, id) => n + (matchesStudentInterest(activity, id) ? 1 : 0), 0),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || b.activity.xpReward - a.activity.xpReward)
    .slice(0, limit)
    .map((row) => row.activity);
}

export function activityMatchesQuery(activity: Activity, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [activity.title, activity.description, activity.type, activity.domain, activity.category, activity.difficulty]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function formatDurationHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours === 1) return "1 hour";
  if (Number.isInteger(hours)) return `${hours} hours`;
  return `${hours} hours`;
}
