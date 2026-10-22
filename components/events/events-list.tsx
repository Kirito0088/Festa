"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { CalendarHeart, MapPin, Plus, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToday } from "@/hooks/use-today";
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
        <div>
          <p className="type-eyebrow">Your celebrations</p>
          <h1 className="type-display mt-2 text-[2.75rem] sm:text-[3.5rem]">Celebrations</h1>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus aria-hidden="true" /> New celebration
          </Link>
        </Button>
      </div>

      {events === undefined ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-64" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={CalendarHeart}
          title="Nothing planned yet"
          description="Answer a few questions and Festa will draft a full plan: budget, timeline, vendors and ideas."
          action={
            <Button asChild size="lg">
              <Link href="/events/new">Plan your first celebration</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => {
            const countdown = today ? countdownTo(event.date, today) : null;
            const progress = event.taskTotal ? event.taskDone / event.taskTotal : 0;
            return (
              <motion.li
                key={event._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.default, delay: Math.min(index, 6) * 0.04 }}
              >
                <Link
                  href={`/events/${event._id}`}
                  className="surface group flex h-full flex-col overflow-hidden transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hairline),var(--shadow-lifted)] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:translate-y-0"
                >
                  <div className="flex h-3" aria-hidden="true">
                    {(event.palette.length ? event.palette : ["#D9C8AD", "#E9C7C3", "#A7B5A0"]).map(
                      (hex, i) => (
                        <span key={`${hex}-${i}`} className="flex-1" style={{ background: hex }} />
                      ),
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between gap-2">
                      <p className="type-eyebrow">{EVENT_TYPE_LABELS[event.type]}</p>
                      {event.isDemo && <Badge variant="secondary">Sample data</Badge>}
                    </div>
                    <h2 className="type-title mt-3 text-[1.75rem] group-hover:underline group-hover:decoration-border group-hover:underline-offset-4">
                      {event.name}
                    </h2>
                    {event.conceptTitle && (
                      <p className="mt-1 line-clamp-1 text-[0.875rem] text-muted-foreground">
                        {event.conceptTitle}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.8125rem] text-muted-foreground">
                      <span>{formatIsoDate(event.date, "weekday")}</span>
                      {event.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {event.city}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden="true" />
                        {event.guestCount}
                      </span>
                    </div>
                    <div className="mt-auto pt-6">
                      <div className="flex items-baseline justify-between text-[0.8125rem]">
                        <span className="font-medium">
                          {countdown === null
                            ? " "
                            : countdown.isToday
                              ? "Today"
                              : countdown.isPast
                                ? "Celebrated"
                                : `${countdown.days} days to go`}
                        </span>
                        <span className="tabular text-muted-foreground">
                          {event.taskDone}/{event.taskTotal} tasks
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe6dc]">
                        <div
                          className="h-full rounded-full bg-sage-strong transition-[width] duration-500"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
