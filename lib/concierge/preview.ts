import { summarizeBudget, type BudgetLine, type BudgetSummary } from "../budget";
import type { ProposedChange } from "./proposal";

export type PreviewItem = BudgetLine & { id: string };

export type ProposalPreview = {
  budgetBefore: number;
  budgetAfter: number;
  guestsBefore: number;
  guestsAfter: number;
  before: BudgetSummary;
  after: BudgetSummary;
};

/**
 * Computes, in application code, what the budget looks like if the given
 * changes are applied. The concierge's own numbers are never trusted for this.
 */
export function previewProposal(
  changes: readonly ProposedChange[],
  state: { budget: number; guestCount: number; items: readonly PreviewItem[] },
): ProposalPreview {
  let budgetAfter = state.budget;
  let guestsAfter = state.guestCount;
  const items = state.items.map((item) => ({ ...item }));

  for (const change of changes) {
    switch (change.type) {
      case "set_event_budget":
        budgetAfter = change.amount;
        break;
      case "set_guest_count":
        guestsAfter = change.count;
        break;
      case "update_budget_item": {
        const item = items.find((candidate) => candidate.id === change.itemId);
        if (item) item.estimated = change.estimated;
        break;
      }
      case "add_budget_item":
        items.push({
          id: `new:${change.name}`,
          category: change.category,
          estimated: change.estimated,
          actual: null,
          paid: 0,
        });
        break;
      case "add_task":
      case "update_task":
        break;
    }
  }

  return {
    budgetBefore: state.budget,
    budgetAfter,
    guestsBefore: state.guestCount,
    guestsAfter,
    before: summarizeBudget(state.budget, state.items),
    after: summarizeBudget(budgetAfter, items),
  };
}
