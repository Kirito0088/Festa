import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Groq's free tier allows each model about 30 requests and 8,000 tokens a
 * minute, and 1,000 requests and 200,000 tokens a day. The global limits
 * below stay under those, so Festa falls back to its built-in planner
 * before Groq starts refusing. Per-user limits stop one person, or one
 * anonymous demo session, from spending the shared quota.
 */
export const AI_TOKENS_PER_MINUTE = 7_000;

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  aiPlanPerUser: { kind: "token bucket", rate: 6, period: HOUR, capacity: 3 },
  aiConciergePerUser: { kind: "token bucket", rate: 40, period: HOUR, capacity: 8 },
  aiGlobal: { kind: "fixed window", rate: 25, period: MINUTE },
  aiTokensPerMinute: {
    kind: "token bucket",
    rate: AI_TOKENS_PER_MINUTE,
    period: MINUTE,
    capacity: AI_TOKENS_PER_MINUTE,
  },
  aiRequestsPerDay: { kind: "fixed window", rate: 900, period: DAY },
  aiTokensPerDay: { kind: "fixed window", rate: 180_000, period: DAY },
  createEventPerUser: { kind: "token bucket", rate: 20, period: HOUR, capacity: 5 },
  demoSeedPerUser: { kind: "token bucket", rate: 3, period: HOUR, capacity: 2 },
  // Every new anonymous session gets fresh per-user buckets, so demos also
  // share a global allowance.
  demoSeedGlobal: { kind: "token bucket", rate: 60, period: HOUR, capacity: 15 },
  // Creating budget lines, tasks, vendors, inspiration and chat messages.
  writesPerUser: { kind: "token bucket", rate: 300, period: HOUR, capacity: 60 },
});

/** Throws a friendly RATE_LIMITED error once a user creates records too quickly. */
export async function limitWrites(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  const status = await rateLimiter.limit(ctx, "writesPerUser", { key: userId });
  if (!status.ok) {
    throw new ConvexError({
      code: "RATE_LIMITED",
      message: "You're adding things very quickly. Please wait a moment and try again.",
    });
  }
}
