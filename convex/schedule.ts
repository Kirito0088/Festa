import { v } from "convex/values";
import { LIMITS } from "../lib/constants";
import { isScheduleTime, scheduleSortKey } from "../lib/plan/run-sheet";
import { mutation, query } from "./_generated/server";
import { logActivity, requireOwnedDoc, requireOwnedEvent, touchEvent } from "./lib/access";
import { cleanLongText, cleanText, invalid } from "./lib/input";
import { limitWrites } from "./lib/rateLimits";
import schema from "./schema";

function cleanTime(value: string): string {
  const time = value.trim();
  if (!isScheduleTime(time)) throw invalid("Use a 24-hour time such as 18:30.");
  return time;
}

/** The day's run sheet, in the order it happens (late-night items last). */
export const list = query({
  args: { eventId: v.id("events") },
  returns: v.array(schema.doc("scheduleItems")),
  handler: async (ctx, args) => {
    await requireOwnedEvent(ctx, args.eventId);
    const items = await ctx.db
      .query("scheduleItems")
      .withIndex("by_eventId_and_time", (q) => q.eq("eventId", args.eventId))
      .take(LIMITS.scheduleMax);
    return items.toSorted((a, b) => scheduleSortKey(a.time).localeCompare(scheduleSortKey(b.time)));
  },
});

export const create = mutation({
  args: { eventId: v.id("events"), time: v.string(), title: v.string(), notes: v.string() },
  returns: v.id("scheduleItems"),
  handler: async (ctx, args) => {
    const { userId, event } = await requireOwnedEvent(ctx, args.eventId);
    await limitWrites(ctx, userId);
    // `list` returns at most this many, so a longer sheet would hide its latest moments.
    const existing = await ctx.db
      .query("scheduleItems")
      .withIndex("by_eventId_and_time", (q) => q.eq("eventId", event._id))
      .take(LIMITS.scheduleMax);
    if (existing.length >= LIMITS.scheduleMax) {
      throw invalid(`The day's schedule holds up to ${LIMITS.scheduleMax} moments. Remove one first.`);
    }
    const title = cleanText(args.title, "Title", LIMITS.nameMax, true);
    const id = await ctx.db.insert("scheduleItems", {
      eventId: event._id,
      ownerId: event.ownerId,
      time: cleanTime(args.time),
      title,
      notes: cleanLongText(args.notes, "Notes", 1000),
      source: "user",
    });
    await logActivity(ctx, event, "task", `Added “${title}” to the day's schedule`);
    await touchEvent(ctx, event);
    return id;
  },
});

export const update = mutation({
  args: {
    itemId: v.id("scheduleItems"),
    time: v.optional(v.string()),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "scheduleItems", args.itemId);
    const patch: { time?: string; title?: string; notes?: string } = {};
    if (args.time !== undefined) patch.time = cleanTime(args.time);
    if (args.title !== undefined) patch.title = cleanText(args.title, "Title", LIMITS.nameMax, true);
    if (args.notes !== undefined) patch.notes = cleanLongText(args.notes, "Notes", 1000);
    await ctx.db.patch("scheduleItems", doc._id, patch);
    await logActivity(ctx, event, "task", `Updated “${patch.title ?? doc.title}” on the day's schedule`);
    await touchEvent(ctx, event);
    return null;
  },
});

export const remove = mutation({
  args: { itemId: v.id("scheduleItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "scheduleItems", args.itemId);
    await ctx.db.delete("scheduleItems", doc._id);
    await logActivity(ctx, event, "task", `Removed “${doc.title}” from the day's schedule`);
    await touchEvent(ctx, event);
    return null;
  },
});
