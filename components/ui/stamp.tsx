import { cn } from "cn";
import type { ReactNode } from "react";

/**
 * A round rubber-stamp mark, slightly askew, inked in `color`. Pass a colour
 * that reaches 4.5:1 on the card (see `inkFromPalette`).
 */
export function Stamp({
  color,
  children,
  className,
}: {
  color: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-[5.25rem] shrink-0 -rotate-[8deg] place-items-center rounded-full border-2 border-current text-center leading-none",
        // Inner ring, like the double border of a postmark.
        "shadow-[inset_0_0_0_3px_var(--card),inset_0_0_0_4px_currentColor]",
        className,
      )}
      style={{ color }}
    >
      <span className="flex flex-col items-center gap-0.5 px-2">{children}</span>
    </span>
  );
}

/** Countdown copy for a stamp: a big number over a short line. */
export function CountdownStamp({
  color,
  days,
  isToday,
  isPast,
  size = "md",
  className,
}: {
  color: string;
  days: number;
  isToday: boolean;
  isPast: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const small = size === "sm";
  return (
    <Stamp color={color} className={cn(small && "size-[4.25rem]", className)}>
      {isToday ? (
        <span className="type-title text-[1.375rem]">Today!</span>
      ) : isPast ? (
        <span className="type-title text-[1.125rem] italic">Celebrated</span>
      ) : (
        <>
          <span className={cn("type-display tabular", small ? "text-[1.375rem]" : "text-[1.75rem]")}>
            {days}
          </span>
          <span className={cn("font-medium", small ? "text-[0.625rem]" : "text-[0.6875rem]")}>
            {days === 1 ? "day to go" : "days to go"}
          </span>
        </>
      )}
    </Stamp>
  );
}
