import { v } from "convex/values";
import { LIMITS } from "../lib/constants";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { logActivity, requireOwnedDoc, requireOwnedEvent, touchEvent } from "./lib/access";
import { requireRoomFor } from "./lib/caps";
import { limitWrites } from "./lib/rateLimits";
import { cleanDate, cleanLongText, cleanOffsetDays, cleanText, invalid } from "./lib/input";
import { vCategory, vDueMode, vPriority } from "./lib/validators";
import schema from "./schema";

type DueFields = Pick<Doc<"tasks">, "dueMode" | "offsetDays" | "dueDate">;

function cleanDue(dueMode: Doc<"tasks">["dueMode"], offsetDays?: number, dueDate?: string): DueFields {
  if (dueMode === "relative") {
    if (offsetDays === undefined) throw invalid("Choose how long before the event this is due.");
    return { dueMode, offsetDays: cleanOffsetDays(offsetDays), dueDate: undefined };
  }
  if (dueMode === "fixed") {
    if (!dueDate) throw invalid("Choose a due date.");
    return { dueMode, dueDate: cleanDate(dueDate, "Due date"), offsetDays: undefined };
  }
  return { dueMode: "none", offsetDays: undefined, dueDate: undefined };
}

export const list = query({
  args: { eventId: v.id("events") },
  returns: v.array(schema.doc("tasks")),
  handler: async (ctx, args) => {
    await requireOwnedEvent(ctx, args.eventId);
    return await ctx.db
      .query("tasks")
      .withIndex("by_eventId_and_order", (q) => q.eq("eventId", args.eventId))
      .take(LIMITS.listMax);
  },
});

export const create = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    notes: v.string(),
    category: vCategory,
    priority: vPriority,
    dueMode: vDueMode,
    offsetDays: v.optional(v.number()),
    dueDate: v.optional(v.string()),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const { userId, event } = await requireOwnedEvent(ctx, args.eventId);
    await limitWrites(ctx, userId);
    await requireRoomFor(ctx, "tasks", event._id);
    const title = cleanText(args.title, "Title", LIMITS.nameMax, true);
    const last = await ctx.db
      .query("tasks")
      .withIndex("by_eventId_and_order", (q) => q.eq("eventId", event._id))
      .order("desc")
      .first();
    const id = await ctx.db.insert("tasks", {
      eventId: event._id,
      ownerId: event.ownerId,
      title,
      notes: cleanLongText(args.notes, "Notes", 1000),
      category: args.category,
      priority: args.priority,
      ...cleanDue(args.dueMode, args.offsetDays, args.dueDate),
      completed: false,
      order: (last?.order ?? 0) + 1000,
      source: "user",
    });
    await logActivity(ctx, event, "task", `Added task “${title}”`);
    await touchEvent(ctx, event);
    return id;
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    category: v.optional(vCategory),
    priority: v.optional(vPriority),
    dueMode: v.optional(vDueMode),
    offsetDays: v.optional(v.number()),
    dueDate: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "tasks", args.taskId);
    const patch: Partial<Doc<"tasks">> = {};
    if (args.title !== undefined) patch.title = cleanText(args.title, "Title", LIMITS.nameMax, true);
    if (args.notes !== undefined) patch.notes = cleanLongText(args.notes, "Notes", 1000);
    if (args.category !== undefined) patch.category = args.category;
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.dueMode !== undefined)
      Object.assign(patch, cleanDue(args.dueMode, args.offsetDays, args.dueDate));
    await ctx.db.patch("tasks", doc._id, patch);
    await logActivity(ctx, event, "task", `Updated task “${patch.title ?? doc.title}”`);
    await touchEvent(ctx, event);
    return null;
  },
});

export const setCompleted = mutation({
  args: { taskId: v.id("tasks"), completed: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "tasks", args.taskId);
    if (doc.completed === args.completed) return null;
    await ctx.db.patch("tasks", doc._id, {
      completed: args.completed,
      completedAt: args.completed ? Date.now() : undefined,
    });
    await logActivity(ctx, event, "task", `${args.completed ? "Completed" : "Reopened"} “${doc.title}”`);
    await touchEvent(ctx, event);
    return null;
  },
});

/** Persists a drag-and-drop order. Every ID must belong to the event. */
export const reorder = mutation({
  args: { eventId: v.id("events"), orderedIds: v.array(v.id("tasks")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { event, userId } = await requireOwnedEvent(ctx, args.eventId);
    if (args.orderedIds.length > LIMITS.listMax) throw invalid("Too many tasks to reorder at once.");
    for (const [index, taskId] of args.orderedIds.entries()) {
      const task = await ctx.db.get("tasks", taskId);
      if (!task || task.eventId !== event._id || task.ownerId !== userId) {
        throw invalid("One of the tasks no longer exists. Refresh and try again.");
      }
      const order = (index + 1) * 1000;
      if (task.order !== order) await ctx.db.patch("tasks", taskId, { order });
    }
    return null;
  },
});

export const remove = mutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "tasks", args.taskId);
    await ctx.db.delete("tasks", doc._id);
    await logActivity(ctx, event, "task", `Removed task “${doc.title}”`);
    await touchEvent(ctx, event);
    return null;
  },
});
