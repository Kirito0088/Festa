"use client";

import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CalendarHeart, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Bunting } from "@/components/ui/bunting";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CountdownStamp } from "@/components/ui/stamp";
import { useToday } from "@/hooks/use-today";
import { inkFromPalette } from "@/lib/color";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { countdownTo, formatIsoDate } from "@/lib/dates";
import { spring } from "@/lib/motion";

export function EventsList() {
  const { isAuthenticated } = useConvexAuth();
  const events = useQuery(api.events.list, isAuthenticated ? {} : "skip");
  const today = useToday();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="type-display text-[2.75rem] sm:text-[3.5rem]">Your celebrations</h1>
        <Button asChild>
          <Link href="/events/new">
            <Plus aria-hidden="true" /> New celebration
          </Link>
        </Button>
      </div>

      {events === undefined ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-80" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={CalendarHeart}
          title="Nothing on the calendar yet"
          description="Tell Festa what you're celebrating and it sketches the first plan with you: a budget, a checklist, vendors to call and ideas to keep."
          action={
            <Button asChild size="lg">
              <Link href="/events/new">Start your first plan</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <motion.li
              key={event._id}
              className="min-w-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.default, delay: Math.min(index, 6) * 0.04 }}
            >
              <InvitationCard event={event} today={today} />
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Each celebration is set like the invitation it will become: centred,
 * strung with bunting in its own palette and postmarked with the countdown.
 */
function InvitationCard({
  event,
  today,
}: {
  event: FunctionReturnType<typeof api.events.list>[number];
  today: string | null;
}) {
  const countdown = today ? countdownTo(event.date, today) : null;
  const place = [event.venue, event.city].filter(Boolean).join(", ");
  const progress = event.taskTotal ? event.taskDone / event.taskTotal : 0;

  return (
    <Link
      href={`/events/${event._id}`}
      className="surface group relative flex h-full flex-col overflow-hidden transition-[box-shadow,transform] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:-rotate-[0.4deg] hover:shadow-[var(--shadow-hairline),var(--shadow-lifted)] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:transform-none"
    >
      {/* The inset rule of a printed card. */}
      <span
        className="pointer-events-none absolute inset-[7px] rounded-[1.05rem] border border-[rgb(38_42_71/0.1)]"
        aria-hidden="true"
      />
      <Bunting colors={event.palette} flags={11} className="-mt-1 px-2" />
      <div className="flex flex-1 flex-col items-center px-7 pt-3 pb-7 text-center">
        <p className="type-eyebrow">
          {EVENT_TYPE_LABELS[event.type]}
          {event.isDemo && <span className="sr-only"> (sample data)</span>}
        </p>
        <h2 className="type-display mt-2 text-[2rem] break-words group-hover:underline group-hover:decoration-[rgb(38_42_71/0.25)] group-hover:decoration-1 group-hover:underline-offset-[6px]">
          {event.name}
        </h2>
        <span className="mt-4 flex items-center gap-2 text-marigold" aria-hidden="true">
          <span className="h-px w-8 bg-current opacity-60" />
          <svg viewBox="0 0 12 12" className="size-2.5">
            <path d="M6 0 7.4 4.6 12 6 7.4 7.4 6 12 4.6 7.4 0 6 4.6 4.6Z" fill="currentColor" />
          </svg>
          <span className="h-px w-8 bg-current opacity-60" />
        </span>
        <p className="mt-4 text-[0.9375rem]">{formatIsoDate(event.date, "invitation")}</p>
        {place && <p className="mt-1 text-[0.875rem] text-muted-foreground">{place}</p>}
        <p className="mt-1 text-[0.875rem] text-muted-foreground">
          {event.guestCount === 1 ? "1 guest" : `${event.guestCount} guests`}
        </p>

        <div className="mt-auto flex w-full items-end gap-4 pt-7 text-left">
          <div className="min-w-0 flex-1">
            <p className="tabular text-[0.8125rem] text-muted-foreground">
              {event.taskDone} of {event.taskTotal} tasks done
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe6dc]">
              <div
                className="h-full rounded-full bg-sage-strong transition-[width] duration-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            {event.isDemo && (
              <Badge variant="secondary" className="mt-3" aria-hidden="true">
                Sample data
              </Badge>
            )}
          </div>
          {countdown && (
            <CountdownStamp
              color={inkFromPalette(event.palette)}
              days={countdown.days}
              isToday={countdown.isToday}
              isPast={countdown.isPast}
              className="-mr-1 -mb-1"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
