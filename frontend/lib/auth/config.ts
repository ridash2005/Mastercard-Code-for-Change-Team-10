/**
 * Auth.js/NextAuth-ready configuration stub. Real auth (bcrypt + JWT) lives
 * in backend/api - see app/api/auth/{register,login,logout,me}/route.ts.
 * This config isn't currently read anywhere; it documents the intended
 * shape for a future Auth.js swap-in without changing route/middleware
 * contracts.
 */
export const authConfig = {
  provider: "backend-jwt" as const,
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ role, path }: { role?: string; path: string }) => {
      if (path.startsWith("/student")) return role === "student";
      if (path.startsWith("/admin")) return role === "admin";
      return true;
    },
  },
};
