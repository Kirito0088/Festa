"use client";

import { useQuery } from "convex/react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowUpRight,
  CalendarCheck2,
  Images,
  MessagesSquare,
  PartyPopper,
  Sparkles,
  Store,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useEventContext } from "@/components/events/event-context";
import { DeadlineChip } from "@/components/timeline/deadline-chip";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { Stat } from "@/components/ui/stat";
import { useToday } from "@/hooks/use-today";
import { summarizeBudget } from "@/lib/budget";
import { RECENT_ACTIVITY_LIMIT, VENDOR_STATUSES, VENDOR_STATUS_LABELS } from "@/lib/constants";
import { countdownTo, formatIsoDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { resolveTasks, upcomingTasks } from "@/lib/tasks";

const ACTIVITY_ICONS: Record<Doc<"activity">["kind"], LucideIcon> = {
  event: PartyPopper,
  plan: Sparkles,
  budget: Wallet,
  task: CalendarCheck2,
  vendor: Store,
  moodboard: Images,
  concierge: MessagesSquare,
};

const VENDOR_COLORS: Record<string, string> = {
  booked: "var(--sage-strong)",
  quoted: "var(--sage)",
  contacted: "var(--sand)",
  researching: "#e6e0d5",
  declined: "var(--blush)",
};

export function Overview() {
  const { event, blueprint } = useEventContext();
  const today = useToday();
  const items = useQuery(api.budget.list, { eventId: event._id });
  const tasks = useQuery(api.tasks.list, { eventId: event._id });
  const vendors = useQuery(api.vendors.list, { eventId: event._id });
  const activity = useQuery(api.activity.recent, { eventId: event._id, limit: RECENT_ACTIVITY_LIMIT });

  const budget = useMemo(() => (items ? summarizeBudget(event.budget, items) : null), [items, event.budget]);
  const resolved = useMemo(
    () => (tasks && today ? resolveTasks(tasks, event.date, today) : null),
    [tasks, event.date, today],
  );

  const base = `/events/${event._id}`;
  const countdown = today ? countdownTo(event.date, today) : null;
  const doneCount = resolved?.filter((task) => task.completed).length ?? 0;
  const overdueCount = resolved?.filter((task) => task.state === "overdue").length ?? 0;
  const upcoming = resolved ? upcomingTasks(resolved, 5) : [];
  const booked = vendors?.filter((vendor) => vendor.status === "booked").length ?? 0;
  const activeVendors = vendors?.filter((vendor) => vendor.status !== "declined") ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Countdown */}
      <Panel className="lg:col-span-5" bodyClassName="flex flex-col">
        <p className="type-eyebrow">Countdown</p>
        {countdown ? (
          <div className="mt-3 flex items-end gap-3">
            <span className="type-display tabular text-[5.5rem] leading-[0.85]">
              {countdown.isPast ? "✓" : countdown.days}
            </span>
            <span className="pb-2 text-[0.9375rem] text-muted-foreground">
              {countdown.isToday
                ? "It's today!"
                : countdown.isPast
                  ? "Celebrated"
                  : countdown.days === 1
                    ? "day to go"
                    : "days to go"}
            </span>
          </div>
        ) : (
          <Skeleton className="mt-3 h-20 w-40" />
        )}
        <p className="mt-3 text-[0.875rem] text-muted-foreground">
          {formatIsoDate(event.date, "weekday")}
          {countdown && !countdown.isPast && countdown.weeks > 1 ? ` · about ${countdown.weeks} weeks` : ""}
        </p>
        {blueprint && (
          <Link
            href={`${base}/plan`}
            className="group mt-auto block rounded-2xl bg-secondary p-4 pt-4 transition-colors hover:bg-[#e9e4da]"
          >
            <p className="type-eyebrow">Concept</p>
            <p className="type-title mt-1.5 text-[1.375rem] group-hover:underline group-hover:underline-offset-4">
              {blueprint.content.concept.title}
            </p>
            {blueprint.content.palette.length > 0 && (
              <div className="mt-3 flex gap-1.5" aria-label="Palette">
                {blueprint.content.palette.map((swatch) => (
                  <span
                    key={swatch.hex}
                    title={swatch.name}
                    className="size-6 rounded-full ring-1 ring-black/5"
                    style={{ background: swatch.hex }}
                  />
                ))}
              </div>
            )}
          </Link>
        )}
      </Panel>

      {/* Budget */}
      <Panel
        className="lg:col-span-7"
        title="Budget"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href={`${base}/budget`}>
              Budget Studio <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        {budget ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProgressRing
              value={budget.utilization}
              tone={budget.isOverBudget ? "danger" : "default"}
              size={140}
              label={`${Math.round(budget.utilization * 100)}% of the budget committed`}
            >
              <span>
                <span className="tabular block text-[1.5rem] font-medium tracking-[-0.02em]">
                  {Math.round(budget.utilization * 100)}%
                </span>
                <span className="text-[0.75rem] text-muted-foreground">committed</span>
              </span>
            </ProgressRing>
            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-5">
              <Stat label="Total budget" value={formatMoney(budget.total, event.currency)} />
              <Stat
                label="Remaining"
                value={formatMoney(budget.remaining, event.currency)}
                tone={budget.isOverBudget ? "negative" : "positive"}
              />
              <Stat label="Estimated" value={formatMoney(budget.estimated, event.currency)} />
              <Stat label="Actual so far" value={formatMoney(budget.actual, event.currency)} />
            </div>
          </div>
        ) : (
          <Skeleton className="h-36" />
        )}
        {budget?.isOverBudget && (
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-[0.8125rem] text-danger">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            Over budget by {formatMoney(budget.overBy, event.currency)}. Ask the concierge to rebalance.
          </p>
        )}
      </Panel>

      {/* Task progress */}
      <Panel className="lg:col-span-4" title="Checklist">
        {resolved ? (
          <div>
            <p className="tabular text-[2.25rem] leading-none font-medium tracking-[-0.03em]">
              {doneCount}
              <span className="text-[1.25rem] text-muted-foreground">/{resolved.length}</span>
            </p>
            <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">tasks complete</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#ebe6dc]">
              <div
                className="h-full rounded-full bg-sage-strong transition-[width] duration-700 ease-[var(--ease-out-soft)]"
                style={{ width: `${resolved.length ? (doneCount / resolved.length) * 100 : 0}%` }}
              />
            </div>
            <p className={`mt-4 text-[0.8125rem] ${overdueCount ? "text-danger" : "text-muted-foreground"}`}>
              {overdueCount ? `${overdueCount} overdue` : "Nothing overdue"}
            </p>
          </div>
        ) : (
          <Skeleton className="h-32" />
        )}
      </Panel>

      {/* Upcoming deadlines */}
      <Panel
        className="lg:col-span-8"
        title="Upcoming deadlines"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href={`${base}/timeline`}>
              Timeline <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        {!resolved || !today ? (
          <Skeleton className="h-40" />
        ) : upcoming.length === 0 ? (
          <p className="text-[0.875rem] text-muted-foreground">
            {resolved.length
              ? "Every dated task is done. Lovely."
              : "No tasks yet. Add some in the timeline."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map((task) => (
              <li
                key={task._id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 truncate text-[0.9375rem]">{task.title}</span>
                <DeadlineChip due={task.due} state={task.state} today={today} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Vendors */}
      <Panel
        className="lg:col-span-5"
        title="Vendor bookings"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href={`${base}/vendors`}>
              Vendors <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        {vendors === undefined ? (
          <Skeleton className="h-28" />
        ) : vendors.length === 0 ? (
          <p className="text-[0.875rem] text-muted-foreground">
            No vendors yet. Add the ones you&rsquo;re talking to and track quotes side by side.
          </p>
        ) : (
          <div>
            <p className="tabular text-[2.25rem] leading-none font-medium tracking-[-0.03em]">
              {booked}
              <span className="text-[1.25rem] text-muted-foreground">/{activeVendors.length}</span>
            </p>
            <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">vendors booked</p>
            <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[#ebe6dc]" aria-hidden="true">
              {VENDOR_STATUSES.map((status) => {
                const count = vendors.filter((vendor) => vendor.status === status).length;
                return count ? (
                  <span
                    key={status}
                    style={{ width: `${(count / vendors.length) * 100}%`, background: VENDOR_COLORS[status] }}
                  />
                ) : null;
              })}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.75rem] text-muted-foreground">
              {VENDOR_STATUSES.map((status) => {
                const count = vendors.filter((vendor) => vendor.status === status).length;
                return count ? (
                  <li key={status} className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: VENDOR_COLORS[status] }} />
                    {VENDOR_STATUS_LABELS[status]} {count}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </Panel>

      {/* Activity */}
      <Panel className="lg:col-span-7" title="Recent activity">
        {activity === undefined ? (
          <Skeleton className="h-40" />
        ) : activity.length === 0 ? (
          <p className="text-[0.875rem] text-muted-foreground">Changes you make will appear here.</p>
        ) : (
          <ul className="grid gap-3.5">
            {activity.map((entry) => {
              const Icon = ACTIVITY_ICONS[entry.kind];
              return (
                <li key={entry._id} className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 pt-1 text-[0.875rem] leading-snug">{entry.message}</span>
                  <time
                    className="shrink-0 pt-1 text-[0.75rem] text-muted-foreground"
                    dateTime={new Date(entry._creationTime).toISOString()}
                  >
                    {formatDistanceToNowStrict(entry._creationTime, { addSuffix: true })}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
