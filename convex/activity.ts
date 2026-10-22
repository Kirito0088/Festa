import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireOwnedEvent } from "./lib/access";
import schema from "./schema";

export const recent = query({
  args: { eventId: v.id("events"), limit: v.optional(v.number()) },
  returns: v.array(schema.doc("activity")),
  handler: async (ctx, args) => {
    await requireOwnedEvent(ctx, args.eventId);
    const limit = Math.min(Math.max(1, Math.floor(args.limit ?? 10)), 50);
    return await ctx.db
      .query("activity")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(limit);
  },
});
