/**
 * Deterministic money helpers. All arithmetic runs in integer minor units
 * (paise, cents) so totals never drift because of floating point.
 */

/**
 * Converts a major currency unit to minor integer units (e.g. rupees to paise, dollars to cents).
 *
 * @param amount - Currency amount in major units.
 * @returns Integer minor units.
 */
export function toMinor(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts minor integer units back to major currency units.
 *
 * @param minor - Integer minor units.
 * @returns Major units floating point representation.
 */
export function fromMinor(minor: number): number {
  return minor / 100;
}

/**
 * Sums an array of currency amounts without floating-point drift.
 *
 * @param values - Array of amounts in major currency units.
 * @returns Exact sum in major units.
 */
export function sumMoney(values: readonly number[]): number {
  return fromMinor(values.reduce((total, value) => total + toMinor(value), 0));
}

/**
 * Subtracts one currency amount from another safely in minor units.
 *
 * @param a - Minuend.
 * @param b - Subtrahend.
 * @returns Difference in major units.
 */
export function subtractMoney(a: number, b: number): number {
  return fromMinor(toMinor(a) - toMinor(b));
}

/**
 * Rounds an amount to the nearest `step` without dropping below zero.
 *
 * @param amount - Initial amount.
 * @param step - Rounding step unit.
 * @returns Non-negative rounded amount.
 */
export function roundTo(amount: number, step: number): number {
  if (step <= 0) return amount;
  return Math.max(0, Math.round(amount / step) * step);
}

/**
 * Computes an appropriate rounding granularity based on overall budget size.
 *
 * @param total - Total celebration budget.
 * @returns Recommended rounding step.
 */
export function planningStep(total: number): number {
  if (total >= 1_000_000) return 1000;
  if (total >= 100_000) return 500;
  if (total >= 10_000) return 100;
  if (total >= 1_000) return 10;
  return 1;
}

/**
 * Splits `total` across `weights` so the parts are multiples of `step`
 * and add up to exactly `total` (largest-remainder method).
 */
export function allocateByWeights(
  total: number,
  weights: readonly number[],
  step = planningStep(total),
): number[] {
  if (weights.length === 0) return [];
  const safeWeights = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const weightSum = safeWeights.reduce((a, b) => a + b, 0);
  const totalMinor = toMinor(Math.max(0, total));
  if (weightSum === 0 || totalMinor === 0) return weights.map(() => 0);

  const stepMinor = Math.max(1, toMinor(step));
  const units = Math.floor(totalMinor / stepMinor);
  const leftoverMinor = totalMinor - units * stepMinor;

  const exact = safeWeights.map((w) => (w / weightSum) * units);
  const floors = exact.map((x) => Math.floor(x));
  let remaining = units - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((x, index) => ({ index, fraction: x - Math.floor(x) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order) {
    if (remaining <= 0) break;
    floors[index] += 1;
    remaining -= 1;
  }

  const minor = floors.map((u) => u * stepMinor);
  // Any amount smaller than one step goes to the largest share.
  const largest = safeWeights.indexOf(Math.max(...safeWeights));
  minor[largest] += leftoverMinor;
  return minor.map(fromMinor);
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const locale = currency === "INR" ? "en-IN" : "en-US";
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? "compact" : "standard",
    });
  } catch {
    formatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      notation: compact ? "compact" : "standard",
    });
  }
  formatterCache.set(key, formatter);
  return formatter;
}

export function formatMoney(amount: number, currency: string, options: { compact?: boolean } = {}): string {
  return getFormatter(currency, options.compact ?? false).format(amount);
}

export function currencySymbol(currency: string): string {
  const parts = getFormatter(currency, false).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}
