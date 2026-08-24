export type ChatMessage = { role: "bot" | "user"; text: string };

/**
 * General-purpose Katalyst assistant. Not a performance coach.
 * Replace `chatbotReply` with an LLM later.
 */
export async function chatbotReply(prompt: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 350));
  const p = prompt.toLowerCase();
  if (p.includes("due") || p.includes("deadline") || p.includes("this week")) {
    return "Open My Learning or Explore and sort by due date. Mandatory items with a due date in the next 7 days appear on your dashboard under Upcoming Deadlines. Mentoring and training can be moved via Reschedule.";
  }
  if (p.includes("xp") || p.includes("earn")) {
    return "XP comes from completing activities, streak bonuses, and approved submissions. Harder and mandatory work awards more. After an admin approves your work, XP hits your profile and the leaderboard.";
  }
  if (p.includes("reschedule") || p.includes("mentor")) {
    return "Go to Reschedule, pick a mentoring or training session you are enrolled in, choose an open slot, and confirm. Changes notify programme staff. Mentoring itself lives under My Learning → Mentoring.";
  }
  if (p.includes("course") && p.includes("next")) {
    return "If Payments Studio is done, Trust & Security Fundamentals is the usual next mandatory course. Product Discovery Lab is a strong optional follow-on. The AI Coach can personalise this; I only explain the catalogue.";
  }
  if (p.includes("leaderboard")) {
    return "Leaderboards rank students by XP. Switch Global, Weekly, Monthly, or Team on the Leaderboard page. Team boards use combined squad XP. Ties break by recency of activity.";
  }
  if (p.includes("complaint") || p.includes("feedback")) {
    return "Feedback is for product/learning comments (rating + message). Complaints are tracked tickets with priority and status. Emergency Help is only for urgent wellbeing or safety issues — do not file those as ordinary complaints.";
  }
  if (p.includes("team")) {
    return "Teams have five roles: Frontend, Backend, Database, QA, and Product Analyst. Open Teams to see XP, rank, and contribution. Project work is marked individual vs team on each activity.";
  }
  if (p.includes("achievement") || p.includes("mission") || p.includes("badge")) {
    return "Achievements unlock from behaviour (first enrolment, streaks, courses, projects). Missions are time-boxed goals such as three activities this week. Both live under Gamification.";
  }
  if (p.includes("where") || p.includes("navigate") || p.includes("how do i")) {
    return "Student portal: Dashboard, My Learning, Explore, Gamification, Teams, AI Coach, Chatbot, Notifications, Profile. Admin portal is a separate login. Use the sidebar or the language/voice controls in the top bar.";
  }
  return "I can help with Katalyst navigation: courses, training, assignments, deadlines, mentoring, milestones, XP, achievements, teams, complaints, feedback, rescheduling, and programme basics. For personalised scoring and next-activity advice, use AI Coach.";
}

export const suggestedPrompts = [
  "What activities are due this week?",
  "How can I earn more XP?",
  "How do I reschedule my mentoring session?",
  "What courses should I take next?",
  "How does the leaderboard work?",
];

export type LiveChatbotReply = {
  reply: string;
  intent?: string;
  source: "live" | "guardrail_blocked" | "offline_fallback" | "signed_out";
};

/**
 * Calls the REAL chatbot: app/api/chatbot/route.ts -> backend/api's guarded
 * /api/ai/chatbot/message -> Gemini, with real actions (enroll, submit
 * feedback/complaints, reschedule, draft a course, ...) executed
 * server-side against the signed-in user's own data - see
 * services/ai/chatbotService.js. Falls back to the local canned
 * `chatbotReply` only when signed out or the backend is unreachable, never
 * when the backend deliberately blocked the message.
 */
export async function chatbotReplyLive(prompt: string): Promise<LiveChatbotReply> {
  let res: Response;
  try {
    res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });
  } catch {
    return { reply: await chatbotReply(prompt), source: "offline_fallback" };
  }

  const body = await res.json().catch(() => null);

  if (res.status === 401) {
    return { reply: await chatbotReply(prompt), source: "signed_out" };
  }
  if (res.status === 503 && body?.offline) {
    return { reply: await chatbotReply(prompt), source: "offline_fallback" };
  }
  if (!body?.success) {
    return {
      reply: body?.message ?? "Your message was blocked by AI safety guardrails.",
      source: "guardrail_blocked",
    };
  }
  return { reply: body.data.reply as string, intent: body.data.intent as string, source: "live" };
}
