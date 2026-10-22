import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

/**
 * Keeps Festa inside Groq's free tier (roughly 30 requests per minute per
 * organisation) and stops one user from exhausting the shared quota.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  aiPlanPerUser: { kind: "token bucket", rate: 6, period: HOUR, capacity: 3 },
  aiConciergePerUser: { kind: "token bucket", rate: 40, period: HOUR, capacity: 8 },
  aiGlobal: { kind: "fixed window", rate: 25, period: MINUTE },
  createEventPerUser: { kind: "token bucket", rate: 20, period: HOUR, capacity: 5 },
  demoSeedPerUser: { kind: "token bucket", rate: 3, period: HOUR, capacity: 2 },
});
