"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { spring } from "@/lib/motion";

const SECTIONS = [
  { slug: "", label: "Overview" },
  { slug: "plan", label: "Blueprint" },
  { slug: "budget", label: "Budget" },
  { slug: "timeline", label: "Timeline" },
  { slug: "vendors", label: "Vendors" },
  { slug: "inspiration", label: "Inspiration" },
  { slug: "concierge", label: "Concierge" },
] as const;

/** Section navigation pinned under the app bar, on a translucent material. */
export function EventNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/events/${eventId}`;

  return (
    <nav
      aria-label="Celebration sections"
      className="material-bar sticky top-14 z-30 border-b border-[rgb(229_223_212/0.7)]"
    >
      <div className="scrollbar-none mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {SECTIONS.map((section) => {
          const href = section.slug ? `${base}/${section.slug}` : base;
          const active = section.slug ? pathname.startsWith(href) : pathname === base;
          return (
            <Link
              key={section.slug || "overview"}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-2 text-[0.875rem] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="event-nav-indicator"
                  transition={spring.snappy}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
              <span className="relative">{section.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
