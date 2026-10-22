# 2. The concierge proposes; the user approves

Status: accepted (2026-10-20)

## Context

A chat assistant that edits a plan directly can silently overwrite decisions, and its output can be steered by text the user pasted in (prompt injection).

## Decision

Concierge replies are structured JSON validated with Zod (`lib/concierge/proposal.ts`). Proposed changes are stored on the message as a proposal, never applied. The user applies a whole proposal or chosen parts; `convex/concierge.ts` re-validates each change against the current records, skips any that no longer match and records which indexes were applied. The concierge cannot delete anything. Conversation storage is hand-rolled in `conciergeMessages` because each message needs a proposal and an applied state, which a generic agent thread does not model.

## Consequences

- Nothing in the plan changes without an explicit click, so a manipulated reply can at worst propose something the user declines.
- Handled proposals show what was applied rather than live data, so history stays accurate.
