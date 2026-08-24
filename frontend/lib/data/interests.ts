export const INTEREST_OPTIONS = [
  { id: "finance", label: "Finance & Payments" },
  { id: "business", label: "Business & Entrepreneurship" },
  { id: "technology", label: "Technology & Software" },
  { id: "data", label: "Data & Analytics" },
  { id: "ai-ml", label: "Artificial Intelligence & Machine Learning" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "product", label: "Product Management" },
  { id: "marketing", label: "Marketing & Communications" },
  { id: "design", label: "Design & UX" },
  { id: "consulting", label: "Consulting & Strategy" },
  { id: "leadership", label: "Leadership & Management" },
  { id: "social-impact", label: "Social Impact & Nonprofit" },
  { id: "economics", label: "Economics" },
  { id: "research", label: "Research & Innovation" },
  { id: "operations", label: "Operations & Project Management" },
] as const;

export type InterestId = (typeof INTEREST_OPTIONS)[number]["id"];

const KNOWN_IDS = new Set<string>(INTEREST_OPTIONS.map((o) => o.id));

const LEGACY_INTEREST_MAP: Record<string, InterestId> = {
  "Software Development": "technology",
  "Product Management": "product",
  "Data Science": "data",
  "AI / ML": "ai-ml",
  "UI/UX Design": "design",
  "Cloud Computing": "technology",
  Finance: "finance",
  Consulting: "consulting",
  Cybersecurity: "cybersecurity",
  Entrepreneurship: "business",
  Marketing: "marketing",
  Communication: "marketing",
};

export function interestLabel(id: string) {
  return INTEREST_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

/** Maps legacy display names to slugs; keeps unknown values so old profiles still work. */
export function normalizeInterestIds(values: string[]) {
  const next: string[] = [];
  for (const raw of values) {
    const id = LEGACY_INTEREST_MAP[raw] ?? raw;
    if (id && !next.includes(id)) next.push(id);
  }
  return next;
}

export function isKnownInterestId(id: string): id is InterestId {
  return KNOWN_IDS.has(id);
}
