import { formatMoney } from "@/lib/money";

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

/** "Two", or "12" past nine, as style guides spell small counts out. */
function count(n: number): string {
  return WORDS[n] ?? String(n);
}

export type PlanNoteInput = {
  countdown: { days: number; isToday: boolean; isPast: boolean };
  overdue: number;
  /** Open tasks due within the next seven days, today included. */
  dueSoon: number;
  openTasks: number;
  budget: { isOverBudget: boolean; overBy: number; remaining: number };
  currency: string;
};

/**
 * Generates an empathetic, conversational plan summary snapshot in natural human sentences.
 *
 * @param input - Plan metrics including countdown, overdue counts, tasks due soon, and budget health.
 * @returns Array of readable sentences describing current state and immediate actions.
 */
export function planNote(input: PlanNoteInput): string[] {
  const { countdown, overdue, dueSoon, openTasks, budget, currency } = input;

  if (countdown.isPast) return ["That's a wrap. We hope it was everything you wanted."];
  if (countdown.isToday) return ["It's today. Enjoy every minute."];

  const note = [
    countdown.days === 1
      ? "Tomorrow's the day."
      : countdown.days <= 7
        ? `Only ${countdown.days} days to go.`
        : `${countdown.days} days to go.`,
  ];

  if (overdue > 0) {
    note.push(
      overdue === 1 ? "One task slipped past its date." : `${count(overdue)} tasks slipped past their dates.`,
    );
  } else if (openTasks === 0) {
    note.push("Every task is ticked off.");
  } else if (dueSoon > 0) {
    note.push(dueSoon === 1 ? "One thing is due this week." : `${count(dueSoon)} things are due this week.`);
  } else {
    note.push("Nothing is due this week.");
  }

  if (budget.isOverBudget) {
    note.push(`The budget is ${formatMoney(budget.overBy, currency)} over, so it's worth a look.`);
  } else if (budget.remaining > 0) {
    note.push(`${formatMoney(budget.remaining, currency)} of the budget is still free.`);
  }

  return note;
}
