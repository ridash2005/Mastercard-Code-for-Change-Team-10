import type { Role } from "@/lib/types";

/** Seeded demo accounts for the login page's one-click buttons - real
 * backend/api accounts (see backend/api/scripts/seed.js), not mock data. */
export const demoAccounts: { name: string; email: string; role: Role }[] = [
  { name: "Ananya Munshi", email: "ananya@katalyst.edu", role: "student" },
  { name: "Isha Verma", email: "isha@katalyst.edu", role: "student" },
  { name: "Priya Sharma", email: "priya.admin@katalyst.edu", role: "admin" },
  { name: "Arjun Desai", email: "arjun.admin@katalyst.edu", role: "admin" },
];

export const AUTH_PROVIDER = "backend-jwt" as const;
