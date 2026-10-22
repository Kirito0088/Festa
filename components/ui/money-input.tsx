import { cn } from "cn";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { currencySymbol } from "@/lib/money";

/** A numeric input with the currency symbol as a leading adornment. */
export function MoneyInput({
  currency,
  className,
  ...props
}: ComponentProps<"input"> & { currency: string }) {
  const symbol = currencySymbol(currency);
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.875rem] text-muted-foreground"
        aria-hidden="true"
      >
        {symbol}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        className={cn("tabular", symbol.length > 1 ? "pl-11" : "pl-8", className)}
        {...props}
      />
    </div>
  );
}

/** react-hook-form `setValueAs` for optional money: empty → null. */
export function optionalNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

/** react-hook-form `setValueAs` for required money: empty → NaN (fails validation). */
export function requiredNumber(value: unknown): number {
  if (value === "" || value === null || value === undefined) return Number.NaN;
  return Number(value);
}
