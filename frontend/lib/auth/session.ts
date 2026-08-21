import type { Role } from "@/lib/types";

/** Mock session helpers. Replace with Auth.js/NextAuth without changing UI contracts. */
export const demoAccounts: { name: string; email: string; role: Role }[] = [
  { name: "Ananya Munshi", email: "ananya@katalyst.edu", role: "student" },
  { name: "Isha Verma", email: "isha@katalyst.edu", role: "student" },
  { name: "Priya Sharma", email: "priya.admin@katalyst.edu", role: "admin" },
  { name: "Arjun Desai", email: "arjun.admin@katalyst.edu", role: "admin" },
];

export const AUTH_PROVIDER = "mock" as const;
