import type { Priority } from "./constants";
import { deadlineState, resolveDueDate, type DeadlineState, type DueMode } from "./dates";

export type TaskLike = {
  _id: string;
  title: string;
  category: string;
  priority: Priority;
  dueMode: DueMode;
  offsetDays?: number;
  dueDate?: string;
  completed: boolean;
  order: number;
};

export type ResolvedTask<T extends TaskLike> = T & { due: string | null; state: DeadlineState };

/** Adds each task's concrete due date and deadline state. */
export function resolveTasks<T extends TaskLike>(
  tasks: readonly T[],
  eventDate: string,
  today: string,
): ResolvedTask<T>[] {
  return tasks.map((task) => {
    const due = resolveDueDate(task, eventDate);
    return { ...task, due, state: deadlineState(due, today, task.completed) };
  });
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export type TaskSort = "due" | "priority" | "manual";

export function sortTasks<T extends TaskLike & { due: string | null }>(
  tasks: readonly T[],
  sort: TaskSort,
): T[] {
  const copy = [...tasks];
  if (sort === "manual") return copy.sort((a, b) => a.order - b.order);
  if (sort === "priority") {
    return copy.sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        (a.due ?? "9999").localeCompare(b.due ?? "9999") ||
        a.order - b.order,
    );
  }
  return copy.sort(
    (a, b) =>
      (a.due ?? "9999").localeCompare(b.due ?? "9999") ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.order - b.order,
  );
}

/** Open tasks with the nearest deadlines first (overdue included). */
export function upcomingTasks<T extends TaskLike & { due: string | null }>(
  tasks: readonly T[],
  limit = 5,
): T[] {
  return sortTasks(
    tasks.filter((task) => !task.completed && task.due !== null),
    "due",
  ).slice(0, limit);
}

/**
 * Applies a drag-and-drop reorder of a filtered subset to the full manual
 * order: visible tasks take the slots they already occupied, in their new
 * order; hidden tasks keep their positions. Returns every ID in order.
 */
export function mergeReorder(fullOrder: readonly string[], visibleNewOrder: readonly string[]): string[] {
  const visible = new Set(visibleNewOrder);
  const queue = [...visibleNewOrder];
  return fullOrder.map((id) => (visible.has(id) ? (queue.shift() ?? id) : id));
}

export type DeadlineGroup = "overdue" | "week" | "month" | "later" | "undated" | "done";

export const DEADLINE_GROUP_LABELS: Record<DeadlineGroup, string> = {
  overdue: "Overdue",
  week: "Next 7 days",
  month: "Next 30 days",
  later: "Later",
  undated: "No deadline",
  done: "Completed",
};

export function deadlineGroup(
  task: { completed: boolean; due: string | null },
  daysUntilDue: number | null,
): DeadlineGroup {
  if (task.completed) return "done";
  if (task.due === null || daysUntilDue === null) return "undated";
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 7) return "week";
  if (daysUntilDue <= 30) return "month";
  return "later";
}
