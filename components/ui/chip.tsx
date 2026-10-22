"use client";

import { cn } from "cn";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { spring } from "@/lib/motion";

/** A toggleable pill used for multi-select choices. */
export function Chip({
  selected,
  onToggle,
  children,
  className,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[0.875rem] transition-[background-color,border-color,color,transform] duration-150 select-none active:scale-[0.97] motion-reduce:active:scale-100",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-[#cfc6b6]",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={spring.snappy}
            className="inline-flex overflow-hidden"
          >
            <Check className="size-3.5" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
      {children}
    </button>
  );
}

export function ChipGroup({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <Chip
            key={option}
            selected={selected}
            onToggle={() => onChange(selected ? value.filter((v) => v !== option) : [...value, option])}
          >
            {option}
          </Chip>
        );
      })}
    </div>
  );
}
