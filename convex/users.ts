import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

/** The signed-in user's public profile, or `null` when signed out. */
export const me = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      name: v.union(v.string(), v.null()),
      email: v.union(v.string(), v.null()),
      isDemo: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get("users", userId);
    if (!user) return null;
    return {
      name: user.name ?? null,
      email: user.email ?? null,
      isDemo: user.isAnonymous === true,
    };
  },
});
