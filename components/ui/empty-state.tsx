"use client";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

/** A loose, overshooting loop, the way someone circles a thing on paper. */
const LOOP = "M52 7C79 6 95 27 93 51C91 77 70 94 46 93C21 92 6 72 8 48C10 24 30 8 57 9C66 9 73 13 78 18";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#d9d1c3] px-6 py-14 text-center",
        className,
      )}
    >
      <CircledIcon icon={Icon} className="mb-5" />
      <h3 className="type-title text-2xl">{title}</h3>
      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** An icon circled in marigold by hand; the loop draws itself once. */
export function CircledIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn("relative grid size-16 place-items-center text-marigold-strong", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full text-marigold" aria-hidden="true">
        <motion.path
          d={LOOP}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
        />
      </svg>
      <Icon className="relative size-6" strokeWidth={1.6} aria-hidden="true" />
    </span>
  );
}
