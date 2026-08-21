/**
 * Auth.js/NextAuth-ready configuration stub.
 * Mock login lives in the platform store and never stores passwords.
 */
export const authConfig = {
  provider: "mock" as const,
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ role, path }: { role?: string; path: string }) => {
      if (path.startsWith("/student")) return role === "student";
      if (path.startsWith("/admin")) return role === "admin";
      return true;
    },
  },
};
