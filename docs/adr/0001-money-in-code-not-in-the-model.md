# 1. Money is calculated in code, never by the model

Status: accepted (2026-10-20)

## Context

Language models are unreliable at arithmetic, and a planner that shows the wrong total loses trust immediately. Budgets also need exact sums: ₹0.10 + ₹0.20 must equal ₹0.30.

## Decision

The AI blueprint returns percentages and priorities only. `lib/money.ts` turns them into amounts with integer minor units (paise, cents) and a largest-remainder allocation, so the lines always add up to the budget exactly. Every total, remaining amount and overspend figure is computed in `lib/budget.ts`. The concierge's proposals carry before-and-after numbers that the server recomputes from saved data.

## Consequences

- Budget figures are deterministic and unit-tested (`tests/money.test.ts`, `tests/budget.test.ts`).
- The model can still suggest a poor split, but never a wrong sum. Suggested splits are labelled as estimates in the UI.
