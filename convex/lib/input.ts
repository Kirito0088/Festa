import { ConvexError } from "convex/values";
import { CURRENCIES, LIMITS } from "../../lib/constants";
import { daysBetween, isIsoDate, toIsoDate } from "../../lib/dates";

/**
 * Validation for untrusted input. Convex validators check types; these
 * helpers check ranges, lengths and formats, and throw user-safe errors.
 */

export function invalid(message: string): ConvexError<{ code: string; message: string }> {
  return new ConvexError({ code: "INVALID", message });
}

export function cleanText(value: string, field: string, max: number, required = false): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (required && !text) throw invalid(`${field} is required.`);
  if (text.length > max) throw invalid(`${field} must be ${max} characters or fewer.`);
  return text;
}

export function cleanLongText(value: string, field: string, max: number = LIMITS.longTextMax): string {
  const text = value.trim();
  if (text.length > max) throw invalid(`${field} must be ${max} characters or fewer.`);
  return text;
}

export function cleanList(values: string[], field: string, maxItems = 20): string[] {
  if (values.length > maxItems) throw invalid(`Choose up to ${maxItems} ${field}.`);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const text = cleanText(value, field, 60);
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      out.push(text);
    }
  }
  return out;
}

export function cleanMoney(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0 || value > LIMITS.moneyMax) {
    throw invalid(`${field} must be a positive amount.`);
  }
  return Math.round(value * 100) / 100;
}

export function cleanOptionalMoney(value: number | null, field: string): number | null {
  return value === null ? null : cleanMoney(value, field);
}

export function cleanGuestCount(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > LIMITS.guestsMax) {
    throw invalid("Guest count must be a whole number of at least 1.");
  }
  return value;
}

export function cleanOffsetDays(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > LIMITS.offsetDaysMax) {
    throw invalid(`Deadlines can be between 0 and ${LIMITS.offsetDaysMax} days before the event.`);
  }
  return value;
}

export function cleanDate(value: string, field: string): string {
  if (!isIsoDate(value)) throw invalid(`${field} must be a valid date.`);
  return value;
}

export function cleanCurrency(value: string): string {
  if (!(CURRENCIES as readonly string[]).includes(value)) throw invalid("Choose a supported currency.");
  return value;
}

/**
 * The browser supplies its local "today" so deadlines respect the user's
 * time zone. It is only trusted within two days of the server's date.
 */
export function resolveToday(clientToday: string | undefined): string {
  const serverToday = toIsoDate(new Date());
  if (!clientToday || !isIsoDate(clientToday)) return serverToday;
  return Math.abs(daysBetween(serverToday, clientToday)) <= 2 ? clientToday : serverToday;
}
