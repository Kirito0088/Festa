"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId } from "react";
import { spring } from "@/lib/motion";

export type SegmentedOption<T extends string> = { value: T; label: string };

/**
 * An iOS-style segmented control. The selection indicator slides with a
 * critically damped spring and is fully keyboard accessible (radio group).
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "default",
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  label: string;
  className?: string;
  size?: "default" | "sm";
}) {
  const layoutId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-full bg-[#ebe6dc] p-1", className)}
      onKeyDown={(event) => {
        const index = options.findIndex((option) => option.value === value);
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          onChange(options[(index + 1) % options.length].value);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          onChange(options[(index - 1 + options.length) % options.length].value);
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 cursor-pointer rounded-full font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              size === "sm" ? "h-7 px-3 text-xs" : "h-8 px-4 text-[0.8125rem]",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={spring.snappy}
                className="absolute inset-0 rounded-full bg-card shadow-[0_1px_3px_rgb(32_33_31/0.12)]"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
