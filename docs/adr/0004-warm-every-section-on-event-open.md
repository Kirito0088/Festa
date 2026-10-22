# 4. Subscribe to every section's data when an event opens

Status: accepted (2026-10-22)

## Context

Each event tab is a client component that subscribes to its own Convex queries. On a real network, every tab switch waited for its first query result and flashed a skeleton.

## Decision

`WarmSections` in `components/events/event-workspace.tsx` subscribes to every section's queries as soon as the event route opens, in parallel with the event itself. It stays mounted with the event header, so a section's `useQuery` with the same arguments returns the cached result on mount. Errors are values (`useQueries`), so a bad or foreign ID cannot crash it.

## Consequences

- Measured at a simulated 150 ms round trip, tab switches went from 202–333 ms to 44–164 ms, with no data skeletons.
- An open event holds a few more live subscriptions. Each is bounded and scoped to one event, so the cost is small.
