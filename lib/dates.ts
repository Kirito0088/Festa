import { addDays, differenceInCalendarDays, format, isValid, parse, subDays } from "date-fns";

/**
 * Event and task dates are calendar dates stored as `YYYY-MM-DD` strings.
 * They have no time zone: "the wedding is on 14 Feb" means the same day
 * everywhere, so we never convert them through UTC timestamps.
 */
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses an ISO date string (YYYY-MM-DD) into a native Date object.
 *
 * @param value - ISO date string.
 * @returns Parsed Date object.
 * @throws Error if string is not a valid calendar date.
 */
export function parseIsoDate(value: string): Date {
  const date = parse(value, "yyyy-MM-dd", new Date(2000, 0, 1));
  if (!ISO_DATE.test(value) || !isValid(date)) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

/**
 * Validates whether a string is a valid ISO calendar date.
 *
 * @param value - Date string to test.
 * @returns True if the string is formatted as YYYY-MM-DD and represents a real calendar date.
 */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  return isValid(parse(value, "yyyy-MM-dd", new Date(2000, 0, 1)));
}

/**
 * Formats a Date object to an ISO calendar date string (YYYY-MM-DD).
 *
 * @param date - Input date object.
 * @returns YYYY-MM-DD string representation.
 */
export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Shifts an ISO date string by a given number of days.
 *
 * @param value - Initial ISO date string.
 * @param days - Number of days to add (positive) or subtract (negative).
 * @returns New ISO date string.
 */
export function shiftIsoDate(value: string, days: number): string {
  return toIsoDate(addDays(parseIsoDate(value), days));
}

/**
 * Computes the signed number of calendar days from one ISO date to another.
 *
 * @param from - Start date string.
 * @param to - End date string.
 * @returns Calendar day difference (positive if `to` is in the future).
 */
export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(parseIsoDate(to), parseIsoDate(from));
}

/**
 * Formats an ISO date into human-readable strings according to the requested pattern.
 *
 * @param value - ISO date string.
 * @param pattern - Display format pattern ("long", "short", "weekday", "invitation").
 * @returns Human-friendly formatted date string.
 */
export function formatIsoDate(
  value: string,
  pattern: "long" | "short" | "weekday" | "invitation" = "long",
): string {
  const date = parseIsoDate(value);
  if (pattern === "short") return format(date, "d MMM");
  if (pattern === "weekday") return format(date, "EEE, d MMM yyyy");
  if (pattern === "invitation") return format(date, "EEEE, d MMMM yyyy");
  return format(date, "d MMMM yyyy");
}

export type DueMode = "relative" | "fixed" | "none";

export type TaskDue = {
  dueMode: DueMode;
  /** Days before the event, for relative deadlines. */
  offsetDays?: number;
  dueDate?: string;
};

/**
 * Relative deadlines follow the event: move the event and every relative
 * task moves with it.
 */
export function resolveDueDate(task: TaskDue, eventDate: string): string | null {
  if (task.dueMode === "relative" && task.offsetDays !== undefined) {
    return toIsoDate(subDays(parseIsoDate(eventDate), task.offsetDays));
  }
  if (task.dueMode === "fixed" && task.dueDate) return task.dueDate;
  return null;
}

/**
 * A generated task cannot be due before today. If the ideal lead time has
 * already passed, the task is due today instead.
 */
export function clampOffsetDays(idealOffset: number, eventDate: string, today: string): number {
  const daysLeft = Math.max(0, daysBetween(today, eventDate));
  return Math.max(0, Math.min(Math.round(idealOffset), daysLeft));
}

export type DeadlineState = "done" | "overdue" | "today" | "soon" | "upcoming" | "none";

export function deadlineState(dueDate: string | null, today: string, completed: boolean): DeadlineState {
  if (completed) return "done";
  if (!dueDate) return "none";
  const diff = daysBetween(today, dueDate);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "soon";
  return "upcoming";
}

export function relativeDayLabel(target: string, today: string): string {
  const diff = daysBetween(today, target);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 0) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export type Countdown = {
  days: number;
  weeks: number;
  isPast: boolean;
  isToday: boolean;
};

export function countdownTo(eventDate: string, today: string): Countdown {
  const days = daysBetween(today, eventDate);
  return {
    days,
    weeks: Math.floor(Math.max(0, days) / 7),
    isPast: days < 0,
    isToday: days === 0,
  };
}

/** Human description of a relative deadline, e.g. "6 weeks before". */
export function describeOffset(offsetDays: number): string {
  if (offsetDays === 0) return "On the day";
  if (offsetDays % 30 === 0 && offsetDays >= 60) return `${offsetDays / 30} months before`;
  if (offsetDays % 7 === 0 && offsetDays >= 14) return `${offsetDays / 7} weeks before`;
  if (offsetDays === 1) return "1 day before";
  return `${offsetDays} days before`;
}
