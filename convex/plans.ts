import { ConvexError, v } from "convex/values";
import { blueprintSchema, parseBlueprint, type Blueprint } from "../lib/ai/blueprint";
import { describeFailure, estimateTokens, requestStructured } from "../lib/ai/groq";
import { toStrictJsonSchema } from "../lib/ai/json-schema";
import { blueprintMessages } from "../lib/ai/prompts";
import { materializePlan } from "../lib/plan/materialize";
import { daySchedule } from "../lib/plan/run-sheet";
import { templateBlueprint } from "../lib/plan/template";
import { internal } from "./_generated/api";
import { env, internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { logActivity, requireOwnedEvent } from "./lib/access";
import { resolveToday } from "./lib/input";
import { groqModels, toPlanInput } from "./lib/plan";
import { AI_TOKENS_PER_MINUTE, rateLimiter } from "./lib/rateLimits";
import { vBlueprintContent, vPlanInput } from "./lib/validators";

const BLUEPRINT_JSON_SCHEMA = toStrictJsonSchema(blueprintSchema);
const BLUEPRINT_MAX_TOKENS = 5000;

/** Starts a fresh blueprint. Existing budget lines and tasks are never replaced. */
export const regenerate = mutation({
  args: { eventId: v.id("events"), useAI: v.boolean(), today: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { event } = await requireOwnedEvent(ctx, args.eventId);
    if (event.planStatus === "generating") {
      throw new ConvexError({ code: "BUSY", message: "A plan is already being generated." });
    }
    await ctx.db.patch("events", event._id, { planStatus: "generating" });
    await ctx.scheduler.runAfter(0, internal.plans.generate, {
      eventId: event._id,
      useAI: args.useAI,
      today: resolveToday(args.today),
      applyToPlan: true,
    });
    return null;
  },
});

export const getEvent = internalQuery({
  args: { eventId: v.id("events") },
  returns: v.union(v.null(), v.object({ ownerId: v.id("users"), input: vPlanInput })),
  handler: async (ctx, args) => {
    const event = await ctx.db.get("events", args.eventId);
    if (!event) return null;
    return { ownerId: event.ownerId, input: toPlanInput(event) };
  },
});

/**
 * Reserves quota for one Groq call: the user's own allowance, then the
 * shared request and token budgets that keep Festa under Groq's free tier.
 * Everything is checked before anything is consumed, so a refusal costs
 * nothing. `tokens` is the caller's estimate (see `estimateTokens`).
 */
export const consumeAiQuota = internalMutation({
  args: {
    userId: v.id("users"),
    kind: v.union(v.literal("plan"), v.literal("concierge")),
    tokens: v.number(),
  },
  returns: v.union(v.literal("ok"), v.literal("user_limit"), v.literal("busy")),
  handler: async (ctx, args) => {
    const perUser = args.kind === "plan" ? "aiPlanPerUser" : "aiConciergePerUser";
    const tokens = Math.min(AI_TOKENS_PER_MINUTE, Math.max(1, Math.ceil(args.tokens)));
    const shared = [
      { name: "aiGlobal", count: 1 },
      { name: "aiRequestsPerDay", count: 1 },
      { name: "aiTokensPerMinute", count: tokens },
      { name: "aiTokensPerDay", count: tokens },
    ] as const;

    if (!(await rateLimiter.check(ctx, perUser, { key: args.userId })).ok) return "user_limit";
    for (const { name, count } of shared) {
      if (!(await rateLimiter.check(ctx, name, { count })).ok) return "busy";
    }
    await rateLimiter.limit(ctx, perUser, { key: args.userId });
    for (const { name, count } of shared) await rateLimiter.limit(ctx, name, { count });
    return "ok";
  },
});

/**
 * Called after Groq answers 429: spends a full minute of the shared token
 * budget in advance, so every user goes straight to the built-in planner
 * instead of each waiting on a refusal.
 */
export const pauseAi = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await rateLimiter.limit(ctx, "aiTokensPerMinute", { count: AI_TOKENS_PER_MINUTE, reserve: true });
    return null;
  },
});

export const generate = internalAction({
  args: {
    eventId: v.id("events"),
    useAI: v.boolean(),
    today: v.string(),
    applyToPlan: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const snapshot = await ctx.runQuery(internal.plans.getEvent, { eventId: args.eventId });
    if (!snapshot) return null;
    const { input } = snapshot;

    let blueprint: Blueprint | null = null;
    let source: "ai" | "template" = "template";
    let model: string | undefined;
    let notice: string | undefined;

    try {
      if (args.useAI) {
        const messages = blueprintMessages(input, args.today);
        const quota = await ctx.runMutation(internal.plans.consumeAiQuota, {
          userId: snapshot.ownerId,
          kind: "plan",
          tokens: estimateTokens(messages, BLUEPRINT_MAX_TOKENS),
        });
        if (quota === "user_limit") {
          notice =
            "You've reached the hourly limit for AI plans, so Festa used its built-in planner. Try regenerating with AI later.";
        } else if (quota === "busy") {
          notice =
            "Festa's free AI allowance is busy right now, so it used its built-in planner. Try regenerating with AI in a minute.";
        } else {
          const result = await requestStructured({
            apiKey: env.GROQ_API_KEY,
            models: groqModels(),
            messages,
            schemaName: "celebration_blueprint",
            jsonSchema: BLUEPRINT_JSON_SCHEMA,
            parse: parseBlueprint,
            maxCompletionTokens: BLUEPRINT_MAX_TOKENS,
          });
          if (result.ok) {
            blueprint = result.data;
            source = "ai";
            model = result.model;
          } else {
            if (result.failure.kind === "rate_limited") await ctx.runMutation(internal.plans.pauseAi, {});
            notice = describeFailure(result.failure);
            console.warn(
              `AI blueprint fell back to template: ${result.failure.kind} (${result.failure.message})`,
            );
          }
        }
      }

      await ctx.runMutation(internal.plans.saveBlueprint, {
        eventId: args.eventId,
        content: blueprint ?? templateBlueprint(input),
        source,
        model,
        notice,
        applyToPlan: args.applyToPlan,
        today: args.today,
      });
    } catch (error) {
      console.error("Blueprint generation failed", error);
      await ctx.runMutation(internal.plans.markFailed, { eventId: args.eventId });
    }
    return null;
  },
});

export const saveBlueprint = internalMutation({
  args: {
    eventId: v.id("events"),
    content: vBlueprintContent,
    source: v.union(v.literal("ai"), v.literal("template")),
    model: v.optional(v.string()),
    notice: v.optional(v.string()),
    applyToPlan: v.boolean(),
    today: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db.get("events", args.eventId);
    if (!event) return null;

    for await (const old of ctx.db
      .query("blueprints")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))) {
      await ctx.db.delete("blueprints", old._id);
    }
    await ctx.db.insert("blueprints", {
      eventId: event._id,
      ownerId: event.ownerId,
      source: args.source,
      model: args.model,
      notice: args.notice,
      content: args.content,
    });

    // Budget lines and tasks are only created for an empty plan, so a
    // regenerated blueprint never overwrites the user's own edits.
    const hasBudget = await ctx.db
      .query("budgetItems")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .first();
    const hasTasks = await ctx.db
      .query("tasks")
      .withIndex("by_eventId_and_order", (q) => q.eq("eventId", event._id))
      .first();
    let applied = false;
    if (args.applyToPlan && !hasBudget && !hasTasks) {
      const plan = materializePlan(args.content, event, args.today);
      const now = Date.now();
      for (const item of plan.budgetItems) {
        await ctx.db.insert("budgetItems", {
          eventId: event._id,
          ownerId: event.ownerId,
          category: item.category,
          name: item.name,
          estimated: item.estimated,
          actual: null,
          paid: 0,
          notes: item.notes,
          updatedAt: now,
        });
      }
      for (const [index, task] of plan.tasks.entries()) {
        await ctx.db.insert("tasks", {
          eventId: event._id,
          ownerId: event.ownerId,
          title: task.title,
          notes: task.notes,
          category: task.category,
          priority: task.priority,
          dueMode: "relative",
          offsetDays: task.offsetDays,
          completed: false,
          order: (index + 1) * 1000,
          source: "plan",
        });
      }
      for (const entry of daySchedule(event)) {
        await ctx.db.insert("scheduleItems", {
          eventId: event._id,
          ownerId: event.ownerId,
          ...entry,
          source: "plan",
        });
      }
      applied = true;
    }

    await ctx.db.patch("events", event._id, { planStatus: "ready", updatedAt: Date.now() });
    await logActivity(
      ctx,
      event,
      "plan",
      `${args.source === "ai" ? "AI blueprint" : "Blueprint"} ready${applied ? " with budget and timeline" : ""}`,
    );
    return null;
  },
});

export const markFailed = internalMutation({
  args: { eventId: v.id("events") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db.get("events", args.eventId);
    if (event) await ctx.db.patch("events", event._id, { planStatus: "failed" });
    return null;
  },
});
