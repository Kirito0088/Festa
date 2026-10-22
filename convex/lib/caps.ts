import { LIMITS } from "../../lib/constants";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { invalid } from "./input";

type CappedTable = "budgetItems" | "tasks" | "vendors" | "moodboardItems" | "scheduleItems";

/**
 * The most records of each kind one celebration holds. Each matches what
 * that table's `list` query returns, so nothing saved is ever hidden.
 */
const CAPS: Record<CappedTable, { max: number; noun: string }> = {
  budgetItems: { max: LIMITS.listMax, noun: "budget lines" },
  tasks: { max: LIMITS.listMax, noun: "tasks" },
  vendors: { max: LIMITS.listMax, noun: "vendors" },
  moodboardItems: { max: LIMITS.listMax, noun: "inspiration items" },
  scheduleItems: { max: LIMITS.scheduleMax, noun: "moments on the day's schedule" },
};

async function countUpTo(
  ctx: MutationCtx,
  table: CappedTable,
  eventId: Id<"events">,
  max: number,
): Promise<number> {
  switch (table) {
    case "tasks":
      return (
        await ctx.db
          .query("tasks")
          .withIndex("by_eventId_and_order", (q) => q.eq("eventId", eventId))
          .take(max)
      ).length;
    case "scheduleItems":
      return (
        await ctx.db
          .query("scheduleItems")
          .withIndex("by_eventId_and_time", (q) => q.eq("eventId", eventId))
          .take(max)
      ).length;
    case "budgetItems":
      return (
        await ctx.db
          .query("budgetItems")
          .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
          .take(max)
      ).length;
    case "vendors":
      return (
        await ctx.db
          .query("vendors")
          .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
          .take(max)
      ).length;
    case "moodboardItems":
      return (
        await ctx.db
          .query("moodboardItems")
          .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
          .take(max)
      ).length;
  }
}

/** Whether the celebration can take one more record of this kind. */
export async function hasRoomFor(
  ctx: MutationCtx,
  table: CappedTable,
  eventId: Id<"events">,
): Promise<boolean> {
  const { max } = CAPS[table];
  return (await countUpTo(ctx, table, eventId, max)) < max;
}

/** Throws a friendly INVALID error when the celebration is full for this kind. */
export async function requireRoomFor(
  ctx: MutationCtx,
  table: CappedTable,
  eventId: Id<"events">,
): Promise<void> {
  if (await hasRoomFor(ctx, table, eventId)) return;
  const { max, noun } = CAPS[table];
  throw invalid(`A celebration holds up to ${max} ${noun}. Remove one first.`);
}
