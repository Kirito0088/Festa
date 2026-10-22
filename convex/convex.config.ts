import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    // Free-tier Groq key. When absent, Festa uses its deterministic planner.
    GROQ_API_KEY: v.optional(v.string()),
    // Optional overrides for the primary and fallback models.
    GROQ_MODEL: v.optional(v.string()),
    GROQ_FALLBACK_MODEL: v.optional(v.string()),
  },
});

app.use(rateLimiter);

export default app;
