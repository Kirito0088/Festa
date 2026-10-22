import { describe, expect, it } from "vitest";
import { isSafeImageUrl } from "@/lib/inspiration";
import {
  deadlineGroup,
  mergeReorder,
  resolveTasks,
  sortTasks,
  upcomingTasks,
  type TaskLike,
} from "@/lib/tasks";

const task = (overrides: Partial<TaskLike>): TaskLike => ({
  _id: "t",
  title: "Task",
  category: "other",
  priority: "medium",
  dueMode: "none",
  completed: false,
  order: 0,
  ...overrides,
});

const tasks: TaskLike[] = [
  task({ _id: "a", priority: "low", dueMode: "relative", offsetDays: 10, order: 1000 }),
  task({ _id: "b", priority: "high", dueMode: "relative", offsetDays: 40, order: 2000 }),
  task({ _id: "c", priority: "medium", dueMode: "fixed", dueDate: "2027-01-01", order: 3000 }),
  task({ _id: "d", priority: "high", dueMode: "none", order: 4000 }),
  task({ _id: "e", priority: "high", dueMode: "relative", offsetDays: 5, order: 5000, completed: true }),
];

describe("task ordering", () => {
  const resolved = resolveTasks(tasks, "2027-03-01", "2027-01-10");

  it("resolves due dates and states", () => {
    expect(resolved.find((t) => t._id === "c")?.state).toBe("overdue");
    expect(resolved.find((t) => t._id === "d")?.due).toBeNull();
    expect(resolved.find((t) => t._id === "e")?.state).toBe("done");
  });

  it("sorts by deadline, priority or manual order", () => {
    expect(sortTasks(resolved, "due").map((t) => t._id)).toEqual(["c", "b", "a", "e", "d"]);
    expect(sortTasks(resolved, "priority").map((t) => t._id)).toEqual(["b", "e", "d", "c", "a"]);
    expect(sortTasks(resolved, "manual").map((t) => t._id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("lists upcoming open tasks with deadlines", () => {
    expect(upcomingTasks(resolved, 2).map((t) => t._id)).toEqual(["c", "b"]);
  });

  it("groups deadlines", () => {
    expect(deadlineGroup({ completed: false, due: "x" }, -1)).toBe("overdue");
    expect(deadlineGroup({ completed: false, due: "x" }, 3)).toBe("week");
    expect(deadlineGroup({ completed: false, due: "x" }, 20)).toBe("month");
    expect(deadlineGroup({ completed: false, due: "x" }, 90)).toBe("later");
    expect(deadlineGroup({ completed: false, due: null }, null)).toBe("undated");
    expect(deadlineGroup({ completed: true, due: "x" }, 1)).toBe("done");
  });
});

describe("mergeReorder", () => {
  it("reorders the visible subset in place, keeping hidden tasks where they were", () => {
    // Visible: a, c, e (b and d are filtered out). User drags e to the top.
    expect(mergeReorder(["a", "b", "c", "d", "e"], ["e", "a", "c"])).toEqual(["e", "b", "a", "d", "c"]);
  });

  it("is a no-op for an unchanged order", () => {
    expect(mergeReorder(["a", "b", "c"], ["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });
});

describe("isSafeImageUrl", () => {
  it("only allows https image links", () => {
    expect(isSafeImageUrl("https://images.unsplash.com/photo-1?w=900")).toBe(true);
    expect(isSafeImageUrl("http://example.com/a.jpg")).toBe(false);
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeImageUrl('https://x.com/a.jpg" onerror="alert(1)')).toBe(false);
    expect(isSafeImageUrl("data:image/png;base64,AAAA")).toBe(false);
  });
});
