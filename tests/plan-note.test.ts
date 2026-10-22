import { describe, expect, it } from "vitest";
import { planNote } from "@/lib/plan-note";

const base = {
  countdown: { days: 75, isToday: false, isPast: false },
  overdue: 0,
  dueSoon: 0,
  openTasks: 11,
  budget: { isOverBudget: false, overBy: 0, remaining: 48_000 },
  currency: "INR",
};

describe("planNote", () => {
  it("leads with the countdown and mentions the most pressing task news", () => {
    expect(planNote({ ...base, overdue: 2, dueSoon: 3 })).toEqual([
      "75 days to go.",
      "Two tasks slipped past their dates.",
      "₹48,000 of the budget is still free.",
    ]);
  });

  it("talks about this week when nothing is overdue", () => {
    expect(planNote({ ...base, dueSoon: 1 })[1]).toBe("One thing is due this week.");
    expect(planNote({ ...base, dueSoon: 4 })[1]).toBe("Four things are due this week.");
    expect(planNote({ ...base })[1]).toBe("Nothing is due this week.");
    expect(planNote({ ...base, openTasks: 0 })[1]).toBe("Every task is ticked off.");
  });

  it("flags an overspend in plain money terms", () => {
    const note = planNote({ ...base, budget: { isOverBudget: true, overBy: 2000, remaining: -2000 } });
    expect(note[2]).toBe("The budget is ₹2,000 over, so it's worth a look.");
  });

  it("drops the budget line when nothing is free or over", () => {
    expect(planNote({ ...base, budget: { isOverBudget: false, overBy: 0, remaining: 0 } })).toHaveLength(2);
  });

  it("changes tone near, on and after the day", () => {
    expect(planNote({ ...base, countdown: { days: 1, isToday: false, isPast: false } })[0]).toBe(
      "Tomorrow's the day.",
    );
    expect(planNote({ ...base, countdown: { days: 5, isToday: false, isPast: false } })[0]).toBe(
      "Only 5 days to go.",
    );
    expect(planNote({ ...base, countdown: { days: 0, isToday: true, isPast: false } })).toEqual([
      "It's today. Enjoy every minute.",
    ]);
    expect(planNote({ ...base, countdown: { days: -3, isToday: false, isPast: true } })).toEqual([
      "That's a wrap. We hope it was everything you wanted.",
    ]);
  });
});
