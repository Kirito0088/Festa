import { describe, expect, it } from "vitest";
import { committedCost, isLineOverspent, paymentStatusOf, summarizeBudget, type BudgetLine } from "@/lib/budget";

const line = (overrides: Partial<BudgetLine>): BudgetLine => ({
  category: "venue",
  estimated: 0,
  actual: null,
  paid: 0,
  ...overrides,
});

describe("committedCost", () => {
  it("uses the actual cost once known, otherwise the estimate", () => {
    expect(committedCost(line({ estimated: 100 }))).toBe(100);
    expect(committedCost(line({ estimated: 100, actual: 120 }))).toBe(120);
    expect(committedCost(line({ estimated: 100, actual: 0 }))).toBe(0);
  });
});

describe("paymentStatusOf", () => {
  it("derives unpaid, deposit and paid", () => {
    expect(paymentStatusOf(line({ estimated: 100 }))).toBe("unpaid");
    expect(paymentStatusOf(line({ estimated: 100, paid: 30 }))).toBe("deposit");
    expect(paymentStatusOf(line({ estimated: 100, paid: 100 }))).toBe("paid");
    expect(paymentStatusOf(line({ estimated: 100, actual: 150, paid: 100 }))).toBe("deposit");
  });
});

describe("summarizeBudget", () => {
  const lines: BudgetLine[] = [
    line({ category: "venue", estimated: 42_000, actual: 46_000, paid: 20_000 }),
    line({ category: "catering", estimated: 66_000 }),
    line({ category: "catering", estimated: 4_000, actual: 3_500, paid: 3_500 }),
    line({ category: "decor", estimated: 28_000 }),
  ];

  it("computes totals deterministically", () => {
    const summary = summarizeBudget(160_000, lines);
    expect(summary.estimated).toBe(140_000);
    expect(summary.actual).toBe(49_500);
    expect(summary.committed).toBe(143_500);
    expect(summary.paid).toBe(23_500);
    expect(summary.outstanding).toBe(120_000);
    expect(summary.remaining).toBe(16_500);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.overspentLines).toBe(1);
  });

  it("flags overspending and reports how much", () => {
    const summary = summarizeBudget(120_000, lines);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.overBy).toBe(23_500);
    expect(summary.remaining).toBe(-23_500);
  });

  it("groups by category, largest first, with variance", () => {
    const summary = summarizeBudget(160_000, lines);
    expect(summary.categories.map((c) => c.category)).toEqual(["catering", "venue", "decor"]);
    const venue = summary.categories.find((c) => c.category === "venue");
    expect(venue?.variance).toBe(4_000);
    expect(venue?.isOverspent).toBe(true);
    const catering = summary.categories.find((c) => c.category === "catering");
    expect(catering?.variance).toBe(-500);
    expect(catering?.isOverspent).toBe(false);
  });

  it("handles an empty plan and zero budget", () => {
    const summary = summarizeBudget(0, []);
    expect(summary.utilization).toBe(0);
    expect(summary.categories).toEqual([]);
    expect(summary.remaining).toBe(0);
  });

  it("stays exact with decimal amounts", () => {
    const summary = summarizeBudget(1, [line({ estimated: 0.1 }), line({ estimated: 0.2 })]);
    expect(summary.committed).toBe(0.3);
    expect(summary.remaining).toBe(0.7);
  });

  it("detects overspent lines", () => {
    expect(isLineOverspent(line({ estimated: 100, actual: 100.01 }))).toBe(true);
    expect(isLineOverspent(line({ estimated: 100, actual: 100 }))).toBe(false);
    expect(isLineOverspent(line({ estimated: 100 }))).toBe(false);
  });
});
