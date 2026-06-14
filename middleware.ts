import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Protect dashboard routes
    "/(dashboard)(.*)",
    // Skip auth routes, API routes, static files
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};


