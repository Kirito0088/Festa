# Security

## Reporting a vulnerability

Please report security issues privately through [GitHub security advisories](https://github.com/Kirito0088/Festa/security/advisories/new) rather than in a public issue. You'll get an acknowledgement within a few days.

## How Festa protects data

**Secrets.** The Groq API key and the Convex Auth signing keys live only in Convex environment variables. Nothing secret is in the repository, the client bundle or Vercel. `.env*` files are ignored; `.env.example` lists variable names only.

**Authentication and authorization.** Convex Auth handles password and anonymous demo sign-in, and limits failed password attempts to 10 an hour. Every public Convex function derives the user from the session, never from an argument, and checks that the user owns the celebration or record (`convex/lib/access.ts`). Missing, malformed and foreign IDs all return the same "not found" error, so IDs can't be probed. `convex/festa.test.ts` tests these boundaries, including a second user trying to read, change or apply another user's data.

**Input validation.** Every function declares Convex argument validators, and `convex/lib/input.ts` trims, bounds and checks text, money, dates, guest counts and URLs on the server. Image links must be `https:`. Forms validate the same rules with Zod for clear inline errors, but the server never trusts the client.

**AI output.** Groq is called only from Convex actions. Responses must match a strict JSON schema and pass Zod validation before use; anything else falls back to the built-in planner. The concierge can only propose changes, which the user approves and the server re-validates; it has no way to delete data ([ADR 2](docs/adr/0002-concierge-proposes-the-user-approves.md)).

**Rate limits** (`convex/lib/rateLimits.ts`, using `@convex-dev/rate-limiter`):

| Limit                                                                           | Scope                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| AI blueprints and concierge replies                                             | per user, hourly buckets                                      |
| Groq requests and tokens                                                        | shared per-minute and per-day budgets, below Groq's free tier |
| A cooldown after any Groq 429                                                   | shared                                                        |
| Creating budget lines, tasks, vendors, inspiration, schedule items and messages | per user                                                      |
| New celebrations and demo seeding                                               | per user, plus a global demo allowance                        |

**HTTP headers** (`next.config.ts`). A content security policy (`default-src 'self'`, explicit `connect-src` for Convex, `frame-ancestors 'none'`, `object-src 'none'`), HSTS with preload, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy` and `Cross-Origin-Opener-Policy: same-origin`. Inline scripts are allowed so pages stay statically rendered ([ADR 5](docs/adr/0005-csp-allows-inline-scripts.md)).

**Errors.** Only messages raised deliberately as `ConvexError` reach the user (`lib/errors.ts`); anything unexpected becomes a generic sentence, so stack traces and provider details never leak.

## Dependencies

`npm audit --omit=dev` reports no known vulnerabilities in production dependencies.

The development toolchain has one open advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) in `braces` (≤3.0.3, no fixed release yet), pulled in by `eslint-config-next` and the `shadcn` CLI. These run only on developer machines and in CI against the repository's own files, never on user input, and are not part of the deployed app.
