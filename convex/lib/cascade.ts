import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Deletes an event and every record that belongs to it. */
export async function deleteEventCascade(ctx: MutationCtx, eventId: Id<"events">): Promise<void> {
  for await (const doc of ctx.db
    .query("budgetItems")
    .withIndex("by_eventId", (q) => q.eq("eventId", eventId))) {
    await ctx.db.delete("budgetItems", doc._id);
  }
  for await (const doc of ctx.db
    .query("tasks")
    .withIndex("by_eventId_and_order", (q) => q.eq("eventId", eventId))) {
    await ctx.db.delete("tasks", doc._id);
  }
  for await (const doc of ctx.db.query("vendors").withIndex("by_eventId", (q) => q.eq("eventId", eventId))) {
    await ctx.db.delete("vendors", doc._id);
  }
  for await (const doc of ctx.db
    .query("moodboardItems")
    .withIndex("by_eventId", (q) => q.eq("eventId", eventId))) {
    await ctx.db.delete("moodboardItems", doc._id);
  }
  for await (const doc of ctx.db
    .query("conciergeMessages")
    .withIndex("by_eventId", (q) => q.eq("eventId", eventId))) {
    await ctx.db.delete("conciergeMessages", doc._id);
  }
  for await (const doc of ctx.db
    .query("scheduleItems")
    .withIndex("by_eventId_and_time", (q) => q.eq("eventId", eventId))) {
    await ctx.db.delete("scheduleItems", doc._id);
  }
  for await (const doc of ctx.db.query("activity").withIndex("by_eventId", (q) => q.eq("eventId", eventId))) {
    await ctx.db.delete("activity", doc._id);
  }
  for await (const doc of ctx.db
    .query("blueprints")
    .withIndex("by_eventId", (q) => q.eq("eventId", eventId))) {
    await ctx.db.delete("blueprints", doc._id);
  }
  await ctx.db.delete("events", eventId);
}
