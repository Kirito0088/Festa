import { describe, expect, it } from "vitest";
import {
  allocateByWeights,
  currencySymbol,
  formatMoney,
  planningStep,
  roundTo,
  sumMoney,
  subtractMoney,
} from "@/lib/money";

describe("sumMoney", () => {
  it("adds without floating-point drift", () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney([19.99, 0.01, 80])).toBe(100);
    expect(subtractMoney(0.3, 0.1)).toBe(0.2);
  });
});

describe("allocateByWeights", () => {
  it("splits a budget into parts that add up exactly", () => {
    const parts = allocateByWeights(200_000, [21, 33, 14, 10, 7, 7, 2, 6]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(200_000);
    for (const part of parts) expect(part % 500).toBe(0);
  });

  it("keeps the exact total when it is not a multiple of the step", () => {
    const parts = allocateByWeights(123_457, [1, 1, 1]);
    expect(sumMoney(parts)).toBe(123_457);
  });

  it("handles awkward weights and non-integer totals", () => {
    const parts = allocateByWeights(999.99, [1, 2, 3, 4], 1);
    expect(sumMoney(parts)).toBe(999.99);
  });

  it("ignores invalid weights and returns zeros when nothing is allocatable", () => {
    expect(allocateByWeights(1000, [0, -1, Number.NaN])).toEqual([0, 0, 0]);
    expect(allocateByWeights(0, [1, 2])).toEqual([0, 0]);
    expect(allocateByWeights(1000, [])).toEqual([]);
  });

  it("is proportional", () => {
    const [a, b] = allocateByWeights(100_000, [75, 25]);
    expect(a).toBe(75_000);
    expect(b).toBe(25_000);
  });
});

describe("planningStep", () => {
  it("scales the rounding step with the budget", () => {
    expect(planningStep(5_000_000)).toBe(1000);
    expect(planningStep(200_000)).toBe(500);
    expect(planningStep(50_000)).toBe(100);
    expect(planningStep(500)).toBe(1);
  });
});

describe("formatMoney", () => {
  it("uses Indian digit grouping for INR", () => {
    expect(formatMoney(160_000, "INR")).toBe("₹1,60,000");
  });

  it("formats other currencies", () => {
    expect(formatMoney(5000, "USD")).toBe("$5,000");
  });

  it("supports compact formatting", () => {
    expect(formatMoney(150_000, "INR", { compact: true })).toMatch(/1\.5L|150T|150K/i);
    expect(formatMoney(5000, "USD", { compact: true })).toMatch(/5(\.0)?K/i);
  });

  it("falls back gracefully when an unsupported currency is passed", () => {
    expect(formatMoney(100, "INVALID_CURRENCY_CODE")).toBeDefined();
  });
});

describe("roundTo", () => {
  it("rounds to nearest step", () => {
    expect(roundTo(145, 50)).toBe(150);
    expect(roundTo(120, 50)).toBe(100);
  });

  it("returns original amount when step is zero or negative", () => {
    expect(roundTo(145, 0)).toBe(145);
    expect(roundTo(145, -10)).toBe(145);
  });
});

describe("currencySymbol", () => {
  it("extracts the currency symbol", () => {
    expect(currencySymbol("INR")).toBe("₹");
    expect(currencySymbol("USD")).toBe("$");
  });
});
