import { cn } from "cn";
import type { ReactNode } from "react";

/** The standard content surface: a quiet card with an optional header. */
export function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
  as: Tag = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={cn("surface flex min-w-0 flex-col p-5 sm:p-6", className)}>
      {(title || action) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-[0.9375rem] font-medium tracking-[-0.01em]">{title}</h2>}
            {description && <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </Tag>
  );
}
