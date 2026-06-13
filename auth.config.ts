import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

// Edge-safe config: providers + callbacks only, NO database adapter.
// Imported by middleware (runs on edge) and extended in auth.ts (Node).
export default {
  pages: { signIn: "/sign-in" },
  providers: [GitHub, Google],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/notes") ||
        nextUrl.pathname.startsWith("/settings");

      if (isProtected) return isLoggedIn;
      // Bounce authenticated users away from the auth pages.
      if (isLoggedIn && nextUrl.pathname.startsWith("/sign-in")) {
        return Response.redirect(new URL("/notes", nextUrl));
      }
      return true;
    }
  }
} satisfies NextAuthConfig;
