import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
      <span className="mb-5 grid size-12 place-items-center rounded-full bg-sand-soft text-sand-strong">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="type-title text-2xl">{title}</h3>
      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
