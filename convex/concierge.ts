import { ConvexError, v } from "convex/values";
import { summarizeBudget } from "../lib/budget";
import { LIMITS } from "../lib/constants";
import { clampOffsetDays, daysBetween, resolveDueDate } from "../lib/dates";
import { requestStructured, type GroqFailure } from "../lib/ai/groq";
import { toStrictJsonSchema } from "../lib/ai/json-schema";
import { conciergeMessages } from "../lib/ai/prompts";
import { fallbackConcierge } from "../lib/concierge/fallback";
import {
  conciergeResponseSchema,
  normalizeProposal,
  parseConciergeResponse,
  type Proposal,
  type ProposedChange,
} from "../lib/concierge/proposal";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  env,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { logActivity, requireOwnedDoc, requireOwnedEvent, touchEvent } from "./lib/access";
import { groqModels, toPlanInput } from "./lib/plan";
import { cleanGuestCount, cleanLongText, cleanMoney, invalid, resolveToday } from "./lib/input";
import { vPlanInput, vProposedChange } from "./lib/validators";
import schema from "./schema";

const CONCIERGE_JSON_SCHEMA = toStrictJsonSchema(conciergeResponseSchema);

export const list = query({
  args: { eventId: v.id("events") },
  returns: v.array(schema.doc("conciergeMessages")),
  handler: async (ctx, args) => {
    await requireOwnedEvent(ctx, args.eventId);
    const recent = await ctx.db
      .query("conciergeMessages")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(100);
    return recent.reverse();
  },
});

export const send = mutation({
  args: { eventId: v.id("events"), content: v.string(), today: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { event } = await requireOwnedEvent(ctx, args.eventId);
    const content = cleanLongText(args.content, "Message", LIMITS.chatMessageMax);
    if (!content) throw invalid("Write a message first.");

    const latest = await ctx.db
      .query("conciergeMessages")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .order("desc")
      .take(3);
    if (latest.some((message) => message.status === "pending")) {
      throw new ConvexError({ code: "BUSY", message: "The concierge is still replying. One moment." });
    }

    const userMessageId = await ctx.db.insert("conciergeMessages", {
      eventId: event._id,
      ownerId: event.ownerId,
      role: "user",
      content,
      status: "done",
    });
    const assistantMessageId = await ctx.db.insert("conciergeMessages", {
      eventId: event._id,
      ownerId: event.ownerId,
      role: "assistant",
      content: "",
      status: "pending",
    });
    await ctx.scheduler.runAfter(0, internal.concierge.respond, {
      eventId: event._id,
      userMessageId,
      assistantMessageId,
      today: resolveToday(args.today),
    });
    return null;
  },
});

export const getContext = internalQuery({
  args: {
    eventId: v.id("events"),
    userMessageId: v.id("conciergeMessages"),
    assistantMessageId: v.id("conciergeMessages"),
  },
  returns: v.union(
    v.null(),
    v.object({
      ownerId: v.id("users"),
      event: vPlanInput,
      userMessage: v.string(),
      history: v.array(
        v.object({ role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() }),
      ),
      budgetItems: v.array(
        v.object({
          id: v.string(),
          category: v.string(),
          name: v.string(),
          estimated: v.number(),
          actual: v.union(v.number(), v.null()),
          paid: v.number(),
        }),
      ),
      tasks: v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          category: v.string(),
          priority: v.string(),
          dueMode: v.string(),
          offsetDays: v.union(v.number(), v.null()),
          dueDate: v.union(v.string(), v.null()),
          completed: v.boolean(),
        }),
      ),
      vendors: v.array(v.object({ name: v.string(), category: v.string(), status: v.string() })),
    }),
  ),
  handler: async (ctx, args) => {
    const event = await ctx.db.get("events", args.eventId);
    const userMessage = await ctx.db.get("conciergeMessages", args.userMessageId);
    if (!event || !userMessage) return null;

    const [items, tasks, vendors, messages] = await Promise.all([
      ctx.db
        .query("budgetItems")
        .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
        .take(150),
      ctx.db
        .query("tasks")
        .withIndex("by_eventId_and_order", (q) => q.eq("eventId", event._id))
        .take(150),
      ctx.db
        .query("vendors")
        .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
        .take(60),
      ctx.db
        .query("conciergeMessages")
        .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
        .order("desc")
        .take(12),
    ]);

    const history = messages
      .filter(
        (m) =>
          m.status === "done" &&
          m._id !== args.userMessageId &&
          m._id !== args.assistantMessageId &&
          m.content,
      )
      .slice(0, 8)
      .reverse()
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) + proposalOutcome(m.proposal) }));

    return {
      ownerId: event.ownerId,
      event: toPlanInput(event),
      userMessage: userMessage.content,
      history,
      budgetItems: items.map((item) => ({
        id: item._id,
        category: item.category,
        name: item.name,
        estimated: item.estimated,
        actual: item.actual,
        paid: item.paid,
      })),
      tasks: tasks.map((task) => ({
        id: task._id,
        title: task.title,
        category: task.category,
        priority: task.priority,
        dueMode: task.dueMode,
        offsetDays: task.offsetDays ?? null,
        dueDate: task.dueDate ?? null,
        completed: task.completed,
      })),
      vendors: vendors.map((vendor) => ({
        name: vendor.name,
        category: vendor.category,
        status: vendor.status,
      })),
    };
  },
});

/** Tells the model what became of an earlier proposal, so it never assumes one was applied. */
function proposalOutcome(proposal: Doc<"conciergeMessages">["proposal"]): string {
  if (!proposal) return "";
  if (proposal.status === "applied") {
    return `\n[Host applied ${proposal.appliedCount ?? proposal.changes.length} of ${proposal.changes.length} proposed changes.]`;
  }
  if (proposal.status === "dismissed") return "\n[Host dismissed this proposal. Nothing was changed.]";
  return "\n[Proposal not yet approved. Nothing has changed.]";
}

function offlineNotice(failure: GroqFailure | "quota"): string {
  if (failure === "quota") return "You've reached the hourly AI limit, so the offline assistant answered.";
  switch (failure.kind) {
    case "missing_key":
      return "AI isn't configured on this deployment, so the offline assistant answered.";
    case "rate_limited":
      return "The free AI quota is busy, so the offline assistant answered. Try again in a minute.";
    case "invalid_output":
      return "The AI reply failed validation, so the offline assistant answered.";
    default:
      return "The AI service is unavailable, so the offline assistant answered.";
  }
}

export const respond = internalAction({
  args: {
    eventId: v.id("events"),
    userMessageId: v.id("conciergeMessages"),
    assistantMessageId: v.id("conciergeMessages"),
    today: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const data = await ctx.runQuery(internal.concierge.getContext, {
        eventId: args.eventId,
        userMessageId: args.userMessageId,
        assistantMessageId: args.assistantMessageId,
      });
      if (!data) return null;

      const ids = {
        budgetItemIds: new Set(data.budgetItems.map((item) => item.id)),
        taskIds: new Set(data.tasks.map((task) => task.id)),
      };

      let reply: string | null = null;
      let proposal: Proposal | null = null;
      let notice: string | undefined;

      const allowed = await ctx.runMutation(internal.plans.consumeAiQuota, {
        userId: data.ownerId,
        kind: "concierge",
      });
      if (allowed) {
        const snapshot = {
          event: { ...data.event, today: args.today, daysToGo: daysBetween(args.today, data.event.date) },
          budget: summarizeBudget(data.event.budget, data.budgetItems),
          budgetItems: data.budgetItems,
          tasks: data.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            category: task.category,
            priority: task.priority,
            due: resolveDueDate(
              {
                dueMode: task.dueMode as Doc<"tasks">["dueMode"],
                offsetDays: task.offsetDays ?? undefined,
                dueDate: task.dueDate ?? undefined,
              },
              data.event.date,
            ),
            completed: task.completed,
          })),
          vendors: data.vendors,
        };
        const result = await requestStructured({
          apiKey: env.GROQ_API_KEY,
          models: groqModels(),
          messages: conciergeMessages(snapshot, data.history, data.userMessage),
          schemaName: "concierge_reply",
          jsonSchema: CONCIERGE_JSON_SCHEMA,
          parse: parseConciergeResponse,
          maxCompletionTokens: 2500,
          temperature: 0.4,
        });
        if (result.ok) {
          reply = result.data.reply;
          proposal = normalizeProposal(result.data.proposal, ids);
        } else {
          notice = offlineNotice(result.failure);
          console.warn(`Concierge fell back to offline mode: ${result.failure.kind}`);
        }
      } else {
        notice = offlineNotice("quota");
      }

      const engine = reply === null ? "offline" : "ai";
      if (reply === null) {
        const fallback = fallbackConcierge(data.userMessage, {
          currency: data.event.currency,
          budget: data.event.budget,
          guestCount: data.event.guestCount,
          items: data.budgetItems,
        });
        reply = fallback.reply;
        proposal = fallback.proposal;
      }

      await ctx.runMutation(internal.concierge.saveReply, {
        messageId: args.assistantMessageId,
        content: reply,
        engine,
        notice,
        proposal: proposal ?? undefined,
      });
    } catch (error) {
      console.error("Concierge reply failed", error);
      await ctx.runMutation(internal.concierge.saveReply, {
        messageId: args.assistantMessageId,
        content: "Something went wrong while preparing a reply. Your plan hasn't changed — please try again.",
        engine: "offline",
        failed: true,
      });
    }
    return null;
  },
});

export const saveReply = internalMutation({
  args: {
    messageId: v.id("conciergeMessages"),
    content: v.string(),
    engine: v.union(v.literal("ai"), v.literal("offline")),
    notice: v.optional(v.string()),
    proposal: v.optional(v.object({ title: v.string(), changes: v.array(vProposedChange) })),
    failed: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("conciergeMessages", args.messageId);
    if (!message) return null;
    await ctx.db.patch("conciergeMessages", message._id, {
      content: args.content,
      status: args.failed ? "error" : "done",
      engine: args.engine,
      notice: args.notice,
      proposal: args.proposal ? { ...args.proposal, status: "pending" } : undefined,
    });
    return null;
  },
});

/** Applies one approved change after re-validating it against current data. */
async function applyChange(
  ctx: MutationCtx,
  event: Doc<"events">,
  change: ProposedChange,
  today: string,
): Promise<boolean> {
  const now = Date.now();
  switch (change.type) {
    case "set_event_budget": {
      const amount = cleanMoney(change.amount, "Budget");
      if (amount <= 0) return false;
      await ctx.db.patch("events", event._id, { budget: amount, updatedAt: now });
      return true;
    }
    case "set_guest_count": {
      await ctx.db.patch("events", event._id, { guestCount: cleanGuestCount(change.count), updatedAt: now });
      return true;
    }
    case "update_budget_item": {
      const itemId = ctx.db.normalizeId("budgetItems", change.itemId);
      const item = itemId ? await ctx.db.get("budgetItems", itemId) : null;
      if (!item || item.eventId !== event._id || item.ownerId !== event.ownerId) return false;
      await ctx.db.patch("budgetItems", item._id, {
        estimated: cleanMoney(change.estimated, "Estimated cost"),
        updatedAt: now,
      });
      return true;
    }
    case "add_budget_item": {
      await ctx.db.insert("budgetItems", {
        eventId: event._id,
        ownerId: event.ownerId,
        category: change.category,
        name: change.name.slice(0, LIMITS.nameMax),
        estimated: cleanMoney(change.estimated, "Estimated cost"),
        actual: null,
        paid: 0,
        notes: change.reason.slice(0, 1000),
        updatedAt: now,
      });
      return true;
    }
    case "add_task": {
      const last = await ctx.db
        .query("tasks")
        .withIndex("by_eventId_and_order", (q) => q.eq("eventId", event._id))
        .order("desc")
        .first();
      await ctx.db.insert("tasks", {
        eventId: event._id,
        ownerId: event.ownerId,
        title: change.title.slice(0, LIMITS.nameMax),
        notes: change.reason.slice(0, 1000),
        category: change.category,
        priority: change.priority,
        dueMode: "relative",
        offsetDays: clampOffsetDays(change.offsetDays, event.date, today),
        completed: false,
        order: (last?.order ?? 0) + 1000,
        source: "concierge",
      });
      return true;
    }
    case "update_task": {
      const taskId = ctx.db.normalizeId("tasks", change.taskId);
      const task = taskId ? await ctx.db.get("tasks", taskId) : null;
      if (!task || task.eventId !== event._id || task.ownerId !== event.ownerId) return false;
      const patch: Partial<Doc<"tasks">> = {};
      if (change.priority) patch.priority = change.priority;
      if (change.offsetDays !== null) {
        patch.dueMode = "relative";
        patch.offsetDays = clampOffsetDays(change.offsetDays, event.date, today);
        patch.dueDate = undefined;
      }
      await ctx.db.patch("tasks", task._id, patch);
      return true;
    }
  }
}

export const applyProposal = mutation({
  args: {
    messageId: v.id("conciergeMessages"),
    changeIndexes: v.array(v.number()),
    today: v.optional(v.string()),
  },
  returns: v.object({ applied: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    const { doc, event } = await requireOwnedDoc(ctx, "conciergeMessages", args.messageId);
    const proposal = doc.proposal;
    if (!proposal || proposal.status !== "pending") {
      throw invalid("This proposal has already been handled.");
    }
    const indexes = [...new Set(args.changeIndexes)].filter(
      (index) => Number.isInteger(index) && index >= 0 && index < proposal.changes.length,
    );
    if (indexes.length === 0) throw invalid("Choose at least one change to apply.");

    const today = resolveToday(args.today);
    const appliedIndexes: number[] = [];
    for (const index of indexes.sort((a, b) => a - b)) {
      // Re-read the event so later changes see earlier ones.
      const current = (await ctx.db.get("events", event._id)) as Doc<"events">;
      if (await applyChange(ctx, current, proposal.changes[index] as ProposedChange, today)) {
        appliedIndexes.push(index);
      }
    }
    const applied = appliedIndexes.length;

    await ctx.db.patch("conciergeMessages", doc._id, {
      proposal: { ...proposal, status: "applied", appliedCount: applied, appliedIndexes },
    });
    await logActivity(
      ctx,
      event,
      "concierge",
      `Applied ${applied} concierge change${applied === 1 ? "" : "s"}: ${proposal.title}`,
    );
    await touchEvent(ctx, event);
    return { applied, skipped: indexes.length - applied };
  },
});

export const dismissProposal = mutation({
  args: { messageId: v.id("conciergeMessages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { doc } = await requireOwnedDoc(ctx, "conciergeMessages", args.messageId);
    if (doc.proposal?.status === "pending") {
      await ctx.db.patch("conciergeMessages", doc._id, {
        proposal: { ...doc.proposal, status: "dismissed" },
      });
    }
    return null;
  },
});

export const clear = mutation({
  args: { eventId: v.id("events") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { event } = await requireOwnedEvent(ctx, args.eventId);
    const messages = await ctx.db
      .query("conciergeMessages")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .take(LIMITS.listMax);
    if (messages.some((message) => message.status === "pending")) {
      throw new ConvexError({ code: "BUSY", message: "Wait for the current reply before clearing." });
    }
    for (const message of messages) await ctx.db.delete("conciergeMessages", message._id);
    return null;
  },
});
