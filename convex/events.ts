import { ConvexError, v } from "convex/values";
import { LIMITS } from "../lib/constants";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { logActivity, requireOwnedEvent, requireUserId } from "./lib/access";
import { deleteEventCascade } from "./lib/cascade";
import {
  cleanCurrency,
  cleanDate,
  cleanGuestCount,
  cleanList,
  cleanLongText,
  cleanMoney,
  cleanText,
  invalid,
  resolveToday,
} from "./lib/input";
import { rateLimiter } from "./lib/rateLimits";
import { vEventType } from "./lib/validators";
import schema from "./schema";

const eventFields = {
  name: v.string(),
  type: vEventType,
  date: v.string(),
  city: v.string(),
  venue: v.string(),
  guestCount: v.number(),
  budget: v.number(),
  currency: v.string(),
  styles: v.array(v.string()),
  atmosphere: v.string(),
  foodPreferences: v.array(v.string()),
  activities: v.array(v.string()),
  notes: v.string(),
};

type EventFields = {
  name: string;
  date: string;
  city: string;
  venue: string;
  guestCount: number;
  budget: number;
  currency: string;
  styles: string[];
  atmosphere: string;
  foodPreferences: string[];
  activities: string[];
  notes: string;
};

function cleanEventFields<T extends Partial<EventFields>>(fields: T): T {
  const out: Partial<EventFields> = {};
  if (fields.name !== undefined) out.name = cleanText(fields.name, "Name", LIMITS.nameMax, true);
  if (fields.date !== undefined) out.date = cleanDate(fields.date, "Event date");
  if (fields.city !== undefined) out.city = cleanText(fields.city, "City", LIMITS.shortTextMax);
  if (fields.venue !== undefined) out.venue = cleanText(fields.venue, "Venue", LIMITS.shortTextMax);
  if (fields.guestCount !== undefined) out.guestCount = cleanGuestCount(fields.guestCount);
  if (fields.budget !== undefined) {
    out.budget = cleanMoney(fields.budget, "Budget");
    if (out.budget <= 0) throw invalid("Budget must be more than zero.");
  }
  if (fields.currency !== undefined) out.currency = cleanCurrency(fields.currency);
  if (fields.styles !== undefined) out.styles = cleanList(fields.styles, "styles", 6);
  if (fields.atmosphere !== undefined) {
    out.atmosphere = cleanText(fields.atmosphere, "Atmosphere", LIMITS.shortTextMax);
  }
  if (fields.foodPreferences !== undefined) {
    out.foodPreferences = cleanList(fields.foodPreferences, "food preferences", 12);
  }
  if (fields.activities !== undefined) out.activities = cleanList(fields.activities, "activities", 12);
  if (fields.notes !== undefined) out.notes = cleanLongText(fields.notes, "Additional requirements");
  return { ...fields, ...out };
}

export const list = query({
  args: {},
  returns: v.array(
    schema.doc("events").extend({
      taskTotal: v.number(),
      taskDone: v.number(),
      conceptTitle: v.union(v.string(), v.null()),
      palette: v.array(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const events = await ctx.db
      .query("events")
      .withIndex("by_ownerId_and_date", (q) => q.eq("ownerId", userId))
      .take(100);

    return await Promise.all(
      events.map(async (event) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_eventId_and_order", (q) => q.eq("eventId", event._id))
          .take(LIMITS.listMax);
        const blueprint = await ctx.db
          .query("blueprints")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .first();
        return {
          ...event,
          taskTotal: tasks.length,
          taskDone: tasks.filter((task) => task.completed).length,
          conceptTitle: blueprint?.content.concept.title ?? null,
          palette: blueprint?.content.palette.slice(0, 5).map((swatch) => swatch.hex) ?? [],
        };
      }),
    );
  },
});

/** Returns `null` for unknown, malformed or foreign IDs instead of throwing. */
export const get = query({
  args: { eventId: v.string() },
  returns: v.union(
    v.null(),
    v.object({ event: schema.doc("events"), blueprint: v.union(schema.doc("blueprints"), v.null()) }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const eventId = ctx.db.normalizeId("events", args.eventId);
    if (!eventId) return null;
    const event = await ctx.db.get("events", eventId);
    if (!event || event.ownerId !== userId) return null;
    const blueprint = await ctx.db
      .query("blueprints")
      .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
      .first();
    return { event, blueprint };
  },
});

export const create = mutation({
  args: { ...eventFields, useAI: v.boolean(), today: v.optional(v.string()) },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const { useAI, today: clientToday, ...raw } = args;
    const fields = cleanEventFields(raw);
    const today = resolveToday(clientToday);

    // Double-click and retry protection: the same request within a minute
    // returns the event that was already created.
    const recent = await ctx.db
      .query("events")
      .withIndex("by_ownerId_and_date", (q) => q.eq("ownerId", userId).eq("date", fields.date))
      .take(50);
    const duplicate = recent.find(
      (event) => event.name === fields.name && Date.now() - event._creationTime < 60_000,
    );
    if (duplicate) return duplicate._id;

    const limit = await rateLimiter.limit(ctx, "createEventPerUser", { key: userId });
    if (!limit.ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: "You're creating celebrations very quickly. Please wait a few minutes.",
      });
    }

    const eventId = await ctx.db.insert("events", {
      ...fields,
      ownerId: userId,
      isDemo: false,
      planStatus: "generating",
      updatedAt: Date.now(),
    });
    const event = (await ctx.db.get("events", eventId)) as Doc<"events">;
    await logActivity(ctx, event, "event", `Created ${fields.name}`);
    await ctx.scheduler.runAfter(0, internal.plans.generate, {
      eventId,
      useAI,
      today,
      applyToPlan: true,
    });
    return eventId;
  },
});

export const update = mutation({
  args: {
    eventId: v.id("events"),
    name: v.optional(v.string()),
    type: v.optional(vEventType),
    date: v.optional(v.string()),
    city: v.optional(v.string()),
    venue: v.optional(v.string()),
    guestCount: v.optional(v.number()),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    styles: v.optional(v.array(v.string())),
    atmosphere: v.optional(v.string()),
    foodPreferences: v.optional(v.array(v.string())),
    activities: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { eventId, ...raw } = args;
    const { event } = await requireOwnedEvent(ctx, eventId);
    const fields = cleanEventFields(raw);
    await ctx.db.patch("events", eventId, { ...fields, updatedAt: Date.now() });

    const changes: string[] = [];
    if (fields.date && fields.date !== event.date) changes.push("date");
    if (fields.budget !== undefined && fields.budget !== event.budget) changes.push("budget");
    if (fields.guestCount !== undefined && fields.guestCount !== event.guestCount)
      changes.push("guest count");
    await logActivity(
      ctx,
      event,
      "event",
      changes.length ? `Updated the ${changes.join(", ")}` : "Updated celebration details",
    );
    return null;
  },
});

export const remove = mutation({
  args: { eventId: v.id("events") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireOwnedEvent(ctx, args.eventId);
    await deleteEventCascade(ctx, args.eventId);
    return null;
  },
});
