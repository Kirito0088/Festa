import { cn } from "cn";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Label + control + hint/error, with the error wired to the control. */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id} className="text-[0.8125rem] font-medium text-foreground">
        {label}
        {optional && <span className="font-normal text-muted-foreground">Optional</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[0.8125rem] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** ARIA props that connect a control to its Field hint or error. */
export function fieldAria(id: string, error?: string, hasHint = false) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const;
}
