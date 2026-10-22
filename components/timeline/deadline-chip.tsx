import { cn } from "cn";
import { formatIsoDate, relativeDayLabel, type DeadlineState } from "@/lib/dates";

const TONE: Record<DeadlineState, string> = {
  done: "bg-sage-soft text-sage-strong",
  overdue: "bg-danger-soft text-danger",
  today: "bg-[#f5e7cf] text-warning",
  soon: "bg-[#f5e7cf] text-warning",
  upcoming: "bg-secondary text-muted-foreground",
  none: "bg-secondary text-muted-foreground",
};

export function DeadlineChip({
  due,
  state,
  today,
  className,
}: {
  due: string | null;
  state: DeadlineState;
  today: string;
  className?: string;
}) {
  const text =
    due === null
      ? "No deadline"
      : state === "overdue"
        ? `Overdue · ${formatIsoDate(due, "short")}`
        : state === "today" || state === "soon"
          ? relativeDayLabel(due, today)
          : formatIsoDate(due, "short");
  return (
    <span
      className={cn(
        "tabular inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[0.75rem] font-medium whitespace-nowrap",
        TONE[state],
        className,
      )}
    >
      {text}
    </span>
  );
}
