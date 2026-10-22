import { cn } from "cn";

/** Wordmark: a serif "Festa" with a small sage-and-blush mark. */
export function FestaLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <svg viewBox="0 0 28 28" aria-hidden="true" className="size-7 shrink-0">
        <circle cx="11" cy="15" r="8" fill="var(--sage)" />
        <circle cx="18" cy="11" r="6.5" fill="var(--blush)" fillOpacity="0.9" />
        <circle cx="18.5" cy="19.5" r="3" fill="var(--sand)" />
      </svg>
      {!compact && <span className="type-title text-[1.6rem] leading-none tracking-[-0.02em]">Festa</span>}
      <span className="sr-only">Festa</span>
    </span>
  );
}
