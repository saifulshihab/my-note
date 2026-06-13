import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Next.js 16 proxy convention (formerly middleware). Uses the adapter-free
// config so Prisma stays out of the edge bundle. NextAuth's wrapper enforces
// the `authorized` callback in auth.config.ts.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sign-in).*)"]
};
