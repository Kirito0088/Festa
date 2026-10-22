import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

/**
 * Two free, self-hosted sign-in methods:
 * - Password: a private account (email + password, hashed by Convex Auth).
 * - Anonymous: a throwaway demo session seeded with sample data, isolated
 *   from every other user by the same ownership checks.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? "")
          .trim()
          .toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
          throw new ConvexError("Enter a valid email address.");
        }
        const name = String(params.name ?? "")
          .trim()
          .slice(0, 80);
        const profile: { email: string; name?: string } = { email };
        if (name) profile.name = name;
        return profile as { email: string };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 8 || password.length > 128) {
          throw new ConvexError("Use a password between 8 and 128 characters.");
        }
      },
    }),
    Anonymous,
  ],
});
