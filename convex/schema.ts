import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  vBlueprintContent,
  vCategory,
  vDueMode,
  vEventType,
  vMoodboardCategory,
  vPaymentStatus,
  vPlanStatus,
  vPriority,
  vProposal,
  vVendorStatus,
} from "./lib/validators";

/**
 * Every event-owned record stores both `eventId` and `ownerId`. Backend
 * functions check `ownerId` against the signed-in user before reading or
 * writing anything, so a guessed ID never exposes another user's data.
 */
export default defineSchema({
  ...authTables,

  events: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    type: vEventType,
    /** Calendar date, `YYYY-MM-DD`. */
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
    isDemo: v.boolean(),
    planStatus: vPlanStatus,
    updatedAt: v.number(),
  }).index("by_ownerId_and_date", ["ownerId", "date"]),

  blueprints: defineTable({
    eventId: v.id("events"),
    ownerId: v.id("users"),
    source: v.union(v.literal("ai"), v.literal("template"), v.literal("sample")),
    model: v.optional(v.string()),
    /** Why the template planner was used instead of AI, when applicable. */
    notice: v.optional(v.string()),
    content: vBlueprintContent,
  }).index("by_eventId", ["eventId"]),

  budgetItems: defineTable({
    eventId: v.id("events"),
    ownerId: v.id("users"),
    category: vCategory,
    name: v.string(),
    estimated: v.number(),
    /** Final cost once known; `null` while the estimate stands. */
    actual: v.union(v.number(), v.null()),
    paid: v.number(),
    notes: v.string(),
    updatedAt: v.number(),
  }).index("by_eventId", ["eventId"]),

  tasks: defineTable({
    eventId: v.id("events"),
    ownerId: v.id("users"),
    title: v.string(),
    notes: v.string(),
    category: vCategory,
    priority: vPriority,
    dueMode: vDueMode,
    /** Days before the event, when `dueMode` is "relative". */
    offsetDays: v.optional(v.number()),
    /** Calendar date, when `dueMode` is "fixed". */
    dueDate: v.optional(v.string()),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    order: v.number(),
    source: v.union(v.literal("plan"), v.literal("user"), v.literal("concierge"), v.literal("sample")),
  }).index("by_eventId_and_order", ["eventId", "order"]),

  vendors: defineTable({
    eventId: v.id("events"),
    ownerId: v.id("users"),
    name: v.string(),
    category: vCategory,
    contactName: v.string(),
    phone: v.string(),
    email: v.string(),
    website: v.string(),
    quoteEstimated: v.union(v.number(), v.null()),
    quoteActual: v.union(v.number(), v.null()),
    status: vVendorStatus,
    paymentStatus: vPaymentStatus,
    notes: v.string(),
    isSample: v.boolean(),
    updatedAt: v.number(),
  }).index("by_eventId", ["eventId"]),

  moodboardItems: defineTable({
    eventId: v.id("events"),
    ownerId: v.id("users"),
    kind: v.union(v.literal("image"), v.literal("swatch")),
    imageUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    title: v.string(),
    category: vMoodboardCategory,
    note: v.string(),
    credit: v.optional(v.string()),
  }).index("by_eventId", ["eventId"]),

  /** The run sheet for the day itself: one row per timed moment. */
  scheduleItems: defineTable({
    eventId: v.id("events"),
    ownerId: v.id("users"),
    /** 24-hour "HH:MM". */
    time: v.string(),
    title: v.string(),
    notes: v.string(),
    source: v.union(v.literal("plan"), v.literal("user"), v.literal("sample")),
  }).index("by_eventId_and_time", ["eventId", "time"]),

  conciergeMessages: defineTable({
    eventId: v.id("events"),
    ownerId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    status: v.union(v.literal("pending"), v.literal("done"), v.literal("error")),
    engine: v.optional(v.union(v.literal("ai"), v.literal("offline"))),
    notice: v.optional(v.string()),
    proposal: v.optional(vProposal),
  }).index("by_eventId", ["eventId"]),

  activity: defineTable({
    eventId: v.id("events"),
    ownerId: v.id("users"),
    kind: v.union(
      v.literal("event"),
      v.literal("plan"),
      v.literal("budget"),
      v.literal("task"),
      v.literal("vendor"),
      v.literal("moodboard"),
      v.literal("concierge"),
    ),
    message: v.string(),
  }).index("by_eventId", ["eventId"]),
});
