import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

/**
 * Authentication configuration using NextAuth (Auth.js v5).
 *
 * Configures database session handling with Prisma, Google OAuth provider,
 * session callbacks, and custom authentication route overrides.
 *
 * Exported utilities:
 * - `handlers`: Route handlers (GET/POST) for `/api/auth/[...nextauth]`
 * - `auth`: Universal session helper for Server Components, Route Handlers, and Middleware
 * - `signIn`: Helper function to initiate sign-in flows (e.g. in Server Actions)
 * - `signOut`: Helper function to terminate user sessions
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use Prisma adapter to persist users, accounts, and sessions in the database
  adapter: PrismaAdapter(prisma),

  // Configure OAuth authentication providers
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  // Callbacks to customize authentication lifecycle events
  callbacks: {
    /**
     * Enhances the session object with the database user ID.
     * When using a database adapter (Prisma), `user` is passed from the database.
     */
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },

  // Custom pages to override NextAuth's default UI
  pages: {
    signIn: "/auth/signin", // Route for custom sign-in page
  },
});
