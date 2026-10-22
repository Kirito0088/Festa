# 6. The Convex backend deploys from the CLI; Vercel builds the frontend

Status: accepted (2026-10-22)

## Context

The usual Convex and Vercel setup runs `npx convex deploy` inside the Vercel build, authenticated by a `CONVEX_DEPLOY_KEY`. The production Convex deployment (`dynamic-hawk-395`) holds the auth signing keys and the Groq key and lives in the project owner's Convex team.

## Decision

`vercel.json` builds the frontend with the production deployment's public URLs, which ship in the client bundle anyway. Functions, schema and indexes deploy from the Convex CLI (`npx convex deploy`) after backend changes. Vercel serves functions from Mumbai (`bom1`), close to Festa's users; server rendering never calls Convex, because the browser talks to it directly.

## Consequences

- No deploy key or other secret is needed in Vercel.
- A push that changes `convex/` must be followed by a CLI deploy. CI typechecks and tests the backend on every push, so a missed deploy is caught as a mismatch rather than a broken build.
