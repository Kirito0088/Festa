import type { Blueprint } from "../ai/blueprint";
import type { Category, Priority } from "../constants";
import { clampOffsetDays } from "../dates";
import { allocateByWeights } from "../money";

export type PlannedBudgetItem = {
  category: Category;
  name: string;
  estimated: number;
  notes: string;
};

export type PlannedTask = {
  title: string;
  category: Category;
  priority: Priority;
  offsetDays: number;
  notes: string;
};

/**
 * Turns a blueprint's percentages and lead times into concrete budget lines
 * and event-relative tasks. This is the only place generated plans become
 * money and dates, and it is fully deterministic.
 */
export function materializePlan(
  blueprint: Blueprint,
  event: { budget: number; date: string },
  today: string,
): { budgetItems: PlannedBudgetItem[]; tasks: PlannedTask[] } {
  const amounts = allocateByWeights(
    event.budget,
    blueprint.budget.map((line) => line.percent),
  );

  const budgetItems = blueprint.budget.map((line, index) => ({
    category: line.category,
    name: line.label,
    estimated: amounts[index],
    notes: line.note,
  }));

  const tasks = blueprint.tasks
    .map((task) => ({
      title: task.title,
      category: task.category,
      priority: task.priority,
      offsetDays: clampOffsetDays(task.daysBeforeEvent, event.date, today),
      notes: task.note,
    }))
    // Earliest deadline first: larger offsets come first.
    .sort((a, b) => b.offsetDays - a.offsetDays);

  return { budgetItems, tasks };
}
