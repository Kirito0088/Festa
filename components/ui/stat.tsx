import { cn } from "cn";
import type { ReactNode } from "react";

/** A labelled figure. Numbers use tabular figures so columns align. */
export function Stat({
  label,
  value,
  detail,
  tone = "default",
  className,
  size = "default",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "positive" | "negative" | "muted";
  className?: string;
  size?: "default" | "lg";
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="type-eyebrow">{label}</p>
      <p
        className={cn(
          "tabular mt-1.5 truncate font-medium tracking-[-0.02em]",
          size === "lg" ? "text-[2rem] leading-none" : "text-[1.375rem] leading-tight",
          tone === "positive" && "text-sage-strong",
          tone === "negative" && "text-danger",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
      {detail && <p className="mt-1 text-[0.8125rem] text-muted-foreground">{detail}</p>}
    </div>
  );
}
