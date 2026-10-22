import type { PaymentStatus } from "./constants";
import { fromMinor, toMinor } from "./money";

export type BudgetLine = {
  category: string;
  estimated: number;
  /** Final cost once known. `null` means the estimate still stands. */
  actual: number | null;
  paid: number;
};

/** The amount a line will really cost: its actual cost once known. */
export function committedCost(line: BudgetLine): number {
  return line.actual ?? line.estimated;
}

export function paymentStatusOf(line: BudgetLine): PaymentStatus {
  const committed = committedCost(line);
  if (line.paid <= 0) return "unpaid";
  if (committed > 0 && toMinor(line.paid) >= toMinor(committed)) return "paid";
  return "deposit";
}

export function isLineOverspent(line: BudgetLine): boolean {
  return line.actual !== null && toMinor(line.actual) > toMinor(line.estimated);
}

export type CategorySummary = {
  category: string;
  itemCount: number;
  estimated: number;
  actual: number;
  committed: number;
  paid: number;
  /** committed − estimated; positive means the category is running over. */
  variance: number;
  isOverspent: boolean;
};

export type BudgetSummary = {
  total: number;
  estimated: number;
  /** Sum of actual costs entered so far. */
  actual: number;
  committed: number;
  paid: number;
  /** committed − paid, never negative. */
  outstanding: number;
  /** total − committed; negative when the plan is over budget. */
  remaining: number;
  /** committed / total, 0 when there is no budget. */
  utilization: number;
  isOverBudget: boolean;
  overBy: number;
  overspentLines: number;
  categories: CategorySummary[];
};

export function summarizeBudget(total: number, lines: readonly BudgetLine[]): BudgetSummary {
  let estimated = 0;
  let actual = 0;
  let committed = 0;
  let paid = 0;
  let overspentLines = 0;
  const byCategory = new Map<
    string,
    { itemCount: number; estimated: number; actual: number; committed: number; paid: number }
  >();

  for (const line of lines) {
    const e = toMinor(line.estimated);
    const a = line.actual === null ? 0 : toMinor(line.actual);
    const c = toMinor(committedCost(line));
    const p = toMinor(line.paid);
    estimated += e;
    actual += a;
    committed += c;
    paid += p;
    if (isLineOverspent(line)) overspentLines += 1;

    const bucket = byCategory.get(line.category) ?? {
      itemCount: 0,
      estimated: 0,
      actual: 0,
      committed: 0,
      paid: 0,
    };
    bucket.itemCount += 1;
    bucket.estimated += e;
    bucket.actual += a;
    bucket.committed += c;
    bucket.paid += p;
    byCategory.set(line.category, bucket);
  }

  const totalMinor = toMinor(total);
  const remainingMinor = totalMinor - committed;

  const categories: CategorySummary[] = [...byCategory.entries()]
    .map(([category, b]) => ({
      category,
      itemCount: b.itemCount,
      estimated: fromMinor(b.estimated),
      actual: fromMinor(b.actual),
      committed: fromMinor(b.committed),
      paid: fromMinor(b.paid),
      variance: fromMinor(b.committed - b.estimated),
      isOverspent: b.committed > b.estimated,
    }))
    .sort((x, y) => y.committed - x.committed || x.category.localeCompare(y.category));

  return {
    total: fromMinor(totalMinor),
    estimated: fromMinor(estimated),
    actual: fromMinor(actual),
    committed: fromMinor(committed),
    paid: fromMinor(paid),
    outstanding: fromMinor(Math.max(0, committed - paid)),
    remaining: fromMinor(remainingMinor),
    utilization: totalMinor > 0 ? committed / totalMinor : 0,
    isOverBudget: remainingMinor < 0,
    overBy: fromMinor(Math.max(0, -remainingMinor)),
    overspentLines,
    categories,
  };
}
