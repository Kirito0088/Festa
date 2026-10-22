import { v } from "convex/values";
import { LIMITS } from "../lib/constants";
import { isSafeImageUrl } from "../lib/inspiration";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { logActivity, requireOwnedDoc, requireOwnedEvent, touchEvent } from "./lib/access";
import { limitWrites } from "./lib/rateLimits";
import { cleanLongText, cleanText, invalid } from "./lib/input";
import { vMoodboardCategory } from "./lib/validators";
import schema from "./schema";

const HEX = /^#[0-9A-F]{6}$/i;

export const list = query({
  args: { eventId: v.id("events") },
  returns: v.array(schema.doc("moodboardItems")),
  handler: async (ctx, args) => {
    await requireOwnedEvent(ctx, args.eventId);
    return await ctx.db
      .query("moodboardItems")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(LIMITS.listMax);
  },
});

export const addImage = mutation({
  args: {
    eventId: v.id("events"),
    imageUrl: v.string(),
    title: v.string(),
    category: vMoodboardCategory,
    note: v.string(),
    credit: v.optional(v.string()),
  },
  returns: v.id("moodboardItems"),
  handler: async (ctx, args) => {
    const { userId, event } = await requireOwnedEvent(ctx, args.eventId);
    await limitWrites(ctx, userId);
    const imageUrl = args.imageUrl.trim();
    if (!isSafeImageUrl(imageUrl)) throw invalid("Use an image link that starts with https://");
    const title = cleanText(args.title, "Title", LIMITS.nameMax, true);
    const id = await ctx.db.insert("moodboardItems", {
      eventId: event._id,
      ownerId: event.ownerId,
      kind: "image",
      imageUrl,
      title,
      category: args.category,
      note: cleanLongText(args.note, "Note", 500),
      credit: args.credit ? cleanText(args.credit, "Credit", 120) : undefined,
    });
    await logActivity(ctx, event, "moodboard", `Saved “${title}” to inspiration`);
    await touchEvent(ctx, event);
    return id;
  },
});

export const addSwatch = mutation({
  args: { eventId: v.id("events"), color: v.string(), title: v.string(), note: v.string() },
  returns: v.id("moodboardItems"),
  handler: async (ctx, args) => {
    const { userId, event } = await requireOwnedEvent(ctx, args.eventId);
    await limitWrites(ctx, userId);
    const color = args.color.trim().toUpperCase();
    if (!HEX.test(color)) throw invalid("Choose a colour in #RRGGBB format.");
    const title = cleanText(args.title, "Name", 60, true);
    const id = await ctx.db.insert("moodboardItems", {
      eventId: event._id,
      ownerId: event.ownerId,
      kind: "swatch",
      color,
      title,
      category: "colors",
      note: cleanLongText(args.note, "Note", 500),
    });
    await logActivity(ctx, event, "moodboard", `Added colour “${title}”`);
    await touchEvent(ctx, event);
    return id;
  },
});

export const update = mutation({
  args: {
    itemId: v.id("moodboardItems"),
    title: v.optional(v.string()),
    category: v.optional(vMoodboardCategory),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "moodboardItems", args.itemId);
    const patch: Partial<Doc<"moodboardItems">> = {};
    if (args.title !== undefined) patch.title = cleanText(args.title, "Title", LIMITS.nameMax, true);
    if (args.category !== undefined && doc.kind === "image") patch.category = args.category;
    if (args.note !== undefined) patch.note = cleanLongText(args.note, "Note", 500);
    await ctx.db.patch("moodboardItems", doc._id, patch);
    await touchEvent(ctx, event);
    return null;
  },
});

export const remove = mutation({
  args: { itemId: v.id("moodboardItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "moodboardItems", args.itemId);
    await ctx.db.delete("moodboardItems", doc._id);
    await logActivity(ctx, event, "moodboard", `Removed “${doc.title}” from inspiration`);
    await touchEvent(ctx, event);
    return null;
  },
});
