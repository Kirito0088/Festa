"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { spring } from "@/lib/motion";

/** A circular progress indicator. `value` is 0–1 and may exceed 1. */
export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  tone = "default",
  label,
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "default" | "danger" | "sage";
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const color =
    tone === "danger" ? "var(--danger)" : tone === "sage" ? "var(--sage-strong)" : "var(--charcoal)";

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ebe6dc" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ ...spring.default, duration: 0.8 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
