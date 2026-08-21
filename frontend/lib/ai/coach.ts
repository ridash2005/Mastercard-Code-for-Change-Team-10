import type { Activity, StudentProfile } from "@/lib/types";

export type CoachContext = {
  name: string;
  xp: number;
  streak: number;
  rank: number;
  completion: number;
  pendingTitles: string[];
  overdueTitles: string[];
  completedCount: number;
  interests: string[];
  atRisk: boolean;
};

/**
 * Personalised learning coach. Mocked for demo; swap `coachReply` for an LLM later.
 */
export function buildCoachContext(
  name: string,
  profile: StudentProfile,
  activities: Activity[],
  rank: number,
  completion: number,
  pendingTitles: string[],
  overdueTitles: string[],
  completedCount: number,
): CoachContext {
  return {
    name,
    xp: profile.xp,
    streak: profile.streak,
    rank,
    completion,
    pendingTitles,
    overdueTitles,
    completedCount,
    interests: profile.interests,
    atRisk: profile.atRisk || profile.inactive,
  };
}

export async function coachReply(prompt: string, ctx: CoachContext): Promise<string> {
  await new Promise((r) => setTimeout(r, 400));
  const p = prompt.toLowerCase();
  const next = ctx.pendingTitles[0] ?? "Trust & Security Fundamentals";
  if (p.includes("gap") || p.includes("weak")) {
    return `${ctx.name}, your completion sits at ${ctx.completion}%. The visible gap is unfinished security and SQL work — not DSA. Close “${next}” before adding optional studios.`;
  }
  if (p.includes("score") || p.includes("review") || p.includes("feedback")) {
    return `Your last approved work scored well on structure. If a piece is still under review, wait for faculty notes rather than rewriting blindly. Suggested next score target: 85+ on the SQL narrative.`;
  }
  if (p.includes("inactive") || p.includes("nudge") || ctx.atRisk) {
    return ctx.atRisk
      ? `You have been quiet relative to Nexus. A 25-minute pass on “${next}” today restarts the streak (currently ${ctx.streak}) and removes the at-risk flag used by programme staff.`
      : `Streak is ${ctx.streak}. A short module today is enough — no need to grind.`;
  }
  if (p.includes("recommend") || p.includes("next") || p.includes("should")) {
    return `Given ${ctx.xp} XP, rank #${ctx.rank}, and interests in ${ctx.interests.join(" · ") || "general engineering"}, I would do this order: 1) ${next} 2) Career Story mentoring 3) a slice of Inclusion Wallet. Optional Product Discovery Lab only after Trust is in progress.`;
  }
  if (ctx.overdueTitles.length) {
    return `Overdue: ${ctx.overdueTitles.join(", ")}. Treat those before any new Explore enrolments. Then return to ${next}.`;
  }
  return `Hello ${ctx.name}. ${ctx.completedCount} activities are done, ${ctx.pendingTitles.length} still open. Next move: ${next}. Ask me about gaps, scoring, or a weekly plan — I will not replace the general chatbot for navigation.`;
}

export const coachPrompts = [
  "What should I do next?",
  "Where are my learning gaps?",
  "Review my recent performance.",
  "Nudge me if I am slipping.",
];
