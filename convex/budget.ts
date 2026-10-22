import { v } from "convex/values";
import { LIMITS } from "../lib/constants";
import { mutation, query } from "./_generated/server";
import { logActivity, requireOwnedDoc, requireOwnedEvent, touchEvent } from "./lib/access";
import { requireRoomFor } from "./lib/caps";
import { limitWrites } from "./lib/rateLimits";
import { cleanLongText, cleanMoney, cleanOptionalMoney, cleanText } from "./lib/input";
import { vCategory } from "./lib/validators";
import schema from "./schema";

export const list = query({
  args: { eventId: v.id("events") },
  returns: v.array(schema.doc("budgetItems")),
  handler: async (ctx, args) => {
    await requireOwnedEvent(ctx, args.eventId);
    return await ctx.db
      .query("budgetItems")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .take(LIMITS.listMax);
  },
});

export const create = mutation({
  args: {
    eventId: v.id("events"),
    category: vCategory,
    name: v.string(),
    estimated: v.number(),
    actual: v.union(v.number(), v.null()),
    paid: v.number(),
    notes: v.string(),
  },
  returns: v.id("budgetItems"),
  handler: async (ctx, args) => {
    const { userId, event } = await requireOwnedEvent(ctx, args.eventId);
    await limitWrites(ctx, userId);
    await requireRoomFor(ctx, "budgetItems", event._id);
    const name = cleanText(args.name, "Name", LIMITS.nameMax, true);
    const id = await ctx.db.insert("budgetItems", {
      eventId: event._id,
      ownerId: event.ownerId,
      category: args.category,
      name,
      estimated: cleanMoney(args.estimated, "Estimated cost"),
      actual: cleanOptionalMoney(args.actual, "Actual cost"),
      paid: cleanMoney(args.paid, "Amount paid"),
      notes: cleanLongText(args.notes, "Notes", 1000),
      updatedAt: Date.now(),
    });
    await logActivity(ctx, event, "budget", `Added budget line “${name}”`);
    await touchEvent(ctx, event);
    return id;
  },
});

export const update = mutation({
  args: {
    itemId: v.id("budgetItems"),
    category: v.optional(vCategory),
    name: v.optional(v.string()),
    estimated: v.optional(v.number()),
    actual: v.optional(v.union(v.number(), v.null())),
    paid: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "budgetItems", args.itemId);
    const patch: Partial<typeof doc> = { updatedAt: Date.now() };
    if (args.category !== undefined) patch.category = args.category;
    if (args.name !== undefined) patch.name = cleanText(args.name, "Name", LIMITS.nameMax, true);
    if (args.estimated !== undefined) patch.estimated = cleanMoney(args.estimated, "Estimated cost");
    if (args.actual !== undefined) patch.actual = cleanOptionalMoney(args.actual, "Actual cost");
    if (args.paid !== undefined) patch.paid = cleanMoney(args.paid, "Amount paid");
    if (args.notes !== undefined) patch.notes = cleanLongText(args.notes, "Notes", 1000);
    await ctx.db.patch("budgetItems", doc._id, patch);
    await logActivity(ctx, event, "budget", `Updated “${patch.name ?? doc.name}”`);
    await touchEvent(ctx, event);
    return null;
  },
});

/** Records a deposit, marks the line fully paid, or clears payments. */
export const recordPayment = mutation({
  args: {
    itemId: v.id("budgetItems"),
    mode: v.union(v.literal("deposit"), v.literal("full"), v.literal("clear")),
    amount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "budgetItems", args.itemId);
    const committed = doc.actual ?? doc.estimated;
    let paid = 0;
    if (args.mode === "full") paid = committed;
    if (args.mode === "deposit") paid = cleanMoney(args.amount ?? Math.round(committed * 0.3), "Deposit");
    await ctx.db.patch("budgetItems", doc._id, { paid, updatedAt: Date.now() });
    const verb =
      args.mode === "full"
        ? "Paid in full"
        : args.mode === "deposit"
          ? "Deposit recorded"
          : "Payments cleared";
    await logActivity(ctx, event, "budget", `${verb}: “${doc.name}”`);
    await touchEvent(ctx, event);
    return null;
  },
});

export const remove = mutation({
  args: { itemId: v.id("budgetItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "budgetItems", args.itemId);
    await ctx.db.delete("budgetItems", doc._id);
    await logActivity(ctx, event, "budget", `Removed budget line “${doc.name}”`);
    await touchEvent(ctx, event);
    return null;
  },
});
