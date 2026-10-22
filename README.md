# Festa — Make room for moments

Festa is an AI-powered celebration planner for weddings, birthdays, engagements and community events. A guided brief produces a validated blueprint (concept, palette, budget split, dated checklist, vendor plan, risks), then Festa keeps the budget, timeline, vendors, inspiration and an AI concierge in sync.

Built for **PromptWars Virtual — Challenge 5: Celebration & Event Planner**. See [`docs/promptwars.md`](docs/promptwars.md) for challenge rules and how Festa maps to the evaluation criteria.

## Features

- **Celebration wizard** — 8 short steps, optional ones skippable, sensible defaults.
- **AI blueprint** — Groq (`openai/gpt-oss-120b`, fallback `openai/gpt-oss-20b`) with strict JSON-schema output, Zod validation, retries, timeouts and rate-limit handling. If AI is unavailable, a deterministic built-in planner produces the same shape.
- **Dashboard** — countdown, budget ring, checklist progress, upcoming deadlines, vendor bookings, live activity.
- **Budget Studio** — estimates, actuals, deposits and payments; category chart; overspend detection. All arithmetic runs in integer minor units in app code; the AI only proposes percentages.
- **Smart timeline** — event-relative deadlines that move with the date, filters, sorting, drag-and-drop reordering (keyboard accessible), Google Calendar links.
- **Vendor desk** — quotes, contacts, booking and payment status, side-by-side comparison. Blueprint suggestions are categories only, never fabricated businesses.
- **Inspiration board** — curated Unsplash library, image links, colour swatches, notes, graceful image fallbacks.
- **Concierge** — reads the saved plan, explains trade-offs and proposes changes with deterministic before/after numbers. Nothing is applied until the user approves, every change is re-validated server-side, and there is no delete capability. An offline assistant handles budget and guest-count changes when AI is unavailable.
- **Demo mode** — an isolated anonymous session seeded with a clearly labelled sample engagement.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui on Radix · Motion · Convex (database, functions, scheduler, Convex Auth, rate limiter) · Groq · Zod · React Hook Form · Recharts · dnd-kit · date-fns · Sonner · Vitest + convex-test.

Google services used without paid APIs: Google Fonts (Instrument Serif, Geist), Google Calendar event templates, Google Maps search links.

## Setup

```bash
npm install
npx convex dev          # creates a deployment and writes .env.local (keep running)
npm run dev             # http://localhost:3000
```

Convex Auth needs `JWT_PRIVATE_KEY`, `JWKS` and `SITE_URL` on the Convex deployment (see https://labs.convex.dev/auth/setup/manual). AI is optional:

```bash
npx convex env set GROQ_API_KEY=<your free Groq key>
```

Optional: `GROQ_MODEL`, `GROQ_FALLBACK_MODEL` to override models. Secrets live only in Convex environment variables, never in the browser bundle.

## Scripts

`npm run check` (typecheck + lint + tests) · `npm test` · `npm run typecheck` · `npm run lint` · `npm run format` · `npm run build`

## Architecture notes

- `lib/` — pure, tested domain logic shared by Convex and the UI (money, budget, dates, AI schemas and client, planner, concierge).
- `convex/` — schema, authorization helpers (`lib/access.ts`), CRUD functions, plan generation (`plans.ts`), concierge (`concierge.ts`), demo seeding.
- Every event-owned record stores `ownerId`; every public function checks ownership. Foreign and missing IDs return the same "not found" error.
- AI calls run only in Convex actions, are rate-limited per user and globally (`@convex-dev/rate-limiter`), and their output never touches the database without validation.

## Deployment

Convex free plan + Vercel Hobby. Set the Vercel build command to `npx convex deploy --cmd 'npm run build'` with `CONVEX_DEPLOY_KEY` configured. Not yet deployed.
