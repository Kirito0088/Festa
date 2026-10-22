# 3. A built-in planner backs up the AI

Status: accepted (2026-10-20)

## Context

Festa runs on Groq's free tier: about 8,000 tokens a minute and 1,000 requests a day per model. Keys can also be missing in development, and the provider can time out.

## Decision

`lib/plan/template.ts` produces a complete blueprint of the same shape as the AI's, from rules alone. The concierge has an offline assistant for budget, guest-count and task changes. AI calls go through `lib/ai/groq.ts`, which handles timeouts, retries, `Retry-After` and model fallback, and through shared rate limits (`convex/lib/rateLimits.ts`) that stop before Groq's limits are reached. Any refusal or invalid output falls back to the deterministic path, with a notice saying why.

## Consequences

- Every feature works with no AI at all, which also makes the test suite independent of the network.
- The UI always labels whether a blueprint or reply came from AI or the built-in planner.
