import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Authorization helpers. Every public function calls one of these before it
 * touches data. Missing and foreign records produce the same "not found"
 * error so IDs cannot be probed.
 */

export function notFound(what = "That item"): ConvexError<{ code: string; message: string }> {
  return new ConvexError({ code: "NOT_FOUND", message: `${what} could not be found.` });
}

export async function requireUserId(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Please sign in to continue." });
  }
  return userId;
}

export async function requireOwnedEvent(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">,
): Promise<{ userId: Id<"users">; event: Doc<"events"> }> {
  const userId = await requireUserId(ctx);
  const event = await ctx.db.get("events", eventId);
  if (!event || event.ownerId !== userId) throw notFound("That celebration");
  return { userId, event };
}

type OwnedTable =
  "budgetItems" | "tasks" | "vendors" | "moodboardItems" | "conciergeMessages" | "scheduleItems";

export async function requireOwnedDoc<T extends OwnedTable>(
  ctx: QueryCtx | MutationCtx,
  table: T,
  id: Id<T>,
): Promise<{ userId: Id<"users">; doc: Doc<T>; event: Doc<"events"> }> {
  const userId = await requireUserId(ctx);
  const doc = (await ctx.db.get(table, id)) as Doc<T> | null;
  if (!doc || doc.ownerId !== userId) throw notFound();
  const event = await ctx.db.get("events", doc.eventId);
  if (!event || event.ownerId !== userId) throw notFound();
  return { userId, doc, event };
}

export async function logActivity(
  ctx: MutationCtx,
  event: Doc<"events">,
  kind: Doc<"activity">["kind"],
  message: string,
): Promise<void> {
  await ctx.db.insert("activity", {
    eventId: event._id,
    ownerId: event.ownerId,
    kind,
    message: message.slice(0, 200),
  });
}

export async function touchEvent(ctx: MutationCtx, event: Doc<"events">): Promise<void> {
  await ctx.db.patch("events", event._id, { updatedAt: Date.now() });
}
