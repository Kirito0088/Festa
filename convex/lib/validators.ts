import { v } from "convex/values";
import {
  CATEGORIES,
  EVENT_TYPES,
  MOODBOARD_CATEGORIES,
  PAYMENT_STATUSES,
  PRIORITIES,
  VENDOR_STATUSES,
} from "../../lib/constants";

export const vEventType = v.union(...EVENT_TYPES.map((t) => v.literal(t)));
export const vCategory = v.union(...CATEGORIES.map((c) => v.literal(c)));
export const vPriority = v.union(...PRIORITIES.map((p) => v.literal(p)));
export const vVendorStatus = v.union(...VENDOR_STATUSES.map((s) => v.literal(s)));
export const vPaymentStatus = v.union(...PAYMENT_STATUSES.map((s) => v.literal(s)));
export const vMoodboardCategory = v.union(...MOODBOARD_CATEGORIES.map((c) => v.literal(c)));

export const vPlanStatus = v.union(
  v.literal("idle"),
  v.literal("generating"),
  v.literal("ready"),
  v.literal("failed"),
);

export const vDueMode = v.union(v.literal("relative"), v.literal("fixed"), v.literal("none"));

export const vPlanInput = v.object({
  type: vEventType,
  name: v.string(),
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
});

export const vBlueprintContent = v.object({
  concept: v.object({
    title: v.string(),
    tagline: v.string(),
    summary: v.string(),
    theme: v.string(),
  }),
  palette: v.array(v.object({ name: v.string(), hex: v.string() })),
  budget: v.array(
    v.object({ category: vCategory, label: v.string(), percent: v.number(), note: v.string() }),
  ),
  tasks: v.array(
    v.object({
      title: v.string(),
      category: vCategory,
      priority: vPriority,
      daysBeforeEvent: v.number(),
      note: v.string(),
    }),
  ),
  vendors: v.array(
    v.object({
      category: vCategory,
      title: v.string(),
      why: v.string(),
      bookByDaysBefore: v.number(),
    }),
  ),
  decor: v.array(v.string()),
  food: v.array(v.string()),
  entertainment: v.array(v.string()),
  risks: v.array(v.object({ risk: v.string(), mitigation: v.string() })),
  recommendations: v.array(v.string()),
});

export const vProposedChange = v.union(
  v.object({ type: v.literal("set_event_budget"), amount: v.number(), reason: v.string() }),
  v.object({ type: v.literal("set_guest_count"), count: v.number(), reason: v.string() }),
  v.object({
    type: v.literal("update_budget_item"),
    itemId: v.string(),
    estimated: v.number(),
    reason: v.string(),
  }),
  v.object({
    type: v.literal("add_budget_item"),
    category: vCategory,
    name: v.string(),
    estimated: v.number(),
    reason: v.string(),
  }),
  v.object({
    type: v.literal("add_task"),
    title: v.string(),
    category: vCategory,
    priority: vPriority,
    offsetDays: v.number(),
    reason: v.string(),
  }),
  v.object({
    type: v.literal("update_task"),
    taskId: v.string(),
    priority: v.union(vPriority, v.null()),
    offsetDays: v.union(v.number(), v.null()),
    reason: v.string(),
  }),
);

export const vProposal = v.object({
  title: v.string(),
  changes: v.array(vProposedChange),
  status: v.union(v.literal("pending"), v.literal("applied"), v.literal("dismissed")),
  appliedCount: v.optional(v.number()),
  /** Indexes of the changes that were actually applied. */
  appliedIndexes: v.optional(v.array(v.number())),
});
